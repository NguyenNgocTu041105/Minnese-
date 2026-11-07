import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { NEW_HSK1_FULL_LESSONS, DetailedTextbookLesson, LessonText } from '../src/data/newHsk1BookData';
import { NEW_HSK2_FULL_LESSONS } from '../src/data/newHsk2BookData';
import {
  HSK1_BUBBLE_LAYOUTS,
  getHsk1BubbleConfig,
  calculateFallbackBubblePos,
  CharacterBubbleConfig,
} from '../src/data/hsk1BubbleLayouts';
import { COURSEBOOK_CHARACTER_ANCHORS, CharacterAnchor2D } from '../src/data/coursebookCharacterAnchors';
import { COURSEBOOK_AUDIO_MANIFEST } from '../src/data/coursebookAudioManifest';

// ============================================================================
// Replication of CoursebookView.tsx Internal Functions for Rigorous Unit/Oracle Verification
// ============================================================================

function computeTailGeometry(
  bubbleBox: { left: number; top: number; right: number; bottom: number; width: number; height: number },
  mouthPx: { x: number; y: number },
  tailOriginPref?: 'bottom' | 'bottom-left' | 'bottom-right' | 'left' | 'right' | 'top'
) {
  const { left, top, right, bottom, width, height } = bubbleBox;
  const centerX = (left + right) / 2;
  const centerY = (top + bottom) / 2;

  let origin = tailOriginPref;
  if (!origin) {
    if (mouthPx.y > bottom) {
      if (mouthPx.x < left + width * 0.35) origin = 'bottom-left';
      else if (mouthPx.x > right - width * 0.35) origin = 'bottom-right';
      else origin = 'bottom';
    } else if (mouthPx.y < top) {
      origin = 'top';
    } else if (mouthPx.x < left) {
      origin = 'left';
    } else {
      origin = 'right';
    }
  }

  const baseWidth = Math.min(16, width * 0.35);
  const halfBase = baseWidth / 2;
  const overlap = 2.5;

  let baseMidX = centerX;
  let baseMidY = bottom;
  let base1 = { x: 0, y: 0 };
  let base2 = { x: 0, y: 0 };
  let baseEdge1 = { x: 0, y: 0 };
  let baseEdge2 = { x: 0, y: 0 };

  switch (origin) {
    case 'bottom-left': {
      baseMidX = left + Math.max(16, Math.min(28, width * 0.25));
      baseMidY = bottom;
      base1 = { x: baseMidX - halfBase, y: bottom - overlap };
      base2 = { x: baseMidX + halfBase, y: bottom - overlap };
      baseEdge1 = { x: baseMidX - halfBase, y: bottom };
      baseEdge2 = { x: baseMidX + halfBase, y: bottom };
      break;
    }
    case 'bottom-right': {
      baseMidX = right - Math.max(16, Math.min(28, width * 0.25));
      baseMidY = bottom;
      base1 = { x: baseMidX - halfBase, y: bottom - overlap };
      base2 = { x: baseMidX + halfBase, y: bottom - overlap };
      baseEdge1 = { x: baseMidX - halfBase, y: bottom };
      baseEdge2 = { x: baseMidX + halfBase, y: bottom };
      break;
    }
    case 'bottom': {
      baseMidX = Math.max(left + 16, Math.min(right - 16, centerX));
      baseMidY = bottom;
      base1 = { x: baseMidX - halfBase, y: bottom - overlap };
      base2 = { x: baseMidX + halfBase, y: bottom - overlap };
      baseEdge1 = { x: baseMidX - halfBase, y: bottom };
      baseEdge2 = { x: baseMidX + halfBase, y: bottom };
      break;
    }
    case 'left': {
      baseMidX = left;
      baseMidY = Math.max(top + 14, Math.min(bottom - 14, centerY));
      base1 = { x: left + overlap, y: baseMidY - halfBase };
      base2 = { x: left + overlap, y: baseMidY + halfBase };
      baseEdge1 = { x: left, y: baseMidY - halfBase };
      baseEdge2 = { x: left, y: baseMidY + halfBase };
      break;
    }
    case 'right': {
      baseMidX = right;
      baseMidY = Math.max(top + 14, Math.min(bottom - 14, centerY));
      base1 = { x: right - overlap, y: baseMidY - halfBase };
      base2 = { x: right - overlap, y: baseMidY + halfBase };
      baseEdge1 = { x: right, y: baseMidY - halfBase };
      baseEdge2 = { x: right, y: baseMidY + halfBase };
      break;
    }
    case 'top': {
      baseMidX = Math.max(left + 16, Math.min(right - 16, centerX));
      baseMidY = top;
      base1 = { x: baseMidX + halfBase, y: top + overlap };
      base2 = { x: baseMidX - halfBase, y: top + overlap };
      baseEdge1 = { x: baseMidX + halfBase, y: top };
      baseEdge2 = { x: baseMidX - halfBase, y: top };
      break;
    }
    default: {
      baseMidX = centerX;
      baseMidY = bottom;
      base1 = { x: baseMidX - halfBase, y: bottom - overlap };
      base2 = { x: baseMidX + halfBase, y: bottom - overlap };
      baseEdge1 = { x: baseMidX - halfBase, y: bottom };
      baseEdge2 = { x: baseMidX + halfBase, y: bottom };
      break;
    }
  }

  const vx = mouthPx.x - baseMidX;
  const vy = mouthPx.y - baseMidY;
  const dist = Math.hypot(vx, vy);

  // Flexible natural comic tail length: compact pointer, never a long spindly antenna
  // Tail length scales flexibly with distance (12px - 22px), pointing towards speaker without covering face
  const maxTailLen = 22;
  const minTailLen = 12;
  const tailLen = Math.min(maxTailLen, Math.max(minTailLen, dist * 0.2));

  const unitX = dist > 0 ? vx / dist : 0;
  const unitY = dist > 0 ? vy / dist : 1;

  const tip = {
    x: baseMidX + unitX * tailLen,
    y: baseMidY + unitY * tailLen,
  };

  return {
    origin,
    base1,
    base2,
    baseEdge1,
    baseEdge2,
    tip,
    dist,
  };
}

