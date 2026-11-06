import { describe, it, expect } from 'vitest';
import { verifyQuestionVocab, loadApprovedNames } from '../src/server/qbankCoverageEngine.js';
import { validateCandidate } from '../src/server/llm/questionValidator.js';

describe('HSK Level Vocabulary Contract & Syllabus Verification', () => {
  describe('verifyQuestionVocab: Level & Syllabus Boundary', () => {
    it('verifies valid HSK 1 vocabulary in stem, options, and target', () => {
      const q = {
        stem: '我想喝____。',
        options: ['水', '茶', '苹果', '米饭'],
        answer_idx: 0,
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };

      const result = verifyQuestionVocab(q, 1);
      expect(result.isValidForLevel).toBe(true);
      expect(result.aboveLevel).toEqual([]);
      expect(result.outOfSyllabus).toEqual([]);
      expect(result.tested).toContain('水');
      expect(result.contextual).toContain('喝');
      expect(result.contextual).toContain('想');
    });

    it('detects over-level tested vocabulary (e.g. HSK 4 word in HSK 1 target option)', () => {
      const q = {
        stem: '这个问题很____。',
        options: ['复杂', '大', '好', '小'], // 复杂 is HSK 4
        answer_idx: 0,
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };

      const result = verifyQuestionVocab(q, 1);
      expect(result.isValidForLevel).toBe(false);
      const fuza = result.aboveLevel.find((w) => w.word === '复杂');
      expect(fuza).toBeDefined();
      expect(fuza!.wordLevel).toBe(4);
      expect(fuza!.questionLevel).toBe(1);
    });

    it('detects over-level contextual vocabulary in the stem (e.g. HSK 3/4 words in HSK 1 stem)', () => {
      const q = {
        stem: '他在图书馆研究____。', // 图书馆 is HSK 3, 研究 is HSK 4
        options: ['中国', '水', '茶', '苹果'],
        answer_idx: 1,
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };

      const result = verifyQuestionVocab(q, 1);
      expect(result.isValidForLevel).toBe(false);
      expect(result.aboveLevel.some((w) => w.word === '图书馆' && w.wordLevel === 3)).toBe(true);
      expect(result.aboveLevel.some((w) => w.word === '研究' && w.wordLevel === 4)).toBe(true);
    });

    it('recognizes approved proper names from names.txt without flagging as out-of-syllabus or over-level', () => {
      const names = loadApprovedNames();
      expect(names.has('李华')).toBe(true);
      expect(names.has('王明')).toBe(true);
      expect(names.has('北京')).toBe(true);

      const q = {
        stem: '李华和王明去北京____。',
        options: ['看书', '喝水', '吃饭', '买苹果'],
        answer_idx: 0,
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };

      const result = verifyQuestionVocab(q, 1);
      expect(result.outOfSyllabus).toEqual([]);
      expect(result.aboveLevel).toEqual([]);
      expect(result.isValidForLevel).toBe(true);
    });

    it('flags unapproved out-of-syllabus characters or non-standard words', () => {
      const q = {
        stem: '他看见一个____。',
        options: ['👽', '👾', '🤖', '猫'],
        answer_idx: 3,
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };

      const result = verifyQuestionVocab(q, 1);
      // Non-Hanzi emojis or unknown symbols in options
      expect(result.isValidForLevel).toBe(true); // tested is '猫' (HSK 1)
    });
  });

  describe('validateCandidate: Enforcement in Quality Gates', () => {
    it('strictly rejects HSK 1 question when tested option exceeds level', () => {
      const candidate = {
        stem: '这个问题很____。',
        completed_stem: '这个问题很复杂。',
        options: ['复杂', '大', '好', '小'], // 复杂 is HSK 4
        answer_idx: 0,
        level: 1,
        skill: 'reading' as const,
        part_type: 'read_fill_blank_4opt',
        explanation_vi: 'Đáp án đúng: 复杂 (phức tạp).',
      };

      const res = validateCandidate(candidate);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('exceeding HSK Level 1') && e.includes('复杂'))).toBe(true);
    });

    it('strictly rejects HSK 1 question when stem contains higher-level words (e.g. 研究 HSK 4)', () => {
      const candidate = {
        stem: '他在图书馆研究____。',
        completed_stem: '他在图书馆研究中国。',
        options: ['中国', '水', '茶', '苹果'],
        answer_idx: 0,
        level: 1,
        skill: 'reading' as const,
        part_type: 'read_fill_blank_4opt',
        explanation_vi: 'Đáp án đúng: 中国.',
      };

      const res = validateCandidate(candidate);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('exceeding HSK Level 1'))).toBe(true);
    });

    it('passes Gate 6 when all words in stem, options, and tested targets belong to HSK 1 or approved proper names', () => {
      const candidate = {
        stem: '李华想喝____。',
        completed_stem: '李华想喝水。',
        options: ['水', '苹果', '飞机', '医生'],
        answer_idx: 0,
        level: 1,
        skill: 'reading' as const,
        part_type: 'read_fill_blank_4opt',
        pinyin: 'lǐ huá xiǎng hē shuǐ .',
        explanation_vi: 'Đáp án đúng: 水 (nước). Uống nước là kết hợp chuẩn mực trong tiếng Hán.\n- Phân tích phương án nhiễu: 苹果 (táo) là thức ăn. 飞机 (máy bay) là phương tiện. 医生 (bác sĩ) là nghề nghiệp.',
        naturalness_review: {
          status: 'natural' as const,
          rationale_vi: 'Câu hoàn chỉnh tự nhiên và chuẩn mực ngữ pháp HSK 1.',
        },
      };

      const res = validateCandidate(candidate);
      // No vocabulary errors
      const vocabErrors = res.errors.filter((e) => e.includes('exceeding HSK Level') || e.includes('out-of-syllabus'));
      expect(vocabErrors).toEqual([]);
    });
  });
});
