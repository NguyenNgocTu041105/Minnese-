import { NEW_HSK1_FULL_LESSONS } from '../src/data/newHsk1BookData';
import { HSK1_CHARACTER_BOUNDING_BOXES, HSK1_SCENE_METADATA } from '../tests/hsk1_bubble_collision_data';
import { getResponsiveViewports, auditDialogueLine, CharacterBubbleConfig } from '../tests/hsk1_collision_engine';

const did = 'hsk1-l15-t2';
const meta = HSK1_SCENE_METADATA[did];
const scene = HSK1_CHARACTER_BOUNDING_BOXES[did];
const viewports = getResponsiveViewports(meta.aspectRatioClass);
const lesson = NEW_HSK1_FULL_LESSONS.find(l => l.lessonNumber === 15)!;
const text = lesson.texts.find(t => t.id === did)!;
const bLine = text.lines[2]; // 白家月

let minIssues = 999;
let bestCfg: any = null;
let bestVpStats: any = null;

for (let mw of [160, 180, 200, 220, 240, 260, 280]) {
  for (let x = 4; x <= 96; x += 2) {
    for (let y = 4; y <= 96; y += 2) {
      for (const to of ['left', 'right', 'top', 'bottom', 'bottom-left', 'bottom-right'] as const) {
        const cfg: CharacterBubbleConfig = {
          mouthTarget: scene['白家月'].mouth,
          placement: 'custom',
          bubblePos: { x, y },
          tailOrigin: to,
          maxWidth: mw,
        };

        let totalIssues = 0;
        const vpIssues: Record<string, string[]> = {};
        for (const vp of viewports) {
          const res = auditDialogueLine(did, 2, '白家月', bLine.hanzi, bLine.vietnamese || '', vp, cfg, scene, meta);
          totalIssues += res.issues.length;
          if (res.issues.length > 0) {
            vpIssues[vp.name] = res.issues.map(i => i.type);
          }
        }

        if (totalIssues < minIssues) {
          minIssues = totalIssues;
          bestCfg = cfg;
          bestVpStats = vpIssues;
          console.log(`New best: totalIssues=${minIssues}, cfg=`, JSON.stringify(bestCfg), 'vpIssues=', bestVpStats);
          if (minIssues === 0) {
            console.log('PERFECT PASS FOUND!');
            process.exit(0);
          }
        }
      }
    }
  }
}

console.log(`Search finished. minIssues=${minIssues}, bestCfg=`, JSON.stringify(bestCfg), 'vpStats=', bestVpStats);
