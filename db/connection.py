import os
import sqlite3
import psycopg2
import psycopg2.extras
from contextlib import contextmanager
from config.settings import settings

SQLITE_DB_PATH = os.path.abspath(
    os.getenv(
        "HSK_EXAM_DB_PATH",
        os.path.join(os.path.dirname(__file__), "..", "data", "hsk_exam.db"),
    )
)

def init_sqlite_schema(conn: sqlite3.Connection):
    """Khởi tạo cấu trúc bảng SQLite tương thích hoàn toàn cho môi trường Local."""
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS reading_passages (
            id TEXT PRIMARY KEY,
            passage_text TEXT NOT NULL,
            passage_pinyin TEXT,
            hsk_level TEXT NOT NULL,
            source_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS questions (
            id TEXT PRIMARY KEY,
            hanzi_content TEXT NOT NULL,
            pinyin_text TEXT NOT NULL,
            options TEXT NOT NULL,
            correct_answer TEXT NOT NULL,
            explanation TEXT,
            ai_explanation TEXT,
            hsk_level TEXT NOT NULL,
            topic TEXT NOT NULL,
            question_type TEXT NOT NULL,
            media_url TEXT,
            passage_id TEXT,
            source_url TEXT,
            content_hash TEXT UNIQUE NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending_review',
            crawled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS idx_questions_hash ON questions(content_hash);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_questions_level ON questions(hsk_level, status);")

    cur.execute("""
        CREATE TABLE IF NOT EXISTS crawl_jobs (
            id TEXT PRIMARY KEY,
            started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            finished_at TIMESTAMP,
            source TEXT NOT NULL,
            total_crawled INTEGER DEFAULT 0,
            total_new INTEGER DEFAULT 0,
            total_duplicate INTEGER DEFAULT 0,
            total_semantic_duplicate INTEGER DEFAULT 0,
            total_errors INTEGER DEFAULT 0,
            status TEXT DEFAULT 'running',
            error_log TEXT
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS crawl_analytics (
            id TEXT PRIMARY KEY,
            job_id TEXT,
            source TEXT NOT NULL,
            hsk_level TEXT NOT NULL,
            total_crawled INTEGER DEFAULT 0,
            exact_duplicates INTEGER DEFAULT 0,
            semantic_duplicates INTEGER DEFAULT 0,
            net_unique INTEGER DEFAULT 0,
            duplicate_rate REAL DEFAULT 0.0,
            analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS rag_documents_index (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            tags TEXT NOT NULL,
            content TEXT NOT NULL,
            rules_summary TEXT,
            content_hash TEXT UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    conn.commit()
    cur.close()

class SQLiteDictCursor:
    """Wrapper cho SQLite cursor để trả về dict giống RealDictCursor của psycopg2."""
    def __init__(self, cursor):
        self._cur = cursor

    def execute(self, sql, params=None):
        # Chuyển đổi cú pháp placeholder %s sang ? cho SQLite nếu cần
        sqlite_sql = sql.replace("%s", "?")
        if params is not None:
            # Unwrap any psycopg2.extras.Json if present
            unwrapped_params = []
            for p in params:
                if hasattr(p, "adapted"):
                    unwrapped_params.append(str(p.adapted))
                else:
                    unwrapped_params.append(p)
            self._cur.execute(sqlite_sql, unwrapped_params)
        else:
            self._cur.execute(sqlite_sql)
        return self

    def executemany(self, sql, seq_of_params):
        sqlite_sql = sql.replace("%s", "?")
        unwrapped_seq = []
        for params in seq_of_params:
            unwrapped_p = []
            for p in params:
                if hasattr(p, "adapted"):
                    unwrapped_p.append(str(p.adapted))
                else:
                    unwrapped_p.append(p)
            unwrapped_seq.append(unwrapped_p)
        self._cur.executemany(sqlite_sql, unwrapped_seq)
        return self

    def fetchone(self):
        row = self._cur.fetchone()
        if row is None:
            return None
        return dict(row)

    def fetchall(self):
        rows = self._cur.fetchall()
        return [dict(r) for r in rows]

    @property
    def rowcount(self):
        return self._cur.rowcount

    def close(self):
        self._cur.close()

def is_postgres_available() -> bool:
    if os.getenv("MINNESE_STAGING", "").lower() == "true":
        return False
    try:
        conn = psycopg2.connect(settings.DATABASE_URL, connect_timeout=2)
        conn.close()
        return True
    except Exception:
        return False

@contextmanager
def get_db_cursor(commit: bool = False):
    """
    Tự động kết nối PostgreSQL (Production / Cloud),
    hoặc tự động fallback sang SQLite Local an toàn mà không cần cài thêm DB server.
    """
    use_postgres = is_postgres_available()
    
    if use_postgres:
        conn = psycopg2.connect(settings.DATABASE_URL)
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        try:
            yield cur
            if commit:
                conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            cur.close()
            conn.close()
    else:
        # SQLite fallback
        os.makedirs(os.path.dirname(SQLITE_DB_PATH), exist_ok=True)
        conn = sqlite3.connect(SQLITE_DB_PATH)
        conn.row_factory = sqlite3.Row
        init_sqlite_schema(conn)
        raw_cur = conn.cursor()
        cur = SQLiteDictCursor(raw_cur)
        try:
            yield cur
            if commit:
                conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            cur.close()
            conn.close()
