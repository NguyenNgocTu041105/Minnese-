/**
 * tests/adversarial_m3_challenger_dual_flow.test.ts
 *
 * Empirical Adversarial Challenge Suite for Milestone M3 (Features 13–16)
 * Critic & Specialist Role: Empirical Challenger (challenger_m3_1)
 *
 * Adversarially challenges:
 * 1. Answer shuffling boundaries (0-opt writing tasks, 1-opt, 2-opt T/F, 3-opt HSK 1-2,
 *    4-opt MCQs, 5-opt & 7-opt rejections, 6-opt word bank variants, 6-opt non-word-bank MCQs,
 *    Unicode Vietnamese word boundaries, negation and multi-distractor protection).
 * 2. In-memory session snapshot immutability across repeated GET /session/:sessionId reloads
 *    and database snapshot recovery (zero re-shuffling on reload).
 * 3. Accurate student answer verification & grading against shuffled indices in
 *    POST /api/exam/check-answer and POST /api/exam/submit.
 * 4. Anti-cheat answer stripping in practice responses (zero leakage of answer_index,
 *    answer_idx, explanation_vi, explanation).
 * 5. Approval pipeline dual-flow synchronization and immediate practice availability.
 * 6. Zero mutation on data/hsk_exam.db (SHA-256 preserved).
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import express, { Express } from 'express';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

import {
  canShuffle,
  shuffleQuestionAnswers,
  shuffleOptionsArray,
  isServingAnswerShuffleEnabled,
} from '../src/server/utils/answerShuffle.js';
import {
  examRouter,
  loadApprovedQuestionsFromDb,
  createTestExamDb,
  setExamDbForTesting,
  clearAllSessionsForTesting,
  getSessionDirect,
  stripAnswerFromQuestion,
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

describe('Empirical Adversarial Challenge M3: Dual-Flow Segregation & Serving Integrity', () => {
  let server: http.Server | null = null;
  let baseUrl: string = '';
  let testDb: DatabaseSync;
  const originalEnvToken = process.env.QBANK_ADMIN_TOKEN;
  const originalAdminEnabled = process.env.QBANK_ADMIN_ENABLED;
  const originalShuffleEnv = process.env.ENABLE_SERVING_ANSWER_SHUFFLE;
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
    if (originalShuffleEnv !== undefined) {
      process.env.ENABLE_SERVING_ANSWER_SHUFFLE = originalShuffleEnv;
    } else {
      delete process.env.ENABLE_SERVING_ANSWER_SHUFFLE;
    }
    setQBankAdminTokenForTesting(null);
    setDbSyncForTesting(null);
    setExamDbForTesting(null);

    expect(getSha256(HSK_EXAM_DB_PATH)).toBe(EXPECTED_HSK_EXAM_DB_HASH);
  });

  beforeEach(async () => {
    clearAllSessionsForTesting();
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
    clearAllSessionsForTesting();
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

  // =========================================================================
  // Challenge 1: Answer Shuffling Boundaries & Contract Invariants
  // =========================================================================
  describe('Challenge 1: Answer Shuffling Boundaries & Contract Invariants', () => {
    it('boundary 1.1: 0-option writing tasks return canShuffle=false and never throw or mutate input', () => {
      const qWriting = {
        id: 'adv-q-writing-0opt',
        stem: '请写一篇短文。',
        options: [] as string[],
        part_type: 'write_composition_hsk4',
        section: 'writing',
      };
      const originalJson = JSON.stringify(qWriting);

      const guard = canShuffle(qWriting);
      expect(guard.canShuffle).toBe(false);
      expect(guard.reason).toContain('Less than 2 options');

      const shuffled = shuffleQuestionAnswers(qWriting);
      expect(shuffled.shuffled).toBe(false);
      expect(shuffled.options).toEqual([]);
      expect(shuffled.mapping).toEqual([]);
      expect(JSON.stringify(qWriting)).toBe(originalJson);
    });

    it('boundary 1.2: 1-option questions return canShuffle=false and never throw or mutate input', () => {
      const qSingle = {
        id: 'adv-q-single-opt',
        stem: 'Only one choice exists',
        options: ['Single Option'],
        answer_index: 0,
        part_type: 'single_choice',
      };
      const originalJson = JSON.stringify(qSingle);

      const guard = canShuffle(qSingle);
      expect(guard.canShuffle).toBe(false);
      expect(guard.reason).toContain('Less than 2 options');

      const res = shuffleQuestionAnswers(qSingle);
      expect(res.shuffled).toBe(false);
      expect(res.options).toEqual(['Single Option']);
      expect(res.new_answer_idx).toBe(0);
      expect(res.mapping).toEqual([0]);
      expect(JSON.stringify(qSingle)).toBe(originalJson);
    });

    it('boundary 1.3: 2-option True/False questions are strictly protected from shuffling', () => {
      const tfVariants = [
        { options: ['对', '错'], answer_index: 0 },
        { options: ['正确', '错误'], answer_index: 1 },
        { options: ['A', 'B'], answer_index: 0, part_type: 'read_tf' },
        { options: ['A', 'B'], answer_index: 1, part_type: 'listen_true_false' },
        { options: ['A', 'B'], answer_index: 0, task_type: 'judge_true_false' },
        { options: ['A', 'B'], answer_index: 0, part_type: 'read_reorder_sentence' },
      ];

      for (const tfQ of tfVariants) {
        const guard = canShuffle(tfQ);
        expect(guard.canShuffle).toBe(false);
        expect(guard.category).toBe(5);

        const res = shuffleQuestionAnswers(tfQ);
        expect(res.shuffled).toBe(false);
        expect(res.new_answer_idx).toBe(tfQ.answer_index);
      }
    });

    it('boundary 1.4: 2-option non-True/False questions (e.g. gender/choice) CAN be safely shuffled', () => {
      const qBinary = {
        options: ['男', '女'],
        answer_index: 1, // 女
        explanation_vi: 'Người được nhắc đến là phụ nữ.',
      };
      const guard = canShuffle(qBinary);
      expect(guard.canShuffle).toBe(true);
      expect(guard.category).toBe(1);

      // Force a swap using custom deterministic rng
      const forceSwapRng = () => 0.0; // i=1, j = floor(0.0 * 2) = 0 -> swaps indices 1 and 0
      const res = shuffleQuestionAnswers(qBinary, forceSwapRng);
      expect(res.shuffled).toBe(true);
      expect(res.options).toEqual(['女', '男']);
      expect(res.new_answer_idx).toBe(0);
      expect(res.options[res.new_answer_idx]).toBe('女');
    });

    it('boundary 1.5: 3-option HSK 1-2 listening & reading MCQs CAN be safely shuffled', () => {
      const q3 = {
        options: ['苹果', '香蕉', '橙子'],
        answer_index: 1, // 香蕉
        level: 1,
        part_type: 'read_match_3opt',
        explanation_vi: 'Trái chuối (香蕉) là loại quả màu vàng.',
      };
      const guard = canShuffle(q3);
      expect(guard.canShuffle).toBe(true);

      const forceRng = () => 0.0;
      const res = shuffleQuestionAnswers(q3, forceRng);
      expect(res.shuffled).toBe(true);
      expect(res.options.length).toBe(3);
      expect(res.options[res.new_answer_idx]).toBe('香蕉');
    });

    it('boundary 1.6: 4-option standard MCQs CAN be safely shuffled', () => {
      const q4 = {
        options: ['选项A', '选项B', '选项C', '选项D'],
        answer_index: 2, // 选项C
        explanation_vi: 'Chọn đáp án C: đây là phương án chính xác.',
      };
      const guard = canShuffle(q4);
      expect(guard.canShuffle).toBe(true);

      const forceRng = () => 0.0;
      const res = shuffleQuestionAnswers(q4, forceRng);
      expect(res.shuffled).toBe(true);
      expect(res.options.length).toBe(4);
      expect(res.options[res.new_answer_idx]).toBe('选项C');
    });

    it('boundary 1.7: 5-option, 7-option, and 8-option questions are strictly REJECTED from shuffling', () => {
      const oddOptionQuestions = [
        { options: ['A', 'B', 'C', 'D', 'E'], answer_index: 2 },
        { options: ['A', 'B', 'C', 'D', 'E', 'F', 'G'], answer_index: 3 },
        { options: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], answer_index: 0 },
      ];

      for (const q of oddOptionQuestions) {
        const guard = canShuffle(q);
        expect(guard.canShuffle).toBe(false);
        expect(guard.category).toBe(5);
        expect(guard.reason).toContain(`Unsupported option count (${q.options.length})`);

        const res = shuffleQuestionAnswers(q);
        expect(res.shuffled).toBe(false);
        expect(res.new_answer_idx).toBe(q.answer_index);
      }
    });

    it('boundary 1.8: 6-option word bank variants are STRICTLY protected against shuffling', () => {
      const wordBankVariants = [
        { options: ['A', 'B', 'C', 'D', 'E', 'F'], answer_index: 0, part_type: 'read_fill_blank_word_bank_6opt' },
        { options: ['A', 'B', 'C', 'D', 'E', 'F'], answer_index: 1, part_type: 'read_fill_blank_word_bank_split' },
        { options: ['A', 'B', 'C', 'D', 'E', 'F'], answer_index: 2, part_type: 'read_fill_blank_word_bank' },
        { options: ['A', 'B', 'C', 'D', 'E', 'F'], answer_index: 3, task_type: 'word_bank_matching' },
        { options: ['A', 'B', 'C', 'D', 'E', 'F'], answer_index: 4, group_id: 'section_word_bank_1' },
        { options: ['A', 'B', 'C', 'D', 'E', 'F'], answer_index: 5, is_word_bank: true },
        { options: ['A', 'B', 'C', 'D', 'E', 'F'], answer_index: 0, shared_word_bank: true },
        { options: ['A', 'B', 'C', 'D', 'E', 'F'], answer_index: 1, is_shared_word_bank: true },
      ];

      for (const wbQ of wordBankVariants) {
        const guard = canShuffle(wbQ);
        expect(guard.canShuffle).toBe(false);
        expect(guard.category).toBe(5);
        expect(guard.reason).toContain('word bank');

        const res = shuffleQuestionAnswers(wbQ);
        expect(res.shuffled).toBe(false);
        expect(res.new_answer_idx).toBe(wbQ.answer_index);
      }
    });

    it('boundary 1.9: 6-option standard MCQ (non-word-bank) CAN be safely shuffled', () => {
      const q6Mcq = {
        options: ['10', '20', '30', '40', '50', '60'],
        answer_index: 3, // '40'
        part_type: 'math_calculation_6opt',
        explanation_vi: 'Kết quả phép tính là 40.',
      };
      const guard = canShuffle(q6Mcq);
      expect(guard.canShuffle).toBe(true);
      expect(guard.category).toBe(1);

      const forceRng = () => 0.0;
      const res = shuffleQuestionAnswers(q6Mcq, forceRng);
      expect(res.shuffled).toBe(true);
      expect(res.options.length).toBe(6);
      expect(res.options[res.new_answer_idx]).toBe('40');
    });

    it('boundary 1.10: Vietnamese uppercase word boundaries prevent false option matches', () => {
      const qVietnameseWords = {
        options: ['北京', '上海', '广州', '深圳'],
        answer_index: 0, // 北京
        explanation_vi: 'Cà phê và Bác sĩ ở Đà Nẵng rất nổi tiếng.',
      };
      // 'C' in 'Cà phê', 'B' in 'Bác sĩ', 'Đ' in 'Đà Nẵng' must NOT be counted as isolated option letters!
      const guard = canShuffle(qVietnameseWords);
      expect(guard.canShuffle).toBe(true);
      expect(guard.category).toBe(1); // Group 1: Semantic explanation without letter references
    });

    it('boundary 1.11: Negation phrasing and multi-distractor breakdowns are rejected from shuffling', () => {
      const qNegation = {
        options: ['A', 'B', 'C', 'D'],
        answer_index: 0,
        explanation_vi: 'Không nên chọn phương án B và loại trừ C vì sai ngữ pháp.',
      };
      expect(canShuffle(qNegation).canShuffle).toBe(false);

      const qMultiBreakdown = {
        options: ['A', 'B', 'C', 'D'],
        answer_index: 1,
        explanation_vi: 'Đáp án B đúng. A sai vì nghĩa bóng, C sai vì thì quá khứ.',
      };
      expect(canShuffle(qMultiBreakdown).canShuffle).toBe(false);
    });

    it('boundary 1.12: Strict RNG validation throws TypeError/RangeError and guarantees immutability', () => {
      const validItems = ['Apple', 'Banana', 'Cherry'];
      const copy = [...validItems];

      // RNG returning NaN
      expect(() => shuffleOptionsArray(validItems, () => NaN)).toThrow(TypeError);
      // RNG returning < 0
      expect(() => shuffleOptionsArray(validItems, () => -0.01)).toThrow(RangeError);
      // RNG returning >= 1
      expect(() => shuffleOptionsArray(validItems, () => 1.0)).toThrow(RangeError);
      // RNG returning undefined/string
      expect(() => shuffleOptionsArray(validItems, () => undefined as any)).toThrow(TypeError);

      // Verify input array remained 100% untouched
      expect(validItems).toEqual(copy);
    });
  });

  // =========================================================================
  // Challenge 2: In-Memory Session Snapshot Immutability & Re-Fetching Consistency
  // =========================================================================
  describe('Challenge 2: In-Memory Session Snapshot Immutability & Re-Fetching Consistency', () => {
    beforeEach(() => {
      // Seed 5 reading questions in testDb
      testDb.exec(`
        INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, explanation_vi, status, is_active)
        VALUES
          ('q-imm-1', 'Stem 1', '["Op1_A", "Op1_B", "Op1_C"]', 0, 1, 'reading', 'read_match', 'Giải thích 1', 'approved', 1),
          ('q-imm-2', 'Stem 2', '["Op2_A", "Op2_B", "Op2_C", "Op2_D"]', 1, 1, 'reading', 'read_comprehension', 'Giải thích 2', 'approved', 1),
          ('q-imm-3', 'Stem 3', '["Op3_A", "Op3_B", "Op3_C"]', 2, 1, 'reading', 'read_match', 'Giải thích 3', 'approved', 1),
          ('q-imm-4', 'Stem 4', '["Op4_A", "Op4_B", "Op4_C", "Op4_D"]', 3, 1, 'reading', 'read_comprehension', 'Giải thích 4', 'approved', 1),
          ('q-imm-5', 'Stem 5', '["Op5_A", "Op5_B", "Op5_C"]', 1, 1, 'reading', 'read_match', 'Giải thích 5', 'approved', 1);

        INSERT INTO exam_eligible_pool (question_id, level, skill, part_type, stem, practice_eligible, exam_eligible)
        VALUES
          ('q-imm-1', 1, 'reading', 'read_match', 'Stem 1', 1, 1),
          ('q-imm-2', 1, 'reading', 'read_comprehension', 'Stem 2', 1, 1),
          ('q-imm-3', 1, 'reading', 'read_match', 'Stem 3', 1, 1),
          ('q-imm-4', 1, 'reading', 'read_comprehension', 'Stem 4', 1, 1),
          ('q-imm-5', 1, 'reading', 'read_match', 'Stem 5', 1, 1);
      `);
    });

    it('immutability 2.1: Repeated GET /session/:sessionId calls return identical option order with zero re-shuffling', async () => {
      // 1. Generate session with shuffle: true
      const genRes = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 1,
          mode: 'practice',
          skill: 'reading',
          count: 5,
          shuffle: true,
        }),
      });

      expect(genRes.status).toBe(200);
      const genData = await genRes.json();
      expect(genData.success).toBe(true);
      const sessionId = genData.sessionId;
      expect(sessionId).toBeDefined();

      const initialQuestions = genData.session.questions;
      expect(initialQuestions.length).toBe(5);

      // Snapshot the exact option arrays of all 5 questions
      const initialOptionsSnapshot = initialQuestions.map((q: any) => ({
        id: q.id,
        item_number: q.item_number,
        options: [...q.options],
      }));

      // 2. Fetch session 5 consecutive times via GET /api/exam/session/:sessionId
      for (let attempt = 1; attempt <= 5; attempt++) {
        const reloadRes = await fetch(`${baseUrl}/api/exam/session/${sessionId}`);
        expect(reloadRes.status).toBe(200);
        const reloadData = await reloadRes.json();
        expect(reloadData.success).toBe(true);

        const reloadedQuestions = reloadData.session.questions;
        expect(reloadedQuestions.length).toBe(5);

        for (let i = 0; i < 5; i++) {
          const expected = initialOptionsSnapshot[i];
          const actual = reloadedQuestions[i];

          expect(actual.id).toBe(expected.id);
          expect(actual.item_number).toBe(expected.item_number);
          expect(actual.options).toEqual(expected.options); // Exactly identical array, zero re-shuffle
        }
      }
    });

    it('immutability 2.2: Memory cache eviction still loads identical option snapshot from SQLite', async () => {
      // 1. Generate session with shuffle: true
      const genRes = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 1,
          mode: 'practice',
          skill: 'reading',
          count: 3,
          shuffle: true,
        }),
      });
      const genData = await genRes.json();
      const sessionId = genData.sessionId;
      const originalOptions = genData.session.questions.map((q: any) => ({ id: q.id, options: [...q.options] }));

      // 2. Clear volatile memory cache completely
      clearAllSessionsForTesting();

      // 3. Reload from persistent SQLite snapshot
      const reloadRes = await fetch(`${baseUrl}/api/exam/session/${sessionId}`);
      expect(reloadRes.status).toBe(200);
      const reloadData = await reloadRes.json();
      expect(reloadData.success).toBe(true);

      const recoveredQuestions = reloadData.session.questions;
      expect(recoveredQuestions.length).toBe(3);
      for (let i = 0; i < 3; i++) {
        expect(recoveredQuestions[i].id).toBe(originalOptions[i].id);
        expect(recoveredQuestions[i].options).toEqual(originalOptions[i].options);
      }
    });
  });

  // =========================================================================
  // Challenge 3: Answer Verification & Grading Against Shuffled Indices
  // =========================================================================
  describe('Challenge 3: Answer Verification & Grading Against Shuffled Indices', () => {
    beforeEach(() => {
      // Seed questions where we know the exact correct text
      testDb.exec(`
        INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, explanation_vi, status, is_active)
        VALUES
          ('q-grade-1', 'Chọn quả chuối:', '["Quả táo", "Quả chuối", "Quả cam"]', 1, 1, 'reading', 'read_match', 'Quả chuối có màu vàng.', 'approved', 1),
          ('q-grade-2', 'Chọn thủ đô Trung Quốc:', '["Thượng Hải", "Bắc Kinh", "Quảng Châu", "Thâm Quyến"]', 1, 1, 'reading', 'read_comprehension', 'Bắc Kinh là thủ đô.', 'approved', 1),
          ('q-grade-write', 'Viết một câu về thời tiết:', '[]', -1, 1, 'writing', 'write_sentence', 'Câu mẫu: 今天天气很好。', 'approved', 1);

        INSERT INTO exam_eligible_pool (question_id, level, skill, part_type, stem, practice_eligible, exam_eligible)
        VALUES
          ('q-grade-1', 1, 'reading', 'read_match', 'Chọn quả chuối:', 1, 1),
          ('q-grade-2', 1, 'reading', 'read_comprehension', 'Chọn thủ đô Trung Quốc:', 1, 1),
          ('q-grade-write', 1, 'writing', 'write_sentence', 'Viết một câu về thời tiết:', 1, 1);
      `);
    });

    it('grading 3.1: POST /api/exam/check-answer validates student answer against SHUFFLED position', async () => {
      // Create session with shuffle: true
      const genRes = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 1,
          mode: 'practice',
          count: 3,
          shuffle: true,
        }),
      });
      const genData = await genRes.json();
      const sessionId = genData.sessionId;

      // Access session direct to inspect internal shuffled answer index
      const session = getSessionDirect(sessionId)!;
      expect(session).toBeDefined();

      const q1 = session.questions.find((q) => q.id === 'q-grade-1')!;
      expect(q1).toBeDefined();
      const shuffledCorrectIdx = q1.answer_index!;
      const correctOptionText = q1.options[shuffledCorrectIdx];
      expect(correctOptionText).toBe('Quả chuối');

      // Test A: Submitting correct shuffled index -> isCorrect: true
      const checkCorrectNum = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          questionId: 'q-grade-1',
          userAnswer: shuffledCorrectIdx,
        }),
      });
      const dataCorrectNum = await checkCorrectNum.json();
      expect(dataCorrectNum.success).toBe(true);
      expect(dataCorrectNum.isCorrect).toBe(true);
      expect(dataCorrectNum.correctAnswer).toBe(shuffledCorrectIdx);
      expect(dataCorrectNum.correctAnswerText).toContain('Quả chuối');

      // Test B: Submitting letter corresponding to shuffled position (e.g. 'A', 'B', 'C')
      const letter = String.fromCharCode(65 + shuffledCorrectIdx);
      const checkCorrectLetter = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          questionId: 'q-grade-1',
          userAnswer: letter,
        }),
      });
      const dataCorrectLetter = await checkCorrectLetter.json();
      expect(dataCorrectLetter.success).toBe(true);
      expect(dataCorrectLetter.isCorrect).toBe(true);

      // Test C: Submitting a wrong index (any index !== shuffledCorrectIdx) -> isCorrect: false
      const wrongIdx = (shuffledCorrectIdx + 1) % q1.options.length;
      const checkWrong = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          questionId: 'q-grade-1',
          userAnswer: wrongIdx,
        }),
      });
      const dataWrong = await checkWrong.json();
      expect(dataWrong.success).toBe(true);
      expect(dataWrong.isCorrect).toBe(false);

      // Test D: Open-ended writing task validation
      const checkWriting = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          questionId: 'q-grade-write',
          userAnswer: '今天天气很好，阳光明媚。',
        }),
      });
      const dataWriting = await checkWriting.json();
      expect(dataWriting.success).toBe(true);
      expect(dataWriting.isCorrect).toBe(true);
    });

    it('grading 3.2: POST /api/exam/submit grades full exam using shuffled indices with 100% score and retry idempotency', async () => {
      const genRes = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 1,
          mode: 'practice',
          count: 3,
          shuffle: true,
        }),
      });
      const genData = await genRes.json();
      const sessionId = genData.sessionId;
      const session = getSessionDirect(sessionId)!;

      // Construct answers map matching the shuffled correct indices for all questions
      const perfectAnswers: Record<string, any> = {};
      for (const q of session.questions) {
        if (q.section === 'writing') {
          perfectAnswers[q.id] = 'Tôi là học sinh.';
        } else {
          perfectAnswers[q.id] = q.answer_index;
        }
      }

      // Submit exam
      const submitRes1 = await fetch(`${baseUrl}/api/exam/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          answers: perfectAnswers,
          timeSpentSeconds: 120,
        }),
      });
      expect(submitRes1.status).toBe(200);
      const submitData1 = await submitRes1.json();
      expect(submitData1.success).toBe(true);
      expect(submitData1.isRetryIdempotent).toBe(false);
      expect(submitData1.scoreResult.passed).toBe(true);
      expect(submitData1.scoreResult.percentage).toBe(100);

      // Verify detailed review
      for (const reviewItem of submitData1.scoreResult.detailedReview) {
        expect(reviewItem.isCorrect).toBe(true);
      }

      // Submit again to verify idempotency
      const submitRes2 = await fetch(`${baseUrl}/api/exam/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          answers: perfectAnswers,
        }),
      });
      expect(submitRes2.status).toBe(200);
      const submitData2 = await submitRes2.json();
      expect(submitData2.success).toBe(true);
      expect(submitData2.isRetryIdempotent).toBe(true);
      expect(submitData2.submissionId).toBe(submitData1.submissionId);
      expect(submitData2.scoreResult).toEqual(submitData1.scoreResult);
    });
  });

  // =========================================================================
  // Challenge 4: Anti-Cheat Answer Stripping in Practice Responses
  // =========================================================================
  describe('Challenge 4: Anti-Cheat Answer Stripping in Practice Responses', () => {
    beforeEach(() => {
      testDb.exec(`
        INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, explanation_vi, status, is_active)
        VALUES
          ('q-leak-1', 'Chọn A:', '["A", "B", "C", "D"]', 0, 1, 'reading', 'read_match', 'Đáp án bí mật A.', 'approved', 1),
          ('q-leak-2', 'Chọn B:', '["A", "B", "C"]', 1, 1, 'reading', 'read_match_3opt', 'Đáp án bí mật B.', 'approved', 1);

        INSERT INTO exam_eligible_pool (question_id, level, skill, part_type, stem, practice_eligible, exam_eligible)
        VALUES
          ('q-leak-1', 1, 'reading', 'read_match', 'Chọn A:', 1, 1),
          ('q-leak-2', 1, 'reading', 'read_match_3opt', 'Chọn B:', 1, 1);
      `);
    });

    it('anti-cheat 4.1: stripAnswerFromQuestion helper strips all sensitive fields', () => {
      const fullQuestion: any = {
        id: 'q-test',
        stem: 'Test',
        options: ['A', 'B'],
        answer_index: 0,
        answer_idx: 0,
        explanation_vi: 'Giải thích bí mật',
        explanation: 'Secret explanation',
        level: 1,
      };

      const sanitized = stripAnswerFromQuestion(fullQuestion) as any;
      expect(sanitized.id).toBe('q-test');
      expect(sanitized.stem).toBe('Test');
      expect(sanitized.options).toEqual(['A', 'B']);
      expect(sanitized.answer_index).toBeUndefined();
      expect(sanitized.answer_idx).toBeUndefined();
      expect(sanitized.explanation_vi).toBeUndefined();
      expect(sanitized.explanation).toBeUndefined();
    });

    it('anti-cheat 4.2: POST /api/exam/generate-mock strips answers from top-level questions and session.questions', async () => {
      const res = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 1,
          mode: 'practice',
          count: 2,
          shuffle: true,
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);

      // Verify top-level questions
      expect(Array.isArray(data.questions)).toBe(true);
      expect(data.questions.length).toBeGreaterThan(0);
      for (const q of data.questions) {
        expect(q.answer_index).toBeUndefined();
        expect(q.answer_idx).toBeUndefined();
        expect(q.explanation_vi).toBeUndefined();
        expect(q.explanation).toBeUndefined();
      }

      // Verify nested session.questions
      expect(Array.isArray(data.session.questions)).toBe(true);
      expect(data.session.questions.length).toBeGreaterThan(0);
      for (const q of data.session.questions) {
        expect(q.answer_index).toBeUndefined();
        expect(q.answer_idx).toBeUndefined();
        expect(q.explanation_vi).toBeUndefined();
        expect(q.explanation).toBeUndefined();
      }
    });

    it('anti-cheat 4.3: GET /api/exam/session/:sessionId strips answers from session payload', async () => {
      // 1. Create session
      const genRes = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 1,
          mode: 'practice',
          count: 2,
        }),
      });
      const genData = await genRes.json();
      const sessionId = genData.sessionId;

      // 2. Fetch session
      const sessRes = await fetch(`${baseUrl}/api/exam/session/${sessionId}`);
      expect(sessRes.status).toBe(200);
      const sessData = await sessRes.json();
      expect(sessData.success).toBe(true);

      for (const q of sessData.session.questions) {
        expect(q.answer_index).toBeUndefined();
        expect(q.answer_idx).toBeUndefined();
        expect(q.explanation_vi).toBeUndefined();
        expect(q.explanation).toBeUndefined();
      }
    });

    it('anti-cheat 4.4: GET /api/exam/practice strips answers from all returned questions', async () => {
      const res = await fetch(`${baseUrl}/api/exam/practice?level=1&count=2`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);

      expect(Array.isArray(data.questions)).toBe(true);
      expect(data.questions.length).toBeGreaterThan(0);
      for (const q of data.questions) {
        expect(q.answer_index).toBeUndefined();
        expect(q.answer_idx).toBeUndefined();
        expect(q.explanation_vi).toBeUndefined();
        expect(q.explanation).toBeUndefined();
      }
    });
  });

  // =========================================================================
  // Challenge 5: Approval Pipeline Dual-Flow Synchronization
  // =========================================================================
  describe('Challenge 5: Approval Pipeline Dual-Flow Synchronization', () => {
    it('pipeline 5.1: approving pending question immediately inserts into exam_eligible_pool and enables practice serving', async () => {
      // 1. Insert pending question
      testDb.prepare(`
        INSERT INTO pending_questions (
          id, stem, options, answer_idx, level, skill, part_type, status, explanation_vi, is_active, content_hash
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'pending-sync-1',
        'Chọn từ đúng: Con chim hót.',
        JSON.stringify(['鸟', '鱼', '狗']),
        0,
        1,
        'reading',
        'read_match_3opt',
        'pending',
        'Chim hót líu lo.',
        1,
        'hash-sync-1'
      );

      // Verify not yet in questions or pool
      const qPre = testDb.prepare('SELECT * FROM questions WHERE id = ?').get('pending-sync-1');
      expect(qPre).toBeUndefined();
      const poolPre = testDb.prepare('SELECT * FROM exam_eligible_pool WHERE question_id = ?').get('pending-sync-1');
      expect(poolPre).toBeUndefined();

      // 2. Approve via POST /api/qbank/pending/approve with id
      const approveRes = await fetch(`${baseUrl}/api/qbank/pending/approve`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ id: 'pending-sync-1' }),
      });
      expect(approveRes.status).toBe(200);
      const approveData = await approveRes.json();
      expect(approveData.success).toBe(true);
      expect(approveData.approved_count).toBe(1);

      // 3. Verify questions table
      const qPost: any = testDb.prepare('SELECT * FROM questions WHERE id = ?').get('pending-sync-1');
      expect(qPost).toBeDefined();
      expect(qPost.status).toBe('approved');
      expect(qPost.is_active).toBe(1);

      // 4. Verify exam_eligible_pool table has practice_eligible = 1
      const poolPost: any = testDb.prepare('SELECT * FROM exam_eligible_pool WHERE question_id = ?').get('pending-sync-1');
      expect(poolPost).toBeDefined();
      expect(poolPost.practice_eligible).toBe(1);

      // 5. Verify immediate practice serving
      const loaded = loadApprovedQuestionsFromDb(1, { mode: 'practice' }, testDb);
      const found = loaded.find((q) => q.id === 'pending-sync-1');
      expect(found).toBeDefined();
      expect(found?.stem).toBe('Chọn từ đúng: Con chim hót.');
    });

    it('pipeline 5.2: rejecting a pending question sets status=rejected in pending_questions and excludes from pool', async () => {
      // 1. Insert pending question
      testDb.prepare(`
        INSERT INTO pending_questions (
          id, stem, options, answer_idx, level, skill, part_type, status, explanation_vi, is_active, content_hash
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'pending-rej-1',
        'Câu hỏi lỗi ngữ pháp nghiêm trọng.',
        JSON.stringify(['A', 'B', 'C']),
        0,
        1,
        'reading',
        'read_match_3opt',
        'pending',
        'Giải thích',
        1,
        'hash-rej-1'
      );

      // 2. Reject via POST /api/qbank/pending/reject
      const rejRes = await fetch(`${baseUrl}/api/qbank/pending/reject`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ id: 'pending-rej-1', reason: 'Grammar defect' }),
      });
      expect(rejRes.status).toBe(200);
      const rejData = await rejRes.json();
      expect(rejData.success).toBe(true);
      expect(rejData.rejected_count).toBe(1);

      // 3. Verify pending_questions table status = rejected
      const pendingRow: any = testDb.prepare('SELECT * FROM pending_questions WHERE id = ?').get('pending-rej-1');
      expect(pendingRow).toBeDefined();
      expect(pendingRow.status).toBe('rejected');
      expect(pendingRow.is_active).toBe(0);

      // 4. Verify questions and exam_eligible_pool do NOT contain the rejected question
      const qRow: any = testDb.prepare('SELECT * FROM questions WHERE id = ?').get('pending-rej-1');
      expect(qRow).toBeUndefined();
      const poolRow: any = testDb.prepare('SELECT * FROM exam_eligible_pool WHERE question_id = ?').get('pending-rej-1');
      expect(poolRow).toBeUndefined();

      // 5. Verify excluded from serving
      const loaded = loadApprovedQuestionsFromDb(1, { mode: 'practice' }, testDb);
      const found = loaded.find((q) => q.id === 'pending-rej-1');
      expect(found).toBeUndefined();
    });
  });

  // =========================================================================
  // Challenge 6: Input Sanitization & Error Boundaries
  // =========================================================================
  describe('Challenge 6: Input Sanitization & Fail-Closed Error Boundaries', () => {
    it('sanitization 6.1: POST /api/exam/generate-mock rejects invalid levels with HTTP 400', async () => {
      const invalidLevels = [-1, 0, 7, 99, 'abc', 'invalid', null, undefined];

      for (const badLevel of invalidLevels) {
        const res = await fetch(`${baseUrl}/api/exam/generate-mock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ level: badLevel, mode: 'practice' }),
        });

        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.success).toBe(false);
        expect(data.error).toContain('Cấp độ HSK không hợp lệ');
      }
    });

    it('sanitization 6.2: POST /api/exam/generate-mock mode=mock fails closed with HTTP 400 on shortage', async () => {
      // testDb only has 0 listening questions for HSK 1 (HSK 1 requires 20 listening and 20 reading)
      const res = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 1, mode: 'mock' }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.is_fully_eligible).toBe(false);
      expect(data.total_missing).toBeGreaterThan(0);
      expect(data.error).toContain('chưa đủ điều kiện tạo đề thi chính thức');
    });

    it('sanitization 6.3: POST /api/exam/check-answer fails closed on missing sessionId, non-existent session, or wrong questionId', async () => {
      // 1. Missing sessionId
      const resNoSession = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: 'any-id', userAnswer: 0 }),
      });
      expect(resNoSession.status).toBe(400);
      const dataNoSession = await resNoSession.json();
      expect(dataNoSession.code).toBe('SESSION_REQUIRED');

      // 2. Non-existent sessionId
      const resBadSession = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: 'non-existent-uuid', questionId: 'any-id', userAnswer: 0 }),
      });
      expect(resBadSession.status).toBe(404);
      const dataBadSession = await resBadSession.json();
      expect(dataBadSession.code).toBe('SESSION_NOT_FOUND');

      // 3. Question not in session
      // Create valid session first
      testDb.exec(`
        INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, explanation_vi, status, is_active)
        VALUES ('q-valid-s6', 'Valid Stem', '["A", "B", "C"]', 0, 1, 'reading', 'read_match', 'Valid explanation', 'approved', 1);
        INSERT INTO exam_eligible_pool (question_id, level, skill, part_type, stem, practice_eligible, exam_eligible)
        VALUES ('q-valid-s6', 1, 'reading', 'read_match', 'Valid Stem', 1, 1);
      `);

      const genRes = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 1, mode: 'practice', count: 1 }),
      });
      const genData = await genRes.json();
      const validSessionId = genData.sessionId;

      const resWrongQ = await fetch(`${baseUrl}/api/exam/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: validSessionId, questionId: 'unrelated-question-id', userAnswer: 0 }),
      });
      expect(resWrongQ.status).toBe(404);
      const dataWrongQ = await resWrongQ.json();
      expect(dataWrongQ.code).toBe('QUESTION_NOT_IN_SESSION');
    });

    it('sanitization 6.4: shuffleQuestionAnswers throws RangeError/TypeError on invalid MCQ answer_idx', () => {
      const qInvalidIdx = {
        options: ['A', 'B', 'C', 'D'],
        answer_index: 4, // Out of bounds for length 4 [0, 3]
      };
      expect(() => shuffleQuestionAnswers(qInvalidIdx)).toThrow(RangeError);

      const qNegativeIdx = {
        options: ['A', 'B', 'C', 'D'],
        answer_index: -1,
      };
      expect(() => shuffleQuestionAnswers(qNegativeIdx)).toThrow(RangeError);

      const qFloatIdx = {
        options: ['A', 'B', 'C', 'D'],
        answer_index: 1.5,
      };
      expect(() => shuffleQuestionAnswers(qFloatIdx)).toThrow(TypeError);

      const qMissingIdx = {
        options: ['A', 'B', 'C', 'D'],
      };
      expect(() => shuffleQuestionAnswers(qMissingIdx as any)).toThrow(TypeError);
    });
  });
});

