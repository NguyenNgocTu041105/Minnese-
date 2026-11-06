/**
 * tests/challenger_m3_validator_distribution.test.ts
 *
 * EMPIRICAL ADVERSARIAL CHALLENGE SUITE:
 * 1. Challenge the 6 quality gates in src/server/llm/questionValidator.ts with adversarial inputs:
 *    - Gate 1: malformed options, duplicate options, option count != blueprint, invalid answer_index (<0 or >=count).
 *    - Gate 2: syllabification, out-of-level tokens, out-of-catalog items, false metadata claims.
 *    - Gate 3: stem context too short (<6 and <4 characters), generic underspecified stems ('我喜欢____。').
 *    - Gate 4: part-of-speech mismatches across options using data/inbox/hsk30.csv.
 *    - Gate 5: missing/empty distractor rationales, missing/invalid explanation_vi, answer contradictions.
 *    - Gate 6: blind-solve ambiguity and single-answer guarantee.
 * 2. Verify that invalid questions are rejected with appropriate error/warning flags and valid questions pass.
 * 3. Verify that post-approval distribution (syncApprovedQuestion) never leaks unapproved/rejected questions
 *    into practice_eligible or exam_eligible pools.
 * 4. Verify database preservation invariant for data/hsk_exam.db.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

import {
  validateCandidate,
  evaluateCandidateSixGates,
  loadWordPosDictionary,
  normalizePosTag,
  getWordPos,
  evaluateBlindSolveHeuristic,
  computeContentHash,
  computeNearDuplicateSignature,
} from '../src/server/llm/questionValidator.js';
import { CandidateQuestion } from '../src/server/llm/types.js';

import {
  ensurePendingSchema,
} from '../src/server/qbankRoutes.js';
import {
  loadApprovedQuestionsFromDb,
} from '../src/server/examRoutes.js';
import {
  ensureEligiblePoolSchema,
  syncApprovedQuestion,
  validateFormatCompatibility,
  getEligiblePoolStats,
} from '../src/server/qbankFormatSync.js';

const EXPECTED_HSK_EXAM_DB_HASH = 'DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1';
const HSK_EXAM_DB_PATH = path.resolve(process.cwd(), 'data/hsk_exam.db');

function getSha256(filePath: string): string {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buf).digest('hex').toUpperCase();
}

describe('Challenger M3: Adversarial Stress Test of 6-Gate Validator & Question Distribution', () => {
  beforeAll(() => {
    expect(fs.existsSync(HSK_EXAM_DB_PATH)).toBe(true);
    expect(getSha256(HSK_EXAM_DB_PATH)).toBe(EXPECTED_HSK_EXAM_DB_HASH);
  });

  afterAll(() => {
    expect(getSha256(HSK_EXAM_DB_PATH)).toBe(EXPECTED_HSK_EXAM_DB_HASH);
  });

  // =========================================================================
  // GATE 1: SYNTAX & STRUCTURAL SCHEMA ADVERSARIAL CHALLENGES
  // =========================================================================
  describe('Gate 1 Adversarial Challenges: Syntax & Structural Schema', () => {
    const baseValid: Partial<CandidateQuestion> = {
      stem: '今天天气很好，我想去学校____借两本书。',
      options: ['借', '买', '看', '吃'],
      answer_idx: 0,
      explanation_vi: 'Dịch nghĩa: Tôi muốn đến trường mượn sách. - Phân tích phương án: + B: mua, + C: xem, + D: ăn.',
      level: 1,
      skill: 'reading',
      part_type: 'read_fill_blank_4opt',
    };

    it('1.1 rejects malformed options (null, non-array, empty string, whitespace only)', () => {
      // options is null
      const qNullOpts: any = { ...baseValid, options: null };
      const resNull = evaluateCandidateSixGates(qNullOpts);
      expect(resNull.gate1_schema.passed).toBe(false);
      expect(resNull.allPassed).toBe(false);

      // options has empty string item: validateCandidate catches it in res.errors
      const qEmptyOpt: Partial<CandidateQuestion> = { ...baseValid, options: ['借', '', '看', '吃'] };
      const valEmpty = validateCandidate(qEmptyOpt);
      expect(valEmpty.valid).toBe(false);
      expect(valEmpty.errors.some((e) => e.includes('empty'))).toBe(true);

      // Adversarial Finding: evaluateCandidateSixGates gate1_schema regex /options/i (plural)
      // misses singular 'Option at index 1 is empty'
      const resEmpty = evaluateCandidateSixGates(qEmptyOpt);
      expect(valEmpty.valid).toBe(false);
      // Documents the regex leak:
      expect(resEmpty.gate1_schema.passed).toBe(false);
    });

    it('1.1b malformed string options does not crash validateCandidate and fails validation gracefully', () => {
      // When options is string '["借", "买"]' instead of array, parseExplanationDistractorRationales handles non-array safely
      const val = validateCandidate({ ...baseValid, options: '["借", "买"]' as any });
      expect(val.valid).toBe(false);
      expect(val.errors.some((e) => /options must/i.test(e))).toBe(true);
    });

    it('1.2 rejects duplicate options (exact duplicates, trimmed whitespace duplicates)', () => {
      // Exact duplicate
      const qExactDup: Partial<CandidateQuestion> = {
        ...baseValid,
        options: ['借', '借', '看', '吃'],
      };
      const resExactDup = evaluateCandidateSixGates(qExactDup);
      expect(resExactDup.gate1_schema.passed).toBe(false);
      expect(resExactDup.gate1_schema.details).toContain('unique');

      // Whitespace padded duplicate
      const qWsDup: Partial<CandidateQuestion> = {
        ...baseValid,
        options: ['借', ' 借 ', '看', '吃'],
      };
      const resWsDup = evaluateCandidateSixGates(qWsDup);
      expect(resWsDup.gate1_schema.passed).toBe(false);
      expect(resWsDup.gate1_schema.details).toContain('unique');
    });

    it('1.3 rejects invalid answer_index (<0, >=options.length, non-number)', () => {
      // answer_idx = -1
      const resNeg = evaluateCandidateSixGates({ ...baseValid, answer_idx: -1 });
      expect(resNeg.gate1_schema.passed).toBe(false);
      expect(resNeg.gate1_schema.details).toContain('answer_idx');

      // answer_idx = 4 (length is 4, valid is 0..3)
      const resOver = evaluateCandidateSixGates({ ...baseValid, answer_idx: 4 });
      expect(resOver.gate1_schema.passed).toBe(false);
      expect(resOver.gate1_schema.details).toContain('answer_idx');

      // answer_idx = 99
      const resWayOver = evaluateCandidateSixGates({ ...baseValid, answer_idx: 99 });
      expect(resWayOver.gate1_schema.passed).toBe(false);

      // answer_idx is string "0"
      const resStrIdx: any = evaluateCandidateSixGates({ ...baseValid, answer_idx: '0' as any });
      expect(resStrIdx.gate1_schema.passed).toBe(false);
    });

    it('1.3b non-integer float answer_idx does not crash validateCandidate and fails validation gracefully', () => {
      // When answer_idx is float (e.g. 1.5), Number.isInteger guard prevents crash at line 688
      const val = validateCandidate({ ...baseValid, answer_idx: 1.5 });
      expect(val.valid).toBe(false);
      expect(val.errors.some((e) => /answer_idx must be an integer/i.test(e))).toBe(true);
    });

    it('1.4 enforces blueprint option count rules strictly per part_type', () => {
      // read_comprehension_short_3opt with 4 options should fail
      const q3optWith4: Partial<CandidateQuestion> = {
        stem: '小明每天早上七点去学校。问：小明几点去学校？',
        options: ['七点', '八点', '九点', '十点'],
        answer_idx: 0,
        explanation_vi: 'Giải thích: Bài đọc nói rõ bảy giờ đi học.',
        level: 2,
        skill: 'reading',
        part_type: 'read_comprehension_short_3opt',
      };
      const res3opt = evaluateCandidateSixGates(q3optWith4);
      expect(res3opt.gate1_schema.passed).toBe(false);
      expect(res3opt.gate1_schema.details).toContain('Options must contain exactly 3 items');

      // writing task with options should fail
      const qWriteWithOpts: Partial<CandidateQuestion> = {
        stem: '看图写汉字：手[____]。',
        options: ['机', '表'],
        answer_idx: 0,
        explanation_vi: 'Giải thích: Viết chữ 机.',
        level: 1,
        skill: 'writing',
        part_type: 'write_tianzige_from_pinyin',
      };
      const resWrite = evaluateCandidateSixGates(qWriteWithOpts);
      expect(resWrite.gate1_schema.passed).toBe(false);
      expect(resWrite.gate1_schema.details).toContain('Options must be empty for writing task');
    });

    it('1.5 rejects stems containing Latin characters, Vietnamese, or prohibited hints', () => {
      // Latin characters in stem (non-pinyin task)
      const qLatin = { ...baseValid, stem: '桌子上有three个苹果，想吃____。' };
      const resLatin = evaluateCandidateSixGates(qLatin);
      expect(resLatin.gate1_schema.passed).toBe(false);
      expect(resLatin.gate1_schema.details).toContain('Latin');

      // Prohibited bracketed hint
      const qHint = { ...baseValid, stem: '桌子上有三个苹果，想吃____（gợi ý: chọn A）。' };
      const resHint = evaluateCandidateSixGates(qHint);
      expect(resHint.gate1_schema.passed).toBe(false);
      expect(resHint.gate1_schema.details).toContain('bracketed hint');
    });
  });

  // =========================================================================
  // GATE 2: SYLLABIFICATION & OUT-OF-LEVEL TOKENS
  // =========================================================================
  describe('Gate 2 Adversarial Challenges: Syllabification & Out-of-Level Tokens', () => {
    it('2.1 catches out-of-level tokens where tested vocabulary exceeds question HSK level', () => {
      // HSK 1 question testing HSK 6 verified syllabus word "高超" (from vocab.jsonl line 5325)
      const qOverLevel: Partial<CandidateQuestion> = {
        stem: '这位老师的教学水平非常____。',
        options: ['高超', '高兴', '大', '好'],
        answer_idx: 0, // '高超' is HSK 6
        explanation_vi: 'Dịch nghĩa: Trình độ giảng dạy của thầy giáo rất cao siêu. - Phân tích: + Phương án B (高兴): vui mừng.',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };

      // With strictLevel: true, must result in error and gate3_vocab_coverage rejection
      const resStrict = evaluateCandidateSixGates(qOverLevel, [], { strictLevel: true });
      expect(resStrict.gate3_vocab_coverage.passed).toBe(false);
      expect(resStrict.gate3_vocab_coverage.details).toContain('exceeds HSK Level 1');
      expect(resStrict.allPassed).toBe(false);

      // In validateCandidate, check that aboveLevel is detected
      const fullRes = validateCandidate(qOverLevel, [], { strictLevel: false });
      expect(fullRes.warnings.some((w) => w.includes('exceeds HSK Level 1') && w.includes('高超'))).toBe(true);
      expect(fullRes.actionRecommendation).toBe('needs_admin_review');
    });

    it('2.2 surfaces warnings for completely out-of-syllabus characters/words', () => {
      // Testing non-standard Chinese character/word "犇"
      const qOutOfSyllabus: Partial<CandidateQuestion> = {
        stem: '在农场里我们看到了健壮的____。',
        options: ['犇', '牛', '羊', '马'],
        answer_idx: 0,
        explanation_vi: 'Dịch nghĩa: Tại nông trại chúng tôi thấy đàn trâu bò.',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };

      const res = validateCandidate(qOutOfSyllabus);
      expect(res.warnings.some((w) => w.includes('out-of-syllabus'))).toBe(true);
      expect(res.actionRecommendation).toBe('needs_admin_review');
    });

    it('2.3 detects false claims when LLM declares tested words that do not exist in question', () => {
      const qFalseClaim: Partial<CandidateQuestion> = {
        stem: '桌子上有三个苹果，很好吃。',
        options: ['苹果', '香蕉', '西瓜', '米饭'],
        answer_idx: 0,
        explanation_vi: 'Giải thích câu hỏi.',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
        tested_vocab: ['火车', '飞机'], // Neither appears in text
      };

      const res = validateCandidate(qFalseClaim);
      expect(res.warnings.some((w) => w.includes('Declared tested vocabulary not found'))).toBe(true);
    });
  });

  // =========================================================================
  // GATE 3: STEM CONTEXT & PEDAGOGY (SHORT STEMS & GENERIC UNDERSPECIFICATION)
  // =========================================================================
  describe('Gate 3 Adversarial Challenges: Stem Completeness & Pedagogy', () => {
    it('3.1 rejects extreme underspecification when stem context is < 4 characters (Gate 1 error)', () => {
      const qExtremelyShort: Partial<CandidateQuestion> = {
        stem: '看____。', // context is only 1 Hanzi "看"
        options: ['书', '人', '水', '天'],
        answer_idx: 0,
        explanation_vi: 'Giải thích: Xem sách.',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };

      const res = evaluateCandidateSixGates(qExtremelyShort);
      expect(res.gate1_schema.passed).toBe(false);
      expect(res.gate1_schema.details).toContain('underspecified');
      expect(res.allPassed).toBe(false);
    });

    it('3.2 fails Gate 6 blind-solve when stem context is < 6 Chinese characters', () => {
      const qShortContext: Partial<CandidateQuestion> = {
        stem: '我们去____。', // context is "我们去" (3 Hanzi, < 6)
        options: ['学校', '商店', '医院', '机场'],
        answer_idx: 0,
        explanation_vi: 'Giải thích: Đi đến trường học.',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };

      const blind = evaluateBlindSolveHeuristic(qShortContext);
      expect(blind.hasAmbiguity).toBe(true);
      expect(blind.reason).toContain('too short');

      const sixGates = evaluateCandidateSixGates(qShortContext);
      expect(sixGates.gate6_blind_solve.passed).toBe(false);
      expect(sixGates.allPassed).toBe(false);
    });

    it('3.3 detects generic underspecified stems like "我喜欢____。" without disambiguating collocations', () => {
      const genericStems = [
        '我喜欢____。',
        '他喜欢____。',
        '妈妈最喜欢____。',
        '小明想买____。',
        '我们有____。',
      ];

      for (const stem of genericStems) {
        const qGeneric: Partial<CandidateQuestion> = {
          stem,
          options: ['苹果', '香蕉', '西瓜', '米饭'],
          answer_idx: 0,
          explanation_vi: 'Giải thích chi tiết phương án.',
          level: 1,
          skill: 'reading',
          part_type: 'read_fill_blank_4opt',
        };

        const blind = evaluateBlindSolveHeuristic(qGeneric);
        expect(blind.hasAmbiguity).toBe(true);

        const sixGates = evaluateCandidateSixGates(qGeneric);
        expect(sixGates.gate6_blind_solve.passed).toBe(false);
        expect(sixGates.allPassed).toBe(false);
      }
    });

    it('3.4 rejects stem answer leakage where correct option appears outside the blank', () => {
      const qLeak: Partial<CandidateQuestion> = {
        stem: '桌子上的苹果很大，我想吃____。',
        options: ['苹果', '香蕉', '西瓜', '米饭'],
        answer_idx: 0, // '苹果' already in stem
        explanation_vi: 'Giải thích: Đáp án là táo.',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };

      const res = evaluateCandidateSixGates(qLeak);
      expect(res.gate1_schema.passed).toBe(false);
      expect(res.gate1_schema.details).toContain('Stem answer leakage detected');
      expect(res.allPassed).toBe(false);
    });

    it('3.5 rejects multiple blanks in standard single-blank MCQs', () => {
      const qMultiBlank: Partial<CandidateQuestion> = {
        stem: '今天____天气____明朗。',
        options: ['格外', '非常', '十分', '极其'],
        answer_idx: 0,
        explanation_vi: 'Giải thích: Phó từ chỉ mức độ.',
        level: 4,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };

      const val = validateCandidate(qMultiBlank);
      expect(val.valid).toBe(false);
      expect(val.errors.some((e) => e.includes('exactly one blank placeholder'))).toBe(true);
    });
  });

  // =========================================================================
  // GATE 4: PART-OF-SPEECH MISMATCHES ACROSS OPTIONS
  // =========================================================================
  describe('Gate 4 Adversarial Challenges: Distractor Quality & Part-of-Speech Matching', () => {
    it('4.1 verifies hsk30.csv dictionary loading and correct POS normalization', () => {
      const dict = loadWordPosDictionary();
      expect(dict.size).toBeGreaterThan(2000);

      // Verify known entries from hsk30.csv
      expect(getWordPos('学校')).toContain('noun');
      expect(getWordPos('喝')).toContain('verb');
      expect(getWordPos('漂亮')).toContain('adjective');
      expect(getWordPos('经常')).toContain('adverb');
    });

    it('4.2 fails Gate 4 when target is a noun and distractors are verbs (1 noun with 3 verbs)', () => {
      // Target is noun "学校" (answer_idx=0), distractors are verbs "跑步", "睡觉", "游泳"
      const qNounWithVerbs: Partial<CandidateQuestion> = {
        stem: '今天天气很好，我想去____借两本书。',
        options: ['学校', '跑步', '睡觉', '游泳'],
        answer_idx: 0,
        explanation_vi: 'Giải thích: 学校 là trường học.',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };

      const res = evaluateCandidateSixGates(qNounWithVerbs);
      expect(res.gate4_distractor_quality.passed).toBe(false);
      expect(res.gate4_distractor_quality.details).toContain('跑步');
      expect(res.allPassed).toBe(false);

      const val = validateCandidate(qNounWithVerbs);
      expect(val.warnings.some((w) => w.includes('Distractor POS mismatch'))).toBe(true);
      expect(val.distractorQuality?.allPosMatch).toBe(false);
      expect(val.distractorQuality?.incompatibleDistractors.length).toBeGreaterThan(0);
    });

    it('4.3 fails Gate 4 when target is a verb and distractors are nouns/adjectives', () => {
      // Target is verb "喝" (answer_idx=0), distractors are nouns "苹果", "桌子" and adjective "高兴"
      const qVerbWithNouns: Partial<CandidateQuestion> = {
        stem: '弟弟口渴了，想要____一杯水。',
        options: ['喝', '苹果', '桌子', '高兴'],
        answer_idx: 0,
        explanation_vi: 'Giải thích: 喝 là uống.',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };

      const res = evaluateCandidateSixGates(qVerbWithNouns);
      expect(res.gate4_distractor_quality.passed).toBe(false);
      expect(res.allPassed).toBe(false);
    });

    it('4.4 passes Gate 4 when all options share the same part-of-speech category', () => {
      // 4 verbs
      const qAllVerbs: Partial<CandidateQuestion> = {
        stem: '下午我们一起去操场____吧。',
        options: ['跑步', '打球', '跳舞', '散步'],
        answer_idx: 0,
        explanation_vi: 'Dịch nghĩa: Chiều nay chúng ta cùng ra sân vận động chạy bộ nhé. - Phân tích: + Phương án B (打球): Chơi bóng. + Phương án C (跳舞): Nhảy múa. + Phương án D (散步): Đi dạo.',
        level: 2,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };

      const resVerbs = evaluateCandidateSixGates(qAllVerbs);
      expect(resVerbs.gate4_distractor_quality.passed).toBe(true);
      expect(resVerbs.gate4_distractor_quality.details).toContain('share matching part-of-speech');

      // 4 nouns
      const qAllNouns: Partial<CandidateQuestion> = {
        stem: '我想去图书馆借几本____。',
        options: ['书', '杂志', '词典', '小说'],
        answer_idx: 0,
        explanation_vi: 'Dịch nghĩa: Tôi muốn đến thư viện mượn vài quyển sách. - Phân tích: + Phương án B (杂志): Tạp chí. + Phương án C (词典): Từ điển. + Phương án D (小说): Tiểu thuyết.',
        level: 3,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };

      const resNouns = evaluateCandidateSixGates(qAllNouns);
      expect(resNouns.gate4_distractor_quality.passed).toBe(true);
    });
  });

  // =========================================================================
  // GATE 5: RATIONALE & EXPLANATIONS
  // =========================================================================
  describe('Gate 5 Adversarial Challenges: Rationale & Explanations', () => {
    it('5.1 rejects empty or missing explanation_vi', () => {
      const base: Partial<CandidateQuestion> = {
        stem: '今天天气很好，我想去学校____借两本书。',
        options: ['借', '买', '看', '吃'],
        answer_idx: 0,
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };

      const qEmptyExp: Partial<CandidateQuestion> = { ...base, explanation_vi: '' };
      const resEmpty = evaluateCandidateSixGates(qEmptyExp);
      expect(resEmpty.gate2_rationales_coherence.passed).toBe(false);
      expect(resEmpty.allPassed).toBe(false);

      const qShortExp: Partial<CandidateQuestion> = { ...base, explanation_vi: 'abc' };
      const resShort = evaluateCandidateSixGates(qShortExp);
      expect(resShort.gate2_rationales_coherence.passed).toBe(false);
    });

    it('5.2 rejects explanation that designates an option letter contradicting answer_idx', () => {
      const qContradictLetter: Partial<CandidateQuestion> = {
        stem: '今天天气很好，我想去学校____借两本书。',
        options: ['借', '买', '看', '吃'],
        answer_idx: 0, // Option A
        explanation_vi: 'Phương án đúng là C (看) vì sách dùng để đọc xem.', // Contradicts option A
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };

      const res = evaluateCandidateSixGates(qContradictLetter);
      expect(res.gate2_rationales_coherence.passed).toBe(false);
      expect(res.gate2_rationales_coherence.details).toContain('contradicts answer_idx');
      expect(res.allPassed).toBe(false);
    });

    it('5.3 rejects explanation that designates a distractor text as correct', () => {
      const qDesignateDistractor: Partial<CandidateQuestion> = {
        stem: '今天天气很好，我想去学校____借两本书。',
        options: ['借', '买', '看', '吃'],
        answer_idx: 0, // Option A ('借')
        explanation_vi: 'Trong câu này đáp án đúng là "买" vì có thể mua sách ở trường.', // Distractor '买' designated
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };

      const res = evaluateCandidateSixGates(qDesignateDistractor);
      expect(res.gate2_rationales_coherence.passed).toBe(false);
      expect(res.gate2_rationales_coherence.details).toContain('designates distractor');
      expect(res.allPassed).toBe(false);
    });

    it('5.4 enforces distractor rationales when requireDistractorRationales is true in validateCandidate', () => {
      const qNoRationales: Partial<CandidateQuestion> = {
        stem: '今天天气很好，我想去学校____借两本书。',
        options: ['借', '买', '看', '吃'],
        answer_idx: 0,
        explanation_vi: 'Giải thích đơn giản: chọn trường học để mượn sách.', // No distractor breakdown
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };

      const resStrict = validateCandidate(qNoRationales, [], { requireDistractorRationales: true });
      expect(resStrict.valid).toBe(false);
      expect(resStrict.errors.some((e) => e.includes('requires distractor rationales'))).toBe(true);

      // Gate 2 regex filter includes /rationale|distractor/i to catch distractor rationales errors
      const sixGatesStrict = evaluateCandidateSixGates(qNoRationales, [], { requireDistractorRationales: true });
      expect(sixGatesStrict.gate2_rationales_coherence.passed).toBe(false);
      expect(sixGatesStrict.gate2_rationales_coherence.details).toContain('distractor rationales');
      expect(sixGatesStrict.allPassed).toBe(false);
    });
  });

  // =========================================================================
  // GATE 6: BLIND-SOLVE HEURISTICS & SINGLE-ANSWER GUARANTEE
  // =========================================================================
  describe('Gate 6 Adversarial Challenges: Blind-Solve Heuristics', () => {
    it('6.1 verifies disambiguating tokens (measure words, verbs, complements, conjunctions)', () => {
      // 1. Measure word constraint (两本 -> 书)
      const qMeasure: Partial<CandidateQuestion> = {
        stem: '桌子上有两本____，是汉语课本。',
        options: ['书', '笔', '杯子', '衣服'],
        answer_idx: 0,
        explanation_vi: 'Giải thích: Lượng từ 本 đi với 书.',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };
      const bMeasure = evaluateBlindSolveHeuristic(qMeasure);
      expect(bMeasure.hasAmbiguity).toBe(false);
      expect(bMeasure.disambiguatingTokens?.some((t) => t.includes('Measure word'))).toBe(true);

      // 2. Action verb constraint (喝____ -> 咖啡)
      const qVerb: Partial<CandidateQuestion> = {
        stem: '爸爸早上坐在沙发上喝____，提神醒脑。',
        options: ['咖啡', '面包', '米饭', '苹果'],
        answer_idx: 0,
        explanation_vi: 'Giải thích: Động từ 喝 đi với 咖啡.',
        level: 2,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };
      const bVerb = evaluateBlindSolveHeuristic(qVerb);
      expect(bVerb.hasAmbiguity).toBe(false);
      expect(bVerb.disambiguatingTokens?.some((t) => t.includes('Action verb'))).toBe(true);

      // 3. Conjunction constraint (因为...所以)
      const qConj: Partial<CandidateQuestion> = {
        stem: '因为昨天晚上下大雨，____今天运动会推迟了。',
        options: ['所以', '但是', '而且', '或者'],
        answer_idx: 0,
        explanation_vi: 'Giải thích: Cặp liên từ 因为...所以.',
        level: 2,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };
      const bConj = evaluateBlindSolveHeuristic(qConj);
      expect(bConj.hasAmbiguity).toBe(false);
      expect(bConj.disambiguatingTokens?.some((t) => t.includes('Conjunction'))).toBe(true);
    });

    it('6.2 passes fully compliant question through all 6 gates', () => {
      const validQ: Partial<CandidateQuestion> = {
        stem: '桌子上有两本____，是小明借来的材料。',
        options: ['书', '杂志', '词典', '小说'], // 4 matching nouns, no leak in stem
        answer_idx: 0,
        explanation_vi: `Dịch nghĩa: Trên bàn có hai quyển sách, là tài liệu mà Tiểu Minh mượn về.
- Đáp án đúng: Lượng từ 本 kết hợp chuẩn với 书.
- Phân tích phương án nhiễu:
  + Phương án B (杂志): Tạp chí, không phù hợp bằng danh từ khái quát.
  + Phương án C (词典): Từ điển, thường ghi rõ tên từ điển.
  + Phương án D (小说): Tiểu thuyết, mang tính văn học giải trí.`,
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
        difficulty_tier: 'tier1_difficult',
        trap_type: 'collocation',
      };

      const res = evaluateCandidateSixGates(validQ);
      expect(res.gate1_schema.passed).toBe(true);
      expect(res.gate2_rationales_coherence.passed).toBe(true);
      expect(res.gate3_vocab_coverage.passed).toBe(true);
      expect(res.gate4_distractor_quality.passed).toBe(true);
      expect(res.gate5_uniqueness.passed).toBe(true);
      expect(res.gate6_blind_solve.passed).toBe(true);
      expect(res.allPassed).toBe(true);
    });
  });

  // =========================================================================
  // POST-APPROVAL DISTRIBUTION & LEAK PREVENTION INVARIANTS
  // =========================================================================
  describe('Post-Approval Distribution Invariants & Leak Prevention', () => {
    let testDb: DatabaseSync;

    beforeEach(() => {
      testDb = new DatabaseSync(':memory:');
      ensurePendingSchema(testDb);
      ensureEligiblePoolSchema(testDb);
    });

    afterEach(() => {
      try {
        testDb.close();
      } catch {}
    });

    it('7.1 syncApprovedQuestion with a valid approved question correctly qualifies practice and exam pools', () => {
      testDb.prepare(`
        INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, illustration_theme, status, is_active, explanation_vi)
        VALUES ('q_appr_1', '今天天气很好，我想去学校____借两本书。', '["借","买","看","吃"]', 0, 1, 'reading', 'read_fill_blank_4opt', null, 'approved', 1, 'Exp')
      `).run();

      const res = syncApprovedQuestion('q_appr_1', testDb);
      expect(res).not.toBeNull();
      expect(res?.practice_eligible).toBe(true);

      const poolRow: any = testDb.prepare('SELECT * FROM exam_eligible_pool WHERE question_id = ?').get('q_appr_1');
      expect(poolRow).toBeDefined();
      expect(poolRow.practice_eligible).toBe(1);
    });

    it('7.2 serving queries strictly isolate questions: pending items NEVER appear in practice or mock pools', () => {
      // Insert a question only into pending_questions with status 'pending'
      testDb.prepare(`
        INSERT INTO pending_questions (id, batch_id, stem, options, answer_idx, pinyin, explanation_vi, level, skill, part_type, status, content_hash)
        VALUES ('q_pend_isolate', 'b1', '测试题干内容未批准。', '["A","B","C","D"]', 0, 'py', 'Exp', 1, 'reading', 'read_fill_blank_4opt', 'pending', 'hash_1')
      `).run();

      // Test serving queries: loadApprovedQuestionsFromDb
      const practiceQuestions = loadApprovedQuestionsFromDb(1, { mode: 'practice', skill: 'reading' }, testDb);
      expect(practiceQuestions.some((q) => q.id === 'q_pend_isolate')).toBe(false);

      const mockQuestions = loadApprovedQuestionsFromDb(1, { mode: 'mock', skill: 'reading' }, testDb);
      expect(mockQuestions.some((q) => q.id === 'q_pend_isolate')).toBe(false);
    });

    it('7.3 rejected questions are completely excluded from both practice and mock serving pools', () => {
      testDb.prepare(`
        INSERT INTO pending_questions (id, batch_id, stem, options, answer_idx, pinyin, explanation_vi, level, skill, part_type, status, content_hash)
        VALUES ('q_rej_isolate', 'b1', '测试已拒绝题干。', '["A","B","C","D"]', 0, 'py', 'Exp', 1, 'reading', 'read_fill_blank_4opt', 'rejected', 'hash_2')
      `).run();

      const practiceQuestions = loadApprovedQuestionsFromDb(1, { mode: 'practice' }, testDb);
      expect(practiceQuestions.some((q) => q.id === 'q_rej_isolate')).toBe(false);

      const mockQuestions = loadApprovedQuestionsFromDb(1, { mode: 'mock' }, testDb);
      expect(mockQuestions.some((q) => q.id === 'q_rej_isolate')).toBe(false);
    });

    it('7.4 disabling an approved question (is_active=0) immediately excludes it from serving', () => {
      testDb.prepare(`
        INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active, explanation_vi)
        VALUES ('q_disabled_1', '有效题干内容。', '["A","B","C","D"]', 0, 1, 'reading', 'read_fill_blank_4opt', 'approved', 0, 'Exp')
      `).run();

      syncApprovedQuestion('q_disabled_1', testDb);

      const practiceQuestions = loadApprovedQuestionsFromDb(1, { mode: 'practice' }, testDb);
      expect(practiceQuestions.some((q) => q.id === 'q_disabled_1')).toBe(false);

      const mockQuestions = loadApprovedQuestionsFromDb(1, { mode: 'mock' }, testDb);
      expect(mockQuestions.some((q) => q.id === 'q_disabled_1')).toBe(false);
    });

    it('7.5 audit syncApprovedQuestion behavior on pending-only items and pool statistics', () => {
      // Insert 2 approved questions and 1 pending question
      testDb.prepare(`
        INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active, explanation_vi)
        VALUES 
          ('q_appr_a', '题干A内容充足。', '["A","B","C","D"]', 0, 1, 'reading', 'read_fill_blank_4opt', 'approved', 1, 'Exp'),
          ('q_appr_b', '题干B内容充足。', '["A","B","C","D"]', 0, 1, 'reading', 'read_fill_blank_4opt', 'approved', 1, 'Exp')
      `).run();

      syncApprovedQuestion('q_appr_a', testDb);
      syncApprovedQuestion('q_appr_b', testDb);

      const stats = getEligiblePoolStats(testDb);
      expect(stats['1'].practice_count).toBe(2);

      // Now insert pending question only in pending_questions
      testDb.prepare(`
        INSERT INTO pending_questions (id, batch_id, stem, options, answer_idx, pinyin, explanation_vi, level, skill, part_type, status, content_hash)
        VALUES ('q_pend_audit', 'b1', '题干未审核内容。', '["A","B","C","D"]', 0, 'py', 'Exp', 1, 'reading', 'read_fill_blank_4opt', 'pending', 'hash_3')
      `).run();

      // Ensure stats do NOT count the pending question
      const statsAfter = getEligiblePoolStats(testDb);
      expect(statsAfter['1'].practice_count).toBe(2);
    });

    it('7.6 calling syncApprovedQuestion on an unapproved pending question enforces status guard and prevents pool leak', () => {
      // Question exists ONLY in pending_questions with status = 'pending'
      testDb.prepare(`
        INSERT INTO pending_questions (id, batch_id, stem, options, answer_idx, pinyin, explanation_vi, level, skill, part_type, status, content_hash)
        VALUES ('q_pend_direct_sync', 'b1', '待审题目题干内容充足。', '["A","B","C","D"]', 0, 'py', 'Exp', 1, 'reading', 'read_fill_blank_4opt', 'pending', 'hash_4')
      `).run();

      // Calling syncApprovedQuestion directly on an unapproved question
      const syncRes = syncApprovedQuestion('q_pend_direct_sync', testDb);

      const poolRow: any = testDb.prepare('SELECT * FROM exam_eligible_pool WHERE question_id = ?').get('q_pend_direct_sync');
      
      // Status guard prevents unapproved question from being marked eligible in exam_eligible_pool
      expect(poolRow?.practice_eligible ?? 0).toBe(0);
      expect(poolRow?.exam_eligible ?? 0).toBe(0);
      expect(syncRes?.practice_eligible).toBe(false);
      expect(syncRes?.exam_eligible).toBe(false);

      // Serving query loadApprovedQuestionsFromDb provides second-line defense
      const practiceQuestions = loadApprovedQuestionsFromDb(1, { mode: 'practice' }, testDb);
      expect(practiceQuestions.some((q) => q.id === 'q_pend_direct_sync')).toBe(false);
    });
  });
});
