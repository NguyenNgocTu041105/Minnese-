import { describe, it, expect } from 'vitest';
import {
  evaluateBlindSolveHeuristic,
  evaluateCandidateSixGates,
  validateCandidate,
} from '../src/server/llm/questionValidator.js';
import { validateFormatCompatibility } from '../src/server/qbankFormatSync.js';
import { CandidateQuestion } from '../src/server/llm/types.js';

describe('Semantic Uniqueness & Disambiguation Quality Contract', () => {
  describe('1. Quantifier & Number Ambiguity (Pilot 4 Root Cause)', () => {
    it('catches underspecified quantifier stem (e.g. 我想在商店买____本书。) with multiple valid numbers', () => {
      // Real Candidate #2 from Pilot 4
      const pilot4Candidate2: Partial<CandidateQuestion> = {
        stem: '我想在商店买____本书。',
        options: ['二', '一', '两', '三'],
        answer_idx: 2,
        explanation_vi: 'Dịch nghĩa: Tôi muốn mua hai cuốn sách. 两 là từ chỉ số lượng bắt buộc trước lượng từ 本.',
        level: 2,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };

      const blind = evaluateBlindSolveHeuristic(pilot4Candidate2);
      expect(blind.hasAmbiguity).toBe(true);
      expect(blind.semantic_uniqueness_status).toBe('MULTIPLE_VALID_OPTIONS');
      expect(blind.competingOptions).toContain('一');
      expect(blind.competingOptions).toContain('两');
      expect(blind.competingOptions).toContain('三');

      const gates = evaluateCandidateSixGates(pilot4Candidate2);
      expect(gates.gate6_blind_solve.passed).toBe(false);
      expect(gates.gate6_blind_solve.details).toContain('MULTIPLE_VALID_OPTIONS');
      expect(gates.allPassed).toBe(false);

      const format = validateFormatCompatibility(
        { ...pilot4Candidate2, sixGates: gates, solverAnalysis: blind, valid: false },
        2
      );
      expect(format.quality_validation_status).toBe('FAIL');
      expect(format.operational_serving_eligible).toBe(false);
    });

    it('passes quantifier stem when stem contains numerical/situational constraints', () => {
      const constrainedQ: Partial<CandidateQuestion> = {
        stem: '我和弟弟一人一本，一共想买____本书。',
        options: ['二', '一', '两', '三'],
        answer_idx: 2,
        explanation_vi: 'Mỗi người một quyển, tổng cộng là 2 quyển nên dùng 两 trước lượng từ 本.',
        level: 2,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };

      const blind = evaluateBlindSolveHeuristic(constrainedQ);
      expect(blind.hasAmbiguity).toBe(false);
      expect(blind.semantic_uniqueness_status).toBe('UNIQUE_ANSWER_CONFIRMED');
      expect(blind.disambiguatingTokens?.some((t) => t.includes('Numerical constraint'))).toBe(true);

      const gates = evaluateCandidateSixGates(constrainedQ);
      expect(gates.gate6_blind_solve.passed).toBe(true);
    });
  });

  describe('2. Verb & Object Collocation Ambiguity', () => {
    it('rejects short stem lacking topical cues with multiple valid verb collocates', () => {
      const ambiguousQ: Partial<CandidateQuestion> = {
        stem: '他在看____。',
        options: ['书', '电视', '苹果', '水'],
        answer_idx: 0,
        explanation_vi: 'Anh ấy đang đọc sách.',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };

      const blind = evaluateBlindSolveHeuristic(ambiguousQ);
      expect(blind.hasAmbiguity).toBe(true);
      expect(blind.semantic_uniqueness_status).toBe('MULTIPLE_VALID_OPTIONS');
      expect(blind.competingOptions).toContain('书');
      expect(blind.competingOptions).toContain('电视');
    });

    it('accepts stem with topical setting clue that disambiguates verb collocate', () => {
      const contextualQ: Partial<CandidateQuestion> = {
        stem: '他在图书馆看____。',
        options: ['书', '电视', '苹果', '水'],
        answer_idx: 0,
        explanation_vi: 'Ở thư viện đọc sách.',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };

      const blind = evaluateBlindSolveHeuristic(contextualQ);
      expect(blind.hasAmbiguity).toBe(false);
      expect(blind.semantic_uniqueness_status).toBe('UNIQUE_ANSWER_CONFIRMED');
      expect(blind.disambiguatingTokens?.some((t) => t.includes('Contextual clue'))).toBe(true);
    });
  });

  describe('3. Reading Comprehension Evidence & Competing Options', () => {
    it('passes reading comprehension with single supported answer (Candidate #1 Pilot 4)', () => {
      const pilot4Candidate1: Partial<CandidateQuestion> = {
        stem: '因为今天下大雨，所以我们不去旅游。★ 我们不去旅游的原因是什么？',
        options: ['因为没带地图', '因为下大雨', '因为太累了'],
        answer_idx: 1,
        explanation_vi: 'Đoạn văn nêu rõ nguyên nhân là 下大雨.',
        level: 2,
        skill: 'reading',
        part_type: 'read_comprehension_short_3opt',
      };

      const blind = evaluateBlindSolveHeuristic(pilot4Candidate1);
      expect(blind.hasAmbiguity).toBe(false);
      expect(blind.semantic_uniqueness_status).toBe('UNIQUE_ANSWER_CONFIRMED');

      const gates = evaluateCandidateSixGates(pilot4Candidate1);
      expect(gates.gate6_blind_solve.passed).toBe(true);
    });

    it('rejects reading comprehension when passage simultaneously supports multiple choices', () => {
      const multipleSupportedQ: Partial<CandidateQuestion> = {
        stem: '今天外面下大雨，而且我也很累，所以不去旅游。★ 他为什么不去旅游？',
        options: ['下大雨', '很累', '没钱'],
        answer_idx: 0,
        explanation_vi: 'Cả hai lý do đều được nhắc đến trong đoạn văn.',
        level: 2,
        skill: 'reading',
        part_type: 'read_comprehension_short_3opt',
      };

      const blind = evaluateBlindSolveHeuristic(multipleSupportedQ);
      expect(blind.hasAmbiguity).toBe(true);
      expect(blind.semantic_uniqueness_status).toBe('MULTIPLE_VALID_OPTIONS');
      expect(blind.competingOptions).toContain('下大雨');
      expect(blind.competingOptions).toContain('很累');
    });
  });

  describe('4. Listening & Picture Media Quality Pipeline', () => {
    it('rejects listening question missing audio_text or transcript', () => {
      const listenMissingAudio: Partial<CandidateQuestion> = {
        stem: '请听录音，选择正确答案。',
        options: ['苹果', '香蕉', '西瓜'],
        answer_idx: 0,
        explanation_vi: 'Nghe từ quả táo.',
        level: 1,
        skill: 'listening',
        part_type: 'listen_question_answer_3opt',
      };

      const res = validateCandidate(listenMissingAudio);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => /audio text|transcript/i.test(e))).toBe(true);

      const gates = evaluateCandidateSixGates(listenMissingAudio);
      expect(gates.gate1_schema.passed).toBe(false);
    });

    it('passes listening question with valid audio_text and matching options', () => {
      const listenValid: Partial<CandidateQuestion> = {
        stem: '你想吃什么？',
        audio_text: '我想吃苹果。',
        options: ['苹果', '米饭', '茶'],
        answer_idx: 0,
        explanation_vi: 'Trong đoạn ghi âm nói: 我想吃苹果 (Tôi muốn ăn táo).',
        level: 1,
        skill: 'listening',
        part_type: 'listen_question_answer_3opt',
      };

      const res = validateCandidate(listenValid);
      expect(res.valid).toBe(true);

      const gates = evaluateCandidateSixGates(listenValid);
      expect(gates.gate1_schema.passed).toBe(true);
      expect(gates.gate6_blind_solve.passed).toBe(true);
    });
  });

  describe('5. Fail-Closed Serving Invariants', () => {
    it('strictly denies operational serving to questions with MULTIPLE_VALID_OPTIONS even if approved', () => {
      const ambiguousApproved = {
        status: 'approved',
        is_active: 1,
        stem: '我想在商店买____本书。',
        options: ['二', '一', '两', '三'],
        answer_idx: 2,
        level: 2,
        part_type: 'read_fill_blank_4opt',
        sixGates: {
          gate1_schema: { passed: true },
          gate2_rationales_coherence: { passed: true },
          gate3_vocab_coverage: { passed: true },
          gate4_distractor_quality: { passed: true },
          gate5_uniqueness: { passed: true },
          gate6_blind_solve: { passed: false },
          allPassed: false,
        },
        solverAnalysis: {
          isUnambiguous: false,
          semantic_uniqueness_status: 'MULTIPLE_VALID_OPTIONS',
        },
      };

      const check = validateFormatCompatibility(ambiguousApproved, 2);
      expect(check.quality_validation_status).toBe('FAIL');
      expect(check.operational_serving_eligible).toBe(false);
      expect(check.operational_serving_practice_eligible).toBe(false);
      expect(check.operational_serving_exam_eligible).toBe(false);
    });

    it('strictly denies operational serving to pending questions even if quality_validation_status is PASS', () => {
      const pendingQualityPassed = {
        status: 'pending', // NOT approved
        is_active: 1,
        stem: '桌子上有2本书，小明想买____本。',
        options: ['二', '一', '两', '三'],
        answer_idx: 2,
        level: 2,
        part_type: 'read_fill_blank_4opt',
        quality_validation_status: 'PASS',
      };

      const check = validateFormatCompatibility(pendingQualityPassed, 2);
      expect(check.quality_validation_status).toBe('PASS');
      expect(check.operational_serving_eligible).toBe(false);
      expect(check.operational_serving_practice_eligible).toBe(false);
    });
  });
});
