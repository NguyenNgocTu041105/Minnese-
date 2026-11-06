"""
Unit tests for HSK question generator:
- Mock retry loop (≤3 attempts) on forced invalid outputs
- Error reporting when Ollama is offline / unreachable
- Pluggable provider abstraction & model chain fallback
- Provider switching via HSK_LLM_PROVIDER
- Syllabus vocabulary management
"""

import json
import os
import sys
from unittest.mock import MagicMock, patch
import pytest
import requests

# Ensure workspace root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from hsk_generator import (
    GenerationError,
    LLMProvider,
    OllamaConnectionError,
    OllamaProvider,
    OpenAICompatProvider,
    SyllabusVocabManager,
    generate_listening_image,
    generate_listening_text,
    generate_reading,
    generate_writing,
    get_default_provider,
    get_target_vocab,
)


# ============================================================================
# 1. Retry Loop & Self-Correction Tests
# ============================================================================

def test_retry_loop_succeeds_on_third_attempt():
    """
    Verify retry loop retries up to 3 times:
    Attempt 1: Invalid (missing blank '______')
    Attempt 2: Invalid (duplicate options)
    Attempt 3: Valid question
    """
    call_count = 0

    def mock_llm_caller(prompt: str, model: str = None) -> str:
        nonlocal call_count
        call_count += 1

        if call_count == 1:
            # Attempt 1: missing blank
            bad_data_1 = {
                "question": "面对工作压力，我们要学会调节心态，缓解焦虑情绪。",  # Missing ______
                "options": {"A": "缓解", "B": "减轻", "C": "消除", "D": "减少"},
                "answer": "A",
                "explanation_zh": "解析中文",
                "explanation_vi": "Giải thích tiếng Việt",
                "trap_analysis_vi": "Phân tích bẫy tiếng Việt",
            }
            return json.dumps(bad_data_1)

        elif call_count == 2:
            # Attempt 2: duplicate options
            bad_data_2 = {
                "question": "面对工作压力，我们要学会自我调节，方能______内心的焦虑。",
                "options": {"A": "缓解", "B": "缓解", "C": "消除", "D": "减少"},  # Duplicate '缓解'
                "answer": "A",
                "explanation_zh": "解析中文",
                "explanation_vi": "Giải thích tiếng Việt",
                "trap_analysis_vi": "Phân tích bẫy tiếng Việt",
            }
            return json.dumps(bad_data_2)

        else:
            # Attempt 3: completely valid
            good_data = {
                "question": "面对工作压力，我们要学会自我调节，方能______内心的焦虑。",
                "options": {"A": "缓解", "B": "减轻", "C": "消除", "D": "减少"},
                "answer": "A",
                "explanation_zh": "“缓解”通常与“压力”、“焦虑”等搭配，表示程度上的减轻或缓和。",
                "explanation_vi": "'缓解' (huǎnjiě) thường đi kèm với '压力' (áp lực), '焦虑' (lo âu).",
                "trap_analysis_vi": "'消除' mang tính triệt để không khả thi với áp lực tâm lý; '减少' dùng cho số lượng.",
            }
            return json.dumps(good_data)

    result = generate_reading(level=5, target_vocab="缓解", llm_caller=mock_llm_caller)

    assert call_count == 3, f"Expected 3 attempts, got {call_count}"
    assert result["target_word"] == "缓解"
    assert result["answer"] == "A"
    assert "______" in result["question"]
    assert "______" in result["pinyin"]
    assert "huǎnjiě" not in result["pinyin"]  # Target word masked in pinyin


def test_retry_loop_raises_generation_error_after_3_failures():
    """Verify that after 3 failed attempts, GenerationError is raised with diagnostic failure history."""
    call_count = 0

    def mock_llm_always_invalid(prompt: str, model: str = None) -> str:
        nonlocal call_count
        call_count += 1
        # Always return missing blank
        return json.dumps({
            "question": "没有下划线空格的句子。",
            "options": {"A": "缓解", "B": "减轻", "C": "消除", "D": "减少"},
            "answer": "A",
            "explanation_zh": "解析",
            "explanation_vi": "Giải thích",
            "trap_analysis_vi": "Bẫy",
        })

    with pytest.raises(GenerationError) as exc_info:
        generate_reading(level=5, target_vocab="缓解", llm_caller=mock_llm_always_invalid)

    assert call_count == 3
    assert "after 3 attempts" in str(exc_info.value).lower()
    assert "failure history" in str(exc_info.value).lower()


# ============================================================================
# 2. Offline Ollama Error Reporting Tests
# ============================================================================

