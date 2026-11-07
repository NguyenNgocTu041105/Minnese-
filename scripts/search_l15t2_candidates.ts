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

  if (cLines.length === 0) {
    candidates[cname].push({
      mouthTarget: rec.mouth,
      placement: 'custom',
      bubblePos: { x: 84, y: 18 },
      tailOrigin: 'bottom-left',
      maxWidth: 180,
    });
    console.log(`${cname} (non-speaking): 1 config`);
    continue;
  }

  // Test wide range of maxWidths: from 140 to 290
  for (let mw of [160, 200, 240, 260, 280]) {
    for (let x = 6; x <= 94; x += 2) {
      for (let y = 6; y <= 94; y += 2) {
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
