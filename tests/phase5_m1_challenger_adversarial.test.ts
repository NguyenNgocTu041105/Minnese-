/**
 * Milestone M1 Challenger Adversarial Test Suite:
 * Stress-testing Admin Review Queue & Inline Operations
 *
 * Scenarios tested:
 * 1. GET /api/qbank/pending with adversarial filter combinations:
 *    - part_type with SQL injection characters
 *    - part_type with unicode special characters, emojis, script tags
 *    - status='disabled' and status='all'
 *    - non-existent levels (999, -1, 0, abc, float)
 *    - pagination boundaries (negative limit/offset, huge limit)
 *    - conflicting multi-filter combinations
 * 2. Validation diagnostics with malformed/noisy inputs:
 *    - Stem with English words / Latin letters (warning)
 *    - Options with Latin letters (warning)
 *    - Stem with Vietnamese accented characters (warning)
 *    - Combined Latin + Vietnamese noise (multiple warnings)
 *    - Invalid answer_idx (negative, out-of-bounds, non-integer, non-numeric)
 *    - Duplicate options (exact duplicates, whitespace-padded duplicates)
 *    - Malformed stem (empty, whitespace-only)
 *    - Malformed options (invalid JSON, empty array, non-array)
 * 3. Batch approve, reject, and disable operations:
 *    - Mixed ID lists (valid + non-existent + malformed IDs)
 *    - Empty ID lists ({ ids: [] }, {}, non-string IDs)
 *    - Non-existent IDs only
 *    - Duplicate IDs in request payload (idempotency)
 *    - Full lifecycle state transitions (pending -> approved -> disabled -> approved -> rejected)
 *    - Transactional synchronization with exam_eligible_pool across all transitions
 * 4. Security & Admin Authentication:
 *    - Missing Authorization header rejected (401/403)
 *    - Compromised old token 'admin123456' strictly rejected (401/403)
 *    - Invalid token rejected (401/403)
 *    - Cryptographic 64-hex token accepted (200)
 * 5. Live Database Preservation:
 *    - data/hsk_exam.db SHA-256 strictly preserved as DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1
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

describe('Challenger M1: Adversarial Stress-Testing Suite', () => {
  let server: http.Server | null = null;
  let baseUrl: string = '';
  let testDb: DatabaseSync;
  const originalEnvToken = process.env.QBANK_ADMIN_TOKEN;
  const testAdminToken = crypto.randomBytes(32).toString('hex'); // 64 hex characters

  beforeAll(() => {
    // Assert live database hash before running any tests
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

    // Assert live database hash after running all tests
    expect(getSha256(HSK_EXAM_DB_PATH)).toBe(EXPECTED_HSK_EXAM_DB_HASH);
  });

  beforeEach(async () => {
    // Completely isolated in-memory SQLite database
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

  const authHeaders = (token: string = testAdminToken) => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  });

  const insertPendingRow = (overrides: Partial<any> = {}) => {
    const id = overrides.id || `adv_pend_${crypto.randomBytes(4).toString('hex')}`;
    const stem = overrides.stem || `这是压力测试题目 (${id})。`;
    const options = overrides.options || ['选项A', '选项B', '选项C', '选项D'];
    const answerIdx = overrides.answer_idx !== undefined ? overrides.answer_idx : 0;
    const explanationVi =
      overrides.explanation_vi ||
      'Giải thích chi tiết:\n+ Phương án A (选项A): Đúng ngữ nghĩa.\n+ Phương án B (选项B): Sai ngữ pháp.\n+ Phương án C (选项C): Không hợp ngữ cảnh.\n+ Phương án D (选项D): Sai từ loại.';
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
      overrides.batch_id || 'adv_batch_01',
      stem,
      JSON.stringify(options),
      answerIdx,
      overrides.pinyin || 'zhè shì cè shì',
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
  // 1. GET /api/qbank/pending ADVERSARIAL FILTERS
  // =========================================================================
  describe('1. GET /api/qbank/pending Adversarial Filter Combinations', () => {
    beforeEach(() => {
      // Seed a diverse set of pending, approved, disabled questions
      insertPendingRow({ id: 'adv_q_hsk1_read', level: 1, skill: 'reading', part_type: 'read_fill_blank_4opt', status: 'pending' });
      insertPendingRow({ id: 'adv_q_hsk2_listen', level: 2, skill: 'listening', part_type: 'listen_dialogue_4opt', status: 'pending' });
      insertPendingRow({ id: 'adv_q_hsk3_write', level: 3, skill: 'writing', part_type: 'write_sentence_reorder', status: 'pending' });
      insertPendingRow({ id: 'adv_q_disabled', level: 1, skill: 'reading', part_type: 'read_fill_blank_4opt', status: 'disabled' });
      insertPendingRow({ id: 'adv_q_approved', level: 2, skill: 'reading', part_type: 'read_fill_blank_4opt', status: 'approved' });
      insertPendingRow({ id: 'adv_q_rejected', level: 3, skill: 'reading', part_type: 'read_fill_blank_4opt', status: 'rejected' });
    });

    it('handles SQL injection payloads in part_type without crash or injection leak', async () => {
      const sqliPayloads = [
        "' OR '1'='1",
        "'; DROP TABLE pending_questions; --",
        "read_fill_blank_4opt' UNION SELECT null, null, null, null--",
        "read_fill_blank_4opt' OR 1=1 --",
      ];

      for (const payload of sqliPayloads) {
        const encoded = encodeURIComponent(payload);
        const res = await fetch(`${baseUrl}/api/qbank/pending?part_type=${encoded}`, {
          headers: authHeaders(),
        });
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        // None of the seeded items should match this literal injection string
        expect(data.total).toBe(0);
        expect(data.questions).toEqual([]);
      }

      // Assert table pending_questions still exists and was not dropped
      const count = testDb.prepare('SELECT COUNT(*) as c FROM pending_questions').get() as any;
      expect(count.c).toBe(6);
    });

    it('handles special characters, unicode emojis, and script tags in part_type', async () => {
      const specialPayloads = [
        '<script>alert("XSS")</script>',
        '🔥_emoji_test_🔥',
        'read\x00nullbyte',
        'read\nnewline',
        '   ',
      ];

      for (const payload of specialPayloads) {
        const encoded = encodeURIComponent(payload);
        const res = await fetch(`${baseUrl}/api/qbank/pending?part_type=${encoded}`, {
          headers: authHeaders(),
        });
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
      }
    });

    it('queries status="disabled" and retrieves only disabled items', async () => {
      const res = await fetch(`${baseUrl}/api/qbank/pending?status=disabled`, {
        headers: authHeaders(),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.total).toBe(1);
      expect(data.questions[0].id).toBe('adv_q_disabled');
      expect(data.questions[0].status).toBe('disabled');
    });

    it('queries status="all" and returns all items across all statuses', async () => {
      const res = await fetch(`${baseUrl}/api/qbank/pending?status=all`, {
        headers: authHeaders(),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.total).toBe(6);
      const statuses = data.questions.map((q: any) => q.status);
      expect(statuses).toContain('pending');
      expect(statuses).toContain('disabled');
      expect(statuses).toContain('approved');
      expect(statuses).toContain('rejected');
    });

    it('handles non-existent, negative, floating, and non-numeric levels gracefully', async () => {
      // Non-existent level 999
      const res999 = await fetch(`${baseUrl}/api/qbank/pending?level=999`, { headers: authHeaders() });
      expect(res999.status).toBe(200);
      const data999 = await res999.json();
      expect(data999.total).toBe(0);

      // Negative level -1
      const resNeg = await fetch(`${baseUrl}/api/qbank/pending?level=-1`, { headers: authHeaders() });
      expect(resNeg.status).toBe(200);
      const dataNeg = await resNeg.json();
      expect(dataNeg.total).toBe(0);

      // Zero level 0
      const resZero = await fetch(`${baseUrl}/api/qbank/pending?level=0`, { headers: authHeaders() });
      expect(resZero.status).toBe(200);
      const dataZero = await resZero.json();
      expect(dataZero.total).toBe(0);

      // Floating level: 2.7 -> parseInt gives 2 -> should return HSK 2 pending item
      const resFloat = await fetch(`${baseUrl}/api/qbank/pending?level=2.7`, { headers: authHeaders() });
      expect(resFloat.status).toBe(200);
      const dataFloat = await resFloat.json();
      expect(dataFloat.total).toBe(1);
      expect(dataFloat.questions[0].id).toBe('adv_q_hsk2_listen');

      // Non-numeric string 'invalid_level' -> parseInt gives NaN, ignored, returns all pending (3 items)
      const resNaN = await fetch(`${baseUrl}/api/qbank/pending?level=invalid_level`, { headers: authHeaders() });
      expect(resNaN.status).toBe(200);
      const dataNaN = await resNaN.json();
      expect(dataNaN.total).toBe(3);
    });

    it('handles extreme pagination values (negative limit/offset, huge limit)', async () => {
      // Negative limit bounded to at least 1
      const resNegLimit = await fetch(`${baseUrl}/api/qbank/pending?limit=-10`, { headers: authHeaders() });
      expect(resNegLimit.status).toBe(200);
      const dataNegLimit = await resNegLimit.json();
      expect(dataNegLimit.questions.length).toBe(1);

      // Huge limit bounded to at most 200
      const resHugeLimit = await fetch(`${baseUrl}/api/qbank/pending?limit=99999`, { headers: authHeaders() });
      expect(resHugeLimit.status).toBe(200);
      const dataHugeLimit = await resHugeLimit.json();
      expect(dataHugeLimit.questions.length).toBeLessThanOrEqual(200);

      // Negative offset clamped to 0
      const resNegOffset = await fetch(`${baseUrl}/api/qbank/pending?offset=-10`, { headers: authHeaders() });
      expect(resNegOffset.status).toBe(200);
      const dataNegOffset = await resNegOffset.json();
      expect(dataNegOffset.questions.length).toBe(3);

      // Far offset returning empty questions array with valid total
      const resFarOffset = await fetch(`${baseUrl}/api/qbank/pending?offset=1000`, { headers: authHeaders() });
      expect(resFarOffset.status).toBe(200);
      const dataFarOffset = await resFarOffset.json();
      expect(dataFarOffset.total).toBe(3);
      expect(dataFarOffset.questions).toEqual([]);
    });

    it('returns empty result cleanly for conflicting adversarial multi-filter', async () => {
      // HSK 1, Writing skill, part_type listen_dialogue_4opt, status disabled (no such question exists)
      const res = await fetch(
        `${baseUrl}/api/qbank/pending?level=1&skill=writing&part_type=listen_dialogue_4opt&status=disabled`,
        { headers: authHeaders() }
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.total).toBe(0);
      expect(data.questions).toEqual([]);
    });
  });

  // =========================================================================
  // 2. VALIDATION DIAGNOSTICS WITH MALFORMED / NOISY INPUTS
  // =========================================================================
  describe('2. Validation Diagnostics with Malformed/Noisy Inputs', () => {
    it('detects English words in stem as warning', () => {
      const row = {
        id: 'diag_latin_stem',
        stem: '我想去 university 学习。',
        options: JSON.stringify(['大学', '中学', '小学', '幼儿园']),
        answer_idx: 0,
        explanation_vi: 'Giải thích',
      };
      const res = formatPendingRow(row);
      expect(res.validation_diagnostics.warnings).toContain(
        'Phát hiện ký tự Latin trong nội dung câu hỏi hoặc phương án'
      );
      expect(res.validation_diagnostics.valid).toBe(true); // Warning does not invalidate
    });

    it('detects English words in options as warning', () => {
      const row = {
        id: 'diag_latin_options',
        stem: '这是什么水果？',
        options: JSON.stringify(['苹果 (apple)', '香蕉', '橙子', '西瓜']),
        answer_idx: 0,
        explanation_vi: 'Giải thích',
      };
      const res = formatPendingRow(row);
      expect(res.validation_diagnostics.warnings).toContain(
        'Phát hiện ký tự Latin trong nội dung câu hỏi hoặc phương án'
      );
    });

    it('detects Vietnamese accented characters in stem as warning', () => {
      const row = {
        id: 'diag_vi_stem',
        stem: '他是我的 thầy giáo。',
        options: JSON.stringify(['老师', '学生', '医生', '司机']),
        answer_idx: 0,
        explanation_vi: 'Giải thích',
      };
      const res = formatPendingRow(row);
      expect(res.validation_diagnostics.warnings).toContain(
        'Phát hiện ký tự tiếng Việt trong nội dung chữ Hán'
      );
      expect(res.validation_diagnostics.valid).toBe(true);
    });

    it('detects multiple noise factors simultaneously', () => {
      const row = {
        id: 'diag_multi_noise',
        stem: 'My teacher là 老师。', // English + Vietnamese
        options: JSON.stringify(['A', 'B', 'C', 'D']),
        answer_idx: 0,
        explanation_vi: 'Giải thích',
      };
      const res = formatPendingRow(row);
      expect(res.validation_diagnostics.warnings).toContain(
        'Phát hiện ký tự Latin trong nội dung câu hỏi hoặc phương án'
      );
      expect(res.validation_diagnostics.warnings).toContain(
        'Phát hiện ký tự tiếng Việt trong nội dung chữ Hán'
      );
    });

    it('flags invalid answer_idx values as fatal errors (negative, out of bounds, non-integer, non-numeric)', () => {
      const testCases = [
        { answer_idx: -1, expected: 'Chỉ số đáp án' },
        { answer_idx: 4, expected: 'Chỉ số đáp án' },
        { answer_idx: 99, expected: 'Chỉ số đáp án' },
        { answer_idx: 1.5, expected: 'Chỉ số đáp án' },
        { answer_idx: 'invalid_idx', expected: 'Chỉ số đáp án' },
      ];

      for (const tc of testCases) {
        const row = {
          id: `diag_idx_${tc.answer_idx}`,
          stem: '题目内容。',
          options: JSON.stringify(['A', 'B', 'C', 'D']),
          answer_idx: tc.answer_idx,
          explanation_vi: 'Giải thích',
        };
        const res = formatPendingRow(row);
        expect(res.validation_diagnostics.valid).toBe(false);
        expect(res.validation_diagnostics.errors.some((e: string) => e.includes(tc.expected))).toBe(true);
      }
    });

    it('flags duplicate options as fatal validation errors (exact and trimmed duplicates)', () => {
      // Exact duplicate
      const rowExact = {
        id: 'diag_dup_exact',
        stem: '题目内容。',
        options: JSON.stringify(['电脑', '手机', '电脑', '电视']),
        answer_idx: 0,
        explanation_vi: 'Giải thích',
      };
      const resExact = formatPendingRow(rowExact);
      expect(resExact.validation_diagnostics.valid).toBe(false);
      expect(resExact.validation_diagnostics.errors.some((e: string) => e.includes('trùng lặp'))).toBe(true);

      // Trimmed duplicate (one with spaces)
      const rowTrimmed = {
        id: 'diag_dup_trimmed',
        stem: '题目内容。',
        options: JSON.stringify(['苹果', '香蕉', ' 苹果 ', '西瓜']),
        answer_idx: 0,
        explanation_vi: 'Giải thích',
      };
      const resTrimmed = formatPendingRow(rowTrimmed);
      expect(resTrimmed.validation_diagnostics.valid).toBe(false);
      expect(resTrimmed.validation_diagnostics.errors.some((e: string) => e.includes('trùng lặp'))).toBe(true);
    });

    it('flags empty stem as fatal validation error', () => {
      const rowEmpty = {
        id: 'diag_empty_stem',
        stem: '   ',
        options: JSON.stringify(['A', 'B', 'C', 'D']),
        answer_idx: 0,
        explanation_vi: 'Giải thích',
      };
      const res = formatPendingRow(rowEmpty);
      expect(res.validation_diagnostics.valid).toBe(false);
      expect(res.validation_diagnostics.errors).toContain('Nội dung đề bài (stem) trống');
    });

    it('flags malformed options JSON safely as fatal validation error', () => {
      const rowCorrupt = {
        id: 'diag_corrupt_opt',
        stem: '题目内容。',
        options: '{"not_an_array": true', // Corrupted JSON string
        answer_idx: 0,
        explanation_vi: 'Giải thích',
      };
      const res = formatPendingRow(rowCorrupt);
      expect(res.validation_diagnostics.valid).toBe(false);
      expect(res.validation_diagnostics.errors).toContain('Thiếu danh sách phương án lựa chọn');
      expect(res.options).toEqual([]);
    });

    it('formatPendingRow safely handles non-array JSON options ("null", "123") without crashing', () => {
      // When row.options is 'null' or '123' (e.g. from malformed pending items),
      // formatPendingRow safely sets options = [] and returns valid: false with diagnostic error.
      const rowNull = {
        id: 'diag_null_opt',
        stem: '题目内容。',
        options: 'null',
        answer_idx: 0,
        explanation_vi: 'Giải thích',
      };
      const res = formatPendingRow(rowNull);
      expect(res.validation_diagnostics.valid).toBe(false);
      expect(res.validation_diagnostics.errors).toContain('Thiếu danh sách phương án lựa chọn');
    });

    it('flags row with answer_idx=null as fatal validation error', () => {
      // When answer_idx is null (missing answer key from model/db), it is flagged as an error
      const rowNullIdx = {
        id: 'diag_null_idx',
        stem: '题目内容。',
        options: JSON.stringify(['A', 'B', 'C', 'D']),
        answer_idx: null,
        explanation_vi: 'Giải thích',
      };
      const res = formatPendingRow(rowNullIdx);
      expect(res.validation_diagnostics.valid).toBe(false);
      expect(res.validation_diagnostics.errors.some((e: string) => e.includes('đáp án'))).toBe(true);
    });

    it('flags question with only 1 option as fatal validation error', () => {
      // An MCQ question needs at least 2 options; options.length < 2 is flagged as an error
      const rowSingleOpt = {
        id: 'diag_single_opt',
        stem: '题目内容。',
        options: JSON.stringify(['唯一的选项']),
        answer_idx: 0,
        explanation_vi: 'Giải thích',
      };
      const res = formatPendingRow(rowSingleOpt);
      expect(res.validation_diagnostics.valid).toBe(false);
      expect(res.validation_diagnostics.errors.some((e: string) => e.includes('phương án'))).toBe(true);
    });
  });

  // =========================================================================
  // 3. BATCH APPROVE, REJECT, AND DISABLE OPERATIONS
  // =========================================================================
  describe('3. Batch Operations with Mixed, Empty, and Non-Existent IDs', () => {
    it('handles mixed ID list in approve (valid IDs + non-existent IDs)', async () => {
      const validId1 = insertPendingRow({ id: 'app_mixed_1' });
      const validId2 = insertPendingRow({ id: 'app_mixed_2' });
      const nonExistentId1 = 'non_existent_id_abc';
      const nonExistentId2 = 'non_existent_id_xyz';

      const res = await fetch(`${baseUrl}/api/qbank/pending/approve`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          ids: [validId1, nonExistentId1, validId2, nonExistentId2],
        }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.approved_count).toBe(2);
      expect(data.approved_ids).toEqual([validId1, validId2]);

      // Assert valid IDs synced to exam_eligible_pool
      for (const id of [validId1, validId2]) {
        const poolRow: any = testDb.prepare('SELECT * FROM exam_eligible_pool WHERE question_id = ?').get(id);
        expect(poolRow).toBeDefined();
        expect(poolRow.practice_eligible).toBe(1);
      }

      // Assert non-existent IDs never created
      expect(testDb.prepare('SELECT * FROM exam_eligible_pool WHERE question_id = ?').get(nonExistentId1)).toBeUndefined();
    });

    it('handles empty ID lists gracefully in approve, reject, and disable', async () => {
      const emptyPayloads = [
        { ids: [] },
        { question_ids: [] },
        { ids: ['   ', '', null, undefined] },
        {},
      ];

      for (const payload of emptyPayloads) {
        // Approve
        const resApp = await fetch(`${baseUrl}/api/qbank/pending/approve`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(payload),
        });
        expect(resApp.status).toBe(200);
        const dataApp = await resApp.json();
        expect(dataApp.success).toBe(true);
        expect(dataApp.approved_count).toBe(0);
        expect(dataApp.approved_ids).toEqual([]);

        // Reject
        const resRej = await fetch(`${baseUrl}/api/qbank/pending/reject`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(payload),
        });
        expect(resRej.status).toBe(200);
        const dataRej = await resRej.json();
        expect(dataRej.success).toBe(true);
        expect(dataRej.rejected_count).toBe(0);
        expect(dataRej.rejected_ids).toEqual([]);

        // Disable
        const resDis = await fetch(`${baseUrl}/api/qbank/pending/disable`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(payload),
        });
        expect(resDis.status).toBe(200);
        const dataDis = await resDis.json();
        expect(dataDis.success).toBe(true);
        expect(dataDis.disabled_count).toBe(0);
        expect(dataDis.disabled_ids).toEqual([]);
      }
    });

    it('handles non-existent IDs only without error or side effects', async () => {
      const payload = { ids: ['phantom_1', 'phantom_2'] };

      // Approve non-existent
      const resApp = await fetch(`${baseUrl}/api/qbank/pending/approve`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      expect(resApp.status).toBe(200);
      const dataApp = await resApp.json();
      expect(dataApp.success).toBe(true);
      expect(dataApp.approved_count).toBe(0);

      // Reject non-existent returns 200 without SQL crash
      const resRej = await fetch(`${baseUrl}/api/qbank/pending/reject`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      expect(resRej.status).toBe(200);

      // Disable non-existent returns 200 without SQL crash
      const resDis = await fetch(`${baseUrl}/api/qbank/pending/disable`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      expect(resDis.status).toBe(200);
    });

    it('POST /api/qbank/pending/reject accurately counts existing IDs in rejected_count and rejected_ids', async () => {
      const payload = { ids: ['non_existent_ghost_q1', 'non_existent_ghost_q2'] };
      const res = await fetch(`${baseUrl}/api/qbank/pending/reject`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      expect(data.rejected_count).toBe(0);
      expect(data.rejected_ids).toEqual([]);
    });

    it('POST /api/qbank/pending/disable accurately counts existing IDs in disabled_count and disabled_ids', async () => {
      const payload = { ids: ['non_existent_ghost_q1', 'non_existent_ghost_q2'] };
      const res = await fetch(`${baseUrl}/api/qbank/pending/disable`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      expect(data.disabled_count).toBe(0);
      expect(data.disabled_ids).toEqual([]);
    });

    it('is idempotent when approving already approved question or duplicate IDs in payload', async () => {
      const qId = insertPendingRow({ id: 'idemp_q_1' });

      // Approve once
      await fetch(`${baseUrl}/api/qbank/pending/approve`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ id: qId }),
      });

      // Approve again with duplicate IDs in list
      const res = await fetch(`${baseUrl}/api/qbank/pending/approve`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ ids: [qId, qId] }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);

      // Single entry in questions and pool
      const qCount: any = testDb.prepare('SELECT COUNT(*) as c FROM questions WHERE id = ?').get(qId);
      expect(qCount.c).toBe(1);
      const poolCount: any = testDb.prepare('SELECT COUNT(*) as c FROM exam_eligible_pool WHERE question_id = ?').get(qId);
      expect(poolCount.c).toBe(1);
    });

    it('completes full state transition lifecycle: Pending -> Approved -> Disabled -> Re-approved -> Rejected', async () => {
      const qId = insertPendingRow({ id: 'lifecycle_q_1', status: 'pending' });

      // Step 1: Approve -> in pool
      const step1 = await fetch(`${baseUrl}/api/qbank/pending/approve`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ id: qId }),
      });
      expect(step1.status).toBe(200);
      expect(testDb.prepare('SELECT practice_eligible FROM exam_eligible_pool WHERE question_id = ?').get(qId)).toEqual({ practice_eligible: 1 });
      expect(testDb.prepare('SELECT status, is_active FROM questions WHERE id = ?').get(qId)).toEqual({ status: 'approved', is_active: 1 });

      // Step 2: Disable -> purged from pool
      const step2 = await fetch(`${baseUrl}/api/qbank/pending/disable`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ id: qId }),
      });
      expect(step2.status).toBe(200);
      expect(testDb.prepare('SELECT * FROM exam_eligible_pool WHERE question_id = ?').get(qId)).toBeUndefined();
      expect(testDb.prepare('SELECT status, is_active FROM questions WHERE id = ?').get(qId)).toEqual({ status: 'disabled', is_active: 0 });

      // Step 3: Re-approve -> re-enters pool with practice_eligible = 1
      const step3 = await fetch(`${baseUrl}/api/qbank/pending/approve`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ id: qId }),
      });
      expect(step3.status).toBe(200);
      expect(testDb.prepare('SELECT practice_eligible FROM exam_eligible_pool WHERE question_id = ?').get(qId)).toEqual({ practice_eligible: 1 });
      expect(testDb.prepare('SELECT status, is_active FROM questions WHERE id = ?').get(qId)).toEqual({ status: 'approved', is_active: 1 });

      // Step 4: Reject -> purged from pool and questions table
      const step4 = await fetch(`${baseUrl}/api/qbank/pending/reject`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ id: qId, rejection_note: 'Reject test' }),
      });
      expect(step4.status).toBe(200);
      expect(testDb.prepare('SELECT * FROM exam_eligible_pool WHERE question_id = ?').get(qId)).toBeUndefined();
      expect(testDb.prepare('SELECT * FROM questions WHERE id = ?').get(qId)).toBeUndefined();
      expect(testDb.prepare('SELECT status, is_active FROM pending_questions WHERE id = ?').get(qId)).toEqual({ status: 'rejected', is_active: 0 });
    });
  });

  // =========================================================================
  // 4. SECURITY & ADMIN AUTHENTICATION
  // =========================================================================
  describe('4. Security & Admin Authentication Verification', () => {
    it('strictly rejects unauthenticated requests (missing Authorization header)', async () => {
      const endpoints = [
        { url: `${baseUrl}/api/qbank/pending`, method: 'GET' },
        { url: `${baseUrl}/api/qbank/pending/approve`, method: 'POST', body: { ids: ['test'] } },
        { url: `${baseUrl}/api/qbank/pending/reject`, method: 'POST', body: { ids: ['test'] } },
        { url: `${baseUrl}/api/qbank/pending/disable`, method: 'POST', body: { ids: ['test'] } },
      ];

      for (const ep of endpoints) {
        const res = await fetch(ep.url, {
          method: ep.method,
          headers: { 'Content-Type': 'application/json' },
          body: ep.body ? JSON.stringify(ep.body) : undefined,
        });
        expect([401, 403]).toContain(res.status);
      }
    });

    it('strictly rejects requests with the compromised old token "admin123456"', async () => {
      const res = await fetch(`${baseUrl}/api/qbank/pending`, {
        headers: authHeaders('admin123456'),
      });
      expect([401, 403]).toContain(res.status);
    });

    it('strictly rejects requests with arbitrary invalid bearer tokens', async () => {
      const res = await fetch(`${baseUrl}/api/qbank/pending`, {
        headers: authHeaders('malicious_forged_token_1234567890'),
      });
      expect([401, 403]).toContain(res.status);
    });

    it('accepts valid 64-hex-character token and executes operations successfully', async () => {
      const res = await fetch(`${baseUrl}/api/qbank/pending`, {
        headers: authHeaders(testAdminToken),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });
  });

  // =========================================================================
  // 5. LIVE DATABASE IMMUTABILITY INVARIANT
  // =========================================================================
  describe('5. Live Database Immutability Check', () => {
    it('strictly preserves data/hsk_exam.db SHA-256 hash across all operations', () => {
      const currentHash = getSha256(HSK_EXAM_DB_PATH);
      expect(currentHash).toBe(EXPECTED_HSK_EXAM_DB_HASH);
    });
  });
});
