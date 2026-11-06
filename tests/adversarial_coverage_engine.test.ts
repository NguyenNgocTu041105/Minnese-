import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import {
  applyAdditiveQBankMigrations,
  classifyGroupStatus,
  computeContentHash,
  computeNearDuplicateSignature,
  getCoverageTargets,
  DEFAULT_COVERAGE_TARGETS,
  type GroupClassificationInput,
} from '../src/server/qbankCoverageEngine.js';

describe('Adversarial & Empirical Challenge Suite — Milestone 1', () => {
  describe('1. applyAdditiveQBankMigrations: Idempotency & Data Preservation', () => {
    let db: DatabaseSync;

    beforeEach(() => {
      db = new DatabaseSync(':memory:');
    });

    it('IDEMPOTENCY: should be callable 10 times consecutively without errors or schema duplication', () => {
      // 1st run on empty database
      expect(() => applyAdditiveQBankMigrations(db)).not.toThrow();

      // Consecutive 9 runs
      for (let i = 2; i <= 10; i++) {
        expect(() => applyAdditiveQBankMigrations(db)).not.toThrow();
      }

      // Check column counts and uniqueness
      const qCols = (db.prepare('PRAGMA table_info(questions)').all() as any[]).map((c) => c.name);
      const uniqueQCols = new Set(qCols);
      expect(qCols.length).toBe(uniqueQCols.size);
      expect(uniqueQCols).toContain('id');
      expect(uniqueQCols).toContain('stem');
      expect(uniqueQCols).toContain('content_hash');
      expect(uniqueQCols).toContain('near_duplicate_signature');
      expect(uniqueQCols).toContain('tested_vocab');
      expect(uniqueQCols).toContain('passage');
      expect(uniqueQCols).toContain('is_active');
      expect(uniqueQCols).toContain('rejection_note');
      expect(uniqueQCols).toContain('batch_id');

      const pCols = (db.prepare('PRAGMA table_info(pending_questions)').all() as any[]).map((c) => c.name);
      const uniquePCols = new Set(pCols);
      expect(pCols.length).toBe(uniquePCols.size);
      expect(uniquePCols).toContain('id');
      expect(uniquePCols).toContain('near_duplicate_signature');
      expect(uniquePCols).toContain('tested_vocab');
      expect(uniquePCols).toContain('passage');
      expect(uniquePCols).toContain('is_active');
    });

    it('DATA PRESERVATION: preserves all existing legacy rows and columns with zero data corruption', () => {
      // Set up legacy schema without new columns
      db.exec(`
        CREATE TABLE questions (
          id TEXT PRIMARY KEY,
          stem TEXT NOT NULL,
          options TEXT NOT NULL,
          answer_idx INTEGER NOT NULL,
          pinyin TEXT,
          explanation_vi TEXT NOT NULL,
          level INTEGER NOT NULL,
          skill TEXT NOT NULL,
          part_type TEXT NOT NULL,
          illustration_theme TEXT,
          topic TEXT,
          status TEXT NOT NULL DEFAULT 'approved',
          provider_used TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE pending_questions (
          id TEXT PRIMARY KEY,
          batch_id TEXT,
          stem TEXT NOT NULL,
          options TEXT NOT NULL,
          answer_idx INTEGER NOT NULL,
          pinyin TEXT,
          explanation_vi TEXT NOT NULL,
          level INTEGER NOT NULL,
          skill TEXT NOT NULL,
          part_type TEXT NOT NULL,
          illustration_theme TEXT,
          topic TEXT,
          status TEXT NOT NULL DEFAULT 'pending',
          provider_used TEXT,
          rejection_note TEXT,
          content_hash TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Seed diverse legacy data (including Chinese unicode, emojis, special characters, JSON arrays)
      const legacyQuestions = [
        {
          id: 'q_legacy_001',
          stem: '他每天早上都____步，身体特别健康。',
          options: JSON.stringify(['跑', '散', '跳', '走']),
          answer_idx: 1,
          pinyin: 'tā měi tiān zǎo shang dōu ____ bù',
          explanation_vi: 'Đáp án đúng là "散" trong từ ghép "散步" (đi dạo).',
          level: 2,
          skill: 'reading',
          part_type: 'read_fill_blank_choose_word',
          illustration_theme: 'morning_park',
          topic: 'health',
          status: 'approved',
          provider_used: 'manual_seed',
        },
        {
          id: 'q_legacy_002',
          stem: '桌子上放着三____书和两个苹果。🍎📚',
          options: JSON.stringify(['本', '张', '条', '个']),
          answer_idx: 0,
          pinyin: 'zhuō zi shang fàng zhe sān ____ shū',
          explanation_vi: 'Lượng từ của sách "书" là "本".',
          level: 1,
          skill: 'reading',
          part_type: 'read_fill_blank_choose_word',
          illustration_theme: 'desk_objects',
          topic: 'daily_life',
          status: 'approved',
          provider_used: 'legacy_seed',
        },
      ];

      const legacyPending = [
        {
          id: 'p_legacy_001',
          batch_id: 'batch_2026_01',
          stem: '听录音，判断句子正误。',
          options: JSON.stringify(['正确', '错误']),
          answer_idx: 0,
          pinyin: 'tīng lù yīn',
          explanation_vi: 'Nội dung hội thoại hoàn toàn khớp với câu nhận định.',
          level: 1,
          skill: 'listening',
          part_type: 'listen_true_false_picture',
          illustration_theme: 'audio_check',
          topic: 'school',
          status: 'pending',
          provider_used: 'deepseek_free',
          rejection_note: null,
          content_hash: 'pre_existing_hash_12345',
        },
      ];

      const insertQ = db.prepare(`
        INSERT INTO questions (id, stem, options, answer_idx, pinyin, explanation_vi, level, skill, part_type, illustration_theme, topic, status, provider_used)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const q of legacyQuestions) {
        insertQ.run(q.id, q.stem, q.options, q.answer_idx, q.pinyin, q.explanation_vi, q.level, q.skill, q.part_type, q.illustration_theme, q.topic, q.status, q.provider_used);
      }

      const insertP = db.prepare(`
        INSERT INTO pending_questions (id, batch_id, stem, options, answer_idx, pinyin, explanation_vi, level, skill, part_type, illustration_theme, topic, status, provider_used, rejection_note, content_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const p of legacyPending) {
        insertP.run(p.id, p.batch_id, p.stem, p.options, p.answer_idx, p.pinyin, p.explanation_vi, p.level, p.skill, p.part_type, p.illustration_theme, p.topic, p.status, p.provider_used, p.rejection_note, p.content_hash);
      }

      // Execute migration 3 times consecutively
      applyAdditiveQBankMigrations(db);
      applyAdditiveQBankMigrations(db);
      applyAdditiveQBankMigrations(db);

      // Verify questions legacy data preservation
      const rowsQ: any[] = db.prepare('SELECT * FROM questions ORDER BY id').all();
      expect(rowsQ.length).toBe(2);

      const q1 = rowsQ.find((r) => r.id === 'q_legacy_001');
      expect(q1.stem).toBe('他每天早上都____步，身体特别健康。');
      expect(q1.options).toBe(JSON.stringify(['跑', '散', '跳', '走']));
      expect(q1.answer_idx).toBe(1);
      expect(q1.pinyin).toBe('tā měi tiān zǎo shang dōu ____ bù');
      expect(q1.explanation_vi).toBe('Đáp án đúng là "散" trong từ ghép "散步" (đi dạo).');
      expect(q1.level).toBe(2);
      expect(q1.skill).toBe('reading');
      expect(q1.part_type).toBe('read_fill_blank_choose_word');
      expect(q1.illustration_theme).toBe('morning_park');
      expect(q1.topic).toBe('health');
      expect(q1.status).toBe('approved');
      expect(q1.provider_used).toBe('manual_seed');
      // Verify newly backfilled columns
      expect(q1.is_active).toBe(1);
      expect(typeof q1.content_hash).toBe('string');
      expect(q1.content_hash.length).toBe(64);
      expect(typeof q1.near_duplicate_signature).toBe('string');
      expect(q1.near_duplicate_signature.length).toBe(64);

      const q2 = rowsQ.find((r) => r.id === 'q_legacy_002');
      expect(q2.stem).toBe('桌子上放着三____书和两个苹果。🍎📚');
      expect(q2.is_active).toBe(1);

      // Verify pending_questions legacy data preservation
      const rowsP: any[] = db.prepare('SELECT * FROM pending_questions ORDER BY id').all();
      expect(rowsP.length).toBe(1);
      const p1 = rowsP[0];
      expect(p1.id).toBe('p_legacy_001');
      expect(p1.batch_id).toBe('batch_2026_01');
      expect(p1.stem).toBe('听录音，判断句子正误。');
      expect(p1.options).toBe(JSON.stringify(['正确', '错误']));
      expect(p1.answer_idx).toBe(0);
      expect(p1.status).toBe('pending');
      expect(p1.provider_used).toBe('deepseek_free');
      expect(p1.content_hash).toBe('pre_existing_hash_12345'); // Preserved original hash!
      expect(p1.is_active).toBe(1);
      expect(typeof p1.near_duplicate_signature).toBe('string');
      expect(p1.near_duplicate_signature.length).toBe(64);
    });

    it('CORRUPT DATA RESILIENCE: handles malformed options JSON without crashing migration', () => {
      db.exec(`
        CREATE TABLE questions (
          id TEXT PRIMARY KEY,
          stem TEXT NOT NULL,
          options TEXT NOT NULL,
          answer_idx INTEGER NOT NULL,
          level INTEGER NOT NULL,
          skill TEXT NOT NULL,
          part_type TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'approved'
        );
      `);

      // Insert row with corrupt non-JSON options
      db.prepare(`
        INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type)
        VALUES ('q_corrupt', 'Stem with malformed options', '{not valid json}', 0, 1, 'reading', 'pt1')
      `).run();

      expect(() => applyAdditiveQBankMigrations(db)).not.toThrow();

      const row: any = db.prepare('SELECT * FROM questions WHERE id = ?').get('q_corrupt');
      expect(row.is_active).toBe(1);
      expect(typeof row.content_hash).toBe('string');
      expect(typeof row.near_duplicate_signature).toBe('string');
    });

    it('EXISTING ACTIVE FLAG: does not override pre-existing is_active = 0 to 1', () => {
      db.exec(`
        CREATE TABLE questions (
          id TEXT PRIMARY KEY,
          stem TEXT NOT NULL,
          options TEXT NOT NULL,
          answer_idx INTEGER NOT NULL,
          level INTEGER NOT NULL,
          skill TEXT NOT NULL,
          part_type TEXT NOT NULL,
          is_active INTEGER NOT NULL DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'approved'
        );
      `);

      db.prepare(`
        INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, is_active)
        VALUES ('q_disabled', 'Disabled question', '["A","B"]', 0, 1, 'reading', 'pt1', 0)
      `).run();

      applyAdditiveQBankMigrations(db);

      const row: any = db.prepare('SELECT is_active FROM questions WHERE id = ?').get('q_disabled');
      expect(row.is_active).toBe(0); // Kept 0, did not overwrite!
    });

    it('BATCH BACKFILL: backfills 50 legacy rows without hash or signature cleanly', () => {
      db.exec(`
        CREATE TABLE questions (
          id TEXT PRIMARY KEY,
          stem TEXT NOT NULL,
          options TEXT NOT NULL,
          answer_idx INTEGER NOT NULL,
          level INTEGER NOT NULL,
          skill TEXT NOT NULL,
          part_type TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'approved'
        );
      `);

      const insertStmt = db.prepare(`
        INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type)
        VALUES (?, ?, ?, ?, 1, 'reading', 'pt1')
      `);

      for (let i = 1; i <= 50; i++) {
        insertStmt.run(
          `q_batch_${i}`,
          `Câu hỏi số ${i}: 这是第${i}个题目。`,
          JSON.stringify([`Đáp án A${i}`, `Đáp án B${i}`, `Đáp án C${i}`, `Đáp án D${i}`]),
          i % 4
        );
      }

      applyAdditiveQBankMigrations(db);

      const rows: any[] = db.prepare('SELECT id, content_hash, near_duplicate_signature, is_active FROM questions').all();
      expect(rows.length).toBe(50);
      for (const r of rows) {
        expect(r.is_active).toBe(1);
        expect(typeof r.content_hash).toBe('string');
        expect(r.content_hash.length).toBe(64);
        expect(typeof r.near_duplicate_signature).toBe('string');
        expect(r.near_duplicate_signature.length).toBe(64);
      }
    });
  });

  describe('2. classifyGroupStatus: Comprehensive Boundary & Adversarial Tests', () => {
    const basePartInput: GroupClassificationInput = {
      level: 1,
      skill: 'reading',
      part_type: 'read_sentence_picture_match_6opt',
      approvedCount: 0,
      pendingCount: 0,
      blueprintQuestionQuota: 5,
      uniqueTestedVocabCount: 0,
    };

    const baseSkillInput: GroupClassificationInput = {
      level: 2,
      skill: 'reading',
      approvedCount: 0,
      pendingCount: 0,
      blueprintQuestionQuota: 0,
    };

    // ------------------------------------------------------------------------
    // Status 1: blocked
    // ------------------------------------------------------------------------
    describe('Status: blocked', () => {
      it('blocks levels < 1 (e.g. 0, -1)', () => {
        const r0 = classifyGroupStatus({ ...basePartInput, level: 0 as any });
        expect(r0.status).toBe('blocked');
        expect(r0.blockedReason).toContain('ngoài phạm vi hỗ trợ');

        const rNeg = classifyGroupStatus({ ...basePartInput, level: -1 as any });
        expect(rNeg.status).toBe('blocked');
      });

      it('blocks levels > 6 (e.g. 7, 8, 9)', () => {
        const r7 = classifyGroupStatus({ ...basePartInput, level: 7 as any });
        expect(r7.status).toBe('blocked');
        expect(r7.blockedReason).toContain('ngoài phạm vi hỗ trợ');

        const r9 = classifyGroupStatus({ ...basePartInput, level: 9 as any });
        expect(r9.status).toBe('blocked');
      });

      it('blocks HSK 1 writing skill (case insensitive)', () => {
        const rLower = classifyGroupStatus({ ...basePartInput, level: 1, skill: 'writing' });
        expect(rLower.status).toBe('blocked');
        expect(rLower.blockedReason).toContain('HSK 1 không có phần thi Viết');

        const rUpper = classifyGroupStatus({ ...basePartInput, level: 1, skill: 'WRITING' });
        expect(rUpper.status).toBe('blocked');

        const rMixed = classifyGroupStatus({ ...basePartInput, level: 1, skill: 'Writing' });
        expect(rMixed.status).toBe('blocked');
      });

      it('blocks when isExplicitlyBlocked is true or blockedReason is present', () => {
        const rExplicit = classifyGroupStatus({
          ...basePartInput,
          isExplicitlyBlocked: true,
          blockedReason: 'Admin manually paused this part.',
        });
        expect(rExplicit.status).toBe('blocked');
        expect(rExplicit.blockedReason).toBe('Admin manually paused this part.');

        const rReasonOnly = classifyGroupStatus({
          ...basePartInput,
          blockedReason: 'Audio assets missing.',
        });
        expect(rReasonOnly.status).toBe('blocked');
        expect(rReasonOnly.blockedReason).toBe('Audio assets missing.');
      });

      it('blocks part-level when blueprintQuestionQuota <= 0', () => {
        const rQuotaZero = classifyGroupStatus({
          ...basePartInput,
          blueprintQuestionQuota: 0,
        });
        expect(rQuotaZero.status).toBe('blocked');
        expect(rQuotaZero.blockedReason).toContain('không tồn tại trong blueprint');

        const rQuotaNeg = classifyGroupStatus({
          ...basePartInput,
          blueprintQuestionQuota: -2,
        });
        expect(rQuotaNeg.status).toBe('blocked');
      });
    });

    // ------------------------------------------------------------------------
    // Status 2: no_data
    // ------------------------------------------------------------------------
    describe('Status: no_data', () => {
      it('returns no_data when approvedCount = 0 AND pendingCount = 0 (part level)', () => {
        const res = classifyGroupStatus({
          ...basePartInput,
          approvedCount: 0,
          pendingCount: 0,
        });
        expect(res.status).toBe('no_data');
        expect(res.deficit).toBe(30); // initialPartTypeTarget = 30
        expect(res.isExamReady).toBe(false);
      });

      it('returns no_data when approvedCount = 0 AND pendingCount = 0 (skill level)', () => {
        const res = classifyGroupStatus({
          ...baseSkillInput,
          approvedCount: 0,
          pendingCount: 0,
        });
        expect(res.status).toBe('no_data');
        expect(res.deficit).toBe(200); // initialSkillTarget = 200
        expect(res.isExamReady).toBe(false);
      });
    });

    // ------------------------------------------------------------------------
    // Status 3: accumulating
    // ------------------------------------------------------------------------
    describe('Status: accumulating', () => {
      it('returns accumulating when approvedCount = 0 but pendingCount > 0 (boundary pendingCount = 1)', () => {
        const res = classifyGroupStatus({
          ...basePartInput,
          approvedCount: 0,
          pendingCount: 1,
        });
        expect(res.status).toBe('accumulating');
        expect(res.deficit).toBe(30);
      });

      it('returns accumulating when approvedCount is 1..4 (< accumulatingThreshold 5)', () => {
        for (let approved = 1; approved <= 4; approved++) {
          const res = classifyGroupStatus({
            ...basePartInput,
            approvedCount: approved,
            pendingCount: 0,
          });
          expect(res.status).toBe('accumulating');
          expect(res.deficit).toBe(30 - approved);
        }
      });
    });

    // ------------------------------------------------------------------------
    // Status 4: below_quantity_target
    // ------------------------------------------------------------------------
    describe('Status: below_quantity_target', () => {
      it('returns below_quantity_target at boundaries 5 and 29 for part level (target = 30)', () => {
        // Boundary 5 (lowest boundary above accumulating)
        const res5 = classifyGroupStatus({
          ...basePartInput,
          approvedCount: 5,
          pendingCount: 0,
        });
        expect(res5.status).toBe('below_quantity_target');
        expect(res5.deficit).toBe(25);

        // Mid point 15
        const res15 = classifyGroupStatus({
          ...basePartInput,
          approvedCount: 15,
          pendingCount: 10,
        });
        expect(res15.status).toBe('below_quantity_target');
        expect(res15.deficit).toBe(15);

        // Boundary 29 (highest boundary below 30)
        const res29 = classifyGroupStatus({
          ...basePartInput,
          approvedCount: 29,
          pendingCount: 0,
        });
        expect(res29.status).toBe('below_quantity_target');
        expect(res29.deficit).toBe(1);
      });

      it('returns below_quantity_target at boundaries 5 and 199 for skill level (target = 200)', () => {
        const res5 = classifyGroupStatus({
          ...baseSkillInput,
          approvedCount: 5,
          pendingCount: 0,
        });
        expect(res5.status).toBe('below_quantity_target');
        expect(res5.deficit).toBe(195);

        const res199 = classifyGroupStatus({
          ...baseSkillInput,
          approvedCount: 199,
          pendingCount: 0,
        });
        expect(res199.status).toBe('below_quantity_target');
        expect(res199.deficit).toBe(1);
      });
    });

    // ------------------------------------------------------------------------
    // Status 5: quantity_met_lacks_diversity_or_types
    // ------------------------------------------------------------------------
    describe('Status: quantity_met_lacks_diversity_or_types', () => {
      it('part level: approvedCount >= 30 but uniqueTestedVocabCount < Math.ceil(30 * 0.40) = 12', () => {
        // Boundary 11 (one below minimum required 12)
        const res11 = classifyGroupStatus({
          ...basePartInput,
          approvedCount: 30,
          pendingCount: 0,
          uniqueTestedVocabCount: 11,
        });
        expect(res11.status).toBe('quantity_met_lacks_diversity_or_types');
        expect(res11.details).toContain('thiếu đa dạng từ vựng');

        // Boundary 0
        const res0 = classifyGroupStatus({
          ...basePartInput,
          approvedCount: 50,
          pendingCount: 0,
          uniqueTestedVocabCount: 0,
        });
        expect(res0.status).toBe('quantity_met_lacks_diversity_or_types');
      });

      it('skill level: approvedCount >= 200 but childParts has deficit', () => {
        const res = classifyGroupStatus({
          ...baseSkillInput,
          approvedCount: 220,
          pendingCount: 0,
          childParts: [
            { part_type: 'part_A', approvedCount: 35, target: 30 },
            { part_type: 'part_B', approvedCount: 20, target: 30 }, // Deficient!
          ],
        });
        expect(res.status).toBe('quantity_met_lacks_diversity_or_types');
        expect(res.details).toContain('thiếu dạng bài: part_B (20/30)');
      });
    });

    // ------------------------------------------------------------------------
    // Status 6: minimum_coverage_met
    // ------------------------------------------------------------------------
    describe('Status: minimum_coverage_met', () => {
      it('part level: meets target 30 and diversity (>= 12), but examSetsRequiredCount > approvedCount', () => {
        // If blueprintQuestionQuota = 15, examSetsRequiredCount = 15 * 3 = 45
        // At approvedCount = 30..44, target 30 is met, but exam ready (45) is not met
        const res30 = classifyGroupStatus({
          ...basePartInput,
          approvedCount: 30,
          pendingCount: 0,
          blueprintQuestionQuota: 15,
          uniqueTestedVocabCount: 15,
        });
        expect(res30.status).toBe('minimum_coverage_met');
        expect(res30.isExamReady).toBe(false);

        const res44 = classifyGroupStatus({
          ...basePartInput,
          approvedCount: 44,
          pendingCount: 0,
          blueprintQuestionQuota: 15,
          uniqueTestedVocabCount: 15,
        });
        expect(res44.status).toBe('minimum_coverage_met');
        expect(res44.isExamReady).toBe(false);
      });

      it('skill level: approvedCount between 200 and 499 with all childParts met', () => {
        // Boundary 200 (exact initialSkillTarget)
        const res200 = classifyGroupStatus({
          ...baseSkillInput,
          approvedCount: 200,
          pendingCount: 0,
          childParts: [
            { part_type: 'part_A', approvedCount: 100, target: 30 },
            { part_type: 'part_B', approvedCount: 100, target: 30 },
          ],
        });
        expect(res200.status).toBe('minimum_coverage_met');

        // Boundary 499 (one below extendedSkillTarget 500)
        const res499 = classifyGroupStatus({
          ...baseSkillInput,
          approvedCount: 499,
          pendingCount: 0,
          childParts: [
            { part_type: 'part_A', approvedCount: 250, target: 30 },
            { part_type: 'part_B', approvedCount: 249, target: 30 },
          ],
        });
        expect(res499.status).toBe('minimum_coverage_met');
      });
    });

    // ------------------------------------------------------------------------
    // Status 7: exam_ready
    // ------------------------------------------------------------------------
    describe('Status: exam_ready', () => {
      it('part level: approvedCount >= 30 AND approvedCount >= blueprintQuestionQuota * 3 (and < extended 75)', () => {
        // blueprintQuestionQuota = 5 => 3 sets = 15 questions.
        // approvedCount = 30 >= 30 and >= 15.
        const res30 = classifyGroupStatus({
          ...basePartInput,
          approvedCount: 30,
          pendingCount: 0,
          blueprintQuestionQuota: 5,
          uniqueTestedVocabCount: 15,
        });
        expect(res30.status).toBe('exam_ready');
        expect(res30.isExamReady).toBe(true);

        // Boundary 74 (highest value before extendedTarget 75)
        const res74 = classifyGroupStatus({
          ...basePartInput,
          approvedCount: 74,
          pendingCount: 0,
          blueprintQuestionQuota: 10, // 30 needed
          uniqueTestedVocabCount: 20,
        });
        expect(res74.status).toBe('exam_ready');
        expect(res74.isExamReady).toBe(true);
      });
    });

    // ------------------------------------------------------------------------
    // Status 8: extended_target_met
    // ------------------------------------------------------------------------
    describe('Status: extended_target_met', () => {
      it('part level: boundary 75 (extendedPartTypeTarget = 75)', () => {
        const res75 = classifyGroupStatus({
          ...basePartInput,
          approvedCount: 75,
          pendingCount: 0,
          blueprintQuestionQuota: 5,
          uniqueTestedVocabCount: 30,
        });
        expect(res75.status).toBe('extended_target_met');
        expect(res75.isExamReady).toBe(true);

        // Super saturated 200
        const res200 = classifyGroupStatus({
          ...basePartInput,
          approvedCount: 200,
          pendingCount: 0,
          blueprintQuestionQuota: 5,
          uniqueTestedVocabCount: 50,
        });
        expect(res200.status).toBe('extended_target_met');
      });

      it('skill level: boundary 500 (extendedSkillTarget = 500)', () => {
        const res500 = classifyGroupStatus({
          ...baseSkillInput,
          approvedCount: 500,
          pendingCount: 0,
          childParts: [
            { part_type: 'part_A', approvedCount: 250, target: 30 },
            { part_type: 'part_B', approvedCount: 250, target: 30 },
          ],
        });
        expect(res500.status).toBe('extended_target_met');

        // Super saturated 1000
        const res1000 = classifyGroupStatus({
          ...baseSkillInput,
          approvedCount: 1000,
          pendingCount: 0,
        });
        expect(res1000.status).toBe('extended_target_met');
      });
    });

    // ------------------------------------------------------------------------
    // Config Overrides & Edge Cases
    // ------------------------------------------------------------------------
    describe('Config overrides & edge cases', () => {
      it('respects custom targets passed via config override', () => {
        const customConfig = {
          initialPartTypeTarget: 50,
          extendedPartTypeTarget: 100,
          accumulatingThreshold: 10,
          minVocabDiversityRatio: 0.50,
        };

        // approved = 9 with accumulatingThreshold = 10 -> accumulating
        const res9 = classifyGroupStatus({
          ...basePartInput,
          approvedCount: 9,
          config: customConfig,
        });
        expect(res9.status).toBe('accumulating');

        // approved = 10 with target 50 -> below_quantity_target
        const res10 = classifyGroupStatus({
          ...basePartInput,
          approvedCount: 10,
          config: customConfig,
        });
        expect(res10.status).toBe('below_quantity_target');
        expect(res10.deficit).toBe(40);

        // approved = 50, uniqueTestedVocabCount = 24 (< 50 * 0.50 = 25) -> lacks diversity
        const res50 = classifyGroupStatus({
          ...basePartInput,
          approvedCount: 50,
          uniqueTestedVocabCount: 24,
          config: customConfig,
        });
        expect(res50.status).toBe('quantity_met_lacks_diversity_or_types');
      });

      it('LIFECYCLE PROGRESSION: verifies exact boundary transitions across all 8 statuses sequentially', () => {
        // We will simulate a part type transitioning from 0 questions to 100 questions
        // blueprintQuestionQuota = 15 => 3 exam sets need 45 questions. Target is 30. Extended is 75.
        const partQuota15: GroupClassificationInput = {
          level: 2,
          skill: 'reading',
          part_type: 'read_match',
          approvedCount: 0,
          pendingCount: 0,
          blueprintQuestionQuota: 15,
          uniqueTestedVocabCount: 0,
        };

        // 1. no_data: 0 approved, 0 pending
        expect(classifyGroupStatus({ ...partQuota15, approvedCount: 0, pendingCount: 0 }).status).toBe('no_data');

        // 2. accumulating: 0 approved, 1 pending
        expect(classifyGroupStatus({ ...partQuota15, approvedCount: 0, pendingCount: 1 }).status).toBe('accumulating');

        // 2b. accumulating: 1 approved (< 5)
        expect(classifyGroupStatus({ ...partQuota15, approvedCount: 1, pendingCount: 0 }).status).toBe('accumulating');

        // 2c. accumulating: 4 approved (< 5)
        expect(classifyGroupStatus({ ...partQuota15, approvedCount: 4, pendingCount: 0 }).status).toBe('accumulating');

        // 3. below_quantity_target: 5 approved (>= 5, < 30)
        expect(classifyGroupStatus({ ...partQuota15, approvedCount: 5, pendingCount: 0 }).status).toBe('below_quantity_target');

        // 3b. below_quantity_target: 29 approved (< 30)
        expect(classifyGroupStatus({ ...partQuota15, approvedCount: 29, pendingCount: 0 }).status).toBe('below_quantity_target');

        // 4. quantity_met_lacks_diversity_or_types: 30 approved, but vocab diversity < 12 (30 * 0.40)
        expect(classifyGroupStatus({ ...partQuota15, approvedCount: 30, uniqueTestedVocabCount: 11 }).status).toBe('quantity_met_lacks_diversity_or_types');

        // 5. minimum_coverage_met: 30 approved, vocab diversity >= 12, but < examSetsRequired (45)
        expect(classifyGroupStatus({ ...partQuota15, approvedCount: 30, uniqueTestedVocabCount: 12 }).status).toBe('minimum_coverage_met');

        // 5b. minimum_coverage_met: 44 approved, vocab diversity >= 12, but < examSetsRequired (45)
        expect(classifyGroupStatus({ ...partQuota15, approvedCount: 44, uniqueTestedVocabCount: 15 }).status).toBe('minimum_coverage_met');

        // 6. exam_ready: 45 approved (>= 45 exam sets count, and < 75 extended)
        expect(classifyGroupStatus({ ...partQuota15, approvedCount: 45, uniqueTestedVocabCount: 18 }).status).toBe('exam_ready');

        // 6b. exam_ready: 74 approved (< 75 extended)
        expect(classifyGroupStatus({ ...partQuota15, approvedCount: 74, uniqueTestedVocabCount: 25 }).status).toBe('exam_ready');

        // 7. extended_target_met: 75 approved (>= 75 extended target)
        expect(classifyGroupStatus({ ...partQuota15, approvedCount: 75, uniqueTestedVocabCount: 30 }).status).toBe('extended_target_met');

        // 8. blocked: blocked condition takes precedence at any count
        expect(classifyGroupStatus({ ...partQuota15, approvedCount: 75, isExplicitlyBlocked: true, blockedReason: 'Manually paused' }).status).toBe('blocked');
      });
    });
  });
});
