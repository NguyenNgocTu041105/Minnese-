"""
Adversarial empirical stress-test suite by Challenger 1.
Empirically stress-tests:
1. Pinyin masking (generate_masked_pinyin):
   - Multiple blanks, boundary positions, punctuation extremes, polyphones, compound word splitting, decomposition.
2. Question validator (validate_question):
   - Substring leaks, whitespace/case variations, distractor equivalence, missing fields,
     collocation blacklist coverage, listening verbatim vs paraphrase, listening reversal traps,
     lowercase answer key bypass, list options bypass, root options bypass, listening blank check.
3. Pollinations Image URL builder (build_pollinations_url):
   - Special characters, unencoded slashes in path, non-ASCII/emojis, extreme dimensions, prefix idempotence.
"""

import json
import os
import sys
import urllib.parse
import pytest

# Ensure workspace root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from image_service import STYLE_PREFIX, build_pollinations_url
from validator import _normalize_pinyin_spacing, generate_masked_pinyin, validate_question


# ============================================================================
# Section 1: Pinyin Masking Stress Testing (generate_masked_pinyin)
# ============================================================================

class TestPinyinMaskingAdversarial:
    """Stress tests for generate_masked_pinyin."""

    def test_multi_blank_handling(self):
        """Test sentences with multiple blanks preserving all mask tokens and correct spacing."""
        # Two blanks
        s1 = "不仅______，而且______。"
        res1 = generate_masked_pinyin(s1)
        assert res1.count("______") == 2, f"Expected 2 blanks, got {res1}"
        assert res1.startswith("bù jǐn ______")
        assert "ér qiě ______。" in res1 or "ér qiě ______ 。" in res1
        assert "______，ér qiě" in res1 or "______ ， ér qiě" in res1 or "______，" in res1

        # Three blanks
        s2 = "______有______，还有______。"
        res2 = generate_masked_pinyin(s2)
        assert res2.count("______") == 3, f"Expected 3 blanks, got {res2}"
        assert res2.startswith("______ ")
        assert res2.endswith("______。")

    def test_adjacent_blanks(self):
        """Test consecutive/adjacent blanks without intervening text."""
        s = "这是____________。"
        res = generate_masked_pinyin(s)
        # Should contain both blanks separated cleanly
        assert "______" in res
        assert res.count("______") == 2
        assert "zhè shì ______ ______。" in res or "zhè shì ______ ______ 。" in res or "______ ______" in res

    def test_blank_at_boundary_positions(self):
        """Test blank at exact start, exact end without punct, and exact end with punct."""
        # Start
        s_start = "______是我的中文老师。"
        res_start = generate_masked_pinyin(s_start)
        assert res_start.startswith("______ ")
        assert "shì wǒ de zhōng wén lǎo shī。" in res_start

        # End without punctuation
        s_end_no_p = "今天天气很______"
        res_end_no_p = generate_masked_pinyin(s_end_no_p)
        assert res_end_no_p.endswith("______")
        assert "jīn tiān tiān qì hěn ______" in res_end_no_p

        # End with punctuation
        s_end_p = "今天天气很______。"
        res_end_p = generate_masked_pinyin(s_end_p)
        assert res_end_p.endswith("______。")
        assert not res_end_p.endswith("______ 。")

        # Entire sentence is just the blank
        s_only = "______"
        res_only = generate_masked_pinyin(s_only)
        assert res_only == "______"

    def test_empty_and_falsy_inputs(self):
        """Test empty string and None handling."""
        assert generate_masked_pinyin("") == ""
        assert generate_masked_pinyin(None) == ""

    def test_punctuation_extremes_and_brackets(self):
        """Test quotes, brackets, consecutive punctuation, and non-ASCII punctuation."""
        # Quotes
        s_quote = "老师说：“______！”"
        res_quote = generate_masked_pinyin(s_quote)
        assert "______" in res_quote
        assert "“______！”" in res_quote or "“ ______ ！”" in res_quote or "“______" in res_quote

        # Parentheses / Chinese brackets
        s_bracket = "（______）"
        res_bracket = generate_masked_pinyin(s_bracket)
        assert "______" in res_bracket
        assert "（______）" in res_bracket or "（ ______ ）" in res_bracket

        # Ellipsis and question mark
        s_ellipsis = "……______？！"
        res_ellipsis = generate_masked_pinyin(s_ellipsis)
        assert "______" in res_ellipsis
        assert "……" in res_ellipsis
        assert "？！" in res_ellipsis

    def test_spacing_normalization_around_punctuation(self):
        """Test that redundant spaces before Chinese and Western punctuation are eliminated."""
        s = " 我们 ， 正在 ______ 。 "
        res = generate_masked_pinyin(s)
        assert "______" in res
        # No space before comma or period
        assert " ，" not in res
        assert " 。" not in res
        assert " ," not in res
        assert " ." not in res

    def test_polyphone_characters_empirical_behavior(self):
        """
        Adversarial test on common Chinese polyphonic characters (地, 得, 假, 还, 重).
        Documents empirical tones and observes polyphone tone resolution.
        """
        cases = [
            ("他高兴地______走去。", "dì"),        # Note: pypinyin gives dì rather than neutral de
            ("这是我的土地______。", "dì"),       # 地 as noun
            ("目的地是______。", "dì"),          # 地 in 目的地
            ("他跑得______快。", "dé"),          # Note: pypinyin gives dé rather than neutral de
            ("他______到了一本书。", "dào"),      # 得 in 得到 -> dào is in 2nd part
            ("明天放______。", "fàng"),          # 假 in 放假
            ("这是______话。", "zhè shì"),       # 假 as fake
            ("我______要去。", "wǒ"),            # 还 as still
            ("他已经______钱了。", "yǐ jīng"),    # 还 in 还钱
            ("这个问题很______。", "zhè ge"),     # 重 as important/heavy
            ("我们要______新开始。", "xīn kāi"),  # 重 in 重新
        ]
        for sentence, snippet in cases:
            res = generate_masked_pinyin(sentence)
            assert "______" in res, f"Mask token lost in: {sentence} -> {res}"
            assert not any(c in res for c in ["None", "null", "NaN"])

    def test_compound_word_splitting_edge_case(self):
        """
        Adversarial finding: When a compound word is split by the mask token,
        lexical context across the blank boundary is lost, affecting polyphone tones.
        E.g. '这件衣服很便______。' -> '便' becomes 'biàn' instead of 'pián' (from 便宜).
        """
        s = "这件衣服很便______。"
        res = generate_masked_pinyin(s)
        assert "______" in res
        # Document that '便' is pronounced 'biàn' when '宜' is masked
        assert "biàn" in res

    def test_mask_token_is_never_decomposed_into_letters(self):
        """Ensure mask token ______ is strictly preserved verbatim and never decomposed into '_' or words."""
        sentences = [
            "面对困难，我们应当积极______。",
            "______，不进则退。",
            "与其抱怨，不如______行动。",
        ]
        for s in sentences:
            res = generate_masked_pinyin(s)
            assert "______" in res
            parts = res.split("______")
            for p in parts:
                assert "_" not in p, f"Underscore decomposed into text part: {p}"


