import os
import re
import csv
import io
import json
import shutil
import logging
import unicodedata
from datetime import datetime
from typing import List, Dict, Optional, Tuple, Any, Set
from dataclasses import dataclass, field

import pypinyin

from qbank.models import QbVocabItem

logger = logging.getLogger("qbank.vocab_importer")

HANZI_REGEX = re.compile(r"^[\u4e00-\u9fff\u3400-\u4dbf\u3007]+$")

ZH_NUM_MAP = {
    "一": 1, "二": 2, "三": 3, "四": 4, "五": 5, "六": 6,
    "1": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6,
}

SECTION_HEADER_REGEX = re.compile(
    r"(?:hsk|level|cấp(?:\s*độ)?|band)?\s*([1-6一二三四五六])\s*(?:级|cấp|level)?",
    re.IGNORECASE
)

SYNONYMS_WORD = {
    "词", "词语", "生词", "từ", "từ vựng", "word", "words",
    "vocabulary", "vocab", "hanzi", "hán tự", "chữ hán", "汉字", "chinese"
}
SYNONYMS_PINYIN = {
    "拼音", "pinyin", "phát âm", "pronunciation", "reading", "py"
}
SYNONYMS_POS = {
    "词性", "từ loại", "pos", "part of speech", "type", "loại từ"
}
SYNONYMS_LEVEL = {
    "级别", "等级", "cấp độ", "cấp", "level", "hsk level", "hsk", "grade", "band", "bậc"
}


@dataclass
class VocabImportSummary:
    total_raw_rows: int = 0
    valid_items: List[QbVocabItem] = field(default_factory=list)
    rejected_rows: List[Dict[str, Any]] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    by_level: Dict[int, int] = field(default_factory=dict)
    rejected_by_reason: Dict[str, int] = field(default_factory=dict)
    merged_duplicates_count: int = 0
    split_variants_count: int = 0
    backup_file: Optional[str] = None
    saved_count: int = 0
    mode: str = "merge"
    output_path: str = ""
    rejected_csv_path: str = ""


