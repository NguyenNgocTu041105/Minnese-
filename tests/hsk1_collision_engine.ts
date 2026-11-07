// Comprehensive Geometric Collision and Verification Engine for HSK 1 Speech Bubbles
// Formulated per spec_miner_bubble_survey_3/handoff.md and ORIGINAL_REQUEST.md

import {
  BoundingBox,
  Point,
  CharacterVisualRecord,
  SceneVisualRegistry,
  SceneMetadata,
  HSK1_CHARACTER_BOUNDING_BOXES,
  HSK1_SCENE_METADATA,
} from './hsk1_bubble_collision_data';
import {
  CharacterBubbleConfig,
  HSK1SceneBubbleMap,
  HSK1_BUBBLE_LAYOUTS,
} from '../src/data/hsk1BubbleLayouts';

export type { CharacterBubbleConfig, HSK1SceneBubbleMap };
export { HSK1_BUBBLE_LAYOUTS };

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface Viewport {
  name: string;
  width: number;
  height: number;
}

export interface CollisionResult {
  isColliding: boolean;
  overlapX: number;
  overlapY: number;
  clearance: number; // Euclidean separation distance in %
}

export interface RayCastResult {
  intersects: boolean;
  t0: number;
  t1: number;
  entryPoint?: Point;
  exitPoint?: Point;
}

export interface BubbleDimensionResult {
  width: number;
  height: number;
  hanziLines: number;
  vnLines: number;
}

export interface ClampedBoxResult {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
  percentBox: BoundingBox;
}

export interface TailGeometryResult {
  origin: 'bottom' | 'bottom-left' | 'bottom-right' | 'left' | 'right' | 'top';
  baseMidX: number;
  baseMidY: number;
  tip: Point;
  tipPercent: Point;
  originPercent: Point;
  wedge: [Point, Point, Point]; // 3 vertices of triangle in pixel space
  wedgePercent: [Point, Point, Point]; // 3 vertices in % space
  unitVector: Point;
  dist: number;
}

export interface LineAuditIssue {
  type:
    | 'OCCLUDES_SPEAKER_FACE'
    | 'OCCLUDES_OTHER_FACE'
    | 'TAIL_CROSSES_OTHER_FACE'
    | 'TAIL_CROSSES_SPEAKER_EYES'
    | 'WEDGE_COLLIDES_FACE'
    | 'CANVAS_BOUNDARY_VIOLATION'
    | 'SPLIT_SCREEN_BOUNDARY_VIOLATION'
    | 'DANGER_OBSTACLE_VIOLATION';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  message: string;
  targetCharacter?: string;
  viewport: string;
  details?: Record<string, any>;
}

export interface LineAuditResult {
  lineIndex: number;
  speaker: string;
  hanzi: string;
  vietnamese: string;
  viewport: Viewport;
  bubblePos: Point;
  mouthTarget: Point;
  clampedBox: ClampedBoxResult;
  tailGeom: TailGeometryResult;
  issues: LineAuditIssue[];
  minFaceClearance: number;
}

export interface DialogueAuditResult {
  dialogueId: string;
  lesson: number;
  textIndex: number;
  title: string;
  speakerCount: number;
  lineCount: number;
  viewportsEvaluated: number;
  faceCollisions: number;
  tailCrossings: number;
  boundaryViolations: number;
  speakerProximityViolations: number;
  minFaceClearance: number;
  status: 'PASS' | 'FAIL';
  criticalIssues: string[];
  lineAudits: LineAuditResult[];
}

// ============================================================================
// Canonical Responsive Viewports (per spec §1.1)
// ============================================================================

export function getResponsiveViewports(aspectRatioClass: '4:3' | '16:9' = '4:3'): Viewport[] {
  const aspectH = aspectRatioClass === '16:9' ? 572 : 765;
  const aspectW = 1024;
  return [
    { name: 'mobile-375', width: 375, height: Math.round((375 * aspectH) / aspectW) },
    { name: 'tablet-768', width: 768, height: Math.round((768 * aspectH) / aspectW) },
    { name: 'desktop-896', width: 896, height: Math.round((896 * aspectH) / aspectW) },
    { name: 'desktop-1280', width: 1280, height: Math.round((1280 * aspectH) / aspectW) },
  ];
}

