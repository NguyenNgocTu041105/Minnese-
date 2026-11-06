import { test, expect } from '@playwright/test';

test.describe('Luồng Ôn tập Thẻ Ghi Nhớ Flashcards SM-2', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const flashcardsTabBtn = page.locator('#tab-btn-flashcards');
    if (await flashcardsTabBtn.isVisible()) {
      await flashcardsTabBtn.click();
    } else {
      const avatarBtn = page.locator('#navbar-user-avatar-btn');
      if (await avatarBtn.isVisible()) {
        await avatarBtn.click();
      }
      await page.getByRole('button', { name: /Flashcards|Thẻ từ/i }).first().click();
    }
  });

  test('Hiển thị danh sách các bộ thẻ từ vựng HSK', async ({ page }) => {
    await expect(page.locator('#flashcards-container')).toBeVisible({ timeout: 10000 });

    // Kiểm tra tiêu đề trang Flashcards
    await expect(page.getByText(/Bộ thẻ ghi nhớ/i).first()).toBeVisible();

    // Chuyển sang tab Bộ thẻ mở rộng & tự tạo
    const customTabBtn = page.getByRole('button', { name: /Bộ thẻ mở rộng & tự tạo/i });
    if (await customTabBtn.isVisible()) {
      await customTabBtn.click();
    }

    // Kiểm tra có nút ôn tập
    const studyButtons = page.getByRole('button', { name: /Học SM-2|Tất cả|Ôn toàn bộ/i });
    await expect(studyButtons.first()).toBeVisible();
  });

  test('Bắt đầu học 1 bộ thẻ, Lật thẻ và Đánh giá ghi nhớ (SRS)', async ({ page }) => {
    await expect(page.locator('#flashcards-container')).toBeVisible({ timeout: 10000 });

    // Chuyển sang tab bộ thẻ mở rộng
    const customTabBtn = page.getByRole('button', { name: /Bộ thẻ mở rộng & tự tạo/i });
    if (await customTabBtn.isVisible()) {
      await customTabBtn.click();
    }

    // Bấm bắt đầu học bộ thẻ đầu tiên
    const startStudyBtn = page.getByRole('button', { name: /Học SM-2|Tất cả|Ôn toàn bộ/i }).first();
    await startStudyBtn.click();

    // Thẻ SRS chính thức hiện ra
    await expect(page.locator('#active-srs-card')).toBeVisible({ timeout: 10000 });

    // Kiểm tra có nút "Lật xem nghĩa & ví dụ"
    const flipBtn = page.getByRole('button', { name: /Lật xem nghĩa/i });
    await expect(flipBtn).toBeVisible();

    // Bấm lật thẻ
    await flipBtn.click();

    // Sau khi lật, xuất hiện các nút đánh giá SM-2 (Chưa nhớ / Đã thuộc)
    const ratingBtn = page.getByRole('button', { name: /Chưa nhớ|Đã thuộc/i }).first();
    await expect(ratingBtn).toBeVisible();

    // Chọn đánh giá
    await ratingBtn.click();

    // Hệ thống cập nhật và chuyển sang thẻ tiếp theo hoặc màn hình hoàn thành
    const isCardOrFinishVisible =
      (await page.locator('#active-srs-card').isVisible()) ||
      (await page.getByText(/Hoàn tất buổi ôn|Hoàn thành buổi ôn tập/i).isVisible());
    expect(isCardOrFinishVisible).toBeTruthy();
  });

  test('Mở và đóng bảng Luyện viết nét chữ Hán trong khi học thẻ', async ({ page }) => {
    await expect(page.locator('#flashcards-container')).toBeVisible({ timeout: 10000 });

    const customTabBtn = page.getByRole('button', { name: /Bộ thẻ mở rộng & tự tạo/i });
    if (await customTabBtn.isVisible()) {
      await customTabBtn.click();
    }

    // Vào học
    await page.getByRole('button', { name: /Học SM-2|Tất cả|Ôn toàn bộ/i }).first().click();
    await expect(page.locator('#active-srs-card')).toBeVisible({ timeout: 10000 });

    // Bật chế độ luyện viết
    const toggleCanvasBtn = page.getByRole('button', { name: /Luyện viết nét chữ Hán/i });
    await toggleCanvasBtn.click();

    // Ô tập viết chữ Hán xuất hiện
    await expect(page.getByText(/Luyện viết nét chữ Hán/i).first()).toBeVisible();
  });
});
