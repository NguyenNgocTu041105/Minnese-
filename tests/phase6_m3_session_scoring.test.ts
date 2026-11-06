import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import express from 'express';
import { DatabaseSync } from 'node:sqlite';
import {
  examRouter,
  clearAllSessionsForTesting,
  setExamDbForTesting,
  getSessionDirect,
  computeExamOverlapMetrics,
  getRecentSessionQuestionUsageCounts,
} from '../src/server/examRoutes';
import {
  ensureEligiblePoolSchema,
  reEvaluateApprovedQuestions,
  loadBlueprintData,
} from '../src/server/qbankFormatSync';
import { WATERFALL_PROVIDERS, isFreeTierOnly } from '../src/server/llm/waterfallGenerator';

function createTestServer() {
  const app = express();
  app.use(express.json());
  app.use('/api/exam', examRouter);
  return app;
}

async function requestJson(
  app: express.Express,
  method: 'GET' | 'POST',
  url: string,
  body?: any
): Promise<{ status: number; data: any }> {
  const server = app.listen(0);
  const address = server.address() as { port: number };
  const baseUrl = `http://127.0.0.1:${address.port}`;
  try {
    const res = await fetch(`${baseUrl}${url}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    return { status: res.status, data };
  } finally {
    server.close();
  }
}

function createInMemoryQBankDb(): DatabaseSync {
  const db = new DatabaseSync(':memory:');
  db.exec(`
    CREATE TABLE questions (
      id TEXT PRIMARY KEY,
      stem TEXT NOT NULL,
      options TEXT NOT NULL,
      answer_idx INTEGER NOT NULL,
      pinyin TEXT,
      explanation_vi TEXT,
      level INTEGER NOT NULL,
      skill TEXT NOT NULL,
      part_type TEXT NOT NULL,
      illustration_theme TEXT,
      status TEXT NOT NULL DEFAULT 'approved',
      is_active INTEGER NOT NULL DEFAULT 1,
      topic TEXT,
      tested_vocab TEXT,
      passage TEXT
    );
    CREATE TABLE exam_sessions (
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
  `);
  ensureEligiblePoolSchema(db);
  return db;
}

/**
 * Seeds a complete set of exam-eligible questions matching the official HSK 1 or HSK 2 blueprint.
 * If multiplier = 2, seeds 2x the required questions per part so we can test cross-exam deduplication.
 */
function seedBlueprintEligiblePool(db: DatabaseSync, level: number, multiplier = 1): string[] {
  const bp = loadBlueprintData(level);
  if (!bp || !bp.sections) throw new Error(`Missing blueprint for level ${level}`);

  const insertedIds: string[] = [];
  const insertStmt = db.prepare(`
    INSERT INTO questions (
      id, stem, options, answer_idx, pinyin, explanation_vi, level, skill, part_type, illustration_theme, status, is_active, passage
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', 1, ?)
  `);

  let seq = 1;
  for (const [secKey, secData] of Object.entries<any>(bp.sections)) {
    const skill = (secData.skill || secKey).toLowerCase();
    for (const [partKey, partVal] of Object.entries<any>(secData.parts || {})) {
      const pType = partVal.type || partKey;
      const nQuestions = (Number(partVal.n_questions) || 5) * multiplier;
      const nOptions = Number(partVal.n_options ?? 4);

      for (let i = 0; i < nQuestions; i++) {
        const qId = `hsk${level}_${skill}_${pType}_${seq++}`;
        const options: string[] = [];
        for (let optIdx = 0; optIdx < nOptions; optIdx++) {
          const letter = String.fromCharCode(65 + optIdx);
          options.push(`${letter}. 选项${optIdx + 1}_题${seq}`);
        }
        const answerIdx = nOptions > 0 ? i % nOptions : 0;
        const illustration =
          pType.includes('picture') || pType.includes('tf') || pType.includes('match')
            ? 'reading'
            : null;

        insertStmt.run(
          qId,
          `HSK${level} [${pType}] 男：你好！女：请选择正确答案 #${seq}。`,
          JSON.stringify(options),
          answerIdx,
          'qǐng xuǎnzé zhèngquè dá àn',
          `Giải thích chi tiết cho câu hỏi ${qId}: đáp án đúng là vị trí ${answerIdx}.`,
          level,
          skill,
          pType,
          illustration,
          null
        );
        insertedIds.push(qId);
      }
    }
  }

  reEvaluateApprovedQuestions(db);
  return insertedIds;
}

