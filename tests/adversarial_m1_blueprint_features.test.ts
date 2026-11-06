/**
 * Adversarial Challenger Empirical Test Suite for Milestone M1:
 * Blueprint Schema & Prompt Calibration Across HSK 1–6 (Features 1–6)
 *
 * EMPIRICAL CHALLENGER MANDATE:
 * 1. buildQuestionResponseFormat option counts & schema constraints (3, 6, 0 options).
 * 2. buildHskPrompt JSON schema output contract & distinct exampleOptions array.
 * 3. validateCandidate genuine passing tests for 3-opt HSK 1, 6-opt word-bank, and 0-opt writing.
 * 4. Adversarial stress-testing: malformed option counts, duplicate options,
 *    out-of-bounds answer_idx, distractor rationales, Latin bracket exemptions,
 *    visual theme exemptions, component assembly option preservation.
 */

import { describe, it, expect } from 'vitest';
import {
  buildHskPrompt,
  getQuestionTypeInstructions,
  isOpenEndedWritingTask,
} from '../src/server/llm/promptTemplates';
import { buildQuestionResponseFormat } from '../src/server/llm/waterfallGenerator';
import {
  getPartTypeContract,
  isOpenEndedWritingPartType,
} from '../src/server/llm/partTypeContract';
import {
  isVisualQuestionType,
  getExpectedOptionCount,
  validateCandidate,
} from '../src/server/llm/questionValidator';

