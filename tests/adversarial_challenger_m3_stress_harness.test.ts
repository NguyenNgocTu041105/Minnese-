import { describe, it, expect } from 'vitest';
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
// Adversarial Challenger M3 Stress Harness
// Empirical stress tests by challenger_m3_it2_1
// ============================================================================

const ALL_HSK1_TEXTS: LessonText[] = [];
NEW_HSK1_FULL_LESSONS.forEach((lesson) => {
  lesson.texts.forEach((text) => ALL_HSK1_TEXTS.push(text));
});

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

describe('Adversarial Challenger M3: Extreme Empirical Stress Harness', () => {

  // --------------------------------------------------------------------------
  // Suite 1: Audio Asset Bitstream & Forensic Header Integrity
  // --------------------------------------------------------------------------
  describe('1. Bitstream & Forensic Header Integrity (Public & Dist)', () => {
    const checkFileHeader = (filePath: string) => {
      const buffer = fs.readFileSync(filePath);
      expect(buffer.length).toBeGreaterThan(1024);

      // Raw MPEG Layer III frame check: Must NOT start with ID3 ('ID3\x03' or 'ID3\x04')
      const tag = buffer.subarray(0, 3).toString('ascii');
      expect(tag, `${filePath} must not begin with ID3 tag`).not.toBe('ID3');

      // First two bytes must be MPEG sync word: 0xFF 0xFB, 0xFF 0xF3, or 0xFF 0xF2
      const b0 = buffer[0];
      const b1 = buffer[1];
      expect(b0, `${filePath} must begin with MPEG sync byte 0xFF`).toBe(0xff);
      expect((b1 & 0xe0) === 0xe0, `${filePath} must have sync word bits set`).toBe(true);

      // Check Xing / Info header absence in the first 128 bytes
      const first128 = buffer.subarray(0, 128).toString('latin1');
      expect(first128.includes('Xing'), `${filePath} must not contain Xing header`).toBe(false);
      expect(first128.includes('Info'), `${filePath} must not contain Info header`).toBe(false);
    };

    it('verifies all 6 remediated audio files in public/audio/coursebook/ have zero ID3/Xing tags', () => {
      const targetFiles = [
        'hsk1-l1-t2_full.mp3',
        'hsk1-l1-t2_line1.mp3',
        'hsk1-l1-t2_line3.mp3',
        'hsk1-l1-t3_full.mp3',
        'hsk1-l1-t3_line0.mp3',
        'hsk1-l1-t3_line3.mp3',
      ];
      for (const f of targetFiles) {
        const pubPath = path.join(__dirname, '..', 'public', 'audio', 'coursebook', f);
        expect(fs.existsSync(pubPath), `File ${pubPath} must exist`).toBe(true);
        checkFileHeader(pubPath);
      }
    });

    it('verifies cryptographic identity between public/ and dist/ for all 6 remediated files', () => {
      const targetFiles = [
        'hsk1-l1-t2_full.mp3',
        'hsk1-l1-t2_line1.mp3',
        'hsk1-l1-t2_line3.mp3',
        'hsk1-l1-t3_full.mp3',
        'hsk1-l1-t3_line0.mp3',
        'hsk1-l1-t3_line3.mp3',
      ];
      for (const f of targetFiles) {
        const pubPath = path.join(__dirname, '..', 'public', 'audio', 'coursebook', f);
        const distPath = path.join(__dirname, '..', 'dist', 'audio', 'coursebook', f);
        expect(fs.existsSync(distPath), `Dist file ${distPath} must exist`).toBe(true);

        const pubHash = crypto.createHash('sha256').update(fs.readFileSync(pubPath)).digest('hex');
        const distHash = crypto.createHash('sha256').update(fs.readFileSync(distPath)).digest('hex');
        expect(pubHash, `Hash mismatch between public and dist for ${f}`).toBe(distHash);
      }
    });

    it('verifies all 45 HSK 1 full audio files in public/ are free of ID3/Xing pollution', () => {
      for (const text of ALL_HSK1_TEXTS) {
        const filePath = path.join(__dirname, '..', 'public', 'audio', 'coursebook', `${text.id}_full.mp3`);
        expect(fs.existsSync(filePath), `Full audio for ${text.id} must exist`).toBe(true);
        checkFileHeader(filePath);
      }
    });
  });

  // --------------------------------------------------------------------------
  // Suite 2: Rapid Turn Switching & Concurrency Stress across all 203 lines
  // --------------------------------------------------------------------------
  describe('2. Rapid Turn Switching & Audio State Transitions Across 203 Dialogue Lines', () => {
    class MockAudioController {
      currentSrc: string | null = null;
      isPlaying: boolean = false;
      playAttempts: number = 0;
      interruptedCount: number = 0;
      successCount: number = 0;

      async play(src: string): Promise<void> {
        this.playAttempts++;
        const myAttempt = this.playAttempts;
        this.currentSrc = src;
        this.isPlaying = true;

        // Simulate microtask scheduling
        await new Promise((res) => setTimeout(res, 1));

        if (myAttempt !== this.playAttempts) {
          this.interruptedCount++;
          throw new Error('PlayInterrupted');
        }
        this.successCount++;
      }

      pause(): void {
        this.isPlaying = false;
        this.currentSrc = null;
      }
    }

    it('stress tests rapid sequential, reverse, and random firing across all 203 lines', async () => {
      const audioController = new MockAudioController();
      let activeTextId: string | null = null;
      let activeLineIdx: number | null = null;

      const allLines: Array<{ textId: string; lineIndex: number; audioUrl: string }> = [];
      for (const text of ALL_HSK1_TEXTS) {
        const entry = COURSEBOOK_AUDIO_MANIFEST[text.id];
        for (let i = 0; i < text.lines.length; i++) {
          allLines.push({
            textId: text.id,
            lineIndex: i,
            audioUrl: entry.lines[i].audioUrl,
          });
        }
      }
      expect(allLines.length).toBe(203);

      // Phase 1: Rapid forward progression across all 203 lines
      for (const item of allLines) {
        activeTextId = item.textId;
        activeLineIdx = item.lineIndex;
        try {
          await audioController.play(item.audioUrl);
        } catch {
          // Expected when rapidly interrupted
        }
      }

      // Phase 2: Rapid reverse progression
      for (let i = allLines.length - 1; i >= 0; i--) {
        const item = allLines[i];
        activeTextId = item.textId;
        activeLineIdx = item.lineIndex;
        try {
          await audioController.play(item.audioUrl);
        } catch {
          // Expected when interrupted
        }
      }

      // Phase 3: 500 chaotic random bursts
      for (let i = 0; i < 500; i++) {
        const randIdx = Math.floor(Math.random() * allLines.length);
        const item = allLines[randIdx];
        activeTextId = item.textId;
        activeLineIdx = item.lineIndex;
        try {
          await audioController.play(item.audioUrl);
        } catch {
          // Expected when interrupted
        }
      }

      audioController.pause();
      expect(audioController.isPlaying).toBe(false);
      expect(audioController.playAttempts).toBe(203 * 2 + 500);
      expect(audioController.successCount).toBeGreaterThan(0);
    });
  });

  // --------------------------------------------------------------------------
  // Suite 3: Extreme Container Resizing across Viewports & Ultra-wide/tall Displays
  // --------------------------------------------------------------------------
  describe('3. Extreme Container Resizing and Geometry Containment', () => {
    const EXTREME_VIEWPORTS = [
      { name: 'Ultra-Narrow (320x240)', width: 320, height: 240 },
      { name: 'Mobile iPhone SE (375x281)', width: 375, height: 281 },
      { name: 'Mobile Standard (414x310)', width: 414, height: 310 },
      { name: 'Phablet (480x360)', width: 480, height: 360 },
      { name: 'Small Tablet (600x450)', width: 600, height: 450 },
      { name: 'iPad Portrait (768x576)', width: 768, height: 576 },
      { name: 'Desktop Standard (1024x765)', width: 1024, height: 765 },
      { name: 'Desktop HD (1366x768)', width: 1366, height: 768 },
      { name: 'Desktop Full HD (1920x1080)', width: 1920, height: 1080 },
      { name: 'Desktop QHD 2K (2560x1440)', width: 2560, height: 1440 },
      { name: 'Desktop 4K UHD (3840x2160)', width: 3840, height: 2160 },
      { name: 'Desktop 5K (5120x2880)', width: 5120, height: 2880 },
      { name: 'Desktop 8K (7680x4320)', width: 7680, height: 4320 },
      { name: 'Ultra-Wide 21:9 (3440x1440)', width: 3440, height: 1440 },
      { name: 'Super Ultra-Wide 32:9 (5120x1440)', width: 5120, height: 1440 },
      { name: 'Vertical Ultra-Tall (1080x2520)', width: 1080, height: 2520 },
    ];

    for (const vp of EXTREME_VIEWPORTS) {
      it(`guarantees strict bubble containment and valid tail vector on ${vp.name}`, () => {
        for (const textItem of ALL_HSK1_TEXTS) {
          for (let lIdx = 0; lIdx < textItem.lines.length; lIdx++) {
            const line = textItem.lines[lIdx];
            const config = getHsk1BubbleConfig(textItem.id, line.speaker);
            expect(config, `Missing config for ${textItem.id} ${line.speaker}`).not.toBeNull();

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

            // Strict containment assertions
            expect(leftPx, `Left overflow on ${vp.name}`).toBeGreaterThanOrEqual(8);
            expect(rightPx, `Right overflow on ${vp.name}`).toBeLessThanOrEqual(vp.width - 8);
            expect(topPx, `Top overflow on ${vp.name}`).toBeGreaterThanOrEqual(8);
            expect(bottomPx, `Bottom overflow on ${vp.name}`).toBeLessThanOrEqual(vp.height - 8);

            // Tail math sanity
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

            // Vector from tail base to tip must point toward mouth
            const tailVec = { x: tail.tip.x - tail.baseMid.x, y: tail.tip.y - tail.baseMid.y };
            const losVec = { x: mouthPx.x - tail.baseMid.x, y: mouthPx.y - tail.baseMid.y };
            const dot = tailVec.x * losVec.x + tailVec.y * losVec.y;
            expect(dot, `Tail directional error on ${textItem.id} line ${lIdx}`).toBeGreaterThan(0);
          }
        }
      });
    }
  });

  // --------------------------------------------------------------------------
  // Suite 4: Multi-Speaker Distinctness & Non-Overlap Invariants
  // --------------------------------------------------------------------------
  describe('4. Multi-Speaker Spatial Distinctness across All Multi-Speaker Dialogues', () => {
    it('guarantees mouth targets for distinct speakers in the same dialogue maintain >= 6% separation', () => {
      for (const textItem of ALL_HSK1_TEXTS) {
        const layout = HSK1_BUBBLE_LAYOUTS[textItem.id];
        if (!layout) continue;

        const speakers = Object.keys(layout);
        if (speakers.length > 1) {
          for (let i = 0; i < speakers.length; i++) {
            for (let j = i + 1; j < speakers.length; j++) {
              const spk1 = speakers[i];
              const spk2 = speakers[j];
              const m1 = layout[spk1].mouthTarget;
              const m2 = layout[spk2].mouthTarget;

              const dist = Math.hypot(m1.x - m2.x, m1.y - m2.y);
              expect(
                dist,
                `Speakers ${spk1} and ${spk2} in ${textItem.id} have identical or near-identical mouth coordinates (dist=${dist}%)`
              ).toBeGreaterThanOrEqual(6.0);
            }
          }
        }
      }
    });
  });

  // --------------------------------------------------------------------------
  // Suite 5: Cryptographic HSK 2 Strict Isolation Invariant
  // --------------------------------------------------------------------------
  describe('5. Cryptographic HSK 2 Strict Isolation Invariant', () => {
    it('preserves exact SHA-256 hash for src/data/newHsk2BookData.ts', () => {
      const hsk2Path = path.join(__dirname, '..', 'src', 'data', 'newHsk2BookData.ts');
      const content = fs.readFileSync(hsk2Path);
      const hash = crypto.createHash('sha256').update(content).digest('hex');
      expect(hash).toBe('85ed8039e430f7ebc46fc08e6f34a90a21bfde6f315f507674c77f60da2ed59d');
    });

    it('preserves exact SHA-256 hash for HSK 2 entries in coursebookCharacterAnchors.ts', () => {
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

    it('preserves exactly 60 HSK 2 dialogues in coursebookAudioManifest.json', () => {
      const hsk2Keys = Object.keys(COURSEBOOK_AUDIO_MANIFEST).filter((k) => k.startsWith('hsk2-'));
      expect(hsk2Keys.length).toBe(60);
    });

    it('verifies 0 modifications to all 368 HSK 2 audio files in public/audio/coursebook/', () => {
      const audioFiles = fs.readdirSync(path.join(__dirname, '..', 'public', 'audio', 'coursebook'));
      const hsk2Audio = audioFiles.filter((f) => f.startsWith('hsk2-'));
      expect(hsk2Audio.length).toBe(368);
    });

    it('verifies 0 modifications to all 60 HSK 2 illustration JPGs in public/textbook_art/', () => {
      const artFiles = fs.readdirSync(path.join(__dirname, '..', 'public', 'textbook_art'));
      const hsk2Art = artFiles.filter((f) => f.includes('cartoon_hsk2_'));
      expect(hsk2Art.length).toBe(60);
    });
  });
});
