/**
 * tests/adversarial_m2_invariants.test.ts
 *
 * EMPIRICAL ADVERSARIAL STRESS TEST SUITE — MILESTONE M2
 * Roles: Critic & Specialist (Empirical Challenger)
 *
 * Invariants & Boundaries Stress-Tested:
 * 1. Unique Question Invariant:
 *    - Real DB verification: model.uniqueQuestions.allApproved.size === 89.
 *    - Question sums across knowledge items (postings > 1000) DO NOT inflate unique question totals.
 *    - Disjoint level partitions and exhaustive skill coverage.
 *    - Synthetic stress with extreme multi-item linking and repetition.
 * 2. Context vs Tested Vocab Boundary:
 *    - All 89 real questions: testedVocab ∩ contextVocab = ∅ (strictly disjoint).
 *    - Context-only words across the entire DB are strictly Tier 1, NEVER Tier 2 or Tier 3.
 *    - High-frequency function words (我, 很, 有, etc.) in reading comprehension options are NEVER marked directly tested.
 * 3. Inverted Index Reverse Lookup:
 *    - Exact bidirectional bijection: forwardIndex <-> invertedIndex postings.
 *    - getQuestionsForKnowledgeItem matches forwardIndex profiles for tested words, chars, non-existent words, and Tier 0 words.
 * 4. Filter Invariants & Fault Tolerance:
 *    - Pending, rejected, and inactive questions strictly excluded from allApproved and postings.
 *    - Malformed question handling (invalid JSON, empty text, non-syllabus words).
 */

import { describe, it, expect } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import {
  getSyllabusCatalog,
  buildKnowledgeLinkingModel,
  resolveTestedVocab,
  extractContextVocab,
  HIGH_FREQUENCY_FUNCTION_WORDS,
  type HskLevel,
} from '../src/server/qbankCoverageEngine.js';
import {
  getOfficialCoverageService,
} from '../src/server/qbankOfficialCoverageService.js';

