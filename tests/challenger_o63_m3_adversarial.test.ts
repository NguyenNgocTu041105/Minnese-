import { describe, it, expect } from 'vitest';
import { isOptionCountCompatible, validateFormatCompatibility } from '../src/server/qbankFormatSync.js';
import { isCompatiblePartType } from '../src/server/qbankCoverageEngine.js';
import { normalizeQuestionAliases } from '../src/server/llm/jsonParser.js';
import { validateQuestionLanguageQuality, validateCandidate } from '../src/server/llm/questionValidator.js';
import type { CandidateQuestion } from '../src/server/llm/types.js';

describe('Adversarial Stress Testing — Milestone M3 (Nhóm C)', () => {
  // =========================================================================
  // 1. Option Count Flexibility (isOptionCountCompatible) Stress Matrix
  // =========================================================================
  describe('Dimension 1: Option Count Flexibility (isOptionCountCompatible)', () => {
    describe('1.1 Open-ended writing tasks (requiredOptions === 0)', () => {
      const zeroOptionWritingParts = [
        'write_short_essay_80chars',
        'write_sentence_from_picture_word',
        'write_tianzige_from_pinyin',
        'write_topic_essay_200chars',
        'write_summary_shortening_400chars',
      ];

      for (const bp of zeroOptionWritingParts) {
        it(`accepts exactly 0 options for ${bp}`, () => {
          expect(isOptionCountCompatible(bp, 0, 0)).toBe(true);
        });

        it(`rejects non-zero option counts for ${bp}`, () => {
          for (const count of [1, 2, 3, 4, 5, 6, 7, 8, -1]) {
            expect(isOptionCountCompatible(bp, 0, count)).toBe(false);
          }
        });
      }
    });

    describe('1.2 Reordering / sentence ordering tasks', () => {
      const reorderParts = [
        'read_reorder_sentence',
        'read_paragraph_sentence_ordering',
        'write_sentence_reorder',
      ];

      for (const bp of reorderParts) {
        it(`flexibly permits varied option counts for reordering part ${bp}`, () => {
          expect(isOptionCountCompatible(bp, 4, 0)).toBe(true);
          expect(isOptionCountCompatible(bp, 4, 4)).toBe(true);
          expect(isOptionCountCompatible(bp, 5, 4)).toBe(true);
          expect(isOptionCountCompatible(bp, 5, 5)).toBe(true);
          expect(isOptionCountCompatible(bp, 4, 6)).toBe(true);
        });
      }
    });

    describe('1.3 3-option parts (listening QA, picture match, reading comprehension)', () => {
      const threeOptParts = [
        'listen_dialogue_qa_3opt',
        'listen_picture_match_3opt',
        'read_comprehension_short_3opt',
        'listen_monologue_qa_3opt',
        'read_comprehension_short_and_medium_3opt',
      ];

      for (const bp of threeOptParts) {
        it(`accepts exactly 3 options for ${bp}`, () => {
          expect(isOptionCountCompatible(bp, 3, 3)).toBe(true);
        });

        it(`accepts 4 options as pedagogical substitute for 3-option part ${bp}`, () => {
          expect(isOptionCountCompatible(bp, 3, 4)).toBe(true);
        });

        it(`rejects invalid boundary counts (0, 1, 2, 5, 6, 7) for ${bp}`, () => {
          for (const count of [0, 1, 2, 5, 6, 7, 8, -1]) {
            expect(isOptionCountCompatible(bp, 3, count)).toBe(false);
          }
        });
      }
    });

    describe('1.4 6-option word-bank, picture-match, and fill-blank parts', () => {
      const sixOptFlexibleParts = [
        'read_fill_blank_word_bank_6opt',
        'read_fill_blank_word_bank_split',
        'listen_dialogue_picture_match_6opt',
        'read_sentence_picture_match_6opt',
      ];

      for (const bp of sixOptFlexibleParts) {
        it(`accepts 4, 5, or 6 options for ${bp}`, () => {
          expect(isOptionCountCompatible(bp, 6, 6)).toBe(true);
          expect(isOptionCountCompatible(bp, 6, 5)).toBe(true);
          expect(isOptionCountCompatible(bp, 6, 4)).toBe(true);
        });

        it(`rejects boundary counts (0, 1, 2, 3, 7, 8) for ${bp}`, () => {
          for (const count of [0, 1, 2, 3, 7, 8, -1]) {
            expect(isOptionCountCompatible(bp, 6, count)).toBe(false);
          }
        });
      }
    });

    describe('1.5 6-option non-word-bank / non-picture parts (strict 6 options)', () => {
      const bp = 'write_component_assembly_6opt';

      it('accepts strictly 6 options when required', () => {
        expect(isOptionCountCompatible(bp, 6, 6)).toBe(true);
      });

      it('rejects 4 or 5 options for non-word-bank 6-option parts', () => {
        expect(isOptionCountCompatible(bp, 6, 4)).toBe(false);
        expect(isOptionCountCompatible(bp, 6, 5)).toBe(false);
        expect(isOptionCountCompatible(bp, 6, 0)).toBe(false);
        expect(isOptionCountCompatible(bp, 6, 7)).toBe(false);
      });
    });

    describe('1.6 4-option multiple choice parts (strict 4 options)', () => {
      const fourOptParts = [
        'read_fill_blank_4opt',
        'read_cloze_passages_4opt',
        'read_comprehension_passages_4opt',
        'listen_dialogue_qa_4opt',
        'listen_passage_qa_4opt',
        'read_find_faulty_sentence_4opt',
      ];

      for (const bp of fourOptParts) {
        it(`accepts strictly 4 options for ${bp}`, () => {
          expect(isOptionCountCompatible(bp, 4, 4)).toBe(true);
        });

        it(`rejects 0, 1, 2, 3, 5, 6, 7 options for ${bp}`, () => {
          for (const count of [0, 1, 2, 3, 5, 6, 7, 8, -1]) {
            expect(isOptionCountCompatible(bp, 4, count)).toBe(false);
          }
        });
      }
    });
  });

  // =========================================================================
  // 2. Cloze vs Fill-in-the-Blank Part Type Matching (isCompatiblePartType)
  // =========================================================================
  describe('Dimension 2: Cloze vs Fill-in-Blank Compatibility Across HSK 1-6 Reading Parts', () => {
    describe('2.1 HSK 5/6 4-option Cloze Passages Bidirectional Matching', () => {
      it('matches read_cloze_passages_4opt with read_fill_blank_4opt bidirectionally', () => {
        expect(isCompatiblePartType('read_cloze_passages_4opt', 'read_fill_blank_4opt')).toBe(true);
        expect(isCompatiblePartType('read_fill_blank_4opt', 'read_cloze_passages_4opt')).toBe(true);
      });

      it('matches read_cloze_passages_4opt with generic fill_blank', () => {
        expect(isCompatiblePartType('read_cloze_passages_4opt', 'fill_blank')).toBe(true);
        expect(isCompatiblePartType('fill_blank', 'read_cloze_passages_4opt')).toBe(true);
      });

      it('rejects read_cloze_passages_4opt with 6-option word bank parts (option count mismatch)', () => {
        expect(isCompatiblePartType('read_cloze_passages_4opt', 'read_fill_blank_word_bank_6opt')).toBe(false);
        expect(isCompatiblePartType('read_fill_blank_word_bank_6opt', 'read_cloze_passages_4opt')).toBe(false);
      });

      it('rejects read_cloze_passages_4opt with 3-option reading comprehension parts', () => {
        expect(isCompatiblePartType('read_cloze_passages_4opt', 'read_comprehension_short_3opt')).toBe(false);
        expect(isCompatiblePartType('read_cloze_passages_4opt', 'read_comprehension_short_and_medium_3opt')).toBe(false);
      });

      it('rejects read_cloze_passages_4opt with error detection (faulty sentence) parts', () => {
        expect(isCompatiblePartType('read_cloze_passages_4opt', 'read_find_faulty_sentence_4opt')).toBe(false);
        expect(isCompatiblePartType('read_find_faulty_sentence_4opt', 'read_cloze_passages_4opt')).toBe(false);
      });

      it('rejects read_cloze_passages_4opt with writing essay parts', () => {
        expect(isCompatiblePartType('read_cloze_passages_4opt', 'write_short_essay_80chars')).toBe(false);
      });
    });

    describe('2.2 HSK 1-4 Word Bank Parts Cross-Matching', () => {
      it('matches HSK 1/2 word bank 6opt with HSK 3/4 word bank split', () => {
        expect(isCompatiblePartType('read_fill_blank_word_bank_6opt', 'read_fill_blank_word_bank_split')).toBe(true);
        expect(isCompatiblePartType('read_fill_blank_word_bank_split', 'read_fill_blank_word_bank_6opt')).toBe(true);
      });

      it('matches HSK 1/2 word bank 6opt with read_fill_blank_4opt (both are fill_blank)', () => {
        expect(isCompatiblePartType('read_fill_blank_word_bank_6opt', 'read_fill_blank_4opt')).toBe(true);
        expect(isCompatiblePartType('read_fill_blank_4opt', 'read_fill_blank_word_bank_6opt')).toBe(true);
      });
    });

    describe('2.3 Boundary and Degenerate Part Type Inputs', () => {
      it('returns false for empty or whitespace strings', () => {
        expect(isCompatiblePartType('', '')).toBe(false);
        expect(isCompatiblePartType('read_fill_blank_4opt', '')).toBe(false);
        expect(isCompatiblePartType('', 'read_fill_blank_4opt')).toBe(false);
        expect(isCompatiblePartType('   ', 'read_fill_blank_4opt')).toBe(false);
      });

      it('handles null/undefined gracefully', () => {
        expect(isCompatiblePartType(null as any, 'read_fill_blank_4opt')).toBe(false);
        expect(isCompatiblePartType('read_fill_blank_4opt', undefined as any)).toBe(false);
      });

      it('is case-insensitive', () => {
        expect(isCompatiblePartType('READ_CLOZE_PASSAGES_4OPT', 'READ_FILL_BLANK_4OPT')).toBe(true);
        expect(isCompatiblePartType('read_cloze_passages_4opt', 'READ_FILL_BLANK_4OPT')).toBe(true);
      });
    });
  });

  // =========================================================================
  // 3. completed_stem Validation (Empty, Whitespace, Missing, Placeholders)
  // =========================================================================
  describe('Dimension 3: completed_stem Validation Under Adversarial Inputs', () => {
    describe('3.1 Missing completed_stem (undefined)', () => {
      it('rejects candidate when completed_stem is explicitly undefined on MCQ', () => {
        const candidate: CandidateQuestion = {
          stem: '我想喝____。',
          completed_stem: undefined,
          raw_completed_stem: undefined,
          canonical_completed_stem: undefined,
          options: ['水', '茶', '苹果', '飞机'],
          answer_idx: 0,
          level: 1,
          skill: 'reading',
          part_type: 'read_fill_blank_4opt',
          explanation_vi: 'Đáp án: 水 (nước).',
          pinyin: 'wǒ xiǎng hē shuǐ .',
        };

        const errors = validateQuestionLanguageQuality(candidate);
        expect(errors.some((e) => e.includes('completed_stem is required'))).toBe(true);
      });

      it('reconstructs canonical_completed_stem when omitted by model in normalizeQuestionAliases', () => {
        const rawModelOutput = {
          stem: '小明今天去____。',
          // completed_stem omitted by provider
          options: ['学校', '苹果', '飞机', '医生'],
          answer_idx: 0,
          level: 1,
          skill: 'reading',
          part_type: 'read_fill_blank_4opt',
          explanation_vi: 'Đáp án đúng: 学校 (trường học).',
        };

        const parsed = normalizeQuestionAliases(rawModelOutput, 1, 'reading', false);
        expect(parsed).not.toBeNull();
        expect(parsed!.raw_completed_stem).toBeUndefined();
        expect(parsed!.canonical_completed_stem).toBe('小明今天去学校。');
        expect(parsed!.completed_stem).toBe('小明今天去学校。');

        const errors = validateQuestionLanguageQuality(parsed!);
        expect(errors.some((e) => e.includes('completed_stem'))).toBe(false);
      });
    });

    describe('3.2 Empty string completed_stem ("")', () => {
      it('rejects candidate when completed_stem is an empty string', () => {
        const candidate: CandidateQuestion = {
          stem: '我想喝____。',
          completed_stem: '',
          raw_completed_stem: '',
          canonical_completed_stem: '我想喝水。',
          options: ['水', '茶', '苹果', '飞机'],
          answer_idx: 0,
          level: 1,
          skill: 'reading',
          part_type: 'read_fill_blank_4opt',
          explanation_vi: 'Đáp án: 水.',
          pinyin: 'wǒ xiǎng hē shuǐ .',
        };

        const errors = validateQuestionLanguageQuality(candidate);
        expect(errors.some((e) => e.includes('completed_stem must not be empty'))).toBe(true);
      });

      it('rejects candidate when raw_completed_stem is empty string even if completed_stem was filled', () => {
        const candidate: CandidateQuestion = {
          stem: '我想喝____。',
          completed_stem: '我想喝水。',
          raw_completed_stem: '', // Model output was empty string!
          canonical_completed_stem: '我想喝水。',
          options: ['水', '茶', '苹果', '飞机'],
          answer_idx: 0,
          level: 1,
          skill: 'reading',
          part_type: 'read_fill_blank_4opt',
          explanation_vi: 'Đáp án: 水.',
          pinyin: 'wǒ xiǎng hē shuǐ .',
        };

        const errors = validateQuestionLanguageQuality(candidate);
        expect(errors.some((e) => e.includes('completed_stem must not be empty'))).toBe(true);
      });
    });

    describe('3.3 Whitespace-only completed_stem', () => {
      it('rejects whitespace-only completed_stem ("   ")', () => {
        const candidate: CandidateQuestion = {
          stem: '我想喝____。',
          completed_stem: '   \t  \n ',
          raw_completed_stem: '   ',
          canonical_completed_stem: '我想喝水。',
          options: ['水', '茶', '苹果', '飞机'],
          answer_idx: 0,
          level: 1,
          skill: 'reading',
          part_type: 'read_fill_blank_4opt',
          explanation_vi: 'Đáp án: 水.',
          pinyin: 'wǒ xiǎng hē shuǐ .',
        };

        const errors = validateQuestionLanguageQuality(candidate);
        expect(errors.some((e) => e.includes('completed_stem must not be empty'))).toBe(true);
      });

      it('rejects candidate when raw_completed_stem is whitespace-only', () => {
        const candidate: CandidateQuestion = {
          stem: '我想喝____。',
          completed_stem: '我想喝水。',
          raw_completed_stem: '   ',
          canonical_completed_stem: '我想喝水。',
          options: ['水', '茶', '苹果', '飞机'],
          answer_idx: 0,
          level: 1,
          skill: 'reading',
          part_type: 'read_fill_blank_4opt',
          explanation_vi: 'Đáp án: 水.',
          pinyin: 'wǒ xiǎng hē shuǐ .',
        };

        const errors = validateQuestionLanguageQuality(candidate);
        expect(errors.some((e) => e.includes('completed_stem must not be empty'))).toBe(true);
      });
    });

    describe('3.4 Blank placeholder retention in completed_stem', () => {
      const placeholderVariations = [
        '我想喝____。',
        '我想喝_____。',
        '我想喝(   )。',
        '我想喝（   ）。',
        '我想喝【   】。',
        '我想喝[   ]。',
      ];

      for (const ph of placeholderVariations) {
        it(`rejects completed_stem containing placeholder "${ph}"`, () => {
          const candidate: CandidateQuestion = {
            stem: '我想喝____。',
            completed_stem: ph,
            raw_completed_stem: ph,
            canonical_completed_stem: ph,
            options: ['水', '茶', '苹果', '飞机'],
            answer_idx: 0,
            level: 1,
            skill: 'reading',
            part_type: 'read_fill_blank_4opt',
            explanation_vi: 'Đáp án: 水.',
            pinyin: 'wǒ xiǎng hē shuǐ .',
          };

          const errors = validateQuestionLanguageQuality(candidate);
          expect(errors.some((e) => e.includes('completed_stem contains unreplaced blank placeholder'))).toBe(true);
        });
      }
    });

    describe('3.5 Open-ended writing tasks bypass multiple-choice completed_stem requirement', () => {
      it('does NOT require completed_stem for write_sentence_from_picture_word', () => {
        const writingCandidate: CandidateQuestion = {
          stem: '看图并结合词语写一句话：【打扫】。',
          options: [],
          answer_idx: 0,
          level: 4,
          skill: 'writing',
          part_type: 'write_sentence_from_picture_word',
          explanation_vi: 'Ví dụ câu đúng: 他正在打扫房间。',
          pinyin: 'kàn tú bìng jié hé cí yǔ xiě yí jù huà dǎ sǎo .',
        };

        const errors = validateQuestionLanguageQuality(writingCandidate);
        expect(errors.some((e) => e.includes('completed_stem is required'))).toBe(false);
      });

      it('does NOT require completed_stem for write_short_essay_80chars', () => {
        const essayCandidate: CandidateQuestion = {
          stem: '请结合以下5个词语写一篇80字左右的短文：[缓解, 压力, 措施, 积极, 效果]。',
          options: [],
          answer_idx: 0,
          level: 5,
          skill: 'writing',
          part_type: 'write_short_essay_80chars',
          explanation_vi: 'Gợi ý bài viết HSK 5.',
          pinyin: null,
        };

        const errors = validateQuestionLanguageQuality(essayCandidate);
        expect(errors.some((e) => e.includes('completed_stem is required'))).toBe(false);
      });
    });
  });

  // =========================================================================
  // 4. End-to-End Format Compatibility via validateFormatCompatibility
  // =========================================================================
  describe('Dimension 4: Integration with validateFormatCompatibility', () => {
    it('HSK 5 fill-in-blank question qualifies for read_cloze_passages_4opt blueprint part', () => {
      const q = {
        id: 'test_hsk5_cloze_1',
        level: 5,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
        stem: '在现代社会中，保持积极的心态对工作和生活都至关____。',
        options: ['重要', '繁重', '深刻', '明显'],
        answer_idx: 0,
        explanation_vi: 'Đáp án: 重要.',
        status: 'approved',
        is_active: 1,
        quality_status: 'PASS',
      };

      const result = validateFormatCompatibility(q, 5);
      expect(result.practice_eligible).toBe(true);
      expect(result.exam_eligible).toBe(true);
      expect(result.compatible_formats).toContain('read_cloze_passages_4opt');
      expect(result.ineligible_reasons).toHaveLength(0);
    });

    it('HSK 1 fill-in-blank question with 5 options qualifies for 6-word-bank blueprint part', () => {
      const q = {
        id: 'test_hsk1_wb_1',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_word_bank_6opt',
        stem: '我想去学校____书。',
        options: ['看', '吃', '喝', '去', '叫'], // 5 options (pedagogically flexible substitute for 6)
        answer_idx: 0,
        explanation_vi: 'Đáp án: 看.',
        status: 'approved',
        is_active: 1,
        quality_status: 'PASS',
      };

      const result = validateFormatCompatibility(q, 1);
      expect(result.practice_eligible).toBe(true);
      expect(result.exam_eligible).toBe(true);
      expect(result.compatible_formats).toContain('read_fill_blank_word_bank_6opt');
      expect(result.ineligible_reasons).toHaveLength(0);
    });

    it('HSK 1 question with 2 options FAILS option count check for 6-word-bank blueprint part', () => {
      const q = {
        id: 'test_hsk1_wb_under',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_word_bank_6opt',
        stem: '我想去学校____书。',
        options: ['看', '吃'], // Only 2 options!
        answer_idx: 0,
        explanation_vi: 'Đáp án: 看.',
        status: 'approved',
        is_active: 1,
        quality_status: 'PASS',
      };

      const result = validateFormatCompatibility(q, 1);
      expect(result.exam_eligible).toBe(false);
      expect(result.ineligible_reasons.some((r) => r.includes('yêu cầu chính xác 6 phương án'))).toBe(true);
    });
  });
});
