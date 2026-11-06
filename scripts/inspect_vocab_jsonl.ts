import fs from 'fs';

const lines = fs.readFileSync('data/qbank/syllabus/vocab.jsonl', 'utf-8').trim().split('\n');
console.log('Total words in vocab.jsonl:', lines.length);

const byLevel: Record<number, number> = {};
const samples: Record<number, any[]> = {};

for (const line of lines) {
  if (!line.trim()) continue;
  const item = JSON.parse(line);
  byLevel[item.level] = (byLevel[item.level] || 0) + 1;
  if (!samples[item.level]) samples[item.level] = [];
  if (samples[item.level].length < 2) samples[item.level].push(item);
}

console.log('Counts by level:', byLevel);
console.log('Samples:', JSON.stringify(samples, null, 2));
