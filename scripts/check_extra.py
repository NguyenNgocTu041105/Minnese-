import sqlite3

conn = sqlite3.connect('data/qbank/qbank.db')
c = conn.cursor()
c.execute("SELECT id, created_at, level, skill, part_type FROM pending_questions WHERE created_at > '2026-11-03 04:25:20'")
for r in c.fetchall():
    print(r)
conn.close()
