import fs from 'node:fs';
import path from 'node:path';
import {
  stripMarkdownCodeBlocks,
  removeTrailingCommas,
  robustJsonParse,
  normalizeQuestionAliases,
  normalizeQuestionList,
  parseWithSelfRepair,
} from '../../src/server/llm/jsonParser.js';
import {
  VALID_ILLUSTRATION_THEMES,
  isValidIllustrationTheme,
  buildHskPrompt,
  HSK_LEVEL_SPECS,
} from '../../src/server/llm/promptTemplates.js';
import {
  generateWaterfallQuestions,
  generateMockQuestions,
} from '../../src/server/llm/waterfallGenerator.js';
import { validateCandidate } from '../../src/server/llm/questionValidator.js';

let totalChecks = 0;
let passedChecks = 0;

function assert(condition: boolean, msg: string) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  [PASS] ${msg}`);
  } else {
    console.error(`  [FAIL] ${msg}`);
    process.exitCode = 1;
  }
}

async function runTests() {
  console.log('======================================================================');
  console.log('   UNIT & INTEGRATION TESTS: JSON PARSER, PROMPTS & WATERFALL LLM     ');
  console.log('======================================================================\n');

  // --- 1. Markdown Stripping ---
  console.log('--- 1. Markdown Code Block Stripping ---');
  const fence1 = '```json\n[{"stem": "你好"}]\n```';
  assert(stripMarkdownCodeBlocks(fence1) === '[{"stem": "你好"}]', 'Strips ```json code fences');

  const fence2 = 'Here is the generated output:\n```\n{"stem": "谢谢"}\n```\nHope you like it!';
  assert(stripMarkdownCodeBlocks(fence2) === '{"stem": "谢谢"}', 'Strips surrounding commentary and bare ``` fences');

  // --- 2. Trailing Comma Removal ---
  console.log('\n--- 2. Trailing Comma Cleanup ---');
  const withCommas = '{"a": 1, "b": [1, 2, 3, ], "c": "Hello, world, here,", }';
  const cleaned = removeTrailingCommas(withCommas);
  assert(!cleaned.includes('3, ]'), 'Removes trailing comma in array');
  assert(!cleaned.includes(', }'), 'Removes trailing comma in object');
  assert(cleaned.includes('"Hello, world, here,"'), 'Preserves commas inside string literals');

  const parsedFromCleaned = JSON.parse(cleaned);
  assert(parsedFromCleaned.b.length === 3 && parsedFromCleaned.c === 'Hello, world, here,', 'Parsed object matches expected values');

  // --- 3. Robust JSON Parser ---
  console.log('\n--- 3. Robust JSON Parsing ---');
  const messyJson = '```json\n[\n  {\n    "stem": "今天天气很好，我想去____借两本书。",\n    "options": ["学校", "医院", "机场", "商店", ],\n    "answer_index": 0,\n    "explanation": "Địa điểm mượn sách là trường học.",\n  },\n]\n```';
  const robustParsed = robustJsonParse(messyJson);
  assert(Array.isArray(robustParsed) && robustParsed.length === 1, 'robustJsonParse handles markdown + trailing commas');

  // --- 4. Field Alias Normalization ---
  console.log('\n--- 4. Alias Normalization ---');
  const rawQ = {
    sentence: '老师正在教室里____。',
    options: ['写字', '唱歌', '跳舞', '游泳'],
    answer_index: 0,
    explanation: 'Giáo viên trong lớp học dạy học sinh viết chữ.',
    theme: 'writing',
    level: '2',
    partType: 'read_fill_blank_4opt',
  };
  const normalized = normalizeQuestionAliases(rawQ, 2, 'reading');
  assert(normalized !== null, 'Normalized question is not null');
  assert(normalized?.stem === '老师正在教室里____。', 'Normalized stem');
  assert(normalized?.answer_idx === 0, 'Normalized answer_index -> answer_idx');
  assert(normalized?.explanation_vi.includes('viết chữ'), 'Normalized explanation -> explanation_vi');
  assert(normalized?.illustration_theme === 'writing', 'Normalized theme -> illustration_theme');
  assert(normalized?.part_type === 'read_fill_blank_4opt', 'Normalized partType -> part_type');
  assert(normalized?.pinyin !== null && normalized?.pinyin !== undefined, 'Auto-generated tone-marked pinyin');

  // Letter answers
  const letterQ = { stem: '你好', options: ['A', 'B', 'C', 'D'], answer: 'B', explanation: 'Test letter B' };
  const normLetter = normalizeQuestionAliases(letterQ);
  assert(normLetter?.answer_idx === 1, 'Letter answer "B" normalized to index 1');

  // --- 5. Self-Repair Mechanism ---
  console.log('\n--- 5. 1-Shot Self-Repair Mechanism ---');
  const brokenJson = '```json\n[{"stem": "未完成的...';
  let repairCalledCount = 0;

  const repairResult = await parseWithSelfRepair(
    brokenJson,
    async (repairPrompt) => {
      repairCalledCount++;
      assert(repairPrompt.includes('Parse Error'), 'Repair prompt contains error description');
      // Simulate LLM returning repaired JSON
      return '[{"stem": "今天天气很好。", "options": ["学校", "医院", "机场", "商店"], "answer_idx": 0, "explanation_vi": "Giải thích hợp lý"}]';
    },
    1,
    'reading'
  );

  assert(repairCalledCount === 1, 'Repair function was invoked exactly once');
  assert(repairResult.repaired === true, 'parseWithSelfRepair reported repaired = true');
  assert(repairResult.questions.length === 1, 'Recovered 1 valid candidate question');

  // --- 6. Prompt Templates & 27 Themes ---
  console.log('\n--- 6. HSK 3.0 Prompt Templates & 27 SVG Themes ---');
  assert(VALID_ILLUSTRATION_THEMES.length === 27, 'VALID_ILLUSTRATION_THEMES has exactly 27 scenes');
  assert(isValidIllustrationTheme('taxi'), 'Validates theme "taxi"');
  assert(isValidIllustrationTheme('handshake'), 'Validates theme "handshake"');
  assert(isValidIllustrationTheme('watermelon'), 'Validates theme "watermelon"');
  assert(!isValidIllustrationTheme('non_existent_theme'), 'Rejects non-existent theme');
  assert(!isValidIllustrationTheme(null), 'Handles null theme gracefully');

  const hsk1Prompt = buildHskPrompt(1, 'reading', 2, [], 'read_fill_blank_4opt');
  assert(hsk1Prompt.includes('HSK Level 1'), 'Prompt includes HSK Level 1 header');
  assert(hsk1Prompt.includes('STRICTLY 4 DISTINCT OPTIONS'), 'Prompt enforces strictly 4 options');
  assert(hsk1Prompt.includes('SAME PART-OF-SPEECH (POS) DISTRACTORS'), 'Prompt enforces same POS distractors');
  assert(hsk1Prompt.includes('27 ALLOWED SVG ILLUSTRATION THEMES'), 'Prompt includes 27 SVG themes');
  assert(hsk1Prompt.includes('explanation_vi'), 'Prompt specifies explanation_vi');

  // --- 7. Mock Generator Quality ---
  console.log('\n--- 7. Mock Generator Adherence ---');
  const mocks = generateMockQuestions(1, 'all', 8, []);
  assert(mocks.length === 8, 'Generated 8 mock questions');
  for (let i = 0; i < mocks.length; i++) {
    const m = mocks[i];
    assert(m.options.length === 4, `Mock #${i + 1} has exactly 4 options`);
    if (m.illustration_theme) {
      assert(isValidIllustrationTheme(m.illustration_theme), `Mock #${i + 1} theme '${m.illustration_theme}' is in 27 SVG list`);
    }
    const val = validateCandidate(m);
    assert(val.valid, `Mock #${i + 1} passes validator: ${val.errors.join('; ')}`);
  }

  // --- 8. AC2 Verification: LLM_ALL_PROVIDERS_EXHAUSTED ---
  console.log('\n--- 8. AC2: All Providers Fail Throws LLM_ALL_PROVIDERS_EXHAUSTED ---');
  let threwExpectedError = false;
  try {
    // When provider is 'none', zero providers can be attempted
    await generateWaterfallQuestions({
      level: 1,
      skill: 'reading',
      count: 1,
      provider: 'none',
      mock: false,
    });
  } catch (err: any) {
    if (err.message === 'LLM_ALL_PROVIDERS_EXHAUSTED') {
      threwExpectedError = true;
    }
  }
  assert(threwExpectedError, 'generateWaterfallQuestions throws LLM_ALL_PROVIDERS_EXHAUSTED when providers fail');

  // --- 9. Question Validator Updates ---
  console.log('\n--- 9. Question Validator Updates ---');
  // Picture question with valid theme passes
  const validPicQ = {
    stem: '桌子上有三个新鲜的苹果。',
    options: ['苹果', '香蕉', '西瓜', '米饭'],
    answer_idx: 0,
    explanation_vi: 'Trên bàn có 3 quả táo tươi ngon.',
    level: 1,
    skill: 'listening' as const,
    part_type: 'listen_picture_match_4opt',
    illustration_theme: 'apple',
  };
  const picValPass = validateCandidate(validPicQ);
  assert(picValPass.valid, 'Valid picture question with 27 SVG theme passes');

  // Picture question with invalid theme fails
  const invalidThemeQ = {
    ...validPicQ,
    illustration_theme: 'alien_spaceship',
  };
  const invalidThemeVal = validateCandidate(invalidThemeQ);
  assert(!invalidThemeVal.valid, 'Picture question with invalid theme rejected');
  assert(invalidThemeVal.errors.some((e) => e.includes('27 supported SVG scenes')), 'Error mentions 27 supported SVG scenes');

  // Question with Chinese bracketed hint fails
  const bracketHintQ = {
    ...validPicQ,
    stem: '桌子上有三个新鲜的苹果。（答案：苹果）',
  };
  const bracketHintVal = validateCandidate(bracketHintQ);
  assert(!bracketHintVal.valid, 'Chinese bracketed hint （答案：苹果） is rejected');

  // --- 10. Milestone 1: HSK 6 Configuration, Prompt & Topic Normalization ---
  console.log('\n--- 10. Milestone 1: HSK 6 Configuration, Prompt & Topic Normalization ---');
  // 10.1 Prompt includes HSK Level 6 specs and topic instruction
  const hsk6Prompt = buildHskPrompt(6, 'reading', 3, [], 'read_cloze_passages_4opt', 'Kinh tế & Công nghệ');
  assert(hsk6Prompt.includes('HSK Level 6'), 'Prompt includes HSK Level 6 header');
  assert(hsk6Prompt.includes('5,456 words'), 'Prompt includes HSK 6 word band target (5,456 words)');
  assert(hsk6Prompt.includes('1,800 characters'), 'Prompt includes HSK 6 hanzi target (1,800 characters)');
  assert(hsk6Prompt.includes('Kinh tế & Công nghệ'), 'Prompt includes specified thematic topic');
  assert(hsk6Prompt.includes('"topic": "Kinh tế & Công nghệ"'), 'Prompt JSON schema includes topic field');

  // 10.2 JSON Parser normalizes Level 6 and topic
  const rawHsk6Q = {
    stem: '在当前数字经济迅速发展的背景下，企业必须加快数字化转型步伐。',
    options: ['转型', '转移', '转化', '转换'],
    answer_idx: 0,
    explanation_vi: 'Trong bối cảnh kinh tế số, doanh nghiệp cần chuyển đổi số (数字化转型).',
    level: 6,
    skill: 'reading',
    part_type: 'read_cloze_passages_4opt',
    topic: 'Kinh tế số',
  };
  const normHsk6 = normalizeQuestionAliases(rawHsk6Q);
  assert(normHsk6 !== null, 'Normalized HSK 6 question is not null');
  assert(normHsk6?.level === 6, 'Normalized level is 6');
  assert(normHsk6?.topic === 'Kinh tế số', 'Normalized topic preserved correctly');

  // 10.3 Validator accepts HSK Level 6
  const hsk6Val = validateCandidate(normHsk6!);
  assert(hsk6Val.valid, `HSK Level 6 question is valid: ${hsk6Val.errors.join('; ')}`);

  // 10.4 Validator rejects Level 7 and Level 0
  const level7Q = { ...normHsk6!, level: 7 };
  const level7Val = validateCandidate(level7Q);
  assert(!level7Val.valid, 'Level 7 question rejected by validator');
  assert(level7Val.errors.some((e) => e.includes('level must be an integer between 1 and 6')), 'Error specifies level between 1 and 6');

  const level0Q = { ...normHsk6!, level: 0 };
  const level0Val = validateCandidate(level0Q);
  assert(!level0Val.valid, 'Level 0 question rejected by validator');

  // 10.5 Validator rejects non-integer float level (e.g. 2.5)
  const floatLevelQ = { ...normHsk6!, level: 2.5 };
  const floatLevelVal = validateCandidate(floatLevelQ);
  assert(!floatLevelVal.valid, 'Float level 2.5 question rejected by validator');
  assert(
    floatLevelVal.errors.some((e) => e.includes('level must be an integer between 1 and 6')),
    'Float level error specifies level must be an integer between 1 and 6'
  );

  // 10.6 HSK_LEVEL_SPECS[6] contains exactly 25 words, and all are authentic Level 6 in hsk30.csv (0 from Level 7-9)
  const spec6 = HSK_LEVEL_SPECS[6];
  assert(spec6.exampleWords.length === 25, 'HSK_LEVEL_SPECS[6] contains exactly 25 example words');
  assert(spec6.hanziTarget === '1,800 characters', 'HSK_LEVEL_SPECS[6] hanziTarget is 1,800 characters');

  const csvPath = path.resolve(process.cwd(), 'data/inbox/hsk30.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const level6CsvWords = new Set<string>();
  const level79CsvWords = new Set<string>();
  for (const line of csvContent.split(/\r?\n/)) {
    const parts = line.split(',');
    if (parts.length > 5) {
      const word = parts[1]?.trim();
      const level = parts[5]?.trim();
      if (level === '6') {
        level6CsvWords.add(word);
      } else if (level === '7-9') {
        level79CsvWords.add(word);
      }
    }
  }

  const allWordsInCsv6 = spec6.exampleWords.every((w) => level6CsvWords.has(w));
  assert(allWordsInCsv6, 'All 25 example words in HSK_LEVEL_SPECS[6] are verified Level 6 in hsk30.csv');
  const zeroWordsInCsv79 = spec6.exampleWords.every((w) => !level79CsvWords.has(w));
  assert(zeroWordsInCsv79, 'Zero words in HSK_LEVEL_SPECS[6] belong to HSK 7-9');

  console.log('\n======================================================================');
  console.log(`  RESULTS: ${passedChecks}/${totalChecks} checks passed.`);
  console.log('======================================================================\n');
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
