import { describe, it, expect } from 'vitest';
import { NEW_HSK1_FULL_LESSONS, LessonText } from '../src/data/newHsk1BookData';
import {
  HSK1_BUBBLE_LAYOUTS,
  getHsk1BubbleConfig,
  calculateFallbackBubblePos,
  CharacterBubbleConfig,
} from '../src/data/hsk1BubbleLayouts';

// ============================================================================
// Empirical Challenger Stress Harness for Milestone 2: Speech Bubble & Dynamic Tail
// ============================================================================

// Simulated Viewports per prompt:
// Mobile: 375px width
// Tablet: 768px width
// Desktop: 1280px width (and container max-w-4xl = 896px)
const VIEWPORTS = [
  { name: 'mobile-375', width: 375, height: Math.round((375 * 765) / 1024) }, // ~280px
  { name: 'tablet-768', width: 768, height: Math.round((768 * 765) / 1024) }, // ~574px
  { name: 'desktop-896', width: 896, height: Math.round((896 * 765) / 1024) }, // ~669px (max-w-4xl)
  { name: 'desktop-1280', width: 1280, height: Math.round((1280 * 765) / 1024) }, // ~956px
];

// Helper to estimate text box dimensions based on CoursebookView styling:
// - Chinese font size: 12px (mobile) to 14px (sm/desktop)
// - Vietnamese font size: 10px (mobile) to 11px (sm/desktop)
// - Padding: px-3 py-1.5 (mobile: 24px horiz, 12px vert) / px-3.5 py-2 (desktop: 28px horiz, 16px vert)
// - Min width: 90px
// - Max width: config.maxWidth || 230px
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

  // Content width estimation
  const rawHanziWidth = hanzi.length * hanziCharWidth;
  const rawVnWidth = vietnamese ? vietnamese.length * vnCharWidth : 0;
  const rawContentWidth = Math.max(rawHanziWidth, rawVnWidth);

  // Clamped width
  const cardWidth = Math.max(90, Math.min(maxWidth, rawContentWidth + paddingX));

  // Content height estimation
  const contentInnerWidth = cardWidth - paddingX;
  const hanziLines = Math.max(1, Math.ceil(rawHanziWidth / contentInnerWidth));
  const vnLines = vietnamese ? Math.max(1, Math.ceil(rawVnWidth / contentInnerWidth)) : 0;

  const cardHeight = paddingY + hanziLines * hanziLineHeight + (vnLines > 0 ? vnLines * vnLineHeight + 2 : 0);

  return { width: cardWidth, height: cardHeight };
}

