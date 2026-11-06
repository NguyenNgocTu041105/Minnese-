import os
import json
import logging
from typing import List, Dict, Set, Optional, Any
from qbank.models import QbVocabItem

logger = logging.getLogger("qbank.syllabus")


class QbSyllabus:
    """
    Loads, validates, and filters vocabulary syllabus for HSK 3.0.
    Strictly filters out any record with license_status in ('unknown', 'restricted').
    Also loads and indexes character syllabus (chars.jsonl) for character-level grading.
    """
    def __init__(
        self,
        vocab_file_path: Optional[str] = None,
        chars_file_path: Optional[str] = None
    ):
        if vocab_file_path is None:
            default_path = os.path.join(
                os.path.dirname(__file__), "..", "data", "qbank", "syllabus", "vocab.jsonl"
            )
            sample_path = os.path.join(
                os.path.dirname(__file__), "..", "data", "qbank", "syllabus", "vocab.sample.jsonl"
            )
            if not os.path.exists(default_path) and os.path.exists(sample_path):
                vocab_file_path = sample_path
            else:
                vocab_file_path = default_path
        self.vocab_file_path = os.path.abspath(vocab_file_path)

        if chars_file_path is None:
            default_chars = os.path.join(
                os.path.dirname(__file__), "..", "data", "qbank", "syllabus", "chars.jsonl"
            )
            sample_chars = os.path.join(
                os.path.dirname(__file__), "..", "data", "qbank", "syllabus", "chars.sample.jsonl"
            )
            if not os.path.exists(default_chars) and os.path.exists(sample_chars):
                chars_file_path = sample_chars
            else:
                chars_file_path = default_chars
        self.chars_file_path = os.path.abspath(chars_file_path) if chars_file_path else None

        self.items: List[QbVocabItem] = []
        self.rejected_records: List[Dict] = []
        self._level_map: Dict[int, List[QbVocabItem]] = {}
        self._word_level_map: Dict[str, int] = {}
        self._char_level_map: Dict[str, int] = {}
        self.load()

    def load(self) -> None:
        """Loads and filters vocabulary items and character recognition items from JSONL files."""
        self.items.clear()
        self.rejected_records.clear()
        self._level_map.clear()
        self._word_level_map.clear()
        self._char_level_map.clear()

        # 1. Load characters from chars_file_path if available
        if self.chars_file_path and os.path.exists(self.chars_file_path):
            try:
                with open(self.chars_file_path, "r", encoding="utf-8") as fc:
                    for line in fc:
                        raw = line.strip()
                        if not raw or raw.startswith("#"):
                            continue
                        try:
                            c_data = json.loads(raw)
                            ch = c_data.get("char")
                            lvl = c_data.get("level")
                            if ch and lvl is not None:
                                self._char_level_map[ch] = int(lvl)
                        except Exception:
                            pass
            except Exception as e:
                logger.warning(f"Error loading character syllabus from {self.chars_file_path}: {e}")

        # 2. Load vocabulary items from vocab_file_path
        if not os.path.exists(self.vocab_file_path):
            logger.warning(f"Syllabus file not found at {self.vocab_file_path}")
            return

        with open(self.vocab_file_path, "r", encoding="utf-8") as f:
            for line_idx, line in enumerate(f, start=1):
                raw = line.strip()
                if not raw or raw.startswith("#"):
                    continue
                try:
                    data = json.loads(raw)
                    # Missing license_status is considered "unknown" (rejected)
                    license_status = data.get("license_status") or "unknown"
                    data["license_status"] = license_status

                    # HARD CONSTRAINT: Reject unknown or restricted license records
                    if license_status in ("unknown", "restricted"):
                        self.rejected_records.append({
                            "line": line_idx,
                            "word": data.get("word"),
                            "reason": f"Disallowed license_status: {license_status}",
                            "raw": data
                        })
                        logger.info(f"Rejected unpermitted vocab '{data.get('word')}' at line {line_idx} (license: {license_status})")
                        continue

                    # Level must be an integer between 1 and 6
                    raw_level = data.get("level")
                    if raw_level is None or not str(raw_level).isdigit() or not (1 <= int(raw_level) <= 6):
                        self.rejected_records.append({
                            "line": line_idx,
                            "word": data.get("word"),
                            "reason": f"Invalid level value: {raw_level} (must be 1..6)",
                            "raw": data
                        })
                        continue
                    data["level"] = int(raw_level)

                    # Word is required
                    if not data.get("word"):
                        self.rejected_records.append({
                            "line": line_idx,
                            "word": None,
                            "reason": "Missing required field 'word'",
                            "raw": data
                        })
                        continue

                    item = QbVocabItem.model_validate(data)
                    self.items.append(item)
                    self._level_map.setdefault(item.level, []).append(item)

                    # RULE: If a word appears in multiple levels, resolve to the LOWEST level
                    if item.word in self._word_level_map:
                        self._word_level_map[item.word] = min(self._word_level_map[item.word], item.level)
                    else:
                        self._word_level_map[item.word] = item.level
                except Exception as e:
                    self.rejected_records.append({
                        "line": line_idx,
                        "reason": f"Parse/Validation error: {str(e)}",
                        "raw": raw
                    })
                    logger.error(f"Error parsing line {line_idx}: {e}")

    def get_stats(self) -> Dict[str, Any]:
        """Returns statistics of loaded vocabulary by level and rejection details."""
        by_level = {lvl: len(self._level_map.get(lvl, [])) for lvl in range(1, 7)}
        rejection_reasons: Dict[str, int] = {}
        for rej in self.rejected_records:
            r = rej.get("reason", "Unknown error")
            rejection_reasons[r] = rejection_reasons.get(r, 0) + 1

        return {
            "vocab_file": self.vocab_file_path,
            "total_valid_items": len(self.items),
            "by_level": by_level,
            "total_rejected": len(self.rejected_records),
            "rejections": self.rejected_records,
            "rejection_summary": rejection_reasons
        }

    def get_vocab_for_level(self, level: int) -> List[QbVocabItem]:
        """Returns vocabulary items for a specific level."""
        return self._level_map.get(level, [])

    def get_vocab_up_to_level(self, level: int) -> List[QbVocabItem]:
        """Returns all vocabulary items up to and including the specified level."""
        res: List[QbVocabItem] = []
        for lvl in range(1, level + 1):
            res.extend(self._level_map.get(lvl, []))
        return res

    def get_allowed_words_set(self, up_to_level: int) -> Set[str]:
        """Returns a set of allowed Chinese words up to the given level."""
        return {item.word for item in self.get_vocab_up_to_level(up_to_level)}

    def get_word_level(self, word: str) -> Optional[int]:
        """Looks up the HSK level of a word, or None if not found in syllabus."""
        return self._word_level_map.get(word)

    def get_char_level(self, char: str) -> Optional[int]:
        """Looks up the HSK level of a single Chinese character, or None if ungraded."""
        return self._char_level_map.get(char)

    def get_char_count(self) -> int:
        """Returns total number of recognition characters loaded."""
        return len(self._char_level_map)

    def get_chars_up_to_level(self, up_to_level: int) -> Set[str]:
        """Returns set of all recognition characters up to and including the specified level."""
        return {ch for ch, lvl in self._char_level_map.items() if lvl <= up_to_level}

    def get_words_by_level(self, level: int) -> List[str]:
        """Returns list of unique words for a specific level."""
        seen = set()
        res = []
        for item in self.get_vocab_for_level(level):
            if item.word not in seen:
                seen.add(item.word)
                res.append(item.word)
        return res


_syllabus_instance: Optional[QbSyllabus] = None


def get_syllabus(
    vocab_file_path: Optional[str] = None,
    chars_file_path: Optional[str] = None
) -> QbSyllabus:
    """Lazy loader for QbSyllabus singleton."""
    global _syllabus_instance
    if vocab_file_path is not None or chars_file_path is not None:
        return QbSyllabus(vocab_file_path=vocab_file_path, chars_file_path=chars_file_path)
    if _syllabus_instance is None:
        _syllabus_instance = QbSyllabus()
    return _syllabus_instance
