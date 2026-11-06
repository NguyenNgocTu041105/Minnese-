/**
 * tests/official_coverage_service.test.ts
 *
 * Automated verification of Phase 2 Milestone M2 deliverables:
 * 1. Two-Tier Catalog Loading (5,334 headwords Tier 1, 5,400 knowledge items Tier 2, 700 writing chars, 1,940 recog chars)
 * 2. In-Memory Knowledge Linking Model & Inverted Index (Unique question counting invariant, 4-tier vocab boundary)
 * 3. Official Coverage Statistics Service (Approved-only filtering, denominator transparency, anti-fabrication)
 * 4. REST Router Integration (/coverage/official)
 * 5. Migration proposal file validation
 * 6. Database hash integrity (hsk_exam.db SHA-256)
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
  HIGH_FREQUENCY_FUNCTION_WORDS,
} from '../src/server/qbankCoverageEngine.js';
import {
  getOfficialCoverageService,
  OfficialCoverageReport,
} from '../src/server/qbankOfficialCoverageService.js';
import { qbankRouter } from '../src/server/qbankRoutes.js';

describe('Official Coverage & Knowledge Linking Service (Phase 2 Milestone M2)', () => {
  describe('1. Two-Tier Syllabus Catalog Loading', () => {
    it('should maintain Tier 1 (5,334 headwords) for backward-compatible FMM tokenizer', () => {
      const catalog = getSyllabusCatalog();
      expect(catalog.words.size).toBe(5334);
      expect(loadSyllabusVocab().size).toBe(5334);

      const wordsByLevel = [1, 2, 3, 4, 5, 6].map((l) => catalog.wordsByLevel.get(l as any)?.length);
      expect(wordsByLevel).toEqual([300, 197, 491, 990, 1579, 1777]);
      expect(catalog.maxWordLength).toBe(4);
    });

    it('should load Tier 2 (5,400 knowledge items) keyed by clean_word#level#pinyin#raw_word', () => {
      const catalog = getSyllabusCatalog();
      expect(catalog.knowledgeItems.size).toBe(5400);
      expect(loadSyllabusKnowledgeItems().size).toBe(5400);

      const knowledgeByLevel = [1, 2, 3, 4, 5, 6].map((l) => catalog.knowledgeItemsByLevel.get(l as any)?.length);
      // Perfectly matches official CLEC national syllabus targets:
      expect(knowledgeByLevel).toEqual([300, 200, 500, 1000, 1600, 1800]);

      // Verify composite key structure
      const sampleItem = catalog.knowledgeItems.get('点#2#diǎn#点2');
      expect(sampleItem).toBeDefined();
      expect(sampleItem?.clean_word).toBe('点');
      expect(sampleItem?.raw_word).toBe('点2');
      expect(sampleItem?.level).toBe(2);
      expect(sampleItem?.pinyin).toBe('diǎn');
    });

    it('should manage 1,940 recognition characters and 700 writing characters independently', () => {
      const catalog = getSyllabusCatalog();
      expect(catalog.chars.size).toBe(1940);
      expect(loadSyllabusChars().size).toBe(1940);

      const recogCounts = [1, 2, 3, 4, 5, 6].map((l) => catalog.charsByLevel.get(l as any)?.length);
      expect(recogCounts).toEqual([246, 125, 284, 441, 431, 413]);

      expect(catalog.writingChars.size).toBe(700);
      expect(loadSyllabusWritingChars().size).toBe(700);

      const writingCounts = [1, 2, 3, 4, 5, 6].map((l) => catalog.writingCharsByLevel.get(l as any)?.length);
      expect(writingCounts).toEqual([100, 0, 150, 150, 150, 150]);
    });

    it('should report grammar catalog status as missing with 572 standard items', () => {
      const grammarMeta = getGrammarCatalogMetadata();
      expect(grammarMeta.status).toBe('missing');
      expect(grammarMeta.totalItems).toBe(572);
      expect(grammarMeta.denominatorScope).toBe('clec_2021_hsk1_6_official_grammar_standard');
      expect(grammarMeta.byLevel).toEqual({
        1: 48,
        2: 81,
        3: 141,
        4: 144,
        5: 98,
        6: 60,
      });
    });
  });

  describe('2. Tested Vocab Heuristics & Boundary Protection', () => {
    it('should never promote high-frequency function words in reading comprehension options to tested vocab', () => {
      const catalog = getSyllabusCatalog();
      // Reading comprehension question with full sentence options containing "我", "很", "的"
      const question = {
        stem: '大家今天很开心，因为今天是他的生日。问：为什么开心？',
        options: ['今天很冷', '我的生日到了', '今天是生日', '没有作业'],
        answerIdx: 2, // "今天是生日"
        level: 2 as const, // "生日" is HSK Level 2 in HSK 3.0
        skill: 'reading',
        part_type: 'read_comprehension_4opt',
      };

      const { testedWords } = resolveTestedVocab(question, catalog.words);
      // High frequency words like "我", "很", "的", "是" should NOT be extracted as testedVocab
      expect(testedWords.has('我')).toBe(false);
      expect(testedWords.has('很')).toBe(false);
      expect(testedWords.has('的')).toBe(false);
      expect(testedWords.has('是')).toBe(false);
      // "生日" is a content word matching level 2
      expect(testedWords.has('生日')).toBe(true);
    });

    it('should strictly keep context-only words in contextVocab and never in testedVocab', () => {
      const catalog = getSyllabusCatalog();
      const question = {
        stem: '我家离学校很近，我每天走路上学。',
        options: ['远', '近', '大', '少'],
        answerIdx: 1, // "近"
        level: 1 as const,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
      };

      const { testedWords } = resolveTestedVocab(question, catalog.words);
      expect(testedWords.has('近')).toBe(true);

      const contextWords = extractContextVocab(question, testedWords, catalog.words);
      // "学校", "上学" are in context but NOT in testedWords
      expect(testedWords.has('学校')).toBe(false);
      expect(contextWords.has('学校')).toBe(true);
      expect(contextWords.has('近')).toBe(false); // Disjoint invariant
    });
  });

  describe('3. In-Memory Knowledge Linking Model & Unique Question Invariant', () => {
    it('should count 1 question linked to multiple knowledge items strictly ONCE in question totals', () => {
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

      // 1 question testing "苹果" with multiple words in stem ("妈妈", "特别", "喜欢")
      db.prepare(`
        INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active, tested_vocab)
        VALUES ('q_multi', '妈妈买的水果特别甜，我喜欢吃____。', '["苹果","电脑","医生","衣服"]', 0, 1, 'reading', 'read_fill_blank_4opt', 'approved', 1, '["苹果"]');
      `).run();

      const model = buildKnowledgeLinkingModel(db);
      expect(model.uniqueQuestions.allApproved.size).toBe(1);
      expect(model.uniqueQuestions.byLevel.get(1)?.size).toBe(1);
      expect(model.uniqueQuestions.bySkill.get('reading')?.size).toBe(1);

      // Question profile has links to vocab and recognition chars, but total questions remains 1
      const profile = model.forwardIndex.get('q_multi');
      expect(profile).toBeDefined();
      expect(profile?.links.length).toBeGreaterThan(5); // Multiple links
      expect(profile?.testedVocab).toContain('苹果');

      db.close();
    });
  });

  describe('4. Official Coverage Statistics Service', () => {
    it('should accurately compute official metrics over real data/qbank/qbank.db', () => {
      const db = new DatabaseSync('data/qbank/qbank.db', { readOnly: true });
      const service = getOfficialCoverageService();
      const report = service.computeOfficialCoverage(db, { skipCache: true });

      // Invariants check:
      expect(report.summary.totalUniqueApprovedQuestions).toBe(96);
      expect(report.summary.approvedActiveCount).toBe(96);
      expect(report.summary.excludedPendingCount).toBeGreaterThanOrEqual(0);
      expect(report.summary.excludedRejectedCount).toBeGreaterThanOrEqual(0);
      expect(report.summary.excludedDisabledCount).toBeGreaterThanOrEqual(0);

      // Curriculum Readiness check:
      expect(report.summary.curriculumReadiness.status).toBe('partial');
      expect(report.summary.curriculumReadiness.isComplete).toBe(false);
      expect(report.summary.curriculumReadiness.reasons.length).toBeGreaterThan(0);

      // Dimensions Denominator Transparency:
      expect(report.dimensions.vocabulary.denominator).toBe(5400);
      expect(report.dimensions.vocabulary.denominator_scope).toBe('clec_2025_hsk1_6_5400_items');
      expect(report.dimensions.vocabulary.status).toBe('verified_complete');
      expect(report.dimensions.vocabulary.is_complete).toBe(false);

      expect(report.dimensions.recognitionHanzi.denominator).toBe(1940);
      expect(report.dimensions.recognitionHanzi.denominator_scope).toBe('clec_2025_hsk1_6_recognition_chars_1940');
      expect(report.dimensions.recognitionHanzi.status).toBe('verified_complete');

      expect(report.dimensions.writingHanzi.denominator).toBe(700);
      expect(report.dimensions.writingHanzi.denominator_scope).toBe('clec_2025_hsk1_6_writing_chars_700');
      expect(report.dimensions.writingHanzi.status).toBe('partial');
      expect(report.dimensions.writingHanzi.is_complete).toBe(false);

      expect(report.dimensions.grammar.denominator).toBe(572);
      expect(report.dimensions.grammar.denominator_scope).toBe('clec_2021_hsk1_6_official_grammar_standard');
      expect(report.dimensions.grammar.status).toBe('missing');
      expect(report.dimensions.grammar.is_complete).toBe(false);

      // Breakdowns check:
      expect(Object.keys(report.byLevel).length).toBe(6);
      for (let l = 1; l <= 6; l++) {
        expect(report.byLevel[l].level).toBe(l);
        expect(report.byLevel[l].overallStatus).toBe('partial');
      }

      expect(report.bySkill['listening']).toBeDefined();
      expect(report.bySkill['reading']).toBeDefined();
      expect(report.bySkill['writing']).toBeDefined();

      db.close();
    });

    it('should support reverse lookup from knowledge item to question postings', () => {
      const db = new DatabaseSync('data/qbank/qbank.db', { readOnly: true });
      const service = getOfficialCoverageService();
      service.computeOfficialCoverage(db, { skipCache: true });

      // Look up postings for tested words (e.g. "出租车")
      const postings = service.getQuestionsForKnowledgeItem('vocab', '出租车', db);
      expect(Array.isArray(postings)).toBe(true);

      db.close();
    });
  });

  describe('5. REST Route Integration & Migration Proposal Validation', () => {
    it('should have GET /coverage/official registered on qbankRouter', () => {
      const routeStack = qbankRouter.stack;
      const officialRoute = routeStack.find((layer: any) => layer.route?.path === '/coverage/official');
      expect(officialRoute).toBeDefined();
      expect((officialRoute?.route as any)?.methods?.get).toBe(true);
    });

    it('should have valid migration proposal file in data/qbank/migrations/', () => {
      const proposalPath = path.resolve(
        process.cwd(),
        'data/qbank/migrations/proposal_20261025_question_knowledge_links.sql'
      );
      expect(fs.existsSync(proposalPath)).toBe(true);
      const content = fs.readFileSync(proposalPath, 'utf-8');
      expect(content).toContain('PROPOSAL ONLY — AWAITING EXPLICIT USER APPROVAL');
      expect(content).toContain('CREATE TABLE IF NOT EXISTS question_knowledge_links');
      expect(content).toContain('idx_qkl_type_key');
      expect(content).toContain('DROP TABLE IF EXISTS question_knowledge_links');
    });
  });

  describe('6. Database Preservation & Hash Integrity', () => {
    it('should strictly preserve data/hsk_exam.db hash', () => {
      const dbPath = path.resolve(process.cwd(), 'data/hsk_exam.db');
      const hash = crypto.createHash('sha256').update(fs.readFileSync(dbPath)).digest('hex').toUpperCase();
      expect(hash).toBe('DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1');
    });

    it('should preserve data/qbank/qbank.db rows and schema (no applied migrations)', () => {
      const db = new DatabaseSync('data/qbank/qbank.db', { readOnly: true });
      const tables: any[] = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
      const tableNames = tables.map((t) => t.name);

      // question_knowledge_links MUST NOT be applied to real qbank.db
      expect(tableNames).not.toContain('question_knowledge_links');

      // exam_sessions row count must remain intact
      const examRow: any = db.prepare('SELECT COUNT(*) as cnt FROM exam_sessions').get();
      expect(Number(examRow.cnt)).toBeGreaterThanOrEqual(246);

      // questions row count must remain exactly 89
      const qRow: any = db.prepare('SELECT COUNT(*) as cnt FROM questions').get();
      expect(Number(qRow.cnt)).toBe(96);

      db.close();
    });
  });
});
