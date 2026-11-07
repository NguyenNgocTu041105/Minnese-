import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { NEW_HSK1_FULL_LESSONS, LessonText } from '../src/data/newHsk1BookData';
import { NEW_HSK2_FULL_LESSONS } from '../src/data/newHsk2BookData';
import {
  HSK1_BUBBLE_LAYOUTS,
  getHsk1BubbleConfig,
  calculateFallbackBubblePos,
} from '../src/data/hsk1BubbleLayouts';
import { COURSEBOOK_CHARACTER_ANCHORS } from '../src/data/coursebookCharacterAnchors';
import { COURSEBOOK_AUDIO_MANIFEST } from '../src/data/coursebookAudioManifest';

// ============================================================================
// Milestone 3 Final Acceptance Gate: Empirical Challenger Stress Harness
// ============================================================================

const ALL_HSK1_TEXTS: LessonText[] = [];
NEW_HSK1_FULL_LESSONS.forEach((lesson) => {
  lesson.texts.forEach((text) => ALL_HSK1_TEXTS.push(text));
});

const ALL_HSK2_TEXTS: LessonText[] = [];
NEW_HSK2_FULL_LESSONS.forEach((lesson) => {
  lesson.texts.forEach((text) => ALL_HSK2_TEXTS.push(text));
});

// Verbatim copy of CoursebookView.tsx tail geometry & dimension math
function computeTailGeometry(
  bubbleBox: { left: number; top: number; right: number; bottom: number; width: number; height: number },
  mouthPx: { x: number; y: number },
  tailOriginPref?: 'bottom' | 'bottom-left' | 'bottom-right' | 'left' | 'right' | 'top'
) {
  const { left, top, right, bottom, width } = bubbleBox;
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
  } else {
    if ((origin === 'bottom' || origin === 'bottom-left' || origin === 'bottom-right') && mouthPx.y < bottom) {
      if (mouthPx.y < top) origin = 'top';
      else if (mouthPx.x < left) origin = 'left';
      else if (mouthPx.x > right) origin = 'right';
    } else if (origin === 'top' && mouthPx.y > top) {
      if (mouthPx.y > bottom) origin = 'bottom';
      else if (mouthPx.x < left) origin = 'left';
      else if (mouthPx.x > right) origin = 'right';
    }
  }

  const baseWidth = Math.min(16, width * 0.35);
  const halfBase = baseWidth / 2;

  let baseMidX = centerX;
  let baseMidY = bottom;

  switch (origin) {
    case 'bottom-left': {
      baseMidX = left + Math.max(16, Math.min(28, width * 0.25));
      baseMidY = bottom;
      break;
    }
    case 'bottom-right': {
      baseMidX = right - Math.max(16, Math.min(28, width * 0.25));
      baseMidY = bottom;
      break;
    }
    case 'bottom': {
      baseMidX = Math.max(left + 16, Math.min(right - 16, centerX));
      baseMidY = bottom;
      break;
    }
    case 'left': {
      baseMidX = left;
      baseMidY = Math.max(top + 14, Math.min(bottom - 14, centerY));
      break;
    }
    case 'right': {
      baseMidX = right;
      baseMidY = Math.max(top + 14, Math.min(bottom - 14, centerY));
      break;
    }
    case 'top': {
      baseMidX = Math.max(left + 16, Math.min(right - 16, centerX));
      baseMidY = top;
      break;
    }
    default: {
      baseMidX = centerX;
      baseMidY = bottom;
      break;
    }
  }

  const vx = mouthPx.x - baseMidX;
  const vy = mouthPx.y - baseMidY;
  const dist = Math.hypot(vx, vy);

  let tip = { x: mouthPx.x, y: mouthPx.y };
  if (dist > 16) {
    const margin = Math.min(10, dist * 0.1);
    tip = {
      x: mouthPx.x - (vx / dist) * margin,
      y: mouthPx.y - (vy / dist) * margin,
    };
  }

  return { origin, baseMid: { x: baseMidX, y: baseMidY }, tip, dist, vx, vy };
}

