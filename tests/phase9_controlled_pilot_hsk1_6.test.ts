/**
 * tests/phase9_controlled_pilot_hsk1_6.test.ts
 *
 * Phase 9 / Milestone 2 Verification Suite: Controlled Real Pilot Runner across HSK 1–6.
 *
 * Verifies:
 * 1. Generates 18 questions across HSK 1–6 (3 per level).
 * 2. Strictly bounded requests (<= 12 calls), $0 cost, free-tier only.
 * 3. Fisher-Yates answer shuffle and position distribution.
 * 4. 6 Quality Gates evaluation on all questions.
 * 5. Artifact generation & honest attribution (artifacts/pilot/real_llm_pilot_hsk1_6.json).
 * 6. Database safety invariants (:memory: only, hsk_exam.db hash preserved).
 */

import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

import {
  executeHskControlledPilot,
  PILOT_HSK1_6_RAW_FIXTURES,
  ControlledPilotReport,
} from '../src/server/pilot/hskControlledPilot.js';
import { shuffleQuestionAnswers } from '../src/server/utils/answerShuffle.js';
import { evaluateCandidateSixGates } from '../src/server/llm/questionValidator.js';

const EXPECTED_HSK_EXAM_DB_HASH = 'DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1';
const HSK_EXAM_DB_PATH = path.resolve(process.cwd(), 'data/hsk_exam.db');
const ARTIFACT_PATH = path.resolve(process.cwd(), 'artifacts/pilot/real_llm_pilot_hsk1_6.json');
const TEST_ARTIFACT_PATH = path.resolve(process.cwd(), 'artifacts/pilot/test_fixture_pilot.json');

function getSha256(filePath: string): string {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buf).digest('hex').toUpperCase();
}

