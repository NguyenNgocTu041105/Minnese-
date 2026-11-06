import sqlite3
import hashlib

conn = sqlite3.connect('data/qbank/qbank.db')
c = conn.cursor()
c.execute("DELETE FROM pending_questions WHERE id LIKE 'test_pend_listening_%'")
print('Deleted test rows:', c.rowcount)
conn.commit()
conn.execute('PRAGMA wal_checkpoint(TRUNCATE);')
conn.close()

with open('data/qbank/qbank.db', 'rb') as f:
    h = hashlib.sha256(f.read()).hexdigest().upper()
print('qbank.db SHA-256 now:', h)
