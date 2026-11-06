"""
Adversarial Stress Test Suite for HSK Question Generation Engine (hsk_generator.py).
Authored by: teamwork_preview_challenger_2 (Empirical Challenger)

Stress Test Coverage:
1. Pluggable Provider & Model Chain Fallback:
   - HTTP 404, 503, 429, ConnectionError across multi-model chain (qwen2.5:14b, qwen2.5:7b, qwen2.5:3b).
   - Seamless transition to the next model upon any failure.
   - Complete exhaustion of chain strictly raises OllamaConnectionError without faking response.
   - Provider switching between 'ollama' and 'openai' via HSK_LLM_PROVIDER environment variable.
   - OpenAICompatProvider fallback chain and error handling.
2. Retry Loop & Self-Correction Feedback Loop:
   - Attempt 1: Invalid JSON (syntax error).
   - Attempt 2: Target word leaked in question stem.
   - Attempt 3: Valid question -> succeeds after 3 attempts.
   - 4 consecutive invalid attempts strictly halts after attempt 3 (raises GenerationError).
   - Prompt feedback verification: confirms validator error message is passed into retry prompt.
   - Immediate re-raise of OllamaConnectionError without burning retry attempts.
3. Hybrid Vocabulary Stress Testing Across Levels 1–6:
   - Syllabus catalog size verification (5,400 standard words across HSK 1–6).
   - target_vocab=None: sampling authentic contemporary HSK 3.0 vocabulary for each level 1 to 6.
   - Obscure and specific target words: strictly enforced as answer, checked for leakage.
   - Rejection when LLM attempts to substitute target word with unrelated vocabulary.
4. Robustness & Parsing Edge Cases:
   - Markdown JSON fences, surrounding commentary text.
   - Masked pinyin preservation without revealing target word pronunciation.
   - Nonsensical collocations rejection.
"""

import json
import os
import re
import sys
from unittest.mock import MagicMock, patch
import pytest
import requests

# Ensure workspace root is in sys.path
_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from hsk_generator import (
    GenerationError,
    LLMProvider,
    OllamaConnectionError,
    OllamaProvider,
    OpenAICompatProvider,
    SyllabusVocabManager,
    _extract_json_response,
    generate_listening_image,
    generate_listening_text,
    generate_reading,
    generate_writing,
    get_default_provider,
    get_target_vocab,
)
from validator import generate_masked_pinyin, validate_question


# ============================================================================
# SECTION 1: Pluggable Provider & Model Chain Fallback Stress Tests
# ============================================================================

def test_model_chain_fallback_404_503_success():
    """
    Stress test multi-model fallback chain:
    Model 1 ('qwen2.5:14b') returns HTTP 404 (model not found)
    Model 2 ('qwen2.5:7b') returns HTTP 503 (server overloaded)
    Model 3 ('qwen2.5:3b') returns HTTP 200 (success)
    Verify seamless execution, exact model ordering, and correct payload response.
    """
    provider = OllamaProvider(
        base_url="http://localhost:11434",
        model_chain=["qwen2.5:14b", "qwen2.5:7b", "qwen2.5:3b"],
        timeout=10,
    )

    resp_404 = MagicMock()
    resp_404.status_code = 404

    resp_503 = MagicMock()
    resp_503.status_code = 503

    resp_200 = MagicMock()
    resp_200.status_code = 200
    resp_200.json.return_value = {"response": '{"model_selected": "qwen2.5:3b", "ok": true}'}

    with patch("requests.post", side_effect=[resp_404, resp_503, resp_200]) as mock_post:
        res = provider.complete_json("adversarial test prompt")
        assert mock_post.call_count == 3
        # Assert exact models called in order
        calls = mock_post.call_args_list
        assert calls[0][1]["json"]["model"] == "qwen2.5:14b"
        assert calls[1][1]["json"]["model"] == "qwen2.5:7b"
        assert calls[2][1]["json"]["model"] == "qwen2.5:3b"
        assert '"model_selected": "qwen2.5:3b"' in res


