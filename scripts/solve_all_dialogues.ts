#!/usr/bin/env tsx
// Batch Solver for HSK 1 Speech Bubble Coordinates across all 45 Dialogues
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
  aabbCollisionTest,
  resolveBubbleBoundingBox,
  estimateBubbleDimensions,
} from '../tests/hsk1_collision_engine';

interface ScoredCandidate {
  config: CharacterBubbleConfig;
  minFaceClearance: number;
  distToMouth: number;
  score: number;
}

function solveAllDialogues() {
  console.log('Starting Batch Solver for 45 HSK 1 Dialogues...');

  // 1. Gather all dialogue lines
  const dialogueMap: Record<string, { lesson: number; textIndex: number; title: string; lines: Array<{ speaker: string; hanzi: string; vietnamese?: string }> }> = {};
  for (const lesson of NEW_HSK1_FULL_LESSONS) {
    lesson.texts.forEach((text, tIdx) => {
      dialogueMap[text.id] = {
        lesson: lesson.lessonNumber,
        textIndex: tIdx + 1,
        title: text.title,
        lines: text.lines,
      };
    });
  }

  const sortedDialogueIds = Object.keys(dialogueMap).sort((a, b) => {
    const parseKey = (k: string) => {
      const m = k.match(/hsk1-l(\d+)-t(\d+)/);
      return m ? parseInt(m[1], 10) * 10 + parseInt(m[2], 10) : 0;
    };
    return parseKey(a) - parseKey(b);
  });

  const finalLayouts: Record<string, Record<string, CharacterBubbleConfig>> = {};
  let totalSolved = 0;
  let totalFailed = 0;

  for (const did of sortedDialogueIds) {
    const meta = HSK1_SCENE_METADATA[did];
    const sceneRegistry = HSK1_CHARACTER_BOUNDING_BOXES[did];
    const viewports = getResponsiveViewports(meta.aspectRatioClass);
    const dData = dialogueMap[did];
    const charNames = Object.keys(sceneRegistry);

    // Candidates per character
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

      // Grid bounds
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

      for (let x = minX; x <= maxX; x += 2) {
        for (let y = 10; y <= 86; y += 2) {
          for (const mw of candidateMaxWidths) {
            for (const to of tailOrigins) {
              let placement: CharacterBubbleConfig['placement'] = 'custom';
              if (to === 'right') placement = 'left';
              else if (to === 'left') placement = 'right';
              else if (to === 'top') placement = 'custom';
              else if (to === 'bottom') placement = 'top';
              else if (to === 'bottom-left') placement = 'top-right';
              else if (to === 'bottom-right') placement = 'top-left';

              const config: CharacterBubbleConfig = {
                mouthTarget: record.mouth,
                placement,
                bubblePos: { x, y },
                tailOrigin: to,
                maxWidth: mw,
              };

              let allPass = true;
              let minFaceClearance = 100;

              for (let lIdx = 0; lIdx < charLines.length; lIdx++) {
                const line = charLines[lIdx];
                for (const vp of viewports) {
                  const res = auditDialogueLine(
                    did,
                    lIdx,
                    charName,
                    line.hanzi,
                    line.vietnamese || '',
                    vp,
                    config,
                    sceneRegistry,
                    meta
                  );

                  minFaceClearance = Math.min(minFaceClearance, res.minFaceClearance);

                  const hasCritical = res.issues.some((i) =>
                    i.type === 'OCCLUDES_SPEAKER_FACE' ||
                    i.type === 'OCCLUDES_OTHER_FACE' ||
                    i.type === 'WEDGE_COLLIDES_FACE' ||
                    i.type === 'TAIL_CROSSES_OTHER_FACE' ||
                    i.type === 'TAIL_CROSSES_SPEAKER_EYES' ||
                    i.type === 'CANVAS_BOUNDARY_VIOLATION' ||
                    i.type === 'SPLIT_SCREEN_BOUNDARY_VIOLATION' ||
                    i.type === 'DANGER_OBSTACLE_VIOLATION'
                  );

                  if (hasCritical) {
                    allPass = false;
                    break;
                  }
                }
                if (!allPass) break;
              }

              if (allPass) {
                const distToMouth = Math.hypot(x - record.mouth.x, y - record.mouth.y);
                // Prefer reasonable distance: 15-35%
                const distPenalty = Math.abs(distToMouth - 25);
                // Score: higher clearance, lower distPenalty
                const score = minFaceClearance * 2.0 - distPenalty * 0.8;
                validList.push({
                  config,
                  minFaceClearance,
                  distToMouth,
                  score,
                });
              }
            }
          }
        }
      }

      // Sort by score descending
      validList.sort((a, b) => b.score - a.score);
      // Keep top 40 diverse candidates
      charCandidates[charName] = validList.slice(0, 40);
      if (charCandidates[charName].length === 0) {
        console.warn(`WARNING: 0 candidates found for ${charName} in ${did}!`);
      }
    }

    // Now find combination of candidates that pass multi-speaker dialogue audit
    let bestCombo: Record<string, CharacterBubbleConfig> | null = null;
    let bestScore = -Infinity;

    if (charNames.length === 1) {
      if (charCandidates[charNames[0]].length > 0) {
        bestCombo = { [charNames[0]]: charCandidates[charNames[0]][0].config };
      }
    } else if (charNames.length === 2) {
      const c1List = charCandidates[charNames[0]];
      const c2List = charCandidates[charNames[1]];

      for (const cand1 of c1List) {
        for (const cand2 of c2List) {
          const p1 = cand1.config.bubblePos!;
          const p2 = cand2.config.bubblePos!;
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < 10) continue; // multi-speaker min distance

          // Check AABB collision on desktop-896
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
              // If very high score, break early
              if (comboScore > 80) break;
            }
          }
        }
        if (bestCombo && bestScore > 80) break;
      }
    } else if (charNames.length === 3) {
      const c1List = charCandidates[charNames[0]].slice(0, 20);
      const c2List = charCandidates[charNames[1]].slice(0, 20);
      const c3List = charCandidates[charNames[2]].slice(0, 20);

      for (const cand1 of c1List) {
        for (const cand2 of c2List) {
          const dist12 = Math.hypot(cand1.config.bubblePos!.x - cand2.config.bubblePos!.x, cand1.config.bubblePos!.y - cand2.config.bubblePos!.y);
          if (dist12 < 9) continue;

          for (const cand3 of c3List) {
            const dist13 = Math.hypot(cand1.config.bubblePos!.x - cand3.config.bubblePos!.x, cand1.config.bubblePos!.y - cand3.config.bubblePos!.y);
            const dist23 = Math.hypot(cand2.config.bubblePos!.x - cand3.config.bubblePos!.x, cand2.config.bubblePos!.y - cand3.config.bubblePos!.y);
            if (dist13 < 9 || dist23 < 9) continue;

            const testLayout: Record<string, CharacterBubbleConfig> = {
              [charNames[0]]: cand1.config,
              [charNames[1]]: cand2.config,
              [charNames[2]]: cand3.config,
            };

            const audit = auditDialogue(did, dData.lines, testLayout);
            if (audit.status === 'PASS') {
              const comboScore = cand1.score + cand2.score + cand3.score;
              if (comboScore > bestScore) {
                bestScore = comboScore;
                bestCombo = testLayout;
                break;
              }
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
      totalSolved++;
      console.log(`[PASS] ${did}: Solved! (${charNames.length} characters)`);
    } else {
      totalFailed++;
      console.error(`[FAIL] ${did}: Could NOT find passing combination!`);
    }
  }

  console.log(`\n======================================================`);
  console.log(`BATCH SOLVER RESULTS: ${totalSolved} / ${sortedDialogueIds.length} solved (${totalFailed} failed)`);
  console.log(`======================================================`);

  if (totalSolved === sortedDialogueIds.length) {
    // Save to JSON and generate TypeScript file
    const jsonPath = path.join(process.cwd(), '.agents', 'teamwork', 'worker_bubble_implementation', 'solved_layouts.json');
    fs.writeFileSync(jsonPath, JSON.stringify(finalLayouts, null, 2), 'utf-8');
    console.log(`Saved layouts JSON to ${jsonPath}`);

    // Update src/data/hsk1BubbleLayouts.ts
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
    console.log(`Updated ${tsPath} successfully!`);
  }
}

solveAllDialogues();
