import os
import re
import unicodedata

from typing import List, Tuple, Set, Optional
import jieba
from qbank.config import qbank_config
from qbank.syllabus import QbSyllabus


# Regex to match punctuation, digits, whitespace, and blank markers
PUNCTUATION_AND_NOISE_REGEX = re.compile(
    r"^[\s\d０-９_\-—–…\.,\?!;:\"'“”‘’（）\(\)\[\]\{\}《》〈〉·、。，？！：；／\\~]+$"
)


# Regex to match allowed characters: Chinese Hanzi, basic punctuation, blanks, whitespace, digits
CHINESE_CHAR_RANGE = r"\u4e00-\u9fff"
ALLOWED_PUNCTUATION = r"。，、！？；：‘’“”'\"…—–·《》〈〉\.,\?!;:/\-~\s\d０-９\(\)（）\[\]\{\}"
# Disallowed Latin or accented characters (e.g. English, Vietnamese)
DISALLOWED_CHARS_REGEX = re.compile(r"[a-zA-ZàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ]")

# Regex to detect bracketed notes/annotations in stem/options, e.g. (gợi ý), （cái này...）
BRACKET_NOTE_REGEX = re.compile(r"[\(（\[\{][^\)）\]\}]*[a-zA-ZàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ]+[\)）\]\}]")


def is_chinese_char(ch: str) -> bool:
    """Checks if a character is a Chinese Hanzi character."""
    return "\u4e00" <= ch <= "\u9fff"


def validate_clean_characters(stem: str, options: List[str]) -> Tuple[bool, List[str]]:
    """
    Validates that stem and options contain ONLY Chinese characters, standard Chinese/ASCII
    punctuation, digits, and blank placeholder markers ('____').
    Rejects or flags any Latin characters, Vietnamese characters, or bracketed annotations.
    """
    notes: List[str] = []

    # 1. Check stem for bracketed notes
    if BRACKET_NOTE_REGEX.search(stem):
        notes.append("Câu dẫn chứa ghi chú/gợi ý trong ngoặc.")

    # 2. Check stem for Latin/Vietnamese characters
    stem_disallowed = set(DISALLOWED_CHARS_REGEX.findall(stem))
    if stem_disallowed:
        notes.append(f"Câu dẫn chứa ký tự không hợp lệ (Latin/Vi): {', '.join(sorted(stem_disallowed))}")

    # 3. Check each option
    for idx, opt in enumerate(options):
        opt_disallowed = set(DISALLOWED_CHARS_REGEX.findall(opt))
        if opt_disallowed:
            notes.append(f"Phương án {chr(65 + idx)} ('{opt}') chứa ký tự không hợp lệ: {', '.join(sorted(opt_disallowed))}")
        if BRACKET_NOTE_REGEX.search(opt):
            notes.append(f"Phương án {chr(65 + idx)} chứa ghi chú/gợi ý trong ngoặc.")

    return len(notes) == 0, notes


def validate_structure(
    stem: str,
    options: List[str],
    answer_index: int,
    explanation_vi: str
) -> Tuple[bool, List[str]]:
    """
    Validates general question structure:
    - Non-empty stem
    - Exactly 4 non-empty, distinct options
    - Valid answer index in [0..3]
    - Non-empty Vietnamese explanation
    """
    notes: List[str] = []

    if not stem or not stem.strip():
        notes.append("Stem (câu dẫn) không được để trống.")

    if not options or len(options) != 4:
        notes.append(f"Phải có đúng 4 phương án lựa chọn (nhận được {len(options) if options else 0}).")
    else:
        norm_opts = [unicodedata.normalize("NFC", o.strip()) for o in options]
        if any(not o for o in norm_opts):
            notes.append("Không được có phương án lựa chọn rỗng.")
        if len(set(norm_opts)) != 4:
            notes.append("Các phương án lựa chọn không được trùng lặp nội dung.")

    if answer_index not in (0, 1, 2, 3):
        notes.append(f"Chỉ số đáp án đúng (answer_index={answer_index}) không hợp lệ (phải từ 0 đến 3).")

    if not explanation_vi or len(explanation_vi.strip()) < 5:
        notes.append("Giải thích bằng tiếng Việt (explanation_vi) quá ngắn hoặc để trống.")

    return len(notes) == 0, notes


