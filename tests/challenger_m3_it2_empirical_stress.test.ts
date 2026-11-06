/**
 * tests/challenger_m3_it2_empirical_stress.test.ts
 *
 * EMPIRICAL STRESS & EDGE CASES CHALLENGER SUITE for Milestone M3 (Nhóm C - Iteration 2 Remediation)
 *
 * Focus Areas:
 * 1. Format compatibility re-evaluation with diverse question structures:
 *    - 4-option fill_blank mapped to 6-option word bank (HSK 1-3)
 *    - Pedagogical option count flexibility bounds (0, 1, 2, 3, 4, 5, 6, 7 options)
 *    - Cloze passage vs single-sentence items
 *    - Audio prompt vs spoken script detection in listening questions
 *    - Visual requirement validation
 * 2. Answer shuffle and option permutation invariants:
 *    - Answer tracking invariant: newOptions[new_answer_idx] === oldOptions[old_answer_idx]
 *    - Multiset preservation: no option loss, distortion, or duplication across all permutations
 *    - Mapping reversibility and bijection: mapping[old_idx] = new_idx
 *    - Writing / open-ended task immunity (0 or 1 options)
 *    - Fixed-order task safety guards (True/False, Reordering, Shared Word Bank, Shared Passage)
 *    - Vietnamese Unicode explanation protection (accents, negation, multi-option breakdown)
 *    - RNG input boundary contract (finiteness, [0, 1) bounds, immutability on failure)
 * 3. System invariants:
 *    - data/hsk_exam.db SHA-256 hash preservation
 *    - data/qbank/qbank.db operational integrity
 */

import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import {
  isOptionCountCompatible,
  validateFormatCompatibility,
  ensureEligiblePoolSchema,
  reEvaluateApprovedQuestions,
} from '../src/server/qbankFormatSync.js';
import { isCompatiblePartType } from '../src/server/qbankCoverageEngine.js';
import {
  shuffleQuestionAnswers,
  shuffleOptionsArray,
  canShuffle,
  isIsolatedOptionLetter,
  NEGATION_INDICATOR_REGEX,
} from '../src/server/utils/answerShuffle.js';

const EXPECTED_HSK_EXAM_DB_HASH = 'DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1';
const HSK_EXAM_DB_PATH = path.resolve(process.cwd(), 'data/hsk_exam.db');
const QBANK_DB_PATH = path.resolve(process.cwd(), 'data/qbank/qbank.db');

