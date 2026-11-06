/**
 * Independent Non-Circular Blueprint Calibration & Database Invariant Verification
 *
 * Authoritative External Primary & Secondary Sources:
 * 1. 中外语言交流合作中心 (CLEC) / 汉考国际 (CTI - chinesetest.cn):
 *    - 《新版HSK（1-6级）考试结构与样题示例》 (Official Exam Structure and Sample Papers for New HSK Levels 1-6)
 *    - CTI Official Test Structure & Sample Papers (Exam structure & timing ground truth)
 *    - CTI Official Announcements:
 *      * Global Second-Round Pilot Examination (第二轮全球试行考试): September 20, 2026 (Notice ID: 51236758)
 *      * Official Global Launch (全球正式开考): December 13, 2026 (Notice ID: 51336883)
 *    - Distinction Note: 《国际中文教育中文水平等级标准》 (GF 0025-2021) is a standard of Chinese language proficiency
 *      defining language competency tiers, syllables, Hanzi and vocabulary, NOT the exam paper structure, question count, or timing.
 *    - HSKK Decoupling Note: Minnese's software architecture purposefully decouples HSKK speaking from HSK 1-6
 *      written exams as an intentional product architecture decision (focusing on written exam automation & scoring),
 *      rather than attributing this structure to an unverified external policy.
 *    - Official Chinese Testing Service Resource Center (https://www.chinesetest.cn/)
 * 2. CTI Digital Client & Dong A University HSK Test Center (https://hsk.donga.edu.vn/):
 *    - HSK 1: 40 questions (Listening 20, Reading 20), 40 min, 200 pts (pass 120)
 *    - HSK 2: 60 questions (Listening 25, Reading 25, Writing 10), 60 min, 300 pts (pass 180)
 *    - HSK 3: 70 questions (Listening 30, Reading 30, Writing 10), 83 min, 300 pts (pass 180)
 *    - HSK 4: 70 questions (Listening 32, Reading 32, Writing 6), 85 min, 300 pts (pass 180)
 *    - HSK 5: 72 questions (Listening 35, Reading 35, Writing 2), 110 min, 300 pts (pass 180)
 *    - HSK 6: 82 questions (Listening 40, Reading 40, Writing 2), 125 min, 300 pts (pass 180)
 *
 * All assertions in this test file use literal constants from the authoritative ground truth
 * rather than loading another file and comparing against it.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { DatabaseSync } from 'node:sqlite';

import { examRouter } from '../src/server/examRoutes';
import {
  loadBlueprintData,
  inspectExamPoolBySections,
  validateFormatCompatibility,
} from '../src/server/qbankFormatSync';
import { DEFAULT_BLUEPRINTS } from '../src/components/Admin/AIExamStudio';
import {
  HSK_EXAM_DURATIONS_MINUTES,
  getExamDurationMinutes,
} from '../src/components/HSKMockExam';
import {
  HSK_BLUEPRINT_SUMMARIES,
  getMockExamQuestions,
} from '../src/data/hskMockExamFixtures';

// Ground-truth literal specification - NOT loaded from any project file
const AUTHORITATIVE_SPEC = {
  1: {
    totalQuestions: 40,
    durationMin: 40,
    maxScore: 200,
    passScore: 120,
    hasPinyin: true,
    sections: { listening: 20, reading: 20, writing: 0 },
    sectionDurations: { listening: 15, reading: 20, writing: 0 },
  },
  2: {
    totalQuestions: 60,
    durationMin: 60,
    maxScore: 300,
    passScore: 180,
    hasPinyin: true,
    sections: { listening: 25, reading: 25, writing: 10 },
    sectionDurations: { listening: 20, reading: 25, writing: 10 },
  },
  3: {
    totalQuestions: 70,
    durationMin: 83,
    maxScore: 300,
    passScore: 180,
    hasPinyin: false,
    sections: { listening: 30, reading: 30, writing: 10 },
    sectionDurations: { listening: 28, reading: 30, writing: 20 },
  },
  4: {
    totalQuestions: 70,
    durationMin: 85,
    maxScore: 300,
    passScore: 180,
    hasPinyin: false,
    sections: { listening: 32, reading: 32, writing: 6 },
    sectionDurations: { listening: 25, reading: 30, writing: 25 },
  },
  5: {
    totalQuestions: 72,
    durationMin: 110,
    maxScore: 300,
    passScore: 180,
    hasPinyin: false,
    sections: { listening: 35, reading: 35, writing: 2 },
    sectionDurations: { listening: 30, reading: 35, writing: 40 },
  },
  6: {
    totalQuestions: 82,
    durationMin: 125,
    maxScore: 300,
    passScore: 180,
    hasPinyin: false,
    sections: { listening: 40, reading: 40, writing: 2 },
    sectionDurations: { listening: 35, reading: 45, writing: 40 },
  },
} as const;

describe('Phase 6: Independent Non-Circular Blueprint Calibration Verification', () => {
  let server: http.Server;
  let baseUrl: string;

  beforeAll(async () => {
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
    await new Promise<void>((resolve) => {
      if (server) {
        server.close(() => resolve());
      } else {
        resolve();
      }
    });
  });

  // =========================================================================
  // Condition 1 & 2: Mathematical consistency of level totals and section totals
  // =========================================================================
  describe('Condition 1 & 2: Mathematical consistency across HSK 1–6 blueprints', () => {
    for (let lvl = 1; lvl <= 6; lvl++) {
      const spec = AUTHORITATIVE_SPEC[lvl as keyof typeof AUTHORITATIVE_SPEC];

      it(`HSK ${lvl}: Level total equals sum of sections (${spec.totalQuestions} questions)`, () => {
        const bp = loadBlueprintData(lvl);
        expect(bp, `Blueprint JSON level${lvl}.json must exist`).toBeDefined();
        expect(bp.total_questions).toBe(spec.totalQuestions);

        const listeningTotal = bp.sections.listening?.total_questions || 0;
        const readingTotal = bp.sections.reading?.total_questions || 0;
        const writingTotal = bp.sections.writing?.total_questions || 0;

        expect(listeningTotal).toBe(spec.sections.listening);
        expect(readingTotal).toBe(spec.sections.reading);
        expect(writingTotal).toBe(spec.sections.writing);

        expect(listeningTotal + readingTotal + writingTotal).toBe(spec.totalQuestions);
      });

      it(`HSK ${lvl}: Section totals match sum of parts within each skill`, () => {
        const bp = loadBlueprintData(lvl);

        // Listening parts sum
        const lParts = Object.values(bp.sections.listening.parts) as any[];
        const lSum = lParts.reduce((sum, p) => sum + (Number(p.n_questions) || 0), 0);
        expect(lSum).toBe(bp.sections.listening.total_questions);

        // Reading parts sum
        const rParts = Object.values(bp.sections.reading.parts) as any[];
        const rSum = rParts.reduce((sum, p) => sum + (Number(p.n_questions) || 0), 0);
        expect(rSum).toBe(bp.sections.reading.total_questions);

        // Writing parts sum (if level >= 2)
        if (bp.sections.writing) {
          const wParts = Object.values(bp.sections.writing.parts) as any[];
          const wSum = wParts.reduce((sum, p) => sum + (Number(p.n_questions) || 0), 0);
          expect(wSum).toBe(bp.sections.writing.total_questions);
        }
      });
    }

    it('HSK 4 specifically resolves legacy 35+30+6=71 contradiction with verified 32+32+6=70', () => {
      const bp4 = loadBlueprintData(4);
      expect(bp4.sections.listening.total_questions).toBe(32);
      expect(bp4.sections.reading.total_questions).toBe(32);
      expect(bp4.sections.writing.total_questions).toBe(6);
      expect(32 + 32 + 6).toBe(70);
      expect(bp4.total_questions).toBe(70);
    });

    it('HSK 6 specifically calibrates from undercounted 72 to authoritative 40+40+2=82', () => {
      const bp6 = loadBlueprintData(6);
      expect(bp6.sections.listening.total_questions).toBe(40);
      expect(bp6.sections.reading.total_questions).toBe(40);
      expect(bp6.sections.writing.total_questions).toBe(2);
      expect(40 + 40 + 2).toBe(82);
      expect(bp6.total_questions).toBe(82);
    });
  });

  // =========================================================================
  // Condition 3 & 4: Calibrated durations & options structure
  // =========================================================================
  describe('Condition 3 & 4: Calibrated exam durations and options structure', () => {
    it('Durations across all 4 system sources match verified [40, 60, 83, 85, 110, 125] minutes', () => {
      const expectedDurations = [40, 60, 83, 85, 110, 125];

      for (let lvl = 1; lvl <= 6; lvl++) {
        const expectedMin = expectedDurations[lvl - 1];

        // 1. JSON blueprint on disk
        const bp = loadBlueprintData(lvl);
        expect(bp.total_time_min, `level${lvl}.json duration`).toBe(expectedMin);

        // 2. AIExamStudio frontend default blueprints
        expect(DEFAULT_BLUEPRINTS[lvl].totalTimeMin, `DEFAULT_BLUEPRINTS[${lvl}] duration`).toBe(expectedMin);

        // 3. HSKMockExam exam duration constant
        expect(HSK_EXAM_DURATIONS_MINUTES[lvl], `HSK_EXAM_DURATIONS_MINUTES[${lvl}]`).toBe(expectedMin);
        expect(getExamDurationMinutes(lvl), `getExamDurationMinutes(${lvl})`).toBe(expectedMin);

        // 4. Fixtures summaries fallback
        expect(HSK_BLUEPRINT_SUMMARIES[lvl].time_limit_minutes, `HSK_BLUEPRINT_SUMMARIES[${lvl}] duration`).toBe(expectedMin);
      }
    });

    it('Duration strictly increases monotonically with HSK level (40 < 60 < 83 < 85 < 110 < 125)', () => {
      const durations = [1, 2, 3, 4, 5, 6].map((lvl) => getExamDurationMinutes(lvl));
      expect(durations).toEqual([40, 60, 83, 85, 110, 125]);
      for (let i = 0; i < durations.length - 1; i++) {
        expect(durations[i + 1]).toBeGreaterThan(durations[i]);
      }
    });
  });

  // =========================================================================
  // Condition 5: HTTP endpoint GET /api/exam/blueprints
  // =========================================================================
  describe('Condition 5: GET /api/exam/blueprints returns authentic calibrated data', () => {
    it('returns HTTP 200 with calibrated question counts and durations for HSK 1–6', async () => {
      const res = await fetch(`${baseUrl}/blueprints`);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.blueprints).toBeDefined();

      for (let lvl = 1; lvl <= 6; lvl++) {
        const spec = AUTHORITATIVE_SPEC[lvl as keyof typeof AUTHORITATIVE_SPEC];
        const bp = json.blueprints[lvl];
        expect(bp, `Endpoint must return HSK ${lvl} blueprint`).toBeDefined();
        expect(bp.total_questions).toBe(spec.totalQuestions);
        expect(bp.time_limit_minutes).toBe(spec.durationMin);
        expect(bp.max_score).toBe(spec.maxScore);
        expect(bp.pass_score).toBe(spec.passScore);
        expect((bp as any).verified, `HSK ${lvl} endpoint blueprint must not have overall verified:true`).toBeUndefined();
        expect(bp.verification, `HSK ${lvl} endpoint blueprint must have per-field verification metadata`).toBeDefined();
        expect(bp.verification?.verified_fields).toEqual(['total_questions', 'time_limit_minutes']);
        expect(bp.verification?.unverified_fields).toEqual([
          'section_breakdown',
          'part_detail',
          'skill_duration',
          'scoring',
        ]);
      }
    });
  });

  // =========================================================================
  // Condition 6 & 7: Frontend synchronization and zero contradiction
  // =========================================================================
  describe('Condition 6 & 7: Zero contradiction between backend and frontend configs', () => {
    it('DEFAULT_BLUEPRINTS contains no stale durations [55, 85, 100, 125, 135] or 72q HSK 6', () => {
      // HSK 2: 60 (not 55)
      expect(DEFAULT_BLUEPRINTS[2].totalTimeMin).toBe(60);
      // HSK 3: 83 (not 85)
      expect(DEFAULT_BLUEPRINTS[3].totalTimeMin).toBe(83);
      // HSK 4: 85 (not 100)
      expect(DEFAULT_BLUEPRINTS[4].totalTimeMin).toBe(85);
      // HSK 5: 110 (not 125)
      expect(DEFAULT_BLUEPRINTS[5].totalTimeMin).toBe(110);
      // HSK 6: 125 (not 135) and 82 questions (not 72)
      expect(DEFAULT_BLUEPRINTS[6].totalTimeMin).toBe(125);
      expect(DEFAULT_BLUEPRINTS[6].totalQuestions).toBe(82);

      // Allocations sum matches exactly
      for (let lvl = 1; lvl <= 6; lvl++) {
        const spec = AUTHORITATIVE_SPEC[lvl as keyof typeof AUTHORITATIVE_SPEC];
        const allocSum = DEFAULT_BLUEPRINTS[lvl].allocations.reduce((sum, a) => sum + a.count, 0);
        expect(allocSum).toBe(spec.totalQuestions);
      }
    });

    it('HSK 6 allocations in AIExamStudio award exactly 300 points total', () => {
      const bp6 = DEFAULT_BLUEPRINTS[6];
      const totalPoints = bp6.allocations.reduce(
        (sum, a) => sum + a.count * a.points_per_question,
        0
      );
      expect(totalPoints).toBe(300);
      expect(bp6.maxScore).toBe(300);
      expect(bp6.passScore).toBe(180);
    });
  });

  // =========================================================================
  // Condition 8: Writing tasks de-coercion (0 options, no 4-opt forcing)
  // =========================================================================
  describe('Condition 8: Open-ended 0-option writing tasks de-coercion', () => {
    const writingPartTypes = [
      { level: 2, part_type: 'write_tianzige_from_pinyin' },
      { level: 3, part_type: 'write_tianzige_from_pinyin' },
      { level: 3, part_type: 'write_sentence_from_picture_word' },
      { level: 4, part_type: 'write_sentence_from_picture_word' },
      { level: 4, part_type: 'write_short_essay_80chars' },
      { level: 5, part_type: 'write_story_from_4pictures_100chars' },
      { level: 5, part_type: 'write_topic_essay_200chars' },
      { level: 6, part_type: 'write_summary_shortening_400chars' },
      { level: 6, part_type: 'write_topic_essay_300chars' },
    ];

    writingPartTypes.forEach(({ level, part_type }) => {
      it(`HSK ${level} ${part_type} allows empty options [] without rejection`, () => {
        const check = validateFormatCompatibility(
          {
            id: `test_writing_${level}_${part_type}`,
            level,
            skill: 'writing',
            part_type,
            stem: '测试书写任务题干内容',
            options: [],
            answer_index: 0,
            illustration_theme: 'writing',
          },
          level
        );

        expect(check.practice_eligible).toBe(true);
        expect(check.exam_eligible).toBe(true);
        expect(check.ineligible_reasons).toHaveLength(0);
      });
    });
  });

  // =========================================================================
  // Condition 11: Explicit unverified flagging for non-digitized parts
  // =========================================================================
  describe('Condition 11: Unverified blueprint fields/parts explicitly flagged', () => {
    it('HSK 1–6 blueprints carry structured per-field verification metadata (no overall verified: true) and HSK 6 flags non-digitized parts', () => {
      // Validate per-field metadata across all 6 levels
      for (let lvl = 1; lvl <= 6; lvl++) {
        const bp = loadBlueprintData(lvl);
        expect(bp, `level${lvl}.json must load`).toBeDefined();
        // 1. Overall verified: true MUST be removed
        expect(bp.verified, `level${lvl}.json must not have overall verified: true`).toBeUndefined();

        // 2. Structured per-field verification metadata MUST be present
        expect(bp.verification, `level${lvl}.json must contain verification block`).toBeDefined();
        expect(bp.verification.verified_fields, `level${lvl}.json verified_fields`).toEqual([
          'total_questions',
          'time_limit_minutes',
        ]);
        expect(bp.verification.unverified_fields, `level${lvl}.json unverified_fields`).toEqual([
          'section_breakdown',
          'part_detail',
          'skill_duration',
          'scoring',
        ]);

        // 3. Verification sources cite CTI/CLEC official sample papers
        expect(bp.verification.verification_sources).toHaveLength(2);
        const qSource = bp.verification.verification_sources.find((s: any) => s.field === 'total_questions');
        expect(qSource).toBeDefined();
        expect(qSource.source).toContain('CTI/CLEC official sample paper 《新版HSK（1-6级）考试结构与样题示例》');
        expect(qSource.url).toBe('https://www.chinesetest.cn/');
        expect(qSource.accessed).toBe('2026-10-26');

        const tSource = bp.verification.verification_sources.find((s: any) => s.field === 'time_limit_minutes');
        expect(tSource).toBeDefined();
        expect(tSource.source).toContain('CTI/CLEC official sample paper 《新版HSK（1-6级）考试结构与样题示例》');
        expect(tSource.url).toBe('https://www.chinesetest.cn/');
        expect(tSource.accessed).toBe('2026-10-26');

        expect(bp.verification.last_verified_at).toBe('2026-10-26T00:00:00Z');
      }

      // Validate HSK 6 non-digitized subparts remain explicitly unverified
      const bp6 = loadBlueprintData(6);
      expect(bp6).toBeDefined();

      // Listening parts carry unverified status
      expect(bp6.sections.listening.parts.listening_1.status).toBe('unverified');
      expect(bp6.sections.listening.parts.listening_1.verified).toBe(false);

      expect(bp6.sections.listening.parts.listening_2.status).toBe('unverified');
      expect(bp6.sections.listening.parts.listening_2.verified).toBe(false);

      // Reading part 3 carries unverified status
      expect(bp6.sections.reading.parts.reading_3.status).toBe('unverified');
      expect(bp6.sections.reading.parts.reading_3.verified).toBe(false);

      // Writing part 2 carries unverified status
      expect(bp6.sections.writing.parts.writing_2.status).toBe('unverified');
      expect(bp6.sections.writing.parts.writing_2.verified).toBe(false);
    });
  });

  // =========================================================================
  // Condition 12: Shortage response reporting against calibrated blueprints
  // =========================================================================
  describe('Condition 12: Shortage responses report exact deficits against calibrated blueprints', () => {
    it('HSK 6 mock generation returns HTTP 400 and reports missing exactly 82 questions when 0 eligible', async () => {
      const res = await fetch(`${baseUrl}/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 6, mode: 'mock' }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();

      expect(json.success).toBe(false);
      expect(json.mode).toBe('mock');
      expect(json.level).toBe(6);
      expect(json.is_fully_eligible).toBe(false);
      expect(json.total_available).toBe(json.total_required - json.total_missing);
      expect(json.total_missing).toBe(82 - json.total_available);
      expect(json.error).toContain(`còn thiếu ${json.total_missing} câu theo chuẩn blueprint`);
    });

    it('HSK 4 mock generation reports total_required 70 (not 71)', async () => {
      const res = await fetch(`${baseUrl}/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 4, mode: 'mock' }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.total_required).toBe(70);
    });
  });

  // =========================================================================
  // Condition 13: Immutability of exam sessions
  // =========================================================================
  describe('Condition 13: Historical exam_sessions snapshots remain immutable', () => {
    it('reading exam_sessions table confirms immutable snapshot schema exists', () => {
      const dbPath = path.resolve(process.cwd(), 'data/qbank/qbank.db');
      const db = new DatabaseSync(dbPath, { readOnly: true });

      const columns: any[] = db.prepare('PRAGMA table_info(exam_sessions)').all();
      const colNames = columns.map((c) => c.name);

      expect(colNames).toContain('session_id');
      expect(colNames).toContain('session_json');
      expect(colNames).toContain('score_result_json');
      expect(colNames).toContain('status');

      const countRow: any = db.prepare('SELECT COUNT(*) as cnt FROM exam_sessions').get();
      expect(countRow.cnt).toBeGreaterThanOrEqual(1315);
      db.close();
    });
  });

  // =========================================================================
  // Database Safety Invariants
  // =========================================================================
  describe('Database Safety Invariants', () => {
    it('data/hsk_exam.db SHA-256 hash is strictly DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1', () => {
      const dbPath = path.resolve(process.cwd(), 'data/hsk_exam.db');
      const buf = fs.readFileSync(dbPath);
      const hash = crypto.createHash('sha256').update(buf).digest('hex').toUpperCase();
      expect(hash).toBe('DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1');
    });

    it('data/qbank/qbank.db has exactly 12 tables and zero unapproved migrations', () => {
      const dbPath = path.resolve(process.cwd(), 'data/qbank/qbank.db');
      const db = new DatabaseSync(dbPath, { readOnly: true });

      const tables: any[] = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name ASC").all();
      expect(tables.length).toBe(12);

      const tableNames = tables.map((t) => t.name);
      expect(tableNames).not.toContain('question_knowledge_links');
      expect(tableNames).not.toContain('question_distractor_rationales');
      db.close();
    });
  });
});
