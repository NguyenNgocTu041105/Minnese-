/**
 * Comprehensive Automated Test Suite for HSK Exam API Endpoints
 * Tests:
 * 1. GET /api/exam/blueprints
 * 2. POST /api/exam/generate-mock (Full Mock Exam Mode - HSK 1..5)
 * 3. Anti-Cheat Verification (answer_index & explanation_vi stripped)
 * 4. GET /api/exam/session/:sessionId
 * 5. POST /api/exam/check-answer (Practice Mode validation)
 * 6. POST /api/exam/submit (Scoring, passing determination, section breakdown, detailed review)
 * 7. Invariant checking on data/hsk_exam.db
 */

import express from 'express';
import http from 'http';
import { examRouter, getActiveSessionCount, clearAllSessionsForTesting } from '../../src/server/examRoutes';
import { HSK1_FULL_MOCK_EXAM, findQuestionById } from '../../src/data/hskMockExamFixtures';

let server: http.Server;
let baseUrl: string;

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[ASSERTION FAILED]: ${message}`);
  }
}

async function startTestServer(): Promise<void> {
  const app = express();
  app.use(express.json());
  app.use('/api/exam', examRouter);

  // 404 guard like server.ts
  app.all('/api/*', (req, res) => {
    res.status(404).json({ success: false, error: `API endpoint not found: ${req.method} ${req.originalUrl}` });
  });

  return new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const addr = server.address() as any;
      baseUrl = `http://127.0.0.1:${addr.port}`;
      console.log(`[Test Server] Listening at ${baseUrl}`);
      resolve();
    });
  });
}

async function stopTestServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
}

