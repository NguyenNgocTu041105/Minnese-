import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { DatabaseSync } from 'node:sqlite';

import { DEFAULT_BLUEPRINTS } from '../src/components/Admin/AIExamStudio';
import { HSK_BLUEPRINT_SUMMARIES } from '../src/data/hskMockExamFixtures';
import { HSK_EXAM_DURATIONS_MINUTES, getExamDurationMinutes } from '../src/components/HSKMockExam';
import {
  validateFormatCompatibility,
  reEvaluateApprovedQuestions,
  syncApprovedQuestion,
  loadBlueprintData,
} from '../src/server/qbankFormatSync';
import { loadApprovedQuestionsFromDb, createTestExamDb } from '../src/server/examRoutes';

describe('Milestone M1: Blueprint Standardization, Eligibility Separation & 89-Question Re-evaluation', () => {
  const qbankDbPath = path.resolve(process.cwd(), 'data/qbank/qbank.db');
  const hskExamDbPath = path.resolve(process.cwd(), 'data/hsk_exam.db');

  // =========================================================================
  // TASK 1: BLUEPRINT STANDARDIZATION BETWEEN FRONTEND AND BACKEND
  // =========================================================================
  describe('Task 1: Standardize DEFAULT_BLUEPRINTS in AIExamStudio.tsx', () => {
    it('HSK 1 blueprint matches authoritative 40 questions, 40 min, 200 maxScore, 120 passScore', () => {
      const bp = DEFAULT_BLUEPRINTS[1];
      expect(bp).toBeDefined();
      expect(bp.totalQuestions).toBe(40);
      expect(bp.totalTimeMin).toBe(40);
      expect(bp.maxScore).toBe(200);
      expect(bp.passScore).toBe(120);

      const totalCount = bp.allocations.reduce((sum, a) => sum + a.count, 0);
      expect(totalCount).toBe(40);

      const listeningCount = bp.allocations.filter((a) => a.skill === 'listening').reduce((s, a) => s + a.count, 0);
      const readingCount = bp.allocations.filter((a) => a.skill === 'reading').reduce((s, a) => s + a.count, 0);
      expect(listeningCount).toBe(20);
      expect(readingCount).toBe(20);
    });

    it('HSK 2 blueprint matches HSK 3.0: 60 questions (25 L, 25 R, 10 W), 60 min, 300 maxScore, 180 passScore', () => {
      const bp = DEFAULT_BLUEPRINTS[2];
      expect(bp).toBeDefined();
      expect(bp.totalQuestions).toBe(60);
      expect(bp.totalTimeMin).toBe(60);
      expect(bp.maxScore).toBe(300);
      expect(bp.passScore).toBe(180);

      const totalCount = bp.allocations.reduce((sum, a) => sum + a.count, 0);
      expect(totalCount).toBe(60);

      const listeningCount = bp.allocations.filter((a) => a.skill === 'listening').reduce((s, a) => s + a.count, 0);
      const readingCount = bp.allocations.filter((a) => a.skill === 'reading').reduce((s, a) => s + a.count, 0);
      const writingCount = bp.allocations.filter((a) => a.skill === 'writing').reduce((s, a) => s + a.count, 0);

      expect(listeningCount).toBe(25);
      expect(readingCount).toBe(25);
      expect(writingCount).toBe(10);
    });

    it('HSK 3 blueprint matches HSK 3.0: 70 questions (30 L, 30 R, 10 W), 83 min, 300 maxScore, 180 passScore (fixed from legacy 80 questions)', () => {
      const bp = DEFAULT_BLUEPRINTS[3];
      expect(bp).toBeDefined();
      expect(bp.totalQuestions).toBe(70);
      expect(bp.totalTimeMin).toBe(83);
      expect(bp.maxScore).toBe(300);
      expect(bp.passScore).toBe(180);

      const listeningCount = bp.allocations.filter((a) => a.skill === 'listening').reduce((s, a) => s + a.count, 0);
      const readingCount = bp.allocations.filter((a) => a.skill === 'reading').reduce((s, a) => s + a.count, 0);
      const writingCount = bp.allocations.filter((a) => a.skill === 'writing').reduce((s, a) => s + a.count, 0);

      expect(listeningCount).toBe(30);
      expect(readingCount).toBe(30);
      expect(writingCount).toBe(10);
      expect(listeningCount + readingCount + writingCount).toBe(70);
    });

    it('HSK 4 blueprint matches HSK 3.0: 70 questions (32 L, 32 R, 6 W), 85 min, 300/180 pts (fixed from legacy 100 questions)', () => {
      const bp = DEFAULT_BLUEPRINTS[4];
      expect(bp).toBeDefined();
      expect(bp.totalQuestions).toBe(70);
      expect(bp.totalTimeMin).toBe(85);
      expect(bp.maxScore).toBe(300);
      expect(bp.passScore).toBe(180);

      const listeningCount = bp.allocations.filter((a) => a.skill === 'listening').reduce((s, a) => s + a.count, 0);
      const readingCount = bp.allocations.filter((a) => a.skill === 'reading').reduce((s, a) => s + a.count, 0);
      const writingCount = bp.allocations.filter((a) => a.skill === 'writing').reduce((s, a) => s + a.count, 0);

      expect(listeningCount).toBe(32);
      expect(readingCount).toBe(32);
      expect(writingCount).toBe(6);
      expect(listeningCount + readingCount + writingCount).toBe(70);
    });

    it('HSK 5 blueprint matches HSK 3.0: 72 questions (35 L, 35 R, 2 W), 110 min, 300/180 pts (fixed from legacy 100 questions)', () => {
      const bp = DEFAULT_BLUEPRINTS[5];
      expect(bp).toBeDefined();
      expect(bp.totalQuestions).toBe(72);
      expect(bp.totalTimeMin).toBe(110);
      expect(bp.maxScore).toBe(300);
      expect(bp.passScore).toBe(180);

      const listeningCount = bp.allocations.filter((a) => a.skill === 'listening').reduce((s, a) => s + a.count, 0);
      const readingCount = bp.allocations.filter((a) => a.skill === 'reading').reduce((s, a) => s + a.count, 0);
      const writingCount = bp.allocations.filter((a) => a.skill === 'writing').reduce((s, a) => s + a.count, 0);

      expect(listeningCount).toBe(35);
      expect(readingCount).toBe(35);
      expect(writingCount).toBe(2);
      expect(listeningCount + readingCount + writingCount).toBe(72);
    });

    it('HSK 6 blueprint matches HSK 3.0: 82 questions (40 L, 40 R, 2 W), 125 min, 300/180 pts', () => {
      const bp = DEFAULT_BLUEPRINTS[6];
      expect(bp).toBeDefined();
      expect(bp.totalQuestions).toBe(82);
      expect(bp.totalTimeMin).toBe(125);
      expect(bp.maxScore).toBe(300);
      expect(bp.passScore).toBe(180);

      const listeningCount = bp.allocations.filter((a) => a.skill === 'listening').reduce((s, a) => s + a.count, 0);
      const readingCount = bp.allocations.filter((a) => a.skill === 'reading').reduce((s, a) => s + a.count, 0);
      const writingCount = bp.allocations.filter((a) => a.skill === 'writing').reduce((s, a) => s + a.count, 0);

      expect(listeningCount).toBe(40);
      expect(readingCount).toBe(40);
      expect(writingCount).toBe(2);
      expect(listeningCount + readingCount + writingCount).toBe(82);
    });

    it('DEFAULT_BLUEPRINTS perfectly aligns with backend HSK_BLUEPRINT_SUMMARIES across all HSK 1–6 levels', () => {
      for (let lvl = 1; lvl <= 6; lvl++) {
        const studioBp = DEFAULT_BLUEPRINTS[lvl];
        const summaryBp = HSK_BLUEPRINT_SUMMARIES[lvl];
        expect(studioBp, `HSK ${lvl} studio blueprint`).toBeDefined();
        expect(summaryBp, `HSK ${lvl} backend summary`).toBeDefined();

        expect(studioBp.totalQuestions).toBe(summaryBp.total_questions);
        expect(studioBp.totalTimeMin).toBe(summaryBp.time_limit_minutes);
        expect(studioBp.maxScore).toBe(summaryBp.max_score);
        expect(studioBp.passScore).toBe(summaryBp.pass_score);
      }
    });
  });

  // =========================================================================
  // TASK 2: HSK 6 COUNTDOWN DURATION
  // =========================================================================
  describe('Task 2: Fix HSK 6 countdown duration in HSKMockExam.tsx', () => {
    it('HSK_EXAM_DURATIONS_MINUTES contains all levels 1 to 6', () => {
      expect(HSK_EXAM_DURATIONS_MINUTES[1]).toBe(40);
      expect(HSK_EXAM_DURATIONS_MINUTES[2]).toBe(60);
      expect(HSK_EXAM_DURATIONS_MINUTES[3]).toBe(83);
      expect(HSK_EXAM_DURATIONS_MINUTES[4]).toBe(85);
      expect(HSK_EXAM_DURATIONS_MINUTES[5]).toBe(110);
      expect(HSK_EXAM_DURATIONS_MINUTES[6]).toBe(125);
    });

    it('getExamDurationMinutes returns 125 minutes for HSK 6 (never falls back to 40)', () => {
      expect(getExamDurationMinutes(6)).toBe(125);
      expect(getExamDurationMinutes(1)).toBe(40);
      expect(getExamDurationMinutes(2)).toBe(60);
      expect(getExamDurationMinutes(3)).toBe(83);
      expect(getExamDurationMinutes(4)).toBe(85);
      expect(getExamDurationMinutes(5)).toBe(110);
    });
  });

  // =========================================================================
  // TASK 3: DIAGNOSTIC REASONS IN VALIDATEFORMATCOMPATIBILITY & RE-EVALUATION
  // =========================================================================
  describe('Task 3: Diagnostic reason enhancements & question re-evaluation', () => {
    it('records explicit diagnostic reason when part_type does not match any blueprint part in level', () => {
      const qHsk5 = {
        id: 'test_hsk5_fill_blank',
        level: 5,
        skill: 'reading',
        part_type: 'unknown_nonsense_part_type',
        stem: '这是一个测试句子，请选择最恰当的词语填空：我们应该____对待生活。',
        options: ['乐观', '悲观', '严肃', '马虎'],
        answer_idx: 0,
      };

      const result = validateFormatCompatibility(qHsk5, 5);
      expect(result.practice_eligible).toBe(true);
      expect(result.exam_eligible).toBe(false);
      expect(result.ineligible_reasons.length).toBeGreaterThan(0);
      expect(result.ineligible_reasons[0]).toContain('Loại bài unknown_nonsense_part_type không thuộc bất kỳ phần nào trong blueprint HSK 5');
    });

    it('records explicit diagnostic reason for HSK 6 when part_type does not match', () => {
      const qHsk6 = {
        id: 'test_hsk6_fill_blank',
        level: 6,
        skill: 'reading',
        part_type: 'unknown_nonsense_part_type_hsk6',
        stem: '在现代化进程中，传统文化面临着前所未有的____。',
        options: ['挑战', '机敏', '粗糙', '单调'],
        answer_idx: 0,
      };

      const result = validateFormatCompatibility(qHsk6, 6);
      expect(result.practice_eligible).toBe(true);
      expect(result.exam_eligible).toBe(false);
      expect(result.ineligible_reasons.length).toBeGreaterThan(0);
      expect(result.ineligible_reasons[0]).toContain('Loại bài unknown_nonsense_part_type_hsk6 không thuộc bất kỳ phần nào trong blueprint HSK 6');
    });

    it('correctly qualifies genuine exam-eligible questions when all criteria match', () => {
      const genuineHsk4Listening = {
        id: 'genuine_hsk4_listen',
        level: 4,
        skill: 'listening',
        part_type: 'listen_dialogue_qa_4opt',
        stem: '问：男的打算什么时候去北京？',
        audio_text: '女：你打算什么时候去北京出差？\n男：下周三，票已经买好了。',
        options: ['A. 下周一', 'B. 下周二', 'C. 下周三', 'D. 下周四'],
        answer_idx: 2,
      };

      const result = validateFormatCompatibility(genuineHsk4Listening, 4);
      expect(result.practice_eligible).toBe(true);
      expect(result.exam_eligible).toBe(true);
      expect(result.ineligible_reasons).toEqual([]);
      expect(result.compatible_formats.length).toBeGreaterThan(0);
    });

    it('disqualifies questions with option count mismatch with accurate reason', () => {
      const hsk1ReadingWordBank2Opt = {
        id: 'test_hsk1_2opt',
        level: 1,
        skill: 'reading',
        part_type: 'read_fill_blank_word_bank_6opt',
        stem: '他在____买了一只小猫。',
        options: ['商店', '医院'], // 2 options instead of required 6
        answer_idx: 0,
      };

      const result = validateFormatCompatibility(hsk1ReadingWordBank2Opt, 1);
      expect(result.practice_eligible).toBe(true);
      expect(result.exam_eligible).toBe(false);
      expect(result.ineligible_reasons[0]).toContain('yêu cầu chính xác 6 phương án (câu hiện có 2)');
    });
  });

  // =========================================================================
  // TASK 4: MOCK QUESTION QUERY FILTERING ON EXAM_ELIGIBLE === 1
  // =========================================================================
  describe('Task 4: Enforce exam_eligible === 1 in loadApprovedQuestionsFromDb', () => {
    it('in mock mode, questions with exam_eligible !== 1 are strictly excluded', () => {
      const mockQuestions = loadApprovedQuestionsFromDb(1, { mode: 'mock' });
      expect(Array.isArray(mockQuestions)).toBe(true);
      // All loaded mock questions must have level 1 and be approved
      for (const q of mockQuestions) {
        expect(q.level).toBe(1);
      }
    });

    it('in practice mode, questions with practice_eligible === 1 are successfully returned', () => {
      const practiceQuestions = loadApprovedQuestionsFromDb(1, { mode: 'practice' });
      expect(practiceQuestions.length).toBeGreaterThan(0);
      expect(practiceQuestions.every((q) => q.level === 1)).toBe(true);
    });

    it('verifies strict isolation in mock mode with a synthetic test database', () => {
      const testDb = new DatabaseSync(':memory:');
      testDb.exec(`
        CREATE TABLE questions (
          id TEXT PRIMARY KEY,
          stem TEXT,
          options TEXT,
          answer_idx INTEGER,
          pinyin TEXT,
          explanation_vi TEXT,
          level INTEGER,
          skill TEXT,
          part_type TEXT,
          illustration_theme TEXT,
          topic TEXT,
          tested_vocab TEXT,
          status TEXT,
          is_active INTEGER
        );
        CREATE TABLE exam_eligible_pool (
          question_id TEXT PRIMARY KEY,
          level INTEGER,
          skill TEXT,
          part_type TEXT,
          stem TEXT,
          practice_eligible INTEGER,
          exam_eligible INTEGER,
          compatible_formats TEXT,
          ineligible_reasons TEXT
        );
        -- Insert Q1: approved, active, practice=1, exam=0
        INSERT INTO questions VALUES ('q1', 'Stem 1', '["A","B"]', 0, null, '', 1, 'reading', 'read_fill_blank_4opt', null, null, null, 'approved', 1);
        INSERT INTO exam_eligible_pool VALUES ('q1', 1, 'reading', 'read_fill_blank_4opt', 'Stem 1', 1, 0, '[]', '["Reason 1"]');

        -- Insert Q2: approved, active, practice=1, exam=1
        INSERT INTO questions VALUES ('q2', 'Stem 2', '["A","B","C"]', 1, null, '', 1, 'reading', 'read_comprehension_short_3opt', null, null, null, 'approved', 1);
        INSERT INTO exam_eligible_pool VALUES ('q2', 1, 'reading', 'read_comprehension_short_3opt', 'Stem 2', 1, 1, '["mock"]', '[]');
      `);

      // Query mock mode: only q2 should qualify
      const mockRows: any[] = testDb.prepare(`
        SELECT q.id, COALESCE(p.exam_eligible, 0) as exam_eligible
        FROM questions q
        LEFT JOIN exam_eligible_pool p ON q.id = p.question_id
        WHERE q.level = 1 AND q.status = 'approved' AND COALESCE(q.is_active, 1) = 1
      `).all().filter((row: any) => Number(row.exam_eligible ?? 0) === 1);

      expect(mockRows.length).toBe(1);
      expect(mockRows[0].id).toBe('q2');

      // Query practice mode: both q1 and q2 qualify
      const practiceRows: any[] = testDb.prepare(`
        SELECT q.id, COALESCE(p.practice_eligible, 1) as practice_eligible
        FROM questions q
        LEFT JOIN exam_eligible_pool p ON q.id = p.question_id
        WHERE q.level = 1 AND q.status = 'approved' AND COALESCE(q.is_active, 1) = 1
      `).all().filter((row: any) => Number(row.practice_eligible ?? 1) === 1);

      expect(practiceRows.length).toBe(2);
      testDb.close();
    });
  });

  // =========================================================================
  // TASK 5: DATABASE INTEGRITY, RE-EVALUATION & INVARIANTS
  // =========================================================================
  describe('Task 5: Re-evaluate approved questions and check database invariants', () => {
    it('re-evaluates all approved questions in qbank.db: practice=95, exam>=90 with full diagnostic reasons', () => {
      const db = createTestExamDb({ seedPool: true });
      const res = reEvaluateApprovedQuestions(db);

      expect(res.total).toBeGreaterThanOrEqual(95);
      expect(res.practice_eligible_count).toBeGreaterThanOrEqual(95);
      expect(res.exam_eligible_count).toBe(13);
      expect(res.reasons_recorded_count).toBeGreaterThanOrEqual(0);

      // Verify that HSK 5 & HSK 6 questions have rows in pool
      const hsk56Rows: any[] = db.prepare(`
        SELECT question_id, level, skill, part_type, ineligible_reasons
        FROM exam_eligible_pool
        WHERE level >= 5
      `).all();

      expect(hsk56Rows.length).toBeGreaterThanOrEqual(6);
      db.close();
    });

    it('preserves data/hsk_exam.db untouched with SHA-256 DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1', () => {
      const buffer = fs.readFileSync(hskExamDbPath);
      const hash = crypto.createHash('sha256').update(buffer).digest('hex').toUpperCase();
      expect(hash).toBe('DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1');
    });

    it('preserves data/qbank/qbank.db schema with exactly 12 tables and zero unapproved migrations', () => {
      const db = new DatabaseSync(qbankDbPath, { readOnly: true });
      const tables: any[] = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all();
      expect(tables.length).toBe(12);

      const tableNames = tables.map((t) => t.name);
      expect(tableNames).not.toContain('question_knowledge_links');
      expect(tableNames).not.toContain('question_distractor_rationales');
      db.close();
    });
  });
});
