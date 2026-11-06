"""
Idempotent migration script for Milestone 1:
Adds 'topic TEXT' column and index to pending_questions and questions tables in data/qbank/qbank.db.
STRICT INVARIANT: NEVER touches data/hsk_exam.db.
"""
import sqlite3
import os

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'data', 'qbank', 'qbank.db'))

def migrate_qbank_db():
    assert os.path.exists(DB_PATH), f"Database not found at {DB_PATH}"
    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()

    # Check pending_questions
    cur.execute("PRAGMA table_info(pending_questions)")
    pend_cols = [c[1] for c in cur.fetchall()]
    if 'topic' not in pend_cols:
        print("[Migration] Adding 'topic' column to pending_questions...")
        cur.execute("ALTER TABLE pending_questions ADD COLUMN topic TEXT")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_pending_topic ON pending_questions(topic)")
    else:
        print("[Migration] pending_questions already has 'topic' column.")

    # Check questions
    cur.execute("PRAGMA table_info(questions)")
    q_cols = [c[1] for c in cur.fetchall()]
    if 'topic' not in q_cols:
        print("[Migration] Adding 'topic' column to questions...")
        cur.execute("ALTER TABLE questions ADD COLUMN topic TEXT")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic)")
    else:
        print("[Migration] questions already has 'topic' column.")

    con.commit()
    con.close()
    print("[Migration] Successfully completed qbank.db topic migration.")

if __name__ == '__main__':
    migrate_qbank_db()
