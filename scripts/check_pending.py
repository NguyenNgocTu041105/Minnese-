import sqlite3

conn = sqlite3.connect('data/qbank/qbank.db')
cursor = conn.cursor()
cursor.execute("SELECT id, created_at FROM pending_questions ORDER BY id DESC LIMIT 25")
rows = cursor.fetchall()
for r in rows:
    print(r)
conn.close()