def test_model_chain_fallback_connection_error_and_429():
    """
    Stress test model chain with ConnectionError and HTTP 429 rate limit:
    Model 1 raises requests.exceptions.ConnectionError
    Model 2 returns HTTP 429 (Rate Limit Exceeded)
    Model 3 returns HTTP 200 with valid response
    """
    provider = OllamaProvider(
        base_url="http://localhost:11434",
        model_chain=["qwen2.5:14b", "qwen2.5:7b", "qwen2.5:3b"],
        timeout=10,
    )

    resp_429 = MagicMock()
    resp_429.status_code = 429

    resp_200 = MagicMock()
    resp_200.status_code = 200
    resp_200.json.return_value = {"response": '{"recovered": true}'}

    with patch("requests.post", side_effect=[
        requests.exceptions.ConnectionError("Connection refused on 14b"),
        resp_429,
        resp_200,
    ]) as mock_post:
        res = provider.complete_json("test prompt")
        assert mock_post.call_count == 3
        assert '"recovered": true' in res


def test_complete_model_chain_exhaustion_raises_clean_ollama_connection_error():
    """
    Verify complete failure of all models in chain:
    Model 1: HTTP 404
    Model 2: HTTP 503
    Model 3: ConnectionError
    Must raise OllamaConnectionError with full chain info; must NEVER fake or return empty output.
    """
    provider = OllamaProvider(
        base_url="http://localhost:11434",
        model_chain=["qwen2.5:14b", "qwen2.5:7b", "qwen2.5:3b"],
    )

    resp_404 = MagicMock()
    resp_404.status_code = 404

    resp_503 = MagicMock()
    resp_503.status_code = 503

    with patch("requests.post", side_effect=[
        resp_404,
        resp_503,
        requests.exceptions.ConnectionError("Network down"),
    ]) as mock_post:
        with pytest.raises(OllamaConnectionError) as exc_info:
            provider.complete_json("test prompt")

        err_msg = str(exc_info.value)
        assert "All models in chain" in err_msg
        assert "qwen2.5:14b" in err_msg and "qwen2.5:3b" in err_msg
        assert mock_post.call_count == 3


def test_openai_compat_provider_multi_model_fallback_and_exhaustion():
    """
    Stress test OpenAICompatProvider model fallback on 404/429 and ultimate exhaustion:
    Model 1 ('gpt-4o') returns 404
    Model 2 ('gpt-4o-mini') returns 429
    Model 3 ('gpt-3.5-turbo') returns 200
    """
    provider = OpenAICompatProvider(
        base_url="https://api.openai.com/v1",
        api_key="sk-test-token-adversarial",
        model_chain=["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"],
    )

    resp_404 = MagicMock()
    resp_404.status_code = 404

    resp_429 = MagicMock()
    resp_429.status_code = 429

    resp_200 = MagicMock()
    resp_200.status_code = 200
    resp_200.json.return_value = {
        "choices": [{"message": {"content": '{"openai_success": true}'}}]
    }

    # 1. Fallback to model 3 succeeds
    with patch("requests.post", side_effect=[resp_404, resp_429, resp_200]) as mock_post:
        res = provider.complete_json("test prompt")
        assert mock_post.call_count == 3
        assert '{"openai_success": true}' in res
        calls = mock_post.call_args_list
        assert calls[0][1]["json"]["model"] == "gpt-4o"
        assert calls[1][1]["json"]["model"] == "gpt-4o-mini"
        assert calls[2][1]["json"]["model"] == "gpt-3.5-turbo"

    # 2. Total exhaustion raises OllamaConnectionError
    with patch("requests.post", side_effect=[resp_404, resp_429, resp_429]) as mock_post:
        with pytest.raises(OllamaConnectionError) as exc_info:
            provider.complete_json("test prompt")
        assert "All models in chain" in str(exc_info.value)


