import { describe, it, expect } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import {
  validateFormatCompatibility,
  reEvaluateApprovedQuestions,
  ensureEligiblePoolSchema,
  syncApprovedQuestion,
} from '../src/server/qbankFormatSync.js';

describe('Challenger M2-it2: Adversarial Audio Permutations & Transaction Verification', () => {
  // ---------------------------------------------------------------------------
  // 1. ALL AUDIO FALLBACK PERMUTATIONS FOR LISTENING QUESTIONS
  // ---------------------------------------------------------------------------
  describe('1. Audio Fallback Permutations for Listening Questions', () => {
    const baseListeningQuestion = {
      level: 2,
      skill: 'listening',
      part_type: 'listen_dialogue_qa_3opt',
      options: ['去学校', '去医院', '去超市'],
      answer_idx: 0,
      status: 'approved',
      is_active: 1,
    };

    it('1.1 Permutation A: Empty stem + no audio -> records both stem too short and missing audio reasons', () => {
      const q = {
        ...baseListeningQuestion,
        stem: '', // empty stem
        // no audio_text, audio_url, audio_playback
      };

      const result = validateFormatCompatibility(q, 2);

      // Verify structural failure
      expect(result.practice_format_compatible).toBe(false);
      expect(result.practice_eligible).toBe(false);
      expect(result.exam_format_compatible).toBe(false);
      expect(result.exam_eligible).toBe(false);

      // Verify BOTH diagnostic reasons are present
      expect(
        result.ineligible_reasons.some((r) =>
          r.includes('Nội dung câu hỏi (stem) quá ngắn hoặc trống')
        )
      ).toBe(true);
      expect(
        result.ineligible_reasons.some((r) =>
          r.includes('Câu hỏi nghe thiếu tài nguyên văn bản âm thanh (audio_text hoặc stem)')
        )
      ).toBe(true);

      // Verify whitespace-only stem also fails both
      const qWhitespace = {
        ...baseListeningQuestion,
        stem: '   ',
      };
      const resWhitespace = validateFormatCompatibility(qWhitespace, 2);
      expect(
        resWhitespace.ineligible_reasons.some((r) =>
          r.includes('Nội dung câu hỏi (stem) quá ngắn hoặc trống')
        )
      ).toBe(true);
      expect(
        resWhitespace.ineligible_reasons.some((r) =>
          r.includes('Câu hỏi nghe thiếu tài nguyên văn bản âm thanh (audio_text hoặc stem)')
        )
      ).toBe(true);
    });

    it('1.2 Permutation B: Valid stem + no audio -> accepted (stem treated as audio text)', () => {
      const q = {
        ...baseListeningQuestion,
        stem: '明天下午你打算做什么？', // Valid stem >= 2 chars
        // no audio_text, audio_url, audio_playback
      };

      const result = validateFormatCompatibility(q, 2);

      // Verify structural and operational success
      expect(result.practice_format_compatible).toBe(true);
      expect(result.practice_eligible).toBe(true);
      expect(result.exam_format_compatible).toBe(true);
      expect(result.exam_eligible).toBe(true);
      expect(result.matched_blueprint_part).toBe('listening_3');

      // Neither failure reason should be recorded
      expect(
        result.ineligible_reasons.some((r) =>
          r.includes('Nội dung câu hỏi (stem) quá ngắn hoặc trống')
        )
      ).toBe(false);
      expect(
        result.ineligible_reasons.some((r) =>
          r.includes('Câu hỏi nghe thiếu tài nguyên văn bản âm thanh (audio_text hoặc stem)')
        )
      ).toBe(false);
      expect(result.ineligible_reasons).toHaveLength(0);
    });

    it('1.3 Permutation C: Empty stem + audio_text present -> stem too short recorded, but NOT missing audio reason', () => {
      const q = {
        ...baseListeningQuestion,
        stem: '', // empty stem
        audio_text: '男：你明天几点去学校？女：八点。',
      };

      const result = validateFormatCompatibility(q, 2);

      // Format is broken due to empty stem
      expect(result.practice_format_compatible).toBe(false);
      expect(result.practice_eligible).toBe(false);
      expect(result.exam_eligible).toBe(false);

      // MUST record stem too short
      expect(
        result.ineligible_reasons.some((r) =>
          r.includes('Nội dung câu hỏi (stem) quá ngắn hoặc trống')
        )
      ).toBe(true);

      // MUST NOT record missing audio reason (because audio_text is present)
      expect(
        result.ineligible_reasons.some((r) =>
          r.includes('Câu hỏi nghe thiếu tài nguyên văn bản âm thanh (audio_text hoặc stem)')
        )
      ).toBe(false);
    });

    it('1.4 Permutation D: Empty stem + audio_url present -> stem too short recorded, but NOT missing audio reason', () => {
      const q = {
        ...baseListeningQuestion,
        stem: '', // empty stem
        audio_url: 'https://cdn.minnese.com/audio/hsk2/dialogue_01.mp3',
      };

      const result = validateFormatCompatibility(q, 2);

      // Format is broken due to empty stem
      expect(result.practice_format_compatible).toBe(false);
      expect(result.practice_eligible).toBe(false);
      expect(result.exam_eligible).toBe(false);

      // MUST record stem too short
      expect(
        result.ineligible_reasons.some((r) =>
          r.includes('Nội dung câu hỏi (stem) quá ngắn hoặc trống')
        )
      ).toBe(true);

      // MUST NOT record missing audio reason (because audio_url is present)
      expect(
        result.ineligible_reasons.some((r) =>
          r.includes('Câu hỏi nghe thiếu tài nguyên văn bản âm thanh (audio_text hoặc stem)')
        )
      ).toBe(false);
    });

    it('1.5 Permutation E (Bonus): Empty stem + audio_playback present -> stem too short recorded, but NOT missing audio reason', () => {
      const q = {
        ...baseListeningQuestion,
        stem: '',
        audio_playback: { url: 'data:audio/mp3;base64,...', duration_seconds: 4 },
      };

      const result = validateFormatCompatibility(q, 2);

      expect(result.practice_format_compatible).toBe(false);
      expect(
        result.ineligible_reasons.some((r) =>
          r.includes('Nội dung câu hỏi (stem) quá ngắn hoặc trống')
        )
      ).toBe(true);
      expect(
        result.ineligible_reasons.some((r) =>
          r.includes('Câu hỏi nghe thiếu tài nguyên văn bản âm thanh (audio_text hoặc stem)')
        )
      ).toBe(false);
    });

    it('1.6 Single-character stem ("好") -> stem too short (<2 chars) AND missing audio recorded when no explicit audio', () => {
      const qSingleChar = {
        ...baseListeningQuestion,
        stem: '好', // single char -> length 1 < 2
      };

      const result = validateFormatCompatibility(qSingleChar, 2);
      expect(result.practice_format_compatible).toBe(false);
      expect(
        result.ineligible_reasons.some((r) =>
          r.includes('Nội dung câu hỏi (stem) quá ngắn hoặc trống')
        )
      ).toBe(true);
      expect(
        result.ineligible_reasons.some((r) =>
          r.includes('Câu hỏi nghe thiếu tài nguyên văn bản âm thanh (audio_text hoặc stem)')
        )
      ).toBe(true);
    });

    it('1.7 Falsy/Empty audio fields (empty string, null) -> treated as absent audio resource', () => {
      const qEmptyFields = {
        ...baseListeningQuestion,
        stem: '',
        audio_text: '',
        audio_url: '',
        audio_playback: null,
      };

      const result = validateFormatCompatibility(qEmptyFields, 2);
      expect(
        result.ineligible_reasons.some((r) =>
          r.includes('Nội dung câu hỏi (stem) quá ngắn hoặc trống')
        )
      ).toBe(true);
      expect(
        result.ineligible_reasons.some((r) =>
          r.includes('Câu hỏi nghe thiếu tài nguyên văn bản âm thanh (audio_text hoặc stem)')
        )
      ).toBe(true);
    });

    it('1.8 Non-listening skill (reading) with empty stem -> stem too short recorded, but NOT missing audio reason', () => {
      const qReading = {
        level: 2,
        skill: 'reading',
        part_type: 'read_dialogue_qa_3opt',
        stem: '',
        options: ['苹果', '香蕉', '西瓜'],
        answer_idx: 0,
        status: 'approved',
      };

      const result = validateFormatCompatibility(qReading, 2);
      expect(
        result.ineligible_reasons.some((r) =>
          r.includes('Nội dung câu hỏi (stem) quá ngắn hoặc trống')
        )
      ).toBe(true);
      expect(
        result.ineligible_reasons.some((r) =>
          r.includes('Câu hỏi nghe thiếu tài nguyên văn bản âm thanh (audio_text hoặc stem)')
        )
      ).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. TRANSACTIONAL ROLLBACK AND ORPHAN CLEANUP IN reEvaluateApprovedQuestions(db)
  // ---------------------------------------------------------------------------
  describe('2. Transactional Rollback & Orphan Cleanup in reEvaluateApprovedQuestions(db)', () => {
    function createTestDatabase(): DatabaseSync {
      const db = new DatabaseSync(':memory:');
      db.exec(`
        CREATE TABLE IF NOT EXISTS questions (
          id TEXT PRIMARY KEY,
          level INTEGER NOT NULL,
          skill TEXT NOT NULL,
          part_type TEXT NOT NULL,
          stem TEXT NOT NULL,
          options TEXT NOT NULL,
          answer_idx INTEGER NOT NULL,
          status TEXT NOT NULL DEFAULT 'approved',
          is_active INTEGER NOT NULL DEFAULT 1,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      ensureEligiblePoolSchema(db);
      return db;
    }

    it('2.1 Transactional Rollback: re-evaluation aborts cleanly and rolls back on unhandled error', () => {
      const db = createTestDatabase();

      // Insert 3 questions into questions table
      db.prepare(`
        INSERT INTO questions (id, level, skill, part_type, stem, options, answer_idx, status, is_active)
        VALUES 
          ('q_rb_1', 2, 'listening', 'listen_dialogue_qa_3opt', '你喝茶吗？', '["喝","不喝","没有"]', 0, 'approved', 1),
          ('q_rb_2', 2, 'listening', 'listen_dialogue_qa_3opt', '你去哪儿？', '["学校","医院","商店"]', 0, 'approved', 1),
          ('q_rb_3', 2, 'listening', 'listen_dialogue_qa_3opt', '几点了？', '["三点","四点","五点"]', 0, 'approved', 1);
      `).run();

      // Seed exam_eligible_pool with baseline pre-existing records
      db.prepare(`
        INSERT INTO exam_eligible_pool (
          question_id, level, skill, part_type, stem, practice_eligible, exam_eligible, compatible_formats, ineligible_reasons
        ) VALUES 
          ('q_rb_1', 2, 'listening', 'listen_dialogue_qa_3opt', 'ORIGINAL_STEM_1', 0, 0, '["old_format"]', '["initial_reason"]'),
          ('q_rb_existing_orphan', 1, 'reading', 'read_fill_blank_word_bank_6opt', 'ORPHAN_STEM', 1, 1, '["old"]', '[]');
      `).run();

      // Check initial count
      const preCount = db.prepare('SELECT COUNT(*) as cnt FROM exam_eligible_pool').get() as any;
      expect(preCount.cnt).toBe(2);

      // Install a SQLite trigger that forces an error when q_rb_3 is inserted/updated in exam_eligible_pool
      db.exec(`
        CREATE TRIGGER test_rollback_trigger
        BEFORE INSERT ON exam_eligible_pool
        FOR EACH ROW
        WHEN NEW.question_id = 'q_rb_3'
        BEGIN
          SELECT RAISE(ABORT, 'Simulated fatal DB error during re-evaluation on q_rb_3');
        END;
      `);

      // Execute reEvaluateApprovedQuestions and verify it throws
      expect(() => {
        reEvaluateApprovedQuestions(db);
      }).toThrow(/Simulated fatal DB error during re-evaluation on q_rb_3/);

      // Verify that after rollback:
      // 1. The transaction was aborted
      // 2. The pool retains EXACT baseline state
      const postRows = db.prepare('SELECT question_id, stem, practice_eligible, exam_eligible FROM exam_eligible_pool ORDER BY question_id ASC').all() as any[];
      expect(postRows).toHaveLength(2);

      const q1 = postRows.find((r) => r.question_id === 'q_rb_1');
      expect(q1).toBeDefined();
      expect(q1.stem).toBe('ORIGINAL_STEM_1'); // NOT overwritten by '你喝茶吗？'
      expect(q1.practice_eligible).toBe(0); // NOT upgraded to 1
      expect(q1.exam_eligible).toBe(0); // NOT upgraded to 1

      const orphan = postRows.find((r) => r.question_id === 'q_rb_existing_orphan');
      expect(orphan).toBeDefined(); // Orphan was NOT deleted because transaction rolled back!
    });

    it('2.2 Orphan Cleanup: removes deleted, rejected, pending, deactivated, and untracked questions from exam_eligible_pool', () => {
      const db = createTestDatabase();

      // Setup 5 questions in questions table:
      // - q_live_1: approved, active = 1 (should stay)
      // - q_live_2: approved, active = 1 (should stay)
      // - q_rejected: status = 'rejected', active = 1 (should be purged from pool)
      // - q_pending: status = 'pending', active = 1 (should be purged from pool)
      // - q_deactivated: status = 'approved', active = 0 (should be purged from pool)
      db.prepare(`
        INSERT INTO questions (id, level, skill, part_type, stem, options, answer_idx, status, is_active)
        VALUES 
          ('q_live_1', 2, 'listening', 'listen_dialogue_qa_3opt', '你喝茶吗？', '["喝","不喝","没有"]', 0, 'approved', 1),
          ('q_live_2', 2, 'listening', 'listen_dialogue_qa_3opt', '你去哪儿？', '["学校","医院","商店"]', 0, 'approved', 1),
          ('q_rejected', 2, 'listening', 'listen_dialogue_qa_3opt', '这是什么？', '["书","笔","纸"]', 0, 'rejected', 1),
          ('q_pending', 2, 'listening', 'listen_dialogue_qa_3opt', '那是谁？', '["老师","学生","医生"]', 0, 'pending', 1),
          ('q_deactivated', 2, 'listening', 'listen_dialogue_qa_3opt', '他在哪儿？', '["家","学校","饭馆"]', 0, 'approved', 0);
      `).run();

      // Populate exam_eligible_pool with 6 items:
      // 1. q_live_1
      // 2. q_live_2
      // 3. q_rejected (orphan because status != approved)
      // 4. q_pending (orphan because status != approved)
      // 5. q_deactivated (orphan because is_active = 0)
      // 6. q_deleted_orphan (orphan because completely missing from questions)
      db.prepare(`
        INSERT INTO exam_eligible_pool (question_id, level, skill, part_type, stem, practice_eligible, exam_eligible)
        VALUES 
          ('q_live_1', 2, 'listening', 'listen_dialogue_qa_3opt', 'stem1', 1, 1),
          ('q_live_2', 2, 'listening', 'listen_dialogue_qa_3opt', 'stem2', 1, 1),
          ('q_rejected', 2, 'listening', 'listen_dialogue_qa_3opt', 'stem_rej', 1, 1),
          ('q_pending', 2, 'listening', 'listen_dialogue_qa_3opt', 'stem_pend', 1, 1),
          ('q_deactivated', 2, 'listening', 'listen_dialogue_qa_3opt', 'stem_deact', 1, 1),
          ('q_deleted_orphan', 2, 'listening', 'listen_dialogue_qa_3opt', 'stem_del', 1, 1);
      `).run();

      const preCount = db.prepare('SELECT COUNT(*) as cnt FROM exam_eligible_pool').get() as any;
      expect(preCount.cnt).toBe(6);

      // Run reEvaluateApprovedQuestions
      const result = reEvaluateApprovedQuestions(db);

      // Check return summary
      expect(result.total).toBe(2); // Only 2 approved active questions in questions table
      expect(result.practice_eligible_count).toBe(2);
      expect(result.exam_eligible_count).toBe(2);

      // Query exam_eligible_pool after re-evaluation
      const poolRows = db.prepare('SELECT question_id FROM exam_eligible_pool ORDER BY question_id ASC').all() as any[];
      const poolIds = poolRows.map((r) => r.question_id);

      // Exactly q_live_1 and q_live_2 must remain
      expect(poolIds).toEqual(['q_live_1', 'q_live_2']);

      // All 4 orphan variants must be completely purged
      expect(poolIds.includes('q_rejected')).toBe(false);
      expect(poolIds.includes('q_pending')).toBe(false);
      expect(poolIds.includes('q_deactivated')).toBe(false);
      expect(poolIds.includes('q_deleted_orphan')).toBe(false);
    });

    it('2.3 Resilient Handling: corrupted question rows (invalid JSON) do not crash re-evaluation', () => {
      const db = createTestDatabase();

      db.prepare(`
        INSERT INTO questions (id, level, skill, part_type, stem, options, answer_idx, status, is_active)
        VALUES 
          ('q_corrupt_1', 2, 'listening', 'listen_dialogue_qa_3opt', '你喝茶吗？', 'INVALID_JSON{{{', 0, 'approved', 1),
          ('q_valid_1', 2, 'listening', 'listen_dialogue_qa_3opt', '你去哪儿？', '["学校","医院","商店"]', 0, 'approved', 1);
      `).run();

      const result = reEvaluateApprovedQuestions(db);
      expect(result.total).toBe(2);
      expect(result.practice_eligible_count).toBe(1); // Only q_valid_1
      expect(result.exam_eligible_count).toBe(1); // Only q_valid_1
      expect(result.reasons_recorded_count).toBe(1); // q_corrupt_1 recorded reasons
      expect(result.still_ineligible_count).toBe(1);

      // Check corrupted question recorded in pool as ineligible
      const corruptRow = db.prepare('SELECT * FROM exam_eligible_pool WHERE question_id = ?').get('q_corrupt_1') as any;
      expect(corruptRow).toBeDefined();
      expect(corruptRow.practice_eligible).toBe(0);
      expect(corruptRow.exam_eligible).toBe(0);
      expect(corruptRow.ineligible_reasons).toContain('Số lượng phương án trả lời phải từ 2 trở lên');
    });

    it('2.4 Idempotency: repeated execution maintains identical pool count and states', () => {
      const db = createTestDatabase();

      db.prepare(`
        INSERT INTO questions (id, level, skill, part_type, stem, options, answer_idx, status, is_active)
        VALUES 
          ('q_idem_1', 2, 'listening', 'listen_dialogue_qa_3opt', '今天星期几？', '["星期一","星期二","星期三"]', 0, 'approved', 1),
          ('q_idem_2', 1, 'reading', 'read_fill_blank_word_bank_6opt', '我喜欢喝____。', '["A","B","C","D","E","F"]', 0, 'approved', 1);
      `).run();

      const run1 = reEvaluateApprovedQuestions(db);
      expect(run1.total).toBe(2);
      expect(run1.practice_eligible_count).toBe(2);
      expect(run1.exam_eligible_count).toBe(2);

      const run2 = reEvaluateApprovedQuestions(db);
      expect(run2.total).toBe(2);
      expect(run2.practice_eligible_count).toBe(2);
      expect(run2.exam_eligible_count).toBe(2);

      const count = db.prepare('SELECT COUNT(*) as cnt FROM exam_eligible_pool').get() as any;
      expect(count.cnt).toBe(2);
    });
  });
});
