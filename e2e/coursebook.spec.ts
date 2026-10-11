import { test, expect } from '@playwright/test';

test.describe('Luồng Giáo trình HSK Chuẩn & Lớp học (Coursebook & Lessons)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const coursebookTabBtn = page.locator('#tab-btn-coursebook');
    if (await coursebookTabBtn.isVisible()) {
      await coursebookTabBtn.click();
    } else {
      await page.getByRole('button', { name: /Giáo trình|Khóa học/i }).first().click();
    }
  });

  test('Hiển thị màn hình Giáo trình HSK hoặc Khóa học bảo mật', async ({ page }) => {
    // Đợi tải lazy component nếu có
    const targetElement = page.getByText(/Yêu Cầu Kích Hoạt Mã Lớp Học|Giáo Trình Bản Quyền|Giáo trình HSK|Bài \d+|HSK 1/i).first();
    await expect(targetElement).toBeVisible({ timeout: 10000 });
  });
});
