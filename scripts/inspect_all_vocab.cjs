const fs = require('fs');

function inspectFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(filePath, 'NOT FOUND');
    return [];
  }
  const content = fs.readFileSync(filePath, 'utf8');
  const regex = /hanzi:\s*['"]([^'"]+)['"]/g;
  const list = [];
  let m;
  while ((m = regex.exec(content)) !== null) {
    list.push(m[1]);
  }
  console.log(filePath, 'words found:', list.length);
  return list;
}

const files = [
  'src/data/hskVocabulary.ts',
  'src/data/newHsk1BookData.ts',
  'src/data/newHsk2BookData.ts',
  'src/data/newHsk3BookData.ts',
  'src/data/hsk4LessonsPart1.ts',
  'src/data/hsk4LessonsPart2.ts',
  'src/data/hsk4LessonsPart3.ts',
  'src/data/hsk4LessonsPart4.ts',
  'src/data/hsk5LessonsPart1.ts',
  'src/data/hsk5LessonsPart2.ts',
  'src/data/hsk5LessonsPart3.ts',
  'src/data/hsk6LessonsPart1.ts',
  'src/data/hsk6LessonsPart2.ts',
  'src/data/hsk6LessonsPart3.ts',
];

const all = new Set();
for (const f of files) {
  const words = inspectFile(f);
  words.forEach(w => all.add(w));
}
console.log('Total unique textbook words across all files:', all.size);
