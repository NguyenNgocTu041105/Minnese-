import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import express, { Express } from 'express';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

import {
  examRouter,
  createTestExamDb,
  setExamDbForTesting,
} from '../src/server/examRoutes.js';
import {
  qbankRouter,
  ensurePendingSchema,
  setDbSyncForTesting,
  setQBankAdminTokenForTesting,
} from '../src/server/qbankRoutes.js';
import {
  ensureEligiblePoolSchema,
  syncApprovedQuestionToPool,
  inspectExamPoolBySections,
} from '../src/server/qbankFormatSync.js';

const EXPECTED_HSK_EXAM_DB_HASH = 'DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1';
const HSK_EXAM_DB_PATH = path.resolve(process.cwd(), 'data/hsk_exam.db');

function getSha256(filePath: string): string {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buf).digest('hex').toUpperCase();
}

describe('Challenger M3-2: Dual-Flow Sync & Fail-Closed Quotas Adversarial Harness', () => {
  let server: http.Server | null = null;
  let baseUrl: string = '';
  let testDb: DatabaseSync;
  const originalEnvToken = process.env.QBANK_ADMIN_TOKEN;
  const originalAdminEnabled = process.env.QBANK_ADMIN_ENABLED;
  const testAdminToken = crypto.randomBytes(32).toString('hex');

  beforeAll(() => {
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
    // Isolated in-memory database
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

  function insertPending(q: {
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
      q.explanation_vi || 'Giải thích chi tiết.',
      q.is_active !== undefined ? q.is_active : 1,
      q.passage || null,
      q.topic || 'daily_life',
      `hash_${q.id}`
    );
  }

  // =========================================================================
  // SUITE 1: Single Approval Dual-Flow Synchronization & Polymorphism
  // =========================================================================
  describe('Suite 1: Single Approval Dual-Flow Sync & Polymorphic Payloads', () => {
    it('1.1: Single approval syncs to questions, qb_questions, and exam_eligible_pool with practice_eligible=1 and exam_eligible=1 for HSK 1 3-opt', async () => {
      insertPending({
        id: 'adv_single_01',
        stem: '那是我的书。★ 那是谁的书？',
        options: ['我的', '你的', '他的'],
        answer_idx: 0,
        level: 1,
        skill: 'reading',
        part_type: 'read_comprehension_short_3opt',
      });

      const res = await fetch(`${baseUrl}/api/qbank/pending/approve`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ id: 'adv_single_01' }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.approved_count).toBe(1);
      expect(data.approved_ids).toEqual(['adv_single_01']);
      expect(data.sync_details).toHaveLength(1);
      expect(data.sync_details[0].questionId).toBe('adv_single_01');
      expect(data.sync_details[0].practice_eligible).toBe(true);
      expect(data.sync_details[0].exam_eligible).toBe(true);

      // Verify pending_questions table
      const pendRow: any = testDb.prepare('SELECT status FROM pending_questions WHERE id = ?').get('adv_single_01');
      expect(pendRow.status).toBe('approved');

      // Verify questions table
      const qRow: any = testDb.prepare('SELECT status, is_active, level, skill FROM questions WHERE id = ?').get('adv_single_01');
      expect(qRow).toBeDefined();
      expect(qRow.status).toBe('approved');
      expect(qRow.is_active).toBe(1);

      // Verify qb_questions table
      const qbRow: any = testDb.prepare('SELECT status FROM qb_questions WHERE question_id = ?').get('adv_single_01');
      expect(qbRow).toBeDefined();
      expect(qbRow.status).toBe('approved');

      // Verify exam_eligible_pool table
      const poolRow: any = testDb.prepare('SELECT practice_eligible, exam_eligible, compatible_formats FROM exam_eligible_pool WHERE question_id = ?').get('adv_single_01');
      expect(poolRow).toBeDefined();
      expect(poolRow.practice_eligible).toBe(1);
      expect(poolRow.exam_eligible).toBe(1);
      expect(JSON.parse(poolRow.compatible_formats)).toContain('read_comprehension_short_3opt');
    });

    it('1.2: Single approval of HSK 1 4-opt question maps format compatibility', async () => {
      insertPending({
        id: 'adv_single_02',
        stem: '他在____。',
        options: ['吃饭', '喝水', '看书', '睡觉'],
        answer_idx: 0,
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      });

      const res = await fetch(`${baseUrl}/api/qbank/pending/approve`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ question_id: 'adv_single_02' }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.approved_count).toBe(1);

      const poolRow: any = testDb.prepare('SELECT practice_eligible, exam_eligible, compatible_formats FROM exam_eligible_pool WHERE question_id = ?').get('adv_single_02');
      expect(poolRow).toBeDefined();
      expect(poolRow.practice_eligible).toBe(1);
      // In HSK 1, 4-opt is pedagogically compatible with 6-opt word bank for practice
      const compat = JSON.parse(poolRow.compatible_formats);
      expect(compat).toContain('read_fill_blank_word_bank_6opt');
    });

    it('1.3: Polymorphic body parameters (ids, question_ids, id, question_id) are all accepted', async () => {
      insertPending({ id: 'poly_1', stem: 'S1', options: ['A', 'B', 'C'], level: 1, skill: 'reading', part_type: 'read_comprehension_short_3opt' });
      insertPending({ id: 'poly_2', stem: 'S2', options: ['A', 'B', 'C'], level: 1, skill: 'reading', part_type: 'read_comprehension_short_3opt' });
      insertPending({ id: 'poly_3', stem: 'S3', options: ['A', 'B', 'C'], level: 1, skill: 'reading', part_type: 'read_comprehension_short_3opt' });
      insertPending({ id: 'poly_4', stem: 'S4', options: ['A', 'B', 'C'], level: 1, skill: 'reading', part_type: 'read_comprehension_short_3opt' });

      // { ids: [...] }
      const res1 = await fetch(`${baseUrl}/api/qbank/pending/approve`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ ids: ['poly_1'] }),
      });
      expect((await res1.json()).approved_ids).toEqual(['poly_1']);

      // { question_ids: [...] }
      const res2 = await fetch(`${baseUrl}/api/qbank/pending/approve`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ question_ids: ['poly_2'] }),
      });
      expect((await res2.json()).approved_ids).toEqual(['poly_2']);

      // { id: ... }
      const res3 = await fetch(`${baseUrl}/api/qbank/pending/approve`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ id: 'poly_3' }),
      });
      expect((await res3.json()).approved_ids).toEqual(['poly_3']);

      // { question_id: ... }
      const res4 = await fetch(`${baseUrl}/api/qbank/pending/approve`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ question_id: 'poly_4' }),
      });
      expect((await res4.json()).approved_ids).toEqual(['poly_4']);
    });

    it('1.4: Empty payload or non-existent IDs return approved_count: 0 cleanly', async () => {
      const resEmpty = await fetch(`${baseUrl}/api/qbank/pending/approve`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ ids: [] }),
      });
      const dataEmpty = await resEmpty.json();
      expect(dataEmpty.success).toBe(true);
      expect(dataEmpty.approved_count).toBe(0);
      expect(dataEmpty.approved_ids).toEqual([]);

      const resNonExistent = await fetch(`${baseUrl}/api/qbank/pending/approve`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ ids: ['non_existent_id_999'] }),
      });
      const dataNonExistent = await resNonExistent.json();
      expect(dataNonExistent.success).toBe(true);
      expect(dataNonExistent.approved_count).toBe(0);
    });
  });

  // =========================================================================
  // SUITE 2: Bulk Approval Heterogeneous Batch Synchronization
  // =========================================================================
  describe('Suite 2: Bulk Approval Heterogeneous Batch Sync', () => {
    it('2.1: Heterogeneous multi-level multi-skill batch synchronizes all items atomically', async () => {
      insertPending({ id: 'bulk_hsk1_r', stem: 'H1R', options: ['A', 'B', 'C'], level: 1, skill: 'reading', part_type: 'read_comprehension_short_3opt' });
      insertPending({ id: 'bulk_hsk1_l', stem: 'H1L', options: ['A', 'B', 'C'], level: 1, skill: 'listening', part_type: 'listen_question_answer_3opt' });
      insertPending({ id: 'bulk_hsk3_r', stem: 'H3R', options: ['A', 'B', 'C', 'D'], level: 3, skill: 'reading', part_type: 'read_comprehension_short_4opt' });
      insertPending({ id: 'bulk_hsk4_w', stem: 'H4W', options: [], level: 4, skill: 'writing', part_type: 'write_short_essay_80chars' });

      const res = await fetch(`${baseUrl}/api/qbank/pending/approve`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ ids: ['bulk_hsk1_r', 'bulk_hsk1_l', 'bulk_hsk3_r', 'bulk_hsk4_w'] }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.approved_count).toBe(4);
      expect(data.approved_ids).toHaveLength(4);

      // Verify all 4 exist in questions and exam_eligible_pool
      for (const id of ['bulk_hsk1_r', 'bulk_hsk1_l', 'bulk_hsk3_r', 'bulk_hsk4_w']) {
        const q: any = testDb.prepare('SELECT status, is_active FROM questions WHERE id = ?').get(id);
        expect(q.status).toBe('approved');
        expect(q.is_active).toBe(1);

        const pool: any = testDb.prepare('SELECT practice_eligible FROM exam_eligible_pool WHERE question_id = ?').get(id);
        expect(pool).toBeDefined();
        expect(pool.practice_eligible).toBe(1);
      }

      // Check writing question exam eligibility
      const wPool: any = testDb.prepare('SELECT practice_eligible, exam_eligible FROM exam_eligible_pool WHERE question_id = ?').get('bulk_hsk4_w');
      expect(wPool.practice_eligible).toBe(1);
      expect(wPool.exam_eligible).toBe(1);
    });

    it('2.2: Mixed batch with valid and invalid IDs approves only valid ones and reports count', async () => {
      insertPending({ id: 'valid_item_1', stem: 'Stem', options: ['A', 'B', 'C'], level: 1, skill: 'reading', part_type: 'read_comprehension_short_3opt' });

      const res = await fetch(`${baseUrl}/api/qbank/pending/approve`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ ids: ['valid_item_1', 'ghost_item_x', 'ghost_item_y'] }),
      });

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.approved_count).toBe(1);
      expect(data.approved_ids).toEqual(['valid_item_1']);

      const poolRow: any = testDb.prepare('SELECT practice_eligible FROM exam_eligible_pool WHERE question_id = ?').get('valid_item_1');
      expect(poolRow.practice_eligible).toBe(1);
    });
  });

  // =========================================================================
  // SUITE 3: Idempotency & Repeated Approval Stress
  // =========================================================================
  describe('Suite 3: Idempotency & Repeated Approvals', () => {
    it('3.1: Repeated approval of the same question is strictly idempotent and does not duplicate rows', async () => {
      insertPending({
        id: 'idem_q01',
        stem: '那是____的书。',
        options: ['我', '你', '他'],
        answer_idx: 0,
        level: 1,
        skill: 'reading',
        part_type: 'read_comprehension_short_3opt',
      });

      // Pass 1
      const res1 = await fetch(`${baseUrl}/api/qbank/pending/approve`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ id: 'idem_q01' }),
      });
      const data1 = await res1.json();
      expect(data1.approved_count).toBe(1);

      // Pass 2
      const res2 = await fetch(`${baseUrl}/api/qbank/pending/approve`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ id: 'idem_q01' }),
      });
      const data2 = await res2.json();
      expect(data2.approved_count).toBe(1);

      // Pass 3 (bulk array with identical duplicate ID)
      const res3 = await fetch(`${baseUrl}/api/qbank/pending/approve`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ ids: ['idem_q01', 'idem_q01'] }),
      });
      const data3 = await res3.json();
      expect(data3.success).toBe(true);

      // Verify row counts in tables: exactly 1 row each!
      const questionsCount: any = testDb.prepare('SELECT count(*) as c FROM questions WHERE id = ?').get('idem_q01');
      expect(questionsCount.c).toBe(1);

      const qbCount: any = testDb.prepare('SELECT count(*) as c FROM qb_questions WHERE question_id = ?').get('idem_q01');
      expect(qbCount.c).toBe(1);

      const poolCount: any = testDb.prepare('SELECT count(*) as c FROM exam_eligible_pool WHERE question_id = ?').get('idem_q01');
      expect(poolCount.c).toBe(1);
    });
  });

  // =========================================================================
  // SUITE 4: Transaction Atomicity & Rollback Under Fault Injection
  // =========================================================================
  describe('Suite 4: Transaction Atomicity & Rollback Under Error', () => {
    it('4.1: If an error triggers during batch execution, previous questions in the batch roll back completely', async () => {
      insertPending({ id: 'atomic_01', stem: 'Stem 1', options: ['A', 'B', 'C'], level: 1, skill: 'reading', part_type: 'read_comprehension_short_3opt' });
      insertPending({ id: 'atomic_02_fault', stem: 'Stem 2', options: ['A', 'B', 'C'], level: 1, skill: 'reading', part_type: 'read_comprehension_short_3opt' });
      insertPending({ id: 'atomic_03', stem: 'Stem 3', options: ['A', 'B', 'C'], level: 1, skill: 'reading', part_type: 'read_comprehension_short_3opt' });

      // Install a trigger that aborts if atomic_02_fault is inserted into questions
      testDb.exec(`
        CREATE TRIGGER test_fail_atomic_02
        BEFORE INSERT ON questions
        WHEN NEW.id = 'atomic_02_fault'
        BEGIN
          SELECT RAISE(ABORT, 'Fault injection: simulated database error on atomic_02_fault');
        END;
      `);

      const res = await fetch(`${baseUrl}/api/qbank/pending/approve`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ ids: ['atomic_01', 'atomic_02_fault', 'atomic_03'] }),
      });

      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('simulated database error');

      // VERIFY COMPLETE ROLLBACK:
      // atomic_01 was processed first in the loop, but MUST BE ROLLED BACK!
      const q1 = testDb.prepare('SELECT * FROM questions WHERE id = ?').get('atomic_01');
      expect(q1).toBeUndefined();

      const pool1 = testDb.prepare('SELECT * FROM exam_eligible_pool WHERE question_id = ?').get('atomic_01');
      expect(pool1).toBeUndefined();

      const p1: any = testDb.prepare('SELECT status FROM pending_questions WHERE id = ?').get('atomic_01');
      expect(p1.status).toBe('pending'); // must NOT remain approved

      // atomic_03 must not have been touched
      const q3 = testDb.prepare('SELECT * FROM questions WHERE id = ?').get('atomic_03');
      expect(q3).toBeUndefined();

      // Clean up trigger
      testDb.exec('DROP TRIGGER test_fail_atomic_02;');
    });
  });

  // =========================================================================
  // SUITE 5: Concurrent Approval Race Condition
  // =========================================================================
  describe('Suite 5: Concurrent Approval Race Conditions', () => {
    it('5.1: Concurrent approvals of identical question resolve cleanly without corruption or duplicates', async () => {
      insertPending({
        id: 'concurrent_q01',
        stem: 'Concurrent stem',
        options: ['A', 'B', 'C'],
        level: 1,
        skill: 'reading',
        part_type: 'read_comprehension_short_3opt',
      });

      // Fire 6 concurrent requests
      const promises = Array.from({ length: 6 }).map(() =>
        fetch(`${baseUrl}/api/qbank/pending/approve`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ id: 'concurrent_q01' }),
        }).then((r) => r.json())
      );

      const results = await Promise.all(promises);
      for (const res of results) {
        expect(res.success).toBe(true);
      }

      // Exactly 1 row in questions and exam_eligible_pool
      const qCount: any = testDb.prepare('SELECT count(*) as c FROM questions WHERE id = ?').get('concurrent_q01');
      expect(qCount.c).toBe(1);

      const poolCount: any = testDb.prepare('SELECT count(*) as c FROM exam_eligible_pool WHERE question_id = ?').get('concurrent_q01');
      expect(poolCount.c).toBe(1);
    });
  });

  // =========================================================================
  // SUITE 6: Mock Mode Fail-Closed Quotas Under Partial Pools
  // =========================================================================
  describe('Suite 6: Mock Mode Fail-Closed Quotas Under Partial Pools', () => {
    it('6.1: Missing entire section (20 Reading across 4 parts, 0 Listening) fails closed with HTTP 400', async () => {
      // Seed 5 of each of the 4 Reading parts for HSK 1 (total 20 Reading):
      // Part 1: read_sentence_picture_match_6opt (5 items)
      for (let i = 1; i <= 5; i++) {
        const id = `part1_r_${i}`;
        testDb.prepare(`
          INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, illustration_theme, status, is_active, explanation_vi)
          VALUES (?, ?, '["A","B","C","D","E","F"]', 0, 1, 'reading', 'read_sentence_picture_match_6opt', 'apple', 'approved', 1, 'Giải thích')
        `).run(id, `R Part 1 Stem ${i}`);
        syncApprovedQuestionToPool(testDb, id);
      }
      // Part 2: read_dialogue_matching_6opt (5 items)
      for (let i = 1; i <= 5; i++) {
        const id = `part2_r_${i}`;
        testDb.prepare(`
          INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active, explanation_vi)
          VALUES (?, ?, '["A","B","C","D","E","F"]', 0, 1, 'reading', 'read_dialogue_matching_6opt', 'approved', 1, 'Giải thích')
        `).run(id, `R Part 2 Stem ${i}`);
        syncApprovedQuestionToPool(testDb, id);
      }
      // Part 3: read_fill_blank_word_bank_6opt (5 items)
      for (let i = 1; i <= 5; i++) {
        const id = `part3_r_${i}`;
        testDb.prepare(`
          INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active, explanation_vi)
          VALUES (?, ?, '["A","B","C","D","E","F"]', 0, 1, 'reading', 'read_fill_blank_word_bank_6opt', 'approved', 1, 'Giải thích')
        `).run(id, `R Part 3 Stem ${i}`);
        syncApprovedQuestionToPool(testDb, id);
      }
      // Part 4: read_comprehension_short_3opt (5 items)
      for (let i = 1; i <= 5; i++) {
        const id = `part4_r_${i}`;
        testDb.prepare(`
          INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active, explanation_vi)
          VALUES (?, ?, '["A","B","C"]', 0, 1, 'reading', 'read_comprehension_short_3opt', 'approved', 1, 'Giải thích')
        `).run(id, `R Part 4 Stem ${i}`);
        syncApprovedQuestionToPool(testDb, id);
      }

      const res = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 1, mode: 'mock' }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.mode).toBe('mock');
      expect(data.level).toBe(1);
      expect(data.is_fully_eligible).toBe(false);
      expect(data.total_required).toBe(40);
      expect(data.total_available).toBe(20);
      expect(data.total_missing).toBe(20);
      expect(data.sections.listening.totalMissing).toBe(20);
      expect(data.sections.reading.totalMissing).toBe(0);
      expect(data.error).toContain('chưa đủ điều kiện tạo đề thi chính thức');
      expect(data.error).toContain('20');

      // Crucial: No questions array or zero fixture leak
      expect(data.questions).toBeUndefined();
    });

    it('6.2: Partially filled sections (20 Reading + 5 Listening = 25 questions) fails closed with missing=15', async () => {
      // Seed 20 Reading questions across all 4 parts
      for (let i = 1; i <= 5; i++) {
        const id1 = `p1_r_${i}`;
        testDb.prepare(`INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, illustration_theme, status, is_active, explanation_vi) VALUES (?, ?, '["A","B","C","D","E","F"]', 0, 1, 'reading', 'read_sentence_picture_match_6opt', 'apple', 'approved', 1, 'GT')`).run(id1, `S1_${i}`);
        syncApprovedQuestionToPool(testDb, id1);

        const id2 = `p2_r_${i}`;
        testDb.prepare(`INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active, explanation_vi) VALUES (?, ?, '["A","B","C","D","E","F"]', 0, 1, 'reading', 'read_dialogue_matching_6opt', 'approved', 1, 'GT')`).run(id2, `S2_${i}`);
        syncApprovedQuestionToPool(testDb, id2);

        const id3 = `p3_r_${i}`;
        testDb.prepare(`INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active, explanation_vi) VALUES (?, ?, '["A","B","C","D","E","F"]', 0, 1, 'reading', 'read_fill_blank_word_bank_6opt', 'approved', 1, 'GT')`).run(id3, `S3_${i}`);
        syncApprovedQuestionToPool(testDb, id3);

        const id4 = `p4_r_${i}`;
        testDb.prepare(`INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active, explanation_vi) VALUES (?, ?, '["A","B","C"]', 0, 1, 'reading', 'read_comprehension_short_3opt', 'approved', 1, 'GT')`).run(id4, `S4_${i}`);
        syncApprovedQuestionToPool(testDb, id4);
      }

      // Seed 5 Listening Part 2 (listen_question_answer_3opt)
      for (let i = 1; i <= 5; i++) {
        const id = `p2_l_${i}`;
        testDb.prepare(`
          INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active, explanation_vi)
          VALUES (?, ?, '["A","B","C"]', 0, 1, 'listening', 'listen_question_answer_3opt', 'approved', 1, 'GT')
        `).run(id, `L Stem ${i}`);
        syncApprovedQuestionToPool(testDb, id);
      }

      const res = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 1, mode: 'mock' }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.is_fully_eligible).toBe(false);
      expect(data.total_required).toBe(40);
      expect(data.total_available).toBe(25);
      expect(data.total_missing).toBe(15);
      expect(data.sections.listening.totalMissing).toBe(15);
      expect(data.sections.reading.totalMissing).toBe(0);
    });

    it('6.3: Part-Type Mismatch: 20 questions of single part type only satisfy that specific part quota', async () => {
      // Seed 20 questions of read_comprehension_short_3opt only
      for (let i = 1; i <= 20; i++) {
        const id = `mismatch_r_${i}`;
        testDb.prepare(`
          INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active, explanation_vi)
          VALUES (?, ?, '["A","B","C"]', 0, 1, 'reading', 'read_comprehension_short_3opt', 'approved', 1, 'GT')
        `).run(id, `Stem ${i}`);
        syncApprovedQuestionToPool(testDb, id);
      }

      const res = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 1, mode: 'mock' }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      // Part 4 requires only 5, so only 5 are accepted; Parts 1-3 still miss 15
      expect(data.total_available).toBe(5);
      expect(data.total_missing).toBe(35);
      expect(data.sections.reading.totalAvailable).toBe(5);
      expect(data.sections.reading.totalMissing).toBe(15);
    });
  });

  // =========================================================================
  // SUITE 7: Mock Mode Fail-Closed Quotas Under Zero-Question Pools
  // =========================================================================
  describe('Suite 7: Mock Mode Fail-Closed Quotas Under Zero-Question Pools', () => {
    it('7.1: Completely empty pool returns HTTP 400 with total_available=0 and total_missing=40 for HSK 1', async () => {
      const res = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 1, mode: 'mock' }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.is_fully_eligible).toBe(false);
      expect(data.total_required).toBe(40);
      expect(data.total_available).toBe(0);
      expect(data.total_missing).toBe(40);
      expect(data.sections.listening.totalMissing).toBe(20);
      expect(data.sections.reading.totalMissing).toBe(20);
      expect(data.questions).toBeUndefined();
    });

    it('7.2: Completely empty pool for HSK 6 returns HTTP 400 with total_required=82 and total_missing=82', async () => {
      const res = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 6, mode: 'mock' }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.total_required).toBe(82);
      expect(data.total_missing).toBe(82);
    });
  });

  // =========================================================================
  // SUITE 8: Invalid HSK Levels Fail-Closed Sanitization
  // =========================================================================
  describe('Suite 8: Invalid HSK Levels Fail-Closed Sanitization', () => {
    const invalidLevels = [
      { val: 0, desc: 'level 0' },
      { val: 7, desc: 'level 7' },
      { val: -1, desc: 'level -1' },
      { val: 'abc', desc: 'level "abc"' },
      { val: NaN, desc: 'level NaN' },
      { val: 99, desc: 'level 99' },
      { val: null, desc: 'level null' },
      { val: undefined, desc: 'level undefined (missing)' },
    ];

    for (const { val, desc } of invalidLevels) {
      it(`8.x: Rejects ${desc} with HTTP 400 and does NOT coerce to level 1`, async () => {
        const body: any = { mode: 'mock' };
        if (val !== undefined) body.level = val;

        const res = await fetch(`${baseUrl}/api/exam/generate-mock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.success).toBe(false);
        expect(data.error).toBe('Cấp độ HSK không hợp lệ (yêu cầu từ 1 đến 6).');
      });
    }
  });

  // =========================================================================
  // SUITE 9: Fixture Demarcation & Zero LLM Call Invariant
  // =========================================================================
  describe('Suite 9: Fixture Demarcation & Zero LLM Calls', () => {
    it('9.1: Explicit fixture request allowFixtures: true returns HTTP 200 marked as demo fixture', async () => {
      const res = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 1, mode: 'mock', allowFixtures: true }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.usingFixtureFallback).toBe(true);
      expect(data.isFixtureDemo).toBe(true);
      expect(data.dataSource).toBe('fixture');
      expect(data.fallbackNotice).toContain('Đề thi mẫu demo (Fixtures)');
      expect(data.llmCallsMade).toBe(0);
      expect(data.questions.length).toBeGreaterThan(0);
    });

    it('9.2: Default mock mode NEVER falls back to fixtures on shortage', async () => {
      const res = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 1, mode: 'mock' }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.is_fully_eligible).toBe(false);
      expect(data.questions).toBeUndefined();
    });
  });

  // =========================================================================
  // SUITE 10: Database Invariant Preservation
  // =========================================================================
  describe('Suite 10: Database Invariant Preservation', () => {
    it('10.1: data/hsk_exam.db SHA-256 hash strictly preserved throughout all tests', () => {
      const hash = getSha256(HSK_EXAM_DB_PATH);
      expect(hash).toBe(EXPECTED_HSK_EXAM_DB_HASH);
    });
  });
});