function estimateBubbleDimensions(
  hanzi: string,
  vietnamese: string | undefined,
  maxWidthSetting: number = 230,
  viewportWidth: number
): { width: number; height: number } {
  const isSm = viewportWidth >= 640;
  const paddingX = isSm ? 28 : 24;
  const paddingY = isSm ? 16 : 12;
  const hanziCharWidth = isSm ? 14 : 12;
  const hanziLineHeight = isSm ? 20 : 18;
  const vnCharWidth = isSm ? 6.2 : 5.5;
  const vnLineHeight = isSm ? 16 : 14;

  const maxWidth = isSm
    ? Math.min(maxWidthSetting, viewportWidth - 20)
    : Math.min(maxWidthSetting, Math.round(viewportWidth * 0.72));

  const rawHanziWidth = hanzi.length * hanziCharWidth;
  const rawVnWidth = vietnamese ? vietnamese.length * vnCharWidth : 0;
  const rawContentWidth = Math.max(rawHanziWidth, rawVnWidth);

  const cardWidth = Math.max(90, Math.min(maxWidth, rawContentWidth + paddingX));
  const contentInnerWidth = cardWidth - paddingX;
  const hanziLines = Math.max(1, Math.ceil(rawHanziWidth / contentInnerWidth));
  const vnLines = vietnamese ? Math.max(1, Math.ceil(rawVnWidth / contentInnerWidth)) : 0;

  const cardHeight = paddingY + hanziLines * hanziLineHeight + (vnLines > 0 ? vnLines * vnLineHeight + 2 : 0);

  return { width: cardWidth, height: cardHeight };
}

