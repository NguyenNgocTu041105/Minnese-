import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { execFileSync } from 'child_process';

const EXPECTED_LEGACY_DB_HASH = '10255BCCDF641545F649641912C0982B02600E74B5CCEE1229FF03FAA8ED66DD';
const LEGACY_DB_PATH = path.resolve(process.cwd(), 'data/hsk_exam.db');

function getDbHash(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex').toUpperCase();
}

test.describe('Ngân Hàng Đề Thi HSK 3.0 QBank E2E Test Suite', () => {
  test.beforeEach(async () => {
    // Assert data/hsk_exam.db exists and hash matches before each test
    const currentHash = getDbHash(LEGACY_DB_PATH);
    expect(currentHash).toBe(EXPECTED_LEGACY_DB_HASH);
  });

  test.afterEach(async () => {
    // Assert data/hsk_exam.db is untouched after each test
    const currentHash = getDbHash(LEGACY_DB_PATH);
    expect(currentHash).toBe(EXPECTED_LEGACY_DB_HASH);
  });

  // =========================================================================
  // Kịch bản A: Yêu cầu chưa xác thực tới /api/qbank/* trả về JSON 401/403/404 (không bao giờ là HTML)
  // =========================================================================
  test('A. Unauthenticated /api/qbank/* requests return 401/403/404 JSON (never HTML)', async ({ request }) => {
    const endpoints = [
      { method: 'get', url: '/api/qbank/stats', data: undefined },
      { method: 'get', url: '/api/qbank/questions', data: undefined },
      { method: 'post', url: '/api/qbank/generate', data: { level: 1, count: 2 } },
      { method: 'post', url: '/api/qbank/review', data: { question_id: 'qb_test', action: 'approve' } },
      { method: 'post', url: '/api/qbank/sync', data: { execute: false } },
    ];

    for (const ep of endpoints) {
      let res;
      if (ep.method === 'get') {
        res = await request.get(ep.url);
      } else {
        res = await request.post(ep.url, {
          data: ep.data,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Security gate or 404 fallback must reject with 401, 403, or 404
      expect([401, 403, 404]).toContain(res.status());

      // Content-Type MUST be application/json
      const contentType = res.headers()['content-type'] || '';
      expect(contentType).toContain('application/json');

      const rawText = await res.text();
      // Crucial requirement: Must never return HTML SPA fallback
      expect(rawText).not.toContain('<!DOCTYPE');
      expect(rawText).not.toContain('<html');

      const body = JSON.parse(rawText);
      expect(body.success).toBe(false);
      expect(body.error).toBeDefined();
    }
  });

  // =========================================================================
  // Kịch bản B: Tab "Quản trị QBank" trên Navbar bị ẩn khi tắt cổng hoặc người dùng không phải admin/teacher
  // =========================================================================
  test('B. Navbar tab "Quản trị QBank" is hidden when disabled or user is not authorized admin/teacher', async ({ page }) => {
    // 1. Khách / Học viên bình thường (role: 'user'): Tab không xuất hiện
    await page.goto('/');
    await expect(page.locator('#tab-btn-qbank')).not.toBeVisible();

    // Truy cập trực tiếp qua URL query param /?tab=qbank
    await page.goto('/?tab=qbank');
    await expect(page.locator('#tab-btn-qbank')).not.toBeVisible();
    await expect(page.getByText(/Sinh Đề HSK 3.0 Chuẩn \(Từ vựng & Chữ Hán CLEC\)/i)).not.toBeVisible();

    // 2. Người dùng là admin nhưng cổng QBANK_ADMIN_ENABLED bị tắt
    await page.route('**/api/qbank-status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ enabled: false }),
      });
    });

    await page.addInitScript(() => {
      localStorage.setItem(
        'minnese_user_profile_v2',
        JSON.stringify({
          id: 'admin-test',
          email: 'babysharkkk123@gmail.com',
          displayName: 'Admin User',
          role: 'admin',
        })
      );
      (window as any).__QBANK_ENABLED__ = false;
    });

    await page.goto('/');
    await expect(page.locator('#tab-btn-qbank')).not.toBeVisible();

    // 3. Người dùng là admin VÀ cổng QBANK_ADMIN_ENABLED bật: Tab "Quản trị QBank" hiển thị
    await page.unroute('**/api/qbank-status');
    await page.route('**/api/qbank-status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ enabled: true }),
      });
    });

    await page.addInitScript(() => {
      (window as any).__QBANK_ENABLED__ = true;
    });

    await page.goto('/');
    // With streamlined header (R1 & R3), QBank admin is accessed via the Avatar menu (Cổng Quản Trị)
    const avatarBtn = page.locator('#navbar-user-avatar-btn');
    const qbankMenuBtn = page.locator('#menu-btn-qbank');
    const qbankTab = page.locator('#tab-btn-qbank');
    if (await qbankTab.isVisible()) {
      await qbankTab.click();
    } else {
      await avatarBtn.click();
      await expect(qbankMenuBtn).toBeVisible();
      await qbankMenuBtn.click();
    }
    await expect(page.getByText(/Ngân Hàng Câu Hỏi HSK 3.0/i)).toBeVisible();
  });

  // =========================================================================
  // Kịch bản C: Luồng sinh câu hỏi mock (với QBANK_BRIDGE_MOCK=1)
  // =========================================================================
  test('C. Mock question generation flow with QBANK_BRIDGE_MOCK=1', async ({ page }) => {
    // 1. Kiểm tra tiến trình Python bridge chạy độc lập với QBANK_BRIDGE_MOCK=1
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qbank_e2e_gen_'));
    const tmpStoreDb = path.join(tmpDir, 'qbank_mock_gen.db');
    try {
      const pythonOut = execFileSync(
        'python',
        ['-m', 'qbank.api_bridge', 'generate', '--db-path', tmpStoreDb, '--count', '2'],
        {
          env: {
            ...process.env,
            QBANK_BRIDGE_MOCK: '1',
            PYTHONIOENCODING: 'utf-8',
          },
          encoding: 'utf-8',
        }
      );
      const parsedGen = JSON.parse(pythonOut.trim());
      expect(parsedGen.success).toBe(true);
      expect(parsedGen.batch_id).toBeDefined();
      expect(parsedGen.count).toBe(2);
      expect(parsedGen.questions.length).toBe(2);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }

    // 2. Kiểm tra thao tác sinh câu hỏi trên giao diện Web UI
    await page.route('**/api/qbank-status', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ enabled: true }) });
    });

    await page.route('**/api/qbank/stats', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          total: 10,
          total_questions: 10,
          by_status: { approved: 6, needs_review: 4, rejected: 0 },
          by_level: { '1': 10 },
          eligible_for_sync: 6,
          syllabus_coverage: {
            '1': { total_words: 300, used_words: 10, coverage_ratio: 0.0333 },
          },
        }),
      });
    });

    await page.route('**/api/qbank/questions*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          total: 2,
          questions: [
            {
              question_id: 'qb_1_fill_blank_mock01',
              level: 1,
              skill: 'reading',
              part_type: 'fill_blank',
              stem: '今天天气很好，我想去____借两本书。',
              options: ['学校', '老师', '朋友', '准备'],
              answer_index: 0,
              explanation_vi: 'Ngữ cảnh mượn sách thì địa điểm phù hợp là 学校.',
              status: 'needs_review',
              qa: { structure_ok: true, level_ok: true, out_of_level_words: [], notes: [] },
              critical_flags: { flags: [], has_char_noise: false, char_noise_reasons: [], has_solver_ambiguity: false, has_out_of_level: false, has_critical: false },
            },
          ],
        }),
      });
    });

    let generateCalled = false;
    await page.route('**/api/qbank/generate', async (route) => {
      generateCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          batch_id: 'batch_mock_e2e_20261018',
          count: 2,
          generated_count: 2,
          count_generated: 2,
          model: 'mock-llm',
        }),
      });
    });

    await page.addInitScript(() => {
      localStorage.setItem(
        'minnese_user_profile_v2',
        JSON.stringify({
          id: 'admin-test',
          email: 'babysharkkk123@gmail.com',
          displayName: 'Admin User',
          role: 'admin',
        })
      );
      sessionStorage.setItem('qbank_admin_token', 'valid-e2e-token');
      (window as any).__QBANK_ENABLED__ = true;
    });

    await page.goto('/?tab=qbank');

    // Chuyển sang sub-tab "Tạo câu hỏi AI"
    await page.locator('[data-testid="subtab-generate"]').or(page.getByRole('button', { name: /Tạo câu hỏi AI|Bảng Điều Khiển Sinh Đề/i })).first().click();

    // Nhấn nút kích hoạt sinh đề
    const submitBtn = page.getByRole('button', { name: /(Bắt đầu|Kích hoạt) Sinh \d+ Câu Hỏi/i });
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Kiểm tra API sinh đề được gọi thành công và hiển thị tổng kết batch
    await expect.poll(() => generateCalled).toBe(true);
    await expect(page.getByText(/batch_mock_e2e_20261018/i)).toBeVisible();
    await expect(page.getByText(/Thành Công/i).first()).toBeVisible();
  });

  // =========================================================================
  // Kịch bản D: Modal duyệt câu hỏi có cờ QA yêu cầu gõ chính xác "duyet" và lý do >= 10 ký tự
  // =========================================================================
  test('D. Flagged question review modal requires typing exact "duyet" AND reason >= 10 characters', async ({ page }) => {
    await page.route('**/api/qbank-status', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ enabled: true }) });
    });

    await page.route('**/api/qbank/stats', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          total: 1,
          total_questions: 1,
          by_status: { needs_review: 1 },
          by_level: { '1': 1 },
          eligible_for_sync: 0,
          syllabus_coverage: {},
        }),
      });
    });

    // Mock trả về 1 câu hỏi có cờ cảnh báo solver ambiguity
    await page.route('**/api/qbank/questions*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          total: 1,
          questions: [
            {
              question_id: 'qb_1_flagged_ambiguity_01',
              level: 1,
              skill: 'reading',
              part_type: 'fill_blank',
              stem: '他去商店买了一____衣服。',
              options: ['件', '个', '本', '只'],
              answer_index: 0,
              explanation_vi: 'Lượng từ cho quần áo thường dùng 件.',
              status: 'needs_review',
              qa: {
                structure_ok: true,
                level_ok: true,
                out_of_level_words: [],
                notes: ['Solver flagged ambiguity: 2 options acceptable [0, 1]'],
              },
              critical_flags: {
                flags: ['solver_ambiguity (Solver phát hiện đa nghĩa hoặc lệch đáp án)'],
                has_char_noise: false,
                char_noise_reasons: [],
                has_solver_ambiguity: true,
                has_out_of_level: false,
                has_critical: true,
              },
            },
          ],
        }),
      });
    });

    let reviewPayloadSent: any = null;
    await page.route('**/api/qbank/review', async (route) => {
      reviewPayloadSent = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          question_id: 'qb_1_flagged_ambiguity_01',
          status: 'approved',
        }),
      });
    });

    await page.addInitScript(() => {
      localStorage.setItem(
        'minnese_user_profile_v2',
        JSON.stringify({
          id: 'admin-test',
          email: 'babysharkkk123@gmail.com',
          role: 'admin',
        })
      );
      sessionStorage.setItem('qbank_admin_token', 'valid-e2e-token');
      (window as any).__QBANK_ENABLED__ = true;
    });

    await page.goto('/?tab=qbank');

    // Kiểm tra banner cờ QA màu vàng hiển thị
    await expect(page.getByText(/CẢNH BÁO KIỂM ĐỊNH CHẤT LƯỢNG \(QA \/ SOLVER FLAG\)/i)).toBeVisible();

    // Nút "Duyệt có cờ..." xuất hiện
    const flagApproveBtn = page.getByRole('button', { name: /Duyệt có cờ\.\.\./i });
    await expect(flagApproveBtn).toBeVisible();
    await flagApproveBtn.click();

    // Modal Review Override xuất hiện
    await expect(page.getByText(/Phê Duyệt Ngoại Lệ Câu Hỏi Có Cờ/i)).toBeVisible();

    const confirmSubmitBtn = page.getByRole('button', { name: /Xác nhận Duyệt Ngoại lệ/i });
    // Ban đầu nút submit bị disable
    await expect(confirmSubmitBtn).toBeDisabled();

    const confirmInput = page.locator('input[placeholder="duyet"]');
    const reasonInput = page.locator('textarea[placeholder*="Đã kiểm tra ngữ cảnh"]');

    // Thử 1: Gõ sai từ xác nhận ("dong_y") và lý do dài -> Vẫn disable
    await confirmInput.fill('dong_y');
    await reasonInput.fill('Lý do này đã dài hơn 10 ký tự hợp lệ');
    await expect(confirmSubmitBtn).toBeDisabled();

    // Thử 2: Gõ đúng từ "duyet" nhưng lý do quá ngắn (< 10 ký tự) -> Vẫn disable
    await confirmInput.fill('duyet');
    await reasonInput.fill('Quá ngắn');
    await expect(confirmSubmitBtn).toBeDisabled();

    // Thử 3: Gõ đúng "duyet" VÀ lý do >= 10 ký tự -> Nút submit mở khóa!
    await reasonInput.fill('Đã kiểm tra kỹ ngữ cảnh câu dẫn, lượng từ chuẩn');
    await expect(confirmSubmitBtn).toBeEnabled();

    // Bấm xác nhận duyệt
    await confirmSubmitBtn.click();

    // Modal đóng lại và API nhận đúng dữ liệu duyệt ngoại lệ
    await expect(page.getByText(/Phê Duyệt Ngoại Lệ Câu Hỏi Có Cờ/i)).not.toBeVisible();
    expect(reviewPayloadSent).not.toBeNull();
    expect(reviewPayloadSent.action).toBe('approve');
    expect(reviewPayloadSent.override_reason).toBe('Đã kiểm tra kỹ ngữ cảnh câu dẫn, lượng từ chuẩn');
  });

  // =========================================================================
  // Kịch bản E: Câu hỏi có chữ nhiễu (Latin, tiếng Việt, ngoặc đơn) tuyệt đối KHÔNG có nút duyệt
  // =========================================================================
  test('E. Character noise questions strictly have NO approve button (locked out with badge)', async ({ page }) => {
    await page.route('**/api/qbank-status', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ enabled: true }) });
    });

    await page.route('**/api/qbank/stats', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          total: 1,
          total_questions: 1,
          by_status: { needs_review: 1 },
          by_level: { '1': 1 },
          eligible_for_sync: 0,
          syllabus_coverage: {},
        }),
      });
    });

    // Mock trả về 1 câu hỏi có chữ nhiễu Latin/Việt
    await page.route('**/api/qbank/questions*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          total: 1,
          questions: [
            {
              question_id: 'qb_1_noise_latin_01',
              level: 1,
              skill: 'reading',
              part_type: 'fill_blank',
              stem: '爸爸买了一个大西瓜(gợi ý: rất to), 我和哥哥一人吃____。',
              options: ['一半', '一书', '一水', '一车'],
              answer_index: 0,
              explanation_vi: 'Chia đôi ăn một nửa.',
              status: 'needs_review',
              qa: {
                structure_ok: true,
                level_ok: true,
                out_of_level_words: [],
                notes: ['Câu dẫn chứa ghi chú/gợi ý trong ngoặc.', 'Câu dẫn chứa ký tự không hợp lệ (Latin/Vi): g, ợ, i, ý'],
              },
              critical_flags: {
                flags: ['char_noise (Ký tự nhiễu: Latin, tiếng Việt, hoặc ngoặc đơn trong stem/options)'],
                has_char_noise: true,
                char_noise_reasons: ['Câu dẫn chứa ký tự không hợp lệ (Latin/Vi)'],
                has_solver_ambiguity: false,
                has_out_of_level: false,
                has_critical: true,
              },
            },
          ],
        }),
      });
    });

    await page.addInitScript(() => {
      localStorage.setItem(
        'minnese_user_profile_v2',
        JSON.stringify({
          id: 'admin-test',
          email: 'babysharkkk123@gmail.com',
          role: 'admin',
        })
      );
      sessionStorage.setItem('qbank_admin_token', 'valid-e2e-token');
      (window as any).__QBANK_ENABLED__ = true;
    });

    await page.goto('/?tab=qbank');

    // 1. Banner chữ nhiễu màu đỏ hiển thị rõ ràng
    await expect(page.getByText(/PHÁT HIỆN KÝ TỰ NHIỄU \(KHÓA DUYỆT BẮT BUỘC\)/i)).toBeVisible();

    // 2. Huy hiệu khóa duyệt màu đỏ hiển thị
    const lockoutBadge = page.getByText(/Khóa duyệt \(Chữ nhiễu\) - Vui lòng sửa nội dung/i);
    await expect(lockoutBadge).toBeVisible();

    // 3. Khẳng định: Nút "Phê duyệt" hoặc "Duyệt có cờ..." hoàn toàn KHÔNG TỒN TẠI trên card
    await expect(page.getByRole('button', { name: /^Phê duyệt$/i })).not.toBeVisible();
    await expect(page.getByRole('button', { name: /Duyệt có cờ/i })).not.toBeVisible();

    // 4. Các nút "Sửa nội dung" và "Từ chối" vẫn tồn tại để xử lý câu hỏi
    await expect(page.getByRole('button', { name: /Sửa nội dung/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Từ chối/i })).toBeVisible();
  });

  // =========================================================================
  // Kịch bản F: Quy trình Đồng bộ 2 bước (Dry-run mặc định, hiển thị bản sao lưu, gõ lại số câu, nạp trên DB tạm)
  // =========================================================================
  test('F. Sync workflow: defaults to dry-run first, displays counts and backup path, then executes sync on a temporary DB copy', async ({ page }) => {
    // 1. Kiểm tra đồng bộ thực tế qua Python bridge trên bản sao CSDL tạm trong os.tmpdir()
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qbank_e2e_sync_'));
    const tmpLegacyDb = path.join(tmpDir, 'hsk_exam_sandbox.db');
    const tmpQbankDb = path.join(tmpDir, 'qbank_sandbox.db');

    try {
      // Sao chép data/hsk_exam.db sang thư mục tạm để chạy test đồng bộ
      fs.copyFileSync(LEGACY_DB_PATH, tmpLegacyDb);
      const initialSandboxHash = getDbHash(tmpLegacyDb);
      expect(initialSandboxHash).toBe(EXPECTED_LEGACY_DB_HASH);

      // Sinh 2 câu hỏi vào QBank sandbox DB
      execFileSync(
        'python',
        ['-m', 'qbank.api_bridge', 'generate', '--db-path', tmpQbankDb, '--count', '2'],
        {
          env: { ...process.env, QBANK_BRIDGE_MOCK: '1', PYTHONIOENCODING: 'utf-8' },
          encoding: 'utf-8',
        }
      );

      // Duyệt câu hỏi đầu tiên
      const listOut = execFileSync(
        'python',
        ['-m', 'qbank.api_bridge', 'questions', '--db-path', tmpQbankDb],
        { env: { ...process.env, PYTHONIOENCODING: 'utf-8' }, encoding: 'utf-8' }
      );
      const parsedQuestions = JSON.parse(listOut.trim());
      const firstQid = parsedQuestions.questions[0].question_id;

      execFileSync(
        'python',
        ['-m', 'qbank.api_bridge', 'review', '--db-path', tmpQbankDb, '--question-id', firstQid, '--review-action', 'approve'],
        { env: { ...process.env, PYTHONIOENCODING: 'utf-8' }, encoding: 'utf-8' }
      );

      // Chạy Sync Dry-Run trên bản sao tạm
      const dryRunOut = execFileSync(
        'python',
        ['-m', 'qbank.api_bridge', 'sync', '--db-path', tmpQbankDb, '--legacy-db-path', tmpLegacyDb],
        { env: { ...process.env, PYTHONIOENCODING: 'utf-8' }, encoding: 'utf-8' }
      );
      const dryRunParsed = JSON.parse(dryRunOut.trim());
      expect(dryRunParsed.success).toBe(true);
      expect(dryRunParsed.is_dry_run).toBe(true);
      expect(dryRunParsed.count_synced).toBe(1);

      // Bản sao tạm hsk_exam_sandbox.db chưa hề bị ghi đè sau dry-run
      expect(getDbHash(tmpLegacyDb)).toBe(EXPECTED_LEGACY_DB_HASH);

      // Chạy Sync Execute thật trên bản sao tạm
      const execOut = execFileSync(
        'python',
        ['-m', 'qbank.api_bridge', 'sync', '--db-path', tmpQbankDb, '--legacy-db-path', tmpLegacyDb, '--execute'],
        { env: { ...process.env, PYTHONIOENCODING: 'utf-8' }, encoding: 'utf-8' }
      );
      const execParsed = JSON.parse(execOut.trim());
      expect(execParsed.success).toBe(true);
      expect(execParsed.is_dry_run).toBe(false);
      expect(execParsed.count_synced).toBe(1);
      expect(execParsed.backup_path).toBeDefined();

      // File CSDL gốc data/hsk_exam.db tuyệt đối không bị đụng tới
      expect(getDbHash(LEGACY_DB_PATH)).toBe(EXPECTED_LEGACY_DB_HASH);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }

    // 2. Kiểm tra giao diện quy trình Đồng bộ 2 bước trên Web UI
    await page.route('**/api/qbank-status', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ enabled: true }) });
    });

    await page.route('**/api/qbank/stats', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          total: 5,
          total_questions: 5,
          by_status: { approved: 3, needs_review: 2 },
          by_level: { '1': 5 },
          eligible_for_sync: 3,
          syllabus_coverage: {},
        }),
      });
    });

    await page.route('**/api/qbank/questions*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, total: 0, questions: [] }),
      });
    });

    let syncDryRunCalled = false;
    let syncExecuteCalled = false;

    await page.route('**/api/qbank/sync', async (route) => {
      const data = route.request().postDataJSON();
      if (!data?.execute) {
        syncDryRunCalled = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            is_dry_run: true,
            total_eligible: 3,
            count_synced: 3,
            synced_count: 3,
            skipped_duplicate_hash: 0,
            skipped_near_duplicate: 0,
            skipped_blocked_flags: 0,
            backup_file: 'data/hsk_exam.db.backup_e2e_20261018.sqlite',
            blocked_questions: [],
          }),
        });
      } else {
        syncExecuteCalled = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            is_dry_run: false,
            count_synced: 3,
            synced_count: 3,
            backup_file: 'data/hsk_exam.db.backup_e2e_20261018.sqlite',
          }),
        });
      }
    });

    await page.addInitScript(() => {
      localStorage.setItem(
        'minnese_user_profile_v2',
        JSON.stringify({
          id: 'admin-test',
          email: 'babysharkkk123@gmail.com',
          role: 'admin',
        })
      );
      sessionStorage.setItem('qbank_admin_token', 'valid-e2e-token');
      (window as any).__QBANK_ENABLED__ = true;
    });

    await page.goto('/?tab=qbank');

    // Bấm nút "Đồng bộ Đề thi Web" ở header
    await page.getByRole('button', { name: /Đồng bộ Đề thi Web/i }).first().click();

    // Modal đồng bộ xuất hiện và tự động chạy Phase 1 Dry-Run
    await expect(page.getByText(/Đồng Bộ Ngân Hàng Đề Thi Web/i)).toBeVisible();
    await expect.poll(() => syncDryRunCalled).toBe(true);

    // Hiển thị kết quả Dry-Run: Số câu sẵn sàng nạp và đường dẫn sao lưu
    await expect(page.getByText('Sẵn sàng nạp', { exact: true })).toBeVisible();
    await expect(page.getByText(/3 câu/i).first()).toBeVisible();
    await expect(page.getByText(/data\/hsk_exam\.db\.backup_e2e_20261018\.sqlite/i)).toBeVisible();

    const executeBtn = page.getByRole('button', { name: /Xác nhận nạp đề/i });
    // Ban đầu nút xác nhận nạp đề bị disable vì chưa gõ lại số câu
    await expect(executeBtn).toBeDisabled();

    const retypeInput = page.locator('input[placeholder="3"]');
    // Gõ sai số câu ("2") -> Vẫn disable
    await retypeInput.fill('2');
    await expect(executeBtn).toBeDisabled();

    // Gõ đúng số câu ("3") -> Mở khóa nút nạp đề!
    await retypeInput.fill('3');
    await expect(executeBtn).toBeEnabled();

    // Nhấn nạp đề chính thức
    await executeBtn.click();
    await expect.poll(() => syncExecuteCalled).toBe(true);

    // Màn hình thông báo thành công xuất hiện
    await expect(page.getByText(/Đồng Bộ Thành Công!/i)).toBeVisible();
    await expect(page.getByText(/Đã nạp thành công/i)).toBeVisible();

    // Đóng modal
    await page.getByRole('button', { name: /Hoàn tất & Đóng/i }).click();
    await expect(page.getByText(/Đồng Bộ Ngân Hàng Đề Thi Web/i)).not.toBeVisible();
  });

  // =========================================================================
  // Kịch bản G: Xử lý lỗi API luôn trả về phản hồi JSON sạch (không bao giờ là HTML)
  // =========================================================================
  test('G. API error handling returns clean JSON responses (never HTML)', async ({ request }) => {
    // 1. Gọi endpoint không tồn tại trong cây /api/qbank/*
    // NOTE: /api/qbank/* is protected by auth middleware, so 401 or 404 are both valid security rejections.
    // Test A correctly uses [401, 403, 404] — this test aligns with that behavior.
    const notFoundRes = await request.get('/api/qbank/endpoint-does-not-exist-404');
    expect([401, 403, 404]).toContain(notFoundRes.status());
    expect(notFoundRes.headers()['content-type']).toContain('application/json');

    const notFoundText = await notFoundRes.text();
    expect(notFoundText).not.toContain('<!DOCTYPE');
    expect(notFoundText).not.toContain('<html');

    const notFoundJson = JSON.parse(notFoundText);
    expect(notFoundJson.success).toBe(false);
    expect(notFoundJson.error).toBeDefined();

    // 2. Gửi request POST /api/qbank/review với dữ liệu rác / thiếu trường bắt buộc
    const badReviewRes = await request.post('/api/qbank/review', {
      data: { invalid_field: true },
      headers: { 'Content-Type': 'application/json' },
    });

    expect([400, 401, 403, 404]).toContain(badReviewRes.status());
    expect(badReviewRes.headers()['content-type']).toContain('application/json');

    const badReviewText = await badReviewRes.text();
    expect(badReviewText).not.toContain('<!DOCTYPE');
    expect(badReviewText).not.toContain('<html');

    const badReviewJson = JSON.parse(badReviewText);
    expect(badReviewJson.success).toBe(false);
    expect(badReviewJson.error).toBeDefined();
  });
});
