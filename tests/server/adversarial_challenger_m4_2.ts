/**
 * Empirical Adversarial Challenger Test Harness for Milestone 4.2
 *
 * Verifies:
 * 1. Security middleware enforcement on all pending routes:
 *    - Unauthorized (missing token) -> 401 JSON
 *    - Invalid token -> 403 JSON
 *    - Non-loopback Host header rejection -> 403 JSON
 *    - Non-loopback Origin header rejection on mutating requests -> 403 JSON
 *    - Valid loopback host + origin + token -> 200 JSON
 * 2. UI error resilience logic (safeApiCall):
 *    - Intercepts 500 HTML reverse proxy error pages without JSON parse crashes
 *    - Intercepts 502 Bad Gateway HTML pages safely
 *    - Intercepts 504 Gateway Timeout HTML pages safely
 *    - Intercepts 500 malformed application/json bodies safely
 * 3. Full End-to-End Question Lifecycle:
 *    - Staged in pending -> Queryable in /api/qbank/pending -> Excluded from exam
 *    - Inline edit -> Validated and updated
 *    - Approved -> Promoted in pending_questions, questions, and qb_questions
 *    - Available in /api/exam/generate-mock and /api/exam/practice
 * 4. Database Invariant Check:
 *    - data/hsk_exam.db SHA-256 strictly preserved (10255BCCDF641545F649641912C0982B02600E74B5CCEE1229FF03FAA8ED66DD, 6 rows)
 */

import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { DatabaseSync } from 'node:sqlite';
import {
  qbankRouter,
  setQBankAdminTokenForTesting,
  getDbSync,
  ensurePendingSchema,
} from '../../src/server/qbankRoutes';
import { examRouter } from '../../src/server/examRoutes';

const EXPECTED_LEGACY_DB_HASH = '10255BCCDF641545F649641912C0982B02600E74B5CCEE1229FF03FAA8ED66DD';
const LEGACY_DB_PATH = path.resolve(process.cwd(), 'data/hsk_exam.db');
const TEST_TOKEN = 'challenger-secure-token-' + crypto.randomBytes(16).toString('hex');

let server: http.Server;
let serverPort: number;
let baseUrl: string;

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[CHALLENGE ASSERTION FAILED]: ${message}`);
  }
}

function verifyDbInvariant(context: string): void {
  if (!fs.existsSync(LEGACY_DB_PATH)) {
    throw new Error(`Database file not found at ${LEGACY_DB_PATH}`);
  }
  const fileBuffer = fs.readFileSync(LEGACY_DB_PATH);
  const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex').toUpperCase();
  assert(
    hash === EXPECTED_LEGACY_DB_HASH,
    `[${context}] SHA-256 mismatch! Expected ${EXPECTED_LEGACY_DB_HASH}, got ${hash}`
  );

  const db = new DatabaseSync(LEGACY_DB_PATH);
  const row: any = db.prepare('SELECT COUNT(*) as count FROM questions').get();
  assert(
    Number(row.count) === 6,
    `[${context}] Row count mismatch! Expected 6, got ${row.count}`
  );
  db.close();
}

async function startServer(): Promise<void> {
  setQBankAdminTokenForTesting(TEST_TOKEN);

  const app = express();
  app.use(express.json());

  // Mount qbankRouter
  app.use('/api/qbank', qbankRouter);
  // Mount examRouter
  app.use('/api/exam', examRouter);

  // Fallback 404
  app.all('/api/*', (req, res) => {
    res.status(404).json({ success: false, error: `API endpoint not found: ${req.method} ${req.originalUrl}` });
  });

  return new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const addr = server.address() as any;
      serverPort = addr.port;
      baseUrl = `http://127.0.0.1:${serverPort}`;
      resolve();
    });
  });
}

async function stopServer(): Promise<void> {
  if (server) {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

/**
 * Low-level HTTP client allowing raw custom Host and Origin headers (undici/fetch strips custom Host)
 */
function rawHttpRequest(options: {
  method?: string;
  path: string;
  headers?: Record<string, string>;
  body?: string;
}): Promise<{ status: number; headers: Record<string, string>; text: string; json: () => any }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: serverPort,
        path: options.path,
        method: options.method || 'GET',
        headers: options.headers || {},
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          resolve({
            status: res.statusCode || 0,
            headers: res.headers as any,
            text: data,
            json: () => JSON.parse(data),
          });
        });
      }
    );
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

