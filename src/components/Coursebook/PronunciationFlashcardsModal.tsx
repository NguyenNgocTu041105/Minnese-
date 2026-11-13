import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Mic,
  Volume2,
  RotateCw,
  Check,
  CheckCircle2,
  AlertCircle,
  X,
  Shuffle,
  ChevronRight,
  ArrowRight,
  Trophy,
  Keyboard,
} from 'lucide-react';
import { WordItem, HSKLevel } from '../../types';
import { evaluateSpeechPronunciation, EvalResult } from '../../utils/pronunciationEval';
import { playChineseAudio, stopChineseAudio } from '../../utils/chineseAudio';
import { shuffleArray } from '../../utils/shuffleUtils';
import { formatPartOfSpeechVietnamese } from '../../utils/radicalUtils';

export interface PronunciationFlashcardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  words: WordItem[];
  lessonNumber?: number;
  hskLevel?: HSKLevel;
  lessonTitle?: string;
  initialRandomize?: boolean;
}

export type SpeechUIStatus =
  | 'idle'
  | 'listening'
  | 'evaluating'
  | 'correct'
  | 'incorrect';

/**
 * Pronunciation Flashcards Modal with Speech Recognition and FIFO Retry Queuing
 * Requirements R3 and R5 Implementation
 */
export const PronunciationFlashcardsModal: React.FC<PronunciationFlashcardsModalProps> = ({
  isOpen,
  onClose,
  words,
  lessonNumber,
  hskLevel = 1,
  lessonTitle,
  initialRandomize = false,
}) => {
  // Session Queue State
  const [queue, setQueue] = useState<WordItem[]>([]);
  const [completedWords, setCompletedWords] = useState<WordItem[]>([]);
  const [totalInitialCount, setTotalInitialCount] = useState<number>(0);
  const [isRandomized, setIsRandomized] = useState<boolean>(initialRandomize);

  // Card & Interaction State
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [status, setStatus] = useState<SpeechUIStatus>('idle');
  const [evalResult, setEvalResult] = useState<EvalResult | null>(null);
  const [totalAttempts, setTotalAttempts] = useState<number>(0);
  const [attemptsPerWord, setAttemptsPerWord] = useState<Record<string, number>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Manual Fallback Input State
  const [showManualInput, setShowManualInput] = useState<boolean>(false);
  const [manualInputValue, setManualInputValue] = useState<string>('');
  const [isSpeechSupported, setIsSpeechSupported] = useState<boolean>(true);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const lastLiveTranscriptRef = useRef<string>('');

  // Timers & Recognition refs
  const recognitionRef = useRef<any>(null);
  const autoAdvanceTimerRef = useRef<any>(null);
  const correctAdvanceTimerRef = useRef<any>(null);

  const currentWord: WordItem | null = queue.length > 0 ? queue[0] : null;
  const isSessionCompleted = totalInitialCount > 0 && queue.length === 0;

  // Initialize or reset session when modal opens or words change
  useEffect(() => {
    if (isOpen && words && words.length > 0) {
      const initialQueue = initialRandomize ? shuffleArray(words) : [...words];
      setIsRandomized(initialRandomize);
      setQueue(initialQueue);
      setCompletedWords([]);
      setTotalInitialCount(words.length);
      setIsFlipped(false);
      setStatus('idle');
      setEvalResult(null);
      setTotalAttempts(0);
      setAttemptsPerWord({});
      setErrorMessage(null);
      setShowManualInput(false);
      setManualInputValue('');
      setLiveTranscript('');
      lastLiveTranscriptRef.current = '';
    }
  }, [isOpen, words, initialRandomize]);

  // Check Web Speech API availability
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasSpeech = Boolean(
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      );
      setIsSpeechSupported(hasSpeech);
      if (!hasSpeech) {
        setShowManualInput(true);
      }
    }
  }, []);

  // Cleanup on unmount or close
  const cleanupSession = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    if (correctAdvanceTimerRef.current) {
      clearTimeout(correctAdvanceTimerRef.current);
      correctAdvanceTimerRef.current = null;
    }
    setLiveTranscript('');
    lastLiveTranscriptRef.current = '';
    stopChineseAudio();
  }, []);

  useEffect(() => {
    if (!isOpen) {
      cleanupSession();
    }
    return () => {
      cleanupSession();
    };
  }, [isOpen, cleanupSession]);

  // Handle Speech Evaluation Progression & FIFO Retry Queuing
  const handleProcessSpeech = useCallback(
    (transcript: string) => {
      if (!currentWord) return;

      setLiveTranscript('');
      lastLiveTranscriptRef.current = '';

      setTotalAttempts((prev) => prev + 1);
      setAttemptsPerWord((prev) => ({
        ...prev,
        [currentWord.id]: (prev[currentWord.id] || 0) + 1,
      }));

      setStatus('evaluating');
      const result = evaluateSpeechPronunciation(transcript, currentWord);
      setEvalResult(result);

      if (result.isCorrect && currentWord) {
        // Correct pronunciation:
        const masteredWord = currentWord;
        setStatus('correct');
        setErrorMessage(null);

        // Advance after visual confirmation (750ms)
        correctAdvanceTimerRef.current = setTimeout(() => {
          correctAdvanceTimerRef.current = null;
          setCompletedWords((prevCompleted) =>
            prevCompleted.some((w) => w.id === masteredWord.id)
              ? prevCompleted
              : [...prevCompleted, masteredWord]
          );
          setQueue((prevQueue) => {
            if (prevQueue.length === 0) return prevQueue;
            return prevQueue[0].id === masteredWord.id
              ? prevQueue.slice(1)
              : prevQueue.filter((w) => w.id !== masteredWord.id);
          });
          setIsFlipped(false);
          setStatus('idle');
          setEvalResult(null);
          setManualInputValue('');
        }, 750);
      } else {
        // Incorrect pronunciation:
        setStatus('incorrect');
        setIsFlipped(true); // Flip card to demonstrate correct pinyin & meaning
        setErrorMessage(result.feedback || 'Phát âm chưa chuẩn. Hãy nghe mẫu và thử lại!');

        // Play standard native audio demonstration
        playChineseAudio(currentWord.hanzi);

        // Auto-advance to the next card after demonstration (3800ms)
        if (autoAdvanceTimerRef.current) {
          clearTimeout(autoAdvanceTimerRef.current);
        }
        autoAdvanceTimerRef.current = setTimeout(() => {
          // Re-queue missed word to the end of the FIFO queue upon demonstration completion
          setQueue((prevQueue) => {
            if (prevQueue.length === 0) return prevQueue;
            const missed = prevQueue[0];
            return [...prevQueue.slice(1), missed];
          });
          setIsFlipped(false);
          setStatus('idle');
          setEvalResult(null);
          setErrorMessage(null);
          setManualInputValue('');
        }, 3800);
      }
    },
    [currentWord]
  );

  // Start Speech Recognition Capture via Web Speech API
  const startListening = useCallback(() => {
    if (status === 'listening' || status === 'evaluating' || status === 'correct') return;

    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    if (correctAdvanceTimerRef.current) {
      clearTimeout(correctAdvanceTimerRef.current);
      correctAdvanceTimerRef.current = null;
    }

    const SpeechRecognitionClass =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (!SpeechRecognitionClass) {
      setIsSpeechSupported(false);
      setShowManualInput(true);
      setErrorMessage(
        'Trình duyệt không hỗ trợ nhận diện giọng nói Web Speech API. Bạn có thể sử dụng chế độ nhập phiên âm bên dưới.'
      );
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }

      const recognition = new SpeechRecognitionClass();
      recognition.lang = 'zh-CN';
      recognition.interimResults = true;
      recognition.maxAlternatives = 5;

      recognition.onstart = () => {
        setStatus('listening');
        setErrorMessage(null);
        setLiveTranscript('');
        lastLiveTranscriptRef.current = '';
      };

      recognition.onresult = (event: any) => {
        if (!event.results || event.results.length === 0) return;

        let latestSpoken = '';
        let hasFinalResult = false;
        const alternatives: string[] = [];

        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) {
            hasFinalResult = true;
          }
          for (let j = 0; j < res.length; j++) {
            const transcript = res[j]?.transcript?.trim();
            if (transcript && !alternatives.includes(transcript)) {
              alternatives.push(transcript);
            }
          }
          if (res[0]?.transcript) {
            latestSpoken = res[0].transcript.trim();
          }
        }

        if (latestSpoken) {
          setLiveTranscript(latestSpoken);
          lastLiveTranscriptRef.current = latestSpoken;
        }

        if (alternatives.length === 0) return;

        // Immediate check: If ANY alternative matches as correct, accept immediately without waiting for silence!
        if (currentWord) {
          for (const alt of alternatives) {
            const ev = evaluateSpeechPronunciation(alt, currentWord);
            if (ev.isCorrect) {
              try {
                recognition.abort();
              } catch {}
              setLiveTranscript('');
              lastLiveTranscriptRef.current = '';
              handleProcessSpeech(alt);
              return;
            }
          }
        }

        // If the speech phrase has finalized and none of the alternatives was an exact match:
        if (hasFinalResult) {
          try {
            recognition.stop();
          } catch {}
          setLiveTranscript('');
          lastLiveTranscriptRef.current = '';
          handleProcessSpeech(alternatives[0] || latestSpoken);
        }
      };

      recognition.onerror = (event: any) => {
        const error = event.error;
        if (error === 'not-allowed' || error === 'permission-denied') {
          setErrorMessage(
            'Quyền truy cập Microphone bị từ chối. Vui lòng cho phép truy cập micro để luyện phát âm, hoặc dùng ô nhập bên dưới.'
          );
          setShowManualInput(true);
        } else if (error === 'no-speech') {
          if (lastLiveTranscriptRef.current && currentWord) {
            const spoken = lastLiveTranscriptRef.current;
            lastLiveTranscriptRef.current = '';
            setLiveTranscript('');
            handleProcessSpeech(spoken);
            return;
          }
          setErrorMessage('Chưa bắt được âm thanh. Hãy bấm Micro và phát âm to, rõ ràng hơn gần micro nhé!');
        } else if (error === 'network') {
          setErrorMessage('Lỗi mạng kết nối dịch vụ nhận diện giọng nói. Hãy kiểm tra kết nối mạng hoặc dùng ô Nhập tay.');
          setShowManualInput(true);
        } else if (error !== 'aborted') {
          setErrorMessage(`Lỗi nhận diện (${error}). Vui lòng thử lại.`);
        }
        setStatus('idle');
        setLiveTranscript('');
      };

      recognition.onend = () => {
        setStatus((prev) => {
          if (prev === 'listening') {
            if (lastLiveTranscriptRef.current && currentWord) {
              const spoken = lastLiveTranscriptRef.current;
              lastLiveTranscriptRef.current = '';
              setLiveTranscript('');
              setTimeout(() => handleProcessSpeech(spoken), 0);
            }
            return 'idle';
          }
          return prev;
        });
        setLiveTranscript('');
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('SpeechRecognition failed to start:', err);
      setStatus('idle');
      setShowManualInput(true);
      setErrorMessage('Không thể khởi động micro. Bạn có thể sử dụng chế độ nhập thay thế.');
    }
  }, [status, currentWord, handleProcessSpeech]);

  // Stop current speech recognition
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setStatus((prev) => (prev === 'listening' ? 'idle' : prev));
  }, []);

  // Skip card manually (pushes word to tail of queue without correct credit)
  const handleSkipCard = useCallback(() => {
    if (!currentWord || status === 'correct') return;
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    if (correctAdvanceTimerRef.current) {
      clearTimeout(correctAdvanceTimerRef.current);
      correctAdvanceTimerRef.current = null;
    }

    setQueue((prevQueue) => {
      if (prevQueue.length <= 1) return prevQueue;
      const skipped = prevQueue[0];
      return [...prevQueue.slice(1), skipped];
    });

    setIsFlipped(false);
    setStatus('idle');
    setEvalResult(null);
    setErrorMessage(null);
    setManualInputValue('');
  }, [currentWord, status]);

  // Manual Advance button when card is flipped
  const handleManualAdvance = useCallback(() => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    if (correctAdvanceTimerRef.current) {
      clearTimeout(correctAdvanceTimerRef.current);
      correctAdvanceTimerRef.current = null;
    }

    if (status === 'incorrect') {
      // Re-queue missed word to the end of the queue upon manual advance
      setQueue((prevQueue) => {
        if (prevQueue.length === 0) return prevQueue;
        const missed = prevQueue[0];
        return [...prevQueue.slice(1), missed];
      });
    } else if (status === 'correct' && currentWord) {
      const masteredWord = currentWord;
      setCompletedWords((prevCompleted) =>
        prevCompleted.some((w) => w.id === masteredWord.id)
          ? prevCompleted
          : [...prevCompleted, masteredWord]
      );
      setQueue((prevQueue) => {
        if (prevQueue.length === 0) return prevQueue;
        return prevQueue[0].id === masteredWord.id
          ? prevQueue.slice(1)
          : prevQueue.filter((w) => w.id !== masteredWord.id);
      });
    }

    setIsFlipped(false);
    setStatus('idle');
    setEvalResult(null);
    setErrorMessage(null);
    setManualInputValue('');
  }, [status, currentWord]);

  // Handle Shuffle Toggle (R5)
  const handleToggleShuffle = useCallback(() => {
    const nextRandomized = !isRandomized;
    setIsRandomized(nextRandomized);
    if (nextRandomized) {
      setQueue((prevQueue) => {
        if (prevQueue.length <= 1) return prevQueue;
        if (status === 'correct' || status === 'incorrect') {
          return [prevQueue[0], ...shuffleArray(prevQueue.slice(1))];
        }
        return shuffleArray(prevQueue);
      });
    }
  }, [isRandomized, status]);

  // Handle Restart Session
  const handleRestart = useCallback(() => {
    if (words && words.length > 0) {
      const initialQueue = isRandomized ? shuffleArray(words) : [...words];
      setQueue(initialQueue);
      setCompletedWords([]);
      setTotalInitialCount(words.length);
      setIsFlipped(false);
      setStatus('idle');
      setEvalResult(null);
      setTotalAttempts(0);
      setAttemptsPerWord({});
      setErrorMessage(null);
      setManualInputValue('');
    }
  }, [words, isRandomized]);

  if (!isOpen) return null;

  const completedCount = completedWords.length;
  const remainingCount = queue.length;
  const progressPercent =
    totalInitialCount > 0 ? Math.round((completedCount / totalInitialCount) * 100) : 0;

  const cleanLessonTitle = lessonTitle
    ? lessonTitle.replace(new RegExp(`^Bài\\s*${lessonNumber ?? ''}\\s*[:：]?\\s*`, 'i'), '')
    : '';

  const modalContent = (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5 overflow-y-auto animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          cleanupSession();
          onClose();
        }
      }}
      id="modal-pronunciation-flashcards"
    >
      <div className="bg-[var(--color-surface)] rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl border border-[var(--color-border)] relative my-auto space-y-5 max-h-[95vh] overflow-y-auto flex flex-col justify-between">
        {/* ==================================================================== */}
        {/* HEADER: Lesson Title, Progress Counters & Shuffle Toggle */}
        {/* ==================================================================== */}
        <div className="space-y-3 border-b border-[var(--color-border)] pb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 font-bold text-xs">
                New HSK {hskLevel}
              </span>
              <h2 className="text-base sm:text-lg font-bold text-[var(--color-text-primary)]">
                Luyện Phát Âm{lessonNumber ? ` · Bài ${lessonNumber}` : ''}
                {cleanLessonTitle ? `: ${cleanLessonTitle}` : ''}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleShuffle}
                className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isRandomized
                    ? 'bg-rose-500/15 border-rose-500 text-rose-500'
                    : 'bg-[var(--color-bg-secondary)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
                title="Xáo trộn thứ tự từ vựng (Fisher-Yates Shuffle)"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Xáo trộn</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  cleanupSession();
                  onClose();
                }}
                className="p-1.5 rounded-xl bg-[var(--color-bg-secondary)] hover:bg-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)] transition-colors cursor-pointer"
                title="Đóng và quay lại danh sách từ vựng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Progress Bar & Stats */}
          {!isSessionCompleted && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-medium text-[var(--color-text-secondary)]">
                <span>
                  Đã hoàn thành: <strong className="text-emerald-500">{completedCount}</strong>/{totalInitialCount} từ ({progressPercent}%)
                </span>
                <span>
                  Còn lại trong hàng đợi: <strong className="text-rose-500">{remainingCount}</strong> từ
                </span>
              </div>
              <div className="w-full bg-[var(--color-border)] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ==================================================================== */}
        {/* BODY: Practice Card OR Session Completed */}
        {/* ==================================================================== */}
        {isSessionCompleted ? (
          /* SESSION COMPLETED SCREEN */
          <div className="py-8 text-center space-y-6 animate-fade-in">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shadow-lg">
              <Trophy className="w-10 h-10 animate-bounce" />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="text-2xl font-black text-[var(--color-text-primary)]">
                Hoàn Thành Xuất Sắc!
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                Bạn đã phát âm chuẩn xác tất cả <strong>{totalInitialCount}</strong> từ vựng của bài học!
              </p>
            </div>

            {/* Session Stats */}
            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto p-4 rounded-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
              <div className="text-center">
                <span className="text-[11px] text-[var(--color-text-secondary)] block">Tổng từ</span>
                <span className="text-xl font-bold text-emerald-500">{totalInitialCount}</span>
              </div>
              <div className="text-center border-x border-[var(--color-border)]">
                <span className="text-[11px] text-[var(--color-text-secondary)] block">Lượt phát âm</span>
                <span className="text-xl font-bold text-[var(--color-text-primary)]">{totalAttempts}</span>
              </div>
              <div className="text-center">
                <span className="text-[11px] text-[var(--color-text-secondary)] block">Tỷ lệ chính xác</span>
                <span className="text-xl font-bold text-rose-500">
                  {totalAttempts > 0
                    ? `${Math.round((totalInitialCount / totalAttempts) * 100)}%`
                    : '100%'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleRestart}
                className="px-5 py-2.5 rounded-xl bg-[var(--color-bg-secondary)] hover:bg-[var(--color-border)] text-[var(--color-text-primary)] text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border border-[var(--color-border)]"
              >
                <RotateCw className="w-4 h-4 text-rose-500" />
                <span>Luyện lại bài này</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  cleanupSession();
                  onClose();
                }}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Trở về bài học</span>
              </button>
            </div>
          </div>
        ) : currentWord ? (
          /* ACTIVE FLASHCARD VIEW */
          <div className="space-y-5">
            {/* Main Interactive Card */}
            <div
              className={`p-6 sm:p-8 rounded-3xl border transition-all duration-300 relative ${
                status === 'correct'
                  ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_25px_rgba(16,185,129,0.2)]'
                  : status === 'incorrect'
                  ? 'bg-rose-500/10 border-rose-500/50 shadow-[0_0_25px_rgba(244,63,94,0.2)]'
                  : status === 'listening'
                  ? 'bg-rose-500/5 border-rose-500/40 ring-2 ring-rose-500/20'
                  : 'bg-[var(--color-bg-secondary)] border-[var(--color-border)] shadow-sm'
              }`}
            >
              {/* Card Top: Native Audio Button & Pinyin Hint */}
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => playChineseAudio(currentWord.hanzi)}
                  className="p-2.5 rounded-xl bg-[var(--color-surface)] text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shadow-xs cursor-pointer border border-[var(--color-border)]"
                  title="Nghe phát âm chuẩn bản xứ"
                >
                  <Volume2 className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-[var(--color-text-secondary)]">
                    Lượt thử: {attemptsPerWord[currentWord.id] || 0}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsFlipped((prev) => !prev)}
                    className="px-2.5 py-1 rounded-lg bg-[var(--color-surface)] text-[11px] font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)] transition-colors cursor-pointer"
                    title="Lật thẻ thủ công"
                  >
                    {isFlipped ? 'Ẩn nghĩa' : 'Lật xem nghĩa & pinyin'}
                  </button>
                </div>
              </div>

              {/* Character Display (Hanzi) */}
              <div className="text-center py-3 space-y-2">
                <span className="text-6xl sm:text-7xl font-bold font-chinese text-[var(--color-text-primary)] tracking-wide block leading-none">
                  {currentWord.hanzi}
                </span>

                {/* Subtitle / Live voice recognition feedback when listening */}
                {!isFlipped && (
                  <div className="pt-2 min-h-[30px] flex items-center justify-center">
                    {status === 'listening' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-500 text-xs font-semibold border border-rose-500/25 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                        {liveTranscript ? `Đang nghe: "${liveTranscript}"` : 'Đang lắng nghe giọng bạn...'}
                      </span>
                    ) : (
                      <span className="text-xs text-[var(--color-text-secondary)] font-medium">
                        Nhìn chữ Hán &amp; bấm Micro phát âm
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Flipped Card Information Box (Revealed on incorrect pronunciation or manual flip) */}
              {isFlipped && (
                <div className="mt-4 p-4 sm:p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-3 animate-fade-in text-center shadow-xs">
                  {/* Pinyin revealed only when card is flipped */}
                  <div className="space-y-0.5">
                    <span className="text-[11px] uppercase font-bold text-rose-500 tracking-wider">Phiên âm chuẩn</span>
                    <span className="text-2xl sm:text-3xl font-black font-mono text-rose-600 block">
                      {currentWord.pinyin}
                    </span>
                  </div>

                  {/* Vietnamese Meaning */}
                  <div className="space-y-0.5 pt-1">
                    <span className="text-[11px] uppercase font-bold text-[var(--color-text-secondary)] tracking-wider">Ý nghĩa</span>
                    <p className="text-base sm:text-lg font-bold text-[var(--color-text-primary)] leading-snug">
                      {currentWord.vietnamese || currentWord.english}
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-3 text-xs text-[var(--color-text-secondary)] flex-wrap pt-1">
                    {currentWord.hanViet && (
                      <span className="font-mono">
                        Âm Hán Việt: <strong className="text-amber-500">{currentWord.hanViet}</strong>
                      </span>
                    )}
                    {currentWord.partOfSpeech && (
                      <span>
                        Từ loại: <strong>{formatPartOfSpeechVietnamese(currentWord.partOfSpeech)}</strong>
                      </span>
                    )}
                  </div>

                  {status === 'incorrect' && (
                    <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-semibold space-y-1 mt-2 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                        <span>
                          Phát âm chưa chuẩn{evalResult?.recognizedText ? ` (Máy nhận diện: "${evalResult.recognizedText}")` : ''}
                        </span>
                      </div>
                      <div className="text-[11px] font-normal text-rose-500/80">
                        Đang phát âm chuẩn. Từ này đã được đẩy về cuối hàng đợi để bạn ôn lại!
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Evaluation Feedback Banner */}
              {evalResult && (
                <div
                  className={`mt-4 p-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 ${
                    evalResult.isCorrect
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {evalResult.isCorrect ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  )}
                  <span>{evalResult.feedback}</span>
                </div>
              )}
            </div>

            {/* Error or Alert Message */}
            {errorMessage && !evalResult && (
              <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-300 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                <span className="flex-1">{errorMessage}</span>
              </div>
            )}

            {/* ================================================================ */}
            {/* CONTROLS: Microphone Button, Status Indicator & Actions */}
            {/* ================================================================ */}
            <div className="space-y-3">
              {/* Primary Microphone Trigger */}
              <div className="flex flex-col items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={status === 'evaluating'}
                  onClick={status === 'listening' ? stopListening : startListening}
                  className={`relative p-5 rounded-full transition-all shadow-lg flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    status === 'listening'
                      ? 'bg-rose-600 text-white ring-8 ring-rose-500/30 scale-110 animate-pulse'
                      : status === 'evaluating'
                      ? 'bg-amber-500 text-white animate-spin'
                      : status === 'correct'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-rose-600 hover:bg-rose-700 text-white hover:scale-105 active:scale-95'
                  }`}
                  title={status === 'listening' ? 'Đang nghe... bấm để dừng' : 'Bấm để phát âm'}
                >
                  {status === 'evaluating' ? (
                    <RotateCw className="w-8 h-8" />
                  ) : (
                    <Mic className="w-8 h-8" />
                  )}
                </button>

                <div className="text-center text-xs font-medium text-[var(--color-text-secondary)]">
                  {status === 'listening' ? (
                    <span className="text-rose-500 font-bold animate-pulse">
                      {liveTranscript ? `🎙️ Đang nghe: "${liveTranscript}"` : '🎙️ Đang nghe... Hãy phát âm to và rõ ràng'}
                    </span>
                  ) : status === 'evaluating' ? (
                    <span className="text-amber-500 font-bold">
                      ⏳ Đang đánh giá phát âm...
                    </span>
                  ) : status === 'correct' ? (
                    <span className="text-emerald-500 font-bold">
                      ✓ Chính xác! Đang chuyển thẻ tiếp theo...
                    </span>
                  ) : status === 'incorrect' ? (
                    <span className="text-rose-500 font-bold">
                      Đang phát âm mẫu...
                    </span>
                  ) : (
                    <span>Bấm nút Micro và đọc to từ vựng tiếng Trung</span>
                  )}
                </div>
              </div>

              {/* Action Buttons: Skip, Next, Manual Fallback Toggle */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManualInput((prev) => !prev)}
                  className="px-3 py-2 rounded-xl bg-[var(--color-bg-secondary)] hover:bg-[var(--color-border)] text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)] transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Chuyển sang chế độ nhập phiên âm bằng bàn phím"
                >
                  <Keyboard className="w-3.5 h-3.5" />
                  <span>{showManualInput ? 'Ẩn bàn phím' : 'Nhập tay'}</span>
                </button>

                <div className="flex items-center gap-2">
                  {isFlipped && (
                    <button
                      type="button"
                      onClick={handleManualAdvance}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <span>Tiếp tục</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleSkipCard}
                    className="px-3.5 py-2 rounded-xl bg-[var(--color-bg-secondary)] hover:bg-[var(--color-border)] text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)] transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Đưa từ này về cuối hàng đợi để luyện sau"
                  >
                    <span>Bỏ qua</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Manual Input Fallback Form (when mic is unsupported or user chooses keyboard) */}
              {showManualInput && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (manualInputValue.trim()) {
                      handleProcessSpeech(manualInputValue.trim());
                    }
                  }}
                  className="p-3.5 rounded-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] space-y-2 animate-fade-in"
                >
                  <div className="text-[11px] font-semibold text-[var(--color-text-secondary)] flex items-center justify-between">
                    <span>Nhập Pinyin (vd: "{currentWord.pinyin}") hoặc chữ Hán:</span>
                    {!isSpeechSupported && (
                      <span className="text-amber-500 font-normal">Chế độ giả lập micro</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={manualInputValue}
                      onChange={(e) => setManualInputValue(e.target.value)}
                      placeholder="Nhập pinyin hoặc chữ hán để kiểm tra..."
                      className="flex-1 px-3 py-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-mono text-[var(--color-text-primary)] focus:outline-none focus:border-rose-500 transition-colors"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={!manualInputValue.trim() || status === 'evaluating'}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-xs font-bold transition-all cursor-pointer"
                    >
                      Kiểm tra
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
