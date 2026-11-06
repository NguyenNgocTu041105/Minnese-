import os
import re
import json
import uuid
import hashlib
import sqlite3
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from pydantic import BaseModel, Field

from qbank.models import QbQuestion
from qbank.store import QbStore, get_store
from qbank.config import qbank_config

logger = logging.getLogger("qbank.bridge")


# =============================================================================
# 1. TOPIC MAPPING
# Map (skill, part_type) -> Legacy topic ('vocab', 'grammar', 'reading', 'listening')
# =============================================================================
TOPIC_MAP: Dict[Tuple[str, str], str] = {
    ("reading", "fill_blank"): "vocab",
    ("reading", "reading_part1"): "vocab",
    ("reading", "reading_comprehension"): "reading",
    ("vocabulary", "fill_blank"): "vocab",
    ("grammar", "fill_blank"): "grammar",
    ("listening", "listening_choice"): "listening",
}


def map_topic(skill: str, part_type: str) -> str:
    """Deterministically maps QBank skill and part_type to legacy topic."""
    return TOPIC_MAP.get((skill, part_type), "vocab")


# =============================================================================
# 2. LEGACY CONTENT HASH (Identical to crawler/deduplicator.py)
# =============================================================================
def compute_legacy_content_hash(hanzi_content: str, options: List[Dict[str, str]], correct_answer: str) -> str:
    """
    Computes legacy SHA-256 fingerprint matching crawler/deduplicator.py exactly:
    clean_content = re.sub(r'[\\s\\W_]+', '', hanzi_content)
    sorted_options = sorted([re.sub(r'[\\s\\W_]+', '', opt.get("text", "")) for opt in options])
    normalized_str = f"{clean_content}|{'|'.join(sorted_options)}|{correct_answer.strip().upper()}"
    """
    clean_content = re.sub(r"[\s\W_]+", "", hanzi_content)
    sorted_options = sorted([re.sub(r"[\s\W_]+", "", opt.get("text", "")) for opt in options])
    normalized_str = f"{clean_content}|{'|'.join(sorted_options)}|{correct_answer.strip().upper()}"
    return hashlib.sha256(normalized_str.encode("utf-8")).hexdigest()


# =============================================================================
# 3. OPTIONS FORMATTER (Legacy format with prefixes)
# =============================================================================
def format_legacy_options(options: List[str]) -> Tuple[List[Dict[str, str]], str]:
    """
    Formats 4 string options into legacy format:
    [{"key": "A", "text": "A. <text>"}, {"key": "B", "text": "B. <text>"}, ...]
    """
    legacy_opts = []
    for idx, opt in enumerate(options):
        key = chr(65 + idx)
        text_val = f"{key}. {opt.strip()}"
        legacy_opts.append({"key": key, "text": text_val})
    return legacy_opts, json.dumps(legacy_opts, ensure_ascii=False)


