/**
 * Milestone M1: Phase 5 Admin Review Queue & Inline Operations Test Suite
 *
 * Verifies R1 & Acceptance Criteria 1, 2, 3:
 * 1. formatPendingRow unit checks:
 *    - Structured distractor rationales parsed from explanation_vi.
 *    - Deterministic validation checks: character noise (Latin / Vietnamese in Chinese),
 *      duplicate options, answer_idx in bounds, empty stem/options.
 * 2. GET /api/qbank/pending API checks:
 *    - Filters by part_type (exact match, 'all').
 *    - Queries status = 'disabled'.
 *    - Attaches validation_diagnostics, distractor_rationales, has_distractor_rationales.
 * 3. Approving a question (single & batch):
 *    - Updates status to 'approved'.
 *    - Upserts into exam_eligible_pool with practice_eligible = 1.
 * 4. Rejecting a question (single & batch):
 *    - Updates status to 'rejected'.
 *    - Deletes from exam_eligible_pool.
 * 5. Disabling a question (single & batch):
 *    - Updates status to 'disabled' (is_active = 0).
 *    - Deletes from exam_eligible_pool.
 *    - Retrievable via GET /api/qbank/pending?status=disabled.
 * 6. System safety: data/hsk_exam.db SHA-256 strictly preserved.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import express, { Express } from 'express';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import {
  qbankRouter,
  formatPendingRow,
  ensurePendingSchema,
  computeContentHash,
  setDbSyncForTesting,
  setQBankAdminTokenForTesting,
} from '../src/server/qbankRoutes.js';
import { ensureEligiblePoolSchema } from '../src/server/qbankFormatSync.js';

const EXPECTED_HSK_EXAM_DB_HASH = 'DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1';
const HSK_EXAM_DB_PATH = path.resolve(process.cwd(), 'data/hsk_exam.db');

function getSha256(filePath: string): string {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buf).digest('hex').toUpperCase();
}

describe('Milestone M1: Admin Review Queue & Operations (R1, AC 1–3)', () => {
  let server: http.Server | null = null;
  let baseUrl: string = '';
  let testDb: DatabaseSync;
  const originalEnvToken = process.env.QBANK_ADMIN_TOKEN;
  const testAdminToken = crypto.randomBytes(32).toString('hex'); // 64 hex characters

  beforeAll(async () => {
    // Verify database hash invariant at start
    expect(fs.existsSync(HSK_EXAM_DB_PATH)).toBe(true);
    expect(getSha256(HSK_EXAM_DB_PATH)).toBe(EXPECTED_HSK_EXAM_DB_HASH);
  });

  afterAll(() => {
    if (originalEnvToken !== undefined) {
      process.env.QBANK_ADMIN_TOKEN = originalEnvToken;
    } else {
      delete process.env.QBANK_ADMIN_TOKEN;
    }
    setQBankAdminTokenForTesting(null);
    setDbSyncForTesting(null);

    // Verify database hash invariant at end
    expect(getSha256(HSK_EXAM_DB_PATH)).toBe(EXPECTED_HSK_EXAM_DB_HASH);
  });

  beforeEach(async () => {
    // Isolated in-memory database for complete safety
    testDb = new DatabaseSync(':memory:');
    ensurePendingSchema(testDb);
    ensureEligiblePoolSchema(testDb);
    setDbSyncForTesting(testDb);

    process.env.QBANK_ADMIN_TOKEN = testAdminToken;
    setQBankAdminTokenForTesting(testAdminToken);

    // Setup express app with test server
    const app: Express = express();
    app.use(express.json());
    app.use('/api/qbank', qbankRouter);

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
  });

  // Helper for authenticated requests
  const authHeaders = () => ({
    'Authorization': `Bearer ${testAdminToken}`,
    'Content-Type': 'application/json',
  });

  // Helper to insert sample pending question into testDb
  const insertPendingRow = (overrides: Partial<any> = {}) => {
    const id = overrides.id || `test_pend_${crypto.randomBytes(4).toString('hex')}`;
    const stem = overrides.stem || `我想去看______ (${id})。`;
    const options = overrides.options || ['电影', '电视', '电脑', '电话'];
    const answerIdx = overrides.answer_idx !== undefined ? overrides.answer_idx : 0;
    const explanationVi =
      overrides.explanation_vi ||
      "Câu này cần một danh từ chỉ hình thức giải trí đi cùng '看'.\n+ Phương án A (电影): Rạp chiếu phim / phim, hoàn toàn phù hợp.\n+ Phương án B (电视): Xem TV cũng được nhưng không hay bằng đi xem phim.\n+ Phương án C (电脑): Máy tính không phải mục đích của câu.\n+ Phương án D (电话): Điện thoại không dùng với 看 trong ngữ cảnh này.";
    const level = overrides.level || 1;
    const skill = overrides.skill || 'reading';
    const partType = overrides.part_type || 'read_fill_blank_4opt';
    const status = overrides.status || 'pending';
    const hash = overrides.content_hash || `${computeContentHash(stem, options, answerIdx)}_${id}`;

    testDb.prepare(`
      INSERT INTO pending_questions (
        id, batch_id, stem, options, answer_idx, pinyin, explanation_vi, level, skill, part_type, status, content_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      overrides.batch_id || 'batch_test_01',
      stem,
      JSON.stringify(options),
      answerIdx,
      overrides.pinyin || 'wǒ xiǎng qù kàn ______',
      explanationVi,
      level,
      skill,
      partType,
      status,
      hash
    );

    return id;
  };

  // =========================================================================
  // 1. UNIT TESTS: formatPendingRow
  // =========================================================================
  describe('1. formatPendingRow Unit Tests', () => {
    it('parses structured distractor rationales and returns distractor_rationales array', () => {
      const row = {
        id: 'q_unit_01',
        stem: '明天天气______。',
        options: JSON.stringify(['很好', '很高', '很大', '很多']),
        answer_idx: 0,
        explanation_vi:
          'Giải thích ngữ cảnh thời tiết.\n+ Phương án A (很好): Thời tiết rất tốt, dùng đúng ngữ pháp.\n+ Phương án B (很高): Cao không dùng cho thời tiết.\n+ Phương án C (很大): Lớn chỉ dùng cho gió hoặc mưa to.\n+ Phương án D (很多): Nhiều không bổ nghĩa cho thời tiết.',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };

      const result = formatPendingRow(row);
      expect(result.distractor_rationales).toBeDefined();
      expect(result.distractor_rationales.length).toBeGreaterThanOrEqual(3);
      expect(result.has_distractor_rationales).toBe(true);

      const optA = result.distractor_rationales.find((d: any) => d.optionIdx === 0);
      expect(optA).toBeDefined();
      expect(optA?.isCorrect).toBe(true);

      const optB = result.distractor_rationales.find((d: any) => d.optionIdx === 1);
      expect(optB).toBeDefined();
      expect(optB?.isCorrect).toBe(false);
      expect(optB?.rationaleVi).toContain('Cao không dùng cho thời tiết');
    });

    it('preserves picture-choice scene keys in review API rows', () => {
      const result = formatPendingRow({
        id: 'q_unit_picture_options',
        stem: '他正在做什么？',
        options: JSON.stringify(['看书', '吃饭', '睡觉']),
        options_images: JSON.stringify(['reading', 'eating', 'sleeping']),
        answer_idx: 0,
        explanation_vi: 'Người này đang đọc sách.',
        level: 1,
        skill: 'listening',
        part_type: 'listen_picture_match_3opt',
      });

      expect(result.options_images).toEqual(['reading', 'eating', 'sleeping']);
    });

    it('detects character noise (Latin in Chinese stem/options) as warnings', () => {
      const row = {
        id: 'q_unit_noise_latin',
        stem: '我想去 school 看书。', // contains 'school'
        options: JSON.stringify(['图书馆', '电影院', 'park', '学校']), // contains 'park'
        answer_idx: 0,
        explanation_vi: 'Giải thích câu hỏi',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };

      const result = formatPendingRow(row);
      expect(result.validation_diagnostics.warnings).toContain(
        'Phát hiện ký tự Latin trong nội dung câu hỏi hoặc phương án'
      );
      // Valid is true because character noise is a non-fatal warning
      expect(result.validation_diagnostics.valid).toBe(true);
    });

    it('detects character noise (Vietnamese diacritics in Chinese stem) as warnings', () => {
      const row = {
        id: 'q_unit_noise_vi',
        stem: '这是我的 em gái。', // Vietnamese accent 'á' in stem
        options: JSON.stringify(['弟弟', '哥哥', '爸爸', '妈妈']),
        answer_idx: 0,
        explanation_vi: 'Giải thích câu hỏi',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };

      const result = formatPendingRow(row);
      expect(result.validation_diagnostics.warnings).toContain(
        'Phát hiện ký tự tiếng Việt trong nội dung chữ Hán'
      );
    });

    it('detects duplicate options as fatal validation errors', () => {
      const row = {
        id: 'q_unit_dup_opt',
        stem: '这是一个测试。',
        options: JSON.stringify(['苹果', '香蕉', '苹果', '西瓜']), // duplicate '苹果'
        answer_idx: 0,
        explanation_vi: 'Giải thích',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };

      const result = formatPendingRow(row);
      expect(result.validation_diagnostics.valid).toBe(false);
      expect(result.validation_diagnostics.errors.some((e: string) => e.includes('trùng lặp'))).toBe(true);
    });

    it('detects out-of-bounds answer_idx as fatal validation error', () => {
      const row = {
        id: 'q_unit_oob_idx',
        stem: '这是一个测试。',
        options: JSON.stringify(['A', 'B', 'C', 'D']),
        answer_idx: 5, // out of range 0..3
        explanation_vi: 'Giải thích',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };

      const result = formatPendingRow(row);
      expect(result.validation_diagnostics.valid).toBe(false);
      expect(result.validation_diagnostics.errors.some((e: string) => e.includes('Chỉ số đáp án'))).toBe(true);
    });

    it('returns clean validation diagnostics for compliant Chinese question', () => {
      const row = {
        id: 'q_unit_clean',
        stem: '今天天气很好。',
        options: JSON.stringify(['很好', '很高', '很大', '很多']),
        answer_idx: 0,
        explanation_vi: 'Giải thích hợp lệ',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };

      const result = formatPendingRow(row);
      expect(result.validation_diagnostics.valid).toBe(true);
      expect(result.validation_diagnostics.errors).toHaveLength(0);
      expect(result.validation_diagnostics.warnings).toHaveLength(0);
    });
  });

  // =========================================================================
  // 2. INTEGRATION TESTS: GET /api/qbank/pending with Filters
  // =========================================================================
  describe('2. GET /api/qbank/pending Filtering & Diagnostics Attachment', () => {
    beforeEach(() => {
      // Seed 4 questions: different part_types and statuses
      insertPendingRow({
        id: 'q_fill_blank_1',
        part_type: 'read_fill_blank_4opt',
        status: 'pending',
        level: 1,
        skill: 'reading',
      });
      insertPendingRow({
        id: 'q_comprehension_1',
        part_type: 'read_comprehension_4opt',
        status: 'pending',
        level: 1,
        skill: 'reading',
      });
      insertPendingRow({
        id: 'q_disabled_1',
        part_type: 'read_fill_blank_4opt',
        status: 'disabled',
        level: 1,
        skill: 'reading',
      });
      insertPendingRow({
        id: 'q_approved_1',
        part_type: 'read_fill_blank_4opt',
        status: 'approved',
        level: 1,
        skill: 'reading',
      });
    });

    it('defaults to status="pending" and returns only pending questions', async () => {
      const res = await fetch(`${baseUrl}/api/qbank/pending`, {
        headers: authHeaders(),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.total).toBe(2);
      expect(data.questions.every((q: any) => q.status === 'pending')).toBe(true);
    });

    it('filters strictly by part_type when provided and not "all"', async () => {
      const res = await fetch(`${baseUrl}/api/qbank/pending?part_type=read_comprehension_4opt`, {
        headers: authHeaders(),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.total).toBe(1);
      expect(data.questions[0].id).toBe('q_comprehension_1');
      expect(data.questions[0].part_type).toBe('read_comprehension_4opt');
    });

    it('returns all matching part_types when part_type="all"', async () => {
      const res = await fetch(`${baseUrl}/api/qbank/pending?part_type=all`, {
        headers: authHeaders(),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.total).toBe(2);
    });

    it('queries and returns questions with status="disabled"', async () => {
      const res = await fetch(`${baseUrl}/api/qbank/pending?status=disabled`, {
        headers: authHeaders(),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.total).toBe(1);
      expect(data.questions[0].id).toBe('q_disabled_1');
      expect(data.questions[0].status).toBe('disabled');
    });

    it('attaches validation_diagnostics and distractor_rationales to each item', async () => {
      const res = await fetch(`${baseUrl}/api/qbank/pending?status=all`, {
        headers: authHeaders(),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.questions.length).toBeGreaterThan(0);

      for (const q of data.questions) {
        expect(q.validation_diagnostics).toBeDefined();
        expect(typeof q.validation_diagnostics.valid).toBe('boolean');
        expect(Array.isArray(q.validation_diagnostics.warnings)).toBe(true);
        expect(Array.isArray(q.validation_diagnostics.errors)).toBe(true);
        expect(Array.isArray(q.distractor_rationales)).toBe(true);
        expect(typeof q.has_distractor_rationales).toBe('boolean');
      }
    });
  });

  // =========================================================================
  // 3. APPROVAL FLOW: Updates status & Upserts into exam_eligible_pool
  // =========================================================================
  describe('3. POST /api/qbank/pending/approve & exam_eligible_pool Sync', () => {
    it('approves a single question, updates status="approved", and syncs practice_eligible=1', async () => {
      const qId = insertPendingRow({
        id: 'q_approve_target_1',
        stem: '我想买一个______。',
        options: ['苹果', '香蕉', '杯子', '书'],
        answer_idx: 0,
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
        status: 'pending',
      });

      // Verify not yet in exam_eligible_pool
      const beforePool = testDb.prepare('SELECT * FROM exam_eligible_pool WHERE question_id = ?').get(qId);
      expect(beforePool).toBeUndefined();

      // Execute approval
      const res = await fetch(`${baseUrl}/api/qbank/pending/approve`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ id: qId }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.approved_count).toBe(1);
      expect(data.approved_ids).toContain(qId);

      // Verify pending_questions row updated to status='approved'
      const pendingRow: any = testDb.prepare('SELECT status FROM pending_questions WHERE id = ?').get(qId);
      expect(pendingRow.status).toBe('approved');

      // Verify questions table upserted
      const questionsRow: any = testDb.prepare('SELECT status, is_active FROM questions WHERE id = ?').get(qId);
      expect(questionsRow.status).toBe('approved');
      expect(questionsRow.is_active).toBe(1);

      // Verify exam_eligible_pool table upserted with practice_eligible=1
      const poolRow: any = testDb.prepare('SELECT * FROM exam_eligible_pool WHERE question_id = ?').get(qId);
      expect(poolRow).toBeDefined();
      expect(poolRow.question_id).toBe(qId);
      expect(poolRow.practice_eligible).toBe(1);
    });

    it('approves a batch of questions atomically and syncs all to exam_eligible_pool', async () => {
      const id1 = insertPendingRow({ id: 'q_batch_app_1' });
      const id2 = insertPendingRow({ id: 'q_batch_app_2' });

      const res = await fetch(`${baseUrl}/api/qbank/pending/approve`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ ids: [id1, id2] }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.approved_count).toBe(2);

      for (const id of [id1, id2]) {
        const poolRow: any = testDb.prepare('SELECT * FROM exam_eligible_pool WHERE question_id = ?').get(id);
        expect(poolRow).toBeDefined();
        expect(poolRow.practice_eligible).toBe(1);
      }
    });
  });

  // =========================================================================
  // 4. REJECTION FLOW: Updates status & Deletes from exam_eligible_pool
  // =========================================================================
  describe('4. POST /api/qbank/pending/reject & exam_eligible_pool Deletion', () => {
    it('rejects a question, updates status="rejected", and removes it from exam_eligible_pool', async () => {
      // 1. First insert and approve a question so it enters the pool
      const qId = insertPendingRow({ id: 'q_reject_target_1' });
      await fetch(`${baseUrl}/api/qbank/pending/approve`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ id: qId }),
      });

      // Confirm in pool
      expect(testDb.prepare('SELECT * FROM exam_eligible_pool WHERE question_id = ?').get(qId)).toBeDefined();

      // 2. Reject the question
      const res = await fetch(`${baseUrl}/api/qbank/pending/reject`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          id: qId,
          rejection_note: 'Phát hiện câu trả lời không chuẩn xác',
        }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.rejected_count).toBe(1);

      // Verify pending_questions row updated
      const pendingRow: any = testDb.prepare('SELECT status, rejection_note FROM pending_questions WHERE id = ?').get(qId);
      expect(pendingRow.status).toBe('rejected');
      expect(pendingRow.rejection_note).toBe('Phát hiện câu trả lời không chuẩn xác');

      // Verify deleted from questions table
      expect(testDb.prepare('SELECT * FROM questions WHERE id = ?').get(qId)).toBeUndefined();

      // Verify deleted from exam_eligible_pool
      expect(testDb.prepare('SELECT * FROM exam_eligible_pool WHERE question_id = ?').get(qId)).toBeUndefined();
    });

    it('rejects a batch of questions and purges all from exam_eligible_pool', async () => {
      const id1 = insertPendingRow({ id: 'q_batch_rej_1' });
      const id2 = insertPendingRow({ id: 'q_batch_rej_2' });

      // Approve both first
      await fetch(`${baseUrl}/api/qbank/pending/approve`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ ids: [id1, id2] }),
      });

      // Reject both
      const res = await fetch(`${baseUrl}/api/qbank/pending/reject`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ ids: [id1, id2], rejection_note: 'Từ chối hàng loạt' }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.rejected_count).toBe(2);

      for (const id of [id1, id2]) {
        expect(testDb.prepare('SELECT * FROM exam_eligible_pool WHERE question_id = ?').get(id)).toBeUndefined();
        const pRow: any = testDb.prepare('SELECT status FROM pending_questions WHERE id = ?').get(id);
        expect(pRow.status).toBe('rejected');
      }
    });
  });

  // =========================================================================
  // 5. DISABLING FLOW: Updates status & Deletes from exam_eligible_pool
  // =========================================================================
  describe('5. Disabling Questions & exam_eligible_pool Deletion', () => {
    it('disables a single question via POST /api/qbank/questions/:id/disable and deletes from pool', async () => {
      const qId = insertPendingRow({ id: 'q_disable_single_1' });

      // Approve into pool
      await fetch(`${baseUrl}/api/qbank/pending/approve`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ id: qId }),
      });
      expect(testDb.prepare('SELECT * FROM exam_eligible_pool WHERE question_id = ?').get(qId)).toBeDefined();

      // Disable question
      const res = await fetch(`${baseUrl}/api/qbank/questions/${qId}/disable`, {
        method: 'POST',
        headers: authHeaders(),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.status).toBe('disabled');

      // Verify pending_questions row is disabled
      const pendingRow: any = testDb.prepare('SELECT status, is_active FROM pending_questions WHERE id = ?').get(qId);
      expect(pendingRow.status).toBe('disabled');
      expect(pendingRow.is_active).toBe(0);

      // Verify questions row is disabled and inactive
      const questionsRow: any = testDb.prepare('SELECT status, is_active FROM questions WHERE id = ?').get(qId);
      expect(questionsRow.status).toBe('disabled');
      expect(questionsRow.is_active).toBe(0);

      // Verify deleted from exam_eligible_pool
      expect(testDb.prepare('SELECT * FROM exam_eligible_pool WHERE question_id = ?').get(qId)).toBeUndefined();
    });

    it('batch disables questions via POST /api/qbank/pending/disable and deletes all from pool', async () => {
      const id1 = insertPendingRow({ id: 'q_batch_dis_1' });
      const id2 = insertPendingRow({ id: 'q_batch_dis_2' });

      // Approve both into pool
      await fetch(`${baseUrl}/api/qbank/pending/approve`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ ids: [id1, id2] }),
      });
      expect(testDb.prepare('SELECT * FROM exam_eligible_pool WHERE question_id = ?').get(id1)).toBeDefined();
      expect(testDb.prepare('SELECT * FROM exam_eligible_pool WHERE question_id = ?').get(id2)).toBeDefined();

      // Batch disable
      const res = await fetch(`${baseUrl}/api/qbank/pending/disable`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ ids: [id1, id2] }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.disabled_count).toBe(2);

      for (const id of [id1, id2]) {
        expect(testDb.prepare('SELECT * FROM exam_eligible_pool WHERE question_id = ?').get(id)).toBeUndefined();
        const pRow: any = testDb.prepare('SELECT status, is_active FROM pending_questions WHERE id = ?').get(id);
        expect(pRow.status).toBe('disabled');
        expect(pRow.is_active).toBe(0);
      }

      // Verify they can be retrieved via GET /api/qbank/pending?status=disabled
      const listRes = await fetch(`${baseUrl}/api/qbank/pending?status=disabled`, {
        headers: authHeaders(),
      });
      const listData = await listRes.json();
      expect(listData.success).toBe(true);
      const returnedIds = listData.questions.map((q: any) => q.id);
      expect(returnedIds).toContain(id1);
      expect(returnedIds).toContain(id2);
    });
  });

  // =========================================================================
  // 6. SYSTEM INVARIANT: data/hsk_exam.db Protection
  // =========================================================================
  describe('6. System Invariant & Database Safety', () => {
    it('strictly preserves the SHA-256 hash of data/hsk_exam.db without mutation', () => {
      const hash = getSha256(HSK_EXAM_DB_PATH);
      expect(hash).toBe(EXPECTED_HSK_EXAM_DB_HASH);
    });
  });
});
