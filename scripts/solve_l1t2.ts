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

const did = 'hsk1-l1-t2';
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

const charNames = ['学生们', '王一飞', '小语'];
const candidates: Record<string, CharacterBubbleConfig[]> = {};

for (const cname of charNames) {
  const rec = scene[cname];
  const cLines = lines.filter((l) => l.speaker.includes(cname));
  candidates[cname] = [];

  for (let mw of [95, 110, 130]) {
    for (let x = 8; x <= 92; x += 2) {
      for (let y = 8; y <= 88; y += 2) {
        for (const to of ['left', 'right', 'top', 'bottom', 'bottom-left', 'bottom-right'] as const) {
          const cfg = {
            mouthTarget: rec.mouth,
            placement: to === 'left' ? 'right' : to === 'right' ? 'left' : 'custom' as any,
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

// Search triplet
const list1 = candidates['学生们'];
const list2 = candidates['王一飞'];
const list3 = candidates['小语'];

const step1 = Math.max(1, Math.floor(list1.length / 30));
const step2 = Math.max(1, Math.floor(list2.length / 30));
const step3 = Math.max(1, Math.floor(list3.length / 30));

let found = false;
for (let i = 0; i < list1.length; i += step1) {
  for (let j = 0; j < list2.length; j += step2) {
    const c1 = list1[i];
    const c2 = list2[j];
    const d12 = Math.hypot(c1.bubblePos!.x - c2.bubblePos!.x, c1.bubblePos!.y - c2.bubblePos!.y);
    if (d12 < 10) continue;

    for (let k = 0; k < list3.length; k += step3) {
      const c3 = list3[k];
      const d13 = Math.hypot(c1.bubblePos!.x - c3.bubblePos!.x, c1.bubblePos!.y - c3.bubblePos!.y);
      const d23 = Math.hypot(c2.bubblePos!.x - c3.bubblePos!.x, c2.bubblePos!.y - c3.bubblePos!.y);
      if (d13 < 10 || d23 < 10) continue;

      const testLayout = { '学生们': c1, '王一飞': c2, '小语': c3 };
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
if (!found) console.log('Failed to find combo for hsk1-l1-t2');
