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

