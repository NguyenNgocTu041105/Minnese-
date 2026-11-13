/**
 * Challenger Adversarial Stress Test Suite:
 * 1. Listening TTS Generation & Voice Selection (Milestone 1 - R1)
 *    - Endpoints: POST /api/qbank/tts/generate, GET /api/qbank/tts/voices
 *    - Audio streaming & HTTP 206 Partial Content Range handling
 *    - Edge cases: Empty scripts, massive scripts (>5000 chars), unusual voice names, SQL/Path/Command injection
 * 2. Drag-and-Drop Question & Option Reordering (Milestone 2 - R2)
 *    - Functions: reorderOptions, reorderArray
 *    - Stress: 100 consecutive random-walk permutation chains (20 swaps each) on 4-opt and 6-opt questions
 *    - Invariant: nextOptions[nextAnswerIdx] === originalCorrectContent under ALL permutations
 *    - Boundaries: 1-item, 2-item, 3-item, 6-item arrays, identical strings, out-of-bound indices
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { DatabaseSync } from 'node:sqlite';
import {
  qbankRouter,
  setQBankAdminTokenForTesting,
  setDbSyncForTesting,
  ensurePendingSchema,
} from '../src/server/qbankRoutes.js';
import {
  reorderArray,
  reorderOptions,
  formatSequenceNumber,
} from '../src/components/QBankAdmin.js';

describe('CHALLENGER EMPIRICAL VERIFICATION: TTS & DnD Stress Suite', () => {
  // =========================================================================
  // SECTION 1: DRAG-AND-DROP OPTION REORDERING & INVARIANT PRESERVATION (R2)
  // =========================================================================
  describe('R2 DnD Option Reordering: Mathematical Invariant & Permutation Stress', () => {
    describe('1. Complex Permutation Chains (Random Walks)', () => {
      it('preserves answer_idx invariant across 100 random walks of 20 swaps on 4-option MCQs', () => {
        const baseOptions = ['A. Bắc Kinh', 'B. Thượng Hải', 'C. Quảng Châu', 'D. Thâm Quyến'];

        // Test each possible initial answer position (0, 1, 2, 3)
        for (let initialAnswerIdx = 0; initialAnswerIdx < 4; initialAnswerIdx++) {
          const expectedContent = baseOptions[initialAnswerIdx];

          // 25 random walks per initial position = 100 total walks
          for (let walk = 0; walk < 25; walk++) {
            let currentOptions = [...baseOptions];
            let currentAnswerIdx = initialAnswerIdx;

            // 20 consecutive random swaps in this walk
            for (let step = 0; step < 20; step++) {
              // Generate pseudo-random distinct source and dest indices
              const src = (step * 7 + walk * 3 + initialAnswerIdx) % 4;
              const dst = (step * 11 + walk * 5 + 1) % 4;

              const res = reorderOptions(currentOptions, currentAnswerIdx, src, dst);
              currentOptions = res.options;
              currentAnswerIdx = res.answer_idx;

              // STRICTURE: Invariant must hold at every intermediate step
              expect(currentOptions.length).toBe(4);
              expect(currentAnswerIdx).toBeGreaterThanOrEqual(0);
              expect(currentAnswerIdx).toBeLessThan(4);
              expect(currentOptions[currentAnswerIdx]).toBe(expectedContent);
            }
          }
        }
      });

      it('preserves answer_idx invariant across 60 random walks of 20 swaps on 6-option matching questions', () => {
        const baseOptions = [
          'A. 医生在医院看病',
          'B. 老师在学校上课',
          'C. 司机在开车送人',
          'D. 售货员在商店卖东西',
          'E. 厨师在厨房做饭',
          'F. 警察在马路上执勤',
        ];

        // 10 walks for each of the 6 initial answer indices = 60 total walks (1200 transitions)
        for (let initialAnswerIdx = 0; initialAnswerIdx < 6; initialAnswerIdx++) {
          const expectedContent = baseOptions[initialAnswerIdx];

          for (let walk = 0; walk < 10; walk++) {
            let currentOptions = [...baseOptions];
            let currentAnswerIdx = initialAnswerIdx;

            for (let step = 0; step < 20; step++) {
              const src = (step * 13 + walk * 7 + initialAnswerIdx) % 6;
              const dst = (step * 17 + walk * 11 + 2) % 6;

              const res = reorderOptions(currentOptions, currentAnswerIdx, src, dst);
              currentOptions = res.options;
              currentAnswerIdx = res.answer_idx;

              expect(currentOptions.length).toBe(6);
              expect(currentAnswerIdx).toBeGreaterThanOrEqual(0);
              expect(currentAnswerIdx).toBeLessThan(6);
              expect(currentOptions[currentAnswerIdx]).toBe(expectedContent);
            }
          }
        }
      });
    });

    describe('2. Exhaustive Permutation Transitions (2-opt, 3-opt, 6-opt)', () => {
      it('satisfies invariant across all 8 permutations of 2-option True/False questions', () => {
        const tf = ['对 (Đúng)', '错 (Sai)'];
        for (let ans = 0; ans < 2; ans++) {
          const expected = tf[ans];
          for (let s = 0; s < 2; s++) {
            for (let d = 0; d < 2; d++) {
              const res = reorderOptions(tf, ans, s, d);
              expect(res.options.length).toBe(2);
              expect(res.options[res.answer_idx]).toBe(expected);
            }
          }
        }
      });

      it('satisfies invariant across all 27 permutations of 3-option listening questions', () => {
        const opts3 = ['苹果', '香蕉', '西瓜'];
        for (let ans = 0; ans < 3; ans++) {
          const expected = opts3[ans];
          for (let s = 0; s < 3; s++) {
            for (let d = 0; d < 3; d++) {
              const res = reorderOptions(opts3, ans, s, d);
              expect(res.options.length).toBe(3);
              expect(res.options[res.answer_idx]).toBe(expected);
            }
          }
        }
      });

      it('satisfies invariant across all 216 single transitions of 6-option matching questions', () => {
        const opts6 = ['一', '二', '三', '四', '五', '六'];
        for (let ans = 0; ans < 6; ans++) {
          const expected = opts6[ans];
          for (let s = 0; s < 6; s++) {
            for (let d = 0; d < 6; d++) {
              const res = reorderOptions(opts6, ans, s, d);
              expect(res.options.length).toBe(6);
              expect(res.options[res.answer_idx]).toBe(expected);
            }
          }
        }
      });
    });

    describe('3. Identical Strings & Duplicate Options Resilience', () => {
      it('correctly tracks specific option slot when all options are identical strings', () => {
        const identical = ['Phương án giống nhau', 'Phương án giống nhau', 'Phương án giống nhau', 'Phương án giống nhau'];

        // Initial correct answer is slot 2
        // Moving slot 2 to slot 0 must update answer_idx to 0 (NOT remaining at slot 2)
        const res1 = reorderOptions(identical, 2, 2, 0);
        expect(res1.answer_idx).toBe(0);

        // Moving slot 3 to slot 1: slot 0 is unaffected and remains 0
        const res2 = reorderOptions(res1.options, res1.answer_idx, 3, 1);
        expect(res2.answer_idx).toBe(0);

        // Moving slot 0 to slot 3: answer shifts from 0 to 3
        const res3 = reorderOptions(res2.options, res2.answer_idx, 0, 3);
        expect(res3.answer_idx).toBe(3);
      });

      it('correctly tracks specific slot when duplicate options are adjacent or dispersed', () => {
        // Two 'A' options: slot 0 and slot 2. Correct answer is slot 2.
        const dupes = ['Option Duplicate', 'Option Beta', 'Option Duplicate', 'Option Delta'];
        const initialAns = 2; // the SECOND 'Option Duplicate'

        // Move slot 2 to slot 3. Array becomes: [Beta, Duplicate(slot 0), Delta, Duplicate(slot 2)]
        const res = reorderOptions(dupes, initialAns, 2, 3);
        expect(res.answer_idx).toBe(3);

        // Move slot 0 to slot 1: slot 3 is unaffected
        const res2 = reorderOptions(res.options, res.answer_idx, 0, 1);
        expect(res2.answer_idx).toBe(3);
      });
    });

    describe('4. Array Boundary Sizes & Graceful Edge Case Rejections', () => {
      it('handles empty options array gracefully without crash', () => {
        const res = reorderOptions([], 0, 0, 0);
        expect(res.options).toEqual([]);
        expect(res.answer_idx).toBe(0);
      });

      it('handles single-item array gracefully without mutation', () => {
        const res = reorderOptions(['Độc nhất'], 0, 0, 0);
        expect(res.options).toEqual(['Độc nhất']);
        expect(res.answer_idx).toBe(0);
      });

      it('handles negative out-of-bounds sourceIdx and destIdx gracefully', () => {
        const opts = ['A', 'B', 'C', 'D'];
        expect(reorderOptions(opts, 1, -1, 2).options).toEqual(opts);
        expect(reorderOptions(opts, 1, 0, -5).options).toEqual(opts);
        expect(reorderOptions(opts, 1, -1, -2).answer_idx).toBe(1);
      });

      it('handles excessive out-of-bounds sourceIdx and destIdx gracefully', () => {
        const opts = ['A', 'B', 'C', 'D'];
        expect(reorderOptions(opts, 2, 10, 1).options).toEqual(opts);
        expect(reorderOptions(opts, 2, 0, 99).options).toEqual(opts);
        expect(reorderOptions(opts, 2, 100, 200).answer_idx).toBe(2);
      });

      it('handles non-array inputs gracefully without throwing uncaught exceptions', () => {
        const resNull = reorderOptions(null as any, 0, 0, 1);
        expect(resNull.options).toEqual([]);
        expect(resNull.answer_idx).toBe(0);

        const resUndefined = reorderOptions(undefined as any, 1, 0, 1);
        expect(resUndefined.options).toEqual([]);
        expect(resUndefined.answer_idx).toBe(1);

        const resObj = reorderOptions({ not: 'an array' } as any, 0, 0, 1);
        expect(resObj.options).toEqual([]);
      });
    });

    describe('5. reorderArray Question Objects Integrity', () => {
      it('reorders question objects preserving exact references, statuses, and properties', () => {
        const qList = [
          { id: 'q-1', stem: 'Câu 1', status: 'pending', gates: { pass: true } },
          { id: 'q-2', stem: 'Câu 2', status: 'approved', gates: { pass: true } },
          { id: 'q-3', stem: 'Câu 3', status: 'rejected', gates: { pass: false } },
        ];

        const reordered = reorderArray(qList, 0, 2);
        expect(reordered.map((q) => q.id)).toEqual(['q-2', 'q-3', 'q-1']);
        expect(reordered[0]).toBe(qList[1]);
        expect(reordered[1]).toBe(qList[2]);
        expect(reordered[2]).toBe(qList[0]);
      });
    });
  });

  // =========================================================================
  // SECTION 2: RESTFUL TTS GENERATION & VOICE SELECTION ENDPOINTS (R1)
  // =========================================================================
  describe('R1 Listening TTS: RESTful API & Voice Selection Adversarial Testing', () => {
    let app: express.Express;
    let server: http.Server;
    let baseUrl: string;
    let testDb: DatabaseSync;
    const TEST_TOKEN = 'challenger-adversarial-tts-token-secret-123456';
    const createdAudioFiles: string[] = [];
    const insertedQIds: string[] = [];

    beforeAll(async () => {
      testDb = new DatabaseSync(':memory:');
      ensurePendingSchema(testDb);
      setDbSyncForTesting(testDb);
      setQBankAdminTokenForTesting(TEST_TOKEN);

      const audioDir = path.join(process.cwd(), 'public', 'audio');
      fs.mkdirSync(audioDir, { recursive: true });

      app = express();
      app.use(express.json({ limit: '50mb' }));
      app.use('/audio', express.static(audioDir));
      app.use('/api/qbank', qbankRouter);

      await new Promise<void>((resolve) => {
        server = app.listen(0, '127.0.0.1', () => {
          const addr = server.address() as any;
          baseUrl = `http://127.0.0.1:${addr.port}`;
          resolve();
        });
      });

      // Insert a known candidate question into in-memory DB for valid synthesis tests
      const validQId = 'q_valid_tts_challenger';
      testDb.prepare(`
        INSERT INTO pending_questions (
          id, stem, options, answer_idx, pinyin, explanation_vi, level, skill, part_type, status, content_hash
        ) VALUES (
          ?, '男：你好。女：你好。问：他们在说什么？', '["A","B"]', 0, 'pin', 'exp', 1, 'listening', 'listen_dialogue_3opt', 'pending', 'hash_test_1'
        )
      `).run(validQId);
      insertedQIds.push(validQId);
    });

    afterAll(async () => {
      setQBankAdminTokenForTesting(null);
      setDbSyncForTesting(null);
      if (testDb) {
        try {
          testDb.close();
        } catch {}
      }
      if (server) {
        await new Promise<void>((resolve) => server.close(() => resolve()));
      }
      for (const f of createdAudioFiles) {
        try {
          if (fs.existsSync(f)) fs.unlinkSync(f);
        } catch {}
      }
    });

    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TEST_TOKEN}`,
    };

    describe('1. Route Aliasing & Input Validation on /api/qbank/tts/generate', () => {
      it('rejects empty script with 400 on RESTful endpoint /api/qbank/tts/generate', async () => {
        const res = await fetch(`${baseUrl}/api/qbank/tts/generate`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            question_id: 'q_valid_tts_challenger',
            audio_script: '',
          }),
        });
        expect(res.status).toBe(400);
        const data = (await res.json()) as any;
        expect(data.success).toBe(false);
        expect(data.error).toContain('không được để trống');
      });

      it('rejects whitespace-only script with 400', async () => {
        const res = await fetch(`${baseUrl}/api/qbank/tts/generate`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            question_id: 'q_valid_tts_challenger',
            audio_script: '   \n\t   ',
          }),
        });
        expect(res.status).toBe(400);
        const data = (await res.json()) as any;
        expect(data.success).toBe(false);
        expect(data.error).toContain('không được để trống');
      });

      it('rejects non-string audio_script types with 400', async () => {
        for (const badScript of [12345, true, { text: 'script' }, ['script']]) {
          const res = await fetch(`${baseUrl}/api/qbank/tts/generate`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
              question_id: 'q_valid_tts_challenger',
              audio_script: badScript,
            }),
          });
          expect(res.status).toBe(400);
          const data = (await res.json()) as any;
          expect(data.success).toBe(false);
        }
      });

      it('rejects scripts exceeding 5000 characters with 400 (5001 chars boundary)', async () => {
        const script5001 = '字'.repeat(5001);
        const res = await fetch(`${baseUrl}/api/qbank/tts/generate`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            question_id: 'q_valid_tts_challenger',
            audio_script: script5001,
          }),
        });
        expect(res.status).toBe(400);
        const data = (await res.json()) as any;
        expect(data.success).toBe(false);
        expect(data.error).toContain('5000');
      });

      it('rejects missing or empty question_id with 400', async () => {
        const res = await fetch(`${baseUrl}/api/qbank/tts/generate`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            question_id: '   ',
            audio_script: '你好。',
          }),
        });
        expect(res.status).toBe(400);
        const data = (await res.json()) as any;
        expect(data.success).toBe(false);
        expect(data.error).toContain('question_id');
      });

      it('returns 404 for nonexistent question_id', async () => {
        const res = await fetch(`${baseUrl}/api/qbank/tts/generate`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            question_id: 'nonexistent_q_99999',
            audio_script: '你好。',
          }),
        });
        expect(res.status).toBe(404);
        const data = (await res.json()) as any;
        expect(data.success).toBe(false);
      });
    });

    describe('2. Unusual & Adversarial Voice Names Validation', () => {
      it('rejects voice names with command injection characters with 400', async () => {
        const maliciousVoices = [
          'voice; rm -rf /',
          'voice && dir',
          'voice | whoami',
          '`calc`',
          '$(whoami)',
          'zh-CN\0nullbyte',
          '<script>alert(1)</script>',
          '../../etc/passwd',
        ];

        for (const badVoice of maliciousVoices) {
          const res = await fetch(`${baseUrl}/api/qbank/tts/generate`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
              question_id: 'q_valid_tts_challenger',
              audio_script: '安全测试。',
              voice: badVoice,
            }),
          });
          expect(res.status).toBe(400);
          const data = (await res.json()) as any;
          expect(data.success).toBe(false);
          expect(data.error).toContain('voice');
        }
      });

      it('rejects voice names exceeding 64 characters with 400', async () => {
        const longVoice = 'zh-CN-' + 'x'.repeat(65);
        const res = await fetch(`${baseUrl}/api/qbank/tts/generate`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            question_id: 'q_valid_tts_challenger',
            audio_script: '长语音名称测试。',
            voice: longVoice,
          }),
        });
        expect(res.status).toBe(400);
        const data = (await res.json()) as any;
        expect(data.success).toBe(false);
      });

      it('rejects invalid voice_male and voice_female parameters with 400', async () => {
        const resMale = await fetch(`${baseUrl}/api/qbank/tts/generate`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            question_id: 'q_valid_tts_challenger',
            audio_script: '测试。',
            voice_male: 'male; injection',
          }),
        });
        expect(resMale.status).toBe(400);

        const resFemale = await fetch(`${baseUrl}/api/qbank/tts/generate`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            question_id: 'q_valid_tts_challenger',
            audio_script: '测试。',
            voice_female: 'female && calc',
          }),
        });
        expect(resFemale.status).toBe(400);
      });
    });

    describe('3. Voice Catalog Endpoint /api/qbank/tts/voices', () => {
      it('returns catalog of 9 voices and 4 dialogue pairs on GET /api/qbank/tts/voices', async () => {
        const res = await fetch(`${baseUrl}/api/qbank/tts/voices`, {
          method: 'GET',
          headers: authHeaders,
        });
        expect(res.status).toBe(200);
        const data = (await res.json()) as any;
        expect(data.success).toBe(true);
        expect(Array.isArray(data.voices)).toBe(true);
        expect(data.voices.length).toBe(9);
        expect(data.voices.some((v: any) => v.id === 'auto')).toBe(true);
        expect(data.voices.some((v: any) => v.id === 'zh-CN-XiaoxiaoNeural')).toBe(true);
        expect(data.voices.some((v: any) => v.id === 'zh-CN-YunxiNeural')).toBe(true);
        expect(Array.isArray(data.dialogue_pairs)).toBe(true);
        expect(data.dialogue_pairs.length).toBe(4);
      });

      it('returns 200 on alias route GET /api/qbank/tts-voices', async () => {
        const res = await fetch(`${baseUrl}/api/qbank/tts-voices`, {
          method: 'GET',
          headers: authHeaders,
        });
        expect(res.status).toBe(200);
        const data = (await res.json()) as any;
        expect(data.success).toBe(true);
        expect(data.voices.length).toBe(9);
      });
    });

    describe('4. Express /audio HTTP 206 Partial Content Range Requests & Traversal Defenses', () => {
      let testAudioFile: string;
      let testAudioPath: string;

      beforeAll(() => {
        testAudioFile = `challenger_range_fixture_${Date.now()}.mp3`;
        testAudioPath = path.join(process.cwd(), 'public', 'audio', testAudioFile);
        // Create a 2048-byte synthetic audio fixture
        const buf = Buffer.alloc(2048, 0xaa);
        buf[0] = 0xff;
        buf[1] = 0xfb;
        fs.writeFileSync(testAudioPath, buf);
        createdAudioFiles.push(testAudioPath);
      });

      it('serves HTTP 206 Partial Content for byte range request (bytes=0-511)', async () => {
        const res = await fetch(`${baseUrl}/audio/${testAudioFile}`, {
          headers: { Range: 'bytes=0-511' },
        });
        expect(res.status).toBe(206);
        expect(res.headers.get('content-range')).toContain('bytes 0-511/2048');
        const ab = await res.arrayBuffer();
        expect(ab.byteLength).toBe(512);
      });

      it('serves HTTP 206 for open-ended range request (bytes=1024-)', async () => {
        const res = await fetch(`${baseUrl}/audio/${testAudioFile}`, {
          headers: { Range: 'bytes=1024-' },
        });
        expect(res.status).toBe(206);
        expect(res.headers.get('content-range')).toContain('bytes 1024-2047/2048');
        const ab = await res.arrayBuffer();
        expect(ab.byteLength).toBe(1024);
      });

      it('serves HTTP 206 for suffix range request (bytes=-256)', async () => {
        const res = await fetch(`${baseUrl}/audio/${testAudioFile}`, {
          headers: { Range: 'bytes=-256' },
        });
        expect(res.status).toBe(206);
        expect(res.headers.get('content-range')).toContain('bytes 1792-2047/2048');
        const ab = await res.arrayBuffer();
        expect(ab.byteLength).toBe(256);
      });

      it('returns HTTP 416 Range Not Satisfiable for out-of-bounds ranges', async () => {
        const res = await fetch(`${baseUrl}/audio/${testAudioFile}`, {
          headers: { Range: 'bytes=50000-60000' },
        });
        expect(res.status).toBe(416);
      });

      it('blocks directory traversal attempts on /audio/', async () => {
        for (const badPath of ['/audio/../../package.json', '/audio/..%2f..%2fpackage.json']) {
          const res = await fetch(`${baseUrl}${badPath}`);
          expect([400, 403, 404]).toContain(res.status);
        }
      });
    });
  });
});
