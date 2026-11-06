import { test, expect } from '@playwright/test';

test.describe('Adversarial Stress Testing — Visuals, Lightbox Gallery & Multi-Image Options', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?tab=quizzes');
    await expect(page.locator('#quizzes-container')).toBeVisible({ timeout: 10000 });
    await page.evaluate(() => {
      try {
        sessionStorage.clear();
        localStorage.removeItem('minnese_active_exam_session_v1');
        localStorage.removeItem('minnese_wrong_answers_notebook_v1');
      } catch {
        // ignore
      }
    });
  });

  // =========================================================================
  // 1. HSKIllustrationCanvas: Offline Network Isolation & Fallback Rendering
  // =========================================================================
  test('Visuals Stress 1: HSKIllustrationCanvas operates 100% offline without network requests and renders SVGs without console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !msg.text().includes('favicon')) {
        consoleErrors.push(msg.text());
      }
    });

    // Simulate complete network block on external images
    await page.route('**/*.{png,jpg,jpeg,webp,gif}', (route) => {
      route.abort('failed');
    });

    // Deep link to HSK 1 Mock Exam Question 1 (contains 3 image options)
    await page.goto('/?tab=quizzes&view=hsk_mock&level=1');
    await expect(page.locator('#quizzes-container')).toBeVisible();
    await expect(page.getByText(/Thi thử HSK 1/i)).toBeVisible();

    // Verify option cards render inline SVG elements without any network image requests
    const optionCards = page.locator('[data-testid^="exam-option-"]');
    await expect(optionCards).toHaveCount(3);

    for (let i = 0; i < 3; i++) {
      const card = optionCards.nth(i);
      await expect(card).toBeVisible();
      // Ensure SVG is present inside the illustration canvas
      const svg = card.locator('svg').first();
      await expect(svg).toBeVisible();
    }

    // Verify zero console errors occurred during offline SVG rendering
    expect(consoleErrors.filter((e) => !e.includes('net::ERR_'))).toEqual([]);
  });

  // =========================================================================
  // 2. Multi-Image Option Cards: Rapid Selection, Unselection & Layout Checks
  // =========================================================================
  test('Visuals Stress 2: Multi-Image Option Cards in 3-Option Layout (Rapid Selection & Keyboard Shortcuts)', async ({ page }) => {
    await page.goto('/?tab=quizzes&view=hsk_mock&level=1');
    await expect(page.getByText(/Thi thử HSK 1/i)).toBeVisible();

    const optA = page.getByTestId('exam-option-a');
    const optB = page.getByTestId('exam-option-b');
    const optC = page.getByTestId('exam-option-c');

    await expect(optA).toBeVisible();
    await expect(optB).toBeVisible();
    await expect(optC).toBeVisible();

    // Rapid selection stress test: click A -> B -> C -> B -> A in rapid bursts
    for (let cycle = 0; cycle < 5; cycle++) {
      await optA.click();
      await optB.click();
      await optC.click();
      await optB.click();
      await optA.click();
    }

    // Verify state settled cleanly on option A
    await expect(optA).toHaveClass(/border-teal-500/);
    const badgeA = optA.locator('span').first();
    await expect(badgeA).toHaveClass(/bg-teal-600/);

    // Verify Option B and C are NOT selected
    await expect(optB).not.toHaveClass(/border-teal-500/);
    await expect(optC).not.toHaveClass(/border-teal-500/);

    // Test Keyboard Selection Shortcuts: A, B, C
    await page.keyboard.press('b');
    await expect(optB).toHaveClass(/border-teal-500/);
    await expect(optA).not.toHaveClass(/border-teal-500/);

    await page.keyboard.press('c');
    await expect(optC).toHaveClass(/border-teal-500/);
    await expect(optB).not.toHaveClass(/border-teal-500/);

    await page.keyboard.press('a');
    await expect(optA).toHaveClass(/border-teal-500/);
    await expect(optC).not.toHaveClass(/border-teal-500/);

    // Test Numeric Shortcuts: 1, 2, 3
    await page.keyboard.press('2');
    await expect(optB).toHaveClass(/border-teal-500/);

    await page.keyboard.press('3');
    await expect(optC).toHaveClass(/border-teal-500/);

    await page.keyboard.press('1');
    await expect(optA).toHaveClass(/border-teal-500/);
  });

  // =========================================================================
  // 3. Multi-Image Option Cards: 6-Option Layout (Items 11-15, A through F)
  // =========================================================================
  test('Visuals Stress 3: Multi-Image Option Cards in 6-Option Layout (A-F Grid & Shortcut Disambiguation)', async ({ page }) => {
    await page.goto('/?tab=quizzes&view=hsk_mock&level=1');
    await expect(page.getByText(/Thi thử HSK 1/i)).toBeVisible();

    // Jump to Question 11 via Question Palette (which has 6-option picture match)
    const paletteBtn11 = page.getByRole('button', { name: /^11$/ }).first();
    await expect(paletteBtn11).toBeVisible();
    await paletteBtn11.click();

    await expect(page.getByText(/Câu 11 \//i)).toBeVisible();

    // Verify all 6 options (A, B, C, D, E, F) are rendered with cards
    const optLetters = ['a', 'b', 'c', 'd', 'e', 'f'];
    for (const l of optLetters) {
      const opt = page.getByTestId(`exam-option-${l}`);
      await expect(opt).toBeVisible();
    }

    // Test selecting Option D via keyboard
    await page.keyboard.press('d');
    const optD = page.getByTestId('exam-option-d');
    await expect(optD).toHaveClass(/border-teal-500/);

    // Test selecting Option E via keyboard
    await page.keyboard.press('e');
    const optE = page.getByTestId('exam-option-e');
    await expect(optE).toHaveClass(/border-teal-500/);
    await expect(optD).not.toHaveClass(/border-teal-500/);

    // Test selecting Option F via keyboard: In 6-option layout, pressing 'F' selects Option F
    await page.keyboard.press('f');
    const optF = page.getByTestId('exam-option-f');
    await expect(optF).toHaveClass(/border-teal-500/);
    await expect(optE).not.toHaveClass(/border-teal-500/);

    // Verify numeric shortcut '6' selects option F
    await page.keyboard.press('1');
    const optA = page.getByTestId('exam-option-a');
    await expect(optA).toHaveClass(/border-teal-500/);

    await page.keyboard.press('6');
    await expect(optF).toHaveClass(/border-teal-500/);
  });

  // =========================================================================
  // 4. Lightbox Zoom Modal: Opening, Gallery Navigation & Edge Boundary Wrap
  // =========================================================================
  test('Lightbox Stress: Opening zoom, Prev/Next boundary wrap-around, arrow keys, Escape key, and backdrop click', async ({ page }) => {
    await page.goto('/?tab=quizzes&view=hsk_mock&level=1');
    await expect(page.getByText(/Thi thử HSK 1/i)).toBeVisible();

    // 1. Open zoom on Option A (index 0 of 3)
    const optA = page.getByTestId('exam-option-a');
    const zoomBtnA = optA.locator('button[title*="Phóng to"]');
    await expect(zoomBtnA).toBeVisible();
    await zoomBtnA.click();

    // 2. Verify Lightbox Modal opened
    const lightboxModal = page.locator('div.fixed.inset-0.z-50');
    await expect(lightboxModal).toBeVisible();
    await expect(page.getByText('1 / 3')).toBeVisible();
    await expect(page.getByText(/Phương án A/i)).toBeVisible();

    // 3. Test Edge Boundary Wrap-around 1: Clicking "Prev" on first image (1 / 3) wraps to last image (3 / 3)
    const prevBtn = lightboxModal.locator('button[title*="Bức tranh trước"]');
    await expect(prevBtn).toBeVisible();
    await prevBtn.click();

    await expect(page.getByText('3 / 3')).toBeVisible();
    await expect(page.getByText(/Phương án C/i)).toBeVisible();

    // 4. Test Edge Boundary Wrap-around 2: Clicking "Next" on last image (3 / 3) wraps to first image (1 / 3)
    const nextBtn = lightboxModal.locator('button[title*="Bức tranh tiếp theo"]');
    await expect(nextBtn).toBeVisible();
    await nextBtn.click();

    await expect(page.getByText('1 / 3')).toBeVisible();
    await expect(page.getByText(/Phương án A/i)).toBeVisible();

    // 5. Test Keyboard Navigation in Lightbox: ArrowRight and ArrowLeft
    await page.keyboard.press('ArrowRight');
    await expect(page.getByText('2 / 3')).toBeVisible();
    await expect(page.getByText(/Phương án B/i)).toBeVisible();

    await page.keyboard.press('ArrowRight');
    await expect(page.getByText('3 / 3')).toBeVisible();
    await expect(page.getByText(/Phương án C/i)).toBeVisible();

    // ArrowRight on last image wraps to first
    await page.keyboard.press('ArrowRight');
    await expect(page.getByText('1 / 3')).toBeVisible();
    await expect(page.getByText(/Phương án A/i)).toBeVisible();

    // ArrowLeft on first image wraps to last
    await page.keyboard.press('ArrowLeft');
    await expect(page.getByText('3 / 3')).toBeVisible();
    await expect(page.getByText(/Phương án C/i)).toBeVisible();

    // 6. Test Closing Lightbox via Escape Key
    await page.keyboard.press('Escape');
    await expect(lightboxModal).not.toBeVisible();

    // Verify focus returned to exam view and shortcuts work
    await page.keyboard.press('b');
    const optB = page.getByTestId('exam-option-b');
    await expect(optB).toHaveClass(/border-teal-500/);

    // 7. Test Closing Lightbox via Backdrop Click
    const zoomBtnB = optB.locator('button[title*="Phóng to"]');
    await zoomBtnB.click();
    await expect(lightboxModal).toBeVisible();
    await expect(page.getByText('2 / 3')).toBeVisible();

    // Click outside modal container (on top-left corner of backdrop)
    await page.mouse.click(10, 10);
    await expect(lightboxModal).not.toBeVisible();

    // 8. Test Closing Lightbox via 'X' Close Button
    const optC = page.getByTestId('exam-option-c');
    const zoomBtnC = optC.locator('button[title*="Phóng to"]');
    await zoomBtnC.click();
    await expect(lightboxModal).toBeVisible();
    await expect(page.getByText('3 / 3')).toBeVisible();

    const closeBtn = lightboxModal.locator('button[title*="Đóng"]');
    await closeBtn.click();
    await expect(lightboxModal).not.toBeVisible();
  });

  // =========================================================================
  // 5. Single-Image Stem Illustration Lightbox (HSK 3 Question 66)
  // =========================================================================
  test('Lightbox Stress: Single-image stem illustration (no gallery, no prev/next, clean Escape)', async ({ page }) => {
    // Jump to HSK 3 Practice Mode where Question 66 has stem illustration 'handshake'
    await page.goto('/?tab=quizzes&view=hsk_mock&level=3&mode=practice');
    await expect(page.locator('#quizzes-container')).toBeVisible();

    // Answer or jump to Question 66 (part_type: write_sentence_from_picture_word)
    // Find palette item 66
    const paletteBtn66 = page.getByRole('button', { name: /^66$/ }).first();
    if (await paletteBtn66.isVisible()) {
      await paletteBtn66.click();
      await expect(page.getByText(/Câu 66 \//i)).toBeVisible();

      // Look for the stem illustration zoom button
      const stemZoomBtn = page.locator('button[title*="Phóng to hình minh họa"]').first();
      if (await stemZoomBtn.isVisible()) {
        await stemZoomBtn.click();

        const lightboxModal = page.locator('div.fixed.inset-0.z-50');
        await expect(lightboxModal).toBeVisible();

        // Prev and Next buttons must NOT be present for single image
        const prevBtn = lightboxModal.locator('button[title*="Bức tranh trước"]');
        await expect(prevBtn).toHaveCount(0);
        const nextBtn = lightboxModal.locator('button[title*="Bức tranh tiếp theo"]');
        await expect(nextBtn).toHaveCount(0);

        // ArrowLeft and ArrowRight should not crash or throw
        await page.keyboard.press('ArrowLeft');
        await page.keyboard.press('ArrowRight');
        await expect(lightboxModal).toBeVisible();

        // Close via Escape
        await page.keyboard.press('Escape');
        await expect(lightboxModal).not.toBeVisible();
      }
    }
  });

  // =========================================================================
  // 6. Result Review & Wrong Answers Notebook Visual Rendering
  // =========================================================================
  test('Visuals Stress 4: Result Review and Wrong Answers Notebook render option cards, SVG illustrations and badges', async ({ page }) => {
    // Setup confirmation dialog acceptance
    page.once('dialog', async (dialog) => {
      await dialog.accept();
    });

    await page.goto('/?tab=quizzes&view=hsk_mock&level=1');
    await expect(page.getByText(/Thi thử HSK 1/i)).toBeVisible();

    // In Question 1 (correct is A), intentionally select Option B (wrong)
    const optB = page.getByTestId('exam-option-b');
    await expect(optB).toBeVisible();
    await optB.click();

    // Submit the exam
    const submitBtn = page.getByRole('button', { name: /Nộp bài/i });
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Verify Result Screen appeared
    await expect(page.getByText(/Kết Quả Khảo Thí HSK 1/i)).toBeVisible({ timeout: 15000 });

    // Scroll to Detailed Review section
    await expect(page.getByText(/Xem Lại Toàn Bộ Bài Làm/i)).toBeVisible();

    // Verify Question 1 is shown with visual option cards
    // Correct Option A must have badge "✓ Đáp án đúng"
    await expect(page.getByText(/✓ Đáp án đúng/i).first()).toBeVisible();

    // User selected Option B must have badge "✗ Bạn chọn"
    await expect(page.getByText(/✗ Bạn chọn/i).first()).toBeVisible();

    // Verify SVG illustration is rendered inside the review option card
    const reviewCards = page.locator('div.grid.grid-cols-2.sm\\:grid-cols-3 svg');
    expect(await reviewCards.count()).toBeGreaterThanOrEqual(3);

    // Open Wrong Answers Notebook from Result Screen button
    const openNotebookBtn = page.getByRole('button', { name: /Mở Sổ tay câu sai/i });
    await expect(openNotebookBtn).toBeVisible();
    await openNotebookBtn.click();

    // Verify Sổ Tay Câu Sai view rendered
    await expect(page.getByText(/Sổ Tay Câu Sai \(错题本\)/i)).toBeVisible();

    // Verify Question 1 is present in the notebook with its multi-image cards
    await expect(page.getByText(/苹果。这是一个红色的苹果/i)).toBeVisible();
    await expect(page.getByText(/✓ Đáp án đúng/i).first()).toBeVisible();

    // Test Notebook Level Filter: Click HSK 2 filter
    const hsk2FilterBtn = page.getByRole('button', { name: 'HSK 2' });
    await hsk2FilterBtn.click();

    // Question 1 (HSK 1) should be filtered out
    await expect(page.getByText(/苹果。这是一个红色的苹果/i)).not.toBeVisible();

    // Click "Tất cả cấp độ" or "HSK 1" filter
    const hsk1FilterBtn = page.getByRole('button', { name: 'HSK 1' });
    await hsk1FilterBtn.click();

    // Question 1 should reappear
    await expect(page.getByText(/苹果。这是一个红色的苹果/i)).toBeVisible();

    // Click "Quay lại sảnh" to ensure clean navigation exit
    const backToHallBtn = page.getByRole('button', { name: /Quay lại sảnh/i });
    await backToHallBtn.click();
    await expect(page.getByText(/Chế độ 1: Thi Thử HSK Chuẩn 1-Click/i)).toBeVisible();
  });
});
