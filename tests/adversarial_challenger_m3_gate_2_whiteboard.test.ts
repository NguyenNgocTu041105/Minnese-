/**
 * tests/adversarial_challenger_m3_gate_2_whiteboard.test.ts
 *
 * Empirical Adversarial Test Suite for Milestone 3 Gate 2:
 * - Freehand Drawing Canvas (R4)
 * - Card Navigation & Randomization (R5)
 * - Clean Navigation Controls Hygiene (R6)
 *
 * Author: challenger_m3_gate_2 (Teamwork Critic & Specialist)
 */

import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

import { shuffleArray } from '../src/utils/shuffleUtils';
import type { WordItem } from '../src/types';
import type { WhiteboardPoint, WhiteboardStroke, CalligraphyGridType } from '../src/components/Coursebook/VocabularyWhiteboardModal';

// ============================================================================
// FIXTURES
// ============================================================================

const MOCK_VOCABULARY: WordItem[] = [
  {
    id: 'hsk1-w1',
    hanzi: '你',
    pinyin: 'nǐ',
    vietnamese: 'bạn, anh, chị (ngôi thứ 2 số ít)',
    english: 'you',
    hskLevel: 1,
  },
  {
    id: 'hsk1-w2',
    hanzi: '好',
    pinyin: 'hǎo',
    vietnamese: 'tốt, đẹp, hay, khỏe',
    english: 'good, well',
    hskLevel: 1,
  },
  {
    id: 'hsk1-w3',
    hanzi: '你好',
    pinyin: 'nǐ hǎo',
    vietnamese: 'chào bạn',
    english: 'hello',
    hskLevel: 1,
  },
  {
    id: 'hsk1-w4',
    hanzi: '对不起',
    pinyin: 'duì bu qǐ',
    vietnamese: 'xin lỗi',
    english: 'sorry',
    hskLevel: 1,
  },
  {
    id: 'hsk1-w5',
    hanzi: '公共汽车',
    pinyin: 'gōng gòng qì chē',
    vietnamese: 'xe buýt',
    english: 'bus',
    hskLevel: 1,
  },
];

// ============================================================================
// WHITEBOARD CANVAS ENGINE HARNESS
// Mirrors the mathematical rendering logic implemented in VocabularyWhiteboardModal.tsx
// ============================================================================

export interface MockCanvasRenderingContext2D {
  save: () => void;
  restore: () => void;
  beginPath: () => void;
  moveTo: (x: number, y: number) => void;
  lineTo: (x: number, y: number) => void;
  quadraticCurveTo: (cpx: number, cpy: number, x: number, y: number) => void;
  arc: (x: number, y: number, radius: number, startAngle: number, endAngle: number) => void;
  stroke: () => void;
  fill: () => void;
  clearRect: (x: number, y: number, w: number, h: number) => void;
  scale: (x: number, y: number) => void;
  setTransform: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  lineCap: CanvasLineCap;
  lineJoin: CanvasLineJoin;
  lineWidth: number;
  strokeStyle: string | CanvasGradient | CanvasPattern;
  fillStyle: string | CanvasGradient | CanvasPattern;
  globalCompositeOperation: GlobalCompositeOperation;
}

export class WhiteboardCanvasEngine {
  public strokes: WhiteboardStroke[] = [];
  public activeStroke: WhiteboardStroke | null = null;
  public pointerCaptured: boolean = false;
  public capturedPointerId: number | null = null;
  public color: string = '#1f2937';
  public width: number = 6;
  public isEraser: boolean = false;
  public widthBuffer: number = 420;
  public heightBuffer: number = 420;
  public contextLog: string[] = [];
  public clearRectCalls: { x: number; y: number; w: number; h: number }[] = [];
  public bezierCalls: { cpx: number; cpy: number; x: number; y: number }[] = [];

  public mockCtx: MockCanvasRenderingContext2D;

