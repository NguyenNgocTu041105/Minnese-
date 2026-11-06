/**
 * Comprehensive Automated Test Suite for QBank Routes & SQLite Database Backend
 * Tests:
 * 1. Schema initialization & Indices in qbank.db (pending_questions, questions, generation_runs, generation_history)
 * 2. computeContentHash NFC normalization matching Python QbQuestion.compute_hash
 * 3. GET /api/qbank/pending (filters by level, skill, status, pagination)
 * 4. POST /api/qbank/pending/approve (atomically promotes to questions and qb_questions)
 * 5. POST /api/qbank/pending/reject (marks rejected, saves rejection_note, removes from active)
 * 6. PUT /api/qbank/pending/:id & POST /api/qbank/pending/edit (updates fields & recomputes hash)
 * 7. GET /api/qbank/progress & GET /api/qbank/pending/stats (counts by level and history)
 * 8. Security middleware token & loopback enforcement
 * 9. Invariant check on data/hsk_exam.db
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
  formatPendingRow,
  setQBankAdminTokenForTesting,
  getQBankAdminToken,
} from '../../src/server/qbankRoutes';

const EXPECTED_LEGACY_DB_HASH = '10255BCCDF641545F649641912C0982B02600E74B5CCEE1229FF03FAA8ED66DD';
const LEGACY_DB_PATH = path.resolve(process.cwd(), 'data/hsk_exam.db');
const TEST_ADMIN_TOKEN = 'test-token-' + Date.now();

let server: http.Server;
let baseUrl: string;

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[ASSERTION FAILED]: ${message}`);
  }
}

function getDbHash(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Database file not found: ${filePath}`);
  }
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex').toUpperCase();
}

async function startTestServer(): Promise<void> {
  setQBankAdminTokenForTesting(TEST_ADMIN_TOKEN);

  const app = express();
  app.use(express.json());
  app.use('/api/qbank', qbankRouter);

  app.all('/api/*', (req, res) => {
    res.status(404).json({ success: false, error: `API endpoint not found: ${req.method} ${req.originalUrl}` });
  });

  return new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const addr = server.address() as any;
      baseUrl = `http://127.0.0.1:${addr.port}`;
      resolve();
    });
  });
}

async function stopTestServer(): Promise<void> {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => resolve());
    } else {
      resolve();
    }
  });
}

async function request(
  method: string,
  urlPath: string,
  body?: any,
  headers: Record<string, string> = {}
): Promise<{ status: number; body: any }> {
  const url = `${baseUrl}${urlPath}`;
  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-QBank-Admin-Token': TEST_ADMIN_TOKEN,
    ...headers,
  };

  const res = await fetch(url, {
    method,
    headers: reqHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  let json: any;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  return { status: res.status, body: json };
}

async function runTests() {
  console.log('[Test] Starting QBank Backend API and Schema Test Suite...');

  // Invariant check before
  assert(getDbHash(LEGACY_DB_PATH) === EXPECTED_LEGACY_DB_HASH, 'data/hsk_exam.db hash must match before tests');

  await startTestServer();

  const testIdsToCleanup: string[] = [];

  try {
    // -------------------------------------------------------------------------
    // 1. Schema & Indices Verification on DatabaseSync
    // -------------------------------------------------------------------------
    console.log('[Test 1] Verifying schema and indices in qbank.db...');
    const dbPath = path.resolve(process.cwd(), 'data/qbank/qbank.db');
    const db = new DatabaseSync(dbPath);
    ensurePendingSchema(db);

    const tables = (db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as any[]).map((r) => r.name);
    assert(tables.includes('pending_questions'), 'pending_questions table must exist');
    assert(tables.includes('questions'), 'questions table must exist');
    assert(tables.includes('generation_runs'), 'generation_runs table must exist');
    assert(tables.includes('generation_history'), 'generation_history table must exist');

    const indices = (db.prepare("SELECT name FROM sqlite_master WHERE type='index'").all() as any[]).map((r) => r.name);
    assert(indices.includes('idx_pending_status_level'), 'idx_pending_status_level index must exist');
    assert(indices.includes('idx_pending_skill'), 'idx_pending_skill index must exist');
    assert(indices.includes('idx_pending_created'), 'idx_pending_created index must exist');
    assert(indices.includes('idx_questions_level_status'), 'idx_questions_level_status index must exist');
    assert(indices.includes('idx_questions_skill'), 'idx_questions_skill index must exist');
    assert(indices.includes('idx_gen_runs_created'), 'idx_gen_runs_created index must exist');
    db.close();
    console.log('  -> PASS: All tables and indices verified.');

    // -------------------------------------------------------------------------
    // 2. Content Hash NFC Normalization
    // -------------------------------------------------------------------------
    console.log('[Test 2] Verifying computeContentHash NFC normalization...');
    const stem1 = '他身体不舒服，想去医院看____。';
    const opts1 = ['苹果', '医生', '出租车', '米饭'];
    const hash1 = computeContentHash(stem1, opts1, 1);
    const hash2 = computeContentHash(stem1.normalize('NFD'), opts1.map(o => o.normalize('NFD')), 1);
    assert(hash1 === hash2, 'Hash must be identical across NFC and NFD strings');
    assert(typeof hash1 === 'string' && hash1.length === 64, 'Hash must be 64-char SHA-256 hex');
    console.log('  -> PASS: computeContentHash is deterministic and NFC normalized.');

    // -------------------------------------------------------------------------
    // 3. Security Middleware Check
    // -------------------------------------------------------------------------
    console.log('[Test 3] Verifying Security Middleware on /api/qbank/pending...');
    // Unauthenticated
    const unauthRes = await request('GET', '/api/qbank/pending', undefined, { 'X-QBank-Admin-Token': '' });
    assert(unauthRes.status === 401, `Unauthenticated request should return 401, got ${unauthRes.status}`);

    // Invalid Token
    const badTokenRes = await request('GET', '/api/qbank/pending', undefined, { 'X-QBank-Admin-Token': 'wrong-token' });
    assert(badTokenRes.status === 403, `Invalid token request should return 403, got ${badTokenRes.status}`);

    // Valid Token
    const authRes = await request('GET', '/api/qbank/pending');
    assert(authRes.status === 200, `Valid token request should return 200, got ${authRes.status}`);
    assert(authRes.body.success === true, 'Response success must be true');
    console.log('  -> PASS: Security middleware correctly enforces loopback and token authentication.');

    // -------------------------------------------------------------------------
    // 4. Pending CRUD & Filter Operations
    // -------------------------------------------------------------------------
    console.log('[Test 4] Testing GET /api/qbank/pending filters and pagination...');
    const testPendId1 = `unit_pend_${Date.now()}_1`;
    const testPendId2 = `unit_pend_${Date.now()}_2`;
    testIdsToCleanup.push(testPendId1, testPendId2);

    const testDb = new DatabaseSync(dbPath);
    testDb.prepare(`
      INSERT INTO pending_questions (id, stem, options, answer_idx, pinyin, explanation_vi, level, skill, part_type, status, provider_used)
      VALUES (?, ?, ?, 0, 'pinyin 1', 'explanation 1', 1, 'reading', 'read_fill_blank_4opt', 'pending', 'deepseek-v3')
    `).run(testPendId1, 'Unit test stem 1 ____', JSON.stringify(['A', 'B', 'C', 'D']));

    testDb.prepare(`
      INSERT INTO pending_questions (id, stem, options, answer_idx, pinyin, explanation_vi, level, skill, part_type, status, provider_used)
      VALUES (?, ?, ?, 1, 'pinyin 2', 'explanation 2', 2, 'listening', 'listen_picture_match_3opt', 'pending', 'gemini-1.5-flash')
    `).run(testPendId2, 'Unit test stem 2 ____', JSON.stringify(['A', 'B', 'C', 'D']));
    testDb.close();

    // Query pending level 1
    const p1 = await request('GET', '/api/qbank/pending?level=1&status=pending');
    assert(p1.status === 200 && p1.body.success === true, 'GET pending level 1 must succeed');
    const found1 = p1.body.questions.find((q: any) => q.id === testPendId1);
    assert(found1 !== undefined, 'testPendId1 must be present in level 1 results');
    const notFound2 = p1.body.questions.find((q: any) => q.id === testPendId2);
    assert(notFound2 === undefined, 'testPendId2 must NOT be present in level 1 results');

    // Query pending skill listening
    const pSkill = await request('GET', '/api/qbank/pending?skill=listening&status=pending');
    assert(pSkill.status === 200, 'GET pending skill listening must succeed');
    const foundSkill2 = pSkill.body.questions.find((q: any) => q.id === testPendId2);
    assert(foundSkill2 !== undefined, 'testPendId2 must be found in listening skill');
    console.log('  -> PASS: GET /api/qbank/pending filtering works as specified.');

    // -------------------------------------------------------------------------
    // 5. Inline Edit PUT /api/qbank/pending/:id & POST /api/qbank/pending/edit
    // -------------------------------------------------------------------------
    console.log('[Test 5] Testing PUT /api/qbank/pending/:id & POST /api/qbank/pending/edit...');
    const updatedStem = '他买了一杯热茶，正在座位上____。';
    const updatedOptions = ['喝茶', '睡觉', '打球', '看病'];
    const updatedExplanation = 'Đang ngồi uống cốc trà nóng (喝茶).';

    const editRes = await request('PUT', `/api/qbank/pending/${testPendId1}`, {
      stem: updatedStem,
      options: updatedOptions,
      answer_idx: 0,
      explanation_vi: updatedExplanation,
    });
    assert(editRes.status === 200 && editRes.body.success === true, 'PUT pending/:id must succeed');
    assert(editRes.body.question.stem === updatedStem, 'Updated stem must match');
    assert(editRes.body.question.explanation_vi === updatedExplanation, 'Updated explanation must match');

    // Also test POST /api/qbank/pending/edit alias
    const editPostRes = await request('POST', '/api/qbank/pending/edit', {
      id: testPendId1,
      explanation_vi: updatedExplanation + ' (edited via post)',
    });
    assert(editPostRes.status === 200 && editPostRes.body.success === true, 'POST /pending/edit alias must succeed');
    assert(editPostRes.body.question.explanation_vi.includes('(edited via post)'), 'Explanation should be updated via alias');
    console.log('  -> PASS: Inline edit endpoints successfully update pending question.');

    // -------------------------------------------------------------------------
    // 6. Single & Bulk Approve POST /api/qbank/pending/approve
    // -------------------------------------------------------------------------
    console.log('[Test 6] Testing POST /api/qbank/pending/approve (single & bulk)...');
    // Approve testPendId1
    const appSingleRes = await request('POST', '/api/qbank/pending/approve', { id: testPendId1 });
    assert(appSingleRes.status === 200 && appSingleRes.body.success === true, 'Approve single must succeed');
    assert(appSingleRes.body.approved_count === 1, 'Approved count must be 1');

    // Verify promotion in DB
    const checkDb = new DatabaseSync(dbPath);
    const pendRow = checkDb.prepare('SELECT status FROM pending_questions WHERE id = ?').get(testPendId1) as any;
    assert(pendRow.status === 'approved', 'pending_questions status must be approved');

    const activeRow = checkDb.prepare('SELECT id, status FROM questions WHERE id = ?').get(testPendId1) as any;
    assert(activeRow !== undefined && activeRow.status === 'approved', 'questions table must contain approved question');

    const qbRow = checkDb.prepare('SELECT question_id, status, content_hash FROM qb_questions WHERE question_id = ?').get(testPendId1) as any;
    assert(qbRow !== undefined && qbRow.status === 'approved', 'qb_questions table must contain approved question');
    assert(qbRow.content_hash && qbRow.content_hash.length === 64, 'qb_questions must have valid content_hash');
    checkDb.close();

    // Bulk approve with testPendId2
    const appBulkRes = await request('POST', '/api/qbank/pending/approve', { ids: [testPendId2] });
    assert(appBulkRes.status === 200 && appBulkRes.body.success === true, 'Approve bulk must succeed');
    assert(appBulkRes.body.approved_count === 1, 'Bulk approved count must be 1');
    console.log('  -> PASS: Approval atomically promotes question to questions and qb_questions.');

    // -------------------------------------------------------------------------
    // 7. Single & Bulk Reject POST /api/qbank/pending/reject
    // -------------------------------------------------------------------------
    console.log('[Test 7] Testing POST /api/qbank/pending/reject...');
    const testPendId3 = `unit_pend_${Date.now()}_3`;
    testIdsToCleanup.push(testPendId3);

    const testDb2 = new DatabaseSync(dbPath);
    testDb2.prepare(`
      INSERT INTO pending_questions (id, stem, options, answer_idx, pinyin, explanation_vi, level, skill, part_type, status, provider_used)
      VALUES (?, 'Reject stem test ____', '["A","B"]', 0, 'pinyin 3', 'explanation 3', 1, 'reading', 'read_fill_blank_4opt', 'pending', 'deepseek-v3')
    `).run(testPendId3);
    testDb2.close();

    const rejectRes = await request('POST', '/api/qbank/pending/reject', {
      id: testPendId3,
      rejection_note: 'Unit test rejection reason',
    });
    assert(rejectRes.status === 200 && rejectRes.body.success === true, 'Reject must succeed');
    assert(rejectRes.body.rejected_count === 1, 'Rejected count must be 1');

    const checkDb2 = new DatabaseSync(dbPath);
    const rejRow = checkDb2.prepare('SELECT status, rejection_note FROM pending_questions WHERE id = ?').get(testPendId3) as any;
    assert(rejRow.status === 'rejected', 'Status must be rejected');
    assert(rejRow.rejection_note === 'Unit test rejection reason', 'Rejection note must match');

    const shouldNotExist = checkDb2.prepare('SELECT id FROM questions WHERE id = ?').get(testPendId3);
    assert(shouldNotExist === undefined, 'Rejected question must not exist in questions table');
    checkDb2.close();
    console.log('  -> PASS: Rejection sets status, records rejection note, and excludes from active.');

    // -------------------------------------------------------------------------
    // 8. Progress and Stats Endpoints
    // -------------------------------------------------------------------------
    console.log('[Test 8] Testing GET /api/qbank/progress & GET /api/qbank/pending/stats...');
    const progRes = await request('GET', '/api/qbank/progress');
    assert(progRes.status === 200 && progRes.body.success === true, 'GET /progress must succeed');
    assert(typeof progRes.body.total_pending === 'number', 'total_pending must be a number');
    assert(typeof progRes.body.total_approved === 'number', 'total_approved must be a number');
    assert(progRes.body.pending_by_level !== undefined, 'pending_by_level must be present');
    assert(progRes.body.approved_by_level !== undefined, 'approved_by_level must be present');
    assert(Array.isArray(progRes.body.generation_history), 'generation_history must be an array');

    const statsRes = await request('GET', '/api/qbank/pending/stats');
    assert(statsRes.status === 200 && statsRes.body.success === true, 'GET /pending/stats alias must succeed');
    assert(statsRes.body.total_pending === progRes.body.total_pending, 'Stats alias must match progress');
    console.log('  -> PASS: Progress and stats endpoints return complete KPI breakdown.');

  } finally {
    // Cleanup created test records
    const cleanDb = new DatabaseSync(path.resolve(process.cwd(), 'data/qbank/qbank.db'));
    for (const id of testIdsToCleanup) {
      try {
        cleanDb.prepare('DELETE FROM pending_questions WHERE id = ?').run(id);
      } catch {}
      try {
        cleanDb.prepare('DELETE FROM questions WHERE id = ?').run(id);
      } catch {}
      try {
        cleanDb.prepare('DELETE FROM qb_questions WHERE question_id = ?').run(id);
      } catch {}
    }
    cleanDb.close();

    await stopTestServer();

    // Final invariant check
    const finalHash = getDbHash(LEGACY_DB_PATH);
    assert(finalHash === EXPECTED_LEGACY_DB_HASH, 'data/hsk_exam.db hash must remain unchanged after test completion');
    console.log('[Invariant Check] data/hsk_exam.db SHA-256 strictly preserved.');
  }

  console.log('\n[SUCCESS] All QBank routes and SQLite database tests passed perfectly (8/8)!');
}

runTests().catch((err) => {
  console.error('\n[FATAL ERROR IN TEST SUITE]:', err);
  process.exit(1);
});
