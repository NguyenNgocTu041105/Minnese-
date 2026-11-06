/**
 * Empirical Stress Test Harness for Milestone M1 Edge Cases (challenger_m1_2)
 *
 * Verifies:
 * 1. Stems containing bracketed keywords with pinyin: [huǎn jiě], 【dǎ sǎo】, tones, diacritics
 *    -> Gate 1 Latin check passes with zero Latin errors.
 * 2. Stems containing forbidden Latin letters outside brackets
 *    -> Gate 1 Latin check strictly rejects with 'stem contains invalid Latin or Vietnamese characters'.
 * 3. Component assembly task write_component_assembly_6opt
 *    -> When passed through autoQuestionScheduler intake processing, retains 6 options and is not wiped.
 * 4. Open-ended writing tasks with illustration_theme: null
 *    -> isVisualQuestionType returns false and avoids false SVG / illustration_theme rejections.
 * 5. Invariant integrity: data/hsk_exam.db SHA-256 untouched.
 */

import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import {
  validateCandidate,
  isVisualQuestionType,
  getExpectedOptionCount,
} from '../src/server/llm/questionValidator';
import {
  isOpenEndedWritingTask,
  buildHskPrompt,
} from '../src/server/llm/promptTemplates';
import {
  getPartTypeContract,
  isOpenEndedWritingPartType,
} from '../src/server/llm/partTypeContract';
import { generateAccuratePinyin } from '../src/utils/pinyinEngine';
import { CandidateQuestion } from '../src/server/llm/types';

const EXPECTED_HSK_EXAM_DB_HASH = 'DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1';
const HSK_EXAM_DB_PATH = path.resolve(process.cwd(), 'data/hsk_exam.db');

