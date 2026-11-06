const { DatabaseSync } = require('node:sqlite');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const EXPECTED_QBANK_HASH = 'E85BEAE5AEA97592CB0127C4B455F78974CBAE04A623D04E369F8567BFBFB381';
const EXPECTED_HSK_HASH = 'DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1';
const PILOT_BATCH_ID = 'pilot_groq_5_20261028_1793203547809';
const PILOT_CANDIDATE_IDS = [
  'pend_1_1793203549765_886375',
  'pend_1_1793203557790_08d840'
];

function hashFile(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex').toUpperCase();
}

console.log('=== EMPIRICAL CHALLENGE M2-2 VERIFICATION START ===\n');

// 1. Operational DB Hashes
console.log('--- STEP 1: Operational DB SHA-256 Baseline Hashes ---');
const qbankPath = path.resolve('data/qbank/qbank.db');
const hskPath = path.resolve('data/hsk_exam.db');

const actualQbankHash = hashFile(qbankPath);
const actualHskHash = hashFile(hskPath);

console.log(`QBank DB Path: ${qbankPath}`);
console.log(`Expected Hash: ${EXPECTED_QBANK_HASH}`);
console.log(`Actual Hash:   ${actualQbankHash}`);
const qbankHashMatch = actualQbankHash === EXPECTED_QBANK_HASH;
console.log(`Match: ${qbankHashMatch ? 'PASS (100% BIT-FOR-BIT IDENTICAL)' : 'FAIL'}`);

console.log(`\nHSK DB Path:   ${hskPath}`);
console.log(`Expected Hash: ${EXPECTED_HSK_HASH}`);
console.log(`Actual Hash:   ${actualHskHash}`);
const hskHashMatch = actualHskHash === EXPECTED_HSK_HASH;
console.log(`Match: ${hskHashMatch ? 'PASS (100% BIT-FOR-BIT IDENTICAL)' : 'FAIL'}`);

if (!qbankHashMatch || !hskHashMatch) {
  console.error('\nFATAL: Operational DB hash mismatch!');
  process.exit(1);
}

// 2. Staging DB Queries
console.log('\n--- STEP 2: Staging DB Queries (D:\\minnese-staging-20261027\\qbank-staging.db) ---');
const stagingDbPath = 'D:\\minnese-staging-20261027\\qbank-staging.db';
if (!fs.existsSync(stagingDbPath)) {
  console.error(`FATAL: Staging DB not found at ${stagingDbPath}`);
  process.exit(1);
}

const stagingDb = new DatabaseSync(stagingDbPath, { readOnly: true });

// Check pending_questions for batch
const stagingPending = stagingDb.prepare(
  'SELECT id, batch_id, status, level, part_type, stem, answer_idx, options, content_hash FROM pending_questions WHERE batch_id = ?'
).all(PILOT_BATCH_ID);

console.log(`Staging pending_questions for batch ${PILOT_BATCH_ID}:`);
console.log(`Count found: ${stagingPending.length} (Expected: exactly 2)`);
stagingPending.forEach((row, idx) => {
  console.log(`  Candidate [${idx + 1}]: ID=${row.id}, Status=${row.status}, Level=${row.level}, PartType=${row.part_type}`);
  console.log(`    Stem: "${row.stem}"`);
  console.log(`    Answer: [${row.answer_idx}] Options: ${row.options}`);
  console.log(`    Content Hash: ${row.content_hash}`);
});

const stagingPendingCountOk = stagingPending.length === 2;
const stagingPendingStatusOk = stagingPending.every(r => r.status === 'pending');
const stagingPendingIdsMatch = stagingPending.map(r => r.id).sort().join(',') === PILOT_CANDIDATE_IDS.slice().sort().join(',');

console.log(`Staging pending count check (2): ${stagingPendingCountOk ? 'PASS' : 'FAIL'}`);
console.log(`Staging pending status check ('pending'): ${stagingPendingStatusOk ? 'PASS' : 'FAIL'}`);
console.log(`Staging pending IDs match expected: ${stagingPendingIdsMatch ? 'PASS' : 'FAIL'}`);

