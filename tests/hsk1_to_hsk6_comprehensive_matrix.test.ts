import { describe, expect, it } from 'vitest';
import {
  getSyllabusCatalog,
  verifyQuestionVocab,
} from '../src/server/qbankCoverageEngine.js';
import {
  validateCandidate,
  evaluateCandidateSixGates,
} from '../src/server/llm/questionValidator.js';
import {
  validateFormatCompatibility,
} from '../src/server/qbankFormatSync.js';
import {
  buildHskPrompt,
  HSK_LEVEL_SPECS,
} from '../src/server/llm/promptTemplates.js';
import {
  INTERNAL_HSK_GRAMMAR_MAP,
  GRAMMAR_CONFUSING_PAIRS,
  getGrammarPointsForLevel,
  formatGrammarPromptGuidance,
} from '../src/server/llm/grammarMap.js';

describe('HSK 1–6 Comprehensive Quality & Regression Matrix', () => {
  const catalog = getSyllabusCatalog();

  // =========================================================================
  // Section 1: Cumulative Vocabulary Scope Across All 6 Levels
  // =========================================================================
  describe('1. Cumulative Vocabulary Scope Invariant Across HSK 1–6', () => {
    it('HSK 1: Strictly restricted to Level 1; rejects Level 2 (机场) and Level 4 (餐厅)', () => {
      const q = {
        stem: '明天我想去____。',
        options: ['学校', '机场', '餐厅', '家'], // 学校(L1), 机场(L2), 餐厅(L4), 家(L1)
        answer_idx: 0, // 学校
      };
      const res = verifyQuestionVocab(q, 1);
      expect(res.isValidForLevel).toBe(false);
      const aboveWords = res.aboveLevel.map((a) => a.word);
      expect(aboveWords).toContain('机场');
      expect(aboveWords).toContain('餐厅');
    });

    it('HSK 2: Permits Level 1 (学校) and Level 2 (机场); rejects Level 3 (世界) and Level 4 (餐厅)', () => {
      const qPass = {
        stem: '明天我想去____买书。',
        options: ['学校', '机场', '商店', '家'], // All L1 or L2
        answer_idx: 0,
      };
      const resPass = verifyQuestionVocab(qPass, 2);
      expect(resPass.aboveLevel.filter((a) => a.wordLevel > 2)).toHaveLength(0);

      const qFail = {
        stem: '我想去____看朋友。',
        options: ['学校', '世界', '餐厅', '家'], // 世界(L3), 餐厅(L4)
        answer_idx: 0,
      };
      const resFail = verifyQuestionVocab(qFail, 2);
      expect(resFail.isValidForLevel).toBe(false);
      const aboveWords = resFail.aboveLevel.map((a) => a.word);
      expect(aboveWords).toContain('世界');
      expect(aboveWords).toContain('餐厅');
    });

    it('HSK 3: Permits Levels 1–3 (学校, 机场, 世界); rejects Level 4 (餐厅)', () => {
      const q = {
        stem: '这个____很大。',
        options: ['学校', '机场', '世界', '餐厅'],
        answer_idx: 2, // 世界 (L3)
      };
      const res = verifyQuestionVocab(q, 3);
      expect(res.isValidForLevel).toBe(false);
      expect(res.aboveLevel.some((a) => a.word === '餐厅' && a.wordLevel === 4)).toBe(true);
      expect(res.aboveLevel.some((a) => a.word === '世界')).toBe(false); // L3 is permitted in HSK 3!
    });

    it('HSK 4: Permits Levels 1–4 (学校, 机场, 世界, 餐厅); rejects Level 5 (不利)', () => {
      const qPass = {
        stem: '我们在____吃饭。',
        options: ['学校', '机场', '世界', '餐厅'], // L1, L2, L3, L4 - all permitted!
        answer_idx: 3, // 餐厅 (L4)
      };
      const resPass = verifyQuestionVocab(qPass, 4);
      expect(resPass.aboveLevel.filter((a) => a.wordLevel > 4)).toHaveLength(0);
      expect(resPass.isValidForLevel).toBe(true);

      const qFail = {
        stem: '这个情况很____。',
        options: ['严重', '普遍', '不利', '复杂'], // 不利 is L5
        answer_idx: 0,
      };
      const resFail = verifyQuestionVocab(qFail, 4);
      expect(resFail.isValidForLevel).toBe(false);
      expect(resFail.aboveLevel.some((a) => a.word === '不利' && a.wordLevel === 5)).toBe(true);
    });

    it('HSK 5: Permits Levels 1–5; rejects Level 6 (上市)', () => {
      const q = {
        stem: '新产品即将____。',
        options: ['投资', '生产', '上市', '销售'], // 上市 is L6
        answer_idx: 0,
      };
      const res = verifyQuestionVocab(q, 5);
      expect(res.isValidForLevel).toBe(false);
      expect(res.aboveLevel.some((a) => a.word === '上市' && a.wordLevel === 6)).toBe(true);
    });

    it('HSK 6: Permits Levels 1–6; rejects out-of-syllabus characters', () => {
      const qPass = {
        stem: '新产品成功上市。',
        options: ['上市', '决策', '协调', '方案'], // All L6
        answer_idx: 0,
      };
      const resPass = verifyQuestionVocab(qPass, 6);
      expect(resPass.isValidForLevel).toBe(true);
      expect(resPass.outOfSyllabus).toHaveLength(0);

      const qFail = {
        stem: '这家公司生产饕餮大餐。', // 饕 is outside HSK 1-6
        options: ['饕餮', '大餐', '食品', '饮料'],
        answer_idx: 2,
      };
      const resFail = verifyQuestionVocab(qFail, 6);
      expect(resFail.outOfSyllabus.length).toBeGreaterThan(0);
      expect(resFail.outOfSyllabus).toContain('饕');
    });
  });

  // =========================================================================
  // Section 2: Controversial Vocabulary Words Exact Level Resolution
  // =========================================================================
  describe('2. Controversial Vocabulary Words Level Verification in Official Catalog', () => {
    it('Verifies specific controversial words match official CLEC 2025-11 catalog', () => {
      // 1. Level 1 words
      expect(catalog.allWordLevels.get('手机')?.has(1)).toBe(true);
      expect(catalog.allWordLevels.get('面条儿')?.has(1)).toBe(true);

      // 2. Level 2 words
      expect(catalog.allWordLevels.get('每')?.has(2)).toBe(true);
      expect(catalog.allWordLevels.get('肉')?.has(2)).toBe(true);
      expect(catalog.allWordLevels.get('笔')?.has(2)).toBe(true);
      expect(catalog.allWordLevels.get('机场')?.has(2)).toBe(true);
      expect(catalog.allWordLevels.get('咖啡')?.has(2)).toBe(true);
      expect(catalog.allWordLevels.get('游泳')?.has(2)).toBe(true);
      expect(catalog.allWordLevels.get('跑步')?.has(2)).toBe(true);

      // 3. Level 3 word
      expect(catalog.allWordLevels.get('张')?.has(3)).toBe(true);

      // 4. Level 4 words
      expect(catalog.allWordLevels.get('餐厅')?.has(4)).toBe(true);
      expect(catalog.allWordLevels.get('客厅')?.has(4)).toBe(true);
    });
  });

  // =========================================================================
  // Section 3: Grammar Knowledge Map & Confusing Contrasting Pairs
  // =========================================================================
  describe('3. Internal HSK 1–6 Grammar Knowledge Map & Pedagogical Pairs', () => {
    it('Guarantees all 6 levels have verified pedagogical grammar points', () => {
      for (let lvl = 1; lvl <= 6; lvl++) {
        const points = getGrammarPointsForLevel(lvl);
        expect(points.length).toBeGreaterThan(0);
        for (const pt of points) {
          expect(pt.id).toMatch(/^GP_L\d_/);
          expect(pt.name).toBeTruthy();
          expect(pt.pattern).toBeTruthy();
          expect(pt.positiveExample).toBeTruthy();
          expect(pt.negativeExample).toBeTruthy();
          expect(pt.status).toBe('VERIFIED');
        }
      }
    });

    it('Includes fundamental contrasting pairs (不 vs 没, 二 vs 两, 把 vs 被, 常常 vs 往往)', () => {
      const pairIds = GRAMMAR_CONFUSING_PAIRS.map((p) => p.id);
      expect(pairIds).toContain('PAIR_BU_MEI');
      expect(pairIds).toContain('PAIR_ER_LIANG');
      expect(pairIds).toContain('PAIR_BA_BEI');
      expect(pairIds).toContain('PAIR_CHANGCHANG_WANGWANG');
      expect(pairIds).toContain('PAIR_SHIHE_HESHI');

      const buMei = GRAMMAR_CONFUSING_PAIRS.find((p) => p.id === 'PAIR_BU_MEI')!;
      expect(buMei.discriminatingRule).toContain('thói quen');
    });

    it('formatGrammarPromptGuidance generates valid pedagogical prompt context', () => {
      const guidanceL1 = formatGrammarPromptGuidance(1);
      expect(guidanceL1).toContain('HSK 1 PEDAGOGICAL GRAMMAR SPECIFICATION');
      expect(guidanceL1).toContain('GP_L1_WORD_ORDER_SVO_TIME');
      expect(guidanceL1).toContain('不 (bù) vs 没 (méi)');

      const guidanceL4 = formatGrammarPromptGuidance(4);
      expect(guidanceL4).toContain('HSK 4 PEDAGOGICAL GRAMMAR SPECIFICATION');
      expect(guidanceL4).toContain('GP_L4_BEI_SENTENCE_PASSIVE');
    });
  });

  // =========================================================================
  // Section 4: Cognitive Application, Distractor Quality & Anti-Leakage
  // =========================================================================
  describe('4. Cognitive Application, Distractor Quality & Anti-Leakage Rules', () => {
    it('Validator flags POS mismatch warnings when options mix verbs and nouns', () => {
      const qMismatchedPOS = {
        stem: '我想去学校____。',
        options: ['看书', '医生', '跑', '走'], // 医生 is a noun, others are verbs/activities
        answer_idx: 0,
        level: 1,
        skill: 'reading' as const,
        part_type: 'read_fill_blank_4opt',
        explanation_vi: 'Dịch: Tôi muốn đến trường đọc sách.',
        distractor_rationales: [
          { option_idx: 1, option_text: '医生', rationale_vi: 'Từ loại danh từ không phù hợp.' },
          { option_idx: 2, option_text: '跑', rationale_vi: 'Không phải hoạt động tại trường.' },
          { option_idx: 3, option_text: '走', rationale_vi: 'Không tạo thành collocation tự nhiên.' },
        ],
      };

      const valResult = validateCandidate(qMismatchedPOS);
      // POS warning should be populated in warnings
      expect(valResult.warnings.some((w) => /POS mismatch/i.test(w))).toBe(true);
    });

    it('Six Quality Gates: Gate 3 and Gate 4 enforce strict vocabulary and distractor quality', () => {
      const candidatePass = {
        stem: '桌子上有一____书。',
        completed_stem: '桌子上有一本书。',
        canonical_completed_stem: '桌子上有一本书。',
        options: ['本', '个', '块', '杯'],
        answer_idx: 0,
        level: 1,
        skill: 'reading' as const,
        part_type: 'read_fill_blank_4opt',
        explanation_vi: 'Dịch: Trên bàn có một cuốn sách.',
        distractor_rationales: [
          { option_idx: 1, option_text: '个', rationale_vi: 'Lượng từ 个 không đi kèm với 书.' },
          { option_idx: 2, option_text: '块', rationale_vi: 'Lượng từ 块 dùng cho đồ vật hình khối hoặc tiền.' },
          { option_idx: 3, option_text: '杯', rationale_vi: 'Lượng từ 杯 dùng cho đồ uống.' },
        ],
      };

      const gateRes = evaluateCandidateSixGates(candidatePass);
      expect(gateRes.gate3_vocab_coverage.passed).toBe(true);
      expect(gateRes.gate4_distractor_quality.passed).toBe(true);
      expect(gateRes.allPassed).toBe(true);
    });
  });

  // =========================================================================
  // Section 5: Serving Eligibility & Fail-Closed Guard
  // =========================================================================
  describe('5. Operational Serving Eligibility & Fail-Closed Guards', () => {
    it('Blocks non-approved, inactive, or non-PASS candidates from serving pools', () => {
      // 1. Pending candidate -> BLOCKED
      const pendingQ = {
        status: 'pending',
        is_active: 1,
        quality_validation_status: 'PASS',
        part_type: 'read_fill_blank_4opt',
      };
      const resPending = validateFormatCompatibility(pendingQ);
      expect(resPending.operational_serving_eligible).toBe(false);

      // 2. Inactive approved candidate -> BLOCKED
      const inactiveQ = {
        status: 'approved',
        is_active: 0,
        quality_validation_status: 'PASS',
        part_type: 'read_fill_blank_4opt',
      };
      const resInactive = validateFormatCompatibility(inactiveQ);
      expect(resInactive.operational_serving_eligible).toBe(false);

      // 3. Approved candidate with quality FAIL -> BLOCKED
      const failQ = {
        status: 'approved',
        is_active: 1,
        quality_validation_status: 'FAIL',
        part_type: 'read_fill_blank_4opt',
      };
      const resFail = validateFormatCompatibility(failQ);
      expect(resFail.operational_serving_eligible).toBe(false);

      // 4. Approved candidate with quality UNKNOWN -> BLOCKED
      const unknownQ = {
        status: 'approved',
        is_active: 1,
        quality_validation_status: 'UNKNOWN',
        part_type: 'read_fill_blank_4opt',
      };
      const resUnknown = validateFormatCompatibility(unknownQ);
      expect(resUnknown.operational_serving_eligible).toBe(false);

      // 5. Approved, active, format-compatible, and quality PASS -> AUTHORIZED
      const authorizedQ = {
        stem: '中午我想去饭店吃____。',
        options: ['米饭', '水', '茶', '苹果'],
        answer_idx: 0,
        level: 1,
        status: 'approved',
        is_active: 1,
        quality_validation_status: 'PASS',
        part_type: 'read_fill_blank_4opt',
      };
      const resAuth = validateFormatCompatibility(authorizedQ);
      expect(resAuth.operational_serving_eligible).toBe(true);
      expect(resAuth.operational_serving_practice_eligible).toBe(true);
    });
  });

  // =========================================================================
  // Section 6: Prompt Specifications Across HSK 1–6
  // =========================================================================
  describe('6. Prompt Specifications Integrity Across HSK 1–6', () => {
    it('All 6 HSK levels in HSK_LEVEL_SPECS reflect exact CLEC HSK 3.0 targets and verified words', () => {
      for (let lvl = 1; lvl <= 6; lvl++) {
        const spec = HSK_LEVEL_SPECS[lvl];
        expect(spec).toBeDefined();
        expect(spec.level).toBe(lvl);
        expect(spec.wordCountTarget).toContain('CLEC HSK 3.0');

        // All example words must be strictly within syllabus for that level
        for (const w of spec.exampleWords) {
          const lvls = catalog.allWordLevels.get(w);
          expect(lvls).toBeDefined();
          expect(lvls!.has(lvl)).toBe(true);
        }

        // buildHskPrompt executes offline and includes grammar guidance
        const prompt = buildHskPrompt(lvl, 'reading', 1, [], 'read_fill_blank_4opt');
        expect(prompt).toContain(`HSK LEVEL ${lvl} SPECIFICATIONS`);
        expect(prompt).toContain('CUMULATIVE VOCABULARY SCOPE POLICY');
        expect(prompt).toContain(`HSK ${lvl} PEDAGOGICAL GRAMMAR SPECIFICATION`);
      }
    });
  });
});