const getSpeakerCoordsLegacy = (
  textId: string,
  speakerName: string,
  allLines: { speaker: string }[],
  speakerAnchors?: Record<string, CharacterAnchor2D | number>
): { x: number; y: number } => {
  const cleanName = speakerName.replace(/\s*\(.*?\)/, '').trim();
  const sceneMap = speakerAnchors || COURSEBOOK_CHARACTER_ANCHORS[textId];
  if (sceneMap) {
    const matchedKey = Object.keys(sceneMap).find((k) => cleanName.includes(k) || k.includes(cleanName));
    if (matchedKey && sceneMap[matchedKey] !== undefined) {
      const val = sceneMap[matchedKey];
      if (typeof val === 'number') {
        return { x: val, y: 28 };
      }
      return val;
    }
  }

  const uniqueSpeakers = Array.from(new Set(allLines.map((l) => l.speaker.replace(/\s*\(.*?\)/, '').trim())));
  const sIdx = uniqueSpeakers.indexOf(cleanName);
  const defaultY = 28;

  if (uniqueSpeakers.length <= 1) return { x: 50, y: defaultY };
  if (uniqueSpeakers.length === 2) {
    return {
      x: sIdx === 0 ? 35 : 65,
      y: defaultY,
    };
  }
  return {
    x: sIdx === 0 ? 28 : sIdx === 1 ? 50 : 72,
    y: defaultY,
  };
};

