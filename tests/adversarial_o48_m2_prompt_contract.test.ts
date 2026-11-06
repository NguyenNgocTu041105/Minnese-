/**
 * Adversarial Empirical Stress Test Suite: Prompt Templates & Part Type Contracts
 * 
 * Challenger: challenger_o48_m2_2
 * Scope: Milestone 2 — IELTS Traps & Part Type Contracts
 * 
 * Verifies:
 * 1. buildHskPrompt across all part types (listen_dialogue_qa_4opt, read_comprehension_4opt, read_fill_blank_4opt) and levels (HSK 1 to 6).
 * 2. listen_dialogue_qa_4opt output includes structured dialogue few-shot sample (speaker turns, twist) instead of fill-in-the-blank across all levels.
 * 3. read_comprehension_4opt output includes reading comprehension few-shot sample across all levels.
 * 4. read_fill_blank_4opt retains fill-in-the-blank placeholder structure across all levels.
 * 5. PART_TYPE_REGISTRY contains complete and accurate entries for new part types:
 *    - listen_talks_qa_4opt
 *    - read_find_faulty_sentence_4opt
 *    - read_cloze_passages_4opt
 *    as well as core types listen_dialogue_qa_4opt, read_comprehension_4opt, read_fill_blank_4opt.
 * 6. Helper contract predicates (isFillBlankPartType, isReadingComprehensionPartType, getPartTypeContract) adhere to contract invariants.
 * 7. Embedded JSON schema sample in buildHskPrompt is strictly valid JSON (parseable by JSON.parse) across all 18 level/part_type combinations.
 * 8. All 4 new IELTS trap types (anti_verbatim, self_correction, rhetorical_attitude, numerical_twist) render distinct, non-empty guidance in prompts.
 * 9. Pipeline normalization via normalizeQuestionList and validation via validateCandidate.
 * 10. Robustness against boundary levels (level <= 0, level >= 7).
 */

import { describe, it, expect } from 'vitest';
import { buildHskPrompt } from '../src/server/llm/promptTemplates.js';
import {
  getPartTypeContract,
  isFillBlankPartType,
  isReadingComprehensionPartType,
} from '../src/server/llm/partTypeContract.js';
import { normalizeQuestionList } from '../src/server/llm/jsonParser.js';
import { validateCandidate } from '../src/server/llm/questionValidator.js';
import { TrapType } from '../src/server/llm/types.js';

/**
 * Helper to extract the JSON schema sample object from buildHskPrompt output.
 */
function extractSampleJsonFromPrompt(prompt: string): any {
  const schemaMarker = 'SCHEMA (containing ';
  const markerIdx = prompt.indexOf(schemaMarker);
  if (markerIdx === -1) {
    throw new Error('SCHEMA marker not found in prompt');
  }
  const jsonStart = prompt.indexOf('{', markerIdx);
  if (jsonStart === -1) {
    throw new Error('JSON open brace not found after SCHEMA marker');
  }
  const jsonStr = prompt.slice(jsonStart).trim();
  return JSON.parse(jsonStr);
}