describe('Phase 6 Milestone M3 — Session Snapshot Immutability, Overlap Tracking & Server-Side Scoring', () => {
  let db: DatabaseSync;
  let app: express.Express;
  const originalQbankEnv = process.env.QBANK_DB_PATH;

  beforeAll(() => {
    process.env.QBANK_DB_PATH = ':memory:';
  });

  afterAll(() => {
    if (originalQbankEnv !== undefined) {
      process.env.QBANK_DB_PATH = originalQbankEnv;
    } else {
      delete process.env.QBANK_DB_PATH;
    }
  });

  beforeEach(() => {
    clearAllSessionsForTesting();
    db = createInMemoryQBankDb();
    setExamDbForTesting(db);
    app = createTestServer();
  });

  afterEach(() => {
    clearAllSessionsForTesting();
    setExamDbForTesting(null);
    try {
      db.close();
    } catch {}
  });

  it('1. Strips answer_index and explanation_vi on generate-mock and GET /api/exam/session/:sessionId (Anti-Cheat)', async () => {
    seedBlueprintEligiblePool(db, 1, 1);

    const genRes = await requestJson(app, 'POST', '/api/exam/generate-mock', {
      level: 1,
      mode: 'mock',
    });

    expect(genRes.status).toBe(200);
    expect(genRes.data.success).toBe(true);
    expect(genRes.data.llmCallsMade).toBe(0);
    expect(genRes.data.usingFixtureFallback).toBe(false);
    expect(genRes.data.questions).toHaveLength(40);

    for (const q of genRes.data.questions) {
      expect(q.answer_index).toBeUndefined();
      expect(q.explanation_vi).toBeUndefined();
      expect(q.id).toBeTruthy();
      expect(q.stem).toBeTruthy();
    }

    const sessionId = genRes.data.sessionId;
    const sessionRes = await requestJson(app, 'GET', `/api/exam/session/${sessionId}`);
    expect(sessionRes.status).toBe(200);
    expect(sessionRes.data.success).toBe(true);
    expect(sessionRes.data.session.questions).toHaveLength(40);

    for (const q of sessionRes.data.session.questions) {
      expect(q.answer_index).toBeUndefined();
      expect(q.explanation_vi).toBeUndefined();
    }
  });

  it('2. Guarantees exam_sessions snapshot immutability even if QBank questions are later modified or deleted', async () => {
    seedBlueprintEligiblePool(db, 1, 1);

    const genRes = await requestJson(app, 'POST', '/api/exam/generate-mock', {
      level: 1,
      mode: 'mock',
    });
    expect(genRes.status).toBe(200);
    const sessionId = genRes.data.sessionId;

    // Inspect original server-side snapshot before DB mutation
    const originalInternal = getSessionDirect(sessionId)!;
    expect(originalInternal).toBeDefined();
    const firstQuestionId = originalInternal.questions[0].id;
    const originalStem = originalInternal.questions[0].stem;
    const originalAnswerIndex = originalInternal.questions[0].answer_index;
    const originalExplanation = originalInternal.questions[0].explanation_vi;

    // Mutate and corrupt the underlying questions table in SQLite after the exam has started
    db.prepare(`
      UPDATE questions
      SET stem = 'MUTATED_STEM_AFTER_SESSION_START',
          answer_idx = ?,
          explanation_vi = 'MUTATED_EXPLANATION',
          status = 'rejected',
          is_active = 0
    `).run((originalAnswerIndex + 1) % 3);

    // Clear in-memory cache to force loading from persistent SQLite exam_sessions.session_json
    clearAllSessionsForTesting();

    // 1) Verify GET /api/exam/session/:sessionId still serves the original immutable stem and order
    const getRes = await requestJson(app, 'GET', `/api/exam/session/${sessionId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.data.session.questions[0].id).toBe(firstQuestionId);
    expect(getRes.data.session.questions[0].stem).toBe(originalStem);

    // 2) Verify POST /api/exam/check-answer evaluates against the immutable session snapshot
    const checkRes = await requestJson(app, 'POST', '/api/exam/check-answer', {
      sessionId,
      questionId: firstQuestionId,
      userAnswer: originalAnswerIndex,
    });
    expect(checkRes.status).toBe(200);
    expect(checkRes.data.isCorrect).toBe(true);
    expect(checkRes.data.explanation_vi).toBe(originalExplanation);

    // 3) Verify POST /api/exam/submit scores 100% against the immutable snapshot
    const fullAnswers: Record<string, number> = {};
    for (const q of originalInternal.questions) {
      fullAnswers[q.id] = q.answer_index;
    }

    const submitRes = await requestJson(app, 'POST', '/api/exam/submit', {
      sessionId,
      level: 1,
      answers: fullAnswers,
      timeSpentSeconds: 950,
    });
    expect(submitRes.status).toBe(200);
    expect(submitRes.data.success).toBe(true);
    expect(submitRes.data.scoreResult.totalScore).toBe(200);
    expect(submitRes.data.scoreResult.maxScore).toBe(200);
    expect(submitRes.data.scoreResult.passed).toBe(true);
    expect(submitRes.data.scoreResult.detailedReview[0].stem).toBe(originalStem);
    expect(submitRes.data.scoreResult.detailedReview[0].explanation_vi).toBe(originalExplanation);
  });

  it('3. Tracks cross-exam overlap and rejects 100% duplicate question sets when strictUniqueExam is enabled', async () => {
    // Seed exactly 1x blueprint count (40 questions for HSK 1)
    seedBlueprintEligiblePool(db, 1, 1);

    const exam1 = await requestJson(app, 'POST', '/api/exam/generate-mock', {
      level: 1,
      mode: 'mock',
    });
    expect(exam1.status).toBe(200);
    expect(exam1.data.isDuplicateQuestionSet).toBe(false);
    expect(exam1.data.overlapMetrics.maxOverlapRatio).toBe(0);
    expect(exam1.data.questionSetHash).toMatch(/^[a-f0-9]{64}$/);

    // Generating a second exam from the exact same 40-question pool without strictUniqueExam flags isDuplicateQuestionSet = true
    const exam2 = await requestJson(app, 'POST', '/api/exam/generate-mock', {
      level: 1,
      mode: 'mock',
    });
    expect(exam2.status).toBe(200);
    expect(exam2.data.isDuplicateQuestionSet).toBe(true);
    expect(exam2.data.overlapMetrics.maxOverlapRatio).toBe(1);
    expect(exam2.data.overlapMetrics.overlappingQuestionCount).toBe(40);
    expect(exam2.data.overlapMetrics.comparedSessionId).toBe(exam1.data.sessionId);
    expect(exam2.data.questionSetHash).toBe(exam1.data.questionSetHash);

    // Generating with strictUniqueExam: true rejects the duplicate question set with HTTP 409
    const exam3Strict = await requestJson(app, 'POST', '/api/exam/generate-mock', {
      level: 1,
      mode: 'mock',
      strictUniqueExam: true,
    });
    expect(exam3Strict.status).toBe(409);
    expect(exam3Strict.data.success).toBe(false);
    expect(exam3Strict.data.isDuplicateQuestionSet).toBe(true);
  });

  it('4. Automatically deduplicates and selects fresh questions across consecutive exams when surplus eligible questions exist', async () => {
    // Seed 2x blueprint count (80 eligible questions for HSK 1)
    seedBlueprintEligiblePool(db, 1, 2);

    const exam1 = await requestJson(app, 'POST', '/api/exam/generate-mock', {
      level: 1,
      mode: 'mock',
      strictUniqueExam: true,
    });
    expect(exam1.status).toBe(200);
    expect(exam1.data.questions).toHaveLength(40);

    const usageAfterExam1 = getRecentSessionQuestionUsageCounts(1, 'mock');
    expect(usageAfterExam1.size).toBe(40);

    // Second exam automatically picks the remaining 40 unused eligible questions -> 0% overlap!
    const exam2 = await requestJson(app, 'POST', '/api/exam/generate-mock', {
      level: 1,
      mode: 'mock',
      strictUniqueExam: true,
    });
    expect(exam2.status).toBe(200);
    expect(exam2.data.questions).toHaveLength(40);
    expect(exam2.data.isDuplicateQuestionSet).toBe(false);
    expect(exam2.data.overlapMetrics.maxOverlapRatio).toBe(0);
    expect(exam2.data.overlapMetrics.overlappingQuestionCount).toBe(0);
    expect(exam2.data.questionSetHash).not.toBe(exam1.data.questionSetHash);
  });

  it('5. Supports server-side scoring of HSK 2 (Listening, Reading, Writing with 0-option Tianzige) and idempotent retry', async () => {
    seedBlueprintEligiblePool(db, 2, 1);

    const genRes = await requestJson(app, 'POST', '/api/exam/generate-mock', {
      level: 2,
      mode: 'mock',
    });
    expect(genRes.status).toBe(200);
    expect(genRes.data.questions).toHaveLength(60);

    const sessionId = genRes.data.sessionId;
    const internalSession = getSessionDirect(sessionId)!;

    // Answer all Listening & Reading correctly, and provide Hanzi answers for Writing
    const answers: Record<string, any> = {};
    for (const q of internalSession.questions) {
      if (q.section === 'writing' && (!q.options || q.options.length === 0)) {
        answers[q.id] = '汉语水平考试';
      } else {
        answers[q.id] = q.answer_index;
      }
    }

    const submit1 = await requestJson(app, 'POST', '/api/exam/submit', {
      sessionId,
      level: 2,
      answers,
      timeSpentSeconds: 1800,
    });
    expect(submit1.status).toBe(200);
    expect(submit1.data.success).toBe(true);
    expect(submit1.data.isRetryIdempotent).toBe(false);
    expect(submit1.data.scoreResult.totalScore).toBe(300);
    expect(submit1.data.scoreResult.maxScore).toBe(300);
    expect(submit1.data.scoreResult.passScore).toBe(180);
    expect(submit1.data.scoreResult.passed).toBe(true);

    // Retry submitting the same session with different answers -> must return idempotent original result
    const submit2 = await requestJson(app, 'POST', '/api/exam/submit', {
      sessionId,
      level: 2,
      answers: {},
      timeSpentSeconds: 9999,
    });
    expect(submit2.status).toBe(200);
    expect(submit2.data.isRetryIdempotent).toBe(true);
    expect(submit2.data.submissionId).toBe(submit1.data.submissionId);
    expect(submit2.data.scoreResult.totalScore).toBe(300);
  });

  it('6. Preserves 6-word bank A-F group options and letter-or-index answer scoring in HSK 1 Reading Part 3', async () => {
    seedBlueprintEligiblePool(db, 1, 1);

    const genRes = await requestJson(app, 'POST', '/api/exam/generate-mock', {
      level: 1,
      mode: 'mock',
    });
    expect(genRes.status).toBe(200);
    const sessionId = genRes.data.sessionId;
    const internalSession = getSessionDirect(sessionId)!;

    const wordBankQuestions = internalSession.questions.filter(
      (q) => q.part_type === 'read_fill_blank_word_bank_6opt'
    );
    expect(wordBankQuestions).toHaveLength(5);
    for (const wbq of wordBankQuestions) {
      expect(wbq.options).toHaveLength(6);
    }

    // Submit using letter strings ('A', 'B', 'C', 'D', 'E', 'F') for word-bank questions
    const answers: Record<string, any> = {};
    for (const q of internalSession.questions) {
      answers[q.id] = String.fromCharCode(65 + q.answer_index);
    }

    const submitRes = await requestJson(app, 'POST', '/api/exam/submit', {
      sessionId,
      level: 1,
      answers,
      timeSpentSeconds: 600,
    });
    expect(submitRes.status).toBe(200);
    expect(submitRes.data.scoreResult.totalScore).toBe(200);
    expect(submitRes.data.scoreResult.sectionScores.reading.correct).toBe(20);
  });

  it('7. Enforces zero LLM calls during exam assembly and keeps deepseek-v3 classified as non-free', () => {
    const deepseekTier = WATERFALL_PROVIDERS.find((m) => m.id === 'deepseek-v3' || m.name === 'DeepSeek');
    expect(deepseekTier).toBeDefined();
    expect(deepseekTier?.isFreeTier).toBe(false);
    expect(isFreeTierOnly()).toBe(true);
  });
});