// Compute dynamic directional tail geometry verbatim from CoursebookView.tsx
function computeTailGeometry(
  bubbleBox: { left: number; top: number; right: number; bottom: number; width: number; height: number },
  mouthPx: { x: number; y: number },
  tailOriginPref?: 'bottom' | 'bottom-left' | 'bottom-right' | 'left' | 'right' | 'top'
) {
  const { left, top, right, bottom, width, height } = bubbleBox;
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
  let base1 = { x: 0, y: 0 };
  let base2 = { x: 0, y: 0 };
  let baseEdge1 = { x: 0, y: 0 };
  let baseEdge2 = { x: 0, y: 0 };

  switch (origin) {
    case 'bottom-left': {
      baseMidX = left + Math.max(16, Math.min(28, width * 0.25));
      baseMidY = bottom;
      base1 = { x: baseMidX - halfBase, y: bottom - overlap };
      base2 = { x: baseMidX + halfBase, y: bottom - overlap };
      baseEdge1 = { x: baseMidX - halfBase, y: bottom };
      baseEdge2 = { x: baseMidX + halfBase, y: bottom };
      break;
    }
    case 'bottom-right': {
      baseMidX = right - Math.max(16, Math.min(28, width * 0.25));
      baseMidY = bottom;
      base1 = { x: baseMidX - halfBase, y: bottom - overlap };
      base2 = { x: baseMidX + halfBase, y: bottom - overlap };
      baseEdge1 = { x: baseMidX - halfBase, y: bottom };
      baseEdge2 = { x: baseMidX + halfBase, y: bottom };
      break;
    }
    case 'bottom': {
      baseMidX = Math.max(left + 16, Math.min(right - 16, centerX));
      baseMidY = bottom;
      base1 = { x: baseMidX - halfBase, y: bottom - overlap };
      base2 = { x: baseMidX + halfBase, y: bottom - overlap };
      baseEdge1 = { x: baseMidX - halfBase, y: bottom };
      baseEdge2 = { x: baseMidX + halfBase, y: bottom };
      break;
    }
    case 'left': {
      baseMidX = left;
      baseMidY = Math.max(top + 14, Math.min(bottom - 14, centerY));
      base1 = { x: left + overlap, y: baseMidY - halfBase };
      base2 = { x: left + overlap, y: baseMidY + halfBase };
      baseEdge1 = { x: left, y: baseMidY - halfBase };
      baseEdge2 = { x: left, y: baseMidY + halfBase };
      break;
    }
    case 'right': {
      baseMidX = right;
      baseMidY = Math.max(top + 14, Math.min(bottom - 14, centerY));
      base1 = { x: right - overlap, y: baseMidY - halfBase };
      base2 = { x: right - overlap, y: baseMidY + halfBase };
      baseEdge1 = { x: right, y: baseMidY - halfBase };
      baseEdge2 = { x: right, y: baseMidY + halfBase };
      break;
    }
    case 'top': {
      baseMidX = Math.max(left + 16, Math.min(right - 16, centerX));
      baseMidY = top;
      base1 = { x: baseMidX + halfBase, y: top + overlap };
      base2 = { x: baseMidX - halfBase, y: top + overlap };
      baseEdge1 = { x: baseMidX + halfBase, y: top };
      baseEdge2 = { x: baseMidX - halfBase, y: top };
      break;
    }
    default: {
      baseMidX = centerX;
      baseMidY = bottom;
      base1 = { x: baseMidX - halfBase, y: bottom - overlap };
      base2 = { x: baseMidX + halfBase, y: bottom - overlap };
      baseEdge1 = { x: baseMidX - halfBase, y: bottom };
      baseEdge2 = { x: baseMidX + halfBase, y: bottom };
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
    base1,
    base2,
    baseEdge1,
    baseEdge2,
    tip,
    dist,
    vx,
    vy,
  };
}

// Collect all 45 HSK 1 dialogue texts
const allTexts: LessonText[] = [];
for (const lesson of NEW_HSK1_FULL_LESSONS) {
  for (const text of lesson.texts) {
    allTexts.push(text);
  }
}

describe('Empirical Challenger: Speech Bubble Layout & Tail Geometry Stress Test', () => {

  // =========================================================================
  // Challenge 1: Boundary Clipping Stress Across Viewports (Mobile, Tablet, Desktop)
  // =========================================================================
  describe('Challenge 1: Speech Bubble Boundary Clipping [0, 100]% across Viewports', () => {
    for (const vp of VIEWPORTS) {
      describe(`Viewport ${vp.name} (${vp.width}x${vp.height})`, () => {
        it.each(allTexts)('verifies all lines in %s do not clip outside [0, 100]%', (textItem) => {
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

            // Clamped within container pixel bounds [8px, container - 8px] per CoursebookView
            const leftPx = Math.max(8, Math.min(vp.width - dim.width - 8, rawLeft));
            const rightPx = leftPx + dim.width;
            const topPx = Math.max(8, Math.min(vp.height - dim.height - 8, rawTop));
            const bottomPx = topPx + dim.height;

            const leftPct = (leftPx / vp.width) * 100;
            const rightPct = (rightPx / vp.width) * 100;
            const topPct = (topPx / vp.height) * 100;
            const bottomPct = (bottomPx / vp.height) * 100;

            // Allow subtle margin (e.g. 0% <= left <= right <= 100%)
            // On mobile 375px with min-width 90px (24% of width), bubbles must not bleed outside container edges
            expect(
              leftPct,
              `Bubble left edge clips outside container in ${textItem.id} line ${lineIdx} (${line.speaker}) on ${vp.name}: left is ${leftPct.toFixed(1)}%`
            ).toBeGreaterThanOrEqual(0);

            expect(
              rightPct,
              `Bubble right edge clips outside container in ${textItem.id} line ${lineIdx} (${line.speaker}) on ${vp.name}: right is ${rightPct.toFixed(1)}%`
            ).toBeLessThanOrEqual(100);

            expect(
              topPct,
              `Bubble top edge clips outside container in ${textItem.id} line ${lineIdx} (${line.speaker}) on ${vp.name}: top is ${topPct.toFixed(1)}%`
            ).toBeGreaterThanOrEqual(0);

            expect(
              bottomPct,
              `Bubble bottom edge clips outside container in ${textItem.id} line ${lineIdx} (${line.speaker}) on ${vp.name}: bottom is ${bottomPct.toFixed(1)}%`
            ).toBeLessThanOrEqual(100);
          }
        });
      });
    }
  });

  // =========================================================================
  // Challenge 2: Dynamic Tail Vector Geometry & Dot Product Verification
  // =========================================================================
  describe('Challenge 2: Dynamic Tail Vector Geometry & Dot Product > 0', () => {
    it.each(allTexts)('verifies tail vectors point toward mouthTarget with positive dot product in %s', (textItem) => {
      const vp = VIEWPORTS[1]; // Tablet 768px reference viewport

      for (let lineIdx = 0; lineIdx < textItem.lines.length; lineIdx++) {
        const line = textItem.lines[lineIdx];
        const config = getHsk1BubbleConfig(textItem.id, line.speaker)!;
        const bubblePos = config.bubblePos || calculateFallbackBubblePos(config.mouthTarget, config.placement);
        const dim = estimateBubbleDimensions(line.hanzi, line.vietnamese, config.maxWidth || 230, vp.width);

        const rawCenterX = (bubblePos.x / 100) * vp.width;
        const rawCenterY = (bubblePos.y / 100) * vp.height;

        const rawLeft = rawCenterX - dim.width / 2;
        const rawTop = rawCenterY - dim.height / 2;

        const leftPx = Math.max(8, Math.min(vp.width - dim.width - 8, rawLeft));
        const topPx = Math.max(8, Math.min(vp.height - dim.height - 8, rawTop));

        const bubbleBox = {
          left: leftPx,
          top: topPx,
          right: leftPx + dim.width,
          bottom: topPx + dim.height,
          width: dim.width,
          height: dim.height,
        };

        const mouthPx = {
          x: (config.mouthTarget.x / 100) * vp.width,
          y: (config.mouthTarget.y / 100) * vp.height,
        };

        const tail = computeTailGeometry(bubbleBox, mouthPx, config.tailOrigin);

        // Vector 1: Tail direction from baseMid to tip
        const tailVec = {
          x: tail.tip.x - tail.baseMid.x,
          y: tail.tip.y - tail.baseMid.y,
        };

        // Vector 2: Direct line of sight from baseMid to mouthPx
        const losVec = {
          x: mouthPx.x - tail.baseMid.x,
          y: mouthPx.y - tail.baseMid.y,
        };

        // 1. Dot product with line of sight (tail points toward mouthTarget)
        const dotLOS = tailVec.x * losVec.x + tailVec.y * losVec.y;
        expect(
          dotLOS,
          `Tail vector in ${textItem.id} line ${lineIdx} (${line.speaker}) does not point toward mouthTarget (dot product <= 0)`
        ).toBeGreaterThan(0);

        // 2. Dot product with outward normal of the bubble edge (tail must NOT fold backwards into card)
        let edgeNormal = { x: 0, y: 1 }; // default bottom
        switch (tail.origin) {
          case 'bottom':
          case 'bottom-left':
          case 'bottom-right':
            edgeNormal = { x: 0, y: 1 }; // points downward
            break;
          case 'top':
            edgeNormal = { x: 0, y: -1 }; // points upward
            break;
          case 'left':
            edgeNormal = { x: -1, y: 0 }; // points leftward
            break;
          case 'right':
            edgeNormal = { x: 1, y: 0 }; // points rightward
            break;
        }

        const dotNormal = losVec.x * edgeNormal.x + losVec.y * edgeNormal.y;
        expect(
          dotNormal,
          `Tail origin edge '${tail.origin}' in ${textItem.id} (${line.speaker}) is inverted relative to mouthTarget! losVec=(${losVec.x.toFixed(1)}, ${losVec.y.toFixed(1)}), normal=(${edgeNormal.x}, ${edgeNormal.y}), dot=${dotNormal.toFixed(1)}`
        ).toBeGreaterThan(0);

        // 3. Minimum distance clearance: Tip should never penetrate character mouth/face
        expect(tail.dist).toBeGreaterThanOrEqual(10);
      }
    });
  });

  // =========================================================================
  // Challenge 3: Multi-Speaker Dialogues Non-Collision & Character Face Clearance
  // =========================================================================
  describe('Challenge 3: Multi-Speaker Dialogues Non-Collision (L15T1, L15T2, L4T3, L6T3, L8T1, L14T2, L15T3)', () => {
    const multiSpeakerDialogues = [
      { id: 'hsk1-l4-t3', count: 3 },
      { id: 'hsk1-l6-t3', count: 4 },
      { id: 'hsk1-l8-t1', count: 3 },
      { id: 'hsk1-l14-t2', count: 3 },
      { id: 'hsk1-l15-t1', count: 4 },
      { id: 'hsk1-l15-t2', count: 4 },
      { id: 'hsk1-l15-t3', count: 3 },
    ];

    it.each(multiSpeakerDialogues)(
      'dialogue $id speech bubbles do not overlap speaker faces or character bodies',
      ({ id }) => {
        const sceneLayout = HSK1_BUBBLE_LAYOUTS[id];
        expect(sceneLayout).toBeDefined();

        const speakers = Object.keys(sceneLayout);
        const vp = VIEWPORTS[1]; // 768px viewport

        for (const sp of speakers) {
          const cfg = sceneLayout[sp];
          const bubblePos = cfg.bubblePos || calculateFallbackBubblePos(cfg.mouthTarget, cfg.placement);

          // Find the longest text spoken by this speaker in this scene to test worst-case bubble size
          const textItem = allTexts.find((t) => t.id === id)!;
          const speakerLines = textItem.lines.filter((l) => l.speaker.includes(sp) || sp.includes(l.speaker));
          const longestLine = speakerLines.reduce((prev, curr) =>
            curr.hanzi.length > prev.hanzi.length ? curr : prev, speakerLines[0] || { hanzi: '你好！', vietnamese: '' }
          );

          const dim = estimateBubbleDimensions(longestLine.hanzi, longestLine.vietnamese, cfg.maxWidth || 230, vp.width);
          const rawCenterX = (bubblePos.x / 100) * vp.width;
          const rawCenterY = (bubblePos.y / 100) * vp.height;
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

          // 1. Assert bubble does NOT cover the speaker's own mouth/face
          // Mouth target is at (cfg.mouthTarget.x, cfg.mouthTarget.y). Face zone is roughly ±4% X and ±5% Y.
          const mouth = cfg.mouthTarget;
          const coversOwnMouth =
            mouth.x >= bLeft && mouth.x <= bRight && mouth.y >= bTop && mouth.y <= bBottom;

          expect(
            coversOwnMouth,
            `Speech bubble for ${sp} in ${id} overlaps speaker's own mouth/face at (${mouth.x}%, ${mouth.y}%)! Bubble box: [${bLeft.toFixed(1)}%, ${bRight.toFixed(1)}%] x [${bTop.toFixed(1)}%, ${bBottom.toFixed(1)}%]`
          ).toBe(false);

          // 2. Assert bubble does NOT cover other characters' mouth targets
          for (const otherSp of speakers) {
            if (otherSp === sp) continue;
            const otherMouth = sceneLayout[otherSp].mouthTarget;
            const coversOtherMouth =
              otherMouth.x >= bLeft && otherMouth.x <= bRight && otherMouth.y >= bTop && otherMouth.y <= bBottom;

            expect(
              coversOtherMouth,
              `Speech bubble for ${sp} in ${id} overlaps other speaker ${otherSp}'s mouth at (${otherMouth.x}%, ${otherMouth.y}%)!`
            ).toBe(false);
          }
        }
      }
    );

    it('verifies all 45 scenes have pairwise clear-space separation between speaker bubble centers', () => {
      for (const textItem of allTexts) {
        const sceneLayout = HSK1_BUBBLE_LAYOUTS[textItem.id];
        if (!sceneLayout) continue;
        const speakers = Object.keys(sceneLayout);
        if (speakers.length <= 1) continue;

        for (let i = 0; i < speakers.length; i++) {
          for (let j = i + 1; j < speakers.length; j++) {
            const spA = speakers[i];
            const spB = speakers[j];
            const cfgA = sceneLayout[spA];
            const cfgB = sceneLayout[spB];

            const posA = cfgA.bubblePos || calculateFallbackBubblePos(cfgA.mouthTarget, cfgA.placement);
            const posB = cfgB.bubblePos || calculateFallbackBubblePos(cfgB.mouthTarget, cfgB.placement);

            const dist = Math.hypot(posA.x - posB.x, posA.y - posB.y);
            expect(
              dist,
              `Bubble centers for ${spA} and ${spB} in ${textItem.id} are too close (distance: ${dist.toFixed(1)}%)`
            ).toBeGreaterThanOrEqual(10);
          }
        }
      }
    });
  });

  // =========================================================================
  // Challenge 4: Edge Case Stress (Single Character Words, Long Punctuation, Aspect Ratios)
  // =========================================================================
  describe('Challenge 4: Edge Case Invariants & Boundary Stress', () => {
    it('verifies min-width clamping prevents speech bubble collapse on single character utterance', () => {
      const dim = estimateBubbleDimensions('好', undefined, 230, 375);
      expect(dim.width).toBeGreaterThanOrEqual(90);
      expect(dim.height).toBeGreaterThanOrEqual(30);
    });

    it('verifies max-width constraint caps wide dialogue lines to avoid exceeding maxWidth', () => {
      const longHanzi = '这是我们学校最大的图书馆，里面有很多中文书。';
      const longVn = 'Đây là thư viện lớn nhất của trường chúng tôi, bên trong có rất nhiều sách tiếng Trung.';
      const dim = estimateBubbleDimensions(longHanzi, longVn, 220, 768);
      expect(dim.width).toBeLessThanOrEqual(220);
      expect(dim.height).toBeGreaterThan(40);
    });

    it('verifies all 45 scenes in HSK1_BUBBLE_LAYOUTS use valid placement enum values', () => {
      const validPlacements = [
        'top',
        'top-left',
        'top-right',
        'left',
        'right',
        'bottom-left',
        'bottom-right',
        'custom',
      ];

      for (const [sceneId, scene] of Object.entries(HSK1_BUBBLE_LAYOUTS)) {
        for (const [speaker, cfg] of Object.entries(scene)) {
          expect(validPlacements).toContain(cfg.placement);
          if (cfg.tailOrigin) {
            expect(['bottom', 'bottom-left', 'bottom-right', 'left', 'right', 'top']).toContain(cfg.tailOrigin);
          }
        }
      }
    });
  });
});
