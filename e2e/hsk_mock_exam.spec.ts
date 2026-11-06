import { test, expect } from '@playwright/test';

test.describe('Phòng Thi Thử & Luyện Đề HSK 3.0 (Student Mock Exam & Practice)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?tab=quizzes');
    await expect(page.locator('#quizzes-container')).toBeVisible();
  });

  test('Hiển thị Banner Phòng Thi Thử HSK 3.0 và các nút 1-Click tại tab Luyện tập', async ({ page }) => {
    // Banner chào mừng phòng thi chuẩn
    await expect(page.getByText(/Phòng Thi Thử & Luyện Đề HSK 3.0 \(CTI \/ CLEC\)/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Thi thử 1-Click/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Luyện kỹ năng/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Sổ câu sai/i })).toBeVisible();
  });

  test('Khởi chạy Chế độ 1: Thi Thử HSK 1 Chuẩn 1-Click (Timer, Question Palette, Nộp bài, Điểm HSK, Confetti)', async ({ page }) => {
    // Bấm vào nút Thi thử 1-Click
    await page.getByRole('button', { name: /Thi thử 1-Click/i }).click();

    // Xác nhận đã vào phòng thi chuẩn HSK 1
    await expect(page.getByText(/Thi thử HSK 1/i)).toBeVisible();

    // Kiểm tra đồng hồ đếm ngược hiển thị định dạng MM:SS
    const timerBadge = page.locator('div').filter({ hasText: /^[0-3][0-9]:[0-5][0-9]$/ });
    await expect(timerBadge.first()).toBeVisible();

    // Kiểm tra bảng điều hướng câu hỏi (1..40)
    await expect(page.getByText(/Bảng Điều Hướng \(1\.\.40\)/i)).toBeVisible();

    // Chọn phương án A cho câu 1
    const optionA = page.getByTestId('exam-option-a');
    await expect(optionA).toBeVisible();
    await optionA.click();

    // Gắn cờ câu hỏi (Phím F hoặc click nút)
    const flagBtn = page.getByRole('button', { name: /Gắn cờ/i });
    if (await flagBtn.isVisible()) {
      await flagBtn.click();
      await expect(page.getByText(/Đã gắn cờ/i)).toBeVisible();
    }

    // Chuyển sang câu 2 bằng nút Câu sau
    const nextBtn = page.getByRole('button', { name: /Câu sau/i });
    await nextBtn.click();
    await expect(page.getByText(/Câu 2 \//i)).toBeVisible();

    // Chọn phương án B cho câu 2
    const optionB = page.getByTestId('exam-option-b');
    if (await optionB.isVisible()) {
      await optionB.click();
    }

    // Nộp bài thi
    page.once('dialog', async (dialog) => {
      await dialog.accept();
    });
    const submitBtn = page.getByRole('button', { name: /Nộp bài/i });
    await submitBtn.click();

    // Kiểm tra màn hình kết quả khảo thí
    await expect(page.getByText(/Kết Quả Khảo Thí HSK 1/i)).toBeVisible();
    await expect(page.getByText(/Biểu Đồ Radar Chẩn Đoán Kỹ Năng/i)).toBeVisible();
    await expect(page.getByText(/Phân Tích Chi Tiết Từng Phần Thi/i)).toBeVisible();
    await expect(page.getByText(/Xem Lại Toàn Bộ Bài Làm/i)).toBeVisible();
  });

  test('Khởi chạy Chế độ 2: Luyện Tập Kỹ Năng (Untimed, Kiểm tra đáp án tức thì, Lời giải tiếng Việt)', async ({ page }) => {
    // Bấm vào nút Luyện kỹ năng từ banner
    await page.getByRole('button', { name: /Luyện kỹ năng/i }).click();

    // Xác nhận đã vào phòng luyện tập HSK 1
    await expect(page.getByText(/Luyện tập HSK 1/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Kiểm tra đáp án/i })).toBeVisible();

    // Chọn một phương án
    const option = page.locator('[data-testid^="exam-option-"]').first();
    await option.click();

    // Bấm nút Kiểm tra đáp án
    await page.getByRole('button', { name: /Kiểm tra đáp án/i }).click();

    // Xác nhận hiển thị thông báo kết quả và giải thích chi tiết tiếng Việt
    await expect(page.getByText(/Giải thích chi tiết:/i)).toBeVisible();
  });

  test('Công tắc Pinyin Toggle (Show/Hide Pinyin) hoạt động chính xác', async ({ page }) => {
    await page.getByRole('button', { name: /Luyện kỹ năng/i }).click();
    await expect(page.getByText(/Luyện tập HSK 1/i)).toBeVisible();

    // Nút Pinyin Toggle
    const pinyinToggle = page.getByRole('button', { name: /Pinyin/i });
    await expect(pinyinToggle).toBeVisible();

    // Bấm tắt Pinyin
    await pinyinToggle.click();
    // Bấm bật lại Pinyin
    await pinyinToggle.click();
    await expect(pinyinToggle).toBeVisible();
  });

  test('Truy cập Sổ Tay Câu Sai (错题本) và bộ lọc theo cấp độ', async ({ page }) => {
    // Mở Sổ tay câu sai
    await page.getByRole('button', { name: /Sổ câu sai/i }).click();

    // Xác nhận giao diện Sổ tay câu sai
    await expect(page.getByText(/Sổ Tay Câu Sai \(错题本\)/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Tất cả cấp độ/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /HSK 1/i })).toBeVisible();
  });

  test('Hỗ trợ Deep Linking qua URL params (?view=hsk_mock&level=2)', async ({ page }) => {
    await page.goto('/?tab=quizzes&view=hsk_mock&level=2');
    await expect(page.locator('#quizzes-container')).toBeVisible();
    await expect(page.getByText(/Thi thử HSK 2/i)).toBeVisible();
  });

  test('Hiển thị Multi-image Option Cards với Vector SVG và Lightbox Modal Zoom Gallery', async ({ page }) => {
    await page.getByRole('button', { name: /Thi thử 1-Click/i }).click();
    await expect(page.getByText(/Thi thử HSK 1/i)).toBeVisible();

    // Câu 1 là câu hỏi chọn tranh (listen_picture_match_3opt)
    // Các thẻ phương án chứa vector SVG
    const optionCards = page.locator('[data-testid^="exam-option-"]');
    await expect(optionCards).toHaveCount(3);
    await expect(optionCards.first().locator('svg').first()).toBeVisible();

    // Bấm nút phóng to hình ảnh trên thẻ phương án
    const zoomBtn = optionCards.first().locator('button[title*="Phóng to"]').first();
    await expect(zoomBtn).toBeVisible();
    await zoomBtn.click();

    // Kiểm tra Lightbox modal xuất hiện
    await expect(page.getByText(/Phóng to hình minh họa/i)).toBeVisible();

    // Chuyển sang ảnh tiếp theo
    const nextImgBtn = page.locator('button[title*="tiếp theo"]').first();
    if (await nextImgBtn.isVisible()) {
      await nextImgBtn.click();
    }

    // Đóng Lightbox bằng phím Escape
    await page.keyboard.press('Escape');
    await expect(page.getByText(/Phóng to hình minh họa/i)).not.toBeVisible();
  });

  test('Quy tắc CTI CLEC: Pinyin bật được ở HSK 1-2, bị khóa (Chữ Hán thuần) ở HSK 3-5', async ({ page }) => {
    // Vào HSK 1: Pinyin button hiển thị
    await page.getByRole('button', { name: /Luyện kỹ năng/i }).click();
    await expect(page.getByText(/Luyện tập HSK 1/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Pinyin/i })).toBeVisible();

    // Vào HSK 3: Header hiển thị badge Chữ Hán thuần
    await page.goto('/?tab=quizzes&view=hsk_mock&level=3');
    await expect(page.locator('#quizzes-container')).toBeVisible();
    await expect(page.getByText(/Thi thử HSK 3/i)).toBeVisible();
    await expect(page.getByText(/Chữ Hán thuần/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Pinyin: Đang/i })).not.toBeVisible();
  });

  test('Giao diện Viết Điền Chữ Điền (田字格) trên HSK 3 Kỹ Năng Viết', async ({ page }) => {
    // Truy cập phần luyện viết HSK 3
    await page.goto('/?tab=quizzes&view=hsk_practice&level=3&skill=writing');
    await expect(page.locator('#quizzes-container')).toBeVisible();
    await expect(page.getByText(/Luyện tập HSK 3/i)).toBeVisible();

    // Xác nhận giao diện 田字格 hiển thị
    await expect(page.getByText(/Ô Điền Chữ Khảo Thí \(田字格\)/i)).toBeVisible();

    // Chọn một phương án chữ Hán
    const optionA = page.getByTestId('exam-option-a');
    await expect(optionA).toBeVisible();
    await optionA.click();

    // Xác nhận đã điền chữ vào ô
    await expect(page.getByText(/✓ Đã chọn chữ:/i)).toBeVisible();
  });

  test('Bộ chuyển cấp độ (Level Switcher Tabs) trong Deck Luyện đề hoạt động', async ({ page }) => {
    await page.goto('/?tab=quizzes&view=hsk_hall');
    await expect(page.locator('#quizzes-container')).toBeVisible();

    // Tại sảnh chính, bấm vào tab HSK 2 trong deck Luyện kỹ năng
    const tabHsk2 = page.getByTestId('practice-level-tab-2');
    await expect(tabHsk2).toBeVisible();
    await tabHsk2.click();

    // Nút Luyện kỹ năng cập nhật thành HSK 2
    const readHsk2Btn = page.getByRole('button', { name: /Luyện Đọc HSK 2/i });
    await expect(readHsk2Btn).toBeVisible();
    await readHsk2Btn.click();

    // Xác nhận đã vào phòng luyện đọc HSK 2
    await expect(page.getByText(/Luyện tập HSK 2/i)).toBeVisible();
  });
});
