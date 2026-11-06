import { test, expect } from '@playwright/test';

test.describe('Luồng Luyện tập & Bài kiểm tra HSK (Quizzes & Practice)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const quizTabBtn = page.locator('#tab-btn-quizzes');
    if (await quizTabBtn.isVisible()) {
      await quizTabBtn.click();
    } else {
      await page.getByRole('button', { name: /Luyện tập|Luyện thi/i }).first().click();
    }
  });

  test('Chỉ giữ đề thi thử, luyện kỹ năng QBank và đề giáo viên', async ({ page }) => {
    await expect(page.locator('#quizzes-container')).toBeVisible();
    await expect(page.getByText(/Phòng Thi Thử & Luyện Đề HSK 3.0 \(CTI \/ CLEC\)/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Thi thử 1-Click/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Luyện kỹ năng/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Sổ câu sai/i })).toBeVisible();
    await expect(page.getByText(/Đề thi giáo viên phát hành/i)).toBeVisible();

    await expect(page.getByText(/Luyện tập Trắc nghiệm theo Cấp độ HSK/i)).not.toBeVisible();
    await expect(page.getByRole('button', { name: /Pinyin & Ngữ pháp/i })).not.toBeVisible();
    await expect(page.getByRole('button', { name: /Tạo bài kiểm tra AI/i })).not.toBeVisible();
  });

  test('Mở luyện kỹ năng từ QBank', async ({ page }) => {
    await expect(page.locator('#quizzes-container')).toBeVisible();
    await page.getByRole('button', { name: /Luyện kỹ năng/i }).click();
    await expect(page.getByText(/Luyện tập HSK/i)).toBeVisible();
  });
});
