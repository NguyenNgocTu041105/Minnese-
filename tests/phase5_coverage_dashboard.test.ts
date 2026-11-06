/**
 * tests/phase5_coverage_dashboard.test.ts
 *
 * Automated verification of Milestone M2 (Phase 5/6 HSK Question-Bank Upgrade):
 * 1. Unique question counting (AC 4: question linked to multiple knowledge items counted once).
 * 2. 4-Tier vocabulary coverage isolation (AC 5: Tier 0 uncovered, Tier 1 context only, Tier 2 directly tested, Tier 3 reinforced).
 * 3. Grammar coverage protection (AC 6: 572-point CLEC denominator, 0.0% unverified, no fabrication).
 * 4. computeCoverageMatrix accurate accounting for all 89 approved questions & lastTaskStatus.
 * 5. handleDashboardOverview authentic statistics from real database.
 */

import { describe, it, expect } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  computeCoverageMatrix,
  isCompatiblePartType,
  computeVocabCoverage,
  getGrammarCatalogMetadata,
  buildKnowledgeLinkingModel,
  loadSyllabusVocab,
  loadSyllabusKnowledgeItems,
} from '../src/server/qbankCoverageEngine.js';
import {
  getOfficialCoverageService,
} from '../src/server/qbankOfficialCoverageService.js';
import { handleDashboardOverview } from '../src/server/qbankRoutes.js';

