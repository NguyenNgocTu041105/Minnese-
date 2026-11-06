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

describe('Milestone M1: Blueprint Schema & Prompt Calibration Across HSK 1–6 (Features 1–6)', () => {
  // =========================================================================
  // Feature 1: HSK 1 & 2 3-option calibration
  // =========================================================================
  describe('Feature 1: HSK 1 & 2 3-option calibration', () => {
    it('enforces 3 options in structured response format for HSK 1 listening picture match', () => {
      const format = buildQuestionResponseFormat(1, 'listening', 'listen_picture_match_3opt', 5);
      const schema = (format.json_schema as any).schema.properties.questions.items.properties;
      expect(schema.options.minItems).toBe(3);
      expect(schema.options.maxItems).toBe(3);
      expect(schema.options_images.minItems).toBe(3);
      expect(schema.options_images.maxItems).toBe(3);
    });

    it('enforces 3 options in structured response format for HSK 1 listening QA 3opt', () => {
      const format = buildQuestionResponseFormat(1, 'listening', 'listen_question_answer_3opt', 5);
      const schema = (format.json_schema as any).schema.properties.questions.items.properties;
      expect(schema.options.minItems).toBe(3);
      expect(schema.options.maxItems).toBe(3);
    });

    it('enforces 3 options in structured response format for HSK 2 reading comprehension 3opt', () => {
      const format = buildQuestionResponseFormat(2, 'reading', 'read_comprehension_short_3opt', 5);
      const schema = (format.json_schema as any).schema.properties.questions.items.properties;
      expect(schema.options.minItems).toBe(3);
      expect(schema.options.maxItems).toBe(3);
    });

    it('enforces 3 options in prompt templates for HSK 1 & 2 3-option tasks', () => {
      const promptL1 = buildHskPrompt(1, 'listening', 5, [], 'listen_question_answer_3opt');
      expect(promptL1).toContain('EXACTLY 3 DISTINCT OPTIONS:');
      expect(promptL1).toContain('"options" MUST contain exactly 3 non-empty, unique strings.');
      expect(promptL1).toContain('Provide exactly 2 distractors.');

      const promptL2 = buildHskPrompt(2, 'reading', 5, [], 'read_comprehension_short_3opt');
      expect(promptL2).toContain('EXACTLY 3 DISTINCT OPTIONS:');
    });

    it('getExpectedOptionCount correctly returns 3 for HSK 1 & 2 3-option blueprint parts', () => {
      expect(getExpectedOptionCount(1, 'listen_picture_match_3opt')).toBe(3);
      expect(getExpectedOptionCount(1, 'listen_question_answer_3opt')).toBe(3);
      expect(getExpectedOptionCount(1, 'listen_monologue_qa_3opt')).toBe(3);
      expect(getExpectedOptionCount(1, 'read_comprehension_short_3opt')).toBe(3);
      expect(getExpectedOptionCount(2, 'listen_picture_match_3opt')).toBe(3);
      expect(getExpectedOptionCount(2, 'listen_dialogue_qa_3opt')).toBe(3);
      expect(getExpectedOptionCount(2, 'read_comprehension_short_3opt')).toBe(3);
    });
  });

  // =========================================================================
  // Feature 2: HSK 1 & 2 6-option word-bank calibration
  // =========================================================================
  describe('Feature 2: HSK 1 & 2 6-option word-bank calibration', () => {
    it('provides exactly 6 distinct options in exampleOptions for HSK 1 word-bank tasks', () => {
      const promptL1 = buildHskPrompt(1, 'reading', 5, [], 'read_fill_blank_word_bank_6opt');
      expect(promptL1).toContain('["书","水","茶","苹果","飞机","学校"]');
      expect(promptL1).toContain('EXACTLY 6 DISTINCT OPTIONS:');
      expect(promptL1).toContain('Provide exactly 5 distractors.');
    });

    it('provides exactly 6 distinct options in exampleOptions for HSK 2 word-bank tasks', () => {
      const promptL2 = buildHskPrompt(2, 'reading', 5, [], 'read_fill_blank_word_bank_6opt');
      expect(promptL2).toContain('["进","走","出","跑","买","看"]');
      expect(promptL2).toContain('EXACTLY 6 DISTINCT OPTIONS:');
    });

    it('buildQuestionResponseFormat enforces 6 options for 6-option tasks', () => {
      const format = buildQuestionResponseFormat(1, 'reading', 'read_fill_blank_word_bank_6opt', 5);
      const schema = (format.json_schema as any).schema.properties.questions.items.properties;
      expect(schema.options.minItems).toBe(6);
      expect(schema.options.maxItems).toBe(6);

      const formatDialogue = buildQuestionResponseFormat(2, 'reading', 'read_dialogue_matching_split', 5);
      const schemaDialogue = (formatDialogue.json_schema as any).schema.properties.questions.items.properties;
      expect(schemaDialogue.options.minItems).toBe(6);
      expect(schemaDialogue.options.maxItems).toBe(6);
    });

    it('getQuestionTypeInstructions contains dedicated instructions for all missing blueprint cases', () => {
      const instWordBank6opt = getQuestionTypeInstructions('read_fill_blank_word_bank_6opt', 1);
      expect(instWordBank6opt).toContain('6 Options: A–F');

      const instWordBankSplit = getQuestionTypeInstructions('read_fill_blank_word_bank_split', 2);
      expect(instWordBankSplit).toContain('6 Options: A–F');

      const instSentenceMatchingSplit = getQuestionTypeInstructions('read_sentence_matching_split', 2);
      expect(instSentenceMatchingSplit).toContain('6 Options: A–F');

      const instDialogueMatchingSplit = getQuestionTypeInstructions('read_dialogue_matching_split', 2);
      expect(instDialogueMatchingSplit).toContain('6 Options: A–F');

      const instListeningDialogueSplit = getQuestionTypeInstructions('listen_dialogue_picture_match_split', 2);
      expect(instListeningDialogueSplit).toContain('6 Options: A–F');

      const instDialogueQa3opt = getQuestionTypeInstructions('listen_dialogue_qa_3opt', 2);
      expect(instDialogueQa3opt).toContain('3 Options: A, B, C');

      const instComprehensionMedium3opt = getQuestionTypeInstructions('read_comprehension_short_and_medium_3opt', 3);
      expect(instComprehensionMedium3opt).toContain('3 Options: A, B, C');

      const instComponentAssembly6opt = getQuestionTypeInstructions('write_component_assembly_6opt', 2);
      expect(instComponentAssembly6opt).toContain('6 Options: A–F');

      const instParagraphOrdering5opt = getQuestionTypeInstructions('read_paragraph_sentence_ordering', 5);
      expect(instParagraphOrdering5opt).toContain('5 Options: A–E');

      const instComprehensionPassages4opt = getQuestionTypeInstructions('read_comprehension_passages_4opt', 4);
      expect(instComprehensionPassages4opt).toContain('QUESTION TYPE: Intermediate Reading Comprehension');

      const instComprehensionLongArticles4opt = getQuestionTypeInstructions('read_comprehension_long_articles_4opt', 5);
      expect(instComprehensionLongArticles4opt).toContain('QUESTION TYPE: Advanced Reading Comprehension');

      const instClozeSentenceInsertion = getQuestionTypeInstructions('read_cloze_passage_sentence_insertion', 4);
      expect(instClozeSentenceInsertion).toContain('QUESTION TYPE: Cloze Passage');
    });

    it('calibrates read_dialogue_matching_split across contract, prompt and schema', () => {
      expect(getPartTypeContract('read_dialogue_matching_split').expectedOptions).toBe(6);
      expect(getPartTypeContract('read_dialogue_matching_split').category).toBe('dialogue_matching');

      const promptL2 = buildHskPrompt(2, 'reading', 5, [], 'read_dialogue_matching_split');
      expect(promptL2).toContain('EXACTLY 6 DISTINCT OPTIONS:');
      expect(promptL2).toContain('"options" MUST contain exactly 6 non-empty, unique strings.');

      const format = buildQuestionResponseFormat(2, 'reading', 'read_dialogue_matching_split', 5);
      const schema = (format.json_schema as any).schema.properties.questions.items.properties;
      expect(schema.options.minItems).toBe(6);
      expect(schema.options.maxItems).toBe(6);
    });
  });

  // =========================================================================
  // Feature 3: HSK 4–6 open-ended writing contract
  // =========================================================================
  describe('Feature 3: HSK 4–6 open-ended writing contract', () => {
    it('registers official writing part types with expectedOptions: 0 and writing_open_ended category', () => {
      const writingTypes = [
        'write_sentence_from_picture_word',
        'write_short_essay_80chars',
        'write_story_from_4pictures_100chars',
        'write_topic_essay_200chars',
        'write_summary_shortening_400chars',
        'write_topic_essay_300chars',
        'write_tianzige_from_pinyin',
      ];

      for (const pt of writingTypes) {
        const contract = getPartTypeContract(pt);
        expect(contract.expectedOptions, `expectedOptions for ${pt}`).toBe(0);
        expect(contract.category, `category for ${pt}`).toBe('writing_open_ended');
        expect(isOpenEndedWritingPartType(pt), `isOpenEndedWritingPartType for ${pt}`).toBe(true);
      }
    });

    it('enforces 0 options in structured response format for open-ended writing tasks', () => {
      const format = buildQuestionResponseFormat(4, 'writing', 'write_sentence_from_picture_word', 1);
      const schema = (format.json_schema as any).schema.properties.questions.items.properties;
      expect(schema.options.minItems).toBe(0);
      expect(schema.options.maxItems).toBe(0);
    });

    it('formats reference answer models and rubric criteria for writing prompts', () => {
      const promptHsk5 = buildHskPrompt(5, 'writing', 1, [], 'write_short_essay_80chars');
      expect(promptHsk5).toContain('OPEN-ENDED WRITING (0 OPTIONS):');
      expect(promptHsk5).toContain('"options" MUST be strictly an empty array: []');
      expect(promptHsk5).toContain('Tiêu chí chấm điểm CTI');
      expect(promptHsk5).toContain('Bài viết mẫu chuẩn điểm tối đa');

      const promptHsk6 = buildHskPrompt(6, 'writing', 1, [], 'write_summary_shortening_400chars');
      expect(promptHsk6).toContain('OPEN-ENDED WRITING (0 OPTIONS):');
      expect(promptHsk6).toContain('Tiêu chí chấm điểm CTI (Thang 100)');
    });
  });

  // =========================================================================
  // Feature 4: Exempt writing tasks from visual SVG theme checks
  // =========================================================================
  describe('Feature 4: Exempt writing tasks from visual SVG theme checks', () => {
    it('returns false for writing tasks in isVisualQuestionType', () => {
      expect(isVisualQuestionType('write_sentence_from_picture_word')).toBe(false);
      expect(isVisualQuestionType('write_story_from_4pictures_100chars')).toBe(false);
      expect(isVisualQuestionType('write_component_assembly_6opt')).toBe(false);
      expect(isVisualQuestionType('write_tianzige_from_pinyin')).toBe(false);
    });

    it('returns true for genuine visual picture tasks', () => {
      expect(isVisualQuestionType('listen_picture_match_3opt')).toBe(true);
      expect(isVisualQuestionType('listen_picture_match_4opt')).toBe(true);
      expect(isVisualQuestionType('listen_dialogue_picture_match_6opt')).toBe(true);
      expect(isVisualQuestionType('read_sentence_picture_match_6opt')).toBe(true);
    });

    it('validates open-ended writing question without illustration_theme', () => {
      const q: any = {
        stem: '请结合以下5个词语写一篇80字左右的短文：[缓解, 压力, 措施, 积极, 效果]。',
        completed_stem: '请结合以下5个词语写一篇80字左右的短文：[缓解, 压力, 措施, 积极, 效果]。',
        options: [],
        answer_idx: 0,
        explanation_summary_vi: 'Yêu cầu đề thi viết tự luận HSK 5: Vận dụng 5 từ khóa.',
        answer_rationale_vi: 'Bài viết mẫu chuẩn điểm tối đa: 面对快节奏的现代生活，我们常常感到巨大的心理压力。为了有效缓解这种压力，公司采取了一系列积极措施。',
        explanation_vi: 'Giải thích chi tiết.',
        level: 5,
        skill: 'writing',
        part_type: 'write_short_essay_80chars',
        illustration_theme: null,
      };

      const res = validateCandidate(q, []);
      const themeErrors = res.errors.filter((e) => e.includes('illustration_theme') || e.includes('SVG'));
      expect(themeErrors).toEqual([]);
    });
  });

  // =========================================================================
  // Feature 5: Latin character check bracket exemption
  // =========================================================================
  describe('Feature 5: Latin character check bracket exemption', () => {
    it('does not reject stems with bracketed pinyin keywords in square brackets [...]', () => {
      const q: any = {
        stem: '看图并结合词语写一句话：[dǎ sǎo]。',
        completed_stem: '看图并结合词语写一句话：[dǎ sǎo]。',
        options: [],
        answer_idx: 0,
        explanation_summary_vi: 'Đề thi yêu cầu nhìn tranh và từ khóa để viết một câu hoàn chỉnh.',
        answer_rationale_vi: 'Câu mẫu: 周末我们在家里打扫房间。',
        explanation_vi: 'Giải thích chi tiết.',
        level: 4,
        skill: 'writing',
        part_type: 'write_sentence_from_picture_word',
        illustration_theme: null,
      };

      const res = validateCandidate(q, []);
      const latinErrors = res.errors.filter((e) => e.includes('Latin'));
      expect(latinErrors).toEqual([]);
    });

    it('does not reject stems with bracketed pinyin keywords in Chinese full-width brackets 【...】', () => {
      const q: any = {
        stem: '请结合词语写一句话：【huǎn jiě】。',
        completed_stem: '请结合词语写一句话：【huǎn jiě】。',
        options: [],
        answer_idx: 0,
        explanation_summary_vi: 'Viết câu hoàn chỉnh với từ khóa.',
        answer_rationale_vi: 'Câu mẫu: 积极的措施有助于缓解压力。',
        explanation_vi: 'Giải thích chi tiết.',
        level: 5,
        skill: 'writing',
        part_type: 'write_sentence_from_picture_word',
        illustration_theme: null,
      };

      const res = validateCandidate(q, []);
      const latinErrors = res.errors.filter((e) => e.includes('Latin'));
      expect(latinErrors).toEqual([]);
    });
  });

  // =========================================================================
  // Feature 6: Component assembly option preservation
  // =========================================================================
  describe('Feature 6: Component assembly option preservation', () => {
    it('distinguishes write_component_assembly_6opt from open-ended writing tasks', () => {
      expect(isOpenEndedWritingTask('write_component_assembly_6opt')).toBe(false);
      expect(isOpenEndedWritingTask('write_sentence_from_picture_word')).toBe(true);
      expect(isOpenEndedWritingTask('write_short_essay_80chars')).toBe(true);
      expect(isOpenEndedWritingTask('write_story_from_4pictures_100chars')).toBe(true);
      expect(isOpenEndedWritingTask('write_topic_essay_200chars')).toBe(true);
      expect(isOpenEndedWritingTask('write_summary_shortening_400chars')).toBe(true);
      expect(isOpenEndedWritingTask('write_topic_essay_300chars')).toBe(true);
      expect(isOpenEndedWritingTask('write_tianzige_from_pinyin')).toBe(true);
    });

    it('write_component_assembly_6opt has expectedOptions: 6 in partTypeContract and questionValidator', () => {
      const contract = getPartTypeContract('write_component_assembly_6opt');
      expect(contract.expectedOptions).toBe(6);
      expect(contract.category).toBe('generic_mcq');

      expect(getExpectedOptionCount(2, 'write_component_assembly_6opt')).toBe(6);
    });
  });
});
