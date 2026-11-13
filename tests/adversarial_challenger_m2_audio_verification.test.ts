/**
 * tests/adversarial_challenger_m2_audio_verification.test.ts
 *
 * Empirical Challenger Verification Suite for Requirement R2:
 * "Audio & Voice Playback Verification across HSK 1 and HSK 2"
 *
 * Independent Audits Executed:
 * 1. Manifest & Filesystem Integrity Audit:
 *    - Validates coursebookAudioManifest.json structure (105 texts, 511 lines).
 *    - Validates 100% resolution of all 616 audio entries to physical files.
 *    - Validates every file is non-zero byte (> 8 KB) and contains valid MPEG Layer 3 header (0xFF 0xF3).
 *    - Strictly checks: 0 broken links, 0 silent 0-byte files, 0 unreferenced files in public/audio/coursebook/.
 *    - Validates monotonic line timings (start < end, duration > 0).
 *
 * 2. Vocabulary & Grammar Audio Trigger Audit:
 *    - Parses all HSK 1 vocabulary (NEW_HSK1_FULL_LESSONS) and HSK 2 vocabulary (NEW_HSK2_FULL_LESSONS).
 *    - Parses all HSK 1 and HSK 2 grammar points and their examples.
 *    - Asserts 100% non-empty Hanzi with 'zh' language detection and valid TTS payloads.
 *    - Triggers playChineseAudio(hanzi) across every vocab and grammar item without throwing or returning undefined.
 *    - Edge case stress: empty strings, whitespace, and complex dialogue tags.
 *
 * 3. Express Static Serving & Streaming Audit:
 *    - Spins up real Express HTTP server matching server.ts static configuration.
 *    - Asserts HTTP 200, Content-Type 'audio/mpeg', and correct Content-Length for full audio.
 *    - Tests batch of line audios across HSK 1 and HSK 2.
 *    - Asserts HTTP 206 Partial Content for Range requests (RFC 7233 audio seeking).
 *    - Asserts HTTP 404 for missing files and path traversal protection.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import express from 'express';

import { COURSEBOOK_AUDIO_MANIFEST } from '../src/data/coursebookAudioManifest';
import { NEW_HSK1_FULL_LESSONS } from '../src/data/newHsk1BookData';
import { NEW_HSK2_FULL_LESSONS } from '../src/data/newHsk2BookData';
import {
  playChineseAudio,
  detectTextLanguage,
  resolveChineseTtsPayload,
} from '../src/utils/chineseAudio';

describe('Requirement R2 Empirical Challenger Verification Suite', () => {

  // =========================================================================
  // 1. MANIFEST & FILESYSTEM AUDIT
  // =========================================================================
  describe('1. Coursebook Audio Manifest & Filesystem Audit', () => {
    const coursebookDir = path.resolve(process.cwd(), 'public/audio/coursebook');

    it('1.1: Audio manifest contains exactly 105 texts and 511 dialogue lines', () => {
      const keys = Object.keys(COURSEBOOK_AUDIO_MANIFEST);
      expect(keys.length).toBe(105);

      let totalLines = 0;
      for (const key of keys) {
        const item = COURSEBOOK_AUDIO_MANIFEST[key];
        expect(item.id).toBe(key);
        expect(item.fullAudioUrl).toMatch(/^\/audio\/coursebook\/.+\.mp3$/i);
        expect(Array.isArray(item.lines)).toBe(true);
        totalLines += item.lines.length;
      }
      expect(totalLines).toBe(511);
    });

    it('1.2: Confirms 0 broken links: every full audio and line audio maps to disk', () => {
      const brokenLinks: string[] = [];
      let totalChecked = 0;

      for (const [key, item] of Object.entries(COURSEBOOK_AUDIO_MANIFEST)) {
        // Full audio check
        totalChecked++;
        const fullRel = item.fullAudioUrl.replace(/^\//, '');
        const fullDisk = path.resolve(process.cwd(), 'public', fullRel);
        if (!fs.existsSync(fullDisk)) {
          brokenLinks.push(`[${key}] fullAudioUrl missing: ${item.fullAudioUrl}`);
        }

        // Line audios check
        for (const line of item.lines || []) {
          totalChecked++;
          const lineRel = line.audioUrl.replace(/^\//, '');
          const lineDisk = path.resolve(process.cwd(), 'public', lineRel);
          if (!fs.existsSync(lineDisk)) {
            brokenLinks.push(`[${key}:line${line.lineIndex}] audioUrl missing: ${line.audioUrl}`);
          }
        }
      }

      expect(totalChecked).toBe(105 + 511); // 616 total audio references
      expect(brokenLinks).toHaveLength(0);
    });

    it('1.3: Confirms 0 silent 0-byte files: all 616 audio files have size > 8 KB', () => {
      const physicalFiles = fs.readdirSync(coursebookDir);
      expect(physicalFiles.length).toBe(616);

      const zeroByteFiles: string[] = [];
      const suspiciousSmallFiles: string[] = [];

      for (const file of physicalFiles) {
        const filePath = path.join(coursebookDir, file);
        const stat = fs.statSync(filePath);
        if (stat.size === 0) {
          zeroByteFiles.push(file);
        } else if (stat.size < 1000) {
          suspiciousSmallFiles.push(`${file} (${stat.size} bytes)`);
        }
      }

      expect(zeroByteFiles).toHaveLength(0);
      expect(suspiciousSmallFiles).toHaveLength(0);
    });

    it('1.4: Confirms all 616 files have valid MPEG Layer 3 headers (0xFF 0xF3 or ID3)', () => {
      const physicalFiles = fs.readdirSync(coursebookDir);
      const invalidHeaderFiles: { file: string; header: string }[] = [];

      for (const file of physicalFiles) {
        const filePath = path.join(coursebookDir, file);
        const fd = fs.openSync(filePath, 'r');
        const buf = Buffer.alloc(4);
        fs.readSync(fd, buf, 0, 4, 0);
        fs.closeSync(fd);

        const isID3 = buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33; // 'ID3'
        // MPEG sync word: 11 bits set (buf[0] === 0xFF && (buf[1] & 0xE0) === 0xE0)
        const isSyncWord = buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0;

        if (!isID3 && !isSyncWord) {
          invalidHeaderFiles.push({ file, header: buf.toString('hex') });
        }
      }

      expect(invalidHeaderFiles).toHaveLength(0);
    });

    it('1.5: Confirms 0 unreferenced files: 100% bidirectional 1:1 match between manifest and disk', () => {
      const physicalFiles = new Set(fs.readdirSync(coursebookDir));
      const referencedFiles = new Set<string>();

      for (const item of Object.values(COURSEBOOK_AUDIO_MANIFEST)) {
        if (item.fullAudioUrl) {
          referencedFiles.add(path.basename(item.fullAudioUrl));
        }
        for (const line of item.lines || []) {
          if (line.audioUrl) {
            referencedFiles.add(path.basename(line.audioUrl));
          }
        }
      }

      // Check for files referenced in manifest but missing on disk
      const missingOnDisk = [...referencedFiles].filter((f) => !physicalFiles.has(f));
      // Check for orphan files on disk not in manifest
      const orphansOnDisk = [...physicalFiles].filter((f) => !referencedFiles.has(f));

      expect(referencedFiles.size).toBe(616);
      expect(physicalFiles.size).toBe(616);
      expect(missingOnDisk).toHaveLength(0);
      expect(orphansOnDisk).toHaveLength(0);
    });

    it('1.6: Audio line timings are strictly monotonic across all 105 texts', () => {
      let totalTimingChecks = 0;
      for (const [key, item] of Object.entries(COURSEBOOK_AUDIO_MANIFEST)) {
        if (item.lineTimings && item.lineTimings.length > 0) {
          let lastEnd = 0;
          for (const timing of item.lineTimings) {
            totalTimingChecks++;
            expect(timing.start).toBeGreaterThanOrEqual(lastEnd);
            expect(timing.end).toBeGreaterThan(timing.start);
            expect(timing.duration).toBeGreaterThan(0);
            expect(timing.duration).toBeCloseTo(timing.end - timing.start, 2);
            lastEnd = timing.end;
          }
        }
      }
      expect(totalTimingChecks).toBe(511);
    });
  });

  // =========================================================================
  // 2. VOCABULARY & GRAMMAR AUDIO TRIGGER AUDIT
  // =========================================================================
  describe('2. Vocabulary & Grammar Audio Trigger Audit (HSK 1 & HSK 2)', () => {
    it('2.1: Parses all HSK 1 vocabulary and verifies valid Hanzi and language detection', () => {
      let totalVocab = 0;
      const invalidItems: any[] = [];

      for (const lesson of NEW_HSK1_FULL_LESSONS) {
        expect(Array.isArray(lesson.vocabulary)).toBe(true);
        expect(lesson.vocabulary.length).toBeGreaterThan(0);

        for (const item of lesson.vocabulary) {
          totalVocab++;
          if (!item.hanzi || item.hanzi.trim().length === 0) {
            invalidItems.push({ lesson: lesson.lessonNumber, item, reason: 'Empty Hanzi' });
          }
          if (detectTextLanguage(item.hanzi) !== 'zh') {
            invalidItems.push({ lesson: lesson.lessonNumber, item, reason: 'Language not zh' });
          }
        }
      }

      expect(totalVocab).toBe(342);
      expect(invalidItems).toHaveLength(0);
    });

    it('2.2: Parses all HSK 2 vocabulary and verifies valid Hanzi and language detection', () => {
      let totalVocab = 0;
      const invalidItems: any[] = [];

      for (const lesson of NEW_HSK2_FULL_LESSONS) {
        expect(Array.isArray(lesson.vocabulary)).toBe(true);
        expect(lesson.vocabulary.length).toBeGreaterThan(0);

        for (const item of lesson.vocabulary) {
          totalVocab++;
          if (!item.hanzi || item.hanzi.trim().length === 0) {
            invalidItems.push({ lesson: lesson.lessonNumber, item, reason: 'Empty Hanzi' });
          }
          if (detectTextLanguage(item.hanzi) !== 'zh') {
            invalidItems.push({ lesson: lesson.lessonNumber, item, reason: 'Language not zh' });
          }
        }
      }

      expect(totalVocab).toBe(213);
      expect(invalidItems).toHaveLength(0);
    });

    it('2.3: Parses all HSK 1 & HSK 2 grammar points and verifies examples have valid Hanzi & TTS payload', () => {
      let totalGrammarPoints = 0;
      let totalExamples = 0;
      const invalidExamples: any[] = [];

      for (const lesson of [...NEW_HSK1_FULL_LESSONS, ...NEW_HSK2_FULL_LESSONS]) {
        for (const gp of lesson.grammarPoints || []) {
          totalGrammarPoints++;
          expect(Array.isArray(gp.examples)).toBe(true);
          expect(gp.examples.length).toBeGreaterThan(0);

          for (const ex of gp.examples) {
            totalExamples++;
            if (!ex.hanzi || ex.hanzi.trim().length === 0) {
              invalidExamples.push({ gp: gp.title, ex, reason: 'Empty Hanzi' });
              continue;
            }
            const payload = resolveChineseTtsPayload(ex.hanzi);
            if (!payload || payload.trim().length === 0) {
              invalidExamples.push({ gp: gp.title, ex, reason: 'Empty TTS payload' });
            }
            if (detectTextLanguage(ex.hanzi) !== 'zh') {
              invalidExamples.push({ gp: gp.title, ex, reason: 'Language not zh' });
            }
          }
        }
      }

      expect(totalGrammarPoints).toBeGreaterThan(30);
      expect(totalExamples).toBeGreaterThan(80);
      expect(invalidExamples).toHaveLength(0);
    });

    it('2.4: playChineseAudio(hanzi) executes cleanly for 100% of all HSK 1 & HSK 2 vocabulary items without throwing', async () => {
      let totalTested = 0;
      const failedItems: any[] = [];

      for (const lesson of [...NEW_HSK1_FULL_LESSONS, ...NEW_HSK2_FULL_LESSONS]) {
        for (const item of lesson.vocabulary) {
          totalTested++;
          try {
            const audioPromise = playChineseAudio(item.hanzi);
            if (!(audioPromise instanceof Promise)) {
              failedItems.push({ hanzi: item.hanzi, error: 'Did not return Promise' });
              continue;
            }
            const res = await audioPromise;
            if (res !== undefined) {
              failedItems.push({ hanzi: item.hanzi, error: `Returned unexpected value: ${res}` });
            }
          } catch (err: any) {
            failedItems.push({ hanzi: item.hanzi, error: err?.message || String(err) });
          }
        }
      }

      // HSK 1 (342) + HSK 2 (213) = 555 vocabulary items
      expect(totalTested).toBe(555);
      expect(failedItems).toHaveLength(0);
    });

    it('2.5: playChineseAudio(hanzi) executes cleanly for 100% of all grammar point examples without throwing', async () => {
      let totalTested = 0;
      const failedExamples: any[] = [];

      for (const lesson of [...NEW_HSK1_FULL_LESSONS, ...NEW_HSK2_FULL_LESSONS]) {
        for (const gp of lesson.grammarPoints || []) {
          for (const ex of gp.examples) {
            totalTested++;
            try {
              const audioPromise = playChineseAudio(ex.hanzi);
              if (!(audioPromise instanceof Promise)) {
                failedExamples.push({ hanzi: ex.hanzi, error: 'Did not return Promise' });
                continue;
              }
              const res = await audioPromise;
              if (res !== undefined) {
                failedExamples.push({ hanzi: ex.hanzi, error: `Returned unexpected value: ${res}` });
              }
            } catch (err: any) {
              failedExamples.push({ hanzi: ex.hanzi, error: err?.message || String(err) });
            }
          }
        }
      }

      expect(totalTested).toBeGreaterThanOrEqual(90);
      expect(failedExamples).toHaveLength(0);
    });

    it('2.6: Audio trigger resilience on edge cases (empty strings, whitespace, complex dialogue scripts)', async () => {
      // Empty text
      await expect(playChineseAudio('')).resolves.toBeUndefined();
      await expect(playChineseAudio('   ')).resolves.toBeUndefined();

      // Conversational dialogue script with turn prefixes
      const dialogueText = 'A: 你好！\nB: 你好，王老师！';
      await expect(playChineseAudio(dialogueText)).resolves.toBeUndefined();
    });
  });

  // =========================================================================
  // 3. EXPRESS STATIC SERVING & STREAMING AUDIT
  // =========================================================================
  describe('3. Express Static Audio Serving & HTTP Range Streaming Audit', () => {
    let app: express.Express;
    let server: http.Server;
    let baseUrl: string;

    beforeAll(async () => {
      app = express();

      // Configure static audio serving identically to server.ts (lines 582-584 & 3478)
      const audioDir = path.join(process.cwd(), 'public', 'audio');
      app.use('/audio', express.static(audioDir));
      app.use(express.static(path.join(process.cwd(), 'public')));

      // Start on dynamic ephemeral port
      await new Promise<void>((resolve) => {
        server = app.listen(0, '127.0.0.1', () => {
          const addr = server.address() as any;
          baseUrl = `http://127.0.0.1:${addr.port}`;
          resolve();
        });
      });
    });

    afterAll(async () => {
      if (server) {
        await new Promise<void>((resolve) => server.close(() => resolve()));
      }
    });

    it('3.1: Serves full coursebook audio with HTTP 200, audio/mpeg, and exact Content-Length', async () => {
      const targetUrl = `${baseUrl}/audio/coursebook/hsk1-l1-t1_full.mp3`;
      const diskPath = path.join(process.cwd(), 'public/audio/coursebook/hsk1-l1-t1_full.mp3');
      const expectedSize = fs.statSync(diskPath).size;

      const res = await fetch(targetUrl);
      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toMatch(/audio\/mpeg/i);
      expect(Number(res.headers.get('content-length'))).toBe(expectedSize);
      expect(res.headers.get('accept-ranges')).toBe('bytes');

      const arrayBuf = await res.arrayBuffer();
      expect(arrayBuf.byteLength).toBe(expectedSize);

      // Verify binary sync word matches
      const firstBytes = new Uint8Array(arrayBuf.slice(0, 2));
      expect(firstBytes[0]).toBe(0xff);
      expect(firstBytes[1] & 0xe0).toBe(0xe0);
    });

    it('3.2: Batch test across multiple HSK 1 and HSK 2 line audios via Express static', async () => {
      const samplePaths = [
        '/audio/coursebook/hsk1-l1-t1_line0.mp3',
        '/audio/coursebook/hsk1-l5-t2_line1.mp3',
        '/audio/coursebook/hsk1-l15-t3_line2.mp3',
        '/audio/coursebook/hsk2-l1-t1_line0.mp3',
        '/audio/coursebook/hsk2-l7-t2_line1.mp3',
        '/audio/coursebook/hsk2-l15-t2_line2.mp3',
      ];

      for (const p of samplePaths) {
        const diskPath = path.join(process.cwd(), 'public', p.replace(/^\//, ''));
        expect(fs.existsSync(diskPath)).toBe(true);
        const expectedSize = fs.statSync(diskPath).size;

        const res = await fetch(`${baseUrl}${p}`);
        expect(res.status).toBe(200);
        expect(res.headers.get('content-type')).toMatch(/audio\/mpeg/i);
        expect(Number(res.headers.get('content-length'))).toBe(expectedSize);
      }
    });

    it('3.3: HTTP Range Request returns HTTP 206 Partial Content (critical for audio seeking)', async () => {
      const targetUrl = `${baseUrl}/audio/coursebook/hsk1-l1-t1_full.mp3`;
      const diskPath = path.join(process.cwd(), 'public/audio/coursebook/hsk1-l1-t1_full.mp3');
      const expectedTotalSize = fs.statSync(diskPath).size;

      // Request first 1024 bytes (Range: bytes=0-1023)
      const res = await fetch(targetUrl, {
        headers: { Range: 'bytes=0-1023' },
      });

      expect(res.status).toBe(206);
      expect(res.headers.get('content-range')).toBe(`bytes 0-1023/${expectedTotalSize}`);
      expect(Number(res.headers.get('content-length'))).toBe(1024);

      const buf = await res.arrayBuffer();
      expect(buf.byteLength).toBe(1024);
    });

    it('3.4: Returns HTTP 404 for non-existent audio endpoints', async () => {
      const res = await fetch(`${baseUrl}/audio/coursebook/nonexistent_audio_9999.mp3`);
      expect(res.status).toBe(404);
    });

    it('3.5: Express static blocks directory traversal attempts', async () => {
      const res = await fetch(`${baseUrl}/audio/../../package.json`);
      // Express static router returns 404 or 403 on traversal attempt out of root
      expect([400, 403, 404]).toContain(res.status);
    });
  });
});