describe('Adversarial Stress Verification — M2 Invariants & Linking Model', () => {
  const catalog = getSyllabusCatalog();

  describe('1. Unique Question Invariant Stress Tests', () => {
    it('EMPIRICAL REAL-DB: model.uniqueQuestions.allApproved.size must equal EXACTLY 96', () => {
      const db = new DatabaseSync('data/qbank/qbank.db', { readOnly: true });
      const model = buildKnowledgeLinkingModel(db);

      // Verify exact count of 96 (89 baseline + 7 admin-approved rowids 90-96)
      expect(model.uniqueQuestions.allApproved.size).toBe(96);

      // Cross-check against raw SQLite count of approved active questions
      const row: any = db.prepare(`
        SELECT COUNT(*) as cnt
        FROM questions
        WHERE status = 'approved' AND is_active = 1 AND level BETWEEN 1 AND 6
      `).get();
      expect(Number(row.cnt)).toBe(96);
      expect(model.uniqueQuestions.allApproved.size).toBe(Number(row.cnt));

      db.close();
    });

    it('NON-INFLATION: knowledge item cross-sum must NOT inflate unique question totals', () => {
      const db = new DatabaseSync('data/qbank/qbank.db', { readOnly: true });
      const model = buildKnowledgeLinkingModel(db);
      const service = getOfficialCoverageService();
      const report = service.computeOfficialCoverage(db, { skipCache: true });

      // 1. Calculate sum of uniqueQuestionCount across all vocab knowledge items
      let totalVocabUniqueQuestionSums = 0;
      let totalVocabPostings = 0;
      for (const rec of model.vocabIndex.values()) {
        totalVocabUniqueQuestionSums += rec.uniqueQuestionCount;
        totalVocabPostings += rec.postings.length;
      }

      // 2. Calculate sum of uniqueQuestionCount across all recognition characters
      let totalRecogUniqueQuestionSums = 0;
      let totalRecogPostings = 0;
      for (const rec of model.charRecognitionIndex.values()) {
        totalRecogUniqueQuestionSums += rec.uniqueQuestionCount;
        totalRecogPostings += rec.postings.length;
      }

      const totalCrossKnowledgeSums = totalVocabUniqueQuestionSums + totalRecogUniqueQuestionSums;
      const totalAllPostings = totalVocabPostings + totalRecogPostings;

      // Assert that cross-item sums are significantly higher than 89 due to multi-linking
      expect(totalCrossKnowledgeSums).toBeGreaterThan(500);
      expect(totalAllPostings).toBeGreaterThan(1000);

      // CRITICAL INVARIANT: Unique question totals remain strictly 96
      expect(model.uniqueQuestions.allApproved.size).toBe(96);
      expect(report.summary.totalUniqueApprovedQuestions).toBe(96);
      expect(report.summary.approvedActiveCount).toBe(96);

      db.close();
    });

    it('PARTITION INTEGRITY: byLevel sets must be pairwise disjoint and sum exactly to 96', () => {
      const db = new DatabaseSync('data/qbank/qbank.db', { readOnly: true });
      const model = buildKnowledgeLinkingModel(db);

      let sumLevelSizes = 0;
      const seenQuestionIds = new Set<string>();

      for (let lvl = 1; lvl <= 6; lvl++) {
        const lvlSet = model.uniqueQuestions.byLevel.get(lvl as HskLevel);
        expect(lvlSet).toBeDefined();
        const set = lvlSet!;
        sumLevelSizes += set.size;

        for (const qId of set) {
          // Pairwise disjoint: no question should belong to multiple levels
          expect(seenQuestionIds.has(qId)).toBe(false);
          seenQuestionIds.add(qId);
        }
      }

      expect(sumLevelSizes).toBe(96);
      expect(seenQuestionIds.size).toBe(96);
      expect(seenQuestionIds).toEqual(model.uniqueQuestions.allApproved);

      db.close();
    });

    it('SKILL COVERAGE INTEGRITY: bySkill union must exactly equal allApproved', () => {
      const db = new DatabaseSync('data/qbank/qbank.db', { readOnly: true });
      const model = buildKnowledgeLinkingModel(db);

      const skillUnion = new Set<string>();
      let sumSkillSizes = 0;

      for (const [skill, qSet] of model.uniqueQuestions.bySkill.entries()) {
        expect(['listening', 'reading', 'writing']).toContain(skill);
        sumSkillSizes += qSet.size;
        for (const qId of qSet) {
          skillUnion.add(qId);
        }
      }

      // Since each question has exactly one primary skill in qbank.db, sum must equal 96
      expect(sumSkillSizes).toBe(96);
      expect(skillUnion.size).toBe(96);
      expect(skillUnion).toEqual(model.uniqueQuestions.allApproved);

      db.close();
    });

    it('SYNTHETIC STRESS: 5 questions with 25 knowledge links each must yield exactly 5 unique questions', () => {
      const memDb = new DatabaseSync(':memory:');
      memDb.exec(`
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

      // 5 questions rich in vocabulary and characters
      const testVocabList = ['苹果', '医生', '出租车', '学校', '高兴'];
      for (let i = 0; i < 5; i++) {
        const qId = `synth_q_${i + 1}`;
        const targetWord = testVocabList[i];
        // Stem has multiple words: 妈妈, 水果, 特别, 喜欢, 常常, 喝茶, 看书
        const stem = `妈妈在商店买了很多水果，特别甜，常常喜欢吃____，下午在家里看书喝茶。`;
        const options = JSON.stringify([targetWord, '电脑', '飞机', '老师']);
        memDb.prepare(`
          INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active, tested_vocab)
          VALUES (?, ?, ?, 0, 1, 'reading', 'read_fill_blank_4opt', 'approved', 1, ?)
        `).run(qId, stem, options, JSON.stringify([targetWord]));
      }

      const model = buildKnowledgeLinkingModel(memDb);
      expect(model.uniqueQuestions.allApproved.size).toBe(5);
      expect(model.uniqueQuestions.byLevel.get(1)?.size).toBe(5);

      // Verify each question has many links
      for (let i = 0; i < 5; i++) {
        const prof = model.forwardIndex.get(`synth_q_${i + 1}`);
        expect(prof).toBeDefined();
        expect(prof!.links.length).toBeGreaterThan(10);
      }

      memDb.close();
    });
  });

  describe('2. Context vs Tested Vocab Boundary Stress Tests', () => {
    it('EMPIRICAL REAL-DB: for all 96 questions, testedVocab and contextVocab must be strictly disjoint', () => {
      const db = new DatabaseSync('data/qbank/qbank.db', { readOnly: true });
      const model = buildKnowledgeLinkingModel(db);

      let auditedQuestions = 0;
      for (const [qId, profile] of model.forwardIndex.entries()) {
        auditedQuestions++;
        const testedSet = new Set(profile.testedVocab);
        const contextSet = new Set(profile.contextVocab);

        // Assert disjoint: testedVocab ∩ contextVocab = ∅
        for (const w of testedSet) {
          expect(contextSet.has(w), `Question ${qId}: word '${w}' is both tested and context!`).toBe(false);
        }

        // Assert role consistency in links
        for (const link of profile.links) {
          if (link.knowledgeType === 'vocab') {
            if (link.role === 'directly_tested') {
              expect(testedSet.has(link.knowledgeKey)).toBe(true);
              expect(contextSet.has(link.knowledgeKey)).toBe(false);
            } else if (link.role === 'context') {
              expect(contextSet.has(link.knowledgeKey)).toBe(true);
              expect(testedSet.has(link.knowledgeKey)).toBe(false);
            }
          }
        }
      }

      expect(auditedQuestions).toBe(96);
      db.close();
    });

    it('TIER 2 PURITY: words appearing ONLY in context across the DB must NEVER be placed in Tier 2 or Tier 3', () => {
      const db = new DatabaseSync('data/qbank/qbank.db', { readOnly: true });
      const model = buildKnowledgeLinkingModel(db);

      let contextOnlyWordsCount = 0;
      for (const [key, record] of model.invertedIndex.entries()) {
        if (record.type === 'vocab') {
          // If a word has contextual appearances but 0 directly tested postings
          if (record.contextualCount > 0 && record.directlyTestedCount === 0) {
            contextOnlyWordsCount++;
            expect(record.tier, `Word '${record.key}' has directlyTestedCount=0 but got tier=${record.tier}`).toBe(1);
            expect(record.tierLabel).toBe('contextual_appearance');
          }
        }
      }

      // There are dozens of words that only appear in context across the 89 questions
      expect(contextOnlyWordsCount).toBeGreaterThan(100);
      db.close();
    });

    it('FUNCTION WORD EXCLUSION: high-frequency function words in reading comprehension options must NOT be marked tested', () => {
      // Stress-test with reading comprehension questions where options are long sentences packed with function words
      const testCases = [
        {
          name: 'Pronouns and prepositions in correct option',
          question: {
            stem: '王老师今天感冒了，所以他没来上课。问：王老师怎么了？',
            options: ['他生病了', '他在家看电视', '我们都很高兴', '我非常忙'],
            answerIdx: 0, // "他生病了" -> contains 他, 生病, 了
            level: 2 as const,
            skill: 'reading',
            part_type: 'read_comprehension_4opt',
          },
          forbiddenWords: ['他', '了', '在', '我们', '很', '我'],
          expectedTested: '生病',
        },
        {
          name: 'Adverbs and aspect particles in correct option',
          question: {
            stem: '小猫在树上睡觉，小狗在树下跑步。问：小狗在哪里？',
            options: ['小猫在树上', '小狗在树下', '他们都在水里', '那是很漂亮的'],
            answerIdx: 1, // "小狗在树下" -> contains 小狗, 在, 树, 下
            level: 1 as const,
            skill: 'reading',
            part_type: 'read_comprehension_4opt',
          },
          forbiddenWords: ['在', '他们', '都', '那', '是', '很', '的'],
          expectedTested: '狗',
        },
        {
          name: 'Complex reading option with particles: 的, 得, 地, 过, 吗',
          question: {
            stem: '去过中国的朋友说，北京的秋天非常美丽。问：北京的秋天怎么样？',
            options: ['天气冷极了', '北京非常美丽', '他已经去过了', '你觉得好吗'],
            answerIdx: 1, // "北京非常美丽"
            level: 4 as const,
            skill: 'reading',
            part_type: 'read_comprehension_4opt',
          },
          forbiddenWords: ['过', '的', '了', '他', '你', '吗'],
          expectedTested: '美丽',
        },
      ];

      for (const tc of testCases) {
        const { testedWords } = resolveTestedVocab(tc.question, catalog.words);

        for (const forbidden of tc.forbiddenWords) {
          expect(
            testedWords.has(forbidden),
            `Test case '${tc.name}': function word '${forbidden}' was erroneously marked as testedVocab!`
          ).toBe(false);
        }

        expect(
          testedWords.has(tc.expectedTested),
          `Test case '${tc.name}': expected target content word '${tc.expectedTested}' was not found!`
        ).toBe(true);
      }
    });

    it('EXHAUSTIVE FUNCTION WORDS CHECK: verify all 28 entries in HIGH_FREQUENCY_FUNCTION_WORDS', () => {
      const expectedWords = [
        '我', '你', '他', '她', '它', '我们', '你们', '他们',
        '的', '地', '得', '了', '着', '过',
        '吗', '呢', '吧', '啊',
        '很', '在', '有', '是', '这', '那', '点', '后', '前', '边',
      ];

      expect(HIGH_FREQUENCY_FUNCTION_WORDS.size).toBe(28);
      for (const w of expectedWords) {
        expect(HIGH_FREQUENCY_FUNCTION_WORDS.has(w)).toBe(true);
      }
    });
  });

  describe('3. Inverted Index Reverse Lookup Verification', () => {
    it('EMPIRICAL BIJECTION: all forwardIndex links must have exact invertedIndex postings', () => {
      const db = new DatabaseSync('data/qbank/qbank.db', { readOnly: true });
      const service = getOfficialCoverageService();
      const report = service.computeOfficialCoverage(db, { skipCache: true });
      const model = (service as any).cache.model;

      let verifiedDirectLinks = 0;
      let verifiedContextLinks = 0;
      let verifiedRecogLinks = 0;

      for (const [qId, profile] of model.forwardIndex.entries()) {
        // 1. Tested vocab
        for (const tw of profile.testedVocab) {
          const postings = service.getQuestionsForKnowledgeItem('vocab', tw, db);
          expect(postings.length).toBeGreaterThan(0);
          const found = postings.find((p) => p.questionId === qId && p.role === 'directly_tested');
          expect(found, `Reverse lookup failed for tested word '${tw}' in question ${qId}`).toBeDefined();
          expect(found?.part_type).toBe(profile.part_type);
          expect(found?.level).toBe(profile.level);
          verifiedDirectLinks++;
        }

        // 2. Context vocab
        for (const cw of profile.contextVocab) {
          const postings = service.getQuestionsForKnowledgeItem('vocab', cw, db);
          expect(postings.length).toBeGreaterThan(0);
          const found = postings.find((p) => p.questionId === qId && p.role === 'context');
          expect(found, `Reverse lookup failed for context word '${cw}' in question ${qId}`).toBeDefined();
          verifiedContextLinks++;
        }

        // 3. Hanzi recognition
        for (const rc of profile.recognitionChars) {
          const postings = service.getQuestionsForKnowledgeItem('hanzi_recognition', rc, db);
          expect(postings.length).toBeGreaterThan(0);
          const found = postings.find((p) => p.questionId === qId && p.role === 'recognized');
          expect(found, `Reverse lookup failed for char '${rc}' in question ${qId}`).toBeDefined();
          verifiedRecogLinks++;
        }
      }

      expect(verifiedDirectLinks).toBeGreaterThan(80);
      expect(verifiedContextLinks).toBeGreaterThan(300);
      expect(verifiedRecogLinks).toBeGreaterThan(800);

      db.close();
    });

    it('LOOKUP ORACLE: getQuestionsForKnowledgeItem returns exact questions for sampled tested words', () => {
      const db = new DatabaseSync('data/qbank/qbank.db', { readOnly: true });
      const service = getOfficialCoverageService();
      service.computeOfficialCoverage(db, { skipCache: true });

      const sampleWords = ['出租车', '医生', '苹果', '学校', '高兴', '商店'];

      for (const word of sampleWords) {
        const postings = service.getQuestionsForKnowledgeItem('vocab', word, db);
        if (postings.length > 0) {
          for (const p of postings) {
            const profile = service.getProfileForQuestion(p.questionId, db);
            expect(profile).toBeDefined();
            if (p.role === 'directly_tested') {
              expect(profile!.testedVocab).toContain(word);
            } else if (p.role === 'context') {
              expect(profile!.contextVocab).toContain(word);
            }
          }
        }
      }

      db.close();
    });

    it('CORNER CASES: non-existent words and Tier 0 words return empty arrays cleanly', () => {
      const db = new DatabaseSync('data/qbank/qbank.db', { readOnly: true });
      const service = getOfficialCoverageService();
      service.computeOfficialCoverage(db, { skipCache: true });

      // Non-existent words
      expect(service.getQuestionsForKnowledgeItem('vocab', '外星人', db)).toEqual([]);
      expect(service.getQuestionsForKnowledgeItem('vocab', '量子计算机', db)).toEqual([]);
      expect(service.getQuestionsForKnowledgeItem('hanzi_recognition', 'XYZ', db)).toEqual([]);

      // Rare HSK 6 Tier 0 words that have 0 questions in bank
      expect(service.getQuestionsForKnowledgeItem('vocab', '惆怅', db)).toEqual([]);
      expect(service.getQuestionsForKnowledgeItem('vocab', '蹒跚', db)).toEqual([]);

      db.close();
    });
  });

  describe('4. Filter Invariants & Robustness Stress Tests', () => {
    it('EXCLUSION ROBUSTNESS: pending, rejected, and inactive questions are NEVER included', () => {
      const memDb = new DatabaseSync(':memory:');
      memDb.exec(`
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
          is_active INTEGER NOT NULL DEFAULT 1
        );
      `);

      // 1 approved active question
      memDb.prepare(`
        INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active, tested_vocab)
        VALUES ('q_app_1', '我想吃____。', '["苹果","电脑"]', 0, 1, 'reading', 'read_fill_blank_4opt', 'approved', 1, '["苹果"]')
      `).run();

      // 1 disabled question
      memDb.prepare(`
        INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active, tested_vocab)
        VALUES ('q_dis_1', '我想喝____。', '["茶","电脑"]', 0, 1, 'reading', 'read_fill_blank_4opt', 'disabled', 0, '["茶"]')
      `).run();

      // 1 rejected question in questions table
      memDb.prepare(`
        INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active, tested_vocab)
        VALUES ('q_rej_1', '我想去____。', '["北京","电脑"]', 0, 1, 'reading', 'read_fill_blank_4opt', 'rejected', 1, '["北京"]')
      `).run();

      // 3 pending questions in pending_questions table
      for (let i = 1; i <= 3; i++) {
        memDb.prepare(`
          INSERT INTO pending_questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active)
          VALUES (?, 'pending stem', '["A","B"]', 0, 1, 'reading', 'read_fill_blank_4opt', 'pending', 1)
        `).run(`q_pend_${i}`);
      }

      // 1 rejected question in pending_questions table
      memDb.prepare(`
        INSERT INTO pending_questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active)
        VALUES ('q_pend_rej', 'rejected stem', '["A","B"]', 0, 1, 'reading', 'read_fill_blank_4opt', 'rejected', 1)
      `).run();

      const model = buildKnowledgeLinkingModel(memDb);
      expect(model.uniqueQuestions.allApproved.size).toBe(1);
      expect(model.uniqueQuestions.allApproved.has('q_app_1')).toBe(true);
      expect(model.uniqueQuestions.allApproved.has('q_dis_1')).toBe(false);
      expect(model.uniqueQuestions.allApproved.has('q_rej_1')).toBe(false);

      const service = getOfficialCoverageService();
      const report = service.computeOfficialCoverage(memDb, { skipCache: true });
      expect(report.summary.totalUniqueApprovedQuestions).toBe(1);
      expect(report.summary.approvedActiveCount).toBe(1);
      expect(report.summary.excludedPendingCount).toBe(3);
      expect(report.summary.excludedRejectedCount).toBe(1);
      expect(report.summary.excludedDisabledCount).toBe(2); // q_dis_1 (is_active=0) + q_rej_1 (status='rejected')

      memDb.close();
    });

    it('FAULT TOLERANCE: gracefully handles malformed JSON options and empty strings without crashing', () => {
      const memDb = new DatabaseSync(':memory:');
      memDb.exec(`
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

      // Insert question with corrupt options JSON
      memDb.prepare(`
        INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active, tested_vocab)
        VALUES ('q_corrupt_1', 'stem', 'INVALID_JSON{[[', 0, 1, 'reading', 'part1', 'approved', 1, null)
      `).run();

      // Insert question with empty stem and empty options
      memDb.prepare(`
        INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active, tested_vocab)
        VALUES ('q_corrupt_2', '', '[]', 0, 1, 'reading', 'part1', 'approved', 1, null)
      `).run();

      expect(() => {
        const model = buildKnowledgeLinkingModel(memDb);
        expect(model.uniqueQuestions.allApproved.size).toBe(2);
      }).not.toThrow();

      memDb.close();
    });
  });
});
