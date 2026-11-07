// ============================================================================
// HSK 1 Speech Bubble Collision & Face Clearance Independent Verification Test Suite
// Formulated per spec_miner_bubble_survey_3/handoff.md and ORIGINAL_REQUEST.md
// ============================================================================

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  BoundingBox,
  Point,
  HSK1_CHARACTER_BOUNDING_BOXES,
  HSK1_SCENE_METADATA,
  WIDESCREEN_DIALOGUE_IDS,
  SPLIT_SCREEN_DIALOGUE_IDS,
} from './hsk1_bubble_collision_data';
import {
  aabbCollisionTest,
  liangBarskyRayCast,
  getUpperFaceBox,
  triangleAABBIntersection,
  estimateBubbleDimensions,
  resolveBubbleBoundingBox,
  computeTailGeometry,
  auditDialogue,
  getResponsiveViewports,
} from './hsk1_collision_engine';
import {
  runComprehensiveVerification,
} from '../scripts/verify_hsk1_bubble_collision';
import { NEW_HSK1_FULL_LESSONS } from '../src/data/newHsk1BookData';
import { HSK1_BUBBLE_LAYOUTS } from '../src/data/hsk1BubbleLayouts';
import { COURSEBOOK_CHARACTER_ANCHORS } from '../src/data/coursebookCharacterAnchors';

const PROJECT_ROOT = process.cwd();
const HSK2_BOOK_PATH = path.join(PROJECT_ROOT, 'src', 'data', 'newHsk2BookData.ts');
const MANIFEST_PATH = path.join(PROJECT_ROOT, 'src', 'data', 'coursebookAudioManifest.json');
const COURSEBOOK_VIEW_PATH = path.join(PROJECT_ROOT, 'src', 'components', 'Coursebook', 'CoursebookView.tsx');

// ============================================================================
// Suite 1: Mathematical & Geometric Collision Primitives
// ============================================================================

describe('Suite 1: Geometric Primitives & Collision Detection Oracles', () => {
  it('1.1 AABB collision: correctly identifies non-overlapping boxes and calculates Euclidean clearance', () => {
    const bubbleBox: BoundingBox = [10, 10, 30, 25];
    const faceBox: BoundingBox = [40, 35, 52, 50];

    const res = aabbCollisionTest(bubbleBox, faceBox, 1.5);
    expect(res.isColliding).toBe(false);
    expect(res.clearance).toBeGreaterThan(0);
    // dx = 40 - 1.5 - 30 = 8.5, dy = 35 - 1.5 - 25 = 8.5
    // Euclidean clearance = sqrt(8.5^2 + 8.5^2) ~= 12.02
    expect(res.clearance).toBeCloseTo(Math.hypot(8.5, 8.5), 1);
  });

  it('1.2 AABB collision: correctly detects direct overlapping boxes with zero clearance', () => {
    const bubbleBox: BoundingBox = [35, 28, 55, 45];
    const faceBox: BoundingBox = [40, 30, 50, 42];

    const res = aabbCollisionTest(bubbleBox, faceBox, 0);
    expect(res.isColliding).toBe(true);
    expect(res.clearance).toBe(0);
    expect(res.overlapX).toBe(10); // [40, 50]
    expect(res.overlapY).toBe(12); // [30, 42]
  });

  it('1.3 AABB collision: detects encroachment within safety padding s_face = 1.5%', () => {
    const bubbleBox: BoundingBox = [10, 10, 39, 29];
    const faceBox: BoundingBox = [40, 30, 50, 45]; // Distance is 1.0% along both axes

    // Without padding: not colliding
    const resNoPad = aabbCollisionTest(bubbleBox, faceBox, 0);
    expect(resNoPad.isColliding).toBe(false);

    // With 1.5% padding: encroachment detected
    const resWithPad = aabbCollisionTest(bubbleBox, faceBox, 1.5);
    expect(resWithPad.isColliding).toBe(true);
    expect(resWithPad.clearance).toBe(0);
  });

  it('1.4 Liang-Barsky ray casting: accurately detects line intersection through face box', () => {
    const origin: Point = { x: 20, y: 15 };
    const mouthTarget: Point = { x: 60, y: 55 };
    const obstacleFace: BoundingBox = [35, 30, 45, 42]; // Positioned directly on the sightline

    const ray = liangBarskyRayCast(origin, mouthTarget, obstacleFace);
    expect(ray.intersects).toBe(true);
    expect(ray.t0).toBeGreaterThan(0);
    expect(ray.t1).toBeLessThan(1);
    expect(ray.t0).toBeLessThanOrEqual(ray.t1);
    expect(ray.entryPoint).toBeDefined();
    expect(ray.entryPoint!.x).toBeGreaterThanOrEqual(35);
    expect(ray.entryPoint!.x).toBeLessThanOrEqual(45);
  });

  it('1.5 Liang-Barsky ray casting: returns no intersection when sightline completely misses box', () => {
    const origin: Point = { x: 20, y: 15 };
    const mouthTarget: Point = { x: 30, y: 40 };
    const clearFace: BoundingBox = [60, 20, 75, 40]; // On the right side, completely off-path

    const ray = liangBarskyRayCast(origin, mouthTarget, clearFace);
    expect(ray.intersects).toBe(false);
  });

  it('1.6 Upper Face Box oracle: calculates top 60% forehead and eye exclusion zone', () => {
    const faceBox: BoundingBox = [30, 20, 42, 40]; // width 12, height 20
    const upper = getUpperFaceBox(faceBox);

    expect(upper[0]).toBeCloseTo(29.5, 1);
    expect(upper[1]).toBeCloseTo(19.5, 1);
    expect(upper[2]).toBeCloseTo(42.5, 1);
    expect(upper[3]).toBeCloseTo(20 + 0.6 * 20, 1); // 32
  });

  it('1.7 Tail Wedge SAT: detects polygon overlap between SVG tail wedge and face box', () => {
    const wedge: [Point, Point, Point] = [
      { x: 38, y: 28 },
      { x: 42, y: 28 },
      { x: 40, y: 35 },
    ];
    const faceBox: BoundingBox = [39, 32, 48, 45]; // Top of face overlaps tip of wedge

    const collides = triangleAABBIntersection(wedge, faceBox);
    expect(collides).toBe(true);
  });

  it('1.8 Bubble Dimension Simulator: enforces 72% mobile maxWidth clamp vs desktop full maxWidth', () => {
    const longHanzi = '这是我们非常长的一句汉语课文对话测试句子';
    const longVn = 'Đây là một câu thoại tiếng Trung cực kỳ dài để kiểm tra độ co giãn responsive';

    // Mobile viewport (375px)
    const mobileDim = estimateBubbleDimensions(longHanzi, longVn, 230, 375);
    // 375 * 0.72 = 270, capped by maxWidthSetting 230
    expect(mobileDim.width).toBeLessThanOrEqual(Math.round(375 * 0.72));
    expect(mobileDim.width).toBeLessThanOrEqual(230);
    expect(mobileDim.hanziLines).toBeGreaterThanOrEqual(2);

    // Desktop viewport (896px)
    const desktopDim = estimateBubbleDimensions(longHanzi, longVn, 230, 896);
    expect(desktopDim.width).toBeLessThanOrEqual(230);
  });
});