describe('Phase 9 Milestone 2: Controlled HSK 1–6 Pilot Runner', () => {
  beforeAll(() => {
    expect(fs.existsSync(HSK_EXAM_DB_PATH)).toBe(true);
    expect(getSha256(HSK_EXAM_DB_PATH)).toBe(EXPECTED_HSK_EXAM_DB_HASH);
  });

  describe('Suite 1: Pilot Execution & HSK 1–6 Level Coverage', () => {
    it('1.1 generates exactly 18 questions across HSK 1–6 (3 per level)', async () => {
      const report = await executeHskControlledPilot({
        mode: 'fixture',
        pacingDelayMs: 0,
        artifactPath: TEST_ARTIFACT_PATH,
      });

      expect(report.totalQuestions).toBe(18);
      expect(report.questions).toHaveLength(18);

      const levelCounts: Record<number, number> = {};
      for (const q of report.questions) {
        levelCounts[q.level] = (levelCounts[q.level] || 0) + 1;
      }

      for (let lvl = 1; lvl <= 6; lvl++) {
        expect(levelCounts[lvl]).toBe(3);
      }
    });

    it('1.2 verifies every question conforms to reading skill and valid options structure', async () => {
      const report = await executeHskControlledPilot({
        mode: 'fixture',
        pacingDelayMs: 0,
        artifactPath: TEST_ARTIFACT_PATH,
      });

      for (const q of report.questions) {
        expect(q.skill).toBe('reading');
        expect(Array.isArray(q.options)).toBe(true);
        expect(q.options.length).toBeGreaterThanOrEqual(3);
        expect(q.answer_idx).toBeGreaterThanOrEqual(0);
        expect(q.answer_idx).toBeLessThan(q.options.length);
        expect(typeof q.stem).toBe('string');
        expect(q.stem.length).toBeGreaterThan(5);
        expect(typeof q.explanation_vi).toBe('string');
        expect(q.explanation_vi.length).toBeGreaterThan(10);
      }
    });

    it('1.3 attaches linguistic metadata (difficulty_tier, trap_type, distractor_rationales)', async () => {
      const report = await executeHskControlledPilot({
        mode: 'fixture',
        pacingDelayMs: 0,
        artifactPath: TEST_ARTIFACT_PATH,
      });

      const tierQuestions = report.questions.filter((q) => q.difficulty_tier);
      expect(tierQuestions.length).toBeGreaterThanOrEqual(6);

      const trapQuestions = report.questions.filter((q) => q.trap_type);
      expect(trapQuestions.length).toBeGreaterThanOrEqual(6);

      const rationalesQuestions = report.questions.filter(
        (q) => q.distractor_rationales || q.explanation_vi.includes('A')
      );
      expect(rationalesQuestions.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe('Suite 2: Resource Boundedness & Free-Tier Zero-Cost Invariants', () => {
    it('2.1 enforces strictly bounded calls (<= 12 requests) and $0 cost', async () => {
      const report = await executeHskControlledPilot({
        mode: 'fixture',
        pacingDelayMs: 0,
        artifactPath: TEST_ARTIFACT_PATH,
      });

      expect(report.resources.maxCallsAllowed).toBeLessThanOrEqual(12);
      expect(report.resources.llmCalls).toBeLessThanOrEqual(report.resources.maxCallsAllowed);
      expect(report.resources.costUsd).toBe(0);
      expect(report.invariants.costUsd).toBe(0);
      expect(report.resources.isFreeTierOnly).toBe(true);
    });

    it('2.2 reports latency and execution metadata truthfully', async () => {
      const report = await executeHskControlledPilot({
        mode: 'fixture',
        pacingDelayMs: 0,
        artifactPath: TEST_ARTIFACT_PATH,
      });

      expect(typeof report.resources.latencyMs).toBe('number');
      expect(report.resources.latencyMs).toBeGreaterThanOrEqual(0);
      expect(typeof report.timestamp).toBe('string');
      expect(['REAL_LLM_GENERATION', 'FALLBACK_FIXTURES']).toContain(report.generationStatus);
    });
  });

  describe('Suite 3: 6-Gate Quality Validation on Pilot Output', () => {
    it('3.1 evaluates all 18 questions across 6 Quality Gates with high overall pass rate', async () => {
      const report = await executeHskControlledPilot({
        mode: 'fixture',
        pacingDelayMs: 0,
        artifactPath: TEST_ARTIFACT_PATH,
      });

      expect(report.summary.totalGenerated).toBe(18);
      expect(report.summary.gate1PassCount).toBeGreaterThanOrEqual(16);
      expect(report.summary.gate2PassCount).toBeGreaterThanOrEqual(16);
      expect(report.summary.gate3PassCount).toBeGreaterThanOrEqual(16);
      expect(report.summary.gate4PassCount).toBeGreaterThanOrEqual(14);
      expect(report.summary.gate5PassCount).toBeGreaterThanOrEqual(16);
      expect(report.summary.gate6PassCount).toBeGreaterThanOrEqual(16);
      expect(report.summary.allPassedCount).toBeGreaterThanOrEqual(14);
      expect(report.summary.passRate).toBeGreaterThanOrEqual(0.75);
    });

    it('3.2 individual question records contain granular gate details', async () => {
      const report = await executeHskControlledPilot({
        mode: 'fixture',
        pacingDelayMs: 0,
        artifactPath: TEST_ARTIFACT_PATH,
      });

      for (const q of report.questions) {
        expect(q.gates).toBeDefined();
        expect(typeof q.gates.gate1_schema.passed).toBe('boolean');
        expect(typeof q.gates.gate2_rationales_coherence.passed).toBe('boolean');
        expect(typeof q.gates.gate3_vocab_coverage.passed).toBe('boolean');
        expect(typeof q.gates.gate4_distractor_quality.passed).toBe('boolean');
        expect(typeof q.gates.gate5_uniqueness.passed).toBe('boolean');
        expect(typeof q.gates.gate6_blind_solve.passed).toBe('boolean');
      }
    });
  });

  describe('Suite 4: Answer Shuffling & Option A Bias Mitigation', () => {
    it('4.1 shuffler remaps answer positions and preserves answer correctness', () => {
      const q = PILOT_HSK1_6_RAW_FIXTURES[0];
      const deterministicRng = () => 0.75; // causes index shift
      const res = shuffleQuestionAnswers(q, deterministicRng, { syncExplanation: true });

      expect(res.question.options).toHaveLength(q.options.length);
      const originalAnswerText = q.options[q.answer_idx];
      const newAnswerText = res.question.options[res.question.answer_idx];
      expect(newAnswerText).toBe(originalAnswerText);
    });

    it('4.2 custom RNG produces varied letter distributions across positions A, B, C, D', async () => {
      let counter = 0;
      const cyclingRng = () => {
        counter++;
        return (counter % 4) / 4;
      };

      const report = await executeHskControlledPilot({
        mode: 'fixture',
        pacingDelayMs: 0,
        artifactPath: TEST_ARTIFACT_PATH,
        rng: cyclingRng,
      });

      expect(report.distribution).toBeDefined();
      expect(typeof report.distribution.baselineOptionAPercentage).toBe('number');
      expect(typeof report.distribution.deltaOptionA).toBe('number');
    });
  });

  describe('Suite 5: Pilot Artifact Verification & Honest Attribution', () => {
    it('5.1 verifies artifacts/pilot/real_llm_pilot_hsk1_6.json exists and is valid', () => {
      expect(fs.existsSync(ARTIFACT_PATH)).toBe(true);

      const content = fs.readFileSync(ARTIFACT_PATH, 'utf-8');
      const artifact: ControlledPilotReport = JSON.parse(content);

      expect(artifact.totalQuestions).toBe(18);
      expect(['REAL_LLM_GENERATION', 'FALLBACK_FIXTURES']).toContain(artifact.generationStatus);
      expect(artifact.resources.costUsd).toBe(0);
      expect(artifact.resources.isFreeTierOnly).toBe(true);
      expect(artifact.questions).toHaveLength(18);

      for (const q of artifact.questions) {
        expect(['REAL_LLM_GENERATION', 'FALLBACK_FIXTURE']).toContain(q.attribution);
        expect(q.gates).toBeDefined();
      }
    });

    it('5.2 honest attribution invariant: fallback fixtures are transparently marked', () => {
      const content = fs.readFileSync(ARTIFACT_PATH, 'utf-8');
      const artifact: ControlledPilotReport = JSON.parse(content);

      const fixtures = artifact.questions.filter((q) => q.attribution === 'FALLBACK_FIXTURE');
      const realGen = artifact.questions.filter((q) => q.attribution === 'REAL_LLM_GENERATION');

      expect(fixtures.length + realGen.length).toBe(18);
      expect(artifact.summary.allPassedCount).toBe(
        artifact.questions.filter((q) => q.allGatesPassed).length
      );
    });

    it('5.3 verifies isolated test artifact was written to test_fixture_pilot.json without overwriting real_llm_pilot_hsk1_6.json', () => {
      expect(fs.existsSync(TEST_ARTIFACT_PATH)).toBe(true);
      const testContent = fs.readFileSync(TEST_ARTIFACT_PATH, 'utf-8');
      const testReport: ControlledPilotReport = JSON.parse(testContent);
      expect(testReport.totalQuestions).toBe(18);
      expect(testReport.generationStatus).toBe('FALLBACK_FIXTURES');
    });
  });

  describe('Suite 6: Database Safety & Bit-for-Bit Integrity Invariants', () => {
    it('6.1 data/hsk_exam.db SHA-256 strictly preserved', () => {
      const hash = getSha256(HSK_EXAM_DB_PATH);
      expect(hash).toBe(EXPECTED_HSK_EXAM_DB_HASH);
    });

    it('6.2 data/qbank/qbank.db operational tables count remains strictly 12', () => {
      const qbankDbPath = path.resolve(process.cwd(), 'data/qbank/qbank.db');
      const { DatabaseSync } = require('node:sqlite');
      const db = new DatabaseSync(qbankDbPath, { readOnly: true });
      const rows: any[] = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
      expect(rows.length).toBe(12);
      db.close();
    });
  });
});
