import { estimateBubbleDimensions } from '../tests/hsk1_collision_engine';
import { NEW_HSK1_FULL_LESSONS } from '../src/data/newHsk1BookData';

const lesson = NEW_HSK1_FULL_LESSONS.find(l => l.lessonNumber === 15)!;
const text = lesson.texts.find(t => t.id === 'hsk1-l15-t2')!;
const bLine = text.lines[2]; // 白家月

console.log('Hanzi:', bLine.hanzi, 'len:', bLine.hanzi.length);
console.log('Vietnamese:', bLine.vietnamese, 'len:', (bLine.vietnamese || '').length);

for (const vpWidth of [375, 768, 896, 1280]) {
  console.log(`\n--- Viewport Width: ${vpWidth} ---`);
  for (let mw of [160, 180, 200, 220, 240, 260, 280]) {
    const dim = estimateBubbleDimensions(bLine.hanzi, bLine.vietnamese || '', mw, vpWidth);
    console.log(`maxWidth: ${mw} -> width: ${dim.width}, height: ${dim.height}, hanziLines: ${dim.hanziLines}, vnLines: ${dim.vnLines}`);
  }
}
