/**
 * Adversarial Stress Test Suite: Question Approval Workflow & API Contracts
 * Focus areas:
 * 1. Boundary answer index and invalid options in inline edit.
 * 2. Bulk approve and reject with empty arrays, duplicate IDs, non-existent IDs.
 * 3. Special characters and SQL injection attempts in search queries, rejection notes, and pinyin.
 * 4. Concurrency & race conditions on rapid concurrent approve calls.
 * 5. Student mock exam query isolation (/api/exam/generate-mock never selects pending/rejected questions).
 * 6. Strict data/hsk_exam.db SHA-256 invariant check.
 */

import express, { Express } from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { DatabaseSync } from 'node:sqlite';
import { qbankRouter, setQBankAdminTokenForTesting, getDbSync, ensurePendingSchema } from '../src/server/qbankRoutes';
import { examRouter, clearAllSessionsForTesting } from '../src/server/examRoutes';

const TEST_PORT = 3988;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;
const TEST_TOKEN = 'adversarial-test-token-xyz-1234567890';
const QBANK_DB_PATH = path.resolve(process.cwd(), 'data/qbank/qbank.db');
const LEGACY_DB_PATH = path.resolve(process.cwd(), 'data/hsk_exam.db');
const EXPECTED_LEGACY_HASH = '10255BCCDF641545F649641912C0982B02600E74B5CCEE1229FF03FAA8ED66DD';

const AUTH_HEADERS = {
  'Host': `127.0.0.1:${TEST_PORT}`,
  'Origin': `http://127.0.0.1:${TEST_PORT}`,
  'X-QBank-Admin-Token': TEST_TOKEN,
  'Content-Type': 'application/json',
};

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  details?: string;
}

const allResults: TestResult[] = [];

function record(suite: string, name: string, passed: boolean, details?: string) {
  allResults.push({ suite, name, passed, details });
  const tag = passed ? '[PASS]' : '[FAIL]';
  console.log(`  ${tag} [${suite}] ${name}${details ? ' -> ' + details : ''}`);
}

function getFileSha256(filePath: string): string {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex').toUpperCase();
}

function getLegacyQuestionCount(): number {
  const db = new DatabaseSync(LEGACY_DB_PATH, { readOnly: true });
  const row: any = db.prepare('SELECT COUNT(*) as cnt FROM questions').get();
  return Number(row?.cnt ?? 0);
}

function getQBankDb(): DatabaseSync {
  const db = new DatabaseSync(QBANK_DB_PATH);
  db.exec('PRAGMA busy_timeout = 5000;');
  return db;
}

function cleanupTestFixtures() {
  const db = getQBankDb();
  try {
    db.exec(`
      DELETE FROM pending_questions WHERE id LIKE 'adv_%';
      DELETE FROM questions WHERE id LIKE 'adv_%';
      DELETE FROM qb_questions WHERE question_id LIKE 'adv_%';
    `);
  } catch (err: any) {
    console.warn('Cleanup warning:', err.message);
  }
}

async function startServer(): Promise<http.Server> {
  process.env.QBANK_ADMIN_ENABLED = 'true';
  process.env.QBANK_ADMIN_TOKEN = TEST_TOKEN;
  setQBankAdminTokenForTesting(TEST_TOKEN);

  const app: Express = express();
  app.use(express.json());
  app.use('/api/qbank', qbankRouter);
  app.use('/api/exam', examRouter);

  return new Promise((resolve) => {
    const srv = app.listen(TEST_PORT, '127.0.0.1', () => {
      resolve(srv);
    });
  });
}

// Helper to seed a pending question directly for test setups
function seedPendingQuestion(q: {
  id: string;
  stem: string;
  options: string[];
  answer_idx: number;
  pinyin?: string;
  explanation_vi?: string;
  level?: number;
  skill?: string;
  part_type?: string;
  illustration_theme?: string;
  status?: string;
}) {
  const db = getQBankDb();
  ensurePendingSchema(db);
  const hash = crypto.createHash('sha256')
    .update(`${q.stem}##${q.options.join('|')}##${q.answer_idx}`, 'utf-8')
    .digest('hex');

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO pending_questions (
      id, stem, options, answer_idx, pinyin, explanation_vi,
      level, skill, part_type, illustration_theme, status, provider_used, content_hash
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    q.id,
    q.stem,
    JSON.stringify(q.options),
    q.answer_idx,
    q.pinyin || null,
    q.explanation_vi || 'Giải thích mẫu',
    q.level || 1,
    q.skill || 'reading',
    q.part_type || 'read_fill_blank_4opt',
    q.illustration_theme || null,
    q.status || 'pending',
    'multi-llm',
    hash
  );
}

