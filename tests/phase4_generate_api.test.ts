import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import express from 'express';
import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { DatabaseSync } from 'node:sqlite';

import {
  qbankRouter,
  ensurePendingSchema,
  computeContentHash,
  setQBankAdminTokenForTesting,
  setDbSyncForTesting,
} from '../src/server/qbankRoutes.js';
import {
  setMockLLMHandler,
  resetMockLLMHandler,
} from '../src/server/llm/waterfallGenerator.js';
import { computeNearDuplicateSignature } from '../src/server/qbankCoverageEngine.js';

describe('Milestone 3: POST /api/qbank/generate Response Contract & UI Accounting Suite', () => {
  const TEST_TOKEN = 'test-token-phase4-' + Date.now();
  const HSK_EXAM_DB_PATH = path.resolve(process.cwd(), 'data/hsk_exam.db');
  const EXPECTED_HSK_EXAM_DB_HASH = 'DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1';

  let testDb: DatabaseSync;
  let app: express.Express;
  let server: http.Server;
  let baseUrl: string;

  beforeEach(async () => {
    // 1. Create isolated in-memory SQLite database
    testDb = new DatabaseSync(':memory:');
    ensurePendingSchema(testDb);
    setDbSyncForTesting(testDb);

    // 2. Set test admin token
    setQBankAdminTokenForTesting(TEST_TOKEN);

    // 3. Start local express test server
    app = express();
    app.use(express.json());
    app.use('/api/qbank', qbankRouter);

    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address() as any;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  afterEach(async () => {
    resetMockLLMHandler();
    setDbSyncForTesting(null);
    setQBankAdminTokenForTesting(null);

    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    if (testDb) {
      try {
        testDb.close();
      } catch {}
    }
  });

  async function callGenerateApi(payload: Record<string, any>) {
    const res = await fetch(`${baseUrl}/api/qbank/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-QBank-Admin-Token': TEST_TOKEN,
        'Host': '127.0.0.1',
      },
      body: JSON.stringify({
        mock: true,
        ...payload,
      }),
    });
    const data = await res.json();
    return { status: res.status, data };
  }

  // =========================================================================
  // Test 1: Real run with all rejected -> success: false, status: 'all_rejected'
  // =========================================================================
  it('should return success: false and status: "all_rejected" when 100% of candidates fail validation', async () => {
    // Mock returns candidates that will be rejected (e.g. English words in stem, invalid options count)
    setMockLLMHandler(() => [
      {
        stem: 'Today is Sunday and I want to go to ____.', // Fails: Latin characters
        options: ['学校', '医院', '商店', '机场'],
        answer_idx: 0,
        explanation_vi: 'Giải thích tiếng Việt',
        part_type: 'read_fill_blank_4opt',
        level: 1,
        skill: 'reading',
      },
      {
        stem: '明天天气很好，我们去玩吧。',
        options: ['A', 'B'], // Fails: only 2 options instead of 4
        answer_idx: 0,
        explanation_vi: 'Giải thích tiếng Việt',
        part_type: 'read_fill_blank_4opt',
        level: 1,
        skill: 'reading',
      },
    ]);

    const { status, data } = await callGenerateApi({
      level: 1,
      count: 2,
      part_type: 'read_fill_blank_4opt',
      dry_run: false,
    });

    expect(status).toBe(200);
    expect(data.success).toBe(false); // CRITICAL: Never report success when 0 questions saved
    expect(data.status).toBe('all_rejected');
    expect(data.saved).toBe(false);
    expect(data.is_dry_run).toBe(false);
    expect(data.count).toBe(0);
    expect(data.count_requested).toBe(2);
    expect(data.count_generated).toBe(2);
    expect(data.count_passed_validator).toBe(0);
    expect(data.count_saved_pending).toBe(0);
    expect(data.count_rejected_validator).toBe(2);
    expect(data.questions).toEqual([]);
    expect(data.message).toContain('Toàn bộ 2 câu hỏi bị từ chối');

    // Verify DB state: zero rows in pending_questions
    const pendingCount = (testDb.prepare('SELECT COUNT(*) as cnt FROM pending_questions').get() as any).cnt;
    expect(pendingCount).toBe(0);

    // Verify generation_runs recorded all_rejected audit
    const runRow = testDb.prepare('SELECT * FROM generation_runs WHERE batch_id = ?').get(data.batch_id) as any;
    expect(runRow).toBeDefined();
    expect(runRow.status).toBe('all_rejected');
    expect(runRow.count_saved_pending).toBe(0);
    expect(runRow.count_rejected_validator).toBe(2);
  });

  // =========================================================================
  // Test 2: Real run with partial save -> success: true, status: 'partial'
  // =========================================================================
  it('should return success: true and status: "partial" when some candidates pass and some fail', async () => {
    const uniqueStemA = `独特的阅读测试题目甲${Date.now()}：学生在教室里认真____。`;
    const uniqueStemB = `独特的阅读测试题目乙${Date.now()}：他在书房里安静地____。`;

    setMockLLMHandler(() => [
      // 2 valid novel candidates
      {
        stem: uniqueStemA,
        options: ['写字', '唱歌', '跳舞', '游泳'],
        answer_idx: 0,
        explanation_vi: 'Học sinh trong lớp học viết chữ (写字). Cả 4 phương án đều là động từ hoạt động.',
        part_type: 'read_fill_blank_4opt',
        level: 1,
        skill: 'reading',
      },
      {
        stem: uniqueStemB,
        options: ['看书', '跑步', '踢球', '滑雪'],
        answer_idx: 0,
        explanation_vi: 'Ở trong thư phòng thì phù hợp nhất là đọc sách (看书).',
        part_type: 'read_fill_blank_4opt',
        level: 1,
        skill: 'reading',
      },
      // 1 invalid candidate
      {
        stem: 'This contains Latin characters and should be rejected.',
        options: ['苹果', '香蕉', '西瓜', '米饭'],
        answer_idx: 0,
        explanation_vi: 'Giải thích',
        part_type: 'read_fill_blank_4opt',
        level: 1,
        skill: 'reading',
      },
    ]);

    const { status, data } = await callGenerateApi({
      level: 1,
      count: 3,
      part_type: 'read_fill_blank_4opt',
      dry_run: false,
    });

    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.status).toBe('partial');
    expect(data.saved).toBe(true);
    expect(data.is_dry_run).toBe(false);
    expect(data.count).toBe(2);
    expect(data.count_requested).toBe(3);
    expect(data.count_generated).toBe(3);
    expect(data.count_passed_validator).toBe(2);
    expect(data.count_saved_pending).toBe(2);
    expect(data.count_rejected_validator).toBe(1);
    expect(data.questions.length).toBe(2);
    expect(data.message).toContain('Sinh thành công một phần: 2/3');

    // Verify DB: exactly 2 items in pending_questions
    const pendingCount = (testDb.prepare('SELECT COUNT(*) as cnt FROM pending_questions').get() as any).cnt;
    expect(pendingCount).toBe(2);

    // Verify audit record
    const runRow = testDb.prepare('SELECT * FROM generation_runs WHERE batch_id = ?').get(data.batch_id) as any;
    expect(runRow.status).toBe('partial');
    expect(runRow.count_saved_pending).toBe(2);
    expect(runRow.count_rejected_validator).toBe(1);
  });

  // =========================================================================
  // Test 3: Real run with full save -> success: true, status: 'success'
  // =========================================================================
  it('should return success: true and status: "success" when 100% of candidates pass and persist', async () => {
    const uniqueStem1 = `全新的中文测试句一${Date.now()}：小猫在椅子下面____。`;
    const uniqueStem2 = `全新的中文测试句二${Date.now()}：小狗在院子里高兴地____。`;

    setMockLLMHandler(() => [
      {
        stem: uniqueStem1,
        options: ['睡觉', '唱歌', '跳舞', '跑步'],
        answer_idx: 0,
        explanation_vi: 'Mèo con ngủ dưới ghế (睡觉). Cả 4 phương án đều là động từ.',
        part_type: 'read_fill_blank_4opt',
        level: 1,
        skill: 'reading',
      },
      {
        stem: uniqueStem2,
        options: ['看书', '喝水', '吃饭', '看病'],
        answer_idx: 0,
        explanation_vi: 'Chú cún vui vẻ đọc sách (看书) ở trong sân.',
        part_type: 'read_fill_blank_4opt',
        level: 1,
        skill: 'reading',
      },
    ]);

    const { status, data } = await callGenerateApi({
      level: 1,
      count: 2,
      part_type: 'read_fill_blank_4opt',
      dry_run: false,
    });

    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.status).toBe('success');
    expect(data.saved).toBe(true);
    expect(data.is_dry_run).toBe(false);
    expect(data.count).toBe(2);
    expect(data.count_requested).toBe(2);
    expect(data.count_generated).toBe(2);
    expect(data.count_passed_validator).toBe(2);
    expect(data.count_saved_pending).toBe(2);
    expect(data.count_rejected_validator).toBe(0);
    expect(data.questions.length).toBe(2);
    expect(data.message).toContain('Đã sinh và lưu thành công 2/2 câu hỏi');

    const pendingCount = (testDb.prepare('SELECT COUNT(*) as cnt FROM pending_questions').get() as any).cnt;
    expect(pendingCount).toBe(2);
  });

  // =========================================================================
  // Test 4: Dry-run mode -> status: 'dry_run', saved: false, count: 0, zero mutations
  // =========================================================================
  it('should return status: "dry_run", saved: false, count: 0, and not mutate pending_questions or generation_runs in dry_run mode', async () => {
    const uniqueStemDry = `测试跑测试跑试卷${Date.now()}：老师在黑板上____汉字。`;

    setMockLLMHandler(() => [
      {
        stem: uniqueStemDry,
        options: ['写了', '喝了', '吃了', '买了'],
        answer_idx: 0,
        explanation_vi: 'Thầy giáo viết chữ Hán trên bảng (写了). Cả 4 phương án là động từ.',
        part_type: 'read_fill_blank_4opt',
        level: 1,
        skill: 'reading',
      },
    ]);

    const { status, data } = await callGenerateApi({
      level: 1,
      count: 1,
      part_type: 'read_fill_blank_4opt',
      dry_run: true,
    });

    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.status).toBe('dry_run');
    expect(data.is_dry_run).toBe(true);
    expect(data.saved).toBe(false);
    expect(data.count).toBe(0);
    expect(data.count_saved_pending).toBe(0);
    expect(data.count_passed_validator).toBe(1);
    expect(data.count_generated).toBe(1);
    expect(data.message).toContain('Chế độ chạy thử (Dry Run)');
    expect(data.message).toContain('Không có dữ liệu nào được lưu');

    // Verify DB was NOT touched at all
    const pendingCount = (testDb.prepare('SELECT COUNT(*) as cnt FROM pending_questions').get() as any).cnt;
    expect(pendingCount).toBe(0);
    const runsCount = (testDb.prepare('SELECT COUNT(*) as cnt FROM generation_runs').get() as any).cnt;
    expect(runsCount).toBe(0);
  });

  // =========================================================================
  // Test 5: Deduplication wiring into validateCandidate (existingContentHashes & nearDupSignatures)
  // =========================================================================
  it('should reject candidates matching existing content_hash or near_duplicate_signature and intra-batch duplicates', async () => {
    // 1. Insert an existing active question into `questions`
    const existingStem = `独一无二的数据库已有原题${Date.now()}：桌子上有新鲜的____。`;
    const existingOptions = ['苹果', '香蕉', '西瓜', '米饭'];
    const existingHash = computeContentHash(existingStem, existingOptions, 0);
    const existingNearSig = computeNearDuplicateSignature(existingStem, existingOptions);

    testDb.prepare(`
      INSERT INTO questions (
        id, stem, options, answer_idx, explanation_vi, level, skill, part_type, content_hash, near_duplicate_signature, status, is_active
      ) VALUES (?, ?, ?, 0, 'Giải thích', 1, 'reading', 'read_fill_blank_4opt', ?, ?, 'active', 1)
    `).run('q_exist_1', existingStem, JSON.stringify(existingOptions), existingHash, existingNearSig);

    // 2. Mock LLM returns:
    // Question 1: exact match with existing question
    // Question 2: novel valid question
    // Question 3: intra-batch duplicate (same stem & options as Question 2)
    const novelStem = `独一无二的新生成考题${Date.now()}：厨房里煮了热____。`;
    const novelOptions = ['米饭', '面条', '包子', '饺子'];

    setMockLLMHandler(() => [
      {
        stem: existingStem,
        options: existingOptions,
        answer_idx: 0,
        explanation_vi: 'Giải thích trùng lặp',
        part_type: 'read_fill_blank_4opt',
        level: 1,
        skill: 'reading',
      },
      {
        stem: novelStem,
        options: novelOptions,
        answer_idx: 0,
        explanation_vi: 'Giải thích câu mới 1',
        part_type: 'read_fill_blank_4opt',
        level: 1,
        skill: 'reading',
      },
      {
        stem: novelStem,
        options: novelOptions, // Intra-batch duplicate of the preceding question
        answer_idx: 0,
        explanation_vi: 'Giải thích câu mới 2',
        part_type: 'read_fill_blank_4opt',
        level: 1,
        skill: 'reading',
      },
    ]);

    const { status, data } = await callGenerateApi({
      level: 1,
      count: 3,
      part_type: 'read_fill_blank_4opt',
      dry_run: false,
    });

    expect(status).toBe(200);
    expect(data.status).toBe('partial');
    expect(data.count_generated).toBe(3);
    expect(data.count_passed_validator).toBe(1);
    expect(data.count_saved_pending).toBe(1);
    expect(data.count_rejected_validator).toBe(2); // 1 against DB, 1 intra-batch
    expect(data.rejected_reasons['Trùng lặp (>85% stem hoặc trùng options)']).toBeGreaterThan(0);
  });

  // =========================================================================
  // Test 6: Provider error (503) & DB preservation
  // =========================================================================
  it('should handle LLM provider exhaustion gracefully with 503 and preserve existing DB rows', async () => {
    // 1. Seed an existing pending question
    testDb.prepare(`
      INSERT INTO pending_questions (
        id, batch_id, stem, options, answer_idx, explanation_vi, level, skill, part_type, status, content_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'pend_pre_1',
      'batch_pre_1',
      '原有未决题目保留不变。',
      JSON.stringify(['A', 'B', 'C', 'D']),
      0,
      'Giải thích',
      1,
      'reading',
      'read_fill_blank_4opt',
      'pending',
      'hash_pre_1'
    );

    // 2. Mock handler throws provider exhaustion
    setMockLLMHandler(() => {
      const err: any = new Error('LLM_ALL_PROVIDERS_EXHAUSTED');
      err.code = 'LLM_ALL_PROVIDERS_EXHAUSTED';
      throw err;
    });

    const { status, data } = await callGenerateApi({
      level: 1,
      count: 5,
      part_type: 'read_fill_blank_4opt',
      dry_run: false,
    });

    expect(status).toBe(503);
    expect(data.success).toBe(false);
    expect(data.status).toBe('failed');
    expect(data.code).toBe('LLM_ALL_PROVIDERS_EXHAUSTED');
    expect(data.count_saved_pending).toBe(0);

    // 3. Confirm existing pending question is preserved
    const preRow = testDb.prepare('SELECT * FROM pending_questions WHERE id = ?').get('pend_pre_1') as any;
    expect(preRow).toBeDefined();
    expect(preRow.stem).toBe('原有未决题目保留不变。');
  });

  // =========================================================================
  // Test 7: Integrity check - data/hsk_exam.db SHA-256 hash strictly preserved
  // =========================================================================
  it('should maintain unchanged SHA-256 hash for data/hsk_exam.db', () => {
    expect(fs.existsSync(HSK_EXAM_DB_PATH)).toBe(true);
    const fileBuf = fs.readFileSync(HSK_EXAM_DB_PATH);
    const hash = crypto.createHash('sha256').update(fileBuf).digest('hex').toUpperCase();
    expect(hash).toBe(EXPECTED_HSK_EXAM_DB_HASH);
  });
});
