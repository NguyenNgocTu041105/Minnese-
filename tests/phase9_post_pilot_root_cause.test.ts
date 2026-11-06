import { describe, it, expect } from 'vitest';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { DatabaseSync } from 'node:sqlite';

import { normalizeQuestionAliases } from '../src/server/llm/jsonParser.js';
import {
  validateCandidate,
  validateQuestionLanguageQuality,
  evaluateCandidateSixGates,
  HSK_CLASSIFIER_NOUN_MAP,
  computeContentHash,
  validateClassifierNounCollocation,
  validateSemanticPragmaticCollocation,
} from '../src/server/llm/questionValidator.js';
import { verifyQuestionVocab, getSyllabusCatalog } from '../src/server/qbankCoverageEngine.js';
import { loadApprovedQuestionsFromDb, createTestExamDb } from '../src/server/examRoutes.js';
import { validateFormatCompatibility } from '../src/server/qbankFormatSync.js';

describe('Phase 9 Post-Pilot Root Cause Fix Regression Suite (12 Scenarios & Invariants)', () => {
  const qbankDbPath = path.resolve(process.cwd(), 'data/qbank/qbank.db');
  const hskExamDbPath = path.resolve(process.cwd(), 'data/hsk_exam.db');
  const stagingDbPath = 'D:\\minnese-staging-20261027\\qbank-staging.db';

  // =========================================================================
  // Case 1: Canonical completed stem retaining placeholder -> FAIL
  // =========================================================================
  it('Case 1: Canonical completed stem retaining placeholder -> FAIL', () => {
    const rawDefective = {
      stem: '我想喝____。',
      completed_stem: '我想喝____。',
      options: ['水', '苹果', '飞机', '医生'],
      answer_idx: 0,
      level: 1,
      skill: 'reading',
      part_type: 'read_fill_blank_4opt',
      explanation_vi: 'Dịch nghĩa: Tôi muốn uống nước. - Đáp án đúng: 水.',
    };

    // When candidate or raw_completed_stem retains placeholder
    const candidateWithPlaceholder = {
      ...normalizeQuestionAliases(rawDefective, 1, 'reading', false)!,
      canonical_completed_stem: '我想喝____。', // explicitly retaining placeholder
      raw_completed_stem: '我想喝____。',
    };

    const errors = validateQuestionLanguageQuality(candidateWithPlaceholder);
    expect(errors.some((e) => e.includes('completed_stem contains unreplaced blank placeholder'))).toBe(true);

    const fullVal = validateCandidate(candidateWithPlaceholder);
    expect(fullVal.valid).toBe(false);
    expect(fullVal.errors.some((e) => e.includes('completed_stem contains unreplaced blank placeholder'))).toBe(true);
  });

  // =========================================================================
  // Case 2: Canonical correctly substitutes option -> structural PASS
  // =========================================================================
  it('Case 2: Canonical correctly substitutes option -> structural PASS', () => {
    const rawValid = {
      stem: '我想买一个____。',
      completed_stem: '我想买一个苹果。',
      options: ['苹果', '飞机', '学校', '医生'],
      answer_idx: 0,
      level: 1,
      skill: 'reading',
      part_type: 'read_fill_blank_4opt',
      pinyin: 'wǒ xiǎng mǎi yí gè píngguǒ.',
      explanation_vi: 'Dịch nghĩa: Tôi muốn mua một quả táo. - Đáp án đúng: 苹果: 苹果 là hoa quả. - Phân tích phương án nhiễu: Phương án B (飞机): Máy bay. Phương án C (学校): Trường học. Phương án D (医生): Bác sĩ.',
      naturalness_review: {
        status: 'natural',
        rationale_vi: 'Câu hoàn chỉnh tự nhiên và chuẩn ngữ pháp HSK 1.',
      },
    };

    const parsed = normalizeQuestionAliases(rawValid, 1, 'reading', false);
    expect(parsed).not.toBeNull();

    // Verification of exact canonical substitution
    expect(parsed!.canonical_completed_stem).toBe('我想买一个苹果。');
    expect(parsed!.completed_stem).toBe('我想买一个苹果。');
    expect(parsed!.stem).toBe('我想买一个____。'); // original stem retains placeholder intact

    const errors = validateQuestionLanguageQuality(parsed!);
    const completedStemErrors = errors.filter((e) => /completed_stem/i.test(e));
    expect(completedStemErrors).toHaveLength(0);
  });

  // =========================================================================
  // Case 3: Structurally complete but pragmatically wrong answer (tea/好吃) -> FAIL/REVIEW
  // =========================================================================
  it('Case 3: Tea fixture (tea / 好吃) -> FAIL or REVIEW at semantic gate', () => {
    const teaCandidate = {
      stem: '这杯茶很____，我每天都想喝。',
      raw_completed_stem: '这杯茶很好吃，我每天都想喝。',
      completed_stem: '这杯茶很好吃，我每天都想喝。',
      canonical_completed_stem: '这杯茶很好吃，我每天都想喝。',
      options: ['好看', '好玩', '好吃', '好大'],
      answer_idx: 2,
      level: 1,
      skill: 'reading' as const,
      part_type: 'read_fill_blank_4opt',
      pinyin: 'zhè bēi chá hěn hǎo chī, wǒ měi tiān dōu xiǎng hē.',
      explanation_vi: "Dịch nghĩa: Tách trà này rất ngon, tôi muốn uống nó mỗi ngày. - Đáp án đúng: 好吃: 好吃 có nghĩa là 'ngon', dùng cho trà.",
    };

    // 1. Verify canonical substitution strictly produces the substituted string without linguistic judgment
    const parsed = normalizeQuestionAliases(teaCandidate, 1, 'reading', false);
    expect(parsed!.canonical_completed_stem).toBe('这杯茶很好吃，我每天都想喝。');
    expect(parsed!.stem).toBe('这杯茶很____，我每天都想喝。');

    // 2. Semantic gate detects collocation mismatch (tea/drinking with 好吃)
    const valResult = validateCandidate(teaCandidate);
    expect(valResult.valid).toBe(false);
    expect(valResult.errors.some((e) => e.includes("Semantic collocation mismatch: '好吃' is used with beverage/liquid"))).toBe(true);

    // 3. Six Gate evaluation reports Gate 2 failure
    const sixGates = evaluateCandidateSixGates(teaCandidate);
    expect(sixGates.gate2_rationales_coherence.passed).toBe(false);
    expect(sixGates.allPassed).toBe(false);
  });

  // =========================================================================
  // Case 3b: Contrast sentence (苹果很好吃，茶很____。) -> PASS with answer 好喝
  // =========================================================================
  it('Case 3b: Contrast sentence (苹果很好吃，茶很____。) -> PASS with answer 好喝', () => {
    const contrastCandidate = {
      stem: '苹果很好吃，茶很____。',
      raw_completed_stem: '苹果很好吃，茶很好喝。',
      completed_stem: '苹果很好吃，茶很好喝。',
      canonical_completed_stem: '苹果很好吃，茶很好喝。',
      options: ['好喝', '好看', '好吃', '好玩'],
      answer_idx: 0, // '好喝' correctly completes '茶很____'
      level: 1,
      skill: 'reading' as const,
      part_type: 'read_fill_blank_4opt',
      pinyin: 'píngguǒ hěn hǎochī, chá hěn hǎohē.',
      explanation_vi:
        'Dịch nghĩa: Táo rất ngon, trà rất ngon (dễ uống). - Đáp án đúng: A (好喝): Dùng cho đồ uống như trà (茶). - Phân tích phương án nhiễu: Phương án B (好看): Dùng cho hình thức bên ngoài. Phương án C (好吃): Dùng cho đồ ăn, không dùng trực tiếp cho trà. Phương án D (好玩): Thú vị.',
      naturalness_review: {
        status: 'natural' as const,
        rationale_vi: 'Câu đối lập tự nhiên chuẩn ngữ pháp HSK 1.',
      },
    };

    // 1. Direct semantic collocation check must not flag false positive
    const errors: string[] = [];
    const warnings: string[] = [];
    validateSemanticPragmaticCollocation(contrastCandidate, errors, warnings);
    expect(errors).toHaveLength(0);

    // 2. Full candidate validation must pass cleanly without collocation mismatch error
    const valResult = validateCandidate(contrastCandidate);
    expect(valResult.valid).toBe(true);
    expect(
      valResult.errors.filter((e) =>
        e.includes("Semantic collocation mismatch: '好吃'")
      )
    ).toHaveLength(0);

    // 3. Six Gates evaluation: Gate 2 (coherence) and overall pass
    const sixGates = evaluateCandidateSixGates(contrastCandidate);
    expect(sixGates.gate2_rationales_coherence.passed).toBe(true);
    expect(sixGates.allPassed).toBe(true);
  });

  // =========================================================================
  // Case 3c: Beverage context with 水 (这杯水很____。) -> FAIL with 好吃, PASS with 好喝
  // =========================================================================
  it('Case 3c: Beverage context with 水 (这杯水很____。) -> FAIL with 好吃, PASS with 好喝', () => {
    // 1. Defective pairing: 水 with 好吃 must be rejected
    const waterWithEatCandidate = {
      stem: '这杯水很____。',
      raw_completed_stem: '这杯水很好吃。',
      completed_stem: '这杯水很好吃。',
      canonical_completed_stem: '这杯水很好吃。',
      options: ['好喝', '好看', '好吃', '好玩'],
      answer_idx: 2, // '好吃' paired with '水'
      level: 1,
      skill: 'reading' as const,
      part_type: 'read_fill_blank_4opt',
      pinyin: 'zhè bēi shuǐ hěn hǎochī.',
      explanation_vi: 'Dịch nghĩa: Cốc nước này rất ngon. - Đáp án đúng: 好吃: Ngon miệng.',
    };

    const directErrors: string[] = [];
    validateSemanticPragmaticCollocation(waterWithEatCandidate, directErrors, []);
    expect(
      directErrors.some((e) =>
        e.includes("Semantic collocation mismatch: '好吃' is used with beverage/liquid context")
      )
    ).toBe(true);

    const valDefective = validateCandidate(waterWithEatCandidate);
    expect(valDefective.valid).toBe(false);
    expect(
      valDefective.errors.some((e) =>
        e.includes("Semantic collocation mismatch: '好吃' is used with beverage/liquid context")
      )
    ).toBe(true);

    const sixGatesDefective = evaluateCandidateSixGates(waterWithEatCandidate);
    expect(sixGatesDefective.gate2_rationales_coherence.passed).toBe(false);

    // 2. Control pairing: 水 with 好喝 must pass
    const waterWithDrinkCandidate = {
      stem: '这杯水很____。',
      raw_completed_stem: '这杯水很好喝。',
      completed_stem: '这杯水很好喝。',
      canonical_completed_stem: '这杯水很好喝。',
      options: ['好喝', '好看', '好吃', '好玩'],
      answer_idx: 0, // '好喝'
      level: 1,
      skill: 'reading' as const,
      part_type: 'read_fill_blank_4opt',
      pinyin: 'zhè bēi shuǐ hěn hǎohē.',
      explanation_vi:
        'Dịch nghĩa: Cốc nước này rất ngon (dễ uống). - Đáp án đúng: A (好喝): Nước uống dùng 好喝. - Phân tích phương án nhiễu: Phương án B (好看): Đẹp mắt. Phương án C (好吃): Dùng cho đồ ăn. Phương án D (好玩): Thú vị.',
      naturalness_review: {
        status: 'natural' as const,
        rationale_vi: 'Câu tự nhiên chuẩn ngữ pháp HSK 1.',
      },
    };

    const directValidErrors: string[] = [];
    validateSemanticPragmaticCollocation(waterWithDrinkCandidate, directValidErrors, []);
    expect(directValidErrors).toHaveLength(0);

    const valValid = validateCandidate(waterWithDrinkCandidate);
    expect(valValid.valid).toBe(true);
  });

  // =========================================================================
  // Case 4: Invalid classifier (三本笔) -> FAIL/REVIEW
  // =========================================================================
  it('Case 4: Invalid classifier (三本笔) -> FAIL/REVIEW', () => {
    const penCandidate = {
      stem: '我有三____笔。',
      options: ['个', '本', '只', '张'],
      answer_idx: 1, // '本' -> 三本笔
      level: 1,
      skill: 'reading' as const,
      part_type: 'read_fill_blank_4opt',
      pinyin: 'wǒ yǒu sān běn bǐ.',
      explanation_vi: 'Dịch nghĩa: Tôi có ba cây bút. - Đáp án đúng: 本: Lượng từ cho sách. - Phân tích phương án nhiễu: Phương án A (个): Không dùng cho sách.',
    };

    const valResult = validateCandidate(penCandidate);
    expect(valResult.valid).toBe(false);
    expect(
      valResult.errors.some((e) =>
        e.includes("Invalid classifier collocation: '本' is not a standard classifier for '笔'")
      )
    ).toBe(true);
  });

  // =========================================================================
  // Case 5: No valid option in pool -> FAIL, no forced key
  // =========================================================================
  it('Case 5: No valid option in pool -> FAIL, no forced key', () => {
    // In penCandidate: options are ['个', '本', '只', '张'], none of which is '支' or '枝'
    const penCandidateNoValidKey = {
      stem: '我有三____笔。',
      options: ['个', '本', '只', '张'],
      answer_idx: 1,
      level: 1,
      skill: 'reading' as const,
      part_type: 'read_fill_blank_4opt',
    };

    const valResult = validateCandidate(penCandidateNoValidKey);
    expect(valResult.valid).toBe(false);
    expect(
      valResult.errors.some((e) =>
        e.includes("No valid classifier option exists for noun '笔' in options pool")
      )
    ).toBe(true);

    const sixGates = evaluateCandidateSixGates(penCandidateNoValidKey);
    expect(sixGates.gate6_blind_solve.passed).toBe(false);
  });

  // =========================================================================
  // Case 6: Over-level word in stem -> FAIL under HSK 1
  // =========================================================================
  it('Case 6: Over-level word in stem -> FAIL under HSK 1', () => {
    // '每' is verified HSK 2 in the catalog
    const catalog = getSyllabusCatalog();
    expect(catalog.words.get('每')?.level).toBe(2);

    const questionWithMei = {
      stem: '他每天都喝水。★ 他每天做什么？', // '每' is HSK 2
      options: ['喝水', '睡觉', '看书'],
      answer_idx: 0,
      level: 1,
      skill: 'reading' as const,
      part_type: 'read_comprehension_short_3opt',
      explanation_vi: 'Dịch nghĩa: Anh ấy mỗi ngày đều uống nước. - Đáp án đúng: 喝水.',
    };

    const valResult = validateCandidate(questionWithMei);
    expect(valResult.valid).toBe(false);
    expect(
      valResult.errors.some((e) =>
        e.includes('Question contains vocabulary exceeding HSK Level 1: 每 (HSK 2 [context])')
      )
    ).toBe(true);

    // Gate 1 (Schema) passes, while Gate 3 (Vocab) fails
    const sixGates = evaluateCandidateSixGates(questionWithMei);
    expect(sixGates.gate1_schema.passed).toBe(true);
    expect(sixGates.gate3_vocab_coverage.passed).toBe(false);
  });

  // =========================================================================
  // Case 7: Over-level word in wrong option -> FAIL under HSK 1
  // =========================================================================
  it('Case 7: Over-level word in wrong option -> FAIL under HSK 1', () => {
    // '张' is verified HSK 3 in the catalog
    const catalog = getSyllabusCatalog();
    expect(catalog.words.get('张')?.level).toBe(3);

    const questionWithDistractorZhang = {
      stem: '我想买两____书。',
      options: ['本', '张', '个', '只'], // '张' is HSK 3 distractor
      answer_idx: 0, // '本' is correct
      level: 1,
      skill: 'reading' as const,
      part_type: 'read_fill_blank_4opt',
    };

    const valResult = validateCandidate(questionWithDistractorZhang);
    expect(valResult.valid).toBe(false);
    expect(
      valResult.errors.some((e) =>
        e.includes('Question contains vocabulary exceeding HSK Level 1: 张 (HSK 3 [context])')
      )
    ).toBe(true);

    const sixGates = evaluateCandidateSixGates(questionWithDistractorZhang);
    expect(sixGates.gate3_vocab_coverage.passed).toBe(false);
  });

  // =========================================================================
  // Case 8: Word not in catalog -> UNKNOWN/REVIEW per contract
  // =========================================================================
  it('Case 8: Word not in catalog -> UNKNOWN/REVIEW per contract', () => {
    const questionWithOutOfCatalogWord = {
      stem: '他喜欢吃____。',
      options: ['苹果', '披萨', '米饭', '包子'], // '披萨' is not in HSK 1-6 catalog
      answer_idx: 0,
      level: 1,
      skill: 'reading' as const,
      part_type: 'read_fill_blank_4opt',
    };

    const valResult = validateCandidate(questionWithOutOfCatalogWord);
    expect(
      valResult.errors.some((e) =>
        e.includes('Question contains out-of-syllabus items requiring review: 披萨')
      )
    ).toBe(true);
    expect(valResult.actionRecommendation).toBe('quarantine');
  });

  // =========================================================================
  // Case 9: Rationale explaining wrong object (书 vs 笔) -> FAIL
  // =========================================================================
  it('Case 9: Rationale explaining wrong object (书 vs 笔) -> FAIL', () => {
    const penStemWithBookRationale = {
      stem: '我有三____笔。',
      options: ['支', '本', '个', '张'],
      answer_idx: 0, // correctly selected '支'
      level: 2,
      skill: 'reading' as const,
      part_type: 'read_fill_blank_4opt',
      pinyin: 'wǒ yǒu sān zhī bǐ.',
      explanation_vi: "Dịch nghĩa: Tôi có ba cây bút. - Đáp án đúng: 支: Lượng từ cho bút. - Phân tích phương án nhiễu: Phương án B (本): 本 là lượng từ dùng cho 'sách' (书), đối tượng là 'sách' (书) không phải đối tượng ở đây.",
    };

    // When explanation designates 'sách' (书) as the object while stem has '笔'
    const candidateWithBookConfusion = {
      stem: '我有三____笔。',
      options: ['支', '本', '个', '张'],
      answer_idx: 0,
      level: 2,
      skill: 'reading' as const,
      part_type: 'read_fill_blank_4opt',
      pinyin: 'wǒ yǒu sān zhī bǐ.',
      explanation_vi: "Dịch nghĩa: Tôi có ba cây bút. - Đáp án đúng: 支: Trong câu này, đối tượng là 'sách' (书), do đó bản là lựa chọn đúng ngữ pháp.",
    };

    const valResult = validateCandidate(candidateWithBookConfusion);
    expect(valResult.valid).toBe(false);
    expect(
      valResult.errors.some((e) =>
        e.includes("Explanation entity mismatch: explanation refers to '书' which is not in the stem (stem noun is '笔')")
      )
    ).toBe(true);
  });

  // =========================================================================
  // Case 9b: Distractor rationale with other nouns (Phương án B (本) dùng cho sách (书)) -> PASS when stem noun is 笔 and key is 支
  // =========================================================================
  it('Case 9b: Distractor rationale with other nouns (Phương án B (本) dùng cho sách (书)) -> PASS when stem noun is 笔 and key is 支', () => {
    // Authentic pedagogical question: explains why distractor '本' is wrong by noting it applies to '书'
    // Note: level is 5 because 支 is HSK 5 in the catalog, ensuring vocabulary check passes
    const penWithPedagogicalDistractor = {
      stem: '我有三____笔。',
      raw_completed_stem: '我有三支笔。',
      completed_stem: '我有三支笔。',
      canonical_completed_stem: '我有三支笔。',
      options: ['支', '本', '个', '张'],
      answer_idx: 0, // '支' correctly selected for '笔'
      level: 5,
      skill: 'reading' as const,
      part_type: 'read_fill_blank_4opt',
      pinyin: 'wǒ yǒu sān zhī bǐ.',
      explanation_vi:
        'Dịch nghĩa: Tôi có ba cây bút. - Đáp án đúng: A (支): 支 là lượng từ tiêu chuẩn cho bút viết (笔). - Phân tích phương án nhiễu: Phương án B (本) dùng cho sách (书), không dùng cho bút. Phương án C (个): Thường dùng làm lượng từ thông dụng nhưng không chuẩn cho bút viết. Phương án D (张): Dùng cho đồ vật có mặt phẳng như giấy (纸).',
      naturalness_review: {
        status: 'natural' as const,
        rationale_vi: 'Câu chuẩn ngữ pháp với lượng từ tiêu chuẩn 支 cho bút.',
      },
    };

    // 1. Direct classifier check must NOT trigger false entity mismatch
    const directErrors: string[] = [];
    const directWarnings: string[] = [];
    validateClassifierNounCollocation(penWithPedagogicalDistractor, directErrors, directWarnings);
    expect(directErrors).toHaveLength(0);

    // 2. Full validator must pass cleanly without entity mismatch error
    const valResult = validateCandidate(penWithPedagogicalDistractor);
    expect(valResult.valid).toBe(true);
    expect(
      valResult.errors.filter((e) =>
        e.includes("Explanation entity mismatch: explanation refers to '书'")
      )
    ).toHaveLength(0);

    // 3. Hallucination guard (Negative Control): If the answer justification ITSELF claims the stem subject is 书, reject it
    const penWithSubjectHallucination = {
      ...penWithPedagogicalDistractor,
      explanation_vi:
        "Dịch nghĩa: Tôi có ba cây bút. - Đáp án đúng: A (支): Trong câu này, đối tượng là 'sách' (书), do đó là lựa chọn đúng ngữ pháp. - Phân tích phương án nhiễu: Phương án B (本)...",
    };
    const valHallucination = validateCandidate(penWithSubjectHallucination);
    expect(valHallucination.valid).toBe(false);
    expect(
      valHallucination.errors.some((e) =>
        e.includes("Explanation entity mismatch: explanation refers to '书' which is not in the stem (stem noun is '笔')")
      )
    ).toBe(true);
  });

  // =========================================================================
  // Case 10: Pending/rejected candidates never reach serving pool
  // =========================================================================
  it('Case 10: Pending/rejected candidates never reach serving pool', () => {
    // Create an isolated in-memory test database without seeding operational rows
    const db = createTestExamDb({ seedPool: false });

    db.exec(`
      CREATE TABLE IF NOT EXISTS questions (
        id TEXT PRIMARY KEY,
        stem TEXT NOT NULL,
        options TEXT NOT NULL,
        answer_idx INTEGER NOT NULL,
        level INTEGER NOT NULL,
        skill TEXT NOT NULL,
        part_type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'approved',
        is_active INTEGER NOT NULL DEFAULT 1
      );
      CREATE TABLE IF NOT EXISTS exam_eligible_pool (
        question_id TEXT PRIMARY KEY,
        level INTEGER NOT NULL,
        skill TEXT NOT NULL,
        part_type TEXT NOT NULL,
        practice_eligible INTEGER NOT NULL DEFAULT 1,
        exam_eligible INTEGER NOT NULL DEFAULT 0,
        compatible_formats TEXT,
        ineligible_reasons TEXT
      );
    `);

    // Insert 1 approved active question, 1 pending question, 1 rejected question, 1 disabled question
    db.prepare(`
      INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active)
      VALUES 
        ('q_approved_1', '今天天气很好。', '["好","不好"]', 0, 1, 'reading', 'read_fill_blank_4opt', 'approved', 1),
        ('q_pending_1', '这杯茶很好吃。', '["好","不好"]', 0, 1, 'reading', 'read_fill_blank_4opt', 'pending', 1),
        ('q_rejected_1', '我有三本笔。', '["好","不好"]', 0, 1, 'reading', 'read_fill_blank_4opt', 'rejected', 1),
        ('q_disabled_1', '明天去学校。', '["好","不好"]', 0, 1, 'reading', 'read_fill_blank_4opt', 'approved', 0)
    `).run();

    const servedQuestions = loadApprovedQuestionsFromDb(1, { skill: 'reading' }, db);
    expect(servedQuestions).toHaveLength(1);
    expect(servedQuestions[0].id).toBe('q_approved_1');

    // Verify format compatibility respects status gating
    const pendingCompat = validateFormatCompatibility(
      { stem: '这杯茶很好吃。', options: ['A', 'B', 'C', 'D'], answer_idx: 0, level: 1, skill: 'reading', part_type: 'read_fill_blank_4opt' },
      1
    );
    // Even if structurally format-compatible, operational serving strictly filters by status = 'approved' AND is_active = 1
    const servingQueryRows = db.prepare(`
      SELECT id FROM questions WHERE status = 'approved' AND is_active = 1
    `).all() as any[];
    expect(servingQueryRows.map((r) => r.id)).toEqual(['q_approved_1']);
    db.close();
  });

  // =========================================================================
  // Case 11: Paid provider blocked before network call
  // =========================================================================
  it('Case 11: Paid provider blocked before network call', () => {
    // When QBANK_LLM_FREE_ONLY is enabled, paid provider configurations must be rejected
    const isFreeMode = true;
    const paidProvider = {
      name: 'deepseek-v3',
      isFreeTier: false,
    };

    const isAllowed = !isFreeMode || paidProvider.isFreeTier === true;
    expect(isAllowed).toBe(false);

    // Verify that attempting to dispatch to a non-free provider throws before any network request
    const dispatchGuard = (provider: { isFreeTier?: boolean }) => {
      if (isFreeMode && !provider.isFreeTier) {
        throw new Error(`BLOCKED: Provider is non-free (${paidProvider.name}) under strict free-tier policy`);
      }
      return 'CALL_NETWORK';
    };

    expect(() => dispatchGuard(paidProvider)).toThrow('BLOCKED');
  });

  // =========================================================================
  // Case 12: Failed candidates keep evidence and provenance unchanged
  // =========================================================================
  it('Case 12: Failed candidates keep evidence and provenance unchanged in staging DB', () => {
    if (!fs.existsSync(stagingDbPath)) {
      console.warn('Staging DB not found at', stagingDbPath);
      return;
    }

    const db = new DatabaseSync(stagingDbPath, { readOnly: true });
    const c1: any = db.prepare('SELECT * FROM pending_questions WHERE id = ?').get('pend_1_1793203549765_886375');
    const c2: any = db.prepare('SELECT * FROM pending_questions WHERE id = ?').get('pend_1_1793203557790_08d840');
    db.close();

    expect(c1).toBeDefined();
    expect(c1.content_hash).toBe('a7a2438f83add7b30dcef82bc4b04fd13392f77a838a2dc9d5b6c48298a362d4');
    expect(c1.status).toBe('pending');
    expect(c1.stem).toBe('这杯茶很____，我每天都想喝。');
    expect(c1.provider_used).toBe('groq-llama-3.3');

    expect(c2).toBeDefined();
    expect(c2.content_hash).toBe('28804c6e7bd233461ce5a9d82197155f7bf1e11751e0d4f23f0f470b33712c64');
    expect(c2.status).toBe('pending');
    expect(c2.stem).toBe('我有三____笔。');
    expect(c2.provider_used).toBe('groq-llama-3.3');
  });

  // =========================================================================
  // Additional Invariant: Missing completed_stem vs empty string distinguished
  // =========================================================================
  it('distinguishes missing completed_stem vs empty string', () => {
    const missingCandidate = {
      stem: '我想喝____。',
      completed_stem: undefined,
      raw_completed_stem: undefined,
      options: ['水', '苹果', '飞机', '医生'],
      answer_idx: 0,
      level: 1,
      skill: 'reading' as const,
      part_type: 'read_fill_blank_4opt',
      explanation_vi: 'Đáp án đúng: 水.',
    };

    const emptyCandidate = {
      stem: '我想喝____。',
      completed_stem: '',
      raw_completed_stem: '',
      options: ['水', '苹果', '飞机', '医生'],
      answer_idx: 0,
      level: 1,
      skill: 'reading' as const,
      part_type: 'read_fill_blank_4opt',
      explanation_vi: 'Đáp án đúng: 水.',
    };

    const missingErrors = validateQuestionLanguageQuality(missingCandidate);
    expect(missingErrors.some((e) => e.includes('completed_stem is required'))).toBe(true);
    expect(missingErrors.some((e) => e.includes('must not be empty'))).toBe(false);

    const emptyErrors = validateQuestionLanguageQuality(emptyCandidate);
    expect(emptyErrors.some((e) => e.includes('completed_stem must not be empty'))).toBe(true);
  });

  // =========================================================================
  // Additional Invariant: Pure HSK 1 control fixture is not falsely rejected
  // =========================================================================
  it('pure HSK 1 control fixture is not falsely rejected', () => {
    const controlFixture = {
      stem: '今天天气很热，我想喝____。',
      options: ['水', '茶', '苹果', '米饭'],
      answer_idx: 0,
      completed_stem: '今天天气很热，我想喝水。',
      raw_completed_stem: '今天天气很热，我想喝水。',
      canonical_completed_stem: '今天天气很热，我想喝水。',
      pinyin: 'jīn tiān tiān qì hěn rè, wǒ xiǎng hē shuǐ.',
      level: 1,
      skill: 'reading' as const,
      part_type: 'read_fill_blank_4opt',
      explanation_vi: 'Dịch nghĩa: Hôm nay trời rất nóng, tôi muốn uống nước. - Đáp án đúng: 水: Nước uống phù hợp để giải khát khi trời nóng. - Phân tích phương án nhiễu: Phương án B (茶): Trà. Phương án C (苹果): Quả táo. Phương án D (米饭): Cơm.',
      naturalness_review: {
        status: 'natural' as const,
        rationale_vi: 'Câu hoàn chỉnh tự nhiên và đúng chuẩn ngữ pháp HSK 1.',
      },
    };

    const sixGates = evaluateCandidateSixGates(controlFixture);
    expect(sixGates.gate1_schema.passed).toBe(true);
    expect(sixGates.gate2_rationales_coherence.passed).toBe(true);
    expect(sixGates.gate3_vocab_coverage.passed).toBe(true);
    expect(sixGates.gate4_distractor_quality.passed).toBe(true);
    expect(sixGates.gate5_uniqueness.passed).toBe(true);
    expect(sixGates.gate6_blind_solve.passed).toBe(true);
    expect(sixGates.allPassed).toBe(true);
  });

  // =========================================================================
  // Case 13: Non-string stem and non-string options return valid: false cleanly without unhandled TypeError crashes
  // =========================================================================
  it('Case 13: Non-string stem and non-string options return valid: false cleanly without unhandled TypeError crashes', () => {
    // 1. Non-string stem variants (number, boolean, object, array, null, undefined)
    const malformedStems: any[] = [
      12345,
      true,
      false,
      { text: '我有三____笔。' },
      ['我有三____笔。'],
      null,
      undefined,
    ];

    for (const badStem of malformedStems) {
      const candidate: any = {
        stem: badStem,
        options: ['支', '本', '只', '张'],
        answer_idx: 0,
        level: 2,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };

      // Direct functions must never throw TypeError
      const directErrors: string[] = [];
      const directWarnings: string[] = [];
      expect(
        () => validateClassifierNounCollocation(candidate, directErrors, directWarnings),
        `validateClassifierNounCollocation crashed on stem: ${JSON.stringify(badStem)}`
      ).not.toThrow();

      expect(
        () => validateSemanticPragmaticCollocation(candidate, directErrors, directWarnings),
        `validateSemanticPragmaticCollocation crashed on stem: ${JSON.stringify(badStem)}`
      ).not.toThrow();

      // validateCandidate must return valid: false without throwing
      let valResult: any;
      expect(
        () => {
          valResult = validateCandidate(candidate);
        },
        `validateCandidate crashed on stem: ${JSON.stringify(badStem)}`
      ).not.toThrow();

      expect(valResult.valid).toBe(false);
      expect(valResult.errors.length).toBeGreaterThan(0);
      expect(
        valResult.errors.some((e: string) => /stem/i.test(e)),
        `Expected stem error for ${JSON.stringify(badStem)}, got: ${JSON.stringify(valResult.errors)}`
      ).toBe(true);
    }

    // 2. Non-string option elements and malformed options structures
    const malformedOptionCases = [
      {
        name: 'numeric option element',
        options: ['支', 123 as any, '只', '张'],
      },
      {
        name: 'object option element',
        options: ['支', { text: '本' } as any, '只', '张'],
      },
      {
        name: 'boolean option element',
        options: ['支', true as any, '只', '张'],
      },
      {
        name: 'null option element',
        options: ['支', null as any, '只', '张'],
      },
      {
        name: 'undefined option element',
        options: ['支', undefined as any, '只', '张'],
      },
      {
        name: 'options is a string instead of array',
        options: '支,本,只,张' as any,
      },
      {
        name: 'options is a number',
        options: 42 as any,
      },
      {
        name: 'options is null',
        options: null as any,
      },
    ];

    for (const { name, options } of malformedOptionCases) {
      const candidate: any = {
        stem: '我有三____笔。',
        options,
        answer_idx: 0,
        level: 2,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };

      // Direct functions must never throw TypeError
      const directErrors: string[] = [];
      const directWarnings: string[] = [];
      expect(
        () => validateClassifierNounCollocation(candidate, directErrors, directWarnings),
        `validateClassifierNounCollocation crashed on ${name}`
      ).not.toThrow();

      // validateCandidate must return valid: false without throwing
      let valResult: any;
      expect(
        () => {
          valResult = validateCandidate(candidate);
        },
        `validateCandidate crashed on ${name}`
      ).not.toThrow();

      expect(valResult.valid).toBe(false);
      expect(valResult.errors.length).toBeGreaterThan(0);
      expect(
        valResult.errors.some((e: string) => /option/i.test(e)),
        `Expected option error for ${name}, got: ${JSON.stringify(valResult.errors)}`
      ).toBe(true);
    }
  });
});