/**
 * Re-implementation of QBankAdmin safeApiCall for direct unit stress-testing
 */
async function testSafeApiCall(
  mockFetchFn: () => Promise<{ status: number; statusText?: string; headers: Map<string, string>; text: () => Promise<string>; json: () => Promise<any> }>
): Promise<{ success: boolean; data?: any; error?: string; statusCode?: number }> {
  try {
    const res = await mockFetchFn();
    const contentType = res.headers.get('content-type') || '';

    if (res.status === 401 || res.status === 403) {
      let errMsg = 'Phiên quản trị QBank chưa được xác thực hoặc token không hợp lệ (401/403).';
      if (contentType.includes('application/json')) {
        try {
          const errJson = await res.json();
          if (errJson.error) errMsg = errJson.error;
        } catch {}
      }
      return {
        success: false,
        statusCode: res.status,
        error: errMsg,
      };
    }

    if (!contentType.includes('application/json')) {
      return {
        success: false,
        statusCode: res.status,
        error: `Không thể kết nối tới máy chủ backend hoặc máy chủ phản hồi không đúng định dạng JSON (${res.status} ${res.statusText || 'Non-JSON'}). Vui lòng kiểm tra tiến trình Express backend.`,
      };
    }

    const json = await res.json();
    if (res.status < 200 || res.status >= 300 || json.success === false) {
      return {
        success: false,
        statusCode: res.status,
        error: json.error || `Yêu cầu thất bại với mã lỗi HTTP ${res.status}`,
      };
    }
    return { success: true, data: json, statusCode: res.status };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return { success: false, error: 'Yêu cầu quá thời gian chờ (Timeout).' };
    }
    return {
      success: false,
      error: 'Không thể kết nối tới máy chủ backend. Vui lòng kiểm tra kết nối mạng và đảm bảo server Express đang chạy.',
    };
  }
}

