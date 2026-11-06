import sqlite3
import datetime

conn = sqlite3.connect('data/qbank/qbank.db')
cur = conn.cursor()

print("=== CHECK GENERATION RUNS ===")
try:
    cur.execute("SELECT id, level, batch_size, status, created_at, finished_at, error_message FROM generation_runs ORDER BY id DESC LIMIT 10")
    runs = cur.fetchall()
    for r in runs:
        print("Run:", r)
except Exception as e:
    print("Error generation_runs:", e)

print("\n=== CHECK PENDING QUESTIONS (RECENT 10) ===")
try:
    cur.execute("SELECT id, level, part_type, status, created_at FROM pending_questions ORDER BY id DESC LIMIT 10")
    rows = cur.fetchall()
    for r in rows:
        print("Pending:", r)
except Exception as e:
    print("Error pending_questions:", e)

print("\n=== CHECK GENERATION HISTORY (RECENT 10) ===")
try:
    cur.execute("SELECT * FROM generation_history ORDER BY id DESC LIMIT 10")
    rows = cur.fetchall()
    for r in rows:
        print("History:", r)
except Exception as e:
    print("Error generation_history:", e)

print("\n=== TOTAL COUNTS IN PENDING QUESTIONS BY LEVEL ===")
try:
    cur.execute("SELECT level, status, count(*) FROM pending_questions GROUP BY level, status")
    for r in cur.fetchall():
        print(f"Level {r[0]} | Status: {r[1]} | Count: {r[2]}")
except Exception as e:
    print("Error count:", e)
