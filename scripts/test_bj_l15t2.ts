import {
  estimateBubbleDimensions,
  resolveBubbleBoundingBox,
  aabbCollisionTest,
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

// Test 白家月 (line 2)
const bLine = lines[2];
console.log('Testing 白家月 line:', bLine.hanzi);

for (let mw = 120; mw <= 250; mw += 5) {
  for (let x = 30; x <= 60; x += 1) {
    for (let y = 60; y <= 85; y += 1) {
      for (const to of ['left', 'right', 'top', 'bottom', 'bottom-left', 'bottom-right'] as const) {
        const cfg = {
          mouthTarget: scene['白家月'].mouth,
          placement: 'custom' as const,
          bubblePos: { x, y },
          tailOrigin: to,
          maxWidth: mw,
        };

        let allPass = true;
        for (const vp of viewports) {
          const res = auditDialogueLine(did, 2, '白家月', bLine.hanzi, bLine.vietnamese || '', vp, cfg, scene, meta);
          if (res.issues.length > 0) {
            allPass = false;
            break;
          }
        }

        if (allPass) {
          console.log(`FOUND PASSING CFG FOR 白家月: x=${x}, y=${y}, mw=${mw}, to=${to}`);
          process.exit(0);
        }
      }
    }
  }
}
console.log('No passing config found in searched range');
