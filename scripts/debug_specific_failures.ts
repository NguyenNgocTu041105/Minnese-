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

function debugDialogue(did: string) {
  console.log(`\n=================== DEBUGGING ${did} ===================`);
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

  const charNames = Object.keys(sceneRegistry);
  for (const charName of charNames) {
    const rec = sceneRegistry[charName];
    const charLines = lines.filter((l) => {
      const clean = l.speaker.replace(/\s*\(.*?\)/, '').split('&')[0].trim();
      return clean === charName || clean.includes(charName) || charName.includes(clean);
    });

    console.log(`Character ${charName}: mouth (${rec.mouth.x}, ${rec.mouth.y}), face [${rec.face.join(', ')}], lines: ${charLines.length}`);

    // Check how many valid configs exist
    let validCount = 0;
    const sampleValids: CharacterBubbleConfig[] = [];
    const issueCounts: Record<string, number> = {};

    for (let x = 8; x <= 92; x += 2) {
      for (let y = 8; y <= 88; y += 2) {
        for (const mw of [95, 110, 130, 150, 180]) {
          for (const to of ['left', 'right', 'top', 'bottom', 'bottom-left', 'bottom-right'] as const) {
            const config: CharacterBubbleConfig = {
              mouthTarget: rec.mouth,
              placement: to === 'left' ? 'right' : to === 'right' ? 'left' : 'custom',
              bubblePos: { x, y },
              tailOrigin: to,
              maxWidth: mw,
            };

            let ok = true;
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
                  issueCounts[iss.type] = (issueCounts[iss.type] || 0) + 1;
                }

                if (res.issues.some((i) =>
                  i.type === 'OCCLUDES_SPEAKER_FACE' ||
                  i.type === 'OCCLUDES_OTHER_FACE' ||
                  i.type === 'WEDGE_COLLIDES_FACE' ||
                  i.type === 'TAIL_CROSSES_OTHER_FACE' ||
                  i.type === 'TAIL_CROSSES_SPEAKER_EYES' ||
                  i.type === 'CANVAS_BOUNDARY_VIOLATION' ||
                  i.type === 'SPLIT_SCREEN_BOUNDARY_VIOLATION' ||
                  i.type === 'DANGER_OBSTACLE_VIOLATION'
                )) {
                  ok = false;
                  break;
                }
              }
              if (!ok) break;
            }

            if (ok) {
              validCount++;
              if (sampleValids.length < 3) sampleValids.push(config);
            }
          }
        }
      }
    }

    console.log(`  Valid configs: ${validCount}`);
    if (validCount > 0) {
      console.log(`  Sample:`, JSON.stringify(sampleValids[0]));
    } else {
      console.log(`  Top issues:`, Object.entries(issueCounts).sort((a, b) => b[1] - a[1]).slice(0, 5));
    }
  }
}

debugDialogue('hsk1-l1-t2');
debugDialogue('hsk1-l2-t1');
debugDialogue('hsk1-l6-t1');
