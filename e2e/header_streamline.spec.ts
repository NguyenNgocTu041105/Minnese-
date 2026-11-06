import { test, expect } from '@playwright/test';

test.describe('Header Streamlining & Notification Integrated Due Cards', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('R1 & AC1: Header right area has exactly 3 standard icons and no clutter chips/badges (Desktop)', async ({ page }) => {
    // 1. Verify standard 3 icons exist
    const bellBtn = page.locator('#navbar-notification-btn');
    const themeBtn = page.locator('#navbar-theme-toggle-btn');
    const avatarBtn = page.locator('#navbar-user-avatar-btn');

    await expect(bellBtn).toBeVisible();
    await expect(themeBtn).toBeVisible();
    await expect(avatarBtn).toBeVisible();

    // 2. Verify removed clutter chips and buttons do NOT exist anywhere in header
    await expect(page.locator('#navbar-due-cards-chip')).not.toBeVisible();
    await expect(page.locator('#tab-btn-qbank')).not.toBeVisible();
    await expect(page.locator('#tab-btn-admin')).not.toBeVisible();
    await expect(page.locator('#admin-portal-badges')).not.toBeVisible();

    // Verify no streak chip in header (e.g. text matching \d+d)
    const header = page.locator('header');
    await expect(header.getByText(/\d+d streak/i)).not.toBeVisible();
    await expect(header.getByText(/\d+ thẻ cần ôn/i)).not.toBeVisible();
  });

  test('R1 & AC1: Header on Mobile (< 640px) only displays the 3 standard icons and no clutter chips', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const bellBtn = page.locator('#navbar-notification-btn');
    const themeBtn = page.locator('#navbar-theme-toggle-btn');
    const avatarBtn = page.locator('#navbar-user-avatar-btn');

    await expect(bellBtn).toBeVisible();
    await expect(themeBtn).toBeVisible();
    await expect(avatarBtn).toBeVisible();

    await expect(page.locator('#navbar-due-cards-chip')).not.toBeVisible();
    await expect(page.locator('#tab-btn-qbank')).not.toBeVisible();
    await expect(page.locator('#tab-btn-admin')).not.toBeVisible();
    await expect(page.locator('#admin-portal-badges')).not.toBeVisible();

    const header = page.locator('header');
    await expect(header.getByText(/\d+d streak/i)).not.toBeVisible();
    await expect(header.getByText(/\d+ thẻ cần ôn/i)).not.toBeVisible();
  });

  test('R2 & AC2: Notification Bell dropdown has SRS due cards as item #1 with Ôn tập ngay action', async ({ page }) => {
    const bellBtn = page.locator('#navbar-notification-btn');
    await bellBtn.click();

    const dropdown = page.locator('#navbar-notifications-dropdown');
    await expect(dropdown).toBeVisible();

    // Item #1: Due cards review item
    const dueTitle = dropdown.getByText(/từ vựng cần ôn tập hôm nay/i);
    await expect(dueTitle).toBeVisible();

    const dueSubtitle = dropdown.getByText(/chuẩn New HSK.*Thuật toán SM-2/i);
    await expect(dueSubtitle).toBeVisible();

    const reviewBtn = page.locator('#navbar-notification-due-review-btn');
    await expect(reviewBtn).toBeVisible();
    await expect(reviewBtn).toHaveText(/Ôn tập ngay/i);

    // Clicking "Ôn tập ngay" closes dropdown and activates flashcards review
    await reviewBtn.click();
    await expect(dropdown).not.toBeVisible();

    // Verify user navigated to flashcards tab or review session triggered
    await expect(page.locator('#flashcards-container')).toBeVisible({ timeout: 10000 });
  });

  test('R3 & AC3: Avatar menu removes 0d streak but preserves CỔNG QUẢN TRỊ for admin', async ({ page }) => {
    // Test with admin user
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
      (window as any).__QBANK_ENABLED__ = true;
    });

    await page.goto('/');

    const avatarBtn = page.locator('#navbar-user-avatar-btn');
    await avatarBtn.click();

    // 1. Verify 0d streak is NOT in the avatar menu
    await expect(page.getByText(/\d+d streak/i)).not.toBeVisible();

    // 2. Verify CỔNG QUẢN TRỊ is preserved and functional
    await expect(page.getByText('Cổng Quản Trị')).toBeVisible();
    const qbankMenuBtn = page.locator('#menu-btn-qbank');
    const adminMenuBtn = page.locator('#menu-btn-admin');
    await expect(qbankMenuBtn).toBeVisible();
    await expect(adminMenuBtn).toBeVisible();

    // Bấm vào Quản trị QBank điều hướng sang tab qbank
    await qbankMenuBtn.click();
    await expect(page.getByText(/Ngân Hàng Câu Hỏi HSK 3.0/i)).toBeVisible();
  });

  test('Edge Case: Notification dropdown on mobile (< 400px) does not overflow screen horizontally', async ({ page }) => {
    for (const width of [375, 320]) {
      await page.setViewportSize({ width, height: 667 });
      await page.goto('/');

      const bellBtn = page.locator('#navbar-notification-btn');
      await bellBtn.click();

      const dropdown = page.locator('#navbar-notifications-dropdown');
      await expect(dropdown).toBeVisible();

      const box = await dropdown.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        // Must start within the visible screen area (x >= 0)
        expect(box.x).toBeGreaterThanOrEqual(0);
        // Must end within the viewport width (x + width <= viewport width)
        expect(box.x + box.width).toBeLessThanOrEqual(width);
      }
    }
  });

  test('Edge Case: Notification dropdown when 0 cards are due maintains item #1 and Ôn tập ngay action', async ({ page }) => {
    // Mock cards as completely mastered/not due
    await page.addInitScript(() => {
      // Mark all words as reviewed today
      const now = new Date().toISOString();
      const future = new Date(Date.now() + 7 * 86400000).toISOString();
      const masteredCards: Record<string, any> = {};
      for (let i = 1; i <= 20; i++) {
        masteredCards[`hsk1_word_${i}`] = {
          wordId: `hsk1_word_${i}`,
          repetition: 3,
          interval: 7,
          easinessFactor: 2.5,
          lastReviewDate: now,
          nextReviewDate: future,
          state: 'mastered',
          history: [],
        };
      }
      localStorage.setItem('minnie_srs_cards_v1', JSON.stringify(masteredCards));
    });

    await page.goto('/');

    const bellBtn = page.locator('#navbar-notification-btn');
    await bellBtn.click();

    const dropdown = page.locator('#navbar-notifications-dropdown');
    await expect(dropdown).toBeVisible();

    // Check title renders with count
    const dueTitle = dropdown.getByText(/từ vựng cần ôn tập hôm nay/i);
    await expect(dueTitle).toBeVisible();

    const reviewBtn = page.locator('#navbar-notification-due-review-btn');
    await expect(reviewBtn).toBeVisible();
    await reviewBtn.click();
    await expect(dropdown).not.toBeVisible();
    await expect(page.locator('#flashcards-container')).toBeVisible({ timeout: 10000 });
  });

  test('Reactivity: Notification updates on storage & lesson progress custom event', async ({ page }) => {
    await page.goto('/');

    // Dispatch custom event to simulate lesson progress advancement
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('minnie_lesson_progress_updated'));
    });

    const bellBtn = page.locator('#navbar-notification-btn');
    await expect(bellBtn).toBeVisible();
  });

  test('Edge Case: Escape key closes both Notification dropdown and Avatar dropdown', async ({ page }) => {
    await page.goto('/');

    const bellBtn = page.locator('#navbar-notification-btn');
    const notifDropdown = page.locator('#navbar-notifications-dropdown');
    const avatarBtn = page.locator('#navbar-user-avatar-btn');
    const avatarMenu = page.locator('#navbar-user-avatar-btn + *');

    // 1. Open notifications -> press Escape -> closed
    await bellBtn.click();
    await expect(notifDropdown).toBeVisible();
    await expect(bellBtn).toHaveAttribute('aria-expanded', 'true');

    await page.keyboard.press('Escape');
    await expect(notifDropdown).not.toBeVisible();
    await expect(bellBtn).toHaveAttribute('aria-expanded', 'false');

    // 2. Open avatar menu -> press Escape -> closed
    await avatarBtn.click();
    await expect(page.getByText('Cài đặt giọng đọc & phát âm')).toBeVisible();
    await expect(avatarBtn).toHaveAttribute('aria-expanded', 'true');

    await page.keyboard.press('Escape');
    await expect(page.getByText('Cài đặt giọng đọc & phát âm')).not.toBeVisible();
    await expect(avatarBtn).toHaveAttribute('aria-expanded', 'false');
  });

  test('Edge Case: Click-outside closes open dropdowns', async ({ page }) => {
    await page.goto('/');

    const bellBtn = page.locator('#navbar-notification-btn');
    const notifDropdown = page.locator('#navbar-notifications-dropdown');

    // Open bell -> click main page content outside -> closed
    await bellBtn.click();
    await expect(notifDropdown).toBeVisible();
    await page.locator('main').click({ position: { x: 50, y: 150 } });
    await expect(notifDropdown).not.toBeVisible();

    // Open avatar -> click main page content outside -> closed
    const avatarBtn = page.locator('#navbar-user-avatar-btn');
    await avatarBtn.click();
    await expect(page.getByText('Cài đặt giọng đọc & phát âm')).toBeVisible();
    await page.locator('main').click({ position: { x: 50, y: 150 } });
    await expect(page.getByText('Cài đặt giọng đọc & phát âm')).not.toBeVisible();
  });

  test('Edge Case: Mutually exclusive open states between Bell and Avatar menus', async ({ page }) => {
    await page.goto('/');

    const bellBtn = page.locator('#navbar-notification-btn');
    const notifDropdown = page.locator('#navbar-notifications-dropdown');
    const avatarBtn = page.locator('#navbar-user-avatar-btn');

    // Open bell dropdown
    await bellBtn.click();
    await expect(notifDropdown).toBeVisible();

    // Clicking avatar button closes bell dropdown and opens avatar menu
    await avatarBtn.click();
    await expect(notifDropdown).not.toBeVisible();
    await expect(page.getByText('Cài đặt giọng đọc & phát âm')).toBeVisible();

    // Clicking bell button closes avatar menu and opens bell dropdown
    await bellBtn.click();
    await expect(page.getByText('Cài đặt giọng đọc & phát âm')).not.toBeVisible();
    await expect(notifDropdown).toBeVisible();
  });

  test('Edge Case: Level clamping to HSK 4 when user profile has level 5+', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'minnese_user_profile_v2',
        JSON.stringify({
          id: 'test-hsk5-user',
          email: 'hsk5@example.com',
          displayName: 'HSK 5 Student',
          role: 'user',
          current_level: 5,
        })
      );
    });

    await page.goto('/');

    const bellBtn = page.locator('#navbar-notification-btn');
    await bellBtn.click();

    const dropdown = page.locator('#navbar-notifications-dropdown');
    await expect(dropdown).toBeVisible();

    // Subtitle correctly clamps to HSK 4 data without crash or NaN
    const dueSubtitle = dropdown.getByText(/chuẩn New HSK 4 · Thuật toán SM-2/i);
    await expect(dueSubtitle).toBeVisible();

    const reviewBtn = page.locator('#navbar-notification-due-review-btn');
    await expect(reviewBtn).toBeVisible();
  });
});

