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

for (const did of ['hsk1-l15-t2', 'hsk1-l15-t3']) {
  const meta = HSK1_SCENE_METADATA[did];
  const scene = HSK1_CHARACTER_BOUNDING_BOXES[did];
  const viewports = getResponsiveViewports(meta.aspectRatioClass);

  let lines: any[] = [];
  for (const lesson of NEW_HSK1_FULL_LESSONS) {
    for (const text of lesson.texts) {
      if (text.id === did) {
        lines = text.lines;
        break;
      }
    }
  }

  console.log(`\n=================== ${did} ===================`);
  for (const charName of Object.keys(scene)) {
    const rec = scene[charName];
    const charLines = lines.filter((l) => l.speaker.includes(charName));
    let found = 0;
    for (let mw = 90; mw <= 260; mw += 15) {
      for (let x = 8; x <= 92; x += 3) {
        for (let y = 8; y <= 90; y += 3) {
          for (const to of ['left', 'right', 'top', 'bottom', 'bottom-left', 'bottom-right'] as const) {
            const cfg = {
              mouthTarget: rec.mouth,
              placement: 'custom' as const,
              bubblePos: { x, y },
              tailOrigin: to,
              maxWidth: mw,
            };

            let allPass = true;
            for (let lIdx = 0; lIdx < charLines.length; lIdx++) {
              const line = charLines[lIdx];
              for (const vp of viewports) {
                const res = auditDialogueLine(did, lIdx, charName, line.hanzi, line.vietnamese || '', vp, cfg, scene, meta);
                if (res.issues.length > 0) {
                  allPass = false;
                  break;
                }
              }
              if (!allPass) break;
            }

            if (allPass) {
              found++;
              if (found === 1) {
                console.log(`  ${charName}: PASS sample: x=${x}, y=${y}, mw=${mw}, to=${to}`);
              }
            }
          }
        }
      }
    }
    console.log(`  ${charName}: total valid = ${found}`);
  }
}
