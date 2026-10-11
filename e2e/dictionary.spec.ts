import { test, expect } from '@playwright/test';

test.describe('Luồng Từ điển Đa năng & Tra nét chữ Hán (Dictionary & Hanzi Studio)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const dictTabBtn = page.locator('#tab-btn-dictionary');
    if (await dictTabBtn.isVisible()) {
      await dictTabBtn.click();
    } else {
      await page.getByRole('button', { name: /Từ điển|Tra cứu/i }).first().click();
    }
  });

  test('Hiển thị ô tìm kiếm từ vựng và danh sách từ HSK', async ({ page }) => {
    // Kiểm tra ô tìm kiếm từ điển
    const searchInput = page.getByPlaceholder(/Tra chữ Hán/i);
    await expect(searchInput).toBeVisible();

    // Nhập từ khoá tìm kiếm
    await searchInput.fill('学习');
    await page.waitForTimeout(500);

    // Kiểm tra xuất hiện kết quả chứa từ 学习 hoặc pinyin xuéxí
    await expect(page.getByText(/xuéxí|học tập/i).first()).toBeVisible();
  });

  test('Mở chi tiết từ vựng và Studio nét vẽ chữ Hán', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Tra chữ Hán/i);
    await searchInput.fill('好');
    await page.waitForTimeout(500);

    // Bấm vào từ vựng '好' trong danh sách kết quả
    const wordCard = page.locator('#vocab-grid').getByText('好').first();
    await wordCard.click();

    // Kiểm tra modal hoặc panel chi tiết từ hiển thị
    await expect(page.getByText(/Bộ thủ|Nét viết|Nghĩa Hán Việt|Ví dụ/i).first()).toBeVisible();
  });
});

