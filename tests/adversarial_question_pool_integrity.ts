/**
 * Adversarial Question Pool Integrity & Blueprint Reconfiguration Test
 *
 * Verifies across HSK 1-5:
 * 1. Exact blueprint question counts (40, 60, 70, 70, 72)
 * 2. Absolute uniqueness of question IDs within and across all 5 levels
 * 3. Stem integrity: non-empty, uncorrupted, no undefined/NaN/HTML injection
 * 4. Options validity: non-empty, no duplicates, valid length
 * 5. Answer index validity: bounded within [0, options.length - 1]
 * 6. Visual illustration integrity: options_images length alignment, no stem-spoiling
 * 7. getPracticeQuestions filtering across all levels & skills
 * 8. findQuestionById correctness and resilience
 * 9. Blueprint reconfiguration: timers (40/55/85/100/125m) and scores (200 vs 300)
 */

import {
  getMockExamQuestions,
  getPracticeQuestions,
  findQuestionById,
  HSK_BLUEPRINT_SUMMARIES,
  HSKExamQuestion,
} from '../src/data/hskMockExamFixtures';

interface TestResult {
  name: string;
  passed: boolean;
  details?: string;
  error?: any;
}

const results: TestResult[] = [];

function assert(condition: boolean, name: string, details?: string) {
  if (condition) {
    results.push({ name, passed: true, details });
    console.log(`  [PASS] ${name}`);
  } else {
    results.push({ name, passed: false, details });
    console.error(`  [FAIL] ${name}${details ? ': ' + details : ''}`);
  }
}