describe('challenger_m1_2: Empirical Stress Testing for M1 Edge Cases', () => {

  // =========================================================================
  // 1. Bracketed keywords with pinyin: Gate 1 Latin Check
  // =========================================================================
  describe('1. Stems with bracketed keywords & pinyin (Gate 1 Latin check)', () => {
    it('passes Gate 1 Latin check for square bracketed pinyin: [huǎn jiě]', () => {
      const q: any = {
        stem: '请用 [huǎn jiě] 造句。',
        completed_stem: '请用 [huǎn jiě] 造句。',
        options: [],
        answer_idx: 0,
        explanation_summary_vi: 'Yêu cầu đặt câu với từ khóa pinyin.',
        answer_rationale_vi: 'Câu mẫu: 这个方法可以有效缓解压力。',
        explanation_vi: 'Giải thích chi tiết.',
        level: 5,
        skill: 'writing',
        part_type: 'write_sentence_from_picture_word',
        illustration_theme: null,
      };

      const res = validateCandidate(q, []);
      const latinErrors = res.errors.filter((e) => e.includes('Latin') || e.includes('Vietnamese'));
      expect(latinErrors).toEqual([]);
    });

    it('passes Gate 1 Latin check for full-width bracketed pinyin: 【dǎ sǎo】', () => {
      const q: any = {
        stem: '看图并结合词语写一句话：【dǎ sǎo】。',
        completed_stem: '看图并结合词语写一句话：【dǎ sǎo】。',
        options: [],
        answer_idx: 0,
        explanation_summary_vi: 'Yêu cầu đặt câu với từ khóa pinyin.',
        answer_rationale_vi: 'Câu mẫu: 他正在打扫房间。',
        explanation_vi: 'Giải thích chi tiết.',
        level: 4,
        skill: 'writing',
        part_type: 'write_sentence_from_picture_word',
        illustration_theme: null,
      };

      const res = validateCandidate(q, []);
      const latinErrors = res.errors.filter((e) => e.includes('Latin') || e.includes('Vietnamese'));
      expect(latinErrors).toEqual([]);
    });

    it('passes Gate 1 Latin check for multiple bracketed pinyin items in one stem', () => {
      const q: any = {
        stem: '请结合词语 [huǎn jiě] 和 【dǎ sǎo】 写一段话。',
        completed_stem: '请结合词语 [huǎn jiě] 和 【dǎ sǎo】 写一段话。',
        options: [],
        answer_idx: 0,
        explanation_summary_vi: 'Yêu cầu viết đoạn văn.',
        answer_rationale_vi: 'Câu mẫu: 我们通过打扫房间来缓解压力。',
        explanation_vi: 'Giải thích chi tiết.',
        level: 5,
        skill: 'writing',
        part_type: 'write_short_essay_80chars',
        illustration_theme: null,
      };

      const res = validateCandidate(q, []);
      const latinErrors = res.errors.filter((e) => e.includes('Latin') || e.includes('Vietnamese'));
      expect(latinErrors).toEqual([]);
    });

    it('passes Gate 1 Latin check across all 4 tones, neutral tones, and umlauts in brackets', () => {
      const pinyinSamples = [
        '[mā ma]',       // 1st tone
        '[cháng chéng]', // 2nd tone
        '[nǐ hǎo]',      // 3rd tone
        '[zài jiàn]',    // 4th tone
        '[lǘ]',          // 2nd tone ü
        '【nǚ】',        // 3rd tone ü
        '[lǜ sè]',       // 4th tone ü
        '[dǎ sǎo, xǐ yī]', // comma inside
        '[tóng-xué]',    // hyphen inside
        '[Huǎn jiě]',    // capitalized ASCII letter
        '（bāng zhù）',   // full-width parenthesis
        '(kě yǐ)',       // half-width parenthesis
      ];

      for (const pinyin of pinyinSamples) {
        const q: any = {
          stem: `请用 ${pinyin} 写一句话。`,
          completed_stem: `请用 ${pinyin} 写一句话。`,
          options: [],
          answer_idx: 0,
          explanation_summary_vi: 'Yêu cầu đặt câu.',
          answer_rationale_vi: 'Câu mẫu đạt chuẩn.',
          explanation_vi: 'Giải thích chi tiết.',
          level: 4,
          skill: 'writing',
          part_type: 'write_sentence_from_picture_word',
          illustration_theme: null,
        };

        const res = validateCandidate(q, []);
        const latinErrors = res.errors.filter((e) => e.includes('Latin') || e.includes('Vietnamese'));
        expect(latinErrors, `Failed for pinyin sample: ${pinyin}`).toEqual([]);
      }
    });
  });

  // =========================================================================
  // 2. Forbidden Latin letters outside brackets: Must correctly reject
  // =========================================================================
  describe('2. Forbidden Latin letters outside brackets (Gate 1 rejection)', () => {
    it('rejects stem with English text outside brackets: "This is a test 请写汉字"', () => {
      const q: any = {
        stem: 'This is a test 请写汉字',
        completed_stem: 'This is a test 请写汉字',
        options: [],
        answer_idx: 0,
        explanation_summary_vi: 'Yêu cầu viết.',
        answer_rationale_vi: 'Câu mẫu.',
        explanation_vi: 'Giải thích chi tiết.',
        level: 4,
        skill: 'writing',
        part_type: 'write_sentence_from_picture_word',
        illustration_theme: null,
      };

      const res = validateCandidate(q, []);
      expect(res.valid).toBe(false);
      expect(res.errors).toContain('stem contains invalid Latin or Vietnamese characters');
    });

    it('rejects stem with bracketed pinyin BUT English text outside: "This is a test 请用 [huǎn jiě] 造句。"', () => {
      const q: any = {
        stem: 'This is a test 请用 [huǎn jiě] 造句。',
        completed_stem: 'This is a test 请用 [huǎn jiě] 造句。',
        options: [],
        answer_idx: 0,
        explanation_summary_vi: 'Yêu cầu viết.',
        answer_rationale_vi: 'Câu mẫu.',
        explanation_vi: 'Giải thích chi tiết.',
        level: 5,
        skill: 'writing',
        part_type: 'write_sentence_from_picture_word',
        illustration_theme: null,
      };

      const res = validateCandidate(q, []);
      expect(res.valid).toBe(false);
      expect(res.errors).toContain('stem contains invalid Latin or Vietnamese characters');
    });

    it('rejects stem with full-width bracketed pinyin and English outside: "【dǎ sǎo】 Hello world 请写汉字"', () => {
      const q: any = {
        stem: '【dǎ sǎo】 Hello world 请写汉字',
        completed_stem: '【dǎ sǎo】 Hello world 请写汉字',
        options: [],
        answer_idx: 0,
        explanation_summary_vi: 'Yêu cầu viết.',
        answer_rationale_vi: 'Câu mẫu.',
        explanation_vi: 'Giải thích chi tiết.',
        level: 4,
        skill: 'writing',
        part_type: 'write_sentence_from_picture_word',
        illustration_theme: null,
      };

      const res = validateCandidate(q, []);
      expect(res.valid).toBe(false);
      expect(res.errors).toContain('stem contains invalid Latin or Vietnamese characters');
    });

    it('rejects stem with Vietnamese text outside brackets: "Hãy viết câu với từ này: [huǎn jiě]"', () => {
      const q: any = {
        stem: 'Hãy viết câu với từ này: [huǎn jiě]',
        completed_stem: 'Hãy viết câu với từ này: [huǎn jiě]',
        options: [],
        answer_idx: 0,
        explanation_summary_vi: 'Yêu cầu viết.',
        answer_rationale_vi: 'Câu mẫu.',
        explanation_vi: 'Giải thích chi tiết.',
        level: 5,
        skill: 'writing',
        part_type: 'write_sentence_from_picture_word',
        illustration_theme: null,
      };

      const res = validateCandidate(q, []);
      expect(res.valid).toBe(false);
      expect(res.errors).toContain('stem contains invalid Latin or Vietnamese characters');
    });

    it('rejects stem with a single isolated Latin letter outside brackets: "请写一个含有 a 的汉字"', () => {
      const q: any = {
        stem: '请写一个含有 a 的汉字',
        completed_stem: '请写一个含有 a 的汉字',
        options: [],
        answer_idx: 0,
        explanation_summary_vi: 'Yêu cầu viết.',
        answer_rationale_vi: 'Câu mẫu.',
        explanation_vi: 'Giải thích chi tiết.',
        level: 4,
        skill: 'writing',
        part_type: 'write_sentence_from_picture_word',
        illustration_theme: null,
      };

      const res = validateCandidate(q, []);
      expect(res.valid).toBe(false);
      expect(res.errors).toContain('stem contains invalid Latin or Vietnamese characters');
    });

    it('rejects options containing forbidden Latin/English words', () => {
      const q: any = {
        stem: '请选择正确的汉字：',
        completed_stem: '请选择正确的汉字：',
        options: ['木', '口', '日', 'apple'],
        answer_idx: 0,
        explanation_summary_vi: 'Giải thích.',
        answer_rationale_vi: 'Đáp án.',
        explanation_vi: 'Giải thích chi tiết.',
        level: 2,
        skill: 'reading',
        part_type: 'read_comprehension_short_4opt',
        illustration_theme: null,
      };

      const res = validateCandidate(q, []);
      expect(res.valid).toBe(false);
      expect(res.errors).toContain("option 'apple' contains invalid Latin or Vietnamese characters");
    });
  });

  // =========================================================================
  // 3. Component assembly task: write_component_assembly_6opt
  // =========================================================================
  describe('3. Component assembly task write_component_assembly_6opt', () => {
    it('isOpenEndedWritingTask returns false for write_component_assembly_6opt', () => {
      expect(isOpenEndedWritingTask('write_component_assembly_6opt')).toBe(false);
    });

    it('getExpectedOptionCount returns 6 for write_component_assembly_6opt', () => {
      expect(getExpectedOptionCount('write_component_assembly_6opt')).toBe(6);
      expect(getExpectedOptionCount(2, 'write_component_assembly_6opt')).toBe(6);
    });

    it('getPartTypeContract registers write_component_assembly_6opt as generic_mcq with 6 options', () => {
      const contract = getPartTypeContract('write_component_assembly_6opt');
      expect(contract.expectedOptions).toBe(6);
      expect(contract.category).toBe('generic_mcq');
      expect(isOpenEndedWritingPartType('write_component_assembly_6opt')).toBe(false);
    });

    it('scheduler intake logic retains 6 options and generates distractor rationales', () => {
      // Simulate exact scheduler intake processing loop from autoQuestionScheduler.ts:380-427
      const q: CandidateQuestion = {
        stem: '请将以下部件组合成正确的汉字：（____）',
        completed_stem: '',
        options: ['木', '口', '日', '月', '十', '人'],
        answer_idx: 0,
        explanation_vi: '',
        level: 2,
        skill: 'writing',
        part_type: 'write_component_assembly_6opt',
      };

      const part_type = 'write_component_assembly_6opt';

      // 8a. Pre-validation auto-enrichment (autoQuestionScheduler.ts:382-389)
      if (!q.explanation_vi || q.explanation_vi.trim().length < 5) {
        const correctOpt = Array.isArray(q.options) && typeof q.answer_idx === 'number' && q.answer_idx >= 0 && q.answer_idx < q.options.length
          ? q.options[q.answer_idx]
          : '';
        q.explanation_vi = correctOpt
          ? `Đáp án đúng là ${correctOpt}. Phù hợp ngữ cảnh câu.`
          : 'Đáp án chính xác theo ngữ cảnh câu.';
      }

      // Completed stem replacement (autoQuestionScheduler.ts:397-400)
      const blankPattern = /(?:_{2,}|（\s*_*\s*）|\(\s*_*\s*\)|【\s*_*\s*】|\[\s*_*\s*\])/;
      if (!q.completed_stem && q.stem && Array.isArray(q.options) && typeof q.answer_idx === 'number' && q.answer_idx >= 0 && q.answer_idx < q.options.length) {
        q.completed_stem = q.stem.replace(blankPattern, q.options[q.answer_idx]);
      }

      // Writing options handling (autoQuestionScheduler.ts:403-407)
      if (isOpenEndedWritingTask(q.part_type || part_type)) {
        q.options = [];
        q.answer_idx = 0;
        (q as any).distractor_rationales = [];
      }

      // Visual check (autoQuestionScheduler.ts:410-414)
      if (isVisualQuestionType(q.part_type || part_type)) {
        if (!q.illustration_theme || typeof q.illustration_theme !== 'string' || q.illustration_theme.trim() === '' || q.illustration_theme.toLowerCase() === 'null') {
          q.illustration_theme = 'classroom';
        }
      }

      // Distractor rationales (autoQuestionScheduler.ts:416-427)
      if (!Array.isArray((q as any).distractor_rationales) && Array.isArray(q.options) && typeof q.answer_idx === 'number') {
        (q as any).distractor_rationales = q.options
          .map((opt, idx) => {
            if (idx === q.answer_idx) return null;
            return {
              option_idx: idx,
              option_text: opt,
              rationale_vi: `${opt}: Không phù hợp ngữ cảnh hoặc từ loại trong câu.`,
            };
          })
          .filter(Boolean);
      }

      // VERIFICATIONS:
      // 1. Options MUST retain exactly 6 items (NOT wiped to [])
      expect(q.options).toHaveLength(6);
      expect(q.options).toEqual(['木', '口', '日', '月', '十', '人']);

      // 2. Distractor rationales must be generated for the other 5 options
      const distractorRationales = (q as any).distractor_rationales;
      expect(distractorRationales).toHaveLength(5);
      expect(distractorRationales.map((d: any) => d.option_text)).toEqual(['口', '日', '月', '十', '人']);

      // 3. Candidate validation: Gate 2 MUST NOT reject for option count
      const val = validateCandidate(q, []);
      const optionCountErrors = val.errors.filter((e) => e.includes('Options must contain'));
      expect(optionCountErrors).toEqual([]);
    });

    it('validateCandidate rejects write_component_assembly_6opt if options ARE wiped to 0', () => {
      const q: any = {
        stem: '请将以下部件组合成正确的汉字：（____）',
        completed_stem: '请将以下部件组合成正确的汉字：（木）',
        options: [], // artificially wiped
        answer_idx: 0,
        explanation_vi: 'Đáp án đúng là 木.',
        level: 2,
        skill: 'writing',
        part_type: 'write_component_assembly_6opt',
      };

      const val = validateCandidate(q, []);
      expect(val.valid).toBe(false);
      expect(val.errors).toContain("Options must contain exactly 6 items for task type 'write_component_assembly_6opt' (got 0)");
    });
  });

  // =========================================================================
  // 4. Open-ended writing tasks with illustration_theme: null
  // =========================================================================
  describe('4. Open-ended writing tasks with illustration_theme: null', () => {
    it('isVisualQuestionType returns false for all open-ended writing task types', () => {
      const writingTasks = [
        'write_sentence_from_picture_word',
        'write_story_from_4pictures_100chars',
        'write_short_essay_80chars',
        'write_topic_essay_200chars',
        'write_summary_shortening_400chars',
        'write_topic_essay_300chars',
        'write_tianzige_from_pinyin',
        'write_component_assembly_6opt',
      ];

      for (const pt of writingTasks) {
        expect(isVisualQuestionType(pt), `isVisualQuestionType(${pt}) should be false`).toBe(false);
      }
    });

    it('avoids false SVG/illustration_theme rejection for write_sentence_from_picture_word with illustration_theme: null', () => {
      const q: any = {
        stem: '看图并结合词语写一句话：【打扫】。',
        completed_stem: '看图并结合词语写一句话：【打扫】。',
        options: [],
        answer_idx: 0,
        explanation_summary_vi: 'Đề thi yêu cầu nhìn tranh và từ khóa để viết một câu hoàn chỉnh.',
        answer_rationale_vi: 'Câu mẫu: 他正在认真地打扫房间。',
        explanation_vi: 'Giải thích chi tiết.',
        level: 4,
        skill: 'writing',
        part_type: 'write_sentence_from_picture_word',
        illustration_theme: null,
      };

      const res = validateCandidate(q, []);
      const themeErrors = res.errors.filter((e) =>
        e.includes('illustration_theme') || e.includes('SVG') || e.includes('options_images')
      );
      expect(themeErrors).toEqual([]);
    });

    it('avoids false SVG/illustration_theme rejection for write_story_from_4pictures_100chars with illustration_theme: null', () => {
      const q: any = {
        stem: '看图并写一篇100字左右的故事。',
        completed_stem: '看图并写一篇100字左右的故事。',
        options: [],
        answer_idx: 0,
        explanation_summary_vi: 'Đề thi yêu cầu nhìn tranh và viết một câu chuyện ngắn khoảng 100 chữ.',
        answer_rationale_vi: 'Bài viết mẫu: 上周末，小明和朋友们一起去公园野餐。阳光明媚，大家在草地上愉快地交谈、吃点心，度过了难忘的一天。',
        explanation_vi: 'Giải thích chi tiết.',
        level: 5,
        skill: 'writing',
        part_type: 'write_story_from_4pictures_100chars',
        illustration_theme: null,
      };

      const res = validateCandidate(q, []);
      const themeErrors = res.errors.filter((e) =>
        e.includes('illustration_theme') || e.includes('SVG') || e.includes('options_images')
      );
      expect(themeErrors).toEqual([]);
    });

    it('avoids false SVG/illustration_theme rejection for write_short_essay_80chars with illustration_theme: undefined, empty, or "none"', () => {
      for (const themeVal of [undefined, '', 'none', 'null', null]) {
        const q: any = {
          stem: '请结合以下5个词语写一篇80字左右的短文：[缓解, 压力, 措施, 积极, 效果]。',
          completed_stem: '请结合以下5个词语写一篇80字左右的短文：[缓解, 压力, 措施, 积极, 效果]。',
          options: [],
          answer_idx: 0,
          explanation_summary_vi: 'HSK 5 Tự luận: Vận dụng 5 từ khóa.',
          answer_rationale_vi: 'Bài viết mẫu: 面对快节奏的生活，我们应当采取积极有效的措施来缓解心理压力。',
          explanation_vi: 'Giải thích chi tiết.',
          level: 5,
          skill: 'writing',
          part_type: 'write_short_essay_80chars',
          illustration_theme: themeVal,
        };

        const res = validateCandidate(q, []);
        const themeErrors = res.errors.filter((e) =>
          e.includes('illustration_theme') || e.includes('SVG') || e.includes('options_images')
        );
        expect(themeErrors, `Failed for illustration_theme: ${themeVal}`).toEqual([]);
      }
    });

    it('correctly triggers illustration_theme error for GENUINE visual question types when illustration_theme is null', () => {
      const genuineVisualTypes = [
        'listen_picture_match_3opt',
        'listen_picture_match_4opt',
        'listen_dialogue_picture_match_6opt',
        'read_sentence_picture_match_6opt',
      ];

      for (const pt of genuineVisualTypes) {
        expect(isVisualQuestionType(pt), `isVisualQuestionType(${pt}) should be true`).toBe(true);

        const q: any = {
          stem: '请听录音并选择与录音内容相符的图片：',
          completed_stem: '请听录音并选择与录音内容相符的图片：',
          options: ['A', 'B', 'C'],
          answer_idx: 0,
          explanation_summary_vi: 'Chọn hình ảnh tương ứng.',
          answer_rationale_vi: 'Hình ảnh A phù hợp.',
          explanation_vi: 'Chi tiết.',
          level: 1,
          skill: 'listening',
          part_type: pt,
          illustration_theme: null,
          options_images: [],
        };

        const res = validateCandidate(q, []);
        expect(res.valid).toBe(false);
        const hasVisualError = res.errors.some((e) =>
          e.includes('illustration_theme') || e.includes('options_images')
        );
        expect(hasVisualError, `Expected visual error for ${pt}`).toBe(true);
      }
    });
  });

  // =========================================================================
  // 5. Invariant Integrity: Database SHA-256 Check
  // =========================================================================
  describe('5. Database SHA-256 Invariant Check', () => {
    it('preserves data/hsk_exam.db hash strictly unchanged', () => {
      expect(fs.existsSync(HSK_EXAM_DB_PATH)).toBe(true);
      const fileBuffer = fs.readFileSync(HSK_EXAM_DB_PATH);
      const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex').toUpperCase();
      expect(hash).toBe(EXPECTED_HSK_EXAM_DB_HASH);
    });
  });
});