// ============================================================================
// Core Geometric Algorithms
// ============================================================================

/**
 * Axis-Aligned Bounding Box (AABB) overlap and Euclidean clearance test.
 * Box format: [minX, minY, maxX, maxY] in percentage or pixel coordinates.
 * @param boxA Speech bubble bounding box
 * @param boxB Character face or portrait box
 * @param padding Safety margin to expand around boxB (default 0)
 */
export function aabbCollisionTest(
  boxA: BoundingBox,
  boxB: BoundingBox,
  padding: number = 0
): CollisionResult {
  const bMinX = boxB[0] - padding;
  const bMinY = boxB[1] - padding;
  const bMaxX = boxB[2] + padding;
  const bMaxY = boxB[3] + padding;

  const overlapX = Math.min(boxA[2], bMaxX) - Math.max(boxA[0], bMinX);
  const overlapY = Math.min(boxA[3], bMaxY) - Math.max(boxA[1], bMinY);

  if (overlapX > 0 && overlapY > 0) {
    return {
      isColliding: true,
      overlapX,
      overlapY,
      clearance: 0,
    };
  }

  // Not colliding: calculate Euclidean separation distance
  const dx = Math.max(0, Math.max(boxA[0] - bMaxX, bMinX - boxA[2]));
  const dy = Math.max(0, Math.max(boxA[1] - bMaxY, bMinY - boxA[3]));
  const clearance = Math.hypot(dx, dy);

  return {
    isColliding: false,
    overlapX: 0,
    overlapY: 0,
    clearance,
  };
}

/**
 * Returns Upper Face / Eyes Exclusion Zone (top 60% of face box).
 * Invariant: No tail pointer sightline may cross this zone of ANY character.
 */
export function getUpperFaceBox(faceBox: BoundingBox): BoundingBox {
  const faceHeight = faceBox[3] - faceBox[1];
  return [
    faceBox[0] - 0.5,
    faceBox[1] - 0.5,
    faceBox[2] + 0.5,
    faceBox[1] + 0.6 * faceHeight,
  ];
}

/**
 * Liang-Barsky parametric line clipping algorithm.
 * Tests if segment P(t) = origin + t*(target - origin), t in [0, 1]
 * intersects the given AABB box [minX, minY, maxX, maxY].
 */
export function liangBarskyRayCast(
  origin: Point,
  target: Point,
  box: BoundingBox
): RayCastResult {
  const dx = target.x - origin.x;
  const dy = target.y - origin.y;

  const p = [-dx, dx, -dy, dy];
  const q = [
    origin.x - box[0], // Left
    box[2] - origin.x, // Right
    origin.y - box[1], // Top (min Y)
    box[3] - origin.y, // Bottom (max Y)
  ];

  let t0 = 0.0;
  let t1 = 1.0;

  for (let i = 0; i < 4; i++) {
    const pi = p[i];
    const qi = q[i];

    if (Math.abs(pi) < 1e-9) {
      // Parallel to edge
      if (qi < 0) {
        // Line is parallel and outside box
        return { intersects: false, t0: 0, t1: 1 };
      }
    } else if (pi < 0) {
      // Line directed from outside to inside this boundary
      const r = qi / pi;
      if (r > t1) return { intersects: false, t0: 0, t1: 1 };
      if (r > t0) t0 = r;
    } else {
      // Line directed from inside to outside this boundary
      const r = qi / pi;
      if (r < t0) return { intersects: false, t0: 0, t1: 1 };
      if (r < t1) t1 = r;
    }
  }

  if (t0 <= t1 && t1 >= 0 && t0 <= 1) {
    const entryPoint: Point = {
      x: origin.x + t0 * dx,
      y: origin.y + t0 * dy,
    };
    const exitPoint: Point = {
      x: origin.x + t1 * dx,
      y: origin.y + t1 * dy,
    };
    return {
      intersects: true,
      t0,
      t1,
      entryPoint,
      exitPoint,
    };
  }

  return { intersects: false, t0, t1 };
}