async function runQuestionPoolIntegrityTests() {
  console.log('=== [CHALLENGE SUITE 1] QUESTION POOL INTEGRITY & BLUEPRINTS ===\n');

  const EXPECTED_COUNTS: Record<number, number> = {
    1: 40,
    2: 60,
    3: 70,
    4: 70,
    5: 72,
  };

  const EXPECTED_TIMERS: Record<number, number> = {
    1: 40,
    2: 55,
    3: 85,
    4: 100,
    5: 125,
  };

  const EXPECTED_MAX_SCORES: Record<number, number> = {
    1: 200,
    2: 300,
    3: 300,
    4: 300,
    5: 300,
  };

  const EXPECTED_PASS_SCORES: Record<number, number> = {
    1: 120,
    2: 180,
    3: 180,
    4: 180,
    5: 180,
  };

  const allQuestionsAcrossLevels: HSKExamQuestion[] = [];
  const globalIdSet = new Set<string>();
  const duplicateIds: string[] = [];

  // 1. Level-by-level Mock Exam Pool Test
  for (let lvl = 1; lvl <= 5; lvl++) {
    const questions = getMockExamQuestions(lvl);
    const expectedCount = EXPECTED_COUNTS[lvl];

    assert(
      questions.length === expectedCount,
      `HSK ${lvl} Question Count`,
      `Expected ${expectedCount}, got ${questions.length}`
    );

    const levelIdSet = new Set<string>();
    let corruptStemCount = 0;
    let invalidOptionsCount = 0;
    let invalidAnswerIndexCount = 0;
    let missingExplanationCount = 0;
    let mismatchedImagesCount = 0;
    let stemSpoilingIllustrationCount = 0;

    for (const q of questions) {
      allQuestionsAcrossLevels.push(q);

      // Check ID uniqueness
      if (levelIdSet.has(q.id)) {
        duplicateIds.push(`Level ${lvl} duplicate: ${q.id}`);
      }
      levelIdSet.add(q.id);

      if (globalIdSet.has(q.id)) {
        duplicateIds.push(`Global duplicate: ${q.id}`);
      }
      globalIdSet.add(q.id);

      // Check level tag
      if (q.level !== lvl) {
        assert(false, `HSK ${lvl} Question ${q.id} level tag mismatch`, `Tag is ${q.level}`);
      }

      // Check stem corruption
      if (
        !q.stem ||
        typeof q.stem !== 'string' ||
        q.stem.trim().length === 0 ||
        q.stem.includes('undefined') ||
        q.stem.includes('null') ||
        q.stem.includes('NaN') ||
        q.stem.includes('[object Object]')
      ) {
        corruptStemCount++;
      }

      // Check options
      if (!Array.isArray(q.options) || q.options.length < 2) {
        invalidOptionsCount++;
      } else {
        // Check for empty or duplicate options
        const optSet = new Set(q.options.map(o => o.trim()));
        if (optSet.size !== q.options.length || q.options.some(o => typeof o !== 'string' || o.trim() === '')) {
          invalidOptionsCount++;
        }
      }

      // Check answer_index
      if (
        typeof q.answer_index !== 'number' ||
        !Number.isInteger(q.answer_index) ||
        q.answer_index < 0 ||
        q.answer_index >= q.options.length
      ) {
        invalidAnswerIndexCount++;
      }

      // Check explanation
      if (!q.explanation_vi || typeof q.explanation_vi !== 'string' || q.explanation_vi.trim().length < 5) {
        missingExplanationCount++;
      }

      // Check options_images alignment
      if (q.options_images && q.options_images.length > 0) {
        if (q.options_images.length !== q.options.length) {
          mismatchedImagesCount++;
        }
        // Picture matching: stem should not spoil options
        if (
          (q.part_type === 'listen_picture_match_3opt' || q.part_type === 'read_sentence_picture_match_6opt') &&
          q.illustration
        ) {
          stemSpoilingIllustrationCount++;
        }
      }
    }

    assert(
      corruptStemCount === 0,
      `HSK ${lvl} Stem Integrity Check`,
      `Found ${corruptStemCount} corrupt stems`
    );

    assert(
      invalidOptionsCount === 0,
      `HSK ${lvl} Options Integrity Check`,
      `Found ${invalidOptionsCount} questions with invalid options`
    );

    assert(
      invalidAnswerIndexCount === 0,
      `HSK ${lvl} Answer Index Integrity Check`,
      `Found ${invalidAnswerIndexCount} invalid answer indices`
    );

    assert(
      missingExplanationCount === 0,
      `HSK ${lvl} Explanation Integrity Check`,
      `Found ${missingExplanationCount} missing/short explanations`
    );

    assert(
      mismatchedImagesCount === 0,
      `HSK ${lvl} Multi-Image Options Alignment`,
      `Found ${mismatchedImagesCount} questions with options_images length != options length`
    );

    assert(
      stemSpoilingIllustrationCount === 0,
      `HSK ${lvl} Picture-matching Stem Anti-spoiling`,
      `Found ${stemSpoilingIllustrationCount} questions with stem illustration spoiling options`
    );
  }

  // Global ID Uniqueness across all 5 levels (Total 312 questions)
  assert(
    duplicateIds.length === 0,
    `Global Question ID Uniqueness across HSK 1-5 (${allQuestionsAcrossLevels.length} questions)`,
    duplicateIds.slice(0, 5).join('; ')
  );

  assert(
    allQuestionsAcrossLevels.length === 312,
    `Total Questions Count Across HSK 1-5`,
    `Expected 312, got ${allQuestionsAcrossLevels.length}`
  );

  // 2. Blueprint Reconfiguration Checks
  console.log('\n--- Checking Blueprint Configurations ---');
  for (let lvl = 1; lvl <= 5; lvl++) {
    const bp = HSK_BLUEPRINT_SUMMARIES[lvl];
    assert(Boolean(bp), `HSK ${lvl} Blueprint Exists`);
    if (bp) {
      assert(
        bp.time_limit_minutes === EXPECTED_TIMERS[lvl],
        `HSK ${lvl} Timer Configuration`,
        `Expected ${EXPECTED_TIMERS[lvl]}m, got ${bp.time_limit_minutes}m`
      );
      assert(
        bp.max_score === EXPECTED_MAX_SCORES[lvl],
        `HSK ${lvl} Max Score Configuration`,
        `Expected ${EXPECTED_MAX_SCORES[lvl]} pts, got ${bp.max_score} pts`
      );
      assert(
        bp.pass_score === EXPECTED_PASS_SCORES[lvl],
        `HSK ${lvl} Pass Score Threshold`,
        `Expected ${EXPECTED_PASS_SCORES[lvl]} pts, got ${bp.pass_score} pts`
      );
      assert(
        bp.has_pinyin === (lvl <= 2),
        `HSK ${lvl} Blueprint Pinyin Availability`,
        `Expected ${lvl <= 2}, got ${bp.has_pinyin}`
      );
    }
  }

  // 3. getPracticeQuestions Stress Testing
  console.log('\n--- Stress Testing getPracticeQuestions ---');
  for (let lvl = 1; lvl <= 5; lvl++) {
    const skills = ['listening', 'reading', 'writing'];
    for (const skill of skills) {
      const qs = getPracticeQuestions(lvl, skill, undefined, 10);
      assert(
        qs.length > 0,
        `HSK ${lvl} Practice [${skill}] returns questions`,
        `Returned ${qs.length} questions`
      );

      // Verify all belong to requested section
      const wrongSectionCount = qs.filter(q => q.section.toLowerCase() !== skill).length;
      assert(
        wrongSectionCount === 0,
        `HSK ${lvl} Practice [${skill}] section purity`,
        `Found ${wrongSectionCount} questions with wrong section`
      );

      // Verify no duplicates within practice set
      const ids = new Set(qs.map(q => q.id));
      assert(
        ids.size === qs.length,
        `HSK ${lvl} Practice [${skill}] ID uniqueness within slice`,
        `Set size ${ids.size} vs slice length ${qs.length}`
      );
    }
  }

  // 4. findQuestionById lookup verification
  console.log('\n--- Testing findQuestionById Lookup Resilience ---');
  let lookupFailures = 0;
  for (const q of allQuestionsAcrossLevels) {
    const found = findQuestionById(q.id);
    if (!found || found.id !== q.id) {
      lookupFailures++;
    }
  }
  assert(
    lookupFailures === 0,
    `findQuestionById lookup all 312 questions`,
    `Failed lookups: ${lookupFailures}`
  );

  const missingLookup = findQuestionById('non-existent-adversarial-id-9999');
  assert(
    missingLookup === undefined,
    `findQuestionById non-existent ID gracefully returns undefined`
  );

  // Summary
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;
  console.log(`\n======================================================`);
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
  console.log(`======================================================\n`);

  if (failedCount > 0) {
    process.exit(1);
  }
}

runQuestionPoolIntegrityTests().catch(err => {
  console.error('Unhandled error in integrity tests:', err);
  process.exit(1);
});
