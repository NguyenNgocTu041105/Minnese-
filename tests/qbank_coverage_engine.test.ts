import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import {
  getSyllabusCatalog,
  loadSyllabusVocab,
  loadSyllabusChars,
  scanChineseWords,
  segmentSyllabusTokens,
  computeVocabCoverage,
  planBatchVocab,
  verifyQuestionVocab,
  classifyGroupStatus,
  computeCoverageMatrix,
  getPriorityDeficitGroup,
  applyAdditiveQBankMigrations,
  computeContentHash,
  computeNearDuplicateSignature,
  getCoverageTargets,
  invalidateVocabCoverageCache,
} from '../src/server/qbankCoverageEngine.js';

describe('QBank Coverage Engine & Syllabus Loader (Milestone 1)', () => {
  describe('1. Authoritative HSK 1–6 Syllabus Loader', () => {
    it('should load exactly 5,334 vocabulary words strictly for HSK 1–6 and exclude HSK 7–9', () => {
      const vocabMap = loadSyllabusVocab();
      expect(vocabMap.size).toBe(5334);

      const catalog = getSyllabusCatalog();
      expect(catalog.words.size).toBe(5334);

      // Verify level breakdowns matching authoritative CLEC 2025-11
      expect(catalog.wordsByLevel.get(1)?.length).toBe(300);
      expect(catalog.wordsByLevel.get(2)?.length).toBe(197);
      expect(catalog.wordsByLevel.get(3)?.length).toBe(491);
      expect(catalog.wordsByLevel.get(4)?.length).toBe(990);
      expect(catalog.wordsByLevel.get(5)?.length).toBe(1579);
      expect(catalog.wordsByLevel.get(6)?.length).toBe(1777);

      // Verify strict exclusion of Level 7+
      for (const word of vocabMap.values()) {
        expect(word.level).toBeGreaterThanOrEqual(1);
        expect(word.level).toBeLessThanOrEqual(6);
      }
    });

    it('should load exactly 1,940 recognition characters for HSK 1–6 and filter out HSK 7', () => {
      const charMap = loadSyllabusChars();
      expect(charMap.size).toBe(1940);

      const catalog = getSyllabusCatalog();
      expect(catalog.chars.size).toBe(1940);

      expect(catalog.charsByLevel.get(1)?.length).toBe(246);
      expect(catalog.charsByLevel.get(2)?.length).toBe(125);
      expect(catalog.charsByLevel.get(3)?.length).toBe(284);
      expect(catalog.charsByLevel.get(4)?.length).toBe(441);
      expect(catalog.charsByLevel.get(5)?.length).toBe(431);
      expect(catalog.charsByLevel.get(6)?.length).toBe(413);

      for (const charItem of charMap.values()) {
        expect(charItem.level).toBeGreaterThanOrEqual(1);
        expect(charItem.level).toBeLessThanOrEqual(6);
        expect(charItem.is_recognition).toBe(true);
      }
    });

    it('should determine maximum word length is 4', () => {
      const catalog = getSyllabusCatalog();
      expect(catalog.maxWordLength).toBe(4);
    });
  });

  describe('2. Forward Maximum Matching (FMM) Tokenizer', () => {
    it('should accurately segment Chinese sentences into official HSK 3.0 syllabus words', () => {
      const text = '妈妈____做的饭特别香，我们都很喜欢吃。';
      const words = scanChineseWords(text);
      const tokenList = words.map((w) => w.word);

      expect(tokenList).toContain('妈妈');
      expect(tokenList).toContain('饭');
      expect(tokenList).toContain('特别');
      expect(tokenList).toContain('我们');
      expect(tokenList).toContain('喜欢');
      expect(tokenList).toContain('吃');
    });

    it('should segment tokens without punctuation or whitespace', () => {
      const text = '我去学校学习汉语！';
      const tokens = segmentSyllabusTokens(text);
      expect(tokens).toContain('我');
      expect(tokens).toContain('去');
      expect(tokens).toContain('学校');
      expect(tokens).toContain('学习');
      expect(tokens).toContain('汉语');
    });

    it('should handle empty or null string gracefully', () => {
      expect(scanChineseWords('')).toEqual([]);
      expect(segmentSyllabusTokens('')).toEqual([]);
    });
  });

  describe('3. Safe Additive SQLite Migrations', () => {
    let testDb: DatabaseSync;

    beforeEach(() => {
      testDb = new DatabaseSync(':memory:');
      // Create minimal legacy schema
      testDb.exec(`
        CREATE TABLE questions (
          id TEXT PRIMARY KEY,
          stem TEXT NOT NULL,
          options TEXT NOT NULL,
          answer_idx INTEGER NOT NULL,
          level INTEGER NOT NULL,
          skill TEXT NOT NULL,
          part_type TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'approved'
        );
        CREATE TABLE pending_questions (
          id TEXT PRIMARY KEY,
          stem TEXT NOT NULL,
          options TEXT NOT NULL,
          answer_idx INTEGER NOT NULL,
          level INTEGER NOT NULL,
          skill TEXT NOT NULL,
          part_type TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending'
        );
      `);
    });

    it('should safely add missing columns and indexes without errors', () => {
      applyAdditiveQBankMigrations(testDb);

      const qCols = (testDb.prepare('PRAGMA table_info(questions)').all() as any[]).map((c) => c.name);
      expect(qCols).toContain('content_hash');
      expect(qCols).toContain('near_duplicate_signature');
      expect(qCols).toContain('tested_vocab');
      expect(qCols).toContain('passage');
      expect(qCols).toContain('is_active');
      expect(qCols).toContain('rejection_note');
      expect(qCols).toContain('batch_id');

      const pCols = (testDb.prepare('PRAGMA table_info(pending_questions)').all() as any[]).map((c) => c.name);
      expect(pCols).toContain('near_duplicate_signature');
      expect(pCols).toContain('tested_vocab');
      expect(pCols).toContain('passage');
      expect(pCols).toContain('is_active');

      // Calling again must be idempotent and safe
      expect(() => applyAdditiveQBankMigrations(testDb)).not.toThrow();
    });

    it('should backfill legacy rows with hashes and is_active = 1', () => {
      testDb.exec(`
        INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status)
        VALUES ('q1', '你好吗？', '["好","不","再见","谢谢"]', 0, 1, 'reading', 'part1', 'approved');
      `);

      applyAdditiveQBankMigrations(testDb);

      const row: any = testDb.prepare("SELECT * FROM questions WHERE id = 'q1'").get();
      expect(row.is_active).toBe(1);
      expect(typeof row.content_hash).toBe('string');
      expect(row.content_hash.length).toBe(64);
      expect(typeof row.near_duplicate_signature).toBe('string');
      expect(row.near_duplicate_signature.length).toBe(64);
    });
  });

  describe('4. 4-Tier Vocabulary Coverage Tracker', () => {
    let testDb: DatabaseSync;

    beforeEach(() => {
      testDb = new DatabaseSync(':memory:');
      testDb.exec(`
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
          passage TEXT
        );
      `);
    });

    it('should correctly classify Tier 0, Tier 1, Tier 2, and Tier 3 with diversity requirements', () => {
      // Word "苹果" (Apple, Level 1):
      // Question 1: tests "苹果" directly in part_type 'listen_picture'
      testDb.prepare(`
        INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active, tested_vocab)
        VALUES ('q1', '这是什么水果？', '["苹果","香蕉","橘子"]', 0, 1, 'listening', 'listen_picture_match_3opt', 'approved', 1, '["苹果"]');
      `).run();

      let report = computeVocabCoverage(testDb);
      expect(report.wordDetails.get('苹果')?.tier).toBe(2);
      expect(report.wordDetails.get('苹果')?.tierLabel).toBe('directly_tested');

      // Add a 2nd question testing "苹果" with the SAME part_type and nearly identical stem -> stays Tier 2
      testDb.prepare(`
        INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active, tested_vocab)
        VALUES ('q2', '这是什么水果？', '["苹果","西瓜","葡萄"]', 0, 1, 'listening', 'listen_picture_match_3opt', 'approved', 1, '["苹果"]');
      `).run();

      // Invalidate cache and recompute
      invalidateVocabCoverageCache(testDb);
      report = computeVocabCoverage(testDb);
      // Stems are identical and part_type is identical, so it lacks diversity -> remains Tier 2
      expect(report.wordDetails.get('苹果')?.tier).toBe(2);

      // Now add a 3rd question testing "苹果" in a DIFFERENT part_type ('read_fill_blank') with distinct stem -> promotes to Tier 3!
      testDb.prepare(`
        INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active, tested_vocab)
        VALUES ('q3', '我今天去超市买红色的____。', '["苹果","桌子","医生"]', 0, 1, 'reading', 'read_fill_blank_word_bank_6opt', 'approved', 1, '["苹果"]');
      `).run();

      invalidateVocabCoverageCache(testDb);
      report = computeVocabCoverage(testDb);
      expect(report.wordDetails.get('苹果')?.tier).toBe(3);
      expect(report.wordDetails.get('苹果')?.tierLabel).toBe('reinforced');

      // Word "香蕉" appears only as distractor in q1 -> Tier 1 (contextual appearance)
      expect(report.wordDetails.get('香蕉')?.tier).toBe(1);
      expect(report.wordDetails.get('香蕉')?.tierLabel).toBe('contextual_appearance');

      // Word "飞机" has 0 appearances -> Tier 0 (uncovered)
      expect(report.wordDetails.get('飞机')?.tier).toBe(0);
      expect(report.wordDetails.get('飞机')?.tierLabel).toBe('uncovered');
    });

    it('should ignore pending, rejected, or inactive questions in official coverage', () => {
      testDb.prepare(`
        INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active, tested_vocab)
        VALUES
          ('q_pen', '待审核', '["飞机"]', 0, 1, 'reading', 'p1', 'pending', 1, '["飞机"]'),
          ('q_rej', '被拒绝', '["飞机"]', 0, 1, 'reading', 'p1', 'rejected', 1, '["飞机"]'),
          ('q_ina', '已禁用', '["飞机"]', 0, 1, 'reading', 'p1', 'approved', 0, '["飞机"]');
      `).run();

      const report = computeVocabCoverage(testDb);
      expect(report.wordDetails.get('飞机')?.tier).toBe(0);
    });

    it('should flag words exceeding overused threshold (= 5)', () => {
      for (let i = 1; i <= 6; i++) {
        testDb.prepare(`
          INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active, tested_vocab)
          VALUES ('q_ov_${i}', 'Stem ${i}', '["猫"]', 0, 1, 'reading', 'pt_${i}', 'approved', 1, '["猫"]');
        `).run();
      }

      const report = computeVocabCoverage(testDb);
      expect(report.wordDetails.get('猫')?.isOverused).toBe(true);
      expect(report.overusedWords).toContain('猫');
    });
  });

  describe('5. Pre-Generation Vocabulary Planner (`planBatchVocab`)', () => {
    let testDb: DatabaseSync;

    beforeEach(() => {
      testDb = new DatabaseSync(':memory:');
      testDb.exec(`
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
          tested_vocab TEXT
        );
      `);
    });

    it('should select targets strictly adhering to 60/25/15 ratio and 1-2 words per question slot', () => {
      const plan = planBatchVocab(2, 10, testDb);
      expect(plan.level).toBe(2);
      expect(plan.questionCount).toBe(10);
      expect(plan.totalTargetWords).toBe(10);
      expect(plan.perQuestionTargets.length).toBe(10);

      // Every question slot has 1-2 words
      for (const slot of plan.perQuestionTargets) {
        expect(slot.length).toBeGreaterThanOrEqual(1);
        expect(slot.length).toBeLessThanOrEqual(2);
      }

      // Quota targets for 10 items: 6 Tier0/1, 2-3 Tier2, 1-2 Review
      expect(plan.breakdown.targetTier0_1Quota).toBe(6);
      expect(plan.breakdown.targetTier2Quota).toBe(3);
      expect(plan.breakdown.targetReviewQuota).toBe(1);
    });

    it('should reallocate deficit when Tier 2 or Review pool is empty', () => {
      // In a fresh DB, there are no Tier 2 words yet
      const plan = planBatchVocab(1, 10, testDb);
      expect(plan.breakdown.reallocatedDeficit).toBeGreaterThan(0);
      // All selected words must be valid HSK 1 words
      for (const target of plan.targets) {
        expect(target.level).toBe(1);
      }
    });

    it('should exclude overused words from planned batch', () => {
      for (let i = 1; i <= 6; i++) {
        testDb.prepare(`
          INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active, tested_vocab)
          VALUES ('q_ov_${i}', 'Stem ${i}', '["水"]', 0, 1, 'reading', 'pt_${i}', 'approved', 1, '["水"]');
        `).run();
      }

      const plan = planBatchVocab(1, 20, testDb);
      const plannedWords = plan.targets.map((t) => t.word);
      expect(plannedWords).not.toContain('水');
    });
  });

  describe('6. Actual Text Syllabus Verification (`verifyQuestionVocab`)', () => {
    it('should verify directly tested words and detect discrepancies', () => {
      const q = {
        stem: '明天天气很冷，请多穿点儿____。',
        options: ['衣服', '苹果', '飞机', '医生'],
        answer_idx: 0,
        tested_vocab: ['衣服', '电脑'], // '电脑' is not in question text at all!
        passage: '今天下雨了。',
      };

      const result = verifyQuestionVocab(q, 1);
      expect(result.tested).toContain('衣服');
      expect(result.discrepancies.falseClaims).toContain('电脑');
      expect(result.isValidForLevel).toBe(true);
    });

    it('should downgrade LLM declared words to contextual if they only appear in context', () => {
      const q = {
        stem: '在学校学习很开心。请选择正确选项：____',
        options: ['看电影', '坐飞机', '去医院', '回家'],
        answer_idx: 0,
        tested_vocab: ['学校'], // '学校' only appears in stem, not in options[0]!
      };

      const result = verifyQuestionVocab(q, 1);
      expect(result.tested).toContain('电影');
      expect(result.discrepancies.downgradedToContextual).toContain('学校');
      expect(result.contextual).toContain('学校');
    });

    it('should flag aboveLevel words when tested word exceeds question level', () => {
      const q = {
        stem: '这次会议由总经理____主持。',
        options: ['亲自', '简单', '可能', '特别'],
        answer_idx: 0,
      };

      // '亲自' is HSK Level 5 word
      const result = verifyQuestionVocab(q, 2); // Tested on Level 2
      expect(result.aboveLevel.length).toBeGreaterThan(0);
      expect(result.aboveLevel[0].word).toBe('亲自');
      expect(result.aboveLevel[0].wordLevel).toBe(5);
      expect(result.isValidForLevel).toBe(false);
    });
  });

  describe('7. Configurable Coverage Targets & 8 Group Statuses', () => {
    it('should return correct defaults and support overrides', () => {
      const targets = getCoverageTargets({ initialSkillTarget: 250 });
      expect(targets.initialSkillTarget).toBe(250);
      expect(targets.extendedSkillTarget).toBe(500);
      expect(targets.initialPartTypeTarget).toBe(30);
      expect(targets.initialExamSetsTarget).toBe(3);
    });

    it('should classify all 8 group statuses deterministically', () => {
      // 1. blocked: level out of range
      expect(classifyGroupStatus({
        level: 7,
        skill: 'reading',
        part_type: 'pt1',
        approvedCount: 10,
        pendingCount: 0,
        blueprintQuestionQuota: 5,
      }).status).toBe('blocked');

      // 1b. blocked: HSK 1 writing
      expect(classifyGroupStatus({
        level: 1,
        skill: 'writing',
        part_type: 'pt1',
        approvedCount: 0,
        pendingCount: 0,
        blueprintQuestionQuota: 5,
      }).status).toBe('blocked');

      // 2. no_data: 0 approved, 0 pending
      expect(classifyGroupStatus({
        level: 1,
        skill: 'reading',
        part_type: 'read_sentence_picture_match_6opt',
        approvedCount: 0,
        pendingCount: 0,
        blueprintQuestionQuota: 5,
      }).status).toBe('no_data');

      // 3. accumulating: 0 approved, > 0 pending
      expect(classifyGroupStatus({
        level: 1,
        skill: 'reading',
        part_type: 'read_sentence_picture_match_6opt',
        approvedCount: 0,
        pendingCount: 8,
        blueprintQuestionQuota: 5,
      }).status).toBe('accumulating');

      // 3b. accumulating: 1..4 approved (< accumulatingThreshold 5)
      expect(classifyGroupStatus({
        level: 1,
        skill: 'reading',
        part_type: 'read_sentence_picture_match_6opt',
        approvedCount: 3,
        pendingCount: 0,
        blueprintQuestionQuota: 5,
      }).status).toBe('accumulating');

      // 4. below_quantity_target: 5..29 approved (< targetCount 30)
      expect(classifyGroupStatus({
        level: 1,
        skill: 'reading',
        part_type: 'read_sentence_picture_match_6opt',
        approvedCount: 22,
        pendingCount: 0,
        blueprintQuestionQuota: 5,
      }).status).toBe('below_quantity_target');

      // 5. quantity_met_lacks_diversity_or_types: >= 30 questions but unique vocab < 12 (0.40 ratio)
      expect(classifyGroupStatus({
        level: 1,
        skill: 'reading',
        part_type: 'read_sentence_picture_match_6opt',
        approvedCount: 35,
        pendingCount: 0,
        blueprintQuestionQuota: 5,
        uniqueTestedVocabCount: 5, // < 12
      }).status).toBe('quantity_met_lacks_diversity_or_types');

      // 6. minimum_coverage_met: >= 30, diverse vocab, but hasn't reached exam sets target (e.g. n=18 => 54 needed)
      expect(classifyGroupStatus({
        level: 4,
        skill: 'listening',
        part_type: 'listen_talks_qa_4opt',
        approvedCount: 35,
        pendingCount: 0,
        blueprintQuestionQuota: 18, // 3 * 18 = 54 needed
        uniqueTestedVocabCount: 15,
      }).status).toBe('minimum_coverage_met');

      // 7. exam_ready: approved >= blueprintQuestionQuota * 3
      expect(classifyGroupStatus({
        level: 1,
        skill: 'reading',
        part_type: 'read_sentence_picture_match_6opt',
        approvedCount: 30,
        pendingCount: 0,
        blueprintQuestionQuota: 5, // 3 * 5 = 15 needed, 30 >= 15
        uniqueTestedVocabCount: 15,
      }).status).toBe('exam_ready');

      // 8. extended_target_met: approved >= 75 for part or >= 500 for skill
      expect(classifyGroupStatus({
        level: 1,
        skill: 'reading',
        part_type: 'read_sentence_picture_match_6opt',
        approvedCount: 80,
        pendingCount: 0,
        blueprintQuestionQuota: 5,
        uniqueTestedVocabCount: 25,
      }).status).toBe('extended_target_met');
    });
  });

  describe('8. Coverage Matrix & Priority Deficit Group', () => {
    let testDb: DatabaseSync;

    beforeEach(() => {
      testDb = new DatabaseSync(':memory:');
      applyAdditiveQBankMigrations(testDb);
    });

    it('should compute complete coverage matrix for HSK 1–6 and identify priority deficit', () => {
      const matrix = computeCoverageMatrix(testDb);
      expect(matrix.rows.length).toBeGreaterThan(30);

      // All rows are levels 1..6
      for (const r of matrix.rows) {
        expect(r.level).toBeGreaterThanOrEqual(1);
        expect(r.level).toBeLessThanOrEqual(6);
      }

      const priority = getPriorityDeficitGroup(testDb);
      expect(priority).not.toBeNull();
      expect(priority?.level).toBeGreaterThanOrEqual(1);
      expect(priority?.level).toBeLessThanOrEqual(6);
      expect(priority?.deficit).toBeGreaterThan(0);
    });
  });

  describe('9. Hash & Near-Duplicate Canonical Signature', () => {
    it('should generate identical near-duplicate signatures for questions with shuffled options', () => {
      const stem1 = '今天星期几？';
      const opts1 = ['星期一', '星期二', '星期三', '星期四'];

      const stem2 = '今天 星期几？';
      const opts2 = ['星期四', '星期一', '星期三', '星期二']; // Shuffled order

      const sig1 = computeNearDuplicateSignature(stem1, opts1);
      const sig2 = computeNearDuplicateSignature(stem2, opts2);

      expect(sig1).toBe(sig2);
    });

    it('should generate different content hashes when answer index changes', () => {
      const stem = '今天星期几？';
      const opts = ['星期一', '星期二', '星期三'];

      const hash1 = computeContentHash(stem, opts, 0);
      const hash2 = computeContentHash(stem, opts, 1);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('10. qbankRoutes.ts Integration & Safe Additive Migrations Wiring', () => {
    it('should re-export coverage engine functions and wire additive migrations in ensurePendingSchema', async () => {
      const qbankRoutes = await import('../src/server/qbankRoutes.js');
      expect(typeof qbankRoutes.applyAdditiveQBankMigrations).toBe('function');
      expect(typeof qbankRoutes.computeCoverageMatrix).toBe('function');
      expect(typeof qbankRoutes.computeVocabCoverage).toBe('function');
      expect(typeof qbankRoutes.planBatchVocab).toBe('function');
      expect(typeof qbankRoutes.verifyQuestionVocab).toBe('function');
      expect(typeof qbankRoutes.ensurePendingSchema).toBe('function');
      expect(qbankRoutes.qbankRouter).toBeDefined();

      const memDb = new DatabaseSync(':memory:');
      qbankRoutes.ensurePendingSchema(memDb);

      const qCols = (memDb.prepare('PRAGMA table_info(questions)').all() as any[]).map((c) => c.name);
      expect(qCols).toContain('content_hash');
      expect(qCols).toContain('near_duplicate_signature');
      expect(qCols).toContain('tested_vocab');
      expect(qCols).toContain('passage');
      expect(qCols).toContain('is_active');
    });
  });
});
