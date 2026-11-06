import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  getSyllabusCatalog,
  loadSyllabusVocab,
  verifyQuestionVocab,
  scanChineseWords,
} from '../src/server/qbankCoverageEngine.js';
import { loadSyllabusVocab as loadRotatorVocab } from '../src/server/llm/vocabRotator.js';
import {
  validateCandidate,
  evaluateCandidateSixGates,
} from '../src/server/llm/questionValidator.js';
import {
  buildHskPrompt,
  HSK_LEVEL_SPECS,
  HSK1_VERIFIED_TOPIC_VOCAB,
  getTopicVocabularyContext,
} from '../src/server/llm/promptTemplates.js';

describe('HSK 1 Vocabulary Source of Truth & 300-Word Catalog Verification', () => {
  const vocabPath = path.resolve(process.cwd(), 'data/qbank/syllabus/vocab.jsonl');
  const restoredPath = path.resolve(process.cwd(), 'data/qbank/syllabus/vocab_restored.jsonl');
  const blueprintPath = path.resolve(process.cwd(), 'data/qbank/blueprint/level1.json');

  // =========================================================================
  // Requirement 1 & 2: Syllabus Files & Runtime Source of Truth
  // =========================================================================
  it('R1 & R2: Canonical files exist, and vocab.jsonl is the primary runtime source of truth', () => {
    expect(fs.existsSync(vocabPath)).toBe(true);
    expect(fs.existsSync(restoredPath)).toBe(true);
    expect(fs.existsSync(blueprintPath)).toBe(true);

    const catalog = getSyllabusCatalog();
    expect(catalog.wordsByLevel.get(1)).toBeDefined();
    expect(catalog.knowledgeItemsByLevel.get(1)).toBeDefined();
  });

  // =========================================================================
  // Requirement 3 & 4: Exactly 300 unique HSK 1 words in CLEC HSK 3.0
  // =========================================================================
  it('R3 & R4: Level 1 has exactly 300 unique headwords in vocab.jsonl, 0 duplicates, 0 restored', () => {
    const lines = fs.readFileSync(vocabPath, 'utf-8').split('\n');
    const l1Items: any[] = [];
    const l1Words = new Set<string>();
    const duplicates: string[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;
      const item = JSON.parse(line);
      if (Number(item.level) === 1) {
        l1Items.push(item);
        const w = (item.clean_word || item.word || '').trim();
        if (l1Words.has(w)) {
          duplicates.push(w);
        } else {
          l1Words.add(w);
        }
      }
    }

    // Official count must be exactly 300
    expect(l1Items.length).toBe(300);
    expect(l1Words.size).toBe(300);
    expect(duplicates).toEqual([]);

    // Check restored file: Level 1 must have 0 restored items
    const restoredLines = fs.readFileSync(restoredPath, 'utf-8').split('\n');
    let restoredL1Count = 0;
    for (const line of restoredLines) {
      if (!line.trim()) continue;
      const item = JSON.parse(line);
      if (Number(item.level) === 1) {
        restoredL1Count++;
      }
    }
    expect(restoredL1Count).toBe(0);

    // Verify source provenance metadata
    const sample = l1Items[0];
    expect(sample.source).toContain('CLEC 新版HSK考试大纲 2025-11');
    expect(sample.source).toContain('300');
  });

  it('R3 & R4: Runtime loaders (coverageEngine & vocabRotator) load exactly 300 Level 1 words', () => {
    const catalog = getSyllabusCatalog();
    const l1Words = catalog.wordsByLevel.get(1)!;
    expect(l1Words.length).toBe(300);

    const l1KnowledgeItems = catalog.knowledgeItemsByLevel.get(1)!;
    expect(l1KnowledgeItems.length).toBe(300);

    const rotatorL1 = loadRotatorVocab(1);
    expect(rotatorL1.length).toBe(300);
  });

  // =========================================================================
  // Requirement 5: No active runtime code hard-codes 150 words for HSK 1
  // =========================================================================
  it('R5: Blueprint and prompt specs declare HSK 3.0 with 300 headwords, not old 150 words', () => {
    const bp = JSON.parse(fs.readFileSync(blueprintPath, 'utf-8'));
    expect(bp.hsk_version).toBe('3.0');
    expect(bp.level).toBe(1);

    const l1Spec = HSK_LEVEL_SPECS[1];
    expect(l1Spec.wordCountTarget).toContain('300 headwords (CLEC HSK 3.0 Band 1');
    expect(l1Spec.wordCountTarget).not.toContain('150');

    const promptContext = getTopicVocabularyContext(1);
    expect(promptContext).toContain('HSK 1 SYLLABUS SPECIFICATION: In HSK 3.0 Band 1, the syllabus defines exactly 300 verified headwords');
    expect(promptContext).not.toContain('150');
  });

  // =========================================================================
  // Requirement 6: FMM compound word boundary & no guessing on ambiguity
  // =========================================================================
  it('R6: FMM correctly segments compound words and strictly flags higher-level or unknown words', () => {
    const catalog = getSyllabusCatalog();

    // 1. Longest match for authentic HSK 1 compound words
    // '打电话' (HSK 1: 3 chars) vs '打' (HSK 1) and '电话' (HSK 1)
    const scannedCompounds = scanChineseWords('我想打电话给妈妈', catalog.words);
    const wordsScanned = scannedCompounds.map((w) => w.word);
    expect(wordsScanned).toContain('打电话');
    expect(wordsScanned).not.toContain('电话'); // Because 打电话 was matched as the longer compound!

    // 2. FMM detects over-level word '餐厅' (HSK 4) and '肉' (HSK 2)
    const scannedHigher = scanChineseWords('我们去餐厅吃肉', catalog.words);
    const higherWords = scannedHigher.map((w) => ({ word: w.word, level: w.level }));
    expect(higherWords).toContainEqual({ word: '餐厅', level: 4 });
    expect(higherWords).toContainEqual({ word: '肉', level: 2 });

    // 3. verifyQuestionVocab flags aboveLevel without guessing
    const verified = verifyQuestionVocab(
      {
        stem: '中午我们去餐厅吃饭。★ 我们中午去哪儿？',
        options: ['学校', '餐厅', '医院'],
        answer_idx: 1,
      },
      1
    );
    expect(verified.isValidForLevel).toBe(false);
    expect(verified.aboveLevel.some((a) => a.word === '餐厅' && a.wordLevel === 4)).toBe(true);
  });

  // =========================================================================
  // Requirement 7: Full question audit (stem, passage, all distractors)
  // =========================================================================
  it('R7: Validator audits the ENTIRE question (stem and all distractors), not just the correct answer', () => {
    // Case A: Correct answer is valid HSK 1 (米饭), but distractor is HSK 4 (餐厅)
    const candidateBadDistractor = {
      stem: '中午我想吃____。',
      completed_stem: '中午我想吃米饭。',
      canonical_completed_stem: '中午我想吃米饭。',
      options: ['米饭', '水', '茶', '餐厅'], // 餐厅 is HSK 4
      answer_idx: 0, // '米饭' is valid HSK 1
      level: 1,
      skill: 'reading' as const,
      part_type: 'read_fill_blank_4opt',
      explanation_vi: 'Dịch: Trưa nay tôi muốn ăn cơm.',
      distractor_rationales: [
        { option_idx: 1, option_text: '水', rationale_vi: 'Nước là đồ uống, không phải đồ ăn.' },
        { option_idx: 2, option_text: '茶', rationale_vi: 'Trà là đồ uống, không phải đồ ăn.' },
        { option_idx: 3, option_text: '餐厅', rationale_vi: 'Nhà hàng là địa điểm, không thể ăn nhà hàng.' },
      ],
    };

    const valResult = validateCandidate(candidateBadDistractor);
    expect(valResult.valid).toBe(false);
    expect(valResult.errors.some((e) => e.includes('exceeding HSK Level 1') && e.includes('餐厅'))).toBe(true);

    const gateResult = evaluateCandidateSixGates(candidateBadDistractor);
    expect(gateResult.gate3_vocab_coverage.passed).toBe(false);
    expect(gateResult.allPassed).toBe(false);

    // Case B: Correct answer is valid HSK 1, but stem contains out-of-syllabus character
    const candidateOutOfSyllabus = {
      stem: '饕今天天气很好。★ 今天天气怎么样？', // '饕' is not in HSK 1-6 syllabus
      completed_stem: '饕今天天气很好。★ 今天天气怎么样？',
      canonical_completed_stem: '饕今天天气很好。★ 今天天气怎么样？',
      options: ['好', '不好', '冷'],
      answer_idx: 0,
      level: 1,
      skill: 'reading' as const,
      part_type: 'read_comprehension_short_3opt',
      explanation_vi: 'Dịch: Hôm nay thời tiết tốt.',
      distractor_rationales: [
        { option_idx: 1, option_text: '不好', rationale_vi: 'Văn bản nêu rõ thời tiết tốt, không phải không tốt.' },
        { option_idx: 2, option_text: '冷', rationale_vi: 'Văn bản không nhắc đến thời tiết lạnh.' },
      ],
    };

    const valResultOos = validateCandidate(candidateOutOfSyllabus);
    expect(valResultOos.valid).toBe(false);
    expect(valResultOos.errors.some((e) => e.includes('out-of-syllabus') && e.includes('饕'))).toBe(true);
  });

  // =========================================================================
  // Requirement 7 (Prompt): All verified topic cluster words are 100% Level 1
  // =========================================================================
  it('R7: Every single headword in HSK1_VERIFIED_TOPIC_VOCAB is strictly verified in catalog as Level 1', () => {
    const catalog = getSyllabusCatalog();

    for (const [topicKey, cluster] of Object.entries(HSK1_VERIFIED_TOPIC_VOCAB)) {
      for (const word of cluster.words) {
        const levels = catalog.allWordLevels.get(word);
        expect(levels).toBeDefined();
        expect(levels!.has(1)).toBe(true);
      }
    }
  });
});