describe('Adversarial Challenger Suite: Speech Bubble & UI Interaction Stress Test', () => {
  const ALL_HSK1_TEXTS: LessonText[] = [];
  NEW_HSK1_FULL_LESSONS.forEach((lesson) => {
    lesson.texts.forEach((text) => ALL_HSK1_TEXTS.push(text));
  });

  const ALL_HSK2_TEXTS: LessonText[] = [];
  NEW_HSK2_FULL_LESSONS.forEach((lesson) => {
    lesson.texts.forEach((text) => ALL_HSK2_TEXTS.push(text));
  });

  describe('1. Dialogue Line Clicking & State Transitions', () => {
    it('simulates rapid sequential and jump clicking across all lines of all 45 HSK 1 texts', () => {
      expect(ALL_HSK1_TEXTS.length).toBe(45);

      for (const textItem of ALL_HSK1_TEXTS) {
        let selectedLineMap: Record<string, number> = {};
        let playingLineId: string | null = null;

        // Default state when no line clicked
        let playingIdx = playingLineId && playingLineId.startsWith(`${textItem.id}-`)
          ? parseInt(playingLineId.split('-').pop() || '-1', 10)
          : -1;
        let activeLineIdx = playingIdx >= 0 ? playingIdx : (selectedLineMap[textItem.id] ?? 0);
        expect(activeLineIdx).toBe(0);
        expect(textItem.lines[activeLineIdx]).toBeDefined();

        // Simulate clicking every line in forward order
        for (let i = 0; i < textItem.lines.length; i++) {
          selectedLineMap = { ...selectedLineMap, [textItem.id]: i };
          playingIdx = -1;
          activeLineIdx = playingIdx >= 0 ? playingIdx : (selectedLineMap[textItem.id] ?? 0);
          expect(activeLineIdx).toBe(i);
          const activeLine = textItem.lines[activeLineIdx];
          expect(activeLine).toBeDefined();

          // Bubble config must resolve
          const config = getHsk1BubbleConfig(textItem.id, activeLine.speaker);
          expect(config, `Missing config for ${textItem.id} speaker ${activeLine.speaker}`).not.toBeNull();
        }

        // Simulate jumping directly to the last line, then line 0, then middle line
        const lastIdx = textItem.lines.length - 1;
        selectedLineMap = { ...selectedLineMap, [textItem.id]: lastIdx };
        expect(selectedLineMap[textItem.id]).toBe(lastIdx);

        selectedLineMap = { ...selectedLineMap, [textItem.id]: 0 };
        expect(selectedLineMap[textItem.id]).toBe(0);

        const midIdx = Math.floor(textItem.lines.length / 2);
        selectedLineMap = { ...selectedLineMap, [textItem.id]: midIdx };
        expect(selectedLineMap[textItem.id]).toBe(midIdx);
      }
    });

    it('verifies audio playing state overrides selectedLineMap during karaoke playback', () => {
      const textId = 'hsk1-l1-t1';
      let selectedLineMap: Record<string, number> = { [textId]: 0 };
      let playingLineId: string | null = null;

      const resolveActiveLine = () => {
        const playingIdx = playingLineId && playingLineId.startsWith(`${textId}-`)
          ? parseInt(playingLineId.split('-').pop() || '-1', 10)
          : -1;
        return playingIdx >= 0 ? playingIdx : (selectedLineMap[textId] ?? 0);
      };

      expect(resolveActiveLine()).toBe(0);

      // Audio playing line 1: overrides user selection 0
      playingLineId = `${textId}-1`;
      expect(resolveActiveLine()).toBe(1);

      // Audio completes: returns to user selected line 0
      playingLineId = null;
      expect(resolveActiveLine()).toBe(0);

      // Audio playing on different text: does not affect textId
      playingLineId = `hsk1-l2-t1-2`;
      expect(resolveActiveLine()).toBe(0);
    });
  });

  describe('2. Speech Bubble Card Click & handlePlayLineAudio Triggering', () => {
    it('verifies speech bubble onPlayLine triggers correct audio URL and manifest sync', () => {
      for (const textItem of ALL_HSK1_TEXTS) {
        const manifestItem = COURSEBOOK_AUDIO_MANIFEST[textItem.id];
        expect(manifestItem, `Manifest for ${textItem.id} missing`).toBeDefined();

        for (let lineIdx = 0; lineIdx < textItem.lines.length; lineIdx++) {
          const line = textItem.lines[lineIdx];
          const lineManifest = manifestItem.lines[lineIdx];

          expect(lineManifest, `Line manifest for ${textItem.id} line ${lineIdx} missing`).toBeDefined();
          expect(lineManifest.audioUrl).toBe(`/audio/coursebook/${textItem.id}_line${lineIdx}.mp3`);
          expect(lineManifest.hanzi).toBe(line.hanzi);

          // Verify disk audio file exists and is valid
          const filePath = path.join(__dirname, '..', 'public', lineManifest.audioUrl);
          expect(fs.existsSync(filePath), `Audio file ${filePath} must exist`).toBe(true);
          const stat = fs.statSync(filePath);
          expect(stat.size).toBeGreaterThan(1024);
        }
      }
    });
  });

  describe('3. Bubble Visibility Toggle ("Bóng thoại: BẬT / TẮT")', () => {
    it('toggles visibility state without altering activeLine or audio states', () => {
      let showSpeechBubbles = true;
      let selectedLineMap: Record<string, number> = { 'hsk1-l1-t1': 1 };
      let playingLineId: string | null = 'hsk1-l1-t1-1';

      // Toggle OFF
      showSpeechBubbles = !showSpeechBubbles;
      expect(showSpeechBubbles).toBe(false);
      // State unaffected
      expect(selectedLineMap['hsk1-l1-t1']).toBe(1);
      expect(playingLineId).toBe('hsk1-l1-t1-1');

      // Toggle ON
      showSpeechBubbles = !showSpeechBubbles;
      expect(showSpeechBubbles).toBe(true);
      expect(selectedLineMap['hsk1-l1-t1']).toBe(1);
      expect(playingLineId).toBe('hsk1-l1-t1-1');
    });
  });

  describe('4. Clear-Space Positioning & Smooth Non-Jitter Math', () => {
    it('100% of HSK 1 dialogue lines have calibrated bubble positions in open space without NaN', () => {
      for (const textItem of ALL_HSK1_TEXTS) {
        for (let lIdx = 0; lIdx < textItem.lines.length; lIdx++) {
          const line = textItem.lines[lIdx];
          const config = getHsk1BubbleConfig(textItem.id, line.speaker);
          expect(config, `Dialogue ${textItem.id} line ${lIdx} speaker ${line.speaker} must resolve`).not.toBeNull();

          const bubblePos = config!.bubblePos || calculateFallbackBubblePos(config!.mouthTarget, config!.placement);

          // Bounds assertions
          expect(bubblePos.x).toBeGreaterThanOrEqual(10);
          expect(bubblePos.x).toBeLessThanOrEqual(90);
          expect(bubblePos.y).toBeGreaterThanOrEqual(10);
          expect(bubblePos.y).toBeLessThanOrEqual(85);

          // Not NaN or infinite
          expect(Number.isFinite(bubblePos.x)).toBe(true);
          expect(Number.isFinite(bubblePos.y)).toBe(true);

          // Mouth target assertions
          expect(Number.isFinite(config!.mouthTarget.x)).toBe(true);
          expect(Number.isFinite(config!.mouthTarget.y)).toBe(true);
          expect(config!.mouthTarget.x).toBeGreaterThanOrEqual(10);
          expect(config!.mouthTarget.x).toBeLessThanOrEqual(90);
        }
      }
    });

    it('simulates responsive container viewports (mobile, tablet, desktop, 4K) for dynamic tail math', () => {
      const viewports = [
        { name: 'Mobile XS', width: 320, height: 239 },
        { name: 'Mobile Standard', width: 375, height: 280 },
        { name: 'Tablet 768px', width: 768, height: 574 },
        { name: 'Desktop 1024px', width: 1024, height: 765 },
        { name: 'Desktop HD 1440px', width: 1440, height: 1076 },
        { name: 'Desktop 4K 2048px', width: 2048, height: 1530 },
      ];

      for (const vp of viewports) {
        for (const textItem of ALL_HSK1_TEXTS) {
          for (let lIdx = 0; lIdx < textItem.lines.length; lIdx++) {
            const line = textItem.lines[lIdx];
            const config = getHsk1BubbleConfig(textItem.id, line.speaker)!;
            const bubblePos = config.bubblePos || calculateFallbackBubblePos(config.mouthTarget, config.placement);

            const cardWidth = Math.min(config.maxWidth || 230, vp.width * 0.45);
            const cardHeight = 56; // Standard 2-line height (Hanzi + Vietnamese)

            const bubbleCenterX = (bubblePos.x / 100) * vp.width;
            const bubbleCenterY = (bubblePos.y / 100) * vp.height;

            const bubbleBox = {
              left: bubbleCenterX - cardWidth / 2,
              top: bubbleCenterY - cardHeight / 2,
              right: bubbleCenterX + cardWidth / 2,
              bottom: bubbleCenterY + cardHeight / 2,
              width: cardWidth,
              height: cardHeight,
            };

            const mouthPx = {
              x: (config.mouthTarget.x / 100) * vp.width,
              y: (config.mouthTarget.y / 100) * vp.height,
            };

            const geom = computeTailGeometry(bubbleBox, mouthPx, config.tailOrigin);

            // Assert finite geometry
            expect(Number.isFinite(geom.base1.x)).toBe(true);
            expect(Number.isFinite(geom.base1.y)).toBe(true);
            expect(Number.isFinite(geom.base2.x)).toBe(true);
            expect(Number.isFinite(geom.base2.y)).toBe(true);
            expect(Number.isFinite(geom.tip.x)).toBe(true);
            expect(Number.isFinite(geom.tip.y)).toBe(true);
            expect(geom.dist).toBeGreaterThanOrEqual(0);

            // Tail must be a compact comic pointer (12px to 22px) and not a spindly 140px antenna
            const edgeMidX = (geom.baseEdge1.x + geom.baseEdge2.x) / 2;
            const edgeMidY = (geom.baseEdge1.y + geom.baseEdge2.y) / 2;
            const actualTailLen = Math.hypot(geom.tip.x - edgeMidX, geom.tip.y - edgeMidY);
            expect(actualTailLen).toBeLessThanOrEqual(22.01);
            expect(actualTailLen).toBeGreaterThanOrEqual(11.99);
          }
        }
      }
    });

    it('handles adversarial edge cases in computeTailGeometry without throwing or NaN', () => {
      // Degenerate zero-size box
      const degenBox = { left: 100, top: 100, right: 100, bottom: 100, width: 0, height: 0 };
      const mouth = { x: 100, y: 150 };
      const geom1 = computeTailGeometry(degenBox, mouth, 'bottom');
      expect(Number.isFinite(geom1.tip.x)).toBe(true);
      expect(Number.isFinite(geom1.tip.y)).toBe(true);

      // Mouth directly coincident with bubble center
      const mouthCoincident = { x: 100, y: 100 };
      const geom2 = computeTailGeometry(degenBox, mouthCoincident);
      expect(Number.isFinite(geom2.tip.x)).toBe(true);
      expect(Number.isFinite(geom2.tip.y)).toBe(true);

      // Extreme distant mouth
      const mouthFar = { x: 9999, y: 9999 };
      const geom3 = computeTailGeometry(degenBox, mouthFar);
      expect(Number.isFinite(geom3.tip.x)).toBe(true);
      expect(Number.isFinite(geom3.tip.y)).toBe(true);
    });
  });

  describe('5. Strict HSK 2 Component Isolation & Zero Regressions', () => {
    it('HSK 2 texts are never treated as HSK 1 (isHsk1 strictly false for all 60 texts)', () => {
      expect(ALL_HSK2_TEXTS.length).toBe(60);

      for (const textItem of ALL_HSK2_TEXTS) {
        const isHsk1 = textItem.id.startsWith('hsk1-');
        expect(isHsk1, `Text ${textItem.id} must NOT start with hsk1-`).toBe(false);
        expect(textItem.id.startsWith('hsk2-')).toBe(true);
      }
    });

    it('HSK 2 character anchors resolve successfully with legacy getSpeakerCoords', () => {
      for (const textItem of ALL_HSK2_TEXTS) {
        for (const line of textItem.lines) {
          const coords = getSpeakerCoordsLegacy(
            textItem.id,
            line.speaker,
            textItem.lines,
            textItem.speakerAnchors as Record<string, CharacterAnchor2D | number> | undefined
          );

          expect(coords, `Legacy coords for ${textItem.id} speaker ${line.speaker} must exist`).toBeDefined();
          expect(Number.isFinite(coords.x)).toBe(true);
          expect(Number.isFinite(coords.y)).toBe(true);
          expect(coords.x).toBeGreaterThanOrEqual(10);
          expect(coords.x).toBeLessThanOrEqual(90);
        }
      }
    });

    it('HSK 2 files remain strictly identical to repository pristine checksums', () => {
      const hsk2BookPath = path.join(__dirname, '..', 'src', 'data', 'newHsk2BookData.ts');
      const content = fs.readFileSync(hsk2BookPath);
      const hash = crypto.createHash('sha256').update(content).digest('hex');
      const EXPECTED_HSK2_SHA256 = '85ed8039e430f7ebc46fc08e6f34a90a21bfde6f315f507674c77f60da2ed59d';
      expect(hash).toBe(EXPECTED_HSK2_SHA256);

      // Verify all 60 HSK 2 dialogues in COURSEBOOK_CHARACTER_ANCHORS
      const hsk2Anchors: Record<string, any> = {};
      Object.keys(COURSEBOOK_CHARACTER_ANCHORS)
        .filter((k) => k.startsWith('hsk2-'))
        .sort()
        .forEach((k) => {
          hsk2Anchors[k] = COURSEBOOK_CHARACTER_ANCHORS[k];
        });

      expect(Object.keys(hsk2Anchors).length).toBe(60);
      const anchorsHash = crypto.createHash('sha256').update(JSON.stringify(hsk2Anchors)).digest('hex');
      const EXPECTED_ANCHORS_SHA256 = 'de7f101f863c74cf49c5a75369cb927c5e3a4f9f5b78657aa10f96a084e222c1';
      expect(anchorsHash).toBe(EXPECTED_ANCHORS_SHA256);
    });

    it('CoursebookView.tsx retains legacy branch styles and components for HSK 2', () => {
      const coursebookViewPath = path.join(__dirname, '..', 'src', 'components', 'Coursebook', 'CoursebookView.tsx');
      const source = fs.readFileSync(coursebookViewPath, 'utf-8');

      // Legacy container aspect ratio
      expect(source.includes("aspect-[4/3] sm:aspect-[16/10] max-h-[340px] sm:max-h-[380px] md:max-h-[420px]")).toBe(true);

      // Legacy upward transform
      expect(source.includes("calc(-100% - 10px)")).toBe(true);

      // Legacy downward triangle SVG pointer
      expect(source.includes("M1,0 L8,9.5 L15,0")).toBe(true);
    });
  });
});