describe('Empirical Adversarial Testing: buildHskPrompt & Part Type Contracts', () => {
  const levels = [1, 2, 3, 4, 5, 6];
  const targetPartTypes = [
    'listen_dialogue_qa_4opt',
    'read_comprehension_4opt',
    'read_fill_blank_4opt',
  ];

  describe('1. Matrix Execution: buildHskPrompt across all levels 1..6 and core part types', () => {
    for (const level of levels) {
      for (const partType of targetPartTypes) {
        it(`builds prompt cleanly for level=${level}, partType=${partType}`, () => {
          const prompt = buildHskPrompt(
            level,
            partType.startsWith('listen_') ? 'listening' : 'reading',
            5,
            [],
            partType
          );

          expect(typeof prompt).toBe('string');
          expect(prompt.length).toBeGreaterThan(1000);
          expect(prompt).toContain(`HSK Level ${level}`);
          expect(prompt).toContain(`EXACTLY 4 DISTINCT OPTIONS`);

          // Verify that embedded JSON schema can be parsed without error
          const parsed = extractSampleJsonFromPrompt(prompt);
          expect(parsed).toBeDefined();
          expect(parsed.questions).toBeDefined();
          expect(parsed.questions.length).toBe(1);
          const sample = parsed.questions[0];
          expect(sample.level).toBe(level);
          expect(sample.part_type).toBe(partType);
          expect(Array.isArray(sample.options)).toBe(true);
          expect(sample.options.length).toBe(4);
          expect(sample.answer_idx).toBe(0);
        });
      }
    }
  });

  describe('2. Dialogue Few-Shot Sample Invariant for listen_dialogue_qa_4opt', () => {
    for (const level of levels) {
      it(`verifies level=${level} listen_dialogue_qa_4opt includes structured dialogue turns and NO fill-in-the-blank placeholder`, () => {
        const prompt = buildHskPrompt(level, 'listening', 5, [], 'listen_dialogue_qa_4opt');

        // 1. Must NOT contain fill-in-the-blank placeholder in sample stem
        const parsed = extractSampleJsonFromPrompt(prompt);
        const sample = parsed.questions[0];

        expect(sample.stem).not.toContain('____');
        expect(sample.completed_stem).not.toContain('____');

        // 2. Must contain dialogue turns and question marker
        expect(sample.stem).toMatch(/男[：:]/);
        expect(sample.stem).toMatch(/女[：:]/);
        expect(sample.stem).toMatch(/问[：:]/);

        // 3. Must reflect authentic dialogue content per level
        if (level >= 5) {
          expect(sample.stem).toContain('王经理，关于新产品的推广预算');
          expect(sample.options).toEqual([
            '集中做线上精准营销',
            '按原计划削减两成预算',
            '盲目追加线下广告投入',
            '全面铺开新产品宣传',
          ]);
          expect(sample.trap_type).toBe('anti_verbatim');
        } else if (level === 4) {
          expect(sample.stem).toContain('你不是说今天下午去面试吗');
          expect(sample.options).toEqual([
            '面试时间被推迟了',
            '今天下午面试通过了',
            '负责面试的主管生病了',
            '决定放弃这次面试机会',
          ]);
          expect(sample.trap_type).toBe('self_correction');
        } else if (level === 3) {
          expect(sample.stem).toContain('今天天气这么好，我们一起骑自行车去公园吧');
          expect(sample.options).toEqual([
            '完成老师留的作业',
            '去公园骑车',
            '在家里睡觉',
            '去医院看医生',
          ]);
          expect(sample.trap_type).toBe('self_correction');
        } else {
          expect(sample.stem).toContain('原定明天上午九点半');
          expect(sample.stem).toContain('会议改到明天下午两点一刻');
          expect(sample.stem).toContain('问：会议改在什么时候举行？');
          expect(sample.options).toEqual([
            '明天下午两点一刻',
            '明天上午九点半',
            '明天下午三点',
            '今天下午两点',
          ]);
          expect(sample.trap_type).toBe('self_correction');
        }
        expect(sample.answer_idx).toBe(0);

        // 5. Must NOT have leaked the HSK 1/2 fill-in-blank samples
        expect(sample.stem).not.toContain('我想去商店买两本');
        expect(sample.stem).not.toContain('门外太冷了');
        expect(sample.stem).not.toContain('遇到困难时');

        // 6. For level >= 3, prompt text must include Authentic Listening Distractor Mandate
        if (level >= 3) {
          expect(prompt).toContain('Authentic Listening Distractor Mandate');
        }
      });
    }
  });

  describe('3. Reading Comprehension Few-Shot Sample Invariant for read_comprehension_4opt', () => {
    for (const level of levels) {
      it(`verifies level=${level} read_comprehension_4opt includes reading passage and NO fill-in-the-blank placeholder`, () => {
        const prompt = buildHskPrompt(level, 'reading', 5, [], 'read_comprehension_4opt');
        const parsed = extractSampleJsonFromPrompt(prompt);
        const sample = parsed.questions[0];

        // 1. Must NOT contain fill-in-the-blank placeholder
        expect(sample.stem).not.toContain('____');
        expect(sample.completed_stem).not.toContain('____');

        // 2. Must contain passage with question star ★ and authentic options per level
        if (level >= 5) {
          expect(sample.stem).toContain('心理学研究表明');
          expect(sample.stem).toContain('★ 根据这段话，下列哪项正确？');
          expect(sample.options).toEqual(['选项过多容易增加决策难度', '商品种类越多顾客越满意', '面临选择时人们绝不会放弃', '权衡成本高能促进消费欲望']);
          expect(sample.trap_type).toBe('anti_verbatim');
        } else if (level === 4) {
          expect(sample.stem).toContain('很多人以为只有遇到大挫折才会感到压力');
          expect(sample.stem).toContain('★ 根据这段话，下列哪项正确？');
          expect(sample.options).toEqual(['日常小麻烦也会带来严重影响', '只有大挫折才会带来心理压力', '生活中的小麻烦完全没有影响', '遇到困难时绝不需要主动调整']);
          expect(sample.trap_type).toBe('context_scope');
        } else if (level === 3) {
          expect(sample.stem).toContain('王经理工作十分认真');
          expect(sample.stem).toContain('★ 关于王经理，可以知道什么？');
          expect(sample.options).toEqual(['为了健康需要经常锻炼', '工作繁忙完全没有时间', '每天跑步容易感到疲劳', '从来不去户外运动']);
          expect(sample.trap_type).toBe('context_scope');
        } else {
          expect(sample.stem).toContain('王经理工作十分认真');
          expect(sample.stem).toContain('★ 关于王经理，可以知道什么？');
          expect(sample.options).toEqual(['十分繁忙', '喜欢运动', '经常迟到', '工作轻松']);
          expect(sample.trap_type).toBe('context_scope');
        }
        expect(sample.answer_idx).toBe(0);

        // 5. Must NOT contain fill-in-the-blank samples
        expect(sample.stem).not.toContain('我想去商店买两本');
        expect(sample.stem).not.toContain('门外太冷了');
        expect(sample.stem).not.toContain('遇到困难时');
      });
    }
  });

  describe('4. Fill-in-the-blank Few-Shot Sample Invariant for read_fill_blank_4opt', () => {
    it('verifies level=1 read_fill_blank_4opt has HSK 1 classifier sample', () => {
      const prompt = buildHskPrompt(1, 'reading', 5, [], 'read_fill_blank_4opt');
      const parsed = extractSampleJsonFromPrompt(prompt);
      const sample = parsed.questions[0];

      expect(sample.stem).toContain('我想去商店买两本____。');
      expect(sample.completed_stem).toBe('我想去商店买两本书。');
      expect(sample.options).toEqual(['书', '水', '茶', '苹果']);
      expect(sample.target_vocabulary).toBe('书');
    });

    it('verifies level=2 read_fill_blank_4opt has HSK 2 directional complement sample', () => {
      const prompt = buildHskPrompt(2, 'reading', 5, [], 'read_fill_blank_4opt');
      const parsed = extractSampleJsonFromPrompt(prompt);
      const sample = parsed.questions[0];

      expect(sample.stem).toContain('门外太冷了，你快____来吧。');
      expect(sample.completed_stem).toBe('门外太冷了，你快进来吧。');
      expect(sample.options).toEqual(['进', '走', '出', '跑']);
      expect(sample.target_vocabulary).toBe('进');
    });

    it('verifies level=3..6 read_fill_blank_4opt has HSK 3+ collocation sample', () => {
      for (const lvl of [3, 4, 5, 6]) {
        const prompt = buildHskPrompt(lvl, 'reading', 5, [], 'read_fill_blank_4opt');
        const parsed = extractSampleJsonFromPrompt(prompt);
        const sample = parsed.questions[0];

        expect(sample.stem).toContain('遇到困难时，我们必须想办法____问题。');
        expect(sample.completed_stem).toBe('遇到困难时，我们必须想办法解决问题。');
        if (lvl === 3) {
          expect(sample.options).toEqual(['解决', '解释', '决定', '检查']);
        } else if (lvl === 4) {
          expect(sample.options).toEqual(['合适', '适合', '符合', '配合']);
        } else {
          expect(sample.options).toEqual(['缓解', '推卸', '摆脱', '消除']);
        }
        expect(sample.target_vocabulary).toBe('解决');
      }
    });
  });

  describe('5. PART_TYPE_REGISTRY Validation & Contract Flags', () => {
    it('validates listen_talks_qa_4opt contract flags', () => {
      const contract = getPartTypeContract('listen_talks_qa_4opt');
      expect(contract.partType).toBe('listen_talks_qa_4opt');
      expect(contract.category).toBe('listening_monologue');
      expect(contract.expectedOptions).toBe(4);
      expect(contract.requiresPlaceholder).toBe(false);
      expect(contract.requiresCompletedStem).toBe(false);
      expect(contract.requiresAudioText).toBe(true);
      expect(contract.descriptionVi).toContain('Nghe bài phát biểu');
    });

    it('validates read_find_faulty_sentence_4opt contract flags', () => {
      const contract = getPartTypeContract('read_find_faulty_sentence_4opt');
      expect(contract.partType).toBe('read_find_faulty_sentence_4opt');
      expect(contract.category).toBe('generic_mcq');
      expect(contract.expectedOptions).toBe(4);
      expect(contract.requiresPlaceholder).toBe(false);
      expect(contract.prohibitsPlaceholder).toBe(true);
      expect(contract.requiresCompletedStem).toBe(false);
      expect(contract.name).toContain('Bệnh cú');
      expect(contract.name).toContain('HSK 6');
    });

    it('validates read_cloze_passages_4opt contract flags', () => {
      const contract = getPartTypeContract('read_cloze_passages_4opt');
      expect(contract.partType).toBe('read_cloze_passages_4opt');
      expect(contract.category).toBe('fill_blank');
      expect(contract.expectedOptions).toBe(4);
      expect(contract.requiresPlaceholder).toBe(true);
      expect(contract.requiresCompletedStem).toBe(true);
      expect(contract.name).toContain('HSK 5-6');
      expect(contract.descriptionVi).toContain('nhiều chỗ trống');
    });

    it('validates listen_dialogue_qa_4opt contract flags', () => {
      const contract = getPartTypeContract('listen_dialogue_qa_4opt');
      expect(contract.partType).toBe('listen_dialogue_qa_4opt');
      expect(contract.category).toBe('listening_dialogue');
      expect(contract.expectedOptions).toBe(4);
      expect(contract.requiresPlaceholder).toBe(false);
      expect(contract.requiresAudioText).toBe(true);
      expect(contract.requiresSpokenTurns).toBe(true);
    });

    it('validates read_comprehension_4opt contract flags', () => {
      const contract = getPartTypeContract('read_comprehension_4opt');
      expect(contract.partType).toBe('read_comprehension_4opt');
      expect(contract.category).toBe('reading_comprehension');
      expect(contract.expectedOptions).toBe(4);
      expect(contract.requiresPlaceholder).toBe(false);
      expect(contract.prohibitsPlaceholder).toBe(true);
      expect(contract.requiresQuestionMarkStar).toBe(true);
    });

    it('validates read_fill_blank_4opt contract flags', () => {
      const contract = getPartTypeContract('read_fill_blank_4opt');
      expect(contract.partType).toBe('read_fill_blank_4opt');
      expect(contract.category).toBe('fill_blank');
      expect(contract.expectedOptions).toBe(4);
      expect(contract.requiresPlaceholder).toBe(true);
      expect(contract.requiresCompletedStem).toBe(true);
    });

    it('validates contract helper functions isFillBlankPartType and isReadingComprehensionPartType', () => {
      // Fill blank types
      expect(isFillBlankPartType('read_fill_blank_4opt')).toBe(true);
      expect(isFillBlankPartType('read_fill_blank_word_bank_6opt')).toBe(true);
      expect(isFillBlankPartType('read_cloze_passages_4opt')).toBe(true);
      expect(isFillBlankPartType('listen_dialogue_qa_4opt')).toBe(false);
      expect(isFillBlankPartType('read_comprehension_4opt')).toBe(false);
      expect(isFillBlankPartType('listen_talks_qa_4opt')).toBe(false);
      expect(isFillBlankPartType('read_find_faulty_sentence_4opt')).toBe(false);

      // Reading comprehension types
      expect(isReadingComprehensionPartType('read_comprehension_4opt')).toBe(true);
      expect(isReadingComprehensionPartType('read_comprehension_short_3opt')).toBe(true);
      expect(isReadingComprehensionPartType('listen_dialogue_qa_4opt')).toBe(false);
      expect(isReadingComprehensionPartType('read_fill_blank_4opt')).toBe(false);
      expect(isReadingComprehensionPartType('read_cloze_passages_4opt')).toBe(false);
    });
  });

  describe('6. IELTS Trap Type Guidance in Prompt Templates', () => {
    const newTraps: { trap: TrapType; expectedPhrases: string[] }[] = [
      {
        trap: 'anti_verbatim',
        expectedPhrases: [
          'TRAP STRATEGY: Anti-Verbatim Matching',
          'The correct answer MUST NOT repeat key phrases from the stem word-for-word',
          'authentic synonymous paraphrasing',
        ],
      },
      {
        trap: 'self_correction',
        expectedPhrases: [
          'TRAP STRATEGY: Self-Correction & Informational Twists',
          'initial plan, thought, or number',
          'MANDATORY TRAP OPTION',
        ],
      },
      {
        trap: 'rhetorical_attitude',
        expectedPhrases: [
          'TRAP STRATEGY: Rhetorical Question & Indirect Attitude Implication',
          'rhetorical questions',
          'decode the implicit communicative meaning',
        ],
      },
      {
        trap: 'numerical_twist',
        expectedPhrases: [
          'TRAP STRATEGY: Numerical Twist & Calculation',
          'NUMERICAL LOGIC',
          'initial unadjusted numbers',
        ],
      },
    ];

    for (const { trap, expectedPhrases } of newTraps) {
      it(`injects proper instructions for trap_type='${trap}'`, () => {
        const prompt = buildHskPrompt(
          4,
          'listening',
          3,
          [],
          'listen_dialogue_qa_4opt',
          undefined,
          undefined,
          undefined,
          trap
        );

        for (const phrase of expectedPhrases) {
          expect(prompt).toContain(phrase);
        }
      });
    }
  });

  describe('7. End-to-End Pipeline: Parse & Validate Generated Few-Shot Samples', () => {
    it('verifies listen_dialogue_qa_4opt few-shot sample passes normalizer and validateCandidate Gate 6', () => {
      const prompt = buildHskPrompt(4, 'listening', 1, [], 'listen_dialogue_qa_4opt');
      const parsed = extractSampleJsonFromPrompt(prompt);
      const normalizedList = normalizeQuestionList(parsed, 4, 'listening', true);
      expect(normalizedList.length).toBe(1);
      const sample = normalizedList[0];

      const valResult = validateCandidate(sample, [], {
        expectedLevel: 4,
        expectedSkill: 'listening',
        expectedPartType: 'listen_dialogue_qa_4opt',
        requireLanguageQuality: false,
        requireDistractorRationales: false,
      });

      expect(valResult.valid).toBe(true);
      expect(valResult.errors).toEqual([]);
      expect(valResult.warnings.filter((w) => w.includes('speaker turns'))).toHaveLength(0);
      expect(valResult.solverAnalysis.semantic_uniqueness_status).toBe('UNIQUE_ANSWER_CONFIRMED');
    });

    it('verifies read_comprehension_4opt few-shot sample passes normalizer and validateCandidate Gate 6', () => {
      const prompt = buildHskPrompt(3, 'reading', 1, [], 'read_comprehension_4opt');
      const parsed = extractSampleJsonFromPrompt(prompt);
      const normalizedList = normalizeQuestionList(parsed, 3, 'reading', true);
      expect(normalizedList.length).toBe(1);
      const sample = normalizedList[0];

      const valResult = validateCandidate(sample, [], {
        expectedLevel: 3,
        expectedSkill: 'reading',
        expectedPartType: 'read_comprehension_4opt',
        requireLanguageQuality: false,
      });
      // At Level 6, the sample is within vocabulary band (繁忙 is HSK 6)
      const promptLvl6 = buildHskPrompt(6, 'reading', 1, [], 'read_comprehension_4opt');
      const parsedLvl6 = extractSampleJsonFromPrompt(promptLvl6);
      const normalizedLvl6 = normalizeQuestionList(parsedLvl6, 6, 'reading', true);
      const valLvl6 = validateCandidate(normalizedLvl6[0], [], {
        expectedLevel: 6,
        expectedSkill: 'reading',
        expectedPartType: 'read_comprehension_4opt',
        requireLanguageQuality: false,
        requireDistractorRationales: false,
      });
      expect(valLvl6.valid).toBe(true);
      expect(valLvl6.errors).toEqual([]);
      expect(valLvl6.solverAnalysis.semantic_uniqueness_status).toBe('UNIQUE_ANSWER_CONFIRMED');

      // However, at Level 3, the sample contains HSK 4 (十分, 轻松) and HSK 6 (繁忙) words
      const valLvl3 = validateCandidate(sample, [], {
        expectedLevel: 3,
        expectedSkill: 'reading',
        expectedPartType: 'read_comprehension_4opt',
        requireLanguageQuality: false,
        requireDistractorRationales: false,
      });
      // Documenting the empirical finding: at level 3, Gate 6 semantic solver confirms uniqueness,
      // but Gate 3 flags contextual words as warnings in multi-part tasks.
      expect(valLvl3.solverAnalysis.semantic_uniqueness_status).toBe('UNIQUE_ANSWER_CONFIRMED');
      expect(valLvl3.warnings.some((w) => w.includes('exceeding HSK Level 3'))).toBe(true);
    });

    it('verifies read_fill_blank_4opt few-shot sample passes normalizer and validateCandidate Gate 6', () => {
      const prompt = buildHskPrompt(2, 'reading', 1, [], 'read_fill_blank_4opt');
      const parsed = extractSampleJsonFromPrompt(prompt);
      const normalizedList = normalizeQuestionList(parsed, 2, 'reading', true);
      expect(normalizedList.length).toBe(1);
      const sample = normalizedList[0];

      const valResult = validateCandidate(sample, [], {
        expectedLevel: 2,
        expectedSkill: 'reading',
        expectedPartType: 'read_fill_blank_4opt',
        requireLanguageQuality: false,
        requireDistractorRationales: false,
      });

      expect(valResult.valid).toBe(true);
      expect(valResult.errors).toEqual([]);
    });
  });

  describe('8. Robustness under Boundary & Adversarial Parameters', () => {
    it('clamps level <= 0 to level 1 and level >= 7 to level 6', () => {
      const lowPrompt = buildHskPrompt(0, 'reading', 3, [], 'read_fill_blank_4opt');
      expect(lowPrompt).toContain('HSK Level 1');

      const negativePrompt = buildHskPrompt(-5, 'reading', 3, [], 'read_fill_blank_4opt');
      expect(negativePrompt).toContain('HSK Level 1');

      const highPrompt = buildHskPrompt(7, 'reading', 3, [], 'read_fill_blank_4opt');
      expect(highPrompt).toContain('HSK Level 6');

      const veryHighPrompt = buildHskPrompt(99, 'reading', 3, [], 'read_fill_blank_4opt');
      expect(veryHighPrompt).toContain('HSK Level 6');
    });

    it('handles empty options/writing tasks without crashing', () => {
      const writingPrompt = buildHskPrompt(4, 'writing', 2, [], 'write_make_sentence_words');
      expect(writingPrompt).toContain('OPEN-ENDED WRITING (0 OPTIONS)');
      const parsed = extractSampleJsonFromPrompt(writingPrompt);
      expect(parsed.questions[0].options).toEqual([]);
    });

    it('handles unknown part_type via fallback without throwing', () => {
      const fallbackContract = getPartTypeContract('non_existent_part_type_xyz_4opt');
      expect(fallbackContract.partType).toBe('non_existent_part_type_xyz_4opt');
      expect(fallbackContract.expectedOptions).toBe(4);
      expect(fallbackContract.category).toBe('generic_mcq');
    });
  });
});