// Check staging questions for batch or IDs
const stagingQuestions = stagingDb.prepare(
  'SELECT id, status, stem FROM questions WHERE batch_id = ? OR id IN (?, ?)'
).all(PILOT_BATCH_ID, PILOT_CANDIDATE_IDS[0], PILOT_CANDIDATE_IDS[1]);
console.log(`\nStaging questions table rows for pilot batch / candidate IDs: ${stagingQuestions.length} (Expected: 0)`);
const stagingQuestionsOk = stagingQuestions.length === 0;
console.log(`Staging questions check: ${stagingQuestionsOk ? 'PASS (0 rows - zero leakage into questions)' : 'FAIL'}`);

// Check staging exam_eligible_pool for candidate IDs or join with pending
const stagingExamEligible = stagingDb.prepare(
  'SELECT * FROM exam_eligible_pool WHERE question_id IN (?, ?)'
).all(PILOT_CANDIDATE_IDS[0], PILOT_CANDIDATE_IDS[1]);
console.log(`\nStaging exam_eligible_pool rows for candidate IDs: ${stagingExamEligible.length} (Expected: 0)`);

const stagingExamEligibleJoin = stagingDb.prepare(
  'SELECT p.* FROM exam_eligible_pool p JOIN pending_questions q ON p.question_id = q.id WHERE q.batch_id = ?'
).all(PILOT_BATCH_ID);
console.log(`Staging exam_eligible_pool rows joined on batch: ${stagingExamEligibleJoin.length} (Expected: 0)`);
const stagingPoolOk = stagingExamEligible.length === 0 && stagingExamEligibleJoin.length === 0;
console.log(`Staging exam_eligible_pool check: ${stagingPoolOk ? 'PASS (0 rows - zero leakage into exam_eligible_pool)' : 'FAIL'}`);

// 3. Operational DB Queries (data/qbank/qbank.db)
console.log('\n--- STEP 3: Operational DB Queries (data/qbank/qbank.db) ---');
const opQbankDb = new DatabaseSync(qbankPath, { readOnly: true });

// Check table count
const opTables = opQbankDb.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
console.log(`Operational qbank.db tables (${opTables.length}):`, opTables.map(t => t.name).join(', '));
const opTableCountOk = opTables.length === 12;
console.log(`Table count check (12): ${opTableCountOk ? 'PASS' : 'FAIL'}`);

// Check questions table
const opQuestionsBatch = opQbankDb.prepare(
  'SELECT id, stem FROM questions WHERE batch_id = ? OR id IN (?, ?)'
).all(PILOT_BATCH_ID, PILOT_CANDIDATE_IDS[0], PILOT_CANDIDATE_IDS[1]);
console.log(`Operational questions table rows for pilot batch/IDs: ${opQuestionsBatch.length} (Expected: 0)`);

// Check pending_questions table
const opPendingBatch = opQbankDb.prepare(
  'SELECT id, stem FROM pending_questions WHERE batch_id = ? OR id IN (?, ?)'
).all(PILOT_BATCH_ID, PILOT_CANDIDATE_IDS[0], PILOT_CANDIDATE_IDS[1]);
console.log(`Operational pending_questions table rows for pilot batch/IDs: ${opPendingBatch.length} (Expected: 0)`);

// Check exam_eligible_pool table
const opExamEligible = opQbankDb.prepare(
  'SELECT * FROM exam_eligible_pool WHERE question_id IN (?, ?)'
).all(PILOT_CANDIDATE_IDS[0], PILOT_CANDIDATE_IDS[1]);
console.log(`Operational exam_eligible_pool rows for candidate IDs: ${opExamEligible.length} (Expected: 0)`);

// Check exam_sessions table
const opExamSessions = opQbankDb.prepare(
  'SELECT session_id, level FROM exam_sessions WHERE session_json LIKE ? OR session_json LIKE ?'
).all(`%${PILOT_CANDIDATE_IDS[0]}%`, `%${PILOT_CANDIDATE_IDS[1]}%`);
console.log(`Operational exam_sessions containing candidate IDs: ${opExamSessions.length} (Expected: 0)`);

// Check generation_runs table
const opGenRuns = opQbankDb.prepare(
  'SELECT id, batch_id FROM generation_runs WHERE batch_id = ?'
).all(PILOT_BATCH_ID);
console.log(`Operational generation_runs for pilot batch: ${opGenRuns.length} (Expected: 0)`);

// Check stem text collision
const stemCollisions = opQbankDb.prepare(
  'SELECT id, stem FROM questions WHERE stem IN (?, ?)'
).all(stagingPending[0]?.stem || '', stagingPending[1]?.stem || '');
console.log(`Operational questions matching pilot stems: ${stemCollisions.length} (Expected: 0)`);

