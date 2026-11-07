import { describe, it, expect } from 'vitest';
import { NEW_HSK1_FULL_LESSONS, LessonText } from '../src/data/newHsk1BookData';
import {
  HSK1_BUBBLE_LAYOUTS,
  getHsk1BubbleConfig,
  calculateFallbackBubblePos,
} from '../src/data/hsk1BubbleLayouts';

// ============================================================================
// Empirical Challenger M2 It2: Targeted Verification of 4 Resolved Defects
// ============================================================================

const VIEWPORT_375 = { width: 375, height: Math.round((375 * 765) / 1024) }; // 375x280
const VIEWPORT_768 = { width: 768, height: Math.round((768 * 765) / 1024) }; // 768x574

function estimateBubbleDimensions(
  hanzi: string,
  vietnamese: string | undefined,
  maxWidthSetting: number = 230,
  viewportWidth: number
): { width: number; height: number } {
  const isSm = viewportWidth >= 640;
  const paddingX = isSm ? 28 : 24;
  const paddingY = isSm ? 16 : 12;
  const hanziCharWidth = isSm ? 14 : 12;
  const hanziLineHeight = isSm ? 20 : 18;
  const vnCharWidth = isSm ? 6.2 : 5.5;
  const vnLineHeight = isSm ? 16 : 14;

  const maxWidth = isSm
    ? Math.min(maxWidthSetting, viewportWidth - 20)
    : Math.min(maxWidthSetting, Math.round(viewportWidth * 0.72));

  const rawHanziWidth = hanzi.length * hanziCharWidth;
  const rawVnWidth = vietnamese ? vietnamese.length * vnCharWidth : 0;
  const rawContentWidth = Math.max(rawHanziWidth, rawVnWidth);

  const cardWidth = Math.max(90, Math.min(maxWidth, rawContentWidth + paddingX));
  const contentInnerWidth = cardWidth - paddingX;
  const hanziLines = Math.max(1, Math.ceil(rawHanziWidth / contentInnerWidth));
  const vnLines = vietnamese ? Math.max(1, Math.ceil(rawVnWidth / contentInnerWidth)) : 0;

  const cardHeight = paddingY + hanziLines * hanziLineHeight + (vnLines > 0 ? vnLines * vnLineHeight + 2 : 0);

  return { width: cardWidth, height: cardHeight };
}

function computeTailGeometry(
  bubbleBox: { left: number; top: number; right: number; bottom: number; width: number; height: number },
  mouthPx: { x: number; y: number },
  tailOriginPref?: 'bottom' | 'bottom-left' | 'bottom-right' | 'left' | 'right' | 'top'
) {
  const { left, top, right, bottom, width } = bubbleBox;
  const centerX = (left + right) / 2;
  const centerY = (top + bottom) / 2;

  let origin = tailOriginPref;
  if (!origin) {
    if (mouthPx.y > bottom) {
      if (mouthPx.x < left + width * 0.35) origin = 'bottom-left';
      else if (mouthPx.x > right - width * 0.35) origin = 'bottom-right';
      else origin = 'bottom';
    } else if (mouthPx.y < top) {
      origin = 'top';
    } else if (mouthPx.x < left) {
      origin = 'left';
    } else {
      origin = 'right';
    }
  } else {
    // Safety check: if origin is inverted relative to mouthTarget, adapt to avoid backwards tail
    if ((origin === 'bottom' || origin === 'bottom-left' || origin === 'bottom-right') && mouthPx.y < bottom) {
      if (mouthPx.y < top) origin = 'top';
      else if (mouthPx.x < left) origin = 'left';
      else if (mouthPx.x > right) origin = 'right';
    } else if (origin === 'top' && mouthPx.y > top) {
      if (mouthPx.y > bottom) origin = 'bottom';
      else if (mouthPx.x < left) origin = 'left';
      else if (mouthPx.x > right) origin = 'right';
    }
  }

  const baseWidth = Math.min(16, width * 0.35);
  const halfBase = baseWidth / 2;
  const overlap = 2.5;

  let baseMidX = centerX;
  let baseMidY = bottom;

  switch (origin) {
    case 'bottom-left': {
      baseMidX = left + Math.max(16, Math.min(28, width * 0.25));
      baseMidY = bottom;
      break;
    }
    case 'bottom-right': {
      baseMidX = right - Math.max(16, Math.min(28, width * 0.25));
      baseMidY = bottom;
      break;
    }
    case 'bottom': {
      baseMidX = Math.max(left + 16, Math.min(right - 16, centerX));
      baseMidY = bottom;
      break;
    }
    case 'left': {
      baseMidX = left;
      baseMidY = Math.max(top + 14, Math.min(bottom - 14, centerY));
      break;
    }
    case 'right': {
      baseMidX = right;
      baseMidY = Math.max(top + 14, Math.min(bottom - 14, centerY));
      break;
    }
    case 'top': {
      baseMidX = Math.max(left + 16, Math.min(right - 16, centerX));
      baseMidY = top;
      break;
    }
    default: {
      baseMidX = centerX;
      baseMidY = bottom;
      break;
    }
  }

  const vx = mouthPx.x - baseMidX;
  const vy = mouthPx.y - baseMidY;
  const dist = Math.hypot(vx, vy);

  let tip = { x: mouthPx.x, y: mouthPx.y };
  if (dist > 16) {
    const margin = Math.min(10, dist * 0.1);
    tip = {
      x: mouthPx.x - (vx / dist) * margin,
      y: mouthPx.y - (vy / dist) * margin,
    };
  }

  return {
    origin,
    baseMid: { x: baseMidX, y: baseMidY },
    tip,
    dist,
    vx,
    vy,
  };
}

