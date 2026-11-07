import {
  getResponsiveViewports,
  auditDialogueLine,
} from '../tests/hsk1_collision_engine';
import {
  HSK1_CHARACTER_BOUNDING_BOXES,
  HSK1_SCENE_METADATA,
} from '../tests/hsk1_bubble_collision_data';
import { NEW_HSK1_FULL_LESSONS } from '../src/data/newHsk1BookData';

const did = 'hsk1-l15-t2';
const meta = HSK1_SCENE_METADATA[did];
const scene = HSK1_CHARACTER_BOUNDING_BOXES[did];
const viewports = getResponsiveViewports(meta.aspectRatioClass);
const lines = NEW_HSK1_FULL_LESSONS.find(l => l.lessonNumber === 15)!.texts.find(t => t.id === did)!.lines;
const bLine = lines[2];

const cfg = {
  mouthTarget: scene['白家月'].mouth,
  placement: 'custom' as const,
  bubblePos: { x: 46, y: 75 },
  tailOrigin: 'left' as const,
  maxWidth: 140,
};

console.log('Mouth target:', scene['白家月'].mouth);
for (const vp of viewports) {
  const res = auditDialogueLine(did, 2, '白家月', bLine.hanzi, bLine.vietnamese || '', vp, cfg, scene, meta);
  console.log(`Viewport ${vp.name}: issues =`);
  res.issues.forEach(i => console.log(' ', i.type, i.message));
  console.log('  clampedBox =', res.clampedBox.percentBox);
  console.log('  tail origin =', res.tailGeom.originPercent, 'tip =', res.tailGeom.tipPercent);
}
