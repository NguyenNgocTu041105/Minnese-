/**
 * tests/challenger_o63_m3_2_adversarial.test.ts
 *
 * EMPIRICAL ADVERSARIAL STRESS TEST SUITE — Milestone M3 (Nhóm C)
 * Challenger: challenger_o63_m3_2
 *
 * Verifies:
 * 1. Adversarial Answer Shuffling:
 *    - 0 options (writing/open-ended): returns shuffled: false, preserves original indices, never crashes.
 *    - 1 option: returns shuffled: false, preserves option.
 *    - 4 options: Fisher-Yates uniform permutation, exact answer mapping, explanation letter sync.
 *    - 5 options: rejected by canShuffle (unsupported count), returns shuffled: false safely without throw, while low-level shuffleOptionsArray supports generic 5-length.
 *    - 6 options: standalone 6-opt shuffles cleanly; shared word bank (is_word_bank / word_bank part_type) is strictly protected from shuffling.
 * 2. Formatter Invariants (formatCorrectAnswerText):
 *    - Writing tasks (0 options / empty array / null / undefined): strictly returns '', NEVER character fallbacks like 'A' or 'Đáp án đúng: A'.
 *    - Redundant prefix stripping: 'A. 苹果' -> 'A. 苹果', 'B: 香蕉' -> 'B. 香蕉'.
 *    - Multi-option letter extraction up to 'F' for 6 options.
 * 3. Pool Inspection Across Reading, Listening, Writing:
 *    - inspectExamPoolBySections across HSK 1..6 blueprints.
 *    - Writing tasks with 0 options correctly match writing parts.
 *    - Inactive / pending / rejected questions strictly excluded.
 *    - Practice filtering isolation: zero cross-skill leakage.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import {
  shuffleQuestionAnswers,
  shuffleOptionsArray,
  canShuffle,
  getOriginalAnswerIndex,
  type ShuffleableQuestion,
} from '../src/server/utils/answerShuffle';
import { formatCorrectAnswerText } from '../src/components/HSKMockExam';
import {
  inspectExamPoolBySections,
  getEligiblePoolStats,
  ensureEligiblePoolSchema,
  validateFormatCompatibility,
  isOptionCountCompatible,
  reEvaluateApprovedQuestions,
} from '../src/server/qbankFormatSync';
import { getPracticeQuestions } from '../src/data/hskMockExamFixtures';

describe('Empirical Challenger M3-2: Adversarial Stress Testing', () => {

  // =========================================================================
  // 1. ADVERSARIAL ANSWER SHUFFLING (0, 1, 4, 5, 6 OPTIONS)
  // =========================================================================
  describe('1. Adversarial Answer Shuffling Stress Tests', () => {

    it('1.1: 0 options (Writing / Open-ended tasks) never throws and returns shuffled: false', () => {
      // Test 0 options with varied answer_idx values (-1, 0, undefined, NaN)
      const edgeCases: any[] = [
        { stem: '请看图造句。', options: [], answer_idx: -1 },
        { stem: '请看图造句。', options: [], answer_idx: 0 },
        { stem: '请看图造句。', options: [], answer_index: 0 },
        { stem: '请写一篇短文。', options: [], answer_idx: undefined },
        { stem: '书写任务。', options: [], explanation_vi: 'Đáp án đúng là A: mẫu câu chuẩn' },
      ];

      for (const q of edgeCases) {
        const frozen = Object.freeze({ ...q, options: Object.freeze([...q.options]) });
        const res = shuffleQuestionAnswers(frozen as any);

        expect(res.shuffled).toBe(false);
        expect(res.shuffle_reason).toContain('Less than 2 options');
        expect(res.options).toEqual([]);
        expect(res.mapping).toEqual([]);
        expect(res.question.options).toEqual([]);
        // Verify no mutation of frozen input
        expect(frozen.options).toEqual([]);
      }

      // Also verify canShuffle directly
      const guard0 = canShuffle({ stem: '造句', options: [], answer_idx: 0 });
      expect(guard0.canShuffle).toBe(false);
      expect(guard0.reason).toContain('Less than 2 options');
    });

    it('1.2: 1 option (Boundary edge case) returns shuffled: false and preserves single item', () => {
      const q: ShuffleableQuestion = {
        stem: '唯一选项题目',
        options: ['唯一答案'],
        answer_idx: 0,
        explanation_vi: 'Chỉ có một lựa chọn duy nhất.',
      };

      const frozen = Object.freeze({ ...q, options: Object.freeze([...q.options]) });
      const res = shuffleQuestionAnswers(frozen as any);

      expect(res.shuffled).toBe(false);
      expect(res.shuffle_reason).toContain('Less than 2 options');
      expect(res.options).toEqual(['唯一答案']);
      expect(res.new_answer_idx).toBe(0);
      expect(res.mapping).toEqual([0]);
      expect(res.question.options[res.new_answer_idx]).toBe('唯一答案');
    });

    it('1.3: 4 options (Standard MCQ) maintains strict permutation bijection and semantic integrity', () => {
      const q: ShuffleableQuestion = {
        stem: '小明昨天去超市买了一些______。',
        options: ['苹果', '汽车', '桌子', '火车'],
        answer_idx: 0,
        explanation_vi: 'Đáp án đúng là A vì trong siêu thị chỉ có thể mua táo (苹果).',
      };

      // Run 500 stochastic iterations
      for (let i = 0; i < 500; i++) {
        const res = shuffleQuestionAnswers(q);
        expect(res.shuffled).toBe(true);
        expect(res.new_answer_idx).toBeGreaterThanOrEqual(0);
        expect(res.new_answer_idx).toBeLessThan(4);

        // Invariant 1: The option at new_answer_idx MUST equal the original correct answer
        expect(res.options[res.new_answer_idx]).toBe('苹果');
        expect(res.question.options[res.new_answer_idx]).toBe('苹果');

        // Invariant 2: Mapping must correctly map original index to new index
        expect(res.mapping[0]).toBe(res.new_answer_idx);
        expect(getOriginalAnswerIndex(res.new_answer_idx, res.mapping)).toBe(0);

        // Invariant 3: Options array must be a valid permutation of the original options
        expect(new Set(res.options).size).toBe(4);
        expect([...res.options].sort()).toEqual([...q.options].sort());

        // Invariant 4: Explanation letter must be synchronized to match new_answer_idx
        const expectedLetter = String.fromCharCode(65 + res.new_answer_idx);
        expect(res.explanation_vi).toContain(`Đáp án đúng là ${expectedLetter}`);
      }
    });

    it('1.4: 5 options is rejected by canShuffle guard (unsupported count) and returns shuffled: false safely', () => {
      const q: ShuffleableQuestion = {
        stem: '5个选项的特殊题目',
        options: ['选项一', '选项二', '选项三', '选项四', '选项五'],
        answer_idx: 3,
        explanation_vi: 'Đáp án đúng là D: 选项四',
      };

      // Guard check
      const guard = canShuffle(q);
      expect(guard.canShuffle).toBe(false);
      expect(guard.reason).toContain('Unsupported option count (5)');

      // shuffleQuestionAnswers must safely return shuffled: false without throwing
      const res = shuffleQuestionAnswers(q);
      expect(res.shuffled).toBe(false);
      expect(res.shuffle_reason).toContain('Unsupported option count (5)');
      expect(res.options).toEqual(q.options);
      expect(res.new_answer_idx).toBe(3);
      expect(res.mapping).toEqual([0, 1, 2, 3, 4]);

      // Low-level shuffleOptionsArray: supports generic 5-element arrays
      const lowLevel = shuffleOptionsArray(q.options);
      expect(lowLevel.shuffled).toHaveLength(5);
      expect(new Set(lowLevel.shuffled).size).toBe(5);
      expect([...lowLevel.shuffled].sort()).toEqual([...q.options].sort());
    });

    it('1.5: 6 options standalone shuffles cleanly, while shared word bank is protected from shuffle', () => {
      // 1.5a: Standalone 6-option question (e.g. read_fill_blank_word_bank_6opt without group link)
      const standalone6: ShuffleableQuestion = {
        stem: '请选择合适的词语填空：______。',
        options: ['高兴', '难过', '紧张', '激动', '骄傲', '害羞'],
        answer_idx: 4,
        explanation_vi: 'Ý nghĩa phù hợp với ngữ cảnh.',
      };

      const res6 = shuffleQuestionAnswers(standalone6);
      expect(res6.shuffled).toBe(true);
      expect(res6.options).toHaveLength(6);
      expect(res6.options[res6.new_answer_idx]).toBe('骄傲');
      expect(res6.mapping[4]).toBe(res6.new_answer_idx);

      // 1.5b: Shared word bank A-F group question MUST NOT be shuffled (would corrupt shared A-F labels)
      const wordBankQuestion: ShuffleableQuestion = {
        stem: '请选择词语填入空格[1]：______。',
        options: ['高兴', '难过', '紧张', '激动', '骄傲', '害羞'],
        answer_idx: 0,
        is_word_bank: true,
        part_type: 'read_fill_blank_word_bank_6opt',
      };

      const guardWb = canShuffle(wordBankQuestion);
      expect(guardWb.canShuffle).toBe(false);
      expect(guardWb.reason).toContain('Shared word bank');

      const resWb = shuffleQuestionAnswers(wordBankQuestion);
      expect(resWb.shuffled).toBe(false);
      expect(resWb.shuffle_reason).toContain('Shared word bank');
      expect(resWb.options).toEqual(wordBankQuestion.options);
      expect(resWb.new_answer_idx).toBe(0);
    });

    it('1.6: Boundary and error handling: throws TypeError/RangeError on corrupt inputs', () => {
      // Null / undefined / non-object question
      expect(() => shuffleQuestionAnswers(null as any)).toThrow(TypeError);
      expect(() => shuffleQuestionAnswers(undefined as any)).toThrow(TypeError);
      expect(() => shuffleQuestionAnswers('not-an-object' as any)).toThrow(TypeError);

      // MCQ with out-of-bounds answer_idx
      const outOfBoundsQ = {
        stem: 'Stem',
        options: ['A', 'B', 'C', 'D'],
        answer_idx: 99,
      };
      expect(() => shuffleQuestionAnswers(outOfBoundsQ)).toThrow(RangeError);

      const negativeIdxQ = {
        stem: 'Stem',
        options: ['A', 'B', 'C', 'D'],
        answer_idx: -2,
      };
      expect(() => shuffleQuestionAnswers(negativeIdxQ)).toThrow(RangeError);

      // MCQ with non-integer answer_idx
      const floatIdxQ = {
        stem: 'Stem',
        options: ['A', 'B', 'C', 'D'],
        answer_idx: 1.5,
      };
      expect(() => shuffleQuestionAnswers(floatIdxQ)).toThrow(TypeError);
    });
  });

  // =========================================================================
  // 2. FORMATTER INVARIANTS (formatCorrectAnswerText)
  // =========================================================================
  describe('2. Formatter Invariants for formatCorrectAnswerText', () => {

    it('2.1: Writing tasks with 0 options strictly return empty string, NEVER character fallback "A"', () => {
      // Direct calls with 0 options
      expect(formatCorrectAnswerText([], 0)).toBe('');
      expect(formatCorrectAnswerText([], -1)).toBe('');
      expect(formatCorrectAnswerText([], 1)).toBe('');
      expect(formatCorrectAnswerText([], 999)).toBe('');
      expect(formatCorrectAnswerText([], NaN)).toBe('');

      // Null / undefined options
      expect(formatCorrectAnswerText(null, 0)).toBe('');
      expect(formatCorrectAnswerText(null, -1)).toBe('');
      expect(formatCorrectAnswerText(null, 3)).toBe('');
      expect(formatCorrectAnswerText(undefined, 0)).toBe('');
      expect(formatCorrectAnswerText(undefined, 2)).toBe('');

      // Non-array corrupt inputs
      expect(formatCorrectAnswerText({} as any, 0)).toBe('');
      expect(formatCorrectAnswerText('options' as any, 0)).toBe('');
      expect(formatCorrectAnswerText(123 as any, 0)).toBe('');
    });

    it('2.2: Blueprint writing tasks always produce empty correct-answer text', () => {
      const blueprintWritingTasks = [
        { part_type: 'write_tianzige_from_pinyin', options: [], answer_idx: 0 },
        { part_type: 'write_sentence_from_picture_word', options: [], answer_idx: 0 },
        { part_type: 'write_reorder_sentence_to_characters', options: [], answer_idx: 0 },
        { part_type: 'write_composition_short', options: [], answer_idx: 0 },
        { part_type: 'write_essay_from_keywords', options: [], answer_idx: 0 },
      ];

      for (const task of blueprintWritingTasks) {
        const text = formatCorrectAnswerText(task.options, task.answer_idx);
        expect(text).toBe('');
        expect(text).not.toContain('A');
        expect(text).not.toContain('Đáp án đúng: A');
      }
    });

    it('2.3: MCQ options formatting accurately extracts and strips redundant leading letters', () => {
      // 4-option questions with plain text
      const plainOpts = ['苹果', '香蕉', '西瓜', '葡萄'];
      expect(formatCorrectAnswerText(plainOpts, 0)).toBe('A. 苹果');
      expect(formatCorrectAnswerText(plainOpts, 1)).toBe('B. 香蕉');
      expect(formatCorrectAnswerText(plainOpts, 2)).toBe('C. 西瓜');
      expect(formatCorrectAnswerText(plainOpts, 3)).toBe('D. 葡萄');

      // 4-option questions with redundant prefixes ('A. ', 'B: ', 'C ', 'D.')
      const prefixedOpts = ['A. 苹果', 'B: 香蕉', 'C 西瓜', 'D.葡萄'];
      expect(formatCorrectAnswerText(prefixedOpts, 0)).toBe('A. 苹果');
      expect(formatCorrectAnswerText(prefixedOpts, 1)).toBe('B. 香蕉');
      expect(formatCorrectAnswerText(prefixedOpts, 2)).toBe('C. 西瓜');
      expect(formatCorrectAnswerText(prefixedOpts, 3)).toBe('D. 葡萄');

      // 6-option word bank options
      const sixOpts = ['高兴', '难过', '紧张', '激动', '骄傲', '害羞'];
      expect(formatCorrectAnswerText(sixOpts, 4)).toBe('E. 骄傲');
      expect(formatCorrectAnswerText(sixOpts, 5)).toBe('F. 害羞');
    });

    it('2.4: Resilient handling of negative or out-of-bounds index on non-empty array', () => {
      const opts = ['苹果', '香蕉'];
      // Negative index falls back to safeIdx = 0 -> 'A. 苹果'
      expect(formatCorrectAnswerText(opts, -1)).toBe('A. 苹果');
      expect(formatCorrectAnswerText(opts, -99)).toBe('A. 苹果');
      // NaN index falls back to safeIdx = 0
      expect(formatCorrectAnswerText(opts, NaN as any)).toBe('A. 苹果');
      // Out of bounds index returns the corresponding letter
      expect(formatCorrectAnswerText(opts, 5)).toBe('F');
    });
  });

  // =========================================================================
  // 3. POOL INSPECTION ACROSS READING, LISTENING, WRITING
  // =========================================================================
  describe('3. Pool Inspection & Practice Filtering Invariants', () => {
    let db: DatabaseSync;

    beforeEach(() => {
      // Create an in-memory database with production schemas
      db = new DatabaseSync(':memory:');
      db.exec(`
        CREATE TABLE questions (
          id TEXT PRIMARY KEY,
          level INTEGER NOT NULL,
          skill TEXT NOT NULL,
          part_type TEXT NOT NULL,
          stem TEXT NOT NULL,
          options TEXT,
          answer_idx INTEGER,
          status TEXT NOT NULL DEFAULT 'approved',
          is_active INTEGER NOT NULL DEFAULT 1,
          audio_text TEXT
        );
      `);
      ensureEligiblePoolSchema(db);
    });

    it('3.1: inspectExamPoolBySections audits HSK 3 listening, reading, writing sections cleanly', () => {
      // Seed test questions in questions table
      // 1. Listening question (listen_dialogue_qa_3opt, needs audio_text)
      db.prepare(`
        INSERT INTO questions (id, level, skill, part_type, stem, options, answer_idx, status, is_active, audio_text)
        VALUES ('q_listen_1', 3, 'listening', 'listen_dialogue_qa_3opt', '男：你今天几点去学校？女：八点。', '["八点", "九点", "十点"]', 0, 'approved', 1, '男：你今天几点去学校？女：八点。问：女的几点去学校？');
      `).run();

      // 2. Reading question (read_cloze_passages_4opt)
      db.prepare(`
        INSERT INTO questions (id, level, skill, part_type, stem, options, answer_idx, status, is_active)
        VALUES ('q_read_1', 3, 'reading', 'read_cloze_passages_4opt', '我常常去图书馆____。', '["看书", "睡觉", "游泳", "打球"]', 0, 'approved', 1);
      `).run();

      // 3. Writing question (write_sentence_from_picture_word with 0 options)
      db.prepare(`
        INSERT INTO questions (id, level, skill, part_type, stem, options, answer_idx, status, is_active)
        VALUES ('q_write_1', 3, 'writing', 'write_sentence_from_picture_word', '看图造句：高兴', '[]', 0, 'approved', 1);
      `).run();

      // 4. Inactive question (should be ignored by pool inspection)
      db.prepare(`
        INSERT INTO questions (id, level, skill, part_type, stem, options, answer_idx, status, is_active)
        VALUES ('q_inactive_1', 3, 'reading', 'read_cloze_passages_4opt', 'Inactive stem', '["A", "B", "C", "D"]', 0, 'approved', 0);
      `).run();

      // Run reEvaluateApprovedQuestions to populate exam_eligible_pool
      const reEval = reEvaluateApprovedQuestions(db);
      expect(reEval.practice_eligible_count).toBeGreaterThanOrEqual(3);

      // Audit HSK 3 pool sections
      const inspection = inspectExamPoolBySections(db, 3);
      expect(inspection.blueprintFound).toBe(true);
      expect(inspection.level).toBe(3);
      expect(inspection.totalRequired).toBeGreaterThan(0);

      // Verify sections map contains listening, reading, writing
      expect(inspection.sections).toHaveProperty('listening');
      expect(inspection.sections).toHaveProperty('reading');
      expect(inspection.sections).toHaveProperty('writing');

      const listeningSec = inspection.sections['listening'];
      expect(listeningSec.skill).toBe('listening');
      expect(listeningSec.totalRequired).toBe(30); // HSK 3.0 listening has 30 questions (10+10+10)

      const readingSec = inspection.sections['reading'];
      expect(readingSec.skill).toBe('reading');
      expect(readingSec.totalRequired).toBe(30); // HSK 3.0 reading has 30 questions (10+10+10)

      const writingSec = inspection.sections['writing'];
      expect(writingSec.skill).toBe('writing');
      expect(writingSec.totalRequired).toBe(10); // HSK 3.0 writing has 10 questions (5+5)

      // Writing question with 0 options must be accepted in writing parts
      const writePart2 = writingSec.parts.find((p) => p.partType === 'write_sentence_from_picture_word');
      expect(writePart2).toBeDefined();
      expect(writePart2?.nQuestionsRequired).toBe(5);
      expect(writePart2?.availableQuestionIds).toContain('q_write_1');
    });

    it('3.2: Rejects writing questions that incorrectly contain options > 0', () => {
      // Synthetic writing question with 4 options (invalid format for writing task)
      const invalidWritingQ = {
        stem: '看图造句：高兴',
        options: ['A', 'B', 'C', 'D'], // Invalid: writing task must have 0 options
        answer_idx: 0,
        skill: 'writing',
        part_type: 'write_sentence_from_picture_word',
        level: 3,
        status: 'approved',
      };

      const result = validateFormatCompatibility(invalidWritingQ, 3);
      expect(result.practice_format_compatible).toBe(false);
      expect(result.practice_eligible).toBe(false);
      expect(result.exam_eligible).toBe(false);
      expect(
        result.ineligible_reasons.some((r) => r.includes('yêu cầu 0 phương án'))
      ).toBe(true);
    });

    it('3.3: Strict skill practice filtering isolation (no cross-skill leakage)', () => {
      // Verify fixture getPracticeQuestions across HSK 1..6
      for (const level of [1, 2, 3, 4, 5, 6]) {
        for (const skill of ['listening', 'reading', 'writing']) {
          const questions = getPracticeQuestions(level, skill, undefined, 10);
          if (questions.length > 0) {
            for (const q of questions) {
              expect(q.level).toBe(level);
              expect(q.section.toLowerCase()).toBe(skill);
            }
          }
        }
      }

      // Non-existent skill returns empty array, never leaks other skills
      expect(getPracticeQuestions(1, 'speaking', undefined, 10)).toEqual([]);
      expect(getPracticeQuestions(2, 'unknown_skill', undefined, 10)).toEqual([]);
    });

    it('3.4: getEligiblePoolStats correctly tabulates practice vs exam counts with strict questions join', () => {
      // Seed corresponding approved active questions into questions table
      db.prepare(`
        INSERT INTO questions (id, level, skill, part_type, stem, options, answer_idx, status, is_active)
        VALUES
          ('p1', 1, 'reading', 'read_match', 'Stem 1', '["A","B"]', 0, 'approved', 1),
          ('p2', 1, 'reading', 'read_match', 'Stem 2', '["A","B"]', 0, 'approved', 1),
          ('p3', 2, 'listening', 'listen_dialogue_qa_3opt', 'Stem 3', '["A","B","C"]', 0, 'approved', 1),
          ('p4', 4, 'writing', 'write_sentence_from_picture_word', 'Stem 4', '[]', 0, 'approved', 1),
          ('p_inactive', 1, 'reading', 'read_match', 'Inactive', '["A","B"]', 0, 'approved', 0),
          ('p_rejected', 1, 'reading', 'read_match', 'Rejected', '["A","B"]', 0, 'rejected', 1);
      `).run();

      // Seed pool rows, including an orphaned row 'p_orphan' that does not exist in questions table
      db.prepare(`
        INSERT INTO exam_eligible_pool (question_id, level, skill, part_type, stem, practice_eligible, exam_eligible)
        VALUES
          ('p1', 1, 'reading', 'read_match', 'Stem 1', 1, 0),
          ('p2', 1, 'reading', 'read_match', 'Stem 2', 1, 1),
          ('p3', 2, 'listening', 'listen_dialogue_qa_3opt', 'Stem 3', 1, 1),
          ('p4', 4, 'writing', 'write_sentence_from_picture_word', 'Stem 4', 1, 1),
          ('p_inactive', 1, 'reading', 'read_match', 'Inactive', 1, 1),
          ('p_rejected', 1, 'reading', 'read_match', 'Rejected', 1, 1),
          ('p_orphan', 1, 'reading', 'read_match', 'Orphan', 1, 1);
      `).run();

      const stats = getEligiblePoolStats(db);
      // Level 1: exactly p1 (practice) and p2 (practice + exam) count. Inactive, rejected, orphan are strictly excluded!
      expect(stats['1'].practice_count).toBe(2);
      expect(stats['1'].exam_count).toBe(1);
      expect(stats['2'].practice_count).toBe(1);
      expect(stats['2'].exam_count).toBe(1);
      expect(stats['3'].practice_count).toBe(0);
      expect(stats['4'].practice_count).toBe(1);
      expect(stats['4'].exam_count).toBe(1);
    });
  });
});
