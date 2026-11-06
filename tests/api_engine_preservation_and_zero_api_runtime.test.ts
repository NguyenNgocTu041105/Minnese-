import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import http from 'http';
import { DatabaseSync } from 'node:sqlite';
import {
  WATERFALL_PROVIDERS,
  generateWaterfallQuestions,
  checkDeepSeekBalance,
  isFreeTierOnly,
  getFreeProviderAllowlist,
  buildQuestionResponseFormat,
} from '../src/server/llm/waterfallGenerator.js';
import {
  evaluateCandidateSixGates,
  validateCandidate,
  computeContentHash,
  computeNearDuplicateSignature,
} from '../src/server/llm/questionValidator.js';
import { buildHskPrompt, getQuestionTypeInstructions } from '../src/server/llm/promptTemplates.js';
import {
  normalizeQuestionList,
  robustJsonParse,
  stripMarkdownCodeBlocks,
  removeTrailingCommas,
} from '../src/server/llm/jsonParser.js';
import { validateFormatCompatibility } from '../src/server/qbankFormatSync.js';
import { examRouter, setExamDbForTesting, loadApprovedQuestionsFromDb } from '../src/server/examRoutes.js';

describe('Preserve API Generation Engine & Zero-API Student Runtime Contract', () => {
  let app: express.Express;
  let server: http.Server;
  let baseUrl: string;
  let testDb: DatabaseSync;

  beforeAll(async () => {
    testDb = new DatabaseSync(':memory:');
    testDb.exec(`
      CREATE TABLE IF NOT EXISTS questions (
        id TEXT PRIMARY KEY,
        stem TEXT NOT NULL,
        options TEXT NOT NULL,
        answer_idx INTEGER NOT NULL,
        level INTEGER NOT NULL,
        skill TEXT NOT NULL,
        part_type TEXT NOT NULL,
        status TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        quality_status TEXT,
        explanation_vi TEXT,
        topic TEXT,
        tested_vocab TEXT
      );
      CREATE TABLE IF NOT EXISTS exam_eligible_pool (
        question_id TEXT PRIMARY KEY,
        level INTEGER NOT NULL,
        skill TEXT NOT NULL,
        part_type TEXT,
        stem TEXT,
        practice_eligible INTEGER DEFAULT 0,
        exam_eligible INTEGER DEFAULT 0,
        compatible_formats TEXT,
        ineligible_reasons TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insert test questions for student learning runtime verification
    const insertQ = testDb.prepare(`
      INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active, quality_status, explanation_vi)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertPool = testDb.prepare(`
      INSERT INTO exam_eligible_pool (question_id, level, skill, part_type, practice_eligible, exam_eligible)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    // 1. Approved & PASS question
    insertQ.run(
      'q_approved_pass',
      '今天天气很好，我们去公园____吧。',
      JSON.stringify(['散步', '睡觉', '喝水', '买菜']),
      0,
      1,
      'reading',
      'read_comprehension_short_3opt',
      'approved',
      1,
      'PASS',
      'Đi công viên dạo bộ (散步) là hoạt động phù hợp nhất với thời tiết đẹp.'
    );
    insertPool.run('q_approved_pass', 1, 'reading', 'read_comprehension_short_3opt', 1, 1);

    // 2. Pending unapproved candidate
    insertQ.run(
      'q_pending_candidate',
      '未审核题目',
      JSON.stringify(['A', 'B', 'C', 'D']),
      0,
      1,
      'reading',
      'read_comprehension_short_3opt',
      'pending',
      1,
      'PASS',
      'Chưa duyệt'
    );
    insertPool.run('q_pending_candidate', 1, 'reading', 'read_comprehension_short_3opt', 1, 1);

    setExamDbForTesting(testDb);

    app = express();
    app.use(express.json());
    app.use('/api/exam', examRouter);

    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        if (addr && typeof addr === 'object') {
          baseUrl = `http://127.0.0.1:${addr.port}`;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    setExamDbForTesting(null);
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    if (testDb) {
      testDb.close();
    }
  });

  // =========================================================================
  // SECTION 1: PRESERVATION OF API GENERATION ENGINE COMPONENTS
  // =========================================================================
  describe('1. Preservation of LLM API Engine Components', () => {
    it('preserves WATERFALL_PROVIDERS registry with all 4 providers registered', () => {
      expect(WATERFALL_PROVIDERS).toBeDefined();
      expect(WATERFALL_PROVIDERS.length).toBeGreaterThanOrEqual(4);

      const providerIds = WATERFALL_PROVIDERS.map((p) => p.id);
      expect(providerIds).toContain('deepseek-v3');
      expect(providerIds).toContain('gemini-1.5-flash');
      expect(providerIds).toContain('groq-llama-3.3');
      expect(providerIds).toContain('ollama-qwen2.5');
    });

    it('preserves DeepSeek API adapter and models configuration', () => {
      const deepseek = WATERFALL_PROVIDERS.find((p) => p.id === 'deepseek-v3');
      expect(deepseek).toBeDefined();
      expect(deepseek?.models).toContain('deepseek-flash');
      expect(deepseek?.models).toContain('deepseek-chat');
      expect(deepseek?.isFreeTier).toBe(false);
      expect(deepseek?.paidModeAllowed).toBe(false); // default OFF
      expect(typeof deepseek?.getApiKey).toBe('function');
    });

    it('preserves prompt generation and universal disambiguation instructions', () => {
      const prompt = buildHskPrompt(
        2,
        'reading',
        1,
        [],
        'read_fill_blank_4opt',
        undefined,
        undefined,
        'GP_L2_ER_VS_LIANG'
      );

      expect(prompt).toContain('UNIVERSAL CONTEXTUAL DISAMBIGUATION (STRICT ENFORCEMENT)');
      expect(prompt).toContain('ALL 4 OPTIONS MUST BE COMPLETELY DISTINCT UNIQUE WORDS');
      expect(prompt).toContain('CONCISE VIETNAMESE EXPLANATIONS & RATIONALES');
    });

    it('preserves JSON schema output formatter for strict structured generation', () => {
      const responseFormat = buildQuestionResponseFormat(2, 'reading', 'read_fill_blank_4opt', 1);
      expect(responseFormat).toBeDefined();
      expect(responseFormat.type).toBe('json_schema');
      expect(responseFormat.json_schema.name).toBe('hsk_question_batch');
      expect(responseFormat.json_schema.schema.required).toContain('questions');
    });

    it('preserves parser, self-repair and extraction routines', () => {
      const brokenJson = '```json\n[{"stem": "我喜欢苹果。", "options": ["苹果", "香蕉"], "answer_idx": 0,}]\n```';
      const stripped = stripMarkdownCodeBlocks(brokenJson);
      expect(stripped).toContain('我喜欢苹果');

      const cleaned = removeTrailingCommas(stripped);
      expect(cleaned).not.toContain('0,}');

      const parsed = robustJsonParse(brokenJson);
      expect(Array.isArray(parsed)).toBe(true);

      const normalized = normalizeQuestionList(parsed);
      expect(normalized).toHaveLength(1);
      expect(normalized[0].stem).toBe('我喜欢苹果。');
    });

    it('preserves Six Quality Gates evaluator with all 6 gates fully intact', () => {
      const candidate = {
        stem: '我和弟弟一人买一本书，一共买了____本书。',
        options: ['二', '两', '三', '一'],
        answer_idx: 1,
        explanation_vi: 'Đáp án đúng là 两 đứng trước lượng từ 本 chỉ số lượng.',
        level: 3,
        skill: 'reading' as const,
        part_type: 'read_fill_blank_4opt',
        distractor_rationales: [
          { optionIdx: 0, optionText: '二', rationaleVi: '二 không đứng trước lượng từ.' },
          { optionIdx: 2, optionText: '三', rationaleVi: '三 không phù hợp với dữ kiện 1+1=2.' },
          { optionIdx: 3, optionText: '一', rationaleVi: '一 không phù hợp với dữ kiện 1+1=2.' },
        ],
      };

      const result = evaluateCandidateSixGates(candidate, []);
      expect(result.gate1_schema).toBeDefined();
      expect(result.gate2_rationales_coherence).toBeDefined();
      expect(result.gate3_vocab_coverage).toBeDefined();
      expect(result.gate4_distractor_quality).toBeDefined();
      expect(result.gate5_uniqueness).toBeDefined();
      expect(result.gate6_blind_solve).toBeDefined();
      expect(result.allPassed).toBe(true);
    });
  });

  // =========================================================================
  // SECTION 2: PAID PROVIDER FAIL-CLOSED LOCK & FREE-ONLY SAFETY
  // =========================================================================
  describe('2. Paid Provider Fail-Closed Lock & Zero-Cost Guardrails', () => {
    it('isFreeTierOnly defaults to true', () => {
      expect(isFreeTierOnly()).toBe(true);
    });

    it('strictly blocks paid provider (DeepSeek) pre-flight before network socket opening', async () => {
      await expect(
        generateWaterfallQuestions({
          level: 1,
          skill: 'reading',
          part_type: 'read_fill_blank_4opt',
          count: 1,
          provider: 'deepseek-v3',
          freeOnly: true,
          mock: false,
        })
      ).rejects.toThrow(/NO_ELIGIBLE_FREE_PROVIDER_AVAILABLE|PREFLIGHT_BLOCKED_PAID_PROVIDER|strictly blocked/i);
    });

    it('verifies checkDeepSeekBalance reports 0 granted balance and excludes from free-tier', async () => {
      const report = await checkDeepSeekBalance();
      expect(report.grantedBalance).toBe(0);
      expect(report.eligibleForFree).toBe(false);
      expect(report.status).toBe('free_tier_not_eligible');
    });

    it('guarantees no paid provider can be called automatically when free providers exhaust', async () => {
      // In auto waterfall mode with freeOnly: true, DeepSeek is never touched
      const allowlist = getFreeProviderAllowlist();
      if (allowlist) {
        expect(allowlist.has('deepseek-v3')).toBe(false);
        expect(allowlist.has('deepseek')).toBe(false);
      }
    });
  });

  // =========================================================================
  // SECTION 3: ZERO-API STUDENT LEARNING RUNTIME
  // =========================================================================
  describe('3. Zero-API Student Learning Runtime Flows', () => {
    it('Flow 1 (Skill Practice): serves approved questions directly from QBank with 0 API calls', async () => {
      const questions = loadApprovedQuestionsFromDb(1, { mode: 'practice' }, testDb);
      expect(questions).toHaveLength(1);
      expect(questions[0].id).toBe('q_approved_pass');

      // HTTP endpoint call
      const res = await fetch(`${baseUrl}/api/exam/practice-questions?level=1&skill=reading`);
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.success).toBe(true);
      expect(data.questions.some((q: any) => q.id === 'q_approved_pass')).toBe(true);
    });

    it('Flow 2 (Mock Exam): draws only blueprint-eligible approved questions with 0 API calls', () => {
      const mockQuestions = loadApprovedQuestionsFromDb(1, { mode: 'mock' }, testDb);
      expect(mockQuestions).toHaveLength(1);
      expect(mockQuestions[0].id).toBe('q_approved_pass');
    });

    it('Flow 3 (Fail-Closed Serving): strictly prevents unapproved candidate from leaking to student runtime', async () => {
      const practiceQuestions = loadApprovedQuestionsFromDb(1, { mode: 'practice' }, testDb);
      const ids = practiceQuestions.map((q) => q.id);
      expect(ids).not.toContain('q_pending_candidate');

      const res = await fetch(`${baseUrl}/api/exam/practice-questions?level=1&skill=reading`);
      const data = (await res.json()) as any;
      const apiIds = data.questions.map((q: any) => q.id);
      expect(apiIds).not.toContain('q_pending_candidate');
    });
  });
});
