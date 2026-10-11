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

  test('Hiển thị bộ câu hỏi Pinyin & Ngữ pháp', async ({ page }) => {
    // Kiểm tra đã vào tab Quizzes
    await expect(page.locator('#quizzes-container')).toBeVisible();

    // Kiểm tra câu hỏi đầu tiên hiển thị
    await expect(page.getByText(/Câu 1 \//i)).toBeVisible();

    // Các lựa chọn đáp án hiển thị (tối thiểu 2-4 nút lựa chọn)
    const optionButtons = page.locator('#quizzes-container button').filter({ hasNotText: /Sinh 20 câu|Phát âm|Pinyin & Ngữ pháp|Luyện nghe|Tạo bài kiểm tra|Đề Thi Online/i });
    await expect(optionButtons.first()).toBeVisible();
  });

  test('Chọn đáp án và kiểm tra hiển thị phân tích, giải thích ngữ pháp', async ({ page }) => {
    await expect(page.locator('#quizzes-container')).toBeVisible();

    // Lấy nút đáp án đầu tiên trong danh sách câu hỏi
    const options = page.locator('div.grid.grid-cols-1.sm\\:grid-cols-2 button');
    await expect(options.first()).toBeVisible();

    // Bấm chọn đáp án đầu tiên
    await options.first().click();

    // Sau khi chọn, bảng phân tích chi tiết sẽ hiện ra
    await expect(page.getByText(/Chú thích & Phân tích chi tiết/i)).toBeVisible();

    // Nút "Câu tiếp theo" xuất hiện
    const nextBtn = page.getByRole('button', { name: /Câu tiếp theo|Xem kết quả/i });
    await expect(nextBtn).toBeVisible();

    // Bấm sang câu tiếp theo
    await nextBtn.click();

    // Tiến trình chuyển sang Câu 2
    await expect(page.getByText(/Câu 2 \//i)).toBeVisible();
  });

  test('Chuyển đổi các danh mục kiểm tra: Pinyin, Luyện nghe và Đề thi Online', async ({ page }) => {
    await expect(page.locator('#quizzes-container')).toBeVisible();

    // Chuyển sang Luyện nghe
    await page.getByRole('button', { name: /Luyện nghe phát âm/i }).click();
    await expect(page.getByText(/Phát âm âm thanh|Bấm để nghe/i)).toBeVisible();

    // Chuyển sang Đề thi Online
    await page.getByRole('button', { name: /Đề Thi Online & Sách Bài Tập/i }).click();
    await expect(page.getByText(/Nhập Mã Phòng Thi|Danh sách Đề thi/i)).toBeVisible();
  });
});
