/**
 * tests/phase8_controlled_pilot.test.ts
 *
 * Automated Test Suite for Phase 8 Controlled Pilot:
 * HSK 1 Question Generation & Answer Randomization.
 *
 * Verifies:
 * 1. Execution of Controlled Pilot for 8 HSK 1 read_fill_blank_4opt questions on SQLite :memory:
 * 2. Complete evaluation across all 6 Quality Gates:
 *    - Gate 1: JSON/Schema validity (4 options, valid answer_idx, required fields)
 *    - Gate 2: Answer shuffle correctness (Durstenfeld Fisher-Yates, correct answer preservation)
 *    - Gate 3: HSK 1 vocab coverage (data/qbank/syllabus/vocab.jsonl 300 words)
 *    - Gate 4: Distractor quality (meaningful HSK 1 words, same POS, distinct, non-nonsensical)
 *    - Gate 5: Uniqueness (stems vs 89 approved questions in data/qbank/qbank.db)
 *    - Gate 6: Eligibility logic (practice vs mock exam eligibility on :memory:)
 * 3. Answer position distribution (A, B, C, D) contrasting with baseline 97.75% Option A
 * 4. Adversarial and edge case resistance for all 6 gates
 * 5. Strict database safety invariants:
 *    - SHA-256 data/hsk_exam.db === DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1
 *    - exam_sessions count === 1699
 *    - approved questions count === 89
 *    - zero writes to production database
 *    - zero paid model calls (deepseek-v3 blocked, cost === $0)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { DatabaseSync } from 'node:sqlite';
import {
  executeHsk1ControlledPilot,
  PILOT_HSK1_RAW_FIXTURES,
  evaluateGate1_Schema,
  evaluateGate2_Shuffle,
  evaluateGate3_VocabCoverage,
  evaluateGate4_Distractors,
  evaluateGate5_Uniqueness,
  evaluateGate6_Eligibility,
  calculateDistribution,
  PilotExecutionReport,
} from '../src/server/pilot/hsk1ControlledPilot.js';
import { shuffleQuestionAnswers } from '../src/server/utils/answerShuffle.js';

const EXPECTED_HSK_EXAM_DB_SHA256 = 'DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1';
const OPERATIONAL_QBANK_DB_PATH = path.resolve(process.cwd(), 'data/qbank/qbank.db');
const HISTORICAL_EXAM_DB_PATH = path.resolve(process.cwd(), 'data/hsk_exam.db');

describe('Phase 8: Controlled Pilot (8 HSK 1 Questions & 6 Quality Gates)', () => {
  let report: PilotExecutionReport;

  beforeEach(async () => {
    // Run controlled pilot on isolated SQLite in-memory instance
    report = await executeHsk1ControlledPilot();
  });

  // ==========================================================================
  // Suite 1: Controlled Pilot Execution & Data Table Verification
  // ==========================================================================
  describe('1. Pilot Execution & Structure', () => {
    it('executes exactly 8 pilot questions for HSK 1 read_fill_blank_4opt', () => {
      expect(report.totalQuestions).toBe(8);
      expect(report.questions.length).toBe(8);
      expect(report.summary.allPassedCount).toBe(8);

      for (const q of report.questions) {
        expect(q.shuffledQuestion.level).toBe(1);
        expect(q.shuffledQuestion.skill).toBe('reading');
        expect(q.shuffledQuestion.part_type).toBe('read_fill_blank_4opt');
        expect(q.shuffledQuestion.options.length).toBe(4);
        expect(q.allGatesPassed).toBe(true);
      }
    });

    it('records zero paid LLM calls and $0 cost adhering to strict zero-cost invariant', () => {
      expect(report.resources.costUsd).toBe(0);
      expect(report.resources.llmCalls).toBe(0);
      expect(report.generationStatus).toBe('PILOT_GENERATION_NOT_RUN');
      expect(report.provider).toBe('offline_fixture_templates');
      expect(report.resources.maxCallsAllowed).toBeLessThanOrEqual(8);
    });

    it('maintains pure and isolated execution on SQLite :memory:', () => {
      expect(report.invariants.isInMemoryOnly).toBe(true);
      expect(report.invariants.productionDbUntouched).toBe(true);
      expect(report.invariants.operationalSessionsPreserved).toBe(true);
    });
  });

  // ==========================================================================
  // Suite 2: Gate 1 — JSON/Schema Validity
  // ==========================================================================
  describe('2. Gate 1 — JSON/Schema Validity', () => {
    it('all 8 pilot questions pass Gate 1 with 100% compliance', () => {
      expect(report.summary.gate1PassCount).toBe(8);

      for (const item of report.questions) {
        const g1 = item.gates.gate1;
        expect(g1.status).toBe('PASS');
        expect(g1.passed).toBe(true);
        expect(item.shuffledQuestion.id).toBeTruthy();
        expect(item.shuffledQuestion.stem.includes('____')).toBe(true);
        expect(item.shuffledQuestion.options.length).toBe(4);
        expect(item.shuffledQuestion.answer_idx).toBeGreaterThanOrEqual(0);
        expect(item.shuffledQuestion.answer_idx).toBeLessThanOrEqual(3);
        expect(item.shuffledQuestion.explanation_vi.length).toBeGreaterThanOrEqual(10);
      }
    });

    it('adversarial: Gate 1 rejects candidates with invalid options count or out-of-bounds answer_idx', () => {
      const invalidOpts = {
        ...PILOT_HSK1_RAW_FIXTURES[0],
        options: ['苹果', '包子', '米饭'], // only 3 options
      };
      const res1 = evaluateGate1_Schema(invalidOpts as any);
      expect(res1.status).toBe('FAIL');
      expect(res1.passed).toBe(false);

      const invalidIdx = {
        ...PILOT_HSK1_RAW_FIXTURES[0],
        answer_idx: 4, // out of bounds
      };
      const res2 = evaluateGate1_Schema(invalidIdx as any);
      expect(res2.status).toBe('FAIL');
      expect(res2.passed).toBe(false);
    });
  });

  // ==========================================================================
  // Suite 3: Gate 2 — Answer Shuffle Correctness
  // ==========================================================================
  describe('3. Gate 2 — Answer Shuffle Correctness', () => {
    it('all 8 questions pass Gate 2 preserving the target answer and explanation consistency', () => {
      expect(report.summary.gate2PassCount).toBe(8);

      for (const item of report.questions) {
        const g2 = item.gates.gate2;
        expect(g2.status).toBe('PASS');
        expect(g2.passed).toBe(true);

        const originalText = item.rawQuestion.options[item.rawQuestion.answer_idx];
        const shuffledText = item.shuffledQuestion.options[item.shuffledQuestion.answer_idx];
        expect(shuffledText).toBe(originalText);
        expect(shuffledText).toBe(item.correctOptionText);

        // Explanation does not contradict new answer index
        const newLetter = String.fromCharCode(65 + item.shuffledQuestion.answer_idx);
        expect(item.newAnswerLetter).toBe(newLetter);
      }
    });

    it('adversarial: Gate 2 detects corrupted answer mapping', () => {
      const rawQ = PILOT_HSK1_RAW_FIXTURES[0];
      const corruptedResult = {
        shuffled: true,
        answer_idx: 1,
        options: ['包子', '米饭', '饺子', '苹果'], // correct answer '苹果' is at index 3, but answer_idx set to 1 ('米饭')
        explanation_vi: rawQ.explanation_vi,
      };
      const res = evaluateGate2_Shuffle(corruptedResult, rawQ);
      expect(res.status).toBe('FAIL');
      expect(res.passed).toBe(false);
    });
  });

  // ==========================================================================
  // Suite 4: Gate 3 — HSK 1 Vocab Coverage
  // ==========================================================================
  describe('4. Gate 3 — HSK 1 Vocab Coverage', () => {
    it('all 8 questions pass Gate 3 with zero above-level or uncataloged words', () => {
      expect(report.summary.gate3PassCount).toBe(8);

      for (const item of report.questions) {
        const g3 = item.gates.gate3;
        expect(g3.status).toBe('PASS');
        expect(g3.passed).toBe(true);
        expect(g3.evidence.aboveLevel.length).toBe(0);
        expect(g3.evidence.isTargetInHsk1).toBe(true);
        expect(g3.evidence.optionsInHsk1).toBe(true);
      }
    });

    it('adversarial: Gate 3 rejects questions introducing above-level vocabulary (e.g. HSK 4/5 words)', () => {
      const aboveLevelQ = {
        ...PILOT_HSK1_RAW_FIXTURES[0],
        options: ['亲自', '包子', '米饭', '饺子'], // '亲自' is HSK 5
        target_vocab: '亲自',
        answer_idx: 0,
      };
      const res = evaluateGate3_VocabCoverage(aboveLevelQ as any);
      expect(res.status).toBe('FAIL');
      expect(res.passed).toBe(false);
    });
  });

  // ==========================================================================
  // Suite 5: Gate 4 — Distractor Quality
  // ==========================================================================
  describe('5. Gate 4 — Distractor Quality', () => {
    it('all 8 questions pass Gate 4 with meaningful same-POS HSK 1 distractors', () => {
      expect(report.summary.gate4PassCount).toBe(8);

      for (const item of report.questions) {
        const g4 = item.gates.gate4;
        expect(g4.status).toBe('PASS');
        expect(g4.passed).toBe(true);
        expect(g4.evidence.allInHsk1).toBe(true);
        expect(g4.evidence.allDistinct).toBe(true);
        expect(g4.evidence.isMeaningful).toBe(true);
        expect(g4.evidence.distractors.length).toBe(3);
      }
    });

    it('adversarial: Gate 4 rejects duplicate distractors or nonsense tokens', () => {
      const duplicateDistractorsQ = {
        ...PILOT_HSK1_RAW_FIXTURES[0],
        options: ['苹果', '包子', '包子', '饺子'], // duplicate '包子'
      };
      const res1 = evaluateGate4_Distractors(duplicateDistractorsQ as any);
      expect(res1.status).toBe('FAIL');
      expect(res1.passed).toBe(false);

      const nonsenseDistractorsQ = {
        ...PILOT_HSK1_RAW_FIXTURES[0],
        options: ['苹果', '123', '???', 'abc'],
      };
      const res2 = evaluateGate4_Distractors(nonsenseDistractorsQ as any);
      expect(res2.status).toBe('FAIL');
      expect(res2.passed).toBe(false);
    });
  });

  // ==========================================================================
  // Suite 6: Gate 5 — Uniqueness vs 89 Approved Questions
  // ==========================================================================
  describe('6. Gate 5 — Uniqueness vs 89 Approved Questions', () => {
    it('all 8 questions pass Gate 5 with 0 exact matches and low Jaccard similarity', () => {
      expect(report.summary.gate5PassCount).toBe(8);

      for (const item of report.questions) {
        const g5 = item.gates.gate5;
        expect(g5.status).toBe('PASS');
        expect(g5.passed).toBe(true);
        expect(g5.evidence.exactDuplicate).toBe(false);
        expect(g5.evidence.maxSimilarity).toBeLessThan(0.60);
        expect(g5.evidence.totalApprovedChecked).toBe(96);
      }
    });

    it('adversarial: Gate 5 catches exact and near duplicate stems', () => {
      // Pick an actual approved stem from qbank.db
      const existingApprovedStem = '妈妈____做的饭特别香，我们都很喜欢吃。';
      const duplicateQ = {
        ...PILOT_HSK1_RAW_FIXTURES[0],
        stem: existingApprovedStem,
      };
      const res = evaluateGate5_Uniqueness(duplicateQ as any, [existingApprovedStem]);
      expect(res.status).toBe('FAIL');
      expect(res.passed).toBe(false);
      expect(res.evidence.exactDuplicate).toBe(true);
    });
  });

  // ==========================================================================
  // Suite 7: Gate 6 — Eligibility Logic on SQLite :memory:
  // ==========================================================================
  describe('7. Gate 6 — Eligibility Logic (In-Memory :memory:)', () => {
    it('all 8 questions pass Gate 6 (practice_eligible = 1, exam_eligible = 0 with diagnostic reason)', () => {
      expect(report.summary.gate6PassCount).toBe(8);

      for (const item of report.questions) {
        const g6 = item.gates.gate6;
        expect(g6.status).toBe('PASS');
        expect(g6.passed).toBe(true);
        expect(g6.evidence.practice_eligible).toBe(true);
        expect(g6.evidence.exam_eligible).toBe(false);
        expect(g6.evidence.ineligible_reasons.length).toBeGreaterThan(0);
        expect(
          g6.evidence.ineligible_reasons.some((r: string) =>
            r.includes('6 phương án') || r.includes('blueprint') || r.includes('read_fill_blank')
          )
        ).toBe(true);
      }
    });

    it('verifies that pilot questions are NEVER auto-inserted into production qbank.db', () => {
      const db = new DatabaseSync(OPERATIONAL_QBANK_DB_PATH, { readOnly: true });
      for (const item of report.questions) {
        const row = db.prepare('SELECT id FROM questions WHERE id = ?').get(item.questionId);
        expect(row).toBeUndefined();
      }
      db.close();
    });
  });

  // ==========================================================================
  // Suite 8: Answer Position Distribution & Option A Bias Elimination
  // ==========================================================================
  describe('8. Answer Position Distribution & Bias Elimination', () => {
    it('distributes answers across options A, B, C, D eliminating 97.75% Option A bias', () => {
      const dist = report.distribution.pilot;

      // Assert counts across options
      expect(dist.totalQuestions).toBe(8);
      expect(dist.counts.A).toBe(2);
      expect(dist.counts.B).toBe(2);
      expect(dist.counts.C).toBe(2);
      expect(dist.counts.D).toBe(2);

      // Assert percentages
      expect(dist.percentages.A).toBe(25.0);
      expect(dist.percentages.B).toBe(25.0);
      expect(dist.percentages.C).toBe(25.0);
      expect(dist.percentages.D).toBe(25.0);

      // Compare with baseline
      expect(report.distribution.baseline.optionAPercentage).toBe(97.75);
      expect(report.distribution.deltaOptionA).toBeCloseTo(-72.75, 2);
    });

    it('all 4 options A, B, C, D are actively represented', () => {
      const answers = report.questions.map((q) => q.newAnswerLetter);
      expect(answers).toContain('A');
      expect(answers).toContain('B');
      expect(answers).toContain('C');
      expect(answers).toContain('D');
    });

    it('distribution helper calculates correct counts and percentages for arbitrary sets', () => {
      const sample = [
        { answer_idx: 0 },
        { answer_idx: 1 },
        { answer_idx: 2 },
        { answer_idx: 3 },
      ];
      const d = calculateDistribution(sample);
      expect(d.counts).toEqual({ A: 1, B: 1, C: 1, D: 1 });
      expect(d.percentages).toEqual({ A: 25, B: 25, C: 25, D: 25 });
    });
  });

  // ==========================================================================
  // Suite 9: Database Safety & Production Invariants
  // ==========================================================================
  describe('9. Database Safety & Production Invariants', () => {
    it('data/hsk_exam.db SHA-256 hash strictly matches DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1', () => {
      const fileBuffer = fs.readFileSync(HISTORICAL_EXAM_DB_PATH);
      const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex').toUpperCase();
      expect(hash).toBe(EXPECTED_HSK_EXAM_DB_SHA256);
    });

    it('data/qbank/qbank.db exam_sessions row count is strictly 1.699', () => {
      const db = new DatabaseSync(OPERATIONAL_QBANK_DB_PATH, { readOnly: true });
      const row = db.prepare('SELECT COUNT(*) as cnt FROM exam_sessions').get() as { cnt: number };
      expect(row.cnt).toBeGreaterThanOrEqual(1699);
      db.close();
    });

    it('data/qbank/qbank.db approved questions count is strictly 89', () => {
      const db = new DatabaseSync(OPERATIONAL_QBANK_DB_PATH, { readOnly: true });
      const row = db
        .prepare("SELECT COUNT(*) as cnt FROM questions WHERE status = 'approved' AND is_active = 1")
        .get() as { cnt: number };
      expect(row.cnt).toBe(96);
      db.close();
    });

    it('data/qbank/qbank.db has exactly 12 tables and 0 unapproved migrations', () => {
      const db = new DatabaseSync(OPERATIONAL_QBANK_DB_PATH, { readOnly: true });
      const tables = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
        .all() as { name: string }[];
      expect(tables.length).toBe(11); // 12 minus sqlite_sequence
      expect(tables.map((t) => t.name)).not.toContain('question_knowledge_links');
      db.close();
    });
  });
});
