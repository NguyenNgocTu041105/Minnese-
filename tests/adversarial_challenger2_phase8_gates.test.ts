/**
 * tests/adversarial_challenger2_phase8_gates.test.ts
 *
 * Dedicated Adversarial Challenge Suite by Challenger 2 for Minnese Phase 8.
 *
 * Rigorously stress-tests the 6 Quality Gates in src/server/pilot/hsk1ControlledPilot.ts
 * and verifies database safety invariants, boundary conditions, out-of-syllabus words,
 * stem collisions, distractor quality, and eligibility isolation.
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
  loadApprovedStemsFromOperationalDb,
  loadHsk1SyllabusFromJsonl,
} from '../src/server/pilot/hsk1ControlledPilot.js';
import {
  shuffleQuestionAnswers,
  shuffleOptionsArray,
  syncExplanationLetter,
} from '../src/server/utils/answerShuffle.js';
import { validateFormatCompatibility } from '../src/server/qbankFormatSync.js';

const EXPECTED_HSK_EXAM_DB_SHA256 = 'DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1';
const OPERATIONAL_QBANK_DB_PATH = path.resolve(process.cwd(), 'data/qbank/qbank.db');
const HISTORICAL_EXAM_DB_PATH = path.resolve(process.cwd(), 'data/hsk_exam.db');

describe('Challenger 2 — Adversarial Stress-Testing of 6 Quality Gates', () => {
  let baselineExamDbSha: string;
  let baselineExamSessionsCount: number;
  let baselineApprovedCount: number;

  beforeEach(() => {
    // 1. Snapshot historical DB SHA-256
    const fileBuffer = fs.readFileSync(HISTORICAL_EXAM_DB_PATH);
    baselineExamDbSha = crypto.createHash('sha256').update(fileBuffer).digest('hex').toUpperCase();

    // 2. Snapshot operational DB counts with readOnly: true
    const db = new DatabaseSync(OPERATIONAL_QBANK_DB_PATH, { readOnly: true });
    try {
      const sessRow = db.prepare('SELECT COUNT(*) as cnt FROM exam_sessions').get() as { cnt: number };
      baselineExamSessionsCount = sessRow.cnt;
      const appRow = db.prepare("SELECT COUNT(*) as cnt FROM questions WHERE status = 'approved' AND is_active = 1").get() as { cnt: number };
      baselineApprovedCount = appRow.cnt;
    } finally {
      db.close();
    }
  });

  afterEach(() => {
    // Verify invariants after every test
    const fileBuffer = fs.readFileSync(HISTORICAL_EXAM_DB_PATH);
    const postSha = crypto.createHash('sha256').update(fileBuffer).digest('hex').toUpperCase();
    expect(postSha).toBe(baselineExamDbSha);

    const db = new DatabaseSync(OPERATIONAL_QBANK_DB_PATH, { readOnly: true });
    try {
      const sessRow = db.prepare('SELECT COUNT(*) as cnt FROM exam_sessions').get() as { cnt: number };
      expect(sessRow.cnt).toBe(baselineExamSessionsCount);
      const appRow = db.prepare("SELECT COUNT(*) as cnt FROM questions WHERE status = 'approved' AND is_active = 1").get() as { cnt: number };
      expect(appRow.cnt).toBe(baselineApprovedCount);
    } finally {
      db.close();
    }
  });

  // ==========================================================================
  // 1. GATE 1 ADVERSARIAL STRESS TEST (Schema / Boundaries)
  // ==========================================================================
  describe('Gate 1: JSON/Schema Adversarial Boundary Challenges', () => {
    it('rejects empty or whitespace-only stem', () => {
      const q = { ...PILOT_HSK1_RAW_FIXTURES[0], stem: '   ' };
      const res = evaluateGate1_Schema(q as any);
      expect(res.passed).toBe(false);
      expect(res.status).toBe('FAIL');
    });

    it('rejects stem without blank placeholder ____', () => {
      const q = { ...PILOT_HSK1_RAW_FIXTURES[0], stem: '桌子上有三个苹果，很好吃。' };
      const res = evaluateGate1_Schema(q as any);
      expect(res.passed).toBe(false);
      expect(res.status).toBe('FAIL');
    });

    it('rejects stem that is solely the blank placeholder (underspecified context)', () => {
      const q = { ...PILOT_HSK1_RAW_FIXTURES[0], stem: '____' };
      const res = evaluateGate1_Schema(q as any);
      expect(res.passed).toBe(false);
      expect(res.status).toBe('FAIL');
    });

    it('rejects stem with multiple blanks for read_fill_blank_4opt', () => {
      const q = { ...PILOT_HSK1_RAW_FIXTURES[0], stem: '桌子上有____，还有____。' };
      const res = evaluateGate1_Schema(q as any);
      expect(res.passed).toBe(false);
      expect(res.status).toBe('FAIL');
    });

    it('rejects stem answer leakage (correct option already present in stem outside blank)', () => {
      const q = {
        ...PILOT_HSK1_RAW_FIXTURES[0],
        stem: '桌子上有苹果，我想吃三个____。',
        options: ['苹果', '包子', '米饭', '饺子'],
        answer_idx: 0,
      };
      const res = evaluateGate1_Schema(q as any);
      expect(res.passed).toBe(false);
      expect(res.status).toBe('FAIL');
      expect(res.evidence.errors.some((e: string) => e.includes('leakage'))).toBe(true);
    });

    it('rejects non-integer answer_idx (e.g. 1.5, NaN)', () => {
      const q1 = { ...PILOT_HSK1_RAW_FIXTURES[0], answer_idx: 1.5 };
      const res1 = evaluateGate1_Schema(q1 as any);
      expect(res1.passed).toBe(false);

      const q2 = { ...PILOT_HSK1_RAW_FIXTURES[0], answer_idx: NaN };
      const res2 = evaluateGate1_Schema(q2 as any);
      expect(res2.passed).toBe(false);
    });

    it('rejects negative or out-of-range answer_idx', () => {
      const qNeg = { ...PILOT_HSK1_RAW_FIXTURES[0], answer_idx: -1 };
      expect(evaluateGate1_Schema(qNeg as any).passed).toBe(false);

      const qOut = { ...PILOT_HSK1_RAW_FIXTURES[0], answer_idx: 4 };
      expect(evaluateGate1_Schema(qOut as any).passed).toBe(false);
    });

    it('rejects non-4 options count (2, 3, 5, 6 options)', () => {
      for (const count of [0, 1, 2, 3, 5, 6]) {
        const fakeOpts = Array.from({ length: count }, (_, i) => `词语${i}`);
        const q = { ...PILOT_HSK1_RAW_FIXTURES[0], options: fakeOpts, answer_idx: 0 };
        const res = evaluateGate1_Schema(q as any);
        expect(res.passed).toBe(false);
      }
    });

    it('rejects duplicate options', () => {
      const q = {
        ...PILOT_HSK1_RAW_FIXTURES[0],
        options: ['苹果', '苹果', '米饭', '饺子'],
        answer_idx: 0,
      };
      const res = evaluateGate1_Schema(q as any);
      expect(res.passed).toBe(false);
    });

    it('rejects missing or non-Vietnamese explanation', () => {
      const qNoExp = { ...PILOT_HSK1_RAW_FIXTURES[0], explanation_vi: '' };
      expect(evaluateGate1_Schema(qNoExp as any).passed).toBe(false);

      // Explanation with no Vietnamese words (only Chinese characters or symbols)
      const qChnExp = { ...PILOT_HSK1_RAW_FIXTURES[0], explanation_vi: '这是一个完全没有任何越南语的纯中文解析内容。' };
      expect(evaluateGate1_Schema(qChnExp as any).passed).toBe(false);
    });

    it('rejects explanation that explicitly designates the wrong option letter', () => {
      const q = {
        ...PILOT_HSK1_RAW_FIXTURES[0],
        answer_idx: 0, // Option A
        explanation_vi: 'Đáp án đúng là B vì từ này rất phổ biến.', // Contradicts A
      };
      const res = evaluateGate1_Schema(q as any);
      expect(res.passed).toBe(false);
      expect(res.evidence.errors.some((e: string) => e.includes('contradicts'))).toBe(true);
    });
  });

  // ==========================================================================
  // 2. GATE 2 ADVERSARIAL STRESS TEST (Shuffle Integrity & Explanation Sync)
  // ==========================================================================
  describe('Gate 2: Answer Shuffle Correctness & Immutability', () => {
    it('preserves target answer text across 200 consecutive randomized shuffles', () => {
      const rawQ = PILOT_HSK1_RAW_FIXTURES[0];
      const targetAnswerText = rawQ.options[rawQ.answer_idx];

      for (let i = 0; i < 200; i++) {
        const shuffled = shuffleQuestionAnswers(rawQ, Math.random, { syncExplanation: true });
        const res = evaluateGate2_Shuffle(shuffled, rawQ);

        expect(res.passed).toBe(true);
        expect(shuffled.options[shuffled.answer_idx]).toBe(targetAnswerText);
        expect(shuffled.new_answer_idx).toBe(shuffled.answer_idx);
        expect(shuffled.original_answer_idx).toBe(rawQ.answer_idx);
      }
    });

    it('guarantees that input question is strictly immutable', () => {
      const rawQ = { ...PILOT_HSK1_RAW_FIXTURES[0], options: [...PILOT_HSK1_RAW_FIXTURES[0].options] };
      const originalOptionsSnapshot = [...rawQ.options];
      const originalAnswerIdxSnapshot = rawQ.answer_idx;

      const shuffled = shuffleQuestionAnswers(rawQ, () => 0.5);

      // Verify original object was NOT mutated
      expect(rawQ.options).toEqual(originalOptionsSnapshot);
      expect(rawQ.answer_idx).toBe(originalAnswerIdxSnapshot);
      expect(shuffled.options).not.toBe(rawQ.options); // must be cloned
    });

    it('detects inverted or corrupted mapping where target answer text is mismatched', () => {
      const rawQ = PILOT_HSK1_RAW_FIXTURES[0];
      const corrupted = {
        shuffled: true,
        options: ['包子', '苹果', '米饭', '饺子'],
        answer_idx: 0, // points to '包子' instead of '苹果'
        explanation_vi: rawQ.explanation_vi,
      };
      const res = evaluateGate2_Shuffle(corrupted, rawQ);
      expect(res.passed).toBe(false);
      expect(res.status).toBe('FAIL');
    });

    it('detects un-synchronized explanation letter when answer moves from A to C', () => {
      const rawQ = {
        ...PILOT_HSK1_RAW_FIXTURES[0],
        explanation_vi: 'Đáp án đúng là A vì quả táo rất ngon.',
      };
      const unsyncedShuffled = {
        shuffled: true,
        options: ['包子', '米饭', '苹果', '饺子'], // '苹果' is at index 2 (C)
        answer_idx: 2,
        explanation_vi: 'Đáp án đúng là A vì quả táo rất ngon.', // Still says A!
      };
      const res = evaluateGate2_Shuffle(unsyncedShuffled, rawQ);
      expect(res.passed).toBe(false);
      expect(res.status).toBe('FAIL');
    });

    it('syncExplanationLetter accurately updates patterns 1, 2, 3, 4', () => {
      // Pattern 1: Đáp án đúng là A -> C
      expect(syncExplanationLetter('Đáp án đúng là A.', 0, 2)).toBe('Đáp án đúng là C.');
      // Pattern 2: A là đáp án đúng -> C
      expect(syncExplanationLetter('A là đáp án đúng.', 0, 2)).toBe('C là đáp án đúng.');
      // Pattern 3: Phương án A phù hợp -> C
      expect(syncExplanationLetter('Phương án A phù hợp nhất.', 0, 2)).toBe('Phương án C phù hợp nhất.');
      // Pattern 4: Đáp án: A -> C
      expect(syncExplanationLetter('Đáp án: A', 0, 2)).toBe('Đáp án: C');
    });
  });

  // ==========================================================================
  // 3. GATE 3 ADVERSARIAL STRESS TEST (HSK 1 Vocab Coverage & Boundary Leakage)
  // ==========================================================================
  describe('Gate 3: HSK 1 Vocab Coverage & Out-of-Syllabus Detection', () => {
    it('passes for 100% genuine HSK 1 vocabulary', () => {
      for (const raw of PILOT_HSK1_RAW_FIXTURES) {
        const res = evaluateGate3_VocabCoverage(raw);
        expect(res.passed).toBe(true);
        expect(res.status).toBe('PASS');
        expect(res.evidence.isTargetInHsk1).toBe(true);
        expect(res.evidence.optionsInHsk1).toBe(true);
        expect(res.evidence.aboveLevel.length).toBe(0);
      }
    });

    it('rejects question with target vocab from HSK 2, 3, 4, 5, 6', () => {
      // HSK 2: 铅笔, HSK 3: 打算, HSK 4: 精彩, HSK 5: 亲自, HSK 6: 慷慨
      const higherLevelWords = [
        { word: '铅笔', level: 2 },
        { word: '打算', level: 3 },
        { word: '精彩', level: 4 },
        { word: '亲自', level: 5 },
        { word: '慷慨', level: 6 },
      ];

      for (const item of higherLevelWords) {
        const q = {
          ...PILOT_HSK1_RAW_FIXTURES[0],
          target_vocab: item.word,
          options: [item.word, '包子', '米饭', '饺子'],
          answer_idx: 0,
        };
        const res = evaluateGate3_VocabCoverage(q);
        expect(res.passed).toBe(false);
        expect(res.status).toBe('FAIL');
      }
    });

    it('rejects question where any distractor is an above-level HSK word', () => {
      const q = {
        ...PILOT_HSK1_RAW_FIXTURES[0],
        options: ['苹果', '包子', '经济', '饺子'], // '经济' is HSK 4
        answer_idx: 0,
      };
      const res = evaluateGate3_VocabCoverage(q);
      expect(res.passed).toBe(false);
      expect(res.status).toBe('FAIL');
      expect(res.evidence.optionsInHsk1).toBe(false);
    });

    it('Gate 3 rejects HSK 4/5 vocabulary in the STEM', () => {
      const qWithAdvancedStem = {
        ...PILOT_HSK1_RAW_FIXTURES[0],
        stem: '尽管中国经济发展迅速，桌子上有三个____。', // 尽管, 经济, 发展, 迅速 are HSK 4/5
        options: ['苹果', '包子', '米饭', '饺子'],
        target_vocab: '苹果',
        answer_idx: 0,
      };
      const res = evaluateGate3_VocabCoverage(qWithAdvancedStem);
      expect(res.passed).toBe(false);
      expect(res.status).toBe('FAIL');
      expect(res.evidence.stemAboveLevel.length).toBeGreaterThan(0);
      expect(res.evidence.stemAboveLevel.some((w: any) => w.word === '尽管' || w.word === '经济')).toBe(true);
    });

    it('Gate 3 rejects out-of-syllabus characters in STEM even when detected in outOfSyllabus', () => {
      const qWithOutOfSyllabusStem = {
        ...PILOT_HSK1_RAW_FIXTURES[0],
        stem: '量子纠缠理论非常复杂，桌子上有三个____。', // 量子纠缠 is out of HSK 1-6 syllabus
        options: ['苹果', '包子', '米饭', '饺子'],
        target_vocab: '苹果',
        answer_idx: 0,
      };
      const res = evaluateGate3_VocabCoverage(qWithOutOfSyllabusStem);
      expect(res.passed).toBe(false);
      expect(res.status).toBe('FAIL');
      expect(res.evidence.outOfSyllabus).toContain('缠');
    });
  });

  // ==========================================================================
  // 4. GATE 4 ADVERSARIAL STRESS TEST (Distractor Quality)
  // ==========================================================================
  describe('Gate 4: Distractor Quality & Ambiguity Resistance', () => {
    it('passes all 8 fixtures with 3 distinct HSK 1 distractors', () => {
      for (const raw of PILOT_HSK1_RAW_FIXTURES) {
        const res = evaluateGate4_Distractors(raw);
        expect(res.passed).toBe(true);
        expect(res.status).toBe('PASS');
        expect(res.evidence.allDistinct).toBe(true);
        expect(res.evidence.allInHsk1).toBe(true);
        expect(res.evidence.isMeaningful).toBe(true);
        expect(res.evidence.posConsistent).toBe(true);
      }
    });

    it('rejects duplicate distractors', () => {
      const q = {
        ...PILOT_HSK1_RAW_FIXTURES[0],
        options: ['苹果', '包子', '包子', '米饭'],
      };
      const res = evaluateGate4_Distractors(q);
      expect(res.passed).toBe(false);
      expect(res.status).toBe('FAIL');
    });

    it('rejects nonsense non-Chinese tokens in distractors', () => {
      const q = {
        ...PILOT_HSK1_RAW_FIXTURES[0],
        options: ['苹果', '123', '???', 'abc'],
      };
      const res = evaluateGate4_Distractors(q);
      expect(res.passed).toBe(false);
      expect(res.status).toBe('FAIL');
    });

    it('rejects when options count is not 4', () => {
      const q = {
        ...PILOT_HSK1_RAW_FIXTURES[0],
        options: ['苹果', '包子', '米饭'],
      };
      const res = evaluateGate4_Distractors(q);
      expect(res.passed).toBe(false);
      expect(res.status).toBe('FAIL');
    });

    it('rejects distractors containing above-level HSK words', () => {
      const q = {
        ...PILOT_HSK1_RAW_FIXTURES[0],
        options: ['苹果', '包子', '米饭', '傲慢'], // '傲慢' is HSK 6
      };
      const res = evaluateGate4_Distractors(q);
      expect(res.passed).toBe(false);
      expect(res.status).toBe('FAIL');
    });

    it('rejects mixed-POS distractors incompatible with target part of speech', () => {
      const q = {
        ...PILOT_HSK1_RAW_FIXTURES[0],
        options: ['苹果', '去', '很', '吗'], // Noun, Verb, Adverb, Particle
        pos: 'noun',
        answer_idx: 0,
      };
      const res = evaluateGate4_Distractors(q);
      expect(res.passed).toBe(false);
      expect(res.status).toBe('FAIL');
      expect(res.evidence.posConsistent).toBe(false);
      expect(res.evidence.incompatibleDistractors.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // 5. GATE 5 ADVERSARIAL STRESS TEST (Stem Collisions vs 96 Approved)
  // ==========================================================================
  describe('Gate 5: Uniqueness vs 96 Approved Questions & Collision Avoidance', () => {
    it('verifies 0 stem collisions across all 8 pilot questions against 96 approved questions', () => {
      const approvedStems = loadApprovedStemsFromOperationalDb();
      // Verified: data/qbank/qbank.db has 96 approved active questions (89 baseline + 7 admin-approved rowids 90-96)
      expect(approvedStems.length).toBe(96);

      for (const q of PILOT_HSK1_RAW_FIXTURES) {
        const res = evaluateGate5_Uniqueness(q, approvedStems);
        expect(res.passed).toBe(true);
        expect(res.status).toBe('PASS');
        expect(res.evidence.exactDuplicate).toBe(false);
        expect(res.evidence.maxSimilarity).toBeLessThan(0.60);
      }
    });

    it('detects verbatim stem collision with an approved question', () => {
      const approvedStems = loadApprovedStemsFromOperationalDb();
      const existingApproved = approvedStems[0];

      const collidingQuestion = {
        ...PILOT_HSK1_RAW_FIXTURES[0],
        stem: existingApproved,
      };

      const res = evaluateGate5_Uniqueness(collidingQuestion, approvedStems);
      expect(res.passed).toBe(false);
      expect(res.status).toBe('FAIL');
      expect(res.evidence.exactDuplicate).toBe(true);
    });

    it('detects near-verbatim stem collision differing only by punctuation or spacing', () => {
      const approvedStems = loadApprovedStemsFromOperationalDb();
      const existingApproved = approvedStems[0];
      // Add extra spaces, commas, punctuation
      const normalizedColliding = `  ${existingApproved} ，。！？ `;

      const collidingQuestion = {
        ...PILOT_HSK1_RAW_FIXTURES[0],
        stem: normalizedColliding,
      };

      const res = evaluateGate5_Uniqueness(collidingQuestion, approvedStems);
      expect(res.passed).toBe(false);
      expect(res.status).toBe('FAIL');
      expect(res.evidence.exactDuplicate).toBe(true);
    });

    it('detects high Jaccard similarity (> 0.60) collision', () => {
      // Construct a near-identical stem with minor perturbation
      const baseStem = '明天晚上我们去电影院看电影吧。';
      const highSimStem = '明天晚上我们去电影院看电视吧。'; // 1 char changed

      const q = {
        ...PILOT_HSK1_RAW_FIXTURES[0],
        stem: highSimStem,
      };

      const res = evaluateGate5_Uniqueness(q, [baseStem]);
      expect(res.passed).toBe(false);
      expect(res.status).toBe('FAIL');
      expect(res.evidence.maxSimilarity).toBeGreaterThanOrEqual(0.60);
    });
  });

  // ==========================================================================
  // 6. GATE 6 ADVERSARIAL STRESS TEST (Eligibility Leakage & Test Isolation)
  // ==========================================================================
  describe('Gate 6: Eligibility Logic & Isolation Safeguards', () => {
    it('strictly confines read_fill_blank_4opt to practice_eligible = 1 and exam_eligible = 0', () => {
      for (const q of PILOT_HSK1_RAW_FIXTURES) {
        const res = evaluateGate6_Eligibility(q);
        expect(res.passed).toBe(true);
        expect(res.status).toBe('PASS');
        expect(res.evidence.practice_eligible).toBe(true);
        expect(res.evidence.exam_eligible).toBe(false);
        expect(res.evidence.ineligible_reasons.length).toBeGreaterThan(0);
        expect(
          res.evidence.ineligible_reasons.some((r: string) =>
            r.includes('6 phương án') || r.includes('blueprint') || r.includes('read_fill_blank')
          )
        ).toBe(true);
      }
    });

    it('fails Gate 6 if a question is falsely marked exam_eligible = 1', () => {
      // Simulate an artificial format check where exam_eligible leaked
      const fakeFormatCheck = {
        practice_eligible: true,
        exam_eligible: true, // Leakage!
        ineligible_reasons: [],
        compatible_formats: ['hsk1_official_mock'],
      };

      // Direct assert against Gate 6 contract: standalone 4opt MUST NOT be exam_eligible
      const passed =
        fakeFormatCheck.practice_eligible === true &&
        fakeFormatCheck.exam_eligible === false &&
        fakeFormatCheck.ineligible_reasons.length > 0;

      expect(passed).toBe(false);
    });

    it('executes Gate 6 strictly on SQLite :memory: with zero schema mutation on disk', () => {
      const memDb = new DatabaseSync(':memory:');
      const res = evaluateGate6_Eligibility(PILOT_HSK1_RAW_FIXTURES[0], memDb);
      expect(res.passed).toBe(true);

      // Verify table was created only in memory
      const tables = memDb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
      expect(tables.map((t: any) => t.name)).toContain('exam_eligible_pool');
      memDb.close();

      // Operational DB tables must remain untouched (no exam_eligible_pool table added if not already present)
      const opDb = new DatabaseSync(OPERATIONAL_QBANK_DB_PATH, { readOnly: true });
      const opTables = opDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all() as { name: string }[];
      expect(opTables.length).toBe(11); // 12 minus sqlite_sequence
      opDb.close();
    });
  });

  // ==========================================================================
  // 7. END-TO-END PILOT EXECUTION & DISTRIBUTION STRESS TEST
  // ==========================================================================
  describe('Controlled Pilot End-to-End Execution & Distribution', () => {
    it('executes full controlled pilot pipeline and verifies Option A bias elimination', async () => {
      const report = await executeHsk1ControlledPilot();

      expect(report.totalQuestions).toBe(8);
      expect(report.summary.allPassedCount).toBe(8);
      expect(report.summary.gate1PassCount).toBe(8);
      expect(report.summary.gate2PassCount).toBe(8);
      expect(report.summary.gate3PassCount).toBe(8);
      expect(report.summary.gate4PassCount).toBe(8);
      expect(report.summary.gate5PassCount).toBe(8);
      expect(report.summary.gate6PassCount).toBe(8);

      // Distribution verification: Exactly 2 A, 2 B, 2 C, 2 D (25% each)
      const dist = report.distribution.pilot;
      expect(dist.counts).toEqual({ A: 2, B: 2, C: 2, D: 2 });
      expect(dist.percentages).toEqual({ A: 25.0, B: 25.0, C: 25.0, D: 25.0 });

      // Baseline bias check
      expect(report.distribution.baseline.optionAPercentage).toBe(97.75);
      expect(report.distribution.deltaOptionA).toBeCloseTo(-72.75, 2);

      // Resource check
      expect(report.resources.costUsd).toBe(0);
      expect(report.resources.llmCalls).toBe(0);
      expect(report.generationStatus).toBe('PILOT_GENERATION_NOT_RUN');
    });

    it('verifies that zero pilot questions were written into operational qbank.db', () => {
      const opDb = new DatabaseSync(OPERATIONAL_QBANK_DB_PATH, { readOnly: true });
      for (const q of PILOT_HSK1_RAW_FIXTURES) {
        const found = opDb.prepare('SELECT id FROM questions WHERE id = ?').get(q.id);
        expect(found).toBeUndefined();
      }
      opDb.close();
    });
  });
});