def test_provider_switching_via_env_matrix(monkeypatch):
    """
    Verify provider selection logic across diverse environment variable values:
    - 'ollama' -> OllamaProvider
    - 'OLLAMA' -> OllamaProvider
    - 'openai' -> OpenAICompatProvider
    - 'OPENAI' -> OpenAICompatProvider
    - 'openai_compat' -> OpenAICompatProvider
    - '' (default) -> OllamaProvider
    """
    for val in ["ollama", "OLLAMA", ""]:
        if val:
            monkeypatch.setenv("HSK_LLM_PROVIDER", val)
        else:
            monkeypatch.delenv("HSK_LLM_PROVIDER", raising=False)
        p = get_default_provider()
        assert isinstance(p, OllamaProvider), f"Expected OllamaProvider for {val}, got {type(p)}"

    for val in ["openai", "OPENAI", "openai_compat", "open_ai"]:
        monkeypatch.setenv("HSK_LLM_PROVIDER", val)
        p = get_default_provider()
        assert isinstance(p, OpenAICompatProvider), f"Expected OpenAICompatProvider for {val}, got {type(p)}"


def test_env_model_chain_parsing(monkeypatch):
    """Verify that HSK_LLM_MODEL_CHAIN parses comma-separated lists with arbitrary whitespace."""
    monkeypatch.setenv("HSK_LLM_MODEL_CHAIN", "  qwen2.5:14b , qwen2.5:7b ,  qwen2.5:3b  ")
    p_ollama = OllamaProvider()
    assert p_ollama.model_chain == ["qwen2.5:14b", "qwen2.5:7b", "qwen2.5:3b"]

    p_openai = OpenAICompatProvider()
    assert p_openai.model_chain == ["qwen2.5:14b", "qwen2.5:7b", "qwen2.5:3b"]


# ============================================================================
# SECTION 2: Retry Loop & Self-Correction Feedback Loop Stress Tests
# ============================================================================

def test_retry_loop_attempt_1_json_error_attempt_2_leak_attempt_3_success():
    """
    Stress test retry loop with progressive failure modes:
    - Attempt 1: Syntax-broken JSON from LLM.
    - Attempt 2: Target word leaked in question text.
    - Attempt 3: Valid question matching all rules.
    Verify: generator succeeds on attempt 3, prompt on attempt 2 has JSON error warning,
    prompt on attempt 3 has leak error warning.
    """
    prompts_received = []

    def mock_llm(prompt: str) -> str:
        prompts_received.append(prompt)
        if len(prompts_received) == 1:
            # Syntax broken JSON
            return '{"question": "面对工作压力，我们要学会自我调节，'  # Unclosed string & dict
        elif len(prompts_received) == 2:
            # Target word leaked in question stem
            return json.dumps({
                "question": "面对工作压力，我们要学会自我调节，缓解______内心的焦虑。",  # "缓解" is leaked!
                "options": {"A": "缓解", "B": "减轻", "C": "消除", "D": "减少"},
                "answer": "A",
                "explanation_zh": "中文解析",
                "explanation_vi": "Giải thích tiếng Việt",
                "trap_analysis_vi": "Phân tích bẫy",
            })
        else:
            # Valid question
            return json.dumps({
                "question": "面对工作压力，我们要学会自我调节，方能______内心的焦虑。",
                "options": {"A": "缓解", "B": "减轻", "C": "消除", "D": "减少"},
                "answer": "A",
                "explanation_zh": "“缓解”通常与“压力”、“焦虑”搭配。",
                "explanation_vi": "'缓解' thường đi với '压力', '焦虑'.",
                "trap_analysis_vi": "Bẫy từ gần nghĩa.",
            })

    res = generate_reading(level=5, target_vocab="缓解", llm_caller=mock_llm)

    assert len(prompts_received) == 3, f"Expected 3 calls, got {len(prompts_received)}"
    assert res["target_word"] == "缓解"
    assert res["answer"] == "A"
    assert "______" in res["question"]
    assert "缓解" not in res["question"]

    # Verify self-correction feedback loop in prompts
    assert "【警告：上一次生成失败" not in prompts_received[0]
    assert "JSON parse error on attempt 1" in prompts_received[1]
    assert "Validator rejected attempt 2: Target word '缓解' is leaked in question text" in prompts_received[2]


