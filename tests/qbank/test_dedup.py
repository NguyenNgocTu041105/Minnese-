from qbank.dedup import (
    compute_content_hash,
    extract_ngrams,
    jaccard_similarity,
    check_near_duplicate,
)
from qbank.models import QbQuestion


def test_compute_content_hash_matches_model():
    stem = "今天天气很好，我想去借书。"
    options = ["学校", "老师", "朋友", "准备"]
    ans = 0

    h1 = compute_content_hash(stem, options, ans)
    h2 = QbQuestion.compute_hash(stem, options, ans)
    assert h1 == h2
    assert len(h1) == 64


def test_extract_ngrams_strips_noise():
    # Punctuation and whitespace should be stripped
    text = "今天天气很好！ 123 ____"
    ngrams = extract_ngrams(text, n=4)
    # "今天天气很好" -> length 6 -> 4-grams: "今天天气", "天天气很", "天气很好"
    assert ngrams == {"今天天气", "天天气很", "天气很好"}


def test_jaccard_similarity():
    s1 = {"abc", "def", "ghi"}
    s2 = {"abc", "def", "xyz"}
    # intersection: 2, union: 4 -> 0.5
    assert jaccard_similarity(s1, s2) == 0.5
    assert jaccard_similarity(set(), s2) == 0.0
    assert jaccard_similarity(s1, s1) == 1.0


def test_check_near_duplicate():
    existing = [
        "今天天气很好，我们去学校看书吧。",
        "老师正在教室里给学生讲课。"
    ]

    # Highly similar (near duplicate)
    cand_dup = "今天天气很好，我们去学校看书。"
    is_dup, score, matched = check_near_duplicate(cand_dup, existing, threshold=0.7)
    assert is_dup is True
    assert score >= 0.7
    assert matched == existing[0]

    # Distinct stem
    cand_distinct = "我想买一部新手机。"
    is_dup2, score2, matched2 = check_near_duplicate(cand_distinct, existing, threshold=0.7)
    assert is_dup2 is False
    assert score2 < 0.7


def test_get_comparable_stem_fill_blank():
    from qbank.dedup import get_comparable_stem
    stem = "我想去____借书。"
    options = ["图书馆", "学校", "银行", "医院"]
    # With answer_index=0 -> '图书馆' fills the blank
    filled = get_comparable_stem(stem, options, 0)
    assert filled == "我想去图书馆借书。"

    # Non-fill-blank or missing options -> returns original
    assert get_comparable_stem("今天天气很好。") == "今天天气很好。"


def test_get_comparable_stem_blank_variations_match_standard_blank():
    """Verify that ___, （ ）, (), and variations produce identical comparable stem to ____."""
    from qbank.dedup import get_comparable_stem
    options = ["学校", "医院", "银行", "商店"]
    ans_idx = 0

    stem_std = "王老师在____上课。"
    stem_3under = "王老师在___上课。"
    stem_cn_space = "王老师在（ ）上课。"
    stem_cn_multispace = "王老师在（   ）上课。"
    stem_en_empty = "王老师在()上课。"
    stem_en_space = "王老师在( )上课。"

    expected = "王老师在学校上课。"

    comp_std = get_comparable_stem(stem_std, options, ans_idx)
    comp_3under = get_comparable_stem(stem_3under, options, ans_idx)
    comp_cn_space = get_comparable_stem(stem_cn_space, options, ans_idx)
    comp_cn_multispace = get_comparable_stem(stem_cn_multispace, options, ans_idx)
    comp_en_empty = get_comparable_stem(stem_en_empty, options, ans_idx)
    comp_en_space = get_comparable_stem(stem_en_space, options, ans_idx)

    assert comp_std == expected
    assert comp_3under == expected
    assert comp_cn_space == expected
    assert comp_cn_multispace == expected
    assert comp_en_empty == expected
    assert comp_en_space == expected

    # Verify near-duplicate detection between ____ and ()
    is_dup, sim, matched = check_near_duplicate(comp_en_empty, [comp_std], threshold=0.8)
    assert is_dup is True
    assert sim == 1.0
    assert matched == comp_std


def test_extract_ngrams_adaptive_short_sentences():
    # Very short sentence (HSK 1: 4 chars) -> adapts to 2-grams
    short_text = "他是老师。"
    ngrams = extract_ngrams(short_text)
    # len("他是老师") = 4 -> 2-grams: {"他是", "是老", "老师"}
    assert "他是" in ngrams
    assert "老师" in ngrams
    assert len(ngrams) == 3


def test_check_near_duplicate_configurable_threshold():
    existing = ["今天我们去学校。"]
    cand = "今天我们去教室。"
    # At strict 0.95 threshold -> not near duplicate
    is_dup_strict, score, _ = check_near_duplicate(cand, existing, threshold=0.95)
    assert is_dup_strict is False

    # At loose 0.40 threshold -> flagged as near duplicate
    is_dup_loose, score, _ = check_near_duplicate(cand, existing, threshold=0.40)
    assert is_dup_loose is True