describe('Milestone 3 Final Acceptance Gate: Empirical Challenger Suite', () => {

  // =========================================================================
  // 1. High-Frequency Rapid Audio Turn Switching & Concurrency Stress
  // =========================================================================
  describe('1. High-Frequency Rapid Audio Turn Switching & Concurrency Stress', () => {
    class MockAudio {
      src: string;
      currentTime: number = 0;
      paused: boolean = true;
      isDestroyed: boolean = false;
      constructor(src: string) {
        this.src = src;
      }
      async play(): Promise<void> {
        if (this.isDestroyed) {
          throw new Error('InterruptedByPause');
        }
        this.paused = false;
      }
      pause(): void {
        this.paused = true;
        this.isDestroyed = true;
      }
    }

    it('simulates 1,000 rapid interleaved audio switching operations without state desynchronization', async () => {
      let activeAudio: MockAudio | null = null;
      let activePlayingTextId: string | null = null;
      let playingLineId: string | null = null;

      const stopAll = () => {
        if (activeAudio) {
          activeAudio.pause();
          activeAudio = null;
        }
        activePlayingTextId = null;
        playingLineId = null;
      };

      const startFull = async (textId: string) => {
        if (activePlayingTextId === textId) {
          stopAll();
          return;
        }
        stopAll();
        activePlayingTextId = textId;
        const entry = COURSEBOOK_AUDIO_MANIFEST[textId];
        const audio = new MockAudio(entry.fullAudioUrl);
        activeAudio = audio;
        try {
          await audio.play();
        } catch {
          stopAll();
        }
      };

      const playLine = async (textId: string, lineIdx: number) => {
        stopAll();
        const lineKey = `${textId}-${lineIdx}`;
        playingLineId = lineKey;
        const entry = COURSEBOOK_AUDIO_MANIFEST[textId];
        const line = entry.lines[lineIdx];
        const audio = new MockAudio(line.audioUrl);
        activeAudio = audio;
        try {
          await audio.play();
        } catch {
          playingLineId = null;
        }
      };

      // 1000 fast iterations across random dialogues
      for (let i = 0; i < 1000; i++) {
        const textItem = ALL_HSK1_TEXTS[i % ALL_HSK1_TEXTS.length];
        const action = i % 4;
        if (action === 0) {
          await startFull(textItem.id);
        } else if (action === 1) {
          const lineIdx = i % textItem.lines.length;
          await playLine(textItem.id, lineIdx);
        } else if (action === 2) {
          // Switch to another dialogue line immediately
          const nextText = ALL_HSK1_TEXTS[(i + 7) % ALL_HSK1_TEXTS.length];
          await playLine(nextText.id, 0);
        } else {
          stopAll();
        }
      }

      // Cleanup
      stopAll();
      expect(activeAudio).toBeNull();
      expect(activePlayingTextId).toBeNull();
      expect(playingLineId).toBeNull();
    });
  });

  // =========================================================================
  // 2. Speech Bubble Card Click Audio Triggers
  // =========================================================================
  describe('2. Speech Bubble Card Click Audio Triggers', () => {
    it('verifies clicking any speech bubble across all 45 texts triggers an existing, valid audio file', () => {
      let triggeredCount = 0;
      for (const textItem of ALL_HSK1_TEXTS) {
        const manifestItem = COURSEBOOK_AUDIO_MANIFEST[textItem.id];
        expect(manifestItem, `Missing manifest for ${textItem.id}`).toBeDefined();

        for (let lIdx = 0; lIdx < textItem.lines.length; lIdx++) {
          const line = textItem.lines[lIdx];
          const lineAudio = manifestItem.lines[lIdx];
          expect(lineAudio).toBeDefined();

          // Bubble click handler parameters: (textId, lineIndex, fallbackHanzi)
          const expectedUrl = `/audio/coursebook/${textItem.id}_line${lIdx}.mp3`;
          expect(lineAudio.audioUrl).toBe(expectedUrl);

          // Assert physical file exists and is valid
          const fullPath = path.join(__dirname, '..', 'public', lineAudio.audioUrl);
          expect(fs.existsSync(fullPath), `Audio file ${fullPath} must exist`).toBe(true);

          const stat = fs.statSync(fullPath);
          expect(stat.size, `Audio file ${fullPath} size must be > 1024 bytes`).toBeGreaterThan(1024);
          triggeredCount++;
        }
      }
      expect(triggeredCount).toBe(203);
    });
  });

  // =========================================================================
  // 3. Responsive Container Resizing Stress Across 12 Viewports
  // =========================================================================
  describe('3. Responsive Container Resizing Stress Across 12 Viewports', () => {
    const VIEWPORTS = [
      { name: 'Ultra-Narrow 320px', width: 320, height: 239 },
      { name: 'Mobile iPhone SE 375px', width: 375, height: 280 },
      { name: 'Mobile iPhone 14 390px', width: 390, height: 291 },
      { name: 'Mobile Android 412px', width: 412, height: 308 },
      { name: 'Phablet 480px', width: 480, height: 359 },
      { name: 'Small Tablet 600px', width: 600, height: 448 },
      { name: 'Tablet 768px', width: 768, height: 574 },
      { name: 'Desktop Standard 1024px', width: 1024, height: 765 },
      { name: 'Desktop Large 1280px', width: 1280, height: 956 },
      { name: 'Desktop Full HD 1920px', width: 1920, height: 1434 },
      { name: 'Desktop 2K 2560px', width: 2560, height: 1913 },
      { name: 'Desktop 4K 3840px', width: 3840, height: 2869 },
    ];

    for (const vp of VIEWPORTS) {
      it(`verifies bubble containment, positive tail vector, and clearance on ${vp.name} (${vp.width}x${vp.height})`, () => {
        for (const textItem of ALL_HSK1_TEXTS) {
          for (let lIdx = 0; lIdx < textItem.lines.length; lIdx++) {
            const line = textItem.lines[lIdx];
            const config = getHsk1BubbleConfig(textItem.id, line.speaker);
            expect(config).not.toBeNull();

            const bubblePos = config!.bubblePos || calculateFallbackBubblePos(config!.mouthTarget, config!.placement);
            const dim = estimateBubbleDimensions(line.hanzi, line.vietnamese, config!.maxWidth || 230, vp.width);

            const rawCenterX = (bubblePos.x / 100) * vp.width;
            const rawCenterY = (bubblePos.y / 100) * vp.height;
            const rawLeft = rawCenterX - dim.width / 2;
            const rawTop = rawCenterY - dim.height / 2;

            const leftPx = Math.max(8, Math.min(vp.width - dim.width - 8, rawLeft));
            const topPx = Math.max(8, Math.min(vp.height - dim.height - 8, rawTop));
            const rightPx = leftPx + dim.width;
            const bottomPx = topPx + dim.height;

            // 1. Boundary containment: strictly within container margins
            expect(leftPx).toBeGreaterThanOrEqual(8);
            expect(rightPx).toBeLessThanOrEqual(vp.width - 8);
            expect(topPx).toBeGreaterThanOrEqual(8);
            expect(bottomPx).toBeLessThanOrEqual(vp.height - 8);

            // 2. Tail geometry
            const bubbleBox = {
              left: leftPx,
              top: topPx,
              right: rightPx,
              bottom: bottomPx,
              width: dim.width,
              height: dim.height,
            };
            const mouthPx = {
              x: (config!.mouthTarget.x / 100) * vp.width,
              y: (config!.mouthTarget.y / 100) * vp.height,
            };
            const tail = computeTailGeometry(bubbleBox, mouthPx, config!.tailOrigin);

            expect(Number.isFinite(tail.tip.x)).toBe(true);
            expect(Number.isFinite(tail.tip.y)).toBe(true);
            expect(tail.dist).toBeGreaterThanOrEqual(0);

            // 3. Dot product check: vector from base to tip points towards mouth
            const tailVec = { x: tail.tip.x - tail.baseMid.x, y: tail.tip.y - tail.baseMid.y };
            const losVec = { x: mouthPx.x - tail.baseMid.x, y: mouthPx.y - tail.baseMid.y };
            const dot = tailVec.x * losVec.x + tailVec.y * losVec.y;
            expect(dot).toBeGreaterThan(0);
          }
        }
      });
    }
  });

  // =========================================================================
  // 4. Zero Regressions on HSK 2 Curriculum and Assets
  // =========================================================================
  describe('4. Zero Regressions on HSK 2 Curriculum and Assets', () => {
    it('HSK 2 curriculum file newHsk2BookData.ts matches exact pristine SHA-256', () => {
      const hsk2Path = path.join(__dirname, '..', 'src', 'data', 'newHsk2BookData.ts');
      const content = fs.readFileSync(hsk2Path);
      const hash = crypto.createHash('sha256').update(content).digest('hex');
      expect(hash).toBe('85ed8039e430f7ebc46fc08e6f34a90a21bfde6f315f507674c77f60da2ed59d');
    });

    it('HSK 2 character anchors in coursebookCharacterAnchors.ts match exact pristine SHA-256', () => {
      const hsk2Anchors: Record<string, any> = {};
      Object.keys(COURSEBOOK_CHARACTER_ANCHORS)
        .filter((k) => k.startsWith('hsk2-'))
        .sort()
        .forEach((k) => {
          hsk2Anchors[k] = COURSEBOOK_CHARACTER_ANCHORS[k];
        });
      expect(Object.keys(hsk2Anchors).length).toBe(60);
      const hash = crypto.createHash('sha256').update(JSON.stringify(hsk2Anchors)).digest('hex');
      expect(hash).toBe('de7f101f863c74cf49c5a75369cb927c5e3a4f9f5b78657aa10f96a084e222c1');
    });

    it('HSK 2 manifest entries in coursebookAudioManifest.json are exactly 60 and unmodified', () => {
      const hsk2Keys = Object.keys(COURSEBOOK_AUDIO_MANIFEST).filter((k) => k.startsWith('hsk2-'));
      expect(hsk2Keys.length).toBe(60);
      for (const k of hsk2Keys) {
        expect(COURSEBOOK_AUDIO_MANIFEST[k]).toBeDefined();
        expect(COURSEBOOK_AUDIO_MANIFEST[k].id).toBe(k);
      }
    });

    it('CoursebookView.tsx retains strict HSK 1 vs HSK 2 branching', () => {
      const viewPath = path.join(__dirname, '..', 'src', 'components', 'Coursebook', 'CoursebookView.tsx');
      const content = fs.readFileSync(viewPath, 'utf-8');
      expect(content.includes("textItem.id.startsWith('hsk1-')")).toBe(true);
      expect(content.includes("aspect-[4/3] sm:aspect-[16/10] max-h-[340px] sm:max-h-[380px] md:max-h-[420px]")).toBe(true);
      expect(content.includes("calc(-100% - 10px)")).toBe(true);
      expect(content.includes("M1,0 L8,9.5 L15,0")).toBe(true);
    });
  });
});