describe('Milestone M1 Empirical Adversarial Challenge Suite (Features 1–6)', () => {
  // =========================================================================
  // Section 1: Response Format Schema Calibration (Features 1, 2, 3)
  // =========================================================================
  describe('1. buildQuestionResponseFormat Schema Constraints', () => {
    it('HSK 1 listening picture match (3-opt) produces schema with exactly 3 options', () => {
      const format = buildQuestionResponseFormat(1, 'listening', 'listen_picture_match_3opt', 1);
      expect(format.type).toBe('json_schema');
      const schema = (format.json_schema as any).schema.properties.questions.items.properties;

      // Assert exactly 3 options
      expect(schema.options.minItems).toBe(3);
      expect(schema.options.maxItems).toBe(3);
      expect(schema.options_images.minItems).toBe(3);
      expect(schema.options_images.maxItems).toBe(3);
      expect(schema.answer_idx.maximum).toBe(2);
      expect(schema.answer_idx.minimum).toBe(0);
      expect(schema.level.enum).toEqual([1]);
      expect(schema.part_type.enum).toEqual(['listen_picture_match_3opt']);
    });

    it('HSK 1 reading word bank (6-opt) produces schema with exactly 6 options', () => {
      const format = buildQuestionResponseFormat(1, 'reading', 'read_fill_blank_word_bank_6opt', 1);
      expect(format.type).toBe('json_schema');
      const schema = (format.json_schema as any).schema.properties.questions.items.properties;

      // Assert exactly 6 options
      expect(schema.options.minItems).toBe(6);
      expect(schema.options.maxItems).toBe(6);
      expect(schema.options_images.minItems).toBe(0);
      expect(schema.options_images.maxItems).toBe(0);
      expect(schema.answer_idx.maximum).toBe(5);
      expect(schema.answer_idx.minimum).toBe(0);
      expect(schema.level.enum).toEqual([1]);
      expect(schema.part_type.enum).toEqual(['read_fill_blank_word_bank_6opt']);
    });

    it('HSK 4 writing sentence from picture word produces schema with 0 options', () => {
      const format = buildQuestionResponseFormat(4, 'writing', 'write_sentence_from_picture_word', 1);
      expect(format.type).toBe('json_schema');
      const schema = (format.json_schema as any).schema.properties.questions.items.properties;

      // Assert exactly 0 options
      expect(schema.options.minItems).toBe(0);
      expect(schema.options.maxItems).toBe(0);
      expect(schema.options_images.minItems).toBe(0);
      expect(schema.options_images.maxItems).toBe(0);
      expect(schema.answer_idx.maximum).toBe(0);
      expect(schema.answer_idx.minimum).toBe(0);
      expect(schema.level.enum).toEqual([4]);
      expect(schema.part_type.enum).toEqual(['write_sentence_from_picture_word']);
    });

    it('All HSK 4-6 open-ended writing types produce schema with 0 options', () => {
      const writingParts = [
        { level: 4, part: 'write_sentence_from_picture_word' },
        { level: 5, part: 'write_short_essay_80chars' },
        { level: 5, part: 'write_story_from_4pictures_100chars' },
        { level: 5, part: 'write_topic_essay_200chars' },
        { level: 6, part: 'write_summary_shortening_400chars' },
        { level: 6, part: 'write_topic_essay_300chars' },
        { level: 3, part: 'write_tianzige_from_pinyin' },
      ];

      for (const { level, part } of writingParts) {
        const format = buildQuestionResponseFormat(level, 'writing', part, 1);
        const schema = (format.json_schema as any).schema.properties.questions.items.properties;
        expect(schema.options.minItems, `${part} minItems`).toBe(0);
        expect(schema.options.maxItems, `${part} maxItems`).toBe(0);
        expect(schema.answer_idx.maximum, `${part} answer_idx max`).toBe(0);
      }
    });

    it('Component assembly write_component_assembly_6opt preserves 6 options', () => {
      const format = buildQuestionResponseFormat(2, 'writing', 'write_component_assembly_6opt', 1);
      const schema = (format.json_schema as any).schema.properties.questions.items.properties;
      expect(schema.options.minItems).toBe(6);
      expect(schema.options.maxItems).toBe(6);
      expect(schema.answer_idx.maximum).toBe(5);
    });
  });

  // =========================================================================
  // Section 2: Prompt Templates JSON Output & Schema Validation (Feature 2 & 3)
  // =========================================================================
  describe('2. buildHskPrompt JSON Schema Calibration', () => {
    it('HSK 1 word bank prompt provides 6 distinct sample options in JSON schema', () => {
      const prompt = buildHskPrompt(1, 'reading', 1, [], 'read_fill_blank_word_bank_6opt');

      // Check instructions
      expect(prompt).toContain('EXACTLY 6 DISTINCT OPTIONS:');
      expect(prompt).toContain('"options" MUST contain exactly 6 non-empty, unique strings.');
      expect(prompt).toContain('Provide exactly 5 distractors.');

      // Extract JSON schema block from prompt
      const schemaMatch = prompt.match(/SCHEMA[^{]*(\{[\s\S]*\})\s*$/);
      expect(schemaMatch).not.toBeNull();
      const parsedJson = JSON.parse(schemaMatch![1]);

      expect(parsedJson).toHaveProperty('questions');
      expect(Array.isArray(parsedJson.questions)).toBe(true);
      expect(parsedJson.questions.length).toBe(1);

      const q = parsedJson.questions[0];
      expect(Array.isArray(q.options)).toBe(true);
      expect(q.options.length).toBe(6);

      // Verify all 6 options are distinct
      const uniqueOpts = new Set(q.options);
      expect(uniqueOpts.size).toBe(6);
      expect(q.options).toEqual(['书', '水', '茶', '苹果', '飞机', '学校']);
    });

    it('HSK 2 word bank prompt provides 6 distinct sample options in JSON schema', () => {
      const prompt = buildHskPrompt(2, 'reading', 1, [], 'read_fill_blank_word_bank_6opt');
      expect(prompt).toContain('EXACTLY 6 DISTINCT OPTIONS:');

      const schemaMatch = prompt.match(/SCHEMA[^{]*(\{[\s\S]*\})\s*$/);
      expect(schemaMatch).not.toBeNull();
      const parsedJson = JSON.parse(schemaMatch![1]);
      const q = parsedJson.questions[0];

      expect(q.options.length).toBe(6);
      const uniqueOpts = new Set(q.options);
      expect(uniqueOpts.size).toBe(6);
      expect(q.options).toEqual(['进', '走', '出', '跑', '买', '看']);
    });

    it('HSK 1 3-option prompt provides exactly 3 sample options in JSON schema', () => {
      const prompt = buildHskPrompt(1, 'reading', 1, [], 'read_comprehension_short_3opt');
      expect(prompt).toContain('EXACTLY 3 DISTINCT OPTIONS:');

      const schemaMatch = prompt.match(/SCHEMA[^{]*(\{[\s\S]*\})\s*$/);
      expect(schemaMatch).not.toBeNull();
      const parsedJson = JSON.parse(schemaMatch![1]);
      const q = parsedJson.questions[0];

      expect(q.options.length).toBe(3);
      expect(new Set(q.options).size).toBe(3);
      expect(q.options).toEqual(['上午', '下午', '晚上']);
    });

    it('HSK 4 writing prompt provides empty options [] and CTI rubric instructions', () => {
      const prompt = buildHskPrompt(4, 'writing', 1, [], 'write_sentence_from_picture_word');
      expect(prompt).toContain('OPEN-ENDED WRITING (0 OPTIONS):');
      expect(prompt).toContain('"options" MUST be strictly an empty array: []');
      expect(prompt).toContain('Tiêu chí chấm điểm CTI');

      const schemaMatch = prompt.match(/SCHEMA[^{]*(\{[\s\S]*\})\s*$/);
      expect(schemaMatch).not.toBeNull();
      const parsedJson = JSON.parse(schemaMatch![1]);
      const q = parsedJson.questions[0];

      expect(q.options).toEqual([]);
      expect(q.answer_idx).toBe(0);
      expect(q.distractor_rationales).toEqual([]);
    });
  });

  // =========================================================================
  // Section 3: validateCandidate Genuine Passing Cases
  // =========================================================================
  describe('3. validateCandidate Genuine Passing Cases', () => {
    it('passes a genuine 3-option HSK 1 question (listen_picture_match_3opt with valid SVG image options)', () => {
      const candidate: any = {
        stem: '男：你想喝点儿什么？\n女：我想喝茶。\n问：女的想喝什么？',
        completed_stem: '男：你想喝点儿什么？\n女：我想喝茶。\n问：女的想喝什么？',
        options: ['茶', '水', '苹果'],
        options_images: ['apple', 'banana', 'watermelon'],
        answer_idx: 0,
        explanation_summary_vi: 'Dịch nghĩa: Nam hỏi nữ muốn uống gì. Nữ trả lời muốn uống trà.',
        answer_rationale_vi: '茶: Nữ nói rõ trong đoạn thoại là muốn uống trà (我想喝茶).',
        explanation_vi: 'Giải thích chi tiết: Đoạn hội thoại nghe rõ [我想喝茶], đáp án đúng là trà (茶).',
        distractor_rationales: [
          { option_idx: 1, option_text: '水', rationale_vi: '水: Nữ muốn uống trà chứ không bảo muốn uống nước.' },
          { option_idx: 2, option_text: '苹果', rationale_vi: '苹果: Táo là hoa quả để ăn, không phải đồ uống nữ yêu cầu.' },
        ],
        level: 1,
        skill: 'listening',
        part_type: 'listen_picture_match_3opt',
        illustration_theme: null,
      };

      const result = validateCandidate(candidate, []);
      expect(result.valid, `Errors: ${result.errors.join('; ')}`).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('passes a genuine 3-option HSK 1 non-picture question (read_comprehension_short_3opt)', () => {
      const candidate: any = {
        stem: '我上午去学校看书。★ 我什么时候去学校？',
        completed_stem: '我上午去学校看书。★ 我什么时候去学校？',
        options: ['上午', '下午', '晚上'],
        answer_idx: 0,
        explanation_summary_vi: 'Dịch nghĩa: Tôi buổi sáng đi học đọc sách. Hỏi khi nào đi trường.',
        answer_rationale_vi: '上午: Đoạn văn nêu rõ thời gian là buổi sáng (上午).',
        explanation_vi: 'Giải thích chi tiết: Văn bản nêu rõ [上午去学校], đáp án là buổi sáng (上午).',
        distractor_rationales: [
          { option_idx: 1, option_text: '下午', rationale_vi: '下午: Văn bản nêu rõ buổi sáng chứ không phải buổi chiều (下午).' },
          { option_idx: 2, option_text: '晚上', rationale_vi: '晚上: Văn bản nêu rõ buổi sáng chứ không phải buổi tối (晚上).' },
        ],
        level: 1,
        skill: 'reading',
        part_type: 'read_comprehension_short_3opt',
        illustration_theme: null,
      };

      const result = validateCandidate(candidate, []);
      expect(result.valid, `Errors: ${result.errors.join('; ')}`).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('passes a genuine 6-option HSK 1 word bank question (read_fill_blank_word_bank_6opt)', () => {
      const candidate: any = {
        stem: '我想去商店买两本____。',
        completed_stem: '我想去商店买两本书。',
        options: ['书', '水', '茶', '苹果', '飞机', '学校'],
        answer_idx: 0,
        explanation_summary_vi: 'Dịch nghĩa: Tôi muốn đến cửa hàng mua hai cuốn sách.',
        answer_rationale_vi: '书: Đi kèm với lượng từ [本] (cuốn/quyển) chỉ có danh từ sách (书).',
        explanation_vi: 'Giải thích chi tiết: Lượng từ [本] dùng cho sách vở. Trong ngân hàng từ vựng 6 từ, chỉ có [书] phù hợp.',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_word_bank_6opt',
        illustration_theme: null,
      };

      const result = validateCandidate(candidate, []);
      expect(result.valid, `Errors: ${result.errors.join('; ')}`).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('passes a genuine 0-option HSK 4 writing task (write_sentence_from_picture_word)', () => {
      const candidate: any = {
        stem: '看图并结合词语写一句话：[打扫]。',
        completed_stem: '看图并结合词语写一句话：[打扫]。',
        options: [],
        answer_idx: 0,
        explanation_summary_vi: 'Đề thi yêu cầu nhìn tranh và từ khóa [打扫] để viết một câu hoàn chỉnh.',
        answer_rationale_vi: 'Câu mẫu chuẩn điểm tối đa: 周末我们在家里打扫房间，到处都很干净。',
        explanation_vi: 'Giải thích chi tiết: Tiêu chí CTI yêu cầu dùng đúng từ khóa 打扫 (quét dọn), câu đủ chủ ngữ vị ngữ và đúng ngữ cảnh.',
        distractor_rationales: [],
        level: 4,
        skill: 'writing',
        part_type: 'write_sentence_from_picture_word',
        illustration_theme: null,
      };

      const result = validateCandidate(candidate, []);
      expect(result.valid, `Errors: ${result.errors.join('; ')}`).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('passes a genuine 0-option HSK 5 writing task (write_short_essay_80chars)', () => {
      const candidate: any = {
        stem: '请结合以下5个词语写一篇80字左右的短文：[缓解, 压力, 措施, 积极, 效果]。',
        completed_stem: '请结合以下5个词语写一篇80字左右的短文：[缓解, 压力, 措施, 积极, 效果]。',
        options: [],
        answer_idx: 0,
        explanation_summary_vi: 'Yêu cầu viết tự luận HSK 5: Vận dụng 5 từ khóa vào đoạn văn ngắn khoảng 80 chữ.',
        answer_rationale_vi: 'Bài viết mẫu chuẩn điểm tối đa (~80 chữ): 面对快节奏的现代生活，我们常常感到巨大的心理压力。为了有效缓解这种压力，公司采取了一系列积极措施。员工们积极参与其中，取得了显著效果。',
        explanation_vi: 'Giải thích chi tiết: Bài viết kết nối hợp lý 5 từ khóa, ngữ pháp chính xác, độ dài đạt yêu cầu.',
        distractor_rationales: [],
        level: 5,
        skill: 'writing',
        part_type: 'write_short_essay_80chars',
        illustration_theme: null,
      };

      const result = validateCandidate(candidate, []);
      expect(result.valid, `Errors: ${result.errors.join('; ')}`).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  // =========================================================================
  // Section 4: Adversarial Stress Tests & Boundary Invariants
  // =========================================================================
  describe('4. Adversarial Stress Tests & Boundary Invariants', () => {
    it('ADVERSARIAL: Rejects 3-option task when given 2, 4, 5, or 0 options', () => {
      const baseCandidate: any = {
        stem: '我上午去学校看书。★ 我什么时候去学校？',
        completed_stem: '我上午去学校看书。★ 我什么时候去学校？',
        answer_idx: 0,
        explanation_summary_vi: 'Dịch nghĩa: Tôi buổi sáng đi học đọc sách. Hỏi khi nào đi trường.',
        answer_rationale_vi: '上午: Buổi sáng.',
        explanation_vi: 'Giải thích chi tiết: Đáp án là buổi sáng.',
        level: 1,
        skill: 'reading',
        part_type: 'read_comprehension_short_3opt',
        illustration_theme: null,
      };

      // 4 options
      const res4 = validateCandidate({ ...baseCandidate, options: ['上午', '下午', '晚上', '中午'] }, []);
      expect(res4.valid).toBe(false);
      expect(res4.errors.some((e) => e.includes('Options must contain exactly 3 items'))).toBe(true);

      // 2 options
      const res2 = validateCandidate({ ...baseCandidate, options: ['上午', '下午'] }, []);
      expect(res2.valid).toBe(false);
      expect(res2.errors.some((e) => e.includes('Options must contain exactly 3 items'))).toBe(true);

      // 0 options
      const res0 = validateCandidate({ ...baseCandidate, options: [] }, []);
      expect(res0.valid).toBe(false);
      expect(res0.errors.some((e) => e.includes('Options must contain exactly 3 items'))).toBe(true);
    });

    it('ADVERSARIAL: Rejects 6-option word bank task when given 5, 7, or duplicate options', () => {
      const baseCandidate: any = {
        stem: '我想去商店买两本____。',
        completed_stem: '我想去商店买两本书。',
        answer_idx: 0,
        explanation_summary_vi: 'Dịch nghĩa: Tôi muốn mua hai cuốn sách.',
        answer_rationale_vi: '书: Lượng từ bản đi với sách.',
        explanation_vi: 'Giải thích chi tiết: Đáp án đúng là sách.',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_word_bank_6opt',
        illustration_theme: null,
      };

      // 5 options (too few)
      const res5 = validateCandidate({ ...baseCandidate, options: ['书', '水', '茶', '苹果', '飞机'] }, []);
      expect(res5.valid).toBe(false);
      expect(res5.errors.some((e) => e.includes('Options must contain exactly 6 items'))).toBe(true);

      // 7 options (too many)
      const res7 = validateCandidate({ ...baseCandidate, options: ['书', '水', '茶', '苹果', '飞机', '学校', '医院'] }, []);
      expect(res7.valid).toBe(false);
      expect(res7.errors.some((e) => e.includes('Options must contain exactly 6 items'))).toBe(true);

      // 6 options with duplicate
      const resDup = validateCandidate({ ...baseCandidate, options: ['书', '水', '茶', '苹果', '飞机', '书'] }, []);
      expect(resDup.valid).toBe(false);
      expect(resDup.errors.some((e) => e.includes('Options must be unique'))).toBe(true);
    });

    it('ADVERSARIAL: Rejects writing task when given non-empty options', () => {
      const candidate: any = {
        stem: '看图并结合词语写一句话：[打扫]。',
        completed_stem: '看图并结合词语写一句话：[打扫]。',
        options: ['打扫'], // Non-empty!
        answer_idx: 0,
        explanation_summary_vi: 'Đề thi yêu cầu viết câu.',
        answer_rationale_vi: 'Câu mẫu: 打扫房间。',
        explanation_vi: 'Giải thích chi tiết.',
        distractor_rationales: [],
        level: 4,
        skill: 'writing',
        part_type: 'write_sentence_from_picture_word',
        illustration_theme: null,
      };

      const result = validateCandidate(candidate, []);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Options must be empty for writing task type'))).toBe(true);
    });

    it('ADVERSARIAL: Latin check allows bracketed pinyin but strictly rejects unbracketed Latin', () => {
      const validCandidate: any = {
        stem: '看图并结合词语写一句话：[dǎ sǎo]。',
        completed_stem: '看图并结合词语写一句话：[dǎ sǎo]。',
        options: [],
        answer_idx: 0,
        explanation_summary_vi: 'Đề thi yêu cầu viết câu.',
        answer_rationale_vi: 'Câu mẫu: 周末打扫房间。',
        explanation_vi: 'Giải thích chi tiết.',
        level: 4,
        skill: 'writing',
        part_type: 'write_sentence_from_picture_word',
        illustration_theme: null,
      };

      // Valid with [dǎ sǎo]
      const resValid = validateCandidate(validCandidate, []);
      expect(resValid.errors.filter((e) => e.includes('Latin'))).toEqual([]);

      // Valid with Chinese brackets 【huǎn jiě】
      const resValidChineseBrackets = validateCandidate({
        ...validCandidate,
        stem: '请结合词语写一句话：【huǎn jiě】。',
        completed_stem: '请结合词语写一句话：【huǎn jiě】。',
      }, []);
      expect(resValidChineseBrackets.errors.filter((e) => e.includes('Latin'))).toEqual([]);

      // Invalid with unbracketed Latin
      const resInvalid = validateCandidate({
        ...validCandidate,
        stem: '看图并结合词语写一句话：dǎ sǎo 打扫。',
        completed_stem: '看图并结合词语写一句话：dǎ sǎo 打扫。',
      }, []);
      expect(resInvalid.valid).toBe(false);
      expect(resInvalid.errors.some((e) => e.includes('stem contains invalid Latin or Vietnamese characters'))).toBe(true);
    });

    it('ADVERSARIAL: Visual theme exemption applies to writing tasks but NOT genuine visual tasks', () => {
      // Writing task with "picture" in name has illustration_theme: null -> PASSES visual check
      expect(isVisualQuestionType('write_sentence_from_picture_word')).toBe(false);
      expect(isVisualQuestionType('write_story_from_4pictures_100chars')).toBe(false);

      // Genuine visual task requires illustration_theme or options_images
      expect(isVisualQuestionType('listen_picture_match_3opt')).toBe(true);
      expect(isVisualQuestionType('listen_picture_match_4opt')).toBe(true);
      expect(isVisualQuestionType('listen_dialogue_picture_match_6opt')).toBe(true);
      expect(isVisualQuestionType('read_sentence_picture_match_6opt')).toBe(true);

      const candidateNoTheme: any = {
        stem: '男：你想喝什么？\n女：我想喝茶。\n问：女的想喝什么？',
        completed_stem: '男：你想喝什么？\n女：我想喝茶。\n问：女的想喝什么？',
        options: ['茶', '水', '苹果'],
        answer_idx: 0,
        explanation_summary_vi: 'Giải thích ngắn.',
        answer_rationale_vi: 'Lý do đáp án.',
        explanation_vi: 'Giải thích chi tiết.',
        distractor_rationales: [
          { option_idx: 1, option_text: '水', rationale_vi: '水: Không phải trà.' },
          { option_idx: 2, option_text: '苹果', rationale_vi: '苹果: Không phải trà.' },
        ],
        level: 1,
        skill: 'listening',
        part_type: 'listen_picture_match_3opt',
        illustration_theme: null, // No theme AND no options_images!
        options_images: [],
      };

      const resVisualFail = validateCandidate(candidateNoTheme, []);
      expect(resVisualFail.errors.some((e) => e.includes('options_images is required for this picture-choice task'))).toBe(true);
    });

    it('ADVERSARIAL: write_component_assembly_6opt requires 6 options and rejects 0 options', () => {
      expect(isOpenEndedWritingTask('write_component_assembly_6opt')).toBe(false);
      expect(getExpectedOptionCount(2, 'write_component_assembly_6opt')).toBe(6);

      const candidate0Opt: any = {
        stem: '组合部件构成汉字：[木, 木]。',
        completed_stem: '组合部件构成汉字：林。',
        options: [], // 0 options invalid for component assembly!
        answer_idx: 0,
        explanation_summary_vi: 'Ghép hai chữ mộc thành chữ lâm.',
        answer_rationale_vi: '林: Gồm hai chữ mộc.',
        explanation_vi: 'Giải thích chi tiết.',
        level: 2,
        skill: 'writing',
        part_type: 'write_component_assembly_6opt',
        illustration_theme: null,
      };

      const res = validateCandidate(candidate0Opt, []);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('Options must contain exactly 6 items'))).toBe(true);

      const candidate6Opt: any = {
        ...candidate0Opt,
        options: ['林', '森', '休', '本', '未', '末'],
        answer_idx: 0,
        distractor_rationales: [
          { option_idx: 1, option_text: '森', rationale_vi: '森: Ba chữ mộc.' },
          { option_idx: 2, option_text: '休', rationale_vi: '休: Chữ nhân đứng ghép với mộc.' },
          { option_idx: 3, option_text: '本', rationale_vi: '本: Thêm nét ngang dưới.' },
          { option_idx: 4, option_text: '未', rationale_vi: '未: Nét ngang trên ngắn.' },
          { option_idx: 5, option_text: '末', rationale_vi: '末: Nét ngang trên dài.' },
        ],
      };

      const res6 = validateCandidate(candidate6Opt, []);
      expect(res6.valid, `Errors: ${res6.errors.join('; ')}`).toBe(true);
    });

    it('ADVERSARIAL: Detects stem answer leakage in 3-option and 6-option fill-in-the-blank questions', () => {
      const candidateLeakage: any = {
        stem: '我想看书，还要买一本书____。',
        completed_stem: '我想看书，还要买一本书。',
        options: ['书', '水', '茶', '苹果', '飞机', '学校'],
        answer_idx: 0,
        explanation_summary_vi: 'Giải thích tóm tắt.',
        answer_rationale_vi: 'Lý do đáp án.',
        explanation_vi: 'Giải thích chi tiết.',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_word_bank_6opt',
        illustration_theme: null,
      };

      const res = validateCandidate(candidateLeakage, []);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('Stem answer leakage detected'))).toBe(true);
    });

    it('ADVERSARIAL: Rejects candidate when completed_stem still contains blank placeholder ____', () => {
      const candidateIncomplete: any = {
        stem: '我想去商店买两本____。',
        completed_stem: '我想去商店买两本____。', // Incomplete!
        options: ['书', '水', '茶', '苹果', '飞机', '学校'],
        answer_idx: 0,
        explanation_summary_vi: 'Giải thích tóm tắt.',
        answer_rationale_vi: 'Lý do đáp án.',
        explanation_vi: 'Giải thích chi tiết.',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_word_bank_6opt',
        illustration_theme: null,
      };

      const res = validateCandidate(candidateIncomplete, []);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('unreplaced blank placeholder'))).toBe(true);
    });

    it('ADVERSARIAL: Rejects distractor rationale that references the correct answer index', () => {
      const candidate: any = {
        stem: '我上午去学校看书。★ 我什么时候去学校？',
        completed_stem: '我上午去学校看书。★ 我什么时候去学校？',
        options: ['上午', '下午', '晚上'],
        answer_idx: 0,
        explanation_summary_vi: 'Dịch nghĩa: Tôi đi học buổi sáng.',
        answer_rationale_vi: '上午: Buổi sáng.',
        explanation_vi: 'Giải thích chi tiết: Buổi sáng.',
        distractor_rationales: [
          { option_idx: 0, option_text: '上午', rationale_vi: '上午: Lỗi trỏ vào đáp án đúng!' },
          { option_idx: 1, option_text: '下午', rationale_vi: '下午: Không phải buổi sáng.' },
        ],
        level: 1,
        skill: 'reading',
        part_type: 'read_comprehension_short_3opt',
        illustration_theme: null,
      };

      const res = validateCandidate(candidate, [], { requireDistractorRationales: true });
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('must not reference the correct answer'))).toBe(true);
    });

    it('ADVERSARIAL: Rejects distractor rationale with cross-distractor contamination', () => {
      const candidate: any = {
        stem: '我上午去学校看书。★ 我什么时候去学校？',
        completed_stem: '我上午去学校看书。★ 我什么时候去学校？',
        options: ['上午', '下午', '晚上'],
        answer_idx: 0,
        explanation_summary_vi: 'Dịch nghĩa: Tôi đi học buổi sáng.',
        answer_rationale_vi: '上午: Buổi sáng.',
        explanation_vi: 'Giải thích chi tiết: Buổi sáng.',
        distractor_rationales: [
          { option_idx: 1, option_text: '下午', rationale_vi: '下午: Nêu sai vì nhầm với 晚上 (buổi tối) của đáp án C!' },
          { option_idx: 2, option_text: '晚上', rationale_vi: '晚上: Không phải buổi tối.' },
        ],
        level: 1,
        skill: 'reading',
        part_type: 'read_comprehension_short_3opt',
        illustration_theme: null,
      };

      const res = validateCandidate(candidate, [], { requireDistractorRationales: true });
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('cross-distractor contamination'))).toBe(true);
    });

    it('ADVERSARIAL: buildQuestionResponseFormat handles boundary levels and clamps cleanly', () => {
      // Clamped level < 1 -> 1
      const formatLow = buildQuestionResponseFormat(0, 'listening', 'listen_picture_match_3opt', -1);
      const schemaLow = (formatLow.json_schema as any).schema.properties.questions.items.properties;
      expect(schemaLow.level.enum).toEqual([1]);
      expect(schemaLow.options.minItems).toBe(3);

      // Clamped level > 6 -> 6
      const formatHigh = buildQuestionResponseFormat(99, 'reading', 'read_comprehension_4opt', 999);
      const schemaHigh = (formatHigh.json_schema as any).schema.properties.questions.items.properties;
      expect(schemaHigh.level.enum).toEqual([6]);
      expect(schemaHigh.options.minItems).toBe(4);
    });
  });
});
