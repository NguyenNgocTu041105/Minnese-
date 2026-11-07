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

const did = 'hsk1-l15-t3';
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

const charNames = ['白家月', '王一飞', '安妮'];
const candidates: Record<string, CharacterBubbleConfig[]> = {};

for (const cname of charNames) {
  const rec = scene[cname];
  const cLines = lines.filter((l) => l.speaker.includes(cname));
  candidates[cname] = [];

  const mwList = cname === '王一飞' ? [220, 250, 270] : [120, 150, 180];

  for (let mw of mwList) {
    for (let x = 8; x <= 92; x += 2) {
      for (let y = 8; y <= 90; y += 2) {
        for (const to of ['left', 'right', 'top', 'bottom', 'bottom-left', 'bottom-right'] as const) {
          const cfg: CharacterBubbleConfig = {
            mouthTarget: rec.mouth,
            placement: 'custom',
            bubblePos: { x, y },
            tailOrigin: to,
            maxWidth: mw,
          };

          let ok = true;
          for (let lIdx = 0; lIdx < cLines.length; lIdx++) {
            for (const vp of viewports) {
              const res = auditDialogueLine(did, lIdx, cname, cLines[lIdx].hanzi, cLines[lIdx].vietnamese || '', vp, cfg, scene, meta);
              if (res.issues.length > 0) {
                ok = false;
                break;
              }
            }
            if (!ok) break;
          }

          if (ok) {
            candidates[cname].push(cfg);
          }
        }
      }
    }
  }
  console.log(`${cname}: ${candidates[cname].length} valid candidates`);
}

// Find combination
const listB = candidates['白家月'];
const listW = candidates['王一飞'];
const listA = candidates['安妮'];

const stepB = Math.max(1, Math.floor(listB.length / 30));
const stepW = Math.max(1, Math.floor(listW.length / 30));
const stepA = Math.max(1, Math.floor(listA.length / 30));

let found = false;
for (let i = 0; i < listB.length; i += stepB) {
  const cB = listB[i];
  for (let j = 0; j < listW.length; j += stepW) {
    const cW = listW[j];
    const dBW = Math.hypot(cB.bubblePos!.x - cW.bubblePos!.x, cB.bubblePos!.y - cW.bubblePos!.y);
    if (dBW < 9) continue;

    for (let k = 0; k < listA.length; k += stepA) {
      const cA = listA[k];
      const dBA = Math.hypot(cB.bubblePos!.x - cA.bubblePos!.x, cB.bubblePos!.y - cA.bubblePos!.y);
      const dWA = Math.hypot(cW.bubblePos!.x - cA.bubblePos!.x, cW.bubblePos!.y - cA.bubblePos!.y);
      if (dBA < 9 || dWA < 9) continue;

      const testLayout = {
        '白家月': cB,
        '王一飞': cW,
        '安妮': cA,
      };

      const audit = auditDialogue(did, lines, testLayout);
      if (audit.status === 'PASS') {
        console.log(`>>> FOUND PASSING COMBO FOR ${did}!`);
        console.log(JSON.stringify(testLayout, null, 2));
        found = true;
        break;
      }
    }
    if (found) break;
  }
  if (found) break;
}
if (!found) console.log(`Failed to find combo for ${did}`);