/**
 * Checks if point P is inside triangle ABC using barycentric coordinates.
 */
export function isPointInTriangle(p: Point, a: Point, b: Point, c: Point): boolean {
  const area = 0.5 * (-b.y * c.x + a.y * (-b.x + c.x) + a.x * (b.y - c.y) + b.x * c.y);
  const s = (1 / (2 * area)) * (a.y * c.x - a.x * c.y + (c.y - a.y) * p.x + (a.x - c.x) * p.y);
  const t = (1 / (2 * area)) * (a.x * b.y - a.y * b.x + (a.y - b.y) * p.x + (b.x - a.x) * p.y);
  return s >= 0 && t >= 0 && 1 - s - t >= 0;
}

/**
 * Helper to check 2D line segment intersection.
 */
function lineSegmentsIntersect(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
  function ccw(a: Point, b: Point, c: Point): number {
    return (c.y - a.y) * (b.x - a.x) - (b.y - a.y) * (c.x - a.x);
  }
  return (
    ccw(p1, p3, p4) * ccw(p2, p3, p4) < 0 &&
    ccw(p1, p2, p3) * ccw(p1, p2, p4) < 0
  );
}

/**
 * Separating Axis Theorem (SAT) / polygon intersection test:
 * Verifies that the rendered SVG wedge triangle never intersects character face AABB.
 */
export function triangleAABBIntersection(
  triangle: [Point, Point, Point],
  box: BoundingBox
): boolean {
  const [a, b, c] = triangle;

  // 1. Any triangle vertex inside box?
  for (const pt of [a, b, c]) {
    if (pt.x >= box[0] && pt.x <= box[2] && pt.y >= box[1] && pt.y <= box[3]) {
      return true;
    }
  }

  // 2. Any box vertex inside triangle?
  const boxCorners: Point[] = [
    { x: box[0], y: box[1] },
    { x: box[2], y: box[1] },
    { x: box[2], y: box[3] },
    { x: box[0], y: box[3] },
  ];
  for (const pt of boxCorners) {
    if (isPointInTriangle(pt, a, b, c)) {
      return true;
    }
  }

  // 3. Any triangle edge intersects any box edge?
  const triEdges: [Point, Point][] = [
    [a, b],
    [b, c],
    [c, a],
  ];
  const boxEdges: [Point, Point][] = [
    [boxCorners[0], boxCorners[1]],
    [boxCorners[1], boxCorners[2]],
    [boxCorners[2], boxCorners[3]],
    [boxCorners[3], boxCorners[0]],
  ];

  for (const [tp1, tp2] of triEdges) {
    for (const [bp1, bp2] of boxEdges) {
      if (lineSegmentsIntersect(tp1, tp2, bp1, bp2)) {
        return true;
      }
    }
  }

  return false;
}

// ============================================================================
// Layout & Geometry Simulator (per CoursebookView.tsx)
// ============================================================================

/**
 * Dynamic calculation of speech bubble width and height based on typography,
 * line wrap, and responsive clamping across viewports.
 * Mirrors CoursebookView.tsx:750-790.
 */
export function estimateBubbleDimensions(
  hanzi: string,
  vietnamese: string | undefined,
  maxWidthSetting: number = 230,
  viewportWidth: number
): BubbleDimensionResult {
  const scale = viewportWidth / 896;
  const paddingX = 22 * scale;
  const paddingY = 12 * scale;
  const hanziCharWidth = 13 * scale;
  const hanziLineHeight = 18 * scale;
  const vnCharWidth = 5.4 * scale;
  const vnLineHeight = 13 * scale;

  const maxWidth = maxWidthSetting * scale;
  const minWidth = 82 * scale;

  // Content width estimation
  const rawHanziWidth = hanzi.length * hanziCharWidth;
  const rawVnWidth = vietnamese ? vietnamese.length * vnCharWidth : 0;
  const rawContentWidth = Math.max(rawHanziWidth, rawVnWidth);

  // Clamped width
  const cardWidth = Math.max(minWidth, Math.min(maxWidth, rawContentWidth + paddingX));

  // Content height estimation
  const contentInnerWidth = Math.max(36 * scale, cardWidth - paddingX);
  const hanziLines = Math.max(1, Math.ceil(rawHanziWidth / contentInnerWidth - 1e-6));
  const vnLines = vietnamese ? Math.max(1, Math.ceil(rawVnWidth / contentInnerWidth - 1e-6)) : 0;

  const cardHeight =
    paddingY +
    hanziLines * hanziLineHeight +
    (vnLines > 0 ? vnLines * vnLineHeight + 2 * scale : 0);

  return {
    width: cardWidth,
    height: cardHeight,
    hanziLines,
    vnLines,
  };
}

