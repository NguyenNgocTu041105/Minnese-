import { NEW_HSK1_FULL_LESSONS } from '../src/data/newHsk1BookData';
import { HSK1_CHARACTER_BOUNDING_BOXES, HSK1_SCENE_METADATA } from '../tests/hsk1_bubble_collision_data';
import { getResponsiveViewports, auditDialogueLine, CharacterBubbleConfig } from '../tests/hsk1_collision_engine';

const did = 'hsk1-l15-t2';
const meta = HSK1_SCENE_METADATA[did];
const scene = HSK1_CHARACTER_BOUNDING_BOXES[did];
const viewports = getResponsiveViewports(meta.aspectRatioClass);
const lesson = NEW_HSK1_FULL_LESSONS.find(l => l.lessonNumber === 15)!;
const text = lesson.texts.find(t => t.id === did)!;

// Let's check line 2 (白家月)
const bLine = text.lines[2];
const mouth = scene['白家月'].mouth;

console.log('Testing 白家月 across fine grid:');
let foundZero = false;

for (let mw = 90; mw <= 300; mw += 5) {
  for (let x = 2; x <= 98; x += 1) {
    for (let y = 2; y <= 98; y += 1) {
      for (const to of ['left', 'right', 'top', 'bottom', 'bottom-left', 'bottom-right'] as const) {
        const cfg: CharacterBubbleConfig = {
          mouthTarget: mouth,
          placement: 'custom',
          bubblePos: { x, y },
          tailOrigin: to,
          maxWidth: mw,
        };

        let ok = true;
        for (const vp of viewports) {
          const res = auditDialogueLine(did, 2, '白家月', bLine.hanzi, bLine.vietnamese || '', vp, cfg, scene, meta);
          if (res.issues.length > 0) {
            ok = false;
            break;
          }
        }

        if (ok) {
          console.log(`ZERO ISSUES FOUND FOR 白家月: x=${x}, y=${y}, mw=${mw}, to=${to}`);
          foundZero = true;
          break;
        }
      }
      if (foundZero) break;
    }
    if (foundZero) break;
  }
  if (foundZero) break;
}

if (!foundZero) {
  console.log('No 0-issue config exists for 白家月 with current audit engine on mobile-375.');
}
