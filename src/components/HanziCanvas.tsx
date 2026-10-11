import React, { useRef, useState, useEffect, useCallback } from 'react';
import HanziWriter from 'hanzi-writer';
import {
  RotateCcw,
  Volume2,
  Info,
  Heart,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Sparkles,
  Award,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { playChineseAudio } from '../utils/chineseAudio';
import { getCharPinyinList, getSingleCharPinyin } from '../utils/pinyinUtils';
import { getCharRadical } from '../utils/radicalUtils';
import { VoiceSettingsModal } from './VoiceSettingsModal';

export interface HanziCanvasProps {
  character?: string;
  charGuide?: string; // String or single/multi-char e.g. "谢" or "高兴"
  pinyin?: string;
  strokeCount?: number;
  radical?: string;
  size?: number;
  gridType?: 'tian' | 'mi'; // Tianzige or Mizige
  onStrokeDrawn?: () => void;
  onFavoriteToggle?: () => void;
  isFavorited?: boolean;
}

export const HanziCanvas: React.FC<HanziCanvasProps> = ({
  character = '喜',
  charGuide,
  pinyin,
  strokeCount = 12,
  radical = '士',
  size = 280,
  gridType = 'mi',
  onStrokeDrawn,
  onFavoriteToggle,
  isFavorited = false,
}) => {
  const fullText = character || charGuide || '喜';
  const characters: string[] = Array.from(fullText);
  const [selectedCharIndex, setSelectedCharIndex] = useState(0);
  const activeChar = characters[selectedCharIndex] || characters[0] || '喜';

  // Accurate Pinyin for active character
  const pinyinParts = getCharPinyinList(fullText, pinyin);
  const activePinyin =
    pinyinParts[selectedCharIndex] || getSingleCharPinyin(activeChar, fullText, selectedCharIndex) || 'xǐ';

  // Accurate Radical
  const activeRadicalInfo = getCharRadical(activeChar, radical, selectedCharIndex);

  // Reset char index on text change
  useEffect(() => {
    setSelectedCharIndex(0);
  }, [fullText]);

  // Mode: 'gif' (Vector animation) or 'practice' (HanziWriter interactive quiz)
  const [mode, setMode] = useState<'gif' | 'practice'>('gif');
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [favorited, setFavorited] = useState(isFavorited);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  // Animation Engine States
  const animContainerRef = useRef<HTMLDivElement | null>(null);
  const animWriterRef = useRef<any>(null);
  const animTimeoutRef = useRef<any>(null);
  const isPlayingRef = useRef<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [totalStrokes, setTotalStrokes] = useState<number>(strokeCount || 12);
  const totalStrokesRef = useRef<number>(strokeCount || 12);
  const [currentStroke, setCurrentStroke] = useState<number>(1);
  const currentStrokeRef = useRef<number>(1);

  // Practice / Quiz Engine States
  const quizContainerRef = useRef<HTMLDivElement | null>(null);
  const quizWriterRef = useRef<any>(null);
  const [quizProgress, setQuizProgress] = useState<number>(0);
  const [quizCompleted, setQuizCompleted] = useState<boolean>(false);
  const [charLoadError, setCharLoadError] = useState(false);

  // Sync ref
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Audio speech
  const handlePlayAudio = useCallback(() => {
    setIsAudioPlaying(true);
    playChineseAudio(activeChar);
    setTimeout(() => setIsAudioPlaying(false), 1200);
  }, [activeChar]);

  // =========================================================================
  // ANIMATION LOOP (Diễn họa nét bút thuận thực tế)
  // =========================================================================
  const runAnimationSequence = useCallback((startStroke = 0) => {
    const writer = animWriterRef.current;
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
                runAnimationSequence(nextStroke);
              }
            }, 260);
          } else {
            // Full character complete - wait 1.2s then repeat loop
            animTimeoutRef.current = setTimeout(() => {
              if (isPlayingRef.current) {
                runAnimationSequence(0);
              }
            }, 1200);
          }
        },
      });
    } catch {
      // fallback
    }
  }, []);

  const initAnimWriter = useCallback(() => {
    if (!animContainerRef.current) return;
    clearTimeout(animTimeoutRef.current);
    animContainerRef.current.innerHTML = '';
    setCharLoadError(false);
    setCurrentStroke(1);
    currentStrokeRef.current = 1;

    try {
      const writer = HanziWriter.create(animContainerRef.current, activeChar, {
        width: size - 30,
        height: size - 30,
        padding: 16,
        showOutline: true,
        strokeAnimationSpeed: 0.6,
        delayBetweenStrokes: 260,
        strokeColor: '#38BDF8', // Cyan high contrast
        radicalColor: '#10B981', // Emerald radical
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
              runAnimationSequence(0);
            }
          }
        },
        onLoadCharDataError: () => {
          setCharLoadError(true);
        },
      });

      animWriterRef.current = writer;
    } catch (err) {
      console.warn('HanziWriter animation init error', err);
      setCharLoadError(true);
    }
  }, [activeChar, size, runAnimationSequence]);

  useEffect(() => {
    if (mode === 'gif') {
      initAnimWriter();
    }
    return () => {
      clearTimeout(animTimeoutRef.current);
    };
  }, [mode, initAnimWriter]);

  const handleTogglePlay = () => {
    const writer = animWriterRef.current;
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
        currentStrokeRef.current <= totalStrokesRef.current ? currentStrokeRef.current - 1 : 0;
      runAnimationSequence(startIdx);
    }
  };

  const handleStepStroke = (direction: 'prev' | 'next') => {
    const writer = animWriterRef.current;
    if (!writer) return;

    clearTimeout(animTimeoutRef.current);
    isPlayingRef.current = false;
    setIsPlaying(false);

    let nextStroke = currentStrokeRef.current;
    if (direction === 'next') {
      nextStroke =
        currentStrokeRef.current < totalStrokesRef.current ? currentStrokeRef.current + 1 : 1;
    } else {
      nextStroke =
        currentStrokeRef.current > 1 ? currentStrokeRef.current - 1 : totalStrokesRef.current;
    }

    setCurrentStroke(nextStroke);
    currentStrokeRef.current = nextStroke;
    try {
      writer.animateStroke(nextStroke - 1);
    } catch {
      // fallback
    }
  };

  // =========================================================================
  // QUIZ PRACTICE ENGINE (Chấm nét tương tác từng nét)
  // =========================================================================
  const startQuiz = useCallback(() => {
    if (!quizContainerRef.current) return;
    quizContainerRef.current.innerHTML = '';
    setQuizProgress(0);
    setQuizCompleted(false);

    try {
      const quizWriter = HanziWriter.create(quizContainerRef.current, activeChar, {
        width: size - 30,
        height: size - 30,
        padding: 16,
        showOutline: true,
        strokeColor: '#38BDF8', // Cyan ink
        radicalColor: '#10B981',
        outlineColor: '#334155', // Slate outline
        drawingColor: '#22C55E', // Green drawing stroke
        drawingWidth: 10,
        showHintAfterMisses: 2,
        highlightOnComplete: true,
        highlightColor: '#10B981',
        onLoadCharDataSuccess: (data: any) => {
          if (data && data.strokes) {
            setTotalStrokes(data.strokes.length);
            totalStrokesRef.current = data.strokes.length;
          }
        },
      });

      quizWriterRef.current = quizWriter;

      quizWriter.quiz({
        onCorrectStroke: (strokeData: any) => {
          const nextProgress = strokeData.strokeNum + 1;
          setQuizProgress(nextProgress);
          if (onStrokeDrawn) onStrokeDrawn();
        },
        onComplete: () => {
          setQuizCompleted(true);
          setQuizProgress(totalStrokesRef.current);
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
      console.warn('HanziWriter quiz init error', err);
    }
  }, [activeChar, size, onStrokeDrawn]);

  useEffect(() => {
    if (mode === 'practice') {
      startQuiz();
    }
    return () => {
      if (quizWriterRef.current) {
        try {
          quizWriterRef.current.cancelQuiz();
        } catch {
          // ignore
        }
      }
    };
  }, [mode, startQuiz]);

  return (
    <div className="flex flex-col items-center select-none max-w-sm w-full mx-auto" id="hanzi-canvas-wrapper">
      {/* Multi-character Selector if word has > 1 characters */}
      {characters.length > 1 && (
        <div className="flex items-center gap-1.5 mb-2.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium px-1.5">Chọn chữ:</span>
          {characters.map((char, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedCharIndex(idx)}
              className={`px-2.5 py-1 rounded-lg font-chinese font-bold text-sm transition-all flex items-center gap-1 ${
                selectedCharIndex === idx
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span>{char}</span>
              <span className="text-[10px] font-mono opacity-80">({pinyinParts[idx] || ''})</span>
            </button>
          ))}
        </div>
      )}

      {/* Top Mode Segmented Switcher (Ảnh GIF vs Luyện tập) */}
      <div className="flex bg-[#1E293B] p-1 rounded-2xl border border-slate-700/60 mb-3 shadow-inner w-full max-w-[280px]">
        <button
          type="button"
          onClick={() => {
            setMode('gif');
            setIsPlaying(true);
          }}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            mode === 'gif'
              ? 'bg-slate-900 text-white shadow-md border border-slate-700/50'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Ảnh GIF</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMode('practice');
            setIsPlaying(false);
          }}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            mode === 'practice'
              ? 'bg-slate-900 text-white shadow-md border border-slate-700/50'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
          <span>Luyện tập</span>
        </button>
      </div>

      {/* Main Square Display Box */}
      <div
        className="relative bg-[#0F172A] rounded-3xl shadow-2xl overflow-hidden border-2 border-slate-700/80 group transition-all flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        {/* Tianzige / Mizige Grid Lines */}
        <div className="absolute inset-0 pointer-events-none">
          <svg className="w-full h-full stroke-emerald-500/20" xmlns="http://www.w3.org/2000/svg">
            <line x1="0" y1="50%" x2="100%" y2="50%" strokeDasharray="5,5" strokeWidth="1" />
            <line x1="50%" y1="0" x2="50%" y2="100%" strokeDasharray="5,5" strokeWidth="1" />
            {gridType === 'mi' && (
              <>
                <line x1="0" y1="0" x2="100%" y2="100%" strokeDasharray="5,5" strokeWidth="1" />
                <line x1="100%" y1="0" x2="0" y2="100%" strokeDasharray="5,5" strokeWidth="1" />
              </>
            )}
          </svg>
        </div>

        {/* TOP RIGHT: Dynamic Progressive Stroke Counter Badge (e.g. 1/12, 2/12 ... or 0/12 in practice) */}
        <div className="absolute top-3 right-3 z-20">
          <div className="px-2.5 py-1 rounded-full bg-slate-900/90 backdrop-blur-md border border-slate-700 text-slate-300 font-mono text-xs font-bold tracking-wider shadow-md flex items-center gap-1">
            <span className="text-emerald-400 text-sm">
              {mode === 'gif' ? currentStroke : quizProgress}
            </span>
            <span className="text-slate-500">/</span>
            <span className="text-slate-300">{totalStrokes}</span>
          </div>
        </div>

        {/* BOTTOM LEFT: Watermark */}
        <div className="absolute bottom-3 left-3 z-20">
          <div className="px-2 py-0.5 rounded-lg bg-slate-900/85 backdrop-blur-md border border-slate-800 text-[11px] font-mono text-slate-400 tracking-wide">
            minnese.app
          </div>
        </div>

        {/* BOTTOM RIGHT: Pinyin Phonetic Tag */}
        <div className="absolute bottom-3 right-3 z-20">
          <div className="px-2.5 py-1 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700 text-emerald-300 font-mono text-xs font-bold shadow-md">
            / {activePinyin} /
          </div>
        </div>

        {/* MODE 1: GIF / VECTOR ANIMATION CONTAINER */}
        {mode === 'gif' && (
          <div
            ref={animContainerRef}
            className="relative z-10 flex items-center justify-center transition-all select-none [&_svg]:max-w-full [&_svg]:max-h-full"
          />
        )}

        {/* MODE 2: INTERACTIVE PRACTICE QUIZ CONTAINER */}
        {mode === 'practice' && (
          <div
            ref={quizContainerRef}
            className="relative z-10 flex items-center justify-center transition-all cursor-crosshair select-none [&_svg]:max-w-full [&_svg]:max-h-full"
          />
        )}

        {/* Fallback Display if error */}
        {charLoadError && (
          <div className="absolute inset-0 flex items-center justify-center text-6xl font-chinese text-emerald-400 font-bold">
            {activeChar}
          </div>
        )}
      </div>

      {/* Completion Toast in Practice Mode */}
      {mode === 'practice' && quizCompleted && (
        <div className="mt-3 w-full max-w-[280px] p-3 rounded-2xl bg-emerald-500 text-white shadow-xl space-y-1 text-center animate-in zoom-in-95">
          <Award className="w-6 h-6 mx-auto text-amber-300" />
          <h4 className="font-bold text-xs">
            Xuất sắc! Bạn đã hoàn thành đúng {totalStrokes} nét của chữ {activeChar}
          </h4>
        </div>
      )}

      {/* BOTTOM CONTROL BAR */}
      <div className="flex items-center justify-between gap-2 mt-3 w-full max-w-[280px]">
        {/* 1. Pronunciation Speaker Button */}
        <button
          type="button"
          onClick={handlePlayAudio}
          className={`p-2.5 rounded-xl border transition-all ${
            isAudioPlaying
              ? 'bg-emerald-500 text-white border-emerald-400 shadow-md scale-105'
              : 'bg-[#1E293B] hover:bg-slate-700 text-slate-200 border-slate-700 shadow-sm'
          }`}
          title="Nghe phát âm chuẩn"
        >
          <Volume2 className="w-4 h-4" />
        </button>

        {/* 2. Character Details Info Button */}
        <button
          type="button"
          onClick={() => setShowInfo(!showInfo)}
          className="p-2.5 rounded-xl bg-[#1E293B] hover:bg-slate-700 text-slate-300 border border-slate-700 shadow-sm transition-all"
          title="Thông tin chi tiết"
        >
          <Info className="w-4 h-4" />
        </button>

        {/* 3. Favorite Button */}
        <button
          type="button"
          onClick={() => {
            setFavorited(!favorited);
            if (onFavoriteToggle) onFavoriteToggle();
          }}
          className={`p-2.5 rounded-xl border transition-all ${
            favorited
              ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-sm'
              : 'bg-[#1E293B] hover:bg-slate-700 text-slate-400 hover:text-rose-300 border-slate-700 shadow-sm'
          }`}
          title="Lưu từ vựng"
        >
          <Heart className={`w-4 h-4 ${favorited ? 'fill-rose-400 text-rose-400' : ''}`} />
        </button>

        {/* 4. Controls depending on Mode */}
        {mode === 'gif' ? (
          <div className="flex items-center gap-1 pl-1 border-l border-slate-700">
            <button
              type="button"
              onClick={() => handleStepStroke('prev')}
              className="p-2 rounded-lg bg-[#1E293B] hover:bg-slate-700 text-slate-300 border border-slate-700"
              title="Lùi 1 nét"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleTogglePlay}
              className="px-2.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-sm text-xs flex items-center gap-1"
              title={isPlaying ? 'Tạm dừng' : 'Chạy nét'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={() => handleStepStroke('next')}
              className="p-2 rounded-lg bg-[#1E293B] hover:bg-slate-700 text-slate-300 border border-slate-700"
              title="Tiến 1 nét"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={startQuiz}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
            title="Làm lại từ đầu"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Làm lại</span>
          </button>
        )}
      </div>

      {/* Info Drawer */}
      {showInfo && (
        <div className="mt-3 p-3 rounded-2xl bg-slate-900 border border-slate-700 text-left w-full max-w-[280px] shadow-xl text-xs space-y-1.5 animate-in fade-in">
          <div className="flex justify-between items-center text-slate-400 text-[10px]">
            <span>Chữ & Phiên âm:</span>
            <span className="font-bold text-emerald-400 text-xs">
              {activeChar} ({activePinyin})
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-400 text-[10px]">
            <span>Bộ thủ:</span>
            <span className="font-bold text-slate-200">{activeRadicalInfo.fullDisplay}</span>
          </div>
          <div className="flex justify-between items-center text-slate-400 text-[10px]">
            <span>Tổng nét chuẩn:</span>
            <span className="font-mono font-bold text-emerald-300">{totalStrokes} nét</span>
          </div>
        </div>
      )}

      {/* Voice Settings Modal */}
      <VoiceSettingsModal isOpen={showVoiceModal} onClose={() => setShowVoiceModal(false)} />
    </div>
  );
};
