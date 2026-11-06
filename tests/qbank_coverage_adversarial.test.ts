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
  type HskLevel,
} from '../src/server/qbankCoverageEngine.js';

describe('Empirical & Adversarial Stress Tests: qbankCoverageEngine.ts', () => {
  // ==========================================================================
  // Part 1: FMM Tokenizer Stress & Edge Cases
  // ==========================================================================
  describe('1. FMM Tokenizer & Vocabulary Extraction Under Tricky Inputs', () => {
    it('should correctly prioritize compound words over their constituent smaller words (Forward Maximum Matching)', () => {
      const catalog = getSyllabusCatalog();
      const vocab = catalog.words;


      // 1. "东西" (HSK 1) contains "东" (HSK 3) and "西" (HSK 3)
      expect(vocab.has('东西')).toBe(true);
      expect(vocab.has('东')).toBe(true);
      expect(vocab.has('西')).toBe(true);

      const textDongxi = '我要去超市买东西。';
      const scannedDongxi = scanChineseWords(textDongxi);
      const wordsDongxi = scannedDongxi.map((w) => w.word);

      expect(wordsDongxi).toContain('东西');
      expect(wordsDongxi).not.toContain('东');
      expect(wordsDongxi).not.toContain('西');

      // 2. "上学" (HSK 1) contains "上" (HSK 1) and "学" (HSK 1)
      expect(vocab.has('上学')).toBe(true);
      expect(vocab.has('上')).toBe(true);
      expect(vocab.has('学')).toBe(true);

      const textShangxue = '哥哥每天去上学。';
      const scannedShangxue = scanChineseWords(textShangxue);
      const wordsShangxue = scannedShangxue.map((w) => w.word);
      expect(wordsShangxue).toContain('上学');
      expect(wordsShangxue).not.toContain('上');
      expect(wordsShangxue).not.toContain('学');

      // 3. "下雨" (HSK 1) contains "下" (HSK 1) and "雨" (HSK 1)
      expect(vocab.has('下雨')).toBe(true);
      expect(vocab.has('下')).toBe(true);
      expect(vocab.has('雨')).toBe(true);

      const textXiayu = '今天外面下雨了。';
      const scannedXiayu = scanChineseWords(textXiayu);
      const wordsXiayu = scannedXiayu.map((w) => w.word);
      expect(wordsXiayu).toContain('下雨');
      expect(wordsXiayu).not.toContain('下');
      expect(wordsXiayu).not.toContain('雨');

      // 4. "中国" (HSK 1) vs "中" (HSK 1) and "国" (HSK 1)
      expect(vocab.has('中国')).toBe(true);
      expect(vocab.has('中')).toBe(true);
      expect(vocab.has('国')).toBe(true);

      const textChina = '我是中国人。';
      const scannedChina = scanChineseWords(textChina);
      const wordsChina = scannedChina.map((w) => w.word);
      expect(wordsChina).toContain('中国');
      expect(wordsChina).not.toContain('中');
      expect(wordsChina).not.toContain('国');

      // 5. "非常" (HSK 2) contains "常" (HSK 3)
      expect(vocab.has('非常')).toBe(true);
      expect(vocab.has('常')).toBe(true);

      const textFeichang = '我非常喜欢学汉语。';
      const scannedFeichang = scanChineseWords(textFeichang);
      const wordsFeichang = scannedFeichang.map((w) => w.word);
      expect(wordsFeichang).toContain('非常');
      expect(wordsFeichang).not.toContain('常');
    });

    it('should accurately handle mixed punctuation, numbers, and symbols without false tokens', () => {
      const text = '2026年10月24日，我的第1个苹果被小猫吃了！——“真的吗？！” (Price: $99.99, Rate: 50%)';
      const scanned = scanChineseWords(text);
      const words = scanned.map((w) => w.word);

      // Valid HSK words that exist in syllabus
      expect(words).toContain('年');
      expect(words).toContain('月');
      expect(words).toContain('日');
      expect(words).toContain('我');
      expect(words).toContain('的');
      expect(words).toContain('第');
      expect(words).toContain('个');
      expect(words).toContain('苹果');
      expect(words).toContain('猫');
      expect(words).toContain('吃');
      expect(words).toContain('了');
      expect(words).toContain('真');
      expect(words).toContain('吗');

      // Symbols, numbers, English characters must NOT appear as words
      expect(words).not.toContain('2026');
      expect(words).not.toContain('10');
      expect(words).not.toContain('24');
      expect(words).not.toContain('Price');
      expect(words).not.toContain('$99.99');
      expect(words).not.toContain('50%');
      expect(words).not.toContain('——');
      expect(words).not.toContain('“');
      expect(words).not.toContain('”');

      // segmentSyllabusTokens should also strip all punctuation and symbols cleanly
      const tokens = segmentSyllabusTokens(text);
      expect(tokens).toContain('苹果');
      expect(tokens).toContain('猫');
      expect(tokens).toContain('真');
      for (const tok of tokens) {
        expect(tok).toMatch(/^[\u4e00-\u9fa5]+$/); // Only Chinese characters
      }
    });

    it('should ignore non-HSK words, rare characters, and foreign words without crashing', () => {
      const nonHskText = 'ChatGPT和iPhone在2026年非常火爆，龘靐鱻猹在森林里玩耍。';
      const scanned = scanChineseWords(nonHskText);
      const words = scanned.map((w) => w.word);

      // Should extract recognized HSK words
      expect(words).toContain('年');
      expect(words).toContain('非常');
      expect(words).toContain('在');
      expect(words).toContain('里');
      expect(words).toContain('玩');

      // Should NOT contain non-HSK words
      expect(words).not.toContain('ChatGPT');
      expect(words).not.toContain('iPhone');
      expect(words).not.toContain('火爆');
      expect(words).not.toContain('龘');
      expect(words).not.toContain('靐');
      expect(words).not.toContain('鱻');
      expect(words).not.toContain('猹');
    });

    it('should handle extreme text lengths and repetitive sequences in sub-linear/linear time', () => {
      // 10,000 repetitions of "爸爸买东西" (50,000 Chinese characters)
      const unit = '爸爸买东西，妈妈看书。';
      const repeated = unit.repeat(2500); // 27,500 characters
      expect(repeated.length).toBe(27500);

      const start = Date.now();
      const scanned = scanChineseWords(repeated);
      const elapsed = Date.now() - start;

      // FMM on 27,500 characters should finish in under 300ms
      expect(elapsed).toBeLessThan(300);
      expect(scanned.length).toBeGreaterThan(10000);
    });

    it('should handle empty, whitespace-only, and special Unicode characters gracefully', () => {
      expect(scanChineseWords('')).toEqual([]);
      expect(scanChineseWords('   \n\t  \r\n  ')).toEqual([]);
      expect(scanChineseWords('😀🎉🚀🔥👍')).toEqual([]);
      expect(scanChineseWords('\u200B\u200C\u200D\uFEFF')).toEqual([]); // Zero-width spaces
      expect(segmentSyllabusTokens('')).toEqual([]);
      expect(segmentSyllabusTokens('   \t\n  ')).toEqual([]);
      expect(segmentSyllabusTokens('😀🎉🚀🔥')).toEqual([]);
    });
  });

  // ==========================================================================
  // Part 2: `verifyQuestionVocab` Adversarial Stress Tests
  // ==========================================================================
  describe('2. verifyQuestionVocab Adversarial Verification', () => {
    it('should extract target tested vocabulary from correct option and blank targets', () => {
      const q = {
        stem: '小明昨天买了一辆新____。',
        options: ['自行车', '飞机', '苹果', '电脑'],
        answer_idx: 0,
        tested_vocab: ['自行车'],
        passage: '他每天骑车去上学。',
      };

      const result = verifyQuestionVocab(q, 3);
      expect(result.tested).toContain('自行车');
      expect(result.contextual).toContain('飞机');
      expect(result.contextual).toContain('苹果');
      expect(result.contextual).toContain('电脑');
      expect(result.contextual).toContain('小');
      expect(result.contextual).toContain('昨天');
      expect(result.contextual).toContain('买');
      expect(result.contextual).toContain('新');
      expect(result.contextual).toContain('每');
      expect(result.contextual).toContain('天');
      expect(result.contextual).toContain('上学');
      expect(result.discrepancies.falseClaims).toHaveLength(0);
      expect(result.discrepancies.downgradedToContextual).toHaveLength(0);
      expect(result.isValidForLevel).toBe(true);
    });

    it('should detect and reject LLM false claims and downgrade words appearing only in context', () => {
      const q = {
        stem: '在图书馆看书要保持安静。请问这句话是什么意思？',
        options: ['不能大声说话', '可以吃东西', '不要看书', '去外面玩'],
        answer_idx: 0,
        // LLM hallucination: claims '飞机' (not in text at all) and '图书馆' (only in stem)
        tested_vocab: ['飞机', '图书馆', '说话'],
      };

      const result = verifyQuestionVocab(q, 2);

      // '说话' is in correct option -> verified tested
      expect(result.tested).toContain('说话');

      // '飞机' is completely absent from all fields -> falseClaim
      expect(result.discrepancies.falseClaims).toContain('飞机');
      expect(result.tested).not.toContain('飞机');

      // '图书馆' is in stem, NOT in correct option -> downgradedToContextual
      expect(result.discrepancies.downgradedToContextual).toContain('图书馆');
      expect(result.tested).not.toContain('图书馆');
      expect(result.contextual).toContain('图书馆');
    });

    it('should reject non-HSK words claimed as tested_vocab', () => {
      const q = {
        stem: '请选择现代科技产品：____',
        options: ['iPhone 16 Pro', '桌子', '椅子', '铅笔'],
        answer_idx: 0,
        tested_vocab: ['iPhone', '科技产品', '桌子'],
      };

      const result = verifyQuestionVocab(q, 1);
      // 'iPhone' is not in syllabus -> cannot be in verified tested
      expect(result.tested).not.toContain('iPhone');
      expect(result.contextual).not.toContain('iPhone');

      // '桌子' is in distractor, not correct option -> downgraded
      expect(result.discrepancies.downgradedToContextual).toContain('桌子');
    });

    it('should flag aboveLevel words and set isValidForLevel to false when difficulty exceeds question level', () => {
      // '抽象' is HSK Level 6 in HSK 3.0 syllabus
      const q = {
        stem: '这种理论概念非常____，一般人很难理解。',
        options: ['抽象', '容易', '清楚', '明白'],
        answer_idx: 0,
        tested_vocab: ['抽象'],
      };

      // Testing at HSK Level 1
      const resultL1 = verifyQuestionVocab(q, 1);
      expect(resultL1.isValidForLevel).toBe(false);
      expect(resultL1.aboveLevel.length).toBeGreaterThan(0);
      expect(resultL1.aboveLevel[0].word).toBe('抽象');
      expect(resultL1.aboveLevel[0].wordLevel).toBe(6);
      expect(resultL1.aboveLevel[0].questionLevel).toBe(1);

      // Testing at HSK Level 6 -> should be valid
      const resultL6 = verifyQuestionVocab(q, 6);
      expect(resultL6.isValidForLevel).toBe(true);
      expect(resultL6.aboveLevel).toHaveLength(0);
    });

    it('should handle edge-case inputs: empty question, JSON string, plain string, and invalid answer_idx', () => {
      // 1. Empty object
      const resEmpty = verifyQuestionVocab({}, 1);
      expect(resEmpty.tested).toEqual([]);
      expect(resEmpty.contextual).toEqual([]);
      expect(resEmpty.isValidForLevel).toBe(true);

      // 2. Plain string (e.g. passage or text snippet)
      const resStr = verifyQuestionVocab('今天天气真好，我想去公园散步。', 1);
      expect(resStr.tested).toEqual([]);
      expect(resStr.contextual).toContain('今天');
      expect(resStr.contextual).toContain('天气');
      expect(resStr.contextual).toContain('公园');

      // 3. Serialized JSON string
      const jsonQ = JSON.stringify({
        stem: '他是我的____。',
        options: ['老师', '学生'],
        answer_idx: 0,
        tested_vocab: ['老师'],
      });
      const resJson = verifyQuestionVocab(jsonQ, 1);
      expect(resJson.tested).toContain('老师');
      expect(resJson.contextual).toContain('学生');

      // 4. Invalid answer_idx out of bounds
      const resBadIdx = verifyQuestionVocab({
        stem: '测试题目',
        options: ['选项A', '选项B'],
        answer_idx: 99, // Out of bounds!
      }, 1);
      expect(resBadIdx.tested).toEqual([]);
    });
  });

  // ==========================================================================
  // Part 3: `planBatchVocab` Stress Tests (Level 1 boundary, counts 1, 20, 100)
  // ==========================================================================
  describe('3. planBatchVocab Stress Tests & Boundary Validation', () => {
    let testDb: DatabaseSync;

    beforeEach(() => {
      testDb = new DatabaseSync(':memory:');
      applyAdditiveQBankMigrations(testDb);
    });

    it('should enforce Level 1 boundary: review pool can only draw from Level 1', () => {
      // 1. Fresh database: no approved questions yet (all words are Tier 0)
      const planFresh = planBatchVocab(1, 20, testDb);
      expect(planFresh.level).toBe(1);
      expect(planFresh.questionCount).toBe(20);
      expect(planFresh.targets.length).toBe(20);

      // 100% of targets must be Level 1
      for (const t of planFresh.targets) {
        expect(t.level).toBe(1);
      }

      // 2. Seed some Level 1 words as Tier 1 and Tier 2, plus Level 2/3 words
      // Insert Level 1 questions
      testDb.prepare(`
        INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active, tested_vocab, explanation_vi)
        VALUES
          ('q_l1_1', '这是什么？', '["水","茶"]', 0, 1, 'reading', 'pt1', 'approved', 1, '["水"]', 'Giải thích 1'),
          ('q_l1_2', '这是什么？', '["苹果","香蕉"]', 0, 1, 'reading', 'pt1', 'approved', 1, '["苹果"]', 'Giải thích 2'),
          ('q_l2_1', '这是什么？', '["帮助","准备"]', 0, 2, 'reading', 'pt1', 'approved', 1, '["帮助"]', 'Giải thích 3'),
          ('q_l3_1', '这是什么？', '["简单","清楚"]', 0, 3, 'reading', 'pt1', 'approved', 1, '["简单"]', 'Giải thích 4');
      `).run();

      invalidateVocabCoverageCache(testDb);

      const planSeeded = planBatchVocab(1, 20, testDb);
      // Boundary check: absolutely ZERO words from level 2..6 can ever be planned for Level 1!
      for (const t of planSeeded.targets) {
        expect(t.level).toBe(1);
      }
    });

    it('should accurately distribute 60/25/15 ratio for count = 1, count = 20, count = 100', () => {
      // Seed a rich database with mixed Tier 0, Tier 1, Tier 2, and review words for Level 2
      const catalog = getSyllabusCatalog();
      const l1Words = catalog.wordsByLevel.get(1) || [];
      const l2Words = catalog.wordsByLevel.get(2) || [];
      expect(l1Words.length).toBe(300);
      expect(l2Words.length).toBe(197);

      // Level 1 words for review pool (seed 30 distinct words):
      for (let i = 0; i < 30; i++) {
        const w = l1Words[i].word;
        testDb.prepare(`
          INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active, tested_vocab, explanation_vi)
          VALUES ('q_seed_l1_${i}', 'Stem ${i}', '["${w}"]', 0, 1, 'reading', 'pt1', 'approved', 1, '["${w}"]', 'Giải thích');
        `).run();
      }

      // Level 2 words for Tier 2 pool (seed 30 distinct words):
      for (let i = 0; i < 30; i++) {
        const w = l2Words[i].word;
        testDb.prepare(`
          INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active, tested_vocab, explanation_vi)
          VALUES ('q_seed_l2_${i}', 'Stem ${i}', '["${w}"]', 0, 2, 'reading', 'pt_${i % 3}', 'approved', 1, '["${w}"]', 'Giải thích');
        `).run();
      }

      invalidateVocabCoverageCache(testDb);

      // Case A: count = 1
      const plan1 = planBatchVocab(2, 1, testDb);
      expect(plan1.questionCount).toBe(1);
      expect(plan1.targets.length).toBe(1);
      expect(plan1.perQuestionTargets.length).toBe(1);
      expect(plan1.perQuestionTargets[0].length).toBe(1);
      expect(plan1.breakdown.targetTier0_1Quota).toBe(1);
      expect(plan1.breakdown.targetTier2Quota).toBe(0);
      expect(plan1.breakdown.targetReviewQuota).toBe(0);

      // Case B: count = 20
      const plan20 = planBatchVocab(2, 20, testDb);
      expect(plan20.questionCount).toBe(20);
      expect(plan20.targets.length).toBe(20);
      expect(plan20.perQuestionTargets.length).toBe(20);
      // Quota targets: 60% of 20 = 12, 25% of 20 = 5, 15% of 20 = 3
      expect(plan20.breakdown.targetTier0_1Quota).toBe(12);
      expect(plan20.breakdown.targetTier2Quota).toBe(5);
      expect(plan20.breakdown.targetReviewQuota).toBe(3);
      expect(plan20.breakdown.tier0_1Count).toBe(12);
      expect(plan20.breakdown.tier2ReinforceCount).toBe(5);
      expect(plan20.breakdown.reviewCount).toBe(3);

      // Every question slot has exactly 1 target word
      for (const slot of plan20.perQuestionTargets) {
        expect(slot.length).toBe(1);
      }

      // Case C: count = 100
      const plan100 = planBatchVocab(2, 100, testDb);
      expect(plan100.questionCount).toBe(100);
      expect(plan100.targets.length).toBe(100);
      expect(plan100.perQuestionTargets.length).toBe(100);
      // Quota targets: 60% of 100 = 60, 25% of 100 = 25, 15% of 100 = 15
      expect(plan100.breakdown.targetTier0_1Quota).toBe(60);
      expect(plan100.breakdown.targetTier2Quota).toBe(25);
      expect(plan100.breakdown.targetReviewQuota).toBe(15);
      expect(plan100.breakdown.tier0_1Count).toBe(60);
      expect(plan100.breakdown.tier2ReinforceCount).toBe(25);
      expect(plan100.breakdown.reviewCount).toBe(15);

      // Check slot allocation
      for (const slot of plan100.perQuestionTargets) {
        expect(slot.length).toBeGreaterThanOrEqual(1);
        expect(slot.length).toBeLessThanOrEqual(2);
      }
    });

    it('should strictly exclude overused words and gracefully handle pool exhaustion', () => {
      // Mark 10 Level 1 words as overused by inserting 6 questions each (>= overusedThreshold 5)
      const catalog = getSyllabusCatalog();
      const l1Words = catalog.wordsByLevel.get(1) || [];
      const overusedCandidates = l1Words.slice(0, 10).map((w) => w.word);

      for (const word of overusedCandidates) {
        for (let i = 1; i <= 6; i++) {
          testDb.prepare(`
            INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active, tested_vocab, explanation_vi)
            VALUES ('q_${word}_${i}', 'Stem', '["${word}"]', 0, 1, 'reading', 'pt_${i}', 'approved', 1, '["${word}"]', 'Giải thích');
          `).run();
        }
      }

      invalidateVocabCoverageCache(testDb);

      const plan = planBatchVocab(1, 50, testDb, { overusedThreshold: 5 });
      expect(plan.breakdown.excludedOverusedCount).toBe(10);

      const plannedWordNames = plan.targets.map((t) => t.word);
      for (const ow of overusedCandidates) {
        expect(plannedWordNames).not.toContain(ow);
      }
    });

    it('should support wordsPerQuestion = 2 without exceeding 2 words per slot', () => {
      const plan = planBatchVocab(1, 10, testDb, { wordsPerQuestion: 2 });
      expect(plan.questionCount).toBe(10);
      expect(plan.totalTargetWords).toBe(20); // 10 * 2 = 20
      expect(plan.perQuestionTargets.length).toBe(10);

      for (const slot of plan.perQuestionTargets) {
        expect(slot.length).toBe(2);
      }
    });

    it('should clamp invalid level inputs to valid range 1..6', () => {
      const planLow = planBatchVocab(0, 5, testDb);
      expect(planLow.level).toBe(1);

      const planHigh = planBatchVocab(99, 5, testDb);
      expect(planHigh.level).toBe(6);
    });
  });

  // ==========================================================================
  // Part 4: Coverage Targets, Group Status Classification & Deficit Engine
  // ==========================================================================
  describe('4. Coverage Matrix & Group Status Classification Stress Tests', () => {
    it('should classify all required edge-case states correctly', () => {
      // 1. Level 1 writing blocked
      const stWritingL1 = classifyGroupStatus({
        level: 1,
        skill: 'writing',
        part_type: 'write_chars',
        approvedCount: 0,
        pendingCount: 0,
        blueprintQuestionQuota: 5,
      });
      expect(stWritingL1.status).toBe('blocked');
      expect(stWritingL1.blockedReason).toContain('không có phần thi Viết');

      // 2. Blueprint question quota <= 0 blocked
      const stInvalidPart = classifyGroupStatus({
        level: 2,
        skill: 'reading',
        part_type: 'non_existent_part',
        approvedCount: 10,
        pendingCount: 0,
        blueprintQuestionQuota: 0,
      });
      expect(stInvalidPart.status).toBe('blocked');

      // 3. Exam ready status when approved >= blueprintQuota * 3
      const stExamReady = classifyGroupStatus({
        level: 2,
        skill: 'reading',
        part_type: 'read_sentence_picture_match',
        approvedCount: 30,
        pendingCount: 0,
        blueprintQuestionQuota: 5, // 5 * 3 = 15 needed, 30 >= 15 & 30 >= 30
        uniqueTestedVocabCount: 15,
      });
      expect(stExamReady.status).toBe('exam_ready');
      expect(stExamReady.isExamReady).toBe(true);

      // 4. Extended target met when approved >= 75
      const stExtMet = classifyGroupStatus({
        level: 2,
        skill: 'reading',
        part_type: 'read_sentence_picture_match',
        approvedCount: 80,
        pendingCount: 0,
        blueprintQuestionQuota: 5,
        uniqueTestedVocabCount: 35,
      });
      expect(stExtMet.status).toBe('extended_target_met');
    });

    it('should compute deterministic priority deficit ranking prioritizing high-deficit and lower-level groups', () => {
      const memDb = new DatabaseSync(':memory:');
      applyAdditiveQBankMigrations(memDb);

      const def1 = getPriorityDeficitGroup(memDb);
      const def2 = getPriorityDeficitGroup(memDb);

      expect(def1).not.toBeNull();
      expect(def2).not.toBeNull();
      // Deterministic output
      expect(def1?.level).toBe(def2?.level);
      expect(def1?.skill).toBe(def2?.skill);
      expect(def1?.part_type).toBe(def2?.part_type);
      expect(def1?.priorityScore).toBe(def2?.priorityScore);
    });
  });

  // ==========================================================================
  // Part 5: Deep Adversarial Corner Cases & Anomaly Mining
  // ==========================================================================
  describe('5. Deep Adversarial Corner Cases & Edge Invariants', () => {
    it('should generate identical nearDuplicateSignature across diverse whitespace and punctuation variants', () => {
      const stemA = '明天  天气\n怎么样？';
      const optsA = ['下雨', '晴天', '阴天', '刮风'];

      const stemB = '明天天气怎么样'; // No punctuation, no internal spaces
      const optsB = ['刮风', '下雨', '阴天', '晴天']; // Shuffled order

      const stemC = '“明天，天气怎么样？！”'; // Chinese quotes and punctuation
      const optsC = ['晴天', '刮风', '下雨', '阴天'];

      const sigA = computeNearDuplicateSignature(stemA, optsA);
      const sigB = computeNearDuplicateSignature(stemB, optsB);
      const sigC = computeNearDuplicateSignature(stemC, optsC);

      expect(sigA).toBe(sigB);
      expect(sigB).toBe(sigC);
    });

    it('should document outOfSyllabus behavior when non-HSK words are declared in tested_vocab', () => {
      const q = {
        stem: '在未来的世界里，人们都使用____。',
        options: ['人工智能机器狗', '桌子', '椅子'],
        answer_idx: 0,
        // 'ChatGPT' is foreign, '机器狗' is not in HSK 1-6
        tested_vocab: ['ChatGPT', '机器狗', '人工智能'],
      };

      const result = verifyQuestionVocab(q, 3);
      // '人工智能' is in HSK 6
      expect(result.aboveLevel.some((a) => a.word === '人工智能')).toBe(true);

      // 'ChatGPT' is not in text -> falseClaims
      expect(result.discrepancies.falseClaims).toContain('ChatGPT');

      // '机器狗' is in correctOption, but not in HSK 1-6 catalog:
      // Note: verifyQuestionVocab omits non-syllabus words from verifiedTested
      expect(result.tested).not.toContain('机器狗');
    });

    it('should handle extreme batch sizes when count exceeds total level vocabulary', () => {
      const memDb = new DatabaseSync(':memory:');
      applyAdditiveQBankMigrations(memDb);

      // Level 2 has 197 total words. Request count = 250!
      const planLarge = planBatchVocab(2, 250, memDb);
      expect(planLarge.level).toBe(2);
      expect(planLarge.questionCount).toBe(250);
      expect(planLarge.perQuestionTargets.length).toBe(250);

      // Total available Level 2 words is 197. The planner extracts all available Level 2 words without crashing
      expect(planLarge.targets.length).toBeLessThanOrEqual(197);
      expect(planLarge.targets.length).toBeGreaterThan(150);

      // Each planned target must still be a valid Level 2 word
      for (const t of planLarge.targets) {
        expect(t.level).toBe(2);
      }
    });

    it('should evaluate coverage matrix accurately on populated database with active vs inactive questions', () => {
      const memDb = new DatabaseSync(':memory:');
      applyAdditiveQBankMigrations(memDb);

      // Insert 35 active approved questions for Level 1 Listening part1
      for (let i = 1; i <= 35; i++) {
        memDb.prepare(`
          INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active, tested_vocab, explanation_vi)
          VALUES ('q_act_${i}', 'Stem ${i}', '["苹果"]', 0, 1, 'listening', 'listen_picture_match_3opt', 'approved', 1, '["苹果"]', 'Giải thích');
        `).run();
      }

      // Insert 10 inactive questions (should NOT be counted)
      for (let i = 1; i <= 10; i++) {
        memDb.prepare(`
          INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active, tested_vocab, explanation_vi)
          VALUES ('q_inact_${i}', 'Stem ${i}', '["苹果"]', 0, 1, 'listening', 'listen_picture_match_3opt', 'approved', 0, '["苹果"]', 'Giải thích');
        `).run();
      }

      // Insert 5 pending questions
      for (let i = 1; i <= 5; i++) {
        memDb.prepare(`
          INSERT INTO pending_questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active, tested_vocab, explanation_vi)
          VALUES ('q_pend_${i}', 'Stem ${i}', '["苹果"]', 0, 1, 'listening', 'listen_picture_match_3opt', 'pending', 1, '["苹果"]', 'Giải thích');
        `).run();
      }

      const matrix = computeCoverageMatrix(memDb);
      const row = matrix.rows.find((r) => r.level === 1 && r.skill === 'listening' && r.part_type === 'listen_picture_match_3opt');

      expect(row).toBeDefined();
      expect(row?.approvedCount).toBe(35); // Exactly 35 active, ignoring 10 inactive
      expect(row?.pendingCount).toBe(5);   // Exactly 5 pending
      // Target is 30, but unique vocab is only 1 ('苹果'), so diversity check fails -> quantity_met_lacks_diversity_or_types
      expect(row?.status).toBe('quantity_met_lacks_diversity_or_types');
    });
  });
});