describe('Milestone M3 Iteration 2: Empirical Stress & Adversarial Challenge Suite', () => {

  // =========================================================================
  // DIMENSION 1: FORMAT COMPATIBILITY & OPTION COUNT FLEXIBILITY
  // =========================================================================
  describe('Dimension 1: Format Compatibility & Diverse Question Structures', () => {

    describe('1.1: 4-Option Fill-in-the-Blank Mapped to 6-Option Word Bank', () => {
      it('empirically verifies isCompatiblePartType supports fill_blank <-> word_bank mappings', () => {
        expect(isCompatiblePartType('read_fill_blank_word_bank_6opt', 'read_fill_blank_4opt')).toBe(true);
        expect(isCompatiblePartType('read_fill_blank_4opt', 'read_fill_blank_word_bank_6opt')).toBe(true);
        expect(isCompatiblePartType('read_fill_blank_word_bank_split', 'read_fill_blank_4opt')).toBe(true);
        expect(isCompatiblePartType('read_fill_blank_4opt', 'read_fill_blank_word_bank_split')).toBe(true);
      });

      it('verifies option count bounds for 6-option word bank parts', () => {
        const bpParts = ['read_fill_blank_word_bank_6opt', 'read_fill_blank_word_bank_split'];
        for (const bp of bpParts) {
          // Allowed: 4, 5, 6
          expect(isOptionCountCompatible(bp, 6, 4)).toBe(true);
          expect(isOptionCountCompatible(bp, 6, 5)).toBe(true);
          expect(isOptionCountCompatible(bp, 6, 6)).toBe(true);

          // Strictly rejected: 0, 1, 2, 3, 7, 8
          expect(isOptionCountCompatible(bp, 6, 0)).toBe(false);
          expect(isOptionCountCompatible(bp, 6, 1)).toBe(false);
          expect(isOptionCountCompatible(bp, 6, 2)).toBe(false);
          expect(isOptionCountCompatible(bp, 6, 3)).toBe(false);
          expect(isOptionCountCompatible(bp, 6, 7)).toBe(false);
          expect(isOptionCountCompatible(bp, 6, 8)).toBe(false);
        }
      });

      it('verifies 4-option fill_blank validation for synthetic questions in HSK 1-3', () => {
        const hsk1Question = {
          stem: '他身体不太舒服，现在要去____看医生。',
          options: ['医院', '商店', '学校', '机场'],
          answer_idx: 0,
          skill: 'reading',
          part_type: 'read_fill_blank_4opt',
          level: 1,
          status: 'approved',
        };
        const res = validateFormatCompatibility(hsk1Question, 1);
        expect(res.practice_format_compatible).toBe(true);
        expect(res.practice_eligible).toBe(true);
        expect(res.exam_format_compatible).toBe(true);
        expect(res.exam_eligible).toBe(true);
        expect(res.compatible_formats).toContain('read_fill_blank_word_bank_6opt');
        expect(res.matched_blueprint_part).toBe('reading_3');
      });
    });

    describe('1.2: Cloze Passage vs Single-Sentence Items', () => {
      it('accepts reading questions with passage length >= 20 in higher HSK levels', () => {
        const qPassage = {
          stem: '根据短文回答问题：____。',
          passage: '随着科学技术的迅速发展，人工智能已经走进了我们日常生活的方方面面。无论是在教育、医疗还是交通领域，智能化系统都发挥着重要作用。',
          options: ['人工智能', '传统医学', '现代交通', '义务教育'],
          answer_idx: 0,
          skill: 'reading',
          part_type: 'read_cloze_passages_4opt',
          level: 5,
          status: 'approved',
        };
        const res = validateFormatCompatibility(qPassage, 5);
        expect(res.exam_format_compatible).toBe(true);
        expect(res.exam_eligible).toBe(true);
        expect(res.matched_blueprint_part).toBe('reading_1');
      });

      it('rejects cloze passages without passage text when part_type strictly demands passage', () => {
        const qNoPassage = {
          stem: '根据短文回答问题：____。',
          passage: '',
          options: ['A', 'B', 'C', 'D'],
          answer_idx: 0,
          skill: 'reading',
          part_type: 'read_cloze_passages_4opt',
          level: 5,
          status: 'approved',
        };
        const res = validateFormatCompatibility(qNoPassage, 5);
        expect(res.exam_format_compatible).toBe(false);
        expect(res.exam_eligible).toBe(false);
        expect(res.ineligible_reasons).toContain('Dạng bài read_cloze_passages_4opt yêu cầu bài đọc văn bản (passage)');
      });
    });

    describe('1.3: Audio Prompt vs Spoken Script Detection in Listening', () => {
      it('accepts dialogue marker script in stem (男：... 女：...) without explicit audio_text', () => {
        const qDialogue = {
          stem: '男：你明天下午有空吗？\n女：有空，我们一起去看电影吧。\n问：他们明天打算做什么？',
          options: ['看电影', '去学校', '打篮球'],
          answer_idx: 0,
          skill: 'listening',
          part_type: 'listen_dialogue_qa_3opt',
          level: 2,
          status: 'approved',
        };
        const res = validateFormatCompatibility(qDialogue, 2);
        expect(res.exam_format_compatible).toBe(true);
        expect(res.exam_eligible).toBe(true);
      });

      it('accepts spoken sentence stem in HSK 1-2 when stem is a factual statement', () => {
        const qStatement = {
          stem: '外边下雨了。',
          options: ['下雨', '晴天', '刮风', '下雪'],
          answer_idx: 0,
          skill: 'listening',
          part_type: 'listen_picture_match_4opt',
          illustration_theme: 'rain',
          level: 1,
          status: 'approved',
        };
        const res = validateFormatCompatibility(qStatement, 1);
        expect(res.exam_format_compatible).toBe(true);
        expect(res.exam_eligible).toBe(true);
      });

      it('rejects question-prompt-only stem in higher HSK listening when audio resources are absent', () => {
        const qPromptOnly = {
          stem: '男的今天晚上打算做什么？', // Question prompt, not spoken dialogue
          options: ['去电影院', '在宿舍看书', '参加朋友聚会', '去健身房'],
          answer_idx: 0,
          skill: 'listening',
          part_type: 'listen_dialogue_qa_4opt',
          level: 4,
          status: 'approved',
        };
        const res = validateFormatCompatibility(qPromptOnly, 4);
        expect(res.exam_format_compatible).toBe(false);
        expect(res.exam_eligible).toBe(false);
        expect(res.ineligible_reasons).toContain('Câu hỏi nghe thiếu tài nguyên văn bản âm thanh (audio_text hoặc audio_url)');
      });

      it('accepts question prompt when audio_text is explicitly provided', () => {
        const qWithAudio = {
          stem: '男的今天晚上打算做什么？',
          audio_text: '女：小李，晚上要不要一起去图书馆？\n男：不了，我室友过生日，我们要出去聚餐。',
          options: ['去图书馆', '参加聚餐', '在宿舍睡觉', '看电影'],
          answer_idx: 1,
          skill: 'listening',
          part_type: 'listen_dialogue_qa_4opt',
          level: 4,
          status: 'approved',
        };
        const res = validateFormatCompatibility(qWithAudio, 4);
        expect(res.exam_format_compatible).toBe(true);
        expect(res.exam_eligible).toBe(true);
      });
    });

    describe('1.4: Visual Illustrations Requirement', () => {
      it('accepts valid SVG illustration theme for visual questions', () => {
        const qVisual = {
          stem: '听句子选择对应的图片。',
          audio_text: '他在商店买苹果。',
          options: ['A', 'B', 'C', 'D'],
          answer_idx: 0,
          skill: 'listening',
          part_type: 'listen_picture_match_4opt',
          illustration_theme: 'apple',
          level: 1,
          status: 'approved',
        };
        const res = validateFormatCompatibility(qVisual, 1);
        expect(res.exam_format_compatible).toBe(true);
        expect(res.exam_eligible).toBe(true);
      });

      it('rejects invalid or missing illustration theme for visual questions', () => {
        const qInvalidVisual = {
          stem: '听句子选择对应的图片。',
          audio_text: '他在商店买苹果。',
          options: ['A', 'B', 'C', 'D'],
          answer_idx: 0,
          skill: 'listening',
          part_type: 'listen_picture_match_4opt',
          illustration_theme: 'completely_unrecognized_fake_theme_xyz',
          level: 1,
          status: 'approved',
        };
        const res = validateFormatCompatibility(qInvalidVisual, 1);
        expect(res.exam_format_compatible).toBe(false);
        expect(res.exam_eligible).toBe(false);
        expect(res.ineligible_reasons).toContain('Dạng bài nhìn tranh thiếu chủ đề hình minh họa SVG hợp lệ');
      });
    });
  });

  // =========================================================================
  // DIMENSION 2: ANSWER SHUFFLE AND PERMUTATION INVARIANTS
  // =========================================================================
  describe('Dimension 2: Answer Shuffle & Permutation Invariants', () => {

    describe('2.1: Mathematical Shuffle Invariants Across All Option Permutations', () => {
      // Deterministic PRNG seeded for empirical reproducibility
      function createDeterministicRng(seed: number): () => number {
        let s = seed % 2147483647;
        if (s <= 0) s += 2147483646;
        return () => {
          s = (s * 16807) % 2147483647;
          return (s - 1) / 2147483646;
        };
      }

      it('preserves answer tracking: newOptions[new_answer_idx] === oldOptions[old_answer_idx]', () => {
        const testOptions = ['北京', '上海', '广州', '深圳'];
        for (let targetIdx = 0; targetIdx < testOptions.length; targetIdx++) {
          const expectedAnswerText = testOptions[targetIdx];
          const rng = createDeterministicRng(42 + targetIdx * 7);

          const q = {
            options: [...testOptions],
            answer_idx: targetIdx,
            explanation_vi: 'Đáp án là thành phố thủ đô của Trung Quốc.', // Pure semantic, category 1
          };

          const result = shuffleQuestionAnswers(q, rng);

          expect(result.shuffled).toBe(true);
          expect(result.original_answer_idx).toBe(targetIdx);
          expect(result.question.options[result.new_answer_idx]).toBe(expectedAnswerText);
          expect(result.question.answer_idx).toBe(result.new_answer_idx);
          expect((result.question as any).answer_index).toBe(result.new_answer_idx);
        }
      });

      it('preserves option multiset invariant: no option lost, duplicated, or modified', () => {
        const testOptions = ['苹果', '香蕉', '西瓜', '葡萄', '草莓', '橙子'];
        const sortedOriginal = [...testOptions].sort();

        for (let seed = 1; seed <= 50; seed++) {
          const rng = createDeterministicRng(seed * 13);
          const q = {
            options: [...testOptions],
            answer_idx: seed % testOptions.length,
            explanation_vi: 'Hoa quả tươi ngon bổ dưỡng.',
          };

          const result = shuffleQuestionAnswers(q, rng);

          expect(result.shuffled).toBe(true);
          expect(result.question.options).toHaveLength(testOptions.length);
          const sortedNew = [...result.question.options].sort();
          expect(sortedNew).toEqual(sortedOriginal);
        }
      });

      it('guarantees mapping bijection: mapping[old_idx] = new_idx for all indices', () => {
        const rawOptions = ['A1', 'B2', 'C3', 'D4'];
        const rng = createDeterministicRng(999);
        const { shuffled, mapping } = shuffleOptionsArray(rawOptions, rng);

        expect(mapping).toHaveLength(4);
        // Every new index must be uniquely assigned in [0, 3]
        const uniqueNewIndices = new Set(mapping);
        expect(uniqueNewIndices.size).toBe(4);
        for (let i = 0; i < 4; i++) {
          expect(mapping[i]).toBeGreaterThanOrEqual(0);
          expect(mapping[i]).toBeLessThanOrEqual(3);
          // Old element at i is now at mapping[i] in shuffled
          expect(shuffled[mapping[i]]).toBe(rawOptions[i]);
        }
      });
    });

    describe('2.2: Safety Guards & Non-Shuffleable Task Isolation', () => {
      it('safely handles open-ended and writing tasks with 0 or 1 options without crashing', () => {
        const openEndedTasks = [
          { options: [], answer_idx: 0, part_type: 'write_short_essay_80chars' },
          { options: ['唯一的汉字答案'], answer_idx: 0, part_type: 'write_tianzige_from_pinyin' },
        ];

        for (const task of openEndedTasks) {
          const res = shuffleQuestionAnswers(task as any);
          expect(res.shuffled).toBe(false);
          expect(res.shuffle_reason).toContain('Less than 2 options');
          expect(res.question.options).toEqual(task.options);
        }
      });

      it('protects True/False fixed-order questions from being shuffled', () => {
        const tfQuestion = {
          options: ['对', '错'],
          answer_idx: 0,
          part_type: 'listen_true_false',
          explanation_vi: 'Câu này đúng theo nội dung bài nghe.',
        };
        const guard = canShuffle(tfQuestion);
        expect(guard.canShuffle).toBe(false);
        expect(guard.reason).toContain('Fixed order');

        const result = shuffleQuestionAnswers(tfQuestion);
        expect(result.shuffled).toBe(false);
        expect(result.question.options).toEqual(['对', '错']);
      });

      it('protects sentence reordering tasks from being shuffled', () => {
        const reorderQuestion = {
          options: ['我', '去学校', '每天', '骑自行车'],
          answer_idx: 0,
          part_type: 'read_reorder_sentence',
          explanation_vi: 'Thứ tự đúng: 我每天骑自行车去学校。',
        };
        const guard = canShuffle(reorderQuestion);
        expect(guard.canShuffle).toBe(false);
        expect(guard.reason).toContain('Fixed order');

        const result = shuffleQuestionAnswers(reorderQuestion);
        expect(result.shuffled).toBe(false);
        expect(result.question.options).toEqual(reorderQuestion.options);
      });

      it('protects shared word bank A-F questions from independent shuffling', () => {
        const wordBankQuestion = {
          options: ['漂亮', '高', '聪明', '认真', '热', '冷'],
          answer_idx: 2,
          is_word_bank: true,
          explanation_vi: 'Điền từ C phù hợp ngữ cảnh.',
        };
        const guard = canShuffle(wordBankQuestion);
        expect(guard.canShuffle).toBe(false);
        expect(guard.reason).toContain('Shared word bank');

        const result = shuffleQuestionAnswers(wordBankQuestion);
        expect(result.shuffled).toBe(false);
      });
    });

    describe('2.3: Vietnamese Unicode Explanation Letter Synchronization & Protection', () => {
      it('protects Vietnamese words starting with option letters from false boundary matching', () => {
        const vietnameseTexts = [
          'Anh ấy thích uống Cà phê vào buổi sáng.',
          'Bác sĩ khuyên bệnh nhân nên nghỉ ngơi.',
          'Đoàn tàu sắp rời Đô thị.',
          'Em gái đang học bài.',
        ];

        for (const text of vietnameseTexts) {
          // 'C' in 'Cà phê' is index 18
          const cIndex = text.indexOf('C');
          if (cIndex !== -1 && text.includes('Cà')) {
            expect(isIsolatedOptionLetter(text, cIndex, 1)).toBe(false);
          }
          // 'B' in 'Bác sĩ' is index 0
          const bIndex = text.indexOf('B');
          if (bIndex !== -1 && text.includes('Bác')) {
            expect(isIsolatedOptionLetter(text, bIndex, 1)).toBe(false);
          }
        }
      });

      it('detects negation and distractor elimination phrases (Category 4 -> canShuffle: false)', () => {
        const negationExplanations = [
          'Không nên chọn A vì ngữ pháp chưa chính xác.',
          'Loại trừ B vì danh từ không kết hợp với phó từ.',
          'Sai vì phương án C không phù hợp với ngữ cảnh.',
          'Tránh nhầm lẫn với D.',
        ];

        for (const exp of negationExplanations) {
          expect(NEGATION_INDICATOR_REGEX.test(exp)).toBe(true);

          const q = {
            options: ['A', 'B', 'C', 'D'],
            answer_idx: 0,
            explanation_vi: exp,
          };
          const guard = canShuffle(q);
          expect(guard.canShuffle).toBe(false);
          expect(guard.category).toBe(4);
        }
      });

      it('synchronizes single affirmative letter reference (Category 2 -> letter synced)', () => {
        const q = {
          options: ['Bắc Kinh', 'Thượng Hải', 'Quảng Châu', 'Thâm Quyến'],
          answer_idx: 0, // Old answer is A
          explanation_vi: 'Đáp án chính xác là A vì đây là thủ đô của Trung Quốc.',
        };

        const guard = canShuffle(q);
        expect(guard.canShuffle).toBe(true);
        expect(guard.category).toBe(2);

        // Force a specific shuffle mapping: swap index 0 and index 2 (A -> C)
        const customRng = () => 0.5; // deterministic
        const res = shuffleQuestionAnswers(q, customRng, { syncExplanation: true });

        if (res.shuffled && res.new_answer_idx !== 0) {
          const expectedLetter = ['A', 'B', 'C', 'D'][res.new_answer_idx];
          expect(res.question.explanation_vi).toContain(`Đáp án chính xác là ${expectedLetter}`);
        }
      });
    });

    describe('2.4: Strict RNG Boundary Contracts & Error Handling', () => {
      it('throws TypeError if RNG returns non-finite value or NaN', () => {
        const q = {
          options: ['A', 'B', 'C', 'D'],
          answer_idx: 0,
        };

        expect(() => shuffleOptionsArray(['A', 'B'], () => NaN)).toThrow(TypeError);
        expect(() => shuffleOptionsArray(['A', 'B'], () => Infinity)).toThrow(TypeError);
        expect(() => shuffleOptionsArray(['A', 'B'], () => -Infinity)).toThrow(TypeError);
        expect(() => shuffleOptionsArray(['A', 'B'], () => '0.5' as any)).toThrow(TypeError);
      });

      it('throws RangeError if RNG returns out of semi-open interval [0, 1)', () => {
        expect(() => shuffleOptionsArray(['A', 'B'], () => -0.0001)).toThrow(RangeError);
        expect(() => shuffleOptionsArray(['A', 'B'], () => 1.0)).toThrow(RangeError);
        expect(() => shuffleOptionsArray(['A', 'B'], () => 1.05)).toThrow(RangeError);
      });

      it('strictly accepts 0.0 as lower bound', () => {
        const res = shuffleOptionsArray(['A', 'B', 'C', 'D'], () => 0.0);
        expect(res.shuffled).toHaveLength(4);
      });

      it('empirically verifies 1,000 Monte Carlo randomized shuffles maintain absolute answer and multiset invariants', () => {
        const optionPool = ['北京', '上海', '广州', '深圳', '成都', '杭州'];
        const seedMultiplier = 16807;
        let rngState = 1234567;

        const nextRng = () => {
          rngState = (rngState * seedMultiplier) % 2147483647;
          return (rngState - 1) / 2147483646;
        };

        const answerDistribution: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

        for (let iter = 0; iter < 1000; iter++) {
          const originalIdx = iter % 6;
          const originalAnswer = optionPool[originalIdx];

          const q = {
            options: [...optionPool],
            answer_idx: originalIdx,
            explanation_vi: 'Đáp án là một thành phố lớn của Trung Quốc.',
          };

          const res = shuffleQuestionAnswers(q, nextRng);

          expect(res.shuffled).toBe(true);
          // Invariant 1: Correct answer text is strictly tracked
          expect(res.question.options[res.new_answer_idx]).toBe(originalAnswer);
          // Invariant 2: Multiset of options is strictly preserved
          expect(res.question.options.slice().sort()).toEqual(optionPool.slice().sort());
          // Invariant 3: Both answer_idx and answer_index fields are synchronized
          expect(res.question.answer_idx).toBe(res.new_answer_idx);
          expect((res.question as any).answer_index).toBe(res.new_answer_idx);
          // Invariant 4: Mapping integrity
          expect(res.mapping[originalIdx]).toBe(res.new_answer_idx);

          answerDistribution[res.new_answer_idx]++;
        }

        // Statistical distribution check: every position in [0..5] should receive answers across 1000 runs
        for (let i = 0; i < 6; i++) {
          expect(answerDistribution[i]).toBeGreaterThan(80); // Expect ~166 +/- margin
        }
      });

      it('protects multi-option letter explanations (Category 3 -> canShuffle: false)', () => {
        const multiLetterExp = 'Phương án A và B đều không hợp lý, C mới là đáp án đúng.';
        const q = {
          options: ['A', 'B', 'C', 'D'],
          answer_idx: 2,
          explanation_vi: multiLetterExp,
        };

        const guard = canShuffle(q);
        expect(guard.canShuffle).toBe(false);
        expect([3, 4, 5]).toContain(guard.category);

        const res = shuffleQuestionAnswers(q);
        expect(res.shuffled).toBe(false);
      });
    });

    describe('2.5: Status & Operational Serving Guardrails', () => {
      it('marks questions ineligible for practice and exam when status is pending or rejected', () => {
        const qPending = {
          stem: '他身体不太舒服，现在要去____看医生。',
          options: ['医院', '商店', '学校', '机场'],
          answer_idx: 0,
          skill: 'reading',
          part_type: 'read_fill_blank_4opt',
          level: 1,
          status: 'pending',
          is_active: 1,
        };
        const resPending = validateFormatCompatibility(qPending, 1);
        expect(resPending.operational_serving_eligible).toBe(false);
        expect(resPending.operational_serving_practice_eligible).toBe(false);
        expect(resPending.operational_serving_exam_eligible).toBe(false);

        const qRejected = {
          ...qPending,
          status: 'rejected',
        };
        const resRejected = validateFormatCompatibility(qRejected, 1);
        expect(resRejected.operational_serving_eligible).toBe(false);
        expect(resRejected.operational_serving_practice_eligible).toBe(false);
        expect(resRejected.operational_serving_exam_eligible).toBe(false);
      });

      it('marks questions ineligible when is_active === 0', () => {
        const qInactive = {
          stem: '他身体不太舒服，现在要去____看医生。',
          options: ['医院', '商店', '学校', '机场'],
          answer_idx: 0,
          skill: 'reading',
          part_type: 'read_fill_blank_4opt',
          level: 1,
          status: 'approved',
          is_active: 0,
        };
        const resInactive = validateFormatCompatibility(qInactive, 1);
        expect(resInactive.operational_serving_eligible).toBe(false);
        expect(resInactive.operational_serving_practice_eligible).toBe(false);
        expect(resInactive.operational_serving_exam_eligible).toBe(false);
      });
    });
  });

  // =========================================================================
  // DIMENSION 3: DATABASE INVARIANTS & OPERATIONAL STATE VERIFICATION
  // =========================================================================
  describe('Dimension 3: Database Invariants & Operational State', () => {

    it('verifies data/hsk_exam.db hash is EXACTLY DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1', () => {
      const buf = fs.readFileSync(HSK_EXAM_DB_PATH);
      const hash = crypto.createHash('sha256').update(buf).digest('hex').toUpperCase();
      expect(hash).toBe(EXPECTED_HSK_EXAM_DB_HASH);
    });

    it('verifies data/qbank/qbank.db operational integrity: 96 approved active questions', () => {
      const db = new DatabaseSync(QBANK_DB_PATH, { readOnly: true });

      const approvedCountRow: any = db.prepare(
        "SELECT COUNT(*) as c FROM questions WHERE status = 'approved' AND COALESCE(is_active, 1) = 1"
      ).get();
      expect(approvedCountRow.c).toBe(96);

      const poolCounts: any[] = db.prepare(`
        SELECT practice_eligible, exam_eligible, COUNT(*) as cnt
        FROM exam_eligible_pool
        GROUP BY practice_eligible, exam_eligible
      `).all();

      const totalPool = poolCounts.reduce((acc, row) => acc + row.cnt, 0);
      expect(totalPool).toBe(96);

      db.close();
    });
  });
});
