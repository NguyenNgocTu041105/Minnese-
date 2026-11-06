/**
 * Empirical Adversarial Stress Test: UI & Student Flow Integration
 *
 * Suites:
 * 1. AIExamStudio Mapping Rules & Edge Cases (stem fallback, string answer_idx, empty explanation, custom skills, code format)
 * 2. AIExamStudio Step 8 Preview Grading (strict equality vs string answer_idx)
 * 3. Firestore & LocalStorage Persistence, Deduplication & Cache Merge
 * 4. OnlineExamRunner Scoring Algorithm & Dual-Schema Fallback
 * 5. QuizzesView HSK 1-6 Level Filtering & Exam Code Lookup
 * 6. Global Navigation Event Dispatch & Payload Handling
 */

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];
let currentSuite = 'General';

function setSuite(name: string) {
  currentSuite = name;
  console.log(`\n================================================================`);
  console.log(` SUITE: ${name}`);
  console.log(`================================================================`);
}

function assert(condition: boolean, name: string, details?: string) {
  if (condition) {
    results.push({ suite: currentSuite, name, passed: true, details });
    console.log(`  [PASS] ${name}${details ? ' (' + details + ')' : ''}`);
  } else {
    results.push({ suite: currentSuite, name, passed: false, details });
    console.error(`  [FAIL] ${name}${details ? ' - ' + details : ''}`);
  }
}

// ---------------------------------------------------------------------------
// SUITE 1: AIExamStudio Mapping Rules & Edge Cases
// ---------------------------------------------------------------------------
setSuite('1. AIExamStudio Mapping Rules & Edge Cases');

interface StudioQuestion {
  id: string;
  stem: string;
  options: string[];
  answer_idx: any;
  explanation_vi: string;
  skill: string;
  level: number;
}

function mapStudioQuestionsToQuizQuestions(questions: StudioQuestion[], level: number) {
  return questions.map((q, idx) => ({
    id: q.id || `q_${Date.now()}_${idx + 1}`,
    prompt: q.stem || ('Câu hỏi số ' + (idx + 1)),
    questionChinese: q.stem,
    options: q.options,
    correctAnswer: (q.options && q.options[q.answer_idx]) || (q.options && q.options[0]) || '',
    explanation: q.explanation_vi || '',
    type: q.skill === 'listening' ? 'listening' : q.skill === 'writing' ? 'writing' : 'fill_blank',
    hskLevel: level,
  }));
}

// Standard mapping
const qStandard: StudioQuestion = {
  id: 'std_1',
  stem: '你好吗？',
  options: ['我很好', '谢谢', '再见', '对不起'],
  answer_idx: 0,
  explanation_vi: 'Chào hỏi cơ bản',
  skill: 'reading',
  level: 1,
};
const mappedStandard = mapStudioQuestionsToQuizQuestions([qStandard], 1)[0];
assert(mappedStandard.prompt === '你好吗？', 'Standard question preserves prompt from stem');
assert(mappedStandard.questionChinese === '你好吗？', 'Standard question preserves questionChinese from stem');
assert(mappedStandard.correctAnswer === '我很好', 'Standard question maps answer_idx 0 to options[0]');
assert(mappedStandard.explanation === 'Chào hỏi cơ bản', 'Standard question maps explanation_vi to explanation');
assert(mappedStandard.type === 'fill_blank', 'Skill reading maps to fill_blank');

// Edge case 1: Missing stem
const qMissingStem: StudioQuestion = {
  id: 'edge_stem',
  stem: '',
  options: ['A', 'B', 'C', 'D'],
  answer_idx: 1,
  explanation_vi: 'Giải thích',
  skill: 'reading',
  level: 1,
};
const mappedMissingStem = mapStudioQuestionsToQuizQuestions([qMissingStem], 1)[0];
assert(mappedMissingStem.prompt === 'Câu hỏi số 1', 'Missing stem falls back to "Câu hỏi số 1"');
assert(mappedMissingStem.questionChinese === '', 'Missing stem has empty questionChinese');
assert(mappedMissingStem.correctAnswer === 'B', 'Missing stem still resolves correct answer');

