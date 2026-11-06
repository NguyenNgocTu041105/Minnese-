import { describe, it, expect } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import {
  validateFormatCompatibility,
  isOptionCountCompatible,
  reEvaluateApprovedQuestions,
  syncApprovedQuestion,
  ensureEligiblePoolSchema,
  inspectExamPoolBySections,
} from '../src/server/qbankFormatSync.js';

describe('Adversarial Challenger M2: Empirical Verification & Stress Harness', () => {
  // =========================================================================
  // SECTION 1: QUESTION FORMAT COMPATIBILITY & OPTION FLEXIBILITY
  // =========================================================================
  describe('1. Individual Question Format Compatibility & Blueprints', () => {
    it('1.1 4-option fill-in-the-blank gains exam_eligible = 1 for HSK 1 Reading Part 3 (read_fill_blank_word_bank_6opt)', () => {
      const q = {
        id: 'q_hsk1_read_fill_4opt',
        stem: '他身体不太舒服，现在要去____看医生。',
        options: ['医院', '商店', '学校', '机场'],
        answer_idx: 0,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
        level: 1,
        status: 'approved',
        is_active: 1,
      };

      const result = validateFormatCompatibility(q, 1);

      expect(result.practice_format_compatible).toBe(true);
      expect(result.practice_eligible).toBe(true);
      expect(result.exam_format_compatible).toBe(true);
      expect(result.exam_eligible).toBe(true);
      expect(result.matched_blueprint_part).toBe('reading_3');
      expect(result.compatible_formats).toContain('read_fill_blank_word_bank_6opt');
      expect(result.compatible_formats).toContain('read_fill_blank_4opt');
      expect(result.compatible_formats).toContain('hsk1_official_mock:reading:reading_3');
      expect(result.compatible_formats).toContain('hsk1_section_reading');
      expect(result.ineligible_reasons).toHaveLength(0);
    });

    it('1.2 4-option picture match gains exam_eligible = 1 for HSK 1 Listening Part 1 (listen_picture_match_3opt)', () => {
      const q = {
        id: 'q_hsk1_listen_pic_4opt',
        stem: '他们坐出租车去火车站。',
        options: ['出租车', '飞机', '火车', '公共汽车'],
        answer_idx: 0,
        skill: 'listening',
        part_type: 'listen_picture_match_4opt',
        illustration_theme: 'taxi',
        level: 1,
        status: 'approved',
        is_active: 1,
      };

      const result = validateFormatCompatibility(q, 1);

      expect(result.practice_format_compatible).toBe(true);
      expect(result.practice_eligible).toBe(true);
      expect(result.exam_format_compatible).toBe(true);
      expect(result.exam_eligible).toBe(true);
      expect(result.matched_blueprint_part).toBe('listening_1');
      expect(result.compatible_formats).toContain('listen_picture_match_3opt');
      expect(result.compatible_formats).toContain('listen_picture_match_4opt');
      expect(result.compatible_formats).toContain('hsk1_official_mock:listening:listening_1');
      expect(result.compatible_formats).toContain('hsk1_section_listening');
      expect(result.ineligible_reasons).toHaveLength(0);
    });

    it('1.3 4-option reading comprehension gains exam_eligible = 1 for HSK 1 Reading Part 4 (read_comprehension_short_3opt)', () => {
      const q = {
        id: 'q_hsk1_read_comp_4opt',
        stem: '小明每天早上七点起床，然后走路去学校。根据这段话，可以知道什么？',
        options: ['他走路去学校', '他坐车去学校', '他每天六点起床', '他在学校吃早饭'],
        answer_idx: 0,
        skill: 'reading',
        part_type: 'read_comprehension_4opt',
        level: 1,
        status: 'approved',
        is_active: 1,
      };

      const result = validateFormatCompatibility(q, 1);

      expect(result.practice_format_compatible).toBe(true);
      expect(result.practice_eligible).toBe(true);
      expect(result.exam_format_compatible).toBe(true);
      expect(result.exam_eligible).toBe(true);
      expect(result.matched_blueprint_part).toBe('reading_4');
      expect(result.compatible_formats).toContain('read_comprehension_short_3opt');
      expect(result.compatible_formats).toContain('read_comprehension_4opt');
      expect(result.compatible_formats).toContain('hsk1_official_mock:reading:reading_4');
      expect(result.compatible_formats).toContain('hsk1_section_reading');
      expect(result.ineligible_reasons).toHaveLength(0);
    });

    it('1.4 Incompatible question (listen_fill_blank_4opt in HSK 2) remains exam_eligible = 0 with explicit diagnostic reason', () => {
      const q = {
        id: 'pend_2_1793518492737_b06308',
        stem: '公园里有很多人，他们正在____。',
        options: ['跑步', '散步', '唱歌', '跳舞'],
        answer_idx: 0,
        skill: 'listening',
        part_type: 'listen_fill_blank_4opt',
        illustration_theme: 'running',
        level: 2,
        status: 'approved',
        is_active: 1,
      };

      const result = validateFormatCompatibility(q, 2);

      // Practice eligible is preserved (student can still drill listening fill-in-the-blank)
      expect(result.practice_format_compatible).toBe(true);
      expect(result.practice_eligible).toBe(true);

      // Exam eligible must be strictly false
      expect(result.exam_format_compatible).toBe(false);
      expect(result.exam_eligible).toBe(false);
      expect(result.matched_blueprint_part).toBeUndefined();

      // Explicit diagnostic reason must be recorded
      expect(result.ineligible_reasons.length).toBeGreaterThan(0);
      expect(result.ineligible_reasons).toContain(
        'Loại bài listen_fill_blank_4opt không thuộc bất kỳ phần nào trong blueprint HSK 2'
      );
    });
  });

  // =========================================================================
  // SECTION 2: ADVERSARIAL STRESS ON FORMAT COMPATIBILITY
  // =========================================================================
  describe('2. Adversarial Edge Cases on Format Compatibility', () => {
    it('2.1 Rejects visual question if illustration theme is invalid/non-existent', () => {
      const q = {
        stem: '听句子选择图片。',
        options: ['A', 'B', 'C', 'D'],
        answer_idx: 0,
        skill: 'listening',
        part_type: 'listen_picture_match_4opt',
        illustration_theme: 'invalid_alien_spaceship_theme_xyz',
        options_images: [],
        level: 1,
        status: 'approved',
        is_active: 1,
      };

      const result = validateFormatCompatibility(q, 1);
      expect(result.exam_eligible).toBe(false);
      expect(result.ineligible_reasons).toContain('Dạng bài nhìn tranh thiếu chủ đề hình minh họa SVG hợp lệ');
    });

    it('2.2 Rejects listening question with empty stem and no audio source', () => {
      const q = {
        stem: '   ',
        options: ['A', 'B', 'C'],
        answer_idx: 0,
        skill: 'listening',
        part_type: 'listen_dialogue_qa_3opt',
        level: 2,
        status: 'approved',
        is_active: 1,
      };

      const result = validateFormatCompatibility(q, 2);
      expect(result.exam_eligible).toBe(false);
      expect(result.practice_eligible).toBe(false);
      expect(result.ineligible_reasons.some((r) => r.includes('stem') || r.includes('âm thanh'))).toBe(true);
    });

    it('2.3 Correctly handles JSON string options vs native array options', () => {
      const q = {
        stem: '他身体不太舒服，现在要去____看医生。',
        options: JSON.stringify(['医院', '商店', '学校', '机场']),
        answer_idx: 0,
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
        level: 1,
        status: 'approved',
        is_active: 1,
      };

      const result = validateFormatCompatibility(q, 1);
      expect(result.exam_eligible).toBe(true);
      expect(result.matched_blueprint_part).toBe('reading_3');
    });

    it('2.4 Rejects questions with out-of-bounds answer_idx', () => {
      const q = {
        stem: '他身体不太舒服，现在要去____看医生。',
        options: ['医院', '商店', '学校', '机场'],
        answer_idx: 4, // out of range (length is 4, valid indices 0..3)
        skill: 'reading',
        part_type: 'read_fill_blank_4opt',
        level: 1,
        status: 'approved',
        is_active: 1,
      };

      const result = validateFormatCompatibility(q, 1);
      expect(result.practice_eligible).toBe(false);
      expect(result.exam_eligible).toBe(false);
      expect(result.ineligible_reasons).toContain('Chỉ số đáp án đúng (answer_index) không hợp lệ');
    });

    it('2.5 Rejects fill_blank question with only 2 options against 6-option word-bank part', () => {
      const q = {
        stem: '他身体不太舒服，现在要去____看医生。',
        options: ['医院', '商店'],
        answer_idx: 0,
        skill: 'reading',
        part_type: 'read_fill_blank_word_bank_6opt',
        level: 1,
        status: 'approved',
        is_active: 1,
      };

      const result = validateFormatCompatibility(q, 1);
      expect(result.exam_eligible).toBe(false);
      expect(result.ineligible_reasons.some((r) => r.includes('yêu cầu chính xác 6 phương án'))).toBe(true);
    });

    it('2.6 Supports open-ended writing tasks in HSK 4-6 with 0 options', () => {
      const qWriting = {
        stem: '请结合所给词语写一篇80字左右的短文：成功、坚持、努力。',
        options: [],
        answer_idx: 0,
        skill: 'writing',
        part_type: 'write_short_essay_80chars',
        level: 4,
        status: 'approved',
        is_active: 1,
      };

      const result = validateFormatCompatibility(qWriting, 4);
      expect(result.practice_eligible).toBe(true);
      expect(result.exam_eligible).toBe(true);
      expect(result.matched_blueprint_part).toBe('writing_2');
    });
  });

  // =========================================================================
  // SECTION 3: IN-MEMORY DATABASE RE-EVALUATION WITH ORPHAN PURGE
  // =========================================================================
  describe('3. In-Memory Database reEvaluateApprovedQuestions Stress Test', () => {
    it('3.1 Accurately evaluates approved, pending, inactive, and deleted questions; purges orphaned pool rows', () => {
      const memDb = new DatabaseSync(':memory:');
      ensureEligiblePoolSchema(memDb);

      // Create questions table schema mirroring operational database
      memDb.exec(`
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

        CREATE TABLE IF NOT EXISTS pending_questions (
          id TEXT PRIMARY KEY,
          level INTEGER NOT NULL,
          skill TEXT NOT NULL,
          part_type TEXT NOT NULL,
          stem TEXT NOT NULL,
          options TEXT,
          answer_idx INTEGER,
          status TEXT DEFAULT 'pending'
        );
      `);

      // 1. Seed 3 Active Approved Compatible questions
      memDb.prepare(`
        INSERT INTO questions (id, level, skill, part_type, stem, options, answer_idx, illustration_theme, status, is_active)
        VALUES 
          ('q_app_fill_1', 1, 'reading', 'read_fill_blank_4opt', 'Stem 1 ____', '["A","B","C","D"]', 0, NULL, 'approved', 1),
          ('q_app_pic_1', 1, 'listening', 'listen_picture_match_4opt', 'Stem 2 听力', '["A","B","C","D"]', 0, 'taxi', 'approved', 1),
          ('q_app_comp_1', 1, 'reading', 'read_comprehension_4opt', 'Stem 3 阅读理解', '["A","B","C","D"]', 0, NULL, 'approved', 1);
      `).run();

      // 2. Seed 1 Active Approved Incompatible question (listen_fill_blank_4opt in HSK 2)
      memDb.prepare(`
        INSERT INTO questions (id, level, skill, part_type, stem, options, answer_idx, illustration_theme, status, is_active)
        VALUES ('q_app_incomp_2', 2, 'listening', 'listen_fill_blank_4opt', 'Stem 4 ____', '["A","B","C","D"]', 0, 'running', 'approved', 1);
      `).run();

      // 3. Seed 1 Inactive Approved question (is_active = 0)
      memDb.prepare(`
        INSERT INTO questions (id, level, skill, part_type, stem, options, answer_idx, status, is_active)
        VALUES ('q_inactive_1', 1, 'reading', 'read_fill_blank_4opt', 'Inactive stem', '["A","B","C","D"]', 0, 'approved', 0);
      `).run();

      // 4. Seed 1 Rejected question (status = 'rejected')
      memDb.prepare(`
        INSERT INTO questions (id, level, skill, part_type, stem, options, answer_idx, status, is_active)
        VALUES ('q_rejected_1', 1, 'reading', 'read_fill_blank_4opt', 'Rejected stem', '["A","B","C","D"]', 0, 'rejected', 1);
      `).run();

      // 5. Seed 1 Pending question in questions table (status = 'pending')
      memDb.prepare(`
        INSERT INTO questions (id, level, skill, part_type, stem, options, answer_idx, status, is_active)
        VALUES ('q_pending_table', 1, 'reading', 'read_fill_blank_4opt', 'Pending in questions', '["A","B","C","D"]', 0, 'pending', 1);
      `).run();

      // 6. Seed 1 Pending question in pending_questions table
      memDb.prepare(`
        INSERT INTO pending_questions (id, level, skill, part_type, stem, options, answer_idx, status)
        VALUES ('q_pending_queue', 1, 'reading', 'read_fill_blank_4opt', 'Pending in queue', '["A","B","C","D"]', 0, 'pending');
      `).run();

      // 7. Pre-populate exam_eligible_pool with orphaned records:
      // - One from a deleted question ('q_deleted_orphan')
      // - One from the inactive question ('q_inactive_1')
      // - One from the rejected question ('q_rejected_1')
      memDb.prepare(`
        INSERT INTO exam_eligible_pool (question_id, level, skill, part_type, stem, practice_eligible, exam_eligible)
        VALUES 
          ('q_deleted_orphan', 1, 'reading', 'read_fill_blank_4opt', 'Old deleted stem', 1, 0),
          ('q_inactive_1', 1, 'reading', 'read_fill_blank_4opt', 'Inactive stem in pool', 1, 0),
          ('q_rejected_1', 1, 'reading', 'read_fill_blank_4opt', 'Rejected stem in pool', 1, 0);
      `).run();

      const initialPoolRows: any[] = memDb.prepare('SELECT question_id FROM exam_eligible_pool').all();
      expect(initialPoolRows).toHaveLength(3);

      // Execute reEvaluateApprovedQuestions
      const summary = reEvaluateApprovedQuestions(memDb);

      // Verify returned summary metrics
      expect(summary.total).toBe(4); // 3 compatible + 1 incompatible = 4 active approved
      expect(summary.practice_eligible_count).toBe(4); // All 4 active approved are practice eligible
      expect(summary.exam_eligible_count).toBe(3); // 3 compatible questions
      expect(summary.still_ineligible_count).toBe(1); // 1 incompatible question
      expect(summary.reasons_recorded_count).toBe(1); // Exactly 1 question has reasons recorded

      // Inspect exam_eligible_pool table after re-evaluation
      const finalPoolRows: any[] = memDb.prepare(`
        SELECT question_id, level, skill, part_type, practice_eligible, exam_eligible, ineligible_reasons
        FROM exam_eligible_pool
        ORDER BY question_id ASC
      `).all();

      // Exactly 4 rows should exist in the pool
      expect(finalPoolRows).toHaveLength(4);

      const poolMap = new Map(finalPoolRows.map((r) => [r.question_id, r]));

      // 1. Verify all 3 compatible questions are practice_eligible = 1 and exam_eligible = 1
      const qFill = poolMap.get('q_app_fill_1');
      expect(qFill).toBeDefined();
      expect(qFill.practice_eligible).toBe(1);
      expect(qFill.exam_eligible).toBe(1);

      const qPic = poolMap.get('q_app_pic_1');
      expect(qPic).toBeDefined();
      expect(qPic.practice_eligible).toBe(1);
      expect(qPic.exam_eligible).toBe(1);

      const qComp = poolMap.get('q_app_comp_1');
      expect(qComp).toBeDefined();
      expect(qComp.practice_eligible).toBe(1);
      expect(qComp.exam_eligible).toBe(1);

      // 2. Verify incompatible question has practice_eligible = 1, exam_eligible = 0, and explicit diagnostic reason
      const qIncomp = poolMap.get('q_app_incomp_2');
      expect(qIncomp).toBeDefined();
      expect(qIncomp.practice_eligible).toBe(1);
      expect(qIncomp.exam_eligible).toBe(0);
      expect(qIncomp.ineligible_reasons).toContain('Loại bài listen_fill_blank_4opt không thuộc bất kỳ phần nào trong blueprint HSK 2');

      // 3. Verify ALL orphaned and non-approved questions were completely purged
      expect(poolMap.has('q_deleted_orphan')).toBe(false);
      expect(poolMap.has('q_inactive_1')).toBe(false);
      expect(poolMap.has('q_rejected_1')).toBe(false);
      expect(poolMap.has('q_pending_table')).toBe(false);
      expect(poolMap.has('q_pending_queue')).toBe(false);

      memDb.close();
    });

    it('3.2 Re-evaluation is strictly idempotent across consecutive invocations', () => {
      const memDb = new DatabaseSync(':memory:');
      ensureEligiblePoolSchema(memDb);

      memDb.exec(`
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

      for (let i = 1; i <= 10; i++) {
        memDb.prepare(`
          INSERT INTO questions (id, level, skill, part_type, stem, options, answer_idx, status, is_active)
          VALUES (?, 1, 'reading', 'read_fill_blank_4opt', 'Stem ' || ?, '["A","B","C","D"]', 0, 'approved', 1)
        `).run(`q_idempotent_${i}`, i);
      }

      // First run
      const res1 = reEvaluateApprovedQuestions(memDb);
      expect(res1.total).toBe(10);
      expect(res1.exam_eligible_count).toBe(10);

      const count1: any = memDb.prepare('SELECT COUNT(*) as cnt FROM exam_eligible_pool').get();
      expect(count1.cnt).toBe(10);

      // Second run
      const res2 = reEvaluateApprovedQuestions(memDb);
      expect(res2.total).toBe(10);
      expect(res2.exam_eligible_count).toBe(10);

      const count2: any = memDb.prepare('SELECT COUNT(*) as cnt FROM exam_eligible_pool').get();
      expect(count2.cnt).toBe(10);

      memDb.close();
    });

    it('3.3 Transaction rollback works properly when an error interrupts re-evaluation', () => {
      const memDb = new DatabaseSync(':memory:');
      ensureEligiblePoolSchema(memDb);

      memDb.exec(`
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

      memDb.prepare(`
        INSERT INTO questions (id, level, skill, part_type, stem, options, answer_idx, status, is_active)
        VALUES ('q_valid_1', 1, 'reading', 'read_fill_blank_4opt', 'Stem 1', '["A","B","C","D"]', 0, 'approved', 1),
               ('q_valid_2', 1, 'reading', 'read_fill_blank_4opt', 'Stem 2', '["A","B","C","D"]', 0, 'approved', 1);
      `).run();

      // Pre-seed an initial state
      reEvaluateApprovedQuestions(memDb);
      const preCount: any = memDb.prepare('SELECT COUNT(*) as cnt FROM exam_eligible_pool').get();
      expect(preCount.cnt).toBe(2);

      // Insert an abort trigger on UPDATE to simulate an unexpected mid-transaction crash
      memDb.exec(`
        CREATE TRIGGER abort_on_update BEFORE UPDATE ON exam_eligible_pool
        BEGIN
          SELECT RAISE(ABORT, 'Simulated mid-transaction DB failure');
        END;
      `);

      expect(() => reEvaluateApprovedQuestions(memDb)).toThrow('Simulated mid-transaction DB failure');

      // The pre-existing rows are still intact thanks to rollback
      const postCount: any = memDb.prepare('SELECT COUNT(*) as cnt FROM exam_eligible_pool').get();
      expect(postCount.cnt).toBe(2);

      memDb.close();
    });
  });

  // =========================================================================
  // SECTION 4: INTEGRATION WITH EXAM BLUEPRINT SECTION INSPECTION
  // =========================================================================
  describe('4. Blueprint Section Pool Integration with Compatible Formats', () => {
    it('4.1 inspectExamPoolBySections properly maps 4-option questions to fulfill HSK 1 Reading Part 3 quota', () => {
      const memDb = new DatabaseSync(':memory:');
      ensureEligiblePoolSchema(memDb);

      memDb.exec(`
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

      // Seed 5 questions of read_fill_blank_4opt
      for (let i = 1; i <= 5; i++) {
        const id = `q_reading3_${i}`;
        memDb.prepare(`
          INSERT INTO questions (id, level, skill, part_type, stem, options, answer_idx, status, is_active)
          VALUES (?, 1, 'reading', 'read_fill_blank_4opt', 'Stem ' || ?, '["A","B","C","D"]', 0, 'approved', 1)
        `).run(id, i);
      }

      // Run re-evaluation
      reEvaluateApprovedQuestions(memDb);

      // Inspect HSK 1 pool
      const inspection = inspectExamPoolBySections(memDb, 1);
      expect(inspection.blueprintFound).toBe(true);

      const reading3 = inspection.sections.reading.parts.find((p) => p.partKey === 'reading_3');
      expect(reading3).toBeDefined();
      expect(reading3!.partType).toBe('read_fill_blank_word_bank_6opt');
      expect(reading3!.nQuestionsRequired).toBe(5);
      expect(reading3!.nAvailable).toBe(5);
      expect(reading3!.nMissing).toBe(0);

      memDb.close();
    });
  });
});
