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

function solveDialogue(did: string) {
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

  const charNames = Object.keys(scene);
  const candidates: Record<string, CharacterBubbleConfig[]> = {};

  for (const cname of charNames) {
    const rec = scene[cname];
    const cLines = lines.filter((l) => l.speaker.includes(cname));
    candidates[cname] = [];

    for (let mw of [95, 110, 130, 160]) {
      for (let x = 10; x <= 90; x += 2) {
        for (let y = 10; y <= 85; y += 2) {
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
    console.log(`${did} ${cname}: ${candidates[cname].length} valid candidates`);
  }

  // Find a passing combo
  if (charNames.length === 2) {
    const list1 = candidates[charNames[0]];
    const list2 = candidates[charNames[1]];
    // Sample evenly across the lists
    const step1 = Math.max(1, Math.floor(list1.length / 50));
    const step2 = Math.max(1, Math.floor(list2.length / 50));

    for (let i = 0; i < list1.length; i += step1) {
      for (let j = 0; j < list2.length; j += step2) {
        const c1 = list1[i];
        const c2 = list2[j];
        const dist = Math.hypot(c1.bubblePos!.x - c2.bubblePos!.x, c1.bubblePos!.y - c2.bubblePos!.y);
        if (dist < 10) continue;

        const testLayout = { [charNames[0]]: c1, [charNames[1]]: c2 };
        const audit = auditDialogue(did, lines, testLayout);
        if (audit.status === 'PASS') {
          console.log(`>>> FOUND PASSING COMBO FOR ${did}!`);
          console.log(JSON.stringify(testLayout, null, 2));
          return testLayout;
        }
      }
    }
  }

  console.log(`Failed to find combo for ${did}`);
  return null;
}

solveDialogue('hsk1-l2-t1');
solveDialogue('hsk1-l6-t1');