/**
 * Calculates clamped speech bubble card bounding box in pixel and percentage space.
 * Mirrors CoursebookView.tsx and resolveSmartBubbleBox.
 */
export function resolveBubbleBoundingBox(
  bubblePos: Point,
  dim: { width: number; height: number },
  viewport: Viewport,
  splitScreenDividerX?: number,
  mouthTargetX: number = 50
): ClampedBoxResult {
  const rawCenterXPx = (bubblePos.x / 100) * viewport.width;
  const rawCenterYPx = (bubblePos.y / 100) * viewport.height;

  const rawLeft = rawCenterXPx - dim.width / 2;
  const rawTop = rawCenterYPx - dim.height / 2;

  const scale = viewport.width / 896;
  let minX = 8;
  let maxX = Math.max(8, viewport.width - dim.width - 8);
  if (splitScreenDividerX !== undefined) {
    const divPx = (splitScreenDividerX / 100) * viewport.width;
    if (mouthTargetX < splitScreenDividerX) {
      maxX = Math.max(minX, divPx - dim.width - 6 * scale);
    } else {
      minX = Math.min(maxX, divPx + 6 * scale);
    }
  }

  const left = Math.max(minX, Math.min(maxX, rawLeft));
  const top = Math.max(8, Math.min(viewport.height - dim.height - 8, rawTop));
  const right = left + dim.width;
  const bottom = top + dim.height;

  const percentBox: BoundingBox = [
    (left / viewport.width) * 100,
    (top / viewport.height) * 100,
    (right / viewport.width) * 100,
    (bottom / viewport.height) * 100,
  ];

  return {
    left,
    top,
    right,
    bottom,
    width: dim.width,
    height: dim.height,
    percentBox,
  };
}

/**
 * Computes dynamic directional tail geometry verbatim from CoursebookView.tsx:573-713.
 */
