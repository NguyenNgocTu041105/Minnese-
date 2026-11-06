import re
import unicodedata
from typing import Set, List, Tuple, Optional
from qbank.config import qbank_config
from qbank.models import QbQuestion


CLEAN_TEXT_REGEX = re.compile(r"[\s\d_\-—–…\.,\?!;:\"'“”‘’（）\(\)\[\]\{\}《》〈〉·、。，？！：；／\\~]+")


def compute_content_hash(stem: str, options: List[str], answer_index: int) -> str:
    """Computes SHA-256 NFC content hash matching QbQuestion specification."""
    return QbQuestion.compute_hash(stem, options, answer_index)


def get_comparable_stem(
    stem: str,
    options: Optional[List[str]] = None,
    answer_index: Optional[int] = None
) -> str:
    """
    Prepares stem for near-duplicate comparison.
    For fill-in-the-blank questions:
    Replaces the placeholder '____' (or '___') with the correct option to compare
    the full underlying sentence ('filled stem'), preventing false negatives
    where two questions have identical sentences with differing blank placements.
    """
    if options and answer_index is not None and 0 <= answer_index < len(options):
        ans = options[answer_index].strip()
        return re.sub(r"_{3,}|（\s*）|\(\s*\)", ans, stem, count=1)
    return stem


def extract_ngrams(text: str, n: Optional[int] = None) -> Set[str]:
    """
    Extracts character-level n-grams from Chinese text.
    Punctuation, digits, placeholders, and whitespace are stripped prior to extraction.
    For short sentences (HSK 1-2, len <= 6), adapts n to 2 or 3 to prevent sparsity.
    """
    normalized = unicodedata.normalize("NFC", text)
    cleaned = CLEAN_TEXT_REGEX.sub("", normalized)

    if not cleaned:
        return set()

    # Adaptive n for short sentences (HSK 1-2)
    if n is None:
        if len(cleaned) <= 4:
            n = 2
        elif len(cleaned) <= 7:
            n = 3
        else:
            n = 4

    if len(cleaned) < n:
        return {cleaned}

    return {cleaned[i : i + n] for i in range(len(cleaned) - n + 1)}


def jaccard_similarity(s1: Set[str], s2: Set[str]) -> float:
    """Computes Jaccard similarity coefficient between two sets."""
    if not s1 or not s2:
        return 0.0
    intersection = s1.intersection(s2)
    union = s1.union(s2)
    return len(intersection) / len(union)


def check_near_duplicate(
    stem: str,
    existing_stems: List[str],
    threshold: Optional[float] = None,
    n: Optional[int] = None
) -> Tuple[bool, float, Optional[str]]:
    """
    Checks if a stem is a near-duplicate of any existing stem using Jaccard similarity.
    Returns:
        (is_near_dup, max_similarity, matched_stem)
    """
    if threshold is None:
        threshold = qbank_config.near_dup_threshold

    target_ngrams = extract_ngrams(stem, n=n)
    if not target_ngrams:
        return False, 0.0, None

    max_sim = 0.0
    best_match = None

    for existing in existing_stems:
        cand_ngrams = extract_ngrams(existing, n=n)
        sim = jaccard_similarity(target_ngrams, cand_ngrams)
        if sim > max_sim:
            max_sim = sim
            best_match = existing

        if max_sim >= threshold:
            return True, max_sim, best_match

    return max_sim >= threshold, max_sim, best_match

