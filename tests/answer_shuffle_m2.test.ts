/**
 * tests/answer_shuffle_m2.test.ts
 *
 * Comprehensive Unit Test Suite for Milestone M2:
 * Feature Flag & Comprehensive canShuffle() Policy Implementation.
 *
 * Requirements Covered:
 * 1. Feature Flag helper: isServingAnswerShuffleEnabled() with strict parsing.
 * 2. Dual-Field compatibility: ShuffleableQuestion with answer_idx and answer_index.
 * 3. canShuffle() predicate across all 5 explanation categories, option counts, fixed types, and groups.
 * 4. Integration into shuffleQuestionAnswers() with conservative fallback (shuffled: false).
 * 5. Purity, immutability, and database safety invariants.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  isServingAnswerShuffleEnabled,
  canShuffle,
  shuffleQuestionAnswers,
  type ShuffleableQuestion,
  type CanShuffleResult,
} from '../src/server/utils/answerShuffle';

describe('Milestone M2: Feature Flag & canShuffle Policy Suite', () => {
  // =========================================================================
  // 1. Feature Flag Helper: isServingAnswerShuffleEnabled()
  // =========================================================================
  describe('1. Feature Flag: isServingAnswerShuffleEnabled()', () => {
    const originalEnv = process.env.ENABLE_SERVING_ANSWER_SHUFFLE;

    afterEach(() => {
      if (originalEnv !== undefined) {
        process.env.ENABLE_SERVING_ANSWER_SHUFFLE = originalEnv;
      } else {
        delete process.env.ENABLE_SERVING_ANSWER_SHUFFLE;
      }
    });

    it('defaults to false when environment variable is undefined', () => {
      delete process.env.ENABLE_SERVING_ANSWER_SHUFFLE;
      expect(isServingAnswerShuffleEnabled()).toBe(false);
    });

    it('evaluates to false for empty or whitespace-only strings', () => {
      process.env.ENABLE_SERVING_ANSWER_SHUFFLE = '';
      expect(isServingAnswerShuffleEnabled()).toBe(false);

      process.env.ENABLE_SERVING_ANSWER_SHUFFLE = '   ';
      expect(isServingAnswerShuffleEnabled()).toBe(false);
    });

    it('evaluates to false for "false", "0", "1", "yes", "no"', () => {
      const falsyValues = ['false', '0', '1', 'yes', 'no', 'off', 'disabled'];
      for (const val of falsyValues) {
        process.env.ENABLE_SERVING_ANSWER_SHUFFLE = val;
        expect(isServingAnswerShuffleEnabled()).toBe(false);
      }
    });

    it('evaluates to false for uppercase or mixed-case "TRUE", "True"', () => {
      process.env.ENABLE_SERVING_ANSWER_SHUFFLE = 'TRUE';
      expect(isServingAnswerShuffleEnabled()).toBe(false);

      process.env.ENABLE_SERVING_ANSWER_SHUFFLE = 'True';
      expect(isServingAnswerShuffleEnabled()).toBe(false);
    });

    it('ONLY evaluates to true when strictly set to "true" (with optional whitespace trimming)', () => {
      process.env.ENABLE_SERVING_ANSWER_SHUFFLE = 'true';
      expect(isServingAnswerShuffleEnabled()).toBe(true);

      process.env.ENABLE_SERVING_ANSWER_SHUFFLE = '  true  ';
      expect(isServingAnswerShuffleEnabled()).toBe(true);
    });
  });

  // =========================================================================
  // 2. Dual-Field Compatibility in ShuffleableQuestion & shuffleQuestionAnswers
  // =========================================================================
  describe('2. Dual-Field Compatibility (answer_idx & answer_index)', () => {
    const options = ['Option 0', 'Option 1', 'Option 2', 'Option 3'];

    it('correctly shuffles question with only answer_idx', () => {
      const q: ShuffleableQuestion = {
        stem: 'Question with answer_idx only',
        options: [...options],
        answer_idx: 1,
      };

      const res = shuffleQuestionAnswers(q);
      expect(res.shuffled).toBe(true);
      expect(res.original_answer_idx).toBe(1);
      expect(res.question.answer_idx).toBe(res.new_answer_idx);
      expect(res.question.answer_index).toBe(res.new_answer_idx);
      expect(res.question.options[res.new_answer_idx]).toBe('Option 1');
    });

    it('correctly shuffles question with only answer_index', () => {
      const q: ShuffleableQuestion = {
        stem: 'Question with answer_index only',
        options: [...options],
        answer_index: 2,
      };

      const res = shuffleQuestionAnswers(q);
      expect(res.shuffled).toBe(true);
      expect(res.original_answer_idx).toBe(2);
      expect(res.question.answer_idx).toBe(res.new_answer_idx);
      expect(res.question.answer_index).toBe(res.new_answer_idx);
      expect(res.question.options[res.new_answer_idx]).toBe('Option 2');
    });

    it('correctly synchronizes both fields when both are provided and consistent', () => {
      const q: ShuffleableQuestion = {
        stem: 'Question with both fields',
        options: [...options],
        answer_idx: 3,
        answer_index: 3,
      };

      const res = shuffleQuestionAnswers(q);
      expect(res.shuffled).toBe(true);
      expect(res.original_answer_idx).toBe(3);
      expect(res.question.answer_idx).toBe(res.new_answer_idx);
      expect(res.question.answer_index).toBe(res.new_answer_idx);
      expect(res.question.options[res.new_answer_idx]).toBe('Option 3');
    });

    it('never defaults to 0 when both answer_idx and answer_index are missing or invalid', () => {
      const qMissing: ShuffleableQuestion = {
        stem: 'Question without any answer index',
        options: [...options],
      };

      expect(() => shuffleQuestionAnswers(qMissing)).toThrow(TypeError);

      const qInvalid: ShuffleableQuestion = {
        stem: 'Question with non-numeric indices',
        options: [...options],
        answer_idx: '1' as any,
        answer_index: '1' as any,
      };

      expect(() => shuffleQuestionAnswers(qInvalid)).toThrow(TypeError);
    });
  });

  // =========================================================================
  // 3. canShuffle(): Option Counts & Input Validation
  // =========================================================================
  describe('3. canShuffle(): Option Count & Type Validation', () => {
    it('rejects invalid or non-object questions with category 5', () => {
      expect(canShuffle(null)).toEqual({
        canShuffle: false,
        category: 5,
        reason: 'Question is not a valid object',
      });
      expect(canShuffle(undefined)).toEqual({
        canShuffle: false,
        category: 5,
        reason: 'Question is not a valid object',
      });
      expect(canShuffle('question_string')).toEqual({
        canShuffle: false,
        category: 5,
        reason: 'Question is not a valid object',
      });
    });

    it('rejects question with fewer than 2 options (writing / open-ended)', () => {
      const q0 = { options: [], answer_idx: 0 };
      expect(canShuffle(q0).canShuffle).toBe(false);
      expect(canShuffle(q0).category).toBe(5);

      const q1 = { options: ['Single'], answer_idx: 0 };
      expect(canShuffle(q1).canShuffle).toBe(false);
      expect(canShuffle(q1).category).toBe(5);
    });

    it('accepts 3-option questions and rejects questions with unsupported counts (e.g. 5, 7, 8)', () => {
      const q3 = { options: ['A', 'B', 'C'], answer_idx: 0 };
      const res3 = canShuffle(q3);
      expect(res3.canShuffle).toBe(true);

      const q5 = { options: ['A', 'B', 'C', 'D', 'E'], answer_idx: 0 };
      const res5 = canShuffle(q5);
      expect(res5.canShuffle).toBe(false);
      expect(res5.category).toBe(5);
      expect(res5.reason).toContain('Unsupported option count');

      const q7 = { options: ['A', 'B', 'C', 'D', 'E', 'F', 'G'], answer_idx: 0 };
      const res7 = canShuffle(q7);
      expect(res7.canShuffle).toBe(false);
      expect(res7.category).toBe(5);
    });

    it('accepts standard 2, 3, 4, and 6 option questions when no restrictions apply', () => {
      const q2 = { options: ['Choice 1', 'Choice 2'], answer_idx: 0 };
      expect(canShuffle(q2).canShuffle).toBe(true);

      const q3 = { options: ['Choice 1', 'Choice 2', 'Choice 3'], answer_idx: 1 };
      expect(canShuffle(q3).canShuffle).toBe(true);

      const q4 = { options: ['A', 'B', 'C', 'D'], answer_idx: 1 };
      expect(canShuffle(q4).canShuffle).toBe(true);

      const q6 = { options: ['A', 'B', 'C', 'D', 'E', 'F'], answer_idx: 5 };
      expect(canShuffle(q6).canShuffle).toBe(true);
    });

    it('rejects negative, out-of-bounds, or non-integer answer indices', () => {
      const qNeg = { options: ['A', 'B', 'C', 'D'], answer_idx: -1 };
      expect(canShuffle(qNeg)).toEqual({
        canShuffle: false,
        category: 5,
        reason: 'Invalid answer index',
      });

      const qOverflow = { options: ['A', 'B', 'C', 'D'], answer_idx: 4 };
      expect(canShuffle(qOverflow)).toEqual({
        canShuffle: false,
        category: 5,
        reason: 'Invalid answer index',
      });

      const qFloat = { options: ['A', 'B', 'C', 'D'], answer_idx: 1.5 };
      expect(canShuffle(qFloat)).toEqual({
        canShuffle: false,
        category: 5,
        reason: 'Invalid answer index',
      });

      const qNaN = { options: ['A', 'B', 'C', 'D'], answer_idx: NaN };
      expect(canShuffle(qNaN)).toEqual({
        canShuffle: false,
        category: 5,
        reason: 'Invalid answer index',
      });
    });
  });

  // =========================================================================
  // 4. canShuffle(): Fixed Structure & Group Rejections
  // =========================================================================
  describe('4. canShuffle(): Fixed Structure & Group Rejections', () => {
    it('rejects fixed-order True/False questions with ["对", "错"]', () => {
      const qTF1 = {
        stem: '飞机比火车快。',
        options: ['对', '错'],
        answer_idx: 0,
      };
      const res = canShuffle(qTF1);
      expect(res.canShuffle).toBe(false);
      expect(res.category).toBe(5);
      expect(res.reason).toBe('Fixed order True/False question');
    });

    it('rejects fixed-order True/False questions with ["正确", "错误"]', () => {
      const qTF2 = {
        stem: '今天天气很好。',
        options: ['正确', '错误'],
        answer_idx: 1,
      };
      const res = canShuffle(qTF2);
      expect(res.canShuffle).toBe(false);
      expect(res.category).toBe(5);
      expect(res.reason).toBe('Fixed order True/False question');
    });

    it('rejects sentence reordering question types', () => {
      const qReorder1 = {
        stem: 'Sắp xếp câu:',
        options: ['去', '我想', '北京', '明天'],
        answer_idx: 0,
        part_type: 'read_reorder_sentence',
      };
      const res1 = canShuffle(qReorder1);
      expect(res1.canShuffle).toBe(false);
      expect(res1.category).toBe(5);
      expect(res1.reason).toBe('Fixed order question type');

      const qReorder2 = {
        stem: 'Reorder words',
        options: ['w1', 'w2', 'w3', 'w4'],
        answer_idx: 0,
        task_type: 'sentence_reorder',
      };
      const res2 = canShuffle(qReorder2);
      expect(res2.canShuffle).toBe(false);
      expect(res2.category).toBe(5);
    });

    it('rejects judge/tf part_type questions', () => {
      const qJudge = {
        options: ['Option 1', 'Option 2'],
        answer_idx: 0,
        part_type: 'listen_judge_true_false',
      };
      const res = canShuffle(qJudge);
      expect(res.canShuffle).toBe(false);
      expect(res.category).toBe(5);
      expect(res.reason).toBe('Fixed order question type');
    });

    it('rejects shared word bank A-F questions across multiple indicator fields', () => {
      const qWb1 = {
        options: ['A', 'B', 'C', 'D', 'E', 'F'],
        answer_idx: 0,
        is_word_bank: true,
      };
      expect(canShuffle(qWb1)).toEqual({
        canShuffle: false,
        category: 5,
        reason: 'Shared word bank A-F group',
      });

      const qWb2 = {
        options: ['A', 'B', 'C', 'D', 'E', 'F'],
        answer_idx: 0,
        shared_word_bank: true,
      };
      expect(canShuffle(qWb2)).toEqual({
        canShuffle: false,
        category: 5,
        reason: 'Shared word bank A-F group',
      });

      const qWb3 = {
        options: ['A', 'B', 'C', 'D', 'E', 'F'],
        answer_idx: 0,
        part_type: 'read_fill_blank_word_bank',
      };
      expect(canShuffle(qWb3)).toEqual({
        canShuffle: false,
        category: 5,
        reason: 'Shared word bank A-F group',
      });

      const qWb4 = {
        options: ['A', 'B', 'C', 'D', 'E', 'F'],
        answer_idx: 0,
        group_id: 'group_hsk1_word_bank_01',
      };
      expect(canShuffle(qWb4)).toEqual({
        canShuffle: false,
        category: 5,
        reason: 'Shared word bank A-F group',
      });
    });

    it('rejects shared passage questions where options cannot be independently shuffled', () => {
      const qPassage1 = {
        options: ['A', 'B', 'C', 'D'],
        answer_idx: 0,
        is_shared_passage_group: true,
      };
      expect(canShuffle(qPassage1)).toEqual({
        canShuffle: false,
        category: 5,
        reason: 'Shared group restriction',
      });

      const qPassage2 = {
        options: ['A', 'B', 'C', 'D'],
        answer_idx: 0,
        group_id: 'passage_hsk5_reading_02',
      };
      expect(canShuffle(qPassage2)).toEqual({
        canShuffle: false,
        category: 5,
        reason: 'Shared group restriction',
      });
    });
  });

  // =========================================================================
  // 5. canShuffle(): 5-Category Linguistic Explanation Classification
  // =========================================================================
  describe('5. canShuffle(): 5-Category Linguistic Analysis', () => {
    const baseMCQ = {
      stem: '北京是中国的______。',
      options: ['首都', '省会', '城市', '国家'],
      answer_idx: 0, // Option A
    };

    // Category 1
    it('classifies missing or empty explanation as Category 1 (safe)', () => {
      const qNoExpl = { ...baseMCQ, explanation_vi: undefined };
      const res1 = canShuffle(qNoExpl);
      expect(res1.canShuffle).toBe(true);
      expect(res1.category).toBe(1);

      const qEmpty = { ...baseMCQ, explanation_vi: '   ' };
      const res2 = canShuffle(qEmpty);
      expect(res2.canShuffle).toBe(true);
      expect(res2.category).toBe(1);
    });

    it('classifies pure semantic explanation as Category 1 (safe)', () => {
      const qSemantic = {
        ...baseMCQ,
        explanation_vi: '首都 có nghĩa là thủ đô, phù hợp nhất với vị trí địa lý và hành chính của Bắc Kinh.',
      };
      const res = canShuffle(qSemantic);
      expect(res.canShuffle).toBe(true);
      expect(res.category).toBe(1);
      expect(res.reason).toBe('Group 1: Semantic explanation without letter references');
    });

    it('classifies explanation with Vietnamese accented words (Cà phê, Bác sĩ) as Category 1 (safe)', () => {
      const qVietWords = {
        ...baseMCQ,
        explanation_vi: 'Bác sĩ thường uống cà phê vào buổi sáng để tỉnh táo, không liên quan đến ngữ nghĩa câu này.',
      };
      const res = canShuffle(qVietWords);
      expect(res.canShuffle).toBe(true);
      expect(res.category).toBe(1);
    });

    // Category 2
    it('classifies standard affirmative single-letter explanation as Category 2 (safe letter sync)', () => {
      const affirmativeExplanations = [
        'Đáp án đúng là A: 首都 nghĩa là thủ đô.',
        'Chọn đáp án A vì mang nghĩa chính xác.',
        'Phương án đúng là A.',
        'A là đáp án đúng.',
        'Đáp án: A',
        'Chọn A vì phù hợp với ngữ cảnh.',
      ];

      for (const expl of affirmativeExplanations) {
        const q = { ...baseMCQ, explanation_vi: expl };
        const res = canShuffle(q);
        expect(res.canShuffle).toBe(true);
        expect(res.category).toBe(2);
        expect(res.reason).toBe('Group 2: Standard affirmative pattern -> safe letter sync');
      }
    });

    // Category 3
    it('classifies multi-distractor explanation breakdown as Category 3 (forbid shuffle)', () => {
      const qMulti = {
        ...baseMCQ,
        explanation_vi: 'Đáp án đúng là A. Các phương án B (tỉnh lỵ) và C (thành phố) không chính xác.',
      };
      const res = canShuffle(qMulti);
      expect(res.canShuffle).toBe(false);
      expect(res.category).toBe(3);
      expect(res.reason).toContain('Group 3: Multi-distractor explanation');
    });

    // Category 4
    it('classifies negation or elimination phrasing as Category 4 (forbid shuffle)', () => {
      const negationExplanations = [
        'Không nên chọn A vì ngữ cảnh yêu cầu địa điểm.',
        'Loại trừ A vì đây là danh từ số nhiều.',
        'Tránh chọn A vì sai ngữ pháp.',
        'Chẳng nên chọn A.',
        'Chọn A là sai lầm.',
      ];

      for (const expl of negationExplanations) {
        const q = { ...baseMCQ, explanation_vi: expl };
        const res = canShuffle(q);
        expect(res.canShuffle).toBe(false);
        expect(res.category).toBe(4);
        expect(res.reason).toBe('Group 4: Explanation contains negation/elimination');
      }
    });

    // Category 5
    it('classifies single-letter reference mismatching correct answer as Category 5 (forbid shuffle)', () => {
      // answer_idx is 0 ('A'), but explanation explicitly designates 'B'
      const qMismatch = {
        ...baseMCQ,
        answer_idx: 0,
        explanation_vi: 'Đáp án đúng là B vì đây là động từ.',
      };
      const res = canShuffle(qMismatch);
      expect(res.canShuffle).toBe(false);
      expect(res.category).toBe(5);
      expect(res.reason).toContain('does not match correct answer');
    });

    it('classifies ambiguous explanation structure as Category 5 (forbid shuffle)', () => {
      // Explanations that contain isolated letter 'A' but don't follow affirmative patterns
      const qAmbiguous = {
        ...baseMCQ,
        explanation_vi: 'Phương án A có thể cần lưu ý khi áp dụng trong văn phong cổ.',
      };
      const res = canShuffle(qAmbiguous);
      expect(res.canShuffle).toBe(false);
      expect(res.category).toBe(5);
      expect(res.reason).toContain('Ambiguous explanation structure');
    });
  });

  // =========================================================================
  // 6. Integration into shuffleQuestionAnswers(): Fallback & Execution
  // =========================================================================
  describe('6. Integration into shuffleQuestionAnswers()', () => {
    it('safely falls back with shuffled: false and populates shuffle_reason when canShuffle fails', () => {
      const qForbidden: ShuffleableQuestion = {
        stem: '飞机比火车快。',
        options: ['对', '错'],
        answer_idx: 0,
      };

      const res = shuffleQuestionAnswers(qForbidden);
      expect(res.shuffled).toBe(false);
      expect(res.shuffle_reason).toBe('Fixed order True/False question');
      expect(res.question.options).toEqual(['对', '错']);
      expect(res.new_answer_idx).toBe(0);
      expect(res.original_answer_idx).toBe(0);
    });

    it('safely preserves multi-distractor Category 3 questions with shuffled: false', () => {
      const qMultiDistractor: ShuffleableQuestion = {
        stem: '北京是中国的______。',
        options: ['首都', '省会', '城市', '国家'],
        answer_idx: 0,
        explanation_vi: 'A đúng. B sai vì là tỉnh lỵ. C sai vì chỉ thành phố nói chung.',
      };

      const res = shuffleQuestionAnswers(qMultiDistractor);
      expect(res.shuffled).toBe(false);
      expect(res.shuffle_reason).toContain('Group 3: Multi-distractor explanation');
      expect(res.question.options).toEqual(qMultiDistractor.options);
      expect(res.question.explanation_vi).toBe(qMultiDistractor.explanation_vi);
    });

    it('shuffles Category 1 questions and leaves explanation unchanged', () => {
      const qCat1: ShuffleableQuestion = {
        stem: '我想去______买书。',
        options: ['书店', '医院', '银行', '机场'],
        answer_idx: 0,
        explanation_vi: '书店 có nghĩa là hiệu sách, nơi bán sách.',
      };

      const mockRng = () => 0.0; // deterministic

      const res = shuffleQuestionAnswers(qCat1, mockRng);
      expect(res.shuffled).toBe(true);
      expect(res.question.options[res.new_answer_idx]).toBe('书店');
      expect(res.question.explanation_vi).toBe(qCat1.explanation_vi); // Unchanged!
    });

    it('shuffles Category 2 questions and synchronizes explanation letter', () => {
      const qCat2: ShuffleableQuestion = {
        stem: '我想去______买书。',
        options: ['书店', '医院', '银行', '机场'],
        answer_idx: 0,
        explanation_vi: 'Đáp án đúng là A: 书店 có nghĩa là hiệu sách.',
      };

      // Ensure index actually moves
      let moved = false;
      for (let attempt = 0; attempt < 50; attempt++) {
        const res = shuffleQuestionAnswers(qCat2);
        if (res.new_answer_idx !== 0) {
          moved = true;
          const expectedNewLetter = String.fromCharCode(65 + res.new_answer_idx);
          expect(res.question.explanation_vi).toContain(`Đáp án đúng là ${expectedNewLetter}: 书店 có nghĩa là hiệu sách.`);
          break;
        }
      }
      expect(moved).toBe(true);
    });

    it('maintains deep immutability of input question object', () => {
      const originalOptions = ['Alpha', 'Beta', 'Gamma', 'Delta'];
      const q: ShuffleableQuestion = {
        stem: 'Immutability test',
        options: [...originalOptions],
        answer_idx: 1,
        explanation_vi: 'Đáp án đúng là B.',
      };

      Object.freeze(q);
      Object.freeze(q.options);

      const res = shuffleQuestionAnswers(q);
      expect(res.shuffled).toBe(true);
      expect(q.options).toEqual(originalOptions);
      expect(q.answer_idx).toBe(1);
    });
  });
});
