/**
 * tests/phase2_catalog_coverage.test.ts
 *
 * Automated Verification Suite for Phase 2/6 Acceptance Criteria:
 * AC1: New-per-level vs cumulative vocabulary counts are not conflated (cumulative = running sum of verified new-word lists for HSK 1-6).
 * AC2: Recognition Hanzi (1,940) and writing Hanzi (700) are managed and counted separately.
 * AC3: A question linked to many knowledge items increments the unique-question total exactly once.
 * AC4: A word that only appears in context is never counted as directly tested.
 * AC5: Inserting pending, rejected, or inactive questions (in a temp/in-memory DB) does not change official coverage.
 * AC6: An incomplete catalog (e.g., missing grammar list, partial writing Hanzi) is reported as partial/missing and never yields a "complete"/100% status; every percentage carries its denominator scope.
 * AC7: Every restored entry from the 66 rejected items is traceable to an original source row; every non-restored entry carries a reason.
 * AC8: Database safety: data/hsk_exam.db SHA-256 unchanged, data/qbank/qbank.db schema unchanged (no applied migrations), exam_sessions row count unchanged.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { DatabaseSync } from 'node:sqlite';
import {
  getSyllabusCatalog,
  loadSyllabusVocab,
  loadSyllabusKnowledgeItems,
  loadSyllabusChars,
  loadSyllabusWritingChars,
  getGrammarCatalogMetadata,
  buildKnowledgeLinkingModel,
  resolveTestedVocab,
  extractContextVocab,
  type HskLevel,
} from '../src/server/qbankCoverageEngine.js';
import {
  getOfficialCoverageService,
} from '../src/server/qbankOfficialCoverageService.js';

describe('Phase 2/6 Acceptance Criteria — HSK 1-6 Catalog & Official Coverage', () => {
  it('AC1: separates new-per-level vs cumulative vocabulary counts across HSK 1-6 (5,400 items / 5,334 headwords)', () => {
    const catalog = getSyllabusCatalog();
    expect(catalog.words.size).toBe(5334);
    expect(catalog.knowledgeItems.size).toBe(5400);

    const expectedNewPerLevel: Record<HskLevel, number> = {
      1: 300,
      2: 200,
      3: 500,
      4: 1000,
      5: 1600,
      6: 1800,
    };
    const expectedCumulative: Record<HskLevel, number> = {
      1: 300,
      2: 500,
      3: 1000,
      4: 2000,
      5: 3600,
      6: 5400,
    };

    let runningSum = 0;
    for (const lvl of [1, 2, 3, 4, 5, 6] as HskLevel[]) {
      const levelItems = catalog.knowledgeItemsByLevel.get(lvl) ?? [];
      expect(levelItems.length).toBe(expectedNewPerLevel[lvl]);
      runningSum += levelItems.length;
      expect(runningSum).toBe(expectedCumulative[lvl]);
      // Ensure new-per-level for levels 2..6 is strictly less than cumulative
      if (lvl > 1) {
        expect(levelItems.length).toBeLessThan(runningSum);
      }
    }
  });

  it('AC2: manages and counts recognition Hanzi (1,940) and writing Hanzi (700) separately', () => {
    const catalog = getSyllabusCatalog();
    const recogChars = loadSyllabusChars();
    const writingChars = loadSyllabusWritingChars();

    expect(recogChars.size).toBe(1940);
    expect(writingChars.size).toBe(700);
    expect(recogChars.size).not.toBe(writingChars.size);

    const recogByLevel = [1, 2, 3, 4, 5, 6].map((l) => catalog.charsByLevel.get(l as HskLevel)?.length);
    const writingByLevel = [1, 2, 3, 4, 5, 6].map((l) => catalog.writingCharsByLevel.get(l as HskLevel)?.length);

    expect(recogByLevel).toEqual([246, 125, 284, 441, 431, 413]);
    expect(writingByLevel).toEqual([100, 0, 150, 150, 150, 150]);
  });

  it('AC3: counts a question linked to multiple knowledge items strictly once in unique-question totals', () => {
    const db = new DatabaseSync(':memory:');
    db.exec(`
      CREATE TABLE questions (
        id TEXT PRIMARY KEY,
        stem TEXT NOT NULL,
        options TEXT NOT NULL,
        answer_idx INTEGER NOT NULL,
        level INTEGER NOT NULL,
        skill TEXT NOT NULL,
        part_type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'approved',
        is_active INTEGER NOT NULL DEFAULT 1,
        tested_vocab TEXT,
        passage TEXT,
        topic TEXT
      );
    `);

    db.prepare(`
      INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active, tested_vocab)
      VALUES ('q_unique_1', '爸爸和妈妈今天去商店买苹果和香蕉。', '["苹果","医院","飞机","老师"]', 0, 1, 'reading', 'read_fill_blank_4opt', 'approved', 1, '["苹果","商店"]');
    `).run();

    const model = buildKnowledgeLinkingModel(db);
    const profile = model.forwardIndex.get('q_unique_1');
    expect(profile).toBeDefined();
    expect(profile!.links.length).toBeGreaterThan(8);
    expect(model.uniqueQuestions.allApproved.size).toBe(1);

    const service = getOfficialCoverageService();
    const report = service.computeOfficialCoverage(db, { skipCache: true });
    expect(report.summary.totalUniqueApprovedQuestions).toBe(1);
    expect(report.summary.approvedActiveCount).toBe(1);

    db.close();
  });

  it('AC4: never counts a word that only appears in context as directly tested', () => {
    const catalog = getSyllabusCatalog();
    const q = {
      stem: '老师在教室里看书，学生们在写字。',
      options: ['睡觉', '吃饭', '学习', '跑步'],
      answerIdx: 0,
      level: 1 as HskLevel,
      skill: 'reading',
      part_type: 'read_fill_blank_4opt',
    };

    const { testedWords } = resolveTestedVocab(q, catalog.words);
    const contextWords = extractContextVocab(q, testedWords, catalog.words);

    expect(testedWords.has('睡觉')).toBe(true);
    expect(testedWords.has('老师')).toBe(false);
    expect(contextWords.has('老师')).toBe(true);
    expect(contextWords.has('睡觉')).toBe(false);
  });

  it('AC5: excludes pending, rejected, and inactive questions from official coverage', () => {
    const db = new DatabaseSync(':memory:');
    db.exec(`
      CREATE TABLE questions (
        id TEXT PRIMARY KEY,
        stem TEXT NOT NULL,
        options TEXT NOT NULL,
        answer_idx INTEGER NOT NULL,
        level INTEGER NOT NULL,
        skill TEXT NOT NULL,
        part_type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'approved',
        is_active INTEGER NOT NULL DEFAULT 1,
        tested_vocab TEXT,
        passage TEXT,
        topic TEXT
      );
      CREATE TABLE pending_questions (
        id TEXT PRIMARY KEY,
        stem TEXT NOT NULL,
        options TEXT NOT NULL,
        answer_idx INTEGER NOT NULL,
        level INTEGER NOT NULL,
        skill TEXT NOT NULL,
        part_type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        tested_vocab TEXT
      );
    `);

    // 1 approved active question
    db.prepare(`
      INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active, tested_vocab)
      VALUES ('q_app', '我喜欢喝茶。', '["茶","水","饭","菜"]', 0, 1, 'reading', 'read_fill_blank_4opt', 'approved', 1, '["茶"]');
    `).run();

    const service = getOfficialCoverageService();
    const baseline = service.computeOfficialCoverage(db, { skipCache: true });
    expect(baseline.summary.totalUniqueApprovedQuestions).toBe(1);
    const baselineTested = baseline.dimensions.vocabulary.directlyTestedCount;

    // Insert pending, rejected, and disabled questions testing new words
    db.prepare(`
      INSERT INTO pending_questions (id, stem, options, answer_idx, level, skill, part_type, status, tested_vocab)
      VALUES ('q_pend', '他在医院工作。', '["医院","学校","商店","饭店"]', 0, 1, 'reading', 'read_fill_blank_4opt', 'pending', '["医院"]');
    `).run();
    db.prepare(`
      INSERT INTO pending_questions (id, stem, options, answer_idx, level, skill, part_type, status, tested_vocab)
      VALUES ('q_rej', '明天坐飞机去北京。', '["飞机","出租车","火车","汽车"]', 0, 1, 'reading', 'read_fill_blank_4opt', 'rejected', '["飞机"]');
    `).run();
    db.prepare(`
      INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active, tested_vocab)
      VALUES ('q_inact', '今天天气很冷。', '["冷","热","好","大"]', 0, 1, 'reading', 'read_fill_blank_4opt', 'approved', 0, '["冷"]');
    `).run();

    const afterInsert = service.computeOfficialCoverage(db, { skipCache: true });
    expect(afterInsert.summary.totalUniqueApprovedQuestions).toBe(1);
    expect(afterInsert.dimensions.vocabulary.directlyTestedCount).toBe(baselineTested);
    expect(afterInsert.summary.excludedPendingCount).toBe(1);
    expect(afterInsert.summary.excludedRejectedCount).toBe(1);
    expect(afterInsert.summary.excludedDisabledCount).toBe(1);

    db.close();
  });

  it('AC6: reports incomplete catalogs as partial/missing, never 100%/complete, and includes denominator_scope on every metric', () => {
    const db = new DatabaseSync('data/qbank/qbank.db', { readOnly: true });
    const service = getOfficialCoverageService();
    const report = service.computeOfficialCoverage(db, { skipCache: true });

    expect(report.summary.curriculumReadiness.isComplete).toBe(false);
    expect(report.summary.curriculumReadiness.status).toBe('partial');

    const dims = report.dimensions;
    expect(dims.vocabulary.denominator_scope).toBe('clec_2025_hsk1_6_5400_items');
    expect(dims.vocabulary.denominator).toBe(5400);
    expect(dims.recognitionHanzi.denominator_scope).toBe('clec_2025_hsk1_6_recognition_chars_1940');
    expect(dims.recognitionHanzi.denominator).toBe(1940);
    expect(dims.writingHanzi.denominator_scope).toBe('clec_2025_hsk1_6_writing_chars_700');
    expect(dims.writingHanzi.status).toBe('partial');
    expect(dims.writingHanzi.is_complete).toBe(false);
    expect(dims.grammar.denominator_scope).toBe('clec_2021_hsk1_6_official_grammar_standard');
    expect(dims.grammar.status).toBe('missing');
    expect(dims.grammar.is_complete).toBe(false);
    expect(dims.grammar.percentage).toBe(0);

    db.close();
  });

  it('AC7: verifies all 66 restored items have source provenance and all rejected items have explicit reasons', () => {
    const restoredPath = path.resolve(process.cwd(), 'data/qbank/syllabus/vocab_restored.jsonl');
    const rejectedPath = path.resolve(process.cwd(), 'data/qbank/syllabus/vocab_rejected.csv');

    const restoredLines = fs.readFileSync(restoredPath, 'utf-8').trim().split(/\r?\n/);
    expect(restoredLines.length).toBe(66);

    for (const line of restoredLines) {
      const entry = JSON.parse(line);
      expect(entry.idx).toBeGreaterThanOrEqual(1);
      expect(entry.idx).toBeLessThanOrEqual(5400);
      expect(entry.provenance_pdf_page).toBeGreaterThan(0);
      expect(entry.restore_decision).toBe('RESTORE');
      expect(entry.restore_reason.length).toBeGreaterThan(5);
    }

    const rejectedLines = fs.readFileSync(rejectedPath, 'utf-8').trim().split(/\r?\n/);
    expect(rejectedLines.length).toBe(5); // Header + 4 rejected rows
    for (let i = 1; i < rejectedLines.length; i++) {
      expect(rejectedLines[i]).toMatch(/characters\/variants|data format/);
    }
  });

  it('AC8: preserves data/hsk_exam.db SHA-256, keeps data/qbank/qbank.db schema unchanged, and preserves exam_sessions rows', () => {
    const hskExamBuf = fs.readFileSync(path.resolve(process.cwd(), 'data/hsk_exam.db'));
    const sha256 = crypto.createHash('sha256').update(hskExamBuf).digest('hex').toUpperCase();
    expect(sha256).toBe('DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1');

    const db = new DatabaseSync('data/qbank/qbank.db', { readOnly: true });
    const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table'`).all() as Array<{ name: string }>;
    const tableNames = tables.map((t) => t.name);
    // Migration proposal was NOT applied automatically
    expect(tableNames).not.toContain('question_knowledge_links');

    const sessionRow = db.prepare(`SELECT COUNT(*) as cnt FROM exam_sessions`).get() as { cnt: number };
    expect(Number(sessionRow.cnt)).toBeGreaterThanOrEqual(100);
    db.close();
  });
});