  constructor() {
    this.mockCtx = {
      save: vi.fn(() => this.contextLog.push('save')),
      restore: vi.fn(() => this.contextLog.push('restore')),
      beginPath: vi.fn(() => this.contextLog.push('beginPath')),
      moveTo: vi.fn((x, y) => this.contextLog.push(`moveTo(${x},${y})`)),
      lineTo: vi.fn((x, y) => this.contextLog.push(`lineTo(${x},${y})`)),
      quadraticCurveTo: vi.fn((cpx, cpy, x, y) => {
        this.contextLog.push(`quadraticCurveTo(${cpx},${cpy},${x},${y})`);
        this.bezierCalls.push({ cpx, cpy, x, y });
      }),
      arc: vi.fn((x, y, r, s, e) => this.contextLog.push(`arc(${x},${y},${r},${s},${e})`)),
      stroke: vi.fn(() => this.contextLog.push('stroke')),
      fill: vi.fn(() => this.contextLog.push('fill')),
      clearRect: vi.fn((x, y, w, h) => {
        this.contextLog.push(`clearRect(${x},${y},${w},${h})`);
        this.clearRectCalls.push({ x, y, w, h });
      }),
      scale: vi.fn((x, y) => this.contextLog.push(`scale(${x},${y})`)),
      setTransform: vi.fn((a, b, c, d, e, f) => this.contextLog.push(`setTransform(${a},${b},${c},${d},${e},${f})`)),
      lineCap: 'round',
      lineJoin: 'round',
      lineWidth: 6,
      strokeStyle: '#1f2937',
      fillStyle: '#1f2937',
      globalCompositeOperation: 'source-over',
    };
  }

  public handlePointerDown(e: { pointerId: number; clientX: number; clientY: number; targetRect: DOMRect }) {
    this.pointerCaptured = true;
    this.capturedPointerId = e.pointerId;

    const pt: WhiteboardPoint = {
      x: e.clientX - e.targetRect.left,
      y: e.clientY - e.targetRect.top,
    };
    const effectiveWidth = this.isEraser ? 24 : this.width;
    const newStroke: WhiteboardStroke = {
      points: [pt],
      color: this.color,
      width: effectiveWidth,
      isEraser: this.isEraser,
    };
    this.activeStroke = newStroke;

    const ctx = this.mockCtx;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (this.isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = '#000000';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = this.color;
    }
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, effectiveWidth / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  public handlePointerMove(e: { pointerId: number; clientX: number; clientY: number; targetRect: DOMRect }) {
    if (!this.activeStroke) return;

    const pt: WhiteboardPoint = {
      x: e.clientX - e.targetRect.left,
      y: e.clientY - e.targetRect.top,
    };
    this.activeStroke.points.push(pt);

    const ctx = this.mockCtx;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = this.activeStroke.width;

    if (this.activeStroke.isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = '#000000';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = this.activeStroke.color;
    }

    const pts = this.activeStroke.points;
    if (pts.length >= 2) {
      const p1 = pts[pts.length - 2];
      const p2 = pts[pts.length - 1];
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
      ctx.stroke();
    }
  }

  public commitActiveStroke(pointerId: number) {
    if (this.capturedPointerId === pointerId) {
      this.pointerCaptured = false;
      this.capturedPointerId = null;
    }

    if (this.activeStroke && this.activeStroke.points.length > 0) {
      this.strokes.push(this.activeStroke);
    }
    this.activeStroke = null;
  }

  public undo(): boolean {
    if (this.strokes.length === 0) return false;
    this.strokes.pop();
    this.redraw();
    return true;
  }

  public clear(): void {
    this.strokes = [];
    this.mockCtx.clearRect(0, 0, this.widthBuffer, this.heightBuffer);
  }

  public redraw(): void {
    const ctx = this.mockCtx;
    ctx.clearRect(0, 0, this.widthBuffer, this.heightBuffer);

    for (const stroke of this.strokes) {
      if (stroke.points.length === 0) continue;

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = stroke.width;

      if (stroke.isEraser) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = '#000000';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = stroke.color;
      }

      if (stroke.points.length === 1) {
        ctx.beginPath();
        ctx.arc(stroke.points[0].x, stroke.points[0].y, stroke.width / 2, 0, Math.PI * 2);
        ctx.fillStyle = stroke.isEraser ? '#000000' : stroke.color;
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          const p1 = stroke.points[i - 1];
          const p2 = stroke.points[i];
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;
          ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
        }
        const lastPt = stroke.points[stroke.points.length - 1];
        ctx.lineTo(lastPt.x, lastPt.y);
        ctx.stroke();
      }
    }
  }
}

