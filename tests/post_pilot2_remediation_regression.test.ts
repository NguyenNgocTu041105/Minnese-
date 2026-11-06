import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import {
  validateCandidate,
  evaluateCandidateSixGates,
  computeContentHash,
} from '../src/server/llm/questionValidator.js';
import {
  validateFormatCompatibility,
  syncApprovedQuestion,
} from '../src/server/qbankFormatSync.js';
import { verifyQuestionVocab } from '../src/server/qbankCoverageEngine.js';

describe('Post-Pilot 2 Remediation & Regression Suite', () => {
  // =========================================================================
  // R1: Distractor Rationale Verification & Substring Cross-Contamination
  // =========================================================================
  describe('R1: Distractor Rationale Cross-Contamination & False-Rejection Fix', () => {
    const baseQuestion = {
      stem: '明天下午三点，我要打电话给妈妈。★ 时间是几点？',
      completed_stem: '明天下午三点，我要打电话给妈妈。★ 时间是几点？',
      canonical_completed_stem: '明天下午三点，我要打电话给妈妈。★ 时间是几点？',
      options: ['两点', '三点', '四点'],
      answer_idx: 1, // '三点'
      level: 1,
      skill: 'reading' as const,
      part_type: 'read_comprehension_short_3opt',
      explanation_vi: 'Dịch nghĩa: Ngày mai 3 giờ chiều...\n- Đáp án đúng: 三点\n- Phương án A (两点): Đoạn văn nêu rõ là 三点, không phải 两点.\n- Phương án C (四点): Đoạn văn nêu rõ là 三点, không phải 四点.',
    };

    it('PASS: Distractor rationale legitimately contrasts with the correct answer', () => {
      const q = {
        ...baseQuestion,
        distractor_rationales: [
          {
            option_idx: 0,
            option_text: '两点',
            rationale_vi: 'Văn bản nêu rõ là 三点 (ba giờ), không phải 两点 (hai giờ).',
          },
          {
            option_idx: 2,
            option_text: '四点',
            rationale_vi: 'Văn bản nêu rõ là 三点 (ba giờ), không phải 四点 (bốn giờ).',
          },
        ],
      };

      const res = validateCandidate(q, [], { requireDistractorRationales: true });
      expect(res.errors).toEqual([]);
      expect(res.valid).toBe(true);

      const gates = evaluateCandidateSixGates(q, [], { requireDistractorRationales: true });
      expect(gates.gate1_schema.passed).toBe(true);
      expect(gates.gate2_rationales_coherence.passed).toBe(true);
      expect(gates.gate3_vocab_coverage.passed).toBe(true);
      expect(gates.allPassed).toBe(true);
    });

    it('FAIL: Distractor rationale mistakenly references another incorrect distractor', () => {
      const q = {
        ...baseQuestion,
        distractor_rationales: [
          {
            option_idx: 0,
            option_text: '两点',
            // Option 0 mistakenly discusses option 2 ('四点')
            rationale_vi: 'Phương án 四点 là buổi chiều muộn, không phải đáp án.',
          },
          {
            option_idx: 2,
            option_text: '四点',
            rationale_vi: 'Văn bản nêu rõ là 三点, không phải 四点.',
          },
        ],
      };

      const res = validateCandidate(q, [], { requireDistractorRationales: true });
      expect(res.valid).toBe(false);
      expect(
        res.errors.some(
          (e) =>
            e.includes('distractor_rationales[0].rationale_vi mentions a different option text') &&
            e.includes('四点')
        )
      ).toBe(true);

      const gates = evaluateCandidateSixGates(q, [], { requireDistractorRationales: true });
      expect(gates.gate2_rationales_coherence.passed).toBe(false);
    });

    it('FAIL: option_text does not match options[option_idx]', () => {
      const q = {
        ...baseQuestion,
        distractor_rationales: [
          {
            option_idx: 0,
            option_text: '错字', // Mismatched text
            rationale_vi: 'Văn bản nêu rõ là 三点, không phải 两点.',
          },
          {
            option_idx: 2,
            option_text: '四点',
            rationale_vi: 'Văn bản nêu rõ là 三点, không phải 四点.',
          },
        ],
      };

      const res = validateCandidate(q, [], { requireDistractorRationales: true });
      expect(res.valid).toBe(false);
      expect(
        res.errors.some((e) =>
          e.includes('distractor_rationales[0].option_text must exactly match options[option_idx]')
        )
      ).toBe(true);
      const gates = evaluateCandidateSixGates(q, [], { requireDistractorRationales: true });
      expect(gates.gate1_schema.passed).toBe(false);
    });

    it('Substring Overlap: Resistance to False Positives when option is substring of self/answer', () => {
      // Options where option 0 '点' is a substring of option 1 '两点' and answer '三点'
      const overlapQ = {
        stem: '现在是下午____。',
        completed_stem: '现在是下午三点。',
        options: ['点', '两点', '三点'],
        answer_idx: 2, // '三点'
        level: 1,
        skill: 'reading' as const,
        part_type: 'read_fill_blank_4opt',
        distractor_rationales: [
          {
            option_idx: 0,
            option_text: '点',
            rationale_vi: 'Từ 点 đứng một mình không chỉ giờ cụ thể như 三点.',
          },
          {
            option_idx: 1,
            option_text: '两点',
            // Notice: '两点' contains '点', and '三点' contains '点'.
            // The rationale mentions '两点' and '三点', but does NOT discuss distractor 0 '点' standalone.
            rationale_vi: 'Thời gian chính xác là 三点, không phải 两点.',
          },
        ],
      };

      const res = validateCandidate(overlapQ, [], { requireDistractorRationales: true });
      // Should NOT flag option 1 for containing '点' because '点' is only inside '两点' and '三点'
      expect(
        res.errors.filter((e) =>
          e.includes('distractor_rationales[1].rationale_vi mentions a different option text')
        )
      ).toEqual([]);
    });

    it('Substring Overlap: Resistance to False Negatives when option genuinely discusses longer distractor', () => {
      const overlapQ = {
        stem: '现在是下午____。',
        completed_stem: '现在是下午三点。',
        options: ['点', '两点', '三点'],
        answer_idx: 2, // '三点'
        level: 1,
        skill: 'reading' as const,
        part_type: 'read_fill_blank_4opt',
        distractor_rationales: [
          {
            option_idx: 0,
            option_text: '点',
            // Option 0 genuinely discusses Option 1 ('两点') instead of explaining '点'
            rationale_vi: 'Phương án này ghi là 两点, nhưng trong bài là ba giờ.',
          },
          {
            option_idx: 1,
            option_text: '两点',
            rationale_vi: 'Thời gian chính xác là 三点, không phải 两点.',
          },
        ],
      };

      const res = validateCandidate(overlapQ, [], { requireDistractorRationales: true });
      // Must catch that distractor 0 erroneously discussed distractor 1 ('两点')
      expect(
        res.errors.some(
          (e) =>
            e.includes('distractor_rationales[0].rationale_vi mentions a different option text') &&
            e.includes('两点')
        )
      ).toBe(true);
    });

    it('Missing option identification in rationale is caught (HEURISTIC guard)', () => {
      const q = {
        ...baseQuestion,
        distractor_rationales: [
          {
            option_idx: 0,
            option_text: '两点',
            // Does not mention '两点' at all
            rationale_vi: 'Văn bản nêu rõ thời gian là buổi chiều ba giờ.',
          },
          {
            option_idx: 2,
            option_text: '四点',
            rationale_vi: 'Văn bản nêu rõ là 三点, không phải 四点.',
          },
        ],
      };

      const res = validateCandidate(q, [], { requireDistractorRationales: true });
      expect(
        res.errors.some((e) =>
          e.includes('distractor_rationales[0].rationale_vi must identify its indexed option text')
        )
      ).toBe(true);
    });
  });

  // =========================================================================
  // R2: Disambiguating Format Compatibility from Operational Serving
  // =========================================================================
  describe('R2: Disambiguating Format Compatibility, Quality Status, and Serving Eligibility', () => {
    const validStructuralQuestion = {
      stem: '我喝了一杯水。★ 我喝了什么？',
      options: ['水', '茶', '牛奶'],
      answer_idx: 0,
      level: 1,
      skill: 'reading',
      part_type: 'read_comprehension_short_3opt',
    };

    it('Pending + Format-Compatible: format is compatible, but NOT operational serving eligible', () => {
      const q = {
        ...validStructuralQuestion,
        status: 'pending',
        is_active: 1,
      };

      const check = validateFormatCompatibility(q, 1);
      expect(check.practice_format_compatible).toBe(true);
      expect(check.exam_format_compatible).toBe(true);
      expect(check.blueprint_format_compatible).toBe(true);
      // Strictly FALSE for operational serving because status is pending
      expect(check.operational_serving_eligible).toBe(false);
      expect(check.operational_serving_practice_eligible).toBe(false);
      expect(check.operational_serving_exam_eligible).toBe(false);
    });

    it('Pending + Quality-Fail: quality is FAIL, and NOT operational serving eligible', () => {
      const q = {
        ...validStructuralQuestion,
        status: 'pending',
        is_active: 1,
        valid: false,
        sixGates: { allPassed: false },
      };

      const check = validateFormatCompatibility(q, 1);
      expect(check.quality_validation_status).toBe('FAIL');
      expect(check.practice_eligible).toBe(false);
      expect(check.exam_eligible).toBe(false);
      expect(check.operational_serving_eligible).toBe(false);
    });

    it('Approved + Inactive: format is compatible, but NOT operational serving eligible', () => {
      const q = {
        ...validStructuralQuestion,
        status: 'approved',
        is_active: 0, // Disabled
        valid: true,
        sixGates: { allPassed: true },
      };

      const check = validateFormatCompatibility(q, 1);
      expect(check.quality_validation_status).toBe('PASS');
      expect(check.practice_format_compatible).toBe(true);
      // Strictly FALSE because is_active is 0
      expect(check.operational_serving_eligible).toBe(false);
      expect(check.operational_serving_practice_eligible).toBe(false);
      expect(check.operational_serving_exam_eligible).toBe(false);
    });

    it('Approved + Quality-Fail: NOT operational serving eligible despite approved status', () => {
      const q = {
        ...validStructuralQuestion,
        status: 'approved',
        is_active: 1,
        valid: false,
        sixGates: { allPassed: false },
      };

      const check = validateFormatCompatibility(q, 1);
      expect(check.quality_validation_status).toBe('FAIL');
      expect(check.operational_serving_eligible).toBe(false);
      expect(check.operational_serving_practice_eligible).toBe(false);
    });

    it('Approved + Active + Quality PASS: fully eligible for operational serving', () => {
      const q = {
        ...validStructuralQuestion,
        status: 'approved',
        is_active: 1,
        valid: true,
        sixGates: { allPassed: true },
      };

      const check = validateFormatCompatibility(q, 1);
      expect(check.quality_validation_status).toBe('PASS');
      expect(check.practice_format_compatible).toBe(true);
      expect(check.exam_format_compatible).toBe(true);
      expect(check.operational_serving_eligible).toBe(true);
      expect(check.operational_serving_practice_eligible).toBe(true);
      expect(check.operational_serving_exam_eligible).toBe(true);
    });

    it('Part type not in blueprint: reports accurate diagnostic reason without substring confusion', () => {
      const q = {
        stem: '我在学校看书。',
        options: ['学校', '医院', '商店', '机场'],
        answer_idx: 0,
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt', // Not in official HSK 1 mock exam blueprint
        status: 'approved',
        is_active: 1,
        valid: true,
      };

      const check = validateFormatCompatibility(q, 1);
      expect(check.practice_format_compatible).toBe(true);
      expect(check.exam_format_compatible).toBe(false);
      expect(check.operational_serving_practice_eligible).toBe(true);
      expect(check.operational_serving_exam_eligible).toBe(false);
      expect(
        check.ineligible_reasons.some((r) =>
          r.includes('không thuộc bất kỳ phần nào trong blueprint HSK 1')
        )
      ).toBe(true);
    });

    describe('Fail-Closed Matrix Verification', () => {
      it('1. pending + active:1 + quality:PASS -> serving false', () => {
        const q = { ...validStructuralQuestion, status: 'pending', is_active: 1, quality_status: 'PASS' };
        const check = validateFormatCompatibility(q, 1);
        expect(check.operational_serving_eligible).toBe(false);
        expect(check.operational_serving_practice_eligible).toBe(false);
        expect(check.operational_serving_exam_eligible).toBe(false);
      });

      it('2. approved + active:0 + quality:PASS -> serving false', () => {
        const q = { ...validStructuralQuestion, status: 'approved', is_active: 0, quality_status: 'PASS' };
        const check = validateFormatCompatibility(q, 1);
        expect(check.operational_serving_eligible).toBe(false);
        expect(check.operational_serving_practice_eligible).toBe(false);
        expect(check.operational_serving_exam_eligible).toBe(false);
      });

      it('3. approved + active:1 + quality:FAIL -> serving false', () => {
        const q = { ...validStructuralQuestion, status: 'approved', is_active: 1, quality_status: 'FAIL' };
        const check = validateFormatCompatibility(q, 1);
        expect(check.operational_serving_eligible).toBe(false);
        expect(check.operational_serving_practice_eligible).toBe(false);
        expect(check.operational_serving_exam_eligible).toBe(false);
      });

      it('4. approved + active:1 + quality:REVIEW -> serving false', () => {
        const q = { ...validStructuralQuestion, status: 'approved', is_active: 1, quality_status: 'REVIEW' };
        const check = validateFormatCompatibility(q, 1);
        expect(check.operational_serving_eligible).toBe(false);
        expect(check.operational_serving_practice_eligible).toBe(false);
        expect(check.operational_serving_exam_eligible).toBe(false);
      });

      it('5. approved + active:1 + quality:UNKNOWN -> serving false', () => {
        const q = { ...validStructuralQuestion, status: 'approved', is_active: 1, quality_status: 'UNKNOWN' };
        const check = validateFormatCompatibility(q, 1);
        expect(check.operational_serving_eligible).toBe(false);
        expect(check.operational_serving_practice_eligible).toBe(false);
        expect(check.operational_serving_exam_eligible).toBe(false);
      });

      it('6. approved + active:1 + quality:missing/null -> serving false', () => {
        const q = { ...validStructuralQuestion, status: 'approved', is_active: 1 };
        const check = validateFormatCompatibility(q, 1);
        expect(check.quality_validation_status).toBe('UNKNOWN');
        expect(check.operational_serving_eligible).toBe(false);
        expect(check.operational_serving_practice_eligible).toBe(false);
        expect(check.operational_serving_exam_eligible).toBe(false);
      });

      it('7. approved + active:1 + quality:PASS + format compatible -> serving true', () => {
        const q = { ...validStructuralQuestion, status: 'approved', is_active: 1, quality_status: 'PASS' };
        const check = validateFormatCompatibility(q, 1);
        expect(check.operational_serving_practice_eligible).toBe(true);
        expect(check.operational_serving_exam_eligible).toBe(true);
        expect(check.operational_serving_eligible).toBe(true);
      });

      it('8. approved + active:1 + quality:PASS + format incompatible -> serving false', () => {
        // 8a: Completely broken format (stem empty, 0 options)
        const brokenQ = { ...validStructuralQuestion, stem: '', options: [], status: 'approved', is_active: 1, quality_status: 'PASS' };
        const checkBroken = validateFormatCompatibility(brokenQ, 1);
        expect(checkBroken.practice_format_compatible).toBe(false);
        expect(checkBroken.exam_format_compatible).toBe(false);
        expect(checkBroken.operational_serving_practice_eligible).toBe(false);
        expect(checkBroken.operational_serving_exam_eligible).toBe(false);
        expect(checkBroken.operational_serving_eligible).toBe(false);

        // 8b: Format compatible with practice but incompatible with HSK 1 mock exam blueprint
        const nonExamQ = {
          stem: '我在学校看书。',
          options: ['学校', '医院', '商店', '机场'],
          answer_idx: 0,
          level: 1,
          skill: 'reading',
          part_type: 'read_fill_blank_4opt',
          status: 'approved',
          is_active: 1,
          quality_status: 'PASS',
        };
        const checkNonExam = validateFormatCompatibility(nonExamQ, 1);
        expect(checkNonExam.practice_format_compatible).toBe(true);
        expect(checkNonExam.exam_format_compatible).toBe(false);
        expect(checkNonExam.operational_serving_practice_eligible).toBe(true);
        expect(checkNonExam.operational_serving_exam_eligible).toBe(false);
      });
    });
  });

  // =========================================================================
  // R3: Regression Evidence on Pilot 2 Staging Candidates (Read-Only)
  // =========================================================================
  describe('R3: Pilot 2 Real Candidates Regression Verification', () => {
    let db: DatabaseSync;

    beforeAll(() => {
      // Connect read-only to staging DB to verify real candidate records
      db = new DatabaseSync('D:/minnese-staging-20261027/qbank-staging.db', { readOnly: true });
    });

    afterAll(() => {
      db.close();
    });

    it('Candidate #1 (pend_pilot2_1793248985074_c8ba0d): Still rejected due to HSK 4 vocabulary (餐厅)', () => {
      const row: any = db
        .prepare('SELECT * FROM pending_questions WHERE id = ?')
        .get('pend_pilot2_1793248985074_c8ba0d');
      expect(row).toBeDefined();
      expect(row.status).toBe('pending');

      const candidate = {
        ...row,
        options: JSON.parse(row.options),
      };

      const vocabRes = verifyQuestionVocab(candidate, 1);
      expect(vocabRes.isValidForLevel).toBe(false);
      expect(vocabRes.aboveLevel.some((w) => w.word === '餐厅' && w.wordLevel === 4)).toBe(true);

      const gates = evaluateCandidateSixGates(candidate, [], { requireDistractorRationales: false });
      expect(gates.gate3_vocab_coverage.passed).toBe(false);
      expect(gates.allPassed).toBe(false);
    });

    it('Candidate #2 (pend_pilot2_1793248989354_5cd4ac): Still rejected due to HSK 2 vocabulary (笔)', () => {
      const row: any = db
        .prepare('SELECT * FROM pending_questions WHERE id = ?')
        .get('pend_pilot2_1793248989354_5cd4ac');
      expect(row).toBeDefined();
      expect(row.status).toBe('pending');

      const candidate = {
        ...row,
        options: JSON.parse(row.options),
      };

      const vocabRes = verifyQuestionVocab(candidate, 1);
      expect(vocabRes.isValidForLevel).toBe(false);
      expect(vocabRes.aboveLevel.some((w) => w.word === '笔' && w.wordLevel === 2)).toBe(true);

      const gates = evaluateCandidateSixGates(candidate, [], { requireDistractorRationales: false });
      expect(gates.gate3_vocab_coverage.passed).toBe(false);
      expect(gates.allPassed).toBe(false);
    });

    it('Candidate #3 (pend_pilot2_1793248993641_f2956d): Passes quality gates without false rejection', () => {
      const row: any = db
        .prepare('SELECT * FROM pending_questions WHERE id = ?')
        .get('pend_pilot2_1793248993641_f2956d');
      expect(row).toBeDefined();
      expect(row.status).toBe('pending');

      const candidate = {
        ...row,
        options: JSON.parse(row.options),
        distractor_rationales: [
          {
            option_idx: 0,
            option_text: '两点',
            rationale_vi: "Văn bản nêu rõ là '三点' (ba giờ), không phải '两点' (hai giờ).",
          },
          {
            option_idx: 2,
            option_text: '四点',
            rationale_vi: "Văn bản nêu rõ là '三点' (ba giờ), không phải '四点' (bốn giờ).",
          },
        ],
      };

      // Vocab check PASS
      const vocabRes = verifyQuestionVocab(candidate, 1);
      expect(vocabRes.isValidForLevel).toBe(true);

      // Validation PASS (no more distractor_rationales false rejection)
      const val = validateCandidate(candidate, [], { requireDistractorRationales: true });
      expect(val.errors).toEqual([]);

      // Six Gates PASS
      const gates = evaluateCandidateSixGates(candidate, [], { requireDistractorRationales: true });
      expect(gates.gate1_schema.passed).toBe(true);
      expect(gates.gate2_rationales_coherence.passed).toBe(true);
      expect(gates.gate3_vocab_coverage.passed).toBe(true);
      expect(gates.gate4_distractor_quality.passed).toBe(true);
      expect(gates.gate5_uniqueness.passed).toBe(true);
      expect(gates.gate6_blind_solve.passed).toBe(true);
      expect(gates.allPassed).toBe(true);

      // Serving check: NOT serving eligible because status is strictly pending!
      const formatCheck = validateFormatCompatibility(candidate, 1);
      expect(formatCheck.operational_serving_eligible).toBe(false);
    });

    it('Candidate #4 (pend_pilot2_1793249021661_43ef5b): Still rejected due to HSK 2/3 vocabulary (每, 洗澡)', () => {
      const row: any = db
        .prepare('SELECT * FROM pending_questions WHERE id = ?')
        .get('pend_pilot2_1793249021661_43ef5b');
      expect(row).toBeDefined();
      expect(row.status).toBe('pending');

      const candidate = {
        ...row,
        options: JSON.parse(row.options),
      };

      const vocabRes = verifyQuestionVocab(candidate, 1);
      expect(vocabRes.isValidForLevel).toBe(false);
      expect(vocabRes.aboveLevel.some((w) => w.word === '每' || w.word === '洗澡')).toBe(true);

      const gates = evaluateCandidateSixGates(candidate, [], { requireDistractorRationales: false });
      expect(gates.gate3_vocab_coverage.passed).toBe(false);
      expect(gates.allPassed).toBe(false);
    });
  });
});