# =============================================================================
# 4. DATABASE ADAPTER
# Supports SQLite (default) and PostgreSQL backend
# =============================================================================
class QbLegacyDBAdapter:
    """
    Abstraction layer for legacy database access.
    Supports SQLite file directly or PostgreSQL cursor.
    """
    def __init__(self, sqlite_path: Optional[str] = None):
        self.sqlite_path = sqlite_path

    def get_existing_hashes_and_stems(self) -> Tuple[set, List[str]]:
        """Reads existing content_hash set and stems from legacy questions table."""
        existing_hashes = set()
        existing_stems = []

        if self.sqlite_path:
            # Direct SQLite connection (used in tests or custom path)
            with sqlite3.connect(self.sqlite_path, timeout=30.0) as conn:
                conn.execute("PRAGMA busy_timeout = 30000;")
                cur = conn.cursor()
                cur.execute("SELECT content_hash, hanzi_content FROM questions;")
                for r in cur.fetchall():
                    if r[0]:
                        existing_hashes.add(r[0])
                    if r[1]:
                        existing_stems.append(r[1])
        else:
            # Use connection via db.connection
            from db.connection import get_db_cursor
            with get_db_cursor() as cur:
                cur.execute("SELECT content_hash, hanzi_content FROM questions;")
                rows = cur.fetchall()
                for r in rows:
                    ch = r.get("content_hash") if isinstance(r, dict) else r[0]
                    hz = r.get("hanzi_content") if isinstance(r, dict) else r[1]
                    if ch:
                        existing_hashes.add(ch)
                    if hz:
                        existing_stems.append(hz)

        return existing_hashes, existing_stems

    def backup_sqlite(self) -> str:
        """Creates an online backup using sqlite3 backup API."""
        if self.sqlite_path:
            db_target = self.sqlite_path
        else:
            from db.connection import SQLITE_DB_PATH
            db_target = SQLITE_DB_PATH

        if not os.path.exists(db_target):
            raise FileNotFoundError(f"Target SQLite database not found for backup: {db_target}")

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = f"{db_target}.backup_{timestamp}"

        src_conn = sqlite3.connect(db_target, timeout=30.0)
        dst_conn = sqlite3.connect(backup_path, timeout=30.0)
        try:
            src_conn.execute("PRAGMA busy_timeout = 30000;")
            dst_conn.execute("PRAGMA busy_timeout = 30000;")
            src_conn.backup(dst_conn)
            logger.info(f"Successfully created SQLite backup at {backup_path}")
            return backup_path
        finally:
            dst_conn.close()
            src_conn.close()

    def insert_questions(self, questions_payload: List[Dict[str, Any]]) -> int:
        """
        Inserts questions into legacy table inside a single transaction.
        Handles placeholder differences (? for SQLite, %s for PostgreSQL).
        """
        if not questions_payload:
            return 0

        if self.sqlite_path:
            with sqlite3.connect(self.sqlite_path, timeout=30.0) as conn:
                conn.execute("PRAGMA busy_timeout = 30000;")
                cur = conn.cursor()
                sql = """
                    INSERT INTO questions (
                        id, hanzi_content, pinyin_text, options, correct_answer,
                        explanation, ai_explanation, hsk_level, topic, question_type,
                        media_url, passage_id, source_url, content_hash, status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
                """
                tuples = [
                    (
                        q["id"], q["hanzi_content"], q["pinyin_text"], q["options"], q["correct_answer"],
                        q["explanation"], q["ai_explanation"], q["hsk_level"], q["topic"], q["question_type"],
                        q["media_url"], q["passage_id"], q["source_url"], q["content_hash"], q["status"]
                    )
                    for q in questions_payload
                ]
                cur.executemany(sql, tuples)
                conn.commit()
                return cur.rowcount
        else:
            from db.connection import get_db_cursor
            with get_db_cursor(commit=True) as cur:
                sql = """
                    INSERT INTO questions (
                        id, hanzi_content, pinyin_text, options, correct_answer,
                        explanation, ai_explanation, hsk_level, topic, question_type,
                        media_url, passage_id, source_url, content_hash, status
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
                """
                tuples = [
                    (
                        q["id"], q["hanzi_content"], q["pinyin_text"], q["options"], q["correct_answer"],
                        q["explanation"], q["ai_explanation"], q["hsk_level"], q["topic"], q["question_type"],
                        q["media_url"], q["passage_id"], q["source_url"], q["content_hash"], q["status"]
                    )
                    for q in questions_payload
                ]
                cur.executemany(sql, tuples)
                return len(questions_payload)

    def retire_by_ids(self, legacy_ids: List[str]) -> int:
        """
        Retires questions in legacy DB by setting status = 'rejected'.
        Never DELETE rows.
        """
        if not legacy_ids:
            return 0

        if self.sqlite_path:
            with sqlite3.connect(self.sqlite_path, timeout=30.0) as conn:
                conn.execute("PRAGMA busy_timeout = 30000;")
                cur = conn.cursor()
                placeholders = ",".join(["?"] * len(legacy_ids))
                cur.execute(f"UPDATE questions SET status = 'rejected' WHERE id IN ({placeholders});", legacy_ids)
                conn.commit()
                return cur.rowcount
        else:
            from db.connection import get_db_cursor
            with get_db_cursor(commit=True) as cur:
                placeholders = ",".join(["%s"] * len(legacy_ids))
                cur.execute(f"UPDATE questions SET status = 'rejected' WHERE id IN ({placeholders});", legacy_ids)
                return len(legacy_ids)


# =============================================================================
# 5. BRIDGE SERVICE (QBank -> Legacy DB)
# =============================================================================
class QbSyncResult(BaseModel):
    batch_id: str
    total_eligible: int = 0
    synced_count: int = 0
    skipped_duplicate_hash: int = 0
    skipped_near_duplicate: int = 0
    skipped_blocked_flags: int = 0
    blocked_questions: List[Dict[str, str]] = Field(default_factory=list)
    is_dry_run: bool = True
    backup_file: Optional[str] = None
    records: List[Dict[str, Any]] = Field(default_factory=list)


_bridge_postgres_available_cache: Optional[bool] = None


