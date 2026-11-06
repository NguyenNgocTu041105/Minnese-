import { describe, it, expect } from 'vitest';
import {
  validateFormatCompatibility,
  isOptionCountCompatible,
  loadBlueprintData,
} from '../src/server/qbankFormatSync.js';
import { isCompatiblePartType } from '../src/server/qbankCoverageEngine.js';

describe('Milestone M5: Feature 22 - Blueprint Compatibility & Variant Mapping', () => {
  describe('Authoritative Blueprints Verification (HSK 1–6)', () => {
    it('verifies all 6 level blueprints load successfully with verified sections', () => {
      for (let lvl = 1; lvl <= 6; lvl++) {
        const bp = loadBlueprintData(lvl);
        expect(bp).toBeDefined();
        expect(bp.level).toBe(lvl);
        expect(bp.sections).toBeDefined();
        expect(bp.sections.listening).toBeDefined();
        expect(bp.sections.reading).toBeDefined();
      }
    });
  });

  describe('3-Option Calibration (HSK 1 & 2)', () => {
    it('qualifies genuine HSK 1 3-option listening questions for exam pool', () => {
      const q = {
        id: 'hsk1_listen_3opt_sample',
        level: 1,
        skill: 'listening',
        part_type: 'listen_picture_match_3opt',
        stem: '男：你想吃什么？女：我想吃米饭。',
        audio_text: '男：你想吃什么？女：我想吃米饭。',
        options: ['米饭', '苹果', '茶'],
        answer_idx: 0,
        illustration_theme: 'food',
        options_images: ['img1.svg', 'img2.svg', 'img3.svg'],
      };

      const result = validateFormatCompatibility(q, 1);
      expect(result.practice_eligible).toBe(true);
      expect(result.exam_eligible).toBe(true);
      expect(result.ineligible_reasons).toEqual([]);
    });

    it('qualifies genuine HSK 1 3-option reading comprehension questions', () => {
      const q = {
        id: 'hsk1_read_3opt_sample',
        level: 1,
        skill: 'reading',
        part_type: 'read_comprehension_short_3opt',
        stem: '明天是星期日，我们都不去学校。★ 明天他们去哪儿？',
        options: ['学校', '家', '医院'],
        answer_idx: 1,
        explanation_vi: 'Theo đoạn văn, ngày mai chủ nhật không ai đến trường.',
      };

      const result = validateFormatCompatibility(q, 1);
      expect(result.practice_eligible).toBe(true);
      expect(result.exam_eligible).toBe(true);
      expect(result.ineligible_reasons).toEqual([]);
    });
  });

  describe('6-Option Word-Bank Calibration (HSK 1 & 2)', () => {
    it('qualifies genuine HSK 1 6-option word bank questions', () => {
      const q = {
        id: 'hsk1_wb_6opt_sample',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_word_bank_6opt',
        stem: '他在____买了一本书。',
        options: ['商店', '学校', '医院', '北京', '家', '饭馆'],
        answer_idx: 0,
        explanation_vi: 'Điền từ 商店 (cửa hàng) phù hợp ngữ cảnh mua sách.',
      };

      const result = validateFormatCompatibility(q, 1);
      expect(result.practice_eligible).toBe(true);
      expect(result.exam_eligible).toBe(true);
      expect(result.ineligible_reasons).toEqual([]);
    });
  });

  describe('0-Option Open-Ended Writing Calibration (HSK 4–6)', () => {
    it('qualifies HSK 4 sentence writing tasks', () => {
      const q = {
        id: 'hsk4_sentence_sample',
        level: 4,
        skill: 'writing',
        part_type: 'write_sentence_from_picture_word',
        stem: '看图并使用词语造句：乒乓球。',
        options: [],
        answer_idx: 0,
        explanation_vi: '我和弟弟每个周末都在学校体育馆打乒乓球。',
      };

      const result = validateFormatCompatibility(q, 4);
      expect(result.practice_eligible).toBe(true);
      expect(result.exam_eligible).toBe(true);
    });

    it('qualifies HSK 5 80-word essay writing tasks with 0 options', () => {
      const q = {
        id: 'hsk5_essay_sample',
        level: 5,
        skill: 'writing',
        part_type: 'write_words_essay_80words',
        stem: '请结合以下词语写一篇80字左右短文：热情、支持、计划、成功、感谢。',
        options: [],
        answer_idx: 0,
        explanation_vi: 'Bài viết mẫu tham khảo về sự hỗ trợ và thành công.',
      };

      const result = validateFormatCompatibility(q, 5);
      expect(result.practice_eligible).toBe(true);
      expect(result.exam_eligible).toBe(true);
    });

    it('qualifies HSK 6 400-word summary writing tasks with 0 options', () => {
      const q = {
        id: 'hsk6_summary_sample',
        level: 6,
        skill: 'writing',
        part_type: 'write_narrative_summary_400words',
        stem: '阅读一篇1000字记叙文并缩写为400字短文。',
        options: [],
        answer_idx: 0,
        explanation_vi: 'Bài tóm tắt mẫu 400 chữ.',
      };

      const result = validateFormatCompatibility(q, 6);
      expect(result.practice_eligible).toBe(true);
      expect(result.exam_eligible).toBe(true);
    });
  });

  describe('Variant Compatibility & Pedagogical Flexibility', () => {
    it('isOptionCountCompatible allows 4-option standalone items to substitute for 6-word bank parts', () => {
      const isCompat = isOptionCountCompatible('read_fill_blank_word_bank_6opt', 6, 4);
      expect(isCompat).toBe(true);
    });

    it('isOptionCountCompatible allows 4-option questions to substitute for 3-option parts', () => {
      const isCompat = isOptionCountCompatible('read_comprehension_short_3opt', 3, 4);
      expect(isCompat).toBe(true);
    });

    it('isOptionCountCompatible strictly rejects non-zero options for open-ended writing parts', () => {
      const isCompat = isOptionCountCompatible('write_words_essay_80words', 0, 4);
      expect(isCompat).toBe(false);

      const isZeroCompat = isOptionCountCompatible('write_words_essay_80words', 0, 0);
      expect(isZeroCompat).toBe(true);
    });

    it('isCompatiblePartType maps fill_blank variants bidirectionally', () => {
      expect(isCompatiblePartType('read_fill_blank_word_bank_6opt', 'read_fill_blank_4opt')).toBe(true);
      expect(isCompatiblePartType('read_fill_blank_cloze_4opt', 'fill_blank')).toBe(true);
    });
  });
});
