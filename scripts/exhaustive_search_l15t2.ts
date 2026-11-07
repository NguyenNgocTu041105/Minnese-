import {
  getResponsiveViewports,
  auditDialogueLine,
} from '../tests/hsk1_collision_engine';
import {
  HSK1_CHARACTER_BOUNDING_BOXES,
  HSK1_SCENE_METADATA,
} from '../tests/hsk1_bubble_collision_data';
import { NEW_HSK1_FULL_LESSONS } from '../src/data/newHsk1BookData';

const did = 'hsk1-l15-t2';
const meta = HSK1_SCENE_METADATA[did];
const scene = HSK1_CHARACTER_BOUNDING_BOXES[did];
const viewports = getResponsiveViewports(meta.aspectRatioClass);
const lines = NEW_HSK1_FULL_LESSONS.find(l => l.lessonNumber === 15)!.texts.find(t => t.id === did)!.lines;

for (const charName of ['安妮', '白家月']) {
  const rec = scene[charName];
  const charLines = lines.filter((l) => l.speaker.includes(charName));
  console.log(`\n================ Searching for ${charName} ================`);

  let bestFailCount = 999;
  let bestIssues: any[] = [];
  let bestCfg: any = null;

  for (let mw = 80; mw <= 280; mw += 5) {
    for (let x = 6; x <= 94; x += 1) {
      for (let y = 6; y <= 94; y += 1) {
        for (const to of ['left', 'right', 'top', 'bottom', 'bottom-left', 'bottom-right'] as const) {
          const cfg = {
            mouthTarget: rec.mouth,
            placement: 'custom' as const,
            bubblePos: { x, y },
            tailOrigin: to,
            maxWidth: mw,
          };

          let allPass = true;
          let failCount = 0;
          let currentIssues: any[] = [];

          for (let lIdx = 0; lIdx < charLines.length; lIdx++) {
            const line = charLines[lIdx];
            for (const vp of viewports) {
              const res = auditDialogueLine(did, lIdx, charName, line.hanzi, line.vietnamese || '', vp, cfg, scene, meta);
              if (res.issues.length > 0) {
                allPass = false;
                failCount += res.issues.length;
                currentIssues.push(...res.issues.map(i => `[${vp.name}] ${i.type}: ${i.message}`));
              }
            }
          }

          if (allPass) {
            console.log(`FOUND 100% PASSING CFG FOR ${charName}:`, JSON.stringify(cfg));
            bestFailCount = 0;
            break;
          }

          if (failCount < bestFailCount) {
            bestFailCount = failCount;
            bestIssues = currentIssues;
            bestCfg = cfg;
          }
        }
        if (bestFailCount === 0) break;
      }
      if (bestFailCount === 0) break;
    }
    if (bestFailCount === 0) break;
  }

  if (bestFailCount > 0) {
    console.log(`Could not find 100% pass for ${charName}. Best fail count: ${bestFailCount}`);
    console.log(`Best cfg:`, JSON.stringify(bestCfg));
    console.log(`Best issues:`, bestIssues.slice(0, 5));
  }
}