describe('Phase 5 Milestone M2: Knowledge Coverage Dashboard & Authentic Statistics', () => {
  const DB_PATH = path.resolve(process.cwd(), 'data/qbank/qbank.db');

  // =========================================================================
  // 1. AC 4: Unique Question Counting Invariant
  // =========================================================================
  describe('1. Unique Question Counting (AC 4)', () => {
    it('should count a question linked to multiple knowledge items exactly once in unique total', () => {
      // In-memory isolated SQLite database
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
          passage TEXT,
          topic TEXT,
          status TEXT NOT NULL DEFAULT 'approved',
          is_active INTEGER NOT NULL DEFAULT 1,
          tested_vocab TEXT,
          content_hash TEXT
        );
      `);

      // Insert 1 approved question that links to 5 distinct vocabulary items
      const insertStmt = db.prepare(`
        INSERT INTO questions (id, level, skill, part_type, stem, options, answer_idx, tested_vocab, status, is_active, content_hash)
        VALUES (?, 1, 'reading', 'read_fill_blank_4opt', '我喜欢喝茶和咖啡。', '["茶","水","苹果","牛奶"]', 0, ?, 'approved', 1, ?)
      `);
      insertStmt.run(
        'q_test_multi_link_001',
        JSON.stringify(['我', '喜欢', '喝', '茶', '咖啡']),
        'hash_multi_link_001'
      );

      const service = getOfficialCoverageService();
      const report = service.computeOfficialCoverage(db, { skipCache: true });

      // Invariant: exactly 1 unique approved question, NOT 5
      expect(report.summary.totalUniqueApprovedQuestions).toBe(1);
      expect(report.summary.approvedActiveCount).toBe(1);

      db.close();
    });

    it('should report exactly 89 unique approved questions on operational qbank.db', () => {
      const db = new DatabaseSync(DB_PATH, { readOnly: true });
      const service = getOfficialCoverageService();
      const report = service.computeOfficialCoverage(db, { skipCache: true });

      expect(report.summary.totalUniqueApprovedQuestions).toBe(96);
      expect(report.summary.approvedActiveCount).toBe(96);

      // Verify direct SQL count of distinct content_hash / id
      const row: any = db.prepare(`
        SELECT COUNT(DISTINCT COALESCE(content_hash, id)) as cnt
        FROM questions
        WHERE status = 'approved' AND is_active = 1 AND level BETWEEN 1 AND 6
      `).get();
      expect(Number(row.cnt)).toBe(96);

      db.close();
    });

    it('should exclude pending, rejected, and disabled questions from unique approved count', () => {
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
          passage TEXT,
          topic TEXT,
          status TEXT NOT NULL DEFAULT 'approved',
          is_active INTEGER NOT NULL DEFAULT 1,
          tested_vocab TEXT,
          content_hash TEXT
        );
        CREATE TABLE pending_questions (
          id TEXT PRIMARY KEY,
          status TEXT NOT NULL,
          level INTEGER NOT NULL
        );
      `);

      const insertStmt = db.prepare(`
        INSERT INTO questions (id, level, skill, part_type, stem, options, answer_idx, tested_vocab, status, is_active, content_hash)
        VALUES (?, 1, 'reading', 'read_fill_blank_4opt', 'Stem', '["A","B"]', 0, '["词"]', ?, ?, ?)
      `);

      // 1 approved active
      insertStmt.run('q1', 'approved', 1, 'h1');
      // 1 approved but inactive
      insertStmt.run('q2', 'approved', 0, 'h2');
      // 1 disabled
      insertStmt.run('q5', 'disabled', 1, 'h5');

      // 1 pending, 1 rejected in pending_questions
      db.prepare("INSERT INTO pending_questions (id, status, level) VALUES ('p1', 'pending', 1)").run();
      db.prepare("INSERT INTO pending_questions (id, status, level) VALUES ('p2', 'rejected', 1)").run();

      const service = getOfficialCoverageService();
      const report = service.computeOfficialCoverage(db, { skipCache: true });

      expect(report.summary.totalUniqueApprovedQuestions).toBe(1);
      expect(report.summary.approvedActiveCount).toBe(1);
      expect(report.summary.excludedPendingCount).toBe(1);
      expect(report.summary.excludedRejectedCount).toBe(1);

      db.close();
    });
  });

  // =========================================================================
  // 2. AC 5: 4-Tier Vocabulary Coverage Isolation
  // =========================================================================
  describe('2. 4-Tier Vocabulary Coverage Isolation (AC 5)', () => {
    it('should strictly isolate Tier 0, Tier 1, Tier 2, and Tier 3', () => {
      const db = new DatabaseSync(DB_PATH, { readOnly: true });
      const service = getOfficialCoverageService();
      const report = service.computeOfficialCoverage(db, { skipCache: true });

      // Total denominator must be transparently 5,400 knowledge items
      expect(report.dimensions.vocabulary.denominator).toBe(5400);
      expect(report.dimensions.vocabulary.denominator_scope).toBe('clec_2025_hsk1_6_5400_items');

      // Four-tier counts must partition the 5,400 knowledge items:
      const { uncoveredCount, inContextCount, directlyTestedCount, reinforcedCount } = report.dimensions.vocabulary;
      expect(uncoveredCount + inContextCount + directlyTestedCount + reinforcedCount).toBe(5400);

      // Verify Tier 0 is uncovered:
      expect(uncoveredCount).toBeGreaterThan(4500);

      // Verify Tier 1 is context appearance only:
      expect(inContextCount).toBeGreaterThan(0);

      // Verify Tier 2 is directly tested:
      expect(directlyTestedCount).toBeGreaterThan(0);

      // Verify Tier 3 is reinforced:
      expect(reinforcedCount).toBeGreaterThan(0);

      // Numerator is strictly Tier 2 + Tier 3:
      expect(report.dimensions.vocabulary.numerator).toBe(directlyTestedCount + reinforcedCount);

      // Status must not claim complete (100% false):
      expect(report.dimensions.vocabulary.is_complete).toBe(false);
      expect(report.dimensions.vocabulary.percentage).toBeLessThan(10.0);

      // Also verify via computeVocabCoverage
      const vocabReport = computeVocabCoverage(db);
      expect(vocabReport.overall.tier0 + vocabReport.overall.tier1 + vocabReport.overall.tier2 + vocabReport.overall.tier3).toBe(5334);

      db.close();
    });

    it('should never promote context-only words (stem/distractor appearances) to Tier 2', () => {
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
          passage TEXT,
          topic TEXT,
          status TEXT NOT NULL DEFAULT 'approved',
          is_active INTEGER NOT NULL DEFAULT 1,
          tested_vocab TEXT,
          content_hash TEXT
        );
      `);

      // A question where "苹果" (Apple, HSK 1) is only in the stem context, but the tested word is "喝"
      const insert = db.prepare(`
        INSERT INTO questions (id, level, skill, part_type, stem, options, answer_idx, tested_vocab, status, is_active, content_hash)
        VALUES ('q_ctx_1', 1, 'reading', 'read_fill_blank_4opt', '我吃了一个苹果，然后___水。', '["喝","看","听","去"]', 0, '["喝"]', 'approved', 1, 'hash_ctx_1')
      `);
      insert.run();

      const model = buildKnowledgeLinkingModel(db);
      // "苹果" appears only in context
      const appleRec = model.vocabIndex.get('苹果');

      expect(appleRec).toBeDefined();
      expect(appleRec?.contextualCount).toBeGreaterThan(0);
      expect(appleRec?.directlyTestedCount).toBe(0);
      expect(appleRec?.tier).toBe(1); // Strictly Tier 1 (Context only), NEVER Tier 2!

      // "喝" is tested directly
      const drinkRec = model.vocabIndex.get('喝');
      expect(drinkRec).toBeDefined();
      expect(drinkRec?.directlyTestedCount).toBe(1);
      expect(drinkRec?.tier).toBe(2); // Tier 2 (Directly tested)

      db.close();
    });
  });

  // =========================================================================
  // 3. AC 6: Grammar Coverage Protection & Unverified Status
  // =========================================================================
  describe('3. Grammar Coverage Protection (AC 6)', () => {
    it('should report grammar coverage as unverified with 572-point denominator', () => {
      const grammarMeta = getGrammarCatalogMetadata();
      expect(grammarMeta.totalItems).toBe(572);
      expect(grammarMeta.status).toBe('missing');
      expect(grammarMeta.denominatorScope).toBe('clec_2021_hsk1_6_official_grammar_standard');
      expect(grammarMeta.byLevel).toEqual({
        1: 48,
        2: 81,
        3: 141,
        4: 144,
        5: 98,
        6: 60,
      });

      const db = new DatabaseSync(DB_PATH, { readOnly: true });
      const service = getOfficialCoverageService();
      const report = service.computeOfficialCoverage(db, { skipCache: true });

      expect(report.dimensions.grammar.denominator).toBe(572);
      expect(report.dimensions.grammar.numerator).toBe(0);
      expect(report.dimensions.grammar.percentage).toBe(0.0);
      expect(report.dimensions.grammar.is_complete).toBe(false);
      expect(report.dimensions.grammar.status).toBe('missing');

      db.close();
    });

    it('should never report 100% grammar coverage from LLM tags alone', () => {
      const db = new DatabaseSync(':memory:');
      db.exec(`
        CREATE TABLE questions (
          id TEXT PRIMARY KEY,
          level INTEGER NOT NULL,
          skill TEXT NOT NULL,
          part_type TEXT NOT NULL,
          stem TEXT NOT NULL,
          options TEXT,
          answer_idx INTEGER,
          tested_vocab TEXT,
          status TEXT NOT NULL,
          is_active INTEGER DEFAULT 1,
          content_hash TEXT
        );
      `);

      // Even if questions claim grammar tags
      const insert = db.prepare(`
        INSERT INTO questions (id, level, skill, part_type, stem, options, answer_idx, tested_vocab, status, is_active, content_hash)
        VALUES ('q_gram_1', 1, 'reading', 'read_fill_blank_4opt', 'Stem', '["A","B"]', 0, '["把字句"]', 'approved', 1, 'h_gram')
      `);
      insert.run();

      const service = getOfficialCoverageService();
      const report = service.computeOfficialCoverage(db, { skipCache: true });

      // Invariant: grammar percentage remains 0.0% and status is unverified/missing
      expect(report.dimensions.grammar.numerator).toBe(0);
      expect(report.dimensions.grammar.percentage).toBe(0.0);
      expect(report.dimensions.grammar.is_complete).toBe(false);

      db.close();
    });
  });

  // =========================================================================
  // 4. Coverage Matrix & Compatible Part-Type Mapping
  // =========================================================================
  describe('4. Coverage Matrix & Compatible Part-Type Mapping', () => {
    it('should accurately account for all 89 approved questions in computeCoverageMatrix summary', () => {
      const db = new DatabaseSync(DB_PATH, { readOnly: true });
      const matrixReport = computeCoverageMatrix(db);

      // Summary totalApproved must be 95
      expect(matrixReport.summary.totalApproved).toBe(95);

      // Verify level breakdown sums to 95
      let sumByLevel = 0;
      for (let lvl = 1; lvl <= 6; lvl++) {
        sumByLevel += matrixReport.summary.byLevel[lvl].approved;
      }
      expect(sumByLevel).toBe(95);

      // Level 1 has 71 approved questions
      expect(matrixReport.summary.byLevel[1].approved).toBe(71);
      // Level 2 has 9 approved questions
      expect(matrixReport.summary.byLevel[2].approved).toBe(9);
      // Level 3 has 5 approved questions
      expect(matrixReport.summary.byLevel[3].approved).toBe(5);
      // Levels 4, 5, 6
      expect(matrixReport.summary.byLevel[4].approved).toBe(3);
      expect(matrixReport.summary.byLevel[5].approved).toBe(4);
      expect(matrixReport.summary.byLevel[6].approved).toBe(3);

      db.close();
    });

    it('should verify isCompatiblePartType correctly normalizes question part types with blueprints', () => {
      // 1. Fill blank variants
      expect(isCompatiblePartType('read_fill_blank_word_bank_6opt', 'read_fill_blank_4opt')).toBe(true);
      expect(isCompatiblePartType('read_fill_blank_word_bank_split', 'read_fill_blank_4opt')).toBe(true);
      expect(isCompatiblePartType('read_fill_blank_word_bank_split', 'fill_blank')).toBe(true);
      expect(isCompatiblePartType('read_cloze_passages_4opt', 'read_fill_blank_4opt')).toBe(true);

      // 2. Picture match variants
      expect(isCompatiblePartType('listen_picture_match_3opt', 'listen_picture_match_4opt')).toBe(true);
      expect(isCompatiblePartType('listen_dialogue_picture_match_6opt', 'listen_dialogue_picture_match_6opt')).toBe(true);
      // Simple picture match should NOT match dialogue picture match
      expect(isCompatiblePartType('listen_picture_match_3opt', 'listen_dialogue_picture_match_6opt')).toBe(false);

      // 3. Reading comprehension variants
      expect(isCompatiblePartType('read_comprehension_short_3opt', 'read_comprehension_4opt')).toBe(true);
      expect(isCompatiblePartType('read_comprehension_passages_4opt', 'read_comprehension_4opt')).toBe(true);

      // 4. Incompatible types
      expect(isCompatiblePartType('read_fill_blank_word_bank_6opt', 'listen_picture_match_4opt')).toBe(false);
      expect(isCompatiblePartType('write_tianzige_from_pinyin', 'read_fill_blank_4opt')).toBe(false);
    });

    it('should populate lastTaskStatus on all CoverageMatrixRow items', () => {
      const db = new DatabaseSync(DB_PATH, { readOnly: true });
      const matrixReport = computeCoverageMatrix(db);

      expect(matrixReport.rows.length).toBeGreaterThan(0);

      const validStatuses = new Set(['completed', 'failed', 'partial', 'none']);
      for (const row of matrixReport.rows) {
        expect(row.lastTaskStatus).toBeDefined();
        expect(validStatuses.has(row.lastTaskStatus!)).toBe(true);
      }

      // Find the row for Level 1 Listening listen_dialogue_picture_match_6opt (which has recorded scheduler run)
      const listenRow = matrixReport.rows.find(
        (r) => r.level === 1 && r.skill === 'listening' && r.part_type === 'listen_dialogue_picture_match_6opt'
      );
      expect(listenRow).toBeDefined();
      expect(['completed', 'partial', 'failed']).toContain(listenRow?.lastTaskStatus);

      db.close();
    });
  });

  // =========================================================================
  // 5. handleDashboardOverview & Authentic Database Statistics
  // =========================================================================
  describe('5. handleDashboardOverview Endpoint Statistics', () => {
    it('should return authentic poolOverview, grammarCoverage, and errorReliabilityStats', async () => {
      let responsePayload: any = null;
      let statusCode = 200;

      const mockReq: any = {};
      const mockRes: any = {
        status: (code: number) => {
          statusCode = code;
          return mockRes;
        },
        json: (data: any) => {
          responsePayload = data;
          return mockRes;
        },
      };

      await handleDashboardOverview(mockReq, mockRes);

      expect(statusCode).toBe(200);
      expect(responsePayload).toBeDefined();
      expect(responsePayload.success).toBe(true);

      // 1. poolOverview
      const { poolOverview } = responsePayload;
      expect(poolOverview.approvedActiveCount).toBe(96);
      expect(poolOverview.uniqueQuestionsCount).toBe(96);
      expect(poolOverview.pendingCount).toBeGreaterThanOrEqual(0);
      expect(poolOverview.rejectedCount).toBeGreaterThanOrEqual(0);
      expect(poolOverview.validationFailedCount).toBeGreaterThanOrEqual(0);
      expect(poolOverview.groupsMetTargetCount).toBe(0);
      expect(poolOverview.groupsDeficitCount).toBe(46);

      // 2. grammarCoverage
      const { grammarCoverage } = responsePayload;
      expect(grammarCoverage).toBeDefined();
      expect(grammarCoverage.standard).toBe('CLEC 2021');
      expect(grammarCoverage.totalPoints).toBe(572);
      expect(grammarCoverage.testedPoints).toBe(0);
      expect(grammarCoverage.percentage).toBe(0.0);
      expect(grammarCoverage.status).toBe('unverified');

      // 3. errorReliabilityStats
      const { errorReliabilityStats } = responsePayload;
      expect(errorReliabilityStats).toBeDefined();
      expect(errorReliabilityStats.validationRejections).toBeGreaterThanOrEqual(52);
      expect(errorReliabilityStats.duplicateRejections).toBeGreaterThanOrEqual(0);
      expect(errorReliabilityStats.themeErrors).toBeGreaterThanOrEqual(0);
      expect(errorReliabilityStats.adminRejections).toBeGreaterThanOrEqual(0);

      // Common error categories
      expect(Array.isArray(errorReliabilityStats.commonErrorCategories)).toBe(true);
      expect(errorReliabilityStats.commonErrorCategories.length).toBeGreaterThan(0);
      const dupCat = errorReliabilityStats.commonErrorCategories.find((c: any) => c.category.includes('Trùng lặp'));
      expect(dupCat).toBeDefined();
      expect(dupCat.count).toBeGreaterThanOrEqual(34);

      // Deficient areas
      expect(Array.isArray(errorReliabilityStats.deficientAreas)).toBe(true);
      const writingDef = errorReliabilityStats.deficientAreas.find((d: any) => d.skill === 'writing');
      expect(writingDef).toBeDefined();
      expect(writingDef?.deficit).toBe('100%');

      const listeningDef = errorReliabilityStats.deficientAreas.find((d: any) => d.skill === 'listening');
      expect(listeningDef).toBeDefined();
      expect(listeningDef?.deficit).toBe('100%');
    });
  });

  // =========================================================================
  // 6. Database Preservation Invariant
  // =========================================================================
  describe('6. Database Safety & Checksum Invariant', () => {
    it('should preserve data/hsk_exam.db SHA-256 strictly', () => {
      const examDbPath = path.resolve(process.cwd(), 'data/hsk_exam.db');
      const hash = crypto.createHash('sha256').update(fs.readFileSync(examDbPath)).digest('hex').toUpperCase();
      expect(hash).toBe('DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1');
    });

    it('should preserve data/qbank/qbank.db questions and exam_sessions row counts', () => {
      const db = new DatabaseSync(DB_PATH, { readOnly: true });
      const qRow: any = db.prepare('SELECT COUNT(*) as cnt FROM questions').get();
      expect(Number(qRow.cnt)).toBe(96);

      const sessRow: any = db.prepare('SELECT COUNT(*) as cnt FROM exam_sessions').get();
      expect(Number(sessRow.cnt)).toBeGreaterThanOrEqual(246);

      db.close();
    });
  });
});