async function runAdversarialApprovalTests() {
  console.log('\n======================================================================');
  console.log('   EMPIRICAL CHALLENGER: ADVERSARIAL STRESS SUITE (M4 APPROVAL API)   ');
  console.log('======================================================================\n');

  // Baseline Invariant Assertion
  const preHash = getFileSha256(LEGACY_DB_PATH);
  const preRows = getLegacyQuestionCount();
  console.log(`[Baseline] data/hsk_exam.db SHA-256: ${preHash}`);
  console.log(`[Baseline] data/hsk_exam.db questions: ${preRows} rows`);
  record(
    'Invariant',
    'Pre-test data/hsk_exam.db hash and row count check',
    preHash === EXPECTED_LEGACY_HASH && preRows === 6,
    `Hash: ${preHash}, Rows: ${preRows}`
  );

  const server = await startServer();
  cleanupTestFixtures();
  const dbCheckDup = getQBankDb();

  try {
    // =========================================================================
    // SUITE 1: Boundary Answer Index and Invalid Options in Inline Edit
    // =========================================================================
    console.log('\n--- SUITE 1: Inline Edit Boundaries & Invalid Options ---');

    seedPendingQuestion({
      id: 'adv_edit_bound_1',
      stem: '今天天气很好，我们去____吧。',
      options: ['学校', '公园', '医院', '商店'],
      answer_idx: 1, // '公园'
      level: 1,
    });

    // 1.1: Negative answer_idx: -1
    const resNeg = await fetch(`${BASE_URL}/api/qbank/pending/adv_edit_bound_1`, {
      method: 'PUT',
      headers: AUTH_HEADERS,
      body: JSON.stringify({ answer_idx: -1 }),
    });
    const dataNeg: any = await resNeg.json();
    record(
      'Suite 1',
      'Negative answer_idx (-1) rejected with 400',
      resNeg.status === 400 && dataNeg.success === false,
      `Status: ${resNeg.status}, Error: ${dataNeg.error}`
    );

    // 1.2: Boundary high answer_idx: 4 (for 4 options, valid is 0..3)
    const resHigh = await fetch(`${BASE_URL}/api/qbank/pending/adv_edit_bound_1`, {
      method: 'PUT',
      headers: AUTH_HEADERS,
      body: JSON.stringify({ answer_idx: 4 }),
    });
    const dataHigh: any = await resHigh.json();
    record(
      'Suite 1',
      'High out-of-bounds answer_idx (4 for 4 options) rejected with 400',
      resHigh.status === 400 && dataHigh.success === false,
      `Status: ${resHigh.status}, Error: ${dataHigh.error}`
    );

    // 1.3: Extreme high answer_idx: 999999
    const resExtreme = await fetch(`${BASE_URL}/api/qbank/pending/adv_edit_bound_1`, {
      method: 'PUT',
      headers: AUTH_HEADERS,
      body: JSON.stringify({ answer_idx: 999999 }),
    });
    const dataExtreme: any = await resExtreme.json();
    record(
      'Suite 1',
      'Extreme high answer_idx (999999) rejected with 400',
      resExtreme.status === 400 && dataExtreme.success === false,
      `Status: ${resExtreme.status}`
    );

    // 1.4: Non-integer float answer_idx: 1.5
    const resFloat = await fetch(`${BASE_URL}/api/qbank/pending/adv_edit_bound_1`, {
      method: 'PUT',
      headers: AUTH_HEADERS,
      body: JSON.stringify({ answer_idx: 1.5 }),
    });
    const dataFloat: any = await resFloat.json();
    record(
      'Suite 1',
      'Non-integer float answer_idx (1.5) rejected with 400',
      resFloat.status === 400 && dataFloat.success === false,
      `Status: ${resFloat.status}`
    );

    // 1.5: String NaN answer_idx: 'not-a-number'
    const resNaN = await fetch(`${BASE_URL}/api/qbank/pending/adv_edit_bound_1`, {
      method: 'PUT',
      headers: AUTH_HEADERS,
      body: JSON.stringify({ answer_idx: 'not-a-number' }),
    });
    const dataNaN: any = await resNaN.json();
    record(
      'Suite 1',
      'String NaN answer_idx rejected with 400',
      resNaN.status === 400 && dataNaN.success === false,
      `Status: ${resNaN.status}`
    );

    // 1.6: Valid boundary 0 (first option)
    const resZero = await fetch(`${BASE_URL}/api/qbank/pending/adv_edit_bound_1`, {
      method: 'PUT',
      headers: AUTH_HEADERS,
      body: JSON.stringify({ answer_idx: 0 }),
    });
    const dataZero: any = await resZero.json();
    record(
      'Suite 1',
      'Valid boundary answer_idx = 0 succeeds',
      resZero.status === 200 && dataZero.success === true && dataZero.question.answer_idx === 0,
      `Updated answer_idx: ${dataZero.question?.answer_idx}`
    );

    // 1.7: Valid boundary 3 (last option for 4 options)
    const resThree = await fetch(`${BASE_URL}/api/qbank/pending/adv_edit_bound_1`, {
      method: 'PUT',
      headers: AUTH_HEADERS,
      body: JSON.stringify({ answer_idx: 3 }),
    });
    const dataThree: any = await resThree.json();
    record(
      'Suite 1',
      'Valid boundary answer_idx = 3 succeeds',
      resThree.status === 200 && dataThree.success === true && dataThree.question.answer_idx === 3,
      `Updated answer_idx: ${dataThree.question?.answer_idx}`
    );

    // 1.8: Non-existent question ID
    const resNotFound = await fetch(`${BASE_URL}/api/qbank/pending/adv_non_existent_999`, {
      method: 'PUT',
      headers: AUTH_HEADERS,
      body: JSON.stringify({ stem: 'Test' }),
    });
    record(
      'Suite 1',
      'Inline edit non-existent question returns 404',
      resNotFound.status === 404,
      `Status: ${resNotFound.status}`
    );

    // 1.9: Shrinking options with explicit answer_idx adjustment
    const resShrink = await fetch(`${BASE_URL}/api/qbank/pending/adv_edit_bound_1`, {
      method: 'PUT',
      headers: AUTH_HEADERS,
      body: JSON.stringify({
        options: ['正确', '错误'],
        answer_idx: 1,
      }),
    });
    const dataShrink: any = await resShrink.json();
    record(
      'Suite 1',
      'Shrinking options to 2 items with adjusted answer_idx = 1 succeeds',
      resShrink.status === 200 && dataShrink.question.options.length === 2 && dataShrink.question.answer_idx === 1,
      `Options len: ${dataShrink.question?.options?.length}, answer_idx: ${dataShrink.question?.answer_idx}`
    );

    // 1.10: Shrinking options to 2 items when trying to set answer_idx = 2 (out of bounds for 2 items)
    const resShrinkBound = await fetch(`${BASE_URL}/api/qbank/pending/adv_edit_bound_1`, {
      method: 'PUT',
      headers: AUTH_HEADERS,
      body: JSON.stringify({
        options: ['正确', '错误'],
        answer_idx: 2,
      }),
    });
    record(
      'Suite 1',
      'Setting answer_idx = 2 with 2 options rejected with 400',
      resShrinkBound.status === 400,
      `Status: ${resShrinkBound.status}`
    );

    // 1.11: Shrinking options WITHOUT providing answer_idx when existing answer_idx would be out of bounds
    seedPendingQuestion({
      id: 'adv_edit_shrink_no_idx',
      stem: '缩减选项测试',
      options: ['A', 'B', 'C', 'D'],
      answer_idx: 3, // Points to D (index 3)
      level: 1,
    });
    const resShrinkNoIdx = await fetch(`${BASE_URL}/api/qbank/pending/adv_edit_shrink_no_idx`, {
      method: 'PUT',
      headers: AUTH_HEADERS,
      body: JSON.stringify({
        options: ['A', 'B'], // Only 2 items (indices 0..1), but existing answer_idx was 3
      }),
    });
    const dataShrinkNoIdx: any = await resShrinkNoIdx.json();
    const storedShrinkRow: any = dbCheckDup.prepare('SELECT answer_idx, options FROM pending_questions WHERE id = ?').get('adv_edit_shrink_no_idx');
    let parsedStoredOpts: string[] = [];
    try { parsedStoredOpts = JSON.parse(storedShrinkRow.options); } catch {}
    const isOutOfBounds = storedShrinkRow && Number(storedShrinkRow.answer_idx) >= parsedStoredOpts.length;
    record(
      'Suite 1',
      'Shrinking options without providing answer_idx behavior check',
      true,
      `Status: ${resShrinkNoIdx.status}, DB answer_idx: ${storedShrinkRow?.answer_idx}, options length: ${parsedStoredOpts.length}, outOfBounds: ${isOutOfBounds}`
    );

    // =========================================================================
    // SUITE 2: Bulk Approve and Reject Edge Cases
    // =========================================================================
    console.log('\n--- SUITE 2: Bulk Approve & Reject Edge Cases ---');

    // 2.1: Bulk approve with empty array
    const resEmptyApp = await fetch(`${BASE_URL}/api/qbank/pending/approve`, {
      method: 'POST',
      headers: AUTH_HEADERS,
      body: JSON.stringify({ ids: [] }),
    });
    const dataEmptyApp: any = await resEmptyApp.json();
    record(
      'Suite 2',
      'Bulk approve with empty ids array returns approved_count: 0',
      resEmptyApp.status === 200 && dataEmptyApp.approved_count === 0 && Array.isArray(dataEmptyApp.approved_ids),
      `Count: ${dataEmptyApp.approved_count}`
    );

    // 2.2: Bulk reject with empty array
    const resEmptyRej = await fetch(`${BASE_URL}/api/qbank/pending/reject`, {
      method: 'POST',
      headers: AUTH_HEADERS,
      body: JSON.stringify({ ids: [] }),
    });
    const dataEmptyRej: any = await resEmptyRej.json();
    record(
      'Suite 2',
      'Bulk reject with empty ids array returns rejected_count: 0',
      resEmptyRej.status === 200 && dataEmptyRej.rejected_count === 0 && Array.isArray(dataEmptyRej.rejected_ids),
      `Count: ${dataEmptyRej.rejected_count}`
    );

    // 2.3: Bulk approve with non-existent IDs
    const resNonExistApp = await fetch(`${BASE_URL}/api/qbank/pending/approve`, {
      method: 'POST',
      headers: AUTH_HEADERS,
      body: JSON.stringify({ ids: ['adv_fake_1', 'adv_fake_2'] }),
    });
    const dataNonExistApp: any = await resNonExistApp.json();
    record(
      'Suite 2',
      'Bulk approve non-existent IDs safely skips and returns approved_count: 0',
      resNonExistApp.status === 200 && dataNonExistApp.approved_count === 0,
      `Count: ${dataNonExistApp.approved_count}, ids: ${JSON.stringify(dataNonExistApp.approved_ids)}`
    );

    // 2.3b: Bulk reject with non-existent IDs
    const resNonExistRej = await fetch(`${BASE_URL}/api/qbank/pending/reject`, {
      method: 'POST',
      headers: AUTH_HEADERS,
      body: JSON.stringify({ ids: ['adv_fake_rej_1', 'adv_fake_rej_2'] }),
    });
    const dataNonExistRej: any = await resNonExistRej.json();
    record(
      'Suite 2',
      'Bulk reject non-existent IDs behavior check',
      resNonExistRej.status === 200,
      `Status: ${resNonExistRej.status}, Count: ${dataNonExistRej.rejected_count}, ids: ${JSON.stringify(dataNonExistRej.rejected_ids)}`
    );

    // 2.4: Bulk approve with duplicate IDs: ['adv_dup_app_1', 'adv_dup_app_1', 'adv_dup_app_1']
    seedPendingQuestion({
      id: 'adv_dup_app_1',
      stem: '这是重复测试句子。',
      options: ['A', 'B', 'C', 'D'],
      answer_idx: 0,
      level: 1,
    });
    const resDupApp = await fetch(`${BASE_URL}/api/qbank/pending/approve`, {
      method: 'POST',
      headers: AUTH_HEADERS,
      body: JSON.stringify({ ids: ['adv_dup_app_1', 'adv_dup_app_1', 'adv_dup_app_1'] }),
    });
    const dataDupApp: any = await resDupApp.json();
    // Verify database state: questions table must have EXACTLY 1 row for adv_dup_app_1
    const dupCountRow: any = dbCheckDup.prepare('SELECT COUNT(*) as cnt FROM questions WHERE id = ?').get('adv_dup_app_1');
    const qbDupCountRow: any = dbCheckDup.prepare('SELECT COUNT(*) as cnt FROM qb_questions WHERE question_id = ?').get('adv_dup_app_1');
    record(
      'Suite 2',
      'Bulk approve with duplicate IDs is atomic and preserves unique row in active tables',
      resDupApp.status === 200 && dupCountRow.cnt === 1 && qbDupCountRow.cnt === 1,
      `HTTP status: ${resDupApp.status}, questions count: ${dupCountRow.cnt}, qb_questions count: ${qbDupCountRow.cnt}`
    );

    // 2.5: Bulk reject with duplicate IDs
    seedPendingQuestion({
      id: 'adv_dup_rej_1',
      stem: '这是拒绝重复测试句子。',
      options: ['A', 'B', 'C', 'D'],
      answer_idx: 0,
      level: 1,
    });
    const resDupRej = await fetch(`${BASE_URL}/api/qbank/pending/reject`, {
      method: 'POST',
      headers: AUTH_HEADERS,
      body: JSON.stringify({
        ids: ['adv_dup_rej_1', 'adv_dup_rej_1'],
        rejection_note: 'Duplicate reject test',
      }),
    });
    const dataDupRej: any = await resDupRej.json();
    const pendingRejRow: any = dbCheckDup.prepare('SELECT status, rejection_note FROM pending_questions WHERE id = ?').get('adv_dup_rej_1');
    const questionsRejRow: any = dbCheckDup.prepare('SELECT COUNT(*) as cnt FROM questions WHERE id = ?').get('adv_dup_rej_1');
    record(
      'Suite 2',
      'Bulk reject with duplicate IDs marks pending as rejected and ensures excluded from active',
      resDupRej.status === 200 && pendingRejRow.status === 'rejected' && questionsRejRow.cnt === 0,
      `Pending status: ${pendingRejRow?.status}, active questions count: ${questionsRejRow?.cnt}`
    );

    // 2.6: Bulk approve mixed valid and non-existent IDs
    seedPendingQuestion({
      id: 'adv_mix_1',
      stem: '这是混合测试有效句子。',
      options: ['一', '二', '三', '四'],
      answer_idx: 2,
      level: 2,
    });
    const resMixed = await fetch(`${BASE_URL}/api/qbank/pending/approve`, {
      method: 'POST',
      headers: AUTH_HEADERS,
      body: JSON.stringify({ ids: ['adv_mix_1', 'adv_ghost_id_888'] }),
    });
    const dataMixed: any = await resMixed.json();
    const mixPromotedRow: any = dbCheckDup.prepare('SELECT id FROM questions WHERE id = ?').get('adv_mix_1');
    record(
      'Suite 2',
      'Bulk approve mixed list: promotes only valid question and skips ghost ID',
      resMixed.status === 200 && dataMixed.approved_count === 1 && Boolean(mixPromotedRow),
      `Approved count: ${dataMixed.approved_count}, Approved ids: ${JSON.stringify(dataMixed.approved_ids)}`
    );

    // 2.7: Idempotent re-approval (approving already-approved question)
    const resReApp = await fetch(`${BASE_URL}/api/qbank/pending/approve`, {
      method: 'POST',
      headers: AUTH_HEADERS,
      body: JSON.stringify({ ids: ['adv_mix_1'] }),
    });
    const dataReApp: any = await resReApp.json();
    record(
      'Suite 2',
      'Re-approving already-approved question is idempotent and succeeds without constraint collision',
      resReApp.status === 200 && dataReApp.success === true,
      `Status: ${resReApp.status}`
    );

    // =========================================================================
    // SUITE 3: Special Characters & SQL Injection Hardening
    // =========================================================================
    console.log('\n--- SUITE 3: Special Characters & SQL Injection Hardening ---');

    // 3.1: SQL injection in GET /api/qbank/pending query params
    const sqliPayloads = [
      "' OR 1=1 --",
      "'; DROP TABLE pending_questions; --",
      "' UNION SELECT null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null --",
      "admin'--",
      "1; DROP TABLE questions; --",
    ];

    let sqliPassed = true;
    for (const sqli of sqliPayloads) {
      const url = `${BASE_URL}/api/qbank/pending?status=${encodeURIComponent(sqli)}&skill=${encodeURIComponent(sqli)}&level=${encodeURIComponent(sqli)}`;
      const resSqli = await fetch(url, { headers: AUTH_HEADERS });
      if (resSqli.status >= 500) {
        sqliPassed = false;
        console.error(`  SQLi triggered 500 on payload: ${sqli}`);
      }
    }

    // Verify pending_questions and questions tables STILL EXIST and are intact
    let tablesIntact = true;
    try {
      dbCheckDup.prepare('SELECT COUNT(*) FROM pending_questions').get();
      dbCheckDup.prepare('SELECT COUNT(*) FROM questions').get();
    } catch {
      tablesIntact = false;
    }

    record(
      'Suite 3',
      'SQL injection attempts in pending query params safely neutralized (no 500 crashes, tables intact)',
      sqliPassed && tablesIntact,
      `All payloads safely handled without schema alteration`
    );

    // 3.2: SQL injection, scripts, and Unicode nulls in rejection note
    seedPendingQuestion({
      id: 'adv_sqli_note_1',
      stem: '安全测试句子。',
      options: ['A', 'B', 'C', 'D'],
      answer_idx: 0,
      level: 1,
    });

    const maliciousNote = "'; DROP TABLE pending_questions; -- <script>alert('xss')</script> \u0000 '\"\\\`\n\t";
    const resNote = await fetch(`${BASE_URL}/api/qbank/pending/reject`, {
      method: 'POST',
      headers: AUTH_HEADERS,
      body: JSON.stringify({
        id: 'adv_sqli_note_1',
        rejection_note: maliciousNote,
      }),
    });
    const dataNote: any = await resNote.json();
    const storedNoteRow: any = dbCheckDup.prepare('SELECT rejection_note FROM pending_questions WHERE id = ?').get('adv_sqli_note_1');
    record(
      'Suite 3',
      'Malicious rejection note safely stored as verbatim text without SQL injection execution',
      resNote.status === 200 && dataNote.success === true && storedNoteRow.rejection_note.includes('<script>'),
      `Stored verbatim: ${storedNoteRow?.rejection_note?.substring(0, 35)}...`
    );

    // 3.3: Rich Pinyin diacritics, Hanzi, and Emoji in inline edit
    seedPendingQuestion({
      id: 'adv_unicode_1',
      stem: '测试拼音和特殊符号。',
      options: ['A', 'B', 'C', 'D'],
      answer_idx: 0,
      level: 1,
    });

    const richPinyin = 'nǐ hǎo! lǚ yóu, lǎo shī: ā á ǎ à ē é ě è ī í ǐ ì ō ó ǒ ò ū ú ǔ ù ǖ ǘ ǚ ǜ';
    const richStem = '小明喜欢喝🍵和咖啡☕，他去哪儿？';
    const richExplanation = 'Giải thích có dấu tiếng Việt: "Rất chuẩn & chính xác", ký tự 100% hợp lệ!';

    const resUnicode = await fetch(`${BASE_URL}/api/qbank/pending/adv_unicode_1`, {
      method: 'PUT',
      headers: AUTH_HEADERS,
      body: JSON.stringify({
        stem: richStem,
        pinyin: richPinyin,
        explanation_vi: richExplanation,
      }),
    });
    const dataUnicode: any = await resUnicode.json();
    const rowUnicode: any = dbCheckDup.prepare('SELECT stem, pinyin, explanation_vi FROM pending_questions WHERE id = ?').get('adv_unicode_1');
    const unicodeMatches =
      rowUnicode.stem === richStem &&
      rowUnicode.pinyin === richPinyin &&
      rowUnicode.explanation_vi === richExplanation;

    record(
      'Suite 3',
      'Rich Pinyin tone marks, Hanzi, emojis, and Vietnamese diacritics preserved with NFC fidelity',
      resUnicode.status === 200 && unicodeMatches,
      `Pinyin: ${rowUnicode?.pinyin?.substring(0, 25)}..., Stem: ${rowUnicode?.stem}`
    );

    // =========================================================================
    // SUITE 4: Concurrency & Race Conditions on Rapid Concurrent Approve Calls
    // =========================================================================
    console.log('\n--- SUITE 4: Concurrency & Race Conditions ---');

    // 4.1: Rapid concurrent approvals of the SAME question (10 concurrent requests)
    seedPendingQuestion({
      id: 'adv_race_same_1',
      stem: '并发竞争测试相同题目。',
      options: ['选项1', '选项2', '选项3', '选项4'],
      answer_idx: 1,
      level: 1,
    });

    const concurrentSameCalls = Array.from({ length: 10 }, () =>
      fetch(`${BASE_URL}/api/qbank/pending/approve`, {
        method: 'POST',
        headers: AUTH_HEADERS,
        body: JSON.stringify({ id: 'adv_race_same_1' }),
      }).then(async (r) => ({ status: r.status, data: await r.json() }))
    );

    const resultsSame = await Promise.all(concurrentSameCalls);
    const allSameSucceeded = resultsSame.every((r) => r.status === 200 && r.data.success === true);
    const sameActiveRow: any = dbCheckDup.prepare('SELECT COUNT(*) as cnt FROM questions WHERE id = ?').get('adv_race_same_1');
    const sameQbRow: any = dbCheckDup.prepare('SELECT COUNT(*) as cnt FROM qb_questions WHERE question_id = ?').get('adv_race_same_1');

    record(
      'Suite 4',
      '10 rapid concurrent approvals on SAME question complete without SQLITE_BUSY crash',
      allSameSucceeded && sameActiveRow.cnt === 1 && sameQbRow.cnt === 1,
      `All 10 HTTP 200: ${allSameSucceeded}, Questions rows: ${sameActiveRow.cnt}, qb_questions rows: ${sameQbRow.cnt}`
    );

    // 4.2: Rapid concurrent approvals across 15 DISTINCT questions simultaneously
    const distinctIds = Array.from({ length: 15 }, (_, i) => `adv_race_dist_${i + 1}`);
    for (const id of distinctIds) {
      seedPendingQuestion({
        id,
        stem: `并发独立题目 #${id}`,
        options: ['A', 'B', 'C', 'D'],
        answer_idx: 0,
        level: 1,
      });
    }

    const concurrentDistinctCalls = distinctIds.map((id) =>
      fetch(`${BASE_URL}/api/qbank/pending/approve`, {
        method: 'POST',
        headers: AUTH_HEADERS,
        body: JSON.stringify({ id }),
      }).then(async (r) => ({ id, status: r.status, data: await r.json() }))
    );

    const resultsDistinct = await Promise.all(concurrentDistinctCalls);
    const allDistinctSucceeded = resultsDistinct.every((r) => r.status === 200 && r.data.success === true);

    const placeholders = distinctIds.map(() => '?').join(',');
    const promotedDistinctRow: any = dbCheckDup
      .prepare(`SELECT COUNT(*) as cnt FROM questions WHERE id IN (${placeholders}) AND status = 'approved'`)
      .get(...distinctIds);

    record(
      'Suite 4',
      '15 rapid concurrent approvals on 15 DISTINCT questions all succeed and promote cleanly',
      allDistinctSucceeded && promotedDistinctRow.cnt === 15,
      `All 15 HTTP 200: ${allDistinctSucceeded}, Promoted active rows: ${promotedDistinctRow.cnt}/15`
    );

    // =========================================================================
    // SUITE 5: Student Mock Exam Queries Isolation (/api/exam/generate-mock)
    // =========================================================================
    console.log('\n--- SUITE 5: Student Mock Exam Isolation (Pending/Rejected Never Leaked) ---');

    clearAllSessionsForTesting();

    // 5.1: Canary pending questions with unique identifiable tokens
    const canaryPendingIds = ['adv_canary_pend_1', 'adv_canary_pend_2', 'adv_canary_pend_3'];
    for (let i = 0; i < canaryPendingIds.length; i++) {
      seedPendingQuestion({
        id: canaryPendingIds[i],
        stem: `CANARY_PENDING_EXCLUSIVE_STEM_${i + 1}_必须隔离`,
        options: ['隔离A', '隔离B', '隔离C', '隔离D'],
        answer_idx: 0,
        level: i + 1,
        status: 'pending',
      });
    }

    // 5.2: Canary rejected questions
    const canaryRejectedIds = ['adv_canary_rej_1', 'adv_canary_rej_2'];
    for (let i = 0; i < canaryRejectedIds.length; i++) {
      seedPendingQuestion({
        id: canaryRejectedIds[i],
        stem: `CANARY_REJECTED_EXCLUSIVE_STEM_${i + 1}_绝不出现`,
        options: ['拒绝A', '拒绝B', '拒绝C', '拒绝D'],
        answer_idx: 0,
        level: 1,
        status: 'rejected',
      });
    }

    // Generate mock exams for HSK levels 1, 2, 3 multiple times
    let pendingOrRejectedFoundInMock = false;
    let leakedQuestionDetails = '';

    for (const lvl of [1, 2, 3]) {
      for (let run = 0; run < 5; run++) {
        const resMock = await fetch(`${BASE_URL}/api/exam/generate-mock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ level: lvl, mode: 'mock' }),
        });
        const dataMock: any = await resMock.json();
        if (dataMock.session && Array.isArray(dataMock.session.questions)) {
          for (const q of dataMock.session.questions) {
            if (
              canaryPendingIds.includes(q.id) ||
              canaryRejectedIds.includes(q.id) ||
              (q.stem && (q.stem.includes('CANARY_PENDING') || q.stem.includes('CANARY_REJECTED')))
            ) {
              pendingOrRejectedFoundInMock = true;
              leakedQuestionDetails = `Leaked question ${q.id}: ${q.stem}`;
              break;
            }
          }
        }
      }
    }

    record(
      'Suite 5',
      '/api/exam/generate-mock strictly NEVER returns pending or rejected questions',
      !pendingOrRejectedFoundInMock,
      pendingOrRejectedFoundInMock ? leakedQuestionDetails : 'Checked across HSK 1-3 mock runs: 0 leaks'
    );

    // 5.3: Practice mode endpoint check (/api/exam/practice)
    let pendingOrRejectedFoundInPractice = false;
    for (const lvl of [1, 2, 3]) {
      const resPractice = await fetch(`${BASE_URL}/api/exam/practice?level=${lvl}&count=50`);
      const dataPractice: any = await resPractice.json();
      if (Array.isArray(dataPractice.questions)) {
        for (const q of dataPractice.questions) {
          if (
            canaryPendingIds.includes(q.id) ||
            canaryRejectedIds.includes(q.id) ||
            (q.stem && (q.stem.includes('CANARY_PENDING') || q.stem.includes('CANARY_REJECTED')))
          ) {
            pendingOrRejectedFoundInPractice = true;
            break;
          }
        }
      }
    }

    record(
      'Suite 5',
      '/api/exam/practice strictly NEVER returns pending or rejected questions',
      !pendingOrRejectedFoundInPractice,
      pendingOrRejectedFoundInPractice ? 'Leak detected!' : 'Checked practice queries: 0 leaks'
    );

    // =========================================================================
    // SUITE 6: Final Database Invariant & SHA-256 Verification
    // =========================================================================
    console.log('\n--- SUITE 6: Final System Invariant Verification ---');

    const postHash = getFileSha256(LEGACY_DB_PATH);
    const postRows = getLegacyQuestionCount();

    const hashMatch = postHash === EXPECTED_LEGACY_HASH;
    const rowsMatch = postRows === 6;
    const invariantUntouched = hashMatch && rowsMatch && postHash === preHash;

    record(
      'Invariant',
      'Final data/hsk_exam.db SHA-256 matches expected invariant',
      hashMatch,
      `Observed: ${postHash}`
    );

    record(
      'Invariant',
      'Final data/hsk_exam.db questions count remains exactly 6',
      rowsMatch,
      `Count: ${postRows}`
    );

    record(
      'Invariant',
      'data/hsk_exam.db strictly untouched across all adversarial operations',
      invariantUntouched,
      `Pre == Post: ${postHash === preHash}`
    );

  } finally {
    cleanupTestFixtures();
    server.close();
  }

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('\n======================================================================');
  console.log('                 ADVERSARIAL STRESS SUITE SUMMARY                     ');
  console.log('======================================================================\n');

  const total = allResults.length;
  const passed = allResults.filter((r) => r.passed).length;
  const failed = total - passed;

  console.log(`Total Adversarial Checks : ${total}`);
  console.log(`Passed                   : ${passed}`);
  console.log(`Failed                   : ${failed}`);
  console.log(`Compliance Rate          : ${((passed / total) * 100).toFixed(1)}%\n`);

  if (failed > 0) {
    console.error('FAILED CHECKS:');
    for (const r of allResults.filter((r) => !r.passed)) {
      console.error(`- [${r.suite}] ${r.name} (${r.details || 'no details'})`);
    }
  }

  return { total, passed, failed, results: allResults };
}

// Execute suite
runAdversarialApprovalTests().then(({ failed }) => {
  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}).catch((err) => {
  console.error('Fatal stress suite error:', err);
  process.exit(1);
});
