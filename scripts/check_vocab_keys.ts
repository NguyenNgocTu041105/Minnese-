import fs from 'fs';

const lines = fs.readFileSync('data/qbank/syllabus/vocab.jsonl', 'utf-8').trim().split('\n');
let hasVi = 0;
let hasEn = 0;
let hasPos = 0;
let keys = new Set<string>();

for (const line of lines) {
  if (!line.trim()) continue;
  const obj = JSON.parse(line);
  Object.keys(obj).forEach(k => keys.add(k));
  if (obj.vietnamese || obj.meaning_vi || obj.vi) hasVi++;
  if (obj.english || obj.meaning_en || obj.en) hasEn++;
  if (obj.pos) hasPos++;
}

console.log('All keys found in vocab.jsonl:', Array.from(keys));
console.log('hasVi:', hasVi, 'hasEn:', hasEn, 'hasPos:', hasPos);