# ============================================================================
# Section 2: Question Validator Stress Testing (validate_question)
# ============================================================================

class TestQuestionValidatorAdversarial:
    """Stress tests for validate_question."""

    @pytest.fixture
    def base_valid_reading(self):
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
            "explanation_zh": "“缓解”通常与“危机”、“压力”搭配。",
            "explanation_vi": "'缓解' (huǎnjiě) kết hợp với '危机' hoặc '压力'.",
            "trap_analysis_vi": "'消除' mang tính triệt để không hợp ngữ cảnh khủng hoảng.",
        }

    # ------------------------------------------------------------------------
    # 2.1 Substring leaks
    # ------------------------------------------------------------------------

    def test_target_word_leak_in_question(self, base_valid_reading):
        """Direct target word in question must be rejected."""
        q = base_valid_reading.copy()
        q["question"] = "为了缓解市场危机，企业必须______。"
        ok, reason = validate_question(q, target_word="缓解")
        assert ok is False
        assert "leaked" in reason.lower()

    def test_target_word_compound_substring_in_question(self, base_valid_reading):
        """
        Adversarial case: target word is a single character or short word that appears
        as a substring inside another word in the question stem.
        E.g. target_word = '关', stem has '关于______的问题'.
        """
        q = base_valid_reading.copy()
        q["question"] = "关于这个问题，请大家______思考。"
        q["options"] = {"A": "关", "B": "开", "C": "闭", "D": "合"}
        q["answer"] = "A"

        ok, reason = validate_question(q, target_word="关")
        # '关' is in '关于', so validator triggers leak detection
        assert ok is False
        assert "leaked" in reason.lower() or "关" in reason

    def test_target_word_with_whitespace_stripping(self, base_valid_reading):
        """Target word passed with leading/trailing whitespace still detects leak."""
        q = base_valid_reading.copy()
        q["question"] = "面对危机，我们要缓解______。"
        ok, reason = validate_question(q, target_word="  缓解  ")
        assert ok is False
        assert "leaked" in reason.lower()

    # ------------------------------------------------------------------------
    # 2.2 Whitespace and case variations in options
    # ------------------------------------------------------------------------

    def test_options_with_whitespace_duplicates(self, base_valid_reading):
        """Options differing only in surrounding whitespace must be rejected as duplicates."""
        q = base_valid_reading.copy()
        q["options"] = {
            "A": "缓解",
            "B": "  缓解  ",  # Duplicate with whitespace
            "C": "消除",
            "D": "减少",
        }
        ok, reason = validate_question(q, target_word="缓解")
        assert ok is False
        assert "duplicate" in reason.lower()

    def test_options_with_case_variation_in_latin(self, base_valid_reading):
        """
        Adversarial finding: Options in Latin/pinyin differing only by case (e.g. 'Apple' vs 'apple').
        Currently str.strip() preserves case, so 'Apple' != 'apple'. Casefold deduplication is NOT performed.
        """
        q = base_valid_reading.copy()
        q["options"] = {
            "A": "Apple",
            "B": "apple",  # Case variant
            "C": "Orange",
            "D": "Banana",
        }
        q["answer"] = "A"
        ok, reason = validate_question(q, target_word="Apple")
        # Documents that 'Apple' and 'apple' are treated as distinct options (not caught as duplicates)
        assert ok is True
        assert reason == "Valid"

    # ------------------------------------------------------------------------
    # 2.3 Distractor equivalence and structural errors
    # ------------------------------------------------------------------------

    def test_options_missing_one_option_key(self, base_valid_reading):
        """Options dictionary missing option 'D' must be rejected."""
        q = base_valid_reading.copy()
        q["options"] = {
            "A": "缓解",
            "B": "减轻",
            "C": "消除",
        }
        ok, reason = validate_question(q, target_word="缓解")
        assert ok is False
        assert "missing or empty option 'd'" in reason.lower()

    def test_options_empty_string_or_whitespace(self, base_valid_reading):
        """Option with empty string or only whitespace must be rejected."""
        q = base_valid_reading.copy()
        q["options"]["D"] = "   "
        ok, reason = validate_question(q, target_word="缓解")
        assert ok is False
        assert "missing or empty option" in reason.lower()

    def test_options_list_fewer_than_4(self, base_valid_reading):
        """Options provided as list with fewer than 4 items must be rejected."""
        q = base_valid_reading.copy()
        q["options"] = ["缓解", "减轻", "消除"]
        ok, reason = validate_question(q, target_word="缓解")
        assert ok is False
        assert "expected 4 options" in reason.lower()

    def test_options_list_more_than_4_ignored(self, base_valid_reading):
        """
        Adversarial finding: When options is a list of 5 items, validator only validates
        the first 4 items (A-D) and silently ignores item 5+.
        """
        q = base_valid_reading.copy()
        q["options"] = ["缓解", "减轻", "消除", "减少", "多余的第五个选项"]
        q["answer"] = "A"
        ok, reason = validate_question(q, target_word="缓解")
        # Line 137 checks len < 4, but does not reject len > 4!
        assert ok is True

    def test_options_none_value(self, base_valid_reading):
        """Option value is None must be rejected."""
        q = base_valid_reading.copy()
        q["options"]["C"] = None
        ok, reason = validate_question(q, target_word="缓解")
        assert ok is False

    # ------------------------------------------------------------------------
    # 2.4 Missing or empty explanation / trap fields
    # ------------------------------------------------------------------------

    @pytest.mark.parametrize("field", ["explanation_zh", "explanation_vi", "trap_analysis_vi"])
    def test_missing_explanation_field(self, base_valid_reading, field):
        """Missing explanation fields must be rejected."""
        q = base_valid_reading.copy()
        del q[field]
        ok, reason = validate_question(q, target_word="缓解")
        assert ok is False
        assert field in reason

    @pytest.mark.parametrize("field", ["explanation_zh", "explanation_vi", "trap_analysis_vi"])
    def test_empty_or_whitespace_explanation_field(self, base_valid_reading, field):
        """Empty or whitespace-only explanation fields must be rejected."""
        q = base_valid_reading.copy()
        q[field] = "   \n\t  "
        ok, reason = validate_question(q, target_word="缓解")
        assert ok is False
        assert field in reason

    @pytest.mark.parametrize("field", ["explanation_zh", "explanation_vi", "trap_analysis_vi"])
    def test_non_string_explanation_field(self, base_valid_reading, field):
        """Non-string explanation fields (e.g. integer or list) must be rejected."""
        q = base_valid_reading.copy()
        q[field] = 12345
        ok, reason = validate_question(q, target_word="缓解")
        assert ok is False
        assert field in reason

    def test_non_dict_root_input(self):
        """Non-dict root input must be safely rejected without unhandled exception."""
        assert validate_question("not a dict")[0] is False
        assert validate_question([1, 2, 3])[0] is False
        assert validate_question(None)[0] is False

    # ------------------------------------------------------------------------
    # 2.5 Nonsensical collocations blacklist check
    # ------------------------------------------------------------------------

    @pytest.mark.parametrize("bad_colloc", [
        "艰难的难关",
        "一场难关",
        "剧烈的困难",
        "缓解难关",
    ])
    def test_blacklist_in_question_stem(self, base_valid_reading, bad_colloc):
        """Nonsensical collocations in question stem must be rejected."""
        q = base_valid_reading.copy()
        # Use target_word '解决' so target_word leak check is not triggered for '缓解难关'
        q["question"] = f"为了面对{bad_colloc}，我们必须______。"
        q["options"] = {"A": "解决", "B": "逃避", "C": "放弃", "D": "忽视"}
        q["answer"] = "A"
        ok, reason = validate_question(q, target_word="解决")
        assert ok is False
        assert "nonsensical collocation" in reason.lower()
        assert bad_colloc in reason

    def test_blacklist_in_dialogue_or_script(self, base_valid_reading):
        """Nonsensical collocations in dialogue or script must be rejected."""
        q = base_valid_reading.copy()
        q["type"] = "listening_text"
        q["dialogue"] = "男：本以为这次能顺利过关。\n女：谁知这是一场难关。"
        q["answer"] = "A"
        q["options"] = {"A": "克服", "B": "逃避", "C": "放弃", "D": "忽视"}
        ok, reason = validate_question(q, target_word="克服")
        assert ok is False
        assert "nonsensical collocation" in reason.lower()
        assert "一场难关" in reason

    def test_blacklist_in_options_vulnerability(self, base_valid_reading):
        """
        Verify that nonsensical collocation in options (e.g. Option B is '艰难的难关')
        is strictly rejected by validate_question.
        """
        q = base_valid_reading.copy()
        q["options"]["B"] = "艰难的难关"
        ok, reason = validate_question(q, target_word="缓解")
        assert ok is False, "Expected blacklist rejection when option contains nonsensical collocation"
        assert "nonsensical collocation" in reason.lower()

    def test_blacklist_in_audio_text_vulnerability(self, base_valid_reading):
        """
        Verify that nonsensical collocation in audio_text is strictly rejected.
        """
        q = base_valid_reading.copy()
        q["type"] = "listening_text"
        q["audio_text"] = "本以为能够顺利完成，结果这是一场难关。"
        del q["options"]
        q["options"] = {"A": "克服", "B": "放弃", "C": "逃避", "D": "忽略"}
        q["answer"] = "A"
        ok, reason = validate_question(q, target_word="克服")
        assert ok is False, "Expected blacklist rejection when audio_text contains nonsensical collocation"
        assert "nonsensical collocation" in reason.lower()

    # ------------------------------------------------------------------------
    # 2.6 Listening question validation: verbatim vs paraphrase & reversal traps
    # ------------------------------------------------------------------------

    @pytest.fixture
    def valid_listening_hsk5(self):
        return {
            "level": 5,
            "type": "listening_text",
            "question": "男的最终采取了什么态度？",
            "dialogue": "女：李经理请你参加今晚的宴会，你怎么没去？\n男：我本以为必须出席，谁知身体突感不适，只好委婉谢绝了。",
            "options": {
                "A": "推辞",
                "B": "接受",
                "C": "赞成",
                "D": "期待",
            },
            "answer": "A",
            "explanation_zh": "男的说'委婉谢绝'，对应选项'推辞'。存在'本以为...谁知...'反转。",
            "explanation_vi": "Người nam nói '委婉谢绝' (từ chối khéo), tương đương '推辞' (thoái thác).",
            "trap_analysis_vi": "'本以为必须出席' là bẫy đảo ngược trước khi từ chối.",
        }

    def test_listening_valid_sample_passes(self, valid_listening_hsk5):
        """Valid HSK 5 listening question with reversal trap and paraphrased answer must pass."""
        ok, reason = validate_question(valid_listening_hsk5, target_word="推辞", expected_level=5)
        assert ok is True
        assert reason == "Valid"

    def test_listening_verbatim_answer_leak_rejected(self, valid_listening_hsk5):
        """If correct answer appears verbatim in listening dialogue, must be rejected."""
        q = valid_listening_hsk5.copy()
        # Verbatim leakage of '推辞'
        q["dialogue"] = "女：你怎么没去？\n男：我本以为要去，谁知最后还是推辞了。"
        ok, reason = validate_question(q, target_word="推辞", expected_level=5)
        assert ok is False
        assert "verbatim" in reason.lower() or "repeats dialogue" in reason.lower()

    def test_listening_missing_reversal_trap_rejected(self, valid_listening_hsk5):
        """HSK 4-6 listening question lacking reversal/contrast trap markers must be rejected."""
        q = valid_listening_hsk5.copy()
        # No reversal markers (本以为, 原本, 谁知, 结果, 没想到, etc.)
        q["dialogue"] = "女：李经理请你参加今晚的宴会，你去不去？\n男：我身体不适，只好委婉谢绝了。"
        ok, reason = validate_question(q, target_word="推辞", expected_level=5)
        assert ok is False
        assert "reversal" in reason.lower() or "trap" in reason.lower()

    def test_listening_verbatim_leak_bypassed_by_lowercase_answer_key(self, valid_listening_hsk5):
        """
        Verify that lowercase answer key ('a') cannot bypass verbatim answer repetition check.
        """
        q = valid_listening_hsk5.copy()
        # Leaked verbatim answer in dialogue
        q["dialogue"] = "女：你怎么没去？\n男：我本以为要去，谁知最后还是推辞了。"
        q["answer"] = "a"  # lowercase 'a'
        ok, reason = validate_question(q, target_word=None, expected_level=5)
        assert ok is False, "Lowercase answer key must not bypass verbatim check"
        assert "verbatim" in reason.lower() or "repeats dialogue" in reason.lower()

    def test_listening_verbatim_leak_bypassed_by_list_options_with_value_answer(self, valid_listening_hsk5):
        """
        Verify that list options with string value answer cannot bypass verbatim check.
        """
        q = valid_listening_hsk5.copy()
        q["options"] = ["推辞", "接受", "赞成", "期待"]
        q["answer"] = "推辞"  # option value
        q["dialogue"] = "女：你怎么没去？\n男：我本以为要去，谁知最后还是推辞了。"
        ok, reason = validate_question(q, target_word=None, expected_level=5)
        assert ok is False, "Option value answer must not bypass verbatim check when options is list"
        assert "verbatim" in reason.lower() or "repeats dialogue" in reason.lower()

    def test_listening_verbatim_leak_bypassed_by_dict_options_with_value_answer(self, valid_listening_hsk5):
        """
        Verify that dict options with string value answer cannot bypass verbatim check.
        """
        q = valid_listening_hsk5.copy()
        q["answer"] = "推辞"  # option value
        q["dialogue"] = "女：你怎么没去？\n男：我本以为要去，谁知最后还是推辞了。"
        ok, reason = validate_question(q, target_word=None, expected_level=5)
        assert ok is False, "Option value answer must not bypass verbatim check when options is dict"
        assert "verbatim" in reason.lower() or "repeats dialogue" in reason.lower()

    def test_listening_allows_blank_vulnerability(self, valid_listening_hsk5):
        """
        Verify that listening questions with fill-in-the-blank '______' are strictly rejected.
        """
        q = valid_listening_hsk5.copy()
        q["question"] = "男的最终决定______？"  # Erroneous blank in listening question
        ok, reason = validate_question(q, target_word="推辞", expected_level=5)
        assert ok is False, "Listening question containing blank must be rejected"
        assert "listening questions must not contain fill-in-the-blank" in reason.lower() or "blank" in reason.lower()

    # ------------------------------------------------------------------------
    # 2.7 Writing question validation
    # ------------------------------------------------------------------------

    def test_writing_valid_chunks(self):
        """Valid writing question with 4 chunks must pass."""
        data = {
            "level": 6,
            "type": "writing",
            "question": "请将下列词语连成完整的句子：",
            "chunks": ["唯有坚持自主创新", "企业", "在激烈的市场竞争中", "方能立于不败之地"],
            "full_sentence": "企业唯有坚持自主创新，方能在激烈的市场竞争中立于不败之地。",
            "correct_order": [1, 0, 2, 3],
            "explanation_zh": "“唯有……方能……”固定条件句式。",
            "explanation_vi": "Cấu trúc '唯有……方能……' (chỉ có... mới có thể...).",
            "trap_analysis_vi": "Trật tự chủ ngữ '企业' và vế điều kiện '唯有...'.",
        }
        ok, reason = validate_question(data, expected_level=6)
        assert ok is True
        assert reason == "Valid"

    def test_writing_duplicate_chunks_rejected(self):
        """Writing question with duplicate chunks must be rejected."""
        data = {
            "level": 6,
            "type": "writing",
            "question": "请连词成句：",
            "chunks": ["企业", "企业", "方能立于不败之地"],
            "explanation_zh": "解析",
            "explanation_vi": "Giải thích",
            "trap_analysis_vi": "Phân tích",
        }
        ok, reason = validate_question(data, expected_level=6)
        assert ok is False
        assert "duplicate chunks" in reason.lower()

    def test_writing_too_few_chunks_rejected(self):
        """Writing question with fewer than 3 chunks must be rejected."""
        data = {
            "level": 6,
            "type": "writing",
            "question": "请连词成句：",
            "chunks": ["企业", "创新"],
            "explanation_zh": "解析",
            "explanation_vi": "Giải thích",
            "trap_analysis_vi": "Phân tích",
        }
        ok, reason = validate_question(data, expected_level=6)
        assert ok is False
        assert "at least 3-5 chunks" in reason.lower()