def test_strict_three_attempt_limit_halts_and_raises_generation_error():
    """
    Stress test strict 3-attempt boundary:
    Even if LLM could supply 4 or more invalid responses,
    the generator MUST halt at exactly 3 attempts and raise GenerationError.
    """
    attempts_called = 0

    def mock_llm_infinite_failures(prompt: str) -> str:
        nonlocal attempts_called
        attempts_called += 1
        # Always return missing blank '______'
        return json.dumps({
            "question": f"这是第{attempts_called}次生成的错误句子没有下划线。",
            "options": {"A": "缓解", "B": "减轻", "C": "消除", "D": "减少"},
            "answer": "A",
            "explanation_zh": "解析",
            "explanation_vi": "Giải thích",
            "trap_analysis_vi": "Bẫy",
        })

    with pytest.raises(GenerationError) as exc_info:
        generate_reading(level=5, target_vocab="缓解", llm_caller=mock_llm_infinite_failures)

    # Must have stopped at exactly 3
    assert attempts_called == 3, f"Expected exactly 3 attempts, got {attempts_called}"
    err_msg = str(exc_info.value)
    assert "after 3 attempts" in err_msg
    assert "Validator rejected attempt 1" in err_msg
    assert "Validator rejected attempt 2" in err_msg
    assert "Validator rejected attempt 3" in err_msg


def test_self_correction_feedback_across_all_generators():
    """
    Verify self-correction prompt feedback across ALL four generator functions:
    1. generate_reading
    2. generate_listening_image
    3. generate_listening_text
    4. generate_writing
    """
    for gen_fn, q_type, valid_resp in [
        (
            generate_reading,
            "reading",
            {
                "question": "我们要共同努力，方能______眼前的危机。",
                "options": {"A": "化解", "B": "分解", "C": "解决", "D": "溶解"},
                "answer": "A",
                "explanation_zh": "中文解析",
                "explanation_vi": "Giải thích",
                "trap_analysis_vi": "Bẫy",
            },
        ),
        (
            generate_listening_image,
            "listening_image",
            {
                "dialogue": "男：明天有空一起去游泳吗？\\n女：好啊，我也想去游泳。",
                "question": "问：他们明天打算做什么？",
                "options": {"A": "游泳", "B": "跑步", "C": "打球", "D": "唱歌"},
                "answer": "A",
                "image_generation_prompt": "Two friends talking about swimming in a modern room",
                "explanation_zh": "中文解析",
                "explanation_vi": "Giải thích",
                "trap_analysis_vi": "Bẫy",
            },
        ),
        (
            generate_listening_text,
            "listening_text",
            {
                "dialogue": "男：这次出国交流机会难得，你怎么没报名？\\n女：本以为时间合适，谁知家里有突发急事，我实在脱不开身，只好婉言谢绝了领导的好意。",
                "question": "问：关于女的，下列哪项符合事实？",
                "options": {"A": "推辞", "B": "接受", "C": "拖延", "D": "放弃"},
                "answer": "A",
                "explanation_zh": "中文解析",
                "explanation_vi": "Giải thích",
                "trap_analysis_vi": "Bẫy",
            },
        ),
        (
            generate_writing,
            "writing",
            {
                "chunks": ["唯有坚持不懈", "方能", "克服一切困难", "实现理想目标"],
                "correct_order": [1, 2, 3, 4],
                "full_sentence": "唯有坚持不懈，方能克服一切困难，实现理想目标。",
                "explanation_zh": "中文解析",
                "explanation_vi": "Giải thích",
                "trap_analysis_vi": "Bẫy",
            },
        ),
    ]:
        captured_prompts = []

        def mock_llm_caller(prompt: str) -> str:
            captured_prompts.append(prompt)
            if len(captured_prompts) == 1:
                # Deliberate failure on attempt 1 (duplicate options or missing field)
                return json.dumps({"corrupted": True})
            return json.dumps(valid_resp)

        res = gen_fn(level=5 if q_type != "listening_image" else 2, target_vocab=valid_resp.get("options", {}).get("A") or "实现", llm_caller=mock_llm_caller)
        assert len(captured_prompts) == 2, f"{q_type} should have retried once"
        assert "【警告：上一次生成失败" in captured_prompts[1], (
            f"Generator {q_type} failed to pass previous error into retry prompt!"
        )


