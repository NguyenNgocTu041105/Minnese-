import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { HSK1_WORKBOOK_LESSONS } from '../src/data/hsk1WorkbookData';
import { HSK2_WORKBOOK_LESSONS } from '../src/data/hsk2WorkbookData';
import {
  getEnrichedWorkbookLesson,
  getEnrichedWorkbookLessons,
  EnrichedWorkbookLesson,
} from '../src/data/workbookEnricher';

// Helper to check for NaN anywhere in an object tree
function findNaNValues(obj: any, currentPath = ''): string[] {
  const nanPaths: string[] = [];
  if (obj === null || obj === undefined) return nanPaths;
  if (typeof obj === 'number' && Number.isNaN(obj)) {
    nanPaths.push(currentPath);
  } else if (Array.isArray(obj)) {
    obj.forEach((item, idx) => {
      nanPaths.push(...findNaNValues(item, `${currentPath}[${idx}]`));
    });
  } else if (typeof obj === 'object') {
    Object.keys(obj).forEach((key) => {
      nanPaths.push(...findNaNValues(obj[key], currentPath ? `${currentPath}.${key}` : key));
    });
  }
  return nanPaths;
}

// Helper to check for undefined in key fields
function checkUndefinedFields(lesson: EnrichedWorkbookLesson): string[] {
  const missing: string[] = [];
  const requiredKeys: (keyof EnrichedWorkbookLesson)[] = [
    'lessonNumber',
    'titleChinese',
    'titlePinyin',
    'titleVietnamese',
    'pageNumber',
    'phonetics',
    'hanziSection',
    'listenAndReadDrills',
    'listeningExercises',
    'readingExercises',
    'hskMockListening',
    'hskMockReading',
    'wordExpansion',
    'writingExercises',
  ];
  for (const k of requiredKeys) {
    if (lesson[k] === undefined) {
      missing.push(k);
    }
  }
  return missing;
}

