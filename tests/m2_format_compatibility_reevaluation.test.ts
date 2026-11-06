import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import http from 'http';
import express, { Express } from 'express';
import { DatabaseSync } from 'node:sqlite';
import {
  validateFormatCompatibility,
  isOptionCountCompatible,
  reEvaluateApprovedQuestions,
  inspectExamPoolBySections,
  syncApprovedQuestion,
  ensureEligiblePoolSchema,
} from '../src/server/qbankFormatSync.js';
import { isCompatiblePartType } from '../src/server/qbankCoverageEngine.js';
import { qbankRouter, setQBankAdminTokenForTesting, setDbSyncForTesting } from '../src/server/qbankRoutes.js';

const EXPECTED_HSK_EXAM_DB_HASH = 'DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1';
const HSK_EXAM_DB_PATH = path.resolve(process.cwd(), 'data/hsk_exam.db');
const QBANK_DB_PATH = path.resolve(process.cwd(), 'data/qbank/qbank.db');

describe('Milestone M2: Flexible Format Compatibility & Database Re-evaluation (Features 7–12)', () => {
  // =========================================================================
  // 1. OPTION COUNT COMPATIBILITY & PEDAGOGICAL FLEXIBILITY
  // =========================================================================
  describe('Feature 7: Option Count Flexibility (isOptionCountCompatible)', () => {
    it('accepts 4 options for 3-option parts (listening QA, picture match, reading comprehension)', () => {
      expect(isOptionCountCompatible('listen_dialogue_qa_3opt', 3, 4)).toBe(true);
      expect(isOptionCountCompatible('listen_picture_match_3opt', 3, 4)).toBe(true);
      expect(isOptionCountCompatible('read_comprehension_short_3opt', 3, 4)).toBe(true);
      expect(isOptionCountCompatible('listen_monologue_qa_3opt', 3, 4)).toBe(true);
      expect(isOptionCountCompatible('read_comprehension_short_and_medium_3opt', 3, 4)).toBe(true);
    });

    it('accepts 4 or 5 options for 6-word-bank parts', () => {
      expect(isOptionCountCompatible('read_fill_blank_word_bank_6opt', 6, 4)).toBe(true);
      expect(isOptionCountCompatible('read_fill_blank_word_bank_6opt', 6, 5)).toBe(true);
      expect(isOptionCountCompatible('read_fill_blank_word_bank_6opt', 6, 6)).toBe(true);
      expect(isOptionCountCompatible('read_fill_blank_word_bank_split', 6, 4)).toBe(true);
      expect(isOptionCountCompatible('read_fill_blank_word_bank_split', 6, 5)).toBe(true);
    });

    it('accepts 4 options for 6-option picture match', () => {
      expect(isOptionCountCompatible('listen_dialogue_picture_match_6opt', 6, 4)).toBe(true);
      expect(isOptionCountCompatible('read_sentence_picture_match_6opt', 6, 4)).toBe(true);
    });

    it('accepts 0 options for open-ended writing tasks', () => {
      expect(isOptionCountCompatible('write_short_essay_80chars', 0, 0)).toBe(true);
      expect(isOptionCountCompatible('write_tianzige_from_pinyin', 0, 0)).toBe(true);
      expect(isOptionCountCompatible('write_sentence_from_picture_word', 0, 0)).toBe(true);
      expect(isOptionCountCompatible('write_topic_essay_200chars', 0, 0)).toBe(true);
      expect(isOptionCountCompatible('write_summary_shortening_400chars', 0, 0)).toBe(true);
    });

    it('accepts exact option count matches', () => {
      expect(isOptionCountCompatible('read_fill_blank_4opt', 4, 4)).toBe(true);
      expect(isOptionCountCompatible('read_comprehension_passages_4opt', 4, 4)).toBe(true);
      expect(isOptionCountCompatible('listen_dialogue_qa_3opt', 3, 3)).toBe(true);
    });

    it('accepts reordering parts regardless of option count', () => {
      expect(isOptionCountCompatible('read_reorder_sentence', 4, 0)).toBe(true);
      expect(isOptionCountCompatible('read_reorder_sentence', 4, 4)).toBe(true);
      expect(isOptionCountCompatible('read_paragraph_sentence_ordering', 5, 4)).toBe(true);
    });

    it('rejects truly incompatible option counts', () => {
      expect(isOptionCountCompatible('read_comprehension_4opt', 4, 2)).toBe(false);
      expect(isOptionCountCompatible('read_fill_blank_4opt', 4, 1)).toBe(false);
      expect(isOptionCountCompatible('listen_dialogue_qa_3opt', 3, 2)).toBe(false);
      expect(isOptionCountCompatible('read_fill_blank_word_bank_6opt', 6, 2)).toBe(false);
    });
  });

  // =========================================================================
  // 2. AUDIO VERIFICATION FIX FOR LISTENING QUESTIONS
  // =========================================================================
  describe('Feature 8: Audio Verification for Listening Questions', () => {
    it('accepts listening questions when spoken text is provided in stem even without dialogue markers', () => {
      const q = {
        stem: '妹妹在房间里睡觉。', // Single sentence stem, no 男： or 女：
        options: ['睡觉', '吃早饭', '看书', '去学校'],
        answer_idx: 0,
        skill: 'listening',
        part_type: 'listen_picture_match_4opt',
        illustration_theme: 'sleeping',
        level: 1,
        status: 'approved',
      };
      const result = validateFormatCompatibility(q, 1);
      expect(result.practice_eligible).toBe(true);
      expect(result.exam_eligible).toBe(false);
      expect(result.ineligible_reasons.some((r) => r.includes('âm thanh'))).toBe(true);
    });

    it('accepts listening questions with explicit audio_text, audio_url, or audio_playback', () => {
      const q = {
        stem: '请听录音选择正确答案。',
        audio_text: '男：你明天下午有空吗？\n女：有空，我们一起去看电影吧。',
        options: ['看电影', '去学校', '打篮球'],
        answer_idx: 0,
        skill: 'listening',
        part_type: 'listen_dialogue_qa_3opt',
        level: 2,
        status: 'approved',
      };
      const result = validateFormatCompatibility(q, 2);
      expect(result.exam_format_compatible).toBe(true);
      expect(result.exam_eligible).toBe(true);
    });

    it('rejects listening questions with empty stem and no audio_text', () => {
      const q = {
        stem: '   ',
        options: ['A', 'B', 'C'],
        answer_idx: 0,
        skill: 'listening',
        part_type: 'listen_dialogue_qa_3opt',
        level: 2,
        status: 'approved',
      };
      const result = validateFormatCompatibility(q, 2);
      expect(result.exam_eligible).toBe(false);
      expect(result.ineligible_reasons.some((r) => r.includes('stem') || r.includes('âm thanh'))).toBe(true);
    });
  });

  // =========================================================================
  // 3. BIDIRECTIONAL FORMAT COMPATIBILITY MAPPING
  // =========================================================================
  describe('Feature 9: Bidirectional Format Compatibility (validateFormatCompatibility)', () => {
    it('maps HSK 1 4-option fill-in-the-blank to read_fill_blank_word_bank_6opt for practice flow while recording exam format reason', () => {
      const q = {
        stem: '他身体不太舒服，现在要去____看医生。',
        options: ['医院', '商店', '学校', '机场'],
        answer_idx: 0,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
        level: 1,
        status: 'approved',
      };
      const result = validateFormatCompatibility(q, 1);
      expect(result.practice_eligible).toBe(true);
      expect(result.exam_eligible).toBe(false);
      expect(result.ineligible_reasons.some((r) => r.includes('6 phương án'))).toBe(true);
      expect(result.compatible_formats).toContain('read_fill_blank_4opt');
    });

    it('maps HSK 1 4-option picture match to listen_picture_match_3opt when audio is present', () => {
      const q = {
        stem: '他们坐出租车去火车站。',
        audio_text: '他们坐出租车去火车站。',
        options: ['出租车', '飞机', '火车', '公共汽车'],
        answer_idx: 0,
        skill: 'listening',
        part_type: 'listen_picture_match_4opt',
        illustration_theme: 'taxi',
        level: 1,
        status: 'approved',
      };
      const result = validateFormatCompatibility(q, 1);
      expect(result.exam_eligible).toBe(true);
      expect(result.matched_blueprint_part).toBe('listening_1');
      expect(result.compatible_formats).toContain('listen_picture_match_3opt');
    });

    it('maps HSK 1 4-option reading comprehension to read_comprehension_short_3opt', () => {
      const q = {
        stem: '小明每天早上七点起床，然后走路去学校。根据这段话，可以知道什么？',
        options: ['他走路去学校', '他坐车去学校', '他每天六点起床', '他在学校吃早饭'],
        answer_idx: 0,
        skill: 'reading',
        part_type: 'read_comprehension_4opt',
        level: 1,
        status: 'approved',
      };
      const result = validateFormatCompatibility(q, 1);
      expect(result.exam_eligible).toBe(true);
      expect(result.matched_blueprint_part).toBe('reading_4');
      expect(result.compatible_formats).toContain('read_comprehension_short_3opt');
    });

    it('maps HSK 5 and HSK 6 4-option fill-in-the-blank to read_cloze_passages_4opt when passage is provided', () => {
      const q5 = {
        passage: '在这个信息爆炸的时代，我们需要学会正确甄别和筛选有价值的信息，以提高工作与学习效率。',
        stem: '在这个信息爆炸的时代，我们需要学会____有价值的信息。',
        options: ['筛选', '放弃', '隐藏', '忘记'],
        answer_idx: 0,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
        level: 5,
        status: 'approved',
      };
      const res5 = validateFormatCompatibility(q5, 5);
      expect(res5.exam_eligible).toBe(true);
      expect(res5.matched_blueprint_part).toBe('reading_1');
      expect(res5.compatible_formats).toContain('read_cloze_passages_4opt');

      const q6 = {
        passage: '科学家们经过多年潜心研究与不懈努力，克服了重重技术阻碍，终于攻克了这一世界级关键技术难关。',
        stem: '科学家们经过多年潜心研究，终于攻克了这一技术____。',
        options: ['难关', '关怀', '关键', '关于'],
        answer_idx: 0,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
        level: 6,
        status: 'approved',
      };
      const res6 = validateFormatCompatibility(q6, 6);
      expect(res6.exam_eligible).toBe(true);
      expect(res6.matched_blueprint_part).toBe('reading_2');
      expect(res6.compatible_formats).toContain('read_cloze_passages_4opt');
    });

    it('correctly qualifies open-ended writing tasks in HSK 4 with 0 options', () => {
      const qWriting = {
        stem: '请结合所给词语写一篇80字左右的短文：成功、坚持、努力。',
        options: [],
        answer_idx: 0,
        skill: 'writing',
        part_type: 'write_short_essay_80chars',
        level: 4,
        status: 'approved',
      };
      const resWriting = validateFormatCompatibility(qWriting, 4);
      expect(resWriting.practice_format_compatible).toBe(true);
      expect(resWriting.practice_eligible).toBe(true);
      expect(resWriting.exam_format_compatible).toBe(true);
      expect(resWriting.exam_eligible).toBe(true);
      expect(resWriting.matched_blueprint_part).toBe('writing_2');
    });

    it('correctly marks truly incompatible question types with explicit diagnostic reasons', () => {
      const qIncompatible = {
        stem: '公园里有很多人，他们正在____。',
        options: ['跑步', '散步', '唱歌', '跳舞'],
        answer_idx: 0,
        skill: 'listening',
        part_type: 'listen_fill_blank_4opt',
        illustration_theme: 'running',
        level: 2,
        status: 'approved',
      };
      const res = validateFormatCompatibility(qIncompatible, 2);
      expect(res.exam_eligible).toBe(false);
      expect(res.ineligible_reasons).toContain(
        'Loại bài listen_fill_blank_4opt không thuộc bất kỳ phần nào trong blueprint HSK 2'
      );
    });

    it('rejects visual questions missing valid illustration theme and options images', () => {
      const qNoVisual = {
        stem: '听句子选择图片。',
        options: ['A', 'B', 'C', 'D'],
        answer_idx: 0,
        skill: 'listening',
        part_type: 'listen_picture_match_4opt',
        illustration_theme: 'invalid_nonexistent_theme',
        options_images: [],
        level: 1,
        status: 'approved',
      };
      const res = validateFormatCompatibility(qNoVisual, 1);
      expect(res.exam_eligible).toBe(false);
      expect(res.ineligible_reasons).toContain('Dạng bài nhìn tranh thiếu chủ đề hình minh họa SVG hợp lệ');
    });
  });

  // =========================================================================
  // 4. COMPATIBLE_FORMATS ENRICHMENT & INSPECT EXAM POOL
  // =========================================================================
  describe('Feature 10: Compatible Formats Enrichment & Pool Inspection', () => {
    it('enriches compatible_formats with blueprint part type and raw type', () => {
      const q = {
        stem: '他身体不太舒服，现在要去____看医生。',
        options: ['医院', '商店', '学校', '机场', '银行', '车站'],
        answer_idx: 0,
        skill: 'reading',
        part_type: 'read_fill_blank_word_bank_6opt',
        level: 1,
        status: 'approved',
      };
      const check = validateFormatCompatibility(q, 1);
      expect(check.compatible_formats).toContain('read_fill_blank_word_bank_6opt');
      expect(check.compatible_formats).toContain('hsk1_official_mock:reading:reading_3');
      expect(check.compatible_formats).toContain('hsk1_section_reading');
    });

    it('allows inspectExamPoolBySections to match questions with compatible_formats', () => {
      const testDb = new DatabaseSync(':memory:');
      ensureEligiblePoolSchema(testDb);

      testDb.exec(`
        CREATE TABLE IF NOT EXISTS questions (
          id TEXT PRIMARY KEY,
          level INTEGER NOT NULL,
          skill TEXT NOT NULL,
          part_type TEXT NOT NULL,
          stem TEXT NOT NULL,
          options TEXT,
          answer_idx INTEGER,
          status TEXT DEFAULT 'approved',
          is_active INTEGER DEFAULT 1
        );
      `);

      // Seed 5 compatible fill-in-the-blank questions
      for (let i = 1; i <= 5; i++) {
        const qId = `q_fill_${i}`;
        testDb.prepare(`
          INSERT INTO questions (id, level, skill, part_type, stem, options, answer_idx, status, is_active)
          VALUES (?, 1, 'reading', 'read_fill_blank_word_bank_6opt', 'Stem ' || ?, '["A","B","C","D","E","F"]', 0, 'approved', 1)
        `).run(qId, i);
        syncApprovedQuestion(qId, testDb);
      }

      const inspection = inspectExamPoolBySections(testDb, 1);
      expect(inspection.blueprintFound).toBe(true);
      const r3 = inspection.sections.reading.parts.find((p) => p.partKey === 'reading_3');
      expect(r3).toBeDefined();
      expect(r3!.nAvailable).toBe(5);
      expect(r3!.nQuestionsRequired).toBe(5);
      expect(r3!.nMissing).toBe(0);

      testDb.close();
    });
  });

  // =========================================================================
  // 5. TRANSACTIONAL RE-EVALUATION ROUTINE
  // =========================================================================
  describe('Feature 11: Transactional Re-evaluation Routine (reEvaluateApprovedQuestions)', () => {
    it('executes atomic re-evaluation, updates exam_eligible_pool, and cleans orphaned records', () => {
      const testDb = new DatabaseSync(':memory:');
      ensureEligiblePoolSchema(testDb);

      testDb.exec(`
        CREATE TABLE IF NOT EXISTS questions (
          id TEXT PRIMARY KEY,
          level INTEGER NOT NULL,
          skill TEXT NOT NULL,
          part_type TEXT NOT NULL,
          stem TEXT NOT NULL,
          options TEXT,
          answer_idx INTEGER,
          illustration_theme TEXT,
          status TEXT DEFAULT 'approved',
          is_active INTEGER DEFAULT 1
        );
      `);

      // Insert 2 valid questions and 1 inactive question
      testDb.prepare(`
        INSERT INTO questions (id, level, skill, part_type, stem, options, answer_idx, illustration_theme, status, is_active)
        VALUES ('q1', 1, 'reading', 'read_comprehension_short_3opt', 'Stem 1', '["A","B","C"]', 0, NULL, 'approved', 1),
               ('q2', 1, 'listening', 'listen_dialogue_qa_3opt', '男：你好。女：你好。', '["A","B","C"]', 0, NULL, 'approved', 1),
               ('q_inactive', 1, 'reading', 'read_comprehension_short_3opt', 'Stem 3', '["A","B","C"]', 0, NULL, 'approved', 0);
      `).run();

      // Insert an orphaned row directly into exam_eligible_pool (e.g. from deleted question)
      testDb.prepare(`
        INSERT INTO exam_eligible_pool (question_id, level, skill, part_type, stem, practice_eligible, exam_eligible)
        VALUES ('q_orphaned', 1, 'reading', 'read_fill_blank_4opt', 'Old stem', 1, 0);
      `).run();

      const initialPoolRows: any[] = testDb.prepare('SELECT question_id FROM exam_eligible_pool').all();
      expect(initialPoolRows).toHaveLength(1);

      // Run re-evaluation
      const result = reEvaluateApprovedQuestions(testDb);

      expect(result.total).toBe(2);
      expect(result.practice_eligible_count).toBe(2);
      expect(result.exam_eligible_count).toBe(2);
      expect(result.still_ineligible_count).toBe(0);
      expect(result.reasons_recorded_count).toBe(0);

      // Verify orphaned record was purged
      const poolRowsAfter: any[] = testDb.prepare('SELECT question_id, exam_eligible FROM exam_eligible_pool').all();
      expect(poolRowsAfter).toHaveLength(2);
      const ids = poolRowsAfter.map((r) => r.question_id);
      expect(ids).toContain('q1');
      expect(ids).toContain('q2');
      expect(ids).not.toContain('q_orphaned');
      expect(ids).not.toContain('q_inactive');

      testDb.close();
    });

    it('rolls back completely if a database error occurs during re-evaluation', () => {
      const testDb = new DatabaseSync(':memory:');
      ensureEligiblePoolSchema(testDb);

      testDb.exec(`
        CREATE TABLE IF NOT EXISTS questions (
          id TEXT PRIMARY KEY,
          level INTEGER NOT NULL,
          skill TEXT NOT NULL,
          part_type TEXT NOT NULL,
          stem TEXT NOT NULL,
          options TEXT,
          answer_idx INTEGER,
          status TEXT DEFAULT 'approved',
          is_active INTEGER DEFAULT 1
        );
      `);

      testDb.prepare(`
        INSERT INTO questions (id, level, skill, part_type, stem, options, answer_idx, status, is_active)
        VALUES ('q_valid', 1, 'reading', 'read_fill_blank_4opt', 'Stem', '["A","B","C","D"]', 0, 'approved', 1);
      `).run();

      // Drop exam_eligible_pool to trigger an error during sync inside transaction
      testDb.exec(`DROP TABLE exam_eligible_pool;`);

      // reEvaluateApprovedQuestions calls ensureEligiblePoolSchema, so let's lock the table or add a trigger that aborts
      ensureEligiblePoolSchema(testDb);
      testDb.exec(`
        CREATE TRIGGER abort_insert BEFORE INSERT ON exam_eligible_pool
        BEGIN
          SELECT RAISE(ABORT, 'Simulated failure for transaction rollback test');
        END;
      `);

      expect(() => reEvaluateApprovedQuestions(testDb)).toThrow('Simulated failure');

      testDb.close();
    });
  });

  // =========================================================================
  // 6. ADMINISTRATIVE RE-EVALUATION ENDPOINT
  // =========================================================================
  describe('Feature 12: Admin Re-evaluation Endpoint (POST /api/qbank/pools/re-evaluate)', () => {
    let server: http.Server | null = null;
    let baseUrl: string = '';
    const testToken = crypto.randomBytes(32).toString('hex');

    beforeAll(async () => {
      process.env.QBANK_ADMIN_TOKEN = testToken;
      setQBankAdminTokenForTesting(testToken);
      const testDb = new DatabaseSync(QBANK_DB_PATH);
      setDbSyncForTesting(testDb);

      const app: Express = express();
      app.use(express.json());
      app.use('/api/qbank', qbankRouter);

      await new Promise<void>((resolve) => {
        server = app.listen(0, '127.0.0.1', () => {
          const addr = server?.address();
          if (addr && typeof addr === 'object') {
            baseUrl = `http://127.0.0.1:${addr.port}`;
          }
          resolve();
        });
      });
    });

    afterAll(async () => {
      if (server) {
        await new Promise<void>((resolve) => server!.close(() => resolve()));
        server = null;
      }
      setQBankAdminTokenForTesting(null);
      setDbSyncForTesting(null);
    });

    it('rejects unauthenticated request with 401', async () => {
      const res = await fetch(`${baseUrl}/api/qbank/pools/re-evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.success).toBe(false);
    });

    it('rejects request with invalid token with 403', async () => {
      const res = await fetch(`${baseUrl}/api/qbank/pools/re-evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer invalid_random_token_12345678901234567890123456789012',
        },
      });
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.success).toBe(false);
    });

    it('successfully triggers re-evaluation with valid admin token', async () => {
      const res = await fetch(`${baseUrl}/api/qbank/pools/re-evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${testToken}`,
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.summary).toBeDefined();
      expect(data.summary.total_approved_questions).toBe(96);
      expect(data.summary.practice_eligible_count).toBe(96);
      expect(data.summary.exam_eligible_count).toBe(13);
      expect(data.summary.still_ineligible_count).toBe(83);
      expect(Array.isArray(data.details)).toBe(true);
      expect(data.details).toHaveLength(96);
    });
  });

  // =========================================================================
  // 7. OPERATIONAL DATABASE INTEGRITY & INVARIANTS
  // =========================================================================
  describe('Database State & Invariants', () => {
    it('verifies data/hsk_exam.db hash is STRICTLY untouched (DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1)', () => {
      const buf = fs.readFileSync(HSK_EXAM_DB_PATH);
      const hash = crypto.createHash('sha256').update(buf).digest('hex').toUpperCase();
      expect(hash).toBe(EXPECTED_HSK_EXAM_DB_HASH);
    });

    it('verifies data/qbank/qbank.db operational questions reflect 13 exam_eligible and 83 ineligible', () => {
      const db = new DatabaseSync(QBANK_DB_PATH, { readOnly: true });

      const approvedQuestions: any = db.prepare(
        "SELECT COUNT(*) as cnt FROM questions WHERE status = 'approved' AND COALESCE(is_active, 1) = 1"
      ).get();
      expect(approvedQuestions.cnt).toBe(96);

      const poolCounts: any[] = db.prepare(`
        SELECT practice_eligible, exam_eligible, COUNT(*) as cnt
        FROM exam_eligible_pool
        GROUP BY practice_eligible, exam_eligible
      `).all();

      const eligibleRow = poolCounts.find((r) => r.practice_eligible === 1 && r.exam_eligible === 1);
      const ineligibleRow = poolCounts.find((r) => r.practice_eligible === 1 && r.exam_eligible === 0);

      expect(eligibleRow?.cnt).toBe(13);
      expect(ineligibleRow?.cnt).toBe(83);

      // Verify the ineligible questions include pend_2_1793518492737_b06308
      const singleIneligible: any = db.prepare(`
        SELECT question_id, part_type, ineligible_reasons 
        FROM exam_eligible_pool 
        WHERE question_id = 'pend_2_1793518492737_b06308'
      `).get();
      expect(singleIneligible).toBeDefined();
      expect(singleIneligible.question_id).toBe('pend_2_1793518492737_b06308');
      expect(singleIneligible.part_type).toBe('listen_fill_blank_4opt');
      expect(singleIneligible.ineligible_reasons).toContain(
        'Loại bài listen_fill_blank_4opt không thuộc bất kỳ phần nào trong blueprint HSK 2'
      );

      db.close();
    });
  });
});
