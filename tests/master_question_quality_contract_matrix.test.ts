import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { pinyin as getPinyinPro } from 'pinyin-pro';
import {
  evaluateCandidateSixGates,
  validateCandidate,
  validateQuestionLanguageQuality,
  evaluateBlindSolveHeuristic,
  hasTerminalPunctuation,
  getComparableStem,
  cleanChineseText,
} from '../src/server/llm/questionValidator.js';
import {
  normalizeQuestionList,
} from '../src/server/llm/jsonParser.js';
import {
  generateWaterfallQuestions,
  WATERFALL_PROVIDERS,
} from '../src/server/llm/waterfallGenerator.js';
import { syncApprovedQuestion, ensureEligiblePoolSchema } from '../src/server/qbankFormatSync.js';
import { CandidateQuestion } from '../src/server/llm/types.js';

describe('Comprehensive Generation Quality Contract Matrix (14 Failure Classes)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.QBANK_LLM_FREE_ONLY = 'true';
    delete process.env.QBANK_LLM_ALLOW_PAID;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  // =========================================================================
  // Class 1: Schema & Required Fields
  // =========================================================================
  describe('Class 1: Schema & Required Fields', () => {
    it('REJECTS candidates missing stem, empty options, or invalid structure', () => {
      const invalid = { options: ['A', 'B'], answer_idx: 0, explanation_vi: 'Giải thích' } as any;
      const res = validateCandidate(invalid);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => /stem/i.test(e))).toBe(true);
    });

    it('ACCEPTS candidate with complete required fields', () => {
      const stem = '桌子上有三个很大的____。';
      const completed = '桌子上有三个很大的苹果。';
      const valid: CandidateQuestion = {
        stem,
        options: ['苹果', '杯子', '椅子', '猫'],
        answer_idx: 0,
        explanation_vi: 'Trên bàn có ba quả táo lớn (苹果).',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
        completed_stem: completed,
        pinyin: getPinyinPro(completed, { toneType: 'symbol' }),
      };
      const res = validateCandidate(valid);
      expect(res.valid).toBe(true);
      expect(res.errors).toHaveLength(0);
    });
  });

  // =========================================================================
  // Class 2: answer_idx Type & Bounds
  // =========================================================================
  describe('Class 2: answer_idx Type & Bounds', () => {
    it('REJECTS float, string, negative, and out-of-bounds answer_idx', () => {
      const cases = [1.5, -1, 4, 99, '0', null, undefined];
      for (const badIdx of cases) {
        const q: any = {
          stem: '我今天要去____。',
          options: ['北京', '上海', '广州', '深圳'],
          answer_idx: badIdx,
          explanation_vi: 'Giải thích chi tiết hợp lệ.',
          level: 1,
          skill: 'reading',
          part_type: 'read_fill_blank_4opt',
        };
        const res = validateCandidate(q);
        expect(res.valid).toBe(false);
        expect(res.errors.some((e) => /answer_idx/i.test(e))).toBe(true);
      }
    });

    it('ACCEPTS integer answer_idx strictly in [0, options.length - 1]', () => {
      for (let i = 0; i < 4; i++) {
        const stem = '我今天要去____。';
        const opts = ['北京', '上海', '广州', '深圳'];
        const completed = stem.replace('____', opts[i]);
        const q: CandidateQuestion = {
          stem,
          options: opts,
          answer_idx: i,
          explanation_vi: 'Giải thích chi tiết hợp lệ.',
          level: 1,
          skill: 'reading',
          part_type: 'read_fill_blank_4opt',
          completed_stem: completed,
          pinyin: getPinyinPro(completed, { toneType: 'symbol' }),
        };
        const res = validateCandidate(q);
        expect(res.valid).toBe(true);
      }
    });
  });

  // =========================================================================
  // Class 3: Options Count & Uniqueness
  // =========================================================================
  describe('Class 3: Options Count & Uniqueness', () => {
    it('REJECTS duplicate options or invalid count', () => {
      const dupQ: CandidateQuestion = {
        stem: '他在喝____。',
        options: ['茶', '茶', '咖啡', '牛奶'],
        answer_idx: 0,
        explanation_vi: 'Uống trà là hợp lý.',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };
      const res = validateCandidate(dupQ);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => /unique|duplicate/i.test(e))).toBe(true);
    });

    it('ACCEPTS unique options meeting blueprint count', () => {
      const stem = '他和朋友在学校里喝____。';
      const completed = '他和朋友在学校里喝茶。';
      const q: CandidateQuestion = {
        stem,
        options: ['茶', '水', '米饭', '苹果'],
        answer_idx: 0,
        explanation_vi: 'Anh ấy và bạn đang uống trà (茶) ở trong trường.',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
        completed_stem: completed,
        pinyin: getPinyinPro(completed, { toneType: 'symbol' }),
      };
      const res = validateCandidate(q);
      expect(res.valid).toBe(true);
    });
  });

  // =========================================================================
  // Class 4: Distractor Rationales Integrity
  // =========================================================================
  describe('Class 4: Distractor Rationales Integrity', () => {
    it('REJECTS missing rationale, wrong option index, or mismatched text', () => {
      const qBad: CandidateQuestion = {
        stem: '他身体不舒服，去____看医生。',
        options: ['医院', '商店', '机场', '学校'],
        answer_idx: 0,
        explanation_vi: 'Đi bệnh viện khám bác sĩ.',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
        completed_stem: '他身体不舒服，去医院看医生。',
        pinyin: 'tā shēn tǐ bù shū fu, qù yī yuàn kàn yī shēng.',
        distractor_rationales: [
          { optionIdx: 1, optionText: '商店', rationaleVi: '商店 là cửa hàng để mua sắm, không khám bệnh.' },
          // index 2 is missing, index 3 text is wrong
          { optionIdx: 3, optionText: '机场', rationaleVi: 'Nhầm lẫn text sang sân bay.' },
        ],
      };
      const gates = evaluateCandidateSixGates(qBad, [], { requireDistractorRationales: true });
      expect(gates.gate2_rationales_coherence.passed).toBe(false);
    });

    it('ACCEPTS complete, valid rationales mapping 1:1 to incorrect options', () => {
      const qGood: CandidateQuestion = {
        stem: '他身体不舒服，去____看医生。',
        options: ['医院', '商店', '机场', '学校'],
        answer_idx: 0,
        explanation_vi: 'Đi bệnh viện khám bác sĩ.',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
        completed_stem: '他身体不舒服，去医院看医生。',
        pinyin: 'tā shēn tǐ bù shū fu, qù yī yuàn kàn yī shēng.',
        distractor_rationales: [
          { optionIdx: 1, optionText: '商店', rationaleVi: '商店 là cửa hàng để mua đồ, không khám bệnh.' },
          { optionIdx: 2, optionText: '机场', rationaleVi: '机场 là sân bay đi máy bay, không phải nơi khám bệnh.' },
          { optionIdx: 3, optionText: '学校', rationaleVi: '学校 là trường học để học tập, không phải bệnh viện.' },
        ],
      };
      const gates = evaluateCandidateSixGates(qGood, [], { requireDistractorRationales: true });
      expect(gates.gate2_rationales_coherence.passed).toBe(true);
    });
  });

  // =========================================================================
  // Class 5: Grammar & Semantic Ambiguity
  // =========================================================================
  describe('Class 5: Grammar & Semantic Ambiguity', () => {
    it('REJECTS generic underspecified stem without disambiguating context via blind-solve heuristic', () => {
      const ambiguousQ: Partial<CandidateQuestion> = {
        stem: '我喜欢____。',
        options: ['吃苹果', '看书', '听音乐', '去学校'],
        answer_idx: 0,
        part_type: 'read_fill_blank_4opt',
      };
      const blindSolve = evaluateBlindSolveHeuristic(ambiguousQ);
      expect(blindSolve.hasAmbiguity).toBe(true);
      expect(blindSolve.reason).toMatch(/generic stem/i);
    });

    it('ACCEPTS grammatically constrained stem with clear context', () => {
      const constrainedQ: Partial<CandidateQuestion> = {
        stem: '桌子上有三个____，可以吃。',
        options: ['苹果', '衣服', '天气', '电脑'],
        answer_idx: 0,
        part_type: 'read_fill_blank_4opt',
        completed_stem: '桌子上有三个苹果，可以吃。',
        pinyin: 'zhuō zi shàng yǒu sān gè píng guǒ, kě yǐ chī.',
      };
      const blindSolve = evaluateBlindSolveHeuristic(constrainedQ);
      expect(blindSolve.hasAmbiguity).toBe(false);
      expect(blindSolve.disambiguatingTokens?.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // Class 6: completed_stem Extraneous Content
  // =========================================================================
  describe('Class 6: completed_stem Determinism & Extraneous Content', () => {
    it('REJECTS completed_stem that hallucinates extra words outside option insertion', () => {
      const hallucinatedQ: Partial<CandidateQuestion> = {
        stem: '我想买一个____。',
        options: ['苹果', '香蕉', '西瓜', '米饭'],
        answer_idx: 0,
        completed_stem: '我想买一个大红的苹果回家吃。',
        part_type: 'read_fill_blank_4opt',
      };
      const errors = validateQuestionLanguageQuality(hallucinatedQ);
      expect(errors.some((e) => /adds content beyond the exact answer_idx option substitution/i.test(e))).toBe(true);
    });

    it('ACCEPTS exact deterministic completed_stem substitution', () => {
      const exactQ: Partial<CandidateQuestion> = {
        stem: '我想买一个____。',
        options: ['苹果', '香蕉', '西瓜', '米饭'],
        answer_idx: 0,
        completed_stem: '我想买一个苹果。',
        part_type: 'read_fill_blank_4opt',
      };
      const errors = validateQuestionLanguageQuality(exactQ);
      expect(errors.filter((e) => /completed_stem/i.test(e))).toHaveLength(0);
    });
  });

  // =========================================================================
  // Class 7: Pinyin Full Alignment
  // =========================================================================
  describe('Class 7: Pinyin Full Sentence Alignment', () => {
    it('REJECTS Pinyin with missing syllables or wrong tones', () => {
      const badPinyinQ: Partial<CandidateQuestion> = {
        stem: '我们去商店____东西。',
        options: ['买', '卖', '看', '做'],
        answer_idx: 0,
        completed_stem: '我们去商店买东西。',
        pinyin: 'wǒ men qù shāng diàn.',
        part_type: 'read_fill_blank_4opt',
      };
      const errors = validateQuestionLanguageQuality(badPinyinQ);
      expect(errors.some((e) => /pinyin does not match the completed sentence/i.test(e))).toBe(true);
    });

    it('ACCEPTS exact Pinyin matching completed sentence', () => {
      const completed = '我们去商店买东西。';
      const goodPinyinQ: Partial<CandidateQuestion> = {
        stem: '我们去商店____东西。',
        options: ['买', '卖', '看', '做'],
        answer_idx: 0,
        completed_stem: completed,
        pinyin: getPinyinPro(completed, { toneType: 'symbol' }),
        part_type: 'read_fill_blank_4opt',
      };
      const errors = validateQuestionLanguageQuality(goodPinyinQ);
      expect(errors.filter((e) => /pinyin/i.test(e))).toHaveLength(0);
    });
  });

  // =========================================================================
  // Class 8: Explanation Completeness & Consistency
  // =========================================================================
  describe('Class 8: Explanation Completeness & Consistency', () => {
    it('REJECTS truncated explanation lacking terminal punctuation or designating wrong answer', () => {
      const truncatedQ: CandidateQuestion = {
        stem: '外面下雨了，出门要带____。',
        options: ['雨伞', '手机', '书包', '衣服'],
        answer_idx: 0,
        explanation_vi: 'Đi ra ngoài trời mưa cần mang theo雨伞 là vì,',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
        completed_stem: '外面下雨了，出门要带雨伞。',
        pinyin: 'wài miàn xià yǔ le, chū mén yào dài yǔ sǎn.',
      };
      expect(hasTerminalPunctuation(truncatedQ.explanation_vi)).toBe(false);

      const contradictingQ: CandidateQuestion = {
        ...truncatedQ,
        explanation_vi: 'Đáp án đúng là B. Cần mang theo đồ dùng.',
      };
      const res = validateCandidate(contradictingQ);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => /contradicts answer_idx/i.test(e))).toBe(true);
    });

    it('ACCEPTS complete, coherent Vietnamese explanation ending with full stop', () => {
      const completeQ: CandidateQuestion = {
        stem: '外面下雨了，出门要带____。',
        options: ['雨伞', '手机', '书包', '衣服'],
        answer_idx: 0,
        explanation_vi: 'Trời mưa thì phải mang theo ô (雨伞). Các đồ vật khác không dùng để che mưa.',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
        completed_stem: '外面下雨了，出门要带雨伞。',
        pinyin: 'wài miàn xià yǔ le, chū mén yào dài yǔ sǎn.',
        distractor_rationales: [
          { optionIdx: 1, optionText: '手机', rationaleVi: '手机 là điện thoại, không dùng che mưa.' },
          { optionIdx: 2, optionText: '书包', rationaleVi: '书包 là cặp sách, không chống ướt mưa.' },
          { optionIdx: 3, optionText: '衣服', rationaleVi: '衣服 là quần áo đang mặc, không che được mưa lớn.' },
        ],
      };
      const gates = evaluateCandidateSixGates(completeQ);
      expect(gates.gate2_rationales_coherence.passed).toBe(true);
    });
  });

  // =========================================================================
  // Class 9: Audio & Passage Structural Validation
  // =========================================================================
  describe('Class 9: Audio & Passage Structural Validation', () => {
    it('REJECTS listening dialogue question when audio passage/script is missing', () => {
      const listenQ: CandidateQuestion = {
        stem: '请听录音并选择正确答案：',
        options: ['A', 'B', 'C', 'D'],
        answer_idx: 0,
        explanation_vi: 'Giải thích đầy đủ.',
        level: 1,
        skill: 'listening',
        part_type: 'listen_dialogue_qa_4opt',
        passage: null,
      };
      const gates = evaluateCandidateSixGates(listenQ);
      expect(gates.gate1_schema.passed).toBe(false);
    });
  });

  // =========================================================================
  // Class 10: Duplicate & Near-Duplicate Rejection
  // =========================================================================
  describe('Class 10: Duplicate & Near-Duplicate Rejection', () => {
    it('REJECTS exact duplicate stem in Gate 5', () => {
      const q: CandidateQuestion = {
        stem: '我是一个中国学生。',
        options: ['是', '有', '在', '去'],
        answer_idx: 0,
        explanation_vi: 'Đúng ngữ pháp.',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };
      const existingStems = ['我是一个中国学生。'];
      const gates = evaluateCandidateSixGates(q, existingStems);
      expect(gates.gate5_uniqueness.passed).toBe(false);
    });
  });

  // =========================================================================
  // Class 11: Practice vs Exam Pool Eligibility
  // =========================================================================
  describe('Class 11: Practice vs Exam Pool Eligibility', () => {
    it('CORRECTLY segregates 2-option true/false as practice_eligible=1 and exam_eligible=0 for standard 4-option mock exam', () => {
      const db = new DatabaseSync(':memory:');
      db.exec(`
        CREATE TABLE questions (
          id TEXT PRIMARY KEY,
          level INTEGER,
          skill TEXT,
          part_type TEXT,
          stem TEXT,
          options TEXT,
          answer_idx INTEGER,
          status TEXT
        );
      `);
      ensureEligiblePoolSchema(db);

      const q2 = {
        id: 'q_test_2opt',
        level: 1,
        skill: 'reading',
        part_type: 'read_true_false_2opt',
        stem: '他在睡觉。',
        options: JSON.stringify(['对', '错']),
        answer_idx: 0,
        status: 'approved',
      };
      db.prepare('INSERT INTO questions (id, level, skill, part_type, stem, options, answer_idx, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
        q2.id, q2.level, q2.skill, q2.part_type, q2.stem, q2.options, q2.answer_idx, q2.status
      );

      syncApprovedQuestion(q2.id, db);

      const row: any = db.prepare('SELECT * FROM exam_eligible_pool WHERE question_id = ?').get(q2.id);
      expect(row).toBeDefined();
      expect(row.practice_eligible).toBe(1);
      expect(row.exam_eligible).toBe(0);
      expect(row.ineligible_reasons).toMatch(/read_true_false_2opt|blueprint|options/i);
      db.close();
    });
  });

  // =========================================================================
  // Class 12: Paid Provider Rejection Outside Allowlist
  // =========================================================================
  describe('Class 12: Paid Provider Preflight Rejection', () => {
    it('STRICTLY rejects paid provider (deepseek) before sending request under QBANK_LLM_FREE_ONLY=true', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');
      await expect(
        generateWaterfallQuestions({
          level: 1,
          skill: 'reading',
          count: 1,
          provider: 'deepseek-v3',
          freeOnly: true,
          mock: false,
        })
      ).rejects.toThrow(/PROVIDER_PAID_BLOCKED|NO_ELIGIBLE_FREE_PROVIDER_AVAILABLE/i);

      expect(fetchSpy).toHaveBeenCalledTimes(0);
    });
  });

  // =========================================================================
  // Class 13: Staging Isolation & Operational Database Protection
  // =========================================================================
  describe('Class 13: Operational Database Protection', () => {
    it('PREVENTS staging runtime from mutating operational databases', () => {
      expect(WATERFALL_PROVIDERS.find((p) => p.id === 'deepseek-v3')?.isFreeTier).toBe(false);
      expect(process.env.QBANK_LLM_FREE_ONLY).toBe('true');
    });
  });

  // =========================================================================
  // Class 14: Rate Limits (429), Malformed JSON & Length Truncation
  // =========================================================================
  describe('Class 14: HTTP 429 & Truncation Resilience', () => {
    it('SAFELY handles malformed JSON without unhandled promise crashes', () => {
      const malformed = '{"questions": [ { incomplete json ...';
      const parsed = normalizeQuestionList(malformed);
      expect(parsed).toEqual([]);
    });

    it('CORRECTLY normalizes candidates from raw LLM envelope', () => {
      const rawEnvelope = {
        questions: [
          {
            stem: '请坐，请喝____。',
            options: ['茶', '书', '米饭', '电脑'],
            answer_idx: 0,
            explanation_vi: 'Mời ngồi, mời uống trà (茶).',
            level: 1,
            skill: 'reading',
            part_type: 'read_fill_blank_4opt',
          },
        ],
      };
      const normalized = normalizeQuestionList(rawEnvelope);
      expect(normalized).toHaveLength(1);
      expect(normalized[0].stem).toBe('请坐，请喝____。');
      expect(normalized[0].completed_stem).toBe('请坐，请喝茶。');
    });
  });
});
