import pytest
from qbank.validators import validate_structure, validate_fill_blank, validate_level
from qbank.syllabus import QbSyllabus


def test_validate_structure_valid():
    ok, notes = validate_structure(
        stem="今天天气很好。",
        options=["学校", "老师", "学生", "朋友"],
        answer_index=0,
        explanation_vi="Đây là câu giải thích đầy đủ nghĩa."
    )
    assert ok is True
    assert len(notes) == 0


def test_validate_structure_invalid_options():
    # Only 3 options
    ok, notes = validate_structure(
        stem="今天天气很好。",
        options=["学校", "老师", "学生"],
        answer_index=0,
        explanation_vi="Giải thích chi tiết."
    )
    assert ok is False
    assert any("4 phương án" in n for n in notes)

    # Duplicate options
    ok, notes = validate_structure(
        stem="今天天气很好。",
        options=["学校", "学校", "学生", "朋友"],
        answer_index=0,
        explanation_vi="Giải thích chi tiết."
    )
    assert ok is False
    assert any("trùng lặp" in n for n in notes)


def test_validate_structure_invalid_answer_index():
    ok, notes = validate_structure(
        stem="今天天气很好。",
        options=["学校", "老师", "学生", "朋友"],
        answer_index=4,
        explanation_vi="Giải thích chi tiết."
    )
    assert ok is False
    assert any("answer_index" in n for n in notes)


def test_validate_fill_blank():
    # Valid
    ok, notes = validate_fill_blank(
        stem="我想去____买书。",
        options=["书店", "医院", "银行", "学校"],
        answer_index=0
    )
    assert ok is True
    assert len(notes) == 0

    # Missing placeholder
    ok, notes = validate_fill_blank(
        stem="我想去书店买书。",
        options=["书店", "医院", "银行", "学校"],
        answer_index=0
    )
    assert ok is False
    assert any("chỗ trống" in n for n in notes)

    # Answer leaked in stem outside placeholder
    ok, notes = validate_fill_blank(
        stem="我想去书店____买书。",
        options=["书店", "医院", "银行", "学校"],
        answer_index=0
    )
    assert ok is False
    assert any("xuất hiện sẵn" in n for n in notes)


def test_validate_level(test_syllabus):
    # Allowed level 1 text with punctuation, numbers, blank placeholder
    # Vocabulary in fixture: 学校, 老师, 学生, 朋友, 借, 书, 今天, 很好, 去
    sample_text = "今天天气很好，我们去学校____借两本书。123！"
    ok, out_words, notes = validate_level(
        text=sample_text,
        target_level=1,
        syllabus=test_syllabus,
        threshold=0.5
    )
    # Threshold 0.5 allows common filler words while ignoring punctuation/numbers
    assert isinstance(ok, bool)
    assert isinstance(out_words, list)

    # Completely out-of-level rare words with threshold 0.0
    rare_text = "量子力学与生物化学的微观机制。"
    ok_rare, out_rare, notes_rare = validate_level(
        text=rare_text,
        target_level=1,
        syllabus=test_syllabus,
        threshold=0.0
    )
    assert ok_rare is False
    assert len(out_rare) > 0
    assert any("Tỉ lệ từ vựng vượt cấp" in n for n in notes_rare)


def test_validate_level_ignores_punctuation_numbers_and_blanks(test_syllabus):
    # All words (学校, 老师, 学生, 朋友) are strictly in level 1 syllabus
    # Noise: Chinese punctuation (、，！？。), English punctuation (,?!.), digits (123 456), blanks (____)
    clean_vocab_with_heavy_noise = "学校、老师，学生！朋友？ 123 456 ____ 。"
    ok, out_words, notes = validate_level(
        text=clean_vocab_with_heavy_noise,
        target_level=1,
        syllabus=test_syllabus,
        threshold=0.0
    )
    assert ok is True
    assert out_words == []
    assert notes == []


def test_validate_level_allows_proper_names_from_names_txt(test_syllabus):
    # Sentence contains allowed names (李华, 王老师, 北京) and level 1 words (学校, 老师)
    sentence_with_names = "李华、王老师、北京、学校。"
    ok, out_words, notes = validate_level(
        text=sentence_with_names,
        target_level=1,
        syllabus=test_syllabus,
        threshold=0.0
    )
    assert ok is True
    assert out_words == []
    assert notes == []


def test_validate_clean_characters_valid():
    from qbank.validators import validate_clean_characters

    # Pure Chinese sentence, valid punctuation and placeholder ____
    ok, notes = validate_clean_characters(
        stem="今天天气很好，我想去____买两本书。",
        options=["书店", "学校", "医院", "饭馆"]
    )
    assert ok is True
    assert notes == []


def test_validate_clean_characters_rejects_latin_and_needle():
    from qbank.validators import validate_clean_characters

    # Stem containing English noise 'needle'
    ok, notes = validate_clean_characters(
        stem="我想____水 needle",
        options=["喝", "吃", "看", "听"]
    )
    assert ok is False
    assert any("Latin/Vi" in n for n in notes)

    # Stem containing Vietnamese/bracket noise 'cái này/người này...'
    ok2, notes2 = validate_clean_characters(
        stem="cái này/người này... 这个人是____。",
        options=["老师", "学生", "医生", "朋友"]
    )
    assert ok2 is False
    assert any("Latin/Vi" in n for n in notes2)

    # Option containing bracketed translation note
    ok3, notes3 = validate_clean_characters(
        stem="这个人是____。",
        options=["老师 (teacher)", "学生", "医生", "朋友"]
    )
    assert ok3 is False
    assert any("chứa ký tự không hợp lệ" in n or "ngoặc" in n for n in notes3)


def test_validate_fill_blank_additional_constraints():
    from qbank.validators import validate_fill_blank

    # 1. Multiple blanks rejected
    ok, notes = validate_fill_blank(
        stem="我是____，他是____。",
        options=["学生", "老师", "医生", "朋友"],
        answer_index=0,
        level=1
    )
    assert ok is False
    assert any("đúng 1 chỗ trống" in n for n in notes)

    # 2. Stem too short for HSK 1 (< 6 chars)
    ok_short, notes_short = validate_fill_blank(
        stem="我是____。",
        options=["学生", "老师", "医生", "朋友"],
        answer_index=0,
        level=1
    )
    assert ok_short is False
    assert any("Độ dài câu dẫn" in n for n in notes_short)

    # 3. Stem too long for HSK 1 (> 35 chars)
    long_stem = "今天天气非常非常非常好，我和我的好朋友一起高高兴兴地去学校图书馆借了两本很有意思的汉语书____。"
    ok_long, notes_long = validate_fill_blank(
        stem=long_stem,
        options=["学习", "看书", "写字", "唱歌"],
        answer_index=0,
        level=1
    )
    assert ok_long is False
    assert any("Độ dài câu dẫn" in n for n in notes_long)

    # 4. Options length difference too large (> 3 chars diff)
    ok_diff, notes_diff = validate_fill_blank(
        stem="今天天气很好，我想去____。",
        options=["书", "图书馆阅览室", "学校", "医院"],
        answer_index=2,
        level=1
    )
    assert ok_diff is False
    assert any("Độ dài các phương án quá chênh lệch" in n or "quá dài" in n for n in notes_diff)