// ============================================================================
// Suite 2: Character Visual Registry Completeness & Boundary Invariants
// ============================================================================

describe('Suite 2: 45-Dialogue Character Face & Portrait Box Registry Integrity', () => {
  it('2.1 Registry covers all 45 HSK 1 dialogues without omission', () => {
    const registryKeys = Object.keys(HSK1_CHARACTER_BOUNDING_BOXES).sort();
    expect(registryKeys.length).toBe(45);

    for (let l = 1; l <= 15; l++) {
      for (let t = 1; t <= 3; t++) {
        const expectedId = `hsk1-l${l}-t${t}`;
        expect(HSK1_CHARACTER_BOUNDING_BOXES[expectedId], `Missing dialogue ${expectedId}`).toBeDefined();
      }
    }
  });

  it('2.2 Registry contains exactly 102 verified character configurations matching dialogue lines', () => {
    let totalChars = 0;
    for (const did of Object.keys(HSK1_CHARACTER_BOUNDING_BOXES)) {
      totalChars += Object.keys(HSK1_CHARACTER_BOUNDING_BOXES[did]).length;
    }
    expect(totalChars).toBe(102);
  });

  it('2.3 All character bounding boxes and mouth coordinates are within valid percentage bounds [0, 100]', () => {
    for (const [did, scene] of Object.entries(HSK1_CHARACTER_BOUNDING_BOXES)) {
      for (const [cname, record] of Object.entries(scene)) {
        const { portrait, face, mouth } = record;

        // Portrait bounds
        expect(portrait[0], `${did} ${cname} portrait minX >= 0`).toBeGreaterThanOrEqual(0);
        expect(portrait[1], `${did} ${cname} portrait minY >= 0`).toBeGreaterThanOrEqual(0);
        expect(portrait[2], `${did} ${cname} portrait maxX <= 100`).toBeLessThanOrEqual(100);
        expect(portrait[3], `${did} ${cname} portrait maxY <= 100`).toBeLessThanOrEqual(100);
        expect(portrait[0], `${did} ${cname} portrait minX < maxX`).toBeLessThan(portrait[2]);
        expect(portrait[1], `${did} ${cname} portrait minY < maxY`).toBeLessThan(portrait[3]);

        // Face bounds
        expect(face[0], `${did} ${cname} face minX >= 0`).toBeGreaterThanOrEqual(0);
        expect(face[1], `${did} ${cname} face minY >= 0`).toBeGreaterThanOrEqual(0);
        expect(face[2], `${did} ${cname} face maxX <= 100`).toBeLessThanOrEqual(100);
        expect(face[3], `${did} ${cname} face maxY <= 100`).toBeLessThanOrEqual(100);
        expect(face[0], `${did} ${cname} face minX < maxX`).toBeLessThan(face[2]);
        expect(face[1], `${did} ${cname} face minY < maxY`).toBeLessThan(face[3]);

        // Mouth targets bounded in [5, 95]%
        expect(mouth.x, `${did} ${cname} mouth X bounded`).toBeGreaterThanOrEqual(5);
        expect(mouth.x, `${did} ${cname} mouth X bounded`).toBeLessThanOrEqual(95);
        expect(mouth.y, `${did} ${cname} mouth Y bounded`).toBeGreaterThanOrEqual(5);
        expect(mouth.y, `${did} ${cname} mouth Y bounded`).toBeLessThanOrEqual(95);
      }
    }
  });

  it('2.4 All 5 Widescreen 16:9 dialogues are correctly registered with 1024x572 dimensions', () => {
    expect(WIDESCREEN_DIALOGUE_IDS.length).toBe(5);
    for (const did of WIDESCREEN_DIALOGUE_IDS) {
      const meta = HSK1_SCENE_METADATA[did];
      expect(meta, `Missing metadata for ${did}`).toBeDefined();
      expect(meta.aspectRatioClass).toBe('16:9');
      expect(meta.imageDimensions).toEqual({ width: 1024, height: 572 });
    }
  });

  it('2.5 All 5 Split-Screen dialogues have 50% divider registered for bilateral containment', () => {
    expect(SPLIT_SCREEN_DIALOGUE_IDS.length).toBe(5);
    for (const did of SPLIT_SCREEN_DIALOGUE_IDS) {
      const meta = HSK1_SCENE_METADATA[did];
      expect(meta, `Missing metadata for ${did}`).toBeDefined();
      expect(meta.category).toBe('split-screen');
      expect(meta.splitScreenDividerX).toBe(50);
    }
  });
});

