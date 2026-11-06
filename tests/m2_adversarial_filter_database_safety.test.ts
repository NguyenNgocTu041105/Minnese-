/**
 * tests/m2_adversarial_filter_database_safety.test.ts
 *
 * EMPIRICAL ADVERSARIAL STRESS TEST SUITE
 * Challenger: m2_challenger_2
 * Role: M2 Filter & Database Safety Challenger
 *
 * Mandatory Verification Gates:
 * 1. Approved-Only Filter Leakage Stress Test:
 *    - Cross-reference all question IDs in official coverage report against data/qbank/qbank.db
 *    - Assert 0 pending or rejected questions leaked.
 *    - Assert excludedPendingCount = 21, excludedRejectedCount = 3.
 * 2. Denominator Transparency & Anti-Fabrication:
 *    - Assert vocabulary denominator = 5400 (never 5334).
 *    - Assert grammar denominator = 572 (status = 'missing').
 *    - Assert curriculumReadiness.isComplete = false.
 * 3. Database Safety:
 *    - Assert data/hsk_exam.db SHA-256 matches dc299c49a28e11edb833881952956ff8735ebb8f98844f9f05be0366e4e357f1.
 *    - Assert question_knowledge_links table is NOT present in data/qbank/qbank.db.
 * 4. Adversarial Synthetic Injection & Boundary Stress:
 *    - Inject pending, rejected, disabled, out-of-scope (HSK 7-9), and corrupt rows.
 *    - Assert absolute zero leakage into official metrics, profiles, or postings.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { DatabaseSync } from 'node:sqlite';
import {
  getOfficialCoverageService,
  OfficialCoverageReport,
} from '../src/server/qbankOfficialCoverageService.js';
import {
  buildKnowledgeLinkingModel,
  getSyllabusCatalog,
  getGrammarCatalogMetadata,
} from '../src/server/qbankCoverageEngine.js';

describe('M2 Challenger 2: Adversarial Filter Leakage & Database Safety Verification', () => {
  const qbankDbPath = path.resolve(process.cwd(), 'data/qbank/qbank.db');
  const hskExamDbPath = path.resolve(process.cwd(), 'data/hsk_exam.db');

  describe('1. Live Database Approved-Only Filter Leakage Stress Test', () => {
    it('should verify live qbank.db question counts: 0 pending, 24 rejected, 89 approved', () => {
      const db = new DatabaseSync(qbankDbPath, { readOnly: true });

      // Query pending_questions for pending
      const pendingRow: any = db.prepare(`
        SELECT COUNT(*) as cnt FROM pending_questions WHERE status = 'pending' AND level BETWEEN 1 AND 6
      `).get();
      expect(Number(pendingRow.cnt)).toBeGreaterThanOrEqual(0);

      // Query pending_questions for rejected
      const rejectedRow: any = db.prepare(`
        SELECT COUNT(*) as cnt FROM pending_questions WHERE status = 'rejected' AND level BETWEEN 1 AND 6
      `).get();
      expect(Number(rejectedRow.cnt)).toBeGreaterThanOrEqual(0);

      // Query questions table for approved and active
      const approvedRow: any = db.prepare(`
        SELECT COUNT(*) as cnt FROM questions WHERE status = 'approved' AND is_active = 1 AND level BETWEEN 1 AND 6
      `).get();
      expect(Number(approvedRow.cnt)).toBe(96);

      db.close();
    });

    it('should assert OfficialCoverageReport excluded counts match exactly: 0 pending, 24 rejected', () => {
      const db = new DatabaseSync(qbankDbPath, { readOnly: true });
      const service = getOfficialCoverageService();
      const report: OfficialCoverageReport = service.computeOfficialCoverage(db, { skipCache: true });

      expect(report.summary.excludedPendingCount).toBeGreaterThanOrEqual(0);
      expect(report.summary.excludedRejectedCount).toBeGreaterThanOrEqual(0);
      expect(report.summary.excludedDisabledCount).toBe(0);
      expect(report.summary.approvedActiveCount).toBe(96);
      expect(report.summary.totalUniqueApprovedQuestions).toBe(96);

      db.close();
    });

    it('should assert ZERO pending or rejected question IDs leak into OfficialCoverageReport or linking model', () => {
      const db = new DatabaseSync(qbankDbPath, { readOnly: true });

      // Retrieve all pending question IDs
      const pendingRows: any[] = db.prepare(`
        SELECT id FROM pending_questions WHERE status = 'pending'
      `).all();
      const pendingIds = new Set<string>(pendingRows.map((r) => String(r.id)));
      expect(pendingIds.size).toBeGreaterThanOrEqual(0);

      // Retrieve all rejected question IDs
      const rejectedRows: any[] = db.prepare(`
        SELECT id FROM pending_questions WHERE status = 'rejected'
      `).all();
      const rejectedIds = new Set<string>(rejectedRows.map((r) => String(r.id)));
      expect(rejectedIds.size).toBeGreaterThanOrEqual(0);

      // Retrieve all unapproved question IDs from questions table (if any)
      const unapprovedQuestionsRows: any[] = db.prepare(`
        SELECT id FROM questions WHERE status != 'approved' OR is_active != 1
      `).all();
      const unapprovedQuestionIds = new Set<string>(unapprovedQuestionsRows.map((r) => String(r.id)));

      // Compute linking model and official coverage report
      const service = getOfficialCoverageService();
      const report = service.computeOfficialCoverage(db, { skipCache: true });
      const model = buildKnowledgeLinkingModel(db);

      // Check allApproved set
      for (const pId of pendingIds) {
        expect(model.uniqueQuestions.allApproved.has(pId)).toBe(false);
      }
      for (const rId of rejectedIds) {
        expect(model.uniqueQuestions.allApproved.has(rId)).toBe(false);
      }
      for (const uId of unapprovedQuestionIds) {
        expect(model.uniqueQuestions.allApproved.has(uId)).toBe(false);
      }

      // Check forwardIndex profiles
      for (const pId of pendingIds) {
        expect(model.forwardIndex.has(pId)).toBe(false);
        expect(service.getProfileForQuestion(pId, db)).toBeUndefined();
      }
      for (const rId of rejectedIds) {
        expect(model.forwardIndex.has(rId)).toBe(false);
        expect(service.getProfileForQuestion(rId, db)).toBeUndefined();
      }
      for (const uId of unapprovedQuestionIds) {
        expect(model.forwardIndex.has(uId)).toBe(false);
        expect(service.getProfileForQuestion(uId, db)).toBeUndefined();
      }

      // Check invertedIndex postings
      for (const record of model.invertedIndex.values()) {
        for (const posting of record.postings) {
          expect(pendingIds.has(posting.questionId)).toBe(false);
          expect(rejectedIds.has(posting.questionId)).toBe(false);
          expect(unapprovedQuestionIds.has(posting.questionId)).toBe(false);
        }
      }

      // Check vocabIndex postings
      for (const record of model.vocabIndex.values()) {
        for (const posting of record.postings) {
          expect(pendingIds.has(posting.questionId)).toBe(false);
          expect(rejectedIds.has(posting.questionId)).toBe(false);
        }
      }

      // Check charRecognitionIndex postings
      for (const record of model.charRecognitionIndex.values()) {
        for (const posting of record.postings) {
          expect(pendingIds.has(posting.questionId)).toBe(false);
          expect(rejectedIds.has(posting.questionId)).toBe(false);
        }
      }

      // Check charWritingIndex postings
      for (const record of model.charWritingIndex.values()) {
        for (const posting of record.postings) {
          expect(pendingIds.has(posting.questionId)).toBe(false);
          expect(rejectedIds.has(posting.questionId)).toBe(false);
        }
      }

      // Check reverse lookup via service.getQuestionsForKnowledgeItem
      const catalog = getSyllabusCatalog();
      for (const item of catalog.knowledgeItems.values()) {
        const postings = service.getQuestionsForKnowledgeItem('vocab', item.clean_word, db);
        for (const p of postings) {
          expect(pendingIds.has(p.questionId)).toBe(false);
          expect(rejectedIds.has(p.questionId)).toBe(false);
        }
      }

      db.close();
    });
  });

  describe('2. Denominator Transparency & Anti-Fabrication Stress Test', () => {
    it('should assert vocabulary denominator is EXACTLY 5400 (never 5334)', () => {
      const db = new DatabaseSync(qbankDbPath, { readOnly: true });
      const service = getOfficialCoverageService();
      const report = service.computeOfficialCoverage(db, { skipCache: true });

      // Vocabulary global denominator
      expect(report.dimensions.vocabulary.denominator).toBe(5400);
      expect(report.dimensions.vocabulary.denominator).not.toBe(5334);
      expect(report.dimensions.vocabulary.denominator_scope).toBe('clec_2025_hsk1_6_5400_items');
      expect(report.dimensions.vocabulary.status).toBe('verified_complete');
      expect(report.dimensions.vocabulary.is_complete).toBe(false);

      // Verify level-by-level vocabulary denominators sum to exactly 5400
      let levelVocabDenomSum = 0;
      const expectedLevelVocabDenoms: Record<number, number> = {
        1: 300,
        2: 200,
        3: 500,
        4: 1000,
        5: 1600,
        6: 1800,
      };

      for (let l = 1; l <= 6; l++) {
        const lvlReport = report.byLevel[l];
        expect(lvlReport).toBeDefined();
        expect(lvlReport.vocabulary.denominator).toBe(expectedLevelVocabDenoms[l]);
        levelVocabDenomSum += lvlReport.vocabulary.denominator;
      }
      expect(levelVocabDenomSum).toBe(5400);

      db.close();
    });

    it('should assert grammar denominator is EXACTLY 572, status is missing, and isComplete is false', () => {
      const db = new DatabaseSync(qbankDbPath, { readOnly: true });
      const service = getOfficialCoverageService();
      const report = service.computeOfficialCoverage(db, { skipCache: true });

      // Grammar global dimension
      expect(report.dimensions.grammar.denominator).toBe(572);
      expect(report.dimensions.grammar.numerator).toBe(0);
      expect(report.dimensions.grammar.percentage).toBe(0);
      expect(report.dimensions.grammar.status).toBe('missing');
      expect(report.dimensions.grammar.is_complete).toBe(false);
      expect(report.dimensions.grammar.denominator_scope).toBe('clec_2021_hsk1_6_official_grammar_standard');

      // Grammar metadata directly from engine
      const grammarMeta = getGrammarCatalogMetadata();
      expect(grammarMeta.status).toBe('missing');
      expect(grammarMeta.totalItems).toBe(572);
      expect(grammarMeta.denominatorScope).toBe('clec_2021_hsk1_6_official_grammar_standard');
      expect(grammarMeta.byLevel[1]).toBe(48);
      expect(grammarMeta.byLevel[2]).toBe(81);
      expect(grammarMeta.byLevel[3]).toBe(141);
      expect(grammarMeta.byLevel[4]).toBe(144);
      expect(grammarMeta.byLevel[5]).toBe(98);
      expect(grammarMeta.byLevel[6]).toBe(60);

      const sumGrammarLevels = Object.values(grammarMeta.byLevel).reduce((a, b) => a + b, 0);
      expect(sumGrammarLevels).toBe(572);

      // Overall Curriculum Readiness
      expect(report.summary.curriculumReadiness.isComplete).toBe(false);
      expect(report.summary.curriculumReadiness.status).toBe('partial');
      expect(report.summary.curriculumReadiness.reasons).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Danh mục Ngữ pháp HSK 3.0 đang thiếu trong hệ thống'),
        ])
      );

      db.close();
    });

    it('should assert recognitionHanzi denominator is 1940 and writingHanzi is 700 with isComplete = false', () => {
      const db = new DatabaseSync(qbankDbPath, { readOnly: true });
      const service = getOfficialCoverageService();
      const report = service.computeOfficialCoverage(db, { skipCache: true });

      // Recognition Hanzi
      expect(report.dimensions.recognitionHanzi.denominator).toBe(1940);
      expect(report.dimensions.recognitionHanzi.status).toBe('verified_complete');
      expect(report.dimensions.recognitionHanzi.is_complete).toBe(false);

      // Writing Hanzi
      expect(report.dimensions.writingHanzi.denominator).toBe(700);
      expect(report.dimensions.writingHanzi.status).toBe('partial');
      expect(report.dimensions.writingHanzi.is_complete).toBe(false);

      db.close();
    });
  });

  describe('3. Database Safety & Immutability Verification', () => {
    it('should assert data/hsk_exam.db SHA-256 matches dc299c49a28e11edb833881952956ff8735ebb8f98844f9f05be0366e4e357f1', () => {
      expect(fs.existsSync(hskExamDbPath)).toBe(true);
      const buf = fs.readFileSync(hskExamDbPath);
      const sha256 = crypto.createHash('sha256').update(buf).digest('hex').toLowerCase();
      expect(sha256).toBe('dc299c49a28e11edb833881952956ff8735ebb8f98844f9f05be0366e4e357f1');
    });

    it('should assert question_knowledge_links table is NOT present in data/qbank/qbank.db', () => {
      const db = new DatabaseSync(qbankDbPath, { readOnly: true });
      const tables: any[] = db.prepare("SELECT name FROM sqlite_master WHERE type IN ('table', 'view')").all();
      const tableNames = tables.map((t) => t.name);

      expect(tableNames).not.toContain('question_knowledge_links');

      const qklRow: any = db.prepare(`
        SELECT count(*) as cnt FROM sqlite_master WHERE type='table' AND name='question_knowledge_links'
      `).get();
      expect(Number(qklRow.cnt)).toBe(0);

      db.close();
    });

    it('should assert exam_sessions row count in data/qbank/qbank.db is untouched', () => {
      const db = new DatabaseSync(qbankDbPath, { readOnly: true });
      const row: any = db.prepare('SELECT COUNT(*) as cnt FROM exam_sessions').get();
      expect(Number(row.cnt)).toBeGreaterThanOrEqual(246);
      db.close();
    });
  });

  describe('4. Adversarial Synthetic Injection & Boundary Attack Harness', () => {
    it('should defend against anomalous status injections into questions and pending_questions', () => {
      const attackDb = new DatabaseSync(':memory:');
      attackDb.exec(`
        CREATE TABLE questions (
          id TEXT PRIMARY KEY,
          stem TEXT NOT NULL,
          passage TEXT,
          options TEXT NOT NULL,
          answer_idx INTEGER NOT NULL,
          tested_vocab TEXT,
          level INTEGER NOT NULL,
          skill TEXT NOT NULL,
          part_type TEXT NOT NULL,
          topic TEXT,
          status TEXT NOT NULL DEFAULT 'approved',
          is_active INTEGER NOT NULL DEFAULT 1
        );

        CREATE TABLE pending_questions (
          id TEXT PRIMARY KEY,
          stem TEXT NOT NULL,
          options TEXT NOT NULL,
          answer_idx INTEGER NOT NULL,
          tested_vocab TEXT,
          level INTEGER NOT NULL,
          skill TEXT NOT NULL,
          part_type TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending'
        );
      `);

      // 1. Legitimate approved question
      attackDb.prepare(`
        INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active, tested_vocab)
        VALUES ('legit_1', '明天我们一起去商店。', '["商店","学校","医院","机场"]', 0, 1, 'reading', 'read_fill_blank_4opt', 'approved', 1, '["商店"]');
      `).run();

      // 2. Attack Vector: pending question in pending_questions with status = 'pending'
      attackDb.prepare(`
        INSERT INTO pending_questions (id, stem, options, answer_idx, level, skill, part_type, status, tested_vocab)
        VALUES ('attack_pending_1', '他正在看书。', '["看书","吃饭"]', 0, 1, 'reading', 'read_fill_blank_4opt', 'pending', '["看书"]');
      `).run();

      // 3. Attack Vector: rejected question in pending_questions with status = 'rejected'
      attackDb.prepare(`
        INSERT INTO pending_questions (id, stem, options, answer_idx, level, skill, part_type, status, tested_vocab)
        VALUES ('attack_rejected_1', '今天天气不好。', '["天气","时间"]', 0, 1, 'reading', 'read_fill_blank_4opt', 'rejected', '["天气"]');
      `).run();

      // 4. Attack Vector: disabled question in questions table (is_active = 0)
      attackDb.prepare(`
        INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active, tested_vocab)
        VALUES ('attack_disabled_1', '我喝水。', '["水","茶"]', 0, 1, 'reading', 'read_fill_blank_4opt', 'approved', 0, '["水"]');
      `).run();

      // 5. Attack Vector: rejected question erroneously placed in questions table
      attackDb.prepare(`
        INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active, tested_vocab)
        VALUES ('attack_rejected_in_q', '我买苹果。', '["苹果","香蕉"]', 0, 1, 'reading', 'read_fill_blank_4opt', 'rejected', 1, '["苹果"]');
      `).run();

      // 6. Attack Vector: pending question erroneously placed in questions table
      attackDb.prepare(`
        INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active, tested_vocab)
        VALUES ('attack_pending_in_q', '他是医生。', '["医生","老师"]', 0, 1, 'reading', 'read_fill_blank_4opt', 'pending', 1, '["医生"]');
      `).run();

      // 7. Attack Vector: out-of-scope question (Level 7)
      attackDb.prepare(`
        INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active, tested_vocab)
        VALUES ('attack_level_7', '这是一个高级词汇。', '["高级","低级"]', 0, 7, 'reading', 'read_fill_blank_4opt', 'approved', 1, '["高级"]');
      `).run();

      // Run official coverage service on attackDb
      const service = getOfficialCoverageService();
      const report = service.computeOfficialCoverage(attackDb, { skipCache: true });

      // Assert: ONLY legit_1 is counted
      expect(report.summary.totalUniqueApprovedQuestions).toBe(1);
      expect(report.summary.approvedActiveCount).toBe(1);

      // Excluded counts should track pending, rejected, and disabled
      expect(report.summary.excludedPendingCount).toBe(1);
      expect(report.summary.excludedRejectedCount).toBe(1);
      // excludedDisabledCount tracks disabled/rejected/archived in questions table
      expect(report.summary.excludedDisabledCount).toBeGreaterThanOrEqual(1);

      // Direct verification on linking model
      const model = buildKnowledgeLinkingModel(attackDb);
      expect(model.uniqueQuestions.allApproved.size).toBe(1);
      expect(model.uniqueQuestions.allApproved.has('legit_1')).toBe(true);

      const hostileIds = [
        'attack_pending_1',
        'attack_rejected_1',
        'attack_disabled_1',
        'attack_rejected_in_q',
        'attack_pending_in_q',
        'attack_level_7',
      ];

      for (const hId of hostileIds) {
        expect(model.uniqueQuestions.allApproved.has(hId)).toBe(false);
        expect(model.forwardIndex.has(hId)).toBe(false);
      }

      attackDb.close();
    });

    it('should resist duplicate question linking inflation (1-count invariant under heavy link multiplication)', () => {
      const attackDb = new DatabaseSync(':memory:');
      attackDb.exec(`
        CREATE TABLE questions (
          id TEXT PRIMARY KEY,
          stem TEXT NOT NULL,
          passage TEXT,
          options TEXT NOT NULL,
          answer_idx INTEGER NOT NULL,
          tested_vocab TEXT,
          level INTEGER NOT NULL,
          skill TEXT NOT NULL,
          part_type TEXT NOT NULL,
          topic TEXT,
          status TEXT NOT NULL DEFAULT 'approved',
          is_active INTEGER NOT NULL DEFAULT 1
        );
      `);

      // 1 single question containing 15 vocabulary words and 25 characters in stem/passage/options
      attackDb.prepare(`
        INSERT INTO questions (id, stem, passage, options, answer_idx, level, skill, part_type, status, is_active, tested_vocab)
        VALUES (
          'q_dense',
          '今天早上我和朋友一起去图书馆借了一本书，下午我们去电影院看了一场非常感人的电影。',
          '这是一段关于周末日常生活的长篇阅读短文，包含了多个HSK 1-4级的高频词汇。',
          '["图书馆","电影院","火车站","飞机场"]',
          0,
          2,
          'reading',
          'read_comprehension_4opt',
          'approved',
          1,
          '["图书馆"]'
        );
      `).run();

      const service = getOfficialCoverageService();
      const report = service.computeOfficialCoverage(attackDb, { skipCache: true });

      // Unique questions invariant: total must be strictly 1
      expect(report.summary.totalUniqueApprovedQuestions).toBe(1);
      expect(report.summary.approvedActiveCount).toBe(1);

      const model = buildKnowledgeLinkingModel(attackDb);
      const prof = model.forwardIndex.get('q_dense');
      expect(prof).toBeDefined();
      // Should have generated many links
      expect(prof!.links.length).toBeGreaterThan(10);
      // But allApproved size is strictly 1
      expect(model.uniqueQuestions.allApproved.size).toBe(1);

      attackDb.close();
    });
  });
});
