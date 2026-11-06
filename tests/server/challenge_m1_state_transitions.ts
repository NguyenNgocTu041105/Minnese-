/**
 * Empirical Challenge Harness for Milestone 1:
 * State Transitions, Pending Isolation, Promotion Consistency, Rejection Consistency,
 * Progress Calculation across HSK 1-5, and Database Hash Invariant.
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
import { examRouter } from '../../src/server/examRoutes';

const EXPECTED_LEGACY_DB_HASH = '10255BCCDF641545F649641912C0982B02600E74B5CCEE1229FF03FAA8ED66DD';
const LEGACY_DB_PATH = path.resolve(process.cwd(), 'data/hsk_exam.db');
const QBANK_DB_PATH = path.resolve(process.cwd(), 'data/qbank/qbank.db');
const CHALLENGE_TOKEN = 'challenger-token-' + Date.now();

let server: http.Server;
let baseUrl: string;

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`[CHALLENGE FAILED]: ${message}`);
  }
}

function getDbHash(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex').toUpperCase();
}

async function startServer(): Promise<void> {
  setQBankAdminTokenForTesting(CHALLENGE_TOKEN);

  const app = express();
  app.use(express.json());
  app.use('/api/qbank', qbankRouter);
  app.use('/api/exam', examRouter);

  return new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const addr = server.address() as any;
      baseUrl = `http://127.0.0.1:${addr.port}`;
      resolve();
    });
  });
}

async function stopServer(): Promise<void> {
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
  headers: Record<string, string> = {}
): Promise<{ status: number; body: any }> {
  const url = `${baseUrl}${urlPath}`;
  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-QBank-Admin-Token': CHALLENGE_TOKEN,
    ...headers,
  };

  const res = await fetch(url, {
    method,
    headers: reqHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  let json: any = null;
  try {
    json = await res.json();
  } catch {
    // Non-JSON response
  }

  return { status: res.status, body: json };
}

async function runEmpiricalChallenge() {
  console.log('================================================================');
  console.log(' EMPIRICAL CHALLENGE SUITE: MILESTONE 1 STATE TRANSITIONS');
  console.log('================================================================\n');

  // Step 0: Initial Invariant Check
  console.log('[Invariant Check 0] Verifying data/hsk_exam.db initial hash...');
  const initialHash = getDbHash(LEGACY_DB_PATH);
  console.log(`  Hash: ${initialHash}`);
  assert(initialHash === EXPECTED_LEGACY_DB_HASH, 'Initial hash must match invariant');
  console.log('  -> PASS: Initial hash matches invariant.\n');

  await startServer();

  const createdIds: string[] = [];
  const db = new DatabaseSync(QBANK_DB_PATH);
  ensurePendingSchema(db);

  try {
    // =========================================================================
    // CHALLENGE 1: Pending Isolation
    // =========================================================================
    console.log('[Challenge 1] Testing Pending Isolation from Exam Mock Assembler...');
    const isoToken = `ISOLATION_SECRET_${Date.now()}`;
    const pendingIds: string[] = [];

    // Insert 5 pending questions across levels 1-5 with distinct marker
    for (let lvl = 1; lvl <= 5; lvl++) {
      const id = `pend_iso_lvl${lvl}_${Date.now()}`;
      pendingIds.push(id);
      createdIds.push(id);

      db.prepare(`
        INSERT INTO pending_questions (
          id, stem, options, answer_idx, pinyin, explanation_vi, level, skill, part_type, illustration_theme, status, provider_used
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'deepseek-v3')
      `).run(
        id,
        `这是一个关于${isoToken}的第${lvl}级待审核测试题____。`,
        JSON.stringify(['苹果', '香蕉', '西瓜', '医院']),
        (lvl - 1) % 4,
        `zhè shì yī gè ${lvl}`,
        `Giải thích kiểm thử pending isolation cấp ${lvl}`,
        lvl,
        lvl % 2 === 0 ? 'listening' : 'reading',
        'read_fill_blank_4opt',
        `theme_${lvl}`
      );
    }

    // 1.1: Verify in qb_questions via mock assembler query
    console.log('  1.1 Checking mock assembler query: SELECT * FROM qb_questions WHERE status = "approved"');
    const approvedRows = db.prepare("SELECT * FROM qb_questions WHERE status = 'approved'").all() as any[];
    for (const pendingId of pendingIds) {
      const leakedInQb = approvedRows.find((r) => r.question_id === pendingId);
      assert(!leakedInQb, `LEAK DETECTED: Pending question ${pendingId} found in qb_questions approved!`);
    }

    // 1.2: Verify no pending questions exist in qb_questions at all (even without status filter)
    console.log('  1.2 Checking qb_questions for any existence of pending questions...');
    for (const pendingId of pendingIds) {
      const anyInQb = db.prepare('SELECT * FROM qb_questions WHERE question_id = ?').get(pendingId);
      assert(!anyInQb, `LEAK DETECTED: Pending question ${pendingId} exists in qb_questions!`);
    }

    // 1.3: Verify in questions table
    console.log('  1.3 Checking questions table...');
    const questionsRows = db.prepare("SELECT * FROM questions WHERE status = 'approved'").all() as any[];
    for (const pendingId of pendingIds) {
      const leakedInQuestions = questionsRows.find((r) => r.id === pendingId);
      assert(!leakedInQuestions, `LEAK DETECTED: Pending question ${pendingId} found in questions table!`);
    }

    // 1.4: Verify via mock exam assembler API (GET /api/exam/practice)
    console.log('  1.4 Querying student practice API to ensure pending questions never leak to students...');
    for (let lvl = 1; lvl <= 5; lvl++) {
      const practiceRes = await apiRequest('GET', `/api/exam/practice?level=${lvl}&count=50`);
      if (practiceRes.status === 200 && practiceRes.body.questions) {
        for (const q of practiceRes.body.questions) {
          assert(!q.stem.includes(isoToken), `STUDENT LEAK: Stem with ${isoToken} returned in practice API!`);
        }
      }
    }
    console.log('  -> PASS: Pending questions are strictly isolated from mock assembler and students.\n');

    // =========================================================================
    // CHALLENGE 2: Promotion Consistency
    // =========================================================================
    console.log('[Challenge 2] Testing Promotion Consistency upon Approval...');
    const promoId1 = `promo_test_1_${Date.now()}`;
    const promoId2 = `promo_test_2_${Date.now()}`;
    createdIds.push(promoId1, promoId2);

    const stem1 = '老师给学生发了一本____。';
    const opts1 = ['新书', '旧车', '大树', '飞机'];
    const pinyin1 = 'lǎoshī gěi xuéshēng fā le yī běn ____.';
    const topic1 = 'classroom_books';
    const expectedHash1 = computeContentHash(stem1, opts1, 0);

    const stem2 = '听力测试：请选择你听到的正确选项____。';
    const opts2 = ['去超市', '看电影', '去机场', '回家'];
    const pinyin2 = 'tīnglì cèshì: qǐng xuǎnzé nǐ tīngdào de zhèngquè xuǎnxiàng ____.';
    const topic2 = 'listening_travel';
    const expectedHash2 = computeContentHash(stem2, opts2, 3);

    // Insert pending records: note promoId1 has answer_idx = 0 (boundary/falsy check)
    db.prepare(`
      INSERT INTO pending_questions (
        id, stem, options, answer_idx, pinyin, explanation_vi, level, skill, part_type, illustration_theme, status, provider_used
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'gemini-1.5-flash')
    `).run(
      promoId1,
      stem1,
      JSON.stringify(opts1),
      0, // answer_idx = 0
      pinyin1,
      'Giải thích tiếng Việt câu 1: 新书 (sách mới)',
      1,
      'reading',
      'read_fill_blank_4opt',
      topic1
    );

    db.prepare(`
      INSERT INTO pending_questions (
        id, stem, options, answer_idx, pinyin, explanation_vi, level, skill, part_type, illustration_theme, status, provider_used
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'groq-llama3')
    `).run(
      promoId2,
      stem2,
      JSON.stringify(opts2),
      3, // answer_idx = 3
      pinyin2,
      'Giải thích tiếng Việt câu 2: 回家 (về nhà)',
      2,
      'listening',
      'listen_comprehension_4opt',
      topic2
    );

    // 2.1 Single Approval of promoId1
    console.log('  2.1 Approving single question with answer_idx = 0...');
    const approveRes1 = await apiRequest('POST', '/api/qbank/pending/approve', { id: promoId1 });
    assert(approveRes1.status === 200 && approveRes1.body.success === true, 'Approval request 1 must succeed');
    assert(approveRes1.body.approved_count === 1, 'Approved count must be 1');

    // Verify promoId1 in qb_questions
    const qbRow1: any = db.prepare('SELECT * FROM qb_questions WHERE question_id = ?').get(promoId1);
    assert(qbRow1 !== undefined, 'qb_questions must contain promoId1');
    assert(qbRow1.status === 'approved', 'qb_questions status must be approved');
    assert(qbRow1.answer_index === 0, `answer_index must be exact integer 0, got ${qbRow1.answer_index}`);
    assert(qbRow1.topic === topic1, `topic must match illustration_theme "${topic1}", got "${qbRow1.topic}"`);
    assert(qbRow1.pinyin_stem === pinyin1, `pinyin_stem must match "${pinyin1}", got "${qbRow1.pinyin_stem}"`);
    assert(qbRow1.content_hash === expectedHash1, `content_hash must match NFC hash "${expectedHash1}", got "${qbRow1.content_hash}"`);

    // Verify promoId1 in questions table
    const qRow1: any = db.prepare('SELECT * FROM questions WHERE id = ?').get(promoId1);
    assert(qRow1 !== undefined && qRow1.status === 'approved', 'questions table must contain promoId1 with status approved');
    assert(qRow1.answer_idx === 0, `questions table answer_idx must be 0, got ${qRow1.answer_idx}`);

    // Verify promoId1 in pending_questions table
    const pRow1: any = db.prepare('SELECT * FROM pending_questions WHERE id = ?').get(promoId1);
    assert(pRow1.status === 'approved', 'pending_questions status must be approved');

    // 2.2 Bulk Approval of promoId2
    console.log('  2.2 Bulk approving promoId2 (with answer_idx = 3)...');
    const approveRes2 = await apiRequest('POST', '/api/qbank/pending/approve', { ids: [promoId2] });
    assert(approveRes2.status === 200 && approveRes2.body.approved_count === 1, 'Bulk approval must succeed');

    const qbRow2: any = db.prepare('SELECT * FROM qb_questions WHERE question_id = ?').get(promoId2);
    assert(qbRow2 !== undefined, 'qb_questions must contain promoId2');
    assert(qbRow2.status === 'approved', 'qb_questions status must be approved');
    assert(qbRow2.answer_index === 3, `answer_index must be 3, got ${qbRow2.answer_index}`);
    assert(qbRow2.topic === topic2, `topic must match "${topic2}", got "${qbRow2.topic}"`);
    assert(qbRow2.pinyin_stem === pinyin2, `pinyin_stem must match "${pinyin2}", got "${qbRow2.pinyin_stem}"`);
    assert(qbRow2.content_hash === expectedHash2, `content_hash must match "${expectedHash2}", got "${qbRow2.content_hash}"`);

    // 2.3 Assembler Query Promotion Verification
    console.log('  2.3 Verifying promoted questions appear immediately in assembler query...');
    const assemblerLvl1 = db.prepare("SELECT * FROM qb_questions WHERE level = 1 AND status = 'approved'").all() as any[];
    const foundInLvl1 = assemblerLvl1.some((r) => r.question_id === promoId1);
    assert(foundInLvl1, `promoId1 must be present in assembler query for level 1!`);

    const assemblerLvl2 = db.prepare("SELECT * FROM qb_questions WHERE level = 2 AND status = 'approved'").all() as any[];
    const foundInLvl2 = assemblerLvl2.some((r) => r.question_id === promoId2);
    assert(foundInLvl2, `promoId2 must be present in assembler query for level 2!`);

    // 2.4 Idempotency Check: Approve already-approved question
    console.log('  2.4 Testing idempotency: Approving already-approved questions again...');
    const reApproveRes = await apiRequest('POST', '/api/qbank/pending/approve', { ids: [promoId1, promoId2] });
    assert(reApproveRes.status === 200 && reApproveRes.body.approved_count === 2, 'Re-approval should succeed gracefully');
    const qbRow1Again: any = db.prepare('SELECT * FROM qb_questions WHERE question_id = ?').get(promoId1);
    assert(qbRow1Again.content_hash === expectedHash1, 'content_hash must remain identical after re-approval');
    console.log('  -> PASS: Promotion creates exact records and is fully idempotent.\n');

    // =========================================================================
    // CHALLENGE 3: Rejection Consistency & Revocation
    // =========================================================================
    console.log('[Challenge 3] Testing Rejection Consistency & Active Revocation...');
    const rejPendingId = `rej_test_pend_${Date.now()}`;
    const rejApprovedId = `rej_test_appr_${Date.now()}`;
    createdIds.push(rejPendingId, rejApprovedId);

    // 3.1 Reject a pending question
    db.prepare(`
      INSERT INTO pending_questions (
        id, stem, options, answer_idx, pinyin, explanation_vi, level, skill, part_type, illustration_theme, status, provider_used
      ) VALUES (?, 'Reject test stem 1 ____', '["A","B"]', 0, 'pinyin', 'exp', 1, 'reading', 'read_fill_blank_4opt', 'theme', 'pending', 'deepseek-v3')
    `).run(rejPendingId);

    console.log('  3.1 Rejecting pending question with Vietnamese rejection note...');
    const testNote = 'Từ vựng câu này chưa tự nhiên, cần viết lại câu dẫn.';
    const rejRes1 = await apiRequest('POST', '/api/qbank/pending/reject', {
      id: rejPendingId,
      rejection_note: testNote,
    });
    assert(rejRes1.status === 200 && rejRes1.body.rejected_count === 1, 'Reject pending must succeed');

    // Check pending_questions
    const rejRow1: any = db.prepare('SELECT * FROM pending_questions WHERE id = ?').get(rejPendingId);
    assert(rejRow1.status === 'rejected', `Status must be rejected, got ${rejRow1.status}`);
    assert(rejRow1.rejection_note === testNote, `rejection_note must be "${testNote}", got "${rejRow1.rejection_note}"`);

    // Check absence from qb_questions and questions
    const qbRej1 = db.prepare('SELECT * FROM qb_questions WHERE question_id = ?').get(rejPendingId);
    assert(qbRej1 === undefined, 'Rejected question must be completely absent from qb_questions');
    const qRej1 = db.prepare('SELECT * FROM questions WHERE id = ?').get(rejPendingId);
    assert(qRej1 === undefined, 'Rejected question must be completely absent from questions');

    // 3.2 Reject an ALREADY APPROVED question (Revocation test)
    console.log('  3.2 Rejecting an ALREADY APPROVED question (testing revocation from active pool)...');
    // First insert and approve rejApprovedId
    db.prepare(`
      INSERT INTO pending_questions (
        id, stem, options, answer_idx, pinyin, explanation_vi, level, skill, part_type, illustration_theme, status, provider_used
      ) VALUES (?, 'Approved then revoked stem ____', '["A","B"]', 0, 'pinyin', 'exp', 3, 'reading', 'read_fill_blank_4opt', 'theme', 'pending', 'gemini-1.5-flash')
    `).run(rejApprovedId);

    const apprBeforeRej = await apiRequest('POST', '/api/qbank/pending/approve', { id: rejApprovedId });
    assert(apprBeforeRej.body.approved_count === 1, 'Initial approval must succeed');
    assert(db.prepare('SELECT * FROM qb_questions WHERE question_id = ?').get(rejApprovedId) !== undefined, 'Must exist in qb_questions before revocation');

    // Now reject it!
    const revokeNote = 'Phát hiện lỗi sai sau khi duyệt: thu hồi khỏi đề thi.';
    const revokeRes = await apiRequest('POST', '/api/qbank/pending/reject', {
      id: rejApprovedId,
      rejection_note: revokeNote,
    });
    assert(revokeRes.status === 200 && revokeRes.body.rejected_count === 1, 'Revocation reject must succeed');

    // Verify eviction from qb_questions and questions
    const qbRevoked = db.prepare('SELECT * FROM qb_questions WHERE question_id = ?').get(rejApprovedId);
    assert(qbRevoked === undefined, 'Revoked question MUST BE DELETED from qb_questions!');
    const qRevoked = db.prepare('SELECT * FROM questions WHERE id = ?').get(rejApprovedId);
    assert(qRevoked === undefined, 'Revoked question MUST BE DELETED from questions table!');

    // Verify status in pending_questions is rejected
    const pRevoked: any = db.prepare('SELECT * FROM pending_questions WHERE id = ?').get(rejApprovedId);
    assert(pRevoked.status === 'rejected', 'Status in pending_questions must be updated to rejected');
    assert(pRevoked.rejection_note === revokeNote, 'rejection_note must be preserved');
    console.log('  -> PASS: Rejection correctly records notes, excludes from qb_questions, and successfully revokes previously approved questions.\n');

    // =========================================================================
    // CHALLENGE 4: Progress Calculation across HSK 1-5
    // =========================================================================
    console.log('[Challenge 4] Testing Progress Calculation Accuracy across HSK 1-5...');
    // Get baseline stats
    const baseProg = await apiRequest('GET', '/api/qbank/progress');
    assert(baseProg.status === 200 && baseProg.body.success === true, 'Baseline progress call must succeed');
    const baseP = baseProg.body.pending_by_level;
    const baseA = baseProg.body.approved_by_level;
    const baseR = baseProg.body.rejected_by_level;
    const baseTotalP = baseProg.body.total_pending;
    const baseTotalA = baseProg.body.total_approved;

    console.log('  4.1 Baseline counts:');
    console.log(`    Pending:  ${JSON.stringify(baseP)} (Total: ${baseTotalP})`);
    console.log(`    Approved: ${JSON.stringify(baseA)} (Total: ${baseTotalA})`);
    console.log(`    Rejected: ${JSON.stringify(baseR)}`);

    // Planned deltas:
    // HSK 1: +2 pending, +1 approved, +1 rejected
    // HSK 2: +1 pending, +2 approved, +0 rejected
    // HSK 3: +0 pending, +1 approved, +2 rejected
    // HSK 4: +3 pending, +0 approved, +1 rejected
    // HSK 5: +1 pending, +1 approved, +1 rejected
    const deltas: Record<number, { p: number; a: number; r: number }> = {
      1: { p: 2, a: 1, r: 1 },
      2: { p: 1, a: 2, r: 0 },
      3: { p: 0, a: 1, r: 2 },
      4: { p: 3, a: 0, r: 1 },
      5: { p: 1, a: 1, r: 1 },
    };

    let totalDeltaP = 0;
    let totalDeltaA = 0;

    for (let lvl = 1; lvl <= 5; lvl++) {
      const cfg = deltas[lvl];
      totalDeltaP += cfg.p;
      totalDeltaA += cfg.a;

      // Insert pending
      for (let i = 0; i < cfg.p; i++) {
        const id = `prog_test_p_lvl${lvl}_${i}_${Date.now()}`;
        createdIds.push(id);
        db.prepare(`
          INSERT INTO pending_questions (id, stem, options, answer_idx, explanation_vi, level, skill, part_type, status)
          VALUES (?, 'Prog pending stem', '["A","B"]', 0, 'exp', ?, 'reading', 'read_fill_blank_4opt', 'pending')
        `).run(id, lvl);
      }

      // Insert approved
      for (let i = 0; i < cfg.a; i++) {
        const id = `prog_test_a_lvl${lvl}_${i}_${Date.now()}`;
        createdIds.push(id);
        db.prepare(`
          INSERT INTO pending_questions (id, stem, options, answer_idx, explanation_vi, level, skill, part_type, status)
          VALUES (?, 'Prog approved stem', '["A","B"]', 0, 'exp', ?, 'reading', 'read_fill_blank_4opt', 'approved')
        `).run(id, lvl);
        db.prepare(`
          INSERT INTO questions (id, stem, options, answer_idx, explanation_vi, level, skill, part_type, status)
          VALUES (?, 'Prog approved stem', '["A","B"]', 0, 'exp', ?, 'reading', 'read_fill_blank_4opt', 'approved')
        `).run(id, lvl);
        db.prepare(`
          INSERT INTO qb_questions (question_id, stem, options, answer_index, explanation_vi, level, skill, part_type, status, provenance, qa, content_hash)
          VALUES (?, 'Prog approved stem', '["A","B"]', 0, 'exp', ?, 'reading', 'read_fill_blank_4opt', 'approved', '{}', '{}', ?)
        `).run(id, lvl, computeContentHash(`Prog approved stem ${id}`, ['A', 'B'], 0));
      }

      // Insert rejected
      for (let i = 0; i < cfg.r; i++) {
        const id = `prog_test_r_lvl${lvl}_${i}_${Date.now()}`;
        createdIds.push(id);
        db.prepare(`
          INSERT INTO pending_questions (id, stem, options, answer_idx, explanation_vi, level, skill, part_type, status, rejection_note)
          VALUES (?, 'Prog rejected stem', '["A","B"]', 0, 'exp', ?, 'reading', 'read_fill_blank_4opt', 'rejected', 'prog note')
        `).run(id, lvl);
      }
    }

    // Call GET /api/qbank/progress
    console.log('  4.2 Querying GET /api/qbank/progress after inserting known deltas...');
    const afterProg = await apiRequest('GET', '/api/qbank/progress');
    assert(afterProg.status === 200 && afterProg.body.success === true, 'Progress call must succeed');
    const afterP = afterProg.body.pending_by_level;
    const afterA = afterProg.body.approved_by_level;
    const afterR = afterProg.body.rejected_by_level;

    console.log('  4.3 Verifying per-level deltas:');
    for (let lvl = 1; lvl <= 5; lvl++) {
      const expP = (baseP[String(lvl)] || 0) + deltas[lvl].p;
      const expA = (baseA[String(lvl)] || 0) + deltas[lvl].a;
      const expR = (baseR[String(lvl)] || 0) + deltas[lvl].r;

      const actP = afterP[String(lvl)] || 0;
      const actA = afterA[String(lvl)] || 0;
      const actR = afterR[String(lvl)] || 0;

      console.log(`    Level ${lvl}: P[exp=${expP}, act=${actP}] | A[exp=${expA}, act=${actA}] | R[exp=${expR}, act=${actR}]`);
      assert(actP === expP, `Level ${lvl} pending count mismatch: expected ${expP}, got ${actP}`);
      assert(actA === expA, `Level ${lvl} approved count mismatch: expected ${expA}, got ${actA}`);
      assert(actR === expR, `Level ${lvl} rejected count mismatch: expected ${expR}, got ${actR}`);
    }

    // Verify totals
    assert(afterProg.body.total_pending === baseTotalP + totalDeltaP, 'total_pending mismatch');
    assert(afterProg.body.total_approved === baseTotalA + totalDeltaA, 'total_approved mismatch');
    console.log(`  4.4 Totals verified: Total Pending: ${afterProg.body.total_pending}, Total Approved: ${afterProg.body.total_approved}`);

    // Verify GET /api/qbank/pending/stats alias returns identical data
    const statsAlias = await apiRequest('GET', '/api/qbank/pending/stats');
    assert(statsAlias.status === 200, 'Stats alias must succeed');
    assert(statsAlias.body.total_pending === afterProg.body.total_pending, 'Stats alias total_pending must match');
    assert(statsAlias.body.total_approved === afterProg.body.total_approved, 'Stats alias total_approved must match');
    console.log('  -> PASS: Progress calculation across HSK 1-5 is 100% exact and verified.\n');

    // =========================================================================
    // CHALLENGE 5: Post-Approval Edit Propagation & Content Hash Recomputation
    // =========================================================================
    console.log('[Challenge 5] Testing Post-Approval Edit Propagation & Re-hashing...');
    const editPropId = `edit_prop_test_${Date.now()}`;
    createdIds.push(editPropId);

    const initialStem = '今天天气真好，我们去公园____吧。';
    const initialOpts = ['散步', '买票', '睡觉', '打球'];
    db.prepare(`
      INSERT INTO pending_questions (
        id, stem, options, answer_idx, pinyin, explanation_vi, level, skill, part_type, illustration_theme, status, provider_used
      ) VALUES (?, ?, ?, 0, 'pinyin initial', 'exp initial', 1, 'reading', 'read_fill_blank_4opt', 'park_walk', 'pending', 'deepseek-v3')
    `).run(editPropId, initialStem, JSON.stringify(initialOpts));

    // Approve it first
    const appPropRes = await apiRequest('POST', '/api/qbank/pending/approve', { id: editPropId });
    assert(appPropRes.status === 200 && appPropRes.body.approved_count === 1, 'Initial approve for edit propagation must succeed');

    // Now perform inline edit via PUT /api/qbank/pending/:id
    const updatedStem = '今天天气很好，我和朋友一起去公园____。';
    const updatedOpts = ['散步', '跑步', '骑车', '踢足球'];
    const updatedAnswerIdx = 2; // Change answer from 0 to 2
    const updatedPinyin = 'jīntiān tiānqì hěn hǎo, wǒ hé péngyou yīqǐ qù gōngyuán qíchē.';
    const updatedTopic = 'park_cycling';
    const updatedExp = 'Cùng bạn bè đến công viên đạp xe (骑车).';
    const expectedNewHash = computeContentHash(updatedStem, updatedOpts, updatedAnswerIdx);

    const putRes = await apiRequest('PUT', `/api/qbank/pending/${editPropId}`, {
      stem: updatedStem,
      options: updatedOpts,
      answer_idx: updatedAnswerIdx,
      pinyin: updatedPinyin,
      illustration_theme: updatedTopic,
      explanation_vi: updatedExp,
    });
    assert(putRes.status === 200 && putRes.body.success === true, 'PUT edit must succeed');

    // Verify propagation in pending_questions
    const pEdited: any = db.prepare('SELECT * FROM pending_questions WHERE id = ?').get(editPropId);
    assert(pEdited.stem === updatedStem, 'pending_questions stem must be updated');
    assert(pEdited.answer_idx === updatedAnswerIdx, 'pending_questions answer_idx must be updated');
    assert(pEdited.content_hash === expectedNewHash, 'pending_questions content_hash must be recomputed');

    // Verify propagation in questions
    const qEdited: any = db.prepare('SELECT * FROM questions WHERE id = ?').get(editPropId);
    assert(qEdited.stem === updatedStem, 'questions stem must be updated');
    assert(qEdited.answer_idx === updatedAnswerIdx, 'questions answer_idx must be updated to 2');
    assert(qEdited.explanation_vi === updatedExp, 'questions explanation_vi must be updated');

    // Verify propagation in qb_questions (Crucial for Student Mock Assembler)
    const qbEdited: any = db.prepare('SELECT * FROM qb_questions WHERE question_id = ?').get(editPropId);
    assert(qbEdited.stem === updatedStem, 'qb_questions stem must be updated');
    assert(qbEdited.answer_index === updatedAnswerIdx, 'qb_questions answer_index must be updated to 2');
    assert(qbEdited.pinyin_stem === updatedPinyin, 'qb_questions pinyin_stem must be updated');
    assert(qbEdited.topic === updatedTopic, 'qb_questions topic must be updated');
    assert(qbEdited.content_hash === expectedNewHash, `qb_questions content_hash must match recomputed hash ${expectedNewHash}`);
    console.log('  -> PASS: Post-approval edit propagates synchronously to all 3 tables with exact hash.\n');

    // =========================================================================
    // CHALLENGE 6: Adversarial Boundary & Injection Stress Testing
    // =========================================================================
    console.log('[Challenge 6] Testing Adversarial Input & Injection Resilience...');

    // 6.1 SQL Injection in Rejection Note
    const sqlInjId = `sql_inj_test_${Date.now()}`;
    createdIds.push(sqlInjId);
    db.prepare(`
      INSERT INTO pending_questions (id, stem, options, answer_idx, explanation_vi, level, skill, part_type, status)
      VALUES (?, 'SQL Inj stem', '["A","B"]', 0, 'exp', 1, 'reading', 'read_fill_blank_4opt', 'pending')
    `).run(sqlInjId);

    const dangerousPayload = "'; DROP TABLE pending_questions; SELECT * FROM qb_questions WHERE '1'='1";
    const injRes = await apiRequest('POST', '/api/qbank/pending/reject', {
      id: sqlInjId,
      rejection_note: dangerousPayload,
    });
    assert(injRes.status === 200 && injRes.body.rejected_count === 1, 'Reject with SQL payload must succeed safely');
    // Ensure table still exists and note is literal
    const checkTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='pending_questions'").get();
    assert(checkTable !== undefined, 'pending_questions table must NOT be dropped by SQL injection');
    const injRow: any = db.prepare('SELECT rejection_note FROM pending_questions WHERE id = ?').get(sqlInjId);
    assert(injRow.rejection_note === dangerousPayload, 'Rejection note must store dangerous payload literally as string parameter');

    // 6.2 Non-existent ID handling
    const nonExistentRes = await apiRequest('POST', '/api/qbank/pending/approve', { id: 'non_existent_uuid_999999' });
    assert(nonExistentRes.status === 200 && nonExistentRes.body.approved_count === 0, 'Approving non-existent ID returns 0 approved');

    const nonExistentRej = await apiRequest('POST', '/api/qbank/pending/reject', { id: 'non_existent_uuid_999999' });
    assert(nonExistentRej.status === 200, 'Rejecting non-existent ID returns 200');
    // Verify no ghost row was created in pending_questions or qb_questions
    const ghostPending = db.prepare('SELECT * FROM pending_questions WHERE id = ?').get('non_existent_uuid_999999');
    assert(ghostPending === undefined, 'Rejecting non-existent ID must never create ghost rows in pending_questions');
    const ghostQb = db.prepare('SELECT * FROM qb_questions WHERE question_id = ?').get('non_existent_uuid_999999');
    assert(ghostQb === undefined, 'Rejecting non-existent ID must never create ghost rows in qb_questions');

    const nonExistentEdit = await apiRequest('PUT', '/api/qbank/pending/non_existent_uuid_999999', { stem: 'abc' });
    assert(nonExistentEdit.status === 404 && nonExistentEdit.body.success === false, 'Editing non-existent ID returns 404');

    // 6.3 Empty Array & Missing IDs handling
    const emptyApprove = await apiRequest('POST', '/api/qbank/pending/approve', { ids: [] });
    assert(emptyApprove.status === 200 && emptyApprove.body.approved_count === 0, 'Empty approve array returns count 0');

    const emptyReject = await apiRequest('POST', '/api/qbank/pending/reject', { ids: [] });
    assert(emptyReject.status === 200 && emptyReject.body.rejected_count === 0, 'Empty reject array returns count 0');

    // 6.4 Large Unicode Rejection Note (10,000 characters)
    const largeNote = 'Ghi chú kiểm duyệt chi tiết: ' + '🌟 Tiếng Việt có dấu và chữ Hán 中文 '.repeat(350);
    const largeNoteId = `large_note_test_${Date.now()}`;
    createdIds.push(largeNoteId);
    db.prepare(`
      INSERT INTO pending_questions (id, stem, options, answer_idx, explanation_vi, level, skill, part_type, status)
      VALUES (?, 'Large note stem', '["A","B"]', 0, 'exp', 1, 'reading', 'read_fill_blank_4opt', 'pending')
    `).run(largeNoteId);

    const largeRejRes = await apiRequest('POST', '/api/qbank/pending/reject', {
      id: largeNoteId,
      rejection_note: largeNote,
    });
    assert(largeRejRes.status === 200, 'Large note reject must succeed');
    const largeRow: any = db.prepare('SELECT rejection_note FROM pending_questions WHERE id = ?').get(largeNoteId);
    assert(largeRow.rejection_note === largeNote.trim(), '10,000 char unicode note must be preserved (trimmed) exactly');

    console.log('  -> PASS: All adversarial, injection, and boundary conditions handled securely.\n');

  } finally {
    // Clean up created records
    console.log(`[Cleanup] Cleaning up ${createdIds.length} test records from qbank.db...`);
    for (const id of createdIds) {
      try {
        db.prepare('DELETE FROM pending_questions WHERE id = ?').run(id);
      } catch {}
      try {
        db.prepare('DELETE FROM questions WHERE id = ?').run(id);
      } catch {}
      try {
        db.prepare('DELETE FROM qb_questions WHERE question_id = ?').run(id);
      } catch {}
    }
    db.close();
    await stopServer();

    // Final Database Invariant Check
    console.log('\n[Invariant Check Final] Checking data/hsk_exam.db hash after all tests...');
    const finalHash = getDbHash(LEGACY_DB_PATH);
    console.log(`  Hash: ${finalHash}`);
    assert(finalHash === EXPECTED_LEGACY_DB_HASH, 'data/hsk_exam.db SHA-256 MUST REMAIN UNTOUCHED');
    console.log('  -> PASS: data/hsk_exam.db SHA-256 strictly preserved.');
  }

  console.log('\n================================================================');
  console.log(' ALL EMPIRICAL CHALLENGES PASSED WITH ZERO ERRORS');
  console.log('================================================================');
}

runEmpiricalChallenge().catch((err) => {
  console.error('\n[FATAL CHALLENGE FAILURE]:', err);
  process.exit(1);
});
