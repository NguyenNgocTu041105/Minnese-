import { NEW_HSK1_FULL_LESSONS } from '../src/data/newHsk1BookData';
import { HSK1_CHARACTER_BOUNDING_BOXES, HSK1_SCENE_METADATA } from '../tests/hsk1_bubble_collision_data';
import { getResponsiveViewports, auditDialogueLine, CharacterBubbleConfig } from '../tests/hsk1_collision_engine';

const did = 'hsk1-l15-t2';
const meta = HSK1_SCENE_METADATA[did];
const scene = HSK1_CHARACTER_BOUNDING_BOXES[did];
const viewports = getResponsiveViewports(meta.aspectRatioClass);
const lesson = NEW_HSK1_FULL_LESSONS.find(l => l.lessonNumber === 15)!;
const text = lesson.texts.find(t => t.id === did)!;
const bLine = text.lines[2]; // 白家月

console.log('Testing 白家月 at x=16, y=26');
const cfg: CharacterBubbleConfig = {
  mouthTarget: scene['白家月'].mouth, // { x: 22, y: 56.5 }
  placement: 'custom',
  bubblePos: { x: 16, y: 26 },
  tailOrigin: 'bottom',
  maxWidth: 180,
};

for (const vp of viewports) {
  const res = auditDialogueLine(did, 2, '白家月', bLine.hanzi, bLine.vietnamese || '', vp, cfg, scene, meta);
  console.log(`Viewport ${vp.name}: issues=${res.issues.length}`);
  res.issues.forEach(i => console.log('  ', i));
}
