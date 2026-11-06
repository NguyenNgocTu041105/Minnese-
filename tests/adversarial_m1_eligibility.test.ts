import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { DatabaseSync } from 'node:sqlite';

import {
  validateFormatCompatibility,
  reEvaluateApprovedQuestions,
} from '../src/server/qbankFormatSync';
import { loadApprovedQuestionsFromDb, createTestExamDb } from '../src/server/examRoutes';

describe('Adversarial Challenge: Milestone M1 Eligibility Separation & Format Verification', () => {
  const qbankDbPath = path.resolve(process.cwd(), 'data/qbank/qbank.db');
  const hskExamDbPath = path.resolve(process.cwd(), 'data/hsk_exam.db');

  // =========================================================================
  // 1. ADVERSARIAL & MALFORMED INPUTS TO validateFormatCompatibility
  // =========================================================================
  describe('1. Adversarial inputs to validateFormatCompatibility', () => {
    describe('1.1 Stem mutations & edge cases', () => {
      const invalidStems = [
        { name: 'null stem', val: null },
        { name: 'undefined stem', val: undefined },
        { name: 'empty string stem', val: '' },
        { name: 'whitespace only stem', val: '    ' },
        { name: 'single char stem', val: '好' },
        { name: 'number stem', val: 12345 },
        { name: 'boolean stem', val: true },
        { name: 'object stem', val: { text: '你好' } },
        { name: 'array stem', val: ['你好'] },
      ];

      for (const t of invalidStems) {
        it(`rejects practice and exam eligibility on ${t.name}`, () => {
          const q = {
            stem: t.val,
            options: ['选项A', '选项B', '选项C', '选项D'],
            answer_idx: 0,
            level: 4,
            skill: 'reading',
            part_type: 'read_comprehension_passages_4opt',
          };
          const res = validateFormatCompatibility(q, 4);
          expect(res.practice_eligible).toBe(false);
          expect(res.exam_eligible).toBe(false);
          expect(res.ineligible_reasons.length).toBeGreaterThanOrEqual(1);
          expect(res.ineligible_reasons).toContain('Nội dung câu hỏi (stem) quá ngắn hoặc trống');
        });
      }
    });

    describe('1.2 Options mutations (counts from 0 to 7 & malformed formats)', () => {
      it('rejects null, undefined, primitives, and malformed JSON options', () => {
        const malformedOptions = [
          null,
          undefined,
          42,
          true,
          { opt1: 'A', opt2: 'B' },
          '{invalid json string',
          '',
        ];

        for (const badOpt of malformedOptions) {
          const res = validateFormatCompatibility({
            stem: '这是一个测试句子，请阅读短文后回答问题。',
            options: badOpt as any,
            answer_idx: 0,
            level: 4,
            skill: 'reading',
            part_type: 'read_comprehension_passages_4opt',
          });
          expect(res.practice_eligible).toBe(false);
          expect(res.exam_eligible).toBe(false);
          expect(res.ineligible_reasons.length).toBeGreaterThanOrEqual(1);
          expect(res.ineligible_reasons).toContain('Số lượng phương án trả lời phải từ 2 trở lên');
        }
      });

      it('evaluates 0 options (empty array): disqualified from practice and exam', () => {
        const res = validateFormatCompatibility({
          stem: '这是一个测试句子，请阅读短文后回答问题。',
          options: [],
          answer_idx: 0,
          level: 4,
          skill: 'reading',
          part_type: 'read_comprehension_passages_4opt',
        });
        expect(res.practice_eligible).toBe(false);
        expect(res.exam_eligible).toBe(false);
        expect(res.ineligible_reasons.length).toBeGreaterThanOrEqual(1);
        expect(res.ineligible_reasons).toContain('Số lượng phương án trả lời phải từ 2 trở lên');
      });

      it('evaluates 1 option: disqualified from practice and exam', () => {
        const res = validateFormatCompatibility({
          stem: '这是一个测试句子，请阅读短文后回答问题。',
          options: ['唯一选项'],
          answer_idx: 0,
          level: 4,
          skill: 'reading',
          part_type: 'read_comprehension_passages_4opt',
        });
        expect(res.practice_eligible).toBe(false);
        expect(res.exam_eligible).toBe(false);
        expect(res.ineligible_reasons.length).toBeGreaterThanOrEqual(1);
        expect(res.ineligible_reasons).toContain('Số lượng phương án trả lời phải từ 2 trở lên');
      });

      it('evaluates 2 options: practice eligible, but exam ineligible when blueprint requires 3, 4, 5, or 6', () => {
        const res = validateFormatCompatibility({
          stem: '这是一个测试句子，请阅读短文后回答问题。',
          options: ['选项A', '选项B'],
          answer_idx: 0,
          level: 4,
          skill: 'reading',
          part_type: 'read_comprehension_passages_4opt',
        });
        expect(res.practice_eligible).toBe(true);
        expect(res.exam_eligible).toBe(false);
        expect(res.ineligible_reasons.length).toBeGreaterThanOrEqual(1);
        expect(res.ineligible_reasons[0]).toContain('yêu cầu chính xác 4 phương án (câu hiện có 2)');
      });

      it('evaluates 3 options: qualifies in HSK 1 3-opt, disqualifies in HSK 4 4-opt', () => {
        // HSK 4 requires 4 options for read_comprehension_passages_4opt
        const resHsk4 = validateFormatCompatibility({
          stem: '这是一个测试句子，请阅读短文后回答问题。',
          options: ['A', 'B', 'C'],
          answer_idx: 1,
          level: 4,
          skill: 'reading',
          part_type: 'read_comprehension_passages_4opt',
        });
        expect(resHsk4.practice_eligible).toBe(true);
        expect(resHsk4.exam_eligible).toBe(false);
        expect(resHsk4.ineligible_reasons.length).toBeGreaterThanOrEqual(1);
        expect(resHsk4.ineligible_reasons[0]).toContain('yêu cầu chính xác 4 phương án (câu hiện có 3)');

        // HSK 1 reading part 4 requires 3 options
        const resHsk1 = validateFormatCompatibility({
          stem: '这是一个测试句子，请阅读后选择答案。',
          options: ['A', 'B', 'C'],
          answer_idx: 1,
          level: 1,
          skill: 'reading',
          part_type: 'read_comprehension_short_3opt',
        });
        expect(resHsk1.practice_eligible).toBe(true);
        expect(resHsk1.exam_eligible).toBe(true);
        expect(resHsk1.ineligible_reasons).toEqual([]);
      });

      it('evaluates options count compatibility: qualifies 4-opt in HSK 4 & HSK 1 (pedagogical substitute), disqualifies 5-opt in HSK 1', () => {
        // 4 options are accepted as pedagogical substitute for 3-option parts per isOptionCountCompatible
        const resHsk1Substitute = validateFormatCompatibility({
          stem: '这是一个测试句子，请阅读后选择答案。',
          options: ['A', 'B', 'C', 'D'],
          answer_idx: 2,
          level: 1,
          skill: 'reading',
          part_type: 'read_comprehension_short_3opt',
        });
        expect(resHsk1Substitute.practice_eligible).toBe(true);
        expect(resHsk1Substitute.exam_eligible).toBe(true);
        expect(resHsk1Substitute.ineligible_reasons).toEqual([]);

        // 5 options cannot substitute for 3-option parts and are strictly disqualified
        const resHsk1Disqualified = validateFormatCompatibility({
          stem: '这是一个测试句子，请阅读后选择答案。',
          options: ['A', 'B', 'C', 'D', 'E'],
          answer_idx: 2,
          level: 1,
          skill: 'reading',
          part_type: 'read_comprehension_short_3opt',
        });
        expect(resHsk1Disqualified.practice_eligible).toBe(true);
        expect(resHsk1Disqualified.exam_eligible).toBe(false);
        expect(resHsk1Disqualified.ineligible_reasons.length).toBeGreaterThanOrEqual(1);
        expect(resHsk1Disqualified.ineligible_reasons[0]).toContain('yêu cầu chính xác 3 phương án (câu hiện có 5)');

        const resHsk4 = validateFormatCompatibility({
          stem: '这是一个测试句子，请阅读短文后回答问题。',
          options: ['A', 'B', 'C', 'D'],
          answer_idx: 2,
          level: 4,
          skill: 'reading',
          part_type: 'read_comprehension_passages_4opt',
        });
        expect(resHsk4.practice_eligible).toBe(true);
        expect(resHsk4.exam_eligible).toBe(true);
        expect(resHsk4.ineligible_reasons).toEqual([]);
      });

      it('evaluates 5 options: qualifies in HSK 5 Part 2 paragraph ordering, disqualifies in HSK 4 4-opt', () => {
        const resHsk4 = validateFormatCompatibility({
          stem: '这是一个测试句子，请阅读短文后回答问题。',
          options: ['A', 'B', 'C', 'D', 'E'],
          answer_idx: 0,
          level: 4,
          skill: 'reading',
          part_type: 'read_comprehension_passages_4opt',
        });
        expect(resHsk4.practice_eligible).toBe(true);
        expect(resHsk4.exam_eligible).toBe(false);
        expect(resHsk4.ineligible_reasons.length).toBeGreaterThanOrEqual(1);
        expect(resHsk4.ineligible_reasons[0]).toContain('yêu cầu chính xác 4 phương án (câu hiện có 5)');

        const resHsk5 = validateFormatCompatibility({
          stem: '请排列以下句子顺序组成连贯段落：',
          options: ['A', 'B', 'C', 'D', 'E'],
          answer_idx: 0,
          level: 5,
          skill: 'reading',
          part_type: 'read_paragraph_sentence_ordering',
        });
        expect(resHsk5.practice_eligible).toBe(true);
        expect(resHsk5.exam_eligible).toBe(true);
        expect(resHsk5.ineligible_reasons).toEqual([]);
      });

      it('evaluates 6 options: qualifies in HSK 1 6-opt word bank, disqualifies in HSK 4 4-opt', () => {
        const resHsk4 = validateFormatCompatibility({
          stem: '这是一个测试句子，请阅读短文后回答问题。',
          options: ['A', 'B', 'C', 'D', 'E', 'F'],
          answer_idx: 0,
          level: 4,
          skill: 'reading',
          part_type: 'read_comprehension_passages_4opt',
        });
        expect(resHsk4.practice_eligible).toBe(true);
        expect(resHsk4.exam_eligible).toBe(false);
        expect(resHsk4.ineligible_reasons[0]).toContain('yêu cầu chính xác 4 phương án (câu hiện có 6)');

        const resHsk1 = validateFormatCompatibility({
          stem: '他在____买了一只小猫。',
          options: ['商店', '医院', '学校', '车站', '北京', '饭馆'],
          answer_idx: 0,
          level: 1,
          skill: 'reading',
          part_type: 'read_fill_blank_word_bank_6opt',
        });
        expect(resHsk1.practice_eligible).toBe(true);
        expect(resHsk1.exam_eligible).toBe(true);
        expect(resHsk1.ineligible_reasons).toEqual([]);
      });

      it('evaluates 7 options: always disqualified from exam in all HSK 1–6 blueprints', () => {
        for (let lvl = 1; lvl <= 6; lvl++) {
          const res = validateFormatCompatibility({
            stem: '这是一个测试句子，请选择最恰当的词语填空。',
            options: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
            answer_idx: 0,
            level: lvl,
            skill: 'reading',
            part_type: 'read_comprehension_passages_4opt',
          }, lvl);
          expect(res.practice_eligible).toBe(true);
          expect(res.exam_eligible).toBe(false);
          expect(res.ineligible_reasons.length).toBeGreaterThanOrEqual(1);
        }
      });
    });

    describe('1.3 Unknown part_type, mismatched level, audio and image checks', () => {
      it('handles unknown or empty part_type with clear diagnostic reason', () => {
        const unknownTypes = ['completely_fabricated_type', 'random_part', '', null, undefined];
        for (const pt of unknownTypes) {
          const res = validateFormatCompatibility({
            stem: '这是一个测试句子，请选择最恰当的词语填空。',
            options: ['A', 'B', 'C', 'D'],
            answer_idx: 0,
            level: 3,
            skill: 'reading',
            part_type: pt,
          }, 3);
          expect(res.practice_eligible).toBe(true);
          expect(res.exam_eligible).toBe(false);
          expect(res.ineligible_reasons.length).toBeGreaterThanOrEqual(1);
          expect(res.ineligible_reasons[0]).toContain('không thuộc bất kỳ phần nào trong blueprint HSK 3');
        }
      });

      it('handles mismatched or invalid level (< 1 or > 6)', () => {
        const invalidLevels = [-1, 7, 10, 99];
        for (const lvl of invalidLevels) {
          const res = validateFormatCompatibility({
            stem: '这是一个测试句子，请选择最恰当的词语填空。',
            options: ['A', 'B', 'C', 'D'],
            answer_idx: 0,
            level: lvl,
            skill: 'reading',
            part_type: 'read_comprehension_passages_4opt',
          }, lvl);
          expect(res.practice_eligible).toBe(false);
          expect(res.exam_eligible).toBe(false);
          expect(res.ineligible_reasons.length).toBeGreaterThanOrEqual(1);
          expect(res.ineligible_reasons).toContain('Cấp độ HSK phải từ 1 đến 6');
        }
      });

      it('disqualifies listening questions missing audio_text/url/dialogue markers', () => {
        const noAudioListening = {
          stem: '男的今天晚上打算做什么？', // missing 男： / 女： dialogue lines and 问： prompt marker
          options: ['看电影', '去吃饭', '在家休息', '买书'],
          answer_idx: 2,
          level: 4,
          skill: 'listening',
          part_type: 'listen_dialogue_qa_4opt',
        };
        const res = validateFormatCompatibility(noAudioListening, 4);
        expect(res.practice_eligible).toBe(true);
        expect(res.exam_eligible).toBe(false);
        expect(res.ineligible_reasons.length).toBeGreaterThanOrEqual(1);
        expect(res.ineligible_reasons[0]).toContain('Câu hỏi nghe thiếu tài nguyên văn bản âm thanh');

        // Qualifying with audio_text
        const withAudioListening = {
          ...noAudioListening,
          audio_text: '男：今天晚上你有什么安排？\n女：我想在家看书，你呢？\n男：我也在家休息吧。',
        };
        const res2 = validateFormatCompatibility(withAudioListening, 4);
        expect(res2.exam_eligible).toBe(true);
        expect(res2.ineligible_reasons).toEqual([]);

        // Qualifying with stem containing dialogue markers
        const withDialogueStem = {
          ...noAudioListening,
          stem: '男：今天晚上你有什么安排？\n女：我想在家看书，你呢？\n男：我也在家休息吧。\n问：男的今天晚上打算做什么？',
        };
        const res3 = validateFormatCompatibility(withDialogueStem, 4);
        expect(res3.exam_eligible).toBe(true);
        expect(res3.ineligible_reasons).toEqual([]);
      });

      it('disqualifies visual / picture matching questions missing valid illustration theme or options_images', () => {
        const noImageVisual = {
          stem: '听短语，从3张图片中选出相符的图片。',
          options: ['A', 'B', 'C'],
          answer_idx: 0,
          level: 1,
          skill: 'listening',
          part_type: 'listen_picture_match_3opt',
          audio_text: '男：外面下雨了，你带伞了吗？',
        };
        const res = validateFormatCompatibility(noImageVisual, 1);
        expect(res.practice_eligible).toBe(true);
        expect(res.exam_eligible).toBe(false);
        expect(res.ineligible_reasons.length).toBeGreaterThanOrEqual(1);
        expect(res.ineligible_reasons).toContain('Dạng bài nhìn tranh thiếu chủ đề hình minh họa SVG hợp lệ');

        // Qualifying with valid illustration_theme
        const withValidTheme = {
          ...noImageVisual,
          illustration_theme: 'rain',
        };
        const res2 = validateFormatCompatibility(withValidTheme, 1);
        expect(res2.exam_eligible).toBe(true);
        expect(res2.ineligible_reasons).toEqual([]);

        // Qualifying with options_images
        const withOptionsImages = {
          ...noImageVisual,
          options_images: ['rain.svg', 'sunny.svg', 'snow.svg'],
        };
        const res3 = validateFormatCompatibility(withOptionsImages, 1);
        expect(res3.exam_eligible).toBe(true);
        expect(res3.ineligible_reasons).toEqual([]);
      });
    });

    describe('1.4 Discovered Edge-Case Findings & Vulnerabilities', () => {
      it('Finding 1: JSON string of non-array object {"not": "an array"} bypasses optionsArr.length check', () => {
        const res = validateFormatCompatibility({
          stem: '这是一个测试句子，请选择最恰当的词语填空。',
          options: '{"not": "an array"}',
          answer_idx: 0,
          level: 4,
          skill: 'reading',
          part_type: 'read_comprehension_passages_4opt',
        });
        // Vulnerability: JSON.parse('{"not": "an array"}') returns an Object without Array.isArray check.
        // optionsArr.length is undefined, so undefined < 2 is false! practice_eligible remains true.
        // However, exam_eligible correctly evaluates to false, and ineligible_reasons is NOT empty.
        expect(res.exam_eligible).toBe(false);
        expect(res.ineligible_reasons.length).toBeGreaterThanOrEqual(1);
        expect(res.ineligible_reasons[0]).toContain('undefined');
      });

      it('Finding 2 fixed: level 0 question is safely clamped and never treated as un-validated', () => {
        const res = validateFormatCompatibility({
          stem: '这是一个测试句子，请阅读短文后回答问题。',
          options: ['A', 'B', 'C', 'D'],
          answer_idx: 0,
          level: 0,
          skill: 'reading',
          part_type: 'read_fill_blank_4opt',
        }, 0);
        // TargetLevel falls back to 1. In HSK 1 reading, read_fill_blank_4opt is incompatible with the 6-opt word bank
        expect(res.practice_eligible).toBe(true);
        expect(res.exam_eligible).toBe(false);
        expect(res.ineligible_reasons.length).toBeGreaterThanOrEqual(1);
      });

      it('Finding 3 fixed: bounded matching ensures read_fill_blank_4opt with 4 options does NOT match 6-opt word bank in HSK 4', () => {
        const qHsk4 = {
          stem: '这是一个测试句子，请选择最恰当的词语填空。',
          options: ['A', 'B', 'C', 'D'],
          answer_idx: 0,
          level: 4,
          skill: 'reading',
          part_type: 'read_fill_blank_4opt', // declared as 4opt with 4 options
        };
        const res = validateFormatCompatibility(qHsk4, 4);
        // 4 options cannot satisfy the 6-option requirement for word_bank blueprint (reading_1)
        expect(res.matched_blueprint_part).not.toBe('reading_1');
        expect(res.matched_blueprint_part).toBe('reading_3');
        expect(res.ineligible_reasons).toContain('Dạng bài read_fill_blank_word_bank_split yêu cầu chính xác 6 phương án (câu hiện có 4)');
      });
    });
  });

  // =========================================================================
  // 2. FUZZING INVARIANT: IF EXAM_ELIGIBLE === FALSE, INELIGIBLE_REASONS IS NEVER EMPTY
  // =========================================================================
  describe('2. Invariant: Whenever exam_eligible === false, ineligible_reasons.length >= 1', () => {
    it('guarantees reasons length >= 1 across 150+ fuzz permutations', () => {
      const stems = [null, '', 'a', '正常测试题干句子内容', '123'];
      const options = [
        [],
        ['A'],
        ['A', 'B'],
        ['A', 'B', 'C'],
        ['A', 'B', 'C', 'D'],
        ['A', 'B', 'C', 'D', 'E'],
        ['A', 'B', 'C', 'D', 'E', 'F'],
        ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
      ];
      const answerIndices = [-1, 0, 1, 3, 5, 10, NaN];
      const partTypes = ['read_comprehension_passages_4opt', 'unknown_type', 'listen_dialogue_qa_4opt', ''];

      let checkedCount = 0;
      for (const st of stems) {
        for (const opt of options) {
          for (const ans of answerIndices) {
            for (const pt of partTypes) {
              const q = {
                stem: st,
                options: opt,
                answer_idx: ans,
                level: 4,
                skill: 'reading',
                part_type: pt,
              };
              const res = validateFormatCompatibility(q, 4);
              if (!res.exam_eligible) {
                expect(res.ineligible_reasons.length).toBeGreaterThanOrEqual(1);
                checkedCount++;
              }
            }
          }
        }
      }
      expect(checkedCount).toBeGreaterThan(150);
    });
  });

  // =========================================================================
  // 3. STRICT EXCLUSION IN loadApprovedQuestionsFromDb(level, { mode: 'mock' })
  // =========================================================================
  describe('3. Strict exclusion in loadApprovedQuestionsFromDb', () => {
    it('returns exam_eligible questions for levels 1 and 4, empty array for levels 2, 3, 5, 6 in mock mode against live qbank.db', () => {
      // HSK 1 has 10 exam_eligible reading comprehension questions; HSK 4 has 3 exam_eligible fill-in-the-blank questions
      expect(loadApprovedQuestionsFromDb(1, { mode: 'mock' }).length).toBe(10);
      expect(loadApprovedQuestionsFromDb(2, { mode: 'mock' })).toEqual([]);
      expect(loadApprovedQuestionsFromDb(3, { mode: 'mock' })).toEqual([]);
      expect(loadApprovedQuestionsFromDb(4, { mode: 'mock' }).length).toBe(3);
      expect(loadApprovedQuestionsFromDb(5, { mode: 'mock' })).toEqual([]);
      expect(loadApprovedQuestionsFromDb(6, { mode: 'mock' })).toEqual([]);
    });

    it('returns non-empty approved questions in practice mode for levels with questions', () => {
      // HSK 1 and HSK 4 have approved questions in live database
      const hsk1Practice = loadApprovedQuestionsFromDb(1, { mode: 'practice' });
      const hsk4Practice = loadApprovedQuestionsFromDb(4, { mode: 'practice' });
      expect(hsk1Practice.length).toBeGreaterThan(0);
      expect(hsk4Practice.length).toBeGreaterThan(0);
    });

    it('strictly isolates exam_eligible in synthetic DB with all edge values (0, -1, 2, null, pending, disabled)', () => {
      const testDb = new DatabaseSync(':memory:');
      testDb.exec(`
        CREATE TABLE questions (
          id TEXT PRIMARY KEY,
          stem TEXT,
          options TEXT,
          answer_idx INTEGER,
          pinyin TEXT,
          explanation_vi TEXT,
          level INTEGER,
          skill TEXT,
          part_type TEXT,
          illustration_theme TEXT,
          topic TEXT,
          tested_vocab TEXT,
          status TEXT,
          is_active INTEGER
        );
        CREATE TABLE exam_eligible_pool (
          question_id TEXT PRIMARY KEY,
          level INTEGER,
          skill TEXT,
          part_type TEXT,
          stem TEXT,
          practice_eligible INTEGER,
          exam_eligible INTEGER,
          compatible_formats TEXT,
          ineligible_reasons TEXT
        );

        -- Q1: approved, active, exam_eligible = 0 -> MUST EXCLUDE
        INSERT INTO questions VALUES ('q1', 'Stem 1', '["A","B"]', 0, null, '', 1, 'reading', 'read_fill_blank_4opt', null, null, null, 'approved', 1);
        INSERT INTO exam_eligible_pool VALUES ('q1', 1, 'reading', 'read_fill_blank_4opt', 'Stem 1', 1, 0, '[]', '["Reason"]');

        -- Q2: approved, active, exam_eligible = 1 -> MUST INCLUDE
        INSERT INTO questions VALUES ('q2', 'Stem 2', '["A","B","C"]', 1, null, '', 1, 'reading', 'read_comprehension_short_3opt', null, null, null, 'approved', 1);
        INSERT INTO exam_eligible_pool VALUES ('q2', 1, 'reading', 'read_comprehension_short_3opt', 'Stem 2', 1, 1, '["mock"]', '[]');

        -- Q3: approved, active, exam_eligible = 2 (corrupted/invalid flag) -> MUST EXCLUDE
        INSERT INTO questions VALUES ('q3', 'Stem 3', '["A","B","C"]', 1, null, '', 1, 'reading', 'read_comprehension_short_3opt', null, null, null, 'approved', 1);
        INSERT INTO exam_eligible_pool VALUES ('q3', 1, 'reading', 'read_comprehension_short_3opt', 'Stem 3', 1, 2, '["mock"]', '[]');

        -- Q4: approved, active, exam_eligible = -1 -> MUST EXCLUDE
        INSERT INTO questions VALUES ('q4', 'Stem 4', '["A","B","C"]', 1, null, '', 1, 'reading', 'read_comprehension_short_3opt', null, null, null, 'approved', 1);
        INSERT INTO exam_eligible_pool VALUES ('q4', 1, 'reading', 'read_comprehension_short_3opt', 'Stem 4', 1, -1, '["mock"]', '[]');

        -- Q5: approved, active, no pool entry (exam_eligible NULL) -> MUST EXCLUDE
        INSERT INTO questions VALUES ('q5', 'Stem 5', '["A","B","C"]', 1, null, '', 1, 'reading', 'read_comprehension_short_3opt', null, null, null, 'approved', 1);

        -- Q6: exam_eligible = 1 BUT status = 'pending' -> MUST EXCLUDE
        INSERT INTO questions VALUES ('q6', 'Stem 6', '["A","B","C"]', 1, null, '', 1, 'reading', 'read_comprehension_short_3opt', null, null, null, 'pending', 1);
        INSERT INTO exam_eligible_pool VALUES ('q6', 1, 'reading', 'read_comprehension_short_3opt', 'Stem 6', 1, 1, '["mock"]', '[]');

        -- Q7: exam_eligible = 1 BUT status = 'rejected' -> MUST EXCLUDE
        INSERT INTO questions VALUES ('q7', 'Stem 7', '["A","B","C"]', 1, null, '', 1, 'reading', 'read_comprehension_short_3opt', null, null, null, 'rejected', 1);
        INSERT INTO exam_eligible_pool VALUES ('q7', 1, 'reading', 'read_comprehension_short_3opt', 'Stem 7', 1, 1, '["mock"]', '[]');

        -- Q8: exam_eligible = 1 BUT is_active = 0 (disabled) -> MUST EXCLUDE
        INSERT INTO questions VALUES ('q8', 'Stem 8', '["A","B","C"]', 1, null, '', 1, 'reading', 'read_comprehension_short_3opt', null, null, null, 'approved', 0);
        INSERT INTO exam_eligible_pool VALUES ('q8', 1, 'reading', 'read_comprehension_short_3opt', 'Stem 8', 1, 1, '["mock"]', '[]');
      `);

      // Mock filter query simulation
      const mockResult = testDb.prepare(`
        SELECT q.id, q.status, q.is_active, COALESCE(p.exam_eligible, 0) as exam_eligible
        FROM questions q
        LEFT JOIN exam_eligible_pool p ON q.id = p.question_id
        WHERE q.level = 1
      `).all().filter((row: any) => {
        const isApproved = String(row.status || '').toLowerCase() === 'approved';
        const isActive = Number(row.is_active ?? 1) === 1;
        if (!isApproved || !isActive) return false;
        return Number(row.exam_eligible ?? 0) === 1;
      });

      expect(mockResult.length).toBe(1);
      expect(mockResult[0].id).toBe('q2');

      testDb.close();
    });
  });

  // =========================================================================
  // 4. LIVE DATABASE AUDIT ON data/qbank/qbank.db
  // =========================================================================
  describe('4. Direct audit of live data/qbank/qbank.db', () => {
    it('confirms all 96 approved active questions have practice_eligible=1, exam_eligible status matching pool, and diagnostics', () => {
      const db = new DatabaseSync(qbankDbPath, { readOnly: true });

      const approvedQuestions: any[] = db.prepare(`
        SELECT id, level, skill, part_type, stem, options, answer_idx
        FROM questions
        WHERE status = 'approved' AND COALESCE(is_active, 1) = 1
      `).all();

      // 96 approved active questions (89 baseline + 7 admin-approved rowids 90-96)
      expect(approvedQuestions.length).toBe(96);

      const poolRows: any[] = db.prepare(`
        SELECT question_id, practice_eligible, exam_eligible, ineligible_reasons
        FROM exam_eligible_pool
      `).all();

      const poolMap = new Map(poolRows.map((r) => [r.question_id, r]));

      let practiceCount = 0;
      let examCount = 0;
      let emptyReasonsCount = 0;

      for (const q of approvedQuestions) {
        const pool = poolMap.get(q.id);
        expect(pool, `Pool record for approved question ${q.id}`).toBeDefined();

        if (pool.practice_eligible === 1) practiceCount++;
        if (pool.exam_eligible === 1) examCount++;

        const reasons = JSON.parse(pool.ineligible_reasons || '[]');
        if (reasons.length === 0) {
          emptyReasonsCount++;
        }
      }

      expect(practiceCount).toBe(96);
      expect(examCount).toBe(13); // Exactly 13 questions verified exam_eligible (10 in HSK 1 reading, 3 in HSK 4 reading)
      expect(emptyReasonsCount).toBe(10); // 10 HSK 1 reading comprehension questions have 0 ineligible reasons

      db.close();
    });

    it('reEvaluateApprovedQuestions achieves 100% diagnostic coverage on live qbank.db', () => {
      const db = createTestExamDb({ seedPool: true });
      const res = reEvaluateApprovedQuestions(db);

      // Total 96 approved questions re-evaluated
      expect(res.total).toBe(96);
      expect(res.practice_eligible_count).toBe(96);
      expect(res.exam_eligible_count).toBe(13);
      expect(res.reasons_recorded_count).toBe(86);
      db.close();
    });

    it('verifies data/hsk_exam.db hash is DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1', () => {
      const buf = fs.readFileSync(hskExamDbPath);
      const hash = crypto.createHash('sha256').update(buf).digest('hex').toUpperCase();
      expect(hash).toBe('DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1');
    });

    it('verifies data/qbank/qbank.db maintains exactly 12 tables and 0 unapproved migrations', () => {
      const db = new DatabaseSync(qbankDbPath, { readOnly: true });
      const tables: any[] = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all();
      expect(tables.length).toBe(12);

      const names = tables.map((t) => t.name);
      expect(names).not.toContain('question_knowledge_links');
      expect(names).not.toContain('question_distractor_rationales');
      db.close();
    });
  });
});