async function runAdversarialVerification() {
  console.log('================================================================');
  console.log('EMPIRICAL CHALLENGER WB 2: VERIFICATION & STRESS SUITE');
  console.log('================================================================\n');

  let totalAssertions = 0;
  let passedAssertions = 0;
  let failedAssertions = 0;
  const failureLog: string[] = [];

  function assert(condition: boolean, desc: string, details?: any) {
    totalAssertions++;
    if (condition) {
      passedAssertions++;
    } else {
      failedAssertions++;
      const msg = `[FAIL] ${desc}${details ? ` -> ${JSON.stringify(details)}` : ''}`;
      failureLog.push(msg);
      console.error(msg);
    }
  }

  // -------------------------------------------------------------
  // 1. HSK 1 WORKBOOK DATA AUDIT (15 lessons)
  // -------------------------------------------------------------
  console.log('--- 1. Auditing HSK 1 Workbook Data (src/data/hsk1WorkbookData.ts) ---');
  assert(
    HSK1_WORKBOOK_LESSONS.length === 15,
    'HSK1_WORKBOOK_LESSONS must have exactly 15 lessons',
    { count: HSK1_WORKBOOK_LESSONS.length }
  );

  for (let i = 1; i <= 15; i++) {
    const l = HSK1_WORKBOOK_LESSONS.find((lesson) => lesson.lessonNumber === i);
    assert(!!l, `HSK 1 Lesson ${i} must exist`);
    if (!l) continue;

    assert(Boolean(l.titleChinese && l.titleVietnamese), `HSK 1 Lesson ${i} must have Chinese and Vietnamese titles`, {
      titleChinese: l.titleChinese,
      titleVietnamese: l.titleVietnamese,
    });

    if (i <= 3) {
      // Lessons 1-3 are introductory phonetics lessons
      assert(
        (l.phonetics?.length || 0) > 0,
        `HSK 1 Lesson ${i} (intro) must have phonetics`,
        { phoneticsCount: l.phonetics?.length }
      );
      assert(
        (l.listenAndReadDrills?.length || 0) > 0,
        `HSK 1 Lesson ${i} (intro) must have listenAndReadDrills`,
        { drillsCount: l.listenAndReadDrills?.length }
      );
    } else {
      // Lessons 4-15: Full 20 questions each (10 listening + 10 reading)
      const listeningCount = l.hskMockListening?.length || 0;
      const readingCount = l.hskMockReading?.length || 0;
      const totalMock = listeningCount + readingCount;

      assert(
        listeningCount === 10,
        `HSK 1 Lesson ${i} must have exactly 10 mock listening questions`,
        { listeningCount }
      );
      assert(
        readingCount === 10,
        `HSK 1 Lesson ${i} must have exactly 10 mock reading questions`,
        { readingCount }
      );
      assert(
        totalMock === 20,
        `HSK 1 Lesson ${i} must have exactly 20 mock questions total`,
        { totalMock }
      );

      // Verify question structure
      l.hskMockListening?.forEach((q, idx) => {
        assert(!!q.id, `HSK 1 L${i} listening Q${idx + 1} has id`);
        assert(!!q.audioScript, `HSK 1 L${i} listening Q${idx + 1} has audioScript`);
        assert(q.options?.length >= 2, `HSK 1 L${i} listening Q${idx + 1} has >= 2 options`);
        assert(!!q.correctKey, `HSK 1 L${i} listening Q${idx + 1} has correctKey`);
        assert(!!q.explanation, `HSK 1 L${i} listening Q${idx + 1} has explanation`);
      });

      l.hskMockReading?.forEach((q, idx) => {
        assert(!!q.id, `HSK 1 L${i} reading Q${idx + 1} has id`);
        assert(!!q.promptChinese, `HSK 1 L${i} reading Q${idx + 1} has promptChinese`);
        assert(q.options?.length >= 2, `HSK 1 L${i} reading Q${idx + 1} has >= 2 options`);
        assert(!!q.correctKey, `HSK 1 L${i} reading Q${idx + 1} has correctKey`);
        assert(!!q.explanation, `HSK 1 L${i} reading Q${idx + 1} has explanation`);
      });
    }
  }

  // Deep inspection of authentic Chinese characters in HSK 1 Lessons 12, 13, 14
  console.log('\n--- 1.1 Authentic Content Check: HSK 1 Lessons 12, 13, 14 ---');
  const l12 = HSK1_WORKBOOK_LESSONS.find((l) => l.lessonNumber === 12)!;
  const l13 = HSK1_WORKBOOK_LESSONS.find((l) => l.lessonNumber === 13)!;
  const l14 = HSK1_WORKBOOK_LESSONS.find((l) => l.lessonNumber === 14)!;

  // Lesson 12: 昨天下了雪 / 昨天下雪了
  assert(l12.titleChinese.includes('雪'), 'HSK 1 Lesson 12 title contains authentic character 雪');
  const l12Text = JSON.stringify(l12);
  assert(l12Text.includes('昨天') && l12Text.includes('下雪'), 'HSK 1 Lesson 12 contains authentic characters 昨天 & 下雪');
  assert(l12.hskMockListening.length === 10, 'HSK 1 L12 has full 10 listening questions');
  assert(l12.hskMockReading.length === 10, 'HSK 1 L12 has full 10 reading questions');
  // Check specific authentic questions in L12
  const l12ListeningQ10 = l12.hskMockListening.find((q) => q.questionNumber === 10);
  assert(!!l12ListeningQ10 && !!l12ListeningQ10.audioScript, 'HSK 1 L12 Q10 listening authentic question exists');
  const l12ReadingQ19 = l12.hskMockReading.find((q) => q.questionNumber === 19);
  assert(!!l12ReadingQ19 && l12ReadingQ19.promptChinese.length > 5, 'HSK 1 L12 Q19 reading comprehension passage exists');

  // Lesson 13: 请给我一杯茶
  assert(l13.titleChinese.includes('茶'), 'HSK 1 Lesson 13 title contains authentic character 茶');
  const l13Text = JSON.stringify(l13);
  assert(l13Text.includes('请') && l13Text.includes('茶'), 'HSK 1 Lesson 13 contains authentic characters 请 & 茶');
  assert(l13.hskMockListening.length === 10, 'HSK 1 L13 has full 10 listening questions');
  assert(l13.hskMockReading.length === 10, 'HSK 1 L13 has full 10 reading questions');
  const l13ReadingQ14 = l13.hskMockReading.find((q) => q.questionNumber === 14);
  assert(!!l13ReadingQ14 && !!l13ReadingQ14.promptChinese, 'HSK 1 L13 Q14 reading dialogue matching exists');

  // Lesson 14: 她买了不少衣服
  assert(l14.titleChinese.includes('衣服') || l14.titleChinese.includes('买'), 'HSK 1 Lesson 14 title contains authentic character 衣服/买');
  const l14Text = JSON.stringify(l14);
  assert(l14Text.includes('衣服') || l14Text.includes('电影'), 'HSK 1 Lesson 14 contains authentic characters');
  assert(l14.hskMockListening.length === 10, 'HSK 1 L14 has full 10 listening questions');
  assert(l14.hskMockReading.length === 10, 'HSK 1 L14 has full 10 reading questions');
  const l14ReadingQ20 = l14.hskMockReading.find((q) => q.questionNumber === 20);
  assert(!!l14ReadingQ20 && l14ReadingQ20.promptChinese.length > 5, 'HSK 1 L14 Q20 reading comprehension passage exists');

  // -------------------------------------------------------------
  // 2. HSK 2 WORKBOOK DATA AUDIT (All 15 lessons)
  // -------------------------------------------------------------
  console.log('\n--- 2. Auditing HSK 2 Workbook Data (src/data/hsk2WorkbookData.ts) ---');
  assert(
    HSK2_WORKBOOK_LESSONS.length === 15,
    'HSK2_WORKBOOK_LESSONS must have exactly 15 lessons',
    { count: HSK2_WORKBOOK_LESSONS.length }
  );

  for (let i = 1; i <= 15; i++) {
    const l = HSK2_WORKBOOK_LESSONS.find((lesson) => lesson.lessonNumber === i);
    assert(!!l, `HSK 2 Lesson ${i} must exist`);
    if (!l) continue;

    // radicals (>= 2)
    const radicalsCount = l.hanziSection?.radicals?.length || 0;
    assert(
      radicalsCount >= 2,
      `HSK 2 Lesson ${i} must have radicals >= 2`,
      { radicalsCount }
    );

    // copyWords (>= 4)
    const copyWordsCount = l.hanziSection?.copyWords?.length || 0;
    assert(
      copyWordsCount >= 4,
      `HSK 2 Lesson ${i} must have copyWords >= 4`,
      { copyWordsCount }
    );

    // baseWords (>= 6)
    const baseWordsCount = l.wordExpansion?.baseWords?.length || 0;
    assert(
      baseWordsCount >= 6,
      `HSK 2 Lesson ${i} must have baseWords >= 6`,
      { baseWordsCount }
    );

    // compounds (>= 3)
    const compoundsCount = l.wordExpansion?.compounds?.length || 0;
    assert(
      compoundsCount >= 3,
      `HSK 2 Lesson ${i} must have compounds >= 3`,
      { compoundsCount }
    );

    // fillInBlanks (>= 3)
    const fibCount = (l.wordExpansion?.exercises || (l.wordExpansion as any)?.fillInBlanks || []).length;
    assert(
      fibCount >= 3,
      `HSK 2 Lesson ${i} must have fillInBlanks >= 3`,
      { fibCount }
    );

    // mock listening (10)
    const mockListeningCount = l.listeningExercises?.length || 0;
    assert(
      mockListeningCount === 10,
      `HSK 2 Lesson ${i} must have mock listening === 10`,
      { mockListeningCount }
    );

    // mock reading (14)
    const mockReadingCount = l.readingExercises?.length || 0;
    assert(
      mockReadingCount === 14,
      `HSK 2 Lesson ${i} must have mock reading === 14`,
      { mockReadingCount }
    );

    // mock writing (6)
    const mockWritingCount = l.writingExercises?.length || 0;
    assert(
      mockWritingCount === 6,
      `HSK 2 Lesson ${i} must have mock writing === 6`,
      { mockWritingCount }
    );

    // Total mock drill questions = 10 + 14 + 6 = 30
    const totalMock = mockListeningCount + mockReadingCount + mockWritingCount;
    assert(
      totalMock === 30,
      `HSK 2 Lesson ${i} must have 30 total mock drill questions`,
      { totalMock }
    );

    // Check writing exercise breakdown: Q25-27 部件组字, Q28-30 看拼音写汉字
    const writing = l.writingExercises || [];
    const part1Writing = writing.filter((w) => w.part === 1 || w.questionNumber <= 27);
    const part2Writing = writing.filter((w) => w.part === 2 || w.questionNumber >= 28);
    assert(part1Writing.length === 3, `HSK 2 Lesson ${i} writing has 3 部件组字 questions`);
    assert(part2Writing.length === 3, `HSK 2 Lesson ${i} writing has 3 看拼音写汉字 questions`);

    part1Writing.forEach((w) => {
      assert(!!w.correctAnswer, `HSK 2 L${i} 部件组字 Q${w.questionNumber} has correctAnswer`);
      assert(!!w.hanzi || !!w.correctAnswer, `HSK 2 L${i} 部件组字 Q${w.questionNumber} has target hanzi`);
    });

    part2Writing.forEach((w) => {
      assert(!!w.correctAnswer, `HSK 2 L${i} 拼音写汉字 Q${w.questionNumber} has correctAnswer`);
      assert(!!w.pinyinGuide, `HSK 2 L${i} 拼音写汉字 Q${w.questionNumber} has pinyinGuide`);
      assert(!!w.sentenceContext, `HSK 2 L${i} 拼音写汉字 Q${w.questionNumber} has sentenceContext`);
    });
  }

  // -------------------------------------------------------------
  // 3. ENRICHMENT ENGINE STRESS TEST across HSK 1-6 & Lessons 1-15
  // -------------------------------------------------------------
  console.log('\n--- 3. Stress-testing getEnrichedWorkbookLesson across all levels (1-6) and lessons (1-15) ---');

  for (let level = 1; level <= 6; level++) {
    for (let lessonNum = 1; lessonNum <= 15; lessonNum++) {
      let enriched: EnrichedWorkbookLesson;
      try {
        enriched = getEnrichedWorkbookLesson(level, lessonNum);
      } catch (err: any) {
        assert(false, `getEnrichedWorkbookLesson(${level}, ${lessonNum}) threw exception: ${err.message}`);
        continue;
      }

      assert(!!enriched, `HSK ${level} Lesson ${lessonNum} returns truthy enriched object`);
      assert(enriched.lessonNumber === lessonNum, `HSK ${level} L${lessonNum} has matching lessonNumber`);
      assert(typeof enriched.titleChinese === 'string' && enriched.titleChinese.length > 0, `HSK ${level} L${lessonNum} has titleChinese`);
      assert(typeof enriched.titleVietnamese === 'string' && enriched.titleVietnamese.length > 0, `HSK ${level} L${lessonNum} has titleVietnamese`);

      // Zero undefined required fields
      const missingKeys = checkUndefinedFields(enriched);
      assert(
        missingKeys.length === 0,
        `HSK ${level} L${lessonNum} must have zero undefined top-level fields`,
        { missingKeys }
      );

      // Zero NaN values in the entire JSON tree
      const nanPaths = findNaNValues(enriched);
      assert(
        nanPaths.length === 0,
        `HSK ${level} L${lessonNum} must contain zero NaN values`,
        { nanPaths }
      );

      // Section invariants
      assert(
        enriched.listeningExercises.length >= 3,
        `HSK ${level} L${lessonNum} listeningExercises.length >= 3`,
        { count: enriched.listeningExercises.length }
      );
      assert(
        enriched.readingExercises.length >= 3,
        `HSK ${level} L${lessonNum} readingExercises.length >= 3`,
        { count: enriched.readingExercises.length }
      );
      assert(
        enriched.listenAndReadDrills.length >= 2,
        `HSK ${level} L${lessonNum} listenAndReadDrills.length >= 2`,
        { count: enriched.listenAndReadDrills.length }
      );
      assert(
        enriched.wordExpansion.fillInBlanks.length >= 3,
        `HSK ${level} L${lessonNum} wordExpansion.fillInBlanks.length >= 3`,
        { count: enriched.wordExpansion.fillInBlanks.length }
      );
      assert(
        enriched.writingExercises.length >= 2,
        `HSK ${level} L${lessonNum} writingExercises.length >= 2`,
        { count: enriched.writingExercises.length }
      );
    }
  }

  // -------------------------------------------------------------
  // 3.1 Boundary & Adversarial Inputs for getEnrichedWorkbookLesson
  // -------------------------------------------------------------
  console.log('\n--- 3.1 Boundary & Adversarial Inputs Challenge ---');
  const boundaryCases = [
    { level: 0, lesson: 1, desc: 'level 0' },
    { level: 7, lesson: 1, desc: 'level 7' },
    { level: -1, lesson: 5, desc: 'negative level' },
    { level: 1, lesson: 0, desc: 'lesson 0' },
    { level: 2, lesson: 16, desc: 'lesson 16' },
    { level: 3, lesson: 99, desc: 'lesson 99' },
    { level: 4, lesson: -5, desc: 'negative lesson' },
  ];

  for (const b of boundaryCases) {
    try {
      const res = getEnrichedWorkbookLesson(b.level, b.lesson);
      assert(!!res, `Boundary case [${b.desc}] (level ${b.level}, lesson ${b.lesson}) handled without crash`);
      assert(typeof res.titleChinese === 'string', `Boundary case [${b.desc}] produces valid titleChinese`);
      const nanPaths = findNaNValues(res);
      assert(nanPaths.length === 0, `Boundary case [${b.desc}] produces zero NaN values`, { nanPaths });
    } catch (err: any) {
      assert(false, `Boundary case [${b.desc}] caused crash: ${err.message}`);
    }
  }

  // -------------------------------------------------------------
  // 4. DATABASE INTEGRITY SHA-256 HASH VERIFICATION
  // -------------------------------------------------------------
  console.log('\n--- 4. Checking data/hsk_exam.db SHA-256 Hash ---');
  const dbPath = path.resolve(process.cwd(), 'data/hsk_exam.db');
  assert(fs.existsSync(dbPath), 'data/hsk_exam.db must exist on disk');

  const dbBuffer = fs.readFileSync(dbPath);
  const actualHash = crypto.createHash('sha256').update(dbBuffer).digest('hex').toUpperCase();
  const EXPECTED_HASH = 'DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1';

  assert(
    actualHash === EXPECTED_HASH,
    'data/hsk_exam.db SHA-256 hash must exactly match EXPECTED_HASH',
    { expected: EXPECTED_HASH, actual: actualHash }
  );

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`VERIFICATION SUMMARY: ${passedAssertions}/${totalAssertions} ASSERTIONS PASSED`);
  if (failedAssertions > 0) {
    console.log(`FAILED ASSERTIONS: ${failedAssertions}`);
    failureLog.forEach((f) => console.log('  ', f));
    process.exit(1);
  } else {
    console.log('ALL EMPIRICAL ASSERTIONS PASSED WITH ZERO FAILURES! (VERDICT: APPROVE)');
    console.log('================================================================');
  }
}

runAdversarialVerification().catch((e) => {
  console.error('FATAL UNCAUGHT ERROR:', e);
  process.exit(1);
});
