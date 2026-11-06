"""
Verification test suite for Milestone 1 & 2:
- HSK Matrix configuration (hsk_matrix.json)
- Pollinations Image Service (image_service.py)
- Masked Pinyin & Question Validator (validator.py)
"""

import json
import os
import sys
import urllib.parse
import pytest

# Ensure workspace root is in sys.path for direct script execution
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from image_service import STYLE_PREFIX, build_pollinations_url
from validator import generate_masked_pinyin, validate_question


# ============================================================================
# 1. Milestone 1: HSK Matrix Configuration Tests
# ============================================================================

def test_hsk_matrix_file_exists_and_is_valid_json():
    """Verify that hsk_matrix.json exists at root and parses as valid JSON."""
    matrix_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "hsk_matrix.json")
    assert os.path.exists(matrix_path), f"hsk_matrix.json not found at {matrix_path}"

    with open(matrix_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    assert isinstance(data, dict), "hsk_matrix.json root must be a JSON object"
    # Verify all 6 levels are present under both numeric and string keys
    for lvl in range(1, 7):
        assert str(lvl) in data, f"Level {lvl} missing from matrix numeric keys"
        assert f"hsk{lvl}" in data, f"Level hsk{lvl} missing from matrix hsk keys"


def test_hsk_matrix_mandatory_fields_and_types():
    """Verify each level entry in hsk_matrix.json has all required schema fields."""
    matrix_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "hsk_matrix.json")
    with open(matrix_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    required_fields = [
        "level",
        "level_code",
        "name",
        "listening_format",
        "listening_description",
        "reading_format",
        "reading_description",
        "writing_format",
        "writing_description",
        "mandatory_grammar",
        "style",
    ]

    for lvl in range(1, 7):
        entry = data[str(lvl)]
        for field in required_fields:
            assert field in entry, f"Level {lvl} missing required field '{field}'"
        assert entry["level"] == lvl
        assert isinstance(entry["mandatory_grammar"], list)
        assert len(entry["mandatory_grammar"]) >= 3, f"Level {lvl} has insufficient grammar entries"
        assert isinstance(entry["style"], str) and len(entry["style"]) > 10


def test_hsk_matrix_level_grammar_and_listening_rules():
    """Verify specific grammar points and format requirements for HSK 1–6."""
    matrix_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "hsk_matrix.json")
    with open(matrix_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # HSK 1
    hsk1 = data["hsk1"]
    assert "picture" in hsk1["listening_format"] or "picture" in hsk1["listening_description"]
    grammar1_text = " ".join(hsk1["mandatory_grammar"])
    assert "SVO" in grammar1_text or "Subject" in grammar1_text
    assert "不" in grammar1_text and "没" in grammar1_text
    assert "吗" in grammar1_text

    # HSK 2
    hsk2 = data["hsk2"]
    assert "picture" in hsk2["listening_format"] or "picture" in hsk2["listening_description"]
    grammar2_text = " ".join(hsk2["mandatory_grammar"])
    assert "比" in grammar2_text
    assert "个" in grammar2_text and "本" in grammar2_text
    assert "了" in grammar2_text and "过" in grammar2_text and "着" in grammar2_text

    # HSK 3
    hsk3 = data["hsk3"]
    grammar3_text = " ".join(hsk3["mandatory_grammar"])
    assert "虽然" in grammar3_text or "因为" in grammar3_text or "如果" in grammar3_text
    assert "来/去" in grammar3_text or "Directional" in grammar3_text
    assert "Resultative" in grammar3_text or "完" in grammar3_text

    # HSK 4
    hsk4 = data["hsk4"]
    assert "text" in hsk4["listening_format"] or "traps" in hsk4["listening_description"]
    grammar4_text = " ".join(hsk4["mandatory_grammar"])
    assert "把" in grammar4_text
    assert "被" in grammar4_text
    assert "不但" in grammar4_text or "而且" in grammar4_text
    assert "无论" in grammar4_text
    assert "比" in grammar4_text and "得多" in grammar4_text

    # HSK 5
    hsk5 = data["hsk5"]
    assert "reversal" in hsk5["listening_description"].lower() or "原本" in hsk5["listening_description"]
    assert "near_synonym" in hsk5["reading_format"] or "近义词" in hsk5["reading_description"]
    grammar5_text = " ".join(hsk5["mandatory_grammar"])
    assert "哪怕" in grammar5_text or "即使" in grammar5_text
    assert "与其" in grammar5_text or "不如" in grammar5_text
    assert "难道" in grammar5_text or "岂能" in grammar5_text
    assert "从而" in grammar5_text or "进而" in grammar5_text or "以至于" in grammar5_text

    # HSK 6
    hsk6 = data["hsk6"]
    assert "academic_monologue" in hsk6["listening_format"]
    assert "paraphrased" in hsk6["listening_description"].lower()
    grammar6_text = " ".join(hsk6["mandatory_grammar"])
    assert "书面语" in grammar6_text or "Formal" in grammar6_text
    assert "成语" in grammar6_text or "idiom" in grammar6_text.lower()
    assert "鉴于" in grammar6_text and "予以" in grammar6_text
    assert "非但" in grammar6_text or "固然" in grammar6_text
    assert "唯有" in grammar6_text or "方能" in grammar6_text


# ============================================================================
# 2. Milestone 2: Pollinations Image Service Tests
# ============================================================================

def test_build_pollinations_url_format_and_prefix():
    """Verify build_pollinations_url produces the expected textbook illustration URL."""
    prompt = "a young boy ordering food at a modern restaurant counter"
    url = build_pollinations_url(prompt, width=512, height=512)

    assert url.startswith("https://image.pollinations.ai/prompt/")
    assert "width=512" in url
    assert "height=512" in url
    assert "nologo=true" in url

    # Verify style prefix was included and URL-encoded
    parsed = urllib.parse.urlparse(url)
    encoded_path = parsed.path.replace("/prompt/", "")
    decoded_prompt = urllib.parse.unquote(encoded_path)
    assert decoded_prompt.startswith(STYLE_PREFIX.strip())
    assert prompt in decoded_prompt


def test_build_pollinations_url_custom_dimensions_and_no_duplicate_prefix():
    """Verify custom width/height and that style prefix is not duplicated."""
    existing_prefix_prompt = (
        "Minimalist 2D vector art, clean lines, educational textbook illustration, flat colors, white background, "
        "two girls drinking bubble tea"
    )
    url = build_pollinations_url(existing_prefix_prompt, width=800, height=600)

    assert "width=800" in url
    assert "height=600" in url

    parsed = urllib.parse.urlparse(url)
    decoded_prompt = urllib.parse.unquote(parsed.path.replace("/prompt/", ""))
    # Ensure prefix appears only once
    assert decoded_prompt.count("Minimalist 2D vector art") == 1


# ============================================================================
# 3. Milestone 2: Masked Pinyin Generator Tests
# ============================================================================

def test_generate_masked_pinyin_basic_and_tone_marks():
    """Verify generate_masked_pinyin keeps ______ and produces toned pinyin."""
    raw_sentence = "我想______一下压力。"
    result = generate_masked_pinyin(raw_sentence)

    # Must preserve the exact mask token
    assert "______" in result
    # Must contain toned pinyin for 'wǒ', 'xiǎng', 'yī', 'xià', 'yā', 'lì'
    assert "wǒ" in result
    assert "xiǎng" in result
    assert "yā" in result
    assert "lì" in result
    # Spacing before Chinese full stop must be eliminated
    assert not result.endswith(" 。")
    assert result.endswith("。")


def test_generate_masked_pinyin_various_positions_and_punctuation():
    """Verify masked pinyin generation across various positions and punctuation types."""
    # 1. Blank at beginning
    res1 = generate_masked_pinyin("______是我的好朋友。")
    assert res1.startswith("______ ")
    assert "shì" in res1
    assert res1.endswith("。")

    # 2. Blank at end
    res2 = generate_masked_pinyin("今天天气很______。")
    assert res2.endswith("______。")
    assert "jīn tiān" in res2

    # 3. Blank before question particle
    res3 = generate_masked_pinyin("你最近在忙______吗？")
    assert "______ ma？" in res3 or "______ ma?" in res3 or "______" in res3

    # 4. Conjunction with commas
    res4 = generate_masked_pinyin("虽然下雨，但是我们______去公园。")
    assert "suī rán" in res4
    assert "______" in res4
    assert "，" in res4
    assert not (" ，" in res4)


# ============================================================================
# 4. Milestone 2: Question Validator Tests
# ============================================================================

@pytest.fixture
def valid_reading_question():
    """Standard valid HSK 5 reading question sample."""
    return {
        "level": 5,
        "type": "reading",
        "question": "面对剧烈的市场竞争，企业唯有不断创新，方能______眼前的危机。",
        "options": {
            "A": "缓解",
            "B": "减轻",
            "C": "消除",
            "D": "减少",
        },
        "answer": "A",
        "explanation_zh": "“缓解”通常与“危机”、“压力”、“紧张”等搭配，表示程度上的减轻或缓和。",
        "explanation_vi": "'缓解' (huǎnjiě) thường kết hợp với '危机' (khủng hoảng) hoặc '压力' (áp lực).",
        "trap_analysis_vi": "'消除' mang tính triệt để không khả thi với khủng hoảng thị trường; '减少' dùng cho số lượng cụ thể.",
    }


def test_validate_question_accepts_valid_sample(valid_reading_question):
    """Verify validator accepts a properly formatted and pedagogical sample."""
    ok, reason = validate_question(
        valid_reading_question,
        target_word="缓解",
        expected_level=5,
    )
    assert ok is True
    assert reason == "Valid"


def test_validate_question_rejects_missing_blank(valid_reading_question):
    """Verify validator rejects a reading question missing the blank token."""
    bad_data = valid_reading_question.copy()
    bad_data["question"] = "面对剧烈的市场竞争，企业唯有不断创新，方能化解眼前的危机。"  # No blank

    ok, reason = validate_question(bad_data, target_word="缓解", expected_level=5)
    assert ok is False
    assert "blank" in reason.lower() or "______" in reason


def test_validate_question_rejects_leaked_target_word(valid_reading_question):
    """Verify validator rejects a question where target_word appears in stem text."""
    bad_data = valid_reading_question.copy()
    bad_data["question"] = "为了缓解危机，企业唯有不断创新，方能______眼前的困难。"  # Leaked '缓解'

    ok, reason = validate_question(bad_data, target_word="缓解", expected_level=5)
    assert ok is False
    assert "leaked" in reason.lower() or "缓解" in reason


def test_validate_question_rejects_duplicate_options(valid_reading_question):
    """Verify validator rejects duplicate options."""
    bad_data = valid_reading_question.copy()
    bad_data["options"] = {
        "A": "缓解",
        "B": "缓解",  # Duplicate of A
        "C": "消除",
        "D": "减少",
    }

    ok, reason = validate_question(bad_data, target_word="缓解", expected_level=5)
    assert ok is False
    assert "duplicate" in reason.lower()


def test_validate_question_rejects_missing_trap_analysis_vi(valid_reading_question):
    """Verify validator rejects questions missing trap_analysis_vi."""
    bad_data = valid_reading_question.copy()
    del bad_data["trap_analysis_vi"]

    ok, reason = validate_question(bad_data, target_word="缓解", expected_level=5)
    assert ok is False
    assert "trap_analysis_vi" in reason


def test_validate_question_rejects_wrong_answer_key(valid_reading_question):
    """Verify validator rejects question when designated answer does not match target_word."""
    bad_data = valid_reading_question.copy()
    bad_data["answer"] = "B"  # B is '减轻', not '缓解'

    ok, reason = validate_question(bad_data, target_word="缓解", expected_level=5)
    assert ok is False
    assert "match target word" in reason.lower() or "answer" in reason.lower()


def test_validate_question_rejects_level_mismatch(valid_reading_question):
    """Verify validator rejects question when level does not match expected_level."""
    ok, reason = validate_question(
        valid_reading_question,
        target_word="缓解",
        expected_level=3,  # Expected level 3 but question is level 5
    )
    assert ok is False
    assert "level mismatch" in reason.lower()


def test_validate_question_supports_list_options(valid_reading_question):
    """Verify validator also accepts options provided as a 4-item list."""
    list_data = valid_reading_question.copy()
    list_data["options"] = ["缓解", "减轻", "消除", "减少"]
    list_data["answer"] = "A"

    ok, reason = validate_question(list_data, target_word="缓解", expected_level=5)
    assert ok is True
    assert reason == "Valid"


def test_validate_question_supports_integer_zero_answer(valid_reading_question):
    """Verify validator accepts answer=0 (integer 0) without falsely rejecting it as missing."""
    data = valid_reading_question.copy()
    data["options"] = ["缓解", "减轻", "消除", "减少"]
    data["answer"] = 0  # 0-index corresponding to "缓解"

    ok, reason = validate_question(data, target_word="缓解", expected_level=5)
    assert ok is True, f"Failed with: {reason}"
    assert reason == "Valid"


def test_validate_question_writing_chunk_length_bounds():
    """Verify writing questions enforce 4 <= len(chunks) <= 5 and reject <4 or >5 chunks."""
    base_writing = {
        "level": 6,
        "type": "writing",
        "question": "连词成句：请将下列语块按正确的语法语序排列成完整句子。",
        "chunks": ["企业", "唯有坚持创新", "在竞争中", "方能立于不败之地"],
        "correct_order": [0, 1, 2, 3],
        "full_sentence": "企业唯有坚持创新，方能在竞争中立于不败之地。",
        "explanation_zh": "解析中文",
        "explanation_vi": "Giải thích",
        "trap_analysis_vi": "Phân tích bẫy",
    }

    # 4 chunks -> valid
    ok, _ = validate_question(base_writing, expected_level=6)
    assert ok is True

    # 5 chunks -> valid
    w5 = base_writing.copy()
    w5["chunks"] = ["企业", "唯有坚持创新", "方能", "在竞争中", "立于不败之地"]
    w5["correct_order"] = [0, 1, 2, 3, 4]
    ok, _ = validate_question(w5, expected_level=6)
    assert ok is True

    # 3 chunks -> rejected
    w3 = base_writing.copy()
    w3["chunks"] = ["企业", "唯有创新", "立于不败之地"]
    w3["correct_order"] = [0, 1, 2]
    ok, reason = validate_question(w3, expected_level=6)
    assert ok is False
    assert "4-5 chunks" in reason

    # 6 chunks -> rejected
    w6 = base_writing.copy()
    w6["chunks"] = ["企业", "唯有", "坚持", "自主创新", "在竞争中", "立于不败之地"]
    w6["correct_order"] = [0, 1, 2, 3, 4, 5]
    ok, reason = validate_question(w6, expected_level=6)
    assert ok is False
    assert "4-5 chunks" in reason

    # correct_order length mismatch -> rejected
    w_mismatch = base_writing.copy()
    w_mismatch["correct_order"] = [0, 1, 2]  # 3 indices for 4 chunks
    ok, reason = validate_question(w_mismatch, expected_level=6)
    assert ok is False
    assert "correct_order length" in reason.lower() or "match chunks count" in reason.lower()


def test_validate_question_listening_rejects_blank_in_stem_or_dialogue():
    """Verify listening questions strictly ban fill-in-the-blank token '______'."""
    data = {
        "level": 2,
        "type": "listening_image",
        "question": "问：女的打算去______？",  # Blank in question
        "dialogue": "男：你明天去哪里？\n女：我去机场。",
        "options": {"A": "机场", "B": "车站", "C": "医院", "D": "饭馆"},
        "answer": "A",
        "explanation_zh": "解析",
        "explanation_vi": "Giải thích",
        "trap_analysis_vi": "Phân tích bẫy",
    }
    ok, reason = validate_question(data, expected_level=2)
    assert ok is False
    assert "listening questions must not contain fill-in-the-blank" in reason.lower()

    # Blank in dialogue
    data2 = data.copy()
    data2["question"] = "问：女的打算去哪里？"
    data2["dialogue"] = "男：你明天去哪里？\n女：我去______。"
    ok, reason = validate_question(data2, expected_level=2)
    assert ok is False
    assert "listening questions must not contain fill-in-the-blank" in reason.lower()


def test_build_pollinations_url_encodes_slashes_in_path():
    """Verify slashes in prompts are percent-encoded as %2F."""
    prompt = "A 24/7 convenience store with a clerk / student"
    url = build_pollinations_url(prompt)
    parsed = urllib.parse.urlparse(url)
    path_prompt = parsed.path.replace("/prompt/", "")
    assert "/" not in path_prompt
    assert "%2F" in url


if __name__ == "__main__":
    import sys
    sys.exit(pytest.main(["-v", __file__]))
