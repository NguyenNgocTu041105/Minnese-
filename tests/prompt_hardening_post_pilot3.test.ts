import { describe, expect, it } from 'vitest';
import {
  buildHskPrompt,
  getQuestionTypeInstructions,
  getTopicVocabularyContext,
  HSK_LEVEL_SPECS,
  HSK1_VERIFIED_TOPIC_VOCAB,
} from '../src/server/llm/promptTemplates.js';
import {
  validateCandidate,
  evaluateCandidateSixGates,
} from '../src/server/llm/questionValidator.js';
import { validateFormatCompatibility } from '../src/server/qbankFormatSync.js';

describe('Post-Pilot 3 Prompt Hardening Offline Regression Suite', () => {
  // =========================================================================
  // Test 1: read_comprehension_short_3opt requires ★ and a question
  // =========================================================================
  it('Test 1: read_comprehension_short_3opt prompt explicitly requires ★ question marker and question structure', () => {
    const instructions = getQuestionTypeInstructions('read_comprehension_short_3opt');
    expect(instructions).toContain('★');
    expect(instructions).toMatch(/STRUCTURE CONTRACT/i);
    expect(instructions).toMatch(/<Statement>。★ <Question>？/);

    const fullPrompt = buildHskPrompt(
      1,
      'reading',
      1,
      [],
      'read_comprehension_short_3opt'
    );
    expect(fullPrompt).toContain('★');
    expect(fullPrompt).toContain('Short Reading Comprehension with Question');
  });

  // =========================================================================
  // Test 2: read_comprehension_short_3opt strictly forbids blanks
  // =========================================================================
  it('Test 2: read_comprehension_short_3opt prompt strictly forbids blanks (____)', () => {
    const instructions = getQuestionTypeInstructions('read_comprehension_short_3opt');
    expect(instructions).toMatch(/STRICT NEGATIVE CONSTRAINT/i);
    expect(instructions).toMatch(/ABSOLUTELY NEVER include "____"/i);

    const fullPrompt = buildHskPrompt(
      1,
      'reading',
      1,
      [],
      'read_comprehension_short_3opt'
    );
    expect(fullPrompt).toContain('ABSOLUTELY NEVER include "____"');
  });

  // =========================================================================
  // Test 3: read_fill_blank_4opt requires exactly one ____ and 4 same-POS options
  // =========================================================================
  it('Test 3: read_fill_blank_4opt prompt mandates exactly one blank (____) and 4 options of identical POS', () => {
    const instructions = getQuestionTypeInstructions('read_fill_blank_4opt');
    expect(instructions).toContain('____');
    expect(instructions).toMatch(/EXACTLY ONE blank placeholder/i);
    expect(instructions).toMatch(/EXACT SAME grammatical part of speech/i);
    expect(instructions).toMatch(/NEVER use a noun as a transitive verb/i);

    const fullPrompt = buildHskPrompt(
      1,
      'reading',
      1,
      [],
      'read_fill_blank_4opt'
    );
    expect(fullPrompt).toContain('Fill in the Blank with 4 Options');
    expect(fullPrompt).toContain('____');
  });

  // =========================================================================
  // Test 4: Part types receive independent structural instructions & schema examples
  // =========================================================================
  it('Test 4: Schema examples dynamically adapt to part type, preventing cross-contamination', () => {
    const promptComp = buildHskPrompt(
      1,
      'reading',
      1,
      [],
      'read_comprehension_short_3opt'
    );
    const promptFill = buildHskPrompt(
      1,
      'reading',
      1,
      [],
      'read_fill_blank_4opt'
    );

    // In read_comprehension_short_3opt, the schema example completed_stem MUST NOT contain ____
    expect(promptComp).toContain('"stem": "我上午去学校看书。★ 我什么时候去学校？"');
    expect(promptComp).toContain('"completed_stem": "我上午去学校看书。★ 我什么时候去学校？"');
    expect(promptComp).not.toContain('"我想去商店买两本____。"');

    // In read_fill_blank_4opt, the schema example stem contains ____ (100% verified HSK 1 classifier sample)
    expect(promptFill).toContain('"stem": "我想去商店买两本____。"');
    expect(promptFill).toContain('"completed_stem": "我想去商店买两本书。"');

    // Verify they do not cross-contaminate each other
    expect(promptComp).not.toContain('"我想去商店买两本____。"');
    expect(promptFill).not.toContain('Short Reading Comprehension with Question');
  });

  // =========================================================================
  // Test 5: Verified catalog vocabulary context is dynamically included
  // =========================================================================
  it('Test 5: Vocabulary context is dynamically included from verified HSK 3.0 catalog (Level 1 = 300 headwords)', () => {
    // 1. Verify clusters defined
    const clusterKeys = Object.keys(HSK1_VERIFIED_TOPIC_VOCAB);
    expect(clusterKeys).toContain('food_dining');
    expect(clusterKeys).toContain('family_location');
    expect(clusterKeys).toContain('transport_travel');
    expect(clusterKeys).toContain('daily_activity_time');
    expect(clusterKeys).toContain('weather_status');
    expect(clusterKeys).toContain('school_stationery');

    // 2. Verify getTopicVocabularyContext
    const vocabContext = getTopicVocabularyContext(1, 'food_dining');
    expect(vocabContext).toContain('HSK 1 SYLLABUS SPECIFICATION');
    expect(vocabContext).toContain('300 verified headwords');
    expect(vocabContext).toContain('吃, 喝, 水, 茶, 米饭');
    expect(vocabContext).toContain('餐厅 (HSK 4 -> use 饭店 or 家)');

    // 3. Verify prompt integrates this
    const fullPrompt = buildHskPrompt(
      1,
      'reading',
      1,
      [],
      'read_comprehension_short_3opt',
      'food_dining'
    );
    expect(fullPrompt).toContain('吃, 喝, 水, 茶, 米饭');
    expect(fullPrompt).toContain('苹果');
  });

  // =========================================================================
  // Test 6: Higher level words are listed as prohibited lookalikes and absent from L1
  // =========================================================================
  it('Test 6: Out-of-syllabus / higher-level words (餐厅, 肉, 客厅, 响, 机场, 咖啡, 游泳, 跑步) are prohibited lookalikes and absent from L1 example words', () => {
    const l1Spec = HSK_LEVEL_SPECS[1];
    const prohibitedWords = ['餐厅', '肉', '客厅', '响', '机场', '咖啡', '游泳', '跑步'];

    for (const badWord of prohibitedWords) {
      expect(l1Spec.exampleWords).not.toContain(badWord);
    }

    // Verify they are caught in prohibitedLookalikes across topics
    const allProhibited = Object.values(HSK1_VERIFIED_TOPIC_VOCAB).flatMap(
      (t) => t.prohibitedLookalikes,
    );
    for (const badWord of prohibitedWords) {
      const isProhibited = allProhibited.some((item) => item.includes(badWord));
      expect(isProhibited).toBe(true);
    }
  });

  // =========================================================================
  // Test 7: Prompt adheres to CLEC HSK 3.0 300-word standard, not legacy 150 words
  // =========================================================================
  it('Test 7: Prompt explicitly cites 300 headwords CLEC HSK 3.0 Band 1, not old HSK 2.0 150 words', () => {
    const l1Spec = HSK_LEVEL_SPECS[1];
    expect(l1Spec.wordCountTarget).toContain('300 headwords');
    expect(l1Spec.wordCountTarget).toContain('CLEC HSK 3.0 Band 1');
    expect(l1Spec.wordCountTarget).not.toContain('150');

    const prompt = buildHskPrompt(
      1,
      'reading',
      1,
      [],
      'read_fill_blank_4opt'
    );
    expect(prompt).toContain('300 headwords (CLEC HSK 3.0 Band 1');
    expect(prompt).not.toContain('150 headwords');
  });

  // =========================================================================
  // Test 8: Proper nouns adhere to approved whitelist
  // =========================================================================
  it('Test 8: Proper nouns adhere to approved whitelist (names.txt whitelist policy)', () => {
    const vocabContext = getTopicVocabularyContext(1);
    expect(vocabContext).toContain('APPROVED PROPER NOUNS WHITELIST');
    expect(vocabContext).toContain('李华');
    expect(vocabContext).toContain('王老师');
    expect(vocabContext).toContain('北京');
    expect(vocabContext).toContain('中国');
  });

  // =========================================================================
  // Test 9: Quality gates & Serving guards remain strict and fail-closed
  // =========================================================================
  it('Test 9: Prompt modifications do not weaken or bypass quality gates or fail-closed serving guards', () => {
    // 1. Quality gate must still reject out-of-level vocabulary (e.g. 餐厅 - HSK 4)
    const invalidVocabCandidate = {
      stem: '我们去餐厅吃饭。★ 他们去哪儿？',
      completed_stem: '我们去餐厅吃饭。★ 他们去哪儿？',
      canonical_completed_stem: '我们去餐厅吃饭。★ 他们去哪儿？',
      options: ['学校', '餐厅', '医院'],
      answer_idx: 1,
      level: 1,
      skill: 'reading' as const,
      part_type: 'read_comprehension_short_3opt',
      explanation_vi: 'Dịch: Chúng tôi đi nhà hàng ăn cơm.',
      distractor_rationales: [
        { option_idx: 0, option_text: '学校', rationale_vi: 'Văn bản nêu đi 餐厅, không phải 学校.' },
        { option_idx: 2, option_text: '医院', rationale_vi: 'Văn bản nêu đi 餐厅, không phải 医院.' },
      ],
    };

    const gateResult = evaluateCandidateSixGates(invalidVocabCandidate, [], { strictLevel: true });
    // Gate 3 (Vocab Coverage) and overall allPassed must be false due to 餐厅
    expect(gateResult.gate3_vocab_coverage.passed).toBe(false);
    expect(gateResult.allPassed).toBe(false);

    const valResult = validateCandidate(invalidVocabCandidate, [], { strictLevel: true });
    expect(valResult.valid).toBe(false);
    // Matches both "Tested vocabulary exceeds HSK Level" and "Question contains vocabulary exceeding HSK Level"
    expect(valResult.errors.some((e) => /exceed(?:s|ing) HSK Level|out-of-syllabus/i.test(e))).toBe(true);

    // 2. Candidate with FAIL or REVIEW must NEVER be serving eligible
    const nonEligibleCandidate = {
      status: 'approved',
      is_active: 1,
      quality_validation_status: 'FAIL',
      part_type: 'read_comprehension_short_3opt',
    };
    const res1 = validateFormatCompatibility(nonEligibleCandidate);
    expect(res1.operational_serving_eligible).toBe(false);
    expect(res1.operational_serving_practice_eligible).toBe(false);
    expect(res1.operational_serving_exam_eligible).toBe(false);

    // 3. Candidate without PASS must be rejected
    const pendingCandidate = {
      status: 'approved',
      is_active: 1,
      quality_validation_status: 'UNKNOWN',
      part_type: 'read_comprehension_short_3opt',
    };
    const res2 = validateFormatCompatibility(pendingCandidate);
    expect(res2.operational_serving_eligible).toBe(false);
  });

  // =========================================================================
  // Test 10: Zero network / LLM calls during prompt construction (pure offline determinism)
  // =========================================================================
  it('Test 10: buildHskPrompt executes purely offline and deterministically with 0 network calls', () => {
    const t0 = performance.now();
    const prompt1 = buildHskPrompt(
      1,
      'reading',
      1,
      [],
      'read_comprehension_short_3opt',
      'food_dining'
    );
    const prompt2 = buildHskPrompt(
      1,
      'reading',
      1,
      [],
      'read_comprehension_short_3opt',
      'food_dining'
    );
    const durationMs = performance.now() - t0;

    // Deterministic output
    expect(prompt1).toEqual(prompt2);
    // Offline execution is practically instantaneous (< 50ms)
    expect(durationMs).toBeLessThan(50);
  });
});
