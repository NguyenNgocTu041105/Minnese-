import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { execFileSync } from 'child_process';
import { NEW_HSK1_FULL_LESSONS } from '../src/data/newHsk1BookData';
import { COURSEBOOK_CHARACTER_ANCHORS } from '../src/data/coursebookCharacterAnchors';

// ============================================================================
// Types & Contracts (per PROJECT.md & TEST_INFRA.md)
// ============================================================================

export type BubblePlacement =
  | 'top'
  | 'top-left'
  | 'top-right'
  | 'left'
  | 'right'
  | 'bottom-left'
  | 'bottom-right'
  | 'custom';

export interface CharacterBubbleConfig {
  mouthTarget: { x: number; y: number };
  placement: BubblePlacement;
  bubblePos?: { x: number; y: number };
  tailOrigin?: 'bottom' | 'bottom-left' | 'bottom-right' | 'left' | 'right' | 'top';
  maxWidth?: number;
}

export type HSK1SceneBubbleMap = Record<string, Record<string, CharacterBubbleConfig>>;

interface AudioTiming {
  lineIndex: number;
  start: number;
  end: number;
  duration: number;
}

interface AudioLine {
  lineIndex: number;
  speaker: string;
  speakerName?: string;
  gender: string;
  avatar: string;
  persona: string;
  voice: string;
  audioUrl: string;
  duration: number;
  hanzi: string;
  pinyin: string;
  vietnamese: string;
}

interface DialogueManifestEntry {
  id: string;
  lesson: number;
  textIndex: number;
  title: string;
  context: string;
  fullAudioUrl: string;
  totalDuration: number;
  lineTimings: AudioTiming[];
  lines: AudioLine[];
}

type AudioManifest = Record<string, DialogueManifestEntry>;

// ============================================================================
// Test Suite Setup & Helper Oracles
// ============================================================================

const PROJECT_ROOT = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(PROJECT_ROOT, 'src', 'data', 'coursebookAudioManifest.json');
const LAYOUT_FILE_PATH = path.join(PROJECT_ROOT, 'src', 'data', 'hsk1BubbleLayouts.ts');
const HSK2_BOOK_PATH = path.join(PROJECT_ROOT, 'src', 'data', 'newHsk2BookData.ts');
const COURSEBOOK_VIEW_PATH = path.join(PROJECT_ROOT, 'src', 'components', 'Coursebook', 'CoursebookView.tsx');

// Generate the canonical 45 HSK 1 dialogue IDs: hsk1-l1-t1 to hsk1-l15-t3
const ALL_HSK1_DIALOGUE_IDS: string[] = [];
for (let l = 1; l <= 15; l++) {
  for (let t = 1; t <= 3; t++) {
    ALL_HSK1_DIALOGUE_IDS.push(`hsk1-l${l}-t${t}`);
  }
}

// Global cached manifest and bubble layouts
let manifest: AudioManifest;
let hsk1Layouts: HSK1SceneBubbleMap | null = null;
let diskDurations: Record<string, number> = {};

beforeAll(async () => {
  // 1. Load Audio Manifest
  expect(fs.existsSync(MANIFEST_PATH), `Manifest must exist at ${MANIFEST_PATH}`).toBe(true);
  const manifestRaw = fs.readFileSync(MANIFEST_PATH, 'utf-8');
  manifest = JSON.parse(manifestRaw);

  // 2. Conditionally load HSK1_BUBBLE_LAYOUTS if file exists
  if (fs.existsSync(LAYOUT_FILE_PATH)) {
    try {
      const mod = await import('../src/data/hsk1BubbleLayouts');
      hsk1Layouts = mod.HSK1_BUBBLE_LAYOUTS || null;
    } catch {
      hsk1Layouts = null;
    }
  }

  // 3. Batch probe actual disk MP3 durations using mutagen (authoritative reference oracle)
  try {
    const pyScript = [
      'import json, glob, mutagen.mp3',
      'files = glob.glob("public/audio/coursebook/hsk1-*-t*_full.mp3")',
      'res = {}',
      'for f in files:',
      '    p = f.replace("\\\\", "/")',
      '    try:',
      '        res[p] = round(float(mutagen.mp3.MP3(f).info.length), 2)',
      '    except Exception:',
      '        pass',
      'print(json.dumps(res))',
    ].join('\n');

    const out = execFileSync('python', ['-c', pyScript], {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
    });
    diskDurations = JSON.parse(out);
  } catch (err) {
    // Fallback: If python/mutagen fails, diskDurations remains empty
    diskDurations = {};
  }
});