def validate_fill_blank(
    stem: str,
    options: List[str],
    answer_index: int,
    level: int = 1
) -> Tuple[bool, List[str]]:
    """
    Validates fill-in-the-blank specific constraints:
    1. Stem MUST contain EXACTLY ONE blank placeholder '____' (or '___' / '（ ）' / '( )').
    2. Stem length must be appropriate for the target level (e.g. HSK 1-2: 6 to 35 chars; HSK 3-4: 10 to 60 chars).
    3. The correct answer word must NOT already appear in the stem outside the blank.
    4. Options must be short words/phrases of comparable length (max diff <= 4 characters, none > 10 chars for HSK 1-2).
    """
    notes: List[str] = []
    norm_stem = unicodedata.normalize("NFC", stem)

    # 1. Check placeholder: must contain EXACTLY ONE blank
    # Standardize blank markers count
    blank_pattern = re.compile(r"_{3,}|（\s*）|\(\s*\)")
    blank_matches = blank_pattern.findall(norm_stem)
    if len(blank_matches) == 0:
        notes.append("Câu điền từ bắt buộc phải có chỗ trống ('____').")
    elif len(blank_matches) > 1:
        notes.append(f"Câu điền từ chỉ được có đúng 1 chỗ trống (phát hiện {len(blank_matches)} chỗ trống).")

    # 2. Check stem length according to level from config
    # Stem length excluding placeholder
    clean_stem_len = len(blank_pattern.sub("", norm_stem).strip())
    try:
        if level in (1, 2):
            bounds = [int(x) for x in qbank_config.stem_len_hsk12.split(",")]
        elif level in (3, 4):
            bounds = [int(x) for x in qbank_config.stem_len_hsk34.split(",")]
        else:
            bounds = [int(x) for x in qbank_config.stem_len_hsk56.split(",")]
        min_len, max_len = bounds[0], bounds[1]
    except Exception:
        min_len, max_len = (6, 35) if level in (1, 2) else ((8, 60) if level in (3, 4) else (10, 100))

    if clean_stem_len < min_len or clean_stem_len > max_len:
        notes.append(
            f"Độ dài câu dẫn ({clean_stem_len} ký tự) không nằm trong khoảng phù hợp cho HSK {level} ({min_len}..{max_len} ký tự)."
        )

    # 3. Check answer leakage in stem
    if 0 <= answer_index < len(options):
        ans_word = unicodedata.normalize("NFC", options[answer_index].strip())
        if ans_word:
            # Strip out blanks from stem to see if answer word appears outside the blank
            cleaned_stem = blank_pattern.sub("", norm_stem)
            if ans_word in cleaned_stem:
                notes.append(
                    f"Từ đáp án đúng '{ans_word}' đã xuất hiện sẵn trong câu dẫn bên ngoài chỗ trống."
                )

    # 4. Check option lengths (must be short and comparable in length) from config
    if options:
        opt_lens = [len(unicodedata.normalize("NFC", o.strip())) for o in options]
        max_opt_len = max(opt_lens)
        min_opt_len = min(opt_lens)
        len_diff = max_opt_len - min_opt_len

        max_allowed_len = qbank_config.option_max_len_hsk12 if level in (1, 2) else qbank_config.option_max_len_hsk36
        max_allowed_diff = qbank_config.option_max_len_diff

        if max_opt_len > max_allowed_len:
            notes.append(
                f"Phương án lựa chọn quá dài ({max_opt_len} ký tự, tối đa cho phép là {max_allowed_len})."
            )
        if len_diff > max_allowed_diff:
            notes.append(
                f"Độ dài các phương án quá chênh lệch (từ {min_opt_len} đến {max_opt_len} ký tự, chênh lệch > {max_allowed_diff})."
            )

    return len(notes) == 0, notes


NAMES_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "qbank", "syllabus", "names.txt")
_allowed_names_cache: Optional[Set[str]] = None


def get_allowed_names(names_path: Optional[str] = None) -> Set[str]:
    """Loads allowed proper names and place names from names.txt."""
    global _allowed_names_cache
    if names_path is not None:
        return _load_names_file(names_path)
    if _allowed_names_cache is None:
        _allowed_names_cache = _load_names_file(NAMES_FILE)
    return _allowed_names_cache


def _load_names_file(path: str) -> Set[str]:
    names: Set[str] = set()
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            for line in f:
                raw = line.strip()
                if raw and not raw.startswith("#"):
                    names.add(unicodedata.normalize("NFC", raw))
    return names


def validate_level(
    text: str,
    target_level: int,
    syllabus: QbSyllabus,
    threshold: Optional[float] = None,
    allowed_names: Optional[Set[str]] = None
) -> Tuple[bool, List[str], List[str]]:
    """
    Validates that Chinese text conforms to the target HSK level:
    - Uses jieba to segment text into words.
    - Strips punctuation, digits, whitespace, and blank placeholder markers.
    - Compares segmented words against syllabus vocabulary and allowed proper names.
    - Out-of-level ratio = len(out_of_level_words) / max(total_tokens, 1).
    - If ratio <= threshold, level_ok is True.
    """
    if threshold is None:
        threshold = qbank_config.out_of_level_threshold

    if allowed_names is None:
        allowed_names = get_allowed_names()

    notes: List[str] = []
    norm_text = unicodedata.normalize("NFC", text)
    tokens = jieba.lcut(norm_text)

    allowed_words = syllabus.get_allowed_words_set(target_level)

    chinese_tokens: List[str] = []
    out_of_level_words: List[str] = []

    for tok in tokens:
        tok_clean = tok.strip()
        # Ignore empty or pure noise/punctuation/numbers/blanks
        if not tok_clean or PUNCTUATION_AND_NOISE_REGEX.match(tok_clean):
            continue
        # Only evaluate tokens containing Chinese characters
        if not any(is_chinese_char(c) for c in tok_clean):
            continue

        chinese_tokens.append(tok_clean)

        # Check in allowed set or allowed proper names
        if tok_clean in allowed_words or tok_clean in allowed_names:
            continue

        # Check if word has known level in syllabus
        word_lvl = syllabus.get_word_level(tok_clean)
        if word_lvl is not None and word_lvl <= target_level:
            continue

        # If multi-character token, check if all sub-characters are individually allowed up to target_level
        if len(tok_clean) > 1 and all(
            c in allowed_words or c in allowed_names or (syllabus.get_word_level(c) is not None and syllabus.get_word_level(c) <= target_level)
            for c in tok_clean if is_chinese_char(c)
        ):
            continue

        out_of_level_words.append(tok_clean)


    total_tokens = len(chinese_tokens)
    out_count = len(out_of_level_words)
    ratio = (out_count / total_tokens) if total_tokens > 0 else 0.0

    level_ok = ratio <= threshold
    if not level_ok:
        notes.append(
            f"Tỉ lệ từ vựng vượt cấp ({ratio:.1%}) vượt quá ngưỡng cho phép ({threshold:.1%}). "
            f"Các từ ngoài cấp: {', '.join(set(out_of_level_words))}"
        )

    return level_ok, list(set(out_of_level_words)), notes