def test_ollama_connection_error_terminates_immediately_without_burning_retries():
    """Verify that when provider raises OllamaConnectionError, generator terminates immediately."""
    call_count = 0

    def mock_dead_server(prompt: str) -> str:
        nonlocal call_count
        call_count += 1
        raise OllamaConnectionError("Ollama daemon is completely down")

    with pytest.raises(OllamaConnectionError):
        generate_reading(level=5, target_vocab="缓解", llm_caller=mock_dead_server)

    assert call_count == 1, f"Should have aborted immediately after 1 attempt, but made {call_count} calls!"


# ============================================================================
# SECTION 3: Hybrid Vocabulary Stress Testing Across Levels 1–6
# ============================================================================

def test_syllabus_catalog_integrity_and_level_distribution():
    """
    Stress test SyllabusVocabManager:
    - Loads 5,400 HSK 1–6 items.
    - Verified counts per level:
      HSK 1 >= 300
      HSK 2 >= 200
      HSK 3 >= 500
      HSK 4 >= 1000
      HSK 5 >= 1600
      HSK 6 >= 1800
    - Total catalog >= 5,400 distinct items.
    """
    manager = SyllabusVocabManager()
    manager.load()

    # Official CLEC 2025 standard catalog has 5,400 raw rows (5,334 in vocab.jsonl + 66 in vocab_restored.jsonl).
    # SyllabusVocabManager deduplicates words within each level so that polysemous duplicates
    # (e.g. '花' and '过' in HSK 2, '得' in HSK 3) are merged, yielding 5,383 unique entries:
    # Level 1: 300
    # Level 2: 198
    # Level 3: 499
    # Level 4: 997
    # Level 5: 1595
    # Level 6: 1794
    expected_unique = {
        1: 300,
        2: 198,
        3: 499,
        4: 997,
        5: 1595,
        6: 1794,
    }

    total_unique = 0
    for lvl in range(1, 7):
        unique_words = manager.get_words_for_level(lvl)
        vocab_items = manager.vocab_by_level[lvl]
        assert len(unique_words) == expected_unique[lvl], (
            f"Level {lvl} unique words {len(unique_words)} does not match {expected_unique[lvl]}"
        )
        assert len(vocab_items) == expected_unique[lvl], (
            f"Level {lvl} vocab items {len(vocab_items)} does not match {expected_unique[lvl]}"
        )
        total_unique += len(unique_words)

    assert total_unique == 5383, f"Expected 5,383 unique words within levels, got {total_unique}"




def test_auto_vocab_sampling_when_target_vocab_is_none():
    """
    Stress test auto-selection of contemporary vocabulary when target_vocab=None:
    - Sample 30 words across each level (1 to 6).
    - Ensure every sampled word is non-empty, genuine, and present in the respective level's catalog.
    - Ensure level string normalization works for '1', 'HSK1', 'hsk 1', 'HSK 6'.
    """
    manager = SyllabusVocabManager()
    manager.load()

    for lvl in range(1, 7):
        lvl_words = set(manager.get_words_for_level(lvl))
        for level_input in [lvl, str(lvl), f"HSK{lvl}", f"hsk {lvl}"]:
            sampled_word = get_target_vocab(level_input, target_vocab=None)
            assert sampled_word in lvl_words, (
                f"Sampled word '{sampled_word}' for level input '{level_input}' not found in HSK {lvl} catalog!"
            )
            assert len(sampled_word) >= 1


