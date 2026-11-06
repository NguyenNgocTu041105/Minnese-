/**
 * tests/phase9_post_approval_distribution.test.ts
 *
 * Phase 9 Verification Suite: Post-Approval Auto-Distribution & Blueprint Exam Assembly
 *
 * Verifies all requirements of Section XV.B and Section XV.C of ORIGINAL_REQUEST.md:
 * 1. Isolation: Pending/rejected/disabled questions are strictly blocked from serving.
 * 2. Dynamic Eligibility: syncApprovedQuestion dynamically evaluates practice_eligible and exam_eligible.
 * 3. Dual-Eligibility: Questions matching blueprint criteria serve both practice and mock routes.
 * 4. Zero Double Approval: A single approval action qualifies questions for both pools.
 * 5. Shortage Reporting: inspectExamPoolBySections returns HTTP 400 with structured deficit breakdown.
 * 6. Zero Silent Fallback: Official mock mode never blends or falls back to fixtures silently.
 * 7. Atomic Assembly: Preserves shared passage groups (HSK 5-6) and 6-word banks (HSK 1-4).
 * 8. Database Safety: data/hsk_exam.db hash invariant strictly maintained.
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
  ensurePendingSchema,
  computeContentHash,
  setDbSyncForTesting,
  setQBankAdminTokenForTesting,
} from '../src/server/qbankRoutes.js';
import {
  examRouter,
  loadApprovedQuestionsFromDb,
  setExamDbForTesting,
  clearAllSessionsForTesting,
  assembleBlueprintExamFromDb,
  ExamQuestionItem,
} from '../src/server/examRoutes.js';
import {
  ensureEligiblePoolSchema,
  syncApprovedQuestion,
  inspectExamPoolBySections,
  loadBlueprintData,
} from '../src/server/qbankFormatSync.js';

const EXPECTED_HSK_EXAM_DB_HASH = 'DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1';
const HSK_EXAM_DB_PATH = path.resolve(process.cwd(), 'data/hsk_exam.db');

function getSha256(filePath: string): string {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buf).digest('hex').toUpperCase();
}

describe('Phase 9: Post-Approval Auto-Distribution & Blueprint Exam Assembly Verification', () => {
  let server: http.Server | null = null;
  let baseUrl: string = '';
  let testDb: DatabaseSync;
  const originalEnvToken = process.env.QBANK_ADMIN_TOKEN;
  const testAdminToken = crypto.randomBytes(32).toString('hex');

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
    setQBankAdminTokenForTesting(null);
    setDbSyncForTesting(null);
    setExamDbForTesting(null);
    expect(getSha256(HSK_EXAM_DB_PATH)).toBe(EXPECTED_HSK_EXAM_DB_HASH);
  });

  beforeEach(async () => {
    // Isolated in-memory database
    testDb = new DatabaseSync(':memory:');
    ensurePendingSchema(testDb);
    ensureEligiblePoolSchema(testDb);
    testDb.exec(`
      CREATE TABLE IF NOT EXISTS exam_sessions (
        session_id TEXT PRIMARY KEY,
        level INTEGER NOT NULL,
        mode TEXT NOT NULL,
        skill TEXT,
        part_type TEXT,
        session_json TEXT NOT NULL,
        score_result_json TEXT,
        submission_id TEXT,
        status TEXT NOT NULL DEFAULT 'in_progress',
        created_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_exam_sessions_expires ON exam_sessions(expires_at);
    `);

    setDbSyncForTesting(testDb);
    setExamDbForTesting(testDb);
    clearAllSessionsForTesting();

    process.env.QBANK_ADMIN_TOKEN = testAdminToken;
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
    clearAllSessionsForTesting();
    setDbSyncForTesting(null);
    setExamDbForTesting(null);
    try {
      testDb.close();
    } catch {}
  });

  const authHeaders = () => ({
    'Authorization': `Bearer ${testAdminToken}`,
    'Content-Type': 'application/json',
  });

  const insertPendingRow = (overrides: Partial<any> = {}) => {
    const id = overrides.id || `p_${crypto.randomBytes(4).toString('hex')}`;
    const stem = overrides.stem || `测试题干内容 (${id})。`;
    const options = overrides.options || ['选项A', '选项B', '选项C', '选项D'];
    const answerIdx = overrides.answer_idx !== undefined ? overrides.answer_idx : 0;
    const level = overrides.level || 1;
    const skill = overrides.skill || 'reading';
    const partType = overrides.part_type || 'read_fill_blank_4opt';
    const status = overrides.status || 'pending';
    const hash = overrides.content_hash || `${computeContentHash(stem, options, answerIdx)}_${id}`;

    testDb.prepare(`
      INSERT INTO pending_questions (
        id, batch_id, stem, options, answer_idx, pinyin, explanation_vi, level, skill, part_type, illustration_theme, status, content_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      overrides.batch_id || 'b_test_01',
      stem,
      JSON.stringify(options),
      answerIdx,
      overrides.pinyin || 'cèshì',
      overrides.explanation_vi || 'Giải thích chi tiết phương án.',
      level,
      skill,
      partType,
      overrides.illustration_theme || null,
      status,
      hash
    );

    return id;
  };

  // Helper to approve pending question via API
  const approveQuestionViaApi = async (id: string) => {
    const res = await fetch(`${baseUrl}/api/qbank/pending/approve`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ id }),
    });
    return { status: res.status, json: await res.json() };
  };

  // =========================================================================
  // SUITE 1: ISOLATION & BLOCKING OF PENDING, REJECTED, DISABLED QUESTIONS
  // =========================================================================
  describe('Suite 1: Serving Isolation (Section XV.B - Criterion 1)', () => {
    it('1.1 pending questions are strictly excluded from GET /api/exam/practice', async () => {
      insertPendingRow({ id: 'pend_q1', level: 1, skill: 'reading', status: 'pending' });

      const res = await fetch(`${baseUrl}/api/exam/practice?level=1&skill=reading`);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.questions.some((q: any) => q.id === 'pend_q1')).toBe(false);
    });

    it('1.2 pending questions are strictly excluded from POST /api/exam/generate-mock', async () => {
      insertPendingRow({ id: 'pend_q2', level: 1, skill: 'reading', status: 'pending' });

      const res = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 1, mode: 'practice', skill: 'reading' }),
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.session.questions.some((q: any) => q.id === 'pend_q2')).toBe(false);
    });

    it('1.3 rejected questions are strictly excluded from both practice and mock routes', async () => {
      insertPendingRow({ id: 'rej_q1', level: 1, skill: 'reading', status: 'rejected' });

      const practiceRows = loadApprovedQuestionsFromDb(1, { mode: 'practice', skill: 'reading' });
      expect(practiceRows.some((q) => q.id === 'rej_q1')).toBe(false);

      const mockRows = loadApprovedQuestionsFromDb(1, { mode: 'mock', skill: 'reading' });
      expect(mockRows.some((q) => q.id === 'rej_q1')).toBe(false);
    });

    it('1.4 disabled questions (status=approved, is_active=0) are excluded from serving', async () => {
      // Insert approved question then disable it
      const qId = insertPendingRow({ id: 'dis_q1', level: 1, skill: 'reading' });
      await approveQuestionViaApi(qId);

      // Disable it
      testDb.prepare("UPDATE questions SET is_active = 0 WHERE id = ?").run(qId);
      testDb.prepare("DELETE FROM exam_eligible_pool WHERE question_id = ?").run(qId);

      const practiceRows = loadApprovedQuestionsFromDb(1, { mode: 'practice' });
      expect(practiceRows.some((q) => q.id === qId)).toBe(false);
    });

    it('1.5 loadApprovedQuestionsFromDb SQL query guarantees zero row leakage for non-approved', () => {
      insertPendingRow({ id: 'raw_p', status: 'pending' });
      insertPendingRow({ id: 'raw_r', status: 'rejected' });

      const res = loadApprovedQuestionsFromDb(1, { mode: 'practice' });
      expect(res.filter((q) => q.id === 'raw_p' || q.id === 'raw_r')).toHaveLength(0);
    });
  });

  // =========================================================================
  // SUITE 2: DYNAMIC ELIGIBILITY EVALUATION UPON APPROVAL (AC 2)
  // =========================================================================
  describe('Suite 2: Dynamic Eligibility Evaluation (Section XV.B - Criterion 2)', () => {
    it('2.1 approving standard 4-option MCQ yields practice=1, exam=0 with accurate deficit reason', async () => {
      const qId = insertPendingRow({
        id: 'hsk1_4opt_q',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
        options: ['苹果', '香蕉', '杯子', '书'],
        answer_idx: 0,
      });

      const { status, json } = await approveQuestionViaApi(qId);
      expect(status).toBe(200);
      expect(json.success).toBe(true);

      const poolRow: any = testDb.prepare('SELECT * FROM exam_eligible_pool WHERE question_id = ?').get(qId);
      expect(poolRow).toBeDefined();
      expect(poolRow.practice_eligible).toBe(1);
      expect(poolRow.exam_eligible).toBe(0);

      const reasons = JSON.parse(poolRow.ineligible_reasons);
      expect(reasons.length).toBeGreaterThan(0);
      expect(reasons.some((r: string) => r.includes('yêu cầu chính xác 6 phương án'))).toBe(true);
    });

    it('2.2 approving blueprint-matching 3-option reading yields practice=1, exam=1', async () => {
      const qId = insertPendingRow({
        id: 'hsk1_3opt_reading',
        level: 1,
        skill: 'reading',
        part_type: 'read_comprehension_short_3opt',
        stem: '他在医院工作，他是一名医生。★ 他是做什么的？',
        options: ['老师', '医生', '司机'],
        answer_idx: 1,
      });

      const { status, json } = await approveQuestionViaApi(qId);
      expect(status).toBe(200);
      expect(json.success).toBe(true);

      const poolRow: any = testDb.prepare('SELECT * FROM exam_eligible_pool WHERE question_id = ?').get(qId);
      expect(poolRow.practice_eligible).toBe(1);
      expect(poolRow.exam_eligible).toBe(1);
      expect(JSON.parse(poolRow.ineligible_reasons)).toEqual([]);

      const compFormats = JSON.parse(poolRow.compatible_formats);
      expect(compFormats).toContain('hsk1_official_mock:reading:reading_4');
    });

    it('2.3 approving blueprint-matching 6-word bank reading yields practice=1, exam=1', async () => {
      const qId = insertPendingRow({
        id: 'hsk1_6opt_wordbank',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_word_bank_6opt',
        stem: '他去商店买了一只大____。',
        options: ['苹果', '医院', '学校', '高兴', '看书', '明天'],
        answer_idx: 0,
      });

      await approveQuestionViaApi(qId);

      const poolRow: any = testDb.prepare('SELECT * FROM exam_eligible_pool WHERE question_id = ?').get(qId);
      expect(poolRow.practice_eligible).toBe(1);
      expect(poolRow.exam_eligible).toBe(1);
      expect(JSON.parse(poolRow.ineligible_reasons)).toEqual([]);
    });

    it('2.4 approving 3-option listening with audio & illustration yields practice=1, exam=1', async () => {
      testDb.prepare(`
        INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, illustration_theme, status, is_active, explanation_vi)
        VALUES ('hsk1_listen_valid_direct', '男：这是什么？女：这是书。', '["A","B","C"]', 0, 1, 'listening', 'listen_picture_match_3opt', 'hospital', 'approved', 1, 'Exp')
      `).run();

      const syncRes = syncApprovedQuestion('hsk1_listen_valid_direct', testDb);
      expect(syncRes?.practice_eligible).toBe(true);
      expect(syncRes?.exam_eligible).toBe(true);
    });

    it('2.5 approving 3-option listening lacking audio yields exam=0 with audio reason', () => {
      testDb.prepare(`
        INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, illustration_theme, status, is_active, explanation_vi)
        VALUES ('hsk1_listen_no_audio', '无音频听力题干', '["A","B","C"]', 0, 1, 'listening', 'listen_picture_match_3opt', 'school', 'approved', 1, 'Exp')
      `).run();

      const syncRes = syncApprovedQuestion('hsk1_listen_no_audio', testDb);
      expect(syncRes?.practice_eligible).toBe(true);
      expect(syncRes?.exam_eligible).toBe(false);
      expect(syncRes?.ineligible_reasons.some((r) => r.includes('audio_text'))).toBe(true);
    });

    it('2.6 approving visual question lacking valid illustration yields exam=0 with theme reason', () => {
      testDb.prepare(`
        INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, illustration_theme, status, is_active, explanation_vi)
        VALUES ('hsk1_visual_no_theme', '男：这是什么？女：这是书。', '["A","B","C"]', 0, 1, 'listening', 'listen_picture_match_3opt', 'invalid_theme_xyz', 'approved', 1, 'Exp')
      `).run();

      const syncRes = syncApprovedQuestion('hsk1_visual_no_theme', testDb);
      expect(syncRes?.practice_eligible).toBe(true);
      expect(syncRes?.exam_eligible).toBe(false);
      expect(syncRes?.ineligible_reasons.some((r) => r.includes('hình minh họa SVG'))).toBe(true);
    });

    it('2.7 approving HSK 4 writing task (0 options, valid theme) yields dual eligibility', () => {
      testDb.prepare(`
        INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, illustration_theme, status, is_active, explanation_vi)
        VALUES ('hsk4_write_1', '提供词语：乒乓球。观察图片并造句。', '[]', 0, 4, 'writing', 'write_sentence_from_picture_word', 'soccer', 'approved', 1, 'Exp')
      `).run();

      const syncRes = syncApprovedQuestion('hsk4_write_1', testDb);
      expect(syncRes?.practice_eligible).toBe(true);
      expect(syncRes?.exam_eligible).toBe(true);
    });

    it('2.8 approving HSK 6 question with mismatched part_type yields exam=0 with unmapped reason', () => {
      testDb.prepare(`
        INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active, explanation_vi)
        VALUES ('hsk6_mismatch', '在现代化进程中传统文化面临着前所未有的____。', '["挑战","机敏","粗糙","单调"]', 0, 6, 'reading', 'read_dialogue_matching_3opt', 'approved', 1, 'Exp')
      `).run();

      const syncRes = syncApprovedQuestion('hsk6_mismatch', testDb);
      expect(syncRes?.practice_eligible).toBe(true);
      expect(syncRes?.exam_eligible).toBe(false);
      expect(syncRes?.ineligible_reasons.some((r) => r.includes('không thuộc bất kỳ phần nào trong blueprint HSK 6'))).toBe(true);
    });
  });

  // =========================================================================
  // SUITE 3: DUAL-ELIGIBILITY SERVING & ZERO RE-APPROVAL (AC 3 & 5)
  // =========================================================================
  describe('Suite 3: Dual Serving & Zero Re-Approval (Section XV.B - Criterion 3 & 5)', () => {
    it('3.1 dual-eligible question serves practice route immediately without second approval', async () => {
      const qId = insertPendingRow({
        id: 'dual_q_reading',
        level: 1,
        skill: 'reading',
        part_type: 'read_comprehension_short_3opt',
        options: ['A', 'B', 'C'],
        answer_idx: 0,
      });

      await approveQuestionViaApi(qId);

      // Verify immediate accessibility via practice endpoint
      const res = await fetch(`${baseUrl}/api/exam/practice?level=1&skill=reading`);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.questions.some((q: any) => q.id === qId)).toBe(true);
    });

    it('3.2 exact same question ID is simultaneously servable in mock pool', async () => {
      const qId = insertPendingRow({
        id: 'dual_q_reading_2',
        level: 1,
        skill: 'reading',
        part_type: 'read_comprehension_short_3opt',
        options: ['A', 'B', 'C'],
        answer_idx: 0,
      });

      await approveQuestionViaApi(qId);

      // Query mock pool for level 1
      const mockQs = loadApprovedQuestionsFromDb(1, { mode: 'mock' });
      expect(mockQs.some((q) => q.id === qId)).toBe(true);
    });

    it('3.3 single approval action satisfies both pools (no re-approval required)', async () => {
      const qId = insertPendingRow({
        id: 'dual_q_reading_3',
        level: 1,
        skill: 'reading',
        part_type: 'read_comprehension_short_3opt',
        options: ['A', 'B', 'C'],
        answer_idx: 0,
      });

      await approveQuestionViaApi(qId);

      const pendingRow: any = testDb.prepare('SELECT status FROM pending_questions WHERE id = ?').get(qId);
      expect(pendingRow.status).toBe('approved');

      const poolRow: any = testDb.prepare('SELECT practice_eligible, exam_eligible FROM exam_eligible_pool WHERE question_id = ?').get(qId);
      expect(poolRow.practice_eligible).toBe(1);
      expect(poolRow.exam_eligible).toBe(1);
    });

    it('3.4 practice-only question is servable by /practice but strictly excluded from /generate-mock', async () => {
      const qId = insertPendingRow({
        id: 'prac_only_q',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt', // 4-opt in HSK 1 Reading -> practice only
        options: ['A', 'B', 'C', 'D'],
        answer_idx: 0,
      });

      await approveQuestionViaApi(qId);

      const practiceQs = loadApprovedQuestionsFromDb(1, { mode: 'practice' });
      expect(practiceQs.some((q) => q.id === qId)).toBe(true);

      const mockQs = loadApprovedQuestionsFromDb(1, { mode: 'mock' });
      expect(mockQs.some((q) => q.id === qId)).toBe(false);
    });

    it('3.5 calling syncApprovedQuestion repeatedly is idempotent and does not duplicate or alter state', async () => {
      const qId = insertPendingRow({
        id: 'dual_q_reading_5',
        level: 1,
        skill: 'reading',
        part_type: 'read_comprehension_short_3opt',
        options: ['A', 'B', 'C'],
        answer_idx: 0,
      });

      await approveQuestionViaApi(qId);

      const res1 = syncApprovedQuestion(qId, testDb);
      const res2 = syncApprovedQuestion(qId, testDb);

      expect(res1).toEqual(res2);
      const countRow: any = testDb.prepare('SELECT COUNT(*) as cnt FROM exam_eligible_pool WHERE question_id = ?').get(qId);
      expect(countRow.cnt).toBe(1);
    });
  });

  // =========================================================================
  // SUITE 4: LIFECYCLE INVARIANTS: REJECTION AND DISABLING CLEANUP
  // =========================================================================
  describe('Suite 4: Rejection and Disabling Pool Cleanup', () => {
    it('4.1 rejecting an approved question purges it from questions and eligible pool', async () => {
      const qId = insertPendingRow({ id: 'target_reject', level: 1, skill: 'reading' });
      await approveQuestionViaApi(qId);

      // Confirm in pool
      expect(testDb.prepare('SELECT * FROM exam_eligible_pool WHERE question_id = ?').get(qId)).toBeDefined();

      // Reject
      const res = await fetch(`${baseUrl}/api/qbank/pending/reject`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ id: qId, rejection_note: 'Bác bỏ câu hỏi' }),
      });
      expect(res.status).toBe(200);

      // Verify purged
      expect(testDb.prepare('SELECT * FROM questions WHERE id = ?').get(qId)).toBeUndefined();
      expect(testDb.prepare('SELECT * FROM exam_eligible_pool WHERE question_id = ?').get(qId)).toBeUndefined();

      // Inaccessible
      expect(loadApprovedQuestionsFromDb(1, { mode: 'practice' }).some((q) => q.id === qId)).toBe(false);
      expect(loadApprovedQuestionsFromDb(1, { mode: 'mock' }).some((q) => q.id === qId)).toBe(false);
    });

    it('4.2 disabling an approved question updates is_active=0 and purges from eligible pool', async () => {
      const qId = insertPendingRow({ id: 'target_disable', level: 1, skill: 'reading' });
      await approveQuestionViaApi(qId);

      // Disable
      const res = await fetch(`${baseUrl}/api/qbank/pending/disable`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ id: qId }),
      });
      expect(res.status).toBe(200);

      // Verify is_active=0 and purged from eligible pool
      const qRow: any = testDb.prepare('SELECT is_active FROM questions WHERE id = ?').get(qId);
      expect(qRow.is_active).toBe(0);
      expect(testDb.prepare('SELECT * FROM exam_eligible_pool WHERE question_id = ?').get(qId)).toBeUndefined();

      // Inaccessible
      expect(loadApprovedQuestionsFromDb(1, { mode: 'practice' }).some((q) => q.id === qId)).toBe(false);
    });
  });

  // =========================================================================
  // SUITE 5: BLUEPRINT EXAM ASSEMBLY & SHORTAGE REPORTING (SECTION XV.C)
  // =========================================================================
  describe('Suite 5: Blueprint Exam Assembly Integration (Section XV.C)', () => {
    it('5.1 rejects mock exam generation with HTTP 400 and structured shortage breakdown when pool is insufficient', async () => {
      const res = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 1, mode: 'mock' }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.mode).toBe('mock');
      expect(json.level).toBe(1);
      expect(json.is_fully_eligible).toBe(false);
      expect(typeof json.total_required).toBe('number');
      expect(typeof json.total_available).toBe('number');
      expect(typeof json.total_missing).toBe('number');
      expect(json.total_missing).toBeGreaterThan(0);
      expect(json.sections).toBeDefined();
      expect(json.sections.listening).toBeDefined();
      expect(json.sections.reading).toBeDefined();
      expect(json.error).toContain('chưa đủ điều kiện tạo đề thi chính thức');
    });

    it('5.2 zero silent fallback: mode=mock strictly rejects even with strict:false', async () => {
      const res = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 1, mode: 'mock', strict: false }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.questions).toBeUndefined();
    });

    it('5.3 allows fixture demo ONLY when explicitly requested with allowFixtures: true', async () => {
      const res = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 1, mode: 'mock', allowFixtures: true }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.dataSource).toBe('fixture');
      expect(json.usingFixtureFallback).toBe(true);
      expect(json.isFixtureDemo).toBe(true);
      expect(json.questions.length).toBe(40);
    });

    it('5.4 assembles HSK 5 shared-passage questions atomically without splitting', () => {
      const bp5 = loadBlueprintData(5);
      expect(bp5).toBeDefined();

      const candidateQuestions: ExamQuestionItem[] = [];

      // 1. Listening Part 1 (19 Qs) & Part 2 (16 Qs)
      for (let i = 1; i <= 19; i++) {
        candidateQuestions.push({
          id: `h5-L1-${i}`,
          level: 5,
          section: 'listening',
          part_type: 'listen_dialogue_qa_4opt',
          item_number: 0,
          stem: `L1-${i}`,
          options: ['A', 'B', 'C', 'D'],
          answer_index: 0,
          explanation_vi: 'Giải thích chi tiết.',
        });
      }
      for (let i = 1; i <= 16; i++) {
        candidateQuestions.push({
          id: `h5-L2-${i}`,
          level: 5,
          section: 'listening',
          part_type: 'listen_talks_qa_4opt',
          item_number: 0,
          stem: `L2-${i}`,
          options: ['A', 'B', 'C', 'D'],
          answer_index: 1,
          explanation_vi: 'Giải thích chi tiết.',
        });
      }

      // 2. Reading Part 1 (10 Qs) & Part 2 (10 Qs)
      for (let i = 1; i <= 10; i++) {
        candidateQuestions.push({
          id: `h5-R1-${i}`,
          level: 5,
          section: 'reading',
          part_type: 'read_cloze_passages_4opt',
          item_number: 0,
          stem: `R1-${i}`,
          options: ['A', 'B', 'C', 'D'],
          answer_index: 2,
          explanation_vi: 'Giải thích chi tiết.',
        });
      }
      for (let i = 1; i <= 10; i++) {
        candidateQuestions.push({
          id: `h5-R2-${i}`,
          level: 5,
          section: 'reading',
          part_type: 'read_paragraph_sentence_ordering',
          item_number: 0,
          stem: `R2-${i}`,
          options: ['A', 'B', 'C', 'D', 'E'],
          answer_index: 0,
          explanation_vi: 'Giải thích chi tiết.',
        });
      }

      // 3. Reading Part 3 (15 Qs across 4 shared passages: 4 + 4 + 4 + 3)
      const p3Type = 'read_comprehension_long_articles_4opt';
      const passages = [
        { text: 'Passage Alpha AI', count: 4 },
        { text: 'Passage Beta Tea', count: 4 },
        { text: 'Passage Gamma Ocean', count: 4 },
        { text: 'Passage Delta Books', count: 3 },
      ];

      passages.forEach((p, pIdx) => {
        for (let qIdx = 1; qIdx <= p.count; qIdx++) {
          candidateQuestions.push({
            id: `h5-P${pIdx}-${qIdx}`,
            level: 5,
            section: 'reading',
            part_type: p3Type,
            item_number: 0,
            stem: `P${pIdx} Q${qIdx}`,
            passage: p.text,
            options: ['A', 'B', 'C', 'D'],
            answer_index: 0,
            explanation_vi: 'Giải thích chi tiết.',
          });
        }
      });

      // 4. Writing Tasks (2 Qs)
      candidateQuestions.push({
        id: 'h5-W1',
        level: 5,
        section: 'writing',
        part_type: 'write_story_from_4pictures_100chars',
        item_number: 0,
        stem: 'Write story',
        options: [],
        answer_index: 0,
        explanation_vi: 'Giải thích chi tiết.',
      });
      candidateQuestions.push({
        id: 'h5-W2',
        level: 5,
        section: 'writing',
        part_type: 'write_topic_essay_200chars',
        item_number: 0,
        stem: 'Write topic essay',
        options: [],
        answer_index: 0,
        explanation_vi: 'Giải thích chi tiết.',
      });

      // Insert all into testDb as exam_eligible=1
      candidateQuestions.forEach((q) => {
        testDb.prepare(`
          INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active, passage, explanation_vi)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'approved', 1, ?, 'Giải thích chi tiết.')
        `).run(q.id, q.stem, JSON.stringify(q.options), q.answer_index, q.level, q.section, q.part_type, q.passage || null);

        testDb.prepare(`
          INSERT INTO exam_eligible_pool (question_id, level, skill, part_type, stem, practice_eligible, exam_eligible, compatible_formats, ineligible_reasons)
          VALUES (?, ?, ?, ?, ?, 1, 1, '["mock"]', '[]')
        `).run(q.id, q.level, q.section, q.part_type, q.stem);
      });

      const assembly = assembleBlueprintExamFromDb(5, candidateQuestions, testDb);
      expect(assembly.isComplete).toBe(true);
      expect(assembly.questions.length).toBe(72);

      // Verify passage groups are contiguous
      const assembledP3 = assembly.questions.filter((q) => q.part_type === p3Type);
      expect(assembledP3.length).toBe(15);

      let currentPassage = assembledP3[0].passage;
      const seenPassages = new Set<string>([currentPassage!]);
      for (let i = 1; i < assembledP3.length; i++) {
        const qPassage = assembledP3[i].passage;
        if (qPassage !== currentPassage) {
          expect(seenPassages.has(qPassage!)).toBe(false); // never split and re-visited!
          seenPassages.add(qPassage!);
          currentPassage = qPassage;
        }
      }
      expect(seenPassages.size).toBe(4);
    });
  });

  // =========================================================================
  // SUITE 6: DATABASE INVARIANTS
  // =========================================================================
  describe('Suite 6: Database Safety & Bit-for-Bit Integrity Invariants', () => {
    it('6.1 data/hsk_exam.db SHA-256 strictly preserved', () => {
      const hash = getSha256(HSK_EXAM_DB_PATH);
      expect(hash).toBe(EXPECTED_HSK_EXAM_DB_HASH);
    });

    it('6.2 data/qbank/qbank.db operational tables count remains strictly 12', () => {
      const qbankDbPath = path.resolve(process.cwd(), 'data/qbank/qbank.db');
      const db = new DatabaseSync(qbankDbPath, { readOnly: true });
      const rows: any[] = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
      expect(rows.length).toBe(12);
      db.close();
    });
  });
});