// Edge case 2: answer_idx as numeric string "2"
const qStringIdx: StudioQuestion = {
  id: 'edge_str_idx',
  stem: 'Stem',
  options: ['Opt0', 'Opt1', 'Opt2', 'Opt3'],
  answer_idx: '2',
  explanation_vi: 'Giải thích',
  skill: 'listening',
  level: 1,
};
const mappedStringIdx = mapStudioQuestionsToQuizQuestions([qStringIdx], 1)[0];
assert(mappedStringIdx.correctAnswer === 'Opt2', 'Numeric string answer_idx ("2") maps to options[2]');
assert(mappedStringIdx.type === 'listening', 'Skill listening maps to type listening');

// Edge case 3: answer_idx out of bounds
const qOutOfBounds: StudioQuestion = {
  id: 'edge_oob',
  stem: 'Stem',
  options: ['Opt0', 'Opt1', 'Opt2', 'Opt3'],
  answer_idx: 99,
  explanation_vi: 'Giải thích',
  skill: 'writing',
  level: 1,
};
const mappedOOB = mapStudioQuestionsToQuizQuestions([qOutOfBounds], 1)[0];
assert(mappedOOB.correctAnswer === 'Opt0', 'Out-of-bounds answer_idx falls back to options[0]');
assert(mappedOOB.type === 'writing', 'Skill writing maps to type writing');

// Edge case 4: answer_idx as non-numeric string "B"
const qNonNumericIdx: StudioQuestion = {
  id: 'edge_non_num',
  stem: 'Stem',
  options: ['Opt0', 'Opt1', 'Opt2', 'Opt3'],
  answer_idx: 'B',
  explanation_vi: 'Giải thích',
  skill: 'grammar',
  level: 2,
};
const mappedNonNumericIdx = mapStudioQuestionsToQuizQuestions([qNonNumericIdx], 2)[0];
assert(mappedNonNumericIdx.correctAnswer === 'Opt0', 'Non-numeric string answer_idx falls back to options[0]');
assert(mappedNonNumericIdx.type === 'fill_blank', 'Custom skill grammar maps to fill_blank');

// Edge case 5: Empty explanation
const qEmptyExpl: StudioQuestion = {
  id: 'edge_no_expl',
  stem: 'Stem',
  options: ['Opt0'],
  answer_idx: 0,
  explanation_vi: '',
  skill: 'speaking',
  level: 3,
};
const mappedEmptyExpl = mapStudioQuestionsToQuizQuestions([qEmptyExpl], 3)[0];
assert(mappedEmptyExpl.explanation === '', 'Empty explanation_vi maps to empty string without crash');
assert(mappedEmptyExpl.type === 'fill_blank', 'Skill speaking maps to fill_blank');

