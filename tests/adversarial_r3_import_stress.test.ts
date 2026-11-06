/**
 * Empirical Stress Test Harness for Universal Question Parser and Import Pipeline (R3)
 * Author: challenger_final_1 (Adversarial Critic & Empirical Verification)
 * 
 * Verifies:
 * 1. Malformed inputs handling (missing options, invalid answer indices, mixed Chinese/English, empty lines, Markdown code blocks with trailing text)
 * 2. Deduplication idempotence (duplicate content hashes return accepted_count: 0 and do not inflate pending_questions)
 * 3. Six Quality Gates enforcement (detecting defective vs permitting authentic questions)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import http from 'http';
import { DatabaseSync } from 'node:sqlite';
import {
  qbankRouter,
  ensurePendingSchema,
  setDbSyncForTesting,
  setQBankAdminTokenForTesting,
} from '../src/server/qbankRoutes.js';
import {
  parseUniversalQuestions,
  splitIntoQuestionBlocks,
  parseSingleQuestionBlock,
} from '../src/server/llm/universalQuestionParser.js';
import { evaluateCandidateSixGates } from '../src/server/llm/questionValidator.js';
import { CandidateQuestion } from '../src/server/llm/types.js';

describe('Empirical Adversarial Stress Tests: Universal Parser & Import Pipeline (R3)', () => {
  let app: express.Express;
  let server: http.Server;
  let baseUrl: string;
  let stagingDb: DatabaseSync;
  const TEST_ADMIN_TOKEN = 'challenger-test-token-2026';

  beforeAll(async () => {
    stagingDb = new DatabaseSync(':memory:');
    ensurePendingSchema(stagingDb);
    setDbSyncForTesting(stagingDb);
    setQBankAdminTokenForTesting(TEST_ADMIN_TOKEN);

    app = express();
    app.use(express.json());
    app.use('/api/qbank', qbankRouter);

    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address() as any;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    setDbSyncForTesting(null);
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  // =========================================================================
  // 1. Stress-Testing Malformed Inputs
  // =========================================================================
  describe('1. Malformed Inputs Handling', () => {
    it('handles input with completely missing options without crashing', () => {
      const inputNoOptions = `
Câu 1: 他是我的老师。
Đáp án: A
Giải thích: Thầy giáo
      `;
      const parsed = parseUniversalQuestions(inputNoOptions);
      expect(parsed).toEqual([]);
    });

    it('handles input with only 1 option without crashing', () => {
      const inputOneOption = `
Câu 1: 桌子上有一本书。
A. 苹果
Đáp án: A
Giải thích: Quả táo
      `;
      const parsed = parseUniversalQuestions(inputOneOption);
      expect(parsed).toEqual([]);
    });

    it('handles partial options (2 options) and fails Gate 1 for 4-option part_type', () => {
      const inputTwoOptions = `
Câu 1: 他是我的____。
A. 老师
B. 苹果
Đáp án: A
Giải thích: Thầy giáo
      `;
      const parsed = parseUniversalQuestions(inputTwoOptions, {
        default_level: 1,
        default_skill: 'reading',
        default_part_type: 'read_fill_blank_4opt',
      });

      // Parser extracts CandidateQuestion with 2 options
      expect(parsed.length).toBe(1);
      expect(parsed[0].options.length).toBe(2);

      // But 6 Gates must catch this schema defect in Gate 1
      const gateResult = evaluateCandidateSixGates(parsed[0]);
      expect(gateResult.gate1_schema.passed).toBe(false);
      expect(gateResult.allPassed).toBe(false);
      expect(gateResult.gate1_schema.details).toMatch(/option/i);
    });

    it('handles invalid answer indices (e.g., Đáp án: Z, Đáp án: 9, out of range) safely', () => {
      const inputInvalidAnswerKey = `
Câu 1: 他是我的____。
A. 老师
B. 苹果
C. 飞机
D. 喝水
Đáp án: Z
Giải thích: Thầy giáo
      `;
      const parsed = parseUniversalQuestions(inputInvalidAnswerKey);
      expect(parsed.length).toBe(1);
      // Parser clamps/defaults to valid index (0) instead of throwing or setting invalid index
      expect(parsed[0].answer_idx).toBe(0);
      expect(parsed[0].options[parsed[0].answer_idx]).toBe('老师');
    });

    it('handles input with completely missing answer line by defaulting safely', () => {
      const inputNoAnswerLine = `
Câu 1: 我想买一本书。
A. 苹果
B. 香蕉
C. 西瓜
D. 葡萄
Giải thích: Không có dòng đáp án
      `;
      const parsed = parseUniversalQuestions(inputNoAnswerLine);
      expect(parsed.length).toBe(1);
      expect(parsed[0].answer_idx).toBe(0);
      expect(parsed[0].explanation_vi).toBeDefined();
    });

    it('handles mixed Chinese and English text with formatting annotations', () => {
      const mixedText = `
Teacher Notes: HSK 1 Vocabulary Review
Question 1: He is my teacher.
他是我的____。(Please select the correct title)
A. 老师 (teacher)
B. 苹果 (apple)
C. 飞机 (airplane)
D. 喝水 (drink water)
Correct Answer: A
Explanation: 老师 means teacher in Vietnamese and Chinese.
      `;
      const parsed = parseUniversalQuestions(mixedText, { default_level: 1, default_skill: 'reading' });
      expect(parsed.length).toBe(1);
      expect(parsed[0].stem).toContain('他是我的____。');
      expect(parsed[0].options.length).toBe(4);
      expect(parsed[0].answer_idx).toBe(0);
    });

    it('handles massive whitespace, empty strings, and 30 consecutive empty lines', () => {
      expect(parseUniversalQuestions('')).toEqual([]);
      expect(parseUniversalQuestions('   \t\r\n\n\n   ')).toEqual([]);

      const spacedInput = `


Câu 1: 他是我的____。



A. 老师


B. 苹果


C. 飞机


D. 喝水



Đáp án: A



Giải thích: Thầy giáo



`;
      const parsed = parseUniversalQuestions(spacedInput);
      expect(parsed.length).toBe(1);
      expect(parsed[0].stem).toBe('他是我的____。');
      expect(parsed[0].options).toEqual(['老师', '苹果', '飞机', '喝水']);
      expect(parsed[0].answer_idx).toBe(0);
    });

    it('handles Markdown code blocks with trailing conversational text', () => {
      const conversationalMarkdown = `
Hello teacher! Here is the JSON question you requested:

\`\`\`json
[
  {
    "stem": "今天天气很好，我想去____借两本书。",
    "options": ["学校", "医院", "机场", "商店"],
    "answer_idx": 0,
    "explanation_vi": "Ngữ cảnh mượn sách thì địa điểm phù hợp là 学校.",
    "level": 1,
    "skill": "reading",
    "part_type": "read_fill_blank_4opt"
  }
]
\`\`\`

I hope this helps! Feel free to ask if you need more questions for your exam preparation.
`;
      const parsed = parseUniversalQuestions(conversationalMarkdown);
      expect(parsed.length).toBe(1);
      expect(parsed[0].stem).toBe('今天天气很好，我想去____借两本书。');
      expect(parsed[0].options).toEqual(['学校', '医院', '机场', '商店']);
      expect(parsed[0].answer_idx).toBe(0);
    });

    it('handles non-standard placeholder formats: converts ( ), （ ）, or multiple underscores to ____', () => {
      const parenPlaceholder = `
Câu 1: 他是我的 ( )。
A. 老师
B. 苹果
C. 飞机
D. 喝水
Đáp án: A
Giải thích: Thầy giáo
      `;
      const parsed = parseUniversalQuestions(parenPlaceholder);
      expect(parsed.length).toBe(1);
      expect(parsed[0].stem).toBe('他是我的____。');

      const fullwidthParen = `
Câu 1: 他是我的（　）。
A. 老师
B. 苹果
C. 飞机
D. 喝水
Đáp án: A
Giải thích: Thầy giáo
      `;
      const parsedFullwidth = parseUniversalQuestions(fullwidthParen);
      expect(parsedFullwidth.length).toBe(1);
      expect(parsedFullwidth[0].stem).toBe('他是我的____。');
    });
  });

  // =========================================================================
  // 2. Stress-Testing Deduplication & Pending Questions Inflation
  // =========================================================================
  describe('2. Deduplication & Idempotence Enforcement', () => {
    it('rejects duplicate content hashes with accepted_count: 0 and does not inflate pending_questions', async () => {
      const questionPayload = {
        text: `
Câu 1: 他在医院工作，他是一名____。
A. 医生
B. 苹果
C. 飞机
D. 喝水
Đáp án: A
Giải thích: Làm việc ở bệnh viện thì là bác sĩ (医生).
        `,
        default_level: 1,
        default_skill: 'reading',
        default_part_type: 'read_fill_blank_4opt',
      };

      // Count existing rows before test
      const countBefore = (stagingDb.prepare("SELECT COUNT(*) as c FROM pending_questions").get() as any).c;

      // 1. First import
      const res1 = await fetch(`${baseUrl}/api/qbank/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_ADMIN_TOKEN}`,
        },
        body: JSON.stringify(questionPayload),
      });
      expect(res1.status).toBe(200);
      const data1 = await res1.json();
      expect(data1.success).toBe(true);
      expect(data1.accepted_count).toBe(1);
      expect(data1.rejected_count).toBe(0);
      expect(data1.results[0].inserted).toBe(true);

      const countAfterFirst = (stagingDb.prepare("SELECT COUNT(*) as c FROM pending_questions").get() as any).c;
      expect(countAfterFirst).toBe(countBefore + 1);

      // 2. Second import (identical content)
      const res2 = await fetch(`${baseUrl}/api/qbank/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_ADMIN_TOKEN}`,
        },
        body: JSON.stringify(questionPayload),
      });
      expect(res2.status).toBe(200);
      const data2 = await res2.json();
      expect(data2.success).toBe(true);
      expect(data2.accepted_count).toBe(0);
      expect(data2.rejected_count).toBe(1);
      expect(data2.results[0].inserted).toBe(false);

      // Verify row count did NOT inflate
      const countAfterSecond = (stagingDb.prepare("SELECT COUNT(*) as c FROM pending_questions").get() as any).c;
      expect(countAfterSecond).toBe(countAfterFirst);

      // 3. Third, fourth, fifth duplicate imports in a loop
      for (let i = 0; i < 3; i++) {
        const resLoop = await fetch(`${baseUrl}/api/qbank/import`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${TEST_ADMIN_TOKEN}`,
          },
          body: JSON.stringify(questionPayload),
        });
        const dataLoop = await resLoop.json();
        expect(dataLoop.accepted_count).toBe(0);
        expect(dataLoop.rejected_count).toBe(1);
      }

      // Final row count check: still exactly countBefore + 1
      const countFinal = (stagingDb.prepare("SELECT COUNT(*) as c FROM pending_questions").get() as any).c;
      expect(countFinal).toBe(countAfterFirst);
    });

    it('handles batch containing internal duplicates correctly: accepts unique, rejects internal duplicates', async () => {
      const batchPayload = {
        text: `
Câu 1: 桌子上有两本书。A. 苹果 B. 香蕉 C. 西瓜 D. 米饭 Đáp án: A Giải thích: Táo
Câu 2: 他去学校看书。A. 学校 B. 医院 C. 机场 D. 商店 Đáp án: A Giải thích: Trường học
Câu 3: 桌子上有两本书。A. 苹果 B. 香蕉 C. 西瓜 D. 米饭 Đáp án: A Giải thích: Táo
        `,
        default_level: 2,
        default_skill: 'reading',
        default_part_type: 'read_fill_blank_4opt',
      };

      const res = await fetch(`${baseUrl}/api/qbank/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_ADMIN_TOKEN}`,
        },
        body: JSON.stringify(batchPayload),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.total_parsed).toBe(3);
      // Items 1 and 2 are distinct and inserted; item 3 is duplicate of item 1
      expect(data.accepted_count).toBe(2);
      expect(data.rejected_count).toBe(1);
      expect(data.results[0].inserted).toBe(true);
      expect(data.results[1].inserted).toBe(true);
      expect(data.results[2].inserted).toBe(false);
    });
  });

  // =========================================================================
  // 3. Six Quality Gates Stress-Testing (Defective vs Authentic)
  // =========================================================================
  describe('3. Six Quality Gates Enforcement', () => {
    // --- Gate 1: Schema / Structure ---
    it('Gate 1 catches questions with 2 blanks or 5 options for read_fill_blank_4opt', () => {
      const twoBlanksQuestion: Partial<CandidateQuestion> = {
        stem: '我有____和____。',
        options: ['苹果', '香蕉', '西瓜', '米饭'],
        answer_idx: 0,
        explanation_vi: 'Giải thích',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };
      const evalTwoBlanks = evaluateCandidateSixGates(twoBlanksQuestion);
      expect(evalTwoBlanks.gate1_schema.passed).toBe(false);
      expect(evalTwoBlanks.allPassed).toBe(false);

      const fiveOptionsQuestion: Partial<CandidateQuestion> = {
        stem: '我想吃____。',
        options: ['苹果', '香蕉', '西瓜', '米饭', '面条'],
        answer_idx: 0,
        explanation_vi: 'Giải thích',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };
      const evalFiveOptions = evaluateCandidateSixGates(fiveOptionsQuestion);
      expect(evalFiveOptions.gate1_schema.passed).toBe(false);
      expect(evalFiveOptions.allPassed).toBe(false);
    });

    // --- Gate 2: Explanation & Distractor Rationales Coherence ---
    it('Gate 2 catches explanation contradicting the designated answer', () => {
      const contradictoryQuestion: Partial<CandidateQuestion> = {
        stem: '我想去图书馆借____。',
        options: ['书', '水', '茶', '苹果'],
        answer_idx: 0, // Option 0 is '书'
        explanation_vi: 'Đáp án đúng là B vì 水 có nghĩa là nước.', // Contradicts answer_idx = 0!
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };
      const evalResult = evaluateCandidateSixGates(contradictoryQuestion);
      expect(evalResult.gate2_rationales_coherence.passed).toBe(false);
      expect(evalResult.allPassed).toBe(false);
    });

    // --- Gate 3: Vocab Syllabus Alignment ---
    it('Gate 3 catches high-level HSK 5/6 vocabulary when question is labeled HSK 1', () => {
      const overLevelQuestion: Partial<CandidateQuestion> = {
        stem: '面对复杂的经济形势，我们不能盲目____。',
        options: ['投资', '放弃', '商量', '坚持'],
        answer_idx: 0,
        explanation_vi: 'Giải thích về đầu tư kinh tế',
        level: 1, // Labeled HSK 1, but contains 面对, 复杂, 经济, 形势, 盲目, 投资
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };
      const evalResult = evaluateCandidateSixGates(overLevelQuestion);
      expect(evalResult.gate3_vocab_coverage.passed).toBe(false);
      expect(evalResult.allPassed).toBe(false);
      expect(evalResult.gate3_vocab_coverage.details).toMatch(/exceed/i);
    });

    // --- Gate 4: Distractor Quality & Part-of-Speech ---
    it('Gate 4 catches severe POS mismatch among options', () => {
      const posMismatchQuestion: Partial<CandidateQuestion> = {
        stem: '他是我的____。',
        options: ['老师', '漂亮', '跑', '很'], // Noun vs Adjective, Verb, Adverb
        answer_idx: 0,
        explanation_vi: 'Thầy giáo',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };
      const evalResult = evaluateCandidateSixGates(posMismatchQuestion);
      expect(evalResult.gate4_distractor_quality.passed).toBe(false);
      expect(evalResult.allPassed).toBe(false);
    });

    // --- Gate 5: Uniqueness ---
    it('Gate 5 catches duplicate stems against existing pool', () => {
      const existingStems = ['他是我的老师。', '今天天气很好。'];
      const dupStemQuestion: Partial<CandidateQuestion> = {
        stem: '他是我的老师。',
        options: ['老师', '学生', '医生', '朋友'],
        answer_idx: 0,
        explanation_vi: 'Giải thích',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };
      const evalResult = evaluateCandidateSixGates(dupStemQuestion, existingStems);
      expect(evalResult.gate5_uniqueness.passed).toBe(false);
      expect(evalResult.allPassed).toBe(false);
    });

    // --- Gate 6: Blind Solve & Answer Uniqueness ---
    it('Gate 6 catches ambiguous questions with multiple plausible answers and no disambiguating context', () => {
      const ambiguousQuestion: Partial<CandidateQuestion> = {
        stem: '我有三个____。',
        options: ['苹果', '香蕉', '西瓜', '本子'], // All 4 are common nouns that take 个 without context!
        answer_idx: 0,
        explanation_vi: 'Tôi có ba quả táo.',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };
      const evalResult = evaluateCandidateSixGates(ambiguousQuestion);
      expect(evalResult.gate6_blind_solve.passed).toBe(false);
      expect(evalResult.allPassed).toBe(false);
    });

    // --- Authentic Control Question: Must Pass All 6 Gates ---
    it('Authentic question with matching level, consistent explanation, clean POS, and unique clue passes all 6 gates', () => {
      const authenticQuestion: Partial<CandidateQuestion> = {
        stem: '这杯茶很____，我想喝。',
        options: ['好喝', '好看', '好吃', '好大'],
        answer_idx: 0,
        explanation_vi: 'Giải thích: Uống trà (喝茶) thì dùng 好喝 (ngon).',
        explanation_summary_vi: 'Giải thích: Uống trà (喝茶) thì dùng 好喝 (ngon).',
        answer_rationale_vi: 'Giải thích: Uống trà (喝茶) thì dùng 好喝 (ngon).',
        distractor_rationales: [
          { option_idx: 0, option_text: '好喝', rationale_vi: 'Đúng: Uống trà dùng 好喝.' },
          { option_idx: 1, option_text: '好看', rationale_vi: 'Sai: 好看 là đẹp mắt.' },
          { option_idx: 2, option_text: '好吃', rationale_vi: 'Sai: 好吃 dùng cho đồ ăn.' },
          { option_idx: 3, option_text: '好大', rationale_vi: 'Sai: 好大 không tự nhiên với chén trà.' },
        ],
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
        completed_stem: '这杯茶很好喝，我想喝。',
        canonical_completed_stem: '这杯茶很好喝，我想喝。',
        pinyin: 'zhè bēi chá hěn hǎohē, wǒ xiǎng hē.',
      };
      const evalResult = evaluateCandidateSixGates(authenticQuestion);
      expect(evalResult.gate1_schema.passed).toBe(true);
      expect(evalResult.gate2_rationales_coherence.passed).toBe(true);
      expect(evalResult.gate3_vocab_coverage.passed).toBe(true);
      expect(evalResult.gate4_distractor_quality.passed).toBe(true);
      expect(evalResult.gate5_uniqueness.passed).toBe(true);
      expect(evalResult.gate6_blind_solve.passed).toBe(true);
      expect(evalResult.allPassed).toBe(true);
    });
  });
});
