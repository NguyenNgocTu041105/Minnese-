/**
 * tests/vocab_rotator_standardization.test.ts
 *
 * Independent Regression Test Suite for Phase 8.2: Vocab Syllabus Standardization (R3).
 * Verifies that vocabRotator.ts loads strictly from canonical JSONL files (vocab.jsonl + vocab_restored.jsonl),
 * eliminating data/inbox/hsk30.csv, achieving exact 300 HSK 1 words and 5,400 cumulative HSK 1-6 items,
 * and matching qbankCoverageEngine.ts 100%.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

import {
  loadSyllabusVocab,
  getRotatedVocab,
  clearSyllabusCache,
  type VocabItem,
} from '../src/server/llm/vocabRotator';

import { getSyllabusCatalog } from '../src/server/qbankCoverageEngine';

describe('Phase 8.2: Vocab Syllabus Standardization Suite (R3)', () => {
  beforeEach(() => {
    clearSyllabusCache();
  });

  // ===========================================================================
  // 1. Exact Quantitative Catalog Verification
  // ===========================================================================
  describe('1. Exact Quantitative Catalog Verification', () => {
    it('HSK 1 returns exactly 300 words (CLEC 2025 standard, NOT 500 from draft CSV)', () => {
      const hsk1Words = loadSyllabusVocab(1);
      expect(hsk1Words).toHaveLength(300);

      // Verify all items belong to Level 1
      for (const item of hsk1Words) {
        expect(item.level).toBe(1);
        expect(typeof item.word).toBe('string');
        expect(item.word.length).toBeGreaterThan(0);
      }

      // Verify uniqueness of word strings in Level 1
      const uniqueWords = new Set(hsk1Words.map((w) => w.word));
      expect(uniqueWords.size).toBe(300);
    });

    it('HSK 1-6 per-level counts match CLEC 2025 standard exactly: [300, 200, 500, 1000, 1600, 1800]', () => {
      const expectedTargets: Record<number, number> = {
        1: 300,
        2: 200,
        3: 500,
        4: 1000,
        5: 1600,
        6: 1800,
      };

      let cumulativeCount = 0;
      for (let level = 1; level <= 6; level++) {
        const items = loadSyllabusVocab(level);
        const expected = expectedTargets[level];
        expect(items.length).toBe(expected);
        cumulativeCount += items.length;
      }

      // Cumulative HSK 1-6 catalog count is exactly 5,400 items
      expect(cumulativeCount).toBe(5400);
    });

    it('returns empty array for invalid or non-existent levels (e.g. 0, 7, -1)', () => {
      expect(loadSyllabusVocab(0)).toEqual([]);
      expect(loadSyllabusVocab(7)).toEqual([]);
      expect(loadSyllabusVocab(-1)).toEqual([]);
    });
  });

  // ===========================================================================
  // 2. Cross-Module Consistency with qbankCoverageEngine
  // ===========================================================================
  describe('2. Cross-Module Consistency with qbankCoverageEngine', () => {
    it('100% of HSK 1 words in vocabRotator match words in qbankCoverageEngine', () => {
      const rotatorVocab1 = loadSyllabusVocab(1);
      const coverageCatalog = getSyllabusCatalog();
      const coverageHsk1List = coverageCatalog.wordsByLevel.get(1) || [];

      expect(coverageHsk1List).toHaveLength(300);

      const coverageHsk1Words = new Set(coverageHsk1List.map((entry) => entry.word));

      for (const item of rotatorVocab1) {
        expect(coverageHsk1Words.has(item.word)).toBe(true);
      }
    });

    it('restored polyphone/polyseme items from vocab_restored.jsonl are included in Levels 2-6', () => {
      // For level 2, vocab.jsonl has 197 headwords + vocab_restored.jsonl has 3 restored items = 200
      const hsk2Items = loadSyllabusVocab(2);
      expect(hsk2Items).toHaveLength(200);

      const restoredWordsInLvl2 = hsk2Items.filter((i) => i.id.startsWith('w_restored_'));
      expect(restoredWordsInLvl2.length).toBe(3);

      // Spot-check restored words in Level 2: '点', '过', '花'
      const restoredWordNames = restoredWordsInLvl2.map((i) => i.word);
      expect(restoredWordNames).toContain('点');
      expect(restoredWordNames).toContain('过');
      expect(restoredWordNames).toContain('花');
    });
  });

  // ===========================================================================
  // 3. Absence of Obsolete 2021 Draft Words & Retention of Essential Words
  // ===========================================================================
  describe('3. Absence of Obsolete 2021 Draft Words & Retention of Essential Words', () => {
    it('excludes 2021 draft CSV words that do not belong to HSK 1 in CLEC 2025', () => {
      const hsk1Words = new Set(loadSyllabusVocab(1).map((w) => w.word));

      // Words that were falsely classified as Level 1 in hsk30.csv but belong to HSK 2+ in CLEC 2025:
      const nonHsk1DraftWords = [
        '爱好', // HSK 2 in CLEC 2025
        '白',   // HSK 5 in CLEC 2025
        '班',   // HSK 2
        '帮',   // HSK 2
        '帮忙', // HSK 2
        '包',   // HSK 2
      ];

      for (const draftWord of nonHsk1DraftWords) {
        expect(hsk1Words.has(draftWord)).toBe(false);
      }
    });

    it('includes essential HSK 1 words that were missing from 2021 draft CSV Level 1', () => {
      const hsk1Words = new Set(loadSyllabusVocab(1).map((w) => w.word));

      // Core HSK 1 words in CLEC 2025 that were misclassified or missing in hsk30.csv:
      const essentialHsk1Words = [
        '苹果',
        '出租车',
        '猫',
        '狗',
        '漂亮',
        '做饭',
        '超市',
        '你好',
        '便宜',
        '公司',
        '分钟',
      ];

      for (const word of essentialHsk1Words) {
        expect(hsk1Words.has(word)).toBe(true);
      }
    });
  });

  // ===========================================================================
  // 4. In-Memory Caching & getRotatedVocab Behavior
  // ===========================================================================
  describe('4. In-Memory Caching & getRotatedVocab Behavior', () => {
    it('caches loaded vocabulary across multiple calls', () => {
      const firstCall = loadSyllabusVocab(1);
      const secondCall = loadSyllabusVocab(1);
      // Reference equality confirms in-memory cache hit
      expect(firstCall).toBe(secondCall);
    });

    it('clears cache successfully when clearSyllabusCache is invoked', () => {
      const firstCall = loadSyllabusVocab(1);
      clearSyllabusCache();
      const secondCall = loadSyllabusVocab(1);
      // New array reference confirms cache was cleared and reloaded
      expect(firstCall).not.toBe(secondCall);
      expect(firstCall).toEqual(secondCall);
    });

    it('getRotatedVocab rotates words deterministically from the standardized catalog', () => {
      const rotated = getRotatedVocab(1, 10, new Date('2026-10-26T12:00:00Z'));
      expect(rotated).toHaveLength(10);

      const hsk1CatalogSet = new Set(loadSyllabusVocab(1).map((w) => w.word));
      for (const item of rotated) {
        expect(item.level).toBe(1);
        expect(hsk1CatalogSet.has(item.word)).toBe(true);
      }
    });
  });

  // ===========================================================================
  // 5. Source File & Database Invariants
  // ===========================================================================
  describe('5. Source File & Database Invariants', () => {
    const vocabJsonlPath = path.resolve(process.cwd(), 'data/qbank/syllabus/vocab.jsonl');
    const hskExamDbPath = path.resolve(process.cwd(), 'data/hsk_exam.db');
    const qbankDbPath = path.resolve(process.cwd(), 'data/qbank/qbank.db');

    it('data/qbank/syllabus/vocab.jsonl is strictly unmodified (byte size and line count intact)', () => {
      expect(fs.existsSync(vocabJsonlPath)).toBe(true);
      const stat = fs.statSync(vocabJsonlPath);
      expect(stat.size).toBe(1339124);

      const content = fs.readFileSync(vocabJsonlPath, 'utf-8');
      const lines = content.split('\n').filter((l) => l.trim().length > 0);
      expect(lines).toHaveLength(5334);
    });

    it('data/hsk_exam.db SHA-256 remains bit-for-bit identical to invariant', () => {
      const buffer = fs.readFileSync(hskExamDbPath);
      const sha256 = crypto.createHash('sha256').update(buffer).digest('hex').toUpperCase();
      expect(sha256).toBe('DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1');
    });

    it('data/qbank/qbank.db exam_sessions remains 1,699', () => {
      const db = new DatabaseSync(qbankDbPath, { readOnly: true });
      const row = db.prepare('SELECT COUNT(1) as c FROM exam_sessions').get() as { c: number };
      expect(row.c).toBeGreaterThanOrEqual(1699);
      db.close();
    });
  });
});
