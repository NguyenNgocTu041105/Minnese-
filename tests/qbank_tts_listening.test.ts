/**
 * Test Suite: QBank Listening Questions & RESTful TTS Integration (Milestone 1 - R1)
 *
 * Verifies:
 * 1. CandidateQuestion schema & jsonParser field preservation (audio_url, passage, audio_text, transcript).
 * 2. Universal question parser listening dialogue classification:
 *    - 3-option dialogue classification: listen_dialogue_qa_3opt (HSK 1-3)
 *    - 4-option dialogue classification: listen_dialogue_qa_4opt (HSK 4-6)
 *    - Auto-inference of skill = 'listening' upon detecting speaker tags (男/女/问 or A/B)
 * 3. RESTful route aliases in qbankRoutes:
 *    - POST /api/qbank/tts/generate
 *    - GET /api/qbank/tts/voices
 * 4. Validation rules, error handling, and response contracts for TTS endpoints.
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
import { normalizeQuestionAliases } from '../src/server/llm/jsonParser.js';
import { parseUniversalQuestions } from '../src/server/llm/universalQuestionParser.js';
import { CandidateQuestion } from '../src/server/llm/types.js';

describe('Milestone 1 - R1: Listening Question Generation & Natural TTS Integration', () => {
  let app: express.Express;
  let server: http.Server;
  let baseUrl: string;
  let testDb: DatabaseSync;
  const TEST_ADMIN_TOKEN = 'test-m1-tts-listening-token-safe-random-64hex';

  beforeAll(async () => {
    testDb = new DatabaseSync(':memory:');
    ensurePendingSchema(testDb);
    setDbSyncForTesting(testDb);
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
  });

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${TEST_ADMIN_TOKEN}`,
  };

  describe('1. CandidateQuestion Schema & jsonParser Field Preservation', () => {
    it('preserves audio_url, passage, audio_text, and transcript during normalization', () => {
      const rawInput = {
        stem: '男：今天天气真好。\n女：是啊，我们去公园吧。\n问：他们打算去哪儿？',
        options: ['学校', '公园', '医院'],
        answer_idx: 1,
        explanation_vi: 'Đáp án đúng là 公园 vì người nữ đề nghị đi công viên.',
        level: 2,
        skill: 'listening',
        part_type: 'listen_dialogue_qa_3opt',
        audio_url: '/audio/test_q_1001.mp3',
        passage: '男：今天天气真好。\n女：是啊，我们去公园吧。',
        audio_text: '今天天气真好。是啊，我们去公园吧。',
        transcript: 'Nam: Hôm nay thời tiết đẹp quá. Nữ: Đúng vậy, chúng ta đi công viên nhé.',
      };

      const normalized = normalizeQuestionAliases(rawInput, 2, 'listening', false);

      expect(normalized.audio_url).toBe('/audio/test_q_1001.mp3');
      expect(normalized.passage).toBe('男：今天天气真好。\n女：是啊，我们去公园吧。');
      expect(normalized.audio_text).toBe('今天天气真好。是啊，我们去公园吧。');
      expect(normalized.transcript).toBe('Nam: Hôm nay thời tiết đẹp quá. Nữ: Đúng vậy, chúng ta đi công viên nhé.');
    });

    it('defaults audio_url and audio fields to null when omitted in raw question', () => {
      const rawInput = {
        stem: '我____去北京旅游。',
        options: ['想', '吃', '喝', '读'],
        answer_idx: 0,
        explanation_vi: 'Đáp án là 想 (muốn).',
      };

      const normalized = normalizeQuestionAliases(rawInput, 1, 'reading', false);
      expect(normalized.audio_url).toBeNull();
      expect(normalized.passage).toBeNull();
      expect(normalized.audio_text).toBeNull();
      expect(normalized.transcript).toBeNull();
    });
  });

  describe('2. Universal Question Parser: Dialogue Classification & Skill Auto-Inference', () => {
    it('classifies 3-option dialogue questions as listen_dialogue_qa_3opt and auto-infers skill = listening', () => {
      const inputDialogue = `
男：你想喝什么？
女：我想喝茶。
问：女的想喝什么？
A. 茶
B. 水
C. 咖啡
Đáp án: A
Giải thích: Người nữ trả lời "我想喝茶" (Tôi muốn uống trà), do đó đáp án đúng là A.
      `;

      // Pass default_skill = 'reading' to test auto-inference override
      const questions = parseUniversalQuestions(inputDialogue, {
        default_level: 2,
        default_skill: 'reading',
      });

      expect(questions.length).toBe(1);
      const q = questions[0];
      expect(q.skill).toBe('listening');
      expect(q.part_type).toBe('listen_dialogue_qa_3opt');
      expect(q.options.length).toBe(3);
      expect(q.answer_idx).toBe(0);
    });

    it('classifies 4-option dialogue questions as listen_dialogue_qa_4opt and auto-infers skill = listening', () => {
      const inputDialogue = `
男：你这次去北京出差感觉怎么样？
女：挺好的，认识了很多新朋友，工作也进展顺利。
问：女的出差感觉如何？
A. 很无聊
B. 非常顺利
C. 工作很累
D. 找不到朋友
Đáp án: B
Giải thích: Người nữ nói "挺好的... 工作也进展顺利", đáp án B (rất thuận lợi) là chính xác.
      `;

      const questions = parseUniversalQuestions(inputDialogue, {
        default_level: 4,
        default_skill: 'reading',
      });

      expect(questions.length).toBe(1);
      const q = questions[0];
      expect(q.skill).toBe('listening');
      expect(q.part_type).toBe('listen_dialogue_qa_4opt');
      expect(q.options.length).toBe(4);
      expect(q.answer_idx).toBe(1);
    });

    it('recognizes A/B speaker format dialogues and infers listening skill with 3 options', () => {
      const inputDialogue = `
A: 你昨天去哪儿了？
B: 我去超市买东西了。
问: B昨天去哪儿了？
A. 超市
B. 学校
C. 机场
Đáp án: A
Giải thích: B trả lời đã đến siêu thị.
      `;

      const questions = parseUniversalQuestions(inputDialogue, {
        default_level: 1,
        default_skill: 'reading',
      });

      expect(questions.length).toBe(1);
      const q = questions[0];
      expect(q.skill).toBe('listening');
      expect(q.part_type).toBe('listen_dialogue_qa_3opt');
      expect(q.options.length).toBe(3);
      expect(q.answer_idx).toBe(0);
    });
  });

  describe('3. RESTful API Endpoint Aliases: /api/qbank/tts/generate & /api/qbank/tts/voices', () => {
    it('GET /api/qbank/tts/voices returns the 8 Beijing neural voices catalog and dialogue pairs', async () => {
      const res = await fetch(`${baseUrl}/api/qbank/tts/voices`, {
        headers: authHeaders,
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.voices)).toBe(true);

      const voiceIds = data.voices.map((v: any) => v.id);
      expect(voiceIds).toContain('auto');
      expect(voiceIds).toContain('zh-CN-XiaoxiaoNeural');
      expect(voiceIds).toContain('zh-CN-YunxiNeural');
      expect(voiceIds).toContain('zh-CN-YunjianNeural');
      expect(voiceIds).toContain('zh-CN-XiaoyiNeural');
      expect(voiceIds).toContain('zh-CN-YunyangNeural');
      expect(voiceIds).toContain('zh-CN-YunxiaNeural');
      expect(voiceIds).toContain('zh-CN-liaoning-XiaobeiNeural');
      expect(voiceIds).toContain('zh-CN-shaanxi-XiaoniNeural');

      expect(Array.isArray(data.dialogue_pairs)).toBe(true);
      expect(data.dialogue_pairs.length).toBeGreaterThanOrEqual(4);
    });

    it('POST /api/qbank/tts/generate enforces parameter validation: missing question_id', async () => {
      const res = await fetch(`${baseUrl}/api/qbank/tts/generate`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          audio_script: '你好，欢迎参加考试。',
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('question_id');
    });

    it('POST /api/qbank/tts/generate enforces parameter validation: empty audio_script', async () => {
      const res = await fetch(`${baseUrl}/api/qbank/tts/generate`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          question_id: 'test_q_missing_script',
          audio_script: '   ',
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('audio_script');
    });

    it('POST /api/qbank/tts/generate returns 404 for nonexistent question_id', async () => {
      const res = await fetch(`${baseUrl}/api/qbank/tts/generate`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          question_id: 'nonexistent_test_q_999999',
          audio_script: '你好，测试语音。',
        }),
      });

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Không tìm thấy');
    });

    it('POST /api/qbank/tts/generate rejects invalid voice format (injection prevention)', async () => {
      testDb.prepare(`
        INSERT OR REPLACE INTO pending_questions (
          id, stem, options, answer_idx, pinyin, explanation_vi, level, skill, part_type, status, content_hash
        ) VALUES (
          ?, ?, ?, 0, ?, ?, 2, 'listening', 'listen_dialogue_qa_3opt', 'pending', ?
        )
      `).run('test_q_voice_inject', 'stem', '["A","B"]', 'pinyin', 'expl', `hash_${Date.now()}`);

      const res = await fetch(`${baseUrl}/api/qbank/tts/generate`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          question_id: 'test_q_voice_inject',
          audio_script: '你好',
          voice: 'zh-CN-Xiaoxiao; rm -rf /',
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Tên voice không hợp lệ');
    });

    it('POST /api/qbank/tts/generate enforces auth: rejects unauthenticated requests', async () => {
      const res = await fetch(`${baseUrl}/api/qbank/tts/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: 'test_auth_q',
          audio_script: '测试未授权',
        }),
      });

      expect([401, 403]).toContain(res.status);
    });
  });
});