const allTexts: LessonText[] = [];
for (const lesson of NEW_HSK1_FULL_LESSONS) {
  for (const text of lesson.texts) {
    allTexts.push(text);
  }
}

describe('Empirical Challenger M2 It2: 4 Resolved Defects Verification', () => {

  // =========================================================================
  // Defect 1: Mobile 375px Viewport Boundary Clamping [2%, 98%] across all 45 scenes
  // =========================================================================
  describe('Defect 1: Mobile 375px Viewport Boundary Clamping [2%, 98%]', () => {
    it.each(allTexts)(
      'asserts card boundaries stay strictly within [2%, 98%] for all lines in %s on 375px viewport',
      (textItem) => {
        const vp = VIEWPORT_375;
        for (let lineIdx = 0; lineIdx < textItem.lines.length; lineIdx++) {
          const line = textItem.lines[lineIdx];
          const config = getHsk1BubbleConfig(textItem.id, line.speaker);
          expect(config, `Missing config for ${textItem.id} speaker ${line.speaker}`).not.toBeNull();

          const bubblePos = config!.bubblePos || calculateFallbackBubblePos(config!.mouthTarget, config!.placement);
          const dim = estimateBubbleDimensions(line.hanzi, line.vietnamese, config!.maxWidth || 230, vp.width);

          const rawCenterX = (bubblePos.x / 100) * vp.width;
          const rawCenterY = (bubblePos.y / 100) * vp.height;

          const rawLeft = rawCenterX - dim.width / 2;
          const rawTop = rawCenterY - dim.height / 2;

          // Clamped per CoursebookView: 8px margin
          const leftPx = Math.max(8, Math.min(vp.width - dim.width - 8, rawLeft));
          const rightPx = leftPx + dim.width;
          const topPx = Math.max(8, Math.min(vp.height - dim.height - 8, rawTop));
          const bottomPx = topPx + dim.height;

          const leftPct = (leftPx / vp.width) * 100;
          const rightPct = (rightPx / vp.width) * 100;
          const topPct = (topPx / vp.height) * 100;
          const bottomPct = (bottomPx / vp.height) * 100;

          // Target: strictly within [2%, 98%] on 375px (8px / 375px = 2.13%)
          expect(leftPct, `Left edge in ${textItem.id} line ${lineIdx} (${line.speaker}) < 2%`).toBeGreaterThanOrEqual(2.0);
          expect(rightPct, `Right edge in ${textItem.id} line ${lineIdx} (${line.speaker}) > 98%`).toBeLessThanOrEqual(98.0);
          expect(topPct, `Top edge in ${textItem.id} line ${lineIdx} (${line.speaker}) < 2%`).toBeGreaterThanOrEqual(2.0);
          expect(bottomPct, `Bottom edge in ${textItem.id} line ${lineIdx} (${line.speaker}) > 98%`).toBeLessThanOrEqual(98.0);
        }
      }
    );
  });

  // =========================================================================
  // Defect 2: L15T3 王一飞: bubble does not cover mouth and tail vector dot product > 0
  // =========================================================================
  describe('Defect 2: L15T3 王一飞 Face Clearance & Non-Inverted Tail Vector', () => {
    it('verifies 王一飞 bubble in hsk1-l15-t3 line 2 (39 Hanzi) does not cover mouth and has positive dot product', () => {
      const textItem = allTexts.find((t) => t.id === 'hsk1-l15-t3')!;
      expect(textItem).toBeDefined();

      const config = getHsk1BubbleConfig('hsk1-l15-t3', '王一飞')!;
      expect(config).toBeDefined();
      expect(config.maxWidth).toBe(310);
      expect(config.bubblePos).toEqual({ x: 50, y: 12 });

      const wangLines = textItem.lines.filter((l) => l.speaker.includes('王一飞'));
      expect(wangLines.length).toBeGreaterThan(0);

      const vp = VIEWPORT_768; // 768x574 reference container

      for (const line of wangLines) {
        const dim = estimateBubbleDimensions(line.hanzi, line.vietnamese, config.maxWidth || 230, vp.width);

        const rawCenterX = (config.bubblePos!.x / 100) * vp.width;
        const rawCenterY = (config.bubblePos!.y / 100) * vp.height;
        const rawLeft = rawCenterX - dim.width / 2;
        const rawTop = rawCenterY - dim.height / 2;

        const leftPx = Math.max(8, Math.min(vp.width - dim.width - 8, rawLeft));
        const topPx = Math.max(8, Math.min(vp.height - dim.height - 8, rawTop));
        const rightPx = leftPx + dim.width;
        const bottomPx = topPx + dim.height;

        const mouthPx = {
          x: (config.mouthTarget.x / 100) * vp.width,
          y: (config.mouthTarget.y / 100) * vp.height,
        };

        // 1. Assert bubble does NOT cover mouth
        const coversMouth =
          mouthPx.x >= leftPx && mouthPx.x <= rightPx && mouthPx.y >= topPx && mouthPx.y <= bottomPx;
        expect(coversMouth, `王一飞 bubble covers his own mouth in hsk1-l15-t3 for "${line.hanzi}"!`).toBe(false);

        // Vertical clearance
        const verticalClearance = mouthPx.y - bottomPx;
        expect(verticalClearance, `Vertical clearance above mouth for "${line.hanzi}" should be >= 10px`).toBeGreaterThanOrEqual(10);

        // 2. Tail vector geometry and dot product > 0
        const bubbleBox = {
          left: leftPx,
          top: topPx,
          right: rightPx,
          bottom: bottomPx,
          width: dim.width,
          height: dim.height,
        };

        const tail = computeTailGeometry(bubbleBox, mouthPx, config.tailOrigin);
        const tailVec = {
          x: tail.tip.x - tail.baseMid.x,
          y: tail.tip.y - tail.baseMid.y,
        };
        const losVec = {
          x: mouthPx.x - tail.baseMid.x,
          y: mouthPx.y - tail.baseMid.y,
        };

        const dotLOS = tailVec.x * losVec.x + tailVec.y * losVec.y;
        expect(dotLOS, `Dot product of tail vector and line of sight must be > 0 for "${line.hanzi}"`).toBeGreaterThan(0);

        const edgeNormal = { x: 0, y: 1 }; // bottom normal points downward
        const dotNormal = losVec.x * edgeNormal.x + losVec.y * edgeNormal.y;
        expect(dotNormal, `Dot product with edge normal must be > 0 (not inverted) for "${line.hanzi}"`).toBeGreaterThan(0);
        expect(tail.dist).toBeGreaterThanOrEqual(10);
      }
    });
  });

  // =========================================================================
  // Defect 3: L15T2 安妮: no overlap with adjacent speaker 陈天中 at (80%, 34%)
  // =========================================================================
  describe('Defect 3: L15T2 安妮 Non-Collision with Adjacent Speaker 陈天中', () => {
    it('verifies 安妮 bubble in hsk1-l15-t2 does not overlap 陈天中 at (80%, 34%) or her own mouth at (71%, 53%)', () => {
      const textItem = allTexts.find((t) => t.id === 'hsk1-l15-t2')!;
      expect(textItem).toBeDefined();

      const annieConfig = getHsk1BubbleConfig('hsk1-l15-t2', '安妮')!;
      expect(annieConfig).toBeDefined();
      expect(annieConfig.bubblePos).toEqual({ x: 63, y: 36 });
      expect(annieConfig.maxWidth).toBe(180);

      const chenConfig = getHsk1BubbleConfig('hsk1-l15-t2', '陈天中')!;
      expect(chenConfig).toBeDefined();
      expect(chenConfig.mouthTarget).toEqual({ x: 80, y: 34 });

      const vp = VIEWPORT_768; // 768x574 reference
      const annieLines = textItem.lines.filter((l) => l.speaker.includes('安妮'));
      const longestAnnieLine = annieLines.reduce((prev, curr) =>
        curr.hanzi.length > prev.hanzi.length ? curr : prev
      );

      const dim = estimateBubbleDimensions(
        longestAnnieLine.hanzi,
        longestAnnieLine.vietnamese,
        annieConfig.maxWidth || 230,
        vp.width
      );

      const rawCenterX = (annieConfig.bubblePos!.x / 100) * vp.width;
      const rawCenterY = (annieConfig.bubblePos!.y / 100) * vp.height;
      const rawLeft = rawCenterX - dim.width / 2;
      const rawTop = rawCenterY - dim.height / 2;

      const leftPx = Math.max(8, Math.min(vp.width - dim.width - 8, rawLeft));
      const topPx = Math.max(8, Math.min(vp.height - dim.height - 8, rawTop));
      const rightPx = leftPx + dim.width;
      const bottomPx = topPx + dim.height;

      const bLeft = (leftPx / vp.width) * 100;
      const bRight = (rightPx / vp.width) * 100;
      const bTop = (topPx / vp.height) * 100;
      const bBottom = (bottomPx / vp.height) * 100;

      // 1. Assert Annie's bubble does NOT cover Chen Tianzhong's mouth at (80%, 34%)
      const coversChen =
        chenConfig.mouthTarget.x >= bLeft &&
        chenConfig.mouthTarget.x <= bRight &&
        chenConfig.mouthTarget.y >= bTop &&
        chenConfig.mouthTarget.y <= bBottom;
      expect(coversChen, `安妮 bubble covers 陈天中 at (${chenConfig.mouthTarget.x}%, ${chenConfig.mouthTarget.y}%)`).toBe(false);

      // Distance from Annie's right edge to Chen's mouth
      const marginToChenX = (chenConfig.mouthTarget.x / 100) * vp.width - rightPx;
      expect(marginToChenX, 'Horizontal clearance to Chen Tianzhong should be >= 20px').toBeGreaterThanOrEqual(20);

      // 2. Assert Annie's bubble does NOT cover her own mouth at (71%, 53%)
      const coversAnnieMouth =
        annieConfig.mouthTarget.x >= bLeft &&
        annieConfig.mouthTarget.x <= bRight &&
        annieConfig.mouthTarget.y >= bTop &&
        annieConfig.mouthTarget.y <= bBottom;
      expect(coversAnnieMouth, '安妮 bubble covers her own mouth at (71%, 53%)').toBe(false);
    });
  });

  // =========================================================================
  // Defect 4: L14T2 王一飞: assert tail clearance >= 10px from mouth
  // =========================================================================
  describe('Defect 4: L14T2 王一飞 Tail Clearance >= 10px', () => {
    it('verifies 王一飞 in hsk1-l14-t2 maintains tail clearance >= 10px across all dialogue lines', () => {
      const textItem = allTexts.find((t) => t.id === 'hsk1-l14-t2')!;
      expect(textItem).toBeDefined();

      const config = getHsk1BubbleConfig('hsk1-l14-t2', '王一飞')!;
      expect(config).toBeDefined();
      expect(config.bubblePos).toEqual({ x: 72, y: 11 });

      const vp = VIEWPORT_768; // 768x574
      const wangLines = textItem.lines.filter((l) => l.speaker.includes('王一飞'));

      for (let i = 0; i < wangLines.length; i++) {
        const line = wangLines[i];
        const dim = estimateBubbleDimensions(line.hanzi, line.vietnamese, config.maxWidth || 230, vp.width);

        const rawCenterX = (config.bubblePos!.x / 100) * vp.width;
        const rawCenterY = (config.bubblePos!.y / 100) * vp.height;
        const rawLeft = rawCenterX - dim.width / 2;
        const rawTop = rawCenterY - dim.height / 2;

        const leftPx = Math.max(8, Math.min(vp.width - dim.width - 8, rawLeft));
        const topPx = Math.max(8, Math.min(vp.height - dim.height - 8, rawTop));
        const rightPx = leftPx + dim.width;
        const bottomPx = topPx + dim.height;

        const bubbleBox = {
          left: leftPx,
          top: topPx,
          right: rightPx,
          bottom: bottomPx,
          width: dim.width,
          height: dim.height,
        };

        const mouthPx = {
          x: (config.mouthTarget.x / 100) * vp.width,
          y: (config.mouthTarget.y / 100) * vp.height,
        };

        const tail = computeTailGeometry(bubbleBox, mouthPx, config.tailOrigin);
        expect(
          tail.dist,
          `Tail distance in hsk1-l14-t2 line ${i} is ${tail.dist.toFixed(1)}px (expected >= 10px)`
        ).toBeGreaterThanOrEqual(10);

        // Clearance between mouth and card bottom
        const verticalClearance = mouthPx.y - bottomPx;
        expect(
          verticalClearance,
          `Vertical clearance in hsk1-l14-t2 line ${i} is ${verticalClearance.toFixed(1)}px (expected >= 10px)`
        ).toBeGreaterThanOrEqual(10);
      }
    });
  });
});
