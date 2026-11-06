import { describe, it, expect } from 'vitest';
import { validateCandidate, evaluateCandidateSixGates } from '../src/server/llm/questionValidator.js';
import { WATERFALL_PROVIDERS, checkDeepSeekBalance } from '../src/server/llm/waterfallGenerator.js';
import { CandidateQuestion } from '../src/server/llm/types.js';

describe('Free-Tier Calibration: Rationale Coherence & Question Unambiguity & DeepSeek Lock', () => {
  describe('1. Rationale Coherence & Distractor Designation Tests', () => {
    it('STRICTLY REJECTS explanation that explicitly designates a distractor as correct', () => {
      const candidate: Partial<CandidateQuestion> = {
        stem: '因为下雨，小明今天在家看书。★ 小明为什么在家？',
        options: ['因为想看电视', '因为下雨', '因为身体不舒服'],
        answer_idx: 1,
        explanation_vi: "Dịch nghĩa: Vì trời mưa... Đáp án đúng là '因为想看电视'.",
        level: 2,
        skill: 'reading',
        part_type: 'read_comprehension_short_3opt',
      };

      const res = validateCandidate(candidate, []);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes("Explanation designates distractor '因为想看电视' as correct"))).toBe(true);
    });

    it('STRICTLY REJECTS explanation that designates wrong letter as correct', () => {
      const candidate: Partial<CandidateQuestion> = {
        stem: '因为下雨，小明今天在家看书。★ 小明为什么在家？',
        options: ['因为想看电视', '因为下雨', '因为身体不舒服'],
        answer_idx: 1, // B
        explanation_vi: 'Đáp án đúng là A vì trời mưa.',
        level: 2,
        skill: 'reading',
        part_type: 'read_comprehension_short_3opt',
      };

      const res = validateCandidate(candidate, []);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('Explanation contradicts answer_idx: explanation designates option A as correct'))).toBe(true);
    });

    it('DOES NOT falsely reject natural Vietnamese distractor rationales using "Lựa chọn" or "Không chọn"', () => {
      const candidate: Partial<CandidateQuestion> = {
        stem: '因为下雨，小明今天在家看书。★ 小明为什么在家？',
        options: ['因为想看电视', '因为下雨', '因为身体不舒服'],
        answer_idx: 1, // B
        explanation_vi: `Dịch nghĩa: Vì trời mưa, ngày hôm nay Tiểu Minh ở nhà xem sách. ★ Tiểu Minh tại sao ở nhà? Đáp án đúng là '因为下雨' (Bởi vì trời mưa).
- Đáp án đúng: 因为下雨: Đoạn văn nêu rõ nguyên nhân là trời mưa (下雨).
- Phân tích phương án nhiễu:
  + Phương án A (因为想看电视): Lựa chọn '因为想看电视' là phương án suy đoán, không được văn bản đề cập.
  + Phương án C (因为身体不舒服): Lựa chọn '因为身体不舒服' không phù hợp với thông tin trong bài.`,
        level: 2,
        skill: 'reading',
        part_type: 'read_comprehension_short_3opt',
      };

      const res = validateCandidate(candidate, []);
      const distractorDesignationErr = res.errors.filter((e) => e.includes('designates distractor'));
      expect(distractorDesignationErr).toHaveLength(0);
    });
  });

  describe('2. Universal Contextual Disambiguation (Blind Solve Gate 6)', () => {
    it('catches open underspecified stem lacking numerical context as MULTIPLE_VALID_OPTIONS', () => {
      const ambiguousQ: Partial<CandidateQuestion> = {
        stem: '我在书店买了____本书。',
        options: ['二', '两', '三', '四'],
        answer_idx: 1, // 两
        level: 2,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };

      const sixGates = evaluateCandidateSixGates(ambiguousQ, []);
      expect(sixGates.gate6_blind_solve.passed).toBe(false);
      expect(sixGates.gate6_blind_solve.details).toContain('MULTIPLE_VALID_OPTIONS');
      expect(sixGates.allPassed).toBe(false);
    });

    it('confirms unambiguous single answer when stem provides clear counting/contrastive context', () => {
      const unambiguousQ: Partial<CandidateQuestion> = {
        stem: '昨天买了一本，今天又买了一本，一共买了____本书。',
        options: ['二', '两', '三', '四'],
        answer_idx: 1, // 两
        level: 2,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
        explanation_vi: 'Đáp án đúng là 两: Biểu thị số lượng 2 cuốn sách (1+1=2) trước lượng từ 本 phải dùng 两.',
        distractor_rationales: [
          { optionIdx: 0, optionText: '二', rationaleVi: '二 chỉ dùng cho số đếm hoặc số thứ tự, không dùng trước lượng từ 本.' },
          { optionIdx: 2, optionText: '三', rationaleVi: 'Tổng số sách là 1 + 1 = 2, không phải 3 cuốn.' },
          { optionIdx: 3, optionText: '四', rationaleVi: 'Tổng số sách là 1 + 1 = 2, không phải 4 cuốn.' },
        ],
      };

      const sixGates = evaluateCandidateSixGates(unambiguousQ, []);
      expect(sixGates.gate6_blind_solve.passed).toBe(true);
      expect(sixGates.gate6_blind_solve.details).toContain('Unambiguous single answer');
    });
  });

  describe('3. DeepSeek Balance & Rotation Registry Invariants', () => {
    it('configures DeepSeek with deepseek-flash as primary model and isFreeTier: false', () => {
      const deepseek = WATERFALL_PROVIDERS.find((p) => p.id === 'deepseek-v3');
      expect(deepseek).toBeDefined();
      expect(deepseek?.isFreeTier).toBe(false);
      expect(deepseek?.models[0]).toBe('deepseek-flash');
      expect(deepseek?.status).toBe('free_tier_not_eligible');
      expect(deepseek?.paidModeAllowed).toBe(false);
    });

    it('verifies checkDeepSeekBalance reports 0 granted balance and eligibleForFree: false', async () => {
      const report = await checkDeepSeekBalance();
      expect(report.grantedBalance).toBe(0);
      expect(report.eligibleForFree).toBe(false);
      expect(report.status).toBe('free_tier_not_eligible');
      expect(report.statusReason).toContain('Zero granted free balance');
    });
  });
});
