import { describe, it, expect } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import { syncApprovedQuestion, validateFormatCompatibility } from '../src/server/qbankFormatSync.js';
import { loadApprovedQuestionsFromDb } from '../src/server/examRoutes.js';

describe('Serving Distribution Safety & Invariant Verification', () => {
  it('strictly blocks pending or rejected questions from operational pool sync', () => {
    // Create an in-memory test database with required tables
    const db = new DatabaseSync(':memory:');
    db.exec(`
      CREATE TABLE IF NOT EXISTS questions (
        id TEXT PRIMARY KEY,
        stem TEXT NOT NULL,
        options TEXT NOT NULL,
        answer_idx INTEGER NOT NULL,
        level INTEGER NOT NULL,
        skill TEXT NOT NULL,
        part_type TEXT NOT NULL,
        status TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        explanation_vi TEXT
      );
      CREATE TABLE IF NOT EXISTS pending_questions (
        id TEXT PRIMARY KEY,
        stem TEXT NOT NULL,
        options TEXT NOT NULL,
        answer_idx INTEGER NOT NULL,
        level INTEGER NOT NULL,
        skill TEXT NOT NULL,
        part_type TEXT NOT NULL,
        status TEXT NOT NULL,
        is_active INTEGER DEFAULT 1
      );
      CREATE TABLE IF NOT EXISTS exam_eligible_pool (
        question_id TEXT PRIMARY KEY,
        level INTEGER NOT NULL,
        skill TEXT NOT NULL,
        part_type TEXT,
        stem TEXT,
        practice_eligible INTEGER DEFAULT 0,
        exam_eligible INTEGER DEFAULT 0,
        compatible_formats TEXT,
        ineligible_reasons TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Candidate that is structurally compatible with blueprint, but status is 'pending'
    const pendingQuestion = {
      id: 'pend_test_001',
      stem: '他每天都去学校____。',
      options: JSON.stringify(['学习', '苹果', '飞机', '医生']),
      answer_idx: 0,
      level: 1,
      skill: 'reading',
      part_type: 'read_fill_blank_4opt',
      status: 'pending', // NOT APPROVED
      is_active: 1,
    };

    db.prepare(`
      INSERT INTO pending_questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      pendingQuestion.id,
      pendingQuestion.stem,
      pendingQuestion.options,
      pendingQuestion.answer_idx,
      pendingQuestion.level,
      pendingQuestion.skill,
      pendingQuestion.part_type,
      pendingQuestion.status,
      pendingQuestion.is_active
    );

    // 1. Format check indicates structural compatibility
    const formatCheck = validateFormatCompatibility({
      ...pendingQuestion,
      options: ['学习', '苹果', '飞机', '医生'],
    }, 1);
    expect(formatCheck.practice_eligible).toBe(true);
    expect(formatCheck.blueprint_format_compatible).toBe(true);

    // 2. But when synchronizing, serving eligibility MUST be strictly FALSE
    const syncResult = syncApprovedQuestion(pendingQuestion.id, db);
    expect(syncResult).not.toBeNull();
    expect(syncResult!.practice_eligible).toBe(false);
    expect(syncResult!.exam_eligible).toBe(false);
    expect(syncResult!.ineligible_reasons.some((r) => r.includes("must be 'approved'"))).toBe(true);

    // 3. Verify in database table exam_eligible_pool
    const row = db.prepare('SELECT * FROM exam_eligible_pool WHERE question_id = ?').get('pend_test_001') as any;
    expect(row).toBeDefined();
    expect(row.practice_eligible).toBe(0);
    expect(row.exam_eligible).toBe(0);

    // 4. If status is rejected in questions table, must also be blocked
    db.prepare(`
      INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('rej_test_002', pendingQuestion.stem, pendingQuestion.options, 0, 1, 'reading', 'read_fill_blank_4opt', 'rejected', 1);

    const rejResult = syncApprovedQuestion('rej_test_002', db);
    expect(rejResult).not.toBeNull();
    expect(rejResult!.practice_eligible).toBe(false);
    expect(rejResult!.exam_eligible).toBe(false);

    // 5. If status is approved but is_active = 0, must also be blocked
    db.prepare(`
      INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('inact_test_003', pendingQuestion.stem, pendingQuestion.options, 0, 1, 'reading', 'read_fill_blank_4opt', 'approved', 0);

    const inactResult = syncApprovedQuestion('inact_test_003', db);
    expect(inactResult).not.toBeNull();
    expect(inactResult!.practice_eligible).toBe(false);
    expect(inactResult!.exam_eligible).toBe(false);

    // 6. Only status='approved' AND is_active=1 gets operational eligibility
    db.prepare(`
      INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('appr_test_004', pendingQuestion.stem, pendingQuestion.options, 0, 1, 'reading', 'read_fill_blank_4opt', 'approved', 1);

    const apprResult = syncApprovedQuestion('appr_test_004', db);
    expect(apprResult).not.toBeNull();
    expect(apprResult!.practice_eligible).toBe(true);

    db.close();
  });

  it('loadApprovedQuestionsFromDb never returns pending questions or inactive questions', () => {
    const db = new DatabaseSync(':memory:');
    db.exec(`
      CREATE TABLE IF NOT EXISTS questions (
        id TEXT PRIMARY KEY,
        stem TEXT NOT NULL,
        options TEXT NOT NULL,
        answer_idx INTEGER NOT NULL,
        level INTEGER NOT NULL,
        skill TEXT NOT NULL,
        part_type TEXT NOT NULL,
        status TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        explanation_vi TEXT
      );
      CREATE TABLE IF NOT EXISTS exam_eligible_pool (
        question_id TEXT PRIMARY KEY,
        level INTEGER NOT NULL,
        skill TEXT NOT NULL,
        part_type TEXT,
        stem TEXT,
        practice_eligible INTEGER DEFAULT 0,
        exam_eligible INTEGER DEFAULT 0,
        compatible_formats TEXT,
        ineligible_reasons TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS pending_questions (
        id TEXT PRIMARY KEY,
        stem TEXT NOT NULL,
        options TEXT NOT NULL,
        answer_idx INTEGER NOT NULL,
        level INTEGER NOT NULL,
        skill TEXT NOT NULL,
        part_type TEXT NOT NULL,
        status TEXT NOT NULL
      );
    `);

    // Insert approved question
    db.prepare(`
      INSERT INTO questions (id, stem, options, answer_idx, level, skill, part_type, status, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('q_approved_1', '他是我的好____。', JSON.stringify(['朋友', '水', '猫', '椅子']), 0, 1, 'reading', 'read_fill_blank_4opt', 'approved', 1);

    db.prepare(`
      INSERT INTO exam_eligible_pool (question_id, level, skill, part_type, practice_eligible, exam_eligible)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('q_approved_1', 1, 'reading', 'read_fill_blank_4opt', 1, 1);

    // Insert pending question into pending_questions
    db.prepare(`
      INSERT INTO pending_questions (id, stem, options, answer_idx, level, skill, part_type, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run('pend_leak_attempt', '我想喝____。', JSON.stringify(['茶', '书', '狗', '学校']), 0, 1, 'reading', 'read_fill_blank_4opt', 'pending');

    // Query practice questions using dbInstance as third argument
    const practiceQuestions = loadApprovedQuestionsFromDb(1, { mode: 'practice' }, db);
    expect(practiceQuestions.length).toBe(1);
    expect(practiceQuestions[0].id).toBe('q_approved_1');
    expect(practiceQuestions.some((q) => q.id === 'pend_leak_attempt')).toBe(false);

    // Query mock exam questions using dbInstance as third argument
    const mockQuestions = loadApprovedQuestionsFromDb(1, { mode: 'mock' }, db);
    expect(mockQuestions.length).toBe(1);
    expect(mockQuestions[0].id).toBe('q_approved_1');
    expect(mockQuestions.some((q) => q.id === 'pend_leak_attempt')).toBe(false);

    db.close();
  });

  it('verifies Staging DB has all 5 pilot candidates strictly isolated in pending_questions', () => {
    const stagingDbPath = 'D:\\minnese-staging-20261027\\qbank-staging.db';
    if (!fs.existsSync(stagingDbPath)) {
      return; // Skip if run in environment without staging path
    }

    const db = new DatabaseSync(stagingDbPath, { readOnly: true });

    const pilotIds = [
      'pend_1_1793180725034_0d8fa3',
      'pend_1_1793180732418_c00c02',
      'pend_1_1793180750143_5582a7',
      'pend_1_1793180771209_e6a3e0',
      'pend_1_1793180801685_771ab7',
    ];

    for (const id of pilotIds) {
      // Must be present in pending_questions with status 'pending'
      const pendingRow = db.prepare('SELECT id, status FROM pending_questions WHERE id = ?').get(id) as any;
      expect(pendingRow).toBeDefined();
      expect(pendingRow.status).toBe('pending');

      // Must NOT exist in operational questions table
      const questionRow = db.prepare('SELECT id FROM questions WHERE id = ?').get(id);
      expect(questionRow).toBeUndefined();

      // Must NOT exist in exam_eligible_pool
      const poolRow = db.prepare('SELECT question_id FROM exam_eligible_pool WHERE question_id = ?').get(id);
      expect(poolRow).toBeUndefined();
    }

    db.close();
  });
});
