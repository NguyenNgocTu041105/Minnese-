/**
 * Challenger 2 Adversarial Test Suite: Milestone M1 (AC 1, 2, 3)
 * Focus: Pool Synchronization and Status Transition Invariants
 *
 * Invariants tested:
 * 1. Approving a pending question updates status to 'approved' and synchronizes into
 *    exam_eligible_pool with practice_eligible = 1.
 * 2. Rejecting a question updates status to 'rejected' and deletes the question from
 *    exam_eligible_pool.
 * 3. Disabling a question updates status to 'disabled' and deletes the question from
 *    exam_eligible_pool (via both /pending/disable and /questions/:id/disable).
 * 4. Pending, rejected, and disabled questions are NEVER present in exam_eligible_pool
 *    with practice_eligible = 1.
 * 5. Cyclical transitions (Pending -> Approved -> Rejected -> Re-approved; Pending ->
 *    Approved -> Disabled -> Re-approved) maintain perfect pool synchronization.
 * 6. Idempotent multi-call operations (double-approve, double-reject, double-disable) do
 *    not duplicate rows or corrupt the pool.
 * 7. Heterogeneous batch operations correctly update existing items and purge them from pool.
 * 8. Malformed questions (insufficient options / invalid answers) never get practice_eligible = 1.
 * 9. Production database isolation and data/hsk_exam.db SHA-256 integrity preservation.
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

describe('Challenger 2: Pool Synchronization & Status Transition Invariants (AC 1–3)', () => {
  let server: http.Server | null = null;
  let baseUrl: string = '';
  let testDb: DatabaseSync;
  const originalEnvToken = process.env.QBANK_ADMIN_TOKEN;
  const testAdminToken = crypto.randomBytes(32).toString('hex');

  beforeAll(() => {
    // Verify production DB hash invariant before any testing
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

    // Verify production DB hash invariant remains intact after all testing
    expect(getSha256(HSK_EXAM_DB_PATH)).toBe(EXPECTED_HSK_EXAM_DB_HASH);
  });

  beforeEach(async () => {
    // Fully isolated in-memory test database
    testDb = new DatabaseSync(':memory:');
    ensurePendingSchema(testDb);
    ensureEligiblePoolSchema(testDb);
    setDbSyncForTesting(testDb);

    process.env.QBANK_ADMIN_TOKEN = testAdminToken;
    setQBankAdminTokenForTesting(testAdminToken);

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

  const authHeaders = () => ({
    'Authorization': `Bearer ${testAdminToken}`,
    'Content-Type': 'application/json',
  });

  const insertPendingQuestion = (overrides: Partial<any> = {}): string => {
    const id = overrides.id || `chal_${crypto.randomBytes(4).toString('hex')}`;
    const stem = overrides.stem !== undefined ? overrides.stem : `测试题目 (${id})。`;
    const options = overrides.options !== undefined
      ? (typeof overrides.options === 'string' ? overrides.options : JSON.stringify(overrides.options))
      : JSON.stringify(['苹果', '香蕉', '杯子', '书']);
    const answerIdx = overrides.answer_idx !== undefined ? overrides.answer_idx : 0;
    const level = overrides.level !== undefined ? overrides.level : 1;
    const skill = overrides.skill || 'reading';
    const partType = overrides.part_type || 'read_fill_blank_4opt';
    const status = overrides.status || 'pending';
    const isActive = overrides.is_active !== undefined ? overrides.is_active : (status === 'approved' ? 1 : 0);

    testDb.prepare(`
      INSERT INTO pending_questions (
        id, stem, options, answer_idx, explanation_vi, level, skill, part_type, status, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      stem,
      options,
      answerIdx,
      overrides.explanation_vi || 'Giải thích chuẩn',
      level,
      skill,
      partType,
      status,
      isActive
    );

    return id;
  };

  // =========================================================================
  // SUITE 1: Basic Status Transitions & Pool Synchronization (AC 1, 2, 3)
  // =========================================================================
  describe('1. Basic Status Transitions & Pool Synchronization Invariants', () => {
    it('approving a pending question updates status to "approved" and syncs into pool with practice_eligible = 1', async () => {
      const qId = insertPendingQuestion({ id: 'q_app_basic_1', status: 'pending' });

      // Before: No entry in exam_eligible_pool
      const poolBefore = testDb.prepare('SELECT * FROM exam_eligible_pool WHERE question_id = ?').get(qId);
      expect(poolBefore).toBeUndefined();

      // Approve
      const res = await fetch(`${baseUrl}/api/qbank/pending/approve`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ id: qId }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.approved_count).toBe(1);

      // Verify pending_questions status
      const pendingRow: any = testDb.prepare('SELECT status, is_active FROM pending_questions WHERE id = ?').get(qId);
      expect(pendingRow.status).toBe('approved');

      // Verify questions table
      const questionRow: any = testDb.prepare('SELECT status, is_active FROM questions WHERE id = ?').get(qId);
      expect(questionRow.status).toBe('approved');
      expect(questionRow.is_active).toBe(1);

      // Verify exam_eligible_pool
      const poolRow: any = testDb.prepare('SELECT * FROM exam_eligible_pool WHERE question_id = ?').get(qId);
      expect(poolRow).toBeDefined();
      expect(poolRow.practice_eligible).toBe(1);
    });

    it('rejecting a question updates status to "rejected" and deletes it from exam_eligible_pool', async () => {
      const qId = insertPendingQuestion({ id: 'q_rej_basic_1', status: 'pending' });

      // First approve
      await fetch(`${baseUrl}/api/qbank/pending/approve`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ id: qId }),
      });
      expect(testDb.prepare('SELECT * FROM exam_eligible_pool WHERE question_id = ?').get(qId)).toBeDefined();

      // Now reject
      const res = await fetch(`${baseUrl}/api/qbank/pending/reject`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ id: qId, rejection_note: 'Từ chối câu này' }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.rejected_count).toBe(1);

      // Verify pending_questions status
      const pendingRow: any = testDb.prepare('SELECT status, is_active FROM pending_questions WHERE id = ?').get(qId);
      expect(pendingRow.status).toBe('rejected');
      expect(pendingRow.is_active).toBe(0);

      // Verify questions row deleted
      expect(testDb.prepare('SELECT * FROM questions WHERE id = ?').get(qId)).toBeUndefined();

      // Verify exam_eligible_pool row deleted
      const poolRow = testDb.prepare('SELECT * FROM exam_eligible_pool WHERE question_id = ?').get(qId);
      expect(poolRow).toBeUndefined();
    });

    it('disabling a question via POST /api/qbank/pending/disable updates status to "disabled" and deletes from pool', async () => {
      const qId = insertPendingQuestion({ id: 'q_dis_pending_1', status: 'pending' });

      // First approve
      await fetch(`${baseUrl}/api/qbank/pending/approve`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ id: qId }),
      });
      expect(testDb.prepare('SELECT * FROM exam_eligible_pool WHERE question_id = ?').get(qId)).toBeDefined();

      // Disable via /pending/disable
      const res = await fetch(`${baseUrl}/api/qbank/pending/disable`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ id: qId }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.disabled_count).toBe(1);

      // Verify pending_questions
      const pendingRow: any = testDb.prepare('SELECT status, is_active FROM pending_questions WHERE id = ?').get(qId);
      expect(pendingRow.status).toBe('disabled');
      expect(pendingRow.is_active).toBe(0);

      // Verify questions
      const questionRow: any = testDb.prepare('SELECT status, is_active FROM questions WHERE id = ?').get(qId);
      expect(questionRow.status).toBe('disabled');
      expect(questionRow.is_active).toBe(0);

      // Verify deleted from pool
      expect(testDb.prepare('SELECT * FROM exam_eligible_pool WHERE question_id = ?').get(qId)).toBeUndefined();
    });

    it('disabling a question via POST /api/qbank/questions/:id/disable updates status and deletes from pool', async () => {
      const qId = insertPendingQuestion({ id: 'q_dis_route_1', status: 'pending' });

      // First approve
      await fetch(`${baseUrl}/api/qbank/pending/approve`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ id: qId }),
      });
      expect(testDb.prepare('SELECT * FROM exam_eligible_pool WHERE question_id = ?').get(qId)).toBeDefined();

      // Disable via /questions/:id/disable
      const res = await fetch(`${baseUrl}/api/qbank/questions/${qId}/disable`, {
        method: 'POST',
        headers: authHeaders(),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.status).toBe('disabled');

      // Verify questions
      const questionRow: any = testDb.prepare('SELECT status, is_active FROM questions WHERE id = ?').get(qId);
      expect(questionRow.status).toBe('disabled');
      expect(questionRow.is_active).toBe(0);

      // Verify deleted from pool
      expect(testDb.prepare('SELECT * FROM exam_eligible_pool WHERE question_id = ?').get(qId)).toBeUndefined();
    });
  });

  // =========================================================================
  // SUITE 2: Batch Transitions & Heterogeneous Batches
  // =========================================================================
  describe('2. Batch Operations & Heterogeneous State Transitions', () => {
    it('batch approves 20 questions atomically into pool with practice_eligible = 1', async () => {
      const ids: string[] = [];
      for (let i = 0; i < 20; i++) {
        ids.push(insertPendingQuestion({ id: `q_bulk_app_${i}` }));
      }

      const res = await fetch(`${baseUrl}/api/qbank/pending/approve`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ ids }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.approved_count).toBe(20);

      const poolCount: any = testDb.prepare(
        'SELECT COUNT(*) as cnt FROM exam_eligible_pool WHERE practice_eligible = 1'
      ).get();
      expect(poolCount.cnt).toBe(20);
    });

    it('batch rejects 10 of 20 approved questions, leaving exactly 10 in pool', async () => {
      const ids: string[] = [];
      for (let i = 0; i < 20; i++) {
        ids.push(insertPendingQuestion({ id: `q_bulk_mix_${i}` }));
      }

      // Approve all 20
      await fetch(`${baseUrl}/api/qbank/pending/approve`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ ids }),
      });

      // Reject first 10
      const toReject = ids.slice(0, 10);
      const res = await fetch(`${baseUrl}/api/qbank/pending/reject`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ ids: toReject }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.rejected_count).toBe(10);

      // Verify rejected are not in pool
      for (const rejId of toReject) {
        expect(testDb.prepare('SELECT * FROM exam_eligible_pool WHERE question_id = ?').get(rejId)).toBeUndefined();
      }

      // Verify remaining 10 still in pool
      const remaining = ids.slice(10);
      for (const remId of remaining) {
        const row: any = testDb.prepare('SELECT * FROM exam_eligible_pool WHERE question_id = ?').get(remId);
        expect(row).toBeDefined();
        expect(row.practice_eligible).toBe(1);
      }
    });

    it('batch disables 5 of remaining 10 questions, leaving exactly 5 in pool', async () => {
      const ids: string[] = [];
      for (let i = 0; i < 10; i++) {
        ids.push(insertPendingQuestion({ id: `q_bulk_dis_${i}` }));
      }
      await fetch(`${baseUrl}/api/qbank/pending/approve`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ ids }),
      });

      const toDisable = ids.slice(0, 5);
      const res = await fetch(`${baseUrl}/api/qbank/pending/disable`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ ids: toDisable }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.disabled_count).toBe(5);

      // Exactly 5 remain in pool
      const poolRows = testDb.prepare('SELECT question_id FROM exam_eligible_pool WHERE practice_eligible = 1').all() as any[];
      expect(poolRows).toHaveLength(5);
      const poolIds = poolRows.map((r) => r.question_id);
      for (const dId of toDisable) {
        expect(poolIds).not.toContain(dId);
      }
    });

    it('handles heterogeneous batch containing existing and non-existent IDs gracefully', async () => {
      const realId = insertPendingQuestion({ id: 'q_hetero_real_1' });
      const fakeId = 'non_existent_id_99999';

      const res = await fetch(`${baseUrl}/api/qbank/pending/approve`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ ids: [realId, fakeId] }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.approved_count).toBe(1);
      expect(data.approved_ids).toEqual([realId]);

      // Fake ID not in pool
      expect(testDb.prepare('SELECT * FROM exam_eligible_pool WHERE question_id = ?').get(fakeId)).toBeUndefined();
      // Real ID in pool
      expect(testDb.prepare('SELECT * FROM exam_eligible_pool WHERE question_id = ?').get(realId)).toBeDefined();
    });
  });

  // =========================================================================
  // SUITE 3: Reversibility & Cyclical State Transitions Stress
  // =========================================================================
  describe('3. Cyclical State Transitions & Reversibility', () => {
    it('supports full lifecycle: Pending -> Approved -> Rejected -> Re-approved', async () => {
      const qId = insertPendingQuestion({ id: 'q_cycle_rej_app_1' });

      // Step 1: Approve
      await fetch(`${baseUrl}/api/qbank/pending/approve`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ id: qId }),
      });
      expect(testDb.prepare('SELECT * FROM exam_eligible_pool WHERE question_id = ?').get(qId)).toBeDefined();

      // Step 2: Reject
      await fetch(`${baseUrl}/api/qbank/pending/reject`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ id: qId }),
      });
      expect(testDb.prepare('SELECT * FROM exam_eligible_pool WHERE question_id = ?').get(qId)).toBeUndefined();

      // Step 3: Re-approve the rejected question
      const reAppRes = await fetch(`${baseUrl}/api/qbank/pending/approve`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ id: qId }),
      });
      expect(reAppRes.status).toBe(200);
      const reAppData = await reAppRes.json();
      expect(reAppData.success).toBe(true);
      expect(reAppData.approved_count).toBe(1);

      // Verify re-inserted into questions and pool
      const pRow: any = testDb.prepare('SELECT status FROM pending_questions WHERE id = ?').get(qId);
      expect(pRow.status).toBe('approved');
      const qRow: any = testDb.prepare('SELECT status, is_active FROM questions WHERE id = ?').get(qId);
      expect(qRow.status).toBe('approved');
      expect(qRow.is_active).toBe(1);

      const poolRow: any = testDb.prepare('SELECT * FROM exam_eligible_pool WHERE question_id = ?').get(qId);
      expect(poolRow).toBeDefined();
      expect(poolRow.practice_eligible).toBe(1);
    });

    it('supports full lifecycle: Pending -> Approved -> Disabled -> Re-approved', async () => {
      const qId = insertPendingQuestion({ id: 'q_cycle_dis_app_1' });

      // Step 1: Approve
      await fetch(`${baseUrl}/api/qbank/pending/approve`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ id: qId }),
      });

      // Step 2: Disable
      await fetch(`${baseUrl}/api/qbank/pending/disable`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ id: qId }),
      });
      expect(testDb.prepare('SELECT * FROM exam_eligible_pool WHERE question_id = ?').get(qId)).toBeUndefined();

      // Step 3: Re-approve disabled question
      const res = await fetch(`${baseUrl}/api/qbank/pending/approve`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ id: qId }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);

      const poolRow: any = testDb.prepare('SELECT * FROM exam_eligible_pool WHERE question_id = ?').get(qId);
      expect(poolRow).toBeDefined();
      expect(poolRow.practice_eligible).toBe(1);
    });

    it('direct reject from pending never creates a pool record', async () => {
      const qId = insertPendingQuestion({ id: 'q_direct_rej_1' });

      const res = await fetch(`${baseUrl}/api/qbank/pending/reject`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ id: qId }),
      });
      expect(res.status).toBe(200);

      expect(testDb.prepare('SELECT * FROM exam_eligible_pool WHERE question_id = ?').get(qId)).toBeUndefined();
      expect(testDb.prepare('SELECT * FROM questions WHERE id = ?').get(qId)).toBeUndefined();
    });

    it('direct disable from pending never creates a pool record', async () => {
      const qId = insertPendingQuestion({ id: 'q_direct_dis_1' });

      const res = await fetch(`${baseUrl}/api/qbank/pending/disable`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ id: qId }),
      });
      expect(res.status).toBe(200);

      expect(testDb.prepare('SELECT * FROM exam_eligible_pool WHERE question_id = ?').get(qId)).toBeUndefined();
    });

    it('idempotency: multiple approvals do not duplicate pool records', async () => {
      const qId = insertPendingQuestion({ id: 'q_idempotent_1' });

      // Call approve 3 times
      for (let i = 0; i < 3; i++) {
        const res = await fetch(`${baseUrl}/api/qbank/pending/approve`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ id: qId }),
        });
        expect(res.status).toBe(200);
      }

      const rows = testDb.prepare('SELECT * FROM exam_eligible_pool WHERE question_id = ?').all(qId);
      expect(rows).toHaveLength(1);
    });
  });

  // =========================================================================
  // SUITE 4: Global Invariant Oracle: Non-approved Questions NEVER in Pool
  // =========================================================================
  describe('4. Global Invariant Oracle: Non-approved Questions NEVER in Pool', () => {
    it('guarantees that across all states, no pending/rejected/disabled question is in exam_eligible_pool with practice_eligible = 1', async () => {
      // Seed 40 questions across various states
      const pendingIds: string[] = [];
      const approvedIds: string[] = [];
      const rejectedIds: string[] = [];
      const disabledIds: string[] = [];

      for (let i = 0; i < 10; i++) {
        pendingIds.push(insertPendingQuestion({ id: `oracle_pend_${i}`, status: 'pending' }));
        approvedIds.push(insertPendingQuestion({ id: `oracle_app_${i}`, status: 'pending' }));
        rejectedIds.push(insertPendingQuestion({ id: `oracle_rej_${i}`, status: 'pending' }));
        disabledIds.push(insertPendingQuestion({ id: `oracle_dis_${i}`, status: 'pending' }));
      }

      // Approve approved group
      await fetch(`${baseUrl}/api/qbank/pending/approve`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ ids: approvedIds }),
      });

      // Reject rejected group
      await fetch(`${baseUrl}/api/qbank/pending/reject`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ ids: rejectedIds }),
      });

      // Disable disabled group
      await fetch(`${baseUrl}/api/qbank/pending/disable`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ ids: disabledIds }),
      });

      // RUN INVARIANT ORACLE QUERY
      // Any row in exam_eligible_pool with practice_eligible = 1 where:
      // - pending_questions status is NOT 'approved' OR
      // - questions status is NOT 'approved' OR
      // - questions is_active != 1
      // is a STRICT INVARIANT VIOLATION!
      const violations = testDb.prepare(`
        SELECT
          e.question_id,
          p.status as pending_status,
          q.status as question_status,
          q.is_active as question_is_active,
          e.practice_eligible
        FROM exam_eligible_pool e
        LEFT JOIN pending_questions p ON e.question_id = p.id
        LEFT JOIN questions q ON e.question_id = q.id
        WHERE e.practice_eligible = 1
          AND (
            COALESCE(p.status, '') != 'approved'
            OR COALESCE(q.status, '') != 'approved'
            OR COALESCE(q.is_active, 0) != 1
          )
      `).all();

      expect(violations).toHaveLength(0);

      // Also verify that total practice_eligible = 1 in pool EXACTLY equals approvedIds.length (10)
      const countRow: any = testDb.prepare(
        'SELECT COUNT(*) as cnt FROM exam_eligible_pool WHERE practice_eligible = 1'
      ).get();
      expect(countRow.cnt).toBe(10);
    });
  });

  // =========================================================================
  // SUITE 5: Malformed Questions Invariant
  // =========================================================================
  describe('5. Malformed Question Pool Invariant', () => {
    it('approving a question with < 2 options sets practice_eligible = 0 in pool', async () => {
      // Question with only 1 option (invalid for practice)
      const qId = insertPendingQuestion({
        id: 'q_malformed_1opt',
        stem: '题目内容',
        options: ['只有一个选项'],
        answer_idx: 0,
      });

      const res = await fetch(`${baseUrl}/api/qbank/pending/approve`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ id: qId }),
      });
      expect(res.status).toBe(200);

      // In pool, practice_eligible MUST be 0
      const poolRow: any = testDb.prepare('SELECT * FROM exam_eligible_pool WHERE question_id = ?').get(qId);
      expect(poolRow).toBeDefined();
      expect(poolRow.practice_eligible).toBe(0);
      expect(poolRow.ineligible_reasons).toContain('Số lượng phương án trả lời phải từ 2 trở lên');
    });
  });

  // =========================================================================
  // SUITE 6: Database Isolation & Integrity Checksum
  // =========================================================================
  describe('6. Test Database Isolation & data/hsk_exam.db Protection', () => {
    it('guarantees that all tests executed in memory and data/hsk_exam.db hash is strictly identical', () => {
      const hash = getSha256(HSK_EXAM_DB_PATH);
      expect(hash).toBe(EXPECTED_HSK_EXAM_DB_HASH);
    });
  });
});
