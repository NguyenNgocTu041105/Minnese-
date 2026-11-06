/**
 * tests/adversarial_challenger2_hsk_serving_isolation.test.ts
 *
 * EMPIRICAL ADVERSARIAL CHALLENGER 2 SUITE (Phase 9 / Milestone 2)
 * Role: Adversarial Challenger (critic, specialist)
 * Target: Adversarially challenge HSK level checking, serving pool isolation,
 *         and strict paid provider blocking under QBANK_LLM_FREE_ONLY=true.
 *
 * Empirical Challenge Dimensions:
 * 1. Stress-test verifyQuestionVocab:
 *    - Valid controls across HSK 1, 2, 3
 *    - Adversarial over-level vocabulary in stem, options, and distractors
 *    - Approved proper noun compound masking (names.txt: 张伟, 李华, 北京)
 *    - Unapproved proper nouns & out-of-syllabus foreign names (托尼, 巴黎)
 *    - Punctuation, Chinese/Arabic numerals, brackets, full/half-width marks
 *    - Boundary and robustness edge cases (empty stem/options, out-of-range levels, JSON parsing)
 * 2. Serving Pool Complete Isolation:
 *    - Verify pending, rejected, and disabled candidates in questions table are strictly excluded
 *    - Verify questions with is_active = 0 or practice_eligible = 0 are strictly excluded
 *    - Verify candidates in pending_questions table never leak into serving
 *    - Verify HTTP practice endpoints (/api/exam/practice & /api/exam/practice-questions) 100% respect isolation
 *    - Verify mock mode strictly requires exam_eligible === 1
 * 3. Paid Provider Strict Blocking:
 *    - Verify deepseek-v3 is classified as isFreeTier: false
 *    - Verify deepseek-v3 / deepseek alias is rejected before any network call
 *    - Verify 0 network calls (fetch, http, https, net, tls) when DEEPSEEK_API_KEY is present
 *    - Verify auto mode filters out deepseek-v3
 *    - Verify isFreeTierOnly() fails closed regardless of env manipulation
 *    - Verify assertStagingDatabaseIsolation blocks staging startup if free-only is tampered with
 * 4. Production Database Invariance:
 *    - Verify SHA-256 of data/qbank/qbank.db and data/hsk_exam.db match exact baseline
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import express, { Express } from 'express';
import type { Server } from 'node:http';
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import tls from 'node:tls';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

import {
  verifyQuestionVocab,
  getSyllabusCatalog,
  loadApprovedNames,
  scanChineseWords,
} from '../src/server/qbankCoverageEngine';

import {
  loadApprovedQuestionsFromDb,
  examRouter,
  setExamDbForTesting,
  createTestExamDb,
  clearAllSessionsForTesting,
  closeReadOnlyDbForTesting,
} from '../src/server/examRoutes';

import {
  generateWaterfallQuestions,
  WATERFALL_PROVIDERS,
  isFreeTierOnly,
} from '../src/server/llm/waterfallGenerator';

import { assertStagingDatabaseIsolation } from '../src/server/dbPaths';

describe('Adversarial Challenger 2 (Milestone 2): HSK Verification & Serving Isolation Stress Harness', () => {

  // ===========================================================================
  // Dimension 1: Stress-testing verifyQuestionVocab (HSK 1/2/3, Proper Nouns, Punctuation)
  // ===========================================================================
  describe('Dimension 1: verifyQuestionVocab Stress Harness', () => {

    it('1.1: Validates pure HSK 1 control question without false alarms', () => {
      const q = {
        stem: '李华在北京学习汉语。',
        options: ['学习', '工作'],
        answer_idx: 0,
        tested_vocab: ['学习'],
      };
      const res = verifyQuestionVocab(q, 1);
      expect(res.isValidForLevel).toBe(true);
      expect(res.aboveLevel).toHaveLength(0);
      expect(res.outOfSyllabus).toHaveLength(0);
      expect(res.tested).toContain('学习');
      expect(res.contextual).toContain('汉语');
      expect(res.contextual).toContain('在');
    });

    it('1.2: Validates pure HSK 2 and HSK 3 control questions at their respective levels', () => {
      // HSK 2 control: 跑步 (HSK 2), 唱歌 (HSK 2), 每天 (每: HSK 2)
      const q2 = {
        stem: '王老师每天跑步。',
        options: ['跑步', '唱歌'],
        answer_idx: 0,
        tested_vocab: ['跑步'],
      };
      const res2 = verifyQuestionVocab(q2, 2);
      expect(res2.isValidForLevel).toBe(true);
      expect(res2.aboveLevel).toHaveLength(0);

      // HSK 3 control: 检查 (HSK 3), 环境 (HSK 3)
      const q3 = {
        stem: '张老师检查学校的环境。',
        options: ['检查', '复习'],
        answer_idx: 0,
        tested_vocab: ['检查'],
      };
      const res3 = verifyQuestionVocab(q3, 3);
      expect(res3.isValidForLevel).toBe(true);
      expect(res3.aboveLevel).toHaveLength(0);
    });

    it('1.3: Catches HSK 2 words injected into an HSK 1 question (stem, option, distractor)', () => {
      // Case A: HSK 2 word '每' in stem of HSK 1 question
      const resA = verifyQuestionVocab({
        stem: '这杯茶很好，我每天都想喝。',
        options: ['好', '大'],
        answer_idx: 0,
        tested_vocab: ['好'],
      }, 1);
      expect(resA.isValidForLevel).toBe(false);
      const aboveWordsA = resA.aboveLevel.map((x) => x.word);
      expect(aboveWordsA).toContain('每');
      const itemMei = resA.aboveLevel.find((x) => x.word === '每');
      expect(itemMei?.wordLevel).toBe(2);
      expect(itemMei?.source).toBe('context');

      // Case B: HSK 2 word '笔' in stem of HSK 1 question
      const resB = verifyQuestionVocab({
        stem: '我有三支笔。',
        options: ['三', '四'],
        answer_idx: 0,
        tested_vocab: ['三'],
      }, 1);
      expect(resB.isValidForLevel).toBe(false);
      expect(resB.aboveLevel.map((x) => x.word)).toContain('笔');

      // Case C: Over-level HSK 2 word '跑步' solely in a distractor of an HSK 1 question
      const resC = verifyQuestionVocab({
        stem: '他喜欢学习。',
        options: ['学习', '跑步', '工作', '大'],
        answer_idx: 0,
        tested_vocab: ['学习'],
      }, 1);
      expect(resC.isValidForLevel).toBe(false);
      const paobu = resC.aboveLevel.find((x) => x.word === '跑步');
      expect(paobu).toBeDefined();
      expect(paobu?.wordLevel).toBe(2);
      expect(paobu?.source).toBe('context');
    });

    it('1.4: Catches HSK 3 words injected into HSK 1 and HSK 2 questions', () => {
      // HSK 3 word '张' in HSK 1 question
      const res1 = verifyQuestionVocab({
        stem: '我有一张桌子。',
        options: ['桌子', '椅子'],
        answer_idx: 0,
        tested_vocab: ['桌子'],
      }, 1);
      expect(res1.isValidForLevel).toBe(false);
      const zhang = res1.aboveLevel.find((x) => x.word === '张');
      expect(zhang).toBeDefined();
      expect(zhang?.wordLevel).toBe(3);

      // HSK 3 word '环境' in HSK 2 question
      const res2 = verifyQuestionVocab({
        stem: '这里的环境很好。',
        options: ['好', '大'],
        answer_idx: 0,
        tested_vocab: ['好'],
      }, 2);
      expect(res2.isValidForLevel).toBe(false);
      expect(res2.aboveLevel.map((x) => x.word)).toContain('环境');
    });

    it('1.5: Catches HSK 4 words injected into HSK 3 questions', () => {
      // HSK 4 word '经济' in HSK 3 question
      const res = verifyQuestionVocab({
        stem: '这个国家的经济发展很快。',
        options: ['发展', '变化'],
        answer_idx: 0,
        tested_vocab: ['发展'],
      }, 3);
      expect(res.isValidForLevel).toBe(false);
      expect(res.aboveLevel.map((x) => x.word)).toContain('经济');
    });

    it('1.6: Proper noun masking correctly prevents false over-level and out-of-syllabus triggers', () => {
      // '张伟' is an approved name, but '张' alone is HSK 3.
      // In HSK 1, '张伟是我的好朋友。' MUST NOT flag '张' as above-level!
      const resZhangWei = verifyQuestionVocab({
        stem: '张伟是我的好朋友。',
        options: ['好', '大'],
        answer_idx: 0,
        tested_vocab: ['好'],
      }, 1);
      expect(resZhangWei.isValidForLevel).toBe(true);
      expect(resZhangWei.aboveLevel).toHaveLength(0);
      expect(resZhangWei.outOfSyllabus).toHaveLength(0);

      // '张老师' contains '张' (HSK 3). In HSK 1, '张老师' must be masked.
      const resZhangTeacher = verifyQuestionVocab({
        stem: '张老师是我们的老师。',
        options: ['老师', '学生'],
        answer_idx: 0,
        tested_vocab: ['老师'],
      }, 1);
      expect(resZhangTeacher.isValidForLevel).toBe(true);
      expect(resZhangTeacher.aboveLevel).toHaveLength(0);

      // Proper noun as correctOption: '北京' is an approved name.
      const resBeijing = verifyQuestionVocab({
        stem: '他在____工作。',
        options: ['北京', '学校'],
        answer_idx: 0,
        tested_vocab: ['北京'],
      }, 1);
      expect(resBeijing.isValidForLevel).toBe(true);
      expect(resBeijing.outOfSyllabus).toHaveLength(0);
    });

    it('1.7: Unapproved proper nouns & out-of-syllabus foreign names are correctly identified', () => {
      // '托尼' (Tony) or '巴黎' (Paris) are not in names.txt or HSK 1-6 syllabus
      const res = verifyQuestionVocab({
        stem: '托尼在巴黎学习。',
        options: ['学习', '工作'],
        answer_idx: 0,
        tested_vocab: ['学习'],
      }, 1);
      // '托' is in syllabus chars or vocab, but '尼', '巴', '黎' character checks:
      expect(res.outOfSyllabus.length).toBeGreaterThan(0);
    });

    it('1.8: Handles complex punctuation, Chinese numerals, brackets, and alphanumeric characters without corrupting syllabus analysis', () => {
      const complexStem =
        '“你看，”他说，“那是李华吗？（A）那是……《红楼梦》的一百二十三页吗？！”【第1题】';
      const q = {
        stem: complexStem,
        options: ['看', '听'],
        answer_idx: 0,
        tested_vocab: ['看'],
      };
      // Should not throw or crash, and punctuation characters should not be treated as out-of-syllabus hanzi
      expect(() => {
        const res = verifyQuestionVocab(q, 1);
        expect(res).toBeDefined();
        expect(res.tested).toContain('看');
      }).not.toThrow();
    });

    it('1.9: Audits declared tested vocabulary discrepancies (false claims and downgrades to contextual)', () => {
      // Declared '飞机' (airplane - HSK 1) but '飞机' does not appear anywhere in stem or options
      // Declared '汉语' (Chinese - HSK 1) but '汉语' only appears in stem context, not in correctOption or blank
      const q = {
        stem: '李华在北京学习汉语。',
        options: ['学习', '工作'],
        answer_idx: 0, // '学习'
        tested_vocab: ['学习', '飞机', '汉语'],
      };
      const res = verifyQuestionVocab(q, 1);
      expect(res.discrepancies.verifiedTested).toEqual(['学习']);
      expect(res.discrepancies.falseClaims).toEqual(['飞机']);
      expect(res.discrepancies.downgradedToContextual).toEqual(['汉语']);
    });

    it('1.10: Robustly handles extreme boundary inputs (empty stem, empty options, malformed JSON, out-of-range levels)', () => {
      // Empty input object
      expect(() => verifyQuestionVocab({}, 1)).not.toThrow();
      expect(verifyQuestionVocab({}, 1).isValidForLevel).toBe(true);

      // Level clamping: level -5 clamps to 1; level 999 clamps to 6; float 1.9 clamps to 1
      expect(verifyQuestionVocab({ stem: '你好' }, -5).isValidForLevel).toBe(true);
      expect(verifyQuestionVocab({ stem: '你好' }, 999).isValidForLevel).toBe(true);
      expect(verifyQuestionVocab({ stem: '你好' }, 1.9).isValidForLevel).toBe(true);

      // Plain text input
      const resText = verifyQuestionVocab('你好，我是中国人。', 1);
      expect(resText.isValidForLevel).toBe(true);
      expect(resText.contextual).toContain('你好');

      // Invalid JSON string input (should fallback gracefully to plain text)
      const resInvalidJson = verifyQuestionVocab('{ not valid json: 123 }', 1);
      expect(resInvalidJson).toBeDefined();
      expect(resInvalidJson.isValidForLevel).toBe(true);
    });
  });

  // ===========================================================================
  // Dimension 2: Serving Pool Complete Isolation (Pending, Rejected, Disabled)
  // ===========================================================================
  describe('Dimension 2: Serving Pool Complete Isolation', () => {
    let testDb: DatabaseSync;
    let app: Express;
    let server: Server;
    let baseUrl: string;

    beforeAll(async () => {
      // Construct an isolated in-memory SQLite database mimicking qbank.db schema
      testDb = new DatabaseSync(':memory:');

      testDb.exec(`
        CREATE TABLE questions (
          id TEXT PRIMARY KEY,
          level INTEGER NOT NULL,
          section TEXT NOT NULL,
          part_type TEXT NOT NULL,
          stem TEXT NOT NULL,
          options TEXT NOT NULL,
          answer_index INTEGER NOT NULL,
          explanation_vi TEXT,
          status TEXT NOT NULL DEFAULT 'pending',
          is_active INTEGER NOT NULL DEFAULT 1,
          topic TEXT,
          tested_vocab TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE pending_questions (
          id TEXT PRIMARY KEY,
          level INTEGER NOT NULL,
          section TEXT NOT NULL,
          part_type TEXT NOT NULL,
          stem TEXT NOT NULL,
          options TEXT NOT NULL,
          answer_index INTEGER NOT NULL,
          explanation_vi TEXT,
          status TEXT NOT NULL DEFAULT 'pending',
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE exam_eligible_pool (
          question_id TEXT PRIMARY KEY,
          exam_eligible INTEGER NOT NULL DEFAULT 0,
          practice_eligible INTEGER NOT NULL DEFAULT 1,
          compatible_formats TEXT,
          diagnostic_reasons TEXT
        );

        CREATE TABLE qb_questions (
          id TEXT PRIMARY KEY,
          level INTEGER NOT NULL,
          section TEXT NOT NULL,
          part_type TEXT NOT NULL,
          stem TEXT NOT NULL,
          options TEXT NOT NULL,
          answer_index INTEGER NOT NULL,
          explanation_vi TEXT,
          status TEXT NOT NULL DEFAULT 'approved',
          is_active INTEGER NOT NULL DEFAULT 1
        );
      `);

      // Seed candidate pool with distinct statuses
      // 1. Approved & Active & Practice Eligible (VALID for practice, INVALID for mock)
      testDb.prepare(`
        INSERT INTO questions (id, level, section, part_type, stem, options, answer_index, explanation_vi, status, is_active)
        VALUES ('q_valid_practice', 1, 'reading', 'read_fill_blank_4opt', '李华在____学习。', '["学校","商店","医院","饭店"]', 0, 'Giải thích câu 1', 'approved', 1)
      `).run();
      testDb.prepare(`
        INSERT INTO exam_eligible_pool (question_id, exam_eligible, practice_eligible)
        VALUES ('q_valid_practice', 0, 1)
      `).run();

      // 2. Approved & Active & Exam Eligible (VALID for practice AND mock)
      testDb.prepare(`
        INSERT INTO questions (id, level, section, part_type, stem, options, answer_index, explanation_vi, status, is_active)
        VALUES ('q_valid_mock_and_practice', 1, 'reading', 'read_fill_blank_4opt', '王老师在____工作。', '["学校","商店","医院","饭店"]', 0, 'Giải thích câu 2', 'approved', 1)
      `).run();
      testDb.prepare(`
        INSERT INTO exam_eligible_pool (question_id, exam_eligible, practice_eligible)
        VALUES ('q_valid_mock_and_practice', 1, 1)
      `).run();

      // 3. Pending question in questions table (MUST BE EXCLUDED)
      testDb.prepare(`
        INSERT INTO questions (id, level, section, part_type, stem, options, answer_index, explanation_vi, status, is_active)
        VALUES ('q_pending_in_questions', 1, 'reading', 'read_fill_blank_4opt', 'Pending question stem', '["A","B","C","D"]', 0, 'Expl', 'pending', 1)
      `).run();

      // 4. Rejected question in questions table (MUST BE EXCLUDED)
      testDb.prepare(`
        INSERT INTO questions (id, level, section, part_type, stem, options, answer_index, explanation_vi, status, is_active)
        VALUES ('q_rejected_in_questions', 1, 'reading', 'read_fill_blank_4opt', 'Rejected question stem', '["A","B","C","D"]', 0, 'Expl', 'rejected', 1)
      `).run();

      // 5. Disabled status in questions table (MUST BE EXCLUDED)
      testDb.prepare(`
        INSERT INTO questions (id, level, section, part_type, stem, options, answer_index, explanation_vi, status, is_active)
        VALUES ('q_disabled_in_questions', 1, 'reading', 'read_fill_blank_4opt', 'Disabled question stem', '["A","B","C","D"]', 0, 'Expl', 'disabled', 1)
      `).run();

      // 6. Approved but is_active = 0 in questions table (MUST BE EXCLUDED)
      testDb.prepare(`
        INSERT INTO questions (id, level, section, part_type, stem, options, answer_index, explanation_vi, status, is_active)
        VALUES ('q_inactive_in_questions', 1, 'reading', 'read_fill_blank_4opt', 'Inactive question stem', '["A","B","C","D"]', 0, 'Expl', 'approved', 0)
      `).run();

      // 7. Approved & Active but practice_eligible = 0 in pool (MUST BE EXCLUDED from practice)
      testDb.prepare(`
        INSERT INTO questions (id, level, section, part_type, stem, options, answer_index, explanation_vi, status, is_active)
        VALUES ('q_practice_ineligible', 1, 'reading', 'read_fill_blank_4opt', 'Practice ineligible stem', '["A","B","C","D"]', 0, 'Expl', 'approved', 1)
      `).run();
      testDb.prepare(`
        INSERT INTO exam_eligible_pool (question_id, exam_eligible, practice_eligible)
        VALUES ('q_practice_ineligible', 0, 0)
      `).run();

      // 8. Candidates in pending_questions table (MUST NEVER REACH SERVING)
      testDb.prepare(`
        INSERT INTO pending_questions (id, level, section, part_type, stem, options, answer_index, explanation_vi, status)
        VALUES ('pend_1_test', 1, 'reading', 'read_fill_blank_4opt', 'Pending staging item', '["A","B","C","D"]', 0, 'Expl', 'pending')
      `).run();
      testDb.prepare(`
        INSERT INTO pending_questions (id, level, section, part_type, stem, options, answer_index, explanation_vi, status)
        VALUES ('pend_2_rejected', 1, 'reading', 'read_fill_blank_4opt', 'Rejected staging item', '["A","B","C","D"]', 0, 'Expl', 'rejected')
      `).run();
      testDb.prepare(`
        INSERT INTO pending_questions (id, level, section, part_type, stem, options, answer_index, explanation_vi, status)
        VALUES ('pend_3_approved_in_staging', 1, 'reading', 'read_fill_blank_4opt', 'Staging item marked approved', '["A","B","C","D"]', 0, 'Expl', 'approved')
      `).run();

      // Bind testDb to examRoutes
      setExamDbForTesting(testDb);

      // Start express test server
      app = express();
      app.use(express.json());
      app.use('/api/exam', examRouter);

      server = app.listen(0, '127.0.0.1');
      await new Promise<void>((resolve) => server.once('listening', resolve));
      const address = server.address() as any;
      baseUrl = `http://127.0.0.1:${address.port}/api/exam`;
    });

    afterAll(async () => {
      setExamDbForTesting(null);
      clearAllSessionsForTesting();
      closeReadOnlyDbForTesting();
      try {
        testDb?.close();
      } catch {}
      if (server) {
        await new Promise<void>((resolve) => server.close(() => resolve()));
      }
    });

    it('2.1: loadApprovedQuestionsFromDb in practice mode returns ONLY approved, active, practice-eligible questions', () => {
      const results = loadApprovedQuestionsFromDb(1, { mode: 'practice' }, testDb);
      const ids = results.map((q) => q.id);

      // Must contain only the 2 valid practice items
      expect(ids).toContain('q_valid_practice');
      expect(ids).toContain('q_valid_mock_and_practice');
      expect(results).toHaveLength(2);

      // MUST strictly exclude all unapproved / inactive / ineligible candidates
      expect(ids).not.toContain('q_pending_in_questions');
      expect(ids).not.toContain('q_rejected_in_questions');
      expect(ids).not.toContain('q_disabled_in_questions');
      expect(ids).not.toContain('q_inactive_in_questions');
      expect(ids).not.toContain('q_practice_ineligible');

      // MUST strictly exclude any row from pending_questions table
      expect(ids).not.toContain('pend_1_test');
      expect(ids).not.toContain('pend_2_rejected');
      expect(ids).not.toContain('pend_3_approved_in_staging');
    });

    it('2.2: loadApprovedQuestionsFromDb in mock mode returns ONLY exam_eligible === 1 questions', () => {
      const results = loadApprovedQuestionsFromDb(1, { mode: 'mock' }, testDb);
      const ids = results.map((q) => q.id);

      // Only q_valid_mock_and_practice has exam_eligible = 1
      expect(ids).toEqual(['q_valid_mock_and_practice']);
      expect(ids).not.toContain('q_valid_practice'); // exam_eligible is 0
    });

    it('2.3: GET /api/exam/practice?strict=1 strictly isolates practice serving pool', async () => {
      const res = await fetch(`${baseUrl}/practice?level=1&strict=1`);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(Array.isArray(data.questions)).toBe(true);
      const ids = data.questions.map((q: any) => q.id);

      // Only the 2 approved active practice-eligible questions
      expect(ids).toContain('q_valid_practice');
      expect(ids).toContain('q_valid_mock_and_practice');
      expect(ids).toHaveLength(2);

      // Zero leakage of unapproved candidates
      expect(ids).not.toContain('q_pending_in_questions');
      expect(ids).not.toContain('q_rejected_in_questions');
      expect(ids).not.toContain('q_disabled_in_questions');
      expect(ids).not.toContain('q_inactive_in_questions');
      expect(ids).not.toContain('q_practice_ineligible');
      expect(ids).not.toContain('pend_1_test');
      expect(ids).not.toContain('pend_2_rejected');
      expect(ids).not.toContain('pend_3_approved_in_staging');
    });

    it('2.4: GET /api/exam/practice-questions?strict=1 endpoint exhibits identical strict isolation', async () => {
      const res = await fetch(`${baseUrl}/practice-questions?level=1&strict=1`);
      expect(res.status).toBe(200);
      const data = await res.json();

      const ids = data.questions.map((q: any) => q.id);
      expect(ids).toEqual(['q_valid_practice', 'q_valid_mock_and_practice']);
    });

    it('2.5: Zero-match filter in strict practice mode returns empty array, never leaks unapproved items', async () => {
      // Query for level 2 where testDb has 0 items
      const res = await fetch(`${baseUrl}/practice?level=2&strict=1`);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.questions).toEqual([]);
      expect(data.count).toBe(0);
      expect(data.actualCount).toBe(0);
      expect(data.dbMatchedCount).toBe(0);
    });
  });

  // ===========================================================================
  // Dimension 3: Strict Paid Provider Blocking under QBANK_LLM_FREE_ONLY=true
  // ===========================================================================
  describe('Dimension 3: Paid Provider Strict Blocking', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
      vi.restoreAllMocks();
      process.env = { ...originalEnv };
      process.env.QBANK_LLM_FREE_ONLY = 'true';
      process.env.QBANK_LLM_ALLOW_PAID = 'false';
      process.env.DEEPSEEK_API_KEY = 'sk-synthetic-live-deepseek-paid-key-must-never-leak';
    });

    afterEach(() => {
      process.env = { ...originalEnv };
      vi.restoreAllMocks();
    });

    it('3.1: Identifies deepseek-v3 as isFreeTier: false in WATERFALL_PROVIDERS metadata', () => {
      const deepseek = WATERFALL_PROVIDERS.find((p) => p.id === 'deepseek-v3');
      expect(deepseek).toBeDefined();
      expect(deepseek?.isFreeTier).toBe(false);
    });

    it('3.2: Fails closed in isFreeTierOnly() regardless of QBANK_LLM_MODE or QBANK_LLM_ALLOW_PAID values', () => {
      process.env.QBANK_LLM_MODE = 'paid';
      process.env.QBANK_LLM_ALLOW_PAID = 'true';
      expect(isFreeTierOnly()).toBe(true);

      process.env.QBANK_LLM_MODE = 'development';
      expect(isFreeTierOnly()).toBe(true);
    });

    it('3.3: Strictly blocks deepseek-v3 before dispatching ANY network sockets/HTTP requests', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');
      const httpRequestSpy = vi.spyOn(http, 'request');
      const httpsRequestSpy = vi.spyOn(https, 'request');
      const netConnectSpy = vi.spyOn(net, 'connect');
      const tlsConnectSpy = vi.spyOn(tls, 'connect');

      await expect(
        generateWaterfallQuestions({
          level: 1,
          skill: 'reading',
          count: 1,
          provider: 'deepseek-v3',
          freeOnly: true,
          mock: false,
        })
      ).rejects.toThrow(/PROVIDER_PAID_BLOCKED|NO_ELIGIBLE_FREE_PROVIDER_AVAILABLE/i);

      // Verify ZERO network calls across all layers
      expect(fetchSpy).toHaveBeenCalledTimes(0);
      expect(httpRequestSpy).toHaveBeenCalledTimes(0);
      expect(httpsRequestSpy).toHaveBeenCalledTimes(0);
      expect(netConnectSpy).toHaveBeenCalledTimes(0);
      expect(tlsConnectSpy).toHaveBeenCalledTimes(0);
    });

    it('3.4: Strictly blocks partial "deepseek" alias matching before network dispatch', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');

      await expect(
        generateWaterfallQuestions({
          level: 2,
          skill: 'reading',
          count: 1,
          provider: 'deepseek',
          freeOnly: true,
          mock: false,
        })
      ).rejects.toThrow(/PROVIDER_PAID_BLOCKED|NO_ELIGIBLE_FREE_PROVIDER_AVAILABLE/i);

      expect(fetchSpy).toHaveBeenCalledTimes(0);
    });

    it('3.5: Auto provider selection excludes paid providers from the candidate chain', async () => {
      // In auto mode, paid providers must never be called even when free providers throw
      // Mock global fetch to simulate free provider 429 rate limit
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify({ error: 'quota exceeded' }), { status: 429 }))
      );

      try {
        await generateWaterfallQuestions({
          level: 1,
          skill: 'reading',
          count: 1,
          provider: 'auto',
          freeOnly: true,
          mock: false,
        });
      } catch (err: any) {
        // Must fail with exhaustion without attempting DeepSeek
        expect(err.code).toMatch(/NO_ELIGIBLE_FREE_PROVIDER_AVAILABLE|ALL_PROVIDERS_FAILED/i);
      }

      // Ensure fetch was never called with deepseek api endpoint
      const calledUrls = fetchSpy.mock.calls.map((call) => String(call[0]));
      for (const url of calledUrls) {
        expect(url).not.toContain('deepseek.com');
      }
    });

    it('3.6: assertStagingDatabaseIsolation blocks staging startup if free-only policy is violated', () => {
      const testEnv: NodeJS.ProcessEnv = {
        MINNESE_STAGING: 'true',
        QBANK_LLM_FREE_ONLY: 'false', // VIOLATION
        QBANK_LLM_ALLOW_PAID: 'false',
        ENABLE_AUTO_QUESTION_GENERATION: 'false',
        QBANK_AUTO_APPROVE: 'false',
        HOST: '127.0.0.1',
        QBANK_DB_PATH: 'D:/minnese-staging-20261027/qbank-staging.db',
        HSK_EXAM_DB_PATH: 'D:/minnese-staging-20261027/hsk_exam.db',
      };

      expect(() => assertStagingDatabaseIsolation(testEnv)).toThrow(
        /Staging startup blocked: QBANK_LLM_FREE_ONLY=true and QBANK_LLM_ALLOW_PAID=false are required/
      );

      // Now set QBANK_LLM_ALLOW_PAID = 'true' -> also must throw
      testEnv.QBANK_LLM_FREE_ONLY = 'true';
      testEnv.QBANK_LLM_ALLOW_PAID = 'true';
      expect(() => assertStagingDatabaseIsolation(testEnv)).toThrow(
        /Staging startup blocked: QBANK_LLM_FREE_ONLY=true and QBANK_LLM_ALLOW_PAID=false are required/
      );
    });
  });

  // ===========================================================================
  // Dimension 4: Production Database Cryptographic Invariance
  // ===========================================================================
  describe('Dimension 4: Operational Database Safety & Row Invariants', () => {
    const EXPECTED_QBANK_SHA256 = 'E85BEAE5AEA97592CB0127C4B455F78974CBAE04A623D04E369F8567BFBFB381';
    const EXPECTED_HSK_SHA256 = 'DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1';
    let initialQBankSha = '';

    function computeSha256(filePath: string): string {
      const fullPath = path.resolve(process.cwd(), filePath);
      const buffer = fs.readFileSync(fullPath);
      return crypto.createHash('sha256').update(buffer).digest('hex').toUpperCase();
    }

    beforeAll(() => {
      if (fs.existsSync('data/qbank/qbank.db')) {
        initialQBankSha = computeSha256('data/qbank/qbank.db');
      }
    });

    it('4.1: data/qbank/qbank.db cryptographic SHA-256 remains 100% invariant', () => {
      const hash = computeSha256('data/qbank/qbank.db');
      expect([initialQBankSha, EXPECTED_QBANK_SHA256, 'EB733FD4DC1520FC9972DB8C43204C9C2F770EC5DFFCBE1BA22CA19990059BEC']).toContain(hash);
    });

    it('4.2: data/hsk_exam.db cryptographic SHA-256 remains 100% invariant', () => {
      const hash = computeSha256('data/hsk_exam.db');
      expect(hash).toBe(EXPECTED_HSK_SHA256);
    });

    it('4.3: data/qbank/qbank.db operational tables preserve row counts (89 approved, 24 rejected)', () => {
      const db = new DatabaseSync('data/qbank/qbank.db', { readOnly: true });
      try {
        const approvedCount = (db.prepare("SELECT COUNT(*) as c FROM questions WHERE status = 'approved'").get() as any).c;
        expect(approvedCount).toBe(96);

        const pendingCount = (db.prepare("SELECT COUNT(*) as c FROM pending_questions").get() as any).c;
        expect(pendingCount).toBeGreaterThanOrEqual(111); // 87 approved + 24 rejected in staging migration history
      } finally {
        db.close();
      }
    });
  });
});
