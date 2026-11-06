/**
 * tests/serving_conservative_fallback.test.ts
 *
 * Dedicated Test Suite for Serving Conservative Fallback Policy (Phase 8.4 R6, R7, R8)
 *
 * Requirements Covered:
 * 1. Category 1: Semantic explanations (no letter references) -> canShuffle: true, shuffled: true.
 *    - Word boundary protection for Vietnamese words like "Cà phê", "Bác sĩ", "Cơm", "câu".
 * 2. Category 2: Standard affirmative patterns ("Chọn A vì...", "Đáp án đúng là B...")
 *    - canShuffle: true, shuffled: true, explanation letter synchronized.
 * 3. Category 3: Multi-distractor breakdowns ("A đúng vì... B sai vì...")
 *    - canShuffle: false, shuffled: false, original option order preserved.
 * 4. Category 4: Negation / elimination phrasing ("Không chọn A...", "loại trừ B...")
 *    - canShuffle: false, shuffled: false, original option order preserved.
 * 5. Category 5: Mismatched letters, ambiguous structures, fixed-order questions & shared groups
 *    - Letter mismatch ("Chọn B" when answer is A) -> canShuffle: false.
 *    - Fixed-order question types: True/False ['对', '错'], reorder sentences, judge -> canShuffle: false.
 *    - Shared word bank A-F group -> canShuffle: false.
 *    - Shared passage groups -> canShuffle: false.
 * 6. Edge cases & Defensive Boundary Handling:
 *    - Unsupported option counts (e.g., 3, 5, 7 options).
 *    - Writing / open-ended tasks (0 or 1 options) returning shuffled: false gracefully.
 *    - Invalid / non-integer / out-of-bounds answer indices.
 *    - Strict immutability and zero production DB mutation.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import {
  canShuffle,
  shuffleQuestionAnswers,
  type ShuffleableQuestion,
  type CanShuffleResult,
} from '../src/server/utils/answerShuffle.js';

const EXPECTED_HSK_EXAM_DB_HASH = 'DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1';
const HSK_EXAM_DB_PATH = path.resolve(process.cwd(), 'data/hsk_exam.db');

function getSha256(filePath: string): string {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buf).digest('hex').toUpperCase();
}

describe('Dedicated Test Suite: Serving Conservative Fallback Policy (R6, R7, R8)', () => {
  beforeAll(() => {
    // Verify baseline production DB integrity before test execution
    expect(fs.existsSync(HSK_EXAM_DB_PATH)).toBe(true);
    expect(getSha256(HSK_EXAM_DB_PATH)).toBe(EXPECTED_HSK_EXAM_DB_HASH);
  });

  afterAll(() => {
    // Verify database SHA-256 remains completely untouched after tests
    expect(getSha256(HSK_EXAM_DB_PATH)).toBe(EXPECTED_HSK_EXAM_DB_HASH);
  });

  // =========================================================================
  // Category 1: Semantic Explanations (No Option Letter Mentions)
  // =========================================================================
  describe('Category 1: Pure Semantic Explanations', () => {
    it('allows shuffle when explanation contains purely semantic reasoning without letter references', () => {
      const q: ShuffleableQuestion = {
        stem: 'Chọn loại quả màu vàng:',
        options: ['苹果', '香蕉', '橙子', '西瓜'],
        answer_idx: 1,
        explanation_vi: 'Quả chuối là loại trái cây có màu vàng và giàu kali.',
      };

      const result: CanShuffleResult = canShuffle(q);
      expect(result.canShuffle).toBe(true);
      expect(result.category).toBe(1);
      expect(result.reason).toContain('Group 1: Semantic explanation');

      const shuffledRes = shuffleQuestionAnswers(q);
      expect(shuffledRes.shuffled).toBe(true);
      expect(shuffledRes.new_answer_idx).toBe(shuffledRes.mapping[1]);
      expect(shuffledRes.question.options[shuffledRes.new_answer_idx]).toBe('香蕉');
      expect(shuffledRes.question.explanation_vi).toBe(q.explanation_vi);
    });

    it('allows shuffle when explanation is empty, whitespace, or undefined', () => {
      const questions: ShuffleableQuestion[] = [
        { options: ['A1', 'B1', 'C1', 'D1'], answer_index: 0, explanation_vi: '' },
        { options: ['A2', 'B2', 'C2', 'D2'], answer_index: 2, explanation_vi: '   ' },
        { options: ['A3', 'B3', 'C3', 'D3'], answer_index: 3 },
      ];

      for (const q of questions) {
        const result = canShuffle(q);
        expect(result.canShuffle).toBe(true);
        expect(result.category).toBe(1);

        const shuffledRes = shuffleQuestionAnswers(q);
        expect(shuffledRes.shuffled).toBe(true);
      }
    });

    it('protects Vietnamese words starting with letters A-F ("Cà phê", "Bác sĩ", "Cơm", "câu") from false letter detection', () => {
      const q: ShuffleableQuestion = {
        stem: 'Nghề nghiệp làm việc ở bệnh viện:',
        options: ['老师', '医生', '司机', '工人'],
        answer_idx: 1,
        explanation_vi: 'Bác sĩ và y tá làm việc tại bệnh viện. Buổi sáng họ thường uống Cà phê và ăn Cơm cùng đồng nghiệp.',
      };

      const result = canShuffle(q);
      // 'B' in "Bác sĩ" and 'C' in "Cà phê", "Cơm" must NOT be treated as isolated option letters
      expect(result.canShuffle).toBe(true);
      expect(result.category).toBe(1);

      const shuffledRes = shuffleQuestionAnswers(q);
      expect(shuffledRes.shuffled).toBe(true);
      expect(shuffledRes.question.options[shuffledRes.new_answer_idx]).toBe('医生');
      expect(shuffledRes.question.explanation_vi).toBe(q.explanation_vi);
    });
  });

  // =========================================================================
  // Category 2: Standard Affirmative Patterns (Safe Letter Synchronization)
  // =========================================================================
  describe('Category 2: Standard Affirmative Patterns', () => {
    it('identifies standard affirmative templates and synchronizes letter to new option position', () => {
      // Deterministic PRNG that reverses order: [0, 1, 2, 3] -> [3, 2, 1, 0]
      const reverseRng = () => 0.0;

      const q: ShuffleableQuestion = {
        stem: 'Thủ đô của Trung Quốc là gì?',
        options: ['北京', '上海', '广州', '深圳'],
        answer_idx: 0, // '北京' (A)
        explanation_vi: 'Chọn đáp án A: Bắc Kinh là thủ đô của Trung Quốc.',
      };

      const result = canShuffle(q);
      expect(result.canShuffle).toBe(true);
      expect(result.category).toBe(2);
      expect(result.reason).toContain('Group 2: Standard affirmative pattern');

      const shuffledRes = shuffleQuestionAnswers(q, reverseRng);
      expect(shuffledRes.shuffled).toBe(true);
      const newLetter = String.fromCharCode(65 + shuffledRes.new_answer_idx);
      expect(shuffledRes.question.options[shuffledRes.new_answer_idx]).toBe('北京');
      expect(shuffledRes.question.explanation_vi).toContain(`Chọn đáp án ${newLetter}: Bắc Kinh là thủ đô của Trung Quốc.`);
    });

    it('correctly handles various standard affirmative phrases', () => {
      const patterns = [
        { text: 'Đáp án đúng là A.', idx: 0 },
        { text: 'Chọn đáp án B vì phù hợp ngữ nghĩa.', idx: 1 },
        { text: 'C là đáp án chính xác.', idx: 2 },
        { text: 'Phương án D đúng trong văn cảnh này.', idx: 3 },
      ];

      for (const { text, idx } of patterns) {
        const q: ShuffleableQuestion = {
          options: ['甲', '乙', '丙', '丁'],
          answer_idx: idx,
          explanation_vi: text,
        };

        const result = canShuffle(q);
        expect(result.canShuffle).toBe(true);
        expect(result.category).toBe(2);
      }
    });
  });

  // =========================================================================
  // Category 3: Multi-Distractor Explanations
  // =========================================================================
  describe('Category 3: Multi-Distractor Explanations (Strict Preservation)', () => {
    it('prohibits shuffle when explanation breaks down multiple option letters', () => {
      const q: ShuffleableQuestion = {
        stem: 'Phương tiện nào chạy trên đường sắt?',
        options: ['飞机', '火车', '出租车', '自行车'],
        answer_idx: 1, // '火车' (B)
        explanation_vi: 'Đáp án B đúng. A sai vì bay trên trời, C sai vì chạy trên đường phố, D sai vì là xe thô sơ.',
      };

      const result = canShuffle(q);
      expect(result.canShuffle).toBe(false);
      expect(result.category).toBe(3);
      expect(result.reason).toContain('Group 3: Multi-distractor explanation');

      // shuffleQuestionAnswers must return shuffled: false and preserve original options
      const shuffledRes = shuffleQuestionAnswers(q);
      expect(shuffledRes.shuffled).toBe(false);
      expect(shuffledRes.shuffle_reason).toContain('Group 3: Multi-distractor explanation');
      expect(shuffledRes.new_answer_idx).toBe(1);
      expect(shuffledRes.question.options).toEqual(['飞机', '火车', '出租车', '自行车']);
      expect(shuffledRes.question.explanation_vi).toBe(q.explanation_vi);
    });

    it('prohibits shuffle when two distinct option letters are mentioned', () => {
      const q: ShuffleableQuestion = {
        options: ['苹果', '香蕉', '橙子', '西瓜'],
        answer_idx: 0,
        explanation_vi: 'Chọn A. C không phù hợp với ngữ cảnh.',
      };

      const result = canShuffle(q);
      expect(result.canShuffle).toBe(false);
      expect(result.category).toBe(3);
    });
  });

  // =========================================================================
  // Category 4: Negation / Elimination Phrasing
  // =========================================================================
  describe('Category 4: Negation / Elimination Phrasing (Strict Preservation)', () => {
    it('prohibits shuffle when explanation uses negation ("Không chọn A...", "loại trừ B...")', () => {
      const questionsWithNegation: string[] = [
        'Không chọn A vì đây là từ vựng thuộc chủ đề khác.',
        'Loại trừ phương án A do không phù hợp thì quá khứ.',
        'Tránh chọn A vì ngữ nghĩa mang tính tiêu cực.',
        'Chưa chính xác nếu chọn A vì thiếu trợ từ kết cấu.',
      ];

      for (const explanation of questionsWithNegation) {
        const q: ShuffleableQuestion = {
          stem: 'Chọn đáp án chính xác:',
          options: ['选项1', '选项2', '选项3', '选项4'],
          answer_idx: 0,
          explanation_vi: explanation,
        };

        const result = canShuffle(q);
        expect(result.canShuffle).toBe(false);
        expect(result.category).toBe(4);
        expect(result.reason).toContain('Group 4: Explanation contains negation/elimination');

        const shuffledRes = shuffleQuestionAnswers(q);
        expect(shuffledRes.shuffled).toBe(false);
        expect(shuffledRes.question.options).toEqual(q.options);
        expect(shuffledRes.new_answer_idx).toBe(0);
      }
    });
  });

  // =========================================================================
  // Category 5: Mismatched Letters, Ambiguous Structures, Fixed Orders & Groups
  // =========================================================================
  describe('Category 5: Mismatched, Ambiguous, Fixed Order & Shared Groups', () => {
    it('prohibits shuffle when mentioned option letter does NOT match correct answer index', () => {
      const q: ShuffleableQuestion = {
        stem: 'Chọn câu đúng:',
        options: ['句子1', '句子2', '句子3', '句子4'],
        answer_idx: 0, // Answer is A (0)
        explanation_vi: 'Chọn đáp án B vì câu này đúng cấu trúc ngữ pháp.', // Explanation says B
      };

      const result = canShuffle(q);
      expect(result.canShuffle).toBe(false);
      expect(result.category).toBe(5);
      expect(result.reason).toContain('Mentioned letter (B) does not match correct answer (A)');

      const shuffledRes = shuffleQuestionAnswers(q);
      expect(shuffledRes.shuffled).toBe(false);
      expect(shuffledRes.question.options).toEqual(q.options);
      expect(shuffledRes.new_answer_idx).toBe(0);
    });

    it('prohibits shuffle for True/False questions (options: ["对", "错"] or ["正确", "错误"])', () => {
      const tf1: ShuffleableQuestion = {
        stem: 'Bắc Kinh là thủ đô Trung Quốc.',
        options: ['对', '错'],
        answer_idx: 0,
        explanation_vi: 'Thông tin hoàn toàn chính xác.',
      };
      const tf2: ShuffleableQuestion = {
        stem: 'Thượng Hải là thủ đô Trung Quốc.',
        options: ['正确', '错误'],
        answer_idx: 1,
        explanation_vi: 'Nhận định sai.',
      };

      expect(canShuffle(tf1).canShuffle).toBe(false);
      expect(canShuffle(tf1).reason).toBe('Fixed order True/False question');

      expect(canShuffle(tf2).canShuffle).toBe(false);
      expect(canShuffle(tf2).reason).toBe('Fixed order True/False question');

      const shuffledRes = shuffleQuestionAnswers(tf1);
      expect(shuffledRes.shuffled).toBe(false);
      expect(shuffledRes.question.options).toEqual(['对', '错']);
    });

    it('prohibits shuffle for fixed-order question types (reorder, true_false, judge)', () => {
      const reorderQ: ShuffleableQuestion = {
        stem: 'Sắp xếp các từ sau thành câu hoàn chỉnh:',
        options: ['我', '是', '学生', '个'],
        answer_idx: 0,
        part_type: 'read_reorder_sentence',
      };
      expect(canShuffle(reorderQ).canShuffle).toBe(false);
      expect(canShuffle(reorderQ).reason).toBe('Fixed order question type');

      const judgeQ: ShuffleableQuestion = {
        stem: 'Phán đoán đúng sai:',
        options: ['A', 'B'],
        answer_idx: 0,
        task_type: 'listen_judge',
      };
      expect(canShuffle(judgeQ).canShuffle).toBe(false);
      expect(canShuffle(judgeQ).reason).toBe('Fixed order question type');
    });

    it('prohibits shuffle for shared word bank A-F groups', () => {
      const wb1: ShuffleableQuestion = {
        stem: 'Điền từ vào chỗ trống:',
        options: ['A', 'B', 'C', 'D', 'E', 'F'],
        answer_idx: 2,
        part_type: 'read_fill_blank_word_bank',
      };
      expect(canShuffle(wb1).canShuffle).toBe(false);
      expect(canShuffle(wb1).reason).toBe('Shared word bank A-F group');

      const wb2: ShuffleableQuestion = {
        stem: 'Điền từ vào chỗ trống:',
        options: ['高', '大', '小', '多', '少', '快'],
        answer_idx: 1,
        group_id: 'wordbank_group_hsk1',
      };
      expect(canShuffle(wb2).canShuffle).toBe(false);
      expect(canShuffle(wb2).reason).toBe('Shared word bank A-F group');
    });

    it('prohibits shuffle for shared passage groups', () => {
      const passageQ: ShuffleableQuestion = {
        stem: 'Theo đoạn văn, nhân vật chính làm gì?',
        options: ['去学校', '去商店', '回家', '睡觉'],
        answer_idx: 0,
        is_shared_passage_group: true,
      };
      expect(canShuffle(passageQ).canShuffle).toBe(false);
      expect(canShuffle(passageQ).reason).toBe('Shared group restriction');
    });
  });

  // =========================================================================
  // Defensive Boundaries & Edge Cases
  // =========================================================================
  describe('Defensive Boundaries & Error Handling', () => {
    it('handles open-ended / writing tasks (0 or 1 options) gracefully by returning shuffled: false', () => {
      const writingQ: ShuffleableQuestion = {
        stem: 'Viết đoạn văn ngắn 80 chữ về chủ đề du lịch:',
        options: [],
        answer_idx: -1,
        part_type: 'write_composition',
      };

      const result = canShuffle(writingQ);
      expect(result.canShuffle).toBe(false);

      const shuffledRes = shuffleQuestionAnswers(writingQ);
      expect(shuffledRes.shuffled).toBe(false);
      expect(shuffledRes.shuffle_reason).toContain('Less than 2 options');
      expect(shuffledRes.new_answer_idx).toBe(-1);
    });

    it('rejects unsupported option counts (e.g., 5 or 7 options)', () => {
      const sevenOptQ: ShuffleableQuestion = {
        options: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
        answer_idx: 0,
      };
      const res7 = canShuffle(sevenOptQ);
      expect(res7.canShuffle).toBe(false);
      expect(res7.reason).toContain('Unsupported option count (7)');

      const fiveOptQ: ShuffleableQuestion = {
        options: ['A', 'B', 'C', 'D', 'E'],
        answer_idx: 0,
      };
      const res5 = canShuffle(fiveOptQ);
      expect(res5.canShuffle).toBe(false);
      expect(res5.reason).toContain('Unsupported option count (5)');
    });

    it('rejects non-integer answer index with TypeError', () => {
      const invalidQ: ShuffleableQuestion = {
        options: ['A', 'B', 'C', 'D'],
        answer_idx: 1.5 as any,
      };
      expect(canShuffle(invalidQ).canShuffle).toBe(false);
      expect(() => shuffleQuestionAnswers(invalidQ)).toThrow(TypeError);
    });

    it('rejects out-of-bounds answer index with RangeError', () => {
      const outOfBoundsQ: ShuffleableQuestion = {
        options: ['A', 'B', 'C', 'D'],
        answer_idx: 4,
      };
      expect(canShuffle(outOfBoundsQ).canShuffle).toBe(false);
      expect(() => shuffleQuestionAnswers(outOfBoundsQ)).toThrow(RangeError);
    });

    it('maintains strict immutability: original object is never mutated on shuffle or error', () => {
      const originalOptions = ['苹果', '香蕉', '橙子', '西瓜'];
      const q: ShuffleableQuestion = {
        stem: 'Thử thách bất biến',
        options: [...originalOptions],
        answer_idx: 1,
        explanation_vi: 'Giải thích nguyên vẹn',
      };

      const clonedBefore = JSON.stringify(q);
      shuffleQuestionAnswers(q);

      // Verify original object and array remain 100% unchanged
      expect(JSON.stringify(q)).toBe(clonedBefore);
      expect(q.options).toEqual(originalOptions);
    });
  });
});
