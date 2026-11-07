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

const did = 'hsk1-l15-t1';
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

const charNames = ['白家月', '李文', '安妮', '陈天中'];
const candidates: Record<string, CharacterBubbleConfig[]> = {};

for (const cname of charNames) {
  const rec = scene[cname];
  const cLines = lines.filter((l) => l.speaker.includes(cname));
  candidates[cname] = [];

  // If character has no lines, any dummy valid config works
  if (cLines.length === 0) {
    candidates[cname].push({
      mouthTarget: rec.mouth,
      placement: 'custom',
      bubblePos: { x: 80, y: 80 },
      tailOrigin: 'bottom',
      maxWidth: 150,
    });
    continue;
  }

  // Use appropriate max widths
  const maxWList = cname === '李文' ? [240, 260, 280] : [120, 150, 180, 210];

  for (let mw of maxWList) {
    for (let x = 8; x <= 92; x += 2) {
      for (let y = 8; y <= 90; y += 2) {
        for (const to of ['left', 'right', 'top', 'bottom', 'bottom-left', 'bottom-right'] as const) {
          const cfg = {
            mouthTarget: rec.mouth,
            placement: 'custom' as any,
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

// Search combination for speakers: 白家月, 李文, 陈天中
const listBai = candidates['白家月'];
const listLi = candidates['李文'];
const listChen = candidates['陈天中'];
const cfgAnnie = candidates['安妮'][0];

const stepBai = Math.max(1, Math.floor(listBai.length / 30));
const stepLi = Math.max(1, Math.floor(listLi.length / 30));
const stepChen = Math.max(1, Math.floor(listChen.length / 30));

let found = false;
for (let i = 0; i < listBai.length; i += stepBai) {
  for (let j = 0; j < listLi.length; j += stepLi) {
    const cBai = listBai[i];
    const cLi = listLi[j];
    const d12 = Math.hypot(cBai.bubblePos!.x - cLi.bubblePos!.x, cBai.bubblePos!.y - cLi.bubblePos!.y);
    if (d12 < 10) continue;

    for (let k = 0; k < listChen.length; k += stepChen) {
      const cChen = listChen[k];
      const d13 = Math.hypot(cBai.bubblePos!.x - cChen.bubblePos!.x, cBai.bubblePos!.y - cChen.bubblePos!.y);
      const d23 = Math.hypot(cLi.bubblePos!.x - cChen.bubblePos!.x, cLi.bubblePos!.y - cChen.bubblePos!.y);
      if (d13 < 10 || d23 < 10) continue;

      const testLayout = {
        '白家月': cBai,
        '李文': cLi,
        '安妮': cfgAnnie,
        '陈天中': cChen,
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
