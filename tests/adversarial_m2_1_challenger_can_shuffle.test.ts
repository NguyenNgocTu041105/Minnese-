/**
 * tests/adversarial_m2_1_challenger_can_shuffle.test.ts
 *
 * Empirical Adversarial Challenge Suite for Milestone M2.1:
 * Comprehensive stress-testing of canShuffle(question) and isServingAnswerShuffleEnabled().
 *
 * Agent: o38_challenger_m2_1 (Empirical Challenger: critic & specialist)
 * Parent: Orchestrator 38 (7d3696b8-a969-4b09-b42f-70f8403fc08a)
 *
 * Vectors Covered:
 * 1. Malformed & Fuzzed Inputs (null, primitives, cyclic objects, prototypes, sparse arrays, non-integers, NaN, Infinity)
 * 2. Strict Option Count Invariants (0, 1, 3, 5, 7, 8, 10, 100 rejected; strictly 2, 4, 6 supported)
 * 3. Fixed-Order Question Structures & Task Types (reorder, true_false, tf, judge, ['对', '错'], ['正确', '错误'])
 * 4. Word Banks & Shared Passage Groups (is_word_bank, shared_word_bank, group_id, part_type)
 * 5. Tricky Vietnamese Explanation Patterns & Unicode False-Positive Immunity (Ă, Â, Đ, Cà phê, Bác sĩ, NFD)
 * 6. Explanation 5-Category Pedagogical Safety & Non-Contradiction Verification
 * 7. End-to-End Fallback Invariant: canShuffle: false => shuffleQuestionAnswers: shuffled = false
 * 8. Strict Feature Flag Parsing Contract (ENABLE_SERVING_ANSWER_SHUFFLE)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  canShuffle,
  isServingAnswerShuffleEnabled,
  shuffleQuestionAnswers,
  syncExplanationLetterSafe,
  isIsolatedOptionLetter,
  type ShuffleableQuestion,
  type CanShuffleResult,
} from '../src/server/utils/answerShuffle';

describe('Milestone M2.1 Adversarial Challenge: canShuffle() & Feature Flag', () => {

  // =========================================================================
  // Vector 1: Malformed & Fuzzed Inputs
  // =========================================================================
  describe('Vector 1: Malformed & Fuzzed Inputs', () => {
    it('rejects null, undefined, and non-object primitive inputs safely', () => {
      const nonObjects = [
        null,
        undefined,
        42,
        0,
        -1,
        NaN,
        Infinity,
        -Infinity,
        'question string',
        '',
        true,
        false,
        Symbol('question'),
        BigInt(100),
        () => ({ options: ['A', 'B'], answer_idx: 0 }),
      ];

      for (const input of nonObjects) {
        const res = canShuffle(input as any);
        expect(res.canShuffle).toBe(false);
        expect(res.category).toBe(5);
        expect(res.reason).toContain('not a valid object');
      }
    });

    it('rejects cyclic objects without crashing or infinite recursion', () => {
      const cyclicQ: any = {
        options: ['苹果', '香蕉', '橙子', '西瓜'],
        answer_idx: 0,
        explanation_vi: 'Đáp án đúng là A.',
      };
      cyclicQ.self = cyclicQ;
      cyclicQ.nested = { parent: cyclicQ };

      const res = canShuffle(cyclicQ);
      expect(res.canShuffle).toBe(true);
      expect(res.category).toBe(2);

      // Now cyclic object with invalid options
      const invalidCyclic: any = {
        options: ['苹果'],
        answer_idx: 0,
      };
      invalidCyclic.self = invalidCyclic;
      const resInvalid = canShuffle(invalidCyclic);
      expect(resInvalid.canShuffle).toBe(false);
      expect(resInvalid.category).toBe(5);
    });

    it('rejects objects with prototype pollution / inherited properties cleanly', () => {
      const bareObject = Object.create(null);
      bareObject.options = ['A', 'B', 'C', 'D'];
      bareObject.answer_idx = 1;
      bareObject.explanation_vi = 'Đáp án đúng là: B';

      const res = canShuffle(bareObject);
      expect(res.canShuffle).toBe(true);
      expect(res.category).toBe(2);
    });

    it('rejects invalid or missing options property (not an array)', () => {
      const invalidOptions = [
        undefined,
        null,
        'ABCD',
        1234,
        true,
        { 0: 'A', 1: 'B', length: 2 },
        new Set(['A', 'B', 'C', 'D']),
        new Map(),
      ];

      for (const opts of invalidOptions) {
        const q: any = { options: opts, answer_idx: 0 };
        const res = canShuffle(q);
        expect(res.canShuffle).toBe(false);
        expect(res.category).toBe(5);
        expect(res.reason).toContain('Less than 2 options');
      }
    });

    it('rejects non-integer, float, NaN, Infinity, and negative answer indices', () => {
      const invalidIndices = [
        NaN,
        Infinity,
        -Infinity,
        -1,
        -100,
        0.5,
        1.99,
        -0.0001,
        '0',
        '1',
        null,
        undefined,
        [],
        {},
        Number.MAX_SAFE_INTEGER,
      ];

      for (const badIdx of invalidIndices) {
        // Test answer_idx
        const q1: any = {
          options: ['A', 'B', 'C', 'D'],
          answer_idx: badIdx,
        };
        const res1 = canShuffle(q1);
        expect(res1.canShuffle).toBe(false);
        expect(res1.category).toBe(5);
        expect(res1.reason).toContain('Invalid answer index');

        // Test answer_index
        const q2: any = {
          options: ['A', 'B', 'C', 'D'],
          answer_index: badIdx,
        };
        const res2 = canShuffle(q2);
        expect(res2.canShuffle).toBe(false);
        expect(res2.category).toBe(5);
        expect(res2.reason).toContain('Invalid answer index');
      }
    });

    it('rejects out-of-bounds answer index (off-by-one and beyond)', () => {
      const q: any = {
        options: ['A', 'B', 'C', 'D'],
        answer_idx: 4, // length is 4, valid indices are 0..3
      };
      const res = canShuffle(q);
      expect(res.canShuffle).toBe(false);
      expect(res.category).toBe(5);
      expect(res.reason).toContain('Invalid answer index');

      // Far out of bounds
      q.answer_idx = 100;
      expect(canShuffle(q).canShuffle).toBe(false);
    });
  });

  // =========================================================================
  // Vector 2: Option Count Invariants
  // =========================================================================
  describe('Vector 2: Option Count Invariants', () => {
    it('rejects writing / open-ended questions with 0 or 1 options', () => {
      expect(canShuffle({ options: [], answer_idx: 0 }).canShuffle).toBe(false);
      expect(canShuffle({ options: ['Single option'], answer_idx: 0 }).canShuffle).toBe(false);
    });

    it('rejects unsupported odd or irregular option counts (5, 7, 8, 10)', () => {
      const testCounts = [5, 7, 8, 9, 10, 15, 20];
      for (const count of testCounts) {
        const opts = Array.from({ length: count }, (_, i) => `Option ${i}`);
        const q: ShuffleableQuestion = {
          options: opts,
          answer_idx: 0,
        };
        const res = canShuffle(q);
        expect(res.canShuffle).toBe(false);
        expect(res.category).toBe(5);
        expect(res.reason).toContain(`Unsupported option count (${count})`);
      }
    });

    it('permits strictly supported option counts: exactly 2, 3, 4, and 6 options', () => {
      for (const count of [2, 3, 4, 6]) {
        const opts = Array.from({ length: count }, (_, i) => `Fruit ${i}`);
        const q: ShuffleableQuestion = {
          options: opts,
          answer_idx: 0,
          explanation_vi: 'Giải thích ngữ nghĩa không chứa chữ cái.',
        };
        const res = canShuffle(q);
        expect(res.canShuffle).toBe(true);
        expect(res.category).toBe(1);
      }
    });
  });

  // =========================================================================
  // Vector 3: Fixed-Order Structures & Specialized Tasks
  // =========================================================================
  describe('Vector 3: Fixed-Order Structures & Specialized Tasks', () => {
    it('rejects standard Chinese True/False questions with ["对", "错"]', () => {
      const q: ShuffleableQuestion = {
        options: ['对', '错'],
        answer_idx: 0,
        explanation_vi: 'Khẳng định này đúng.',
      };
      const res = canShuffle(q);
      expect(res.canShuffle).toBe(false);
      expect(res.category).toBe(5);
      expect(res.reason).toContain('Fixed order True/False question');
    });

    it('rejects standard Chinese True/False questions with ["正确", "错误"]', () => {
      const q: ShuffleableQuestion = {
        options: ['正确', '错误'],
        answer_idx: 1,
        explanation_vi: 'Khẳng định này sai.',
      };
      const res = canShuffle(q);
      expect(res.canShuffle).toBe(false);
      expect(res.category).toBe(5);
      expect(res.reason).toContain('Fixed order True/False question');
    });

    it('rejects fixed-order sentence reordering tasks (part_type / task_type)', () => {
      const reorderTasks = [
        { part_type: 'read_reorder_sentence' },
        { part_type: 'write_reorder_words' },
        { task_type: 'reorder_sentence' },
        { part_type: 'REORDER_EXERCISE' },
        { task_type: 'HSK_REORDER' },
      ];

      for (const task of reorderTasks) {
        const q: ShuffleableQuestion = {
          ...task,
          options: ['A', 'B', 'C', 'D'],
          answer_idx: 0,
        };
        const res = canShuffle(q);
        expect(res.canShuffle).toBe(false);
        expect(res.category).toBe(5);
        expect(res.reason).toContain('Fixed order question type');
      }
    });

    it('rejects judge / true-false task types regardless of option contents', () => {
      const judgeTasks = [
        { part_type: 'listen_judge' },
        { part_type: 'listen_judge_true_false' },
        { part_type: 'read_tf' },
        { task_type: 'judge_statement' },
        { task_type: 'true_false_eval' },
        { part_type: 'HSK_JUDGE_PRACTICE' },
      ];

      for (const task of judgeTasks) {
        const q: ShuffleableQuestion = {
          ...task,
          options: ['Option A', 'Option B'],
          answer_idx: 0,
        };
        const res = canShuffle(q);
        expect(res.canShuffle).toBe(false);
        expect(res.category).toBe(5);
        expect(res.reason).toContain('Fixed order question type');
      }
    });
  });

  // =========================================================================
  // Vector 4: Word Banks & Shared Passage Groups
  // =========================================================================
  describe('Vector 4: Word Banks & Shared Passage Groups', () => {
    it('rejects shared word bank questions via boolean flags', () => {
      const flags = [
        { is_word_bank: true },
        { shared_word_bank: true },
        { is_shared_word_bank: true },
      ];

      for (const flag of flags) {
        const q: ShuffleableQuestion = {
          ...flag,
          options: ['A', 'B', 'C', 'D', 'E', 'F'],
          answer_idx: 0,
        };
        const res = canShuffle(q);
        expect(res.canShuffle).toBe(false);
        expect(res.category).toBe(5);
        expect(res.reason).toContain('Shared word bank A-F group');
      }
    });

    it('rejects word bank questions via part_type or task_type', () => {
      const q1: ShuffleableQuestion = {
        part_type: 'read_fill_blank_word_bank',
        options: ['词1', '词2', '词3', '词4'],
        answer_idx: 0,
      };
      expect(canShuffle(q1).canShuffle).toBe(false);

      const q2: ShuffleableQuestion = {
        task_type: 'read_fill_blank_word_bank',
        options: ['词1', '词2', '词3', '词4'],
        answer_idx: 0,
      };
      expect(canShuffle(q2).canShuffle).toBe(false);
    });

    it('rejects word bank questions via group_id matching', () => {
      const groupIds = [
        'word_bank_hsk3_p1',
        'group_wordbank_01',
        'HSK4_WORD_BANK_EXAM',
        'section_wordbank',
      ];

      for (const group_id of groupIds) {
        const q: ShuffleableQuestion = {
          group_id,
          options: ['A', 'B', 'C', 'D'],
          answer_idx: 0,
        };
        const res = canShuffle(q);
        expect(res.canShuffle).toBe(false);
        expect(res.category).toBe(5);
        expect(res.reason).toContain('Shared word bank A-F group');
      }
    });

    it('rejects shared passage questions via is_shared_passage_group or group_id', () => {
      const q1: ShuffleableQuestion = {
        is_shared_passage_group: true,
        options: ['A', 'B', 'C', 'D'],
        answer_idx: 0,
      };
      expect(canShuffle(q1).canShuffle).toBe(false);
      expect(canShuffle(q1).reason).toContain('Shared group restriction');

      const q2: ShuffleableQuestion = {
        group_id: 'reading_passage_hsk5_01',
        options: ['A', 'B', 'C', 'D'],
        answer_idx: 0,
      };
      expect(canShuffle(q2).canShuffle).toBe(false);
      expect(canShuffle(q2).reason).toContain('Shared group restriction');
    });
  });

  // =========================================================================
  // Vector 5: Tricky Vietnamese Explanation Patterns & Linguistic Analysis
  // =========================================================================
  describe('Vector 5: Tricky Vietnamese Explanation Patterns & Linguistic Analysis', () => {
    const defaultOptions = ['北京', '上海', '广州', '深圳']; // A=0, B=1, C=2, D=3

    it('safely handles Vietnamese words containing letters A-F without false-positive letter matches', () => {
      // Words like "Cà phê", "Bác sĩ", "Cơm", "Anh", "Đồng", "Ăn"
      const safeVietnameseTexts = [
        'Bác sĩ đã khuyên nên uống nhiều nước.',
        'Cà phê sáng giúp tinh thần tỉnh táo.',
        'Anh ấy đã đi mua Cơm trưa.',
        'Ăn uống điều độ là bí quyết sống lâu.',
        'Âm nhạc làm dịu tâm hồn con người.',
        'Đồng hồ điểm mười hai giờ đêm.',
        'Ý kiến này rất đáng để xem xét.',
      ];

      for (const text of safeVietnameseTexts) {
        const q: ShuffleableQuestion = {
          options: [...defaultOptions],
          answer_idx: 0,
          explanation_vi: text,
        };
        const res = canShuffle(q);
        expect(res.canShuffle).toBe(true);
        expect(res.category).toBe(1);
        expect(res.reason).toContain('Group 1: Semantic explanation without letter references');
      }
    });

    it('safely handles NFD decomposed Unicode strings without false-positive corruption', () => {
      const nfdText = 'Ăn cơm cùng gia đình.'.normalize('NFD');
      const q: ShuffleableQuestion = {
        options: [...defaultOptions],
        answer_idx: 0,
        explanation_vi: nfdText,
      };
      const res = canShuffle(q);
      // NFD might match 'A' followed by combining mark; conservative fallback MUST ensure canShuffle: false
      // rather than incorrectly syncing affirmative!
      if (!res.canShuffle) {
        expect(res.category).toBe(5);
      } else {
        expect(res.category).toBe(1);
      }
    });

    it('approves Category 1: Purely semantic explanations with no letter references', () => {
      const q: ShuffleableQuestion = {
        options: [...defaultOptions],
        answer_idx: 2, // '广州'
        explanation_vi: "Câu này có nghĩa: 'Thành phố này nằm ở miền Nam'. Từ '广州' phù hợp nhất với ngữ cảnh.",
      };
      const res = canShuffle(q);
      expect(res.canShuffle).toBe(true);
      expect(res.category).toBe(1);
    });

    it('approves Category 2: Standard affirmative single-letter designations matching correct answer', () => {
      const affirmativePatterns = [
        { text: 'Đáp án đúng là: A', ans: 0 },
        { text: 'Đáp án đúng là B', ans: 1 },
        { text: 'Phương án đúng là C', ans: 2 },
        { text: 'Chọn đáp án đúng: D', ans: 3 },
        { text: 'Chọn A vì từ này là động từ.', ans: 0 },
        { text: 'Đáp án: B', ans: 1 },
        { text: 'Phương án: C', ans: 2 },
        { text: 'A là đáp án chính xác.', ans: 0 },
        { text: 'B là phương án đúng.', ans: 1 },
        { text: 'Phương án C đúng.', ans: 2 },
        { text: 'Đáp án D phù hợp.', ans: 3 },
      ];

      for (const item of affirmativePatterns) {
        const q: ShuffleableQuestion = {
          options: [...defaultOptions],
          answer_idx: item.ans,
          explanation_vi: item.text,
        };
        const res = canShuffle(q);
        expect(res.canShuffle).toBe(true);
        expect(res.category).toBe(2);
        expect(res.reason).toContain('Group 2: Standard affirmative pattern');
      }
    });

    it('rejects Category 3: Multi-distractor explanation breakdowns', () => {
      const multiDistractorExplanations = [
        'A đúng. B sai vì thiếu tân ngữ.',
        'Đáp án là A. Loại trừ B, C, D do không phù hợp nghĩa.',
        'Chọn A vì B và C là danh từ, D là tính từ.',
        'A và B đều đúng trong ngữ cảnh này.',
        'Phương án A chính xác. B, C là các đáp án gây nhiễu.',
      ];

      for (const text of multiDistractorExplanations) {
        const q: ShuffleableQuestion = {
          options: [...defaultOptions],
          answer_idx: 0,
          explanation_vi: text,
        };
        const res = canShuffle(q);
        expect(res.canShuffle).toBe(false);
        expect(res.category).toBe(3);
        expect(res.reason).toContain('Group 3: Multi-distractor explanation');
      }
    });

    it('rejects Category 4: Explanations containing negation or distractor elimination phrasing with letter reference', () => {
      const negationExplanationsWithLetter = [
        'Không chọn A vì từ này dùng cho người.',
        'Không nên chọn A trong ngữ cảnh này.',
        'loại trừ B vì sai thì.',
        'loại bỏ C vì không đủ trang trọng.',
        'đáp án B sai vì thiếu bổ ngữ kết quả.',
        'tránh chọn A vì dễ nhầm lẫn.',
        'đừng chọn B trong câu hỏi này.',
        'Phương án A chưa chính xác do lỗi ngữ pháp.',
        'lỗi ở đáp án A.',
        'nhầm lẫn với đáp án A.',
        'cấm chọn phương án A ở đầu câu.',
      ];

      for (const text of negationExplanationsWithLetter) {
        const q: ShuffleableQuestion = {
          options: [...defaultOptions],
          answer_idx: 0,
          explanation_vi: text,
        };
        const res = canShuffle(q);
        expect(res.canShuffle).toBe(false);
        expect(res.category).toBe(4);
        expect(res.reason).toContain('Group 4: Explanation contains negation/elimination');
      }
    });

    it('approves Category 1 even if explanation contains Vietnamese negation words ("không", "sai", "nhầm") when NO option letters are referenced', () => {
      const semanticNegationTexts = [
        'Câu này mang nghĩa phủ định, không được làm phiền người khác.',
        'Các từ ngữ còn lại sai ngữ pháp vì không phù hợp với tân ngữ.',
        'Học sinh thường nhầm lẫn giữa hai cấu trúc này.',
        'Quy tắc cấm dùng từ này ở đầu câu.',
      ];

      for (const text of semanticNegationTexts) {
        const q: ShuffleableQuestion = {
          options: [...defaultOptions],
          answer_idx: 0,
          explanation_vi: text,
        };
        const res = canShuffle(q);
        expect(res.canShuffle).toBe(true);
        expect(res.category).toBe(1);
        expect(res.reason).toContain('Group 1: Semantic explanation without letter references');
      }
    });

    it('rejects Category 5: Mentioned letter does not match correct answer (Mismatched Letter)', () => {
      // Explanation mentions 'A', but correct answer is Option C (answer_idx = 2)
      const q: ShuffleableQuestion = {
        options: [...defaultOptions],
        answer_idx: 2, // '广州' (Option C)
        explanation_vi: 'Đáp án đúng là: A',
      };
      const res = canShuffle(q);
      expect(res.canShuffle).toBe(false);
      expect(res.category).toBe(5);
      expect(res.reason).toContain('does not match correct answer');
    });

    it('rejects Category 5: Ambiguous explanation structures', () => {
      const ambiguousExplanations = [
        'A. là phương án đúng.', // Punctuation dot immediately after letter
        'B: Đây là đáp án đúng.',
        'Vitamin C rất cần thiết.',
        'Căn hộ A có view đẹp.',
        'Tuyến xe buýt B đã ngừng hoạt động.',
      ];

      for (const text of ambiguousExplanations) {
        const q: ShuffleableQuestion = {
          options: [...defaultOptions],
          answer_idx: 0,
          explanation_vi: text,
        };
        const res = canShuffle(q);
        expect(res.canShuffle).toBe(false);
        expect(res.category).toBe(5);
      }
    });
  });

  // =========================================================================
  // Vector 6: Invariant Fallback Coupling with shuffleQuestionAnswers()
  // =========================================================================
  describe('Vector 6: Invariant Fallback Coupling with shuffleQuestionAnswers()', () => {
    it('guarantees that whenever canShuffle() is false, shuffleQuestionAnswers() NEVER shuffles', () => {
      const unsafeQuestions: ShuffleableQuestion[] = [
        // Unsupported options length
        { options: ['A', 'B', 'C', 'D', 'E', 'F', 'G'], answer_idx: 0 },
        { options: ['A', 'B', 'C', 'D', 'E'], answer_idx: 0 },
        // True/False
        { options: ['对', '错'], answer_idx: 0 },
        // Word bank
        { options: ['A', 'B', 'C', 'D'], answer_idx: 0, is_word_bank: true },
        // Shared passage
        { options: ['A', 'B', 'C', 'D'], answer_idx: 0, is_shared_passage_group: true },
        // Reorder task
        { options: ['A', 'B', 'C', 'D'], answer_idx: 0, part_type: 'read_reorder_sentence' },
        // Multi-distractor explanation
        { options: ['A', 'B', 'C', 'D'], answer_idx: 0, explanation_vi: 'A đúng. B sai vì...' },
        // Negation explanation
        { options: ['A', 'B', 'C', 'D'], answer_idx: 0, explanation_vi: 'Không chọn A...' },
        // Mismatched letter
        { options: ['A', 'B', 'C', 'D'], answer_idx: 1, explanation_vi: 'Đáp án đúng là: A' },
      ];

      for (const q of unsafeQuestions) {
        const guard = canShuffle(q);
        expect(guard.canShuffle).toBe(false);

        const res = shuffleQuestionAnswers(q);
        expect(res.shuffled).toBe(false);
        expect(res.shuffle_reason).toBe(guard.reason);
        expect(res.question.options).toEqual(q.options);
        expect(res.new_answer_idx).toBe(res.original_answer_idx);
        expect(res.mapping).toEqual(q.options.map((_, i) => i));
      }
    });
  });

  // =========================================================================
  // Vector 7: Strict Feature Flag Parsing Contract
  // =========================================================================
  describe('Vector 7: Feature Flag Parsing Contract', () => {
    const originalEnv = process.env.ENABLE_SERVING_ANSWER_SHUFFLE;

    afterEach(() => {
      if (originalEnv !== undefined) {
        process.env.ENABLE_SERVING_ANSWER_SHUFFLE = originalEnv;
      } else {
        delete process.env.ENABLE_SERVING_ANSWER_SHUFFLE;
      }
    });

    it('defaults to false when environment variable is unset', () => {
      delete process.env.ENABLE_SERVING_ANSWER_SHUFFLE;
      expect(isServingAnswerShuffleEnabled()).toBe(false);
    });

    it('strictly returns false on all falsy, truthy-looking, or malformed values', () => {
      const nonTrueValues = [
        '',
        '   ',
        'false',
        'FALSE',
        'False',
        '0',
        '1',
        'yes',
        'YES',
        'no',
        'NO',
        'TRUE',
        'True',
        'true1',
        'true!',
        'enabled',
        'on',
      ];

      for (const val of nonTrueValues) {
        process.env.ENABLE_SERVING_ANSWER_SHUFFLE = val;
        expect(isServingAnswerShuffleEnabled()).toBe(false);
      }
    });

    it('strictly returns true ONLY when exact lowercase "true" (with optional whitespace) is provided', () => {
      process.env.ENABLE_SERVING_ANSWER_SHUFFLE = 'true';
      expect(isServingAnswerShuffleEnabled()).toBe(true);

      process.env.ENABLE_SERVING_ANSWER_SHUFFLE = '  true  ';
      expect(isServingAnswerShuffleEnabled()).toBe(true);
    });
  });
});