// Edge case 6: Exam code generation regex
const generateExamCode = (lvl: number) =>
  `HSK${lvl}-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

for (let lvl = 1; lvl <= 6; lvl++) {
  const code = generateExamCode(lvl);
  const regex = new RegExp(`^HSK${lvl}-${new Date().getFullYear()}-[A-Z0-9]{4}$`);
  assert(regex.test(code), `Generated exam code for HSK ${lvl} matches expected format (${code})`);
}

// ---------------------------------------------------------------------------
// SUITE 2: AIExamStudio Step 8 Preview Grading Vulnerability Check
// ---------------------------------------------------------------------------
setSuite('2. AIExamStudio Step 8 Preview Grading Behavior');

// In AIExamStudio.tsx line 343-349:
// const handleSubmitPreviewExam = () => {
//   let correct = 0;
//   generatedQuestions.forEach((q, idx) => {
//     if (studentAnswers[idx] === q.answer_idx) {
//       correct++;
//     }
//   });
//   ...
// };
// where studentAnswers[idx] is recorded as a number (optIdx: 0..3).

const simulateStudioPreviewGrading = (questions: { answer_idx: any }[], selectedOptions: number[]) => {
  let correct = 0;
  questions.forEach((q, idx) => {
    if (selectedOptions[idx] === q.answer_idx) {
      correct++;
    }
  });
  return { correct, total: questions.length };
};

const previewWhenNumeric = simulateStudioPreviewGrading([{ answer_idx: 2 }], [2]);
assert(previewWhenNumeric.correct === 1, 'Step 8 preview scores 1/1 when answer_idx is number 2');

const previewWhenString = simulateStudioPreviewGrading([{ answer_idx: '2' }], [2]);
assert(
  previewWhenString.correct === 0,
  'EMPIRICAL FINDING: Step 8 preview scores 0/1 when answer_idx is string "2" due to strict equality (2 === "2" is false)',
  'Vulnerability documented: AIExamStudio.tsx line 346 uses strict equality studentAnswers[idx] === q.answer_idx'
);

// ---------------------------------------------------------------------------
// SUITE 3: Storage & Local Cache Simulation (Save, Deduplicate, Merge, Corrupt JSON)
// ---------------------------------------------------------------------------
setSuite('3. Storage & Cache Simulation (Dual-Write & Merge)');

class MockLocalStorage {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return key in this.store ? this.store[key] : null;
  }
  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  clear(): void {
    this.store = {};
  }
}

const mockStorage = new MockLocalStorage();

interface MockOnlineExamDoc {
  id: string;
  exam_code: string;
  title: string;
  hsk_level: number;
  duration_minutes: number;
  questions: any[];
  [key: string]: any;
}

// Logic replicate from firebase.ts saveOnlineExamToFirestore
function simulateSaveToLocalCache(exam: MockOnlineExamDoc, storage: MockLocalStorage) {
  try {
    const localExams: MockOnlineExamDoc[] = JSON.parse(storage.getItem('minnese_local_online_exams') || '[]');
    const filtered = localExams.filter((e) => e.id !== exam.id && e.exam_code !== exam.exam_code);
    filtered.unshift(exam);
    storage.setItem('minnese_local_online_exams', JSON.stringify(filtered.slice(0, 50)));
    return true;
  } catch (err) {
    return false;
  }
}

// Logic replicate from firebase.ts fetchOnlineExamsFromFirestore
function simulateFetchAndMergeExams(remoteDocs: MockOnlineExamDoc[], storage: MockLocalStorage) {
  const merged: MockOnlineExamDoc[] = [];
  const seenIds = new Set<string>();
  const seenCodes = new Set<string>();

  const addExam = (exam: MockOnlineExamDoc) => {
    if (!exam) return;
    const idKey = (exam.id || '').trim();
    const codeKey = (exam.exam_code || '').trim().toUpperCase();
    if (idKey && seenIds.has(idKey)) return;
    if (codeKey && seenCodes.has(codeKey)) return;
    if (idKey) seenIds.add(idKey);
    if (codeKey) seenCodes.add(codeKey);
    merged.push(exam);
  };

  remoteDocs.forEach((d) => addExam(d));

  try {
    const localExams: MockOnlineExamDoc[] = JSON.parse(storage.getItem('minnese_local_online_exams') || '[]');
    if (Array.isArray(localExams)) {
      localExams.forEach((e) => {
        if (e && (e.id || e.exam_code)) {
          addExam(e);
        }
      });
    }
  } catch (err) {
    // Graceful recovery
  }

  return merged;
}

// Logic replicate from firebase.ts getOnlineExamByCode
function simulateGetExamByCode(examCode: string, remoteDocs: MockOnlineExamDoc[], storage: MockLocalStorage) {
  const cleanCode = examCode.trim().toUpperCase();
  const remoteFound = remoteDocs.find((d) => (d.exam_code || '').trim().toUpperCase() === cleanCode);
  if (remoteFound) return remoteFound;

  try {
    const localExams: MockOnlineExamDoc[] = JSON.parse(storage.getItem('minnese_local_online_exams') || '[]');
    const localFound = localExams.find((e) => (e.exam_code || '').trim().toUpperCase() === cleanCode);
    if (localFound) return localFound;
  } catch (err) {}

  return null;
}

mockStorage.clear();
const examA: MockOnlineExamDoc = {
  id: 'exam_1',
  exam_code: 'HSK1-2026-AAAA',
  title: 'Đề thi 1',
  hsk_level: 1,
  duration_minutes: 40,
  questions: [{ id: 'q1', prompt: 'Q1' }],
};
simulateSaveToLocalCache(examA, mockStorage);

const rawStored = JSON.parse(mockStorage.getItem('minnese_local_online_exams') || '[]');
assert(rawStored.length === 1 && rawStored[0].id === 'exam_1', 'Exam saved to local cache');

// Test idempotency / deduplication by ID on save
const examAUpdated: MockOnlineExamDoc = {
  id: 'exam_1',
  exam_code: 'HSK1-2026-AAAA',
  title: 'Đề thi 1 Cập nhật',
  hsk_level: 1,
  duration_minutes: 40,
  questions: [{ id: 'q1', prompt: 'Q1 updated' }],
};
simulateSaveToLocalCache(examAUpdated, mockStorage);
const rawAfterUpdate = JSON.parse(mockStorage.getItem('minnese_local_online_exams') || '[]');
assert(rawAfterUpdate.length === 1 && rawAfterUpdate[0].title === 'Đề thi 1 Cập nhật', 'Updating exam with same ID does not duplicate');

// Test 50-item cap
for (let i = 2; i <= 60; i++) {
  simulateSaveToLocalCache(
    {
      id: `exam_${i}`,
      exam_code: `HSK1-2026-${String(i).padStart(4, '0')}`,
      title: `Exam ${i}`,
      hsk_level: 1,
      duration_minutes: 40,
      questions: [],
    },
    mockStorage
  );
}
const rawCapped = JSON.parse(mockStorage.getItem('minnese_local_online_exams') || '[]');
assert(rawCapped.length === 50, `Local cache adheres strictly to 50 items cap (actual: ${rawCapped.length})`);
assert(rawCapped[0].id === 'exam_60', 'Latest saved exam is at the head (unshift behavior)');

// Test Remote + Local Merge with Deduplication
mockStorage.clear();
const localOnly: MockOnlineExamDoc = {
  id: 'local_1',
  exam_code: 'HSK2-2026-LOCL',
  title: 'Local Exam',
  hsk_level: 2,
  duration_minutes: 50,
  questions: [],
};
const localDuplicate: MockOnlineExamDoc = {
  id: 'remote_1',
  exam_code: 'hsk1-2026-remt', // lowercase variant
  title: 'Duplicate from local',
  hsk_level: 1,
  duration_minutes: 40,
  questions: [],
};
simulateSaveToLocalCache(localOnly, mockStorage);
simulateSaveToLocalCache(localDuplicate, mockStorage);

const remoteDocs: MockOnlineExamDoc[] = [
  {
    id: 'remote_1',
    exam_code: 'HSK1-2026-REMT',
    title: 'Remote Exam',
    hsk_level: 1,
    duration_minutes: 40,
    questions: [],
  },
  {
    id: 'remote_2',
    exam_code: 'HSK3-2026-REM3',
    title: 'Remote Exam 3',
    hsk_level: 3,
    duration_minutes: 60,
    questions: [],
  },
];

const merged = simulateFetchAndMergeExams(remoteDocs, mockStorage);
assert(merged.length === 3, `Merged remote (2) + local (2 with 1 duplicate) yields exactly 3 unique exams (actual: ${merged.length})`);
assert(merged.find((e) => e.exam_code === 'HSK2-2026-LOCL') !== undefined, 'Local-only exam preserved in merged list');
assert(merged.find((e) => e.id === 'remote_1')?.title === 'Remote Exam', 'Remote version takes precedence over local duplicate');

// Test Corrupted JSON in localStorage
mockStorage.setItem('minnese_local_online_exams', '{invalid-json:');
const mergedCorrupt = simulateFetchAndMergeExams(remoteDocs, mockStorage);
assert(mergedCorrupt.length === 2, 'Corrupted JSON in localStorage handled gracefully without throw');

// Test Exam Code Lookup
mockStorage.clear();
simulateSaveToLocalCache(localOnly, mockStorage);

const foundExact = simulateGetExamByCode('HSK2-2026-LOCL', remoteDocs, mockStorage);
assert(foundExact?.id === 'local_1', 'Exam lookup succeeds with exact uppercase code');

const foundLowercase = simulateGetExamByCode('hsk2-2026-locl', remoteDocs, mockStorage);
assert(foundLowercase?.id === 'local_1', 'Exam lookup succeeds with lowercase code');

const foundSpaces = simulateGetExamByCode('   hsk2-2026-locl   ', remoteDocs, mockStorage);
assert(foundSpaces?.id === 'local_1', 'Exam lookup succeeds with leading/trailing spaces');

const notFound = simulateGetExamByCode('NON-EXISTENT', remoteDocs, mockStorage);
assert(notFound === null, 'Exam lookup returns null for non-existent code');

// ---------------------------------------------------------------------------
// SUITE 4: OnlineExamRunner Scoring Algorithm & Dual-Schema Fallback
// ---------------------------------------------------------------------------
setSuite('4. OnlineExamRunner Scoring Algorithm & Dual-Schema Fallback');

const isAnswerMatch = (userAns: string | undefined, correctAns: string | string[]): boolean => {
  if (!userAns) return false;
  const clean = userAns.trim().toLowerCase();
  if (typeof correctAns === 'string') {
    return clean === correctAns.trim().toLowerCase();
  }
  if (Array.isArray(correctAns)) {
    return correctAns.some((c) => c.trim().toLowerCase() === clean);
  }
  return false;
};

function runScoringAlgorithm(questions: any[], userAnswers: Record<number, string>) {
  let correct = 0;
  questions.forEach((q, idx) => {
    const ans = userAnswers[idx];
    if (q.type === 'writing') {
      try {
        if (ans) {
          const parsed = JSON.parse(ans);
          if (parsed && typeof parsed.score === 'number') {
            correct += parsed.score / 100;
          } else {
            correct += 0.8;
          }
        }
      } catch (e) {
        correct += 0.5;
      }
    } else {
      const correctAns =
        q.correctAnswer ??
        (typeof (q as any).answer_idx === 'number' && (q.options || (q as any).options)?.[(q as any).answer_idx]
          ? (q.options || (q as any).options)[(q as any).answer_idx]
          : '');
      if (isAnswerMatch(ans, correctAns)) {
        correct++;
      }
    }
  });

  const roundedCorrect = Math.round(correct * 10) / 10;
  const percent = Math.round((correct / questions.length) * 100);
  const xp = Math.round(correct * 10) + (percent >= 80 ? 30 : 10);

  return { correctCount: roundedCorrect, percent, xp };
}

// Test 4.1: 100% correct answers with QuizQuestion format
const questions10: any[] = [
  { prompt: 'Q1', options: ['A', 'B', 'C', 'D'], correctAnswer: 'A', type: 'fill_blank' },
  { prompt: 'Q2', options: ['A', 'B', 'C', 'D'], correctAnswer: 'B', type: 'fill_blank' },
  { prompt: 'Q3', options: ['A', 'B', 'C', 'D'], correctAnswer: 'C', type: 'fill_blank' },
  { prompt: 'Q4', options: ['A', 'B', 'C', 'D'], correctAnswer: 'D', type: 'fill_blank' },
  { prompt: 'Q5', options: ['A', 'B', 'C', 'D'], correctAnswer: 'A', type: 'listening' },
  { prompt: 'Q6', options: ['A', 'B', 'C', 'D'], correctAnswer: 'B', type: 'listening' },
  { prompt: 'Q7', options: ['A', 'B', 'C', 'D'], correctAnswer: 'C', type: 'reading' },
  { prompt: 'Q8', options: ['A', 'B', 'C', 'D'], correctAnswer: 'D', type: 'reading' },
  { prompt: 'Q9', options: ['A', 'B', 'C', 'D'], correctAnswer: 'A', type: 'fill_blank' },
  { prompt: 'Q10', options: ['A', 'B', 'C', 'D'], correctAnswer: 'B', type: 'fill_blank' },
];

const allCorrectAnswers: Record<number, string> = {
  0: 'A',
  1: 'B',
  2: 'C',
  3: 'D',
  4: 'A',
  5: 'B',
  6: 'C',
  7: 'D',
  8: 'A',
  9: 'B',
};

const res100 = runScoringAlgorithm(questions10, allCorrectAnswers);
assert(res100.correctCount === 10, '10/10 questions scored correctly');
assert(res100.percent === 100, 'Score is 100% (NOT 0%)');
assert(res100.xp === 130, 'XP is 130 (100 base + 30 bonus for >= 80%)');

// Test 4.2: Partial answers (7/10)
const partialAnswers: Record<number, string> = {
  0: 'A',
  1: 'B',
  2: 'C',
  3: 'D',
  4: 'A',
  5: 'B',
  6: 'C',
  7: 'WRONG',
  8: 'WRONG',
  9: 'WRONG',
};
const res70 = runScoringAlgorithm(questions10, partialAnswers);
assert(res70.correctCount === 7, '7/10 questions scored correctly');
assert(res70.percent === 70, 'Score is 70%');
assert(res70.xp === 80, 'XP is 80 (70 base + 10 standard bonus for < 80%)');

// Test 4.3: 0% correct answers
const res0 = runScoringAlgorithm(questions10, {});
assert(res0.correctCount === 0, '0/10 questions scored when no answers provided');
assert(res0.percent === 0, 'Score is 0%');
assert(res0.xp === 10, 'XP is 10 baseline');

// Test 4.4: Dual-schema fallback in OnlineExamRunner (StudioQuestion without correctAnswer)
const rawStudioQuestions: any[] = [
  { stem: 'S1', options: ['Alpha', 'Beta', 'Gamma'], answer_idx: 1 }, // numeric index
  { stem: 'S2', options: ['One', 'Two', 'Three'], answer_idx: 0 },
];
const studioAnswers: Record<number, string> = {
  0: 'Beta',
  1: 'One',
};
const resStudio = runScoringAlgorithm(rawStudioQuestions, studioAnswers);
assert(resStudio.correctCount === 2, 'Raw StudioQuestion with numeric answer_idx grades correctly via fallback');
assert(resStudio.percent === 100, 'Raw StudioQuestion scores 100%');

// Test 4.5: Edge Case - Raw StudioQuestion with string answer_idx ("1")
const rawStudioStringIdx: any[] = [
  { stem: 'S1', options: ['Alpha', 'Beta', 'Gamma'], answer_idx: '1' }, // string index!
];
const resStudioStr = runScoringAlgorithm(rawStudioStringIdx, { 0: 'Beta' });
assert(
  resStudioStr.percent === 0,
  'EMPIRICAL FINDING: Unmapped StudioQuestion with string answer_idx ("1") evaluates to 0% because typeof "1" !== "number"',
  'Shows why AIExamStudio mapping step (mapping to QuizQuestion.correctAnswer) is essential'
);

// Test 4.6: Mapped StudioQuestion with string answer_idx ("1") through AIExamStudio mapping
const mappedFromStr = mapStudioQuestionsToQuizQuestions(
  [
    {
      id: 'm1',
      stem: 'S1',
      options: ['Alpha', 'Beta', 'Gamma'],
      answer_idx: '1',
      explanation_vi: 'Exp',
      skill: 'reading',
      level: 1,
    },
  ],
  1
);
const resMappedStr = runScoringAlgorithm(mappedFromStr, { 0: 'Beta' });
assert(resMappedStr.percent === 100, 'Mapped question from string answer_idx scores 100% in OnlineExamRunner');

// Test 4.7: Whitespace & case insensitivity
const whitespaceQ: any[] = [
  { prompt: 'Q', options: [' Option A '], correctAnswer: 'option a', type: 'fill_blank' },
];
const resWs = runScoringAlgorithm(whitespaceQ, { 0: ' OPTION A ' });
assert(resWs.percent === 100, 'Answer match is insensitive to whitespace and casing');

// Test 4.8: Writing workspace scoring
const writingQ: any[] = [
  { prompt: 'Viết câu', type: 'writing' },
  { prompt: 'Viết đoạn văn', type: 'writing' },
];
const writingAns: Record<number, string> = {
  0: JSON.stringify({ score: 90, feedback: 'Tốt' }), // JSON with score: 90/100 -> 0.9
  1: 'raw text submission',                           // Non-JSON string throws SyntaxError -> catch branch adds 0.5
};
const resWriting = runScoringAlgorithm(writingQ, writingAns);
assert(resWriting.correctCount === 1.4, `Writing answers score properly (0.9 for score JSON + 0.5 for non-JSON catch fallback = 1.4, actual: ${resWriting.correctCount})`);


// Test 4.9: Rendering fallbacks audit
const renderFallbackAudit = (q: any, idx: number) => {
  const prompt = q.prompt || q.stem || `Câu hỏi ${idx + 1}`;
  const chinese = q.questionChinese || q.stem;
  const explanation = q.explanation || q.explanation_vi;
  return { prompt, chinese, explanation };
};

const renderTest1 = renderFallbackAudit({ stem: 'Chữ Hán', explanation_vi: 'Giải thích' }, 0);
assert(renderTest1.prompt === 'Chữ Hán', 'Prompt falls back to stem');
assert(renderTest1.chinese === 'Chữ Hán', 'questionChinese falls back to stem');
assert(renderTest1.explanation === 'Giải thích', 'Explanation falls back to explanation_vi');

const renderTest2 = renderFallbackAudit({}, 4);
assert(renderTest2.prompt === 'Câu hỏi 5', 'Empty question prompt falls back to "Câu hỏi 5"');
assert(renderTest2.chinese === undefined, 'Empty question chinese is undefined without error');

// ---------------------------------------------------------------------------
// SUITE 5: QuizzesView Level Filtering across HSK 1 to 6 & Code Lookup
// ---------------------------------------------------------------------------
setSuite('5. QuizzesView HSK 1-6 Level Filtering & Exam Code Lookup');

const sampleExams: any[] = [
  { id: 'ex_1', exam_code: 'HSK1-2026-0001', hsk_level: 1, title: 'HSK 1 Standard' },
  { id: 'ex_2', exam_code: 'HSK2-2026-0002', hsk_level: 2, title: 'HSK 2 Standard' },
  { id: 'ex_3', exam_code: 'HSK3-2026-0003', hsk_level: 3, title: 'HSK 3 Standard' },
  { id: 'ex_4', exam_code: 'HSK4-2026-0004', hsk_level: 4, title: 'HSK 4 Standard' },
  { id: 'ex_5', exam_code: 'HSK5-2026-0005', hsk_level: 5, title: 'HSK 5 Standard' },
  { id: 'ex_6', exam_code: 'HSK6-2026-0006', hsk_level: 6, title: 'HSK 6 Standard' },
  { id: 'ex_legacy', exam_code: 'HSK3-2026-LEG3', level: 3, title: 'HSK 3 Legacy' }, // only level, no hsk_level
];

// Logic from QuizzesView.tsx lines 49-55
function filterExamsByLevel(exams: any[], selectedLevel: number | 'all') {
  if (selectedLevel === 'all') return exams;
  return exams.filter((exam) => {
    const lvl = exam.hsk_level ?? exam.level;
    return lvl === selectedLevel;
  });
}

const allFiltered = filterExamsByLevel(sampleExams, 'all');
assert(allFiltered.length === 7, 'Filter "all" returns all 7 exams');

for (let lvl = 1; lvl <= 6; lvl++) {
  const filtered = filterExamsByLevel(sampleExams, lvl);
  if (lvl === 3) {
    assert(
      filtered.length === 2 && filtered.every((e) => (e.hsk_level ?? e.level) === 3),
      `Filter HSK 3 returns both standard and legacy level 3 exams (count: ${filtered.length})`
    );
  } else {
    assert(
      filtered.length === 1 && (filtered[0].hsk_level ?? filtered[0].level) === lvl,
      `Filter HSK ${lvl} returns exactly the HSK ${lvl} exam`
    );
  }
}

// Edge case: string level vs number level
const stringLevelExams = [
  { id: 'str_1', exam_code: 'HSK1-STR', hsk_level: '1' }, // string '1'
];
const filteredStrLvl = filterExamsByLevel(stringLevelExams, 1);
assert(
  filteredStrLvl.length === 0,
  'EMPIRICAL FINDING: QuizzesView filter uses strict equality `lvl === selectedExamLevel` which rejects string level ("1" === 1 is false)',
  'Vulnerability documented: If an exam has string hsk_level, it will not appear under HSK 1 filter'
);

// Form submit lookup simulation from QuizzesView lines 141-158
function simulateLookupFormSubmit(input: string, exams: any[]) {
  const trimmed = input.trim().toUpperCase();
  if (!trimmed) return { error: null, exam: null };
  const found = exams.find((e) => (e.exam_code || '').trim().toUpperCase() === trimmed);
  if (found) {
    return { error: null, exam: found };
  } else {
    return {
      error: `Không tìm thấy đề thi với mã "${trimmed}". Vui lòng kiểm tra lại mã do giáo viên cung cấp.`,
      exam: null,
    };
  }
}

const lookupSuccess = simulateLookupFormSubmit('  hsk1-2026-0001  ', sampleExams);
assert(lookupSuccess.exam?.id === 'ex_1' && lookupSuccess.error === null, 'Lookup form submit finds exam with whitespace/casing');

const lookupFail = simulateLookupFormSubmit('HSK1-INVALID-CODE', sampleExams);
assert(
  lookupFail.exam === null && lookupFail.error?.includes('Không tìm thấy đề thi với mã "HSK1-INVALID-CODE"'),
  'Lookup form submit sets friendly error message for invalid exam code'
);

// ---------------------------------------------------------------------------
// SUITE 6: Global Navigation Event Dispatch & Payload Handling
// ---------------------------------------------------------------------------
setSuite('6. Global Navigation Event Dispatch & Reception');

interface MockEventTarget {
  listeners: Record<string, ((e: any) => void)[]>;
  addEventListener(event: string, handler: (e: any) => void): void;
  removeEventListener(event: string, handler: (e: any) => void): void;
  dispatchEvent(event: { type: string; detail?: any }): boolean;
}

const mockWindow: MockEventTarget = {
  listeners: {},
  addEventListener(type, fn) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(fn);
  },
  removeEventListener(type, fn) {
    if (!this.listeners[type]) return;
    this.listeners[type] = this.listeners[type].filter((f) => f !== fn);
  },
  dispatchEvent(event) {
    const list = this.listeners[event.type] || [];
    list.forEach((fn) => fn(event));
    return true;
  },
};

let activeTabState = 'admin';
let activeRunningExam: any = null;

// App.tsx listeners
mockWindow.addEventListener('minnie_switch_tab', (e: any) => {
  if (e.detail?.tab) {
    activeTabState = e.detail.tab;
  }
});

mockWindow.addEventListener('minnie_launch_exam', (e: any) => {
  if (e.detail?.exam) {
    activeRunningExam = e.detail.exam;
  }
});

// Simulate Step 8 button click in AIExamStudio
const testExamDoc = { id: 'exam_nav_test', exam_code: 'HSK1-2026-TEST', title: 'Nav Test Exam' };
mockWindow.dispatchEvent({ type: 'minnie_switch_tab', detail: { tab: 'quizzes' } });
mockWindow.dispatchEvent({ type: 'minnie_launch_exam', detail: { exam: testExamDoc } });

assert(activeTabState === 'quizzes', 'minnie_switch_tab switches activeTabState to "quizzes"');
assert(activeRunningExam?.id === 'exam_nav_test', 'minnie_launch_exam receives and mounts exam payload');

// ---------------------------------------------------------------------------
// SUMMARY & VERDICT
// ---------------------------------------------------------------------------
console.log(`\n================================================================`);
console.log(` EMPIRICAL VERIFICATION SUMMARY`);
console.log(`================================================================`);

const totalTests = results.length;
const passedTests = results.filter((r) => r.passed).length;
const failedTests = results.filter((r) => !r.passed).length;

console.log(`Total assertions: ${totalTests}`);
console.log(`Passed:           ${passedTests}`);
console.log(`Failed:           ${failedTests}`);

if (failedTests > 0) {
  console.error(`\nFAILED TESTS:`);
  results
    .filter((r) => !r.passed)
    .forEach((r) => {
      console.error(`- [${r.suite}] ${r.name}: ${r.details || ''}`);
    });
}

console.log(`\nVerification complete.\n`);