// Check approved questions count preserved
const approvedActiveCount = opQbankDb.prepare(
  "SELECT COUNT(*) as count FROM questions WHERE status = 'approved' AND is_active = 1"
).get().count;
console.log(`Operational approved active questions: ${approvedActiveCount} (Baseline: 89)`);
const opApprovedCountOk = approvedActiveCount === 89;

// Total exam_sessions preserved
const examSessionsCount = opQbankDb.prepare(
  'SELECT COUNT(*) as count FROM exam_sessions'
).get().count;
console.log(`Operational exam_sessions total: ${examSessionsCount}`);

const opZeroLeakage = (
  opQuestionsBatch.length === 0 &&
  opPendingBatch.length === 0 &&
  opExamEligible.length === 0 &&
  opExamSessions.length === 0 &&
  opGenRuns.length === 0 &&
  stemCollisions.length === 0 &&
  opApprovedCountOk
);
console.log(`Operational qbank.db zero leakage check: ${opZeroLeakage ? 'PASS (100% UNPOLLUTED)' : 'FAIL'}`);

// Integrity checks
const opQbankIntegrity = opQbankDb.prepare('PRAGMA integrity_check').all();
console.log(`Operational qbank.db integrity: ${opQbankIntegrity[0]?.integrity_check}`);

// 4. Operational HSK DB Queries
console.log('\n--- STEP 4: Operational HSK DB Queries (data/hsk_exam.db) ---');
const opHskDb = new DatabaseSync(hskPath, { readOnly: true });
const opHskTables = opHskDb.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
console.log(`Operational hsk_exam.db tables (${opHskTables.length}):`, opHskTables.map(t => t.name).join(', '));

const opHskIntegrity = opHskDb.prepare('PRAGMA integrity_check').all();
console.log(`Operational hsk_exam.db integrity: ${opHskIntegrity[0]?.integrity_check}`);

// Extended staging checks
console.log('\n--- EXTENDED STAGING DB CHECKS ---');
const stagingTables = stagingDb.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
console.log(`Staging tables (${stagingTables.length}):`, stagingTables.map(t => t.name).join(', '));

const stagingGenRuns = stagingDb.prepare(
  "SELECT id, count_requested, count_generated, count_saved_pending, count_rejected_validator, status, batch_id FROM generation_runs WHERE batch_id = ?"
).all(PILOT_BATCH_ID);
console.log('Staging generation_runs for pilot:', stagingGenRuns);

const allPilotPending = stagingDb.prepare(
  "SELECT id, batch_id, status FROM pending_questions WHERE batch_id LIKE 'pilot_groq_5%'"
).all();
console.log(`All pending questions matching pilot_groq_5%: ${allPilotPending.length}`);

// Check content_hash collision in questions
const hashCollisions = stagingDb.prepare(
  "SELECT id FROM questions WHERE content_hash IN (?, ?)"
).all(stagingPending[0]?.content_hash || '', stagingPending[1]?.content_hash || '');
console.log(`Staging questions with matching content_hash: ${hashCollisions.length} (Expected: 0)`);

// Summary
console.log('\n=== EMPIRICAL CHALLENGE M2-2 VERIFICATION SUMMARY ===');
console.log(`1. Operational Hashes Match: ${qbankHashMatch && hskHashMatch ? 'PASS' : 'FAIL'}`);
console.log(`2. Staging pending_questions: ${stagingPendingCountOk && stagingPendingStatusOk && stagingPendingIdsMatch ? 'PASS (exactly 2 candidates with status pending)' : 'FAIL'}`);
console.log(`3. Staging questions/exam_eligible_pool: ${stagingQuestionsOk && stagingPoolOk ? 'PASS (0 rows)' : 'FAIL'}`);
console.log(`4. Operational DB zero leakage: ${opZeroLeakage ? 'PASS (0 rows across all operational tables)' : 'FAIL'}`);

const overallPass = (
  qbankHashMatch &&
  hskHashMatch &&
  stagingPendingCountOk &&
  stagingPendingStatusOk &&
  stagingPendingIdsMatch &&
  stagingQuestionsOk &&
  stagingPoolOk &&
  opZeroLeakage
);

console.log(`\nOVERALL VERDICT: ${overallPass ? 'APPROVE' : 'REQUEST_CHANGES'}`);
