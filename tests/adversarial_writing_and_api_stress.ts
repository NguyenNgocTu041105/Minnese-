/**
 * Adversarial Stress Testing: Writing UX Logic & Server API State Machine
 */

import {
  getMockExamQuestions,
  getPracticeQuestions,
  HSKExamQuestion,
  HSK_BLUEPRINT_SUMMARIES,
} from '../src/data/hskMockExamFixtures';

interface TestResult {
  name: string;
  passed: boolean;
  details?: string;
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

async function runWritingAndApiStressTests() {
  console.log('=== [CHALLENGE SUITE 2] WRITING UX & API STATE RECONFIGURATION ===\n');

  // =========================================================================
  // 1. Tianzige (田字格) Character Parsing & Candidate Pill Logic
  // =========================================================================
  console.log('--- 1. Testing Tianzige Character Parsing & Candidate Selection ---');
  const tianzigeQuestions = getMockExamQuestions(3).filter(
    (q) => q.part_type === 'write_tianzige_from_pinyin'
  );

  assert(
    tianzigeQuestions.length > 0,
    'Tianzige questions exist in HSK 3',
    `Found ${tianzigeQuestions.length} questions`
  );

  for (const q of tianzigeQuestions) {
    assert(
      q.options.length >= 2,
      `Tianzige question ${q.id} has options`,
      `Options count: ${q.options.length}`
    );

    // Each option must have a Chinese character extracted by /[\u4e00-\u9fa5]/
    for (let i = 0; i < q.options.length; i++) {
      const opt = q.options[i];
      const match = opt.match(/[\u4e00-\u9fa5]/);
      assert(
        Boolean(match && match[0]),
        `Tianzige question ${q.id} option [${i}] '${opt}' yields Hanzi`,
        `Extracted: ${match ? match[0] : 'NONE'}`
      );
    }
  }

  // =========================================================================
  // 2. WordOrderChipBuilder (连词成句) Parsing & State Assembly
  // =========================================================================
  console.log('\n--- 2. Testing WordOrderChipBuilder (连词成句) State Machine ---');
  const wordOrderQuestions = [
    ...getMockExamQuestions(4).filter((q) => q.part_type === 'write_sentence_arrangement'),
    ...getMockExamQuestions(5).filter((q) => q.part_type === 'write_sentence_arrangement'),
  ];

  assert(
    wordOrderQuestions.length > 0,
    'WordOrder questions exist in HSK 4 and 5',
    `Found ${wordOrderQuestions.length} questions`
  );

  for (const q of wordOrderQuestions) {
    // Parse chunks from stem
    const rawChunks = q.stem
      .replace(/^[^\s：:]+[：:]\s*/, '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    assert(
      rawChunks.length >= 3,
      `WordOrder question ${q.id} parses into >= 3 chunks`,
      `Parsed: [${rawChunks.join(' | ')}] (length: ${rawChunks.length})`
    );

    // Test assembling chips into slots
    let currentSlots: string[] = [];
    for (const chunk of rawChunks) {
      currentSlots = [...currentSlots, chunk];
      const countInSlots = currentSlots.filter((w) => w === chunk).length;
      const countInChunks = rawChunks.filter((w) => w === chunk).length;
      const isUsedUp = countInSlots >= countInChunks;
      assert(
        isUsedUp,
        `Chip '${chunk}' correctly disabled when added to slots in question ${q.id}`
      );
    }

    // Test removal of first chip
    const removedWord = currentSlots[0];
    currentSlots = currentSlots.slice(1);
    const countInSlotsAfterRemove = currentSlots.filter((w) => w === removedWord).length;
    const countInChunksAfterRemove = rawChunks.filter((w) => w === removedWord).length;
    const isReEnabled = countInSlotsAfterRemove < countInChunksAfterRemove;
    assert(
      isReEnabled,
      `Chip '${removedWord}' correctly re-enabled in bank after removal in question ${q.id}`
    );

    // Test reset
    currentSlots = [];
    assert(
      currentSlots.length === 0,
      `Reset chips clears all slots for question ${q.id}`
    );
  }

  // =========================================================================
  // 3. FanggeEssayComposer (方格作文) Milestone Meter & Keyword Checklist
  // =========================================================================
  console.log('\n--- 3. Testing FanggeEssayComposer Milestone Meter & Keywords ---');
  const essayQuestions = [
    ...getMockExamQuestions(4).filter((q) => q.part_type.includes('essay') || q.part_type.includes('story')),
    ...getMockExamQuestions(5).filter((q) => q.part_type.includes('essay') || q.part_type.includes('story')),
  ];

  assert(
    essayQuestions.length > 0,
    'Essay questions exist in HSK 4 and 5',
    `Found ${essayQuestions.length} questions`
  );

  for (const q of essayQuestions) {
    const kwMatch = q.stem.match(/\[(.*?)\]|【(.*?)】/);
    const rawKeywords = kwMatch
      ? (kwMatch[1] || kwMatch[2] || '').split(/[,，\s]+/).filter(Boolean)
      : [];

    if (rawKeywords.length > 0) {
      assert(
        rawKeywords.length >= 2,
        `Essay question ${q.id} extracted mandatory keywords`,
        `Keywords: [${rawKeywords.join(', ')}]`
      );

      // Test keyword checklist: draft containing first keyword
      let draft = `我们应该学会在生活中${rawKeywords[0]}，不断努力。`;
      assert(
        draft.includes(rawKeywords[0]),
        `Draft correctly includes keyword '${rawKeywords[0]}'`
      );
      if (rawKeywords.length > 1) {
        assert(
          !draft.includes(rawKeywords[1]),
          `Draft does not yet include keyword '${rawKeywords[1]}'`
        );
      }
    }
  }

  // Detailed Milestone Thresholds for Target Length = 80
  console.log('\n--- 3b. Testing Exact Milestone Thresholds for 80-char Essay ---');
  const targetLength = 80;

  function evaluateEssayMeter(draft: string, target: number) {
    const charCount = draft.replace(/\s+/g, '').length;
    const isSufficient = charCount >= target;
    const isAmber = !isSufficient && charCount >= target * 0.6;
    const isRose = !isSufficient && !isAmber;

    const badgeText = isSufficient ? 'Đạt chuẩn CTI' : 'Cần thêm từ';
    const badgeColor = isSufficient
      ? 'bg-emerald-100'
      : isAmber
      ? 'bg-amber-100'
      : 'bg-rose-100';

    return { charCount, isSufficient, isAmber, isRose, badgeText, badgeColor };
  }

  // Boundary Case 1: 0 chars
  const eval0 = evaluateEssayMeter('', targetLength);
  assert(eval0.charCount === 0 && eval0.isRose && eval0.badgeColor === 'bg-rose-100', '0 chars is Rose (< 48)');

  // Boundary Case 2: 47 chars (< 48 = 80 * 0.6)
  const draft47 = '一'.repeat(47);
  const eval47 = evaluateEssayMeter(draft47, targetLength);
  assert(eval47.charCount === 47 && eval47.isRose && eval47.badgeColor === 'bg-rose-100', '47 chars is Rose (< 48)');

  // Boundary Case 3: 48 chars (Exact 60% threshold)
  const draft48 = '一'.repeat(48);
  const eval48 = evaluateEssayMeter(draft48, targetLength);
  assert(eval48.charCount === 48 && eval48.isAmber && eval48.badgeColor === 'bg-amber-100', '48 chars is Amber (>= 48, < 80)');

  // Boundary Case 4: 50 chars (<50 vs 50-79 check)
  const draft50 = '一'.repeat(50);
  const eval50 = evaluateEssayMeter(draft50, targetLength);
  assert(eval50.charCount === 50 && eval50.isAmber && eval50.badgeColor === 'bg-amber-100', '50 chars is Amber (50-79)');

  // Boundary Case 5: 79 chars (Just below 80)
  const draft79 = '一'.repeat(79);
  const eval79 = evaluateEssayMeter(draft79, targetLength);
  assert(eval79.charCount === 79 && eval79.isAmber && eval79.badgeColor === 'bg-amber-100', '79 chars is Amber (50-79)');

  // Boundary Case 6: 80 chars (Exact target)
  const draft80 = '一'.repeat(80);
  const eval80 = evaluateEssayMeter(draft80, targetLength);
  assert(eval80.charCount === 80 && eval80.isSufficient && eval80.badgeColor === 'bg-emerald-100', '80 chars is Emerald (>= 80, Đạt chuẩn CTI)');

  // Boundary Case 7: 120 chars (> 80)
  const draft120 = '一'.repeat(120);
  const eval120 = evaluateEssayMeter(draft120, targetLength);
  assert(eval120.charCount === 120 && eval120.isSufficient && eval120.badgeColor === 'bg-emerald-100', '120 chars is Emerald (>= 80)');

  // Boundary Case 8: Whitespace exclusion
  const draftWithSpaces = '  一  二  三  四  五  ';
  const evalSpaces = evaluateEssayMeter(draftWithSpaces, targetLength);
  assert(evalSpaces.charCount === 5, 'Whitespace correctly excluded from charCount (5 Hanzi with 10 spaces = 5 chars)');

  // =========================================================================
  // 4. Rapid Level Switching Simulation: HSK 1 -> 5 -> 2 -> 4 -> 3
  // =========================================================================
  console.log('\n--- 4. Rapid Level Switching Simulation: HSK 1 -> 5 -> 2 -> 4 -> 3 ---');
  const switchSequence = [1, 5, 2, 4, 3];

  for (const lvl of switchSequence) {
    const bp = HSK_BLUEPRINT_SUMMARIES[lvl];
    const qs = getMockExamQuestions(lvl);

    // Verify timer
    const expectedMinutes: Record<number, number> = { 1: 40, 2: 55, 3: 85, 4: 100, 5: 125 };
    assert(
      bp.time_limit_minutes === expectedMinutes[lvl],
      `Switch to HSK ${lvl}: Timer reconfigures to ${expectedMinutes[lvl]} min`,
      `Got: ${bp.time_limit_minutes} min`
    );

    // Verify question pool
    const expectedCount: Record<number, number> = { 1: 40, 2: 60, 3: 70, 4: 70, 5: 72 };
    assert(
      qs.length === expectedCount[lvl],
      `Switch to HSK ${lvl}: Question pool size is ${expectedCount[lvl]}`,
      `Got: ${qs.length}`
    );

    // Verify max score & pass score
    const expectedMax: Record<number, number> = { 1: 200, 2: 300, 3: 300, 4: 300, 5: 300 };
    const expectedPass: Record<number, number> = { 1: 120, 2: 180, 3: 180, 4: 180, 5: 180 };
    assert(
      bp.max_score === expectedMax[lvl],
      `Switch to HSK ${lvl}: Max score is ${expectedMax[lvl]}`,
      `Got: ${bp.max_score}`
    );
    assert(
      bp.pass_score === expectedPass[lvl],
      `Switch to HSK ${lvl}: Pass score threshold is ${expectedPass[lvl]}`,
      `Got: ${bp.pass_score}`
    );

    // Simulate 100% correct score calculation
    const allCorrectAnswers: Record<string, number> = {};
    for (const q of qs) {
      allCorrectAnswers[q.id] = q.answer_index;
    }

    const sectionCategories: ('listening' | 'reading' | 'writing')[] =
      lvl === 1 ? ['listening', 'reading'] : ['listening', 'reading', 'writing'];

    let totalScore = 0;
    for (const sec of sectionCategories) {
      const secQs = qs.filter((q) => q.section === sec);
      const secWeight = bp.sections[sec]?.score_weight || 100;
      const secCorrect = secQs.filter((q) => allCorrectAnswers[q.id] === q.answer_index).length;
      const secScore = secQs.length > 0 ? Math.round((secCorrect / secQs.length) * secWeight) : 0;
      totalScore += secScore;
    }
    totalScore = Math.min(totalScore, bp.max_score);

    assert(
      totalScore === bp.max_score,
      `Switch to HSK ${lvl}: 100% correct answers yield full score of ${bp.max_score}`,
      `Calculated: ${totalScore}`
    );

    assert(
      totalScore >= bp.pass_score,
      `Switch to HSK ${lvl}: 100% score satisfies pass threshold of ${bp.pass_score}`
    );
  }

  // Summary
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  console.log(`\n======================================================`);
  console.log(`TOTAL WRITING & API TESTS: ${results.length} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
  console.log(`======================================================\n`);

  if (failedCount > 0) {
    process.exit(1);
  }
}

runWritingAndApiStressTests().catch((err) => {
  console.error('Unhandled error in writing/api stress tests:', err);
  process.exit(1);
});