export function computeTailGeometry(
  boxPx: { left: number; top: number; right: number; bottom: number; width: number; height: number },
  mouthPx: Point,
  tailOriginPref: CharacterBubbleConfig['tailOrigin'],
  viewport: Viewport
): TailGeometryResult {
  const { left, top, right, bottom, width, height } = boxPx;
  const centerX = (left + right) / 2;
  const centerY = (top + bottom) / 2;
  const scale = viewport.width / 896;

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

  // Base midpoint along bubble edge
  let baseMidX = centerX;
  let baseMidY = bottom;
  const cornerInset = Math.max(12 * scale, Math.min(24 * scale, width * 0.22));
  const cornerInsetY = Math.max(10 * scale, Math.min(18 * scale, height * 0.25));

  switch (origin) {
    case 'bottom-left':
      baseMidX = left + cornerInset;
      baseMidY = bottom;
      break;
    case 'bottom-right':
      baseMidX = right - cornerInset;
      baseMidY = bottom;
      break;
    case 'top':
      baseMidX = Math.max(left + cornerInset, Math.min(right - cornerInset, centerX * 0.4 + mouthPx.x * 0.6));
      baseMidY = top;
      break;
    case 'left':
      baseMidX = left;
      baseMidY = Math.max(top + cornerInsetY, Math.min(bottom - cornerInsetY, centerY * 0.45 + mouthPx.y * 0.55));
      break;
    case 'right':
      baseMidX = right;
      baseMidY = Math.max(top + cornerInsetY, Math.min(bottom - cornerInsetY, centerY * 0.45 + mouthPx.y * 0.55));
      break;
    case 'bottom':
    default:
      baseMidX = Math.max(left + cornerInset, Math.min(right - cornerInset, centerX * 0.4 + mouthPx.x * 0.6));
      baseMidY = bottom;
      break;
  }

  const vx = mouthPx.x - baseMidX;
  const vy = mouthPx.y - baseMidY;
  const dist = Math.hypot(vx, vy);

  const maxTailLen = 19 * scale;
  const minTailLen = 10 * scale;
  const tailLen = Math.min(maxTailLen, Math.max(minTailLen, dist * 0.22));

  const unitX = dist > 0 ? vx / dist : 0;
  const unitY = dist > 0 ? vy / dist : 1;

  const tip: Point = {
    x: baseMidX + unitX * tailLen,
    y: baseMidY + unitY * tailLen,
  };

  // Base triangle width
  const baseWidth = Math.min(14 * scale, width * 0.3);
  const halfBase = baseWidth / 2;
  let b1: Point;
  let b2: Point;

  if (origin === 'left' || origin === 'right') {
    b1 = { x: baseMidX, y: baseMidY - halfBase };
    b2 = { x: baseMidX, y: baseMidY + halfBase };
  } else {
    b1 = { x: baseMidX - halfBase, y: baseMidY };
    b2 = { x: baseMidX + halfBase, y: baseMidY };
  }

  const originPercent: Point = {
    x: (baseMidX / viewport.width) * 100,
    y: (baseMidY / viewport.height) * 100,
  };

  const tipPercent: Point = {
    x: (tip.x / viewport.width) * 100,
    y: (tip.y / viewport.height) * 100,
  };

  const wedge: [Point, Point, Point] = [b1, b2, tip];
  const wedgePercent: [Point, Point, Point] = [
    { x: (b1.x / viewport.width) * 100, y: (b1.y / viewport.height) * 100 },
    { x: (b2.x / viewport.width) * 100, y: (b2.y / viewport.height) * 100 },
    tipPercent,
  ];

  return {
    origin: origin as any,
    baseMidX,
    baseMidY,
    tip,
    tipPercent,
    originPercent,
    wedge,
    wedgePercent,
    unitVector: { x: unitX, y: unitY },
    dist,
  };
}

// ============================================================================
// Scene & Line Verification Engine
// ============================================================================

export interface VerificationOptions {
  faceSafetyPadding?: number; // % (default 1.5%)
  canvasMarginPx?: number;    // px (default 8px)
  multiSpeakerMinDist?: number; // % (default 10%)
  enableSATWedgeCheck?: boolean; // default true
}

/**
 * Full geometric collision audit for a single dialogue line across a given viewport.
 */
