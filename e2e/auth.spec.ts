import { test, expect } from '@playwright/test';

test.describe('Luồng Xác thực & Tài khoản (Authentication)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Hiển thị trang chủ và mở modal Đăng ký tài khoản', async ({ page }) => {
    // Kiểm tra logo và giao diện tải thành công
    await expect(page.locator('#app-logo-btn')).toBeVisible();

    // Mở modal Auth (qua nút Đăng ký trên Navbar hoặc User Menu)
    const registerBtn = page.locator('#navbar-register-btn');
    if (await registerBtn.isVisible()) {
      await registerBtn.click();
    } else {
      await page.locator('#navbar-user-avatar-btn').click();
      await page.getByRole('button', { name: /Đăng ký/i }).click();
    }

    // Modal xuất hiện
    await expect(page.locator('#auth-modal')).toBeVisible();
    await expect(page.locator('#auth-tab-register')).toBeVisible();

    // Chuyển sang tab Đăng ký nếu chưa active
    await page.locator('#auth-tab-register').click();

    // Điền form đăng ký
    const testEmail = `test.student.${Date.now()}@minnese.app`;
    await page.locator('#auth-input-name').fill('Học Viên Test');
    await page.locator('#auth-input-email').fill(testEmail);
    await page.locator('#auth-input-password').fill('123456');
    await page.locator('#auth-input-confirm-password').fill('123456');

    // Nút submit có sẵn
    await expect(page.locator('#auth-submit-btn')).toBeEnabled();
  });

  test('Validation: Báo lỗi khi mật khẩu xác nhận không khớp', async ({ page }) => {
    const registerBtn = page.locator('#navbar-register-btn');
    if (await registerBtn.isVisible()) {
      await registerBtn.click();
    } else {
      await page.locator('#navbar-user-avatar-btn').click();
      await page.getByRole('button', { name: /Đăng ký/i }).click();
    }

    await page.locator('#auth-tab-register').click();
    await page.locator('#auth-input-name').fill('Nguyễn Văn A');
    await page.locator('#auth-input-email').fill('nguyenvana@gmail.com');
    await page.locator('#auth-input-password').fill('123456');
    await page.locator('#auth-input-confirm-password').fill('654321');

    await page.locator('#auth-submit-btn').click();

    // Kiểm tra hiển thị thông báo lỗi
    await expect(page.getByText(/Mật khẩu xác nhận không khớp/i)).toBeVisible();
  });

  test('Chuyển đổi linh hoạt giữa Đăng nhập, Đăng ký và Quên mật khẩu', async ({ page }) => {
    const registerBtn = page.locator('#navbar-register-btn');
    if (await registerBtn.isVisible()) {
      await registerBtn.click();
    } else {
      await page.locator('#navbar-user-avatar-btn').click();
      await page.getByRole('button', { name: /Đăng nhập/i }).click();
    }

    await expect(page.locator('#auth-modal')).toBeVisible();

    // Chuyển sang Đăng nhập
    await page.locator('#auth-tab-login').click();
    await expect(page.locator('#auth-input-name')).not.toBeVisible();

    // Bấm Quên mật khẩu
    await page.getByRole('button', { name: /Quên mật khẩu\?/i }).click();
    await expect(page.getByText(/Khôi phục mật khẩu/i)).toBeVisible();

    // Quay lại Đăng nhập
    await page.getByRole('button', { name: /Quay lại trang Đăng nhập/i }).click();
    await expect(page.locator('#auth-tab-login')).toBeVisible();
  });
});
