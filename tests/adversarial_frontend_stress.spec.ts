import { test, expect } from '@playwright/test';

test.describe('Adversarial Stress Testing — HSK Mock Exam & Practice State Machine', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?tab=quizzes');
    await page.evaluate(() => {
      try {
        sessionStorage.clear();
        localStorage.removeItem('minnese_active_exam_session_v1');
      } catch {
        // ignore
      }
    });
    await page.goto('/?tab=quizzes');
    await expect(page.locator('#quizzes-container')).toBeVisible();
  });

  // =========================================================================
  // 1. Rapid Mode Switching Stress Test
  // =========================================================================
  test('State Machine Stress: Rapid cycling between Mock Exam, Practice, Notebook, and Quizzes Hall', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !msg.text().includes('favicon')) {
        consoleErrors.push(msg.text());
      }
    });

    const backBtn = page.getByRole('button', { name: /Quay lại danh mục Luyện tập/i });

    // Perform rapid mode switching cycles between Practice and Notebook first (no unfinished exam session)
    for (let i = 0; i < 3; i++) {
      // 1. Enter Practice Mode
      const practiceBtn = page.getByRole('button', { name: /Luyện kỹ năng/i });
      await practiceBtn.click();
      await expect(page.getByText(/Luyện tập HSK 1/i)).toBeVisible();

      // Exit back
      await expect(backBtn).toBeVisible();
      await backBtn.click();
      await expect(page.getByRole('button', { name: /Luyện kỹ năng/i })).toBeVisible();

      // 2. Enter Wrong Notebook
      const notebookBtn = page.getByRole('button', { name: /Sổ câu sai/i });
      await notebookBtn.click();
      await expect(page.getByText(/Sổ Tay Câu Sai \(错题本\)/i)).toBeVisible();

      // Exit back
      await expect(backBtn).toBeVisible();
      await backBtn.click();
      await expect(page.getByRole('button', { name: /Sổ câu sai/i })).toBeVisible();
    }

    // Now test entering Mock Exam and exiting
    const mockBtn = page.getByRole('button', { name: /Thi thử 1-Click/i });
    await mockBtn.click();
    await expect(page.getByText(/Thi thử HSK 1/i)).toBeVisible();
    await backBtn.click();
    await expect(mockBtn).toBeVisible();

    // Verify container and elements remain fully functional after stress switching
    await expect(page.locator('#quizzes-container')).toBeVisible();
    expect(consoleErrors.filter(e => !e.includes('net::ERR_') && !e.includes('ExperimentalWarning'))).toEqual([]);
  });

  // =========================================================================
  // 2. Timer Countdown & Auto-Submit at 0s
  // =========================================================================
  test('Timer Auto-Submit: When timeLeft reaches 0s, auto-submits without confirm dialog and transitions to Result', async ({ page }) => {
    let dialogTriggered = false;
    page.on('dialog', async (dialog) => {
      dialogTriggered = true;
      await dialog.accept();
    });

    // Start with deep link to HSK Mock Exam view
    await page.goto('/?tab=quizzes&view=hsk_mock&level=1');
    await expect(page.locator('#quizzes-container')).toBeVisible();
    await expect(page.getByText(/Thi thử HSK 1/i)).toBeVisible();

    // Select an option for question 1
    const optionA = page.getByTestId('exam-option-a');
    await expect(optionA).toBeVisible();
    await optionA.click();

    // Artificially manipulate active session storage and simulate timeLeft = 2s
    await page.evaluate(() => {
      const raw = sessionStorage.getItem('minnese_active_exam_session_v1');
      if (raw) {
        const session = JSON.parse(raw);
        session.timeLeftSeconds = 2;
        sessionStorage.setItem('minnese_active_exam_session_v1', JSON.stringify(session));
        localStorage.setItem('minnese_active_exam_session_v1', JSON.stringify(session));
      }
    });

    // Reload page with deep link view=hsk_mock preserved
    await page.reload();

    // Resume modal appears
    const resumeBtn = page.getByRole('button', { name: /Tiếp tục làm bài/i });
    await expect(resumeBtn).toBeVisible({ timeout: 5000 });
    await resumeBtn.click();

    // Wait for timer to tick 2s -> 0s and trigger auto-submit
    // The auto-submit should trigger WITHOUT a confirm dialog
    await expect(page.getByText(/Kết Quả Khảo Thí HSK 1/i)).toBeVisible({ timeout: 15000 });

    // Confirm dialog must NOT have been prompted for timeout auto-submit!
    expect(dialogTriggered).toBe(false);

    // Verify result components are rendered
    await expect(page.getByText(/Biểu Đồ Radar Chẩn Đoán Kỹ Năng/i)).toBeVisible();
    await expect(page.getByText(/Xem Lại Toàn Bộ Bài Làm/i)).toBeVisible();
  });

  // =========================================================================
  // 3. Auto-Save & Reload Restoration Resilience
  // =========================================================================
  test('Reload Resilience: Auto-save session restore from sessionStorage/localStorage with answers and flags preserved', async ({ page }) => {
    // 1. Enter Mock Exam via deep link
    await page.goto('/?tab=quizzes&view=hsk_mock&level=1');
    await expect(page.locator('#quizzes-container')).toBeVisible();
    await expect(page.getByText(/Thi thử HSK 1/i)).toBeVisible();

    // 2. Answer Question 1 with Option A
    const optionA = page.getByTestId('exam-option-a');
    await expect(optionA).toBeVisible();
    await optionA.click();

    // 3. Flag Question 1
    const flagBtn = page.getByRole('button', { name: /Gắn cờ/i });
    if (await flagBtn.isVisible()) {
      await flagBtn.click();
      await expect(page.getByText(/Đã gắn cờ/i)).toBeVisible();
    }

    // 4. Move to Question 2 and Answer with Option B
    const nextBtn = page.getByRole('button', { name: /Câu sau/i });
    await nextBtn.click();
    await expect(page.getByText(/Câu 2 \//i)).toBeVisible();

    const optionB = page.getByTestId('exam-option-b');
    if (await optionB.isVisible()) {
      await optionB.click();
    }

    // 5. Verify localStorage and sessionStorage have the active session
    const storageState = await page.evaluate(() => {
      const sess = sessionStorage.getItem('minnese_active_exam_session_v1');
      const loc = localStorage.getItem('minnese_active_exam_session_v1');
      return {
        sessionStorageExists: !!sess,
        localStorageExists: !!loc,
        parsedAnswers: sess ? JSON.parse(sess).answers : null,
        parsedFlagged: sess ? JSON.parse(sess).flagged : null,
      };
    });

    expect(storageState.sessionStorageExists).toBe(true);
    expect(storageState.localStorageExists).toBe(true);
    expect(Object.keys(storageState.parsedAnswers || {}).length).toBeGreaterThanOrEqual(2);

    // 6. Reload page with deep link view=hsk_mock preserved
    await page.reload();

    // 7. Verify Resume prompt appears
    const resumeModal = page.getByText(/Tiếp tục bài thi dở dang\?/i);
    await expect(resumeModal).toBeVisible({ timeout: 5000 });

    // 8. Click "Tiếp tục làm bài"
    await page.getByRole('button', { name: /Tiếp tục làm bài/i }).click();

    // 9. Verify Question 2 is still current
    await expect(page.getByText(/Câu 2 \//i)).toBeVisible();

    // 10. Go back to Question 1 and verify option A is still selected and flagged
    const prevBtn = page.getByRole('button', { name: /Câu trước/i });
    await prevBtn.click();
    await expect(page.getByText(/Câu 1 \//i)).toBeVisible();
    await expect(page.getByText(/Đã gắn cờ/i)).toBeVisible();
  });

  // =========================================================================
  // 4. Keyboard Shortcuts Scoping (Disabled during input focus)
  // =========================================================================
  test('Keyboard Scoping: Desktop shortcuts (A/B/C/D, 1/2/3/4, Enter, Arrows, F, P) do not trigger when focused on input fields', async ({ page }) => {
    // Start Mock Exam
    await page.getByRole('button', { name: /Thi thử 1-Click/i }).click();
    await expect(page.getByText(/Thi thử HSK 1/i)).toBeVisible();

    // Inject a test input element into document body to simulate user typing in search bar or chat input
    await page.evaluate(() => {
      const input = document.createElement('input');
      input.id = 'stress-test-text-input';
      input.type = 'text';
      input.placeholder = 'Type here...';
      document.body.appendChild(input);
    });

    const testInput = page.locator('#stress-test-text-input');
    await testInput.focus();

    // Type shortcut keys into the input: 'A', 'B', '1', 'F', 'P', 'Enter'
    await testInput.pressSequentially('ABCD1234FP', { delay: 50 });
    await testInput.press('Enter');

    // Verify input received the characters verbatim
    await expect(testInput).toHaveValue('ABCD1234FP');

    // Crucial check: Question 1 option must NOT have been selected by the shortcut keys while typing in input!
    const answersInStorage = await page.evaluate(() => {
      const raw = sessionStorage.getItem('minnese_active_exam_session_v1');
      return raw ? JSON.parse(raw).answers : {};
    });
    expect(Object.keys(answersInStorage).length).toBe(0);

    // Verify question is NOT flagged
    await expect(page.getByText(/Đã gắn cờ/i)).not.toBeVisible();

    // Now blur input
    await testInput.blur();
    await page.getByText(/Thi thử HSK 1/i).click();

    // Now pressing 'A' on the exam view SHOULD select option A
    await page.keyboard.press('a');

    // Verify option A is now selected
    const updatedAnswers = await page.evaluate(() => {
      const raw = sessionStorage.getItem('minnese_active_exam_session_v1');
      return raw ? JSON.parse(raw).answers : {};
    });
    expect(Object.keys(updatedAnswers).length).toBe(1);

    // Press 'F' on exam view: should flag the question
    await page.keyboard.press('f');
    await expect(page.getByText(/Đã gắn cờ/i)).toBeVisible();

    // Clean up test input
    await page.evaluate(() => {
      const el = document.getElementById('stress-test-text-input');
      if (el) el.remove();
    });
  });

  // =========================================================================
  // 5. Scoring Edge Cases: Pass (>=60%), Fail (<60%), Empty vs Full Submissions
  // =========================================================================
  test('Scoring Edge Cases: Pass threshold >=60%, Fail <60%, Empty vs Full submission validation', async ({ page }) => {
    const request = page.request;

    // 1. Generate session for HSK 1
    const genRes = await request.post('/api/exam/generate-mock', {
      data: { level: 1, mode: 'mock' },
    });
    expect(genRes.ok()).toBe(true);
    const genData = await genRes.json();
    const sessionId = genData.session.sessionId;
    const questions = genData.session.questions;
    expect(questions.length).toBe(40);

    // Case A: Empty submission (0 answers) -> totalScore = 0, passed = false
    const emptySubmitRes = await request.post('/api/exam/submit', {
      data: {
        sessionId,
        level: 1,
        answers: {},
        timeSpentSeconds: 60,
      },
    });
    expect(emptySubmitRes.ok()).toBe(true);
    const emptyResult = await emptySubmitRes.json();
    expect(emptyResult.scoreResult.totalScore).toBe(0);
    expect(emptyResult.scoreResult.percentage).toBe(0);
    expect(emptyResult.scoreResult.passed).toBe(false);

    // Case B: Boundary case FAIL (57.5% < 60%)
    // Answering 11 listening correct (55 pts) + 12 reading correct (60 pts) = 115 pts -> FAIL
    // Answering 12 listening correct (60 pts) + 12 reading correct (60 pts) = 120 pts -> PASS (60%)
    const practiceRes = await request.get('/api/exam/practice?level=1&count=40');
    expect(practiceRes.ok()).toBe(true);
    const practiceData = await practiceRes.json();

    // Map questions by section
    const listeningQs = practiceData.questions.filter((q: any) => q.section === 'listening');
    const readingQs = practiceData.questions.filter((q: any) => q.section === 'reading');

    // Build exactly 115 pts answers (11 listening + 12 reading)
    const failBoundaryAnswers: Record<string, number> = {};
    listeningQs.slice(0, 11).forEach((q: any) => { failBoundaryAnswers[q.id] = q.answer_index; });
    readingQs.slice(0, 12).forEach((q: any) => { failBoundaryAnswers[q.id] = q.answer_index; });

    const failSubmitRes = await request.post('/api/exam/submit', {
      data: {
        sessionId,
        level: 1,
        answers: failBoundaryAnswers,
        timeSpentSeconds: 600,
      },
    });
    expect(failSubmitRes.ok()).toBe(true);
    const failBoundaryResult = await failSubmitRes.json();
    expect(failBoundaryResult.scoreResult.totalScore).toBe(115);
    expect(failBoundaryResult.scoreResult.passed).toBe(false);

    // Build exactly 120 pts answers (12 listening + 12 reading = 60 + 60 = 120)
    const passBoundaryAnswers: Record<string, number> = {};
    listeningQs.slice(0, 12).forEach((q: any) => { passBoundaryAnswers[q.id] = q.answer_index; });
    readingQs.slice(0, 12).forEach((q: any) => { passBoundaryAnswers[q.id] = q.answer_index; });

    const passSubmitRes = await request.post('/api/exam/submit', {
      data: {
        sessionId,
        level: 1,
        answers: passBoundaryAnswers,
        timeSpentSeconds: 600,
      },
    });
    expect(passSubmitRes.ok()).toBe(true);
    const passBoundaryResult = await passSubmitRes.json();
    expect(passBoundaryResult.scoreResult.totalScore).toBe(120);
    expect(passBoundaryResult.scoreResult.percentage).toBe(60);
    expect(passBoundaryResult.scoreResult.passed).toBe(true);

    // Case C: Full 100% correct answers (20 listening + 20 reading = 200 pts)
    const fullCorrectAnswers: Record<string, number> = {};
    for (const q of practiceData.questions) {
      fullCorrectAnswers[q.id] = q.answer_index;
    }

    const fullSubmitRes = await request.post('/api/exam/submit', {
      data: {
        sessionId,
        level: 1,
        answers: fullCorrectAnswers,
        timeSpentSeconds: 1200,
      },
    });
    expect(fullSubmitRes.ok()).toBe(true);
    const fullResult = await fullSubmitRes.json();
    expect(fullResult.scoreResult.totalScore).toBe(200);
    expect(fullResult.scoreResult.percentage).toBe(100);
    expect(fullResult.scoreResult.passed).toBe(true);

    // Case D: HSK 2 Pass/Fail threshold (Pass Score = 180 / 300 = 60.0%)
    const genHsk2Res = await request.post('/api/exam/generate-mock', {
      data: { level: 2, mode: 'mock' },
    });
    expect(genHsk2Res.ok()).toBe(true);
    const genHsk2Data = await genHsk2Res.json();
    expect(genHsk2Data.session.maxScore).toBe(300);
    expect(genHsk2Data.session.passScore).toBe(180);
  });
});