class QbVocabImporter:
    """
    Imports and validates vocabulary datasets from CSV/TSV, XLSX, or PDF.
    Extracts columns, normalizes NFC, validates Hanzi and levels 1-6,
    cross-references pinyin with pypinyin, and handles merging/replacing.
    """

    def __init__(
        self,
        file_path: str,
        source: str,
        license_status: str,
        default_level: Optional[int] = None,
        column_map: Optional[str] = None,
        sheet_name: Optional[str] = None,
        mode: str = "merge",
        split_variants: bool = False,
        target_vocab_path: Optional[str] = None,
        rejected_csv_path: Optional[str] = None
    ):
        self.file_path = os.path.abspath(file_path)
        self.source = source.strip()
        self.license_status = license_status.strip().lower()
        self.default_level = default_level
        self.column_map_str = column_map
        self.sheet_name = sheet_name
        self.mode = mode.lower()
        self.split_variants = split_variants

        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        if target_vocab_path is None:
            self.target_vocab_path = os.path.join(base_dir, "data", "qbank", "syllabus", "vocab.jsonl")
        else:
            self.target_vocab_path = os.path.abspath(target_vocab_path)

        if rejected_csv_path is None:
            self.rejected_csv_path = os.path.join(base_dir, "data", "qbank", "syllabus", "vocab_rejected.csv")
        else:
            self.rejected_csv_path = os.path.abspath(rejected_csv_path)

        self._validate_init_params()

    def _validate_init_params(self) -> None:
        if not self.source:
            raise ValueError("Bắt buộc phải cung cấp tham số --source.")
        allowed_licenses = {"official", "permitted", "self-authored"}
        if not self.license_status or self.license_status not in allowed_licenses:
            raise ValueError(
                f"Giá trị --license-status '{self.license_status}' không hợp lệ. "
                f"Bắt buộc chọn một trong: {', '.join(sorted(allowed_licenses))}"
            )
        if self.default_level is not None and not (1 <= self.default_level <= 6):
            raise ValueError(f"Cấp độ --level {self.default_level} không hợp lệ (phải từ 1 đến 6).")
        if self.mode not in ("merge", "replace"):
            raise ValueError(f"Chế độ --mode '{self.mode}' không hợp lệ (phải là 'merge' hoặc 'replace').")
        if not os.path.exists(self.file_path):
            raise FileNotFoundError(f"Không tìm thấy file nguồn: {self.file_path}")

    @staticmethod
    def _read_csv_tsv(file_path: str) -> List[List[str]]:
        """Reads CSV/TSV with auto-detected encoding and delimiter."""
        with open(file_path, "rb") as f:
            raw_bytes = f.read()

        encodings = ["utf-8-sig", "utf-8", "gb18030", "gbk", "utf-16"]
        text: Optional[str] = None
        for enc in encodings:
            try:
                text = raw_bytes.decode(enc)
                break
            except UnicodeDecodeError:
                continue

        if text is None:
            raise ValueError(f"Không thể giải mã file {file_path} bằng các encoding phổ biến (utf-8, gbk, utf-16).")

        lines = [line for line in text.splitlines() if line.strip()]
        if not lines:
            return []

        # Guess delimiter by trying candidate characters
        candidates = [",", "\t", ";", "|"]
        best_delim = ","
        best_score = -1

        sample_lines = lines[:10]
        for delim in candidates:
            counts = [line.count(delim) for line in sample_lines]
            if len(counts) > 0 and counts[0] > 0 and len(set(counts)) == 1:
                # Perfectly uniform delimiter count across sample lines
                score = counts[0] * 10
            else:
                score = sum(counts)
            if score > best_score:
                best_score = score
                best_delim = delim

        reader = csv.reader(io.StringIO(text), delimiter=best_delim)
        return [[cell.strip() for cell in row] for row in reader if any(cell.strip() for cell in row)]

    def _read_xlsx(self, file_path: str) -> List[List[str]]:
        """Reads Excel .xlsx file using openpyxl (lazy loaded)."""
        try:
            import openpyxl
        except ImportError:
            raise ImportError("Thư viện openpyxl chưa được cài đặt. Vui lòng cài đặt: pip install openpyxl")

        wb = openpyxl.load_workbook(file_path, data_only=True)
        if self.sheet_name:
            if self.sheet_name not in wb.sheetnames:
                raise ValueError(
                    f"Sheet '{self.sheet_name}' không tồn tại. "
                    f"Các sheet hiện có trong file: {', '.join(wb.sheetnames)}"
                )
            sheet = wb[self.sheet_name]
        else:
            sheet = wb.active

        rows: List[List[str]] = []
        for row in sheet.iter_rows(values_only=True):
            clean_row = [str(cell).strip() if cell is not None else "" for cell in row]
            if any(clean_row):
                rows.append(clean_row)
        return rows

    @staticmethod
    def _read_pdf(file_path: str) -> List[List[str]]:
        """Reads text/tables from PDF using pdfplumber (lazy loaded). Rejects scanned PDFs."""
        try:
            import pdfplumber
        except ImportError:
            raise ImportError("Thư viện pdfplumber chưa được cài đặt. Vui lòng cài đặt: pip install pdfplumber")

        rows: List[List[str]] = []
        total_text_length = 0

        with pdfplumber.open(file_path) as pdf:
            if not pdf.pages:
                raise ValueError("File PDF rỗng, không có trang nào.")

            for page in pdf.pages:
                page_text = page.extract_text() or ""
                total_text_length += len(page_text.strip())

                # First try extracting structured tables
                tables = page.extract_tables()
                if tables:
                    for tbl in tables:
                        for r in tbl:
                            clean_r = [str(c).strip() if c is not None else "" for c in r]
                            if any(clean_r):
                                rows.append(clean_r)
                else:
                    # Fallback to lines of text
                    for line in page_text.splitlines():
                        line_str = line.strip()
                        if line_str:
                            # Split by multiple spaces or tabs
                            parts = re.split(r"\s{2,}|\t", line_str)
                            if len(parts) == 1:
                                parts = line_str.split()
                            rows.append([p.strip() for p in parts if p.strip()])

        if total_text_length == 0 and not rows:
            raise ValueError(
                "PDF không có lớp văn bản (có thể là file scan hoặc ảnh). "
                "Hệ thống không hỗ trợ OCR, vui lòng cung cấp file văn bản hoặc xuất sang CSV/XLSX."
            )

        return rows

    def load_raw_rows(self) -> List[List[str]]:
        """Dispatches file loader according to file extension."""
        ext = os.path.splitext(self.file_path)[1].lower()
        if ext in (".csv", ".tsv", ".txt"):
            return self._read_csv_tsv(self.file_path)
        elif ext in (".xlsx", ".xlsm"):
            return self._read_xlsx(self.file_path)
        elif ext == ".pdf":
            return self._read_pdf(self.file_path)
        else:
            # Default fallback to CSV/TSV parser
            return self._read_csv_tsv(self.file_path)

    @staticmethod
    def parse_column_map(map_str: str, header_row: List[str]) -> Dict[str, int]:
        """
        Parses custom mapping string like 'word=Từ,pinyin=Phát âm,level=Cấp độ'.
        Matches against header row column names or 0/1-based indices or column letters.
        """
        result: Dict[str, int] = {}
        header_lower = [h.strip().lower() for h in header_row]

        pairs = [p.strip() for p in map_str.split(",") if "=" in p]
        for pair in pairs:
            k, v = pair.split("=", 1)
            target_key = k.strip().lower()
            val = v.strip()

            # Try exact index (integer)
            if val.isdigit():
                idx = int(val)
                # Allow 0-based or 1-based index
                if 0 <= idx < len(header_row):
                    result[target_key] = idx
                elif 1 <= idx <= len(header_row):
                    result[target_key] = idx - 1
                continue

            # Try column letter (A, B, C...)
            if len(val) == 1 and val.upper() >= "A" and val.upper() <= "Z":
                col_idx = ord(val.upper()) - ord("A")
                if col_idx < len(header_row):
                    result[target_key] = col_idx
                    continue

            # Try matching header string
            val_lower = val.lower()
            if val_lower in header_lower:
                result[target_key] = header_lower.index(val_lower)
            else:
                # Partial match
                matched = False
                for i, h in enumerate(header_lower):
                    if val_lower in h:
                        result[target_key] = i
                        matched = True
                        break
                if not matched:
                    raise ValueError(f"Không tìm thấy cột '{val}' trong tiêu đề: {header_row}")

        return result

    @classmethod
    def detect_columns(cls, header_row: List[str], custom_map_str: Optional[str] = None) -> Tuple[Dict[str, int], bool]:
        """
        Detects column indices for word, pinyin, pos, and level.
        Returns (mapping_dict, is_header_consumed).
        """
        if custom_map_str:
            mapping = cls.parse_column_map(custom_map_str, header_row)
            if "word" not in mapping:
                raise ValueError("Ánh xạ --map bắt buộc phải chứa trường 'word' (ví dụ: --map word=Từ,pinyin=Phát_âm)")
            return mapping, True

        header_clean = [h.strip().lower() for h in header_row]
        mapping: Dict[str, int] = {}

        for idx, col in enumerate(header_clean):
            # Check Word
            if "word" not in mapping:
                for syn in SYNONYMS_WORD:
                    if syn == col or (len(syn) > 1 and syn in col):
                        mapping["word"] = idx
                        break

            # Check Pinyin
            if "pinyin" not in mapping:
                for syn in SYNONYMS_PINYIN:
                    if syn == col or (len(syn) > 1 and syn in col):
                        mapping["pinyin"] = idx
                        break

            # Check POS
            if "pos" not in mapping:
                for syn in SYNONYMS_POS:
                    if syn == col or (len(syn) > 1 and syn in col):
                        mapping["pos"] = idx
                        break

            # Check Level
            if "level" not in mapping:
                for syn in SYNONYMS_LEVEL:
                    if syn == col or (len(syn) > 1 and syn in col):
                        mapping["level"] = idx
                        break

        # If word column was successfully identified from header
        if "word" in mapping:
            return mapping, True

        # If header didn't match, maybe there is NO header row and first row is data
        # Check if first cell of row looks like Chinese word
        if header_row and HANZI_REGEX.match(header_row[0].strip()):
            # Fallback heuristic: col 0 = word, col 1 = pinyin (if Latin), col 2 = pos/level
            inferred = {"word": 0}
            if len(header_row) > 1:
                inferred["pinyin"] = 1
            if len(header_row) > 2:
                # Check if col 2 is digit (level)
                if header_row[2].strip().isdigit() and 1 <= int(header_row[2].strip()) <= 6:
                    inferred["level"] = 2
                else:
                    inferred["pos"] = 2
            if len(header_row) > 3 and "level" not in inferred:
                if header_row[3].strip().isdigit() and 1 <= int(header_row[3].strip()) <= 6:
                    inferred["level"] = 3
            return inferred, False

        raise ValueError(
            "Không thể tự động nhận diện cột từ tiêu đề. "
            "Vui lòng chỉ định ánh xạ cột qua tham số --map (ví dụ: --map word=Từ,pinyin=Phát_âm,level=Cấp_độ)"
        )

    @classmethod
    def extract_level(cls, text: str) -> Optional[int]:
        """Extracts integer level 1..6 from cell text or header string."""
        if not text:
            return None
        text_clean = text.strip()
        if text_clean.isdigit():
            val = int(text_clean)
            return val if 1 <= val <= 6 else None

        # Look for Chinese numbers or digits in text
        m = SECTION_HEADER_REGEX.search(text_clean)
        if m:
            num_str = m.group(1)
            return ZH_NUM_MAP.get(num_str)

        for zh_char, val in ZH_NUM_MAP.items():
            if zh_char in text_clean:
                return val

        return None

    @classmethod
    def is_section_header_row(cls, row: List[str]) -> Tuple[bool, Optional[int]]:
        """
        Determines if a row is a section divider header (e.g. ['HSK 1'] or ['一级']).
        Returns (is_section, detected_level).
        """
        non_empty = [c.strip() for c in row if c.strip()]
        if not non_empty or len(non_empty) > 3:
            return False, None

        full_text = " ".join(non_empty)
        # If it contains Chinese word like '你好' and also 'pinyin', it's not a section header
        if len(non_empty) >= 2 and HANZI_REGEX.match(non_empty[0]) and any(c.isascii() for c in non_empty[1]):
            return False, None

        level = cls.extract_level(full_text)
        if level is not None:
            # Check if text looks like section header keyword
            keywords = ["hsk", "level", "cấp", "级", "band", "đẳng"]
            if any(k in full_text.lower() for k in keywords) or full_text in ("1", "2", "3", "4", "5", "6"):
                return True, level

        return False, None

    @staticmethod
    def _verify_pinyin(word: str, user_pinyin: str) -> Optional[str]:
        """
        Compares user-provided pinyin with pypinyin.
        Returns a warning string if there is a divergence, or None if acceptable.
        """
        if not user_pinyin:
            return None

        # Generate expected tone marks from pypinyin
        py_tokens = pypinyin.pinyin(word, style=pypinyin.Style.TONE)
        expected = " ".join([t[0] for t in py_tokens if t])

        # Normalize strings for comparison (remove spaces, apostrophes, lowercase)
        def clean_py(s: str) -> str:
            return unicodedata.normalize("NFD", s).replace(" ", "").replace("'", "").lower()

        clean_user = clean_py(user_pinyin)
        clean_exp = clean_py(expected)

        if clean_user != clean_exp:
            return f"Pinyin '{user_pinyin}' có thể khác với pypinyin ('{expected}')"
        return None

    @staticmethod
    def _split_variants_helper(raw_word: str, raw_pinyin: str) -> List[Tuple[str, str]]:
        """
        Splits a word containing variants ('|', parentheses) into individual clean words and pinyin.
        e.g. '爸爸|爸', 'bàba|bà' -> [('爸爸', 'bàba'), ('爸', 'bà')]
        e.g. '第（第二）' -> [('第', pinyin), ('第二', pinyin)]
        e.g. '有（一）点儿' -> [('有一点儿', pinyin), ('有点儿', pinyin)]
        e.g. '称1' -> [('称', pinyin)]
        e.g. '…极了' -> [('极了', pinyin)]
        """
        word = raw_word.replace("…", "").strip()
        word = re.sub(r"\d+$", "", word).strip()

        # 1. Pipe variant (|)
        if "|" in word:
            w_parts = [p.strip() for p in word.split("|") if p.strip()]
            py_parts = [p.strip() for p in raw_pinyin.split("|") if p.strip()] if "|" in raw_pinyin else []
            res = []
            for i, wp in enumerate(w_parts):
                py = py_parts[i] if i < len(py_parts) else raw_pinyin
                res.append((wp, py))
            return res

        # 2. Parentheses variant
        m = re.match(r"^([^\(（]+)[\(（]([^\)）]+)[\)）](.*)$", word)
        if m:
            pre, inside, post = m.group(1).strip(), m.group(2).strip(), m.group(3).strip()
            if post:
                # Infix e.g. 有（一）点儿 -> 有一点儿, 有点儿
                return [(pre + inside + post, raw_pinyin), (pre + post, raw_pinyin)]
            else:
                # Suffix/example e.g. 第（第二） or 爸爸（爸）
                return [(pre, raw_pinyin), (inside, raw_pinyin)]

        return [(word, raw_pinyin)]

    def process(self, execute: bool = False) -> VocabImportSummary:
        """
        Executes full validation and import pipeline.
        If execute=False, runs in DRY-RUN mode.
        """
        raw_rows = self.load_raw_rows()
        summary = VocabImportSummary(
            total_raw_rows=len(raw_rows),
            mode=self.mode,
            output_path=self.target_vocab_path,
            rejected_csv_path=self.rejected_csv_path
        )

        if not raw_rows:
            return summary

        # 1. Column detection
        first_row = raw_rows[0]
        col_map, header_consumed = self.detect_columns(first_row, self.column_map_str)
        data_rows = raw_rows[1:] if header_consumed else raw_rows

        current_section_level = self.default_level
        parsed_items_by_word: Dict[str, QbVocabItem] = {}

        for line_idx, row in enumerate(data_rows, start=(2 if header_consumed else 1)):
            if not any(c.strip() for c in row):
                continue

            # Check if row is a section divider header (e.g. 'HSK 1' or '一级')
            is_sec, sec_level = self.is_section_header_row(row)
            if is_sec and sec_level is not None:
                current_section_level = sec_level
                continue

            # Extract fields
            word_idx = col_map.get("word", 0)
            pinyin_idx = col_map.get("pinyin")
            pos_idx = col_map.get("pos")
            level_idx = col_map.get("level")

            raw_word = row[word_idx].strip() if word_idx < len(row) else ""
            raw_pinyin = row[pinyin_idx].strip() if pinyin_idx is not None and pinyin_idx < len(row) else ""
            raw_pos = row[pos_idx].strip() if pos_idx is not None and pos_idx < len(row) else ""
            raw_level_str = row[level_idx].strip() if level_idx is not None and level_idx < len(row) else ""

            # Normalization NFC
            word = unicodedata.normalize("NFC", raw_word)
            pinyin = unicodedata.normalize("NFC", raw_pinyin)
            pos = unicodedata.normalize("NFC", raw_pos)

            # Determine Level
            level: Optional[int] = None
            if raw_level_str:
                level = self.extract_level(raw_level_str)
            if level is None:
                level = current_section_level

            # Validation 2: Level must be 1..6
            if level is None or not (1 <= level <= 6):
                self._reject_row(summary, line_idx, row, word, pinyin, level, f"Thiếu hoặc sai cấp độ HSK (1-6), nhận được: '{raw_level_str or level}'")
                continue

            # Variant expansion if enabled
            if self.split_variants:
                candidates = self._split_variants_helper(word, pinyin)
                if len(candidates) > 1:
                    summary.split_variants_count += len(candidates) - 1
            else:
                candidates = [(word, pinyin)]

            for sub_word, sub_pinyin in candidates:
                # Validation 1: Word must be strictly Hanzi
                if not sub_word:
                    self._reject_row(summary, line_idx, row, sub_word, sub_pinyin, level, "Từ bị để trống")
                    continue

                if not HANZI_REGEX.match(sub_word):
                    self._reject_row(summary, line_idx, row, sub_word, sub_pinyin, level, f"Từ chứa ký tự không phải chữ Hán: '{sub_word}'")
                    continue

                # Validation 3: Pinyin verification
                if sub_pinyin:
                    py_warn = self._verify_pinyin(sub_word, sub_pinyin)
                    if py_warn:
                        summary.warnings.append(f"Dòng {line_idx} ({sub_word}): {py_warn}")
                else:
                    # If pinyin is empty, generate default tone marks from pypinyin
                    py_tokens = pypinyin.pinyin(sub_word, style=pypinyin.Style.TONE)
                    sub_pinyin = " ".join([t[0] for t in py_tokens if t])

                item = QbVocabItem(
                    word=sub_word,
                    pinyin=sub_pinyin,
                    pos=pos,
                    level=level,
                    topics=[],
                    source=self.source,
                    license_status=self.license_status  # type: ignore
                )

                # RULE: Duplicate words -> keep the LOWEST level
                if sub_word in parsed_items_by_word:
                    summary.merged_duplicates_count += 1
                    existing = parsed_items_by_word[sub_word]
                    if item.level < existing.level:
                        parsed_items_by_word[sub_word] = item
                else:
                    parsed_items_by_word[sub_word] = item

        # Deduplicated batch valid items
        batch_items = list(parsed_items_by_word.values())
        summary.valid_items = batch_items

        # Count by level
        for item in batch_items:
            summary.by_level[item.level] = summary.by_level.get(item.level, 0) + 1

        # Handle Rejected Records logging
        if summary.rejected_rows:
            self._write_rejected_csv(summary.rejected_rows)

        # Handle Execution
        if execute:
            summary.backup_file = self._save_vocab_file(batch_items)
            summary.saved_count = len(batch_items)

        return summary

    def _reject_row(
        self,
        summary: VocabImportSummary,
        line_idx: int,
        row: List[str],
        word: Optional[str],
        pinyin: Optional[str],
        level: Optional[int],
        reason: str
    ) -> None:
        rec = {
            "line_or_row": line_idx,
            "word": word or "",
            "pinyin": pinyin or "",
            "level": level if level is not None else "",
            "reason": reason,
            "raw": " | ".join(row)
        }
        summary.rejected_rows.append(rec)
        summary.rejected_by_reason[reason] = summary.rejected_by_reason.get(reason, 0) + 1

    def _write_rejected_csv(self, rejected_rows: List[Dict[str, Any]]) -> None:
        """
        Writes rejected records to CSV file.
        Header contains standard word, pinyin, level columns followed by reason and raw line
        allowing direct manual correction and round-trip re-import via `import-vocab --mode merge`.
        """
        os.makedirs(os.path.dirname(self.rejected_csv_path), exist_ok=True)
        with open(self.rejected_csv_path, "w", encoding="utf-8-sig", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["word", "pinyin", "level", "reason", "line_number", "raw_row"])
            for r in rejected_rows:
                writer.writerow([r["word"], r["pinyin"], r["level"], r["reason"], r["line_or_row"], r["raw"]])


    def _save_vocab_file(self, new_items: List[QbVocabItem]) -> Optional[str]:
        """
        Saves vocabulary items to target vocab.jsonl.
        Creates backup file prior to write.
        Implements merge or replace mode.
        """
        os.makedirs(os.path.dirname(self.target_vocab_path), exist_ok=True)
        backup_path: Optional[str] = None

        existing_items: Dict[str, QbVocabItem] = {}
        if os.path.exists(self.target_vocab_path):
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_path = f"{self.target_vocab_path}.backup_{timestamp}"
            shutil.copy2(self.target_vocab_path, backup_path)

            if self.mode == "merge":
                with open(self.target_vocab_path, "r", encoding="utf-8") as f:
                    for line in f:
                        line_str = line.strip()
                        if not line_str or line_str.startswith("#"):
                            continue
                        try:
                            d = json.loads(line_str)
                            item = QbVocabItem.model_validate(d)
                            existing_items[item.word] = item
                        except Exception:
                            continue

        if self.mode == "merge":
            # Merge new items into existing items
            for item in new_items:
                if item.word in existing_items:
                    # Keep lowest level
                    old = existing_items[item.word]
                    lowest_level = min(old.level, item.level)
                    merged_item = item.model_copy(update={"level": lowest_level})
                    existing_items[item.word] = merged_item
                else:
                    existing_items[item.word] = item
            final_list = list(existing_items.values())
        else:
            # Replace mode: only new items
            final_list = new_items

        # Sort cleanly by level then word
        final_list.sort(key=lambda x: (x.level, x.word))

        with open(self.target_vocab_path, "w", encoding="utf-8") as f:
            for item in final_list:
                f.write(json.dumps(item.model_dump(), ensure_ascii=False) + "\n")

        return backup_path
