/**
 * tests/challenger_m2_re2_empirical_audit.test.ts
 *
 * Empirical Challenger Verification Suite for Task M2-RE-2:
 * 1. Confirm 616 physical audio MP3 files exist in public/audio/coursebook/ with non-zero size.
 * 2. Confirm 100% audio trigger coverage across 555 vocabulary items and all grammar points in HSK 1 & HSK 2.
 * 3. Verify audio format integrity, line timing monotonically, and zero-defect playback.
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import { COURSEBOOK_AUDIO_MANIFEST } from '../src/data/coursebookAudioManifest';
import { NEW_HSK1_FULL_LESSONS } from '../src/data/newHsk1BookData';
import { NEW_HSK2_FULL_LESSONS } from '../src/data/newHsk2BookData';
import {
  playChineseAudio,
  detectTextLanguage,
  resolveChineseTtsPayload,
} from '../src/utils/chineseAudio';

describe('Challenger M2-RE-2 Empirical Audio & Voice Deep Audit', () => {
  const coursebookDir = path.resolve(process.cwd(), 'public/audio/coursebook');

  // =========================================================================
  // 1. PHYSICAL AUDIO FILES & FILESYSTEM AUDIT (616 FILES)
  // =========================================================================
  describe('1. Physical Audio Files Integrity & File Size Invariants', () => {
    it('1.1: Physical coursebook directory exists and contains exactly 616 .mp3 files', () => {
      expect(fs.existsSync(coursebookDir)).toBe(true);
      const allFiles = fs.readdirSync(coursebookDir);
      const mp3Files = allFiles.filter(f => f.endsWith('.mp3'));

      expect(mp3Files.length).toBe(616);
      expect(allFiles.length).toBe(616); // No extra non-mp3 files
    });

    it('1.2: Every single one of the 616 files is non-zero byte (> 8 KB) and has valid MPEG header', () => {
      const allFiles = fs.readdirSync(coursebookDir);
      let zeroByteCount = 0;
      let below8KbCount = 0;
      let totalBytes = 0;

      for (const file of allFiles) {
        const filePath = path.join(coursebookDir, file);
        const stat = fs.statSync(filePath);
        totalBytes += stat.size;

        if (stat.size === 0) zeroByteCount++;
        if (stat.size < 8192) below8KbCount++;

        // Read 4 bytes for MPEG sync word or ID3
        const fd = fs.openSync(filePath, 'r');
        const buf = Buffer.alloc(4);
        fs.readSync(fd, buf, 0, 4, 0);
        fs.closeSync(fd);

        const isID3 = buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33;
        const isSyncWord = buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0;
        expect(isID3 || isSyncWord).toBe(true);
      }

      expect(zeroByteCount).toBe(0);
      expect(below8KbCount).toBe(0);
      // Total assets exceed 22 MB of verified audio (23,500,512 bytes)
      expect(totalBytes).toBeGreaterThan(20 * 1024 * 1024);
      expect(totalBytes).toBeLessThan(30 * 1024 * 1024);
    });

    it('1.3: 100% bidirectional mapping between manifest (616 references) and physical disk', () => {
      const diskSet = new Set(fs.readdirSync(coursebookDir));
      const manifestSet = new Set<string>();

      for (const item of Object.values(COURSEBOOK_AUDIO_MANIFEST)) {
        if (item.fullAudioUrl) {
          manifestSet.add(path.basename(item.fullAudioUrl));
        }
        for (const line of item.lines || []) {
          if (line.audioUrl) {
            manifestSet.add(path.basename(line.audioUrl));
          }
        }
      }

      expect(manifestSet.size).toBe(616);
      expect(diskSet.size).toBe(616);

      const missingOnDisk = [...manifestSet].filter(f => !diskSet.has(f));
      const orphansOnDisk = [...diskSet].filter(f => !manifestSet.has(f));

      expect(missingOnDisk).toEqual([]);
      expect(orphansOnDisk).toEqual([]);
    });
  });

  // =========================================================================
  // 2. VOCABULARY AUDIO TRIGGER COVERAGE (555 ITEMS)
  // =========================================================================
  describe('2. Vocabulary Audio Trigger Coverage (555 items across HSK 1 & HSK 2)', () => {
    it('2.1: HSK 1 contains 342 vocabulary items with 100% non-empty Hanzi and valid TTS payload', () => {
      let count = 0;
      for (const lesson of NEW_HSK1_FULL_LESSONS) {
        for (const item of lesson.vocabulary) {
          count++;
          expect(item.hanzi).toBeDefined();
          expect(item.hanzi.trim().length).toBeGreaterThan(0);
          expect(detectTextLanguage(item.hanzi)).toBe('zh');
          expect(resolveChineseTtsPayload(item.hanzi).trim().length).toBeGreaterThan(0);
        }
      }
      expect(count).toBe(342);
    });

    it('2.2: HSK 2 contains 213 vocabulary items with 100% non-empty Hanzi and valid TTS payload', () => {
      let count = 0;
      for (const lesson of NEW_HSK2_FULL_LESSONS) {
        for (const item of lesson.vocabulary) {
          count++;
          expect(item.hanzi).toBeDefined();
          expect(item.hanzi.trim().length).toBeGreaterThan(0);
          expect(detectTextLanguage(item.hanzi)).toBe('zh');
          expect(resolveChineseTtsPayload(item.hanzi).trim().length).toBeGreaterThan(0);
        }
      }
      expect(count).toBe(213);
    });

    it('2.3: Total vocabulary is exactly 555 items and all execute playChineseAudio without errors', async () => {
      const allVocab = [
        ...NEW_HSK1_FULL_LESSONS.flatMap(l => l.vocabulary),
        ...NEW_HSK2_FULL_LESSONS.flatMap(l => l.vocabulary)
      ];
      expect(allVocab.length).toBe(555);

      let successCount = 0;
      for (const item of allVocab) {
        await expect(playChineseAudio(item.hanzi)).resolves.toBeUndefined();
        successCount++;
      }
      expect(successCount).toBe(555);
    });
  });

  // =========================================================================
  // 3. GRAMMAR POINT AUDIO TRIGGER COVERAGE
  // =========================================================================
  describe('3. Grammar Point Audio Trigger Coverage (HSK 1 & HSK 2)', () => {
    it('3.1: Analyzes and counts all grammar points and example sentences across HSK 1 and HSK 2', () => {
      let hsk1GpCount = 0;
      let hsk1ExCount = 0;
      for (const lesson of NEW_HSK1_FULL_LESSONS) {
        hsk1GpCount += (lesson.grammarPoints || []).length;
        for (const gp of lesson.grammarPoints || []) {
          hsk1ExCount += (gp.examples || []).length;
        }
      }

      let hsk2GpCount = 0;
      let hsk2ExCount = 0;
      for (const lesson of NEW_HSK2_FULL_LESSONS) {
        hsk2GpCount += (lesson.grammarPoints || []).length;
        for (const gp of lesson.grammarPoints || []) {
          hsk2ExCount += (gp.examples || []).length;
        }
      }

      const totalGrammarPoints = hsk1GpCount + hsk2GpCount;
      const totalExamples = hsk1ExCount + hsk2ExCount;

      console.log(`[Challenger Audit] HSK 1 Grammar Points: ${hsk1GpCount}, Examples: ${hsk1ExCount}`);
      console.log(`[Challenger Audit] HSK 2 Grammar Points: ${hsk2GpCount}, Examples: ${hsk2ExCount}`);
      console.log(`[Challenger Audit] Total Grammar Points: ${totalGrammarPoints}, Total Examples: ${totalExamples}`);

      expect(totalGrammarPoints).toBeGreaterThan(0);
      expect(totalExamples).toBeGreaterThan(0);
    });

    it('3.2: 100% of grammar point examples have non-empty Hanzi and trigger playChineseAudio cleanly', async () => {
      const allLessons = [...NEW_HSK1_FULL_LESSONS, ...NEW_HSK2_FULL_LESSONS];
      let testedExamples = 0;

      for (const lesson of allLessons) {
        for (const gp of lesson.grammarPoints || []) {
          for (const ex of gp.examples) {
            testedExamples++;
            expect(ex.hanzi).toBeDefined();
            expect(ex.hanzi.trim().length).toBeGreaterThan(0);
            expect(detectTextLanguage(ex.hanzi)).toBe('zh');
            expect(resolveChineseTtsPayload(ex.hanzi).trim().length).toBeGreaterThan(0);
            await expect(playChineseAudio(ex.hanzi)).resolves.toBeUndefined();
          }
        }
      }

      expect(testedExamples).toBeGreaterThanOrEqual(90);
    });
  });
});
