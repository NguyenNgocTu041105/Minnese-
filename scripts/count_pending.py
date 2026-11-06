import sqlite3

conn = sqlite3.connect('data/qbank/qbank.db')
c = conn.cursor()
c.execute("SELECT COUNT(*) FROM pending_questions WHERE created_at < '2026-11-03'")
print('Before today:', c.fetchone()[0])
c.execute("SELECT COUNT(*) FROM pending_questions WHERE created_at >= '2026-11-03'")
print('Today:', c.fetchone()[0])
conn.close()
