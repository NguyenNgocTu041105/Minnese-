const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const crypto = require('crypto');

const db = new DatabaseSync('data/qbank/qbank.db', { readOnly: true });
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
console.log('Tables:', tables.map(t => t.name));
for (const t of tables) {
  const row = db.prepare(`SELECT count(*) as count FROM "${t.name}"`).get();
  console.log(`  ${t.name}: ${row.count}`);
}
db.close();

const hskHash = crypto.createHash('sha256').update(fs.readFileSync('data/hsk_exam.db')).digest('hex').toUpperCase();
const qbankHash = crypto.createHash('sha256').update(fs.readFileSync('data/qbank/qbank.db')).digest('hex').toUpperCase();
console.log('hsk_exam.db SHA256:', hskHash);
console.log('qbank.db SHA256:', qbankHash);