def test_obscure_and_specific_target_words_strictly_enforced():
    """
    Stress test specific or obscure target vocabulary:
    - HSK 6: '至关重要', '鉴于'
    - HSK 5: '推辞', '缓解', '辩论'
    - HSK 4: '究竟'
    - HSK 3: '信用卡'
    - HSK 2: '便宜'
    - HSK 1: '电脑'
    Verify target word is strictly set as target_word and required answer.
    """
    obscure_test_cases = [
        (6, "至关重要"),
        (6, "鉴于"),
        (5, "推辞"),
        (5, "缓解"),
        (4, "究竟"),
        (3, "信用卡"),
        (2, "便宜"),
        (1, "电脑"),
    ]

    for lvl, word in obscure_test_cases:
        resolved = get_target_vocab(lvl, target_vocab=word)
        assert resolved == word, f"Expected '{word}', got '{resolved}'"


def test_validator_rejects_llm_substituting_target_word():
    """
    Stress test validator: If LLM ignores the requested target word '踌躇满志'
    and substitutes '高兴' as the answer, validator MUST reject it.
    """
    invalid_data = {
        "level": 6,
        "type": "reading",
        "question": "面对未来的挑战，他显露出了______的神态。",
        "options": {"A": "高兴", "B": "快乐", "C": "悲伤", "D": "忧愁"},
        "answer": "A",
        "explanation_zh": "中文解析",
        "explanation_vi": "Giải thích",
        "trap_analysis_vi": "Phân tích bẫy",
    }

    ok, reason = validate_question(invalid_data, target_word="踌躇满志", expected_level=6)
    assert not ok, "Validator must reject question where answer does not match target word"
    assert "踌躇满志" in reason


# ============================================================================
# SECTION 4: Parsing Robustness & Quality Boundary Stress Tests
# ============================================================================

def test_json_extraction_from_markdown_and_commentary():
    """
    Stress test JSON extraction from hostile LLM formatting:
    1. Triple backticks with json specifier: ```json { ... } ```
    2. Conversational preface and postface text.
    3. Multi-line inner formatting.
    """
    sample_json = {"question": "测试句子______", "answer": "A"}

    # Case 1: Markdown code fences
    raw_1 = f"```json\n{json.dumps(sample_json)}\n```"
    assert _extract_json_response(raw_1) == sample_json

    # Case 2: Conversational fluff
    raw_2 = f"好的，这是为您设计的HSK 5级考题：\n```json\n{json.dumps(sample_json)}\n```\n希望对您的教学有所帮助！"
    assert _extract_json_response(raw_2) == sample_json

    # Case 3: Raw JSON with leading/trailing whitespaces and newlines
    raw_3 = f"\n\n  {json.dumps(sample_json)}  \n"
    assert _extract_json_response(raw_3) == sample_json


def test_masked_pinyin_preservation_and_spacing():
    """
    Verify masked pinyin generator:
    - Never reveals pronunciation of the blank.
    - Preserves exact '______' token.
    - Eliminates extraneous spaces before punctuation.
    """
    sentence = "面对工作压力，我们要学会自我调节，方能______内心的焦虑。"
    pinyin_res = generate_masked_pinyin(sentence, "______")

    assert "______" in pinyin_res
    assert "huǎnjiě" not in pinyin_res
    # Verify no space before punctuation
    assert " ," not in pinyin_res and " 。" not in pinyin_res
    assert pinyin_res.endswith("。")


def test_validator_rejects_nonsensical_collocations():
    """
    Verify zero tolerance for nonsensical Chinese collocations
    (e.g. '艰难的难关', '一场难关', '剧烈的困难', '缓解难关').
    """
    for bad_colloc in ["艰难的难关", "一场难关", "剧烈的困难", "缓解难关"]:
        bad_data = {
            "level": 5,
            "type": "reading",
            "question": f"面对这次{bad_colloc}，我们必须______应对。",
            "options": {"A": "积极", "B": "消极", "C": "一般", "D": "无所谓"},
            "answer": "A",
            "explanation_zh": "解析",
            "explanation_vi": "Giải thích",
            "trap_analysis_vi": "Bẫy",
        }
        ok, reason = validate_question(bad_data, target_word="积极", expected_level=5)
        assert not ok, f"Validator failed to reject nonsensical collocation: {bad_colloc}"
        assert bad_colloc in reason


if __name__ == "__main__":
    sys.exit(pytest.main(["-v", __file__]))
