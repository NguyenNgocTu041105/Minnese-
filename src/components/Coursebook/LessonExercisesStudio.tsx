import React, { useState, useMemo, useEffect } from 'react';
import {
  Volume2,
  CheckCircle2,
  HelpCircle,
  RotateCcw,
  Check,
  X,
  FileEdit,
} from 'lucide-react';
import { ExerciseItem, ExerciseType, DetailedTextbookLesson } from '../../data/newHsk1BookData';
import { playChineseAudio } from '../../utils/chineseAudio';

const getConsolidatedNotesKey = (level: number, lessonNum: number) =>
  `minnese_exercise_notes_hsk${level}_l${lessonNum}`;

const getDirectNoteKey = (exerciseId: string) =>
  `minnese_note_${exerciseId}`;

const checkQuestionCorrect = (ex: ExerciseItem, answer: string): boolean => {
  if (!answer) return false;
  const cleanUser = answer.replace(/\s+/g, '').toLowerCase();
  const cleanCorrect = (ex.correctAnswer || '').replace(/\s+/g, '').toLowerCase();
  if (!cleanCorrect) return false;
  return cleanUser === cleanCorrect || cleanUser.includes(cleanCorrect) || cleanCorrect.includes(cleanUser);
};

interface LessonExercisesStudioProps {
  lesson: DetailedTextbookLesson;
  hskLevel: number;
  onUpdateUserXp?: (additionalXp: number) => void;
}

