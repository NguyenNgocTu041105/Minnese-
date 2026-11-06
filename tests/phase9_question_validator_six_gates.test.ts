/**
 * tests/phase9_question_validator_six_gates.test.ts
 *
 * Phase 9 / Milestone 2 Verification Suite: 6-Gate Question Validator,
 * POS Dictionary, Distractor Quality, and Blind-Solve Heuristic.
 */

import { describe, it, expect } from 'vitest';
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

describe('Phase 9 Milestone 2: 6-Gate Question Validator Architecture', () => {
  describe('Gate 1: Schema & Blueprint Option Structure', () => {
    it('1.1 validates dynamic option counts: 0 for writing, 3/4/6 for MCQs', () => {
      // Writing task with 0 options
      const writeQ: Partial<CandidateQuestion> = {
        stem: '看图写句子：小猫在桌子下面睡觉。',
        options: [],
        answer_idx: 0,
        explanation_vi: 'Yêu cầu viết câu đúng ngữ pháp dựa theo hình ảnh minh họa.',
        level: 2,
        skill: 'writing',
        part_type: 'write_sentence_from_picture_word',
      };
      const resWrite = evaluateCandidateSixGates(writeQ);
      expect(resWrite.gate1_schema.passed).toBe(true);

      // 4-opt reading question
      const mcq4: Partial<CandidateQuestion> = {
        stem: '今天天气很好，我想去____买两本书。',
        options: ['学校', '医院', '家', '商店'],
        answer_idx: 0,
        explanation_vi: 'Dịch nghĩa: Hôm nay thời tiết rất tốt, tôi muốn đến trường mua sách. - Phân tích phương án nhiễu: + Phương án B (医院): Là bệnh viện. + Phương án C (家): Là nhà. + Phương án D (商店): Là cửa hàng.',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
        difficulty_tier: 'tier1_difficult',
        trap_type: 'collocation',
      };
      const res4 = evaluateCandidateSixGates(mcq4);
      expect(res4.gate1_schema.passed).toBe(true);
    });

    it('1.2 rejects mismatched option count and out-of-bounds answer_idx', () => {
      // 4-opt question with only 3 options
      const badCountQ: Partial<CandidateQuestion> = {
        stem: '今天天气很好，我想去____借两本书。',
        options: ['学校', '医院', '机场'],
        answer_idx: 0,
        explanation_vi: 'Giải thích chi tiết phương án.',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };
      const resCount = evaluateCandidateSixGates(badCountQ);
      expect(resCount.gate1_schema.passed).toBe(false);

      // Out of bounds answer_idx
      const badIdxQ: Partial<CandidateQuestion> = {
        stem: '今天天气很好，我想去____借两本书。',
        options: ['学校', '医院', '机场', '商店'],
        answer_idx: 4, // out of bounds
        explanation_vi: 'Giải thích chi tiết phương án.',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };
      const resIdx = evaluateCandidateSixGates(badIdxQ);
      expect(resIdx.gate1_schema.passed).toBe(false);
    });

    it('1.3 enforces valid difficulty_tier enums and warns on unrecognized trap_type', () => {
      const validTierQ: Partial<CandidateQuestion> = {
        stem: '今天天气很好，我想去____借两本书。',
        options: ['学校', '医院', '机场', '商店'],
        answer_idx: 0,
        explanation_vi: 'Giải thích chi tiết phương án.',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
        difficulty_tier: 'tier2_very_difficult',
        trap_type: 'near_synonym_collocation',
      };
      const resValid = validateCandidate(validTierQ);
      expect(resValid.errors.some((e) => e.includes('Invalid difficulty_tier'))).toBe(false);

      const invalidTierQ: Partial<CandidateQuestion> = {
        ...validTierQ,
        difficulty_tier: 'impossible_nightmare' as any,
      };
      const resInvalid = validateCandidate(invalidTierQ);
      expect(resInvalid.errors.some((e) => e.includes('Invalid difficulty_tier'))).toBe(true);
    });

    it('1.4 detects stem answer leakage and underspecified stem', () => {
      // Correct answer '苹果' appears in stem
      const leakQ: Partial<CandidateQuestion> = {
        stem: '桌子上的苹果很大，我想吃____。',
        options: ['苹果', '香蕉', '西瓜', '米饭'],
        answer_idx: 0,
        explanation_vi: 'Giải thích câu hỏi.',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };
      const resLeak = evaluateCandidateSixGates(leakQ);
      expect(resLeak.gate1_schema.passed).toBe(false);
      expect(resLeak.gate1_schema.details).toContain('Stem answer leakage detected');

      // Too short stem (< 4 Hanzi)
      const shortQ: Partial<CandidateQuestion> = {
        stem: '看____。',
        options: ['书', '人', '水', '天'],
        answer_idx: 0,
        explanation_vi: 'Giải thích câu hỏi.',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };
      const resShort = evaluateCandidateSixGates(shortQ);
      expect(resShort.gate1_schema.passed).toBe(false);
      expect(resShort.gate1_schema.details).toContain('underspecified');
    });
  });

  describe('Gate 2: Explanation Coherence & Distractor Rationales', () => {
    it('2.1 passes coherent explanation with structured distractor rationales', () => {
      const q: Partial<CandidateQuestion> = {
        stem: '哥哥每天下午去操场做____，身体非常健康。',
        options: ['运动', '电影', '手机', '电脑'],
        answer_idx: 0,
        explanation_vi: `Dịch nghĩa: Anh trai mỗi chiều đều ra sân vận động tập thể dục.
- Đáp án đúng: 做运动 là cụm kết hợp cố định (tập thể dục).
- Phân tích phương án nhiễu:
  + Phương án B (电影): Là phim ảnh, không đi với 做 trong ngữ cảnh sân vận động.
  + Phương án C (手机): Là điện thoại di động.
  + Phương án D (电脑): Là máy vi tính.`,
        level: 2,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };
      const res = evaluateCandidateSixGates(q);
      expect(res.gate2_rationales_coherence.passed).toBe(true);
      expect(res.gate2_rationales_coherence.details).toContain('distractor rationales present');
    });

    it('2.2 catches explanation letter contradiction and distractor designated as correct', () => {
      const qContradict: Partial<CandidateQuestion> = {
        stem: '哥哥每天下午去操场做____，身体非常健康。',
        options: ['运动', '电影', '手机', '电脑'],
        answer_idx: 0, // Option A
        explanation_vi: 'Đáp án đúng là B (电影) vì đây là sở thích lành mạnh.', // Contradiction: says B
        level: 2,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };
      const res = evaluateCandidateSixGates(qContradict);
      expect(res.gate2_rationales_coherence.passed).toBe(false);
      expect(res.gate2_rationales_coherence.details).toContain('contradicts');
    });

    it('2.3 requires distractor rationales when requireDistractorRationales is explicitly enabled', () => {
      const qNoRationales: Partial<CandidateQuestion> = {
        stem: '哥哥每天下午去操场做____，身体非常健康。',
        options: ['运动', '电影', '手机', '电脑'],
        answer_idx: 0,
        explanation_vi: 'Giải thích ngắn gọn không có phân tích từng đáp án sai.',
        level: 2,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };
      const resStrict = validateCandidate(qNoRationales, [], { requireDistractorRationales: true });
      expect(resStrict.valid).toBe(false);
      expect(resStrict.errors.some((e) => e.includes('requires distractor rationales'))).toBe(true);
    });
  });

  describe('Gate 3: Syllabus Vocabulary Coverage', () => {
    it('3.1 verifies vocabulary alignment with target HSK level', () => {
      const qHsk1: Partial<CandidateQuestion> = {
        stem: '桌子上有三个____，很好吃。',
        options: ['苹果', '包子', '米饭', '饺子'],
        answer_idx: 0,
        explanation_vi: 'Giải thích chi tiết phương án.',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };
      const res = evaluateCandidateSixGates(qHsk1);
      expect(res.gate3_vocab_coverage.passed).toBe(true);
    });
  });

  describe('Gate 4: Distractor Quality & Part-of-Speech Verification', () => {
    it('4.1 loads word POS dictionary from hsk30.csv and normalizes POS tags correctly', () => {
      const dict = loadWordPosDictionary();
      expect(dict.size).toBeGreaterThan(1000);

      const normNoun = normalizePosTag('n');
      expect(normNoun).toContain('noun');

      const normVerb = normalizePosTag('动词');
      expect(normVerb).toContain('verb');

      const normAdj = normalizePosTag('形');
      expect(normAdj).toContain('adjective');

      const applePos = getWordPos('苹果');
      expect(applePos).toContain('noun');

      const runPos = getWordPos('跑步');
      expect(runPos).toContain('verb');
    });

    it('4.2 passes when all distractors share matching part-of-speech with target', () => {
      const qSamePos: Partial<CandidateQuestion> = {
        stem: '桌子上有三个____，很好吃。',
        options: ['苹果', '包子', '米饭', '饺子'], // All nouns
        answer_idx: 0,
        explanation_vi: 'Giải thích chi tiết.',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };
      const res = evaluateCandidateSixGates(qSamePos);
      expect(res.gate4_distractor_quality.passed).toBe(true);
      expect(res.gate4_distractor_quality.details).toContain('share matching part-of-speech');
    });

    it('4.3 detects POS mismatch when distractors have incompatible parts-of-speech', () => {
      const qMismatchPos: Partial<CandidateQuestion> = {
        stem: '桌子上有三个____，很好吃。',
        options: ['苹果', '跑步', '高兴', '饺子'], // 苹果 is noun, 跑步 is verb, 高兴 is adjective
        answer_idx: 0,
        explanation_vi: 'Giải thích chi tiết.',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };
      const res = evaluateCandidateSixGates(qMismatchPos);
      expect(res.gate4_distractor_quality.passed).toBe(false);
      expect(res.gate4_distractor_quality.details).toContain('跑步');
    });
  });

  describe('Gate 5: Multi-Tier Deduplication & Uniqueness', () => {
    it('5.1 detects exact duplicate and sorted-option permutation signature', () => {
      const stem = '今天天气很好，我想去____借两本书。';
      const options = ['学校', '医院', '机场', '商店'];
      const q: Partial<CandidateQuestion> = {
        stem,
        options,
        answer_idx: 0,
        explanation_vi: 'Giải thích chi tiết.',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };

      const cHash = computeContentHash(stem, options, 0);
      const nearSig = computeNearDuplicateSignature(stem, options);

      // Duplicate hash
      const resExact = validateCandidate(q, [], {
        existingContentHashes: new Set([cHash]),
      });
      expect(resExact.valid).toBe(false);
      expect(resExact.errors.some((e) => e.toLowerCase().includes('exact duplicate'))).toBe(true);

      // Reordered options near duplicate
      const reorderedQ: Partial<CandidateQuestion> = {
        ...q,
        options: ['商店', '机场', '医院', '学校'],
        answer_idx: 3,
      };
      const resNear = validateCandidate(reorderedQ, [], {
        existingNearDupSignatures: new Set([nearSig]),
      });
      expect(resNear.valid).toBe(false);
      expect(resNear.errors.some((e) => e.toLowerCase().includes('near-duplicate'))).toBe(true);
    });
  });

  describe('Gate 6: Lightweight Blind Solve & Single-Answer Guarantee', () => {
    it('6.1 detects generic underspecified stem as ambiguous (hasSolverAmbiguity: true)', () => {
      const ambiguousQ: Partial<CandidateQuestion> = {
        stem: '我喜欢____。',
        options: ['苹果', '香蕉', '西瓜', '米饭'],
        answer_idx: 0,
        explanation_vi: 'Giải thích chi tiết.',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };

      const blind = evaluateBlindSolveHeuristic(ambiguousQ);
      expect(blind.hasAmbiguity).toBe(true);
      expect(blind.reason).toContain('Generic stem');

      const sixGates = evaluateCandidateSixGates(ambiguousQ);
      expect(sixGates.gate6_blind_solve.passed).toBe(false);
      expect(sixGates.gate6_blind_solve.details.toLowerCase()).toContain('ambiguity');
    });

    it('6.2 passes contextual stem with disambiguating tokens (measure word, verb, complement)', () => {
      const contextualQ: Partial<CandidateQuestion> = {
        stem: '桌子上有三个____，很好吃。',
        options: ['苹果', '包子', '米饭', '饺子'],
        answer_idx: 0,
        explanation_vi: 'Giải thích chi tiết.',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };

      const blind = evaluateBlindSolveHeuristic(contextualQ);
      expect(blind.hasAmbiguity).toBe(false);
      expect(blind.disambiguatingTokens?.length).toBeGreaterThan(0);

      const sixGates = evaluateCandidateSixGates(contextualQ);
      expect(sixGates.gate6_blind_solve.passed).toBe(true);
    });
  });
});
