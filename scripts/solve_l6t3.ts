import { NEW_HSK1_FULL_LESSONS } from '../src/data/newHsk1BookData';
import { HSK1_CHARACTER_BOUNDING_BOXES, HSK1_SCENE_METADATA } from '../tests/hsk1_bubble_collision_data';
import { getResponsiveViewports, auditDialogueLine, auditDialogue, CharacterBubbleConfig } from '../tests/hsk1_collision_engine';

const did = 'hsk1-l6-t3';
const meta = HSK1_SCENE_METADATA[did];
const scene = HSK1_CHARACTER_BOUNDING_BOXES[did];
const viewports = getResponsiveViewports(meta.aspectRatioClass);
const lesson = NEW_HSK1_FULL_LESSONS.find(l => l.lessonNumber === 6)!;
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

  if (cLines.length === 0) {
    candidates[cname].push({
      mouthTarget: rec.mouth,
      placement: 'custom',
      bubblePos: { x: rec.mouth.x > 50 ? 85 : 15, y: 85 },
      tailOrigin: 'bottom',
      maxWidth: 150,
    });
    continue;
  }

  for (let mw of [95, 110, 130, 150, 180]) {
    for (let x = 8; x <= 92; x += 2) {
      for (let y = 8; y <= 88; y += 2) {
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

// Find combination
const speakingChars = charNames.filter(c => text.lines.some(l => l.speaker.includes(c)));
console.log('Speaking characters:', speakingChars);

if (speakingChars.length === 2) {
  const list1 = candidates[speakingChars[0]];
  const list2 = candidates[speakingChars[1]];
  const step1 = Math.max(1, Math.floor(list1.length / 40));
  const step2 = Math.max(1, Math.floor(list2.length / 40));

  for (let i = 0; i < list1.length; i += step1) {
    for (let j = 0; j < list2.length; j += step2) {
      const c1 = list1[i];
      const c2 = list2[j];
      const dist = Math.hypot(c1.bubblePos!.x - c2.bubblePos!.x, c1.bubblePos!.y - c2.bubblePos!.y);
      if (dist < 10) continue;

      const testLayout: Record<string, CharacterBubbleConfig> = {};
      for (const cn of charNames) {
        testLayout[cn] = candidates[cn][0];
      }
      testLayout[speakingChars[0]] = c1;
      testLayout[speakingChars[1]] = c2;

      const audit = auditDialogue(did, text.lines, testLayout);
      if (audit.status === 'PASS') {
        console.log(`>>> FOUND PASSING COMBO FOR ${did}!`);
        console.log(JSON.stringify(testLayout, null, 2));
        process.exit(0);
      }
    }
  }
}