export const LessonExercisesStudio: React.FC<LessonExercisesStudioProps> = ({
  lesson,
  hskLevel,
  onUpdateUserXp,
}) => {
  const exerciseList = useMemo(() => lesson.exercises || [], [lesson.exercises]);

  // User responses
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [scrambleBuilt, setScrambleBuilt] = useState<Record<string, string[]>>({});
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [rewardedQuestionIds, setRewardedQuestionIds] = useState<Set<string>>(new Set());

  // Notes state with localStorage persistence
  const [notes, setNotes] = useState<Record<string, string>>(() => {
    if (typeof localStorage === 'undefined') return {};
    try {
      const consolidatedKey = getConsolidatedNotesKey(hskLevel, lesson.lessonNumber);
      const saved = localStorage.getItem(consolidatedKey);
      let initialNotes: Record<string, string> = {};
      if (saved) {
        initialNotes = JSON.parse(saved) || {};
      }
      (lesson.exercises || []).forEach((ex) => {
        if (!initialNotes[ex.id]) {
          const direct = localStorage.getItem(getDirectNoteKey(ex.id));
          if (direct) {
            initialNotes[ex.id] = direct;
          }
        }
      });
      return initialNotes;
    } catch {
      return {};
    }
  });

  // When lesson changes, reset responses and load notes
  useEffect(() => {
    setSelectedAnswers({});
    setScrambleBuilt({});
    setActiveFilter('all');
    setRewardedQuestionIds(new Set());

    if (typeof localStorage === 'undefined') return;
    try {
      const consolidatedKey = getConsolidatedNotesKey(hskLevel, lesson.lessonNumber);
      const saved = localStorage.getItem(consolidatedKey);
      let loaded: Record<string, string> = {};
      if (saved) {
        loaded = JSON.parse(saved) || {};
      }
      (lesson.exercises || []).forEach((ex) => {
        if (!loaded[ex.id]) {
          const direct = localStorage.getItem(getDirectNoteKey(ex.id));
          if (direct) {
            loaded[ex.id] = direct;
          }
        }
      });
      setNotes(loaded);
    } catch (e) {
      console.warn('Failed to load exercise notes:', e);
    }
  }, [hskLevel, lesson.lessonNumber, lesson.exercises]);

  // Handle Play Audio
  const handlePlayAudio = async (text: string, id: string) => {
    if (!text) return;
    setPlayingAudioId(id);
    try {
      await playChineseAudio(text);
    } catch (e) {
      console.warn('Audio play failed:', e);
    } finally {
      setTimeout(() => setPlayingAudioId(null), 1200);
    }
  };

  // Handle Option Selection for Multiple Choice / Fill blank / Translation / Dialogue / Error Spotting
  const handleSelectOption = (exerciseId: string, opt: string) => {
    if (selectedAnswers[exerciseId]) return; // Locked once answered

    setSelectedAnswers((prev) => ({
      ...prev,
      [exerciseId]: opt,
    }));

    const ex = exerciseList.find((e) => e.id === exerciseId);
    if (!ex) return;

    const isCorrect = checkQuestionCorrect(ex, opt);
    if (isCorrect && !rewardedQuestionIds.has(exerciseId)) {
      setRewardedQuestionIds((prev) => {
        const next = new Set(prev);
        next.add(exerciseId);
        return next;
      });
      if (onUpdateUserXp) {
        onUpdateUserXp(10);
      }
    }
  };

  // Handle Scramble Segment Click (add to assembled sentence)
  const handleAddScrambleSegment = (exerciseId: string, segment: string) => {
    const ex = exerciseList.find((e) => e.id === exerciseId);
    const totalSegments = ex?.scrambleSegments?.length || 0;

    setScrambleBuilt((prev) => {
      const current = prev[exerciseId] || [];
      if (totalSegments > 0 && current.length >= totalSegments) {
        return prev;
      }
      const updated = [...current, segment];

      // Instant evaluation when all scramble segments are placed
      if (totalSegments > 0 && updated.length === totalSegments) {
        const assembledText = updated.join('');
        setSelectedAnswers((ans) => ({
          ...ans,
          [exerciseId]: assembledText,
        }));

        if (ex) {
          const isCorrect = checkQuestionCorrect(ex, assembledText);
          if (isCorrect && !rewardedQuestionIds.has(exerciseId)) {
            setRewardedQuestionIds((rPrev) => {
              const next = new Set(rPrev);
              next.add(exerciseId);
              return next;
            });
            if (onUpdateUserXp) {
              onUpdateUserXp(10);
            }
          }
        }
      }

      return { ...prev, [exerciseId]: updated };
    });
  };

  // Handle Remove Scramble Segment
  const handleRemoveScrambleSegment = (exerciseId: string, itemIdx: number) => {
    setScrambleBuilt((prev) => {
      const current = prev[exerciseId] || [];
      const updated = current.filter((_, idx) => idx !== itemIdx);
      setSelectedAnswers((ans) => {
        if (ans[exerciseId]) {
          const next = { ...ans };
          delete next[exerciseId];
          return next;
        }
        return ans;
      });
      return { ...prev, [exerciseId]: updated };
    });
  };

  // Reset a scramble exercise
  const handleResetScramble = (exerciseId: string) => {
    setScrambleBuilt((prev) => ({ ...prev, [exerciseId]: [] }));
    setSelectedAnswers((prev) => {
      const next = { ...prev };
      delete next[exerciseId];
      return next;
    });
  };

  // Per-question reset
  const handleResetQuestion = (exerciseId: string) => {
    setSelectedAnswers((prev) => {
      const next = { ...prev };
      delete next[exerciseId];
      return next;
    });
    setScrambleBuilt((prev) => {
      if (prev[exerciseId]) {
        return { ...prev, [exerciseId]: [] };
      }
      return prev;
    });
  };

  // Reset all questions
  const handleResetAll = () => {
    setSelectedAnswers({});
    setScrambleBuilt({});
  };

  // Update Note and sync to localStorage
  const handleUpdateNote = (exerciseId: string, value: string) => {
    setNotes((prev) => {
      const next = { ...prev, [exerciseId]: value };
      if (typeof localStorage !== 'undefined') {
        try {
          const consolidatedKey = getConsolidatedNotesKey(hskLevel, lesson.lessonNumber);
          localStorage.setItem(consolidatedKey, JSON.stringify(next));

          const directKey = getDirectNoteKey(exerciseId);
          if (value.trim()) {
            localStorage.setItem(directKey, value);
          } else {
            localStorage.removeItem(directKey);
          }
        } catch (err) {
          console.warn('Failed to save note to localStorage:', err);
        }
      }
      return next;
    });
  };

  // Filtered exercises
  const filteredExercises = useMemo(() => {
    if (activeFilter === 'all') return exerciseList;
    return exerciseList.filter((ex) => ex.type === activeFilter);
  }, [exerciseList, activeFilter]);

  // Evaluation Stats
  const { totalAnswered, correctCount, scorePercentage } = useMemo(() => {
    let answered = 0;
    let correct = 0;

    exerciseList.forEach((ex) => {
      const isAnswered =
        ex.type === 'sentence_scramble'
          ? (scrambleBuilt[ex.id]?.length || 0) >= (ex.scrambleSegments?.length || 0) &&
            (ex.scrambleSegments?.length || 0) > 0
          : !!selectedAnswers[ex.id]?.trim();

      if (isAnswered) {
        answered++;
        const userAns = selectedAnswers[ex.id] || '';
        if (checkQuestionCorrect(ex, userAns)) {
          correct++;
        }
      }
    });

    const pct = exerciseList.length > 0 ? Math.round((correct / exerciseList.length) * 100) : 0;
    return { totalAnswered: answered, correctCount: correct, scorePercentage: pct };
  }, [exerciseList, selectedAnswers, scrambleBuilt]);

  const getFilterTypeLabel = (type: string) => {
    switch (type) {
      case 'sentence_scramble':
        return '🧩 Sắp xếp câu';
      case 'fill_blank':
        return '✍️ Điền từ vào ô';
      case 'multiple_choice':
        return '🎯 Trắc nghiệm';
      case 'translation':
        return '🔄 Dịch câu & Mẫu câu';
      case 'dialogue_match':
        return '💬 Ghép hội thoại';
      case 'error_spotting':
        return '🔍 Tìm & sửa lỗi';
      default:
        return 'Bài tập';
    }
  };

  return (
    <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5 sm:p-7 shadow-sm space-y-6">
      {/* Top Banner: Header + Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--color-border)] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-[var(--color-primary-light)] text-[var(--color-primary)] font-bold text-xs">
              HSK {hskLevel} • Bài {lesson.lessonNumber}
            </span>
            <span className="text-xs text-[var(--color-text-secondary)] font-medium">
              {exerciseList.length} câu bài tập vận dụng
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-[var(--color-text-primary)] mt-1.5 flex items-center gap-2">
            Bài tập luyện tập & Vận dụng mẫu câu
          </h3>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            Luyện tập toàn diện: Sắp xếp câu, điền từ khuyết, phản xạ hội thoại và phân tích ngữ pháp bài học.
          </p>
        </div>

        {/* Live completion counter & Reset All */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="px-3.5 py-2 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-2 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>
              Đã làm: {totalAnswered}/{exerciseList.length} • Đúng: {correctCount}
            </span>
          </div>

          <button
            type="button"
            onClick={handleResetAll}
            disabled={totalAnswered === 0}
            className="px-3.5 py-2 rounded-xl bg-[var(--color-surface)] hover:bg-[var(--color-bg-secondary)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--color-text-primary)] font-bold text-xs flex items-center gap-1.5 border border-[var(--color-border)] transition-all cursor-pointer shadow-2xs"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Làm lại tất cả</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs by Question Type */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
            activeFilter === 'all'
              ? 'bg-[var(--color-primary)] text-white shadow-xs'
              : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)]'
          }`}
        >
          Tất cả ({exerciseList.length})
        </button>

        {['sentence_scramble', 'fill_blank', 'multiple_choice', 'translation', 'dialogue_match', 'error_spotting'].map(
          (type) => {
            const count = exerciseList.filter((e) => e.type === type).length;
            if (count === 0) return null;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setActiveFilter(type)}
                className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
                  activeFilter === type
                    ? 'bg-[var(--color-primary)] text-white shadow-xs'
                    : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)]'
                }`}
              >
                {getFilterTypeLabel(type)} ({count})
              </button>
            );
          }
        )}
      </div>

      {/* Live Result Summary Banner */}
      {totalAnswered > 0 && (
        <div className="p-4 rounded-2xl bg-linear-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-extrabold text-lg shadow-sm">
              {scorePercentage}%
            </div>
            <div>
              <div className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                <span>
                  {scorePercentage >= 80 ? 'Xuất sắc! 🎉' : scorePercentage >= 50 ? 'Khá tốt! 👍' : 'Cố gắng lên! 💪'}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-bold">
                  Đúng {correctCount} / {totalAnswered} câu đã làm
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                Bạn đã tích lũy được <span className="font-bold text-amber-500">+{rewardedQuestionIds.size * 10} XP</span> kinh nghiệm ôn tập!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetAll}
              className="px-3.5 py-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] text-xs font-bold text-[var(--color-text-primary)] transition-all cursor-pointer"
            >
              Làm lại toàn bộ
            </button>
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-5">
        {filteredExercises.map((ex, exIdx) => {
          const userAns = selectedAnswers[ex.id] || '';
          const isAnswered =
            ex.type === 'sentence_scramble'
              ? (scrambleBuilt[ex.id]?.length || 0) >= (ex.scrambleSegments?.length || 0) &&
                (ex.scrambleSegments?.length || 0) > 0
              : !!userAns;

          const isCorrect = isAnswered && checkQuestionCorrect(ex, userAns);

          return (
            <div
              key={ex.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                isAnswered
                  ? isCorrect
                    ? 'bg-emerald-500/5 border-emerald-500/30'
                    : 'bg-rose-500/5 border-rose-500/30'
                  : 'bg-[var(--color-bg-secondary)] border-[var(--color-border)] hover:border-[var(--color-primary)]/40'
              }`}
            >
              {/* Question Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 flex-1">
                  <span className="w-6 h-6 rounded-lg bg-[var(--color-primary-light)] text-[var(--color-primary)] text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">
                    {exIdx + 1}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] font-semibold">
                        {getFilterTypeLabel(ex.type)}
                      </span>
                      {ex.grammarFocus && (
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-300 font-medium">
                          {ex.grammarFocus}
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-bold text-[var(--color-text-primary)] mt-1 leading-snug">
                      {ex.question}
                    </div>
                  </div>
                </div>

                {/* Audio Button for Chinese Prompt */}
                {(ex.audioText || ex.hanziPrompt) && (
                  <button
                    type="button"
                    onClick={() => handlePlayAudio(ex.audioText || ex.hanziPrompt || '', ex.id)}
                    className="p-2 rounded-xl bg-[var(--color-surface)] hover:bg-[var(--color-primary-light)] text-[var(--color-primary)] border border-[var(--color-border)] transition-colors cursor-pointer shrink-0 shadow-2xs"
                    title="Nghe phát âm chuẩn"
                  >
                    <Volume2 className={`w-4 h-4 ${playingAudioId === ex.id ? 'animate-bounce text-amber-500' : ''}`} />
                  </button>
                )}
              </div>

              {/* Chinese / Vietnamese Prompts */}
              {(ex.hanziPrompt || ex.vietnamesePrompt) && (
                <div className="mt-3 p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-1">
                  {ex.hanziPrompt && (
                    <div className="text-base sm:text-lg font-bold font-chinese text-[var(--color-text-primary)]">
                      {ex.hanziPrompt}
                    </div>
                  )}
                  {ex.pinyinPrompt && (
                    <div className="text-xs font-mono text-[var(--color-primary)]">
                      {ex.pinyinPrompt}
                    </div>
                  )}
                  {ex.vietnamesePrompt && (
                    <div className="text-xs text-[var(--color-text-secondary)] italic">
                      {ex.vietnamesePrompt}
                    </div>
                  )}
                </div>
              )}

              {/* DẠNG 1: SẮP XẾP CÂU (SENTENCE SCRAMBLE) */}
              {ex.type === 'sentence_scramble' && (
                <div className="mt-4 space-y-3">
                  {/* Built sentence area */}
                  <div
                    className={`min-h-12 p-3 rounded-xl bg-[var(--color-surface)] border-2 transition-all flex flex-wrap items-center gap-1.5 ${
                      isAnswered
                        ? isCorrect
                          ? 'border-emerald-500 bg-emerald-500/5'
                          : 'border-rose-500 bg-rose-500/5'
                        : 'border-dashed border-[var(--color-primary)]/30'
                    }`}
                  >
                    {scrambleBuilt[ex.id] && scrambleBuilt[ex.id].length > 0 ? (
                      scrambleBuilt[ex.id].map((seg, sIdx) => (
                        <button
                          key={`${seg}-${sIdx}`}
                          type="button"
                          disabled={isAnswered}
                          onClick={() => handleRemoveScrambleSegment(ex.id, sIdx)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold font-chinese flex items-center gap-1 transition-colors shadow-2xs ${
                            isAnswered
                              ? isCorrect
                                ? 'bg-emerald-500 text-white cursor-default'
                                : 'bg-rose-500 text-white cursor-default'
                              : 'bg-[var(--color-primary)] text-white hover:bg-rose-500 cursor-pointer'
                          }`}
                          title={isAnswered ? undefined : 'Bấm để xóa từ này'}
                        >
                          <span>{seg}</span>
                          {!isAnswered && <X className="w-3 h-3 opacity-80" />}
                        </button>
                      ))
                    ) : (
                      <span className="text-xs text-[var(--color-text-secondary)] italic">
                        Bấm vào các từ bên dưới theo thứ tự để ghép thành câu đúng...
                      </span>
                    )}
                  </div>

                  {/* Available segments chips */}
                  {ex.scrambleSegments && (
                    <div className="flex flex-wrap items-center gap-2">
                      {ex.scrambleSegments.map((seg, sIdx) => {
                        const usedCount = (scrambleBuilt[ex.id] || []).filter((s) => s === seg).length;
                        const totalAvailable = ex.scrambleSegments!.filter((s) => s === seg).length;
                        const isExhausted = usedCount >= totalAvailable;

                        return (
                          <button
                            key={`${seg}-${sIdx}`}
                            type="button"
                            disabled={isExhausted || isAnswered}
                            onClick={() => handleAddScrambleSegment(ex.id, seg)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-chinese border transition-all ${
                              isAnswered
                                ? 'opacity-40 bg-gray-100 dark:bg-gray-800 border-transparent cursor-not-allowed'
                                : isExhausted
                                ? 'opacity-30 bg-gray-200 dark:bg-gray-800 border-transparent cursor-not-allowed'
                                : 'bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)] text-[var(--color-text-primary)] shadow-2xs cursor-pointer'
                            }`}
                          >
                            {seg}
                          </button>
                        );
                      })}

                      {(scrambleBuilt[ex.id]?.length || 0) > 0 && !isAnswered && (
                        <button
                          type="button"
                          onClick={() => handleResetScramble(ex.id)}
                          className="px-2.5 py-1.5 rounded-lg text-xs text-rose-500 hover:bg-rose-500/10 font-bold transition-colors cursor-pointer"
                        >
                          Xóa làm lại
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* DẠNG 2, 3, 4, 5, 6: CÁC DẠNG TRẮC NGHIỆM / ĐIỀN TỪ / GHÉP CẶP / DỊCH CÂU */}
              {ex.type !== 'sentence_scramble' && ex.options && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4">
                  {ex.options.map((opt) => {
                    const isOptionSelected = userAns === opt;
                    const isOptionCorrect = opt === ex.correctAnswer;

                    let btnStyle =
                      'bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-primary)]/50 text-[var(--color-text-primary)]';

                    if (isAnswered) {
                      if (isOptionSelected && isOptionCorrect) {
                        btnStyle = 'bg-emerald-500 text-white border-emerald-500 font-bold shadow-xs';
                      } else if (isOptionSelected && !isOptionCorrect) {
                        btnStyle = 'bg-rose-500 text-white border-rose-500 font-bold shadow-xs';
                      } else if (isOptionCorrect) {
                        btnStyle = 'bg-emerald-500 text-white border-emerald-500 font-bold pointer-events-none shadow-xs';
                      } else {
                        btnStyle =
                          'opacity-50 pointer-events-none bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)]';
                      }
                    } else if (isOptionSelected) {
                      btnStyle = 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] font-bold shadow-xs';
                    }

                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleSelectOption(ex.id, opt)}
                        disabled={isAnswered}
                        className={`p-3 rounded-xl text-xs text-left border transition-all flex items-center justify-between gap-2 cursor-pointer ${btnStyle}`}
                      >
                        <span className="leading-relaxed">{opt}</span>
                        {isAnswered && isOptionCorrect && <Check className="w-4 h-4 shrink-0" />}
                        {isAnswered && isOptionSelected && !isOptionCorrect && <X className="w-4 h-4 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Instant Feedback & Detailed Explanation */}
              {isAnswered && (
                <div
                  className={`mt-4 p-4 rounded-xl text-xs space-y-2.5 border transition-all ${
                    isCorrect
                      ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-800 dark:text-rose-200 border-rose-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <HelpCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                      )}
                      <span className="font-bold text-xs sm:text-sm">
                        {isCorrect ? 'Chính xác! 🎉' : 'Chưa chính xác!'}
                      </span>
                      {!isCorrect && (
                        <span className="px-2 py-0.5 rounded-md bg-[var(--color-surface)] text-[var(--color-text-primary)] font-chinese font-bold border border-[var(--color-border)] text-xs">
                          Đáp án đúng: {ex.correctAnswer}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleResetQuestion(ex.id)}
                      className="px-2.5 py-1 rounded-lg bg-[var(--color-surface)] hover:bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-primary)] font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shrink-0 shadow-2xs"
                      title="Làm lại câu này"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Làm lại câu này</span>
                    </button>
                  </div>

                  {ex.grammarFocus && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-700 dark:text-purple-300 font-semibold text-xs border border-purple-500/20">
                      <span>💡 Trọng điểm:</span>
                      <span>{ex.grammarFocus}</span>
                    </div>
                  )}

                  <div className="text-xs leading-relaxed opacity-95 pt-0.5">
                    {ex.explanation}
                  </div>
                </div>
              )}

              {/* Dedicated Question Note-Taking Section (R3) */}
              <div className="mt-4 pt-3.5 border-t border-[var(--color-border)]/60">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <label
                    htmlFor={`note-${ex.id}`}
                    className="text-xs font-semibold text-[var(--color-text-secondary)] flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileEdit className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                    <span>Ghi chú cá nhân của bạn:</span>
                  </label>
                  {notes[ex.id] && notes[ex.id].trim().length > 0 && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      <Check className="w-3 h-3" />
                      <span>Đã lưu tự động</span>
                    </span>
                  )}
                </div>
                <textarea
                  id={`note-${ex.id}`}
                  value={notes[ex.id] || ''}
                  onChange={(e) => handleUpdateNote(ex.id, e.target.value)}
                  placeholder="Ghi chép từ vựng mới, cấu trúc ngữ pháp cần lưu ý cho câu này..."
                  rows={2}
                  className="w-full p-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)]/60 resize-y transition-all outline-hidden"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
