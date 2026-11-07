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

console.log('Lines for', did);
lines.forEach((l, i) => console.log(i, l.speaker, l.hanzi));

for (const charName of ['白家月', '安妮']) {
  const rec = scene[charName];
  const charLines = lines.filter((l) => l.speaker.includes(charName));
  console.log(`\nTesting issues for ${charName}:`);
  const issueCounts: Record<string, number> = {};

  for (let mw of [90, 110, 140, 180, 220, 260]) {
    for (let x = 8; x <= 92; x += 4) {
      for (let y = 8; y <= 90; y += 4) {
        for (const to of ['left', 'right', 'top', 'bottom', 'bottom-left', 'bottom-right'] as const) {
          const cfg = {
            mouthTarget: rec.mouth,
            placement: 'custom' as const,
            bubblePos: { x, y },
            tailOrigin: to,
            maxWidth: mw,
          };
          for (let lIdx = 0; lIdx < charLines.length; lIdx++) {
            const line = charLines[lIdx];
            for (const vp of viewports) {
              const res = auditDialogueLine(did, lIdx, charName, line.hanzi, line.vietnamese || '', vp, cfg, scene, meta);
              for (const iss of res.issues) {
                issueCounts[iss.type] = (issueCounts[iss.type] || 0) + 1;
              }
            }
          }
        }
      }
    }
  }
  console.log('Issue counts:', issueCounts);
}
