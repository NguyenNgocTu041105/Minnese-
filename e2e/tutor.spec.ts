import { test, expect } from '@playwright/test';

test.describe('Luồng Trợ lý AI Gia sư (AI Tutor & Chat)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const tutorTabBtn = page.locator('#tab-btn-tutor');
    if (await tutorTabBtn.isVisible()) {
      await tutorTabBtn.click();
    } else {
      await page.getByRole('button', { name: /Gia sư AI|AI Tutor/i }).first().click();
    }
  });

  test('Hiển thị tin nhắn chào mừng của Gia sư AI và gợi ý câu hỏi', async ({ page }) => {
    // Kiểm tra lời chào mừng của AI Tutor
    await expect(page.getByText(/Gia sư AI kiêm Trợ lý ngôn ngữ Tiếng Trung/i).first()).toBeVisible();

    // Kiểm tra danh sách câu hỏi gợi ý nhanh
    await expect(page.getByText(/打算|trợ từ 的/i).first()).toBeVisible();
  });

  test('Chuyển đổi sang Chế độ Studio Đọc hiểu HSK (HSK Reading Studio)', async ({ page }) => {
    // Bấm chuyển sang tab Tạo bài đọc HSK
    const readingStudioBtn = page.getByRole('button', { name: /Tạo Bài Đọc|Reading Studio/i }).first();
    if (await readingStudioBtn.isVisible()) {
      await readingStudioBtn.click();
      await expect(page.getByText(/Tạo Bài Đọc Hiểu|Tùy chọn bài đọc|Đề tài/i).first()).toBeVisible();
    }
  });
});

