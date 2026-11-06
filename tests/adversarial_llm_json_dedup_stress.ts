/**
 * Adversarial Stress Test Suite for Minnese QBank (AC2, AC3, AC5)
 *
 * Executed by: challenger_14_1
 * Purpose: Empirical verification of:
 *   1. AC2: Exhausted/disabled LLM providers fail gracefully (exit code 1, 0 DB inserts, audit recorded)
 *   2. AC3: JSON Parser resilience against adversarial malformed payloads and self-repair recovery
 *   3. AC5: N-gram Jaccard similarity deduplication under stem variations (punctuation, blanks, subtle shifts)
 */

import { execSync } from 'child_process';
import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import {
  stripMarkdownCodeBlocks,
  removeTrailingCommas,
  robustJsonParse,
  normalizeQuestionAliases,
  normalizeQuestionList,
  parseWithSelfRepair,
} from '../src/server/llm/jsonParser.js';
import {
  calculateJaccardSimilarity,
  cleanChineseText,
  getCharNgrams,
  getComparableStem,
  validateCandidate,
  computeContentHash,
} from '../src/server/llm/questionValidator.js';
import { generateWaterfallQuestions } from '../src/server/llm/waterfallGenerator.js';

let passed = 0;
let failed = 0;
const failures: string[] = [];

function check(desc: string, condition: boolean, extraInfo?: string) {
  if (condition) {
    passed++;
    console.log(`  [PASS] ${desc}`);
  } else {
    failed++;
    const errMsg = `  [FAIL] ${desc}${extraInfo ? ` (${extraInfo})` : ''}`;
    console.error(errMsg);
    failures.push(errMsg);
  }
}