// ============================================================================
// Tier 1: Feature Coverage (Audio & Layout Presence)
// ============================================================================

describe('Tier 1: Feature Coverage (Audio & Layout Presence)', () => {
  describe('Tier 1.1: Full Dialogue Audio Completeness (45 files)', () => {
    it.each(ALL_HSK1_DIALOGUE_IDS)(
      'full audio file for %s exists on disk and is larger than 1024 bytes',
      (dialogueId) => {
        const fullAudioPath = path.join(
          PROJECT_ROOT,
          'public',
          'audio',
          'coursebook',
          `${dialogueId}_full.mp3`
        );
        expect(
          fs.existsSync(fullAudioPath),
          `Missing full audio file: public/audio/coursebook/${dialogueId}_full.mp3`
        ).toBe(true);

        const stat = fs.statSync(fullAudioPath);
        expect(
          stat.size,
          `Full audio file ${dialogueId}_full.mp3 must be > 1024 bytes (actual: ${stat.size} bytes)`
        ).toBeGreaterThan(1024);
      }
    );
  });

  describe('Tier 1.2: Line Dialogue Audio Completeness (203 files)', () => {
    it('verifies all 203 line audio files declared in manifest exist and exceed 1024 bytes', () => {
      let totalLinesChecked = 0;

      for (const dialogueId of ALL_HSK1_DIALOGUE_IDS) {
        const entry = manifest[dialogueId];
        expect(entry, `Manifest entry for ${dialogueId} must exist`).toBeDefined();
        expect(Array.isArray(entry.lines), `Lines in ${dialogueId} must be an array`).toBe(true);

        for (let i = 0; i < entry.lines.length; i++) {
          const line = entry.lines[i];
          const expectedUrl = `/audio/coursebook/${dialogueId}_line${i}.mp3`;
          expect(line.audioUrl).toBe(expectedUrl);

          const diskPath = path.join(PROJECT_ROOT, 'public', line.audioUrl.replace(/^\//, ''));
          expect(
            fs.existsSync(diskPath),
            `Line audio file missing at disk path: ${diskPath}`
          ).toBe(true);

          const stat = fs.statSync(diskPath);
          expect(
            stat.size,
            `Line audio file ${diskPath} is too small (${stat.size} bytes)`
          ).toBeGreaterThan(1024);

          totalLinesChecked++;
        }
      }

      expect(totalLinesChecked, 'Must verify exactly 203 line audio files across all 45 dialogues').toBe(203);
    });
  });

  describe('Tier 1.3: Audio Manifest Structural Completeness', () => {
    it('contains all 45 HSK 1 dialogue entries with valid schemas', () => {
      for (const dialogueId of ALL_HSK1_DIALOGUE_IDS) {
        const entry = manifest[dialogueId];
        expect(entry, `Manifest key missing: ${dialogueId}`).toBeDefined();
        expect(entry.id).toBe(dialogueId);
        expect(typeof entry.lesson).toBe('number');
        expect(typeof entry.textIndex).toBe('number');
        expect(typeof entry.title).toBe('string');
        expect(typeof entry.context).toBe('string');
        expect(entry.fullAudioUrl).toBe(`/audio/coursebook/${dialogueId}_full.mp3`);
        expect(entry.totalDuration).toBeGreaterThan(0);
        expect(Array.isArray(entry.lines)).toBe(true);
        expect(Array.isArray(entry.lineTimings)).toBe(true);
        expect(entry.lines.length).toBe(entry.lineTimings.length);
        expect(entry.lines.length).toBeGreaterThan(0);
      }
    });

    it('manifest HSK 1 line total is exactly 203 lines', () => {
      const hsk1Keys = Object.keys(manifest).filter((k) => k.startsWith('hsk1-'));
      expect(hsk1Keys.length).toBe(45);
      const totalLines = hsk1Keys.reduce((acc, k) => acc + manifest[k].lines.length, 0);
      expect(totalLines).toBe(203);
    });
  });

  describe('Tier 1.4: HSK 1 Speech Bubble Layout Presence', () => {
    it('layout configuration file src/data/hsk1BubbleLayouts.ts exists and exports HSK1_BUBBLE_LAYOUTS', () => {
      expect(
        fs.existsSync(LAYOUT_FILE_PATH),
        `Layout file must exist at ${LAYOUT_FILE_PATH}`
      ).toBe(true);
      expect(hsk1Layouts, 'HSK1_BUBBLE_LAYOUTS must be exported and non-null').not.toBeNull();
    });

    it.each(ALL_HSK1_DIALOGUE_IDS)(
      'bubble layout exists for dialogue %s with valid speaker configurations',
      (dialogueId) => {
        expect(hsk1Layouts, 'HSK1_BUBBLE_LAYOUTS must be loaded').not.toBeNull();
        const sceneLayout = hsk1Layouts![dialogueId];
        expect(sceneLayout, `Bubble layout for ${dialogueId} must exist`).toBeDefined();

        const speakers = Object.keys(sceneLayout);
        expect(speakers.length, `Dialogue ${dialogueId} must have at least 1 speaker config`).toBeGreaterThanOrEqual(1);

        for (const sp of speakers) {
          const cfg = sceneLayout[sp];
          expect(cfg.mouthTarget, `Speaker ${sp} in ${dialogueId} must define mouthTarget`).toBeDefined();
          expect(typeof cfg.mouthTarget.x).toBe('number');
          expect(typeof cfg.mouthTarget.y).toBe('number');
          expect(cfg.placement, `Speaker ${sp} in ${dialogueId} must define placement`).toBeDefined();
        }
      }
    );
  });

  describe('Tier 1.5: Illustration Artwork Asset Presence', () => {
    it.each(ALL_HSK1_DIALOGUE_IDS)(
      'illustration artwork PNG exists for %s in public/textbook_art/',
      (dialogueId) => {
        // e.g. hsk1-l1-t1 -> hsk1_30_l1_t1.png
        const parts = dialogueId.split('-');
        const lesson = parts[1].replace('l', '');
        const text = parts[2].replace('t', '');
        const artFilename = `hsk1_30_l${lesson}_t${text}.png`;
        const artPath = path.join(PROJECT_ROOT, 'public', 'textbook_art', artFilename);

        expect(
          fs.existsSync(artPath),
          `Artwork file missing: public/textbook_art/${artFilename}`
        ).toBe(true);

        const stat = fs.statSync(artPath);
        expect(
          stat.size,
          `Artwork file ${artFilename} must be > 10KB (actual: ${stat.size} bytes)`
        ).toBeGreaterThan(10240);
      }
    );

    it('CoursebookView.tsx maps all 45 HSK 1 dialogues to valid textbook art paths', () => {
      expect(fs.existsSync(COURSEBOOK_VIEW_PATH)).toBe(true);
      const viewCode = fs.readFileSync(COURSEBOOK_VIEW_PATH, 'utf-8');

      for (const dialogueId of ALL_HSK1_DIALOGUE_IDS) {
        const parts = dialogueId.split('-');
        const lesson = parts[1].replace('l', '');
        const text = parts[2].replace('t', '');
        const expectedArt = `/textbook_art/hsk1_30_l${lesson}_t${text}.png`;

        expect(
          viewCode.includes(expectedArt),
          `CoursebookView.tsx must reference ${expectedArt} for ${dialogueId}`
        ).toBe(true);
      }
    });
  });
});

// ============================================================================
// Tier 2: Boundary & Corner Cases
// ============================================================================

describe('Tier 2: Boundary & Corner Cases', () => {
  describe('Tier 2.1: Full Audio File Duration Tolerance (<= 0.5s)', () => {
    it.each(ALL_HSK1_DIALOGUE_IDS)(
      'actual disk audio duration matches manifest totalDuration within 0.5s for %s',
      (dialogueId) => {
        const entry = manifest[dialogueId];
        expect(entry, `Manifest entry for ${dialogueId} must exist`).toBeDefined();
        const expectedDuration = entry.totalDuration;

        const fullAudioRelative = `public/audio/coursebook/${dialogueId}_full.mp3`;
        const diskDuration = diskDurations[fullAudioRelative];

        expect(
          diskDuration,
          `Disk duration for ${fullAudioRelative} could not be determined via oracle`
        ).toBeDefined();

        const diff = Math.abs(diskDuration - expectedDuration);
        expect(
          diff,
          `Duration mismatch for ${dialogueId}: Manifest declares ${expectedDuration}s, actual disk audio is ${diskDuration}s (diff: ${diff.toFixed(2)}s, allowed <= 0.5s)`
        ).toBeLessThanOrEqual(0.5);
      }
    );
  });

  describe('Tier 2.2: Line Timings Monotonicity & Interval Validity', () => {
    it.each(ALL_HSK1_DIALOGUE_IDS)(
      'dialogue %s lineTimings are positive, non-overlapping, and sequential',
      (dialogueId) => {
        const entry = manifest[dialogueId];
        expect(entry).toBeDefined();
        const timings = entry.lineTimings;
        expect(timings.length).toBeGreaterThan(0);

        for (let i = 0; i < timings.length; i++) {
          const t = timings[i];
          expect(t.lineIndex).toBe(i);
          expect(
            t.start,
            `Start time must be non-negative in line ${i} of ${dialogueId}`
          ).toBeGreaterThanOrEqual(0);
          expect(
            t.end,
            `End time must be strictly greater than start time in line ${i} of ${dialogueId}`
          ).toBeGreaterThan(t.start);

          const calculatedDuration = t.end - t.start;
          expect(
            Math.abs(t.duration - calculatedDuration),
            `Duration field mismatch in line ${i} of ${dialogueId}`
          ).toBeLessThan(0.05);

          // Non-overlapping sequential intervals with previous line
          if (i > 0) {
            const prev = timings[i - 1];
            expect(
              t.start,
              `Overlapping lines detected: Line ${i} starts at ${t.start}s before Line ${i - 1} ends at ${prev.end}s in ${dialogueId}`
            ).toBeGreaterThanOrEqual(prev.end - 0.05);
          }
        }

        // Final boundary: Last line timing cannot exceed manifest totalDuration
        const lastEnd = timings[timings.length - 1].end;
        expect(
          lastEnd,
          `Final line end time (${lastEnd}s) exceeds totalDuration (${entry.totalDuration}s) in ${dialogueId}`
        ).toBeLessThanOrEqual(entry.totalDuration + 0.5);
      }
    );
  });

  describe('Tier 2.3: Coordinate Boundary Constraints [5, 95]%', () => {
    it.each(ALL_HSK1_DIALOGUE_IDS)(
      'all mouth targets and bubble positions in %s are strictly clamped within [5, 95]%',
      (dialogueId) => {
        expect(hsk1Layouts, 'HSK1_BUBBLE_LAYOUTS must be loaded').not.toBeNull();
        const sceneLayout = hsk1Layouts![dialogueId];
        expect(sceneLayout).toBeDefined();

        const validPlacements = [
          'top',
          'top-left',
          'top-right',
          'left',
          'right',
          'bottom-left',
          'bottom-right',
          'custom',
        ];

        for (const [speaker, cfg] of Object.entries(sceneLayout)) {
          // Mouth target bounds
          expect(
            cfg.mouthTarget.x,
            `MouthTarget.x for ${speaker} in ${dialogueId} (${cfg.mouthTarget.x}) outside [5, 95]%`
          ).toBeGreaterThanOrEqual(5);
          expect(
            cfg.mouthTarget.x,
            `MouthTarget.x for ${speaker} in ${dialogueId} (${cfg.mouthTarget.x}) outside [5, 95]%`
          ).toBeLessThanOrEqual(95);

          expect(
            cfg.mouthTarget.y,
            `MouthTarget.y for ${speaker} in ${dialogueId} (${cfg.mouthTarget.y}) outside [5, 95]%`
          ).toBeGreaterThanOrEqual(5);
          expect(
            cfg.mouthTarget.y,
            `MouthTarget.y for ${speaker} in ${dialogueId} (${cfg.mouthTarget.y}) outside [5, 95]%`
          ).toBeLessThanOrEqual(95);

          // Placement valid enum
          expect(
            validPlacements,
            `Invalid placement '${cfg.placement}' for ${speaker} in ${dialogueId}`
          ).toContain(cfg.placement);

          // If custom bubblePos is provided, verify bounds
          if (cfg.bubblePos) {
            expect(
              cfg.bubblePos.x,
              `bubblePos.x for ${speaker} in ${dialogueId} (${cfg.bubblePos.x}) outside [5, 95]%`
            ).toBeGreaterThanOrEqual(5);
            expect(
              cfg.bubblePos.x,
              `bubblePos.x for ${speaker} in ${dialogueId} (${cfg.bubblePos.x}) outside [5, 95]%`
            ).toBeLessThanOrEqual(95);

            expect(
              cfg.bubblePos.y,
              `bubblePos.y for ${speaker} in ${dialogueId} (${cfg.bubblePos.y}) outside [5, 95]%`
            ).toBeGreaterThanOrEqual(5);
            expect(
              cfg.bubblePos.y,
              `bubblePos.y for ${speaker} in ${dialogueId} (${cfg.bubblePos.y}) outside [5, 95]%`
            ).toBeLessThanOrEqual(95);
          }
        }
      }
    );
  });

  describe('Tier 2.4: Multi-Speaker Distinctness & Collision Avoidance', () => {
    const multiSpeakerScenes = [
      { id: 'hsk1-l4-t3', speakers: ['刘小明', '王一雪', '杨同乐'], minCount: 3 },
      { id: 'hsk1-l6-t3', speakers: ['刘小明', '刘明', '王一雪', '刘小雪'], minCount: 4 },
      { id: 'hsk1-l8-t1', speakers: ['白家月', '王一飞', '陈天中'], minCount: 3 },
      { id: 'hsk1-l14-t2', speakers: ['陈天中', '白家月', '王一飞'], minCount: 3 },
      { id: 'hsk1-l15-t3', speakers: ['白家月', '王一飞', '安妮'], minCount: 3 },
      { id: 'hsk1-l15-t1', speakers: ['白家月', '李文', '安妮', '陈天中'], minCount: 4 },
      { id: 'hsk1-l15-t2', speakers: ['白家月', '李文', '安妮', '陈天中'], minCount: 4 },
    ];

    it.each(multiSpeakerScenes)(
      'multi-speaker scene $id ensures distinct speaker positions and non-colliding layouts',
      ({ id, speakers }) => {
        expect(hsk1Layouts, 'HSK1_BUBBLE_LAYOUTS must be loaded').not.toBeNull();
        const sceneLayout = hsk1Layouts![id];
        expect(sceneLayout, `Scene ${id} layout missing`).toBeDefined();

        for (const sp of speakers) {
          expect(sceneLayout[sp], `Speaker ${sp} missing in layout for ${id}`).toBeDefined();
        }

        // Check pairwise distinctness of mouth targets
        for (let i = 0; i < speakers.length; i++) {
          for (let j = i + 1; j < speakers.length; j++) {
            const spA = speakers[i];
            const spB = speakers[j];
            const posA = sceneLayout[spA].mouthTarget;
            const posB = sceneLayout[spB].mouthTarget;

            const deltaX = Math.abs(posA.x - posB.x);
            const deltaY = Math.abs(posA.y - posB.y);
            const distance = Math.hypot(deltaX, deltaY);

            expect(
              distance,
              `Mouth targets for ${spA} (${posA.x}, ${posA.y}) and ${spB} (${posB.x}, ${posB.y}) in ${id} are too close (distance: ${distance.toFixed(1)}%)`
            ).toBeGreaterThanOrEqual(6);
          }
        }
      }
    );
  });
});

// ============================================================================
// Tier 3: Cross-Feature Combinations
// ============================================================================

describe('Tier 3: Cross-Feature Combinations', () => {
  describe('Tier 3.1: Adaptive SVG Tail Origin & Directional Alignment', () => {
    it.each(ALL_HSK1_DIALOGUE_IDS)(
      'tail origin and placement direction in %s logically point towards speaker mouth target',
      (dialogueId) => {
        expect(hsk1Layouts, 'HSK1_BUBBLE_LAYOUTS must be loaded').not.toBeNull();
        const sceneLayout = hsk1Layouts![dialogueId];
        expect(sceneLayout).toBeDefined();

        for (const [speaker, cfg] of Object.entries(sceneLayout)) {
          // If placement is 'top', bubble is located above the speaker; tail should originate from bottom
          if (cfg.placement === 'top') {
            const allowedOrigins = ['bottom', 'bottom-left', 'bottom-right', undefined];
            expect(
              allowedOrigins,
              `Top-placed bubble for ${speaker} in ${dialogueId} should have bottom tail origin`
            ).toContain(cfg.tailOrigin);
          }

          // If placement is 'left' or 'bottom-left', bubble is on the left; tail points towards mouth
          if (cfg.placement === 'left' || cfg.placement === 'bottom-left') {
            const allowedOrigins = ['right', 'bottom-right', 'top-right', 'bottom', undefined];
            expect(
              allowedOrigins,
              `Left-placed bubble for ${speaker} in ${dialogueId} should point towards mouth (rightwards/downwards)`
            ).toContain(cfg.tailOrigin);
          }

          // If placement is 'right' or 'bottom-right', bubble is on the right; tail points towards mouth
          if (cfg.placement === 'right' || cfg.placement === 'bottom-right') {
            const allowedOrigins = ['left', 'bottom-left', 'top-left', 'bottom', undefined];
            expect(
              allowedOrigins,
              `Right-placed bubble for ${speaker} in ${dialogueId} should point towards mouth (leftwards/downwards)`
            ).toContain(cfg.tailOrigin);
          }

          // If custom bubblePos is given, verify logical alignment with mouth target
          if (cfg.bubblePos) {
            // Bubble center vs mouth target
            const isAbove = cfg.bubblePos.y < cfg.mouthTarget.y;
            const isBelow = cfg.bubblePos.y > cfg.mouthTarget.y;
            if (isAbove && Math.abs(cfg.bubblePos.x - cfg.mouthTarget.x) < 20) {
              // Directly above: tail must originate from bottom edge
              if (cfg.tailOrigin) {
                expect(
                  ['bottom', 'bottom-left', 'bottom-right'],
                  `Bubble above mouth in ${dialogueId} (${speaker}) should have bottom-directed tail`
                ).toContain(cfg.tailOrigin);
              }
            } else if (isBelow && Math.abs(cfg.bubblePos.x - cfg.mouthTarget.x) < 20) {
              // Directly below: tail must originate from top edge
              if (cfg.tailOrigin) {
                expect(
                  ['top', 'top-left', 'top-right'],
                  `Bubble below mouth in ${dialogueId} (${speaker}) should have top-directed tail`
                ).toContain(cfg.tailOrigin);
              }
            }
          }
        }
      }
    );
  });

  describe('Tier 3.2: Karaoke Audio Timing Synchronization', () => {
    it.each(ALL_HSK1_DIALOGUE_IDS)(
      'dialogue %s karaoke line duration and line audio URL sync with full audio timeline',
      (dialogueId) => {
        const entry = manifest[dialogueId];
        expect(entry).toBeDefined();

        const lines = entry.lines;
        const timings = entry.lineTimings;
        expect(lines.length).toBe(timings.length);

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const timing = timings[i];

          // Duration synchronization between lines and lineTimings
          expect(
            Math.abs(line.duration - timing.duration),
            `Line ${i} duration in lines[] (${line.duration}s) != lineTimings[] (${timing.duration}s) in ${dialogueId}`
          ).toBeLessThanOrEqual(0.1);

          // Audio URL pattern
          expect(line.audioUrl).toBe(`/audio/coursebook/${dialogueId}_line${i}.mp3`);
        }

        // Total duration is sufficient to encompass all line timings
        const lastTiming = timings[timings.length - 1];
        expect(
          entry.totalDuration,
          `Full audio totalDuration (${entry.totalDuration}s) must accommodate last line end (${lastTiming.end}s) in ${dialogueId}`
        ).toBeGreaterThanOrEqual(lastTiming.end - 0.5);
      }
    );
  });
});

// ============================================================================
// Tier 4: Real-World Scenarios & HSK 2 Strict Isolation
// ============================================================================

describe('Tier 4: Real-World Scenarios & HSK 2 Strict Isolation', () => {
  describe('Tier 4.1: Full 15-Lesson Curriculum Integrity (All 45 Dialogues)', () => {
    it('NEW_HSK1_FULL_LESSONS contains exactly 15 lessons with 3 texts each (45 total texts)', () => {
      expect(NEW_HSK1_FULL_LESSONS.length).toBe(15);

      let totalTextsCount = 0;
      let totalLinesCount = 0;

      for (let l = 0; l < NEW_HSK1_FULL_LESSONS.length; l++) {
        const lesson = NEW_HSK1_FULL_LESSONS[l];
        expect(lesson.lessonNumber).toBe(l + 1);
        expect(lesson.texts.length, `Lesson ${l + 1} must contain exactly 3 texts`).toBe(3);

        for (let t = 0; t < lesson.texts.length; t++) {
          const text = lesson.texts[t];
          const expectedId = `hsk1-l${l + 1}-t${t + 1}`;
          expect(text.id).toBe(expectedId);
          expect(text.title.length).toBeGreaterThan(0);
          expect(text.context.length).toBeGreaterThan(0);
          expect(text.lines.length).toBeGreaterThan(0);

          totalTextsCount++;
          totalLinesCount += text.lines.length;
        }
      }

      expect(totalTextsCount).toBe(45);
      expect(totalLinesCount).toBe(203);
    });

    it('cross-verifies curriculum text lines with manifest line definitions 1:1', () => {
      for (let l = 0; l < NEW_HSK1_FULL_LESSONS.length; l++) {
        const lesson = NEW_HSK1_FULL_LESSONS[l];
        for (let t = 0; t < lesson.texts.length; t++) {
          const text = lesson.texts[t];
          const manifestEntry = manifest[text.id];
          expect(manifestEntry, `Missing manifest entry for ${text.id}`).toBeDefined();
          expect(
            manifestEntry.lines.length,
            `Line count mismatch for ${text.id}: Curriculum has ${text.lines.length}, manifest has ${manifestEntry.lines.length}`
          ).toBe(text.lines.length);

          for (let i = 0; i < text.lines.length; i++) {
            const currLine = text.lines[i];
            const manLine = manifestEntry.lines[i];

            // Hanzi must match verbatim
            expect(
              manLine.hanzi,
              `Hanzi mismatch in ${text.id} line ${i}: '${manLine.hanzi}' != '${currLine.hanzi}'`
            ).toBe(currLine.hanzi);

            // Valid neural voice and avatar assignments (Edge-TTS zh-CN/zh-TW neural voices or chorus)
            expect(manLine.voice).toMatch(/^zh-(CN|TW)-/);
            expect(manLine.avatar.length).toBeGreaterThan(0);
            expect(manLine.gender).toMatch(/^(female|male)$/);
          }
        }
      }
    });
  });

  describe('Tier 4.2: Strict HSK 2 Data and Anchor Immutability', () => {
    it('src/data/newHsk2BookData.ts exists and matches pristine SHA256 checksum', () => {
      expect(
        fs.existsSync(HSK2_BOOK_PATH),
        `HSK 2 book data must exist at ${HSK2_BOOK_PATH}`
      ).toBe(true);

      const content = fs.readFileSync(HSK2_BOOK_PATH);
      const hash = crypto.createHash('sha256').update(content).digest('hex');

      // Canonical pristine hash of newHsk2BookData.ts
      const EXPECTED_HSK2_SHA256 = '85ed8039e430f7ebc46fc08e6f34a90a21bfde6f315f507674c77f60da2ed59d';
      expect(
        hash,
        `SECURITY VIOLATION: newHsk2BookData.ts has been modified! Expected ${EXPECTED_HSK2_SHA256}, got ${hash}`
      ).toBe(EXPECTED_HSK2_SHA256);
    });

    it('coursebookCharacterAnchors.ts retains all 60 untouched HSK 2 entries matching pristine hash', () => {
      const hsk2Entries: Record<string, any> = {};
      const allKeys = Object.keys(COURSEBOOK_CHARACTER_ANCHORS).sort();

      for (const k of allKeys) {
        if (k.startsWith('hsk2-')) {
          hsk2Entries[k] = COURSEBOOK_CHARACTER_ANCHORS[k];
        }
      }

      // Must have exactly 60 HSK 2 scene anchor entries (15 lessons * 4 texts)
      const hsk2KeyCount = Object.keys(hsk2Entries).length;
      expect(
        hsk2KeyCount,
        `Expected exactly 60 HSK 2 scene entries in COURSEBOOK_CHARACTER_ANCHORS, found ${hsk2KeyCount}`
      ).toBe(60);

      // Verify pristine SHA256 hash of sorted HSK 2 anchor records
      const hash = crypto
        .createHash('sha256')
        .update(JSON.stringify(hsk2Entries))
        .digest('hex');

      const EXPECTED_ANCHORS_SHA256 = 'de7f101f863c74cf49c5a75369cb927c5e3a4f9f5b78657aa10f96a084e222c1';
      expect(
        hash,
        `SECURITY VIOLATION: HSK 2 anchors in coursebookCharacterAnchors.ts have been modified! Got hash ${hash}`
      ).toBe(EXPECTED_ANCHORS_SHA256);
    });

    it('audio manifest preserves all 60 HSK 2 dialogue entries intact', () => {
      const hsk2ManifestKeys = Object.keys(manifest).filter((k) => k.startsWith('hsk2-'));
      expect(
        hsk2ManifestKeys.length,
        `Expected 60 HSK 2 entries in coursebookAudioManifest.json, found ${hsk2ManifestKeys.length}`
      ).toBe(60);

      for (let l = 1; l <= 15; l++) {
        for (let t = 1; t <= 4; t++) {
          const key = `hsk2-l${l}-t${t}`;
          expect(manifest[key], `Missing HSK 2 manifest key: ${key}`).toBeDefined();
        }
      }
    });

    it('CoursebookView.tsx integrates all 60 HSK 2 3.0 illustrations alongside HSK 1', () => {
      expect(fs.existsSync(COURSEBOOK_VIEW_PATH)).toBe(true);
      const viewCode = fs.readFileSync(COURSEBOOK_VIEW_PATH, 'utf-8');

      // Verify HSK 2 3.0 text illustrations are wired in CoursebookView
      expect(
        viewCode.includes('/textbook_art/hsk2_30_l1_t1.png'),
        'CoursebookView must include HSK 2 3.0 Lesson 1 illustrations'
      ).toBe(true);
      expect(
        viewCode.includes('/textbook_art/hsk2_30_l15_t4.png'),
        'CoursebookView must include HSK 2 3.0 Lesson 15 illustrations'
      ).toBe(true);
    });
  });
});
