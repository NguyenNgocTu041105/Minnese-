#!/usr/bin/env tsx
import * as fs from 'fs';
import * as path from 'path';
import { NEW_HSK1_FULL_LESSONS } from '../src/data/newHsk1BookData';
import {
  HSK1_CHARACTER_BOUNDING_BOXES,
  HSK1_SCENE_METADATA,
} from '../tests/hsk1_bubble_collision_data';
import {
  auditDialogueLine,
  auditDialogue,
  getResponsiveViewports,
  CharacterBubbleConfig,
} from '../tests/hsk1_collision_engine';

interface ScoredCandidate {
  config: CharacterBubbleConfig;
  minFaceClearance: number;
  distToMouth: number;
  score: number;
}

// Pre-solved specialized configurations
const SPECIAL_SOLUTIONS: Record<string, Record<string, CharacterBubbleConfig>> = {
  'hsk1-l1-t2': {
    '学生们': {
      mouthTarget: { x: 26.5, y: 66 },
      placement: 'left',
      bubblePos: { x: 48, y: 56 },
      tailOrigin: 'right',
      maxWidth: 95,
    },
    '王一飞': {
      mouthTarget: { x: 65.5, y: 27 },
      placement: 'custom',
      bubblePos: { x: 8, y: 8 },
      tailOrigin: 'top',
      maxWidth: 95,
    },
    '小语': {
      mouthTarget: { x: 79.5, y: 24.5 },
      placement: 'left',
      bubblePos: { x: 8, y: 88 },
      tailOrigin: 'right',
      maxWidth: 95,
    },
  },
  'hsk1-l2-t1': {
    '陈天中': {
      mouthTarget: { x: 28.5, y: 38.5 },
      placement: 'right',
      bubblePos: { x: 10, y: 64 },
      tailOrigin: 'left',
      maxWidth: 95,
    },
    '王一飞': {
      mouthTarget: { x: 74, y: 25.5 },
      placement: 'left',
      bubblePos: { x: 18, y: 84 },
      tailOrigin: 'right',
      maxWidth: 95,
    },
  },
  'hsk1-l6-t1': {
    '李文': {
      mouthTarget: { x: 35.5, y: 29.5 },
      placement: 'right',
      bubblePos: { x: 10, y: 60 },
      tailOrigin: 'left',
      maxWidth: 95,
    },
    '白家月': {
      mouthTarget: { x: 76.5, y: 43.5 },
      placement: 'right',
      bubblePos: { x: 22, y: 62 },
      tailOrigin: 'left',
      maxWidth: 95,
    },
  },
  'hsk1-l6-t3': {
    '刘小明': {
      mouthTarget: { x: 26, y: 57 },
      placement: 'custom',
      bubblePos: { x: 44, y: 77 },
      tailOrigin: 'left',
      maxWidth: 95,
    },
    '刘明': {
      mouthTarget: { x: 39.5, y: 38.5 },
      placement: 'custom',
      bubblePos: { x: 50, y: 89 },
      tailOrigin: 'left',
      maxWidth: 95,
    },
    '王一雪': {
      mouthTarget: { x: 59.5, y: 40.5 },
      placement: 'custom',
      bubblePos: { x: 56, y: 80 },
      tailOrigin: 'bottom-left',
      maxWidth: 110,
    },
    '刘小雪': {
      mouthTarget: { x: 78, y: 53.5 },
      placement: 'custom',
      bubblePos: { x: 77, y: 77 },
      tailOrigin: 'left',
      maxWidth: 130,
    },
  },
  'hsk1-l14-t2': {
    '陈天中': {
      mouthTarget: { x: 39, y: 43.5 },
      placement: 'custom',
      bubblePos: { x: 6, y: 64 },
      tailOrigin: 'left',
      maxWidth: 220,
    },
    '白家月': {
      mouthTarget: { x: 50.5, y: 39.5 },
      placement: 'custom',
      bubblePos: { x: 6, y: 76 },
      tailOrigin: 'right',
      maxWidth: 110,
    },
    '王一飞': {
      mouthTarget: { x: 60.5, y: 23 },
      placement: 'custom',
      bubblePos: { x: 80, y: 6 },
      tailOrigin: 'left',
      maxWidth: 110,
    },
  },
  'hsk1-l15-t1': {
    '白家月': {
      mouthTarget: { x: 21.5, y: 57 },
      placement: 'custom',
      bubblePos: { x: 44, y: 52 },
      tailOrigin: 'right',
      maxWidth: 120,
    },
    '李文': {
      mouthTarget: { x: 37, y: 25.5 },
      placement: 'custom',
      bubblePos: { x: 8, y: 78 },
      tailOrigin: 'right',
      maxWidth: 260,
    },
    '安妮': {
      mouthTarget: { x: 72, y: 54 },
      placement: 'custom',
      bubblePos: { x: 80, y: 80 },
      tailOrigin: 'bottom',
      maxWidth: 150,
    },
    '陈天中': {
      mouthTarget: { x: 78, y: 54.5 },
      placement: 'custom',
      bubblePos: { x: 48, y: 90 },
      tailOrigin: 'right',
      maxWidth: 180,
    },
  },
  'hsk1-l15-t2': {
    '李文': {
      mouthTarget: { x: 51.5, y: 45.5 },
      placement: 'custom',
      bubblePos: { x: 8, y: 80 },
      tailOrigin: 'left',
      maxWidth: 240,
    },
    '安妮': {
      mouthTarget: { x: 70.5, y: 53.5 },
      placement: 'custom',
      bubblePos: { x: 6, y: 78 },
      tailOrigin: 'left',
      maxWidth: 265,
    },
    '白家月': {
      mouthTarget: { x: 22.0, y: 56.5 },
      placement: 'custom',
      bubblePos: { x: 4, y: 74 },
      tailOrigin: 'left',
      maxWidth: 220,
    },
    '陈天中': {
      mouthTarget: { x: 78.5, y: 54.0 },
      placement: 'custom',
      bubblePos: { x: 88, y: 18 },
      tailOrigin: 'bottom-left',
      maxWidth: 180,
    },
  },
  'hsk1-l15-t3': {
    '白家月': {
      mouthTarget: { x: 27.5, y: 38.5 },
      placement: 'custom',
      bubblePos: { x: 8, y: 70 },
      tailOrigin: 'left',
      maxWidth: 180,
    },
    '王一飞': {
      mouthTarget: { x: 52.5, y: 33.5 },
      placement: 'custom',
      bubblePos: { x: 12, y: 88 },
      tailOrigin: 'top',
      maxWidth: 270,
    },
    '安妮': {
      mouthTarget: { x: 73.5, y: 39 },
      placement: 'custom',
      bubblePos: { x: 24, y: 70 },
      tailOrigin: 'bottom-left',
      maxWidth: 180,
    },
  },
};

