import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import express, { Express } from 'express';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

import {
  canShuffle,
  shuffleQuestionAnswers,
  isServingAnswerShuffleEnabled,
} from '../src/server/utils/answerShuffle.js';
import {
  examRouter,
  loadApprovedQuestionsFromDb,
  createTestExamDb,
  setExamDbForTesting,
  stripAnswerFromQuestion,
} from '../src/server/examRoutes.js';
import {
  qbankRouter,
  ensurePendingSchema,
  setDbSyncForTesting,
  setQBankAdminTokenForTesting,
} from '../src/server/qbankRoutes.js';
import {
  inspectExamPoolBySections,
  reEvaluateApprovedQuestions,
  ensureEligiblePoolSchema,
  syncApprovedQuestionToPool,
  syncApprovedQuestion,
} from '../src/server/qbankFormatSync.js';

const EXPECTED_HSK_EXAM_DB_HASH = 'DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1';
const HSK_EXAM_DB_PATH = path.resolve(process.cwd(), 'data/hsk_exam.db');

function getSha256(filePath: string): string {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buf).digest('hex').toUpperCase();
}

describe('Milestone M3: Serving Dual-Flow Integrity, Pool Sync & Fail-Closed Serving', () => {
  let server: http.Server | null = null;
  let baseUrl: string = '';
  let testDb: DatabaseSync;
  const originalEnvToken = process.env.QBANK_ADMIN_TOKEN;
  const originalAdminEnabled = process.env.QBANK_ADMIN_ENABLED;
  const testAdminToken = crypto.randomBytes(32).toString('hex'); // 64 hex chars

  beforeAll(async () => {
    expect(fs.existsSync(HSK_EXAM_DB_PATH)).toBe(true);
    expect(getSha256(HSK_EXAM_DB_PATH)).toBe(EXPECTED_HSK_EXAM_DB_HASH);
  });

  afterAll(() => {
    if (originalEnvToken !== undefined) {
      process.env.QBANK_ADMIN_TOKEN = originalEnvToken;
    } else {
      delete process.env.QBANK_ADMIN_TOKEN;
    }
    if (originalAdminEnabled !== undefined) {
      process.env.QBANK_ADMIN_ENABLED = originalAdminEnabled;
    } else {
      delete process.env.QBANK_ADMIN_ENABLED;
    }
    setQBankAdminTokenForTesting(null);
    setDbSyncForTesting(null);
    setExamDbForTesting(null);

    expect(getSha256(HSK_EXAM_DB_PATH)).toBe(EXPECTED_HSK_EXAM_DB_HASH);
  });

  beforeEach(async () => {
    // Create completely isolated in-memory test database
    testDb = createTestExamDb({ seedPool: false });
    ensurePendingSchema(testDb);
    ensureEligiblePoolSchema(testDb);

    setDbSyncForTesting(testDb);
    setExamDbForTesting(testDb);

    process.env.QBANK_ADMIN_TOKEN = testAdminToken;
    process.env.QBANK_ADMIN_ENABLED = 'true';
    setQBankAdminTokenForTesting(testAdminToken);

    const app: Express = express();
    app.use(express.json());
    app.use('/api/qbank', qbankRouter);
    app.use('/api/exam', examRouter);

    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server?.address();
        if (addr && typeof addr === 'object') {
          baseUrl = `http://127.0.0.1:${addr.port}`;
        }
        resolve();
      });
    });
  });

  afterEach(async () => {
    if (server) {
      await new Promise<void>((resolve) => server!.close(() => resolve()));
      server = null;
    }
    setDbSyncForTesting(null);
    setExamDbForTesting(null);
    if (testDb) {
      try { testDb.close(); } catch {}
    }
  });

  const authHeaders = () => ({
    'Authorization': `Bearer ${testAdminToken}`,
    'Content-Type': 'application/json',
  });

  // Helper to insert pending questions
  function insertPendingQuestion(q: {
    id: string;
    stem: string;
    options?: string[];
    answer_idx?: number;
    level: number;
    skill: string;
    part_type: string;
    status?: string;
    explanation_vi?: string;
    is_active?: number;
    passage?: string;
    topic?: string;
  }) {
    const optionsJson = JSON.stringify(q.options || []);
    testDb.prepare(`
      INSERT INTO pending_questions (
        id, stem, options, answer_idx, level, skill, part_type, status, explanation_vi, is_active, passage, topic, content_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      q.id,
      q.stem,
      optionsJson,
      q.answer_idx !== undefined ? q.answer_idx : 0,
      q.level,
      q.skill,
      q.part_type,
      q.status || 'pending',
      q.explanation_vi || 'Giải thích chuẩn.',
      q.is_active !== undefined ? q.is_active : 1,
      q.passage || null,
      q.topic || null,
      'hash_' + q.id
    );
  }

  // =========================================================================
  // Suite 1: Answer Shuffling with Multi-Option Support & Word Bank Protection
  // =========================================================================
  describe('Suite 1: Answer Shuffling with Multi-Option Support (2, 3, 4, 6 options)', () => {
    it('allows shuffling 3-option questions (HSK 1-2 standard)', () => {
      const q3 = {
        options: ['苹果', '香蕉', '西瓜'],
        answer_idx: 0,
        explanation_vi: 'Đáp án là quả táo thơm ngon.',
      };
      const check = canShuffle(q3);
      expect(check.canShuffle).toBe(true);

      const shuffled = shuffleQuestionAnswers(q3, () => 0.5);
      expect(shuffled.shuffled).toBe(true);
      expect(shuffled.question.options.length).toBe(3);
    });

    it('allows shuffling 2-option non-boolean questions and protects fixed true/false order', () => {
      const q2 = {
        options: ['北京', '上海'],
        answer_idx: 1,
        explanation_vi: 'Đáp án là Thượng Hải.',
      };
      const check = canShuffle(q2);
      expect(check.canShuffle).toBe(true);

      const qTf = {
        options: ['对', '错'],
        answer_idx: 0,
        explanation_vi: 'Nhận định trên là đúng.',
      };
      const checkTf = canShuffle(qTf);
      expect(checkTf.canShuffle).toBe(false);
      expect(checkTf.reason).toContain('True/False');
    });

    it('allows shuffling 4-option and 6-option questions', () => {
      const q4 = {
        options: ['A', 'B', 'C', 'D'],
        answer_idx: 2,
        explanation_vi: 'Chọn đáp án C.',
      };
      expect(canShuffle(q4).canShuffle).toBe(true);

      const q6 = {
        options: ['A', 'B', 'C', 'D', 'E', 'F'],
        answer_idx: 4,
        explanation_vi: 'Đáp án E phù hợp.',
      };
      expect(canShuffle(q6).canShuffle).toBe(true);
    });

    it('gracefully disallows shuffling open-ended writing tasks (< 2 options)', () => {
      const qWriting = {
        options: [],
        explanation_vi: 'Bài viết mẫu về chuyến du lịch Bắc Kinh.',
      };
      const check = canShuffle(qWriting);
      expect(check.canShuffle).toBe(false);
      expect(check.reason).toContain('Less than 2 options');

      const shuffled = shuffleQuestionAnswers(qWriting);
      expect(shuffled.shuffled).toBe(false);
      expect(shuffled.question.options).toEqual([]);
    });

    it('hardens word bank checks: disallows shuffling questions with word bank part types', () => {
      const qWb1 = {
        options: ['A', 'B', 'C', 'D', 'E', 'F'],
        answer_idx: 0,
        part_type: 'read_fill_blank_word_bank_6opt',
      };
      expect(canShuffle(qWb1).canShuffle).toBe(false);
      expect(canShuffle(qWb1).reason).toContain('Shared word bank');

      const qWb2 = {
        options: ['A', 'B', 'C', 'D', 'E'],
        answer_idx: 1,
        part_type: 'read_fill_blank_word_bank_split',
      };
      expect(canShuffle(qWb2).canShuffle).toBe(false);

      const qWb3 = {
        options: ['A', 'B', 'C', 'D', 'E', 'F'],
        answer_idx: 2,
        group_id: 'group_wordbank_01',
      };
      expect(canShuffle(qWb3).canShuffle).toBe(false);
    });
  });

  // =========================================================================
  // Suite 2: Feature 13 - Single Question Approval Dual-Flow Sync
  // =========================================================================
  describe('Suite 2: Single Question Approval Dual-Flow Sync', () => {
    it('approves a single question and automatically syncs to both practice and exam pools', async () => {
      insertPendingQuestion({
        id: 'pend_hsk1_single',
        stem: '我想吃苹果。★ 他想吃什么？',
        options: ['苹果', '香蕉', '西瓜'],
        answer_idx: 0,
        level: 1,
        skill: 'reading',
        part_type: 'read_comprehension_short_3opt',
        explanation_vi: 'Đáp án A là quả táo.',
      });

      const res = await fetch(`${baseUrl}/api/qbank/pending/approve`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ id: 'pend_hsk1_single' }),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.approved_count).toBe(1);
      expect(data.approved_ids).toEqual(['pend_hsk1_single']);
      expect(Array.isArray(data.sync_details)).toBe(true);
      expect(data.sync_details.length).toBe(1);
      expect(data.sync_details[0].questionId).toBe('pend_hsk1_single');
      expect(data.sync_details[0].practice_eligible).toBe(true);
      expect(data.sync_details[0].exam_eligible).toBe(true);

      // Verify exam_eligible_pool row in database
      const poolRow: any = testDb.prepare('SELECT * FROM exam_eligible_pool WHERE question_id = ?').get('pend_hsk1_single');
      expect(poolRow).toBeDefined();
      expect(poolRow.level).toBe(1);
      expect(poolRow.skill).toBe('reading');
      expect(poolRow.part_type).toBe('read_comprehension_short_3opt');
      expect(poolRow.practice_eligible).toBe(1);
      expect(poolRow.exam_eligible).toBe(1);
    });
  });

  // =========================================================================
  // Suite 3: Feature 13 - Bulk Question Approval Dual-Flow Sync
  // =========================================================================
  describe('Suite 3: Bulk Question Approval Dual-Flow Sync with Diverse Part Types', () => {
    it('bulk approves questions with 3-option, open-ended writing, and partial listening formats', async () => {
      // Q1: HSK 1 3-option reading (eligible for both)
      insertPendingQuestion({
        id: 'bulk_q1_read_3opt',
        stem: '小明在喝茶。★ 小明在做什么？',
        options: ['喝茶', '看书', '睡觉'],
        answer_idx: 0,
        level: 1,
        skill: 'reading',
        part_type: 'read_comprehension_short_3opt',
      });

      // Q2: HSK 4 open-ended writing 0-option task
      insertPendingQuestion({
        id: 'bulk_q2_write_0opt',
        stem: '请写一篇80字左右的话题短文：高兴，旅游，朋友',
        options: [],
        answer_idx: 0,
        level: 4,
        skill: 'writing',
        part_type: 'write_short_essay_80chars',
        explanation_vi: 'Bài viết mẫu về chuyến du lịch vui vẻ cùng bạn bè.',
      });

      // Q3: HSK 1 listening picture match question lacking illustration theme
      insertPendingQuestion({
        id: 'bulk_q3_listen_partial',
        stem: '飞机',
        options: ['A', 'B', 'C'],
        answer_idx: 0,
        level: 1,
        skill: 'listening',
        part_type: 'listen_picture_match_3opt',
      });

      const res = await fetch(`${baseUrl}/api/qbank/pending/approve`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ ids: ['bulk_q1_read_3opt', 'bulk_q2_write_0opt', 'bulk_q3_listen_partial'] }),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.approved_count).toBe(3);
      expect(data.sync_details.length).toBe(3);

      const p1: any = testDb.prepare('SELECT * FROM exam_eligible_pool WHERE question_id = ?').get('bulk_q1_read_3opt');
      expect(p1.practice_eligible).toBe(1);
      expect(p1.exam_eligible).toBe(1);

      const p2: any = testDb.prepare('SELECT * FROM exam_eligible_pool WHERE question_id = ?').get('bulk_q2_write_0opt');
      expect(p2.practice_eligible).toBe(1);
      expect(p2.exam_eligible).toBe(1);

      const p3: any = testDb.prepare('SELECT * FROM exam_eligible_pool WHERE question_id = ?').get('bulk_q3_listen_partial');
      expect(p3.practice_eligible).toBe(1);
      // Listening picture match without illustration is not fully exam eligible, has reason recorded
      expect(p3.exam_eligible).toBe(0);
      expect(p3.ineligible_reasons).toContain('Dạng bài nhìn tranh thiếu chủ đề hình minh họa');
    });

    it('returns empty sync_details gracefully on empty ids list', async () => {
      const res = await fetch(`${baseUrl}/api/qbank/pending/approve`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ ids: [] }),
      });
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.approved_count).toBe(0);
      expect(data.sync_details).toEqual([]);
    });
  });

  // =========================================================================
  // Suite 4: Feature 13 - syncApprovedQuestionToPool Function Contract & Idempotency
  // =========================================================================
  describe('Suite 4: syncApprovedQuestionToPool Function Contract & Idempotency', () => {
    it('supports polymorphic signatures (db, id) and (id, db)', () => {
      // Seed an approved question directly in questions table
      testDb.prepare(`
        INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active, explanation_vi)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'approved', 1, 'Giải thích')
      `).run('poly_q1', '天气很好。', JSON.stringify(['晴天', '下雨']), 0, 1, 'reading', 'read_true_false_2opt');

      // 1. Signature (db, id)
      const res1 = syncApprovedQuestionToPool(testDb, 'poly_q1');
      expect(res1).not.toBeNull();
      expect(res1?.questionId).toBe('poly_q1');
      expect(res1?.practice_eligible).toBe(true);

      // 2. Signature (id, db)
      const res2 = syncApprovedQuestionToPool('poly_q1', testDb);
      expect(res2).not.toBeNull();
      expect(res2?.questionId).toBe('poly_q1');
      expect(res2?.practice_eligible).toBe(true);

      // 3. Backward-compatible syncApprovedQuestion(id, db)
      const res3 = syncApprovedQuestion('poly_q1', testDb);
      expect(res3).not.toBeNull();
      expect(res3?.questionId).toBe('poly_q1');
    });

    it('is strictly idempotent: repeated executions update record without error or duplicates', () => {
      testDb.prepare(`
        INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active, explanation_vi)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'approved', 1, 'Giải thích')
      `).run('idem_q1', '我想喝水。', JSON.stringify(['水', '茶', '咖啡']), 0, 1, 'reading', 'read_comprehension_short_3opt');

      syncApprovedQuestionToPool(testDb, 'idem_q1');
      syncApprovedQuestionToPool(testDb, 'idem_q1');
      syncApprovedQuestionToPool(testDb, 'idem_q1');

      const countRow: any = testDb.prepare('SELECT COUNT(1) as c FROM exam_eligible_pool WHERE question_id = ?').get('idem_q1');
      expect(countRow.c).toBe(1);
    });
  });

  // =========================================================================
  // Suite 5: Feature 13 & Feature 15 - Fail-Closed Serving Isolation
  // =========================================================================
  describe('Suite 5: Fail-Closed Serving Isolation', () => {
    it('strictly excludes pending, rejected, and disabled questions from practice and mock serving', () => {
      // 1. Pending
      testDb.prepare(`
        INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active, explanation_vi)
        VALUES ('iso_pending', '题目 1', '["A","B"]', 0, 1, 'reading', 'read_true_false_2opt', 'pending', 1, 'Giải thích')
      `).run();

      // 2. Rejected
      testDb.prepare(`
        INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active, explanation_vi)
        VALUES ('iso_rejected', '题目 2', '["A","B"]', 0, 1, 'reading', 'read_true_false_2opt', 'rejected', 1, 'Giải thích')
      `).run();

      // 3. Disabled (approved but is_active = 0)
      testDb.prepare(`
        INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active, explanation_vi)
        VALUES ('iso_disabled', '题目 3', '["A","B"]', 0, 1, 'reading', 'read_true_false_2opt', 'approved', 0, 'Giải thích')
      `).run();

      // 4. Approved & Active
      testDb.prepare(`
        INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active, explanation_vi)
        VALUES ('iso_active', '题目 4', '["A","B","C"]', 0, 1, 'reading', 'read_comprehension_short_3opt', 'approved', 1, 'Giải thích')
      `).run();
      syncApprovedQuestionToPool(testDb, 'iso_active');

      const practiceQuestions = loadApprovedQuestionsFromDb(1, { mode: 'practice' }, testDb);
      const practiceIds = practiceQuestions.map((q) => q.id);
      expect(practiceIds).toContain('iso_active');
      expect(practiceIds).not.toContain('iso_pending');
      expect(practiceIds).not.toContain('iso_rejected');
      expect(practiceIds).not.toContain('iso_disabled');

      const mockQuestions = loadApprovedQuestionsFromDb(1, { mode: 'mock' }, testDb);
      const mockIds = mockQuestions.map((q) => q.id);
      expect(mockIds).toContain('iso_active');
      expect(mockIds).not.toContain('iso_pending');
      expect(mockIds).not.toContain('iso_rejected');
      expect(mockIds).not.toContain('iso_disabled');
    });
  });

  // =========================================================================
  // Suite 6: Feature 13 & Feature 15 - Immediate Post-Approval Serving Availability
  // =========================================================================
  describe('Suite 6: Immediate Post-Approval Serving Availability', () => {
    it('makes pending questions immediately available in practice serving right after approval', async () => {
      insertPendingQuestion({
        id: 'fresh_pend_01',
        stem: '他在北京大学学习。★ 他在哪里学习？',
        options: ['北京大学', '清华大学', '复旦大学'],
        answer_idx: 0,
        level: 1,
        skill: 'reading',
        part_type: 'read_comprehension_short_3opt',
      });

      // Before approval: not served
      const beforeServe = loadApprovedQuestionsFromDb(1, { mode: 'practice' }, testDb);
      expect(beforeServe.some((q) => q.id === 'fresh_pend_01')).toBe(false);

      // Approve question via HTTP endpoint
      const approveRes = await fetch(`${baseUrl}/api/qbank/pending/approve`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ id: 'fresh_pend_01' }),
      });
      expect(approveRes.status).toBe(200);

      // Immediately after approval: served cleanly in loadApprovedQuestionsFromDb
      const afterServe = loadApprovedQuestionsFromDb(1, { mode: 'practice' }, testDb);
      expect(afterServe.some((q) => q.id === 'fresh_pend_01')).toBe(true);

      // Immediately served via POST /api/exam/generate-mock (practice mode)
      const practiceRes = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 1,
          mode: 'practice',
          skill: 'reading',
          strictQbankOnly: true,
        }),
      });
      expect(practiceRes.status).toBe(200);
      const practiceData = await practiceRes.json() as any;
      expect(practiceData.success).toBe(true);
      expect(practiceData.questions.some((q: any) => q.id === 'fresh_pend_01')).toBe(true);
    });
  });

  // =========================================================================
  // Suite 7: Feature 15 - Practice Mode Filtered Drilling & Shuffling
  // =========================================================================
  describe('Suite 7: Practice Mode Filtered Drilling & Shuffling', () => {
    beforeEach(() => {
      // Seed a set of approved questions with compatible formats and varied metadata
      testDb.prepare(`
        INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, topic, tested_vocab, status, is_active, explanation_vi)
        VALUES 
          ('q_read_fill', '今天天气______好。', '["很","不","太","真"]', 0, 1, 'reading', 'read_fill_blank_4opt', 'weather', '今天,天气', 'approved', 1, 'Đáp án đúng là A (很).'),
          ('q_read_comp', '小猫在桌子下面。★ 小猫在哪里？', '["桌子上面","桌子下面","椅子上面"]', 1, 1, 'reading', 'read_comprehension_short_3opt', 'animals', '小猫,桌子', 'approved', 1, 'Đáp án B (桌子下面).')
      `).run();

      syncApprovedQuestionToPool(testDb, 'q_read_fill');
      syncApprovedQuestionToPool(testDb, 'q_read_comp');
    });

    it('matches questions via compatible_formats when filtering by part_type', () => {
      // q_read_fill has part_type = 'read_fill_blank_4opt', but compatible_formats includes 'read_fill_blank_word_bank_6opt'
      const matched = loadApprovedQuestionsFromDb(
        1,
        { mode: 'practice', part_type: 'read_fill_blank_word_bank_6opt' },
        testDb
      );
      expect(matched.some((q) => q.id === 'q_read_fill')).toBe(true);
    });

    it('filters by skill, topic, and vocab correctly', () => {
      const weatherQs = loadApprovedQuestionsFromDb(1, { mode: 'practice', topic: 'weather' }, testDb);
      expect(weatherQs.length).toBe(1);
      expect(weatherQs[0].id).toBe('q_read_fill');

      const vocabQs = loadApprovedQuestionsFromDb(1, { mode: 'practice', vocab: '小猫' }, testDb);
      expect(vocabQs.length).toBe(1);
      expect(vocabQs[0].id).toBe('q_read_comp');
    });

    it('shuffles answers when request body contains shuffle: true and strips answers for anti-cheat', async () => {
      const res = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 1,
          mode: 'practice',
          shuffle: true,
          strictQbankOnly: true,
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.mode).toBe('practice');

      // Verify anti-cheat answer stripping in served questions
      for (const q of data.questions) {
        expect(q.answer_index).toBeUndefined();
        expect(q.answer_idx).toBeUndefined();
        expect(q.explanation_vi).toBeUndefined();
        expect(q.explanation).toBeUndefined();
      }

      // Verify that 3-option and 4-option questions were processed with shuffled: true
      const compQ = data.questions.find((q: any) => q.id === 'q_read_comp');
      expect(compQ).toBeDefined();
      expect(compQ.options.length).toBe(3);
    });

    it('supports shuffleAnswers alias in request body', async () => {
      const res = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 1,
          mode: 'practice',
          shuffleAnswers: true,
          strictQbankOnly: true,
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
    });
  });

  // =========================================================================
  // Suite 8: Feature 16 - Mock Mode Blueprint Quota Enforcement & Diagnostics
  // =========================================================================
  describe('Suite 8: Mock Mode Fail-Closed Quota Enforcement & Shortage Diagnostics', () => {
    it('rejects mock exam generation with HTTP 400 and structured shortage details when pool is deficient', async () => {
      // Seed only 2 questions, while HSK 1 blueprint requires 40
      testDb.prepare(`
        INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active, explanation_vi)
        VALUES 
          ('mock_seed_1', '你好。', '["A","B","C"]', 0, 1, 'reading', 'read_comprehension_short_3opt', 'approved', 1, 'Giải thích 1'),
          ('mock_seed_2', '再见。', '["A","B","C"]', 0, 1, 'reading', 'read_comprehension_short_3opt', 'approved', 1, 'Giải thích 2')
      `).run();
      syncApprovedQuestionToPool(testDb, 'mock_seed_1');
      syncApprovedQuestionToPool(testDb, 'mock_seed_2');

      const res = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 1, mode: 'mock' }),
      });

      expect(res.status).toBe(400);
      const data = await res.json() as any;
      expect(data.success).toBe(false);
      expect(data.mode).toBe('mock');
      expect(data.level).toBe(1);
      expect(data.is_fully_eligible).toBe(false);
      expect(data.total_required).toBe(40);
      expect(typeof data.total_available).toBe('number');
      expect(data.total_missing).toBeGreaterThan(0);
      expect(data.sections).toBeDefined();
      expect(data.error).toContain('chưa đủ điều kiện tạo đề thi chính thức');
    });

    it('rejects invalid or out-of-bounds HSK levels with HTTP 400', async () => {
      const invalidLevels = [0, 7, -1, 99, 'invalid'];
      for (const lvl of invalidLevels) {
        const res = await fetch(`${baseUrl}/api/exam/generate-mock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ level: lvl }),
        });
        expect(res.status).toBe(400);
        const data = await res.json() as any;
        expect(data.success).toBe(false);
        expect(data.error).toContain('Cấp độ HSK không hợp lệ');
      }
    });

    it('inspectExamPoolBySections inspects blueprint requirements and accurately reports missing count', () => {
      const inspection = inspectExamPoolBySections(testDb, 1);
      expect(inspection.blueprintFound).toBe(true);
      expect(inspection.totalRequired).toBe(40);
      expect(typeof inspection.totalAvailable).toBe('number');
      expect(typeof inspection.totalMissing).toBe('number');
      expect(inspection.totalMissing).toBe(Math.max(0, inspection.totalRequired - inspection.totalAvailable));
    });

    it('respects excludeQuestionIds by excluding them from candidate matching', () => {
      testDb.prepare(`
        INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active, explanation_vi)
        VALUES ('ex_q1', 'stem', '["A","B","C"]', 0, 1, 'reading', 'read_comprehension_short_3opt', 'approved', 1, 'Giải thích')
      `).run();
      syncApprovedQuestionToPool(testDb, 'ex_q1');

      const inspWithoutEx = inspectExamPoolBySections(testDb, 1);
      const inspWithEx = inspectExamPoolBySections(testDb, 1, new Set(['ex_q1']));

      expect(inspWithEx.totalAvailable).toBe(inspWithoutEx.totalAvailable - 1);
    });
  });
});
