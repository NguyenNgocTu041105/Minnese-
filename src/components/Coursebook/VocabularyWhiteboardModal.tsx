/**
 * src/components/Coursebook/VocabularyWhiteboardModal.tsx
 *
 * Vocabulary Handwriting Practice Whiteboard Canvas Modal
 * Requirements R4 & R5 Implementation
 *
 * Features:
 * - HTML5 Canvas with Pointer Events (stylus, finger touch, mouse)
 * - Smooth stroke rendering via quadratic bezier curves & round caps
 * - Calligraphy guide overlays: Mizige (米字格) & Tianzige (田字格)
 * - Drawing tools: Colors (Black, Emerald, Blue, Crimson), Widths (Fine, Medium, Bold), Eraser, Undo, Clear
 * - Word prompt card: Hanzi, Pinyin, Meaning, Audio playback (playChineseAudio), Progress indicator
 * - Navigation: "Từ trước", "Từ sau", keyboard arrow shortcuts, multi-character tabs
 * - Card Randomization: Non-mutating shuffleArray integration (R5)
 * - Strictly zero stroke order animation or numbering constraints (R4)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Volume2,
  X,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  RotateCcw,
  Trash2,
  Pen,
  Eraser,
  Grid,
  Eye,
  EyeOff,
} from 'lucide-react';
import { WordItem } from '../../types';
import { playChineseAudio, stopChineseAudio } from '../../utils/chineseAudio';
import { shuffleArray } from '../../utils/shuffleUtils';

export type CalligraphyGridType = 'mizi' | 'tianzi' | 'none';

export interface WhiteboardPoint {
  x: number;
  y: number;
}

export interface WhiteboardStroke {
  points: WhiteboardPoint[];
  color: string;
  width: number;
  isEraser: boolean;
}

export interface VocabularyWhiteboardModalProps {
  /** List of vocabulary words from current lesson */
  words: WordItem[];
  /** Whether modal is currently open */
  isOpen: boolean;
  /** Exit callback returning to vocabulary tab */
  onClose: () => void;
  /** Optional initial word index */
  initialWordIndex?: number;
  /** Optional initial shuffle toggle state */
  initialRandomize?: boolean;
  /** Lesson title for header */
  lessonTitle?: string;
  /** Lesson number for header badge */
  lessonNumber?: number;
  /** HSK level for header badge */
  hskLevel?: 1 | 2 | 3 | 4 | 5 | 6;
}

const COLOR_PALETTE = [
  { id: 'black', label: 'Mực tàu đen', value: '#1f2937', twClass: 'bg-slate-800' },
  { id: 'emerald', label: 'Xanh ngọc', value: '#10b981', twClass: 'bg-emerald-500' },
  { id: 'blue', label: 'Xanh lam', value: '#2563eb', twClass: 'bg-blue-600' },
  { id: 'crimson', label: 'Đỏ son', value: '#dc2626', twClass: 'bg-red-600' },
];

const STROKE_WIDTHS = [
  { id: 'fine', label: 'Nét thanh (3px)', value: 3, dotSize: 'w-1.5 h-1.5' },
  { id: 'medium', label: 'Nét vừa (6px)', value: 6, dotSize: 'w-2.5 h-2.5' },
  { id: 'bold', label: 'Nét đậm (12px)', value: 12, dotSize: 'w-4 h-4' },
];

