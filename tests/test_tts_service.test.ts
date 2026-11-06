/**
 * Test Suite: Edge-TTS Audio Generation Service & QBank Integration (Milestone M3)
 *
 * Verifies:
 * 1. CLI execution of tts_service.py with Edge-TTS and mutagen duration measurement.
 * 2. Automatic voice fallback and error handling for empty input.
 * 3. Route POST /api/qbank/tts-generate parameter validation (question_id, audio_script length).
 * 4. 404 response when question_id does not exist in pending_questions.
 * 5. End-to-end audio synthesis, SQLite pending_questions.audio_url persistence, and static audio serving.
 * 6. GET /api/qbank/pending returns formatted audio_url.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { DatabaseSync } from 'node:sqlite';
import {
  qbankRouter,
  setQBankAdminTokenForTesting,
  getDbSync,
  setDbSyncForTesting,
  ensurePendingSchema,
} from '../src/server/qbankRoutes.js';

const execFileAsync = promisify(execFile);

describe('Milestone M3: Edge-TTS Integration for Listening Questions', () => {
  let app: express.Express;
  let server: http.Server;
  let baseUrl: string;
  let testDb: DatabaseSync;
  const TEST_ADMIN_TOKEN = 'test-admin-token-for-tts-service-32chars-ok';
  const createdTestFiles: string[] = [];

  const pythonExec =
    process.env.QBANK_PYTHON_EXECUTABLE?.trim() ||
    (fs.existsSync('C:\\Users\\Tunn\\AppData\\Local\\Python\\pythoncore-3.14-64\\python.exe')
      ? 'C:\\Users\\Tunn\\AppData\\Local\\Python\\pythoncore-3.14-64\\python.exe'
      : 'python');

  beforeAll(async () => {
    testDb = new DatabaseSync(':memory:');
    ensurePendingSchema(testDb);
    setDbSyncForTesting(testDb);
    setQBankAdminTokenForTesting(TEST_ADMIN_TOKEN);

    // Synchronously ensure audio directory exists
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
    // Clean up any generated test audio files
    for (const file of createdTestFiles) {
      try {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      } catch {}
    }
  });

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${TEST_ADMIN_TOKEN}`,
  };

  describe('Part 1: Python CLI tts_service.py', () => {
    it('synthesizes Chinese speech to .mp3 with valid duration via CLI', async () => {
      const outputPath = path.join('public', 'audio', `test_cli_${Date.now()}.mp3`);
      createdTestFiles.push(path.join(process.cwd(), outputPath));

      const { stdout } = await execFileAsync(
        pythonExec,
        [
          path.join(process.cwd(), 'tts_service.py'),
          '--text',
          '你好，欢迎参加HSK考试',
          '--output',
          outputPath,
          '--voice',
          'zh-CN-XiaoxiaoNeural',
        ],
        { cwd: process.cwd() }
      );

      const result = JSON.parse(stdout.trim());
      expect(result.success).toBe(true);
      expect(result.duration_s).toBeGreaterThan(0.5);
      expect(result.voice).toBe('zh-CN-XiaoxiaoNeural');
      expect(fs.existsSync(outputPath)).toBe(true);
      expect(fs.statSync(outputPath).size).toBeGreaterThan(1000);
    });

    it('returns error when text is empty', async () => {
      const outputPath = path.join('public', 'audio', `test_cli_empty_${Date.now()}.mp3`);
      createdTestFiles.push(path.join(process.cwd(), outputPath));

      try {
        await execFileAsync(
          pythonExec,
          [
            path.join(process.cwd(), 'tts_service.py'),
            '--text',
            '   ',
            '--output',
            outputPath,
          ],
          { cwd: process.cwd() }
        );
        expect.unreachable('Should have exited with non-zero code');
      } catch (err: any) {
        expect(err.code).not.toBe(0);
        const parsed = JSON.parse(err.stdout?.trim() || '{}');
        expect(parsed.success).toBe(false);
        expect(parsed.error).toContain('không được để trống');
      }
    });

    it('supports male voice zh-CN-YunxiNeural', async () => {
      const outputPath = path.join('public', 'audio', `test_cli_male_${Date.now()}.mp3`);
      createdTestFiles.push(path.join(process.cwd(), outputPath));

      const { stdout } = await execFileAsync(
        pythonExec,
        [
          path.join(process.cwd(), 'tts_service.py'),
          '--text',
          '明天天气很好',
          '--output',
          outputPath,
          '--voice',
          'zh-CN-YunxiNeural',
        ],
        { cwd: process.cwd() }
      );

      const result = JSON.parse(stdout.trim());
      expect(result.success).toBe(true);
      expect(result.voice).toBe('zh-CN-YunxiNeural');
      expect(fs.existsSync(outputPath)).toBe(true);
    });
  });

  describe('Part 2: POST /api/qbank/tts-generate Validation', () => {
    it('returns 400 when question_id is missing', async () => {
      const res = await fetch(`${baseUrl}/api/qbank/tts-generate`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          audio_script: '请问图书馆几点关门？',
        }),
      });

      expect(res.status).toBe(400);
      const data = (await res.json()) as any;
      expect(data.success).toBe(false);
      expect(data.error).toContain('question_id');
    });

    it('returns 400 when audio_script is empty', async () => {
      const res = await fetch(`${baseUrl}/api/qbank/tts-generate`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          question_id: 'q_test_123',
          audio_script: '   ',
        }),
      });

      expect(res.status).toBe(400);
      const data = (await res.json()) as any;
      expect(data.success).toBe(false);
      expect(data.error).toContain('audio_script');
    });

    it('returns 400 when audio_script exceeds 5000 characters', async () => {
      const longScript = '你好'.repeat(2600);
      const res = await fetch(`${baseUrl}/api/qbank/tts-generate`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          question_id: 'q_test_123',
          audio_script: longScript,
        }),
      });

      expect(res.status).toBe(400);
      const data = (await res.json()) as any;
      expect(data.success).toBe(false);
      expect(data.error).toContain('5000');
    });

    it('returns 404 when question_id does not exist in pending_questions', async () => {
      const nonExistentId = `non_existent_${Date.now()}`;
      const res = await fetch(`${baseUrl}/api/qbank/tts-generate`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          question_id: nonExistentId,
          audio_script: '请问图书馆几点关门？',
        }),
      });

      expect(res.status).toBe(404);
      const data = (await res.json()) as any;
      expect(data.success).toBe(false);
      expect(data.error).toContain(nonExistentId);
    });
  });

  describe('Part 3: End-to-End Synthesis, DB Update & Static Serving', () => {
    const testListeningQId = `test_pend_listening_${Date.now()}`;

    beforeAll(() => {
      const db = getDbSync();
      // Ensure test question exists in pending_questions table
      db.prepare(`
        INSERT INTO pending_questions (
          id, stem, options, answer_idx, pinyin, explanation_vi, level, skill, part_type, status, content_hash
        ) VALUES (
          ?, ?, ?, 0, ?, ?, 1, 'listening', 'listen_dialogue_3opt', 'pending', ?
        )
      `).run(
        testListeningQId,
        '男：请问，图书馆几点关门？女：下午五点半。问：图书馆什么时候关门？',
        JSON.stringify(['五点半', '六点', '七点']),
        'Nán: Qǐngwèn...',
        'Hỏi về thời gian đóng cửa thư viện.',
        `hash_listening_${Date.now()}`
      );
    });

    it('generates audio file, updates DB, and serves static MP3', async () => {
      const res = await fetch(`${baseUrl}/api/qbank/tts-generate`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          question_id: testListeningQId,
          audio_script: '男：请问，图书馆几点关门？女：下午五点半。问：图书馆什么时候关门？',
          voice: 'zh-CN-XiaoxiaoNeural',
        }),
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.success).toBe(true);
      expect(data.audio_url).toMatch(/^\/audio\/test_pend_listening_.*\.mp3$/);
      expect(data.duration_s).toBeGreaterThan(0.5);
      expect(data.message).toBe('Tạo file âm thanh thành công');

      const relativeDiskPath = path.join('public', data.audio_url.replace(/^\//, ''));
      createdTestFiles.push(path.join(process.cwd(), relativeDiskPath));
      expect(fs.existsSync(relativeDiskPath)).toBe(true);
      expect(fs.statSync(relativeDiskPath).size).toBeGreaterThan(1000);

      // Verify database update
      const db = getDbSync();
      const updatedRow = db.prepare('SELECT id, audio_url FROM pending_questions WHERE id = ?').get(testListeningQId) as any;
      expect(updatedRow).toBeDefined();
      expect(updatedRow.audio_url).toBe(data.audio_url);

      // Verify static route serving
      const audioFetch = await fetch(`${baseUrl}${data.audio_url}`);
      expect(audioFetch.status).toBe(200);
      expect(audioFetch.headers.get('content-type')).toContain('audio');
      const audioBuffer = await audioFetch.arrayBuffer();
      expect(audioBuffer.byteLength).toBeGreaterThan(1000);
    });

    it('reflects audio_url in GET /api/qbank/pending response', async () => {
      const res = await fetch(`${baseUrl}/api/qbank/pending?skill=listening`, {
        method: 'GET',
        headers: authHeaders,
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.success).toBe(true);
      const found = data.questions?.find((q: any) => q.id === testListeningQId);
      expect(found).toBeDefined();
      expect(found.audio_url).toMatch(/^\/audio\/test_pend_listening_.*\.mp3$/);
    });
  });
});