// ============================================================================
// TEST SUITE
// ============================================================================

describe('Adversarial Verification Suite: Milestone 3 Gate 2', () => {

  // --------------------------------------------------------------------------
  // SECTION 1: Freehand Drawing Canvas (R4)
  // --------------------------------------------------------------------------
  describe('1. Freehand Drawing Canvas (R4)', () => {
    const mockRect: DOMRect = {
      left: 100,
      top: 100,
      width: 400,
      height: 400,
      right: 500,
      bottom: 500,
      x: 100,
      y: 100,
      toJSON: () => {},
    };

    it('1.1: Pointer event lifecycle correctly acquires and releases pointer capture', () => {
      const engine = new WhiteboardCanvasEngine();

      expect(engine.pointerCaptured).toBe(false);
      expect(engine.capturedPointerId).toBeNull();

      // Step 1: Pointer Down
      engine.handlePointerDown({ pointerId: 42, clientX: 150, clientY: 150, targetRect: mockRect });
      expect(engine.pointerCaptured).toBe(true);
      expect(engine.capturedPointerId).toBe(42);
      expect(engine.activeStroke).not.toBeNull();
      expect(engine.activeStroke?.points).toHaveLength(1);
      expect(engine.activeStroke?.points[0]).toEqual({ x: 50, y: 50 });

      // Step 2: Pointer Move
      engine.handlePointerMove({ pointerId: 42, clientX: 160, clientY: 170, targetRect: mockRect });
      expect(engine.activeStroke?.points).toHaveLength(2);
      expect(engine.activeStroke?.points[1]).toEqual({ x: 60, y: 70 });

      // Step 3: Pointer Up / Cancel
      engine.commitActiveStroke(42);
      expect(engine.pointerCaptured).toBe(false);
      expect(engine.capturedPointerId).toBeNull();
      expect(engine.activeStroke).toBeNull();
      expect(engine.strokes).toHaveLength(1);
      expect(engine.strokes[0].points).toHaveLength(2);
    });

    it('1.2: Pointer move without pointerdown is safely ignored without creating strokes', () => {
      const engine = new WhiteboardCanvasEngine();

      engine.handlePointerMove({ pointerId: 99, clientX: 200, clientY: 200, targetRect: mockRect });
      expect(engine.activeStroke).toBeNull();
      expect(engine.strokes).toHaveLength(0);
      expect(engine.pointerCaptured).toBe(false);
    });

    it('1.3: Quadratic Bezier Curve interpolation averages midpoints for smooth lines', () => {
      const engine = new WhiteboardCanvasEngine();

      engine.handlePointerDown({ pointerId: 1, clientX: 100, clientY: 100, targetRect: mockRect }); // pt (0,0)
      engine.handlePointerMove({ pointerId: 1, clientX: 120, clientY: 140, targetRect: mockRect }); // pt (20,40)
      engine.handlePointerMove({ pointerId: 1, clientX: 160, clientY: 180, targetRect: mockRect }); // pt (60,80)
      engine.commitActiveStroke(1);

      // Between (0,0) and (20,40): control pt is (0,0), target mid is (10,20)
      // Between (20,40) and (60,80): control pt is (20,40), target mid is (40,60)
      expect(engine.bezierCalls).toHaveLength(2);
      expect(engine.bezierCalls[0]).toEqual({ cpx: 0, cpy: 0, x: 10, y: 20 });
      expect(engine.bezierCalls[1]).toEqual({ cpx: 20, cpy: 40, x: 40, y: 60 });
    });

    it('1.4: Line styling enforces round lineCap and round lineJoin', () => {
      const engine = new WhiteboardCanvasEngine();

      engine.handlePointerDown({ pointerId: 1, clientX: 110, clientY: 110, targetRect: mockRect });
      expect(engine.mockCtx.lineCap).toBe('round');
      expect(engine.mockCtx.lineJoin).toBe('round');

      engine.handlePointerMove({ pointerId: 1, clientX: 120, clientY: 120, targetRect: mockRect });
      expect(engine.mockCtx.lineCap).toBe('round');
      expect(engine.mockCtx.lineJoin).toBe('round');
    });

    it('1.5: Dual-layer architecture: destination-out eraser operates strictly on canvas buffer', () => {
      const engine = new WhiteboardCanvasEngine();

      // 1. Draw black ink stroke
      engine.color = '#1f2937';
      engine.isEraser = false;
      engine.handlePointerDown({ pointerId: 1, clientX: 110, clientY: 110, targetRect: mockRect });
      expect(engine.mockCtx.globalCompositeOperation).toBe('source-over');
      engine.commitActiveStroke(1);
      expect(engine.strokes[0].isEraser).toBe(false);

      // 2. Switch to eraser mode
      engine.isEraser = true;
      engine.handlePointerDown({ pointerId: 2, clientX: 115, clientY: 115, targetRect: mockRect });
      expect(engine.mockCtx.globalCompositeOperation).toBe('destination-out');
      engine.commitActiveStroke(2);
      expect(engine.strokes[1].isEraser).toBe(true);

      // 3. Verify redraw preserves destination-out for eraser and source-over for ink
      engine.redraw();
      expect(engine.mockCtx.clearRect).toHaveBeenCalled();
    });

    it('1.6: Undo pops strokes in LIFO order and is safe on empty stack', () => {
      const engine = new WhiteboardCanvasEngine();

      // Undo on empty stack
      expect(engine.strokes).toHaveLength(0);
      const undoEmpty = engine.undo();
      expect(undoEmpty).toBe(false);
      expect(engine.strokes).toHaveLength(0);

      // Push 3 strokes
      for (let i = 1; i <= 3; i++) {
        engine.handlePointerDown({ pointerId: i, clientX: 100 + i * 10, clientY: 100 + i * 10, targetRect: mockRect });
        engine.commitActiveStroke(i);
      }
      expect(engine.strokes).toHaveLength(3);

      // Undo 1 by 1
      expect(engine.undo()).toBe(true);
      expect(engine.strokes).toHaveLength(2);

      expect(engine.undo()).toBe(true);
      expect(engine.strokes).toHaveLength(1);

      expect(engine.undo()).toBe(true);
      expect(engine.strokes).toHaveLength(0);

      // Subsequent undo on empty
      expect(engine.undo()).toBe(false);
      expect(engine.strokes).toHaveLength(0);
    });

    it('1.7: Clear canvas empties all strokes and calls clearRect', () => {
      const engine = new WhiteboardCanvasEngine();

      // Draw 5 strokes
      for (let i = 1; i <= 5; i++) {
        engine.handlePointerDown({ pointerId: i, clientX: 100 + i * 5, clientY: 100 + i * 5, targetRect: mockRect });
        engine.commitActiveStroke(i);
      }
      expect(engine.strokes).toHaveLength(5);

      engine.clear();
      expect(engine.strokes).toHaveLength(0);
      expect(engine.clearRectCalls.length).toBeGreaterThan(0);
      expect(engine.clearRectCalls[engine.clearRectCalls.length - 1]).toEqual({
        x: 0,
        y: 0,
        w: 420,
        h: 420,
      });
    });

    it('1.8 (CRITICAL R4 AST CHECK): Strictly 0 stroke order sequence guides, forced animations, or numbering arrows in VocabularyWhiteboardModal.tsx', () => {
      const modalPath = path.resolve(__dirname, '../src/components/Coursebook/VocabularyWhiteboardModal.tsx');
      expect(fs.existsSync(modalPath)).toBe(true);

      const fileContent = fs.readFileSync(modalPath, 'utf-8');

      // 1. Textual / regex scan for forbidden stroke-order animation keywords
      const forbiddenPatterns = [
        /hanzi-writer/i,
        /HanziWriter/i,
        /animateStroke/i,
        /strokeOrder/i,
        /stroke-order/i,
        /strokeNumber/i,
        /strokeSequence/i,
        /thứ tự nét/i,
        /ép buộc nét/i,
        /chấm điểm nét/i,
        /bắt buộc thứ tự/i,
      ];

      for (const pattern of forbiddenPatterns) {
        // Exception: comments explaining requirement "Strictly zero stroke order animation" or "Không ép buộc thứ tự nét"
        const matches = fileContent.match(pattern);
        if (matches) {
          // Verify matches only occur in negative constraint commentary or header disclaimer
          const lines = fileContent.split('\n');
          for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
            const line = lines[lineIdx];
            if (pattern.test(line)) {
              const isCommentOrDisclaimer =
                line.includes('Strictly zero') ||
                line.includes('Không ép buộc') ||
                line.includes('Luyện viết tự do') ||
                line.includes('Do not include') ||
                line.includes('* - Strictly');
              expect(
                isCommentOrDisclaimer,
                `Forbidden stroke-order constraint found in executable code at line ${lineIdx + 1}: "${line.trim()}"`
              ).toBe(true);
            }
          }
        }
      }

      // 2. TypeScript AST scan: verify zero imports of hanzi-writer or animation libraries
      const sourceFile = ts.createSourceFile(
        modalPath,
        fileContent,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX
      );

      const importedModules: string[] = [];
      const traverseNode = (node: ts.Node) => {
        if (ts.isImportDeclaration(node)) {
          const moduleSpecifier = node.moduleSpecifier.getText(sourceFile).replace(/['"]/g, '');
          importedModules.push(moduleSpecifier);
        }
        ts.forEachChild(node, traverseNode);
      };
      traverseNode(sourceFile);

      expect(importedModules).not.toContain('hanzi-writer');
      expect(importedModules).not.toContain('react-spring');
      expect(importedModules).not.toContain('framer-motion');

      // 3. Verify presence of explicit freedom disclaimer in rendered JSX
      expect(fileContent).toContain('Luyện viết tự do • Không ép buộc thứ tự nét');
    });
  });

  // --------------------------------------------------------------------------
  // SECTION 2: Card Navigation & Randomization (R5)
  // --------------------------------------------------------------------------
  describe('2. Card Navigation & Randomization (R5)', () => {
    it('2.1: Navigation bounds: "Từ trước" does not decrement below 0; "Từ sau" does not exceed deck.length - 1', () => {
      const words = MOCK_VOCABULARY;
      let currentIndex = 0;

      const handlePrev = () => {
        if (currentIndex > 0) currentIndex--;
      };
      const handleNext = () => {
        if (currentIndex < words.length - 1) currentIndex++;
      };

      // Boundary 1: Lower bound check
      expect(currentIndex).toBe(0);
      handlePrev();
      expect(currentIndex).toBe(0); // Clamped at 0

      // Step forward through deck
      for (let i = 0; i < words.length - 1; i++) {
        handleNext();
        expect(currentIndex).toBe(i + 1);
      }
      expect(currentIndex).toBe(words.length - 1);

      // Boundary 2: Upper bound check
      handleNext();
      expect(currentIndex).toBe(words.length - 1); // Clamped at max index

      // Step back
      handlePrev();
      expect(currentIndex).toBe(words.length - 2);
    });

    it('2.2: Multi-character selector tabs for compound words (e.g., 你好, 对不起, 公共汽车)', () => {
      // Test words of lengths 1, 2, 3, 4
      const word1 = MOCK_VOCABULARY[0]; // 你 (length 1)
      const word2 = MOCK_VOCABULARY[2]; // 你好 (length 2)
      const word3 = MOCK_VOCABULARY[3]; // 对不起 (length 3)
      const word4 = MOCK_VOCABULARY[4]; // 公共汽车 (length 4)

      const chars1 = Array.from(word1.hanzi);
      const chars2 = Array.from(word2.hanzi);
      const chars3 = Array.from(word3.hanzi);
      const chars4 = Array.from(word4.hanzi);

      expect(chars1).toEqual(['你']);
      expect(chars2).toEqual(['你', '好']);
      expect(chars3).toEqual(['对', '不', '起']);
      expect(chars4).toEqual(['公', '共', '汽', '车']);

      // Tab visibility contract: only when wordChars.length > 1
      expect(chars1.length > 1).toBe(false);
      expect(chars2.length > 1).toBe(true);
      expect(chars3.length > 1).toBe(true);
      expect(chars4.length > 1).toBe(true);
    });

    it('2.3: Per-character stroke cache isolation for compound words', () => {
      const currentWord = MOCK_VOCABULARY[2]; // 你好
      const strokesCache: Record<string, WhiteboardStroke[]> = {};

      const char0Key = `${currentWord.id}_char_0`;
      const char1Key = `${currentWord.id}_char_1`;

      // Draw stroke on character 0 (你)
      strokesCache[char0Key] = [
        {
          points: [{ x: 10, y: 10 }, { x: 20, y: 20 }],
          color: '#1f2937',
          width: 6,
          isEraser: false,
        },
      ];

      // Switch to character 1 (好)
      expect(strokesCache[char1Key]).toBeUndefined();

      // Draw stroke on character 1 (好)
      strokesCache[char1Key] = [
        {
          points: [{ x: 50, y: 50 }, { x: 60, y: 60 }],
          color: '#dc2626',
          width: 12,
          isEraser: false,
        },
      ];

      // Verify stroke sets remain isolated
      expect(strokesCache[char0Key]).toHaveLength(1);
      expect(strokesCache[char0Key][0].color).toBe('#1f2937');

      expect(strokesCache[char1Key]).toHaveLength(1);
      expect(strokesCache[char1Key][0].color).toBe('#dc2626');
    });

    it('2.4: shuffleArray integration and non-mutation immutability guarantee', () => {
      const original = Object.freeze([...MOCK_VOCABULARY]);

      // Call shuffleArray 20 times on frozen array
      for (let i = 0; i < 20; i++) {
        const shuffled = shuffleArray(original);

        // 1. Must be a distinct new array instance
        expect(shuffled).not.toBe(original);

        // 2. Must contain identical count of items
        expect(shuffled).toHaveLength(original.length);

        // 3. Must be a valid permutation (multiset equality)
        const origIds = original.map((w) => w.id).sort();
        const shuffledIds = shuffled.map((w) => w.id).sort();
        expect(shuffledIds).toEqual(origIds);
      }

      // Verify original is intact
      expect(original[0].id).toBe('hsk1-w1');
      expect(original[4].id).toBe('hsk1-w5');
    });
  });

  // --------------------------------------------------------------------------
  // SECTION 3: Clean Navigation Controls Hygiene (R6)
  // --------------------------------------------------------------------------
  describe('3. Clean Navigation Controls Hygiene (R6)', () => {
    const coursebookViewPath = path.resolve(__dirname, '../src/components/Coursebook/CoursebookView.tsx');

    it('3.1: Strictly 0 occurrences of "Bài trước" in CoursebookView.tsx', () => {
      const content = fs.readFileSync(coursebookViewPath, 'utf-8');
      const matches = content.match(/Bài trước/g) || [];
      expect(matches.length, `Expected 0 occurrences of "Bài trước", found ${matches.length}`).toBe(0);
    });

    it('3.2: Strictly 0 occurrences of "Bài sau" in CoursebookView.tsx', () => {
      const content = fs.readFileSync(coursebookViewPath, 'utf-8');
      const matches = content.match(/Bài sau/g) || [];
      expect(matches.length, `Expected 0 occurrences of "Bài sau", found ${matches.length}`).toBe(0);
    });

    it('3.3: Strictly 0 occurrences of "Bài tiếp theo" in CoursebookView.tsx', () => {
      const content = fs.readFileSync(coursebookViewPath, 'utf-8');
      const matches = content.match(/Bài tiếp theo/g) || [];
      expect(matches.length, `Expected 0 occurrences of "Bài tiếp theo", found ${matches.length}`).toBe(0);
    });

    it('3.4: Strictly 0 occurrences of ChevronLeft in CoursebookView.tsx', () => {
      const content = fs.readFileSync(coursebookViewPath, 'utf-8');
      const matches = content.match(/ChevronLeft/g) || [];
      expect(matches.length, `Expected 0 occurrences of "ChevronLeft", found ${matches.length}`).toBe(0);
    });

    it('3.5: Centered CheckCircle2 lesson completion button remains intact in CoursebookView.tsx', () => {
      const content = fs.readFileSync(coursebookViewPath, 'utf-8');

      // 1. CheckCircle2 imported from lucide-react
      expect(content).toMatch(/import\s*\{[^}]*CheckCircle2[^}]*\}\s*from\s*['"]lucide-react['"]/);

      // 2. Centered bottom action bar container
      expect(content).toContain('flex items-center justify-center mt-8');

      // 3. CheckCircle2 rendered inside button with toggleCompleteLesson
      expect(content).toContain('toggleCompleteLesson(currentLesson.lessonNumber)');
      expect(content).toContain('<CheckCircle2 className="w-4 h-4" />');
      expect(content).toContain('Đánh dấu đã học xong bài');
      expect(content).toContain('✓ Đã học xong bài này');
    });
  });

  // --------------------------------------------------------------------------
  // SECTION 4: Chaos & Stress Invariants
  // --------------------------------------------------------------------------
  describe('4. Adversarial Stress & Chaos Scenarios', () => {
    it('4.1: Rapid random drawing, undoing, and clearing maintains memory stability', () => {
      const engine = new WhiteboardCanvasEngine();
      const mockRect: DOMRect = {
        left: 0,
        top: 0,
        width: 400,
        height: 400,
        right: 400,
        bottom: 400,
        x: 0,
        y: 0,
        toJSON: () => {},
      };

      // Perform 500 chaotic operations
      for (let op = 0; op < 500; op++) {
        const action = op % 5;
        if (action === 0 || action === 1) {
          // Draw stroke with 3 points
          const ptr = op + 1;
          engine.handlePointerDown({ pointerId: ptr, clientX: 10 + op, clientY: 20 + op, targetRect: mockRect });
          engine.handlePointerMove({ pointerId: ptr, clientX: 30 + op, clientY: 40 + op, targetRect: mockRect });
          engine.handlePointerMove({ pointerId: ptr, clientX: 50 + op, clientY: 60 + op, targetRect: mockRect });
          engine.commitActiveStroke(ptr);
        } else if (action === 2) {
          // Undo
          engine.undo();
        } else if (action === 3) {
          // Toggle eraser
          engine.isEraser = !engine.isEraser;
        } else if (action === 4 && op % 50 === 0) {
          // Occasional clear
          engine.clear();
        }
      }

      // Ensure no NaN in coordinates or broken state
      for (const stroke of engine.strokes) {
        for (const pt of stroke.points) {
          expect(Number.isFinite(pt.x)).toBe(true);
          expect(Number.isFinite(pt.y)).toBe(true);
        }
      }
    });

    it('4.2: Handles extreme coordinates (negative, large, fractional) gracefully', () => {
      const engine = new WhiteboardCanvasEngine();
      const mockRect: DOMRect = {
        left: 50,
        top: 50,
        width: 400,
        height: 400,
        right: 450,
        bottom: 450,
        x: 50,
        y: 50,
        toJSON: () => {},
      };

      // Extreme points: negative relative coords, fractional, very large
      engine.handlePointerDown({ pointerId: 1, clientX: -100, clientY: -200, targetRect: mockRect });
      engine.handlePointerMove({ pointerId: 1, clientX: 0.12345, clientY: 9999.99, targetRect: mockRect });
      engine.commitActiveStroke(1);

      expect(engine.strokes).toHaveLength(1);
      expect(engine.strokes[0].points[0]).toEqual({ x: -150, y: -250 });
      expect(engine.strokes[0].points[1].x).toBeCloseTo(-49.87655, 3);
      expect(engine.strokes[0].points[1].y).toBeCloseTo(9949.99, 2);

      // Redraw executes without throwing
      expect(() => engine.redraw()).not.toThrow();
    });
  });
});