def test_ollama_offline_raises_ollama_connection_error():
    """Verify clear error reporting when Ollama server is offline (no faked/hallucinated output)."""
    with patch("requests.post") as mock_post:
        mock_post.side_effect = requests.exceptions.ConnectionError("Connection refused to http://localhost:11434")

        provider = OllamaProvider(base_url="http://localhost:11434", model_chain=["qwen2.5:7b"])
        with pytest.raises(OllamaConnectionError) as exc_info:
            provider.complete_json("prompt test")

        err_str = str(exc_info.value)
        assert "connection error" in err_str.lower() or "failed on ollama" in err_str.lower()


def test_generate_reading_propagates_offline_error_without_faking():
    """Verify generator functions do not silently fake responses when provider is offline."""
    offline_provider = OllamaProvider(base_url="http://127.0.0.1:9999", model_chain=["qwen2.5:7b"], timeout=1)

    with pytest.raises(OllamaConnectionError):
        generate_reading(level=5, target_vocab="缓解", llm_caller=offline_provider)


# ============================================================================
# 3. Model Chain Fallback Tests
# ============================================================================

def test_provider_model_chain_fallback_on_404_or_503():
    """
    Verify OllamaProvider model chain fallback:
    Model A ('qwen2.5:14b') returns 404 (not installed) ->
    Model B ('qwen2.5:7b') succeeds.
    """
    provider = OllamaProvider(
        base_url="http://localhost:11434",
        model_chain=["qwen2.5:14b", "qwen2.5:7b"],
    )

    resp_404 = MagicMock()
    resp_404.status_code = 404

    resp_200 = MagicMock()
    resp_200.status_code = 200
    resp_200.json.return_value = {"response": '{"status": "ok_from_7b"}'}

    with patch("requests.post", side_effect=[resp_404, resp_200]) as mock_post:
        result = provider.complete_json("test prompt")
        assert mock_post.call_count == 2
        # First call used qwen2.5:14b
        assert mock_post.call_args_list[0][1]["json"]["model"] == "qwen2.5:14b"
        # Second call used qwen2.5:7b
        assert mock_post.call_args_list[1][1]["json"]["model"] == "qwen2.5:7b"
        assert '{"status": "ok_from_7b"}' in result


# ============================================================================
# 4. Provider Switching via Environment Variable Tests
# ============================================================================

def test_provider_switching_via_hsk_llm_provider_env(monkeypatch):
    """Verify switching between 'ollama' and 'openai' via HSK_LLM_PROVIDER with zero code change."""
    # Test OpenAI provider selection
    monkeypatch.setenv("HSK_LLM_PROVIDER", "openai")
    provider = get_default_provider()
    assert isinstance(provider, OpenAICompatProvider)

    # Test Ollama provider selection
    monkeypatch.setenv("HSK_LLM_PROVIDER", "ollama")
    provider = get_default_provider()
    assert isinstance(provider, OllamaProvider)


def test_openai_compat_provider_execution():
    """Verify OpenAICompatProvider completes request with json_object response format."""
    provider = OpenAICompatProvider(
        base_url="https://api.fake-openai.com/v1",
        api_key="sk-fake-test-key-never-logged",
        model_chain=["gpt-4o-mini"],
    )

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "choices": [
            {
                "message": {
                    "content": '{"result": "openai_compat_success"}'
                }
            }
        ]
    }

    with patch("requests.post", return_value=mock_resp) as mock_post:
        res = provider.complete_json("test prompt")
        assert '{"result": "openai_compat_success"}' in res
        called_payload = mock_post.call_args[1]["json"]
        assert called_payload["response_format"] == {"type": "json_object"}
        assert called_payload["model"] == "gpt-4o-mini"


# ============================================================================
# 5. Hybrid Vocabulary Selector Tests
# ============================================================================

def test_syllabus_vocab_manager_loads_5400_words():
    """Verify SyllabusVocabManager loads words across HSK 1–6 with >= 5,000 distinct items."""
    manager = SyllabusVocabManager()
    manager.load()

    total_words = 0
    for lvl in range(1, 7):
        words = manager.get_words_for_level(lvl)
        assert len(words) > 0, f"Level {lvl} has 0 vocabulary words"
        total_words += len(words)

    # Must have 5,400 words (or close depending on deduplication)
    assert total_words >= 5000, f"Expected at least 5000 words, got {total_words}"


def test_get_target_vocab_hybrid_behavior():
    """Verify get_target_vocab respects user-specified word or selects genuine syllabus word."""
    # 1. User-supplied target word must be respected
    assert get_target_vocab(5, "缓解") == "缓解"
    assert get_target_vocab(5, "推辞") == "推辞"

    # 2. None target word selects a genuine word from the level
    auto_word_lvl2 = get_target_vocab(2, None)
    assert isinstance(auto_word_lvl2, str) and len(auto_word_lvl2) >= 1
    # Check that it exists in level 2 syllabus
    manager = SyllabusVocabManager()
    lvl2_words = manager.get_words_for_level(2)
    assert auto_word_lvl2 in lvl2_words


if __name__ == "__main__":
    import sys
    sys.exit(pytest.main(["-v", __file__]))
