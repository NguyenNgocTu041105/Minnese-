import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Volume2,
  CheckCircle2,
  HelpCircle,
  RotateCcw,
  Layers,
  ArrowRight,
  Puzzle,
  FileCheck2,
  MessageSquare,
  Search,
  Check,
  X,
  Flame,
  Award,
  BookOpen,
  Loader2,
  Zap,
  Sliders,
  ChevronRight,
  RefreshCw,
  PlusCircle,
} from 'lucide-react';
import { ExerciseItem, ExerciseType, DetailedTextbookLesson } from '../../data/newHsk1BookData';
import { playChineseAudio } from '../../utils/chineseAudio';

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
  // Exercise collection state (combines built-in + AI generated)
  const [exerciseList, setExerciseList] = useState<ExerciseItem[]>(() => {
    return lesson.exercises || [];
  });

  // User responses
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [scrambleBuilt, setScrambleBuilt] = useState<Record<string, string[]>>({});
  const [isChecked, setIsChecked] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  // AI Generator Modal & State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiQuestionCount, setAiQuestionCount] = useState<number>(10);
  const [aiPracticeMode, setAiPracticeMode] = useState<string>('comprehensive');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiGenError, setAiGenError] = useState<string | null>(null);
  const [aiGenSuccessNotice, setAiGenSuccessNotice] = useState<string | null>(null);
  const [rewardClaimed, setRewardClaimed] = useState(false);

  // When lesson changes, reset
  React.useEffect(() => {
    setExerciseList(lesson.exercises || []);
    setSelectedAnswers({});
    setScrambleBuilt({});
    setIsChecked(false);
    setActiveFilter('all');
    setRewardClaimed(false);
    setAiGenSuccessNotice(null);
  }, [lesson.lessonNumber, hskLevel]);

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

  // Handle Option Selection for Standard Multiple Choice / Fill blank / Translation / Dialogue / Error
  const handleSelectOption = (exerciseId: string, opt: string) => {
    if (isChecked) return; // Locked once checked
    setSelectedAnswers((prev) => ({
      ...prev,
      [exerciseId]: opt,
    }));
  };

  // Handle Scramble Segment Click (add to assembled sentence)
  const handleAddScrambleSegment = (exerciseId: string, segment: string, segmentIdx: number) => {
    if (isChecked) return;
    setScrambleBuilt((prev) => {
      const current = prev[exerciseId] || [];
      const updated = [...current, segment];
      // Also update selectedAnswers with joined string
      setSelectedAnswers((ans) => ({
        ...ans,
        [exerciseId]: updated.join(''),
      }));
      return { ...prev, [exerciseId]: updated };
    });
  };

  // Handle Remove Scramble Segment
  const handleRemoveScrambleSegment = (exerciseId: string, itemIdx: number) => {
    if (isChecked) return;
    setScrambleBuilt((prev) => {
      const current = prev[exerciseId] || [];
      const updated = current.filter((_, idx) => idx !== itemIdx);
      setSelectedAnswers((ans) => ({
        ...ans,
        [exerciseId]: updated.join(''),
      }));
      return { ...prev, [exerciseId]: updated };
    });
  };

  // Reset a scramble exercise
  const handleResetScramble = (exerciseId: string) => {
    if (isChecked) return;
    setScrambleBuilt((prev) => ({ ...prev, [exerciseId]: [] }));
    setSelectedAnswers((prev) => {
      const next = { ...prev };
      delete next[exerciseId];
      return next;
    });
  };

  // AI Generator Trigger
  const handleGenerateAiExercises = async () => {
    setIsGeneratingAi(true);
    setAiGenError(null);
    setAiGenSuccessNotice(null);

    try {
      const res = await fetch('/api/gemini/generate-lesson-exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hskLevel,
          lessonNumber: lesson.lessonNumber,
          titleHanzi: lesson.titleHanzi,
          titleVietnamese: lesson.titleVietnamese,
          vocabulary: lesson.vocabulary,
          grammarPoints: lesson.grammarPoints,
          count: aiQuestionCount,
          practiceMode: aiPracticeMode,
        }),
      });

      if (!res.ok) {
        throw new Error(`Máy chủ phản hồi mã ${res.status}`);
      }

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Hệ thống đang khởi động lại hoặc phản hồi chưa sẵn sàng. Vui lòng thử lại sau giây lát!');
      }

      const data = await res.json();
      if (Array.isArray(data.exercises) && data.exercises.length > 0) {
        const newItems: ExerciseItem[] = data.exercises.map((item: any, idx: number) => ({
          id: item.id || `ai-ex-${Date.now()}-${idx}`,
          type: item.type || 'multiple_choice',
          question: item.question || 'Chọn đáp án đúng:',
          hanziPrompt: item.hanziPrompt || '',
          pinyinPrompt: item.pinyinPrompt || '',
          vietnamesePrompt: item.vietnamesePrompt || '',
          options: Array.isArray(item.options) && item.options.length > 0 ? item.options : ['A', 'B', 'C', 'D'],
          scrambleSegments: Array.isArray(item.scrambleSegments) ? item.scrambleSegments : undefined,
          correctAnswer: item.correctAnswer || item.options?.[0] || '',
          explanation: item.explanation || 'Phân tích ngữ pháp chuẩn xác.',
          grammarFocus: item.grammarFocus || 'Ngữ pháp bài học',
          audioText: item.audioText || item.hanziPrompt || item.correctAnswer || '',
        }));

        setExerciseList(newItems);
        setSelectedAnswers({});
        setScrambleBuilt({});
        setIsChecked(false);
        setIsAiModalOpen(false);
        setAiGenSuccessNotice(`Đã tạo thành công ${newItems.length} câu bài tập chất lượng cao theo bài học!`);
      } else {
        throw new Error('Không nhận được dữ liệu bài tập hợp lệ.');
      }
    } catch (err: any) {
      console.error('AI Generator error:', err);
      setAiGenError(err?.message || 'Không thể tạo bài tập vào lúc này. Vui lòng thử lại!');
    } finally {
      setIsGeneratingAi(false);
    }
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
      const userAns = selectedAnswers[ex.id]?.trim();
      if (userAns) {
        answered++;
        // Compare normalized strings
        const cleanUser = userAns.replace(/\s+/g, '').toLowerCase();
        const cleanCorrect = ex.correctAnswer.replace(/\s+/g, '').toLowerCase();
        // Also check if user selected an option starting with option letter or exact match
        if (cleanUser === cleanCorrect || cleanUser.includes(cleanCorrect) || cleanCorrect.includes(cleanUser)) {
          correct++;
        }
      }
    });

    const pct = exerciseList.length > 0 ? Math.round((correct / exerciseList.length) * 100) : 0;
    return { totalAnswered: answered, correctCount: correct, scorePercentage: pct };
  }, [exerciseList, selectedAnswers]);

  // Submit and Check
  const handleCheckAnswers = () => {
    setIsChecked(true);
    if (!rewardClaimed && correctCount > 0 && onUpdateUserXp) {
      onUpdateUserXp(correctCount * 10);
      setRewardClaimed(true);
    }
  };

  // Reset entire exercise set
  const handleResetAll = () => {
    setSelectedAnswers({});
    setScrambleBuilt({});
    setIsChecked(false);
    setRewardClaimed(false);
  };

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

        {/* Action Buttons: AI Generator & Check Answers */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsAiModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>✨ Sinh thêm bài tập AI</span>
          </button>

          {isChecked ? (
            <button
              type="button"
              onClick={handleResetAll}
              className="px-3.5 py-2 rounded-xl bg-[var(--color-bg-secondary)] hover:bg-[var(--color-border)] text-[var(--color-text-primary)] font-bold text-xs flex items-center gap-1.5 border border-[var(--color-border)] transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Làm lại
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCheckAnswers}
              disabled={totalAnswered === 0}
              className="px-4 py-2 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] disabled:opacity-50 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Kiểm tra đáp án ({totalAnswered}/{exerciseList.length})
            </button>
          )}
        </div>
      </div>

      {/* Success Notification if generated */}
      {aiGenSuccessNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="font-medium">{aiGenSuccessNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setAiGenSuccessNotice(null)}
            className="text-xs underline cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

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

      {/* Checked Result Banner */}
      {isChecked && (
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
                  Đúng {correctCount} / {exerciseList.length} câu
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                Bạn đã nhận được <span className="font-bold text-amber-500">+{correctCount * 10} XP</span> kinh nghiệm ôn tập!
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
            <button
              type="button"
              onClick={() => setIsAiModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Luyện thêm câu mới
            </button>
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-5">
        {filteredExercises.map((ex, exIdx) => {
          const userAns = selectedAnswers[ex.id] || '';
          const isCorrect = isChecked && (
            userAns.replace(/\s+/g, '').toLowerCase() === ex.correctAnswer.replace(/\s+/g, '').toLowerCase() ||
            userAns.trim().toLowerCase().includes(ex.correctAnswer.trim().toLowerCase()) ||
            ex.correctAnswer.trim().toLowerCase().includes(userAns.trim().toLowerCase())
          );

          return (
            <div
              key={ex.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                isChecked
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
                  <div className="min-h-12 p-3 rounded-xl bg-[var(--color-surface)] border-2 border-dashed border-[var(--color-primary)]/30 flex flex-wrap items-center gap-1.5">
                    {scrambleBuilt[ex.id] && scrambleBuilt[ex.id].length > 0 ? (
                      scrambleBuilt[ex.id].map((seg, sIdx) => (
                        <button
                          key={`${seg}-${sIdx}`}
                          type="button"
                          onClick={() => handleRemoveScrambleSegment(ex.id, sIdx)}
                          className="px-3 py-1.5 rounded-lg bg-[var(--color-primary)] text-white text-xs font-bold font-chinese flex items-center gap-1 hover:bg-rose-500 transition-colors shadow-2xs cursor-pointer"
                          title="Bấm để xóa từ này"
                        >
                          <span>{seg}</span>
                          <X className="w-3 h-3 opacity-80" />
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
                        // Count how many times this segment has been used
                        const usedCount = (scrambleBuilt[ex.id] || []).filter((s) => s === seg).length;
                        const totalAvailable = ex.scrambleSegments!.filter((s) => s === seg).length;
                        const isExhausted = usedCount >= totalAvailable;

                        return (
                          <button
                            key={`${seg}-${sIdx}`}
                            type="button"
                            disabled={isExhausted || isChecked}
                            onClick={() => handleAddScrambleSegment(ex.id, seg, sIdx)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-chinese border transition-all cursor-pointer ${
                              isExhausted
                                ? 'opacity-30 bg-gray-200 dark:bg-gray-800 border-transparent cursor-not-allowed'
                                : 'bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)] text-[var(--color-text-primary)] shadow-2xs'
                            }`}
                          >
                            {seg}
                          </button>
                        );
                      })}

                      {(scrambleBuilt[ex.id]?.length || 0) > 0 && !isChecked && (
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

                    let btnStyle = 'bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-primary)]/50 text-[var(--color-text-primary)]';

                    if (isChecked) {
                      if (isOptionCorrect) {
                        btnStyle = 'bg-emerald-500 text-white border-emerald-500 font-bold';
                      } else if (isOptionSelected && !isOptionCorrect) {
                        btnStyle = 'bg-rose-500 text-white border-rose-500 font-bold';
                      } else {
                        btnStyle = 'opacity-50 bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)]';
                      }
                    } else if (isOptionSelected) {
                      btnStyle = 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] font-bold shadow-xs';
                    }

                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleSelectOption(ex.id, opt)}
                        disabled={isChecked}
                        className={`p-3 rounded-xl text-xs text-left border transition-all flex items-center justify-between gap-2 cursor-pointer ${btnStyle}`}
                      >
                        <span className="leading-relaxed">{opt}</span>
                        {isChecked && isOptionCorrect && <Check className="w-4 h-4 shrink-0" />}
                        {isChecked && isOptionSelected && !isOptionCorrect && <X className="w-4 h-4 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Checked Feedback & Detailed Explanation */}
              {isChecked && (
                <div
                  className={`mt-4 p-3.5 rounded-xl text-xs flex items-start gap-2.5 border ${
                    isCorrect
                      ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-800 dark:text-rose-200 border-rose-500/30'
                  }`}
                >
                  {isCorrect ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <HelpCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1 flex-1">
                    <div className="font-bold flex items-center gap-2">
                      <span>{isCorrect ? 'Chính xác! 🎉' : 'Chưa chính xác'}</span>
                      {!isCorrect && (
                        <span className="px-2 py-0.5 rounded-md bg-[var(--color-surface)] text-[var(--color-text-primary)] font-chinese font-bold border border-[var(--color-border)]">
                          Đáp án đúng: {ex.correctAnswer}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] leading-relaxed opacity-95">
                      {ex.explanation}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* AI Generator Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
              <div className="flex items-center gap-2 text-amber-500">
                <Sparkles className="w-5 h-5" />
                <h4 className="text-base font-bold text-[var(--color-text-primary)]">
                  Sinh thêm bài tập AI thông minh
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                className="p-1 rounded-lg hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[var(--color-text-primary)] mb-1.5">
                  Bài học mục tiêu:
                </label>
                <div className="p-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] font-semibold text-[var(--color-text-primary)] flex items-center justify-between">
                  <span>
                    HSK {hskLevel} • Bài {lesson.lessonNumber}: {lesson.titleHanzi} ({lesson.titleVietnamese})
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-[var(--color-primary-light)] text-[var(--color-primary)] font-bold">
                    {lesson.vocabulary.length} từ vựng
                  </span>
                </div>
              </div>

              {/* Choose Question Count */}
              <div>
                <label className="block font-bold text-[var(--color-text-primary)] mb-1.5">
                  Số lượng câu hỏi muốn tạo:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[5, 10, 15].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setAiQuestionCount(cnt)}
                      className={`py-2 rounded-xl font-bold border transition-all cursor-pointer ${
                        aiQuestionCount === cnt
                          ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-2xs'
                          : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] border-[var(--color-border)] hover:border-[var(--color-primary)]/50'
                      }`}
                    >
                      {cnt} câu hỏi
                    </button>
                  ))}
                </div>
              </div>

              {/* Choose Practice Mode */}
              <div>
                <label className="block font-bold text-[var(--color-text-primary)] mb-1.5">
                  Định hướng rèn luyện & Dạng bài:
                </label>
                <div className="space-y-2">
                  {[
                    {
                      id: 'comprehensive',
                      title: '🌟 Tổng hợp đa dạng 6 dạng bài',
                      desc: 'Bao gồm sắp xếp câu, điền từ, trắc nghiệm, ghép hội thoại, tìm lỗi sai và dịch mẫu câu.',
                    },
                    {
                      id: 'sentence_scramble',
                      title: '🧩 Chuyên sâu sắp xếp câu & Trật tự từ',
                      desc: 'Tập trung rèn phản xạ ngữ pháp, vị trí trạng ngữ, bổ ngữ và trật tự câu tiếng Trung.',
                    },
                    {
                      id: 'fill_blank',
                      title: '✍️ Điền từ vào chỗ trống & Lượng từ/Phó từ',
                      desc: 'Luyện chọn chính xác hư từ, liên từ và từ vựng trọng tâm theo ngữ cảnh.',
                    },
                    {
                      id: 'real_world',
                      title: '💬 Giao tiếp & Ứng dụng thực tế đời sống',
                      desc: 'Mẫu câu khẩu ngữ, ứng dụng từ vựng bài học vào các tình huống thực tế.',
                    },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setAiPracticeMode(mode.id)}
                      className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        aiPracticeMode === mode.id
                          ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)] text-[var(--color-text-primary)]'
                          : 'bg-[var(--color-bg-secondary)] border-[var(--color-border)] hover:border-[var(--color-primary)]/40 text-[var(--color-text-primary)]'
                      }`}
                    >
                      <div className="font-bold flex items-center justify-between">
                        <span>{mode.title}</span>
                        {aiPracticeMode === mode.id && <Check className="w-4 h-4 text-[var(--color-primary)]" />}
                      </div>
                      <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
                        {mode.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {aiGenError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-medium">
                  {aiGenError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[var(--color-border)]">
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                disabled={isGeneratingAi}
                className="px-4 py-2 rounded-xl bg-[var(--color-bg-secondary)] hover:bg-[var(--color-border)] text-xs font-bold text-[var(--color-text-primary)] transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleGenerateAiExercises}
                disabled={isGeneratingAi}
                className="px-5 py-2 rounded-xl bg-[var(--color-primary)] hover:opacity-95 text-white font-bold text-xs shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isGeneratingAi ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>AI đang biên soạn bài tập...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Tạo {aiQuestionCount} câu ngay</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
