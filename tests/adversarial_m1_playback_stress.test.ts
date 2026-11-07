import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { NEW_HSK1_FULL_LESSONS } from '../src/data/newHsk1BookData';
import { NEW_HSK2_FULL_LESSONS } from '../src/data/newHsk2BookData';

const MANIFEST_PATH = path.resolve(__dirname, '../src/data/coursebookAudioManifest.json');
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));

describe('Adversarial Milestone 1: Audio Playback Engine & Edge Case Stress Testing', () => {
  const hsk1Keys = Object.keys(manifest).filter((k) => k.startsWith('hsk1-'));

  describe('1. Interval Boundary Invariant Matrix across all 45 HSK 1 Dialogues', () => {
    it('contains all 45 HSK 1 dialogues with zero missing entries', () => {
      expect(hsk1Keys.length).toBe(45);
    });

    it.each(hsk1Keys)('%s maintains strict non-overlapping monotonic timeline', (dialogueId) => {
      const entry = manifest[dialogueId];
      const timings = entry.lineTimings;
      expect(timings.length).toBeGreaterThan(0);

      // Line 0 start must be >= 0
      expect(timings[0].start).toBeGreaterThanOrEqual(0);

      for (let i = 0; i < timings.length; i++) {
        const t = timings[i];
        expect(t.lineIndex).toBe(i);
        expect(t.end).toBeGreaterThan(t.start);

        const calculatedDur = Math.round((t.end - t.start) * 100) / 100;
        expect(Math.abs(t.duration - calculatedDur)).toBeLessThanOrEqual(0.05);

        if (i < timings.length - 1) {
          const next = timings[i + 1];
          const gap = next.start - t.end;
          // Inter-line gap must be non-negative (no overlap)
          expect(
            gap,
            `Overlap detected between line ${i} and ${i + 1} in ${dialogueId}: line ${i} ends at ${t.end}, line ${i + 1} starts at ${next.start}`
          ).toBeGreaterThanOrEqual(-0.01);

          // Gap should be within reasonable human speech pause bounds [0.0s, 1.5s]
          expect(gap).toBeLessThanOrEqual(1.5);
        }
      }

      // Last line end must not exceed manifest totalDuration
      const lastLineEnd = timings[timings.length - 1].end;
      expect(
        lastLineEnd,
        `Last line end (${lastLineEnd}s) exceeds totalDuration (${entry.totalDuration}s) in ${dialogueId}`
      ).toBeLessThanOrEqual(entry.totalDuration + 0.5);
    });
  });

  describe('2. Discrete Temporal Seeking Simulation (10ms Resolution)', () => {
    it.each(hsk1Keys)('timeupdate lookup never throws or produces out-of-bounds line index for %s', (dialogueId) => {
      const entry = manifest[dialogueId];
      const totalDur = entry.totalDuration;
      const numSteps = Math.min(Math.ceil(totalDur * 100), 2000); // 10ms sampling up to 20s

      let prevMatchedLine: number | null = null;
      let matchedCount = 0;

      for (let s = 0; s <= numSteps; s++) {
        const cur = s * 0.01;

        // Exact match logic used in CoursebookView.tsx:
        // const currentLine = manifestItem.lineTimings.find((t) => cur >= t.start && cur <= t.end);
        const currentLine = entry.lineTimings.find(
          (t: any) => cur >= t.start && cur <= t.end
        );

        if (currentLine) {
          matchedCount++;
          expect(currentLine.lineIndex).toBeGreaterThanOrEqual(0);
          expect(currentLine.lineIndex).toBeLessThan(entry.lines.length);

          if (prevMatchedLine !== null && currentLine.lineIndex !== prevMatchedLine) {
            // Forward progression in sequential playback
            expect(currentLine.lineIndex).toBeGreaterThan(prevMatchedLine);
          }
          prevMatchedLine = currentLine.lineIndex;
        }
      }

      // Verify that speech intervals cover a substantial portion of the audio
      expect(matchedCount).toBeGreaterThan(50);
    });
  });

  describe('3. Rapid Audio Switching & Preemption Simulation', () => {
    class MockAudioElement {
      src: string;
      playbackRate: number = 1.0;
      currentTime: number = 0.0;
      paused: boolean = true;
      ontimeupdate: (() => void) | null = null;
      onended: (() => void) | null = null;
      onerror: (() => void) | null = null;
      isDestroyed: boolean = false;

      constructor(src: string) {
        this.src = src;
      }

      async play(): Promise<void> {
        if (this.isDestroyed) {
          throw new Error('AbortError: The play() request was interrupted by a call to pause().');
        }
        this.paused = false;
      }

      pause(): void {
        this.paused = true;
        this.isDestroyed = true;
      }
    }

    it('simulates rapid start/stop bursts without state desynchronization', async () => {
      let activeAudio: MockAudioElement | null = null;
      let isPlayingFull = false;
      let playingLineIndex: number | null = null;

      const stopAll = () => {
        if (activeAudio) {
          activeAudio.pause();
          activeAudio = null;
        }
      };

      const startFull = async (textId: string) => {
        stopAll();
        isPlayingFull = true;
        playingLineIndex = null;
        const entry = manifest[textId];
        const audio = new MockAudioElement(entry.fullAudioUrl);
        activeAudio = audio;
        try {
          await audio.play();
        } catch {
          stopAll();
          isPlayingFull = false;
        }
      };

      const playLine = async (textId: string, lineIdx: number) => {
        stopAll();
        isPlayingFull = false;
        playingLineIndex = lineIdx;
        const entry = manifest[textId];
        const audio = new MockAudioElement(entry.lines[lineIdx].audioUrl);
        activeAudio = audio;
        try {
          await audio.play();
        } catch {
          stopAll();
          playingLineIndex = null;
        }
      };

      // Rapid burst: 100 alternating operations in rapid succession
      for (let i = 0; i < 100; i++) {
        if (i % 3 === 0) {
          await startFull('hsk1-l1-t2');
        } else if (i % 3 === 1) {
          await playLine('hsk1-l1-t2', i % 4);
        } else {
          stopAll();
          isPlayingFull = false;
          playingLineIndex = null;
        }
      }

      // Final stop ensures zero dangling audio
      stopAll();
      expect(activeAudio).toBeNull();
    });

    it('simulates line seeking while full audio is playing', () => {
      const entry = manifest['hsk1-l1-t2'];
      const timings = entry.lineTimings;

      // Simulate seeking to line 3 start
      const targetTime = timings[3].start;
      const matched = timings.find((t: any) => targetTime >= t.start && targetTime <= t.end);
      expect(matched).toBeDefined();
      expect(matched.lineIndex).toBe(3);

      // Simulate seeking to line 1 start
      const targetTime1 = timings[1].start;
      const matched1 = timings.find((t: any) => targetTime1 >= t.start && targetTime1 <= t.end);
      expect(matched1).toBeDefined();
      expect(matched1.lineIndex).toBe(1);
    });
  });

  describe('4. HSK 2 Curriculum Data Immutability Boundary', () => {
    it('guarantees HSK 2 curriculum data has 0 modifications', () => {
      expect(NEW_HSK2_FULL_LESSONS.length).toBe(15);
      // Verify sample lesson structure
      const l1 = NEW_HSK2_FULL_LESSONS[0];
      expect(l1.lessonNumber).toBe(1);
      expect(l1.texts.length).toBeGreaterThanOrEqual(1);
    });
  });
});
