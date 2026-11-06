/**
 * tests/adversarial_reverify_phase8.test.ts
 *
 * Empirical Challenger Re-verification Test Suite for Phase 8.
 * Directly challenges and stress-tests Gate 3 (Vocab Coverage) and Gate 4 (Distractor Quality)
 * in src/server/pilot/hsk1ControlledPilot.ts to empirically verify genuine remediation.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
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
  getWordPos,
  loadHsk1SyllabusFromJsonl,
} from '../src/server/pilot/hsk1ControlledPilot.js';

const EXPECTED_HSK_EXAM_DB_SHA256 = 'DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1';
const OPERATIONAL_QBANK_DB_PATH = path.resolve(process.cwd(), 'data/qbank/qbank.db');
const HISTORICAL_EXAM_DB_PATH = path.resolve(process.cwd(), 'data/hsk_exam.db');

describe('Empirical Challenger Re-verification — Gate 3 & Gate 4 Remediation Stress Tests', () => {
  let baselineExamDbSha: string;
  let baselineExamSessionsCount: number;
  let baselineApprovedCount: number;

  beforeAll(() => {
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

  afterAll(() => {
    // Verify no DB mutations occurred
    const afterBuffer = fs.readFileSync(HISTORICAL_EXAM_DB_PATH);
    const afterSha = crypto.createHash('sha256').update(afterBuffer).digest('hex').toUpperCase();
    expect(afterSha).toBe(EXPECTED_HSK_EXAM_DB_SHA256);
    expect(afterSha).toBe(baselineExamDbSha);

    const db = new DatabaseSync(OPERATIONAL_QBANK_DB_PATH, { readOnly: true });
    try {
      const sessRow = db.prepare('SELECT COUNT(*) as cnt FROM exam_sessions').get() as { cnt: number };
      const appRow = db.prepare("SELECT COUNT(*) as cnt FROM questions WHERE status = 'approved' AND is_active = 1").get() as { cnt: number };
      expect(sessRow.cnt).toBe(baselineExamSessionsCount);
      expect(appRow.cnt).toBe(baselineApprovedCount);
    } finally {
      db.close();
    }
  });

  // ==========================================================================
  // GATE 3 EMPIRICAL RE-VERIFICATION
  // ==========================================================================
  describe('Gate 3: Multi-level Vocabulary Infiltration & Boundary Stress Testing', () => {
    it('strictly rejects stems containing single/un-decomposable HSK 2 words', () => {
      // HSK 2 words that are not decomposed into HSK 1 words: 跑步 (running), 丈夫 (husband)
      const hsk2TestCases = [
        { word: '跑步', stem: '我喜欢每天跑步，我想吃一个____。', level: 2 },
        { word: '丈夫', stem: '她是我的好朋友，她的丈夫买了一个____。', level: 2 },
      ];

      for (const tc of hsk2TestCases) {
        const q = {
          ...PILOT_HSK1_RAW_FIXTURES[0],
          stem: tc.stem,
          options: ['苹果', '包子', '米饭', '饺子'],
          target_vocab: '苹果',
          answer_idx: 0,
        };
        const res = evaluateGate3_VocabCoverage(q);
        expect(res.passed).toBe(false);
        expect(res.status).toBe('FAIL');
        expect(res.evidence.stemAboveLevel.length).toBeGreaterThan(0);
        expect(res.evidence.stemAboveLevel.some((w: any) => w.word === tc.word && w.level === tc.level)).toBe(true);
      }
    });

    it('strictly rejects stems containing un-decomposable HSK 3 words (e.g. 历史)', () => {
      const q = {
        ...PILOT_HSK1_RAW_FIXTURES[0],
        stem: '这本书讲的是中国历史，里面有三个____。',
        options: ['苹果', '包子', '米饭', '饺子'],
        target_vocab: '苹果',
        answer_idx: 0,
      };
      const res = evaluateGate3_VocabCoverage(q);
      expect(res.passed).toBe(false);
      expect(res.status).toBe('FAIL');
      expect(res.evidence.stemAboveLevel.length).toBeGreaterThan(0);
      expect(res.evidence.stemAboveLevel.some((w: any) => w.word === '历史' && w.level === 3)).toBe(true);
    });

    it('strictly rejects stems containing HSK 4 words (e.g. 尽管, 经济)', () => {
      const q = {
        ...PILOT_HSK1_RAW_FIXTURES[0],
        stem: '尽管中国经济发展迅速，桌子上有三个____。',
        options: ['苹果', '包子', '米饭', '饺子'],
        target_vocab: '苹果',
        answer_idx: 0,
      };
      const res = evaluateGate3_VocabCoverage(q);
      expect(res.passed).toBe(false);
      expect(res.status).toBe('FAIL');
      expect(res.evidence.stemAboveLevel.length).toBeGreaterThan(0);
      expect(res.evidence.stemAboveLevel.some((w: any) => w.word === '尽管' || w.word === '经济')).toBe(true);
    });

    it('strictly rejects stems containing HSK 5 words (e.g. 迅速)', () => {
      const q = {
        ...PILOT_HSK1_RAW_FIXTURES[0],
        stem: '这个技术的传播非常迅速，他买了三个____。',
        options: ['苹果', '包子', '米饭', '饺子'],
        target_vocab: '苹果',
        answer_idx: 0,
      };
      const res = evaluateGate3_VocabCoverage(q);
      expect(res.passed).toBe(false);
      expect(res.status).toBe('FAIL');
      expect(res.evidence.stemAboveLevel.length).toBeGreaterThan(0);
      expect(res.evidence.stemAboveLevel.some((w: any) => w.word === '迅速')).toBe(true);
    });

    it('strictly rejects HSK 2/3 compound words whose characters are in HSK 1 (e.g. 国家, 爱好, 开学)', () => {
      // Single-pass FMM directly detects multi-character above-level words in stem, preventing compound words
      // from slipping through Gate 3 even when constituent characters exist in HSK 1.
      const leakWords = [
        '国家', // HSK 3 (国 + 家 are in HSK 1)
        '爱好', // HSK 2 (爱 + 好 are in HSK 1)
        '开学', // HSK 2 (开 + 学 are in HSK 1)
        '外卖', // HSK 3 (外 + 卖 are in HSK 1)
        '听说', // HSK 3 (听 + 说 are in HSK 1)
        '上去', // HSK 2 (上 + 去 are in HSK 1)
        '回来', // HSK 2 (回 + 来 are in HSK 1)
        '还是', // HSK 2 (还 + 是 are in HSK 1)
        '后来', // HSK 3 (后 + 来 are in HSK 1)
        '大人', // HSK 3 (大 + 人 are in HSK 1)
        '女人', // HSK 3 (女 + 人 are in HSK 1)
      ];

      for (const w of leakWords) {
        const q = {
          ...PILOT_HSK1_RAW_FIXTURES[0],
          stem: `桌子上有三个____，我喜欢${w}。`,
          options: ['苹果', '包子', '米饭', '饺子'],
          target_vocab: '苹果',
          answer_idx: 0,
        };
        const res = evaluateGate3_VocabCoverage(q);
        expect(res.passed).toBe(false);
        expect(res.status).toBe('FAIL');
        expect(res.evidence.stemAboveLevel.length).toBeGreaterThan(0);
        expect(res.evidence.stemAboveLevel.some((item: any) => item.word === w)).toBe(true);
      }
    });

    it('strictly rejects stems containing out-of-syllabus characters (e.g. 量子纠缠, 吡咯)', () => {
      const q = {
        ...PILOT_HSK1_RAW_FIXTURES[0],
        stem: '量子纠缠是非常神奇的现象，桌子上有三个____。',
        options: ['苹果', '包子', '米饭', '饺子'],
        target_vocab: '苹果',
        answer_idx: 0,
      };
      const res = evaluateGate3_VocabCoverage(q);
      expect(res.passed).toBe(false);
      expect(res.status).toBe('FAIL');
      expect(res.evidence.outOfSyllabus).toContain('缠');
    });

    it('strictly rejects out-of-syllabus characters inside options', () => {
      const q = {
        ...PILOT_HSK1_RAW_FIXTURES[0],
        options: ['苹果', '包子', '米饭', '吡咯'], // '吡咯' is out of syllabus
        answer_idx: 0,
      };
      const res = evaluateGate3_VocabCoverage(q);
      expect(res.passed).toBe(false);
      expect(res.status).toBe('FAIL');
    });

    it('does NOT falsely reject clean HSK 1 stems with repeated words or numbers', () => {
      // "我喜欢看书，我也喜欢看电影。桌子上有三个____。" All words are 100% HSK 1
      const q = {
        ...PILOT_HSK1_RAW_FIXTURES[0],
        stem: '我喜欢看书，我也喜欢看电影。桌子上有三个____。',
        options: ['苹果', '包子', '米饭', '饺子'],
        target_vocab: '苹果',
        answer_idx: 0,
      };
      const res = evaluateGate3_VocabCoverage(q);
      expect(res.passed).toBe(true);
      expect(res.status).toBe('PASS');
      expect(res.evidence.stemAboveLevel.length).toBe(0);
      expect(res.evidence.outOfSyllabus.length).toBe(0);
    });

    it('passes all 8 clean pilot fixtures in PILOT_HSK1_RAW_FIXTURES', () => {
      for (const raw of PILOT_HSK1_RAW_FIXTURES) {
        const res = evaluateGate3_VocabCoverage(raw);
        expect(res.passed).toBe(true);
        expect(res.status).toBe('PASS');
        expect(res.evidence.isTargetInHsk1).toBe(true);
        expect(res.evidence.optionsInHsk1).toBe(true);
        expect(res.evidence.stemAboveLevel.length).toBe(0);
        expect(res.evidence.outOfSyllabus.length).toBe(0);
      }
    });
  });

  // ==========================================================================
  // GATE 4 EMPIRICAL RE-VERIFICATION
  // ==========================================================================
  describe('Gate 4: Distractor Quality & POS Enforcement Stress Testing', () => {
    it('strictly rejects mixed-POS distractor sets for Noun targets', () => {
      // Target: 苹果 (Noun)
      // Mixed: 去 (Verb), 很 (Adverb), 吗 (Particle)
      const q = {
        ...PILOT_HSK1_RAW_FIXTURES[0],
        options: ['苹果', '去', '很', '吗'],
        pos: 'noun',
        answer_idx: 0,
      };
      const res = evaluateGate4_Distractors(q);
      expect(res.passed).toBe(false);
      expect(res.status).toBe('FAIL');
      expect(res.evidence.posConsistent).toBe(false);
      expect(res.evidence.incompatibleDistractors.length).toBe(3);
    });

    it('strictly rejects verb distractors when target is a noun', () => {
      // Target: 苹果 (Noun)
      // Distractors: 看 (Verb), 吃 (Verb), 听 (Verb)
      const q = {
        ...PILOT_HSK1_RAW_FIXTURES[0],
        options: ['苹果', '看', '吃', '听'],
        pos: 'noun',
        answer_idx: 0,
      };
      const res = evaluateGate4_Distractors(q);
      expect(res.passed).toBe(false);
      expect(res.status).toBe('FAIL');
      expect(res.evidence.posConsistent).toBe(false);
    });

    it('strictly rejects noun distractors when target is a verb', () => {
      // Target: 看 (Verb)
      // Distractors: 苹果 (Noun), 米饭 (Noun), 朋友 (Noun)
      const q = {
        ...PILOT_HSK1_RAW_FIXTURES[4], // pilot_hsk1_005 target is '看'
        options: ['看', '苹果', '米饭', '朋友'],
        pos: 'verb',
        answer_idx: 0,
      };
      const res = evaluateGate4_Distractors(q);
      expect(res.passed).toBe(false);
      expect(res.status).toBe('FAIL');
      expect(res.evidence.posConsistent).toBe(false);
    });

    it('strictly rejects verb and noun distractors when target is an adjective', () => {
      // Target: 大 (Adjective)
      // Distractors: 看 (Verb), 苹果 (Noun), 听 (Verb)
      const q = {
        ...PILOT_HSK1_RAW_FIXTURES[6], // pilot_hsk1_007 target is '大'
        options: ['大', '看', '苹果', '听'],
        pos: 'adjective',
        answer_idx: 0,
      };
      const res = evaluateGate4_Distractors(q);
      expect(res.passed).toBe(false);
      expect(res.status).toBe('FAIL');
      expect(res.evidence.posConsistent).toBe(false);
    });

    it('allows valid same-POS distractors for all parts of speech', () => {
      // Noun target: 苹果 -> 包子, 米饭, 饺子
      const qNoun = {
        ...PILOT_HSK1_RAW_FIXTURES[0],
        options: ['苹果', '包子', '米饭', '饺子'],
        pos: 'noun',
        answer_idx: 0,
      };
      expect(evaluateGate4_Distractors(qNoun).passed).toBe(true);

      // Verb target: 看 -> 听, 写, 说
      const qVerb = {
        ...PILOT_HSK1_RAW_FIXTURES[4],
        options: ['看', '听', '写', '说'],
        pos: 'verb',
        answer_idx: 0,
      };
      expect(evaluateGate4_Distractors(qVerb).passed).toBe(true);

      // Adjective target: 大 -> 小, 多, 少
      const qAdj = {
        ...PILOT_HSK1_RAW_FIXTURES[6],
        options: ['大', '小', '多', '少'],
        pos: 'adjective',
        answer_idx: 0,
      };
      expect(evaluateGate4_Distractors(qAdj).passed).toBe(true);
    });

    it('resolves POS automatically from dictionary when pos field is omitted', () => {
      const q = {
        ...PILOT_HSK1_RAW_FIXTURES[0],
        options: ['苹果', '包子', '米饭', '饺子'],
        pos: undefined, // omitted pos
        answer_idx: 0,
      };
      const res = evaluateGate4_Distractors(q);
      expect(res.passed).toBe(true);
      expect(res.evidence.targetPos).toContain('noun');
      expect(res.evidence.posConsistent).toBe(true);
    });

    it('passes all 8 clean pilot fixtures in PILOT_HSK1_RAW_FIXTURES', () => {
      for (const raw of PILOT_HSK1_RAW_FIXTURES) {
        const res = evaluateGate4_Distractors(raw);
        expect(res.passed).toBe(true);
        expect(res.status).toBe('PASS');
        expect(res.evidence.allDistinct).toBe(true);
        expect(res.evidence.allInHsk1).toBe(true);
        expect(res.evidence.posConsistent).toBe(true);
        expect(res.evidence.incompatibleDistractors.length).toBe(0);
      }
    });
  });

  // ==========================================================================
  // FULL PILOT EXECUTION RE-VERIFICATION
  // ==========================================================================
  describe('Full Pilot Execution on SQLite In-Memory', () => {
    it('executes 8 questions through all 6 gates with 100% pass rate', async () => {
      const report = await executeHsk1ControlledPilot();

      expect(report.totalQuestions).toBe(8);
      expect(report.summary.allPassedCount).toBe(8);
      expect(report.summary.gate1PassCount).toBe(8);
      expect(report.summary.gate2PassCount).toBe(8);
      expect(report.summary.gate3PassCount).toBe(8);
      expect(report.summary.gate4PassCount).toBe(8);
      expect(report.summary.gate5PassCount).toBe(8);
      expect(report.summary.gate6PassCount).toBe(8);

      for (const r of report.questions) {
        expect(r.allGatesPassed).toBe(true);
        expect(r.gates.gate1.passed).toBe(true);
        expect(r.gates.gate2.passed).toBe(true);
        expect(r.gates.gate3.passed).toBe(true);
        expect(r.gates.gate4.passed).toBe(true);
        expect(r.gates.gate5.passed).toBe(true);
        expect(r.gates.gate6.passed).toBe(true);
        expect(r.gates.gate6.evidence.practice_eligible).toBe(true);
        expect(r.gates.gate6.evidence.exam_eligible).toBe(false);
      }
    });
  });
});
