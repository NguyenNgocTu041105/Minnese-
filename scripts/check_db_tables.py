import sqlite3
import sys

sys.stdout.reconfigure(encoding='utf-8')

conn = sqlite3.connect(r'data\hsk_exam.db')
c = conn.cursor()
c.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = c.fetchall()
print("Tables:", tables)

for t in tables:
    tname = t[0]
    c.execute(f"PRAGMA table_info({tname})")
    cols = [col[1] for col in c.fetchall()]
    c.execute(f"SELECT COUNT(*) FROM {tname}")
    count = c.fetchone()[0]
    print(f"Table {tname} ({count} rows): {cols}")
