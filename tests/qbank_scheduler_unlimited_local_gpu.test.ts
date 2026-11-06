import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import {
  getSchedulerConfig,
  getAutoSchedulerStatus,
  updateSchedulerConfig,
  runScheduledBatch,
} from '../src/server/cron/autoQuestionScheduler';
import { evaluateCandidateSixGates } from '../src/server/llm/questionValidator';

describe('R5 (M5): Unlimited Local GPU Question Generation & M4 Lenient Import', () => {
  beforeEach(() => {
    updateSchedulerConfig({
      preferredProvider: 'auto',
      unlimitedDaily: false,
      maxQuestionsPerDay: 20,
      intervalHours: 2,
      batchSize: 3,
      targetLevel: 0,
    });
  });

  it('1. updateSchedulerConfig sets unlimitedDaily = true and maxQuestionsPerDay = 0 when preferredProvider is ollama', () => {
    const status = updateSchedulerConfig({
      preferredProvider: 'ollama',
    });

    expect(status.preferredProvider).toBe('ollama');
    expect(status.unlimitedDaily).toBe(true);
    expect(status.maxQuestionsPerDay).toBe(0);
  });

  it('2. updateSchedulerConfig supports fast intervals down to 1 min (0.0167h) and batchSize up to 50', () => {
    const status = updateSchedulerConfig({
      preferredProvider: 'ollama',
      intervalHours: 0.0167,
      batchSize: 50,
      maxQuestionsPerDay: 0,
    });

    expect(status.intervalHours).toBeCloseTo(0.0167, 4);
    expect(status.batchSize).toBe(50);
    expect(status.unlimitedDaily).toBe(true);
    expect(status.maxQuestionsPerDay).toBe(0);

    const cfg = getSchedulerConfig();
    expect(cfg.preferredProvider).toBe('ollama');
    expect(cfg.unlimitedDaily).toBe(true);
    expect(cfg.batchSize).toBe(50);
  });

  it('3. updateSchedulerConfig allows maxQuestionsPerDay <= 0 (Unlimited) even when preferredProvider is auto', () => {
    const status = updateSchedulerConfig({
      preferredProvider: 'auto',
      maxQuestionsPerDay: 0,
      unlimitedDaily: true,
    });

    expect(status.preferredProvider).toBe('auto');
    expect(status.unlimitedDaily).toBe(true);
    expect(status.maxQuestionsPerDay).toBe(0);
  });

  it('4. runScheduledBatch bypasses daily quota limit when preferredProvider === ollama or unlimitedDaily === true, and enforces it when auto & limited', async () => {
    const memDb = new DatabaseSync(':memory:');
    memDb.exec(`
      CREATE TABLE IF NOT EXISTS pending_questions (
        id TEXT PRIMARY KEY,
        batch_id TEXT,
        level INTEGER NOT NULL,
        skill TEXT NOT NULL,
        part_type TEXT NOT NULL,
        stem TEXT NOT NULL,
        options TEXT DEFAULT '["A","B","C","D"]',
        options_json TEXT,
        answer_idx INTEGER NOT NULL,
        explanation_vi TEXT,
        pinyin TEXT,
        illustration_theme TEXT,
        options_images TEXT,
        content_hash TEXT,
        near_duplicate_signature TEXT,
        tested_vocab TEXT,
        audio_text TEXT,
        passage TEXT,
        difficulty_tier TEXT DEFAULT 'medium',
        topic TEXT,
        status TEXT DEFAULT 'pending',
        is_active INTEGER DEFAULT 1,
        validation_passed INTEGER DEFAULT 1,
        validation_errors_json TEXT,
        distractor_rationales_json TEXT,
        tested_vocab_json TEXT,
        grammar_point_id TEXT,
        provider_used TEXT,
        model_name TEXT,
        rejection_note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS generation_runs (
        id TEXT PRIMARY KEY,
        batch_id TEXT,
        level INTEGER NOT NULL,
        skill TEXT,
        count_requested INTEGER NOT NULL,
        count_generated INTEGER NOT NULL,
        count_saved_pending INTEGER DEFAULT 0,
        count_rejected_validator INTEGER DEFAULT 0,
        provider_used TEXT NOT NULL,
        model_name TEXT,
        status TEXT NOT NULL,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed 25 already-generated questions today in pending_questions
    const todayIso = new Date().toISOString();
    const insertStmt = memDb.prepare(`
      INSERT INTO pending_questions (
        id, batch_id, level, skill, part_type, stem, options_json, answer_idx, explanation_vi, created_at
      ) VALUES (?, 'batch_seed_1', 1, 'reading', 'read_fill_blank_4opt', ?, '["A","B","C","D"]', 0, 'Giải thích', ?)
    `);
    for (let i = 1; i <= 25; i++) {
      insertStmt.run(`seed_q_${i}`, `Câu hỏi mẫu số ${i}`, todayIso);
    }

    // Case A: When preferredProvider is 'auto' and maxQuestionsPerDay is 20 (with 25 already in pending_questions today), it MUST halt at daily quota
    updateSchedulerConfig({
      preferredProvider: 'auto',
      unlimitedDaily: false,
      maxQuestionsPerDay: 20,
      batchSize: 3,
      targetLevel: 1,
    });

    const blockedRun = await runScheduledBatch(true, {
      db: memDb,
      preferredProviderOverride: 'auto',
      unlimitedDailyOverride: false,
      mock: true,
    });
    expect(blockedRun.success).toBe(false);
    expect(blockedRun.error).toContain('Daily question generation quota reached');

    // Case B: When preferredProvider is 'ollama' (Local GPU), it MUST bypass the daily quota even with 25 already generated today!
    updateSchedulerConfig({
      preferredProvider: 'ollama',
      unlimitedDaily: true,
      maxQuestionsPerDay: 0,
      batchSize: 3,
      targetLevel: 1,
    });

    const unlimitedRun = await runScheduledBatch(true, {
      db: memDb,
      preferredProviderOverride: 'ollama',
      unlimitedDailyOverride: true,
      mock: true,
    });
    expect(unlimitedRun.error).not.toBe('Daily question generation quota reached');
    expect(unlimitedRun.batchId).toBeDefined();

    const status = getAutoSchedulerStatus();
    expect(status.preferredProvider).toBe('ollama');
    expect(status.unlimitedDaily).toBe(true);
    expect(status.maxQuestionsPerDay).toBe(0);

    memDb.close();
  });

  it('5. M4 evaluateCandidateSixGates lenientImport mode passes when Gates 1, 2, 5 pass even if Gate 3 (outOfSyllabus) warns', () => {
    const candidateWithHigherVocab = {
      level: 1,
      skill: 'reading' as const,
      part_type: 'read_fill_blank_4opt',
      stem: '尽管遇到了很多困难，他还是____完成了任务。',
      options: ['坚持', '放弃', '忘记', '休息'],
      answer_idx: 0,
      explanation_vi: 'Đáp án đúng là A (坚持 - kiên trì) phù hợp ngữ cảnh câu.',
      pinyin: 'Jǐnguǎn yùdào le hěn duō kùnnan, tā háishi ____ wánchéng le rènwu.',
    };

    // Strict mode at HSK 1 rejects due to Gate 3 (HSK 4-5 vocabulary in HSK 1)
    const strictRes = evaluateCandidateSixGates(candidateWithHigherVocab, [], {
      lenientImport: false,
    });
    expect(strictRes.gate3_vocab_coverage.passed).toBe(false);
    expect(strictRes.allPassed).toBe(false);

    // Lenient import mode (used by File Upload & Universal Import) passes Gates 1, 2, 5 and sets allPassed = true
    const lenientRes = evaluateCandidateSixGates(candidateWithHigherVocab, [], {
      lenientImport: true,
    });
    expect(lenientRes.gate1_schema.passed).toBe(true);
    expect(lenientRes.gate2_explanation.passed).toBe(true);
    expect(lenientRes.gate5_uniqueness.passed).toBe(true);
    expect(lenientRes.allPassed).toBe(true);
  });
});
