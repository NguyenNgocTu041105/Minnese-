/**
 * Adversarial Stress Test Suite: Edge-TTS Audio Generation & Static Serving
 * Target Endpoints:
 *   - POST /api/qbank/tts-generate
 *   - GET /audio/{filename}.mp3
 *
 * Verifies:
 * 1. Nonexistent question_id returns HTTP 404 with appropriate error message.
 * 2. Missing, empty, or whitespace-only audio_script returns HTTP 400.
 * 3. Non-string audio_script types return HTTP 400.
 * 4. Length limits (> 5000 characters) return HTTP 400 with boundary precision.
 * 5. Malformed/injection question_id (SQL injection, path traversal, shell injection, null bytes)
 *    handled safely without server crash or database corruption.
 * 6. Admin token authentication and security invariants (missing/invalid tokens rejected).
 * 7. Static GET /audio/{filename}.mp3 returns 200 with audio/mpeg content type for existing files.
 * 8. Static GET for nonexistent audio returns 404; path traversal on /audio prevented.
 * 9. Audio streaming range requests (HTTP 206) supported for media players.
 * 10. Database safety invariant: data/hsk_exam.db hash strictly preserved.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import {
  qbankRouter,
  setQBankAdminTokenForTesting,
  getDbSync,
  ensurePendingSchema,
} from '../src/server/qbankRoutes.js';

describe('Adversarial Challenge: POST /api/qbank/tts-generate & Express /audio Static Serving', () => {
  let app: express.Express;
  let server: http.Server;
  let baseUrl: string;
  const TEST_ADMIN_TOKEN = 'adversarial-tts-challenge-token-safe-random-64hex';
  const createdTestFiles: string[] = [];
  const insertedQuestionIds: string[] = [];

  beforeAll(async () => {
    setQBankAdminTokenForTesting(TEST_ADMIN_TOKEN);

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

    // Ensure schema has audio_url column
    const db = getDbSync();
    ensurePendingSchema(db);
  });

  afterAll(async () => {
    setQBankAdminTokenForTesting(null);
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }

    // Clean up created audio files
    for (const file of createdTestFiles) {
      try {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      } catch {}
    }

    // Clean up inserted test questions
    try {
      const db = getDbSync();
      for (const qid of insertedQuestionIds) {
        db.prepare('DELETE FROM pending_questions WHERE id = ?').run(qid);
      }
    } catch {}
  });

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${TEST_ADMIN_TOKEN}`,
  };

  // =========================================================================
  // 1. Authentication & Security Enforcement
  // =========================================================================
  describe('1. Authentication & Security Enforcement', () => {
    it('rejects unauthenticated requests with HTTP 403 / 401', async () => {
      const res = await fetch(`${baseUrl}/api/qbank/tts-generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: 'test_no_auth',
          audio_script: '你好',
        }),
      });

      expect([401, 403]).toContain(res.status);
      const data = (await res.json()) as any;
      expect(data.success).toBe(false);
    });

    it('rejects requests with invalid admin token', async () => {
      const res = await fetch(`${baseUrl}/api/qbank/tts-generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer invalid-token-12345',
        },
        body: JSON.stringify({
          question_id: 'test_invalid_token',
          audio_script: '你好',
        }),
      });

      expect([401, 403]).toContain(res.status);
      const data = (await res.json()) as any;
      expect(data.success).toBe(false);
    });

    it('rejects compromised historical token "admin123456"', async () => {
      const res = await fetch(`${baseUrl}/api/qbank/tts-generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer admin123456',
        },
        body: JSON.stringify({
          question_id: 'test_compromised_token',
          audio_script: '你好',
        }),
      });

      expect([401, 403]).toContain(res.status);
      const data = (await res.json()) as any;
      expect(data.success).toBe(false);
    });
  });

  // =========================================================================
  // 2. Adversarial question_id Validation & Injection Stress
  // =========================================================================
  describe('2. Adversarial question_id Validation & Injection Stress', () => {
    it('returns 400 when question_id is omitted', async () => {
      const res = await fetch(`${baseUrl}/api/qbank/tts-generate`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          audio_script: '明天下午两点在办公室开会。',
        }),
      });

      expect(res.status).toBe(400);
      const data = (await res.json()) as any;
      expect(data.success).toBe(false);
      expect(data.error).toContain('question_id');
    });

    it('returns 400 when question_id is an empty string', async () => {
      const res = await fetch(`${baseUrl}/api/qbank/tts-generate`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          question_id: '',
          audio_script: '明天下午两点在办公室开会。',
        }),
      });

      expect(res.status).toBe(400);
      const data = (await res.json()) as any;
      expect(data.success).toBe(false);
      expect(data.error).toContain('question_id');
    });

    it('returns 400 when question_id is whitespace only', async () => {
      const res = await fetch(`${baseUrl}/api/qbank/tts-generate`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          question_id: '   \t\n   ',
          audio_script: '明天下午两点在办公室开会。',
        }),
      });

      expect(res.status).toBe(400);
      const data = (await res.json()) as any;
      expect(data.success).toBe(false);
      expect(data.error).toContain('question_id');
    });

    it('returns 404 when question_id does not exist in pending_questions', async () => {
      const nonexistentId = `nonexistent_question_${Date.now()}_xyz`;
      const res = await fetch(`${baseUrl}/api/qbank/tts-generate`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          question_id: nonexistentId,
          audio_script: '明天下午两点在办公室开会。',
        }),
      });

      expect(res.status).toBe(404);
      const data = (await res.json()) as any;
      expect(data.success).toBe(false);
      expect(data.error).toContain(nonexistentId);
    });

    it('handles SQL injection payloads in question_id safely (returns 404, no crash)', async () => {
      const sqlInjectionPayloads = [
        "' OR '1'='1",
        "'; DROP TABLE pending_questions; --",
        "test' UNION SELECT 1, 'stem', '[]', 0, '', '', 1, 'listening', 'type', 'pending', 'hash', 'url', 'now' --",
        "1' OR 1=1; --",
        "admin'--",
      ];

      const db = getDbSync();

      for (const payload of sqlInjectionPayloads) {
        const res = await fetch(`${baseUrl}/api/qbank/tts-generate`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            question_id: payload,
            audio_script: '这是一次安全测试。',
          }),
        });

        expect(res.status).toBe(404);
        const data = (await res.json()) as any;
        expect(data.success).toBe(false);
      }

      // Verify pending_questions table is still intact and queryable
      const countRow = db.prepare('SELECT count(*) as cnt FROM pending_questions').get() as any;
      expect(countRow).toBeDefined();
      expect(typeof countRow.cnt).toBe('number');
    });

    it('handles path traversal payloads in question_id safely (returns 404, no crash)', async () => {
      const traversalPayloads = [
        '../../../../etc/passwd',
        '..\\..\\windows\\system32\\cmd.exe',
        '../../../public/audio/malicious.mp3',
        'foo/../../bar',
        '..%2f..%2f..%2fetc%2fpasswd',
      ];

      for (const payload of traversalPayloads) {
        const res = await fetch(`${baseUrl}/api/qbank/tts-generate`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            question_id: payload,
            audio_script: '路径穿越测试。',
          }),
        });

        expect(res.status).toBe(404);
        const data = (await res.json()) as any;
        expect(data.success).toBe(false);
      }
    });

    it('handles shell metacharacter and command injection payloads in question_id safely', async () => {
      const shellPayloads = [
        'q_id; calc.exe',
        'q_id && whoami',
        'q_id | dir',
        '$(whoami)',
        '`whoami`',
        'q_id & dir & calc.exe',
        '; ping -n 1 127.0.0.1 ;',
      ];

      for (const payload of shellPayloads) {
        const res = await fetch(`${baseUrl}/api/qbank/tts-generate`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            question_id: payload,
            audio_script: '指令注入测试。',
          }),
        });

        expect(res.status).toBe(404);
        const data = (await res.json()) as any;
        expect(data.success).toBe(false);
      }
    });

    it('handles null bytes and non-printable characters in question_id safely', async () => {
      const res = await fetch(`${baseUrl}/api/qbank/tts-generate`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          question_id: 'q_test\0_nullbyte',
          audio_script: '空字符注入测试。',
        }),
      });

      expect(res.status).toBe(404);
      const data = (await res.json()) as any;
      expect(data.success).toBe(false);
    });

    it('handles extremely long question_id (>10000 chars) without server crash', async () => {
      const longId = 'q_huge_' + 'a'.repeat(12000);
      const res = await fetch(`${baseUrl}/api/qbank/tts-generate`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          question_id: longId,
          audio_script: '超长ID测试。',
        }),
      });

      expect(res.status).toBe(404);
      const data = (await res.json()) as any;
      expect(data.success).toBe(false);
    });

    it('handles non-string question_id types safely', async () => {
      // number
      const resNum = await fetch(`${baseUrl}/api/qbank/tts-generate`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          question_id: 99999999,
          audio_script: '数字ID测试。',
        }),
      });
      expect(resNum.status).toBe(404);

      // object
      const resObj = await fetch(`${baseUrl}/api/qbank/tts-generate`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          question_id: { evil: true },
          audio_script: '对象ID测试。',
        }),
      });
      expect(resObj.status).toBe(404);

      // empty array
      const resArr = await fetch(`${baseUrl}/api/qbank/tts-generate`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          question_id: [],
          audio_script: '数组ID测试。',
        }),
      });
      expect(resArr.status).toBe(400);
    });
  });

  // =========================================================================
  // 3. Adversarial audio_script Validation & Boundary Stress
  // =========================================================================
  describe('3. Adversarial audio_script Validation & Boundary Stress', () => {
    it('returns 400 when audio_script is omitted', async () => {
      const res = await fetch(`${baseUrl}/api/qbank/tts-generate`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          question_id: 'q_valid_id',
        }),
      });

      expect(res.status).toBe(400);
      const data = (await res.json()) as any;
      expect(data.success).toBe(false);
      expect(data.error).toContain('audio_script');
    });

    it('returns 400 when audio_script is empty string', async () => {
      const res = await fetch(`${baseUrl}/api/qbank/tts-generate`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          question_id: 'q_valid_id',
          audio_script: '',
        }),
      });

      expect(res.status).toBe(400);
      const data = (await res.json()) as any;
      expect(data.success).toBe(false);
      expect(data.error).toContain('audio_script');
    });

    it('returns 400 when audio_script is whitespace only (spaces, tabs, newlines)', async () => {
      const res = await fetch(`${baseUrl}/api/qbank/tts-generate`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          question_id: 'q_valid_id',
          audio_script: '   \t\r\n   ',
        }),
      });

      expect(res.status).toBe(400);
      const data = (await res.json()) as any;
      expect(data.success).toBe(false);
      expect(data.error).toContain('audio_script');
    });

    it('returns 400 when audio_script is non-string type (number, boolean, object, array)', async () => {
      const invalidTypes = [12345, true, { text: '你好' }, ['你好', '世界']];

      for (const val of invalidTypes) {
        const res = await fetch(`${baseUrl}/api/qbank/tts-generate`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            question_id: 'q_valid_id',
            audio_script: val,
          }),
        });

        expect(res.status).toBe(400);
        const data = (await res.json()) as any;
        expect(data.success).toBe(false);
        expect(data.error).toContain('audio_script');
      }
    });

    it('returns 400 when audio_script exceeds 5000 characters (boundary test: 5001 chars)', async () => {
      const script5001 = '字'.repeat(5001);
      const res = await fetch(`${baseUrl}/api/qbank/tts-generate`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          question_id: 'q_valid_id',
          audio_script: script5001,
        }),
      });

      expect(res.status).toBe(400);
      const data = (await res.json()) as any;
      expect(data.success).toBe(false);
      expect(data.error).toContain('5000');
    });

    it('returns 400 when audio_script is excessively long (10,000 characters)', async () => {
      const script10k = '你好，世界。'.repeat(1667);
      expect(script10k.length).toBeGreaterThan(5000);

      const res = await fetch(`${baseUrl}/api/qbank/tts-generate`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          question_id: 'q_valid_id',
          audio_script: script10k,
        }),
      });

      expect(res.status).toBe(400);
      const data = (await res.json()) as any;
      expect(data.success).toBe(false);
      expect(data.error).toContain('5000');
    });

    it('does not reject audio_script of exactly 5000 characters for length violation', async () => {
      // 5000 chars is within the limit; with a nonexistent question_id, it should reach the 404 check
      const script5000 = '字'.repeat(5000);
      const res = await fetch(`${baseUrl}/api/qbank/tts-generate`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          question_id: 'nonexistent_test_5000_char_boundary',
          audio_script: script5000,
        }),
      });

      // Should fail on 404 (question not found), NOT 400 (length violation)
      expect(res.status).toBe(404);
      const data = (await res.json()) as any;
      expect(data.success).toBe(false);
      expect(data.error).toContain('nonexistent_test_5000_char_boundary');
    });
  });

  // =========================================================================
  // 4. Live Synthesis, Edge-TTS Special Characters, DB Update & Fallback Voice
  // =========================================================================
  describe('4. Live Synthesis, Edge-TTS Special Characters, DB Update & Fallback Voice', () => {
    const validTestQId = `adv_q_listen_${Date.now()}`;

    beforeAll(() => {
      const db = getDbSync();
      db.prepare(`
        INSERT INTO pending_questions (
          id, stem, options, answer_idx, pinyin, explanation_vi, level, skill, part_type, status, content_hash
        ) VALUES (
          ?, ?, ?, 1, ?, ?, 2, 'listening', 'listen_dialogue_3opt', 'pending', ?
        )
      `).run(
        validTestQId,
        '女：这件衣服真漂亮，多少钱？男：两百块。问：衣服多少钱？',
        JSON.stringify(['一百块', '两百块', '三百块']),
        'Nǚ: Zhè jiàn yīfu...',
        'Hỏi về giá tiền chiếc áo.',
        `hash_adv_listen_${Date.now()}`
      );
      insertedQuestionIds.push(validTestQId);
    });

    it('synthesizes Chinese dialogue with complex quotes, emojis, and punctuation', async () => {
      const complexScript = '女：“这件衣服”真漂亮！✨ 多少钱？\n男：两百块（200元）。\n问：衣服多少钱？';

      const res = await fetch(`${baseUrl}/api/qbank/tts-generate`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          question_id: validTestQId,
          audio_script: complexScript,
          voice: 'zh-CN-XiaoxiaoNeural',
        }),
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.success).toBe(true);
      expect(data.audio_url).toMatch(/^\/audio\/adv_q_listen_.*\.mp3$/);
      expect(data.duration_s).toBeGreaterThan(0.5);
      expect(data.message).toBe('Tạo file âm thanh thành công');

      const relativeDiskPath = path.join('public', data.audio_url.replace(/^\//, ''));
      createdTestFiles.push(path.join(process.cwd(), relativeDiskPath));

      // Verify file exists on disk
      expect(fs.existsSync(relativeDiskPath)).toBe(true);
      expect(fs.statSync(relativeDiskPath).size).toBeGreaterThan(1000);

      // Verify DB update
      const db = getDbSync();
      const updatedRow = db.prepare('SELECT id, audio_url FROM pending_questions WHERE id = ?').get(validTestQId) as any;
      expect(updatedRow).toBeDefined();
      expect(updatedRow.audio_url).toBe(data.audio_url);
    });

    it('handles unsupported or custom voice with automatic fallback to default voice', async () => {
      const res = await fetch(`${baseUrl}/api/qbank/tts-generate`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          question_id: validTestQId,
          audio_script: '欢迎参加汉语水平考试。',
          voice: 'non_existent_alien_voice_123',
        }),
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.success).toBe(true);
      expect(data.audio_url).toMatch(/^\/audio\/adv_q_listen_.*\.mp3$/);

      const relativeDiskPath = path.join('public', data.audio_url.replace(/^\//, ''));
      createdTestFiles.push(path.join(process.cwd(), relativeDiskPath));
      expect(fs.existsSync(relativeDiskPath)).toBe(true);
    });
  });

  // =========================================================================
  // 5. Express /audio Static Serving Adversarial Stress
  // =========================================================================
  describe('5. Express /audio Static Serving Adversarial Stress', () => {
    let testAudioFilename: string;
    let testAudioDiskPath: string;

    beforeAll(() => {
      // Create a deterministic dummy MP3 file for static serving tests
      testAudioFilename = `adversarial_static_fixture_${Date.now()}.mp3`;
      testAudioDiskPath = path.join(process.cwd(), 'public', 'audio', testAudioFilename);

      // Write minimal MP3 frame header / synthetic data
      const dummyMp3Buffer = Buffer.alloc(4096, 0xff);
      dummyMp3Buffer[0] = 0xff;
      dummyMp3Buffer[1] = 0xfb; // MPEG-1 Layer 3 sync word
      fs.writeFileSync(testAudioDiskPath, dummyMp3Buffer);
      createdTestFiles.push(testAudioDiskPath);
    });

    it('returns 200 and Content-Type: audio/mpeg for valid static MP3 file', async () => {
      const res = await fetch(`${baseUrl}/audio/${testAudioFilename}`);

      expect(res.status).toBe(200);
      const contentType = res.headers.get('content-type');
      expect(contentType).toBeTruthy();
      expect(contentType).toContain('audio');
      expect(contentType).toMatch(/audio\/mpeg|audio\/mp3/);

      const buffer = await res.arrayBuffer();
      expect(buffer.byteLength).toBe(4096);
    });

    it('returns 404 for nonexistent audio file in /audio/', async () => {
      const res = await fetch(`${baseUrl}/audio/nonexistent_ghost_audio_99999.mp3`);

      expect(res.status).toBe(404);
    });

    it('supports HTTP Range request (206 Partial Content) for audio player streaming', async () => {
      const res = await fetch(`${baseUrl}/audio/${testAudioFilename}`, {
        headers: {
          Range: 'bytes=0-511',
        },
      });

      expect(res.status).toBe(206);
      expect(res.headers.get('content-range')).toContain('bytes 0-511/4096');
      const buffer = await res.arrayBuffer();
      expect(buffer.byteLength).toBe(512);
    });

    it('prevents path traversal outside public/audio via ../ (returns 403 or 404)', async () => {
      const traversalUrls = [
        `${baseUrl}/audio/../../package.json`,
        `${baseUrl}/audio/..%2f..%2fpackage.json`,
        `${baseUrl}/audio/..\\..\\package.json`,
        `${baseUrl}/audio/....//....//package.json`,
      ];

      for (const url of traversalUrls) {
        const res = await fetch(url);
        // Express.static either rejects with 403 (forbidden traversal) or 404 (not found) or 400 (malformed)
        expect([400, 403, 404]).toContain(res.status);
      }
    });

    it('prevents directory listing on /audio/ (returns 404)', async () => {
      const res = await fetch(`${baseUrl}/audio/`);
      // Directory listing must not be exposed
      expect([403, 404]).toContain(res.status);
    });
  });

  // =========================================================================
  // 6. Database Safety Invariant Verification
  // =========================================================================
  describe('6. Database Safety Invariant Verification', () => {
    it('verifies data/hsk_exam.db SHA-256 hash has not been modified', () => {
      const dbPath = path.join(process.cwd(), 'data', 'hsk_exam.db');
      expect(fs.existsSync(dbPath)).toBe(true);

      const fileBuffer = fs.readFileSync(dbPath);
      const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex').toUpperCase();

      expect(hash).toBe('DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1');
    });
  });
});
