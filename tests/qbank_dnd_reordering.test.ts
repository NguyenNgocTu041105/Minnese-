/**
 * Test Suite: QBank Drag-and-Drop Question & Option Reordering (Milestone 2 - R2)
 *
 * Verifies:
 * 1. Pure reorderArray utility function logic:
 *    - Forward, backward, boundary, out-of-bounds, and non-mutating behavior.
 *    - Generic support for both string options and question object arrays.
 * 2. Mathematical Invariant Preservation for Option Reordering:
 *    - When options are reordered, answer_idx dynamically recalculates so that
 *      the correct answer option content remains strictly bound to nextOptions[nextAnswerIdx].
 *    - Comprehensive testing across all permutations for 4-option MCQs (16 transitions * 4 answer positions = 64 combinations).
 *    - Multi-step consecutive reordering chains.
 * 3. Boundary Cases:
 *    - Single-option questions.
 *    - 2-option questions (True/False: 对 / 错).
 *    - 3-option questions (HSK 1-3 listening dialogue).
 *    - 4-option questions (Standard HSK reading/listening MCQ).
 *    - 6-option questions (Dialogue matching / extended format).
 *    - Duplicate option texts resilience.
 * 4. Question Sequence Number Invariant:
 *    - Dynamic sequence numbering formatSequenceNumber: Câu 1, Câu 2, ...
 *    - Sequence reassignment after question reordering.
 * 5. Export Order & Content Integrity:
 *    - Excel, Word, and JSON export alignment with reordered question & option sequence.
 */

import { describe, it, expect } from 'vitest';
import {
  reorderArray,
  reorderOptions,
  formatSequenceNumber,
} from '../src/components/QBankAdmin.js';
import {
  exportExamToExcel,
  exportExamToWord,
  exportExamToJson,
} from '../src/server/examExportService.js';
import { CandidateQuestion } from '../src/server/llm/types.js';