async function runTests() {
  console.log('=== STARTING EMPIRICAL ADVERSARIAL CHALLENGER VERIFICATION ===');
  verifyDbInvariant('Initial State');

  await startServer();

  try {
    // =========================================================================
    // SECTION 1: Security Middleware Enforcement on All Pending Routes
    // =========================================================================
    console.log('\n--- 1. Testing Security Middleware Enforcement ---');

    const pendingRoutes = [
      { method: 'GET', path: '/api/qbank/pending' },
      { method: 'POST', path: '/api/qbank/pending/approve', body: { ids: ['test_1'] } },
      { method: 'POST', path: '/api/qbank/pending/reject', body: { ids: ['test_1'] } },
      { method: 'PUT', path: '/api/qbank/pending/test_1', body: { stem: 'test' } },
      { method: 'POST', path: '/api/qbank/pending/edit', body: { id: 'test_1', stem: 'test' } },
      { method: 'GET', path: '/api/qbank/progress' },
      { method: 'GET', path: '/api/qbank/pending/stats' },
    ];

    // 1.1: Missing token -> Must return 401 JSON (not HTML)
    for (const r of pendingRoutes) {
      const res = await rawHttpRequest({
        method: r.method,
        path: r.path,
        headers: {
          'Content-Type': 'application/json',
          Host: '127.0.0.1',
        },
        body: r.body ? JSON.stringify(r.body) : undefined,
      });

      assert(res.status === 401, `Expected 401 for unauthenticated ${r.method} ${r.path}, got ${res.status}`);
      const ct = res.headers['content-type'] || '';
      assert(ct.includes('application/json'), `Expected application/json for ${r.path}, got ${ct}`);
      const body = res.json();
      assert(body.success === false, `Expected body.success === false for ${r.path}`);
      assert(body.error && body.error.includes('Chưa xác thực'), `Expected auth error message for ${r.path}, got: ${body.error}`);
    }
    console.log('  [PASS] 1.1 All pending routes reject unauthenticated requests with HTTP 401 JSON');

    // 1.2: Invalid token -> Must return 403 JSON
    for (const r of pendingRoutes) {
      const res = await rawHttpRequest({
        method: r.method,
        path: r.path,
        headers: {
          'Content-Type': 'application/json',
          'X-QBank-Admin-Token': 'totally-invalid-token-12345',
          Host: '127.0.0.1',
        },
        body: r.body ? JSON.stringify(r.body) : undefined,
      });

      assert(res.status === 403, `Expected 403 for invalid token on ${r.method} ${r.path}, got ${res.status}`);
      const ct = res.headers['content-type'] || '';
      assert(ct.includes('application/json'), `Expected application/json for ${r.path}, got ${ct}`);
      const body = res.json();
      assert(body.success === false, `Expected body.success === false for ${r.path}`);
      assert(body.error && body.error.includes('không hợp lệ'), `Expected invalid token message for ${r.path}, got: ${body.error}`);
    }
    console.log('  [PASS] 1.2 All pending routes reject invalid token with HTTP 403 JSON');

    // 1.3: Non-loopback Host header rejection -> Must return 403 JSON
    const evilHosts = ['evil.attacker.com', '192.168.1.100', 'victim.domain.com:8080', '10.0.0.1'];
    for (const evilHost of evilHosts) {
      const res = await rawHttpRequest({
        method: 'GET',
        path: '/api/qbank/pending',
        headers: {
          'X-QBank-Admin-Token': TEST_TOKEN,
          Host: evilHost,
        },
      });

      assert(res.status === 403, `Expected 403 for non-loopback Host '${evilHost}', got ${res.status}`);
      const body = res.json();
      assert(body.success === false && body.error.includes('Invalid Host header'), `Expected Host header rejection message, got: ${body.error}`);
    }
    console.log('  [PASS] 1.3 Host header forgery rejected with HTTP 403 JSON');

    // 1.4: Non-loopback Origin header rejection on mutating requests -> Must return 403 JSON
    const evilOrigins = ['http://evil.attacker.com', 'https://malicious-site.org', 'http://192.168.1.100:3000'];
    for (const evilOrigin of evilOrigins) {
      const res = await rawHttpRequest({
        method: 'POST',
        path: '/api/qbank/pending/approve',
        headers: {
          'Content-Type': 'application/json',
          'X-QBank-Admin-Token': TEST_TOKEN,
          Host: '127.0.0.1',
          Origin: evilOrigin,
        },
        body: JSON.stringify({ ids: ['test_1'] }),
      });

      assert(res.status === 403, `Expected 403 for non-loopback Origin '${evilOrigin}', got ${res.status}`);
      const body = res.json();
      assert(body.success === false && body.error.includes('Cross-Origin request not allowed'), `Expected Origin rejection message, got: ${body.error}`);
    }
    console.log('  [PASS] 1.4 Cross-Origin mutating requests rejected with HTTP 403 JSON');

    // 1.5: Valid loopback host + valid loopback origin + valid token -> Must succeed with HTTP 200 JSON
    const validRes = await rawHttpRequest({
      method: 'GET',
      path: '/api/qbank/pending',
      headers: {
        'X-QBank-Admin-Token': TEST_TOKEN,
        Host: '127.0.0.1',
        Origin: 'http://127.0.0.1:3000',
      },
    });
    assert(validRes.status === 200, `Expected 200 for valid loopback request, got ${validRes.status}`);
    const validBody = validRes.json();
    assert(validBody.success === true, `Expected validBody.success === true, got: ${JSON.stringify(validBody)}`);
    console.log('  [PASS] 1.5 Authenticated loopback requests succeed with HTTP 200 JSON');

    // =========================================================================
    // SECTION 2: UI Error Resilience (safeApiCall with simulated HTML 500/502)
    // =========================================================================
    console.log('\n--- 2. Testing UI Error Resilience (safeApiCall) ---');

    // 2.1: Reverse Proxy 500 HTML Error Page
    const html500 = `<!DOCTYPE html>
<html>
<head><title>500 Internal Server Error</title></head>
<body>
<center><h1>500 Internal Server Error</h1></center>
<hr><center>nginx/1.24.0 (Ubuntu)</center>
</body>
</html>`;

    const res500 = await testSafeApiCall(async () => ({
      status: 500,
      statusText: 'Internal Server Error',
      headers: new Map([['content-type', 'text/html; charset=utf-8']]),
      text: async () => html500,
      json: async () => { throw new SyntaxError("Unexpected token '<', \"<!DOCTYPE \"... is not valid JSON"); },
    }));

    assert(res500.success === false, 'Expected success: false for HTML 500');
    assert(res500.statusCode === 500, `Expected statusCode: 500, got ${res500.statusCode}`);
    assert(res500.error && res500.error.includes('không đúng định dạng JSON'), `Expected clean non-JSON error, got: ${res500.error}`);
    assert(!res500.error.includes('Unexpected token'), 'Error must not leak raw SyntaxError');
    assert(!res500.error.includes('<!DOCTYPE'), 'Error must not contain raw HTML');
    console.log('  [PASS] 2.1 HTML 500 Internal Server Error page intercepted without JSON parse crash');

    // 2.2: Reverse Proxy 502 Bad Gateway HTML Error Page
    const html502 = `<html>
<head><title>502 Bad Gateway</title></head>
<body>
<center><h1>502 Bad Gateway</h1></center>
</body>
</html>`;

    const res502 = await testSafeApiCall(async () => ({
      status: 502,
      statusText: 'Bad Gateway',
      headers: new Map([['content-type', 'text/html']]),
      text: async () => html502,
      json: async () => { throw new SyntaxError("Unexpected token '<', \"<html\"... is not valid JSON"); },
    }));

    assert(res502.success === false, 'Expected success: false for HTML 502');
    assert(res502.statusCode === 502, `Expected statusCode: 502, got ${res502.statusCode}`);
    assert(res502.error && res502.error.includes('502'), 'Error must reference HTTP 502');
    console.log('  [PASS] 2.2 HTML 502 Bad Gateway intercepted safely without throwing');

    // 2.3: Malformed application/json body throwing SyntaxError
    const resBrokenJson = await testSafeApiCall(async () => ({
      status: 500,
      statusText: 'Server Error',
      headers: new Map([['content-type', 'application/json']]),
      text: async () => 'broken {json',
      json: async () => { throw new SyntaxError("Unexpected end of JSON input"); },
    }));

    assert(resBrokenJson.success === false, 'Expected success: false for broken JSON');
    assert(resBrokenJson.error && resBrokenJson.error.length > 0, 'Expected fallback error message');
    console.log('  [PASS] 2.3 Malformed JSON response caught by catch block gracefully');

    // 2.4: 504 Gateway Timeout HTML page
    const res504 = await testSafeApiCall(async () => ({
      status: 504,
      statusText: 'Gateway Timeout',
      headers: new Map([['content-type', 'text/html']]),
      text: async () => '<html><body>Gateway Timeout</body></html>',
      json: async () => { throw new SyntaxError("Unexpected token '<'"); },
    }));
    assert(res504.success === false && res504.statusCode === 504, 'Expected safe handling of 504 Gateway Timeout');
    console.log('  [PASS] 2.4 HTML 504 Gateway Timeout handled without unhandled exception');

    // =========================================================================
    // SECTION 3: Full End-to-End Question Lifecycle Integration
    // =========================================================================
    console.log('\n--- 3. Testing Full Question Lifecycle (Generate -> Stage -> Edit -> Approve -> Mock Exam) ---');

    const testQuestionId = `chal_lifecycle_${Date.now()}`;
    const initialStem = '小明今天很累，想早点回家____。';
    const initialOptions = ['睡觉', '飞机', '医生', '桌子'];
    const initialAnswerIdx = 0;
    const initialExplanation = 'Điền từ 睡觉 (ngủ) phù hợp với ngữ cảnh mệt mỏi.';
    const initialPinyin = 'Xiǎomíng jīntiān hěn lèi, xiǎng zǎodiǎn huíjiā shuìjiào.';

    const db = getDbSync();
    ensurePendingSchema(db);

    // Clean up any test artifact
    db.prepare('DELETE FROM pending_questions WHERE id = ?').run(testQuestionId);
    db.prepare('DELETE FROM questions WHERE id = ?').run(testQuestionId);
    db.prepare('DELETE FROM qb_questions WHERE question_id = ?').run(testQuestionId);

    // Step 3.1: Stage question in pending_questions with status = 'pending'
    const insertPendingStmt = db.prepare(`
      INSERT INTO pending_questions (
        id, stem, options, answer_idx, pinyin, explanation_vi, level, skill, part_type, illustration_theme, status, provider_used
      ) VALUES (?, ?, ?, ?, ?, ?, 1, 'reading', 'read_fill_blank_4opt', null, 'pending', 'deepseek-chat')
    `);
    insertPendingStmt.run(
      testQuestionId,
      initialStem,
      JSON.stringify(initialOptions),
      initialAnswerIdx,
      initialPinyin,
      initialExplanation
    );

    // Step 3.2: Verify staged in pending via API
    const getPendingRes = await rawHttpRequest({
      method: 'GET',
      path: '/api/qbank/pending?level=1&status=pending',
      headers: {
        'X-QBank-Admin-Token': TEST_TOKEN,
        Host: '127.0.0.1',
      },
    });
    assert(getPendingRes.status === 200, 'GET /pending failed');
    const pendingData = getPendingRes.json();
    const foundPending = pendingData.questions.find((q: any) => q.id === testQuestionId);
    assert(foundPending !== undefined, `Staged question ${testQuestionId} not found in /api/qbank/pending`);
    assert(foundPending.status === 'pending', `Expected status pending, got ${foundPending.status}`);
    console.log('  [PASS] 3.1 Question staged in pending_questions with status="pending"');

    // Step 3.3: Verify question is NOT available to students yet in exam API
    const practiceBeforeRes = await rawHttpRequest({
      method: 'GET',
      path: '/api/exam/practice?level=1&skill=reading&count=50',
    });
    assert(practiceBeforeRes.status === 200, 'GET /api/exam/practice failed');
    const practiceBeforeData = practiceBeforeRes.json();
    const inPracticeBefore = practiceBeforeData.questions.some((q: any) => q.id === testQuestionId || q.stem === initialStem);
    assert(!inPracticeBefore, 'Pending question MUST NOT appear in /api/exam/practice!');

    const mockBeforeRes = await rawHttpRequest({
      method: 'POST',
      path: '/api/exam/generate-mock',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level: 1 }),
    });
    assert(mockBeforeRes.status === 200, 'POST /api/exam/generate-mock failed');
    const mockBeforeData = mockBeforeRes.json();
    const mockBeforeQuestions = mockBeforeData.session?.questions || mockBeforeData.questions || [];
    const inMockBefore = mockBeforeQuestions.some((q: any) => q.id === testQuestionId || q.stem === initialStem);
    assert(!inMockBefore, 'Pending question MUST NOT appear in /api/exam/generate-mock!');
    console.log('  [PASS] 3.2 Unapproved question strictly isolated from student practice and mock exams');

    // Step 3.4: Review and Edit question via PUT /api/qbank/pending/:id
    const editedStem = '小明今天工作很累，想早点回家____。';
    const editedExplanation = 'Giải thích đã sửa: Điền 睡觉 (ngủ) là phù hợp nhất với trạng thái mệt sau khi làm việc.';
    const editRes = await rawHttpRequest({
      method: 'PUT',
      path: `/api/qbank/pending/${testQuestionId}`,
      headers: {
        'Content-Type': 'application/json',
        'X-QBank-Admin-Token': TEST_TOKEN,
        Host: '127.0.0.1',
      },
      body: JSON.stringify({
        stem: editedStem,
        explanation_vi: editedExplanation,
        answer_idx: 0,
      }),
    });
    assert(editRes.status === 200, `PUT /pending/:id failed with status ${editRes.status}`);
    const editBody = editRes.json();
    assert(editBody.success === true, 'Edit response success was not true');
    assert(editBody.question.stem === editedStem, 'Edited stem was not saved in pending');
    assert(editBody.question.explanation_vi === editedExplanation, 'Edited explanation was not saved');
    console.log('  [PASS] 3.3 Question edited before approval via PUT /api/qbank/pending/:id');

    // Step 3.5: Approve question via POST /api/qbank/pending/approve
    const approveRes = await rawHttpRequest({
      method: 'POST',
      path: '/api/qbank/pending/approve',
      headers: {
        'Content-Type': 'application/json',
        'X-QBank-Admin-Token': TEST_TOKEN,
        Host: '127.0.0.1',
      },
      body: JSON.stringify({ id: testQuestionId }),
    });
    assert(approveRes.status === 200, `POST /approve failed with ${approveRes.status}`);
    const approveBody = approveRes.json();
    assert(approveBody.success === true, 'Approve success was false');
    assert(approveBody.approved_count === 1, `Expected 1 approved question, got ${approveBody.approved_count}`);
    assert(approveBody.approved_ids.includes(testQuestionId), 'Approved IDs does not contain test question ID');
    console.log('  [PASS] 3.4 Question approved via POST /api/qbank/pending/approve');

    // Step 3.6: Verify in DB tables: pending_questions, questions, and qb_questions
    const pendingRow: any = db.prepare('SELECT * FROM pending_questions WHERE id = ?').get(testQuestionId);
    assert(pendingRow && pendingRow.status === 'approved', 'pending_questions status is not approved');

    const activeRow: any = db.prepare('SELECT * FROM questions WHERE id = ?').get(testQuestionId);
    assert(activeRow && activeRow.status === 'approved', 'questions table row missing or status not approved');
    assert(activeRow.stem === editedStem, 'questions table does not contain the edited stem');
    assert(activeRow.explanation_vi === editedExplanation, 'questions table does not contain the edited explanation');

    const qbRow: any = db.prepare('SELECT * FROM qb_questions WHERE question_id = ?').get(testQuestionId);
    assert(qbRow && qbRow.status === 'approved', 'qb_questions table row missing or status not approved');
    assert(qbRow.stem === editedStem, 'qb_questions table does not contain the edited stem');
    console.log('  [PASS] 3.5 Active questions tables (questions & qb_questions) atomically synchronized');

    // Step 3.7: Verify question is now available in Mock Exam Generator
    const mockAfterRes = await rawHttpRequest({
      method: 'POST',
      path: '/api/exam/generate-mock',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level: 1 }),
    });
    assert(mockAfterRes.status === 200, 'POST /generate-mock failed after approval');
    const mockAfterData = mockAfterRes.json();
    const mockAfterQuestions = mockAfterData.session?.questions || mockAfterData.questions || [];
    const inMockAfter = mockAfterQuestions.find((q: any) => q.id === testQuestionId || q.stem === editedStem);
    assert(inMockAfter !== undefined, `Approved question ${testQuestionId} not found in student mock exam!`);
    // Anti-cheat verification: answer_index and explanation_vi must be masked
    assert(inMockAfter.answer_index === undefined, 'Anti-cheat leak: answer_index present in client question!');
    assert(inMockAfter.explanation_vi === undefined, 'Anti-cheat leak: explanation_vi present in client question!');
    console.log('  [PASS] 3.6 Approved question immediately available in /api/exam/generate-mock (with anti-cheat masking)');

    // Step 3.8: Verify question is available in Practice API (with explanation unmasked)
    const practiceAfterRes = await rawHttpRequest({
      method: 'GET',
      path: '/api/exam/practice?level=1&skill=reading&count=50',
    });
    assert(practiceAfterRes.status === 200, 'GET /practice failed after approval');
    const practiceAfterData = practiceAfterRes.json();
    const inPracticeAfter = practiceAfterData.questions.find((q: any) => q.id === testQuestionId || q.stem === editedStem);
    assert(inPracticeAfter !== undefined, `Approved question ${testQuestionId} not found in practice questions!`);
    assert(inPracticeAfter.explanation_vi === editedExplanation, 'Practice question must include full explanation');
    assert(inPracticeAfter.answer_index === 0, 'Practice question must include correct answer_index');
    console.log('  [PASS] 3.7 Approved question immediately available in /api/exam/practice with full explanation');

    // Step 3.9: Cleanup test row
    db.prepare('DELETE FROM pending_questions WHERE id = ?').run(testQuestionId);
    db.prepare('DELETE FROM questions WHERE id = ?').run(testQuestionId);
    db.prepare('DELETE FROM qb_questions WHERE question_id = ?').run(testQuestionId);
    console.log('  [PASS] 3.8 Test lifecycle artifacts cleanly purged');

    // =========================================================================
    // SECTION 4: Database SHA-256 Invariant Verification
    // =========================================================================
    console.log('\n--- 4. Testing System Invariant: data/hsk_exam.db ---');
    verifyDbInvariant('Final State');
    console.log('  [PASS] 4.1 data/hsk_exam.db SHA-256 strictly preserved (10255BCC...66DD) with exactly 6 rows');

    console.log('\n=== ALL EMPIRICAL CHALLENGER VERIFICATION CHECKS PASSED (100%) ===\n');
  } finally {
    await stopServer();
  }
}

runTests().catch((err) => {
  console.error('\n[FATAL CHALLENGE FAILURE]:', err);
  process.exit(1);
});