def check_postgres_available() -> bool:
    """
    Checks if PostgreSQL is available with module-level caching in QBank bridge.
    Ensures db/connection.py is completely unmodified while avoiding repeated TCP timeouts.
    """
    global _bridge_postgres_available_cache
    if _bridge_postgres_available_cache is not None:
        return _bridge_postgres_available_cache
    try:
        from db.connection import is_postgres_available
        _bridge_postgres_available_cache = is_postgres_available()
    except Exception:
        _bridge_postgres_available_cache = False
    return _bridge_postgres_available_cache


class QbBridge:
    """
    Bridge connecting QBank isolated store to the legacy application database.
    One-way sync: only reads 'approved' questions from QBank, transforms and writes.
    """
    def __init__(
        self,
        store: Optional[QbStore] = None,
        adapter: Optional[QbLegacyDBAdapter] = None,
        is_postgres: Optional[bool] = None
    ):
        self.store = store or get_store()
        self.adapter = adapter or QbLegacyDBAdapter()
        self._is_postgres = is_postgres

    def sync(
        self,
        batch_id: Optional[str] = None,
        limit: Optional[int] = None,
        execute: bool = False,
        level: Optional[int] = None,
        confirmed_postgres_backup: bool = False
    ) -> QbSyncResult:
        """
        Synchronizes approved questions to legacy database.
        Default is dry-run (read-only, no transaction, no commit).
        When execute=True:
        1. Checks PostgreSQL availability and refuses unless confirmed_postgres_backup is True.
        2. Performs sqlite backup.
        3. Executes single write transaction.
        4. Logs to qb_sync_log.
        """
        result = QbSyncResult(batch_id=batch_id or "all", is_dry_run=not execute)

        # 1. Check PostgreSQL safeguard
        pg_active = self._is_postgres if self._is_postgres is not None else check_postgres_available()
        if execute and pg_active and not confirmed_postgres_backup:
            raise PermissionError(
                "Phát hiện PostgreSQL production đang chạy! Để bảo vệ dữ liệu, lệnh --execute "
                "bị từ chối cho đến khi bạn xác nhận đã tự sao lưu DB (truyền --i-have-backed-up-postgres)."
            )

        # 2. Fetch approved questions from QBank store (excluding already synced questions)
        with self.store.session() as conn:
            cur = conn.cursor()
            conditions = [
                "q.status = 'approved'",
                "q.question_id NOT IN (SELECT question_id FROM qb_sync_log)"
            ]
            params = []
            if batch_id:
                conditions.append("json_extract(q.provenance, '$.batch_id') = ?")
                params.append(batch_id)
            if level is not None:
                conditions.append("q.level = ?")
                params.append(level)

            where_clause = " AND ".join(conditions)
            query = f"SELECT q.* FROM qb_questions q WHERE {where_clause} ORDER BY q.rowid ASC"
            if limit:
                query += f" LIMIT {int(limit)}"

            cur.execute(query, params)
            rows = cur.fetchall()

        eligible_questions: List[QbQuestion] = [self.store._row_to_model(r) for r in rows]
        result.total_eligible = len(eligible_questions)

        if not eligible_questions:
            return result

        # 3. Read existing hashes and stems from legacy database
        existing_hashes, existing_stems = self.adapter.get_existing_hashes_and_stems()

        from qbank.dedup import check_near_duplicate, get_comparable_stem
        from pypinyin import pinyin, Style

        payloads_to_insert: List[Dict[str, Any]] = []
        questions_to_sync: List[Tuple[QbQuestion, str, str]] = []

        from qbank.validators import validate_clean_characters

        for q in eligible_questions:
            # Safeguard 1: Block questions with character noise (Latin / Vietnamese / bracket noise)
            is_clean, clean_notes = validate_clean_characters(q.stem, q.options)
            if not is_clean:
                result.skipped_blocked_flags += 1
                reason = f"Chứa chữ nhiễu (Latin/Vi/ngoặc): {'; '.join(clean_notes)}"
                result.blocked_questions.append({"question_id": q.question_id, "reason": reason})
                logger.warning(f"Từ chối đồng bộ câu {q.question_id}: {reason}")
                continue

            # Safeguard 2: Block questions with solver ambiguity unless approved with override reason
            notes_str = " ".join(q.qa.notes)
            has_solver_ambiguity = ("Solver flagged ambiguity" in notes_str or "2 options acceptable" in notes_str or "Solver mismatch" in notes_str)
            has_human_override = ("Duyệt ngoại lệ" in notes_str or "Người duyệt thủ công xác nhận" in notes_str or "duyệt thủ công" in notes_str.lower())
            if has_solver_ambiguity and not has_human_override:
                result.skipped_blocked_flags += 1
                reason = "Solver cảnh báo đa nghĩa (chưa có ghi chú duyệt ngoại lệ của người duyệt)"
                result.blocked_questions.append({"question_id": q.question_id, "reason": reason})
                logger.warning(f"Từ chối đồng bộ câu {q.question_id}: {reason}")
                continue

            # Format options with legacy keys
            legacy_opts, opts_json_str = format_legacy_options(q.options)
            correct_ans_char = chr(65 + q.answer_index)

            # Compute legacy hash
            legacy_hash = compute_legacy_content_hash(q.stem, legacy_opts, correct_ans_char)

            # Check duplicate hash against legacy DB
            if legacy_hash in existing_hashes:
                result.skipped_duplicate_hash += 1
                logger.info(f"Bỏ qua câu {q.question_id}: Trùng content_hash với bảng questions cũ.")
                continue

            # Check near-duplicate 4-gram against legacy stems
            comp_stem = get_comparable_stem(q.stem, q.options, q.answer_index)
            is_near_dup, sim_score, matched = check_near_duplicate(comp_stem, existing_stems, threshold=0.80)
            if is_near_dup:
                result.skipped_near_duplicate += 1
                logger.info(f"Bỏ qua câu {q.question_id}: Nghi vấn gần trùng ({sim_score:.1%}) với câu cũ: '{matched}'.")
                continue

            # Format pinyin stem if missing
            pinyin_str = q.pinyin_stem
            if not pinyin_str:
                p_tokens = pinyin(q.stem, style=Style.TONE)
                pinyin_str = " ".join([item[0] for item in p_tokens])

            # Generate hyphenated UUID v4 format matching existing rows
            legacy_id = str(uuid.uuid4())
            legacy_batch_tag = q.provenance.batch_id if q.provenance else "manual"
            source_url = f"qbank_original:{legacy_batch_tag}"

            payload_item = {
                "id": legacy_id,
                "hanzi_content": q.stem,
                "pinyin_text": pinyin_str,
                "options": opts_json_str,
                "correct_answer": correct_ans_char,
                "explanation": q.explanation_vi,
                "ai_explanation": None,
                "hsk_level": f"HSK{q.level}",
                "topic": map_topic(q.skill, q.part_type),
                "question_type": "multiple_choice",
                "media_url": None,
                "passage_id": q.passage if q.passage else None,
                "source_url": source_url,
                "content_hash": legacy_hash,
                "status": "approved"
            }

            payloads_to_insert.append(payload_item)
            questions_to_sync.append((q, legacy_id, source_url))
            existing_hashes.add(legacy_hash)
            existing_stems.append(q.stem)

        result.synced_count = len(payloads_to_insert)
        result.records = [
            {"question_id": q.question_id, "legacy_id": lid, "stem": q.stem}
            for q, lid, _ in questions_to_sync
        ]

        # 4. If dry-run: return immediately without transaction or commit
        if not execute:
            return result

        # 5. If execute: Backup SQLite DB first
        try:
            backup_file = self.adapter.backup_sqlite()
            result.backup_file = backup_file
        except Exception as e:
            logger.warning(f"Không thể sao lưu SQLite (có thể đang dùng mock/pg): {e}")

        # 6. Execute insertion in single transaction
        self.adapter.insert_questions(payloads_to_insert)

        # 7. Audit log in qbank.db
        for q, legacy_id, source_url in questions_to_sync:
            b_id = q.provenance.batch_id if q.provenance else "batch_manual"
            self.store.record_sync(
                batch_id=b_id,
                question_id=q.question_id,
                legacy_source_url=source_url,
                legacy_id=legacy_id
            )

        return result

    def retire(self, batch_id: str) -> int:
        """
        Retires all synced questions for a given batch.
        Updates legacy DB status = 'rejected' (so exam_service excludes them).
        Updates qbank.db status = 'retired'.
        Never DELETE rows.
        """
        # 1. Fetch sync records for the batch
        records = self.store.get_sync_records_by_batch(batch_id)
        if not records:
            return 0

        legacy_ids = [r.legacy_id for r in records if r.legacy_id]

        # 2. Update legacy DB to 'rejected'
        if legacy_ids:
            self.adapter.retire_by_ids(legacy_ids)

        # 3. Mark records as retired in qb_sync_log
        self.store.mark_sync_retired(batch_id)

        # 4. Mark questions in qb_questions as 'retired'
        with self.store.session() as conn:
            cur = conn.cursor()
            cur.execute("""
                UPDATE qb_questions
                SET status = 'retired'
                WHERE json_extract(provenance, '$.batch_id') = ?;
            """, (batch_id,))
            conn.commit()

        return len(records)
