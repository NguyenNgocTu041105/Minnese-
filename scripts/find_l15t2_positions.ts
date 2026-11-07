import { NEW_HSK1_FULL_LESSONS } from '../src/data/newHsk1BookData';
import { HSK1_CHARACTER_BOUNDING_BOXES, HSK1_SCENE_METADATA } from '../tests/hsk1_bubble_collision_data';
import { getResponsiveViewports, auditDialogueLine, CharacterBubbleConfig } from '../tests/hsk1_collision_engine';

const did = 'hsk1-l15-t2';
const meta = HSK1_SCENE_METADATA[did];
const scene = HSK1_CHARACTER_BOUNDING_BOXES[did];
const viewports = getResponsiveViewports(meta.aspectRatioClass);
const lesson = NEW_HSK1_FULL_LESSONS.find(l => l.lessonNumber === 15)!;
const text = lesson.texts.find(t => t.id === did)!;

const characters = ['李文', '安妮', '白家月', '陈天中'];

for (const char of characters) {
  const lineIdx = text.lines.findIndex(l => l.speaker === char);
  const line = lineIdx >= 0 ? text.lines[lineIdx] : { hanzi: '你好！', vietnamese: 'Chào bạn!' };
  const mouth = scene[char].mouth;

  const validPositions: Array<{ x: number; y: number; to: string; mw: number; issues: number }> = [];

  for (let mw of [160, 180, 200, 220, 240, 260]) {
    for (let x = 6; x <= 94; x += 4) {
      for (let y = 6; y <= 94; y += 4) {
        for (const to of ['left', 'right', 'top', 'bottom', 'bottom-left', 'bottom-right'] as const) {
          const cfg: CharacterBubbleConfig = {
            mouthTarget: mouth,
            placement: 'custom',
            bubblePos: { x, y },
            tailOrigin: to,
            maxWidth: mw,
          };

          let issues = 0;
          for (const vp of viewports) {
            const res = auditDialogueLine(did, lineIdx >= 0 ? lineIdx : 0, char, line.hanzi, line.vietnamese || '', vp, cfg, scene, meta);
            issues += res.issues.length;
          }

          if (issues === 0) {
            validPositions.push({ x, y, to, mw, issues: 0 });
          }
        }
      }
    }
  }

  console.log(`Character ${char}: found ${validPositions.length} 100% PASS positions across all 4 viewports!`);
  if (validPositions.length > 0) {
    console.log(`  Sample:`, validPositions.slice(0, 3));
  }
}