async function runTests() {
  console.log('=== Starting HSK Exam API End-to-End Test Suite ===\n');
  await startTestServer();
  clearAllSessionsForTesting();

  let passedTests = 0;

  try {
    // -----------------------------------------------------------------------
    // Test 1: GET /api/exam/blueprints
    // -----------------------------------------------------------------------
    console.log('Test 1: GET /api/exam/blueprints');
    const res1 = await fetch(`${baseUrl}/api/exam/blueprints`);
    assert(res1.status === 200, `Expected 200, got ${res1.status}`);
    const data1 = await res1.json();
    assert(data1.success === true, 'Expected success: true');
    assert(data1.blueprints !== undefined, 'Expected blueprints object');

    // Verify HSK 1 blueprint
    const bp1 = data1.blueprints['1'] || data1.blueprints[1];
    assert(bp1.total_questions === 40, `HSK 1 expected 40 questions, got ${bp1.total_questions}`);
    assert(bp1.max_score === 200, `HSK 1 expected max score 200, got ${bp1.max_score}`);
    assert(bp1.pass_score === 120, `HSK 1 expected pass score 120, got ${bp1.pass_score}`);
    assert(bp1.has_pinyin === true, 'HSK 1 expected has_pinyin: true');
    assert(bp1.audio_playback === 2, 'HSK 1 expected audio_playback: 2');

    // Verify HSK 2-6 blueprints
    for (let lvl = 2; lvl <= 6; lvl++) {
      const bp = data1.blueprints[lvl] || data1.blueprints[String(lvl)];
      assert(bp !== undefined, `Expected blueprint for level ${lvl}`);
      assert(bp.max_score === 300, `Level ${lvl} expected max score 300, got ${bp.max_score}`);
      assert(bp.pass_score === 180, `Level ${lvl} expected pass score 180, got ${bp.pass_score}`);
    }
    console.log('✓ Test 1 passed: Blueprints returned and verified for levels 1-6.\n');
    passedTests++;

    // -----------------------------------------------------------------------
    // Test 2: POST /api/exam/generate-mock (HSK 1 Full Mock Exam)
    // -----------------------------------------------------------------------
    console.log('Test 2: POST /api/exam/generate-mock (HSK 1 Full Exam & Anti-Cheat)');
    const res2 = await fetch(`${baseUrl}/api/exam/generate-mock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level: 1, mode: 'mock' }),
    });
    assert(res2.status === 200, `Expected 200, got ${res2.status}`);
    const data2 = await res2.json();
    assert(data2.success === true, 'Expected success: true');
    assert(data2.session !== undefined, 'Expected session object');
    const session1 = data2.session;
    assert(session1.level === 1, `Expected level 1, got ${session1.level}`);
    assert(session1.totalQuestions === 40, `Expected 40 questions, got ${session1.totalQuestions}`);
    assert(session1.questions.length === 40, `Expected array length 40, got ${session1.questions.length}`);
    assert(session1.maxScore === 200, `Expected maxScore 200, got ${session1.maxScore}`);
    assert(session1.passScore === 120, `Expected passScore 120, got ${session1.passScore}`);

    // Anti-cheat verification: answers MUST NOT be in response
    for (let i = 0; i < session1.questions.length; i++) {
      const q = session1.questions[i];
      assert(q.answer_index === undefined, `Anti-cheat failed: Question ${q.id} exposed answer_index!`);
      assert(q.explanation_vi === undefined, `Anti-cheat failed: Question ${q.id} exposed explanation_vi!`);
      assert(q.item_number === i + 1, `Expected sequential item_number ${i + 1}, got ${q.item_number}`);
      assert(q.stem && q.stem.length > 0, `Question ${q.id} stem must not be empty`);
      assert(Array.isArray(q.options) && q.options.length >= 3, `Question ${q.id} must have >= 3 options`);
    }

    // Verify section distribution (20 listening, 20 reading)
    const listeningQs = session1.questions.filter((q: any) => q.section === 'listening');
    const readingQs = session1.questions.filter((q: any) => q.section === 'reading');
    assert(listeningQs.length === 20, `Expected 20 listening questions, got ${listeningQs.length}`);
    assert(readingQs.length === 20, `Expected 20 reading questions, got ${readingQs.length}`);

    console.log('✓ Test 2 passed: Full 40Q HSK 1 mock exam generated with strict anti-cheat.\n');
    passedTests++;

    // -----------------------------------------------------------------------
    // Test 3: GET /api/exam/session/:sessionId
    // -----------------------------------------------------------------------
    console.log('Test 3: GET /api/exam/session/:sessionId');
    const res3 = await fetch(`${baseUrl}/api/exam/session/${session1.sessionId}`);
    assert(res3.status === 200, `Expected 200, got ${res3.status}`);
    const data3 = await res3.json();
    assert(data3.success === true, 'Expected success: true');
    assert(data3.session.sessionId === session1.sessionId, 'Session ID mismatch');
    assert(data3.session.questions.length === 40, 'Question count mismatch on session retrieval');
    assert(data3.session.questions[0].answer_index === undefined, 'Anti-cheat failed on session retrieval');

    // Test non-existent session
    const res3b = await fetch(`${baseUrl}/api/exam/session/fake-uuid-0000`);
    assert(res3b.status === 404, `Expected 404 for invalid session, got ${res3b.status}`);
    console.log('✓ Test 3 passed: Session retrieved successfully and 404 handled.\n');
    passedTests++;

    // -----------------------------------------------------------------------
    // Test 4: POST /api/exam/check-answer (Practice Mode validation)
    // -----------------------------------------------------------------------
    console.log('Test 4: POST /api/exam/check-answer (Practice Mode Validation)');
    const sampleQ = HSK1_FULL_MOCK_EXAM[0]; // Q1: answer_index = 0
    assert(sampleQ !== undefined, 'Sample question not found');

    // 4a. Submit correct answer
    const res4a = await fetch(`${baseUrl}/api/exam/check-answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: sampleQ.id, userAnswer: sampleQ.answer_index }),
    });
    assert(res4a.status === 200, `Expected 200, got ${res4a.status}`);
    const data4a = await res4a.json();
    assert(data4a.success === true, 'Expected success: true');
    assert(data4a.isCorrect === true, 'Expected isCorrect: true');
    assert(data4a.correctAnswer === sampleQ.answer_index, 'Correct answer mismatch');
    assert(data4a.explanation_vi.length > 10, 'Expected non-empty explanation_vi');

    // 4b. Submit incorrect answer
    const wrongAns = (sampleQ.answer_index + 1) % sampleQ.options.length;
    const res4b = await fetch(`${baseUrl}/api/exam/check-answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: sampleQ.id, userAnswer: wrongAns }),
    });
    assert(res4b.status === 200, `Expected 200, got ${res4b.status}`);
    const data4b = await res4b.json();
    assert(data4b.success === true, 'Expected success: true');
    assert(data4b.isCorrect === false, 'Expected isCorrect: false');
    assert(data4b.correctAnswer === sampleQ.answer_index, 'Correct answer should still be returned');

    // 4c. Non-existent question ID
    const res4c = await fetch(`${baseUrl}/api/exam/check-answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: 'non-existent-question-xyz', userAnswer: 0 }),
    });
    assert(res4c.status === 404, `Expected 404 for unknown question, got ${res4c.status}`);

    console.log('✓ Test 4 passed: Practice Mode instant check validates correct/incorrect/unknown questions.\n');
    passedTests++;

    // -----------------------------------------------------------------------
    // Test 5: POST /api/exam/submit (Perfect Score Submission)
    // -----------------------------------------------------------------------
    console.log('Test 5: POST /api/exam/submit (100% Perfect Score)');
    const perfectAnswers: Record<string, number> = {};
    for (const q of HSK1_FULL_MOCK_EXAM) {
      perfectAnswers[q.id] = q.answer_index;
    }

    const res5 = await fetch(`${baseUrl}/api/exam/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: session1.sessionId,
        level: 1,
        answers: perfectAnswers,
        timeSpentSeconds: 1250,
      }),
    });
    assert(res5.status === 200, `Expected 200, got ${res5.status}`);
    const data5 = await res5.json();
    assert(data5.success === true, 'Expected success: true');
    const sr5 = data5.scoreResult;
    assert(sr5.totalScore === 200, `Expected 200 totalScore, got ${sr5.totalScore}`);
    assert(sr5.maxScore === 200, `Expected 200 maxScore, got ${sr5.maxScore}`);
    assert(sr5.percentage === 100, `Expected 100%, got ${sr5.percentage}%`);
    assert(sr5.passed === true, 'Expected passed: true (>= 120)');
    assert(sr5.timeSpentSeconds === 1250, 'timeSpentSeconds mismatch');

    // Check section breakdown
    assert(sr5.sectionScores.listening.score === 100, `Listening score expected 100, got ${sr5.sectionScores.listening.score}`);
    assert(sr5.sectionScores.listening.correct === 20, `Listening correct expected 20, got ${sr5.sectionScores.listening.correct}`);
    assert(sr5.sectionScores.reading.score === 100, `Reading score expected 100, got ${sr5.sectionScores.reading.score}`);
    assert(sr5.sectionScores.reading.correct === 20, `Reading correct expected 20, got ${sr5.sectionScores.reading.correct}`);

    // Check detailed review
    assert(sr5.detailedReview.length === 40, `Expected 40 review items, got ${sr5.detailedReview.length}`);
    for (const rev of sr5.detailedReview) {
      assert(rev.isCorrect === true, `Expected item ${rev.id} to be correct`);
      assert(rev.userAnswer === rev.correctAnswer, `User answer should match correct answer`);
      assert(rev.explanation_vi && rev.explanation_vi.length > 5, `Expected explanation_vi`);
    }

    console.log('✓ Test 5 passed: Full 200/200 scoring and detailed review verified.\n');
    passedTests++;

    // -----------------------------------------------------------------------
    // Test 6: POST /api/exam/submit (Failing Score Submission < 60%)
    // -----------------------------------------------------------------------
    console.log('Test 6: POST /api/exam/submit (Failing Score < 120)');
    // Answer only first 10 questions correctly, others wrong
    const failAnswers: Record<string, number> = {};
    for (let i = 0; i < HSK1_FULL_MOCK_EXAM.length; i++) {
      const q = HSK1_FULL_MOCK_EXAM[i];
      if (i < 10) {
        failAnswers[q.id] = q.answer_index;
      } else {
        failAnswers[q.id] = (q.answer_index + 1) % q.options.length;
      }
    }

    const res6 = await fetch(`${baseUrl}/api/exam/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: session1.sessionId,
        level: 1,
        answers: failAnswers,
        timeSpentSeconds: 600,
      }),
    });
    assert(res6.status === 200, `Expected 200, got ${res6.status}`);
    const data6 = await res6.json();
    const sr6 = data6.scoreResult;
    // 10 correct out of 40 = 25% -> 50 / 200 pts
    assert(sr6.totalScore === 50, `Expected 50 totalScore, got ${sr6.totalScore}`);
    assert(sr6.passed === false, 'Expected passed: false (< 120)');
    console.log('✓ Test 6 passed: Failing score accurately detected (score < 120 -> passed: false).\n');
    passedTests++;

    // -----------------------------------------------------------------------
    // Test 7: Practice Mode Generation
    // -----------------------------------------------------------------------
    console.log('Test 7: POST /api/exam/generate-mock (Practice Mode with Skill Filter)');
    const res7 = await fetch(`${baseUrl}/api/exam/generate-mock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level: 1, mode: 'practice', skill: 'listening', count: 5 }),
    });
    assert(res7.status === 200, `Expected 200, got ${res7.status}`);
    const data7 = await res7.json();
    assert(data7.session.mode === 'practice', 'Expected practice mode');
    assert(data7.session.questions.length === 5, `Expected 5 questions, got ${data7.session.questions.length}`);
    for (const q of data7.session.questions) {
      assert(q.section === 'listening', `Expected listening section, got ${q.section}`);
    }
    console.log('✓ Test 7 passed: Practice mode successfully generated with skill filter.\n');
    passedTests++;

    // -----------------------------------------------------------------------
    // Test 8: HSK 2..5 Exam Generation
    // -----------------------------------------------------------------------
    console.log('Test 8: Generate Mock Exams for HSK 2, 3, 4, 5');
    const expectedCounts: Record<number, number> = { 2: 60, 3: 70, 4: 70, 5: 72 };
    for (const lvl of [2, 3, 4, 5]) {
      const res = await fetch(`${baseUrl}/api/exam/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: lvl, mode: 'mock' }),
      });
      assert(res.status === 200, `Level ${lvl} expected 200, got ${res.status}`);
      const d = await res.json();
      assert(d.session.level === lvl, `Level mismatch: expected ${lvl}, got ${d.session.level}`);
      assert(
        d.session.questions.length === expectedCounts[lvl],
        `Level ${lvl} expected ${expectedCounts[lvl]} questions, got ${d.session.questions.length}`
      );
      assert(d.session.maxScore === 300, `Level ${lvl} expected maxScore 300, got ${d.session.maxScore}`);
      assert(d.session.passScore === 180, `Level ${lvl} expected passScore 180, got ${d.session.passScore}`);
    }
    console.log('✓ Test 8 passed: HSK levels 2, 3, 4, 5 mock exams assemble cleanly conforming to blueprints.\n');
    passedTests++;

    // -----------------------------------------------------------------------
    // Test 9: GET /api/exam/practice (Unmasked Questions & Query Filtering)
    // -----------------------------------------------------------------------
    console.log('Test 9: GET /api/exam/practice (Unmasked Questions & Query Filtering)');

    // 9a: Default parameters (level=1, count=10)
    const res9a = await fetch(`${baseUrl}/api/exam/practice`);
    assert(res9a.status === 200, `Expected 200, got ${res9a.status}`);
    const data9a = await res9a.json();
    assert(data9a.success === true, 'Expected success: true');
    assert(data9a.count === 10, `Expected count 10, got ${data9a.count}`);
    assert(Array.isArray(data9a.questions), 'Expected questions array');
    assert(data9a.questions.length === 10, `Expected 10 questions, got ${data9a.questions.length}`);
    for (let i = 0; i < data9a.questions.length; i++) {
      const q = data9a.questions[i];
      assert(typeof q.answer_index === 'number', `Question ${q.id} must have unmasked answer_index`);
      assert(typeof q.explanation_vi === 'string' && q.explanation_vi.length > 0, `Question ${q.id} must have unmasked explanation_vi`);
      assert(q.item_number === i + 1, `Expected sequential item_number ${i + 1}, got ${q.item_number}`);
      assert(Array.isArray(q.options) && q.options.length >= 3, `Question ${q.id} must have options array`);
    }

    // 9b: Filtered by level=2, skill=reading, count=5
    const res9b = await fetch(`${baseUrl}/api/exam/practice?level=2&skill=reading&count=5`);
    assert(res9b.status === 200, `Expected 200, got ${res9b.status}`);
    const data9b = await res9b.json();
    assert(data9b.success === true, 'Expected success: true');
    assert(data9b.count === 5, `Expected count 5, got ${data9b.count}`);
    assert(data9b.questions.length === 5, `Expected 5 questions, got ${data9b.questions.length}`);
    for (const q of data9b.questions) {
      assert(q.level === 2, `Expected level 2, got ${q.level}`);
      assert(q.section === 'reading', `Expected reading section, got ${q.section}`);
      assert(typeof q.answer_index === 'number', `Question ${q.id} must have unmasked answer_index`);
      assert(typeof q.explanation_vi === 'string' && q.explanation_vi.length > 0, `Question ${q.id} must have unmasked explanation_vi`);
    }

    // 9c: Filtered by skill=listening, count=3
    const res9c = await fetch(`${baseUrl}/api/exam/practice?level=1&skill=listening&count=3`);
    assert(res9c.status === 200, `Expected 200, got ${res9c.status}`);
    const data9c = await res9c.json();
    assert(data9c.success === true, 'Expected success: true');
    assert(data9c.count === 3, `Expected count 3, got ${data9c.count}`);
    assert(data9c.questions.length === 3, `Expected 3 questions, got ${data9c.questions.length}`);
    for (const q of data9c.questions) {
      assert(q.section === 'listening', `Expected listening section, got ${q.section}`);
      assert(typeof q.answer_index === 'number', `Question ${q.id} must have unmasked answer_index`);
      assert(typeof q.explanation_vi === 'string' && q.explanation_vi.length > 0, `Question ${q.id} must have unmasked explanation_vi`);
    }

    console.log('✓ Test 9 passed: GET /api/exam/practice correctly returns unmasked questions and handles filtering.\n');
    passedTests++;

    console.log(`=======================================================`);
    console.log(`ALL ${passedTests} TEST SCENARIOS PASSED WITH ZERO FAILURES!`);
    console.log(`=======================================================`);
  } finally {
    await stopTestServer();
  }
}

runTests().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
});
