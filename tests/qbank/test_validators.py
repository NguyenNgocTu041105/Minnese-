from qbank.validators import (
    validate_structure,
    validate_fill_blank,
    validate_level,
    validate_character_level,
    validate_clean_characters
)
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


def test_validate_structure_expected_options_two():
    # 2 options ok, answer_index 0 and 1 ok
    ok0, notes0 = validate_structure(
        stem="今天下雨了。",
        options=["对", "错"],
        answer_index=0,
        explanation_vi="Giải thích câu đúng.",
        expected_options=2
    )
    assert ok0 is True
    assert len(notes0) == 0

    ok1, notes1 = validate_structure(
        stem="今天下雨了。",
        options=["对", "错"],
        answer_index=1,
        explanation_vi="Giải thích câu sai.",
        expected_options=2
    )
    assert ok1 is True
    assert len(notes1) == 0

    # answer_index=2 rejected
    ok2, notes2 = validate_structure(
        stem="今天下雨了。",
        options=["对", "错"],
        answer_index=2,
        explanation_vi="Giải thích câu sai.",
        expected_options=2
    )
    assert ok2 is False
    assert any("answer_index" in n for n in notes2)

    # 3 options when expected 2 rejected
    ok3, notes3 = validate_structure(
        stem="今天下雨了。",
        options=["对", "错", "不知道"],
        answer_index=0,
        explanation_vi="Giải thích câu sai.",
        expected_options=2
    )
    assert ok3 is False
    assert any("2 phương án" in n for n in notes3)


def test_validate_structure_expected_options_five():
    opts = ["A_text", "B_text", "C_text", "D_text", "E_text"]
    # 5 options ok, answer_index=4 ok
    ok4, notes4 = validate_structure(
        stem="请选择对应的句子。",
        options=opts,
        answer_index=4,
        explanation_vi="Giải thích phương án E.",
        expected_options=5
    )
    assert ok4 is True
    assert len(notes4) == 0

    # answer_index=5 rejected
    ok5, notes5 = validate_structure(
        stem="请选择对应的句子。",
        options=opts,
        answer_index=5,
        explanation_vi="Giải thích phương án.",
        expected_options=5
    )
    assert ok5 is False
    assert any("answer_index" in n for n in notes5)

    # 4 options when expected 5 rejected
    ok_less, notes_less = validate_structure(
        stem="请选择对应的句子。",
        options=opts[:4],
        answer_index=0,
        explanation_vi="Giải thích phương án.",
        expected_options=5
    )
    assert ok_less is False
    assert any("5 phương án" in n for n in notes_less)


def test_validate_structure_expected_options_none_flexible_range():
    # 2 options ok
    ok2, notes2 = validate_structure(
        stem="这是一个判断题。",
        options=["是", "不是"],
        answer_index=0,
        explanation_vi="Giải thích chi tiết.",
        expected_options=None
    )
    assert ok2 is True
    assert len(notes2) == 0

    # 5 options ok
    ok5, notes5 = validate_structure(
        stem="这是一个五选题。",
        options=["一", "二", "三", "四", "五"],
        answer_index=4,
        explanation_vi="Giải thích chi tiết.",
        expected_options=None
    )
    assert ok5 is True
    assert len(notes5) == 0

    # 8 options ok
    ok8, notes8 = validate_structure(
        stem="这是一个八选题。",
        options=[f"选项{i}" for i in range(8)],
        answer_index=7,
        explanation_vi="Giải thích chi tiết.",
        expected_options=None
    )
    assert ok8 is True
    assert len(notes8) == 0

    # 1 option rejected
    ok1, notes1 = validate_structure(
        stem="这是一个单选题。",
        options=["唯一的选项"],
        answer_index=0,
        explanation_vi="Giải thích chi tiết.",
        expected_options=None
    )
    assert ok1 is False
    assert any("từ 2 đến 8" in n for n in notes1)

    # 9 options rejected
    ok9, notes9 = validate_structure(
        stem="选项过多的题目。",
        options=[f"选项{i}" for i in range(9)],
        answer_index=0,
        explanation_vi="Giải thích chi tiết.",
        expected_options=None
    )
    assert ok9 is False
    assert any("từ 2 đến 8" in n for n in notes9)


def test_validate_structure_default_rejects_greater_than_four():
    # Default expected_options=4 rejects 5 options
    ok, notes = validate_structure(
        stem="今天天气很好。",
        options=["A", "B", "C", "D", "E"],
        answer_index=0,
        explanation_vi="Giải thích chi tiết."
    )
    assert ok is False
    assert any("4 phương án" in n for n in notes)


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


def test_validate_character_level_simple_hsk1_passes():
    syllabus = QbSyllabus()
    # "爸爸喝水。" contains 爸(L1), 爸(L1), 喝(L1), 水(L1)
    ok, details, notes = validate_character_level(
        text="爸爸喝水。",
        target_level=1,
        syllabus=syllabus,
        char_budget=0.05
    )
    assert ok is True
    assert details["ratio"] <= 0.05
    assert len(details["over_level_chars"]) == 0


def test_validate_character_level_hsk5_char_flagged_in_hsk1():
    syllabus = QbSyllabus()
    # Contains 揭 (Level 5) and 憾 (Level 5)
    text = "这项研究揭示了遗憾。"
    ok, details, notes = validate_character_level(
        text=text,
        target_level=1,
        syllabus=syllabus,
        char_budget=0.05
    )
    assert ok is False
    assert details["ratio"] > 0.05
    assert len(details["over_level_chars"]) > 0
    assert any("vượt quá ngân sách" in n for n in notes)


def test_validate_character_level_proper_names_exempted():
    syllabus = QbSyllabus()
    # "李华" is an allowed name in names.txt.
    # In syllabus chars, 李 is L1, 华 is L3.
    # Because 李华 is exempted, it should not be penalized at Level 1!
    text = "李华在喝水。"
    ok, details, notes = validate_character_level(
        text=text,
        target_level=1,
        syllabus=syllabus,
        char_budget=0.05
    )
    assert ok is True
    assert details["ratio"] == 0.0
    assert len(details["over_level_chars"]) == 0




