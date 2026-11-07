import { NEW_HSK1_FULL_LESSONS } from '../src/data/newHsk1BookData';
import { HSK1_CHARACTER_BOUNDING_BOXES, HSK1_SCENE_METADATA } from '../tests/hsk1_bubble_collision_data';
import { getResponsiveViewports, auditDialogueLine } from '../tests/hsk1_collision_engine';

const did = 'hsk1-l15-t2';
const meta = HSK1_SCENE_METADATA[did];
const scene = HSK1_CHARACTER_BOUNDING_BOXES[did];
const viewports = getResponsiveViewports(meta.aspectRatioClass);
const lesson = NEW_HSK1_FULL_LESSONS.find(l => l.lessonNumber === 15)!;
const text = lesson.texts.find(t => t.id === did)!;

console.log('Scene:', JSON.stringify(scene, null, 2));
console.log('Lines:');
text.lines.forEach((l, i) => {
  console.log(`[${i}] ${l.speaker}: "${l.hanzi}" (vi: "${l.vietnamese}")`);
});
