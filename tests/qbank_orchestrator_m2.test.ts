import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import {
  runScheduledBatch,
  getAutoSchedulerStatus,
  getSchedulerConfig,
  updateSchedulerConfig,
} from '../src/server/cron/autoQuestionScheduler.js';
import {
  setMockLLMHandler,
  resetMockLLMHandler,
  classifyLLMError,
  generateWaterfallQuestions,
  WATERFALL_PROVIDERS,
  generateMockQuestions,
} from '../src/server/llm/waterfallGenerator.js';
import {
  computeCoverageMatrix,
  getPriorityDeficitGroup,
  applyAdditiveQBankMigrations,
  planBatchVocab,
  computeNearDuplicateSignature,
  computeContentHash,
} from '../src/server/qbankCoverageEngine.js';
import {
  ensureEligiblePoolSchema,
  releaseStaleTasks,
  createPersistentTask,
  getPersistentTask,
  completePersistentTask,
  failPersistentTask,
} from '../src/server/qbankFormatSync.js';

describe('Milestone 2: Deficit Orchestrator, Concurrency Lock & Quota Control Suite', () => {
  beforeEach(() => {
    resetMockLLMHandler();
  });

  afterEach(() => {
    resetMockLLMHandler();
  });

  // --------------------------------------------------------------------------
  // 1. Reviewer 2 Finding 1: Multi-word tested_vocab JSON parsing via ||| delimiter
  // --------------------------------------------------------------------------
  describe('1. Tested Vocab Delimiter Fix (Reviewer 2 Finding 1)', () => {
    it('should parse multi-word JSON array in tested_vocab correctly using ||| delimiter', () => {
      const db = new DatabaseSync(':memory:');
      applyAdditiveQBankMigrations(db);

      // Insert 2 approved questions with blueprint-valid part_type read_fill_blank_word_bank_6opt
      // Row 1 tests 2 words: ["苹果","香蕉"]
      // Row 2 tests 1 word: ["学校"]
      db.exec(`
        INSERT INTO questions (id, stem, options, answer_idx, explanation_vi, level, skill, part_type, status, is_active, tested_vocab)
        VALUES 
        ('q1', '桌子上有好吃的____。', '["苹果","香蕉","西瓜","米饭"]', 0, 'Giải thích câu 1', 1, 'reading', 'read_fill_blank_word_bank_6opt', 'approved', 1, '["苹果","香蕉"]'),
        ('q2', '今天天气很好，我想去____借两本书。', '["学校","医院","机场","商店"]', 0, 'Giải thích câu 2', 1, 'reading', 'read_fill_blank_word_bank_6opt', 'approved', 1, '["学校"]');
      `);

      const matrix = computeCoverageMatrix(db);
      const row = matrix.rows.find((r) => r.level === 1 && r.part_type === 'read_fill_blank_word_bank_6opt');

      expect(row).toBeDefined();
      expect(row!.approvedCount).toBe(2);
      // Must count 3 distinct words (苹果, 香蕉, 学校), not 0
      expect(row!.uniqueTestedVocabCount).toBe(3);
    });

    it('should handle mixture of JSON array, JSON string, comma-separated, and plain words', () => {
      const db = new DatabaseSync(':memory:');
      applyAdditiveQBankMigrations(db);

      db.exec(`
        INSERT INTO questions (id, stem, options, answer_idx, explanation_vi, level, skill, part_type, status, is_active, tested_vocab)
        VALUES 
        ('q1', '问题一：____。', '["车站","准备","机场","商店"]', 0, 'Giải thích 1', 2, 'reading', 'read_fill_blank_word_bank_6opt', 'approved', 1, '["车站","准备"]'),
        ('q2', '问题二：____。', '["铅笔","钢笔","毛笔","画笔"]', 0, 'Giải thích 2', 2, 'reading', 'read_fill_blank_word_bank_6opt', 'approved', 1, '"铅笔"'),
        ('q3', '问题三：____。', '["自行车","旅游","汽车","飞机"]', 0, 'Giải thích 3', 2, 'reading', 'read_fill_blank_word_bank_6opt', 'approved', 1, '自行车, 旅游'),
        ('q4', '问题四：____。', '["晴","阴","雨","雪"]', 0, 'Giải thích 4', 2, 'reading', 'read_fill_blank_word_bank_6opt', 'approved', 1, '晴');
      `);

      const matrix = computeCoverageMatrix(db);
      const row = matrix.rows.find((r) => r.level === 2 && r.part_type === 'read_fill_blank_word_bank_6opt');

      expect(row).toBeDefined();
      expect(row!.approvedCount).toBe(4);
      // Distinct words: 车站, 准备, 铅笔, 自行车, 旅游, 晴 -> 6 unique words
      expect(row!.uniqueTestedVocabCount).toBe(6);
    });
  });

  // --------------------------------------------------------------------------
  // 2. Deterministic Deficit Prioritization
  // --------------------------------------------------------------------------
  describe('2. Deterministic Deficit Prioritization', () => {
    it('should select priority deficit group based on blueprint deficit and deficit ratio', () => {
      const db = new DatabaseSync(':memory:');
      applyAdditiveQBankMigrations(db);

      const deficit1 = getPriorityDeficitGroup(db);
      const deficit2 = getPriorityDeficitGroup(db);

      expect(deficit1).not.toBeNull();
      expect(deficit2).not.toBeNull();
      // Must be 100% deterministic
      expect(deficit1!.level).toBe(deficit2!.level);
      expect(deficit1!.skill).toBe(deficit2!.skill);
      expect(deficit1!.part_type).toBe(deficit2!.part_type);
      expect(deficit1!.priorityScore).toBe(deficit2!.priorityScore);
      expect(deficit1!.level).toBeGreaterThanOrEqual(1);
      expect(deficit1!.level).toBeLessThanOrEqual(6);
    });

    it('should respect targetLevel filter when specified', () => {
      const db = new DatabaseSync(':memory:');
      applyAdditiveQBankMigrations(db);

      const targetLvl3 = getPriorityDeficitGroup(db, undefined, 3);
      expect(targetLvl3).not.toBeNull();
      expect(targetLvl3!.level).toBe(3);

      const targetLvl5 = getPriorityDeficitGroup(db, undefined, 5);
      expect(targetLvl5).not.toBeNull();
      expect(targetLvl5!.level).toBe(5);
    });
  });

  // --------------------------------------------------------------------------
  // 3. Concurrency Lock & Stale Task Recovery (qbank_tasks)
  // --------------------------------------------------------------------------
  describe('3. Concurrency Lock & Stale Task Recovery', () => {
    it('should prevent overlapping execution when a task is already running in qbank_tasks', async () => {
      const db = new DatabaseSync(':memory:');
      ensureEligiblePoolSchema(db);
      applyAdditiveQBankMigrations(db);

      // Insert an active running task
      createPersistentTask(db, 'task_active_123', 'auto_question_scheduler', 'payload_hash_1');

      // Attempt to run scheduled batch
      const result = await runScheduledBatch(true, { db });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Job already in progress (qbank_tasks lock)');
    });

    it('should recover and fail stale running tasks older than maxDurationMs', () => {
      const db = new DatabaseSync(':memory:');
      ensureEligiblePoolSchema(db);

      // Insert an old task updated 10 minutes ago
      db.prepare(`
        INSERT INTO qbank_tasks (idempotency_key, task_type, payload_hash, status, updated_at)
        VALUES ('task_stale_1', 'auto_question_scheduler', 'hash_old', 'running', datetime('now', '-10 minutes'))
      `).run();

      const released = releaseStaleTasks(db, 60000);
      expect(released).toBe(1);

      const row: any = db.prepare("SELECT status, error_message FROM qbank_tasks WHERE idempotency_key = 'task_stale_1'").get();
      expect(row.status).toBe('failed');
      expect(row.error_message).toContain('timed out');
    });

    it('should automatically release stale tasks before executing runScheduledBatch', async () => {
      const db = new DatabaseSync(':memory:');
      ensureEligiblePoolSchema(db);
      applyAdditiveQBankMigrations(db);

      // Insert an old task updated 15 minutes ago
      db.prepare(`
        INSERT INTO qbank_tasks (idempotency_key, task_type, payload_hash, status, updated_at)
        VALUES ('task_stale_old', 'auto_question_scheduler', 'hash_old', 'running', datetime('now', '-15 minutes'))
      `).run();

      // Configure mock handler with pure Chinese stem and pedagogical Vietnamese explanation
      setMockLLMHandler(async (opts) => [
        {
          stem: '男：你想去北京吗？\n女：好的，我想去医院看朋友。',
          options: ['A', 'B', 'C', 'D', 'E', 'F'],
          options_images: ['hospital', 'tea', 'coffee', 'apple', 'banana', 'taxi'],
          answer_idx: 0,
          explanation_vi: 'Người phụ nữ muốn đi bệnh viện (医院), bức tranh tương ứng là A.',
          level: opts.level || 1,
          skill: (opts.skill === 'all' ? 'listening' : (opts.skill as any)) || 'listening',
          part_type: opts.part_type || 'listen_dialogue_picture_match_6opt',
          illustration_theme: 'hospital',
        },
      ]);

      const result = await runScheduledBatch(true, { db, batchSizeOverride: 1, targetLevelOverride: 1, maxDurationMs: 60000 });
      // Should have successfully cleaned up the stale task and executed
      expect(result.success).toBe(true);
      expect(result.savedCount).toBe(1);

      // Verify the old task is now marked failed
      const oldTask: any = db.prepare("SELECT status FROM qbank_tasks WHERE idempotency_key = 'task_stale_old'").get();
      expect(oldTask.status).toBe('failed');
    });
  });

  // --------------------------------------------------------------------------
  // 4. 5-Category Error Taxonomy & Bounded Retries with Exponential Backoff
  // --------------------------------------------------------------------------
  describe('4. Error Taxonomy & Bounded Retries', () => {
    it('should classify auth_error (401, 403, api key) correctly as non-retryable', () => {
      const err401 = { status: 401, message: 'Unauthorized API key' };
      const classified = classifyLLMError(err401);
      expect(classified.category).toBe('auth_error');
      expect(classified.isRetryable).toBe(false);
    });

    it('should classify config_error (404, model not found) correctly as non-retryable', () => {
      const err404 = { status: 404, message: 'Model deepseek-chat not found' };
      const classified = classifyLLMError(err404);
      expect(classified.category).toBe('config_error');
      expect(classified.isRetryable).toBe(false);
    });

    it('should classify quota_exhausted (429, rate limit, quota exceeded) correctly as non-retryable', () => {
      const err429 = { status: 429, message: 'Rate limit exceeded: quota exhausted' };
      const classified = classifyLLMError(err429);
      expect(classified.category).toBe('quota_exhausted');
      expect(classified.isRetryable).toBe(false);
    });

    it('should classify validation_error (JSON parse error, schema invalid) correctly as non-retryable', () => {
      const errParse = new Error('SyntaxError: Unexpected token in JSON schema parse');
      const classified = classifyLLMError(errParse);
      expect(classified.category).toBe('validation_error');
      expect(classified.isRetryable).toBe(false);
    });

    it('should classify transient_error (500, 502, 503, ETIMEDOUT, timeout) correctly as retryable', () => {
      const err503 = { status: 503, message: 'Service Unavailable' };
      const classified = classifyLLMError(err503);
      expect(classified.category).toBe('transient_error');
      expect(classified.isRetryable).toBe(true);

      const errTimeout = new Error('ETIMEDOUT connection reset');
      const classifiedTimeout = classifyLLMError(errTimeout);
      expect(classifiedTimeout.category).toBe('transient_error');
      expect(classifiedTimeout.isRetryable).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 5. Partial Batch Accounting
  // --------------------------------------------------------------------------
  describe('5. Partial Batch Accounting', () => {
    it('should record 12 saved and retain 8 deficit when 20 are requested and 12 are returned', async () => {
      const db = new DatabaseSync(':memory:');
      applyAdditiveQBankMigrations(db);
      ensureEligiblePoolSchema(db);

      // Return exactly 12 distinct valid mock questions with Chinese stems when 20 are requested
      const numWords = ['一','二','三','四','五','六','七','八','九','十','十一','十二'];
      setMockLLMHandler(async (opts) => {
        const questions = [];
        for (let i = 0; i < 12; i++) {
          questions.push({
            stem: `男：你想去北京吗？\n女：好的，我想去第${numWords[i]}号医院看朋友。`,
            options: ['A', 'B', 'C', 'D', 'E', 'F'],
            options_images: ['hospital', 'tea', 'coffee', 'apple', 'banana', 'taxi'],
            answer_idx: 0,
            explanation_vi: `Người phụ nữ muốn đi bệnh viện số ${i + 1} (医院), bức tranh tương ứng là A.`,
            level: opts.level || 1,
            skill: (opts.skill === 'all' ? 'listening' : (opts.skill as any)) || 'listening',
            part_type: opts.part_type || 'listen_dialogue_picture_match_6opt',
            illustration_theme: 'hospital',
          });
        }
        return questions;
      });

      const result = await runScheduledBatch(true, {
        db,
        batchSizeOverride: 20,
        targetLevelOverride: 1,
      });

      expect(result.success).toBe(true);
      expect(result.requestedCount).toBe(20);
      expect(result.savedCount).toBe(12);
      expect(result.remainingDeficit).toBe(8);
      expect(result.deficitRetained).toBe(8);

      // Verify generation_runs records status = 'partial'
      const runRow: any = db.prepare("SELECT status, count_requested, count_saved_pending FROM generation_runs WHERE batch_id = ?").get(result.batchId);
      expect(runRow).toBeDefined();
      expect(runRow.status).toBe('partial');
      expect(runRow.count_requested).toBe(20);
      expect(runRow.count_saved_pending).toBe(12);
    });

    it('should prevent duplicate insertion of already saved questions on subsequent run', async () => {
      const db = new DatabaseSync(':memory:');
      applyAdditiveQBankMigrations(db);
      ensureEligiblePoolSchema(db);

      const stem = '男：你想去北京吗？\n女：好的，我想去第一号医院看朋友。';
      const options = ['A', 'B', 'C', 'D', 'E', 'F'];
      const options_images = ['hospital', 'tea', 'coffee', 'apple', 'banana', 'taxi'];

      setMockLLMHandler(async (opts) => [
        {
          stem,
          options,
          options_images,
          answer_idx: 0,
          explanation_vi: 'Người phụ nữ muốn đi bệnh viện số 1 (医院), bức tranh tương ứng là A.',
          level: opts.level || 1,
          skill: (opts.skill === 'all' ? 'listening' : (opts.skill as any)) || 'listening',
          part_type: opts.part_type || 'listen_dialogue_picture_match_6opt',
          illustration_theme: 'hospital',
        },
      ]);

      // Run 1: Saves question
      const res1 = await runScheduledBatch(true, { db, batchSizeOverride: 1, targetLevelOverride: 1 });
      expect(res1.savedCount).toBe(1);

      // Run 2: Same question content -> duplicate detected -> savedCount = 0
      const res2 = await runScheduledBatch(true, { db, batchSizeOverride: 1, targetLevelOverride: 1 });
      expect(res2.savedCount).toBe(0);
      expect(res2.remainingDeficit).toBe(1);
    });
  });

  // --------------------------------------------------------------------------
  // 6. Quota Exhaustion & Graceful Stopping
  // --------------------------------------------------------------------------
  describe('6. Quota Exhaustion & Safe Stop', () => {
    it('should gracefully stop on quota exhaustion, log detailed metrics, and retain deficit without crashing', async () => {
      const db = new DatabaseSync(':memory:');
      applyAdditiveQBankMigrations(db);
      ensureEligiblePoolSchema(db);

      // Simulate LLM throwing 429 quota exhausted
      setMockLLMHandler(async () => {
        const err: any = new Error('Rate limit exceeded: free tier quota exhausted');
        err.status = 429;
        err.category = 'quota_exhausted';
        throw err;
      });

      const result = await runScheduledBatch(true, {
        db,
        batchSizeOverride: 5,
        targetLevelOverride: 1,
      });

      expect(result.success).toBe(false);
      expect(result.savedCount).toBe(0);
      expect(result.requestedCount).toBe(5);
      expect(result.remainingDeficit).toBe(5);
      expect(result.deficitRetained).toBe(5);
      expect(result.errorCategory).toBe('quota_exhausted');

      // Verify generation_runs logged quota_exhausted status
      const runRow: any = db.prepare("SELECT status, details FROM generation_runs WHERE batch_id = ?").get(result.batchId);
      expect(runRow).toBeDefined();
      expect(runRow.status).toBe('quota_exhausted');
      const details = JSON.parse(runRow.details);
      expect(details.category).toBe('quota_exhausted');
      expect(details.remainingDeficit).toBe(5);
    });

    it('should throw LLM_ALL_PROVIDERS_EXHAUSTED when provider=none without calling paid APIs', async () => {
      await expect(
        generateWaterfallQuestions({
          level: 1,
          skill: 'reading',
          count: 3,
          provider: 'none',
        })
      ).rejects.toThrow('LLM_ALL_PROVIDERS_EXHAUSTED');
    });
  });

  // --------------------------------------------------------------------------
  // 7. Database Safety & Invariant Check
  // --------------------------------------------------------------------------
  describe('7. Database Integrity & Hash Invariant', () => {
    it('should verify data/hsk_exam.db hash equals DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1', () => {
      const dbPath = path.resolve(process.cwd(), 'data/hsk_exam.db');
      expect(fs.existsSync(dbPath)).toBe(true);
      const buffer = fs.readFileSync(dbPath);
      const hash = crypto.createHash('sha256').update(buffer).digest('hex').toUpperCase();
      expect(hash).toBe('DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1');
    });
  });
});