async function runAdversarialStressSuite() {
  console.log('======================================================================');
  console.log('    CHALLENGER EMPIRICAL ADVERSARIAL STRESS SUITE (AC2, AC3, AC5)     ');
  console.log('======================================================================\n');

  // =========================================================================
  // SECTION 1: STRESS TEST AC2 (ALL PROVIDERS FAIL / EXHAUSTED)
  // =========================================================================
  console.log('--- SECTION 1: STRESS TEST AC2 (All Providers Exhausted / Offline) ---');

  const dbPath = path.resolve(process.cwd(), 'data/qbank/qbank.db');
  const db = new DatabaseSync(dbPath);

  // 1.1 Baseline DB count
  const pendingBefore = (db.prepare('SELECT count(*) as c FROM pending_questions').get() as any).c;
  console.log(`  [Info] Baseline pending_questions row count: ${pendingBefore}`);

  // 1.2 In-process Waterfall Generator with provider='none'
  let waterfallExhaustedThrown = false;
  try {
    await generateWaterfallQuestions({
      level: 1,
      skill: 'reading',
      count: 1,
      provider: 'none',
      mock: false,
    });
  } catch (err: any) {
    if (err.message === 'LLM_ALL_PROVIDERS_EXHAUSTED') {
      waterfallExhaustedThrown = true;
    }
  }
  check(
    'generateWaterfallQuestions throws strictly LLM_ALL_PROVIDERS_EXHAUSTED when provider="none"',
    waterfallExhaustedThrown
  );

  // 1.3 CLI Invocation via child process: scripts/generate-questions.ts --level=1 --count=1 --provider=none
  let cliExitCode = 0;
  let cliStdout = '';
  let cliStderr = '';

  try {
    cliStdout = execSync('npx tsx scripts/generate-questions.ts --level=1 --count=1 --provider=none', {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (procErr: any) {
    cliExitCode = procErr.status ?? 1;
    cliStdout = procErr.stdout?.toString() || '';
    cliStderr = procErr.stderr?.toString() || '';
  }

  check(
    'CLI exits with non-zero exit code (1) when all providers exhausted',
    cliExitCode === 1,
    `actual exit code: ${cliExitCode}`
  );

  const combinedCliOutput = `${cliStdout}\n${cliStderr}`;
  check(
    'CLI logs clear LLM_ALL_PROVIDERS_EXHAUSTED banner',
    combinedCliOutput.includes('LLM_ALL_PROVIDERS_EXHAUSTED')
  );
  check(
    'CLI explicitly logs that 0 questions are inserted into pending_questions',
    combinedCliOutput.includes('KHÔNG chèn bất kỳ câu hỏi nào vào pending_questions')
  );

  // 1.4 Database Verification: 0 questions added
  const pendingAfter = (db.prepare('SELECT count(*) as c FROM pending_questions').get() as any).c;
  check(
    'pending_questions row count is 100% unchanged after exhausted run (0 added)',
    pendingAfter === pendingBefore,
    `before: ${pendingBefore}, after: ${pendingAfter}`
  );

  // 1.5 Database Audit Verification: generation_history & generation_runs record failed status
  const latestRun = db.prepare('SELECT * FROM generation_runs ORDER BY created_at DESC LIMIT 1').get() as any;
  check(
    'generation_runs recorded latest entry with status = "failed"',
    latestRun && latestRun.status === 'failed',
    `status: ${latestRun?.status}`
  );
  check(
    'generation_runs recorded count_saved_pending = 0 and count_generated = 0',
    latestRun && latestRun.count_saved_pending === 0 && latestRun.count_generated === 0
  );
  check(
    'generation_runs details contains LLM_ALL_PROVIDERS_EXHAUSTED error note',
    latestRun && String(latestRun.details).includes('LLM_ALL_PROVIDERS_EXHAUSTED')
  );

  const latestHist = db.prepare('SELECT * FROM generation_history ORDER BY created_at DESC LIMIT 1').get() as any;
  check(
    'generation_history recorded latest entry with status = "failed"',
    latestHist && latestHist.status === 'failed'
  );

  db.close();

  // =========================================================================
  // SECTION 2: STRESS TEST AC3 (JSON PARSER RESILIENCE & ADVERSARIAL PAYLOADS)
  // =========================================================================
  console.log('\n--- SECTION 2: STRESS TEST AC3 (JSON Parser Resilience) ---');

  // 2.1 Adversarial trailing commas in nested arrays and objects
  const payloadNestedTrailingCommas = `{
    "title": "HSK 1 Mock Test",
    "batch": {
      "level": 1,
      "skill": "reading",
    },
    "questions": [
      {
        "stem": "桌子上有三个新鲜的苹果。",
        "options": [
          "苹果",
          "香蕉",
          "西瓜",
          "米饭",
        ],
        "answer_idx": 0,
        "explanation_vi": "Trên bàn có 3 quả táo tươi.",
      },
    ],
  }`;

  const parsedNested = robustJsonParse(payloadNestedTrailingCommas);
  check(
    'robustJsonParse parses payload with multiple trailing commas in nested objects & arrays',
    parsedNested?.questions?.length === 1 && parsedNested.questions[0].options.length === 4
  );

  // 2.2 Consecutive commas inside array / object
  const cleanedCommas = removeTrailingCommas('{"items": [1, 2, 3, ], "meta": {"ok": true, }, }');
  check(
    'removeTrailingCommas removes commas before } and ] without syntax errors',
    JSON.parse(cleanedCommas).items.length === 3
  );

  // 2.3 Commas embedded inside Chinese strings MUST BE PRESERVED
  const payloadChineseCommas = `{
    "stem": "你好，世界，请问，图书馆在哪儿，谢谢，再见，",
    "options": [
      "好的，没问题，",
      "对不起，我不知道，",
      "不用谢，再见，",
      "太好了，谢谢你，",
    ],
    "answer_idx": 1,
    "explanation_vi": "Câu này chứa các dấu phẩy: 你好，世界，请问，giữ nguyên 100%.",
  }`;

  const parsedChineseCommas = robustJsonParse(payloadChineseCommas);
  check(
    'Chinese string commas (full-width ， and ASCII ,) inside string literals are 100% preserved',
    parsedChineseCommas.stem === '你好，世界，请问，图书馆在哪儿，谢谢，再见，' &&
    parsedChineseCommas.options[0] === '好的，没问题，' &&
    parsedChineseCommas.options[1] === '对不起，我不知道，'
  );

  // 2.4 Markdown code block variations
  const payloadBackticksCase1 = '````json\n[{"stem": "今天天气很好。"}]\n````';
  check(
    'stripMarkdownCodeBlocks handles 4-backtick ````json fences',
    stripMarkdownCodeBlocks(payloadBackticksCase1) === '[{"stem": "今天天气很好。"}]'
  );

  const payloadBackticksCase2 = '```JSON\n[{"stem": "昨天是星期日。"}]\n```';
  check(
    'stripMarkdownCodeBlocks handles uppercase ```JSON fences',
    stripMarkdownCodeBlocks(payloadBackticksCase2) === '[{"stem": "昨天是星期日。"}]'
  );

  const payloadSurroundingProse = `I have generated the HSK 1 questions for you as requested below:
\`\`\`json
[
  {
    "stem": "我想去中国旅游。",
    "options": ["中国", "日本", "英国", "美国"],
    "answer_idx": 0,
    "explanation_vi": "Du lịch Trung Quốc."
  }
]
\`\`\`
I hope this meets all your requirements!`;

  const parsedProse = robustJsonParse(payloadSurroundingProse);
  check(
    'robustJsonParse strips leading/trailing conversational prose around markdown fences',
    Array.isArray(parsedProse) && parsedProse[0].stem === '我想去中国旅游。'
  );

  // 2.5 Field alias variants normalization
  const aliasPayloads = [
    // Variant A: answer_index, explanation, theme
    {
      sentence: '外面正在下雨，我们坐____去火车站吧。',
      options: ['出租车', '自行车', '飞机', '火车'],
      answer_index: 0,
      explanation: 'Trời mưa đi taxi tiện nhất.',
      theme: 'taxi',
    },
    // Variant B: letter answer 'C', explanationVi, illustration
    {
      question: '桌子上有三个新鲜的____。',
      options: ['米饭', '西瓜', '苹果', '香蕉'],
      answer: 'C',
      explanationVi: 'Đáp án là quả táo ở vị trí C.',
      illustration: 'apple',
    },
    // Variant C: options as object { A, B, C, D }, numeric answer as string '1'
    {
      stem: '他身体不太舒服，要去____看医生。',
      options: { A: '商店', B: '医院', C: '机场', D: '学校' },
      answer: '1',
      explain: 'Khám bệnh đến bệnh viện.',
      illustration_theme: 'hospital',
    },
    // Variant D: pinyin_text provided directly
    {
      stem: '老师教学生写字。',
      options: ['写字', '唱歌', '跳舞', '跑步'],
      answer_idx: 0,
      explanation_vi: 'Viết chữ.',
      pinyin_text: 'lǎo shī jiào xué shēng xiě zì',
    },
  ];

  const normA = normalizeQuestionAliases(aliasPayloads[0], 1, 'reading');
  check(
    'Alias variant A: sentence -> stem, answer_index -> answer_idx (0), explanation -> explanation_vi, theme -> illustration_theme',
    normA?.stem === '外面正在下雨，我们坐____去火车站吧。' &&
    normA?.answer_idx === 0 &&
    normA?.explanation_vi === 'Trời mưa đi taxi tiện nhất.' &&
    normA?.illustration_theme === 'taxi'
  );

  const normB = normalizeQuestionAliases(aliasPayloads[1], 1, 'listening');
  check(
    'Alias variant B: question -> stem, letter "C" -> answer_idx 2, explanationVi -> explanation_vi, illustration -> illustration_theme',
    normB?.stem === '桌子上有三个新鲜的____。' &&
    normB?.answer_idx === 2 &&
    normB?.illustration_theme === 'apple'
  );

  const normC = normalizeQuestionAliases(aliasPayloads[2], 1, 'reading');
  check(
    'Alias variant C: options object -> array, string "1" -> answer_idx 1',
    Array.isArray(normC?.options) &&
    normC?.options.length === 4 &&
    normC?.options[1] === '医院' &&
    normC?.answer_idx === 1
  );

  const normD = normalizeQuestionAliases(aliasPayloads[3], 1, 'reading');
  check(
    'Alias variant D: pinyin_text -> pinyin preserved',
    normD?.pinyin === 'lǎo shī jiào xué shēng xiě zì'
  );

  // 2.6 Container format normalization
  const containerWrapped = {
    data: [
      {
        stem: '小猫在睡觉。',
        options: ['可爱', '难过', '漂亮', '高兴'],
        answer_idx: 0,
        explanation_vi: 'Mèo đáng yêu.',
      },
    ],
  };
  const listFromData = normalizeQuestionList(containerWrapped);
  check(
    'normalizeQuestionList extracts questions from { data: [...] } wrapper',
    listFromData.length === 1 && listFromData[0].stem === '小猫在睡觉。'
  );

  // 2.7 parseWithSelfRepair recovery
  const malformedTruncatedJson = `\`\`\`json
  [
    {
      "stem": "今天星期五，明天是____。",
      "options": ["星期六", "星期日", "星期一", "星期二"
  `; // Unfinished JSON

  let selfRepairInvoked = false;
  let receivedRepairPrompt = '';

  const repairOutput = await parseWithSelfRepair(
    malformedTruncatedJson,
    async (prompt) => {
      selfRepairInvoked = true;
      receivedRepairPrompt = prompt;
      // Simulate provider returning cleanly repaired JSON array
      return JSON.stringify([
        {
          stem: '今天星期五，明天是____。',
          options: ['星期六', '星期日', '星期一', '星期二'],
          answer_idx: 0,
          explanation_vi: 'Thứ Sáu thì ngày mai là Thứ Bảy (星期六).',
        },
      ]);
    },
    1,
    'reading'
  );

  check(
    'parseWithSelfRepair detects JSON syntax error and invokes 1-shot repair function',
    selfRepairInvoked
  );
  check(
    'Self-repair prompt includes detailed error message and previous raw output snippet',
    receivedRepairPrompt.includes('Parse Error') && receivedRepairPrompt.includes('今天星期五')
  );
  check(
    'parseWithSelfRepair successfully returns repaired candidate questions with repaired = true',
    repairOutput.repaired === true &&
    repairOutput.questions.length === 1 &&
    repairOutput.questions[0].options[0] === '星期六'
  );

  // Verify that if repairFn fails or is omitted, error is propagated
  let thrownWithoutRepair = false;
  try {
    await parseWithSelfRepair(malformedTruncatedJson, undefined);
  } catch {
    thrownWithoutRepair = true;
  }
  check('parseWithSelfRepair throws when repairFn is omitted on unrecoverable syntax', thrownWithoutRepair);

  // =========================================================================
  // SECTION 3: STRESS TEST AC5 (N-GRAM JACCARD SIMILARITY DEDUPLICATION)
  // =========================================================================
  console.log('\n--- SECTION 3: STRESS TEST AC5 (N-gram Jaccard Similarity Deduplication) ---');

  const baseStem = '今天天气很好，我想去学校借两本书。';
  const existingPool = [baseStem];

  // 3.1 100% Identical stem
  const qIdentical = {
    stem: '今天天气很好，我想去学校借两本书。',
    options: ['学校', '医院', '机场', '商店'],
    answer_idx: 0,
    explanation_vi: 'Ngữ cảnh mượn sách thì đến trường học.',
    level: 1,
    skill: 'reading' as const,
    part_type: 'read_fill_blank_4opt',
  };
  const valIdentical = validateCandidate(qIdentical, existingPool);
  check(
    '100% Identical stem is rejected by deduplication (>0.85 similarity)',
    !valIdentical.valid &&
    valIdentical.errors.some((e) => e.includes('exceeds 85% threshold')),
    `similarity: ${(valIdentical.jaccardSimilarity * 100).toFixed(1)}%`
  );

  // 3.2 Altered punctuation and whitespace
  const qPunctuation = {
    ...qIdentical,
    stem: '今天天气很好！ 我想去学校借两本书？！',
  };
  const valPunctuation = validateCandidate(qPunctuation, existingPool);
  check(
    'Stem with altered punctuation and spaces is rejected (>0.85 similarity)',
    !valPunctuation.valid &&
    valPunctuation.errors.some((e) => e.includes('exceeds 85% threshold')),
    `similarity: ${(valPunctuation.jaccardSimilarity * 100).toFixed(1)}%`
  );

  // 3.3 Blank placeholder variants: `___` vs `（ ）` vs `( )` vs `________`
  // Existing in pool is filled form: '今天天气很好，我想去学校借两本书。'
  const qBlankUnderline = {
    ...qIdentical,
    stem: '今天天气很好，我想去____借两本书。',
    options: ['学校', '医院', '机场', '商店'],
    answer_idx: 0,
  };
  const valBlankUnderline = validateCandidate(qBlankUnderline, existingPool);
  check(
    'Blank placeholder "____" filled with correct answer matches existing stem and is rejected',
    !valBlankUnderline.valid &&
    valBlankUnderline.errors.some((e) => e.includes('exceeds 85% threshold')),
    `similarity: ${(valBlankUnderline.jaccardSimilarity * 100).toFixed(1)}%`
  );

  const qBlankFullWidthParens = {
    ...qIdentical,
    stem: '今天天气很好，我想去（ ）借两本书。',
    options: ['学校', '医院', '机场', '商店'],
    answer_idx: 0,
  };
  const valBlankParens = validateCandidate(qBlankFullWidthParens, existingPool);
  check(
    'Blank placeholder full-width "（ ）" filled with correct answer is rejected',
    !valBlankParens.valid &&
    valBlankParens.errors.some((e) => e.includes('exceeds 85% threshold')),
    `similarity: ${(valBlankParens.jaccardSimilarity * 100).toFixed(1)}%`
  );

  const qBlankAsciiParens = {
    ...qIdentical,
    stem: '今天天气很好，我想去(   )借两本书。',
    options: ['学校', '医院', '机场', '商店'],
    answer_idx: 0,
  };
  const valBlankAscii = validateCandidate(qBlankAsciiParens, existingPool);
  check(
    'Blank placeholder ASCII "(   )" filled with correct answer is rejected',
    !valBlankAscii.valid &&
    valBlankAscii.errors.some((e) => e.includes('exceeds 85% threshold')),
    `similarity: ${(valBlankAscii.jaccardSimilarity * 100).toFixed(1)}%`
  );

  // 3.4 Threshold Sensitivity: Genuine high similarity (>0.85) vs distinct stem (<0.85)
  // Sentence: 20 Chinese characters. Minor suffix addition produces 94.1% Jaccard similarity
  // Base: '今天天气非常好，我想去图书馆借两本中文书。'
  // Variant: '今天天气非常好，我想去图书馆借两本中文书吧。'
  const highSimBase = '今天天气非常好，我想去图书馆借两本中文书。';
  const qHighSim = {
    stem: '今天天气非常好，我想去图书馆借两本中文书吧。',
    options: ['中文', '英文', '法文', '日文'],
    answer_idx: 0,
    explanation_vi: 'Muốn đi thư viện mượn hai quyển sách tiếng Trung.',
    level: 1,
    skill: 'reading' as const,
    part_type: 'read_fill_blank_4opt',
  };
  const valHighSim = validateCandidate(qHighSim, [highSimBase]);
  check(
    'Stem with 94.1% Jaccard similarity (>0.85) is rejected by deduplication validator',
    !valHighSim.valid &&
    valHighSim.jaccardSimilarity > 0.85 &&
    valHighSim.errors.some((e) => e.includes('exceeds 85% threshold')),
    `similarity: ${(valHighSim.jaccardSimilarity * 100).toFixed(1)}%`
  );

  // Distinct stem (< 0.85)
  const qDistinct = {
    stem: '小明每天早上七点起床去操场跑步锻炼身体。',
    options: ['跑步', '跳舞', '唱歌', '睡觉'],
    answer_idx: 0,
    explanation_vi: 'Tập thể dục buổi sáng là chạy bộ (跑步).',
    level: 1,
    skill: 'reading' as const,
    part_type: 'read_fill_blank_4opt',
  };
  const valDistinct = validateCandidate(qDistinct, existingPool);
  check(
    'Distinct stem (<0.85 similarity) is accepted by validator',
    valDistinct.valid && valDistinct.jaccardSimilarity < 0.85,
    `similarity: ${(valDistinct.jaccardSimilarity * 100).toFixed(1)}%`
  );

  // 3.5 Content hash determinism and normalization
  const hash1 = computeContentHash('今天天气很好。', ['A', 'B', 'C', 'D'], 0);
  const hash2 = computeContentHash('  今天天气很好。  ', ['A', 'B', 'C', 'D'], 0);
  check('computeContentHash is trim and whitespace invariant', hash1 === hash2);

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('\n======================================================================');
  console.log(`  STRESS SUITE SUMMARY: ${passed}/${passed + failed} checks passed.`);
  if (failed > 0) {
    console.error(`  FAILURES (${failed}):`);
    failures.forEach((f) => console.error(f));
    process.exitCode = 1;
  } else {
    console.log('  ALL ADVERSARIAL STRESS TESTS PASSED EMPIRICALLY WITH 100% ACCURACY!');
  }
  console.log('======================================================================\n');
}

runAdversarialStressSuite().catch((err) => {
  console.error('Fatal stress test suite error:', err);
  process.exit(1);
});