# ============================================================================
# Section 3: Image URL Service Stress Testing (build_pollinations_url)
# ============================================================================

class TestImageServiceAdversarial:
    """Stress tests for build_pollinations_url."""

    def test_basic_url_structure(self):
        """Verify URL components, protocol, host, query parameters."""
        prompt = "a girl reading a book in library"
        url = build_pollinations_url(prompt, width=512, height=512)
        assert url.startswith("https://image.pollinations.ai/prompt/")
        assert "width=512" in url
        assert "height=512" in url
        assert "nologo=true" in url

    def test_slash_in_prompt_unencoded_in_path_vulnerability(self):
        """
        Adversarial finding (VULNERABILITY): prompt containing slashes like 'teacher / student in 24/7 store'.
        urllib.parse.quote by default leaves '/' unencoded (safe='/').
        Because prompt is placed in the URL path (/prompt/{encoded_prompt}),
        unescaped '/' causes HTTP routing ambiguity (treating it as multiple path segments).
        """
        prompt = "teacher / student in a 24/7 convenience store"
        url = build_pollinations_url(prompt)
        parsed = urllib.parse.urlparse(url)
        path_prompt = parsed.path.replace("/prompt/", "")
        assert "/" not in path_prompt, "Slashes in prompt must be percent-encoded (%2F) in URL path"
        assert "%2F" in url

    def test_special_characters_url_encoding(self):
        """Test symbols such as ?, &, #, %, +, quotes, and newlines."""
        prompt = 'Scene with #1 item: 50% discount & "special" gifts? Yes + No!\nNext line.'
        url = build_pollinations_url(prompt)
        assert "https://image.pollinations.ai/prompt/" in url
        # Query delimiters in prompt should be encoded in path
        assert "#" not in urllib.parse.urlparse(url).path
        parts = url.split("?")
        assert len(parts) == 2, f"Extra unencoded '?' in URL: {url}"

    def test_non_ascii_and_emojis(self):
        """Test Chinese characters, Vietnamese accents, and emojis in image prompt."""
        prompt = "一位中国老师在教室讲课 👩‍🏫，học sinh chăm chú lắng nghe 🎒."
        url = build_pollinations_url(prompt)
        assert url.startswith("https://image.pollinations.ai/prompt/")
        # Verify valid URL characters only (no raw emojis or non-ASCII in URL string)
        url.encode("ascii")  # Should not raise UnicodeEncodeError

    def test_style_prefix_idempotence(self):
        """Verify that style prefix is not duplicated if prompt already has it."""
        # Exact prefix
        p1 = f"{STYLE_PREFIX}a dog running in the park"
        url1 = build_pollinations_url(p1)
        decoded1 = urllib.parse.unquote(url1)
        assert decoded1.count("Minimalist 2D vector art") == 1

        # Prefix without trailing comma/space
        p2 = "Minimalist 2D vector art, clean lines, educational textbook illustration, flat colors, white background"
        url2 = build_pollinations_url(p2)
        decoded2 = urllib.parse.unquote(url2)
        assert decoded2.count("Minimalist 2D vector art") == 1

    def test_style_prefix_case_sensitivity_behavior(self):
        """
        Adversarial case: lowercase prefix 'minimalist 2d vector art...'.
        Line 26 uses exact case startswith('Minimalist 2D vector art'), so prefix will be prepended.
        """
        p = "minimalist 2d vector art, clean lines"
        url = build_pollinations_url(p)
        decoded = urllib.parse.unquote(url)
        # Both uppercase prefix and lowercase prompt exist
        assert decoded.count("Minimalist 2D vector art") == 1
        assert "minimalist 2d vector art" in decoded

    def test_empty_and_none_prompt(self):
        """Verify handling of empty string or None prompt."""
        url_empty = build_pollinations_url("")
        assert url_empty.startswith("https://image.pollinations.ai/prompt/")
        assert "width=512" in url_empty

        url_none = build_pollinations_url(None)
        assert url_none.startswith("https://image.pollinations.ai/prompt/")

    def test_custom_and_extreme_dimensions(self):
        """Test portrait, landscape, and extreme dimension values."""
        # Landscape
        url_land = build_pollinations_url("scenery", width=1024, height=576)
        assert "width=1024" in url_land
        assert "height=576" in url_land

        # Portrait
        url_port = build_pollinations_url("scenery", width=600, height=800)
        assert "width=600" in url_port
        assert "height=800" in url_port

        # Extreme dimensions
        url_min = build_pollinations_url("scenery", width=1, height=1)
        assert "width=1" in url_min
        assert "height=1" in url_min


if __name__ == "__main__":
    sys.exit(pytest.main(["-v", __file__]))
