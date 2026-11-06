/**
 * Phase 4 Milestone 2: Coverage Engine, Polyphone/Polyseme Inverted Index,
 * Invariant Verification Tier 0–3, Grammar Metadata & Distractor Rationales.
 *
 * Verifies:
 * 1. Multi-entry inverted index in buildKnowledgeLinkingModel for polyphones/polysemes
 *    so restored knowledge items receive postings and are not stuck at Tier 0.
 * 2. Invariant verification for Tier 0-3 (passage/distractor appearances never count
 *    as directly tested; pending/rejected questions never count toward official coverage).
 * 3. Grammar metadata unverified handling (grammar catalog missing -> unverified, 0%).
 * 4. Distractor rationale formatting and parsing inside explanation_vi and proposal validation.
 * 5. Database safety: data/hsk_exam.db hash preservation and zero unapproved live migrations.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

import {
  getSyllabusCatalog,
  buildKnowledgeLinkingModel,
  stripPinyinTones,
  isPinyinMatch,
  matchKnowledgeRecords,
  getGrammarCatalogMetadata,
  verifyGrammarMetadata,
  formatExplanationWithDistractorRationales,
  parseExplanationDistractorRationales,
  InMemoryKnowledgeLinkingModel,
  HskLevel,
} from '../src/server/qbankCoverageEngine.js';

import {
  getOfficialCoverageService,
  OfficialCoverageReport,
} from '../src/server/qbankOfficialCoverageService.js';

describe('Phase 4 Milestone 2: Polyphones, Invariants, Grammar & Distractors', () => {
  const qbankDbPath = path.resolve(process.cwd(), 'data/qbank/qbank.db');
  const hskExamDbPath = path.resolve(process.cwd(), 'data/hsk_exam.db');
  const expectedExamDbHash = 'DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1';

  // Helper to create an in-memory test database with full schema
  function createTestDb(): DatabaseSync {
    const db = new DatabaseSync(':memory:');
    db.exec(`
      CREATE TABLE IF NOT EXISTS questions (
        id TEXT PRIMARY KEY,
        batch_id TEXT,
        stem TEXT NOT NULL,
        options TEXT NOT NULL,
        answer_idx INTEGER NOT NULL,
        pinyin TEXT,
        explanation_vi TEXT,
        level INTEGER NOT NULL,
        skill TEXT NOT NULL,
        part_type TEXT NOT NULL,
        illustration_theme TEXT,
        topic TEXT,
        status TEXT DEFAULT 'pending',
        provider_used TEXT,
        rejection_note TEXT,
        content_hash TEXT,
        near_duplicate_signature TEXT,
        tested_vocab TEXT,
        passage TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS pending_questions (
        id TEXT PRIMARY KEY,
        batch_id TEXT,
        stem TEXT NOT NULL,
        options TEXT NOT NULL,
        answer_idx INTEGER NOT NULL,
        pinyin TEXT,
        explanation_vi TEXT,
        level INTEGER NOT NULL,
        skill TEXT NOT NULL,
        part_type TEXT NOT NULL,
        illustration_theme TEXT,
        topic TEXT,
        status TEXT DEFAULT 'pending',
        provider_used TEXT,
        rejection_note TEXT,
        content_hash TEXT,
        near_duplicate_signature TEXT,
        tested_vocab TEXT,
        passage TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    return db;
  }

  describe('1. Polyphone / Polyseme Multi-Entry Inverted Index', () => {
    it('should index all 5,400 knowledge items in invertedIndex and populate vocabMultiIndex', () => {
      const db = createTestDb();
      const model = buildKnowledgeLinkingModel(db);

      // Verify invertedIndex has exactly 5,400 items
      let vocabItemCount = 0;
      for (const rec of model.invertedIndex.values()) {
        if (rec.type === 'vocab') vocabItemCount++;
      }
      expect(vocabItemCount).toBe(5400);

      // Verify vocabMultiIndex exists and indexes multi-entry words
      expect(model.vocabMultiIndex).toBeDefined();
      expect(model.vocabMultiIndex.has('得')).toBe(true);
      const deiCandidates = model.vocabMultiIndex.get('得')!;
      expect(deiCandidates.length).toBeGreaterThanOrEqual(2);

      // Check levels of '得' candidates (Level 2 'de', Level 3 'dé', Level 3 'děi')
      const deiLevels = deiCandidates.map((c) => c.level);
      expect(deiLevels).toContain(2);
      expect(deiLevels).toContain(3);

      // Verify other restored polyphones/polysemes
      expect(model.vocabMultiIndex.get('只')!.length).toBeGreaterThanOrEqual(2);
      expect(model.vocabMultiIndex.get('长')!.length).toBeGreaterThanOrEqual(2);
      expect(model.vocabMultiIndex.get('点')!.length).toBeGreaterThanOrEqual(2);
      expect(model.vocabMultiIndex.get('过')!.length).toBeGreaterThanOrEqual(2);
      expect(model.vocabMultiIndex.get('为')!.length).toBeGreaterThanOrEqual(2);

      db.close();
    });

    it('should correctly disambiguate polyphones via pinyin and level, moving restored items out of Tier 0', () => {
      const db = createTestDb();

      // Insert Question A: HSK 2 testing '得' (de)
      db.prepare(`
        INSERT INTO questions (id, stem, options, answer_idx, pinyin, level, skill, part_type, status, is_active)
        VALUES (
          'q_de_lv2',
          '他走____太快了，我跟不上。',
          '["得", "地", "的", "过"]',
          0,
          'tā zǒu de tài kuài le, wǒ gēn bu shàng.',
          2,
          'reading',
          'read_fill_blank_4opt',
          'approved',
          1
        )
      `).run();

      // Insert Question B: HSK 3 testing '得' (děi - restored Category A polyphone)
      db.prepare(`
        INSERT INTO questions (id, stem, options, answer_idx, pinyin, level, skill, part_type, status, is_active)
        VALUES (
          'q_dei_lv3',
          '时间不早了，我们____出发了。',
          '["得", "可以", "能", "会"]',
          0,
          'shí jiān bù zǎo le, wǒ men děi chū fā le.',
          3,
          'reading',
          'read_fill_blank_4opt',
          'approved',
          1
        )
      `).run();

      // Insert Question C: HSK 2 testing '点2' (restored Category B polyseme)
      db.prepare(`
        INSERT INTO questions (id, stem, options, answer_idx, pinyin, level, skill, part_type, status, is_active)
        VALUES (
          'q_dian_lv2',
          '服务员，我们要____菜。',
          '["点", "看", "吃", "做"]',
          0,
          'fú wù yuán, wǒ men yào diǎn cài.',
          2,
          'reading',
          'read_fill_blank_4opt',
          'approved',
          1
        )
      `).run();

      const model = buildKnowledgeLinkingModel(db);

      // Verify Question A linked to Level 2 '得'
      const profA = model.forwardIndex.get('q_de_lv2')!;
      expect(profA.testedVocab).toContain('得');

      // Verify Question B linked to Level 3 '得' (děi)
      const profB = model.forwardIndex.get('q_dei_lv3')!;
      expect(profB.testedVocab).toContain('得');

      // Check restored Level 3 'děi' item in invertedIndex
      // Key format: 'vocab:3:得#3#děi#得'
      const deiRestoredRec = model.invertedIndex.get('vocab:3:得#3#děi#得');
      expect(deiRestoredRec).toBeDefined();
      expect(deiRestoredRec!.postings.length).toBeGreaterThanOrEqual(1);
      expect(deiRestoredRec!.postings.some((p) => p.questionId === 'q_dei_lv3')).toBe(true);
      expect(deiRestoredRec!.tier).toBe(2); // Directly tested, NOT Tier 0!
      expect(deiRestoredRec!.tierLabel).toBe('directly_tested');

      // Check restored Level 2 '点2' item in invertedIndex
      const dianRestoredRec = model.invertedIndex.get('vocab:2:点#2#diǎn#点2');
      expect(dianRestoredRec).toBeDefined();
      expect(dianRestoredRec!.postings.length).toBeGreaterThanOrEqual(1);
      expect(dianRestoredRec!.postings.some((p) => p.questionId === 'q_dian_lv2')).toBe(true);
      expect(dianRestoredRec!.tier).toBe(2); // Directly tested, NOT Tier 0!

      db.close();
    });

    it('should support reverse lookup for clean words, polyphones, and specific composite keys', () => {
      const db = createTestDb();

      db.prepare(`
        INSERT INTO questions (id, stem, options, answer_idx, pinyin, level, skill, part_type, status, is_active)
        VALUES (
          'q_dei_test',
          '我们____快点走。',
          '["得", "想", "去", "到"]',
          0,
          'wǒ men děi kuài diǎn zǒu.',
          3,
          'reading',
          'read_fill_blank_4opt',
          'approved',
          1
        )
      `).run();

      const service = getOfficialCoverageService();
      service.computeOfficialCoverage(db, { skipCache: true });

      // Lookup by clean word '得'
      const cleanWordPostings = service.getQuestionsForKnowledgeItem('vocab', '得', db);
      expect(cleanWordPostings.length).toBeGreaterThanOrEqual(1);
      expect(cleanWordPostings.some((p) => p.questionId === 'q_dei_test')).toBe(true);

      // Lookup by specific composite key 'vocab:3:得#3#děi#得'
      const specificKeyPostings = service.getQuestionsForKnowledgeItem('vocab', 'vocab:3:得#3#děi#得', db);
      expect(specificKeyPostings.length).toBe(1);
      expect(specificKeyPostings[0].questionId).toBe('q_dei_test');

      db.close();
    });
  });

  describe('2. Coverage Tier 0–3 Invariants', () => {
    it('INVARIANT: words appearing only in passage or distractors NEVER count as directly tested (remain Tier 1)', () => {
      const db = createTestDb();

      // Stem tests '苹果' (apple).
      // Passage contains '电脑' (computer) and '图书馆' (library).
      // Distractors contain '香蕉' (banana), '橘子' (orange), '西瓜' (watermelon).
      db.prepare(`
        INSERT INTO questions (id, stem, passage, options, answer_idx, level, skill, part_type, status, is_active)
        VALUES (
          'q_context_test_01',
          '桌子上有一个____。',
          '我昨天在图书馆用电脑查了资料，发现很多关于水果的信息。',
          '["苹果", "香蕉", "橘子", "西瓜"]',
          0,
          1,
          'reading',
          'read_fill_blank_4opt',
          'approved',
          1
        )
      `).run();

      const model = buildKnowledgeLinkingModel(db);
      const prof = model.forwardIndex.get('q_context_test_01')!;

      // Directly tested is ONLY '苹果'
      expect(prof.testedVocab).toEqual(['苹果']);

      // Passage words and distractors are in contextVocab
      expect(prof.contextVocab).toContain('电脑');
      expect(prof.contextVocab).toContain('图书馆');
      expect(prof.contextVocab).toContain('香蕉');

      // Verify knowledge records in invertedIndex
      // '苹果' has directlyTestedCount = 1 -> Tier 2
      const appleRec = model.vocabIndex.get('苹果')!;
      expect(appleRec.directlyTestedCount).toBe(1);
      expect(appleRec.tier).toBe(2);
      expect(appleRec.tierLabel).toBe('directly_tested');

      // '电脑' only appeared in passage -> directlyTestedCount = 0, contextualCount = 1 -> Tier 1
      const pcRec = model.vocabIndex.get('电脑')!;
      expect(pcRec.directlyTestedCount).toBe(0);
      expect(pcRec.contextualCount).toBe(1);
      expect(pcRec.tier).toBe(1);
      expect(pcRec.tierLabel).toBe('contextual_appearance');

      // '香蕉' only appeared in distractor -> Tier 1
      const bananaRec = model.vocabIndex.get('香蕉')!;
      expect(bananaRec.directlyTestedCount).toBe(0);
      expect(bananaRec.contextualCount).toBe(1);
      expect(bananaRec.tier).toBe(1);
      expect(bananaRec.tierLabel).toBe('contextual_appearance');

      db.close();
    });

    it('INVARIANT: pending and rejected questions NEVER count toward official coverage', () => {
      const db = createTestDb();

      // Approved question
      db.prepare(`
        INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active)
        VALUES ('q_app_01', '我想吃____。', '["米饭", "水", "茶", "书"]', 0, 1, 'reading', 'read_4opt', 'approved', 1)
      `).run();

      // Pending questions (one in questions table, one in pending_questions table)
      db.prepare(`
        INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active)
        VALUES ('q_pend_in_q', '我想喝____。', '["茶", "饭", "书", "猫"]', 0, 1, 'reading', 'read_4opt', 'pending', 1)
      `).run();
      db.prepare(`
        INSERT INTO pending_questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active)
        VALUES ('q_pend_in_pend', '我想买____。', '["苹果", "天", "大", "小"]', 0, 1, 'reading', 'read_4opt', 'pending', 1)
      `).run();

      // Rejected questions
      db.prepare(`
        INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active)
        VALUES ('q_rej_in_q', '我要____。', '["走", "高", "红", "绿"]', 0, 1, 'reading', 'read_4opt', 'rejected', 1)
      `).run();
      db.prepare(`
        INSERT INTO pending_questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active)
        VALUES ('q_rej_in_pend', '他去____。', '["学校", "了", "吗", "呢"]', 0, 1, 'reading', 'read_4opt', 'rejected', 1)
      `).run();

      // Disabled question (is_active = 0)
      db.prepare(`
        INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active)
        VALUES ('q_dis_01', '今天天气____。', '["很好", "坏", "冷", "热"]', 0, 1, 'reading', 'read_4opt', 'approved', 0)
      `).run();

      const service = getOfficialCoverageService();
      const report = service.computeOfficialCoverage(db, { skipCache: true });

      // Only 1 question is approved and active
      expect(report.summary.totalUniqueApprovedQuestions).toBe(1);
      expect(report.summary.approvedActiveCount).toBe(1);

      // Excluded counts properly track unapproved items
      expect(report.summary.excludedPendingCount).toBe(1);
      expect(report.summary.excludedRejectedCount).toBe(1);
      expect(report.summary.excludedDisabledCount).toBe(2); // q_pend_in_q (non-approved), q_rej_in_q, q_dis_01 (is_active=0)

      // Ensure linking model contains strictly 'q_app_01'
      const model = buildKnowledgeLinkingModel(db);
      expect(model.uniqueQuestions.allApproved.has('q_app_01')).toBe(true);
      expect(model.uniqueQuestions.allApproved.has('q_pend_in_q')).toBe(false);
      expect(model.uniqueQuestions.allApproved.has('q_pend_in_pend')).toBe(false);
      expect(model.uniqueQuestions.allApproved.has('q_rej_in_q')).toBe(false);
      expect(model.uniqueQuestions.allApproved.has('q_rej_in_pend')).toBe(false);
      expect(model.uniqueQuestions.allApproved.has('q_dis_01')).toBe(false);

      db.close();
    });

    it('INVARIANT: a single question linked to multiple knowledge items counts ONCE in unique question totals', () => {
      const db = createTestDb();

      // One question testing '苹果' and containing multiple words, characters, and topic
      db.prepare(`
        INSERT INTO questions (id, stem, passage, options, answer_idx, level, skill, part_type, topic, status, is_active)
        VALUES (
          'q_multi_link_01',
          '妈妈去商店买了苹果和香蕉。',
          '北京的天气非常好，我们都很开心。',
          '["苹果", "香蕉", "西瓜", "草莓"]',
          0,
          1,
          'reading',
          'read_fill_blank_4opt',
          'shopping',
          'approved',
          1
        )
      `).run();

      const model = buildKnowledgeLinkingModel(db);
      const prof = model.forwardIndex.get('q_multi_link_01')!;

      // Has multiple knowledge links across types
      expect(prof.links.length).toBeGreaterThan(5);

      // But unique question totals across all dimensions remain strictly 1
      expect(model.uniqueQuestions.allApproved.size).toBe(1);
      expect(model.uniqueQuestions.byLevel.get(1)!.size).toBe(1);
      expect(model.uniqueQuestions.bySkill.get('reading')!.size).toBe(1);
      expect(model.uniqueQuestions.byPartType.get('read_fill_blank_4opt')!.size).toBe(1);

      db.close();
    });

    it('INVARIANT: Tier 3 reinforcement diversity requires >= 2 distinct stems or part_types', () => {
      const db = createTestDb();

      // Item tests '中国' (China) twice with IDENTICAL stem and part_type (near duplicate)
      db.prepare(`
        INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active)
        VALUES
          ('q_dup_01', '我是____人。', '["中国", "美国", "英国", "法国"]', 0, 1, 'reading', 'read_4opt', 'approved', 1),
          ('q_dup_02', '我是____人。', '["中国", "日本", "韩国", "德国"]', 0, 1, 'reading', 'read_4opt', 'approved', 1);
      `).run();

      let model = buildKnowledgeLinkingModel(db);
      let chinaRec = model.vocabIndex.get('中国')!;
      expect(chinaRec.directlyTestedCount).toBe(2);
      expect(chinaRec.distinctStemsCount).toBe(1); // Normalized stems are identical
      expect(chinaRec.distinctPartTypes.length).toBe(1);
      // Fails diversity requirement -> stays at Tier 2 (directly_tested), NOT Tier 3!
      expect(chinaRec.tier).toBe(2);
      expect(chinaRec.tierLabel).toBe('directly_tested');

      // Now add a 3rd question with a DISTINCT stem and part_type
      db.prepare(`
        INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active)
        VALUES
          ('q_div_03', '北京是____的首都。', '["中国", "外国", "大国", "小国"]', 0, 1, 'reading', 'read_cloze_4opt', 'approved', 1);
      `).run();

      model = buildKnowledgeLinkingModel(db);
      chinaRec = model.vocabIndex.get('中国')!;
      expect(chinaRec.directlyTestedCount).toBe(3);
      expect(chinaRec.distinctStemsCount).toBe(2);
      expect(chinaRec.distinctPartTypes.length).toBe(2);
      // Satisfies diversity -> advances to Tier 3 (reinforced)!
      expect(chinaRec.tier).toBe(3);
      expect(chinaRec.tierLabel).toBe('reinforced');

      db.close();
    });
  });

  describe('3. Grammar Metadata Unverified Handling', () => {
    it('should report grammar catalog metadata as missing with 572 standard items', () => {
      const meta = getGrammarCatalogMetadata();
      expect(meta.status).toBe('missing');
      expect(meta.totalItems).toBe(572);
      expect(meta.denominatorScope).toBe('clec_2021_hsk1_6_official_grammar_standard');
      expect(meta.byLevel[1]).toBe(48);
      expect(meta.byLevel[2]).toBe(81);
      expect(meta.byLevel[3]).toBe(141);
      expect(meta.byLevel[4]).toBe(144);
      expect(meta.byLevel[5]).toBe(98);
      expect(meta.byLevel[6]).toBe(60);
    });

    it('should mark declared grammar points as unverified with 0% coverage and isComplete false', () => {
      const res = verifyGrammarMetadata(['把字句', '被字句']);
      expect(res.status).toBe('unverified');
      expect(res.isComplete).toBe(false);
      expect(res.coveragePercentage).toBe(0.0);
      expect(res.totalStandardItems).toBe(572);
      expect(res.unverifiedDeclaredPoints).toEqual(['把字句', '被字句']);
      expect(res.reason).toContain('CLEC 2021: 572 điểm');
    });

    it('should verify official coverage service reports grammar as missing with 0% and isComplete false', () => {
      const db = createTestDb();
      const service = getOfficialCoverageService();
      const report = service.computeOfficialCoverage(db, { skipCache: true });

      expect(report.dimensions.grammar.status).toBe('missing');
      expect(report.dimensions.grammar.numerator).toBe(0);
      expect(report.dimensions.grammar.denominator).toBe(572);
      expect(report.dimensions.grammar.percentage).toBe(0.0);
      expect(report.dimensions.grammar.is_complete).toBe(false);
      expect(report.dimensions.grammar.denominator_scope).toBe('clec_2021_hsk1_6_official_grammar_standard');

      // Curriculum readiness must remain false due to missing grammar catalog
      expect(report.summary.curriculumReadiness.isComplete).toBe(false);
      expect(report.summary.curriculumReadiness.status).toBe('partial');
      expect(report.summary.curriculumReadiness.reasons.some((r) => r.includes('Ngữ pháp'))).toBe(true);

      db.close();
    });
  });

  describe('4. Distractor Rationales Formatting & Migration Proposal', () => {
    it('should format and parse structured distractor rationales inside explanation_vi', () => {
      const payload = {
        summaryVi: "Câu này có nghĩa là 'Cơm mẹ tự tay nấu rất thơm.'",
        correctExplanationVi: "Trạng từ '亲自' (đích thân, tự mình) phù hợp để bổ nghĩa cho động từ '做'.",
        distractorRationales: [
          {
            optionIdx: 1,
            optionText: '亲切',
            rationaleVi: "'亲切' là tính từ (thân thiết), không thể làm trạng ngữ đứng trước động từ trong ngữ cảnh này.",
          },
          {
            optionIdx: 2,
            optionText: '亲人',
            rationaleVi: "'亲人' là danh từ (người thân), không phù hợp vị trí ngữ pháp.",
          },
          {
            optionIdx: 3,
            optionText: '情感',
            rationaleVi: "'情感' là danh từ (tình cảm), không phù hợp ngữ nghĩa câu.",
          },
        ],
      };

      const formatted = formatExplanationWithDistractorRationales(payload);
      expect(formatted).toContain('- Đáp án đúng:');
      expect(formatted).toContain('- Phân tích phương án nhiễu:');
      expect(formatted).toContain('Phương án B (亲切):');
      expect(formatted).toContain('Phương án C (亲人):');
      expect(formatted).toContain('Phương án D (情感):');

      const parsed = parseExplanationDistractorRationales(
        formatted,
        ['亲自', '亲切', '亲人', '情感'],
        0
      );
      expect(parsed.hasDistractorRationales).toBe(true);
      expect(parsed.distractors.length).toBe(3);
      expect(parsed.distractors[0].optionIdx).toBe(1);
      expect(parsed.distractors[0].optionText).toBe('亲切');
      expect(parsed.distractors[0].rationaleVi).toContain('tính từ');
    });

    it('should verify migration proposal proposal_20261025_distractor_rationales.sql exists and is strictly unapplied', () => {
      const proposalPath = path.resolve(process.cwd(), 'data/qbank/migrations/proposal_20261025_distractor_rationales.sql');
      expect(fs.existsSync(proposalPath)).toBe(true);

      const content = fs.readFileSync(proposalPath, 'utf-8');
      expect(content).toContain('PROPOSAL ONLY');
      expect(content).toContain('question_distractor_rationales');
      expect(content).toContain('LÝ DO ĐỀ XUẤT');
      expect(content).toContain('KẾ HOẠCH BẢO TOÀN DỮ LIỆU');
      expect(content).toContain('KẾ HOẠCH HOÀN TÁC');

      // Zero-Risk Safety Check: Ensure the table is NOT present in live data/qbank/qbank.db
      const liveDb = new DatabaseSync(qbankDbPath, { readOnly: true });
      const tableCheck: any = liveDb.prepare(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='question_distractor_rationales'
      `).get();
      expect(tableCheck).toBeUndefined();
      liveDb.close();
    });
  });

  describe('5. Database Safety & Immutability Verification', () => {
    it('should assert data/hsk_exam.db SHA-256 strictly matches DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1', () => {
      const buffer = fs.readFileSync(hskExamDbPath);
      const hash = crypto.createHash('sha256').update(buffer).digest('hex').toUpperCase();
      expect(hash).toBe(expectedExamDbHash);
    });

    it('should assert live data/qbank/qbank.db schema is completely unmutated', () => {
      const liveDb = new DatabaseSync(qbankDbPath, { readOnly: true });

      // Verify question_knowledge_links is NOT applied
      const linksTable: any = liveDb.prepare(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='question_knowledge_links'
      `).get();
      expect(linksTable).toBeUndefined();

      // Verify question_distractor_rationales is NOT applied
      const distractorTable: any = liveDb.prepare(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='question_distractor_rationales'
      `).get();
      expect(distractorTable).toBeUndefined();

      // Verify exam_sessions row count is intact (>= 246 rows)
      const sessionCount: any = liveDb.prepare(`SELECT COUNT(*) as cnt FROM exam_sessions`).get();
      expect(Number(sessionCount.cnt)).toBeGreaterThanOrEqual(246);

      liveDb.close();
    });
  });
});
