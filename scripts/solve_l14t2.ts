import { NEW_HSK1_FULL_LESSONS } from '../src/data/newHsk1BookData';
import { HSK1_CHARACTER_BOUNDING_BOXES, HSK1_SCENE_METADATA } from '../tests/hsk1_bubble_collision_data';
import { getResponsiveViewports, auditDialogueLine, auditDialogue, CharacterBubbleConfig } from '../tests/hsk1_collision_engine';

const did = 'hsk1-l14-t2';
const meta = HSK1_SCENE_METADATA[did];
const scene = HSK1_CHARACTER_BOUNDING_BOXES[did];
const viewports = getResponsiveViewports(meta.aspectRatioClass);
const lesson = NEW_HSK1_FULL_LESSONS.find(l => l.lessonNumber === 14)!;
const text = lesson.texts.find(t => t.id === did)!;

console.log('Scene:', JSON.stringify(scene, null, 2));
console.log('Lines:');
text.lines.forEach((l, i) => console.log(`  [${i}] ${l.speaker}: "${l.hanzi}"`));

const charNames = Object.keys(scene);
const candidates: Record<string, CharacterBubbleConfig[]> = {};

for (const cname of charNames) {
  const rec = scene[cname];
  const cLines = text.lines.filter((l) => l.speaker.includes(cname));
  candidates[cname] = [];

  const maxWList = cname === '陈天中' ? [220, 250, 270] : [110, 130, 150, 180];

  for (let mw of maxWList) {
    for (let x = 6; x <= 94; x += 2) {
      for (let y = 6; y <= 92; y += 2) {
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

const list1 = candidates[charNames[0]];
const list2 = candidates[charNames[1]];
const list3 = candidates[charNames[2]];

const step1 = Math.max(1, Math.floor(list1.length / 30));
const step2 = Math.max(1, Math.floor(list2.length / 30));
const step3 = Math.max(1, Math.floor(list3.length / 30));

let found = false;
for (let i = 0; i < list1.length; i += step1) {
  const c1 = list1[i];
  for (let j = 0; j < list2.length; j += step2) {
    const c2 = list2[j];
    if (Math.hypot(c1.bubblePos!.x - c2.bubblePos!.x, c1.bubblePos!.y - c2.bubblePos!.y) < 10) continue;

    for (let k = 0; k < list3.length; k += step3) {
      const c3 = list3[k];
      if (Math.hypot(c1.bubblePos!.x - c3.bubblePos!.x, c1.bubblePos!.y - c3.bubblePos!.y) < 10) continue;
      if (Math.hypot(c2.bubblePos!.x - c3.bubblePos!.x, c2.bubblePos!.y - c3.bubblePos!.y) < 10) continue;

      const testLayout = {
        [charNames[0]]: c1,
        [charNames[1]]: c2,
        [charNames[2]]: c3,
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