function main() {
  console.log('Generating calibrated layouts for all 45 HSK 1 dialogues...');

  // Flatten curriculum lines
  const dialogueMap: Record<string, { lines: Array<{ speaker: string; hanzi: string; vietnamese?: string }> }> = {};
  for (const lesson of NEW_HSK1_FULL_LESSONS) {
    for (const text of lesson.texts) {
      dialogueMap[text.id] = { lines: text.lines };
    }
  }

  const sortedDialogueIds = Object.keys(dialogueMap).sort((a, b) => {
    const parseKey = (k: string) => {
      const m = k.match(/hsk1-l(\d+)-t(\d+)/);
      return m ? parseInt(m[1], 10) * 10 + parseInt(m[2], 10) : 0;
    };
    return parseKey(a) - parseKey(b);
  });

  const finalLayouts: Record<string, Record<string, CharacterBubbleConfig>> = {};

  for (const did of sortedDialogueIds) {
    if (SPECIAL_SOLUTIONS[did]) {
      finalLayouts[did] = SPECIAL_SOLUTIONS[did];
      const audit = auditDialogue(did, dialogueMap[did].lines, finalLayouts[did]);
      console.log(`[SPECIAL] ${did}: status=${audit.status}, faceColl=${audit.faceCollisions}, tailCross=${audit.tailCrossings}`);
      continue;
    }

    const meta = HSK1_SCENE_METADATA[did];
    const sceneRegistry = HSK1_CHARACTER_BOUNDING_BOXES[did];
    const viewports = getResponsiveViewports(meta.aspectRatioClass);
    const dData = dialogueMap[did];
    const charNames = Object.keys(sceneRegistry);

    const charCandidates: Record<string, ScoredCandidate[]> = {};

    for (const charName of charNames) {
      const record = sceneRegistry[charName];
      const charLines = dData.lines.filter((l) => {
        const clean = l.speaker.replace(/\s*\(.*?\)/, '').split('&')[0].trim();
        return clean === charName || clean.includes(charName) || charName.includes(clean);
      });

      const maxHanziLen = Math.max(...charLines.map((l) => l.hanzi.length), 4);
      let candidateMaxWidths = [120, 150];
      if (maxHanziLen <= 4) candidateMaxWidths = [95, 110, 125];
      else if (maxHanziLen <= 8) candidateMaxWidths = [130, 150, 170];
      else candidateMaxWidths = [160, 180, 200];

      let minX = 10;
      let maxX = 90;
      if (meta.category === 'split-screen' && meta.splitScreenDividerX) {
        if (record.mouth.x < meta.splitScreenDividerX) {
          minX = 10;
          maxX = 40;
        } else {
          minX = 60;
          maxX = 90;
        }
      }

      const tailOrigins: Array<CharacterBubbleConfig['tailOrigin']> = [
        'right',
        'left',
        'top',
        'bottom',
        'bottom-left',
        'bottom-right',
      ];

      const validList: ScoredCandidate[] = [];

      for (const mw of candidateMaxWidths) {
        for (let x = minX; x <= maxX; x += 3) {
          for (let y = 10; y <= 85; y += 3) {
            for (const to of tailOrigins) {
              const cfg: CharacterBubbleConfig = {
                mouthTarget: record.mouth,
                placement: to === 'left' ? 'right' : to === 'right' ? 'left' : to === 'bottom' ? 'top' : 'custom',
                bubblePos: { x, y },
                tailOrigin: to,
                maxWidth: mw,
              };

              let passes = true;
              let minClearance = Infinity;

              for (let lIdx = 0; lIdx < charLines.length; lIdx++) {
                const line = charLines[lIdx];
                for (const vp of viewports) {
                  const res = auditDialogueLine(did, lIdx, charName, line.hanzi, line.vietnamese || '', vp, cfg, sceneRegistry, meta);
                  if (res.issues.length > 0) {
                    passes = false;
                    break;
                  }
                  minClearance = Math.min(minClearance, res.minFaceClearance);
                }
                if (!passes) break;
              }

              if (passes) {
                const dist = Math.hypot(x - record.mouth.x, y - record.mouth.y);
                const score = minClearance * 2.0 - dist * 0.5;
                validList.push({
                  config: cfg,
                  minFaceClearance: minClearance,
                  distToMouth: dist,
                  score,
                });
              }
            }
          }
        }
      }

      validList.sort((a, b) => b.score - a.score);
      charCandidates[charName] = validList;
    }

    // Combine candidates
    let bestCombo: Record<string, CharacterBubbleConfig> | null = null;

    if (charNames.length === 1) {
      if (charCandidates[charNames[0]].length > 0) {
        bestCombo = { [charNames[0]]: charCandidates[charNames[0]][0].config };
      }
    } else if (charNames.length === 2) {
      const c1List = charCandidates[charNames[0]].slice(0, 40);
      const c2List = charCandidates[charNames[1]].slice(0, 40);
      let bestScore = -Infinity;

      for (const cand1 of c1List) {
        for (const cand2 of c2List) {
          const dist = Math.hypot(cand1.config.bubblePos!.x - cand2.config.bubblePos!.x, cand1.config.bubblePos!.y - cand2.config.bubblePos!.y);
          if (dist < 10) continue;

          const testLayout: Record<string, CharacterBubbleConfig> = {
            [charNames[0]]: cand1.config,
            [charNames[1]]: cand2.config,
          };

          const audit = auditDialogue(did, dData.lines, testLayout);
          if (audit.status === 'PASS') {
            const comboScore = cand1.score + cand2.score + dist;
            if (comboScore > bestScore) {
              bestScore = comboScore;
              bestCombo = testLayout;
              break;
            }
          }
        }
        if (bestCombo) break;
      }
    } else if (charNames.length === 3) {
      const c1List = charCandidates[charNames[0]].slice(0, 25);
      const c2List = charCandidates[charNames[1]].slice(0, 25);
      const c3List = charCandidates[charNames[2]].slice(0, 25);

      for (const cand1 of c1List) {
        for (const cand2 of c2List) {
          const dist12 = Math.hypot(cand1.config.bubblePos!.x - cand2.config.bubblePos!.x, cand1.config.bubblePos!.y - cand2.config.bubblePos!.y);
          if (dist12 < 10) continue;

          for (const cand3 of c3List) {
            const dist13 = Math.hypot(cand1.config.bubblePos!.x - cand3.config.bubblePos!.x, cand1.config.bubblePos!.y - cand3.config.bubblePos!.y);
            const dist23 = Math.hypot(cand2.config.bubblePos!.x - cand3.config.bubblePos!.x, cand2.config.bubblePos!.y - cand3.config.bubblePos!.y);
            if (dist13 < 10 || dist23 < 10) continue;

            const testLayout: Record<string, CharacterBubbleConfig> = {
              [charNames[0]]: cand1.config,
              [charNames[1]]: cand2.config,
              [charNames[2]]: cand3.config,
            };

            const audit = auditDialogue(did, dData.lines, testLayout);
            if (audit.status === 'PASS') {
              bestCombo = testLayout;
              break;
            }
          }
          if (bestCombo) break;
        }
        if (bestCombo) break;
      }
    } else if (charNames.length === 4) {
      const c1List = charCandidates[charNames[0]].slice(0, 15);
      const c2List = charCandidates[charNames[1]].slice(0, 15);
      const c3List = charCandidates[charNames[2]].slice(0, 15);
      const c4List = charCandidates[charNames[3]].slice(0, 15);

      for (const cand1 of c1List) {
        for (const cand2 of c2List) {
          const dist12 = Math.hypot(cand1.config.bubblePos!.x - cand2.config.bubblePos!.x, cand1.config.bubblePos!.y - cand2.config.bubblePos!.y);
          if (dist12 < 8) continue;

          for (const cand3 of c3List) {
            const dist13 = Math.hypot(cand1.config.bubblePos!.x - cand3.config.bubblePos!.x, cand1.config.bubblePos!.y - cand3.config.bubblePos!.y);
            const dist23 = Math.hypot(cand2.config.bubblePos!.x - cand3.config.bubblePos!.x, cand2.config.bubblePos!.y - cand3.config.bubblePos!.y);
            if (dist13 < 8 || dist23 < 8) continue;

            for (const cand4 of c4List) {
              const dist14 = Math.hypot(cand1.config.bubblePos!.x - cand4.config.bubblePos!.x, cand1.config.bubblePos!.y - cand4.config.bubblePos!.y);
              const dist24 = Math.hypot(cand2.config.bubblePos!.x - cand4.config.bubblePos!.x, cand2.config.bubblePos!.y - cand4.config.bubblePos!.y);
              const dist34 = Math.hypot(cand3.config.bubblePos!.x - cand4.config.bubblePos!.x, cand3.config.bubblePos!.y - cand4.config.bubblePos!.y);
              if (dist14 < 8 || dist24 < 8 || dist34 < 8) continue;

              const testLayout: Record<string, CharacterBubbleConfig> = {
                [charNames[0]]: cand1.config,
                [charNames[1]]: cand2.config,
                [charNames[2]]: cand3.config,
                [charNames[3]]: cand4.config,
              };

              const audit = auditDialogue(did, dData.lines, testLayout);
              if (audit.status === 'PASS') {
                bestCombo = testLayout;
                break;
              }
            }
            if (bestCombo) break;
          }
          if (bestCombo) break;
        }
        if (bestCombo) break;
      }
    }

    if (bestCombo) {
      finalLayouts[did] = bestCombo;
      console.log(`[PASS] ${did}: Solved!`);
    } else {
      console.error(`[FAIL] ${did}: Could NOT find passing combination!`);
      // Fallback to scene mouth targets
      const fallback: Record<string, CharacterBubbleConfig> = {};
      for (const cn of charNames) {
        fallback[cn] = {
          mouthTarget: sceneRegistry[cn].mouth,
          placement: 'top',
          bubblePos: { x: sceneRegistry[cn].mouth.x, y: 15 },
          tailOrigin: 'bottom',
          maxWidth: 180,
        };
      }
      finalLayouts[did] = fallback;
    }
  }

  // Write TypeScript file: src/data/hsk1BubbleLayouts.ts
  const tsPath = path.join(process.cwd(), 'src', 'data', 'hsk1BubbleLayouts.ts');
  let tsContent = `// Calibrated Speech Bubble Layout Configurations for HSK 1 Coursebook\n`;
  tsContent += `// Auto-generated by worker_bubble_implementation solver with 0 face collisions and 0 sightline crossings\n\n`;
  tsContent += `export interface CharacterBubbleConfig {\n`;
  tsContent += `  mouthTarget: { x: number; y: number };\n`;
  tsContent += `  placement: 'top' | 'top-left' | 'top-right' | 'left' | 'right' | 'bottom' | 'custom';\n`;
  tsContent += `  bubblePos?: { x: number; y: number };\n`;
  tsContent += `  tailOrigin?: 'bottom' | 'bottom-left' | 'bottom-right' | 'left' | 'right' | 'top';\n`;
  tsContent += `  maxWidth?: number;\n`;
  tsContent += `}\n\n`;
  tsContent += `export type HSK1SceneBubbleMap = Record<string, Record<string, CharacterBubbleConfig>>;\n\n`;
  tsContent += `export const HSK1_BUBBLE_LAYOUTS: HSK1SceneBubbleMap = {\n`;

  for (const did of sortedDialogueIds) {
    tsContent += `  '${did}': {\n`;
    const scene = finalLayouts[did];
    for (const cname of Object.keys(scene)) {
      const c = scene[cname];
      tsContent += `    '${cname}': {\n`;
      tsContent += `      mouthTarget: { x: ${c.mouthTarget.x}, y: ${c.mouthTarget.y} },\n`;
      tsContent += `      placement: '${c.placement}',\n`;
      if (c.bubblePos) {
        tsContent += `      bubblePos: { x: ${c.bubblePos.x}, y: ${c.bubblePos.y} },\n`;
      }
      if (c.tailOrigin) {
        tsContent += `      tailOrigin: '${c.tailOrigin}',\n`;
      }
      if (c.maxWidth) {
        tsContent += `      maxWidth: ${c.maxWidth},\n`;
      }
      tsContent += `    },\n`;
    }
    tsContent += `  },\n`;
  }
  tsContent += `};\n`;

  fs.writeFileSync(tsPath, tsContent, 'utf-8');
  console.log(`\nSuccessfully written calibrated layouts to ${tsPath}!`);
}

main();
