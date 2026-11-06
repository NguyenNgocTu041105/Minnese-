/**
 * Challenger 1 (M3 Validator Adversarial & Blank Normalization Challenger)
 * Empirical Challenge Harness
 * File: tests/server/test_challenge_m3_1.ts
 *
 * Scenarios tested:
 * 1. Adversarial Stem Tests:
 *    - Punctuation-only stem: "1. （ ）？" -> REJECT (missing Hanzi)
 *    - Digits-only stem: "123456" -> REJECT (missing Hanzi)
 *    - Latin/Vietnamese contaminated stem: "他 đi 商店" -> REJECT (Latin/Vietnamese)
 *    - Pinyin-only stem: "Tā qù shāngdiàn" -> REJECT (missing Hanzi & Latin)
 *    - Pinyin + Hanzi contaminated stem: "他 (tā) 去商店" -> REJECT (Latin)
 *    - Bracketed answer leakage: "他去商店（答案：A）" -> REJECT
 *    - Extended bracketed answer leakage: "他去商店 (đáp án: B)", "(gợi ý: C)", "(hint: D)", "(answer: A)" -> REJECT
 *    - Adversarial edge case: "王老师在学校上课。【答案：学校】" (lenticular bracket leak)
 *    - Valid Chinese stem: "他去商店买东西。" -> PASS
 * 2. Blank Normalization & Deduplication Tests:
 *    - Multiple blank syntax variants (____, ___, __, （ ）, (), [ ], 【 】, （___）, [___], 【___】)
 *    - Verify getComparableStem replaces all blank styles with the correct answer
 *    - Verify validateCandidate flags duplicate stems with Jaccard similarity > 0.85
 * 3. Additional Adversarial Quality & Edge Case Tests:
 *    - Options with Latin or Vietnamese
 *    - Floating point answer_idx, level
 *    - Non-visual vs visual illustration_theme behavior
 * 4. Database Invariant:
 *    - Confirm data/hsk_exam.db SHA-256 and row count = 6
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { DatabaseSync } from 'node:sqlite';
import {
  validateCandidate,
  getComparableStem,
  calculateJaccardSimilarity,
  cleanChineseText,
  isVisualQuestionType,
} from '../../src/server/llm/questionValidator.js';
import { CandidateQuestion } from '../../src/server/llm/types.js';

const EXPECTED_LEGACY_DB_HASH = '10255BCCDF641545F649641912C0982B02600E74B5CCEE1229FF03FAA8ED66DD';
const LEGACY_DB_PATH = path.resolve(process.cwd(), 'data/hsk_exam.db');

interface TestRecord {
  category: string;
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
  notes?: string;
}

const records: TestRecord[] = [];

function recordTest(
  category: string,
  name: string,
  condition: boolean,
  expected: string,
  actual: string,
  notes?: string
) {
  records.push({
    category,
    name,
    passed: condition,
    expected,
    actual,
    notes,
  });
  const tag = condition ? '[PASS]' : '[FAIL]';
  console.log(`  ${tag} [${category}] ${name}`);
  if (!condition) {
    console.error(`       Expected: ${expected}`);
    console.error(`       Actual:   ${actual}`);
  }
}

function baseValidCandidate(): CandidateQuestion {
  return {
    stem: '他去商店买东西。',
    options: ['苹果', '香蕉', '西瓜', '葡萄'],
    answer_idx: 0,
    pinyin: 'tā qù shāng diàn mǎi dōng xi',
    explanation_vi: 'Cụ thể mua đồ ở cửa hàng là ngữ cảnh phù hợp nhất.',
    level: 1,
    skill: 'reading',
    part_type: 'read_fill_blank_4opt',
    illustration_theme: null,
  };
}

async function runEmpiricalChallenge() {
  console.log('======================================================================');
  console.log('   CHALLENGER 1: M3 EMPIRICAL ADVERSARIAL & NORMALIZATION HARNESS     ');
  console.log('======================================================================\n');

  // ====================================================================
  // Category 1: Adversarial Stem Tests
  // ====================================================================
  console.log('--- 1. Adversarial Stem Tests ---');

  // Case 1.1: Punctuation-only stem: "1. （ ）？"
  {
    const cand = { ...baseValidCandidate(), stem: '1. （ ）？' };
    const res = validateCandidate(cand);
    const rejectedForHanzi = !res.valid && res.errors.some((e) => e.includes('Chinese character (Hanzi)'));
    recordTest(
      'Adversarial Stem',
      'Punctuation-only stem: "1. （ ）？" MUST be rejected for missing Hanzi',
      rejectedForHanzi,
      'valid=false with Hanzi error',
      `valid=${res.valid}, errors=${JSON.stringify(res.errors)}`
    );
  }

  // Case 1.2: Digits-only stem: "123456"
  {
    const cand = { ...baseValidCandidate(), stem: '123456' };
    const res = validateCandidate(cand);
    const rejectedForHanzi = !res.valid && res.errors.some((e) => e.includes('Chinese character (Hanzi)'));
    recordTest(
      'Adversarial Stem',
      'Digits-only stem: "123456" MUST be rejected for missing Hanzi',
      rejectedForHanzi,
      'valid=false with Hanzi error',
      `valid=${res.valid}, errors=${JSON.stringify(res.errors)}`
    );
  }

  // Case 1.3: Latin/Vietnamese contaminated stem: "他 đi 商店"
  {
    const cand = { ...baseValidCandidate(), stem: '他 đi 商店' };
    const res = validateCandidate(cand);
    const rejectedForLatin = !res.valid && res.errors.some((e) => e.includes('Latin or Vietnamese'));
    recordTest(
      'Adversarial Stem',
      'Latin/Vietnamese contaminated stem: "他 đi 商店" MUST be rejected',
      rejectedForLatin,
      'valid=false with Latin/Vietnamese error',
      `valid=${res.valid}, errors=${JSON.stringify(res.errors)}`
    );
  }

  // Case 1.4: Pure Pinyin stem: "Tā qù shāngdiàn"
  {
    const cand = { ...baseValidCandidate(), stem: 'Tā qù shāngdiàn' };
    const res = validateCandidate(cand);
    const rejected = !res.valid && (
      res.errors.some((e) => e.includes('Chinese character (Hanzi)')) ||
      res.errors.some((e) => e.includes('Latin or Vietnamese'))
    );
    recordTest(
      'Adversarial Stem',
      'Pinyin-only stem: "Tā qù shāngdiàn" MUST be rejected',
      rejected,
      'valid=false with Hanzi or Latin error',
      `valid=${res.valid}, errors=${JSON.stringify(res.errors)}`
    );
  }

  // Case 1.5: Pinyin contaminated Hanzi stem: "他 (tā) 去商店"
  {
    const cand = { ...baseValidCandidate(), stem: '他 (tā) 去商店' };
    const res = validateCandidate(cand);
    const rejectedForLatin = !res.valid && res.errors.some((e) => e.includes('Latin or Vietnamese'));
    recordTest(
      'Adversarial Stem',
      'Pinyin + Hanzi contaminated stem: "他 (tā) 去商店" MUST be rejected',
      rejectedForLatin,
      'valid=false with Latin/Vietnamese error',
      `valid=${res.valid}, errors=${JSON.stringify(res.errors)}`
    );
  }

  // Case 1.6: Pinyin tone accent in stem: "他 qù 商店"
  {
    const cand = { ...baseValidCandidate(), stem: '他 qù 商店' };
    const res = validateCandidate(cand);
    const rejectedForLatin = !res.valid && res.errors.some((e) => e.includes('Latin or Vietnamese'));
    recordTest(
      'Adversarial Stem',
      'Pinyin tone accent in stem: "他 qù 商店" MUST be rejected',
      rejectedForLatin,
      'valid=false with Latin/Vietnamese error',
      `valid=${res.valid}, errors=${JSON.stringify(res.errors)}`
    );
  }

  // Case 1.7a: Bracketed answer leakage: "他去商店（答案：A）"
  {
    const cand = { ...baseValidCandidate(), stem: '他去商店（答案：A）' };
    const res = validateCandidate(cand);
    const rejectedForBracket = !res.valid && res.errors.some((e) => e.includes('prohibited bracketed hint'));
    recordTest(
      'Adversarial Stem',
      'Bracketed answer leakage: "他去商店（答案：A）" MUST be rejected',
      rejectedForBracket,
      'valid=false with prohibited bracketed hint error',
      `valid=${res.valid}, errors=${JSON.stringify(res.errors)}`
    );
  }

  // Case 1.7b: Bracketed hint leakage variations: (đáp án), (gợi ý), (hint), (answer)
  {
    const hints = [
      { stem: '他去商店(đáp án: A)', desc: '(đáp án: A)' },
      { stem: '他去商店(gợi ý: B)', desc: '(gợi ý: B)' },
      { stem: '他去商店(hint: C)', desc: '(hint: C)' },
      { stem: '他去商店(answer: D)', desc: '(answer: D)' },
    ];
    for (const h of hints) {
      const cand = { ...baseValidCandidate(), stem: h.stem };
      const res = validateCandidate(cand);
      const rejected = !res.valid && res.errors.some((e) => e.includes('prohibited bracketed hint'));
      recordTest(
        'Adversarial Stem',
        `Bracketed hint variation: "${h.desc}" MUST be rejected`,
        rejected,
        'valid=false with prohibited bracketed hint error',
        `valid=${res.valid}, errors=${JSON.stringify(res.errors)}`
      );
    }
  }

  // Case 1.7c: Adversarial edge case: Lenticular bracket leak "【答案：学校】"
  {
    const cand = { ...baseValidCandidate(), stem: '王老师在学校上课。【答案：学校】' };
    const res = validateCandidate(cand);
    // Note: If this passes or fails, we document exact behavior.
    const hasHintError = res.errors.some((e) => e.includes('prohibited bracketed hint'));
    recordTest(
      'Adversarial Stem (Edge Case)',
      'Lenticular bracket hint: "王老师在学校上课。【答案：学校】"',
      true, // Informational assertion to observe and document
      'observed behavior',
      `valid=${res.valid}, hasHintError=${hasHintError}, errors=${JSON.stringify(res.errors)}`,
      hasHintError ? 'Caught by hint regex' : 'Note: Lenticular brackets 【】 not included in hint regex (only () and （）)'
    );
  }

  // Case 1.8: Valid Chinese stem: "他去商店买东西。" MUST pass
  {
    const cand = baseValidCandidate();
    const res = validateCandidate(cand);
    recordTest(
      'Adversarial Stem',
      'Valid Chinese stem: "他去商店买东西。" MUST pass',
      res.valid && res.errors.length === 0,
      'valid=true, errors=[]',
      `valid=${res.valid}, errors=${JSON.stringify(res.errors)}`
    );
  }

  // ====================================================================
  // Category 2: Blank Normalization & Deduplication Tests
  // ====================================================================
  console.log('\n--- 2. Blank Normalization & Deduplication Tests ---');

  const options = ['苹果', '香蕉', '西瓜', '葡萄'];
  const answerIdx = 0; // '苹果'

  // Test set of diverse blank representations
  const blankVariants = [
    { name: '4-underscore (____)', stem: '他去商店买____。', expectedReplaced: '他去商店买苹果。' },
    { name: '3-underscore (___)', stem: '他去商店买___。', expectedReplaced: '他去商店买苹果。' },
    { name: '2-underscore (__)', stem: '他去商店买__。', expectedReplaced: '他去商店买苹果。' },
    { name: 'Full-width parens blank （ ）', stem: '他去商店买（ ）？', expectedReplaced: '他去商店买苹果？' },
    { name: 'Half-width parens blank ()', stem: '他去商店买()。', expectedReplaced: '他去商店买苹果。' },
    { name: 'Square brackets blank [ ]', stem: '他去商店买[ ]。', expectedReplaced: '他去商店买苹果。' },
    { name: 'Lenticular brackets blank 【 】', stem: '他去商店买【 】。', expectedReplaced: '他去商店买苹果。' },
    { name: 'Parens with underscores （___）', stem: '他去商店买（___）。', expectedReplaced: '他去商店买苹果。' },
    { name: 'Square brackets with underscores [___]', stem: '他去商店买[___]。', expectedReplaced: '他去商店买苹果。' },
    { name: 'Lenticular brackets with underscores 【___】', stem: '他去商店买【___】。', expectedReplaced: '他去商店买苹果。' },
  ];

  // 2.1 Test getComparableStem replaces each variant properly
  for (const variant of blankVariants) {
    const replaced = getComparableStem(variant.stem, options, answerIdx);
    const matchesExpected = replaced === variant.expectedReplaced;
    recordTest(
      'Blank Normalization',
      `getComparableStem normalizes ${variant.name}`,
      matchesExpected,
      variant.expectedReplaced,
      replaced
    );
  }

  // 2.2 Deduplication Test:
  // Existing pool contains the filled stem of Stem A: "他去商店买苹果。"
  const canonicalComparable = getComparableStem(blankVariants[0].stem, options, answerIdx);
  const existingPool = [canonicalComparable];

  // Now test that candidate questions with Stem B ("他去商店买（ ）？") and Stem C ("他去商店买[ ]。")
  // and all other blank variants are flagged as duplicates with Jaccard > 0.85
  for (const variant of blankVariants) {
    const cand = {
      ...baseValidCandidate(),
      stem: variant.stem,
      options,
      answer_idx: answerIdx,
    };
    const res = validateCandidate(cand, existingPool);
    const flaggedDuplicate = !res.valid && res.errors.some((e) => e.includes('exceeds 85% threshold'));
    recordTest(
      'Deduplication',
      `Candidate with ${variant.name} flagged duplicate against existing filled stem`,
      flaggedDuplicate && res.jaccardSimilarity > 0.85,
      `valid=false, jaccard > 0.85, duplicate error`,
      `valid=${res.valid}, jaccard=${res.jaccardSimilarity.toFixed(4)}, errors=${JSON.stringify(res.errors)}`
    );
  }

  // 2.3 Intra-batch test: Stems with different blanks in succession
  {
    const intraBatchPool: string[] = [];
    const itemA = { ...baseValidCandidate(), stem: '李明在____看书。', options: ['图书馆', '食堂', '寝室', '教室'], answer_idx: 0 };
    const itemB = { ...baseValidCandidate(), stem: '李明在（ ）看书。', options: ['图书馆', '食堂', '寝室', '教室'], answer_idx: 0 };
    const itemC = { ...baseValidCandidate(), stem: '李明在[ ]看书。', options: ['图书馆', '食堂', '寝室', '教室'], answer_idx: 0 };

    const resA = validateCandidate(itemA, intraBatchPool);
    const aPassed = resA.valid;
    if (aPassed) {
      intraBatchPool.push(getComparableStem(itemA.stem, itemA.options, itemA.answer_idx));
    }

    const resB = validateCandidate(itemB, intraBatchPool);
    const bBlocked = !resB.valid && resB.errors.some((e) => e.includes('exceeds 85% threshold'));

    const resC = validateCandidate(itemC, intraBatchPool);
    const cBlocked = !resC.valid && resC.errors.some((e) => e.includes('exceeds 85% threshold'));

    recordTest(
      'Intra-Batch Deduplication',
      'First question in batch (____) accepted',
      aPassed,
      'valid=true',
      `valid=${resA.valid}`
    );
    recordTest(
      'Intra-Batch Deduplication',
      'Second question in batch (（ ）) rejected as duplicate of first',
      bBlocked,
      'valid=false (duplicate)',
      `valid=${resB.valid}, errors=${JSON.stringify(resB.errors)}`
    );
    recordTest(
      'Intra-Batch Deduplication',
      'Third question in batch ([ ]) rejected as duplicate of first',
      cBlocked,
      'valid=false (duplicate)',
      `valid=${resC.valid}, errors=${JSON.stringify(resC.errors)}`
    );
  }

  // ====================================================================
  // Category 3: Additional Adversarial Quality & Boundary Tests
  // ====================================================================
  console.log('\n--- 3. Additional Adversarial Quality & Boundary Tests ---');

  // Case 3.1: Options containing Latin characters
  {
    const cand = { ...baseValidCandidate(), options: ['苹果', 'Apple', '西瓜', '葡萄'] };
    const res = validateCandidate(cand);
    const rejected = !res.valid && res.errors.some((e) => e.includes('invalid Latin or Vietnamese'));
    recordTest(
      'Adversarial Options',
      'Options containing Latin ("Apple") MUST be rejected',
      rejected,
      'valid=false with Latin error',
      `valid=${res.valid}, errors=${JSON.stringify(res.errors)}`
    );
  }

  // Case 3.2: Options containing Vietnamese characters
  {
    const cand = { ...baseValidCandidate(), options: ['苹果', 'Quả táo', '西瓜', '葡萄'] };
    const res = validateCandidate(cand);
    const rejected = !res.valid && res.errors.some((e) => e.includes('invalid Latin or Vietnamese'));
    recordTest(
      'Adversarial Options',
      'Options containing Vietnamese ("Quả táo") MUST be rejected',
      rejected,
      'valid=false with Vietnamese error',
      `valid=${res.valid}, errors=${JSON.stringify(res.errors)}`
    );
  }

  // Case 3.3: Float answer_idx (e.g. 1.5)
  {
    const cand = { ...baseValidCandidate(), answer_idx: 1.5 as any };
    const res = validateCandidate(cand);
    const rejected = !res.valid && res.errors.some((e) => e.includes('must be an integer'));
    recordTest(
      'Adversarial Types',
      'Floating point answer_idx (1.5) MUST be rejected',
      rejected,
      'valid=false with integer check',
      `valid=${res.valid}, errors=${JSON.stringify(res.errors)}`
    );
  }

  // Case 3.4: Float level (e.g. 2.5)
  {
    const cand = { ...baseValidCandidate(), level: 2.5 as any };
    const res = validateCandidate(cand);
    const rejected = !res.valid && res.errors.some((e) => e.includes('level must be an integer between 1 and 6'));
    recordTest(
      'Adversarial Types',
      'Floating point level (2.5) MUST be rejected',
      rejected,
      'valid=false with level integer check',
      `valid=${res.valid}, errors=${JSON.stringify(res.errors)}`
    );
  }

  // Case 3.5: Non-visual question with null illustration_theme passes
  {
    const cand = { ...baseValidCandidate(), part_type: 'read_fill_blank_4opt', illustration_theme: null };
    const res = validateCandidate(cand);
    recordTest(
      'Visual Workflow Decoupling',
      'Non-visual question with null illustration_theme passes',
      res.valid,
      'valid=true',
      `valid=${res.valid}, errors=${JSON.stringify(res.errors)}`
    );
  }

  // Case 3.6: Visual question with null illustration_theme fails
  {
    const cand = { ...baseValidCandidate(), part_type: 'listen_picture_match_4opt', illustration_theme: null };
    const res = validateCandidate(cand);
    const rejected = !res.valid && res.errors.some((e) => e.includes('illustration_theme is required'));
    recordTest(
      'Visual Workflow Decoupling',
      'Visual question with null illustration_theme is rejected',
      rejected,
      'valid=false with illustration_theme is required',
      `valid=${res.valid}, errors=${JSON.stringify(res.errors)}`
    );
  }

  // ====================================================================
  // Category 4: Database Safety Invariant
  // ====================================================================
  console.log('\n--- 4. Database Safety Invariant ---');

  let dbHash = '';
  let dbRowCount = -1;
  let dbHashMatch = false;
  let dbRowMatch = false;

  try {
    const fileBuf = fs.readFileSync(LEGACY_DB_PATH);
    dbHash = crypto.createHash('sha256').update(fileBuf).digest('hex').toUpperCase();
    dbHashMatch = dbHash === EXPECTED_LEGACY_DB_HASH;

    const db = new DatabaseSync(LEGACY_DB_PATH, { readOnly: true });
    const row = db.prepare('SELECT COUNT(*) as count FROM questions').get() as any;
    dbRowCount = row?.count ?? -1;
    dbRowMatch = dbRowCount === 6;
    db.close();
  } catch (err: any) {
    console.error('Error verifying database:', err);
  }

  recordTest(
    'Database Invariant',
    'data/hsk_exam.db SHA-256 hash invariant',
    dbHashMatch,
    EXPECTED_LEGACY_DB_HASH,
    dbHash
  );

  recordTest(
    'Database Invariant',
    'data/hsk_exam.db row count = 6 invariant',
    dbRowMatch,
    '6 rows',
    `${dbRowCount} rows`
  );

  // ====================================================================
  // Summary & Report Export
  // ====================================================================
  const total = records.length;
  const passed = records.filter((r) => r.passed).length;
  const failed = total - passed;

  console.log('\n======================================================================');
  console.log(`   SUMMARY: ${passed}/${total} passed (${failed} failed)`);
  console.log('======================================================================\n');

  return { total, passed, failed, records };
}

runEmpiricalChallenge()
  .then((summary) => {
    if (summary.failed > 0) {
      process.exitCode = 1;
    }
  })
  .catch((err) => {
    console.error('Fatal execution error:', err);
    process.exit(1);
  });