export function auditDialogueLine(
  dialogueId: string,
  lineIndex: number,
  speaker: string,
  hanzi: string,
  vietnamese: string,
  viewport: Viewport,
  config: CharacterBubbleConfig,
  sceneRegistry: Record<string, CharacterVisualRecord>,
  meta: SceneMetadata,
  options: VerificationOptions = {}
): LineAuditResult {
  const facePadding = options.faceSafetyPadding ?? 1.5;
  const canvasMargin = options.canvasMarginPx ?? 8;
  const issues: LineAuditIssue[] = [];

  // Bubble Position
  const bubblePos: Point = config.bubblePos || { x: config.mouthTarget.x, y: Math.max(14, config.mouthTarget.y - 18) };
  const mouthTarget: Point = config.mouthTarget;

  // 1. Estimate Dimensions
  const dims = estimateBubbleDimensions(hanzi, vietnamese, config.maxWidth || 230, viewport.width);

  // 2. Resolve Clamped Bounding Box
  const clamped = resolveBubbleBoundingBox(bubblePos, dims, viewport, meta.splitScreenDividerX, mouthTarget.x);

  // 3. Compute Tail Geometry
  const mouthPx: Point = {
    x: (mouthTarget.x / 100) * viewport.width,
    y: (mouthTarget.y / 100) * viewport.height,
  };
  const tailGeom = computeTailGeometry(clamped, mouthPx, config.tailOrigin, viewport);

  // 4. Test Canvas Boundary Compliance
  if (clamped.left < canvasMargin - 0.5) {
    issues.push({
      type: 'CANVAS_BOUNDARY_VIOLATION',
      severity: 'CRITICAL',
      message: `Bubble left edge (${clamped.left.toFixed(1)}px) violates canvas margin (${canvasMargin}px)`,
      viewport: viewport.name,
      details: { left: clamped.left, margin: canvasMargin },
    });
  }
  if (clamped.top < canvasMargin - 0.5) {
    issues.push({
      type: 'CANVAS_BOUNDARY_VIOLATION',
      severity: 'CRITICAL',
      message: `Bubble top edge (${clamped.top.toFixed(1)}px) violates canvas margin (${canvasMargin}px)`,
      viewport: viewport.name,
      details: { top: clamped.top, margin: canvasMargin },
    });
  }
  if (clamped.right > viewport.width - canvasMargin + 0.5) {
    issues.push({
      type: 'CANVAS_BOUNDARY_VIOLATION',
      severity: 'CRITICAL',
      message: `Bubble right edge (${clamped.right.toFixed(1)}px) violates canvas margin (${viewport.width - canvasMargin}px)`,
      viewport: viewport.name,
      details: { right: clamped.right, maxRight: viewport.width - canvasMargin },
    });
  }
  if (clamped.bottom > viewport.height - canvasMargin + 0.5) {
    issues.push({
      type: 'CANVAS_BOUNDARY_VIOLATION',
      severity: 'CRITICAL',
      message: `Bubble bottom edge (${clamped.bottom.toFixed(1)}px) violates canvas margin (${viewport.height - canvasMargin}px)`,
      viewport: viewport.name,
      details: { bottom: clamped.bottom, maxBottom: viewport.height - canvasMargin },
    });
  }

  // 5. Test Split-Screen Boundary (if applicable)
  if (meta.category === 'split-screen' && meta.splitScreenDividerX) {
    const divider = meta.splitScreenDividerX;
    // If speaker is on left (mouthTarget.x < divider), bubble must not cross divider
    if (mouthTarget.x < divider && clamped.percentBox[2] > divider) {
      issues.push({
        type: 'SPLIT_SCREEN_BOUNDARY_VIOLATION',
        severity: 'CRITICAL',
        message: `Left speaker bubble extends past split-screen divider (right: ${clamped.percentBox[2].toFixed(1)}% > ${divider}%)`,
        viewport: viewport.name,
      });
    } else if (mouthTarget.x > divider && clamped.percentBox[0] < divider) {
      issues.push({
        type: 'SPLIT_SCREEN_BOUNDARY_VIOLATION',
        severity: 'CRITICAL',
        message: `Right speaker bubble extends past split-screen divider (left: ${clamped.percentBox[0].toFixed(1)}% < ${divider}%)`,
        viewport: viewport.name,
      });
    }
  }

  // 6. Test Danger Obstacles (painted thought bubbles, phone screens, etc.)
  if (meta.dangerObstacles) {
    for (const obs of meta.dangerObstacles) {
      const coll = aabbCollisionTest(clamped.percentBox, obs.box, 1.0);
      if (coll.isColliding) {
        issues.push({
          type: 'DANGER_OBSTACLE_VIOLATION',
          severity: 'HIGH',
          message: `Bubble overlaps illustrated obstacle '${obs.name}' [${obs.box.join(', ')}]%`,
          viewport: viewport.name,
          details: { obstacle: obs.name, box: obs.box },
        });
      }
    }
  }

  // 7. Face Collision & Ray-Casting Clearance against ALL scene characters
  let minFaceClearance = Infinity;

  for (const [charName, charVisual] of Object.entries(sceneRegistry)) {
    const isSpeaker = charName === speaker;

    // A. AABB Face Collision (with s_face padding)
    const faceColl = aabbCollisionTest(clamped.percentBox, charVisual.face, facePadding);
    if (!faceColl.isColliding) {
      minFaceClearance = Math.min(minFaceClearance, faceColl.clearance);
    } else {
      minFaceClearance = 0;
      issues.push({
        type: isSpeaker ? 'OCCLUDES_SPEAKER_FACE' : 'OCCLUDES_OTHER_FACE',
        severity: 'CRITICAL',
        message: `Bubble overlaps ${isSpeaker ? 'speaker' : 'character'} ${charName}'s face box [${charVisual.face.join(', ')}]% (overlapX: ${faceColl.overlapX.toFixed(1)}%, overlapY: ${faceColl.overlapY.toFixed(1)}%)`,
        targetCharacter: charName,
        viewport: viewport.name,
        details: { faceBox: charVisual.face, overlapX: faceColl.overlapX, overlapY: faceColl.overlapY },
      });
    }

    // B. Ray-Casting Tail Sightline Crossing (Liang-Barsky)
    if (!isSpeaker) {
      // Third-party face clearance: line from tail origin to mouthTarget must NOT cross third-party face
      const ray = liangBarskyRayCast(tailGeom.originPercent, mouthTarget, charVisual.face);
      if (ray.intersects) {
        issues.push({
          type: 'TAIL_CROSSES_OTHER_FACE',
          severity: 'CRITICAL',
          message: `Tail sightline from (${tailGeom.originPercent.x.toFixed(1)}, ${tailGeom.originPercent.y.toFixed(1)}) to mouth (${mouthTarget.x}, ${mouthTarget.y}) crosses face of ${charName} (t: ${ray.t0.toFixed(2)}..${ray.t1.toFixed(2)})`,
          targetCharacter: charName,
          viewport: viewport.name,
          details: { rayT0: ray.t0, rayT1: ray.t1, faceBox: charVisual.face },
        });
      }
    } else {
      // Speaker upper-face clearance: rendered tail segment from tail origin to tip must NOT cross upper 60% of speaker's face
      const upperFace = getUpperFaceBox(charVisual.face);
      const rayUpper = liangBarskyRayCast(tailGeom.originPercent, tailGeom.tipPercent, upperFace);
      if (rayUpper.intersects) {
        issues.push({
          type: 'TAIL_CROSSES_SPEAKER_EYES',
          severity: 'HIGH',
          message: `Rendered tail segment pierces speaker's own upper face / eyes zone [${upperFace.map((n) => n.toFixed(1)).join(', ')}]% (t: ${rayUpper.t0.toFixed(2)}..${rayUpper.t1.toFixed(2)})`,
          targetCharacter: charName,
          viewport: viewport.name,
          details: { upperFace, rayT0: rayUpper.t0, rayT1: rayUpper.t1 },
        });
      }
    }

    // C. Rendered Tail Wedge Polygon Clearance
    if (options.enableSATWedgeCheck !== false) {
      const wedgeColl = triangleAABBIntersection(tailGeom.wedgePercent, charVisual.face);
      if (wedgeColl) {
        issues.push({
          type: 'WEDGE_COLLIDES_FACE',
          severity: 'CRITICAL',
          message: `Rendered SVG tail wedge polygon overlaps face box of ${charName}`,
          targetCharacter: charName,
          viewport: viewport.name,
        });
      }
    }
  }

  return {
    lineIndex,
    speaker,
    hanzi,
    vietnamese,
    viewport,
    bubblePos,
    mouthTarget,
    clampedBox: clamped,
    tailGeom,
    issues,
    minFaceClearance: minFaceClearance === Infinity ? 100 : minFaceClearance,
  };
}

