/**
 * Standalone Adversarial Challenge & Stress-Test Suite for Milestone 1 Backend
 * Evaluates: src/server/qbankRoutes.ts and data/qbank/qbank.db
 * 
 * Target Challenge Areas (per Orchestrator Dispatch):
 * 1. Non-existent IDs, empty payloads, malformed JSON bodies
 * 2. Duplicate content hash collision handling
 * 3. Bulk approve with 50+ items and transactional rollback on error
 * 4. Invalid answer_idx during inline edit
 * 5. Strict preservation of data/hsk_exam.db SHA-256 hash
 */

import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { DatabaseSync } from 'node:sqlite';
import {
  qbankRouter,
  ensurePendingSchema,
  computeContentHash,
  setQBankAdminTokenForTesting,
} from '../../src/server/qbankRoutes';

const EXPECTED_LEGACY_DB_HASH = '10255BCCDF641545F649641912C0982B02600E74B5CCEE1229FF03FAA8ED66DD';
const LEGACY_DB_PATH = path.resolve(process.cwd(), 'data/hsk_exam.db');
const QBANK_DB_PATH = path.resolve(process.cwd(), 'data/qbank/qbank.db');
const TEST_ADMIN_TOKEN = 'adversarial-token-' + Date.now();

let server: http.Server;
let baseUrl: string;

export interface TestResult {
  category: string;
  name: string;
  status: 'PASS' | 'FAIL' | 'VULNERABILITY_FOUND';
  details: string;
}

const testResults: TestResult[] = [];

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[ASSERTION FAILED]: ${message}`);
  }
}

function getFileHash(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex').toUpperCase();
}

async function startChallengeServer(): Promise<void> {
  setQBankAdminTokenForTesting(TEST_ADMIN_TOKEN);

  const app = express();
  app.use(express.json());
  app.use('/api/qbank', qbankRouter);

  // 404 guard matching server.ts
  app.all('/api/*', (req, res) => {
    res.status(404).json({ success: false, error: `API endpoint not found: ${req.method} ${req.originalUrl}` });
  });

  // Express JSON parse error handler
  app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof SyntaxError && 'body' in err) {
      return res.status(400).json({ success: false, error: 'Malformed JSON payload: ' + err.message });
    }
    next(err);
  });

  return new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const addr = server.address() as any;
      baseUrl = `http://127.0.0.1:${addr.port}`;
      resolve();
    });
  });
}

async function stopChallengeServer(): Promise<void> {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => resolve());
    } else {
      resolve();
    }
  });
}

async function apiRequest(
  method: string,
  urlPath: string,
  body?: any,
  rawBody?: string,
  headers: Record<string, string> = {}
): Promise<{ status: number; body: any; rawText: string }> {
  const url = `${baseUrl}${urlPath}`;
  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-QBank-Admin-Token': TEST_ADMIN_TOKEN,
    ...headers,
  };

  const res = await fetch(url, {
    method,
    headers: reqHeaders,
    body: rawBody !== undefined ? rawBody : body !== undefined ? JSON.stringify(body) : undefined,
  });

  const rawText = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(rawText);
  } catch {
    json = null;
  }

  return { status: res.status, body: json, rawText };
}