export const VocabularyWhiteboardModal: React.FC<VocabularyWhiteboardModalProps> = ({
  words,
  isOpen,
  onClose,
  initialWordIndex = 0,
  initialRandomize = false,
  lessonTitle,
  lessonNumber,
  hskLevel,
}) => {
  // Deck and navigation state
  const [isRandomized, setIsRandomized] = useState<boolean>(initialRandomize);
  const [deck, setDeck] = useState<WordItem[]>(() =>
    initialRandomize ? shuffleArray(words) : [...words]
  );
  const [currentIndex, setCurrentIndex] = useState<number>(() =>
    Math.max(0, Math.min(words.length - 1, initialWordIndex))
  );

  // Active character index for multi-character words
  const [selectedCharIndex, setSelectedCharIndex] = useState<number>(0);

  // Drawing tool settings
  const [currentColor, setCurrentColor] = useState<string>('#1f2937');
  const [strokeWidth, setStrokeWidth] = useState<number>(6);
  const [isEraser, setIsEraser] = useState<boolean>(false);
  const [gridType, setGridType] = useState<CalligraphyGridType>('mizi');
  const [showGhostHint, setShowGhostHint] = useState<boolean>(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);

  // Stroke history per word (cache key: `${wordId}_char_${selectedCharIndex}`)
  const [strokesCache, setStrokesCache] = useState<Record<string, WhiteboardStroke[]>>({});
  const [currentStrokes, setCurrentStrokes] = useState<WhiteboardStroke[]>([]);

  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeStrokeRef = useRef<WhiteboardStroke | null>(null);

  const currentWord: WordItem | null = deck[currentIndex] || null;
  const wordChars: string[] = currentWord ? Array.from(currentWord.hanzi) : [];
  const activeChar: string = wordChars[selectedCharIndex] || wordChars[0] || '';
  const activeCacheKey = currentWord ? `${currentWord.id}_char_${selectedCharIndex}` : '';

  // Synchronize deck and initial props whenever modal opens or word list changes
  useEffect(() => {
    if (!isOpen) return;
    setIsRandomized(initialRandomize);
    const nextDeck = initialRandomize ? shuffleArray(words) : [...words];
    setDeck(nextDeck);
    const safeInitIdx =
      words.length > 0 ? Math.max(0, Math.min(words.length - 1, initialWordIndex)) : 0;
    if (initialRandomize && words[safeInitIdx]) {
      const relocated = nextDeck.findIndex((w) => w.id === words[safeInitIdx].id);
      setCurrentIndex(relocated >= 0 ? relocated : 0);
    } else {
      setCurrentIndex(safeInitIdx);
    }
    setSelectedCharIndex(0);
  }, [isOpen, words, initialRandomize, initialWordIndex]);

  // Load strokes for current active word/character
  useEffect(() => {
    if (activeCacheKey) {
      setCurrentStrokes(strokesCache[activeCacheKey] || []);
    }
  }, [activeCacheKey, strokesCache]);

  // Handle deck randomization toggle without wiping strokes or active word
  const handleToggleRandomize = () => {
    const nextRandomized = !isRandomized;
    setIsRandomized(nextRandomized);
    const activeId = deck[currentIndex]?.id;
    const nextDeck = nextRandomized ? shuffleArray(words) : [...words];
    setDeck(nextDeck);
    if (activeId) {
      const newIdx = nextDeck.findIndex((w) => w.id === activeId);
      setCurrentIndex(newIdx >= 0 ? newIdx : 0);
    } else {
      setCurrentIndex(0);
    }
    setSelectedCharIndex(0);
  };

  // Audio speech playback
  const handlePlayAudio = useCallback(() => {
    if (!currentWord) return;
    setIsAudioPlaying(true);
    playChineseAudio(currentWord.hanzi);
    setTimeout(() => setIsAudioPlaying(false), 1200);
  }, [currentWord]);

  // Redraw all strokes on canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(dpr, dpr);

    for (const stroke of currentStrokes) {
      if (stroke.points.length === 0) continue;

      ctx.save();
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
      ctx.restore();
    }
    ctx.restore();
  }, [currentStrokes]);

  // Adjust canvas buffer to container dimensions and Retina DPR
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const width = Math.floor(rect.width);
    const height = Math.floor(rect.height);

    if (width <= 0 || height <= 0) return;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }
    redrawCanvas();
  }, [redrawCanvas]);

  useEffect(() => {
    resizeCanvas();
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      const ro = new ResizeObserver(() => resizeCanvas());
      ro.observe(containerRef.current);
      return () => ro.disconnect();
    }
  }, [resizeCanvas]);

  useEffect(() => {
    redrawCanvas();
  }, [currentStrokes, redrawCanvas]);

  // Pointer event handlers
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>): WhiteboardPoint => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}

    const pt = getCanvasCoords(e);
    const width = isEraser ? 24 : strokeWidth;
    const newStroke: WhiteboardStroke = {
      points: [pt],
      color: currentColor,
      width,
      isEraser,
    };
    activeStrokeRef.current = newStroke;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = '#000000';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = currentColor;
    }
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, width / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const active = activeStrokeRef.current;
    if (!active) return;

    const pt = getCanvasCoords(e);
    active.points.push(pt);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = active.width;

    if (active.isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = '#000000';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = active.color;
    }

    const pts = active.points;
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
    ctx.restore();
  };

  const commitActiveStroke = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    const active = activeStrokeRef.current;
    if (active && active.points.length > 0) {
      const updated = [...currentStrokes, active];
      setCurrentStrokes(updated);
      if (activeCacheKey) {
        setStrokesCache((prev) => ({ ...prev, [activeCacheKey]: updated }));
      }
    }
    activeStrokeRef.current = null;
  };

  // Undo and Clear actions
  const handleUndo = useCallback(() => {
    if (currentStrokes.length === 0) return false;
    const updated = currentStrokes.slice(0, -1);
    setCurrentStrokes(updated);
    if (activeCacheKey) {
      setStrokesCache((prev) => ({ ...prev, [activeCacheKey]: updated }));
    }
    return true;
  }, [currentStrokes, activeCacheKey]);

  const handleClear = useCallback(() => {
    setCurrentStrokes([]);
    if (activeCacheKey) {
      setStrokesCache((prev) => ({ ...prev, [activeCacheKey]: [] }));
    }
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [activeCacheKey]);

  // Card navigation
  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setSelectedCharIndex(0);
    }
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < deck.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedCharIndex(0);
    }
  }, [currentIndex, deck.length]);

  // Close modal and ensure audio is stopped
  const handleClose = useCallback(() => {
    stopChineseAudio();
    onClose();
  }, [onClose]);

  // Ensure audio is stopped if modal closes or unmounts
  useEffect(() => {
    if (!isOpen) {
      stopChineseAudio();
    }
    return () => {
      stopChineseAudio();
    };
  }, [isOpen]);

  // Keyboard shortcut listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === ' ' && !e.repeat) {
        e.preventDefault();
        handlePlayAudio();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose, handlePrev, handleNext, handlePlayAudio, handleUndo]);

  if (!isOpen || !currentWord) return null;

  const cleanLessonTitle = lessonTitle
    ? lessonTitle.replace(new RegExp(`^Bài\\s*${lessonNumber ?? ''}\\s*[:：]?\\s*`, 'i'), '')
    : '';

  const modalContent = (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 md:p-6 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      id="modal-vocabulary-whiteboard"
    >
      <div className="bg-[var(--color-surface)] rounded-3xl max-w-4xl w-full border border-[var(--color-border)] shadow-2xl flex flex-col overflow-y-auto max-h-[94vh] relative">
        {/* Top Header: Identity, Randomize, Progress, and Exit */}
        <div className="px-5 py-3.5 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-bg-secondary)] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[var(--color-primary)] text-white">
              <Pen className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                  Bảng viết từ vựng tự do
                </h3>
                {lessonNumber && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                    Bài {lessonNumber}
                  </span>
                )}
                {hskLevel && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    HSK {hskLevel}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[var(--color-text-secondary)]">
                {cleanLessonTitle || lessonTitle || 'Luyện viết tự do • Không ép buộc thứ tự nét'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Randomize toggle button (R5) */}
            <button
              type="button"
              onClick={handleToggleRandomize}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isRandomized
                  ? 'bg-[var(--color-primary)] text-white shadow-xs'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)]'
              }`}
              title={isRandomized ? 'Đang bật xáo trộn (Bấm để quay về thứ tự gốc)' : 'Bấm để xáo trộn ngẫu nhiên thứ tự từ'}
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>{isRandomized ? 'Đã xáo trộn' : 'Xáo trộn'}</span>
            </button>

            {/* Close button */}
            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 rounded-xl hover:bg-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
              title="Đóng bảng viết (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Word Prompt Banner & Navigation Bar */}
        <div className="px-6 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Target Hanzi + Pinyin + Meaning + Audio */}
          <div className="flex items-center gap-4">
            <div className="flex items-baseline gap-2.5">
              <span className="text-3xl font-bold font-chinese text-[var(--color-text-primary)]">
                {currentWord.hanzi}
              </span>
              <span className="text-base font-mono font-semibold text-[var(--color-primary)]">
                {currentWord.pinyin}
              </span>
            </div>

            <div className="text-xs text-[var(--color-text-secondary)] max-w-xs truncate">
              {currentWord.vietnamese || currentWord.english}
            </div>

            <button
              type="button"
              onClick={handlePlayAudio}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                isAudioPlaying
                  ? 'bg-[var(--color-primary)] text-white animate-pulse'
                  : 'bg-[var(--color-primary-light)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white'
              }`}
              title="Phát âm chuẩn (Phím Space)"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          {/* Multi-Character Selector Tabs (for compound words e.g. 你好, 对不起) */}
          {wordChars.length > 1 && (
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
              {wordChars.map((char, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedCharIndex(idx)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold font-chinese transition-all cursor-pointer ${
                    selectedCharIndex === idx
                      ? 'bg-[var(--color-primary)] text-white shadow-xs'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                  title={`Luyện viết chữ "${char}"`}
                >
                  {char}
                </button>
              ))}
            </div>
          )}

          {/* Progress Indicator & Next/Prev Navigation */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
              Từ {currentIndex + 1} / {deck.length}
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="p-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-bg-secondary)] disabled:opacity-40 disabled:cursor-not-allowed text-[var(--color-text-primary)] transition-colors cursor-pointer"
                title="Từ trước (Mũi tên trái)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={currentIndex === deck.length - 1}
                className="p-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-bg-secondary)] disabled:opacity-40 disabled:cursor-not-allowed text-[var(--color-text-primary)] transition-colors cursor-pointer"
                title="Từ sau (Mũi tên phải)"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Center Canvas Area with Calligraphy Guide Overlay */}
        <div className="flex-1 min-h-[240px] sm:min-h-[320px] p-3 sm:p-4 flex items-center justify-center bg-slate-100 dark:bg-slate-950/70 relative overflow-hidden select-none">
          <div
            ref={containerRef}
            className="w-full max-w-[340px] sm:max-w-[400px] aspect-square relative rounded-2xl bg-white border-2 border-rose-300 shadow-md flex items-center justify-center overflow-hidden"
            style={{ backgroundColor: '#ffffff' }}
          >
            {/* Background Layer 1: Mizige Calligraphy Grid (米字格) - Authentic soft red calligraphy grid */}
            {gridType === 'mizi' && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none select-none">
                {/* Horizontal center dashed line */}
                <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#f87171" strokeWidth="1.5" strokeDasharray="6,4" strokeOpacity="0.75" />
                {/* Vertical center dashed line */}
                <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#f87171" strokeWidth="1.5" strokeDasharray="6,4" strokeOpacity="0.75" />
                {/* Diagonal dashed line 1 */}
                <line x1="0" y1="0" x2="100%" y2="100%" stroke="#fca5a5" strokeWidth="1.2" strokeDasharray="6,4" strokeOpacity="0.6" />
                {/* Diagonal dashed line 2 */}
                <line x1="100%" y1="0" x2="0" y2="100%" stroke="#fca5a5" strokeWidth="1.2" strokeDasharray="6,4" strokeOpacity="0.6" />
              </svg>
            )}

            {/* Background Layer 1: Tianzige Calligraphy Grid (田字格) - Clean red dashed cross */}
            {gridType === 'tianzi' && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none select-none">
                {/* Horizontal center dashed line */}
                <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#f87171" strokeWidth="1.5" strokeDasharray="6,4" strokeOpacity="0.75" />
                {/* Vertical center dashed line */}
                <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#f87171" strokeWidth="1.5" strokeDasharray="6,4" strokeOpacity="0.75" />
              </svg>
            )}

            {/* Optional Ghost Character Hint (Unconstrained Visual Watermark) */}
            {showGhostHint && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                <span className="text-[240px] font-chinese font-normal leading-none text-slate-300/40 select-none">
                  {activeChar}
                </span>
              </div>
            )}

            {/* Drawing Layer 2: Transparent Freehand HTML5 Canvas */}
            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={commitActiveStroke}
              onPointerCancel={commitActiveStroke}
              className={`absolute inset-0 w-full h-full touch-none select-none ${
                isEraser ? 'cursor-crosshair' : 'cursor-crosshair'
              }`}
            />
          </div>
        </div>

        {/* Bottom Toolbar: Color, Width, Eraser, Undo, Clear, Grid & Ghost Toggles */}
        <div className="px-5 py-3 border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Group 1: Colors & Widths */}
          <div className="flex items-center gap-4">
            {/* Ink Colors */}
            <div className="flex items-center gap-1.5">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setCurrentColor(c.value);
                    setIsEraser(false);
                  }}
                  className={`w-6 h-6 rounded-full ${c.twClass} transition-transform cursor-pointer ${
                    currentColor === c.value && !isEraser
                      ? 'ring-2 ring-offset-2 ring-[var(--color-primary)] scale-110'
                      : 'hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                  title={c.label}
                />
              ))}
            </div>

            <div className="h-4 w-px bg-[var(--color-border)]" />

            {/* Stroke Widths */}
            <div className="flex items-center gap-1.5">
              {STROKE_WIDTHS.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => {
                    setStrokeWidth(w.value);
                    setIsEraser(false);
                  }}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                    strokeWidth === w.value && !isEraser
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)] font-bold'
                      : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]'
                  }`}
                  title={w.label}
                >
                  <span className={`rounded-full bg-current ${w.dotSize}`} />
                </button>
              ))}
            </div>

            <div className="h-4 w-px bg-[var(--color-border)]" />

            {/* Eraser Mode */}
            <button
              type="button"
              onClick={() => setIsEraser((prev) => !prev)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                isEraser
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                  : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
              title="Tẩy nét viết"
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>Tẩy</span>
            </button>
          </div>

          {/* Group 2: Undo, Clear, Grid selector & Ghost watermark */}
          <div className="flex items-center gap-2">
            {/* Grid Type Toggle */}
            <button
              type="button"
              onClick={() => {
                setGridType((prev) =>
                  prev === 'mizi' ? 'tianzi' : prev === 'tianzi' ? 'none' : 'mizi'
                );
              }}
              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
              title="Đổi kiểu lưới kẻ ô (米字格 / 田字格 / Không lưới)"
            >
              <Grid className="w-3.5 h-3.5 text-rose-500" />
              <span>
                {gridType === 'mizi' ? 'Mễ tự (米)' : gridType === 'tianzi' ? 'Điền tự (田)' : 'Không lưới'}
              </span>
            </button>

            {/* Ghost Watermark Hint Toggle */}
            <button
              type="button"
              onClick={() => setShowGhostHint((prev) => !prev)}
              className={`p-1.5 rounded-xl border border-[var(--color-border)] transition-colors cursor-pointer ${
                showGhostHint
                  ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 border-amber-300'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
              title={showGhostHint ? 'Ẩn chữ mờ gợi ý' : 'Hiện chữ mờ gợi ý tỷ lệ'}
            >
              {showGhostHint ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>

            {/* Undo */}
            <button
              type="button"
              onClick={handleUndo}
              disabled={currentStrokes.length === 0}
              className="p-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-bg-secondary)] disabled:opacity-40 disabled:cursor-not-allowed text-[var(--color-text-primary)] transition-colors cursor-pointer"
              title="Hoàn tác nét gần nhất (Ctrl+Z)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Clear All Strokes */}
            <button
              type="button"
              onClick={handleClear}
              disabled={currentStrokes.length === 0}
              className="p-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Xóa trắng bảng viết"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
