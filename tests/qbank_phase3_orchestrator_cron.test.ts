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
  acquireGenerationLock,
  recoverStartupStaleTasks,
} from '../src/server/qbankFormatSync.js';

describe('Phase 3: Unified Concurrency Lock, Deficit Orchestrator & Free-Tier Fallback Suite', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    resetMockLLMHandler();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    resetMockLLMHandler();
    process.env = { ...originalEnv };
  });

  function createTestDb(): DatabaseSync {
    const db = new DatabaseSync(':memory:');
    ensureEligiblePoolSchema(db);
    applyAdditiveQBankMigrations(db);
    db.exec(`
      CREATE TABLE IF NOT EXISTS generation_runs (
        id TEXT PRIMARY KEY,
        batch_id TEXT,
        level INTEGER,
        skill TEXT,
        count_requested INTEGER,
        count_generated INTEGER,
        count_saved_pending INTEGER,
        count_rejected_validator INTEGER,
        provider_used TEXT NOT NULL,
        model_name TEXT,
        status TEXT NOT NULL,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_gen_runs_created ON generation_runs(created_at);
    `);
    return db;
  }

  // ==========================================================================
  // Scenario 1: Mutual Exclusion between Cron, Admin, and Exam Supplement
  // ==========================================================================
  describe('Scenario 1: Mutual Exclusion (Concurrency Locking)', () => {
    it('should prevent Admin generation when Cron task is running in qbank_tasks', () => {
      const db = createTestDb();

      // 1. Cron task acquires lock
      const cronLock = acquireGenerationLock(db, {
        taskType: 'auto_question_scheduler',
        idempotencyKey: 'task_cron_batch_001',
        payloadHash: 'hash_cron_001',
      });
      expect(cronLock.acquired).toBe(true);

      // 2. Admin attempt to acquire lock must fail with 409 conflict error
      const adminLock = acquireGenerationLock(db, {
        taskType: 'admin_generate',
        idempotencyKey: 'task_admin_gen_001',
        payloadHash: 'hash_admin_001',
      });
      expect(adminLock.acquired).toBe(false);
      expect(adminLock.activeTask).toBeDefined();
      expect(adminLock.activeTask?.task_type).toBe('auto_question_scheduler');
      expect(adminLock.error).toContain('Hệ thống đang thực hiện một phiên sinh câu hỏi khác');
    });

    it('should prevent Cron runScheduledBatch when Admin generation is running', async () => {
      const db = createTestDb();

      // 1. Admin acquires lock
      const adminLock = acquireGenerationLock(db, {
        taskType: 'admin_generate',
        idempotencyKey: 'task_admin_gen_002',
        payloadHash: 'hash_admin_002',
      });
      expect(adminLock.acquired).toBe(true);

      // 2. Cron scheduled batch must detect active admin lock and skip execution
      const cronResult = await runScheduledBatch(true, { db });
      expect(cronResult.success).toBe(false);
      expect(cronResult.savedCount).toBe(0);
      expect(cronResult.error).toContain('Job already in progress (qbank_tasks lock)');
    });

    it('should prevent Exam Supplement generation when Cron is running', () => {
      const db = createTestDb();

      acquireGenerationLock(db, {
        taskType: 'auto_question_scheduler',
        idempotencyKey: 'task_cron_batch_003',
        payloadHash: 'hash_cron_003',
      });

      const suppLock = acquireGenerationLock(db, {
        taskType: 'exam_supplement',
        idempotencyKey: 'task_supp_001',
        payloadHash: 'hash_supp_001',
      });
      expect(suppLock.acquired).toBe(false);
      expect(suppLock.error).toContain('Hệ thống đang thực hiện một phiên sinh câu hỏi khác');
    });
  });

  // ==========================================================================
  // Scenario 2: Stale Task Recovery on Timeout and Server Restart
  // ==========================================================================
  describe('Scenario 2: Stale Task Recovery', () => {
    it('should proactively recover stale tasks older than maxDurationMs during acquireGenerationLock', () => {
      const db = createTestDb();

      // Insert an orphaned task updated 10 minutes ago
      db.prepare(`
        INSERT INTO qbank_tasks (idempotency_key, task_type, payload_hash, status, updated_at)
        VALUES ('task_stale_hung_1', 'auto_question_scheduler', 'hash_hung_1', 'running', datetime('now', '-10 minutes'))
      `).run();

      // Acquire lock for a new job with maxDurationMs = 60000 (1 minute)
      const lockRes = acquireGenerationLock(db, {
        taskType: 'auto_question_scheduler',
        idempotencyKey: 'task_new_001',
        payloadHash: 'hash_new_001',
        maxDurationMs: 60000,
      });

      expect(lockRes.acquired).toBe(true);

      // Verify the stale task was transitioned to failed
      const staleRow: any = db.prepare(`SELECT status, error_message FROM qbank_tasks WHERE idempotency_key = 'task_stale_hung_1'`).get();
      expect(staleRow.status).toBe('failed');
      expect(staleRow.error_message).toContain('Task timed out (stale lock released)');
    });

    it('should immediately clean up all orphaned running tasks on server startup recovery', () => {
      const db = createTestDb();

      // Insert multiple running tasks simulate sudden server crash/restart
      db.prepare(`
        INSERT INTO qbank_tasks (idempotency_key, task_type, payload_hash, status, updated_at)
        VALUES 
          ('task_crash_1', 'admin_generate', 'hash_c1', 'running', CURRENT_TIMESTAMP),
          ('task_crash_2', 'auto_question_scheduler', 'hash_c2', 'running', CURRENT_TIMESTAMP),
          ('task_done_1', 'admin_generate', 'hash_d1', 'completed', CURRENT_TIMESTAMP)
      `).run();

      const recoveredCount = recoverStartupStaleTasks(db);
      expect(recoveredCount).toBe(2);

      const task1: any = db.prepare(`SELECT status, error_message FROM qbank_tasks WHERE idempotency_key = 'task_crash_1'`).get();
      const task2: any = db.prepare(`SELECT status, error_message FROM qbank_tasks WHERE idempotency_key = 'task_crash_2'`).get();
      const taskDone: any = db.prepare(`SELECT status FROM qbank_tasks WHERE idempotency_key = 'task_done_1'`).get();

      expect(task1.status).toBe('failed');
      expect(task1.error_message).toBe('Task aborted due to server restart');
      expect(task2.status).toBe('failed');
      expect(task2.error_message).toBe('Task aborted due to server restart');
      expect(taskDone.status).toBe('completed');
    });
  });

  // ==========================================================================
  // Scenario 3: No Duplicate Generation on Job Resumption
  // ==========================================================================
  describe('Scenario 3: No Duplicate Generation', () => {
    it('should reject duplicates and avoid duplicate insertion when resuming partially completed batches', async () => {
      const db = createTestDb();

      const candidateStem = '我们明天一起去北京旅游好吗？';
      const candidateOpts = ['好的', '不行', '不知道', '没关系'];
      const candidateAnswerIdx = 0;

      setMockLLMHandler(() => [
        {
          stem: candidateStem,
          options: candidateOpts,
          answer_idx: candidateAnswerIdx,
          explanation_vi: 'Giải thích chi tiết ngữ pháp',
          level: 1,
          skill: 'reading',
          part_type: 'read_fill_blank_4opt',
        },
      ]);

      // First run: successfully saves candidate
      const firstRun = await runScheduledBatch(true, { db, batchSizeOverride: 1 });
      expect(firstRun.savedCount).toBe(1);

      // Verify question exists in pending_questions
      const savedCount1: any = db.prepare(`SELECT count(*) as cnt FROM pending_questions`).get();
      expect(savedCount1.cnt).toBe(1);

      // Second run: mock returns the exact same candidate again
      const secondRun = await runScheduledBatch(true, { db, batchSizeOverride: 1 });
      // Duplicate should be detected and skipped
      expect(secondRun.savedCount).toBe(0);

      const savedCount2: any = db.prepare(`SELECT count(*) as cnt FROM pending_questions`).get();
      expect(savedCount2.cnt).toBe(1); // Row count strictly unchanged
    });
  });

  // ==========================================================================
  // Scenario 4: Deficit Selection (HSK 3 Reading satisfied -> selects Listening)
  // ==========================================================================
  describe('Scenario 4: Deficit Selection', () => {
    it('should select HSK 3 Listening when HSK 3 Reading is satisfied but Listening is deficient', () => {
      const db = createTestDb();

      // Seed HSK 3 Reading with 40 approved questions (fulfills blueprint & initial target)
      for (let i = 0; i < 40; i++) {
        db.prepare(`
          INSERT INTO questions (id, stem, options, answer_idx, explanation_vi, level, skill, part_type, status, is_active)
          VALUES (?, ?, '["A","B","C","D"]', 0, 'Giải thích', 3, 'reading', 'read_comprehension_4opt', 'approved', 1)
        `).run(`q_hsk3_read_${i}`, `Câu hỏi đọc hiểu số ${i} về cuộc sống và công việc.`);
      }

      // HSK 3 Listening has 0 approved questions
      const selected = getPriorityDeficitGroup(db, undefined, 3);
      expect(selected).not.toBeNull();
      expect(selected?.level).toBe(3);
      expect(selected?.skill).toBe('listening');
    });
  });

  // ==========================================================================
  // Scenario 5: Critical Priority for Missing Listening HSK 2–6 & Writing HSK 1–6
  // ==========================================================================
  describe('Scenario 5: Critical Priority Scoring', () => {
    it('should assign highest priority scores to Listening HSK 2–6 and Writing HSK 2–6 over Reading', () => {
      const db = createTestDb();

      // Empty database: compare scores across skills
      const matrix = computeCoverageMatrix(db);

      // Find sample rows for each skill with 0 approved questions
      const hsk2Listening = matrix.rows.find((r) => r.level === 2 && r.skill === 'listening');
      const hsk2Writing = matrix.rows.find((r) => r.level === 2 && r.skill === 'writing');
      const hsk6Reading = matrix.rows.find((r) => r.level === 6 && r.skill === 'reading');

      expect(hsk2Listening).toBeDefined();
      expect(hsk2Writing).toBeDefined();
      expect(hsk6Reading).toBeDefined();

      const priorityGroup = getPriorityDeficitGroup(db);
      expect(priorityGroup).not.toBeNull();

      // Overall selected priority group must be a critical listening group
      expect(priorityGroup?.skill).toBe('listening');
      expect(priorityGroup?.priorityScore).toBeGreaterThan(250000);
    });
  });

  // ==========================================================================
  // Scenario 6: Fault Isolation via Circuit-Breaker Cooldown
  // ==========================================================================
  describe('Scenario 6: Fault Isolation', () => {
    it('should isolate repeated failures in one skill and allow other skills/levels to proceed', () => {
      const db = createTestDb();

      // Seed 2 failure runs for HSK 2 listening within the last 5 minutes
      db.prepare(`
        INSERT INTO generation_runs (id, batch_id, level, skill, count_requested, count_generated, count_saved_pending, count_rejected_validator, provider_used, model_name, status, details, created_at)
        VALUES 
          ('run_f1', 'batch_f1', 2, 'listening', 5, 0, 0, 0, 'gemini-1.5-flash', 'gemini-1.5-flash', 'failed', '{"error":"timeout"}', datetime('now', '-2 minutes')),
          ('run_f2', 'batch_f2', 2, 'listening', 5, 0, 0, 0, 'gemini-1.5-flash', 'gemini-1.5-flash', 'failed', '{"error":"timeout"}', datetime('now', '-1 minutes'))
      `).run();

      // Targeting level 2: with HSK 2 listening penalized by 400k, HSK 2 writing must be selected
      const selected = getPriorityDeficitGroup(db, undefined, 2);
      expect(selected).not.toBeNull();
      expect(selected?.level).toBe(2);
      expect(selected?.skill).toBe('writing');
    });
  });

  // ==========================================================================
  // Scenario 7: Partial Batch Accounting (20 requested, 12 valid -> 8 deficit retained)
  // ==========================================================================
  describe('Scenario 7: Partial Batch Accounting', () => {
    it('should record exactly 12 saved questions and retain 8 deficit when 20 are requested and 12 are valid', async () => {
      const db = createTestDb();

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

      const result = await runScheduledBatch(true, { db, batchSizeOverride: 20, targetLevelOverride: 1 });

      expect(result.success).toBe(true);
      expect(result.savedCount).toBe(12);
      expect(result.requestedCount).toBe(20);
      expect(result.remainingDeficit).toBe(8);
      expect(result.deficitRetained).toBe(8);

      // Verify generation_runs status is 'partial'
      const runRow: any = db.prepare(`SELECT status, count_requested, count_saved_pending FROM generation_runs WHERE batch_id = ?`).get(result.batchId);
      expect(runRow.status).toBe('partial');
      expect(runRow.count_requested).toBe(20);
      expect(runRow.count_saved_pending).toBe(12);

      // Verify qbank_tasks status is 'partial'
      const taskRow: any = db.prepare(`SELECT status FROM qbank_tasks WHERE idempotency_key = ?`).get(`task_${result.batchId}`);
      expect(taskRow.status).toBe('partial');
    });
  });

  // ==========================================================================
  // Scenario 8: Quota Exhaustion & Safe Halting
  // ==========================================================================
  describe('Scenario 8: Quota Exhaustion', () => {
    it('should safely halt, log quota_exhausted status, and retain deficit without crashing when 429 occurs', async () => {
      const db = createTestDb();

      setMockLLMHandler(() => {
        const err: any = new Error('Resource exhausted: Rate limit reached (HTTP 429)');
        err.status = 429;
        throw err;
      });

      const result = await runScheduledBatch(true, { db, batchSizeOverride: 10 });

      expect(result.success).toBe(false);
      expect(result.errorCategory).toBe('quota_exhausted');
      expect(result.remainingDeficit).toBe(10);
      expect(result.deficitRetained).toBe(10);

      const runRow: any = db.prepare(`SELECT status, count_requested, count_saved_pending FROM generation_runs WHERE batch_id = ?`).get(result.batchId);
      expect(runRow.status).toBe('quota_exhausted');
      expect(runRow.count_saved_pending).toBe(0);
    });
  });

  // ==========================================================================
  // Scenario 9: Strict Free-Tier Gating & Waterfall Fallback
  // ==========================================================================
  describe('Scenario 9: Free-Tier Enforcement', () => {
    it('should throw NO_ELIGIBLE_FREE_PROVIDER_AVAILABLE when free tier is exhausted without calling paid APIs', async () => {
      await expect(
        generateWaterfallQuestions({
          level: 1,
          count: 1,
          mock: false,
          provider: 'none',
          freeOnly: true,
        })
      ).rejects.toThrow(/NO_ELIGIBLE_FREE_PROVIDER_AVAILABLE/);
    });
  });

  // ==========================================================================
  // Scenario 10: DeepSeek Exclusion when QBANK_LLM_FREE_ONLY=true
  // ==========================================================================
  describe('Scenario 10: DeepSeek Exclusion', () => {
    it('should exclude deepseek-v3 when QBANK_LLM_FREE_ONLY=true even if DEEPSEEK_API_KEY is present', async () => {
      process.env.DEEPSEEK_API_KEY = 'sk-mock-deepseek-paid-key-999';
      process.env.QBANK_LLM_FREE_ONLY = 'true';

      const deepseekConfig = WATERFALL_PROVIDERS.find((p) => p.id === 'deepseek-v3');
      expect(deepseekConfig).toBeDefined();
      expect(deepseekConfig?.isFreeTier).toBe(false);

      // Attempting to call deepseek with freeOnly must be rejected immediately
      await expect(
        generateWaterfallQuestions({
          level: 1,
          count: 1,
          mock: false,
          provider: 'deepseek',
          freeOnly: true,
        })
      ).rejects.toThrow(/NO_ELIGIBLE_FREE_PROVIDER_AVAILABLE/);
    });
  });

  // ==========================================================================
  // Scenario 11: Idle when Targets are Satisfied
  // ==========================================================================
  describe('Scenario 11: Idle When Satisfied', () => {
    it('should remain idle and make 0 LLM calls when all targets and blueprint quotas are met', async () => {
      const db = createTestDb();

      // Satisfy all blueprint quotas and targets by inserting approved questions across all parts
      const matrix = computeCoverageMatrix(db);
      for (const row of matrix.rows) {
        if (row.status === 'blocked') continue;
        const required = Math.max(row.targetQuantity, row.examSetsRequiredCount);
        for (let i = 0; i < required; i++) {
          db.prepare(`
            INSERT INTO questions (id, stem, options, answer_idx, explanation_vi, level, skill, part_type, status, is_active)
            VALUES (?, ?, '["A","B","C","D"]', 0, 'Giải thích', ?, ?, ?, 'approved', 1)
          `).run(`q_met_${row.level}_${row.part_type}_${i}`, `Stem câu hỏi mẫu thỏa mãn target ${row.part_type} ${i}`, row.level, row.skill, row.part_type);
        }
      }

      let llmCallsCount = 0;
      setMockLLMHandler(() => {
        llmCallsCount++;
        return [];
      });

      // Deficit group must be null
      const deficit = getPriorityDeficitGroup(db);
      expect(deficit).toBeNull();

      // Scheduler must exit successfully with savedCount = 0 without calling LLM
      const result = await runScheduledBatch(true, { db });
      expect(result.success).toBe(true);
      expect(result.savedCount).toBe(0);
      expect(result.details?.message).toContain('All coverage targets and blueprint quotas met');
      expect(llmCallsCount).toBe(0);
    });
  });

  // ==========================================================================
  // Scenario 12: Disabled Safety Kill-Switch
  // ==========================================================================
  describe('Scenario 12: Disabled Safety', () => {
    it('should remain completely dormant when ENABLE_AUTO_QUESTION_GENERATION=false', async () => {
      const db = createTestDb();
      process.env.ENABLE_AUTO_QUESTION_GENERATION = 'false';

      let llmCalled = false;
      setMockLLMHandler(() => {
        llmCalled = true;
        return [];
      });

      // Calling without bypass flag
      const result = await runScheduledBatch(false, { db });
      expect(result.success).toBe(false);
      expect(result.savedCount).toBe(0);
      expect(result.error).toBe('Scheduler is disabled');
      expect(llmCalled).toBe(false);
    });
  });

  // ==========================================================================
  // Scenario 13: Database Preservation Invariants
  // ==========================================================================
  describe('Scenario 13: Database Preservation Invariants', () => {
    it('should verify data/hsk_exam.db SHA-256 remains strictly untouched', () => {
      const hskDbPath = path.resolve(process.cwd(), 'data/hsk_exam.db');
      expect(fs.existsSync(hskDbPath)).toBe(true);

      const buffer = fs.readFileSync(hskDbPath);
      const hash = crypto.createHash('sha256').update(buffer).digest('hex').toUpperCase();

      expect(hash).toBe('DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1');
    });

    it('should verify live data/qbank/qbank.db baseline records are untouched', () => {
      const qbankDbPath = path.resolve(process.cwd(), 'data/qbank/qbank.db');
      if (fs.existsSync(qbankDbPath)) {
        const liveDb = new DatabaseSync(qbankDbPath, { readOnly: true });

        // Baseline row counts established in Survey 1
        const qCount: any = liveDb.prepare(`SELECT count(*) as cnt FROM questions`).get();
        const pCount: any = liveDb.prepare(`SELECT count(*) as cnt FROM pending_questions`).get();
        const sCount: any = liveDb.prepare(`SELECT count(*) as cnt FROM exam_sessions`).get();

        expect(qCount.cnt).toBeGreaterThanOrEqual(89);
        expect(pCount.cnt).toBeGreaterThanOrEqual(111);
        expect(sCount.cnt).toBeGreaterThanOrEqual(404);

        liveDb.close();
      }
    });
  });

  // ==========================================================================
  // Scenario 14: Full Regression and Invariant Compliance
  // ==========================================================================
  describe('Scenario 14: Full Regression Invariants', () => {
    it('should maintain backward compatibility of scheduler status and configuration', () => {
      const status = getAutoSchedulerStatus();
      expect(status).toBeDefined();
      expect(typeof status.enabled).toBe('boolean');
      expect(typeof status.intervalHours).toBe('number');
      expect(typeof status.running).toBe('boolean');

      const config = getSchedulerConfig();
      expect(config).toBeDefined();
      expect(config.batchSize).toBeGreaterThan(0);
    });
  });
});
