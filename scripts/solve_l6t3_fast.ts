import { NEW_HSK1_FULL_LESSONS } from '../src/data/newHsk1BookData';
import { HSK1_CHARACTER_BOUNDING_BOXES, HSK1_SCENE_METADATA } from '../tests/hsk1_bubble_collision_data';
import { getResponsiveViewports, auditDialogueLine, auditDialogue, CharacterBubbleConfig } from '../tests/hsk1_collision_engine';

const did = 'hsk1-l6-t3';
const meta = HSK1_SCENE_METADATA[did];
const scene = HSK1_CHARACTER_BOUNDING_BOXES[did];
const viewports = getResponsiveViewports(meta.aspectRatioClass);
const lesson = NEW_HSK1_FULL_LESSONS.find(l => l.lessonNumber === 6)!;
const text = lesson.texts.find(t => t.id === did)!;

const charNames = ['刘小明', '刘明', '王一雪', '刘小雪'];
const candidates: Record<string, CharacterBubbleConfig[]> = {};

for (const cname of charNames) {
  const rec = scene[cname];
  const cLines = text.lines.filter((l) => l.speaker.includes(cname));
  candidates[cname] = [];

  for (let mw of [95, 110, 130]) {
    for (let x = 8; x <= 92; x += 3) {
      for (let y = 8; y <= 90; y += 3) {
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
}

console.log('Candidates count:', charNames.map(c => `${c}: ${candidates[c].length}`).join(', '));

// Filter candidates into spatial quadrants
// 刘小明 (far left): x <= 30
// 刘明 (center-left): y >= 60 || (x >= 25 && x <= 50)
// 王一雪 (center-right): x >= 45 && x <= 75
// 刘小雪 (far right): x >= 70

const c1List = candidates['刘小明'].filter(c => c.bubblePos!.x <= 25 || c.bubblePos!.y >= 75);
const c2List = candidates['刘明'].filter(c => c.bubblePos!.y <= 25 || c.bubblePos!.y >= 75);
const c3List = candidates['王一雪'].filter(c => c.bubblePos!.y >= 70 || c.bubblePos!.y <= 25);
const c4List = candidates['刘小雪'].filter(c => c.bubblePos!.x >= 75);

console.log(`Filtered lists: c1=${c1List.length}, c2=${c2List.length}, c3=${c3List.length}, c4=${c4List.length}`);

const step1 = Math.max(1, Math.floor(c1List.length / 20));
const step2 = Math.max(1, Math.floor(c2List.length / 20));
const step3 = Math.max(1, Math.floor(c3List.length / 20));
const step4 = Math.max(1, Math.floor(c4List.length / 20));

let found = false;
for (let i = 0; i < c1List.length; i += step1) {
  const c1 = c1List[i];
  for (let j = 0; j < c2List.length; j += step2) {
    const c2 = c2List[j];
    if (Math.hypot(c1.bubblePos!.x - c2.bubblePos!.x, c1.bubblePos!.y - c2.bubblePos!.y) < 10) continue;

    for (let k = 0; k < c3List.length; k += step3) {
      const c3 = c3List[k];
      if (Math.hypot(c1.bubblePos!.x - c3.bubblePos!.x, c1.bubblePos!.y - c3.bubblePos!.y) < 10) continue;
      if (Math.hypot(c2.bubblePos!.x - c3.bubblePos!.x, c2.bubblePos!.y - c3.bubblePos!.y) < 10) continue;

      for (let m = 0; m < c4List.length; m += step4) {
        const c4 = c4List[m];
        if (Math.hypot(c1.bubblePos!.x - c4.bubblePos!.x, c1.bubblePos!.y - c4.bubblePos!.y) < 10) continue;
        if (Math.hypot(c2.bubblePos!.x - c4.bubblePos!.x, c2.bubblePos!.y - c4.bubblePos!.y) < 10) continue;
        if (Math.hypot(c3.bubblePos!.x - c4.bubblePos!.x, c3.bubblePos!.y - c4.bubblePos!.y) < 10) continue;

        const testLayout = {
          '刘小明': c1,
          '刘明': c2,
          '王一雪': c3,
          '刘小雪': c4,
        };

        const audit = auditDialogue(did, text.lines, testLayout);
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
  if (found) break;
}

if (!found) console.log('Did not find combo in filtered sample, broadening...');
