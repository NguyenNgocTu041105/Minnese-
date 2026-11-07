import { NEW_HSK1_FULL_LESSONS } from '../src/data/newHsk1BookData';
import {
  HSK1_CHARACTER_BOUNDING_BOXES,
  HSK1_SCENE_METADATA,
} from '../tests/hsk1_bubble_collision_data';
import {
  auditDialogue,
  auditDialogueLine,
  getResponsiveViewports,
  CharacterBubbleConfig,
} from '../tests/hsk1_collision_engine';

const did = 'hsk1-l15-t2';
const meta = HSK1_SCENE_METADATA[did];
const scene = HSK1_CHARACTER_BOUNDING_BOXES[did];
const viewports = getResponsiveViewports(meta.aspectRatioClass);
const lines = NEW_HSK1_FULL_LESSONS.find(l => l.lessonNumber === 15)!.texts.find(t => t.id === did)!.lines;

// Annie config found in task-530:
// {"mouthTarget":{"x":70.5,"y":53.5},"placement":"custom","bubblePos":{"x":6,"y":78},"tailOrigin":"left","maxWidth":265}
// Li Wen config found:
// {"mouthTarget":{"x":51.5,"y":45.5},"placement":"custom","bubblePos":{"x":8,"y":80},"tailOrigin":"left","maxWidth":240}
// Chen Tianzhong:
// {"mouthTarget":{"x":78.5,"y":54.0},"placement":"custom","bubblePos":{"x":84,"y":18},"tailOrigin":"bottom-left","maxWidth":180}

// Let's test if there is ANY bubblePos, maxWidth, tailOrigin for 白家月 that passes
// Let's test with step 1 in x (from 4 to 96) and y (from 4 to 96) and mw in [90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 200, 220, 240, 260, 280, 300]
const bLine = lines[2];
let found = 0;

for (let mw of [90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 200, 220, 240, 260, 280, 300]) {
  for (let x = 4; x <= 96; x += 1) {
    for (let y = 4; y <= 96; y += 1) {
      for (const to of ['left', 'right', 'top', 'bottom', 'bottom-left', 'bottom-right'] as const) {
        const cfg: CharacterBubbleConfig = {
          mouthTarget: scene['白家月'].mouth,
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
          console.log(`FOUND PASS FOR 白家月: x=${x}, y=${y}, mw=${mw}, to=${to}`);
          found++;
          if (found >= 5) process.exit(0);
        }
      }
    }
  }
}

console.log(`Done search. Found: ${found}`);
