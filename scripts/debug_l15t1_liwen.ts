import { NEW_HSK1_FULL_LESSONS } from '../src/data/newHsk1BookData';
import {
  HSK1_CHARACTER_BOUNDING_BOXES,
  HSK1_SCENE_METADATA,
} from '../tests/hsk1_bubble_collision_data';
import {
  auditDialogueLine,
  getResponsiveViewports,
  CharacterBubbleConfig,
} from '../tests/hsk1_collision_engine';

const did = 'hsk1-l15-t1';
const meta = HSK1_SCENE_METADATA[did];
const sceneRegistry = HSK1_CHARACTER_BOUNDING_BOXES[did];
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

const charName = '李文';
const rec = sceneRegistry[charName];
const charLines = lines.filter((l) => l.speaker.includes(charName));

console.log(`Testing ${charName} in ${did}: lines =`, charLines.map((l) => l.hanzi));

const issueTypes: Record<string, number> = {};
let checked = 0;

for (let x = 8; x <= 92; x += 2) {
  for (let y = 8; y <= 90; y += 2) {
    for (const mw of [80, 95, 110, 130, 160]) {
      for (const to of ['left', 'right', 'top', 'bottom', 'bottom-left', 'bottom-right'] as const) {
        checked++;
        const config: CharacterBubbleConfig = {
          mouthTarget: rec.mouth,
          placement: 'custom',
          bubblePos: { x, y },
          tailOrigin: to,
          maxWidth: mw,
        };

        for (let lIdx = 0; lIdx < charLines.length; lIdx++) {
          for (const vp of viewports) {
            const res = auditDialogueLine(
              did,
              lIdx,
              charName,
              charLines[lIdx].hanzi,
              charLines[lIdx].vietnamese || '',
              vp,
              config,
              sceneRegistry,
              meta
            );

            for (const iss of res.issues) {
              issueTypes[iss.type] = (issueTypes[iss.type] || 0) + 1;
            }
          }
        }
      }
    }
  }
}

console.log(`Checked ${checked} configurations. Issue frequency:`, issueTypes);
