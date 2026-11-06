import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { DatabaseSync } from 'node:sqlite';

const EXPECTED_LEGACY_DB_HASH = '10255BCCDF641545F649641912C0982B02600E74B5CCEE1229FF03FAA8ED66DD';
const LEGACY_DB_PATH = path.resolve(process.cwd(), 'data/hsk_exam.db');
const QBANK_DB_PATH = path.resolve(process.cwd(), 'data/qbank/qbank.db');

function getDbHash(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex').toUpperCase();
}

function verifyDbInvariant(): void {
  const hash = getDbHash(LEGACY_DB_PATH);
  expect(hash).toBe(EXPECTED_LEGACY_DB_HASH);
  const db = new DatabaseSync(LEGACY_DB_PATH);
  const row: any = db.prepare('SELECT COUNT(*) as count FROM questions').get();
  expect(Number(row.count)).toBe(6);
  db.close();
}

test.describe('Challenger M4.2: UI Resilience against Reverse Proxy HTML Errors & Full UI Lifecycle', () => {
  const testQId = `chal_ui_test_${Date.now()}`;

  test.beforeEach(async () => {
    verifyDbInvariant();

    // Prepare a pristine test pending question in qbank.db
    const qb = new DatabaseSync(QBANK_DB_PATH);
    qb.prepare("DELETE FROM pending_questions WHERE id LIKE 'chal_ui_test_%'").run();
    qb.prepare("DELETE FROM questions WHERE id LIKE 'chal_ui_test_%'").run();
    qb.prepare("DELETE FROM qb_questions WHERE question_id LIKE 'chal_ui_test_%'").run();

    qb.prepare(`
      INSERT INTO pending_questions (
        id, stem, options, answer_idx, pinyin, explanation_vi, level, skill, part_type, illustration_theme, status, provider_used
      ) VALUES (?, ?, ?, ?, ?, ?, 1, 'reading', 'read_fill_blank_4opt', null, 'pending', 'deepseek-chat')
    `).run(
      testQId,
      '今天天气很好，我们去公园____吧。',
      JSON.stringify(['散步', '电脑', '苹果', '飞机']),
      0,
      'Jīntiān tiānqì hěn hǎo, wǒmen qù gōngyuán sànbù ba.',
      'Điền từ 散步 (đi dạo) hợp lý với công viên và thời tiết tốt.'
    );
    qb.close();
  });

  test.afterEach(async () => {
    const qb = new DatabaseSync(QBANK_DB_PATH);
    qb.prepare("DELETE FROM pending_questions WHERE id LIKE 'chal_ui_test_%'").run();
    qb.prepare("DELETE FROM questions WHERE id LIKE 'chal_ui_test_%'").run();
    qb.prepare("DELETE FROM qb_questions WHERE question_id LIKE 'chal_ui_test_%'").run();
    qb.close();

    verifyDbInvariant();
  });

  test('UI Error Resilience: Reverse proxy HTML 500/502 intercepted by safeApiCall without crashing React UI', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', (err) => {
      // Capture any unhandled React crashes or JSON syntax errors
      pageErrors.push(err);
    });

    // 1. Authenticate admin user
    await page.addInitScript(() => {
      localStorage.setItem(
        'minnese_user_profile_v2',
        JSON.stringify({
          id: 'admin-challenger',
          email: 'babysharkkk123@gmail.com',
          displayName: 'Admin Challenger',
          role: 'admin',
        })
      );
      sessionStorage.setItem('qbank_admin_token', 'admin123456');
      (window as any).__QBANK_ENABLED__ = true;
    });

    // 2. Intercept /api/qbank/pending with simulated HTML 500 error from reverse proxy
    let simulate500 = true;
    let simulate502 = false;

    await page.route('**/api/qbank/pending*', async (route) => {
      if (simulate500) {
        await route.fulfill({
          status: 500,
          contentType: 'text/html; charset=utf-8',
          body: `<!DOCTYPE html><html><head><title>500 Internal Server Error</title></head><body><h1>500 Internal Server Error</h1><hr>nginx/1.24.0</body></html>`,
        });
      } else if (simulate502) {
        await route.fulfill({
          status: 502,
          contentType: 'text/html; charset=utf-8',
          body: `<!DOCTYPE html><html><body><h1>502 Bad Gateway</h1></body></html>`,
        });
      } else {
        await route.continue();
      }
    });

    // 3. Navigate to QBank Admin
    await page.goto('/?tab=qbank');

    // Click on 'Duyệt đề' tab
    const duyetDeTab = page.locator('[data-testid="subtab-duyet-de"]');
    await expect(duyetDeTab).toBeVisible({ timeout: 10000 });
    await duyetDeTab.click();

    // 4. Verify HTML 500 is caught gracefully: Error banner rendered, NO unhandled pageerror
    await expect(page.getByText('Không thể tải danh sách câu hỏi chờ duyệt')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/không đúng định dạng JSON/i)).toBeVisible();
    await expect(page.getByText(/500/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Thử lại' })).toBeVisible();

    // Verify no unhandled page crash
    expect(pageErrors.length).toBe(0);

    // 5. Now switch route to simulate HTML 502 Bad Gateway and click "Thử lại"
    simulate500 = false;
    simulate502 = true;

    await page.getByRole('button', { name: 'Thử lại' }).click();

    // Verify 502 error banner rendered safely
    await expect(page.getByText('Không thể tải danh sách câu hỏi chờ duyệt')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/không đúng định dạng JSON/i)).toBeVisible();
    await expect(page.getByText(/502/i).first()).toBeVisible();
    expect(pageErrors.length).toBe(0);

    // 6. Disable simulation: restore healthy API response and click "Thử lại"
    simulate502 = false;

    await page.getByRole('button', { name: 'Thử lại' }).click();

    // Error banner disappears, pending list loads and displays our test question card!
    await expect(page.getByText('Không thể tải danh sách câu hỏi chờ duyệt')).not.toBeVisible({ timeout: 5000 });
    const questionCard = page.locator(`[data-testid="pending-card-${testQId}"]`);
    await expect(questionCard).toBeVisible({ timeout: 5000 });
    await expect(questionCard.getByText('今天天气很好，我们去公园____吧。')).toBeVisible();

    // No uncaught exceptions occurred throughout the entire simulation
    expect(pageErrors.length).toBe(0);

    await page.unrouteAll({ behavior: 'ignoreErrors' });
  });

  test('Full UI End-to-End Lifecycle: Inline edit on card -> Approve -> Verify active promotion', async ({ page }) => {
    page.on('console', (msg) => console.log('[BROWSER LOG]', msg.text()));
    page.on('requestfailed', (req) => console.log('[REQ FAILED]', req.method(), req.url(), req.failure()?.errorText));
    page.on('response', (res) => {
      if (res.status() >= 400) console.log('[HTTP ERROR]', res.status(), res.url());
    });

    await page.addInitScript(() => {
      localStorage.setItem(
        'minnese_user_profile_v2',
        JSON.stringify({
          id: 'admin-challenger',
          email: 'babysharkkk123@gmail.com',
          displayName: 'Admin Challenger',
          role: 'admin',
        })
      );
      sessionStorage.setItem('qbank_admin_token', 'admin123456');
      (window as any).__QBANK_ENABLED__ = true;
    });

    await page.goto('/?tab=qbank');

    const duyetDeTab = page.locator('[data-testid="subtab-duyet-de"]');
    await expect(duyetDeTab).toBeVisible({ timeout: 10000 });
    await duyetDeTab.click();

    const questionCard = page.locator(`[data-testid="pending-card-${testQId}"]`);
    await expect(questionCard).toBeVisible({ timeout: 5000 });

    // 1. Enter inline edit mode
    const editBtn = page.locator(`[data-testid="btn-edit-pending-${testQId}"]`);
    await editBtn.click();

    // Verify edit form appears
    const inlineForm = page.locator('[data-testid="inline-edit-form"]');
    await expect(inlineForm).toBeVisible();

    // Edit explanation text
    const explanationTextarea = inlineForm.locator('[data-testid="textarea-edit-explanation"]');
    const newExplanation = 'Lời giải thích được Challenger sửa trực tiếp trên giao diện: Đi dạo trong công viên.';
    await explanationTextarea.fill(newExplanation);

    // Save edit
    const saveBtn = inlineForm.locator('[data-testid="btn-save-edit"]');
    await saveBtn.click();

    // Form closes and card displays edited explanation
    await expect(inlineForm).not.toBeVisible();
    await expect(questionCard.getByText(newExplanation)).toBeVisible();

    // 2. Approve question
    const approveBtn = page.locator(`[data-testid="btn-approve-pending-${testQId}"]`);
    await approveBtn.click();

    // Card disappears from pending list
    await expect(questionCard).not.toBeVisible({ timeout: 5000 });

    // 3. Verify in SQLite Database: promoted to active questions and qb_questions
    const qb = new DatabaseSync(QBANK_DB_PATH);
    const pendingRow: any = qb.prepare('SELECT status FROM pending_questions WHERE id = ?').get(testQId);
    expect(pendingRow.status).toBe('approved');

    const activeQuestion: any = qb.prepare('SELECT * FROM questions WHERE id = ?').get(testQId);
    expect(activeQuestion).toBeDefined();
    expect(activeQuestion.status).toBe('approved');
    expect(activeQuestion.explanation_vi).toBe(newExplanation);

    const qbQuestion: any = qb.prepare('SELECT * FROM qb_questions WHERE question_id = ?').get(testQId);
    expect(qbQuestion).toBeDefined();
    expect(qbQuestion.status).toBe('approved');
    expect(qbQuestion.explanation_vi).toBe(newExplanation);

    qb.close();
  });
});
