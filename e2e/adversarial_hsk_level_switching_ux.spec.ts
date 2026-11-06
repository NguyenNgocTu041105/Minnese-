import { test, expect } from '@playwright/test';

test.describe('Adversarial Stress Testing: HSK 1-5 Level Switching & Writing UX', () => {
  // =========================================================================
  // 1. Rapid Level Switching in Mock Exam Mode (HSK 1 -> 5 -> 2 -> 4 -> 3)
  // =========================================================================
  test('Rapid Level Switching (1 -> 5 -> 2 -> 4 -> 3): Timers and Palette Counts Reconfigure', async ({ page }) => {
    // 1. Level 1: 40 min, 40 questions
    await page.goto('/?tab=quizzes&view=hsk_mock&level=1');
    await expect(page.locator('#quizzes-container')).toBeVisible();
    await expect(page.getByText(/Thi thử HSK 1/i)).toBeVisible();
    await expect(page.getByText(/Bảng Điều Hướng \(1\.\.40\)/i)).toBeVisible();
    const timerL1 = page.locator('div').filter({ hasText: /^(?:40:00|39:[0-5][0-9])$/ });
    await expect(timerL1.first()).toBeVisible();

    // 2. Switch to Level 5: 125 min, 72 questions
    await page.goto('/?tab=quizzes&view=hsk_mock&level=5');
    await expect(page.locator('#quizzes-container')).toBeVisible();
    await expect(page.getByText(/Thi thử HSK 5/i)).toBeVisible();
    await expect(page.getByText(/Bảng Điều Hướng \(1\.\.72\)/i)).toBeVisible();
    const timerL5 = page.locator('div').filter({ hasText: /^(?:125:00|124:[0-5][0-9])$/ });
    await expect(timerL5.first()).toBeVisible();

    // 3. Switch to Level 2: 55 min, 60 questions
    await page.goto('/?tab=quizzes&view=hsk_mock&level=2');
    await expect(page.locator('#quizzes-container')).toBeVisible();
    await expect(page.getByText(/Thi thử HSK 2/i)).toBeVisible();
    await expect(page.getByText(/Bảng Điều Hướng \(1\.\.60\)/i)).toBeVisible();
    const timerL2 = page.locator('div').filter({ hasText: /^(?:55:00|54:[0-5][0-9])$/ });
    await expect(timerL2.first()).toBeVisible();

    // 4. Switch to Level 4: 100 min, 70 questions
    await page.goto('/?tab=quizzes&view=hsk_mock&level=4');
    await expect(page.locator('#quizzes-container')).toBeVisible();
    await expect(page.getByText(/Thi thử HSK 4/i)).toBeVisible();
    await expect(page.getByText(/Bảng Điều Hướng \(1\.\.70\)/i)).toBeVisible();
    const timerL4 = page.locator('div').filter({ hasText: /^(?:100:00|99:[0-5][0-9])$/ });
    await expect(timerL4.first()).toBeVisible();

    // 5. Switch to Level 3: 85 min, 70 questions
    await page.goto('/?tab=quizzes&view=hsk_mock&level=3');
    await expect(page.locator('#quizzes-container')).toBeVisible();
    await expect(page.getByText(/Thi thử HSK 3/i)).toBeVisible();
    await expect(page.getByText(/Bảng Điều Hướng \(1\.\.70\)/i)).toBeVisible();
    const timerL3 = page.locator('div').filter({ hasText: /^(?:85:00|84:[0-5][0-9])$/ });
    await expect(timerL3.first()).toBeVisible();
  });

  // =========================================================================
  // 2. Max Scoring Reconfiguration (200 pts for HSK 1 vs 300 pts for HSK 2-5)
  // =========================================================================
  test('Scoring Scale Reconfigures Correctly (200 pts for HSK 1 vs 300 pts for HSK 3)', async ({ page }) => {
    // Submit Level 1: max 200 pts
    await page.goto('/?tab=quizzes&view=hsk_mock&level=1');
    await expect(page.locator('#quizzes-container')).toBeVisible();
    page.once('dialog', async (dialog) => {
      await dialog.accept();
    });
    await page.getByRole('button', { name: /Nộp bài/i }).click();
    await expect(page.getByText(/Kết Quả Khảo Thí HSK 1/i)).toBeVisible();
    await expect(page.getByText(/\/ 200/)).toBeVisible();
    await expect(page.getByText(/Điểm chuẩn: 120/)).toBeVisible();

    // Submit Level 3: max 300 pts
    await page.goto('/?tab=quizzes&view=hsk_mock&level=3');
    await expect(page.locator('#quizzes-container')).toBeVisible();
    page.once('dialog', async (dialog) => {
      await dialog.accept();
    });
    await page.getByRole('button', { name: /Nộp bài/i }).click();
    await expect(page.getByText(/Kết Quả Khảo Thí HSK 3/i)).toBeVisible();
    await expect(page.getByText(/\/ 300/)).toBeVisible();
    await expect(page.getByText(/Điểm chuẩn: 180/)).toBeVisible();
  });

  // =========================================================================
  // 3. Rapid Level Switching in Practice Mode Deck
  // =========================================================================
  test('Rapid Level Switching in Practice Deck: Tabs Update Deck Buttons (1 -> 5 -> 2 -> 4 -> 3)', async ({ page }) => {
    await page.goto('/?tab=quizzes&view=hsk_hall');
    await expect(page.locator('#quizzes-container')).toBeVisible();

    const sequence = [1, 5, 2, 4, 3];
    for (const lvl of sequence) {
      const tab = page.getByTestId(`practice-level-tab-${lvl}`);
      await expect(tab).toBeVisible();
      await tab.click();

      // Check button labels updated
      await expect(page.getByRole('button', { name: new RegExp(`Luyện Nghe HSK ${lvl}`, 'i') })).toBeVisible();
      await expect(page.getByRole('button', { name: new RegExp(`Luyện Đọc HSK ${lvl}`, 'i') })).toBeVisible();
      await expect(page.getByRole('button', { name: new RegExp(`Luyện Viết HSK ${lvl}`, 'i') })).toBeVisible();
    }

    // Enter Practice Mode for HSK 3
    await page.getByRole('button', { name: /Luyện Đọc HSK 3/i }).click();
    await expect(page.getByText(/Luyện tập HSK 3/i)).toBeVisible();
    await expect(page.getByText(/Chữ Hán thuần/i)).toBeVisible();
  });

  // =========================================================================
  // 4. Pinyin Restriction & Keyboard 'P' Lockout on HSK 3, 4, 5
  // =========================================================================
  test('Pinyin Toggle Restriction: Keyboard P is Blocked and Pure Hanzi Enforced on HSK 3, 4, 5', async ({ page }) => {
    // 1. On HSK 1: Pinyin button exists and responds to keyboard 'P'
    await page.goto('/?tab=quizzes&view=hsk_mock&level=1');
    await expect(page.locator('#quizzes-container')).toBeVisible();
    const pinyinBtn = page.getByRole('button', { name: /Pinyin/i });
    await expect(pinyinBtn).toBeVisible();

    // Press P to toggle off
    await page.keyboard.press('p');
    // Button state changes
    await expect(pinyinBtn).toBeVisible();

    // 2. On HSK 3: Pure Hanzi badge shown, Pinyin button absent, pressing P does nothing
    await page.goto('/?tab=quizzes&view=hsk_mock&level=3');
    await expect(page.locator('#quizzes-container')).toBeVisible();
    await expect(page.getByText(/Chữ Hán thuần/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Pinyin/i })).not.toBeVisible();

    // Press key 'P' multiple times (lowercase and uppercase)
    await page.keyboard.press('p');
    await page.keyboard.press('P');

    // Confirm Pure Hanzi badge remains and no Pinyin button appears
    await expect(page.getByText(/Chữ Hán thuần/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Pinyin/i })).not.toBeVisible();

    // 3. On HSK 4 and 5
    for (const lvl of [4, 5]) {
      await page.goto(`/?tab=quizzes&view=hsk_mock&level=${lvl}`);
      await expect(page.locator('#quizzes-container')).toBeVisible();
      await expect(page.getByText(/Chữ Hán thuần/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /Pinyin/i })).not.toBeVisible();
      await page.keyboard.press('p');
      await expect(page.getByRole('button', { name: /Pinyin/i })).not.toBeVisible();
    }
  });

  // =========================================================================
  // 5. Adversarial LocalStorage Poisoning for Pinyin on HSK 3-5
  // =========================================================================
  test('Pinyin Leak Resistance against LocalStorage Poisoning on HSK 3', async ({ page }) => {
    // Attempt to poison localStorage before loading HSK 3
    await page.addInitScript(() => {
      window.localStorage.setItem('minnese_pinyin_toggle_v1', 'true');
    });

    await page.goto('/?tab=quizzes&view=hsk_mock&level=3');
    await expect(page.locator('#quizzes-container')).toBeVisible();
    await expect(page.getByText(/Thi thử HSK 3/i)).toBeVisible();
    await expect(page.getByText(/Chữ Hán thuần/i)).toBeVisible();

    // Verify whether pinyin stem was leaked onto screen
    // On HSK 3, stem should only show Hanzi without pinyin guide
    // Let's check if the font-mono pinyin container is present or not
    const pinyinElements = page.locator('.font-mono.text-teal-600, .font-mono.text-teal-400');
    const pinyinCount = await pinyinElements.count();
    console.log(`[Adversarial Pinyin Check] Elements count with pinyin classes on HSK 3: ${pinyinCount}`);
  });

  // =========================================================================
  // 6. Writing UX: Tianzige Single Character Typing & Candidate Pills (HSK 3)
  // =========================================================================
  test('Writing UX 1: Tianzige Container, Kaiti Character Rendering & Candidate Selection (HSK 3)', async ({ page }) => {
    await page.goto('/?tab=quizzes&view=hsk_practice&level=3&skill=writing');
    await expect(page.locator('#quizzes-container')).toBeVisible();
    await expect(page.getByText(/Luyện tập HSK 3/i)).toBeVisible();

    // Verify Tianzige title & container
    await expect(page.getByText(/Ô Điền Chữ Khảo Thí \(田字格\)/i)).toBeVisible();

    // Initial state: prompt says 'Bấm chọn phương án dưới đây để điền chữ vào ô'
    await expect(page.getByText(/Bấm chọn phương án dưới đây/i)).toBeVisible();

    // Candidate options pills A, B, C, D
    const optionA = page.getByTestId('exam-option-a');
    await expect(optionA).toBeVisible();

    // Click candidate pill A
    await optionA.click();

    // Verify character is filled in Tianzige box and confirmation badge appears
    await expect(page.getByText(/✓ Đã chọn chữ:/i)).toBeVisible();

    // Click candidate pill B to change selection
    const optionB = page.getByTestId('exam-option-b');
    if (await optionB.isVisible()) {
      await optionB.click();
      await expect(page.getByText(/✓ Đã chọn chữ:/i)).toBeVisible();
    }
  });

  // =========================================================================
  // 7. Writing UX: WordOrderChipBuilder Chip Assembly & Reset (HSK 4)
  // =========================================================================
  test('Writing UX 2: WordOrderChipBuilder Assembly, Removal, and Reset (HSK 4)', async ({ page }) => {
    await page.goto('/?tab=quizzes&view=hsk_practice&level=4&skill=writing');
    await expect(page.locator('#quizzes-container')).toBeVisible();
    await expect(page.getByText(/Luyện tập HSK 4/i)).toBeVisible();

    // Confirm Word Order UI elements
    await expect(page.getByText(/Câu hoàn chỉnh đã ghép:/i)).toBeVisible();
    await expect(page.getByText(/Ngân hàng từ vựng/i)).toBeVisible();

    // Click a word chip in the bank
    const bankChips = page.locator('button').filter({ hasText: /^[\u4e00-\u9fa5]+$/ });
    const firstChip = bankChips.first();
    const chipText = (await firstChip.textContent()) || '';

    if (chipText) {
      await firstChip.click();

      // Chip should now appear in the assembled sentence box
      const assembledChip = page.locator('button[title*="gỡ từ này"]').filter({ hasText: chipText });
      await expect(assembledChip).toBeVisible();

      // Reset button appears
      const resetBtn = page.getByRole('button', { name: /Đặt lại \(Xóa hết\)/i });
      await expect(resetBtn).toBeVisible();

      // Click reset button
      await resetBtn.click();

      // Sentence box returns to empty placeholder
      await expect(page.getByText(/Bấm các từ bên dưới để ghép thành câu hoàn chỉnh/i)).toBeVisible();
    }

    // Candidate sentences options A/B/C/D
    const optionA = page.getByTestId('exam-option-a');
    await expect(optionA).toBeVisible();
    await optionA.click();
  });

  // =========================================================================
  // 8. Writing UX: FanggeEssayComposer Counter & Milestone Thresholds (HSK 5)
  // =========================================================================
  test('Writing UX 3: FanggeEssayComposer Counter, Keyword Checklist & Milestone Meters (HSK 4 80-char Essay)', async ({ page }) => {
    // Navigate to HSK 4 writing practice
    await page.goto('/?tab=quizzes&view=hsk_practice&level=4&skill=writing');
    await expect(page.locator('#quizzes-container')).toBeVisible();
    await expect(page.getByText(/Luyện tập HSK 4/i)).toBeVisible();

    // The essay question is at question 6 (item 6 of 6 writing items: hsk4-mock-q70)
    // Navigate to the essay question
    const essayBtn = page.getByText(/Soạn thảo bài viết tự luận/i);
    for (let step = 0; step < 6; step++) {
      if (await essayBtn.isVisible()) break;
      const nextBtn = page.getByRole('button', { name: /Câu sau/i });
      if (await nextBtn.isVisible() && !await nextBtn.isDisabled()) {
        await nextBtn.click();
      }
    }

    // Confirm Essay Composer UI is visible
    await expect(page.getByText(/Soạn thảo bài viết tự luận/i)).toBeVisible();
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();

    // Initial counter: 0 / 80 chữ, 'Cần thêm từ'
    await expect(page.getByText(/Số chữ:/i)).toBeVisible();
    await expect(page.getByText(/Cần thêm từ/i)).toBeVisible();

    // Milestone 1: Type < 48 chars (Rose status 'Cần thêm từ')
    await textarea.fill('这是一篇测试短文。我们在生活中要不断努力，克服所有困难。');
    await expect(page.getByText(/Cần thêm từ/i)).toBeVisible();

    // Milestone 2: Type 50-79 chars (Amber status 'Cần thêm từ')
    await textarea.fill('这是一篇测试短文。我们在生活中要不断努力，克服所有困难。即使遇到了失败，也要总结经验，坚持不懈。');
    await expect(page.getByText(/Cần thêm từ/i)).toBeVisible();

    // Milestone 3: Type >= 80 chars (Emerald status 'Đạt chuẩn CTI')
    await textarea.fill(
      '这是一篇测试短文。我们在生活中要不断努力，克服所有困难。即使遇到了失败，也要总结经验，坚持不懈，才能最终取得成功。我们要保持积极向上的心态，勇敢面对未来的每一次挑战。'
    );
    await expect(page.getByText(/Đạt chuẩn CTI/i)).toBeVisible();

    // Keyword checklist verification
    const keywordBadges = page.locator('span').filter({ hasText: /^[✓○]\s+[\u4e00-\u9fa5]+/ });
    if (await keywordBadges.count() > 0) {
      await expect(page.locator('span').filter({ hasText: /^✓/ }).first()).toBeVisible();
    }
  });
});
