import React, { useState, useRef, useEffect, useCallback } from 'react';
import HanziWriter from 'hanzi-writer';
import {
  Volume2,
  Info,
  Heart,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Eraser,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  Edit3,
  PenTool,
  Award,
  Zap,
  HelpCircle,
  Flame,
  Sliders,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { WordItem } from '../types';
import { playChineseAudio } from '../utils/chineseAudio';
import { getCharPinyinList, getSingleCharPinyin } from '../utils/pinyinUtils';
import { getCharRadical } from '../utils/radicalUtils';
import { VoiceSettingsModal } from './VoiceSettingsModal';

interface HanziStrokeStudioProps {
  word: WordItem;
  isFavorited?: boolean;
  onFavoriteToggle?: () => void;
  onClose?: () => void;
}

export const HanziStrokeStudio: React.FC<HanziStrokeStudioProps> = ({
  word,
  isFavorited = false,
  onFavoriteToggle,
}) => {
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  // If multi-character word (e.g. "高兴", "认识", "生活"), split into individual characters
  const characters: string[] = word.hanzi ? Array.from(word.hanzi) : ['喜'];
  const [selectedCharIndex, setSelectedCharIndex] = useState(0);
  const activeChar: string = characters[selectedCharIndex] || characters[0] || '喜';

  // Calculate 100% accurate pinyin parts for each individual character using pinyin-pro
  const pinyinParts: string[] = getCharPinyinList(word.hanzi, word.pinyin);
  const activePinyin: string =
    pinyinParts[selectedCharIndex] || getSingleCharPinyin(activeChar, word.hanzi, selectedCharIndex) || 'xǐ';

  // Calculate 100% accurate Kangxi radical for the active selected character
  const activeRadicalInfo = getCharRadical(activeChar, word.radical, selectedCharIndex);

  // Reset selectedCharIndex when word changes
  useEffect(() => {
    setSelectedCharIndex(0);
  }, [word.id, word.hanzi]);

  // LEFT PANEL: HanziWriter Animated SVG Engine
  const leftWriterContainerRef = useRef<HTMLDivElement | null>(null);
  const leftWriterInstanceRef = useRef<any>(null);
  const animTimeoutRef = useRef<any>(null);
  const isPlayingRef = useRef<boolean>(true);
  const animSpeedRef = useRef<number>(0.6);
  const totalStrokesRef = useRef<number>(word.strokeCount || 12);
  const currentStrokeRef = useRef<number>(1);

  const [totalStrokes, setTotalStrokes] = useState<number>(word.strokeCount || 12);
  const [currentStroke, setCurrentStroke] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const animSpeed = 0.6; // Fixed optimal stroke speed 0.6x
  const [highlightRadical, setHighlightRadical] = useState<boolean>(true);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [favorited, setFavorited] = useState(isFavorited);
  const [charLoadError, setCharLoadError] = useState(false);

  // RIGHT PANEL: Practice Modes ('quiz' for step-by-step guided HanziWriter quiz, 'freehand' for whiteboard canvas)
  const [rightPracticeMode, setRightPracticeMode] = useState<'quiz' | 'freehand'>('quiz');

  // Quiz Mode State
  const rightQuizContainerRef = useRef<HTMLDivElement | null>(null);
  const rightQuizInstanceRef = useRef<any>(null);
  const [quizStrokeProgress, setQuizStrokeProgress] = useState<number>(0);
  const [quizMistakes, setQuizMistakes] = useState<number>(0);
  const [quizCompleted, setQuizCompleted] = useState<boolean>(false);

  // Freehand Canvas State
  const freehandCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState<string>('#0F172A');
  const [brushSize, setBrushSize] = useState<number>(8);
  const [showGhostGuide, setShowGhostGuide] = useState(true);
  const [freehandDrawnStrokes, setFreehandDrawnStrokes] = useState(0);
  const freehandHistoryRef = useRef<ImageData[]>([]);

  // Sync ref
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    animSpeedRef.current = animSpeed;
  }, [animSpeed]);

  // Sound playback
  const handlePronounce = useCallback(() => {
    setIsAudioPlaying(true);
    playChineseAudio(activeChar);
    setTimeout(() => setIsAudioPlaying(false), 1200);
  }, [activeChar]);

  // Sequential stroke animation loop
  const runStrokeAnimationSequence = useCallback((startStroke = 0) => {
    const writer = leftWriterInstanceRef.current;
    if (!writer) return;

    clearTimeout(animTimeoutRef.current);

    if (startStroke === 0) {
      try {
        writer.hideCharacter();
        writer.showOutline();
      } catch {
        // ignore
      }
    }

    const currentNum = startStroke + 1;
    setCurrentStroke(currentNum);
    currentStrokeRef.current = currentNum;

    try {
      writer.animateStroke(startStroke, {
        onComplete: () => {
          if (!isPlayingRef.current) return;
          const nextStroke = startStroke + 1;
          const total = totalStrokesRef.current;
          if (nextStroke < total) {
            animTimeoutRef.current = setTimeout(() => {
              if (isPlayingRef.current) {
                runStrokeAnimationSequence(nextStroke);
              }
            }, 260 / animSpeedRef.current);
          } else {
            // Completed full character: wait 1.3s, then loop from stroke 1
            animTimeoutRef.current = setTimeout(() => {
              if (isPlayingRef.current) {
                runStrokeAnimationSequence(0);
              }
            }, 1300);
          }
        },
      });
    } catch {
      // fallback
    }
  }, []);

  // ==========================================
  // INITIALIZE LEFT ANIMATED HANZI WRITER
  // ==========================================
  const initLeftWriter = useCallback(() => {
    if (!leftWriterContainerRef.current) return;
    clearTimeout(animTimeoutRef.current);
    leftWriterContainerRef.current.innerHTML = '';
    setCharLoadError(false);
    setCurrentStroke(1);
    currentStrokeRef.current = 1;

    try {
      const writer = HanziWriter.create(leftWriterContainerRef.current, activeChar, {
        width: 260,
        height: 260,
        padding: 18,
        showOutline: true,
        strokeAnimationSpeed: animSpeed,
        delayBetweenStrokes: 260,
        strokeColor: '#38BDF8', // Cyan high-contrast stroke
        radicalColor: highlightRadical ? '#10B981' : '#38BDF8', // Emerald radical
        outlineColor: '#334155', // Slate outline
        showCharacter: false,
        onLoadCharDataSuccess: (data: any) => {
          if (data && data.strokes) {
            const count = data.strokes.length;
            setTotalStrokes(count);
            totalStrokesRef.current = count;
            setCurrentStroke(1);
            currentStrokeRef.current = 1;
            if (isPlayingRef.current) {
              runStrokeAnimationSequence(0);
            }
          }
        },
        onLoadCharDataError: () => {
          setCharLoadError(true);
        },
      });

      leftWriterInstanceRef.current = writer;
    } catch (e) {
      console.warn('HanziWriter init error', e);
      setCharLoadError(true);
    }
  }, [activeChar, animSpeed, highlightRadical, runStrokeAnimationSequence]);

  useEffect(() => {
    initLeftWriter();
    return () => {
      clearTimeout(animTimeoutRef.current);
      if (leftWriterInstanceRef.current) {
        try {
          leftWriterInstanceRef.current.cancelQuiz();
        } catch {
          // ignore
        }
      }
    };
  }, [initLeftWriter]);

  // Handle Left Animation Controls
  const handleTogglePlay = () => {
    const writer = leftWriterInstanceRef.current;
    if (!writer) return;

    if (isPlaying) {
      clearTimeout(animTimeoutRef.current);
      try {
        writer.pauseAnimation();
      } catch {
        // ignore
      }
      isPlayingRef.current = false;
      setIsPlaying(false);
    } else {
      isPlayingRef.current = true;
      setIsPlaying(true);
      const startIdx =
        currentStrokeRef.current <= totalStrokesRef.current
          ? currentStrokeRef.current - 1
          : 0;
      runStrokeAnimationSequence(startIdx);
    }
  };

  const handleStepStroke = (direction: 'prev' | 'next') => {
    const writer = leftWriterInstanceRef.current;
    if (!writer) return;

    clearTimeout(animTimeoutRef.current);
    isPlayingRef.current = false;
    setIsPlaying(false);

    let nextStroke = currentStrokeRef.current;
    if (direction === 'next') {
      nextStroke =
        currentStrokeRef.current < totalStrokesRef.current
          ? currentStrokeRef.current + 1
          : 1;
    } else {
      nextStroke =
        currentStrokeRef.current > 1
          ? currentStrokeRef.current - 1
          : totalStrokesRef.current;
    }

    setCurrentStroke(nextStroke);
    currentStrokeRef.current = nextStroke;
    try {
      writer.animateStroke(nextStroke - 1);
    } catch {
      // fallback
    }
  };

  // ==========================================
  // INITIALIZE RIGHT QUIZ / TRACING ENGINE
  // ==========================================
  const startQuizMode = useCallback(() => {
    if (!rightQuizContainerRef.current) return;
    rightQuizContainerRef.current.innerHTML = '';
    setQuizStrokeProgress(0);
    setQuizMistakes(0);
    setQuizCompleted(false);

    try {
      const quizWriter = HanziWriter.create(rightQuizContainerRef.current, activeChar, {
        width: 260,
        height: 260,
        padding: 18,
        showOutline: true,
        strokeColor: '#38BDF8', // Cyan high-contrast stroke
        radicalColor: '#10B981', // Emerald radical
        outlineColor: '#334155', // Slate outline
        drawingColor: '#22C55E', // Green drawing stroke
        drawingWidth: 10,
        showHintAfterMisses: 2,
        highlightOnComplete: true,
        highlightColor: '#10B981',
      });

      rightQuizInstanceRef.current = quizWriter;

      quizWriter.quiz({
        onCorrectStroke: (strokeData: any) => {
          setQuizStrokeProgress(strokeData.strokeNum + 1);
        },
        onMistake: () => {
          setQuizMistakes((prev) => prev + 1);
        },
        onComplete: () => {
          setQuizCompleted(true);
          try {
            confetti({
              particleCount: 50,
              spread: 60,
              origin: { y: 0.6 },
            });
          } catch {
            // ignore
          }
        },
      });
    } catch (err) {
      console.warn('Quiz init error', err);
    }
  }, [activeChar]);

  useEffect(() => {
    if (rightPracticeMode === 'quiz') {
      startQuizMode();
    }
  }, [rightPracticeMode, activeChar, startQuizMode]);

  // ==========================================
  // FREEHAND WHITEBOARD CANVAS ENGINE
  // ==========================================
  const drawFreehandGrid = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);

      // Red/Coral Chinese calligraphy Grid Guidelines
      ctx.strokeStyle = '#FCA5A5';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(4, 4, width - 8, height - 8);

      ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      // Horizontal & Vertical Center Lines
      ctx.beginPath();
      ctx.moveTo(4, height / 2);
      ctx.lineTo(width - 4, height / 2);
      ctx.moveTo(width / 2, 4);
      ctx.lineTo(width / 2, height - 4);
      ctx.stroke();

      // Diagonals
      ctx.beginPath();
      ctx.moveTo(4, 4);
      ctx.lineTo(width - 4, height - 4);
      ctx.moveTo(width - 4, 4);
      ctx.lineTo(4, height - 4);
      ctx.stroke();

      ctx.setLineDash([]);
    },
    []
  );

  useEffect(() => {
    if (rightPracticeMode !== 'freehand') return;
    const canvas = freehandCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawFreehandGrid(ctx, canvas.width, canvas.height);
    freehandHistoryRef.current = [ctx.getImageData(0, 0, canvas.width, canvas.height)];
    setFreehandDrawnStrokes(0);
  }, [rightPracticeMode, drawFreehandGrid, activeChar]);

  const getCanvasCoords = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = freehandCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
  };

  const startFreehandDraw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    e.preventDefault();
    const canvas = freehandCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setIsDrawing(true);
  };

  const drawFreehand = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = freehandCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopFreehandDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = freehandCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    freehandHistoryRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    setFreehandDrawnStrokes((prev) => prev + 1);
  };

  const clearFreehand = () => {
    const canvas = freehandCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawFreehandGrid(ctx, canvas.width, canvas.height);
    freehandHistoryRef.current = [ctx.getImageData(0, 0, canvas.width, canvas.height)];
    setFreehandDrawnStrokes(0);
  };

  const undoFreehand = () => {
    const canvas = freehandCanvasRef.current;
    if (!canvas || freehandHistoryRef.current.length <= 1) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    freehandHistoryRef.current.pop();
    const prevData = freehandHistoryRef.current[freehandHistoryRef.current.length - 1];
    ctx.putImageData(prevData, 0, 0);
    setFreehandDrawnStrokes((prev) => Math.max(0, prev - 1));
  };

  return (
    <div className="w-full space-y-4 select-none" id="hanzi-stroke-studio">
      {/* Top Multi-character selector if word has > 1 character */}
      {characters.length > 1 && (
        <div className="flex items-center justify-center gap-2">
          <span className="text-xs font-medium text-[var(--color-text-secondary)]">
            Chọn chữ Hán:
          </span>
          <div className="inline-flex p-1 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] gap-1">
            {characters.map((char, idx) => {
              const pinyinForChar = pinyinParts[idx] || activePinyin;
              const isSelected = selectedCharIndex === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedCharIndex(idx)}
                  className={`px-3 py-1 rounded-lg font-chinese font-bold text-sm transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--color-primary)] text-white shadow-xs'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]'
                  }`}
                >
                  <span className="text-base">{char}</span>
                  <span className="text-xs font-mono font-normal opacity-90">({pinyinForChar})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* DUAL-PANEL LAYOUT (Matching, Unified Visual Identity) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
        {/* ======================================================== */}
        {/* LEFT COLUMN: ANIMATED REAL STROKE ORDER */}
        {/* ======================================================== */}
        <div className="flex flex-col items-center bg-[var(--color-background)] rounded-2xl p-4 border border-[var(--color-border)] shadow-xs relative">
          {/* Header */}
          <div className="w-full flex items-center justify-between gap-2 mb-3 border-b border-[var(--color-border)] pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-xs sm:text-sm font-bold text-[var(--color-text-primary)] tracking-tight">
                Diễn họa nét chuẩn
              </h3>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setHighlightRadical(!highlightRadical)}
                className={`px-2 py-0.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  highlightRadical
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)]'
                }`}
                title="Tô màu phân biệt bộ thủ"
              >
                Bộ: {activeRadicalInfo.shortDisplay}
              </button>
              {characters.length > 1 && (
                <span className="px-1.5 py-0.5 rounded-md bg-[var(--color-surface)] text-[10px] font-mono text-[var(--color-text-secondary)] border border-[var(--color-border)]">
                  {selectedCharIndex + 1}/{characters.length}
                </span>
              )}
            </div>
          </div>

          {/* MAIN SQUARE ANIMATED BOX */}
          <div className="relative w-[240px] h-[240px] bg-[#0F172A] rounded-2xl overflow-hidden border border-slate-700/80 shadow-inner flex items-center justify-center">
            {/* Mizige Grid Lines */}
            <div className="absolute inset-0 pointer-events-none">
              <svg className="w-full h-full stroke-emerald-500/20" xmlns="http://www.w3.org/2000/svg">
                <line x1="0" y1="50%" x2="100%" y2="50%" strokeDasharray="4 4" strokeWidth="1" />
                <line x1="50%" y1="0" x2="50%" y2="100%" strokeDasharray="4 4" strokeWidth="1" />
                <line x1="0" y1="0" x2="100%" y2="100%" strokeDasharray="4 4" strokeWidth="1" />
                <line x1="100%" y1="0" x2="0" y2="100%" strokeDasharray="4 4" strokeWidth="1" />
              </svg>
            </div>

            {/* TOP RIGHT: Stroke Counter Badge */}
            <div className="absolute top-2 right-2 z-20">
              <div className="px-2 py-0.5 rounded-full bg-slate-900/90 backdrop-blur-xs border border-slate-700 text-slate-300 font-mono text-xs font-bold flex items-center gap-1 shadow-xs">
                <span className="text-emerald-400">{currentStroke}</span>
                <span className="text-slate-500">/</span>
                <span className="text-slate-300">{totalStrokes}</span>
              </div>
            </div>

            {/* BOTTOM LEFT: Watermark */}
            <div className="absolute bottom-2 left-2 z-20">
              <div className="px-1.5 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs border border-slate-800 text-[10px] font-mono text-slate-400">
                minnese
              </div>
            </div>

            {/* BOTTOM RIGHT: Pinyin Phonetic Tag */}
            <div className="absolute bottom-2 right-2 z-20">
              <div className="px-2 py-0.5 rounded-md bg-slate-900/90 backdrop-blur-xs border border-slate-700 text-emerald-300 font-mono text-xs font-bold shadow-xs">
                /{activePinyin}/
              </div>
            </div>

            {/* HanziWriter Animated Container */}
            <div
              ref={leftWriterContainerRef}
              className="relative z-10 flex items-center justify-center select-none [&_svg]:max-w-full [&_svg]:max-h-full"
            />

            {/* Fallback Display if Offline/Data Load Error */}
            {charLoadError && (
              <div className="absolute inset-0 flex items-center justify-center text-6xl font-chinese text-emerald-400 font-bold">
                {activeChar}
              </div>
            )}
          </div>

          {/* CONTROLS TOOLBAR */}
          <div className="w-[240px] flex items-center justify-between gap-1 mt-3">
            {/* Quick Actions */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePronounce}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                  isAudioPlaying
                    ? 'bg-emerald-500 text-white border-emerald-400'
                    : 'bg-[var(--color-surface)] hover:bg-[var(--color-border)]/50 text-[var(--color-text-secondary)] border-[var(--color-border)]'
                }`}
                title="Nghe phát âm chuẩn"
              >
                <Volume2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setShowVoiceModal(true)}
                className="p-1.5 rounded-lg bg-[var(--color-surface)] hover:bg-[var(--color-border)]/50 text-[var(--color-text-secondary)] border border-[var(--color-border)] transition-all cursor-pointer"
                title="Cài đặt giọng đọc & tốc độ"
              >
                <Sliders className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setShowInfo(!showInfo)}
                className="p-1.5 rounded-lg bg-[var(--color-surface)] hover:bg-[var(--color-border)]/50 text-[var(--color-text-secondary)] border border-[var(--color-border)] transition-all cursor-pointer"
                title="Thông tin chi tiết chữ"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>

            {/* Stepper Controls */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleStepStroke('prev')}
                className="p-1.5 rounded-lg bg-[var(--color-surface)] hover:bg-[var(--color-border)]/50 text-[var(--color-text-primary)] border border-[var(--color-border)] cursor-pointer"
                title="Lùi 1 nét"
              >
                <SkipBack className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleTogglePlay}
                className="px-2.5 py-1.5 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                title={isPlaying ? 'Tạm dừng' : 'Chạy tự động'}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? 'Dừng' : 'Phát'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleStepStroke('next')}
                className="p-1.5 rounded-lg bg-[var(--color-surface)] hover:bg-[var(--color-border)]/50 text-[var(--color-text-primary)] border border-[var(--color-border)] cursor-pointer"
                title="Tiến 1 nét"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Info Drawer */}
          {showInfo && (
            <div className="mt-3 p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-left w-full shadow-xs text-xs space-y-1.5 animate-in fade-in">
              <div className="grid grid-cols-2 gap-2 text-[var(--color-text-secondary)]">
                <div>
                  <span className="text-[10px] block opacity-70">Chữ Hán:</span>
                  <span className="font-bold text-[var(--color-primary)] text-xs">
                    {activeChar} ({activePinyin})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] block opacity-70">Cấp độ:</span>
                  <span className="font-bold text-[var(--color-text-primary)] text-xs">HSK {word.hskLevel}</span>
                </div>
                <div>
                  <span className="text-[10px] block opacity-70">Bộ thủ:</span>
                  <span className="font-bold text-[var(--color-text-primary)] text-xs">{activeRadicalInfo.fullDisplay}</span>
                </div>
                <div>
                  <span className="text-[10px] block opacity-70">Tổng nét:</span>
                  <span className="font-mono font-bold text-[var(--color-primary)] text-xs">{totalStrokes} nét</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: PRACTICE CANVAS & INTERACTIVE QUIZ */}
        {/* ======================================================== */}
        <div className="flex flex-col items-center bg-[var(--color-background)] rounded-2xl p-4 border border-[var(--color-border)] shadow-xs relative">
          {/* Header Mode Switcher */}
          <div className="w-full flex items-center justify-between gap-2 mb-3 border-b border-[var(--color-border)] pb-2.5">
            <div className="flex bg-[var(--color-surface)] p-0.5 rounded-lg border border-[var(--color-border)]">
              <button
                type="button"
                onClick={() => setRightPracticeMode('quiz')}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  rightPracticeMode === 'quiz'
                    ? 'bg-[var(--color-primary)] text-white shadow-xs'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Chấm nét</span>
              </button>
              <button
                type="button"
                onClick={() => setRightPracticeMode('freehand')}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  rightPracticeMode === 'freehand'
                    ? 'bg-[var(--color-primary)] text-white shadow-xs'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Tự do</span>
              </button>
            </div>

            {rightPracticeMode === 'quiz' ? (
              <span className="text-xs text-[var(--color-text-secondary)] font-mono px-2 py-0.5 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)]">
                Đã viết: <strong className="text-emerald-500">{quizStrokeProgress}</strong>/{totalStrokes} nét
              </span>
            ) : (
              <span className="text-xs text-[var(--color-text-secondary)] font-mono px-2 py-0.5 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)]">
                Số nét: <strong className="text-[var(--color-primary)]">{freehandDrawnStrokes}</strong>
              </span>
            )}
          </div>

          {/* MODE 1: INTERACTIVE HANZI WRITER QUIZ CANVAS */}
          {rightPracticeMode === 'quiz' && (
            <div className="flex flex-col items-center w-full">
              <div className="relative w-[240px] h-[240px] bg-[#0F172A] rounded-2xl overflow-hidden border border-slate-700/80 shadow-inner flex items-center justify-center">
                {/* Mizige Grid Lines */}
                <div className="absolute inset-0 pointer-events-none">
                  <svg className="w-full h-full stroke-emerald-500/20" xmlns="http://www.w3.org/2000/svg">
                    <line x1="0" y1="50%" x2="100%" y2="50%" strokeDasharray="4 4" strokeWidth="1" />
                    <line x1="50%" y1="0" x2="50%" y2="100%" strokeDasharray="4 4" strokeWidth="1" />
                    <line x1="0" y1="0" x2="100%" y2="100%" strokeDasharray="4 4" strokeWidth="1" />
                    <line x1="100%" y1="0" x2="0" y2="100%" strokeDasharray="4 4" strokeWidth="1" />
                  </svg>
                </div>

                {/* TOP RIGHT: Progressive Stroke Counter Badge */}
                <div className="absolute top-2 right-2 z-20">
                  <div className="px-2 py-0.5 rounded-full bg-slate-900/90 backdrop-blur-xs border border-slate-700 text-slate-300 font-mono text-xs font-bold flex items-center gap-1 shadow-xs">
                    <span className="text-emerald-400">{quizStrokeProgress}</span>
                    <span className="text-slate-500">/</span>
                    <span className="text-slate-300">{totalStrokes}</span>
                  </div>
                </div>

                {/* BOTTOM LEFT: Watermark */}
                <div className="absolute bottom-2 left-2 z-20">
                  <div className="px-1.5 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs border border-slate-800 text-[10px] font-mono text-slate-400">
                    minnese
                  </div>
                </div>

                {/* BOTTOM RIGHT: Pinyin Tag */}
                <div className="absolute bottom-2 right-2 z-20">
                  <div className="px-2 py-0.5 rounded-md bg-slate-900/90 backdrop-blur-xs border border-slate-700 text-emerald-300 font-mono text-xs font-bold shadow-xs">
                    /{activePinyin}/
                  </div>
                </div>

                {/* Quiz Target DOM */}
                <div
                  ref={rightQuizContainerRef}
                  className="relative z-10 flex items-center justify-center cursor-crosshair select-none [&_svg]:max-w-full [&_svg]:max-h-full"
                />
              </div>

              {/* Quiz Control Tools */}
              <div className="flex items-center justify-between gap-2 mt-3 w-[240px]">
                <div className="flex items-center gap-1 text-[11px] text-[var(--color-text-secondary)]">
                  <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Vẽ từng nét theo thứ tự</span>
                </div>

                <button
                  type="button"
                  onClick={startQuizMode}
                  className="px-2.5 py-1.5 rounded-lg bg-[var(--color-surface)] hover:bg-[var(--color-border)]/50 text-[var(--color-text-primary)] border border-[var(--color-border)] text-xs font-medium flex items-center gap-1 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Làm lại</span>
                </button>
              </div>

              {/* Completion Celebration Card */}
              {quizCompleted && (
                <div className="mt-2.5 w-[240px] p-2.5 rounded-xl bg-emerald-500 text-white shadow-sm space-y-0.5 text-center animate-in zoom-in-95">
                  <Award className="w-5 h-5 mx-auto text-amber-300" />
                  <h4 className="font-bold text-xs">Xuất sắc! Viết đúng {totalStrokes} nét chữ {activeChar}</h4>
                </div>
              )}
            </div>
          )}

          {/* MODE 2: FREEHAND WHITEBOARD CANVAS */}
          {rightPracticeMode === 'freehand' && (
            <div className="flex flex-col items-center w-full">
              <div className="relative w-[240px] h-[240px] bg-white rounded-2xl overflow-hidden border border-[var(--color-border)] shadow-inner flex items-center justify-center">
                {/* Ghost Character Guide Overlay */}
                {showGhostGuide && (
                  <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none text-rose-400 font-chinese select-none"
                    style={{
                      fontSize: '140px',
                      lineHeight: 1,
                      opacity: 0.18,
                    }}
                  >
                    {activeChar}
                  </div>
                )}

                {/* Drawing Canvas */}
                <canvas
                  ref={freehandCanvasRef}
                  width={240}
                  height={240}
                  onMouseDown={startFreehandDraw}
                  onMouseMove={drawFreehand}
                  onMouseUp={stopFreehandDraw}
                  onMouseLeave={stopFreehandDraw}
                  onTouchStart={startFreehandDraw}
                  onTouchMove={drawFreehand}
                  onTouchEnd={stopFreehandDraw}
                  className="cursor-crosshair touch-none relative z-10 w-full h-full"
                />
              </div>

              {/* Freehand Tool Palette */}
              <div className="flex items-center justify-between gap-1 mt-3 w-[240px]">
                {/* Colors */}
                <div className="flex items-center gap-1 p-0.5 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
                  {[
                    { color: '#0F172A', label: 'Đen' },
                    { color: '#059669', label: 'Xanh ngọc' },
                    { color: '#0284C7', label: 'Xanh dương' },
                    { color: '#DC2626', label: 'Đỏ' },
                  ].map((c) => (
                    <button
                      key={c.color}
                      type="button"
                      onClick={() => setBrushColor(c.color)}
                      style={{ backgroundColor: c.color }}
                      className={`w-3.5 h-3.5 rounded-md transition-transform cursor-pointer ${
                        brushColor === c.color ? 'scale-125 ring-2 ring-[var(--color-primary)]' : 'opacity-80'
                      }`}
                      title={c.label}
                    />
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowGhostGuide(!showGhostGuide)}
                    className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                      showGhostGuide
                        ? 'bg-rose-500/10 text-rose-600 border-rose-300'
                        : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)]'
                    }`}
                    title="Bật/tắt nét mờ hướng dẫn"
                  >
                    {showGhostGuide ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={undoFreehand}
                    disabled={freehandHistoryRef.current.length <= 1}
                    className="p-1.5 rounded-lg bg-[var(--color-surface)] hover:bg-[var(--color-border)]/50 text-[var(--color-text-primary)] border border-[var(--color-border)] disabled:opacity-40 cursor-pointer"
                    title="Hoàn tác nét vẽ"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={clearFreehand}
                    className="p-1.5 rounded-lg bg-[var(--color-surface)] hover:bg-rose-500/10 text-rose-500 border border-[var(--color-border)] cursor-pointer"
                    title="Xóa làm lại"
                  >
                    <Eraser className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Voice Settings Modal */}
      <VoiceSettingsModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
      />
    </div>
  );
};