// ============================================================================
// Suite 3: HSK 2 Scope Isolation & Cryptographic Invariants
// ============================================================================

describe('Suite 3: HSK 2 Scope Isolation & Cryptographic Invariants', () => {
  it('3.1 src/data/newHsk2BookData.ts exists and strictly preserves canonical SHA-256 hash', () => {
    expect(fs.existsSync(HSK2_BOOK_PATH), `HSK 2 curriculum file must exist at ${HSK2_BOOK_PATH}`).toBe(true);
    const content = fs.readFileSync(HSK2_BOOK_PATH);
    const hash = crypto.createHash('sha256').update(content).digest('hex');

    const CANONICAL_HSK2_BOOK_SHA256 = '85ed8039e430f7ebc46fc08e6f34a90a21bfde6f315f507674c77f60da2ed59d';
    expect(
      hash,
      `SECURITY VIOLATION: newHsk2BookData.ts was altered! Expected ${CANONICAL_HSK2_BOOK_SHA256}, got ${hash}`
    ).toBe(CANONICAL_HSK2_BOOK_SHA256);
  });

  it('3.2 coursebookCharacterAnchors.ts retains all 60 pristine HSK 2 entries matching canonical SHA-256', () => {
    const hsk2Entries: Record<string, any> = {};
    const allKeys = Object.keys(COURSEBOOK_CHARACTER_ANCHORS).sort();

    for (const k of allKeys) {
      if (k.startsWith('hsk2-')) {
        hsk2Entries[k] = COURSEBOOK_CHARACTER_ANCHORS[k];
      }
    }

    expect(Object.keys(hsk2Entries).length, 'Must have exactly 60 HSK 2 scene anchor records').toBe(60);

    const hash = crypto.createHash('sha256').update(JSON.stringify(hsk2Entries)).digest('hex');
    const CANONICAL_HSK2_ANCHORS_SHA256 = 'de7f101f863c74cf49c5a75369cb927c5e3a4f9f5b78657aa10f96a084e222c1';

    expect(
      hash,
      `SECURITY VIOLATION: HSK 2 anchor records were modified! Got ${hash}`
    ).toBe(CANONICAL_HSK2_ANCHORS_SHA256);
  });

  it('3.3 coursebookAudioManifest.json preserves all 60 HSK 2 dialogue entries untouched', () => {
    expect(fs.existsSync(MANIFEST_PATH)).toBe(true);
    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
    const hsk2Keys = Object.keys(manifest).filter((k) => k.startsWith('hsk2-'));

    expect(hsk2Keys.length, 'Must preserve exactly 60 HSK 2 audio manifest keys').toBe(60);

    for (let l = 1; l <= 15; l++) {
      for (let t = 1; t <= 4; t++) {
        const k = `hsk2-l${l}-t${t}`;
        expect(manifest[k], `Missing HSK 2 manifest key: ${k}`).toBeDefined();
      }
    }
  });

  it('3.4 CoursebookView.tsx strictly isolates HSK 1 layout branch from legacy HSK 2 rendering', () => {
    expect(fs.existsSync(COURSEBOOK_VIEW_PATH)).toBe(true);
    const viewCode = fs.readFileSync(COURSEBOOK_VIEW_PATH, 'utf-8');

    // Invariant: CoursebookView must branch on isHsk1
    expect(viewCode.includes("isHsk1 = textItem.id.startsWith('hsk1-')")).toBe(true);
    // Legacy HSK 2 illustration assets preserved
    expect(viewCode.includes('cartoon_hsk2_l1_t1.jpg')).toBe(true);
    expect(viewCode.includes('cartoon_hsk2_l15_t4.jpg')).toBe(true);
  });
});