/**
 * Full geometric verification audit of an entire dialogue across all lines and viewports.
 */
export function auditDialogue(
  dialogueId: string,
  dialogueLines: Array<{ speaker: string; hanzi: string; vietnamese?: string }>,
  sceneLayout: Record<string, CharacterBubbleConfig>,
  options: VerificationOptions = {}
): DialogueAuditResult {
  const meta = HSK1_SCENE_METADATA[dialogueId] || {
    dialogueId,
    lesson: 1,
    textIndex: 1,
    imagePath: `public/textbook_art/${dialogueId}.png`,
    imageDimensions: { width: 1024, height: 765 },
    aspectRatioClass: '4:3',
    category: 'standard',
  };

  const sceneRegistry = HSK1_CHARACTER_BOUNDING_BOXES[dialogueId] || {};
  const viewports = getResponsiveViewports(meta.aspectRatioClass);

  let faceCollisions = 0;
  let tailCrossings = 0;
  let boundaryViolations = 0;
  let speakerProximityViolations = 0;
  let minFaceClearance = Infinity;
  const criticalIssues: string[] = [];
  const lineAudits: LineAuditResult[] = [];

  // 1. Audit each line across all responsive viewports
  for (let lIdx = 0; lIdx < dialogueLines.length; lIdx++) {
    const line = dialogueLines[lIdx];
    const cleanName = line.speaker.replace(/\s*\(.*?\)/, '').split('&')[0].trim();
    const matchedKey =
      Object.keys(sceneLayout).find((k) => k === cleanName) ||
      Object.keys(sceneLayout).find((k) => cleanName.includes(k) || k.includes(cleanName));
    const cfg = (matchedKey ? sceneLayout[matchedKey] : null) || {
      mouthTarget: { x: 50, y: 50 },
      placement: 'top',
    };
    const spk = matchedKey || cleanName;

    for (const vp of viewports) {
      const res = auditDialogueLine(
        dialogueId,
        lIdx,
        spk,
        line.hanzi,
        line.vietnamese || '',
        vp,
        cfg,
        sceneRegistry,
        meta,
        options
      );

      lineAudits.push(res);
      minFaceClearance = Math.min(minFaceClearance, res.minFaceClearance);

      for (const issue of res.issues) {
        if (issue.type === 'OCCLUDES_SPEAKER_FACE' || issue.type === 'OCCLUDES_OTHER_FACE' || issue.type === 'WEDGE_COLLIDES_FACE') {
          faceCollisions++;
          criticalIssues.push(`[L${lIdx} ${spk} @ ${vp.name}] ${issue.message}`);
        } else if (issue.type === 'TAIL_CROSSES_OTHER_FACE' || issue.type === 'TAIL_CROSSES_SPEAKER_EYES') {
          tailCrossings++;
          criticalIssues.push(`[L${lIdx} ${spk} @ ${vp.name}] ${issue.message}`);
        } else if (issue.type === 'CANVAS_BOUNDARY_VIOLATION' || issue.type === 'SPLIT_SCREEN_BOUNDARY_VIOLATION') {
          boundaryViolations++;
          criticalIssues.push(`[L${lIdx} ${spk} @ ${vp.name}] ${issue.message}`);
        } else if (issue.type === 'DANGER_OBSTACLE_VIOLATION') {
          criticalIssues.push(`[L${lIdx} ${spk} @ ${vp.name}] ${issue.message}`);
        }
      }
    }
  }

  // 2. Multi-speaker pairwise separation check
  const speakers = Object.keys(sceneLayout);
  const minDistSetting = options.multiSpeakerMinDist ?? 10.0;
  if (speakers.length >= 2) {
    for (let i = 0; i < speakers.length; i++) {
      for (let j = i + 1; j < speakers.length; j++) {
        const c1 = sceneLayout[speakers[i]];
        const c2 = sceneLayout[speakers[j]];
        const p1 = c1.bubblePos || c1.mouthTarget;
        const p2 = c2.bubblePos || c2.mouthTarget;
        const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
        if (dist < minDistSetting) {
          speakerProximityViolations++;
          criticalIssues.push(
            `Speaker bubble proximity warning: ${speakers[i]} and ${speakers[j]} centers are only ${dist.toFixed(1)}% apart (min: ${minDistSetting}%)`
          );
        }
      }
    }
  }

  const passed = faceCollisions === 0 && tailCrossings === 0 && boundaryViolations === 0;

  return {
    dialogueId,
    lesson: meta.lesson,
    textIndex: meta.textIndex,
    title: `Lesson ${meta.lesson} Text ${meta.textIndex}`,
    speakerCount: speakers.length,
    lineCount: dialogueLines.length,
    viewportsEvaluated: viewports.length,
    faceCollisions,
    tailCrossings,
    boundaryViolations,
    speakerProximityViolations,
    minFaceClearance: minFaceClearance === Infinity ? 0 : minFaceClearance,
    status: passed ? 'PASS' : 'FAIL',
    criticalIssues,
    lineAudits,
  };
}
