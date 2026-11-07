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
const bLine = lines[2];

// Check which viewports fail and what the minimum number of issues is
let minIssues = 999;
let bestIssues: any[] = [];
let bestCfg: any = null;

for (let mw = 80; mw <= 350; mw += 10) {
  for (let x = 6; x <= 94; x += 2) {
    for (let y = 6; y <= 94; y += 2) {
      for (const to of ['left', 'right', 'top', 'bottom', 'bottom-left', 'bottom-right'] as const) {
        const cfg = {
          mouthTarget: scene['白家月'].mouth,
          placement: 'custom' as any,
          bubblePos: { x, y },
          tailOrigin: to,
          maxWidth: mw,
        };

        const issues: string[] = [];
        for (const vp of viewports) {
          const res = auditDialogueLine(did, 2, '白家月', bLine.hanzi, bLine.vietnamese || '', vp, cfg, scene, meta);
          for (const iss of res.issues) {
            issues.push(`[${vp.name}] ${iss.type}: ${iss.message}`);
          }
        }

        if (issues.length === 0) {
          console.log(`FOUND 100% PASS FOR 白家月:`, JSON.stringify(cfg));
          process.exit(0);
        }

        if (issues.length < minIssues) {
          minIssues = issues.length;
          bestIssues = issues;
          bestCfg = cfg;
        }
      }
    }
  }
}

console.log(`Min issues: ${minIssues}`);
console.log(`Best cfg:`, JSON.stringify(bestCfg));
console.log(`Best issues:`, bestIssues);