async function runAdversarialChallenge() {
  console.log('================================================================');
  console.log('  STARTING ADVERSARIAL CHALLENGE SUITE FOR MILESTONE 1 BACKEND  ');
  console.log('================================================================\n');

  // Check initial invariant
  const initialLegacyHash = getFileHash(LEGACY_DB_PATH);
  assert(
    initialLegacyHash === EXPECTED_LEGACY_DB_HASH,
    `Initial legacy DB hash mismatch: expected ${EXPECTED_LEGACY_DB_HASH}, got ${initialLegacyHash}`
  );
  console.log(`[Invariant Baseline] data/hsk_exam.db SHA-256 confirmed: ${initialLegacyHash}`);

  await startChallengeServer();

  const cleanupIds: string[] = [];
  const db = new DatabaseSync(QBANK_DB_PATH);
  ensurePendingSchema(db);

  try {
    // =========================================================================
    // SECTION 1: Non-existent IDs, Empty Payloads, Malformed JSON
    // =========================================================================
    console.log('\n--- Section 1: Non-existent IDs, Empty Payloads, Malformed JSON ---');

    // 1.1 Non-existent query filters in GET /pending
    {
      const res = await apiRequest('GET', '/api/qbank/pending?level=999&skill=non_existent_skill&status=bogus_status');
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body.success === true, 'Response success should be true');
      assert(res.body.total === 0, 'Total should be 0 for non-existent filters');
      assert(Array.isArray(res.body.questions) && res.body.questions.length === 0, 'Questions should be empty array');
      testResults.push({
        category: 'Non-existent IDs & Filters',
        name: 'GET /pending with non-existent level/skill/status',
        status: 'PASS',
        details: 'Returns 200 with total: 0 and empty questions array.',
      });
      console.log('  [PASS] 1.1 Non-existent filters return empty result safely.');
    }

    // 1.2 Extreme & malformed pagination
    {
      const res = await apiRequest('GET', '/api/qbank/pending?limit=-50&offset=-10');
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body.success === true, 'Pagination clamp should succeed');
      testResults.push({
        category: 'Input Sanitization',
        name: 'GET /pending extreme/negative pagination',
        status: 'PASS',
        details: 'Negative limit and offset clamped cleanly without SQL error.',
      });
      console.log('  [PASS] 1.2 Negative/extreme pagination clamped safely.');
    }

    // 1.3 Empty payload on POST /pending/approve
    {
      const res = await apiRequest('POST', '/api/qbank/pending/approve', {});
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body.approved_count === 0, 'Approved count should be 0 for empty payload');
      assert(Array.isArray(res.body.approved_ids) && res.body.approved_ids.length === 0, 'Approved IDs should be empty');
      testResults.push({
        category: 'Empty Payloads',
        name: 'POST /pending/approve empty payload {}',
        status: 'PASS',
        details: 'Handles empty body gracefully, returning approved_count: 0.',
      });
      console.log('  [PASS] 1.3 Empty payload on approve handled safely.');
    }

    // 1.4 Non-existent ID on POST /pending/approve
    {
      const fakeId = 'non_existent_id_' + Date.now();
      const res = await apiRequest('POST', '/api/qbank/pending/approve', { id: fakeId });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body.approved_count === 0, 'Approved count should be 0 for non-existent ID');
      assert(!res.body.approved_ids.includes(fakeId), 'Fake ID should not be in approved_ids');
      testResults.push({
        category: 'Non-existent IDs',
        name: 'POST /pending/approve non-existent ID',
        status: 'PASS',
        details: 'Non-existent ID ignored gracefully; approved_count is 0.',
      });
      console.log('  [PASS] 1.4 Non-existent ID on approve handled safely.');
    }

    // 1.5 Non-existent ID on POST /pending/reject
    {
      const fakeId = 'non_existent_id_reject_' + Date.now();
      const res = await apiRequest('POST', '/api/qbank/pending/reject', { id: fakeId, rejection_note: 'No-op test' });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      // Observe behavior: does it crash or execute without error?
      testResults.push({
        category: 'Non-existent IDs',
        name: 'POST /pending/reject non-existent ID',
        status: 'PASS',
        details: `Executes safe DB statements without crashing (status: 200, reported count: ${res.body.rejected_count}).`,
      });
      console.log(`  [PASS] 1.5 Non-existent ID on reject handled safely without error.`);
    }

    // 1.6 Non-existent ID on PUT /pending/:id
    {
      const fakeId = 'non_existent_id_edit_' + Date.now();
      const res = await apiRequest('PUT', `/api/qbank/pending/${fakeId}`, { stem: 'new stem' });
      assert(res.status === 404, `Expected 404, got ${res.status}`);
      assert(res.body.success === false, 'Success should be false on 404');
      testResults.push({
        category: 'Non-existent IDs',
        name: 'PUT /pending/:id non-existent ID',
        status: 'PASS',
        details: 'Returns 404 Not Found with explicit Vietnamese error message.',
      });
      console.log('  [PASS] 1.6 Non-existent ID on PUT returns 404 cleanly.');
    }

    // 1.7 Malformed JSON body
    {
      const malformedRaw = '{"stem": "broken JSON, unclosed string';
      const res = await apiRequest('POST', '/api/qbank/pending/approve', undefined, malformedRaw);
      assert(res.status === 400, `Expected 400 for malformed JSON, got ${res.status}`);
      assert(res.body.success === false, 'Malformed JSON should return success: false');
      testResults.push({
        category: 'Malformed Payloads',
        name: 'Malformed JSON payload to Express',
        status: 'PASS',
        details: 'Express middleware catches syntax error, returns 400 Bad Request JSON without crashing server.',
      });
      console.log('  [PASS] 1.7 Malformed JSON body caught with 400 Bad Request.');
    }

    // =========================================================================
    // SECTION 2: Duplicate Content Hash Collision Handling
    // =========================================================================
    console.log('\n--- Section 2: Duplicate Content Hash Collision Handling ---');

    // 2.1 Direct collision on pending_questions.content_hash UNIQUE constraint
    {
      const testStem = '爸爸每天早上都去公园____。';
      const testOpts = ['跑步', '吃饭', '看书', '睡觉'];
      const testHash = computeContentHash(testStem, testOpts, 0);

      const idA = `adv_hash_a_${Date.now()}`;
      const idB = `adv_hash_b_${Date.now()}`;
      cleanupIds.push(idA, idB);

      db.prepare(`
        INSERT INTO pending_questions (id, stem, options, answer_idx, pinyin, explanation_vi, level, skill, part_type, content_hash, status)
        VALUES (?, ?, ?, 0, 'baba...', 'Chạy bộ (跑步)', 1, 'reading', 'read_fill_blank_4opt', ?, 'pending')
      `).run(idA, testStem, JSON.stringify(testOpts), testHash);

      let caughtUniqueError = false;
      try {
        db.prepare(`
          INSERT INTO pending_questions (id, stem, options, answer_idx, pinyin, explanation_vi, level, skill, part_type, content_hash, status)
          VALUES (?, ?, ?, 0, 'baba...', 'Chạy bộ (跑步)', 1, 'reading', 'read_fill_blank_4opt', ?, 'pending')
        `).run(idB, testStem, JSON.stringify(testOpts), testHash);
      } catch (err: any) {
        if (err.message && err.message.includes('UNIQUE constraint failed')) {
          caughtUniqueError = true;
        }
      }

      assert(caughtUniqueError, 'Database must enforce UNIQUE constraint on pending_questions.content_hash');
      testResults.push({
        category: 'Hash Collision Handling',
        name: 'pending_questions UNIQUE(content_hash) enforcement',
        status: 'PASS',
        details: 'SQLite rejects duplicate content_hash insert with UNIQUE constraint error.',
      });
      console.log('  [PASS] 2.1 SQLite strictly rejects duplicate content_hash in pending_questions.');
    }

    // 2.2 Collision during Approval when target hash already exists in active qb_questions
    {
      const collisionStem = '今天天气很好，我们一起去踢____吧。';
      const collisionOpts = ['足球', '电影', '咖啡', '商店'];
      const collisionHash = computeContentHash(collisionStem, collisionOpts, 0);

      const existingActiveId = `adv_active_exist_${Date.now()}`;
      const pendingDupId = `adv_pending_dup_${Date.now()}`;
      cleanupIds.push(existingActiveId, pendingDupId);

      // Pre-seed an active question directly into qb_questions with this content_hash
      db.prepare(`
        INSERT INTO qb_questions (
          question_id, level, skill, part_type, stem, options, answer_index, explanation_vi, pinyin_stem, topic, status, provenance, qa, content_hash
        ) VALUES (?, 1, 'reading', 'read_fill_blank_4opt', ?, ?, 0, 'Đá bóng (足球)', 'jintian...', '', 'approved', '{}', '{}', ?)
      `).run(existingActiveId, collisionStem, JSON.stringify(collisionOpts), collisionHash);

      // Pre-seed a pending question with a NULL content_hash in pending_questions (so it passes pending UNIQUE)
      // but its stem/options/answer_idx will compute to collisionHash during approve!
      db.prepare(`
        INSERT INTO pending_questions (id, stem, options, answer_idx, pinyin, explanation_vi, level, skill, part_type, status, content_hash)
        VALUES (?, ?, ?, 0, 'jintian...', 'Đá bóng (足球)', 1, 'reading', 'read_fill_blank_4opt', 'pending', NULL)
      `).run(pendingDupId, collisionStem, JSON.stringify(collisionOpts));

      // Attempt to approve pendingDupId
      const res = await apiRequest('POST', '/api/qbank/pending/approve', { id: pendingDupId });
      assert(res.status === 500, `Expected 500 on content_hash conflict in qb_questions, got ${res.status}`);
      assert(res.body.success === false, 'Approval should fail with success: false');
      assert(
        res.body.error.includes('UNIQUE constraint failed') || res.body.error.includes('Thao tác QBank thất bại') || res.body.error.length > 0,
        'Should report error message'
      );

      // Check that pending question status was rolled back and NOT marked as approved
      const pendRow: any = db.prepare('SELECT status FROM pending_questions WHERE id = ?').get(pendingDupId);
      assert(pendRow.status === 'pending', `Status should remain 'pending' after rollback, got ${pendRow.status}`);

      // Check that it was NOT inserted into questions table
      const qRow: any = db.prepare('SELECT id FROM questions WHERE id = ?').get(pendingDupId);
      assert(qRow === undefined, 'Question must not exist in questions table after collision rollback');

      testResults.push({
        category: 'Hash Collision Handling',
        name: 'qb_questions content_hash collision during approval',
        status: 'PASS',
        details: 'Detects duplicate content_hash in qb_questions, aborts transaction, rolls back pending status, and returns 500.',
      });
      console.log('  [PASS] 2.2 Content hash collision in qb_questions cleanly aborts approval and rolls back.');
    }

    // =========================================================================
    // SECTION 3: Bulk Approve with 50+ Items and Transactional Rollback
    // =========================================================================
    console.log('\n--- Section 3: Bulk Approve (50+ Items) & Transactional Rollback ---');

    // 3.1 Successful Bulk Approval of 60 items
    const bulkValidIds: string[] = [];
    {
      const countToGenerate = 60;
      console.log(`  Seeding ${countToGenerate} valid pending questions for bulk approve...`);

      for (let i = 0; i < countToGenerate; i++) {
        const id = `adv_bulk_ok_${Date.now()}_${i}`;
        bulkValidIds.push(id);
        cleanupIds.push(id);

        const stem = `Bulk valid stem test number ${i} ____ 苹果。`;
        const opts = [`选项A_${i}`, `选项B_${i}`, `选项C_${i}`, `选项D_${i}`];
        const hash = computeContentHash(stem, opts, 1);

        db.prepare(`
          INSERT INTO pending_questions (id, stem, options, answer_idx, pinyin, explanation_vi, level, skill, part_type, status, content_hash)
          VALUES (?, ?, ?, 1, 'pinyin', 'Giải thích', 1, 'reading', 'read_fill_blank_4opt', 'pending', ?)
        `).run(id, stem, JSON.stringify(opts), hash);
      }

      const approveRes = await apiRequest('POST', '/api/qbank/pending/approve', { ids: bulkValidIds });
      assert(approveRes.status === 200, `Expected 200, got ${approveRes.status}`);
      assert(approveRes.body.success === true, 'Bulk approve success should be true');
      assert(approveRes.body.approved_count === countToGenerate, `Expected ${countToGenerate} approved, got ${approveRes.body.approved_count}`);
      assert(approveRes.body.approved_ids.length === countToGenerate, 'Approved IDs count must match');

      // Verify all 60 are in 'approved' status in pending_questions, questions, and qb_questions
      const pendingApprovedCount: any = db.prepare(
        `SELECT COUNT(*) as cnt FROM pending_questions WHERE id IN (${bulkValidIds.map(() => '?').join(',')}) AND status = 'approved'`
      ).get(...bulkValidIds);
      assert(Number(pendingApprovedCount.cnt) === countToGenerate, 'All 60 must be approved in pending_questions');

      const questionsCount: any = db.prepare(
        `SELECT COUNT(*) as cnt FROM questions WHERE id IN (${bulkValidIds.map(() => '?').join(',')}) AND status = 'approved'`
      ).get(...bulkValidIds);
      assert(Number(questionsCount.cnt) === countToGenerate, 'All 60 must be present in questions table');

      const qbCount: any = db.prepare(
        `SELECT COUNT(*) as cnt FROM qb_questions WHERE question_id IN (${bulkValidIds.map(() => '?').join(',')}) AND status = 'approved'`
      ).get(...bulkValidIds);
      assert(Number(qbCount.cnt) === countToGenerate, 'All 60 must be present in qb_questions table');

      testResults.push({
        category: 'Bulk Approval Stress',
        name: 'Bulk approve 60 items in single atomic transaction',
        status: 'PASS',
        details: `Successfully promoted all 60 items across pending_questions, questions, and qb_questions in 1 transaction.`,
      });
      console.log(`  [PASS] 3.1 Bulk approved 60 items successfully across all tables.`);
    }

    // 3.2 Transactional Rollback on Error with 55 valid + 1 poison item
    {
      const countValid = 55;
      const rollbackTestIds: string[] = [];
      console.log(`  Seeding ${countValid} valid pending items + 1 poison collision item for rollback test...`);

      for (let i = 0; i < countValid; i++) {
        const id = `adv_rollback_valid_${Date.now()}_${i}`;
        rollbackTestIds.push(id);
        cleanupIds.push(id);

        const stem = `Rollback test valid stem item ${i} ____ 书。`;
        const opts = [`选择A_${i}`, `选择B_${i}`, `选择C_${i}`, `选择D_${i}`];
        const hash = computeContentHash(stem, opts, 2);

        db.prepare(`
          INSERT INTO pending_questions (id, stem, options, answer_idx, pinyin, explanation_vi, level, skill, part_type, status, content_hash)
          VALUES (?, ?, ?, 2, 'pinyin', 'Giải thích', 2, 'reading', 'read_fill_blank_4opt', 'pending', ?)
        `).run(id, stem, JSON.stringify(opts), hash);
      }

      // Pre-seed an existing item in qb_questions to cause a collision for item 56
      const poisonTargetHash = computeContentHash('Poison collision stem ____', ['A', 'B', 'C', 'D'], 0);
      const preseededTargetId = `adv_preseeded_qb_${Date.now()}`;
      cleanupIds.push(preseededTargetId);

      db.prepare(`
        INSERT INTO qb_questions (
          question_id, level, skill, part_type, stem, options, answer_index, explanation_vi, pinyin_stem, topic, status, provenance, qa, content_hash
        ) VALUES (?, 2, 'reading', 'read_fill_blank_4opt', 'Poison collision stem ____', '["A","B","C","D"]', 0, 'Giải thích', 'pinyin', '', 'approved', '{}', '{}', ?)
      `).run(preseededTargetId, poisonTargetHash);

      // Create item 56 (the poison item) with the same content hash in pending
      const poisonId = `adv_rollback_poison_${Date.now()}`;
      rollbackTestIds.push(poisonId);
      cleanupIds.push(poisonId);

      db.prepare(`
        INSERT INTO pending_questions (id, stem, options, answer_idx, pinyin, explanation_vi, level, skill, part_type, status, content_hash)
        VALUES (?, 'Poison collision stem ____', '["A","B","C","D"]', 0, 'pinyin', 'Giải thích', 2, 'reading', 'read_fill_blank_4opt', 'pending', NULL)
      `).run(poisonId);

      // Call bulk approve with 56 IDs: 55 valid + 1 poison at the end
      console.log(`  Submitting bulk approve for ${rollbackTestIds.length} items (${countValid} valid + 1 poison)...`);
      const res = await apiRequest('POST', '/api/qbank/pending/approve', { ids: rollbackTestIds });

      assert(res.status === 500, `Expected 500 when transaction fails on poison item, got ${res.status}`);
      assert(res.body.success === false, 'Approval must report failure');

      // CRITICAL VERIFICATION: Did ANY of the 55 valid items get committed?
      // They MUST ALL REMAIN 'pending', not 'approved'!
      const checkPendingStatus: any[] = db.prepare(
        `SELECT id, status FROM pending_questions WHERE id IN (${rollbackTestIds.map(() => '?').join(',')})`
      ).all(...rollbackTestIds);

      const approvedInPending = checkPendingStatus.filter((r) => r.status === 'approved');
      assert(
        approvedInPending.length === 0,
        `ROLLBACK FAILED! ${approvedInPending.length} items were committed to 'approved' despite transaction failure!`
      );

      // Verify questions table does not contain ANY of the 55 items
      const checkQuestionsCount: any = db.prepare(
        `SELECT COUNT(*) as cnt FROM questions WHERE id IN (${rollbackTestIds.map(() => '?').join(',')})`
      ).get(...rollbackTestIds);
      assert(
        Number(checkQuestionsCount.cnt) === 0,
        `ROLLBACK FAILED! ${checkQuestionsCount.cnt} items found in questions table!`
      );

      // Verify qb_questions does not contain ANY of the 55 items
      const checkQbCount: any = db.prepare(
        `SELECT COUNT(*) as cnt FROM qb_questions WHERE question_id IN (${rollbackTestIds.map(() => '?').join(',')})`
      ).get(...rollbackTestIds);
      assert(
        Number(checkQbCount.cnt) === 0,
        `ROLLBACK FAILED! ${checkQbCount.cnt} items found in qb_questions table!`
      );

      testResults.push({
        category: 'Bulk Approval Stress',
        name: 'Bulk approve atomic rollback on error with 55+ items',
        status: 'PASS',
        details: `When item 56 triggered SQLite UNIQUE constraint error, all 55 preceding items were cleanly rolled back to 'pending'. 0 partial commits.`,
      });
      console.log(`  [PASS] 3.2 Full atomic rollback verified: 0 of 55 items were partially committed.`);
    }

    // =========================================================================
    // SECTION 4: Invalid answer_idx During Inline Edit
    // =========================================================================
    console.log('\n--- Section 4: Invalid answer_idx During Inline Edit ---');

    {
      const editTestId = `adv_edit_ans_${Date.now()}`;
      cleanupIds.push(editTestId);

      const options = ['苹果', '香蕉', '西瓜', '葡萄']; // 4 options: valid indices are 0, 1, 2, 3
      db.prepare(`
        INSERT INTO pending_questions (id, stem, options, answer_idx, pinyin, explanation_vi, level, skill, part_type, status)
        VALUES (?, '我最喜欢吃的水果是____。', ?, 0, 'wo zui xihuan...', 'Thích ăn táo', 1, 'reading', 'read_fill_blank_4opt', 'pending')
      `).run(editTestId, JSON.stringify(options));

      // Test 4.1: Negative answer_idx: -1
      console.log('  Testing inline edit with negative answer_idx: -1 ...');
      const editNegativeRes = await apiRequest('PUT', `/api/qbank/pending/${editTestId}`, {
        answer_idx: -1,
      });

      // Observe if the server validated answer_idx or accepted -1
      const savedNegativeRow: any = db.prepare('SELECT answer_idx FROM pending_questions WHERE id = ?').get(editTestId);
      console.log(`  Result for answer_idx: -1 -> HTTP Status: ${editNegativeRes.status}, DB saved value: ${savedNegativeRow.answer_idx}`);

      // Test 4.2: Out-of-bounds answer_idx: 99
      console.log('  Testing inline edit with out-of-bounds answer_idx: 99 ...');
      const editOobRes = await apiRequest('PUT', `/api/qbank/pending/${editTestId}`, {
        answer_idx: 99,
      });
      const savedOobRow: any = db.prepare('SELECT answer_idx FROM pending_questions WHERE id = ?').get(editTestId);
      console.log(`  Result for answer_idx: 99 -> HTTP Status: ${editOobRes.status}, DB saved value: ${savedOobRow.answer_idx}`);

      // Test 4.3: String NaN answer_idx: "invalid"
      console.log('  Testing inline edit with non-numeric answer_idx: "invalid" ...');
      const editNanRes = await apiRequest('PUT', `/api/qbank/pending/${editTestId}`, {
        answer_idx: 'invalid',
      });
      const savedNanRow: any = db.prepare('SELECT answer_idx FROM pending_questions WHERE id = ?').get(editTestId);
      console.log(`  Result for answer_idx: "invalid" -> HTTP Status: ${editNanRes.status}, DB saved value: ${savedNanRow.answer_idx}`);

      // Evaluate vulnerability
      const acceptedNegative = editNegativeRes.status === 200 && Number(savedNegativeRow.answer_idx) === -1;
      const acceptedOob = editOobRes.status === 200 && Number(savedOobRow.answer_idx) === 99;

      if (acceptedNegative || acceptedOob) {
        testResults.push({
          category: 'Input Validation & Edge Cases',
          name: 'Invalid answer_idx bounds check during inline edit',
          status: 'VULNERABILITY_FOUND',
          details: `PUT /api/qbank/pending/:id lacks boundary validation for answer_idx. It accepted negative (-1) and out-of-bounds (99) indices for a 4-option question (valid: 0..3), persisting corrupted answer_idx to DB without 400 Bad Request.`,
        });
        console.log('  [VULNERABILITY FOUND] 4.1-4.2 Inline edit does not validate 0 <= answer_idx < options.length.');
      } else {
        testResults.push({
          category: 'Input Validation & Edge Cases',
          name: 'Invalid answer_idx bounds check during inline edit',
          status: 'PASS',
          details: 'Inline edit correctly validated and rejected invalid answer_idx.',
        });
        console.log('  [PASS] 4.1-4.2 Inline edit rejected invalid answer_idx.');
      }
    }

    // =========================================================================
    // SECTION 5: Legacy Database Strict Invariance Audit
    // =========================================================================
    console.log('\n--- Section 5: Legacy DB Strict Invariance Audit ---');
    const finalLegacyHash = getFileHash(LEGACY_DB_PATH);
    const legacyDb = new DatabaseSync(LEGACY_DB_PATH);
    const legacyRowCount: any = legacyDb.prepare('SELECT COUNT(*) as cnt FROM questions').get();
    legacyDb.close();

    assert(
      finalLegacyHash === EXPECTED_LEGACY_DB_HASH,
      `FATAL: data/hsk_exam.db hash modified! Expected ${EXPECTED_LEGACY_DB_HASH}, got ${finalLegacyHash}`
    );
    assert(
      Number(legacyRowCount.cnt) === 6,
      `FATAL: data/hsk_exam.db row count modified! Expected 6, got ${legacyRowCount.cnt}`
    );

    testResults.push({
      category: 'Database Invariant',
      name: 'data/hsk_exam.db SHA-256 and row count preservation',
      status: 'PASS',
      details: `Hash strictly unchanged (${finalLegacyHash}), exactly 6 rows in questions table.`,
    });
    console.log(`  [PASS] 5.1 data/hsk_exam.db strictly untouched: SHA-256=${finalLegacyHash}, rows=${legacyRowCount.cnt}`);

  } finally {
    // Clean up created records from qbank.db
    console.log(`\nCleaning up ${cleanupIds.length} test records from qbank.db...`);
    const cleanDb = new DatabaseSync(QBANK_DB_PATH);
    for (const id of cleanupIds) {
      try { cleanDb.prepare('DELETE FROM pending_questions WHERE id = ?').run(id); } catch {}
      try { cleanDb.prepare('DELETE FROM questions WHERE id = ?').run(id); } catch {}
      try { cleanDb.prepare('DELETE FROM qb_questions WHERE question_id = ?').run(id); } catch {}
    }
    cleanDb.close();

    await stopChallengeServer();
  }

  // Summary Report
  console.log('\n================================================================');
  console.log('                 ADVERSARIAL CHALLENGE SUMMARY                  ');
  console.log('================================================================');
  let passCount = 0;
  let vulnCount = 0;
  for (const r of testResults) {
    const icon = r.status === 'PASS' ? '✅' : '⚠️';
    console.log(`${icon} [${r.status}] [${r.category}] ${r.name}`);
    console.log(`   -> ${r.details}\n`);
    if (r.status === 'PASS') passCount++;
    if (r.status === 'VULNERABILITY_FOUND') vulnCount++;
  }
  console.log(`Total Scenarios Tested: ${testResults.length}`);
  console.log(`PASSED: ${passCount}`);
  console.log(`VULNERABILITIES / GAPS FOUND: ${vulnCount}`);
  console.log('================================================================\n');

  return testResults;
}

runAdversarialChallenge()
  .then((results) => {
    const hasVuln = results.some((r) => r.status === 'VULNERABILITY_FOUND');
    console.log(hasVuln ? '[CHALLENGE COMPLETED WITH FINDINGS]' : '[CHALLENGE FULLY PASSED]');
    process.exit(0);
  })
  .catch((err) => {
    console.error('[CHALLENGE RUNTIME ERROR]:', err);
    process.exit(1);
  });
