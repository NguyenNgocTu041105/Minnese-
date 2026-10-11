import os
import json
import sqlite3
from contextlib import contextmanager
from typing import List, Optional, Dict, Any
from qbank.config import qbank_config
from qbank.models import QbQuestion, QbProvenance, QbQA, QbSyncRecord


class QbStore:
    """
    Dedicated local SQLite storage for QBank.
    Completely isolated from the legacy application database.
    """
    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path or qbank_config.db_path
        os.makedirs(os.path.dirname(os.path.abspath(self.db_path)), exist_ok=True)
        self.init_schema()

    @contextmanager
    def session(self):
        """Context manager that automatically manages commits and always closes the connection."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    def init_schema(self) -> None:
        """Initializes tables for QBank."""
        with self.session() as conn:
            cur = conn.cursor()
            cur.execute("""
                CREATE TABLE IF NOT EXISTS qb_questions (
                    question_id TEXT PRIMARY KEY,
                    level INTEGER NOT NULL,
                    skill TEXT NOT NULL,
                    part_type TEXT NOT NULL,
                    stem TEXT NOT NULL,
                    passage TEXT,
                    options TEXT NOT NULL,
                    answer_index INTEGER NOT NULL,
                    explanation_vi TEXT NOT NULL,
                    pinyin_stem TEXT,
                    vocab_tags TEXT,
                    topic TEXT,
                    difficulty TEXT,
                    display_label TEXT,
                    provenance TEXT NOT NULL,
                    qa TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'needs_review',
                    report_count INTEGER DEFAULT 0,
                    times_answered INTEGER DEFAULT 0,
                    times_wrong INTEGER DEFAULT 0,
                    content_hash TEXT UNIQUE NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            cur.execute("CREATE INDEX IF NOT EXISTS idx_qb_questions_hash ON qb_questions(content_hash);")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_qb_questions_status ON qb_questions(status, level);")

            cur.execute("""
                CREATE TABLE IF NOT EXISTS qb_sync_log (
                    sync_id TEXT PRIMARY KEY,
                    batch_id TEXT NOT NULL,
                    question_id TEXT NOT NULL,
                    legacy_id TEXT NOT NULL,
                    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    legacy_source_url TEXT NOT NULL,
                    status TEXT DEFAULT 'active',
                    UNIQUE(question_id, batch_id)
                );
            """)
            cur.execute("CREATE INDEX IF NOT EXISTS idx_qb_sync_batch ON qb_sync_log(batch_id);")

            cur.execute("""
                CREATE TABLE IF NOT EXISTS qb_export_log (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    question_id TEXT NOT NULL,
                    exported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    file TEXT NOT NULL
                );
            """)
            cur.execute("CREATE INDEX IF NOT EXISTS idx_qb_export_qid ON qb_export_log(question_id);")

            cur.execute("""
                CREATE TABLE IF NOT EXISTS qb_reports (
                    report_id TEXT PRIMARY KEY,
                    question_id TEXT NOT NULL,
                    user_note TEXT,
                    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            conn.commit()

    def save_question(self, q: QbQuestion) -> bool:
        """
        Saves or updates a QbQuestion record.
        Catches IntegrityError on duplicate content_hash gracefully without letting exception escape.
        Returns True on success, False if content_hash already exists under a different question_id.
        """
        try:
            with self.session() as conn:
                cur = conn.cursor()
                cur.execute("""
                    INSERT INTO qb_questions (
                        question_id, level, skill, part_type, stem, passage, options,
                        answer_index, explanation_vi, pinyin_stem, vocab_tags, topic,
                        difficulty, display_label, provenance, qa, status,
                        report_count, times_answered, times_wrong, content_hash
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(question_id) DO UPDATE SET
                        status = excluded.status,
                        report_count = excluded.report_count,
                        times_answered = excluded.times_answered,
                        times_wrong = excluded.times_wrong;
                """, (
                    q.question_id,
                    q.level,
                    q.skill,
                    q.part_type,
                    q.stem,
                    q.passage,
                    json.dumps(q.options, ensure_ascii=False),
                    q.answer_index,
                    q.explanation_vi,
                    q.pinyin_stem,
                    json.dumps(q.vocab_tags, ensure_ascii=False),
                    q.topic,
                    q.difficulty,
                    q.display_label,
                    json.dumps(q.provenance.model_dump(), ensure_ascii=False),
                    json.dumps(q.qa.model_dump(), ensure_ascii=False),
                    q.status,
                    q.report_count,
                    q.times_answered,
                    q.times_wrong,
                    q.content_hash
                ))
                conn.commit()
                return True
        except sqlite3.IntegrityError as e:
            # Duplicate content_hash under different question_id
            return False

    def get_question(self, question_id: str) -> Optional[QbQuestion]:
        """Fetches a question by ID."""
        with self.session() as conn:
            cur = conn.cursor()
            cur.execute("SELECT * FROM qb_questions WHERE question_id = ?;", (question_id,))
            row = cur.fetchone()
            if not row:
                return None
            return self._row_to_model(row)

    def get_question_by_hash(self, content_hash: str) -> Optional[QbQuestion]:
        """Fetches a question by its content_hash."""
        with self.session() as conn:
            cur = conn.cursor()
            cur.execute("SELECT * FROM qb_questions WHERE content_hash = ?;", (content_hash,))
            row = cur.fetchone()
            if not row:
                return None
            return self._row_to_model(row)

    def list_questions(
        self,
        status: Optional[str] = None,
        level: Optional[int] = None,
        limit: int = 100
    ) -> List[QbQuestion]:
        """Lists questions filtered by status and level."""
        with self.session() as conn:
            cur = conn.cursor()
            query = "SELECT * FROM qb_questions WHERE 1=1"
            params: List[Any] = []
            if status:
                query += " AND status = ?"
                params.append(status)
            if level:
                query += " AND level = ?"
                params.append(level)
            query += " ORDER BY created_at DESC LIMIT ?"
            params.append(limit)

            cur.execute(query, params)
            return [self._row_to_model(r) for r in cur.fetchall()]

    def get_questions_by_level(self, level: int, limit: int = 100) -> List[QbQuestion]:
        """Convenience method to list questions by level."""
        return self.list_questions(level=level, limit=limit)


    def update_status(self, question_id: str, new_status: str) -> bool:
        """Updates question review status."""
        valid_statuses = ("pending", "approved", "needs_review", "rejected", "retired")
        if new_status not in valid_statuses:
            raise ValueError(f"Invalid status: {new_status}. Must be one of {valid_statuses}")
        with self.session() as conn:
            cur = conn.cursor()
            cur.execute(
                "UPDATE qb_questions SET status = ? WHERE question_id = ?;",
                (new_status, question_id)
            )
            conn.commit()
            return cur.rowcount > 0

    def record_report(self, question_id: str, user_note: str = "") -> int:
        """
        Increments report count when a student reports an error in a question.
        If report_count exceeds threshold, status is automatically switched to needs_review.
        """
        import uuid
        with self.session() as conn:
            cur = conn.cursor()
            report_id = str(uuid.uuid4())
            cur.execute(
                "INSERT INTO qb_reports (report_id, question_id, user_note) VALUES (?, ?, ?);",
                (report_id, question_id, user_note)
            )
            cur.execute(
                "UPDATE qb_questions SET report_count = report_count + 1 WHERE question_id = ?;",
                (question_id,)
            )
            cur.execute("SELECT report_count, status FROM qb_questions WHERE question_id = ?;", (question_id,))
            row = cur.fetchone()
            if not row:
                conn.commit()
                return 0

            count = row["report_count"]
            if count >= qbank_config.report_threshold_to_review and row["status"] == "approved":
                cur.execute(
                    "UPDATE qb_questions SET status = 'needs_review' WHERE question_id = ?;",
                    (question_id,)
                )
            conn.commit()
            return count

    def record_sync(self, batch_id: str, question_id: str, legacy_source_url: str, legacy_id: str) -> str:
        """Records an export event from QBank to the legacy DB."""
        import uuid
        sync_id = str(uuid.uuid4())
        with self.session() as conn:
            cur = conn.cursor()
            cur.execute("""
                INSERT INTO qb_sync_log (sync_id, batch_id, question_id, legacy_id, legacy_source_url, status)
                VALUES (?, ?, ?, ?, ?, 'active');
            """, (sync_id, batch_id, question_id, legacy_id, legacy_source_url))
            conn.commit()
            return sync_id

    def get_sync_records_by_batch(self, batch_id: str) -> List[QbSyncRecord]:
        """Fetches all sync log records for a given batch."""
        with self.session() as conn:
            cur = conn.cursor()
            cur.execute("SELECT * FROM qb_sync_log WHERE batch_id = ?;", (batch_id,))
            rows = cur.fetchall()
            return [
                QbSyncRecord(
                    sync_id=r["sync_id"],
                    batch_id=r["batch_id"],
                    question_id=r["question_id"],
                    legacy_id=r["legacy_id"] if "legacy_id" in r.keys() else "",
                    synced_at=str(r["synced_at"]),
                    legacy_source_url=r["legacy_source_url"],
                    status=r["status"]
                ) for r in rows
            ]

    def mark_sync_retired(self, batch_id: str) -> int:
        """Marks sync records of a batch as retired."""
        with self.session() as conn:
            cur = conn.cursor()
            cur.execute("UPDATE qb_sync_log SET status = 'retired' WHERE batch_id = ?;", (batch_id,))
            conn.commit()
            return cur.rowcount

    def get_synced_question_ids(self) -> set[str]:
        """Returns set of all question_ids that have ever been recorded in qb_sync_log."""
        with self.session() as conn:
            cur = conn.cursor()
            cur.execute("SELECT DISTINCT question_id FROM qb_sync_log;")
            return {r["question_id"] for r in cur.fetchall()}

    def record_export(self, question_ids: List[str], file_path: str) -> int:
        """Records exported questions in qb_export_log."""
        if not question_ids:
            return 0
        with self.session() as conn:
            cur = conn.cursor()
            cur.executemany(
                "INSERT INTO qb_export_log (question_id, file) VALUES (?, ?);",
                [(qid, file_path) for qid in question_ids]
            )
            conn.commit()
            return len(question_ids)

    def get_approved_unsynced_questions(
        self,
        batch_id: Optional[str] = None,
        level: Optional[int] = None,
        include_exported: bool = False
    ) -> List[QbQuestion]:
        """
        Returns approved questions that have never been synced to the legacy DB.
        By default (include_exported=False), also excludes questions already logged in qb_export_log.
        """
        with self.session() as conn:
            cur = conn.cursor()
            conditions = [
                "q.status = 'approved'",
                "q.question_id NOT IN (SELECT question_id FROM qb_sync_log)"
            ]
            if not include_exported:
                conditions.append("q.question_id NOT IN (SELECT question_id FROM qb_export_log)")

            params: list[Any] = []
            if batch_id:
                conditions.append("json_extract(q.provenance, '$.batch_id') = ?")
                params.append(batch_id)
            if level is not None:
                conditions.append("q.level = ?")
                params.append(level)

            where_clause = " AND ".join(conditions)
            query = f"SELECT q.* FROM qb_questions q WHERE {where_clause} ORDER BY q.rowid ASC"
            cur.execute(query, params)
            return [self._row_to_model(r) for r in cur.fetchall()]

    def get_stats(self) -> Dict[str, Any]:
        """Calculates summary statistics of the question bank."""
        with self.session() as conn:
            cur = conn.cursor()
            cur.execute("SELECT COUNT(*) as total FROM qb_questions;")
            total = cur.fetchone()["total"]

            cur.execute("SELECT status, COUNT(*) as cnt FROM qb_questions GROUP BY status;")
            by_status = {r["status"]: r["cnt"] for r in cur.fetchall()}

            cur.execute("SELECT level, COUNT(*) as cnt FROM qb_questions GROUP BY level;")
            by_level = {r["level"]: r["cnt"] for r in cur.fetchall()}

            cur.execute("SELECT COUNT(*) as reported FROM qb_questions WHERE report_count > 0;")
            reported_count = cur.fetchone()["reported"]

            return {
                "total_questions": total,
                "by_status": by_status,
                "by_level": by_level,
                "reported_questions": reported_count
            }

    def _row_to_model(self, row: sqlite3.Row) -> QbQuestion:
        data = dict(row)
        data.pop("created_at", None)
        data.pop("rowid", None)
        data["options"] = json.loads(data["options"])
        data["vocab_tags"] = json.loads(data["vocab_tags"]) if data["vocab_tags"] else []
        data["provenance"] = QbProvenance.model_validate(json.loads(data["provenance"]))
        data["qa"] = QbQA.model_validate(json.loads(data["qa"]))
        return QbQuestion.model_validate(data)


_store_instance: Optional[QbStore] = None


def get_store(db_path: Optional[str] = None) -> QbStore:
    """Lazy loader for QbStore singleton."""
    global _store_instance
    if db_path is not None:
        return QbStore(db_path=db_path)
    if _store_instance is None:
        _store_instance = QbStore()
    return _store_instance

