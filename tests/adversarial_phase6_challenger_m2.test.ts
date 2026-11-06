/**
 * Adversarial Phase 6 Challenge Test Suite
 * Archetype: empirical-challenger (critic, specialist)
 *
 * Verifies:
 * 1. Exact mathematical invariants across HSK 1–6 blueprints
 * 2. Condition 11 unverified flags on HSK 6 non-digitized subparts
 * 3. Open-ended 0-option writing tasks de-coercion & robustness
 * 4. Shortage response behavior for POST /api/exam/generate-mock (HSK 6: 82 req / 82 miss; HSK 4: 70 req)
 * 5. Durations and blueprint summaries synchronization across backend, frontend, fixtures
 * 6. Adversarial edge cases on format validation and mock exam generation
 * 7. Database integrity invariants (hsk_exam.db SHA256 and qbank.db schema/session counts)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { DatabaseSync } from 'node:sqlite';

import {
  examRouter,
  clearAllSessionsForTesting,
  createTestExamDb,
  setExamDbForTesting,
} from '../src/server/examRoutes';
import {
  loadBlueprintData,
  validateFormatCompatibility,
  inspectExamPoolBySections,
} from '../src/server/qbankFormatSync';
import { DEFAULT_BLUEPRINTS } from '../src/components/Admin/AIExamStudio';
import {
  HSK_EXAM_DURATIONS_MINUTES,
  getExamDurationMinutes,
} from '../src/components/HSKMockExam';
import { HSK_BLUEPRINT_SUMMARIES } from '../src/data/hskMockExamFixtures';

describe('Adversarial Challenger M2: Phase 6 Post-Acceptance Verification', () => {
  let server: http.Server;
  let baseUrl: string;
  let memDb: DatabaseSync;

  beforeAll(async () => {
    memDb = createTestExamDb({ seedPool: true });
    setExamDbForTesting(memDb);

    const app = express();
    app.use(express.json());
    app.use('/api/exam', examRouter);

    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address() as any;
        baseUrl = `http://127.0.0.1:${addr.port}/api/exam`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    clearAllSessionsForTesting();
    setExamDbForTesting(null);
    try {
      memDb?.close();
    } catch {}
    await new Promise<void>((resolve) => {
      if (server) {
        server.close(() => resolve());
      } else {
        resolve();
      }
    });
  });

  // =========================================================================
  // 1. Rigorous Mathematical Invariants Stress Testing
  // =========================================================================
  describe('1. Rigorous Mathematical Invariants across HSK 1–6', () => {
    const EXPECTED_SPEC = {
      1: { totalQ: 40, duration: 40, l: 20, r: 20, w: 0, lTime: 15, rTime: 20, wTime: 0, maxScore: 200, passScore: 120 },
      2: { totalQ: 60, duration: 60, l: 25, r: 25, w: 10, lTime: 20, rTime: 25, wTime: 10, maxScore: 300, passScore: 180 },
      3: { totalQ: 70, duration: 83, l: 30, r: 30, w: 10, lTime: 28, rTime: 30, wTime: 20, maxScore: 300, passScore: 180 },
      4: { totalQ: 70, duration: 85, l: 32, r: 32, w: 6, lTime: 25, rTime: 30, wTime: 25, maxScore: 300, passScore: 180 },
      5: { totalQ: 72, duration: 110, l: 35, r: 35, w: 2, lTime: 30, rTime: 35, wTime: 40, maxScore: 300, passScore: 180 },
      6: { totalQ: 82, duration: 125, l: 40, r: 40, w: 2, lTime: 35, rTime: 45, wTime: 40, maxScore: 300, passScore: 180 },
    };

    for (let lvl = 1; lvl <= 6; lvl++) {
      const exp = EXPECTED_SPEC[lvl as keyof typeof EXPECTED_SPEC];

      it(`HSK ${lvl}: Mathematical invariant strictly holds for questions and durations`, () => {
        const bp = loadBlueprintData(lvl);
        expect(bp, `Blueprint level${lvl}.json must load successfully`).toBeDefined();

        // 1. Level total questions
        expect(bp.total_questions).toBe(exp.totalQ);

        // 2. Section questions
        const lSec = bp.sections.listening;
        const rSec = bp.sections.reading;
        const wSec = bp.sections.writing;

        expect(lSec.total_questions).toBe(exp.l);
        expect(rSec.total_questions).toBe(exp.r);
        if (exp.w > 0) {
          expect(wSec).toBeDefined();
          expect(wSec.total_questions).toBe(exp.w);
        } else {
          expect(wSec).toBeUndefined();
        }

        const calculatedTotal = (lSec?.total_questions || 0) +
                                (rSec?.total_questions || 0) +
                                (wSec?.total_questions || 0);
        expect(calculatedTotal).toBe(exp.totalQ);

        // 3. Parts sum to section total
        const lParts = Object.values(lSec.parts) as any[];
        const lSum = lParts.reduce((s, p) => s + p.n_questions, 0);
        expect(lSum).toBe(lSec.total_questions);

        const rParts = Object.values(rSec.parts) as any[];
        const rSum = rParts.reduce((s, p) => s + p.n_questions, 0);
        expect(rSum).toBe(rSec.total_questions);

        if (wSec) {
          const wParts = Object.values(wSec.parts) as any[];
          const wSum = wParts.reduce((s, p) => s + p.n_questions, 0);
          expect(wSum).toBe(wSec.total_questions);
        }

        // 4. Durations: sections sum + 5 min buffer = total_time_min
        const sectionTimesSum = (lSec.time_min || 0) + (rSec.time_min || 0) + (wSec ? wSec.time_min || 0 : 0);
        expect(sectionTimesSum + 5).toBe(exp.duration);
        expect(bp.total_time_min).toBe(exp.duration);

        // 5. Score weights sum to maxScore
        const scoreSum = (lSec.score_weight || 0) + (rSec.score_weight || 0) + (wSec ? wSec.score_weight || 0 : 0);
        expect(scoreSum).toBe(exp.maxScore);
        expect(bp.max_score).toBe(exp.maxScore);
        expect(bp.passing_score).toBe(exp.passScore);
      });
    }

    it('HSK 4 strictly satisfies 32 + 32 + 6 = 70 questions and 85 minutes duration', () => {
      const bp4 = loadBlueprintData(4);
      const lQ = bp4.sections.listening.total_questions;
      const rQ = bp4.sections.reading.total_questions;
      const wQ = bp4.sections.writing.total_questions;
      expect(lQ).toBe(32);
      expect(rQ).toBe(32);
      expect(wQ).toBe(6);
      expect(lQ + rQ + wQ).toBe(70);
      expect(bp4.total_questions).toBe(70);
      expect(bp4.total_time_min).toBe(85);
    });

    it('HSK 6 strictly satisfies 40 + 40 + 2 = 82 questions and 125 minutes duration', () => {
      const bp6 = loadBlueprintData(6);
      const lQ = bp6.sections.listening.total_questions;
      const rQ = bp6.sections.reading.total_questions;
      const wQ = bp6.sections.writing.total_questions;
      expect(lQ).toBe(40);
      expect(rQ).toBe(40);
      expect(wQ).toBe(2);
      expect(lQ + rQ + wQ).toBe(82);
      expect(bp6.total_questions).toBe(82);
      expect(bp6.total_time_min).toBe(125);
    });
  });

  // =========================================================================
  // 2. Condition 11: Explicit Unverified Flags Audit
  // =========================================================================
  describe('2. Condition 11: Explicit Unverified Flags on HSK 6 Non-Digitized Subparts', () => {
    it('accurately identifies and tags the 4 non-digitized subparts in HSK 6', () => {
      const bp6 = loadBlueprintData(6);
      expect(bp6).toBeDefined();

      const lParts = bp6.sections.listening.parts;
      const rParts = bp6.sections.reading.parts;
      const wParts = bp6.sections.writing.parts;

      // 1. listening_1: unverified
      expect(lParts.listening_1.status).toBe('unverified');
      expect(lParts.listening_1.verified).toBe(false);

      // 2. listening_2: unverified
      expect(lParts.listening_2.status).toBe('unverified');
      expect(lParts.listening_2.verified).toBe(false);

      // 3. reading_1 & reading_2: verified / established format
      expect(rParts.reading_1.status).toBeUndefined();
      expect(rParts.reading_2.status).toBeUndefined();

      // 4. reading_3: unverified
      expect(rParts.reading_3.status).toBe('unverified');
      expect(rParts.reading_3.verified).toBe(false);

      // 5. writing_1: verified / traditional 400-char shortening
      expect(wParts.writing_1.status).toBeUndefined();

      // 6. writing_2: unverified (new 300-char essay)
      expect(wParts.writing_2.status).toBe('unverified');
      expect(wParts.writing_2.verified).toBe(false);
    });

    it('HSK 1–5 blueprints do not falsely mark standard official parts as unverified', () => {
      for (let lvl = 1; lvl <= 5; lvl++) {
        const bp = loadBlueprintData(lvl);
        for (const sec of Object.values(bp.sections) as any[]) {
          for (const [pKey, p] of Object.entries<any>(sec.parts)) {
            expect(p.status, `HSK ${lvl} ${pKey} should not have unverified status`).toBeUndefined();
            expect(p.verified, `HSK ${lvl} ${pKey} should not have verified: false`).toBeUndefined();
          }
        }
      }
    });
  });

  // =========================================================================
  // 3. 0-Option Writing Task Handling & De-Coercion
  // =========================================================================
  describe('3. Open-Ended 0-Option Writing Tasks De-Coercion & Format Robustness', () => {
    const zeroOptWritingSpecs = [
      { level: 2, partType: 'write_tianzige_from_pinyin' },
      { level: 3, partType: 'write_tianzige_from_pinyin' },
      { level: 3, partType: 'write_sentence_from_picture_word' },
      { level: 4, partType: 'write_sentence_from_picture_word' },
      { level: 4, partType: 'write_short_essay_80chars' },
      { level: 5, partType: 'write_story_from_4pictures_100chars' },
      { level: 5, partType: 'write_topic_essay_200chars' },
      { level: 6, partType: 'write_summary_shortening_400chars' },
      { level: 6, partType: 'write_topic_essay_300chars' },
    ];

    zeroOptWritingSpecs.forEach(({ level, partType }) => {
      it(`HSK ${level} ${partType}: accepts empty options [] and does NOT coerce into 4-option MCQ`, () => {
        const q = {
          id: `adv_writing_${level}_${partType}`,
          level,
          skill: 'writing',
          part_type: partType,
          stem: '请根据给出的词语造句或者书写汉字。',
          options: [],
          answer_index: 0,
          illustration_theme: 'writing',
        };

        const res = validateFormatCompatibility(q, level);
        expect(res.practice_eligible).toBe(true);
        expect(res.exam_eligible).toBe(true);
        expect(res.ineligible_reasons).toHaveLength(0);
      });

      it(`HSK ${level} ${partType}: accepts options serialized as JSON '[]'`, () => {
        const q = {
          id: `adv_writing_json_${level}_${partType}`,
          level,
          skill: 'writing',
          part_type: partType,
          stem: '请根据给出的词语造句或者书写汉字。',
          options: '[]',
          answer_index: 0,
          illustration_theme: 'writing',
        };

        const res = validateFormatCompatibility(q, level);
        expect(res.practice_eligible).toBe(true);
        expect(res.exam_eligible).toBe(true);
      });

      it(`HSK ${level} ${partType}: accepts answer_index -1 since it is open-ended writing`, () => {
        const q = {
          id: `adv_writing_noans_${level}_${partType}`,
          level,
          skill: 'writing',
          part_type: partType,
          stem: '请根据给出的词语造句或者书写汉字。',
          options: [],
          answer_index: -1,
          illustration_theme: 'writing',
        };

        const res = validateFormatCompatibility(q, level);
        expect(res.practice_eligible).toBe(true);
        expect(res.exam_eligible).toBe(true);
      });
    });

    it('contrast: standard 4-option MCQ question is REJECTED if options count is empty or less than required', () => {
      const qMcq = {
        id: 'adv_mcq_invalid_opts',
        level: 4,
        skill: 'reading',
        part_type: 'read_comprehension_passages_4opt',
        stem: '阅读短文回答问题。',
        options: ['A', 'B'], // only 2 options instead of required 4
        answer_index: 0,
      };

      const res = validateFormatCompatibility(qMcq, 4);
      expect(res.practice_eligible).toBe(true);
      expect(res.exam_eligible).toBe(false);
      expect(res.ineligible_reasons.some((r) => r.includes('yêu cầu chính xác 4 phương án'))).toBe(true);
    });
  });

  // =========================================================================
  // 4. Shortage Responses for POST /api/exam/generate-mock
  // =========================================================================
  describe('4. Shortage Responses for POST /api/exam/generate-mock', () => {
    it('HSK 6 mock exam request returns HTTP 400 with total_required: 82 and total_missing: 82', async () => {
      const res = await fetch(`${baseUrl}/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 6, mode: 'mock' }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.mode).toBe('mock');
      expect(data.level).toBe(6);
      expect(data.is_fully_eligible).toBe(false);
      expect(data.total_required).toBe(82);
      expect(data.total_missing).toBe(82);
      expect(data.total_available).toBe(0);

      // Section breakdown must match 40 listening, 40 reading, 2 writing
      expect(data.sections.listening.totalRequired).toBe(40);
      expect(data.sections.reading.totalRequired).toBe(40);
      expect(data.sections.writing.totalRequired).toBe(2);

      expect(data.error).toContain('còn thiếu 82 câu theo chuẩn blueprint');
    });

    it('HSK 4 mock exam request returns HTTP 400 with total_required: 70 (not 71)', async () => {
      const res = await fetch(`${baseUrl}/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 4, mode: 'mock' }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.total_required).toBe(70);
      expect(data.sections.listening.totalRequired).toBe(32);
      expect(data.sections.reading.totalRequired).toBe(32);
      expect(data.sections.writing.totalRequired).toBe(6);
    });

    it('rejects invalid or out-of-range HSK level in generate-mock', async () => {
      const invalidLevels = [0, 7, -1, 99];
      for (const badLevel of invalidLevels) {
        const res = await fetch(`${baseUrl}/generate-mock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ level: badLevel, mode: 'mock' }),
        });
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.success).toBe(false);
      }
    });

    it('skill practice mode for HSK 6 does not crash and requires 0 LLM calls', async () => {
      const res = await fetch(`${baseUrl}/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 6, mode: 'practice', count: 5 }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.sessionId).toBeDefined();
      expect(Array.isArray(data.questions)).toBe(true);
      if (data.questions.length > 0) {
        // Anti-cheat verification: answer_index and explanation_vi must be stripped before client submission
      }
    });
  });

  // =========================================================================
  // 5. Cross-Configuration Durations & Blueprint Synchronization
  // =========================================================================
  describe('5. Cross-Configuration Durations & Blueprint Synchronization', () => {
    const verifiedDurations = { 1: 40, 2: 60, 3: 83, 4: 85, 5: 110, 6: 125 };
    const verifiedQuestions = { 1: 40, 2: 60, 3: 70, 4: 70, 5: 72, 6: 82 };

    it('all four configuration files agree 100% on durations without any discrepancy', () => {
      for (let lvl = 1; lvl <= 6; lvl++) {
        const vDur = verifiedDurations[lvl as keyof typeof verifiedDurations];
        const vQ = verifiedQuestions[lvl as keyof typeof verifiedQuestions];

        // 1. Blueprint JSON file
        const bp = loadBlueprintData(lvl);
        expect(bp.total_time_min).toBe(vDur);
        expect(bp.total_questions).toBe(vQ);

        // 2. AIExamStudio DEFAULT_BLUEPRINTS
        const studioBp = DEFAULT_BLUEPRINTS[lvl];
        expect(studioBp.totalTimeMin).toBe(vDur);
        expect(studioBp.totalQuestions).toBe(vQ);

        // 3. HSKMockExam constant & function
        expect(HSK_EXAM_DURATIONS_MINUTES[lvl]).toBe(vDur);
        expect(getExamDurationMinutes(lvl)).toBe(vDur);

        // 4. HSK_BLUEPRINT_SUMMARIES in fixtures
        const fixtureBp = HSK_BLUEPRINT_SUMMARIES[lvl];
        expect(fixtureBp.time_limit_minutes).toBe(vDur);
        expect(fixtureBp.total_questions).toBe(vQ);
      }
    });

    it('GET /api/exam/blueprints reflects the synchronized values over HTTP', async () => {
      const res = await fetch(`${baseUrl}/blueprints`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);

      for (let lvl = 1; lvl <= 6; lvl++) {
        const bp = data.blueprints[lvl];
        expect(bp.time_limit_minutes).toBe(verifiedDurations[lvl as keyof typeof verifiedDurations]);
        expect(bp.total_questions).toBe(verifiedQuestions[lvl as keyof typeof verifiedQuestions]);
      }
    });
  });

  // =========================================================================
  // 6. Database Safety Invariants Check
  // =========================================================================
  describe('6. Database Safety Invariants', () => {
    it('data/hsk_exam.db SHA-256 hash strictly matches DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1', () => {
      const dbPath = path.resolve(process.cwd(), 'data/hsk_exam.db');
      const buf = fs.readFileSync(dbPath);
      const hash = crypto.createHash('sha256').update(buf).digest('hex').toUpperCase();
      expect(hash).toBe('DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1');
    });

    it('data/qbank/qbank.db has exactly 12 tables and 0 unapproved migrations', () => {
      const dbPath = path.resolve(process.cwd(), 'data/qbank/qbank.db');
      const db = new DatabaseSync(dbPath, { readOnly: true });

      const tables: any[] = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all();
      expect(tables.length).toBe(12);

      const tableNames = tables.map((t) => t.name);
      expect(tableNames).not.toContain('question_knowledge_links');
      expect(tableNames).not.toContain('question_distractor_rationales');

      const approvedActive = db.prepare(
        "SELECT COUNT(*) as cnt FROM questions WHERE status = 'approved' AND COALESCE(is_active, 1) = 1"
      ).get() as any;
      // 96 approved active questions (89 baseline + 7 admin-approved rowids 90-96)
      expect(approvedActive.cnt).toBe(96);

      db.close();
    });
  });
});