// ============================================================================
// Suite 4: Automated Verification Harness Execution & Calibration Diagnosis
// ============================================================================

describe('Suite 4: Automated Verification Harness Execution & Calibration Diagnosis', () => {
  it('4.1 Verification harness executes without crash across all 45 dialogues and 203 lines (812 evaluations)', () => {
    const summary = runComprehensiveVerification();

    expect(summary.totalDialogues).toBe(45);
    expect(summary.totalLinesChecked).toBe(203);
    expect(summary.totalViewportEvaluations).toBe(812);
    expect(summary.results.length).toBe(45);
    expect(summary.hsk2Isolation.bookDataPristine).toBe(true);
    expect(summary.hsk2Isolation.anchorsPristine).toBe(true);
    expect(summary.hsk2Isolation.manifestPreserved).toBe(true);
  });

  it('4.2 Verification harness accurately flags uncalibrated dialogues in current codebase', () => {
    const summary = runComprehensiveVerification();

    // The current baseline in src/data/hsk1BubbleLayouts.ts contains uncalibrated mouth and bubble positions.
    // The harness must accurately detect and report these failures rather than silently masking them.
    expect(summary.failedDialogues).toBeGreaterThan(0);
    expect(summary.totalFaceCollisions).toBeGreaterThan(0);

    // Verify that the known high-risk uncalibrated dialogues from explorer survey are flagged:
    const flaggedIds = summary.results.filter((r) => r.status === 'FAIL').map((r) => r.dialogueId);
    const knownUncalibrated = [
      'hsk1-l1-t2',
      'hsk1-l1-t3',
      'hsk1-l2-t1',
      'hsk1-l3-t3',
      'hsk1-l14-t2',
      'hsk1-l15-t1',
      'hsk1-l15-t2',
    ];

    for (const did of knownUncalibrated) {
      expect(flaggedIds, `Harness must flag known uncalibrated dialogue ${did}`).toContain(did);
    }
  });

  it('4.3 Verification harness accurately flags split-screen boundary crossings in current codebase', () => {
    const summary = runComprehensiveVerification();

    // In current baseline, split-screen scenes cross X=50% divider
    const splitFailures = summary.results.filter(
      (r) => SPLIT_SCREEN_DIALOGUE_IDS.includes(r.dialogueId as any) && r.boundaryViolations > 0
    );
    expect(splitFailures.length).toBeGreaterThan(0);
  });

  it('4.4 Calibrated Layout Oracle: verified that calibrated coordinates achieve 100% pass for L1 T1', () => {
    // When calibrated clear-space coordinates from explorer survey are applied:
    const lines = [
      { speaker: '王一飞', hanzi: '你好！', vietnamese: 'Chào em!' },
      { speaker: '小语', hanzi: '老师好！', vietnamese: 'Chào cô ạ!' },
    ];
    const calibratedLayout = {
      '王一飞': {
        mouthTarget: { x: 42.5, y: 42.0 },
        placement: 'left' as const,
        bubblePos: { x: 16, y: 40 },
        tailOrigin: 'right' as const,
      },
      '小语': {
        mouthTarget: { x: 71.5, y: 35.0 },
        placement: 'custom' as const,
        bubblePos: { x: 50, y: 55 },
        tailOrigin: 'top' as const,
        maxWidth: 160,
      },
    };

    const res = auditDialogue('hsk1-l1-t1', lines, calibratedLayout);
    expect(res.status).toBe('PASS');
    expect(res.faceCollisions).toBe(0);
    expect(res.tailCrossings).toBe(0);
    expect(res.boundaryViolations).toBe(0);
    expect(res.minFaceClearance).toBeGreaterThan(0);
  });
});