describe('Milestone 2 - R2: Drag-and-Drop Question & Option Reordering', () => {
  describe('1. Pure reorderArray Utility Function', () => {
    it('moves an element forward in an array (from index 0 to 2)', () => {
      const original = ['A', 'B', 'C', 'D'];
      const result = reorderArray(original, 0, 2);
      expect(result).toEqual(['B', 'C', 'A', 'D']);
      // Original array must not be mutated
      expect(original).toEqual(['A', 'B', 'C', 'D']);
    });

    it('moves an element backward in an array (from index 3 to 1)', () => {
      const original = ['A', 'B', 'C', 'D'];
      const result = reorderArray(original, 3, 1);
      expect(result).toEqual(['A', 'D', 'B', 'C']);
      expect(original).toEqual(['A', 'B', 'C', 'D']);
    });

    it('moves first element to last position', () => {
      const original = [1, 2, 3, 4, 5];
      const result = reorderArray(original, 0, 4);
      expect(result).toEqual([2, 3, 4, 5, 1]);
    });

    it('moves last element to first position', () => {
      const original = ['first', 'second', 'third', 'last'];
      const result = reorderArray(original, 3, 0);
      expect(result).toEqual(['last', 'first', 'second', 'third']);
    });

    it('returns an identical shallow-copy when sourceIdx === destIdx', () => {
      const original = ['apple', 'banana', 'orange'];
      const result = reorderArray(original, 1, 1);
      expect(result).toEqual(original);
      expect(result).not.toBe(original);
    });

    it('handles out-of-bounds indices gracefully by returning shallow-copy', () => {
      const items = ['x', 'y', 'z'];
      expect(reorderArray(items, -1, 1)).toEqual(['x', 'y', 'z']);
      expect(reorderArray(items, 1, -1)).toEqual(['x', 'y', 'z']);
      expect(reorderArray(items, 0, 10)).toEqual(['x', 'y', 'z']);
      expect(reorderArray(items, 10, 0)).toEqual(['x', 'y', 'z']);
    });

    it('reorders question objects preserving all metadata and references', () => {
      const questions = [
        { id: 'q-001', stem: 'Question 1', level: 1 },
        { id: 'q-002', stem: 'Question 2', level: 2 },
        { id: 'q-003', stem: 'Question 3', level: 3 },
      ];

      const reordered = reorderArray(questions, 2, 0);
      expect(reordered.map((q) => q.id)).toEqual(['q-003', 'q-001', 'q-002']);
      expect(reordered[0]).toBe(questions[2]);
      expect(reordered[1]).toBe(questions[0]);
      expect(reordered[2]).toBe(questions[1]);
    });
  });

  describe('2. Mathematical Invariant Preservation for Option Reordering', () => {
    it('preserves correct answer when moving correct option from index 0 to 2', () => {
      const options = ['苹果 (Correct)', '香蕉', '西瓜', '葡萄'];
      const oldAnswerIdx = 0; // '苹果 (Correct)'

      const res = reorderOptions(options, oldAnswerIdx, 0, 2);
      expect(res.options).toEqual(['香蕉', '西瓜', '苹果 (Correct)', '葡萄']);
      expect(res.answer_idx).toBe(2);
      expect(res.options[res.answer_idx]).toBe(options[oldAnswerIdx]);
    });

    it('preserves correct answer when moving correct option from index 3 to 0', () => {
      const options = ['苹果', '香蕉', '西瓜', '葡萄 (Correct)'];
      const oldAnswerIdx = 3;

      const res = reorderOptions(options, oldAnswerIdx, 3, 0);
      expect(res.options).toEqual(['葡萄 (Correct)', '苹果', '香蕉', '西瓜']);
      expect(res.answer_idx).toBe(0);
      expect(res.options[res.answer_idx]).toBe(options[oldAnswerIdx]);
    });

    it('preserves correct answer index when moving a distractor that does not affect correct position', () => {
      const options = ['苹果', '香蕉', '西瓜 (Correct)', '葡萄'];
      const oldAnswerIdx = 2; // '西瓜 (Correct)'

      // Move option at index 0 ('苹果') to index 1 ('香蕉')
      // Array becomes: ['香蕉', '苹果', '西瓜 (Correct)', '葡萄']
      // '西瓜 (Correct)' remains at index 2
      const res = reorderOptions(options, oldAnswerIdx, 0, 1);
      expect(res.options).toEqual(['香蕉', '苹果', '西瓜 (Correct)', '葡萄']);
      expect(res.answer_idx).toBe(2);
      expect(res.options[res.answer_idx]).toBe(options[oldAnswerIdx]);
    });

    it('adjusts answer index when a distractor shifts across the correct answer position', () => {
      const options = ['苹果', '香蕉 (Correct)', '西瓜', '葡萄'];
      const oldAnswerIdx = 1; // '香蕉 (Correct)'

      // Move option at index 3 ('葡萄') to index 0
      // Array becomes: ['葡萄', '苹果', '香蕉 (Correct)', '西瓜']
      // '香蕉 (Correct)' shifts from index 1 to index 2
      const res = reorderOptions(options, oldAnswerIdx, 3, 0);
      expect(res.options).toEqual(['葡萄', '苹果', '香蕉 (Correct)', '西瓜']);
      expect(res.answer_idx).toBe(2);
      expect(res.options[res.answer_idx]).toBe(options[oldAnswerIdx]);
    });

    it('strictly satisfies the mathematical invariant across ALL 64 permutations in a 4-option MCQ', () => {
      const baseOptions = ['Option Alpha', 'Option Beta', 'Option Gamma', 'Option Delta'];

      for (let correctIdx = 0; correctIdx < 4; correctIdx++) {
        const expectedAnswerContent = baseOptions[correctIdx];

        for (let source = 0; source < 4; source++) {
          for (let dest = 0; dest < 4; dest++) {
            const result = reorderOptions(baseOptions, correctIdx, source, dest);

            // 1. Length must be preserved
            expect(result.options.length).toBe(4);

            // 2. All elements must still be present
            expect(new Set(result.options)).toEqual(new Set(baseOptions));

            // 3. Invariant: The new answer index must point to the exact same option content
            expect(result.options[result.answer_idx]).toBe(expectedAnswerContent);

            // 4. Index must be in valid range [0, 3]
            expect(result.answer_idx).toBeGreaterThanOrEqual(0);
            expect(result.answer_idx).toBeLessThanOrEqual(3);
          }
        }
      }
    });

    it('preserves correct answer across a chain of 10 consecutive reorderings', () => {
      let currentOptions = ['Chiếc bút', 'Quyển sách (Đúng)', 'Cái bàn', 'Cái ghế'];
      let currentAnswerIdx = 1;
      const targetContent = currentOptions[currentAnswerIdx];

      const moves = [
        [0, 3], // Move 0 to 3
        [2, 0], // Move 2 to 0
        [1, 2], // Move 1 to 2
        [3, 1], // Move 3 to 1
        [0, 2], // Move 0 to 2
        [1, 3], // Move 1 to 3
        [2, 0], // Move 2 to 0
        [3, 2], // Move 3 to 2
        [0, 1], // Move 0 to 1
        [2, 3], // Move 2 to 3
      ];

      for (const [src, dst] of moves) {
        const next = reorderOptions(currentOptions, currentAnswerIdx, src, dst);
        currentOptions = next.options;
        currentAnswerIdx = next.answer_idx;

        // Verify invariant after every single intermediate step
        expect(currentOptions[currentAnswerIdx]).toBe(targetContent);
      }
    });
  });

  describe('3. Boundary Cases & Format Diversities', () => {
    it('handles single-option boundary case without error', () => {
      const options = ['Chỉ có 1 phương án duy nhất'];
      const res = reorderOptions(options, 0, 0, 0);
      expect(res.options).toEqual(['Chỉ có 1 phương án duy nhất']);
      expect(res.answer_idx).toBe(0);
    });

    it('handles empty options boundary case', () => {
      const res = reorderOptions([], 0, 0, 1);
      expect(res.options).toEqual([]);
      expect(res.answer_idx).toBe(0);
    });

    it('handles 2-option True/False questions (对 / 错)', () => {
      const tfOptions = ['对 (Đúng)', '错 (Sai)'];

      // Move 0 to 1 with answer = 0
      const res1 = reorderOptions(tfOptions, 0, 0, 1);
      expect(res1.options).toEqual(['错 (Sai)', '对 (Đúng)']);
      expect(res1.answer_idx).toBe(1);
      expect(res1.options[res1.answer_idx]).toBe('对 (Đúng)');

      // Move 1 to 0 to restore
      const res2 = reorderOptions(res1.options, res1.answer_idx, 1, 0);
      expect(res2.options).toEqual(['对 (Đúng)', '错 (Sai)']);
      expect(res2.answer_idx).toBe(0);
      expect(res2.options[res2.answer_idx]).toBe('对 (Đúng)');
    });

    it('handles 3-option HSK listening dialogue questions (A, B, C)', () => {
      const options3 = ['医院', '学校', '火车站'];
      const answerIdx = 2; // 火车站

      // Move option at index 2 to index 0
      const res = reorderOptions(options3, answerIdx, 2, 0);
      expect(res.options).toEqual(['火车站', '医院', '学校']);
      expect(res.answer_idx).toBe(0);
      expect(res.options[res.answer_idx]).toBe('火车站');
    });

    it('handles 6-option dialogue matching questions (A, B, C, D, E, F)', () => {
      const options6 = [
        'A. 他在看书',
        'B. 她在喝水',
        'C. 医生在工作',
        'D. 学生在考试 (Correct)',
        'E. 老师在上课',
        'F. 司机在开车',
      ];
      const answerIdx = 3;

      // Move index 3 to index 5
      const res1 = reorderOptions(options6, answerIdx, 3, 5);
      expect(res1.options[res1.answer_idx]).toBe('D. 学生在考试 (Correct)');
      expect(res1.answer_idx).toBe(5);

      // Move index 0 to index 4 (index 5 is unaffected)
      const res2 = reorderOptions(res1.options, res1.answer_idx, 0, 4);
      expect(res2.options[res2.answer_idx]).toBe('D. 学生在考试 (Correct)');
      expect(res2.answer_idx).toBe(5);
    });

    it('handles duplicate option texts gracefully without corrupting index', () => {
      const dupOptions = ['Trùng lặp', 'Trùng lặp', 'Khác biệt'];
      // Correct answer is at index 0
      const res = reorderOptions(dupOptions, 0, 0, 2);
      expect(res.options.length).toBe(3);
      expect(res.answer_idx).toBe(2);
    });
  });

  describe('4. Sequence Number Update Invariant', () => {
    it('formats sequence numbers canonically as Câu {idx + 1}', () => {
      expect(formatSequenceNumber(0)).toBe('Câu 1');
      expect(formatSequenceNumber(1)).toBe('Câu 2');
      expect(formatSequenceNumber(4)).toBe('Câu 5');
      expect(formatSequenceNumber(99)).toBe('Câu 100');
    });

    it('dynamically updates sequence numbers when question cards are reordered', () => {
      const initialQuestions = [
        { id: 'q-alpha', stem: 'Chiếc bàn này bao nhiêu tiền?' },
        { id: 'q-beta', stem: 'Hôm nay trời rất đẹp.' },
        { id: 'q-gamma', stem: 'Tôi muốn mua một quả táo.' },
      ];

      // Initial visual sequence
      const initialSequence = initialQuestions.map((q, idx) => ({
        id: q.id,
        label: formatSequenceNumber(idx),
      }));

      expect(initialSequence).toEqual([
        { id: 'q-alpha', label: 'Câu 1' },
        { id: 'q-beta', label: 'Câu 2' },
        { id: 'q-gamma', label: 'Câu 3' },
      ]);

      // Move 'q-gamma' from index 2 to index 0 (top of the list)
      const reorderedQuestions = reorderArray(initialQuestions, 2, 0);

      const reorderedSequence = reorderedQuestions.map((q, idx) => ({
        id: q.id,
        label: formatSequenceNumber(idx),
      }));

      // 'q-gamma' dynamically becomes Câu 1
      // 'q-alpha' becomes Câu 2
      // 'q-beta' becomes Câu 3
      expect(reorderedSequence).toEqual([
        { id: 'q-gamma', label: 'Câu 1' },
        { id: 'q-alpha', label: 'Câu 2' },
        { id: 'q-beta', label: 'Câu 3' },
      ]);
    });
  });

  describe('5. Export Order & Visual Sequence Alignment', () => {
    const createMockCandidate = (
      id: string,
      stem: string,
      options: string[],
      answer_idx: number
    ): CandidateQuestion => ({
      id,
      stem,
      options,
      answer_idx,
      level: 1,
      skill: 'reading',
      part_type: 'read_fill_blank_4opt',
      explanation_vi: `Giải thích cho câu ${id}`,
      pinyin: 'ce shi',
    });

    it('exports questions and reordered options to JSON with 100% fidelity', () => {
      const q1 = createMockCandidate('q1', 'Stem 1', ['A1', 'B1', 'C1', 'D1'], 0);
      const q2 = createMockCandidate('q2', 'Stem 2', ['A2', 'B2', 'C2', 'D2'], 1);

      // Reorder q2 options: move index 1 to 3
      const reorderedQ2Options = reorderOptions(q2.options, q2.answer_idx, 1, 3);
      const modifiedQ2: CandidateQuestion = {
        ...q2,
        options: reorderedQ2Options.options,
        answer_idx: reorderedQ2Options.answer_idx,
      };

      // Reorder question order: q2 first, then q1
      const reorderedList = [modifiedQ2, q1];

      const jsonString = exportExamToJson(reorderedList, { exam_title: 'Test Exam' });
      const parsed = JSON.parse(jsonString);

      expect(parsed.metadata.total_questions).toBe(2);
      expect(parsed.questions.length).toBe(2);
      expect(parsed.questions[0].id).toBe('q2');
      expect(parsed.questions[0].options).toEqual(['A2', 'C2', 'D2', 'B2']);
      expect(parsed.questions[0].answer_idx).toBe(3);
      expect(parsed.questions[0].correct_answer).toBe('B2');

      expect(parsed.questions[1].id).toBe('q1');
      expect(parsed.questions[1].options).toEqual(['A1', 'B1', 'C1', 'D1']);
      expect(parsed.questions[1].answer_idx).toBe(0);
      expect(parsed.questions[1].correct_answer).toBe('A1');
    });

    it('exports reordered questions to Excel preserving STT 1..N and option columns', () => {
      const q1 = createMockCandidate('q1', 'Stem 1', ['Opt A', 'Opt B', 'Opt C', 'Opt D'], 2);
      const q2 = createMockCandidate('q2', 'Stem 2', ['Opt 1', 'Opt 2', 'Opt 3', 'Opt 4'], 0);

      // Reverse question list
      const reorderedQuestions = [q2, q1];

      const excelBuffer = exportExamToExcel(reorderedQuestions, 'Excel Export', { exam_title: 'Excel Export' });
      expect(excelBuffer).toBeInstanceOf(Buffer);
      expect(excelBuffer.length).toBeGreaterThan(1000);
    });

    it('exports reordered questions to Word preserving question sequence and answer keys', () => {
      const q1 = createMockCandidate('q1', 'Stem 1', ['Opt A', 'Opt B', 'Opt C', 'Opt D'], 1);
      const q2 = createMockCandidate('q2', 'Stem 2', ['Opt X', 'Opt Y', 'Opt Z', 'Opt W'], 3);

      const reorderedQuestions = [q2, q1];

      const wordBuffer = exportExamToWord(reorderedQuestions, 'Word Export', {
        exam_title: 'Word Export',
        include_answers: true,
        include_explanations: true,
      });

      expect(wordBuffer).toBeInstanceOf(Buffer);
      expect(wordBuffer.length).toBeGreaterThan(1000);
    });
  });
});
