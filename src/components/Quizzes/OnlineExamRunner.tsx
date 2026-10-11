import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Volume2,
  ChevronLeft,
  ChevronRight,
  Send,
  HelpCircle,
  Flag,
  Award,
  RefreshCw,
  ArrowLeft,
  Flame,
  Sparkles,
} from 'lucide-react';
import { OnlineExamDoc, QuizQuestion, UserProfile, AssignmentSubmissionDoc } from '../../types';
import { playChineseAudio } from '../../utils/chineseAudio';
import { saveSubmissionToFirestore } from '../../lib/firebase';
import { WritingWorkspace } from './WritingWorkspace';

interface OnlineExamRunnerProps {
  exam: OnlineExamDoc;
  userProfile: UserProfile;
  onExit: () => void;
  onCompleted?: (scorePercent: number, correctCount: number) => void;
}

const isAnswerMatch = (userAns: string | undefined, correctAns: string | string[]): boolean => {
  if (!userAns) return false;
  const clean = userAns.trim().toLowerCase();
  if (typeof correctAns === 'string') {
    return clean === correctAns.trim().toLowerCase();
  }
  if (Array.isArray(correctAns)) {
    return correctAns.some((c) => c.trim().toLowerCase() === clean);
  }
  return false;
};

export const OnlineExamRunner: React.FC<OnlineExamRunnerProps> = ({
  exam,
  userProfile,
  onExit,
  onCompleted,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<number, boolean>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(
    exam.duration_minutes > 0 ? exam.duration_minutes * 60 : 0
  );
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [scoreResult, setScoreResult] = useState<{
    correctCount: number;
    totalCount: number;
    percent: number;
    earnedXp: number;
  } | null>(null);

  const questions = exam.questions || [];
  const currentQuestion = questions[currentIndex];

  // Countdown timer
  useEffect(() => {
    if (exam.duration_minutes <= 0 || isSubmitted) return;

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [exam.duration_minutes, isSubmitted]);

  const handleSelectAnswer = (option: string) => {
    if (isSubmitted) return;
    setUserAnswers((prev) => ({
      ...prev,
      [currentIndex]: option,
    }));
  };

  const toggleFlagQuestion = (idx: number) => {
    setFlaggedQuestions((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const handleSubmitExam = async () => {
    setShowConfirmModal(false);
    let correct = 0;
    questions.forEach((q, idx) => {
      const ans = userAnswers[idx];
      if (q.type === 'writing') {
        try {
          if (ans) {
            const parsed = JSON.parse(ans);
            if (parsed && typeof parsed.score === 'number') {
              correct += parsed.score / 100;
            } else {
              correct += 0.8;
            }
          }
        } catch (e) {
          correct += 0.5;
        }
      } else {
        if (isAnswerMatch(ans, q.correctAnswer)) {
          correct++;
        }
      }
    });

    const roundedCorrect = Math.round(correct * 10) / 10;
    const percent = Math.round((correct / questions.length) * 100);
    const xp = Math.round(correct * 10) + (percent >= 80 ? 30 : 10);

    setScoreResult({
      correctCount: roundedCorrect,
      totalCount: questions.length,
      percent,
      earnedXp: xp,
    });
    setIsSubmitted(true);

    // Save submission to Firestore
    try {
      const submissionDoc: AssignmentSubmissionDoc = {
        id: `sub-exam-${Date.now()}`,
        assignment_id: exam.id,
        user_id: userProfile.id,
        user_name: userProfile.displayName || userProfile.email.split('@')[0],
        user_email: userProfile.email,
        class_id: userProfile.class_id,
        score: percent,
        answers: userAnswers,
        feedback: `Hoàn thành bài thi ${exam.title} đạt ${percent}% (${correct}/${questions.length} câu đúng).`,
        submitted_at: new Date().toISOString(),
      };
      await saveSubmissionToFirestore(submissionDoc);
    } catch (e) {
      console.warn('Could not save submission to Firestore:', e);
    }

    if (onCompleted) {
      onCompleted(percent, correct);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const answeredCount = Object.keys(userAnswers).length;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200" id="online-exam-runner">
      {/* Top Navigation & Status Bar */}
      <div className="bg-[var(--color-surface)] p-4 sm:p-5 rounded-2xl border border-[var(--color-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onExit}
            className="p-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-background)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
            title="Thoát bài thi"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 font-mono">
                {exam.exam_code}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                HSK {exam.hsk_level}
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)] line-clamp-1 mt-0.5">
              {exam.title}
            </h2>
          </div>
        </div>

        {/* Right Timer & Status */}
        <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-[var(--color-border)]">
          {exam.duration_minutes > 0 && !isSubmitted && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold border ${
                timeLeftSeconds <= 120
                  ? 'bg-rose-500/15 text-rose-600 border-rose-500/30 animate-pulse'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{formatTime(timeLeftSeconds)}</span>
            </div>
          )}

          {!isSubmitted && (
            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              className="px-4 py-2 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Nộp bài ({answeredCount}/{questions.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* EXAM IN-PROGRESS SCREEN                                                   */}
      {/* ========================================================================= */}
      {!isSubmitted ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Question Area (3 Cols) */}
          <div className="lg:col-span-3 space-y-4">
            {currentQuestion ? (
              <div className="bg-[var(--color-surface)] p-6 sm:p-8 rounded-3xl border border-[var(--color-border)] space-y-6 shadow-sm">
                {/* Question Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-xl bg-[var(--color-primary-light)] text-[var(--color-primary)] font-bold text-xs">
                      Câu hỏi {currentIndex + 1} / {questions.length}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/10 text-indigo-600 uppercase">
                      {currentQuestion.type || 'TRẮC NGHIỆM'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleFlagQuestion(currentIndex)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                      flaggedQuestions[currentIndex]
                        ? 'bg-amber-500/20 text-amber-600 border-amber-500/40'
                        : 'bg-[var(--color-background)] text-[var(--color-text-secondary)] border-[var(--color-border)]'
                    }`}
                  >
                    <Flag className={`w-3.5 h-3.5 ${flaggedQuestions[currentIndex] ? 'fill-amber-500' : ''}`} />
                    <span>{flaggedQuestions[currentIndex] ? 'Đã gắn cờ' : 'Gắn cờ'}</span>
                  </button>
                </div>

                {/* Prompt */}
                <div className="space-y-3">
                  <h3 className="text-base sm:text-lg font-bold text-[var(--color-text-primary)] leading-relaxed">
                    {currentQuestion.prompt}
                  </h3>

                  {currentQuestion.questionChinese && (
                    <div className="p-4 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] flex items-center justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-lg sm:text-xl font-bold font-serif text-[var(--color-text-primary)]">
                          {currentQuestion.questionChinese}
                        </p>
                        {currentQuestion.exampleSentence?.pinyin && (
                          <p className="text-xs text-[var(--color-primary)] font-mono">
                            {currentQuestion.exampleSentence.pinyin}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => playChineseAudio(currentQuestion.questionChinese!)}
                        className="p-2.5 rounded-xl bg-[var(--color-primary-light)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-colors cursor-pointer shrink-0"
                        title="Nghe phát âm chuẩn"
                      >
                        <Volume2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Options List / Writing Workspace */}
                {currentQuestion.type === 'writing' ? (
                  <WritingWorkspace
                    promptText={currentQuestion.prompt}
                    onAnswerSaved={(ansJson) => {
                      setUserAnswers((prev) => ({
                        ...prev,
                        [currentIndex]: ansJson,
                      }));
                    }}
                    savedAnswerJson={userAnswers[currentIndex]}
                  />
                ) : (
                  <div className="grid grid-cols-1 gap-3 pt-2">
                    {currentQuestion.options?.map((opt, oIdx) => {
                      const isSelected = userAnswers[currentIndex] === opt;
                      const letter = String.fromCharCode(65 + oIdx);

                      return (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={() => handleSelectAnswer(opt)}
                          className={`p-4 rounded-2xl border text-left flex items-center gap-3.5 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[var(--color-primary-light)] border-[var(--color-primary)] text-[var(--color-text-primary)] ring-2 ring-[var(--color-primary)]/20 shadow-xs'
                              : 'bg-[var(--color-background)] border-[var(--color-border)] hover:bg-[var(--color-surface)] text-[var(--color-text-primary)]'
                          }`}
                        >
                          <span
                            className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-[var(--color-primary)] text-white'
                                : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)]'
                            }`}
                          >
                            {letter}
                          </span>
                          <span className="text-sm font-medium leading-relaxed">{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Question Navigation Controls */}
                <div className="flex items-center justify-between pt-6 border-t border-[var(--color-border)]">
                  <button
                    type="button"
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                    className="px-4 py-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-background)] text-xs font-bold text-[var(--color-text-primary)] disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Câu trước</span>
                  </button>

                  {currentIndex < questions.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                      className="px-5 py-2 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <span>Câu tiếp theo</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowConfirmModal(true)}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Hoàn tất & Nộp bài</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)]">
                Không tìm thấy nội dung câu hỏi.
              </div>
            )}
          </div>

          {/* Question Grid Map Sidebar (1 Col) */}
          <div className="space-y-4">
            <div className="bg-[var(--color-surface)] p-5 rounded-2xl border border-[var(--color-border)] space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[var(--color-text-primary)]">
                  Danh sách câu hỏi
                </h4>
                <span className="text-[11px] text-[var(--color-text-secondary)] font-semibold">
                  Đã làm: {answeredCount}/{questions.length}
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {questions.map((_, idx) => {
                  const isAnswered = !!userAnswers[idx];
                  const isCurrent = idx === currentIndex;
                  const isFlagged = !!flaggedQuestions[idx];

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-9 rounded-xl text-xs font-bold relative transition-all cursor-pointer flex items-center justify-center ${
                        isCurrent
                          ? 'ring-2 ring-[var(--color-primary)] ring-offset-2 bg-[var(--color-primary)] text-white shadow-xs'
                          : isAnswered
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                          : 'bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]'
                      }`}
                    >
                      {idx + 1}
                      {isFlagged && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-[var(--color-surface)]" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="pt-3 border-t border-[var(--color-border)] space-y-1.5 text-[11px] text-[var(--color-text-secondary)]">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-md bg-emerald-500/30 border border-emerald-500/50" />
                  <span>Đã trả lời</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-md bg-[var(--color-background)] border border-[var(--color-border)]" />
                  <span>Chưa trả lời</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>Đã gắn cờ xem lại</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* POST-EXAM RESULT & PEDAGOGICAL BREAKDOWN                                  */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* Top Score Banner */}
          <div className="bg-[var(--color-surface)] p-6 sm:p-8 rounded-3xl border border-[var(--color-border)] text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-3xl bg-[var(--color-primary-light)] text-[var(--color-primary)] mx-auto flex items-center justify-center shadow-xs">
              <Award className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-[var(--color-text-primary)]">
                Kết Quả Bài Thi Trực Tuyến
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {exam.title} (Mã: {exam.exam_code})
              </p>
            </div>

            {scoreResult && (
              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] min-w-[140px]">
                  <span className="text-xs text-[var(--color-text-secondary)] font-bold">Điểm số</span>
                  <p className="text-2xl font-black text-[var(--color-primary)] mt-1">
                    {scoreResult.percent}%
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] min-w-[140px]">
                  <span className="text-xs text-[var(--color-text-secondary)] font-bold">Số câu đúng</span>
                  <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                    {scoreResult.correctCount} / {scoreResult.totalCount}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] min-w-[140px]">
                  <span className="text-xs text-[var(--color-text-secondary)] font-bold">Điểm thưởng XP</span>
                  <p className="text-2xl font-black text-amber-500 mt-1 flex items-center justify-center gap-1">
                    <Sparkles className="w-5 h-5" />
                    <span>+{scoreResult.earnedXp}</span>
                  </p>
                </div>
              </div>
            )}

            <div className="pt-4 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={onExit}
                className="px-6 py-2.5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Quay lại danh sách đề thi
              </button>
            </div>
          </div>

          {/* Detailed Question Review */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
              Chi tiết bài làm & Lời giải phân tích của AI:
            </h3>

            <div className="space-y-4">
              {questions.map((q, idx) => {
                const userAns = userAnswers[idx];
                const isCorrect = isAnswerMatch(userAns, q.correctAnswer);

                return (
                  <div
                    key={q.id || idx}
                    className={`p-5 rounded-2xl border bg-[var(--color-surface)] space-y-3 ${
                      isCorrect
                        ? 'border-emerald-500/30'
                        : 'border-rose-500/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                            isCorrect
                              ? 'bg-emerald-500 text-white'
                              : 'bg-rose-500 text-white'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-[var(--color-text-primary)]">
                          {q.prompt}
                        </span>
                      </div>

                      {q.questionChinese && (
                        <button
                          type="button"
                          onClick={() => playChineseAudio(q.questionChinese!)}
                          className="p-1 text-[var(--color-primary)] hover:bg-[var(--color-background)] rounded-lg cursor-pointer"
                          title="Nghe phát âm"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {q.questionChinese && (
                      <p className="text-base font-medium font-serif text-[var(--color-text-primary)] pl-8">
                        {q.questionChinese}
                      </p>
                    )}

                    {/* Options Review */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-8">
                      {q.options?.map((opt, oIdx) => {
                        const isChosen = userAns === opt;
                        const isRealCorrect = opt === q.correctAnswer;

                        let style = 'bg-[var(--color-background)] border-[var(--color-border)] text-[var(--color-text-secondary)]';
                        if (isRealCorrect) {
                          style = 'bg-emerald-500/10 border-emerald-500/50 text-emerald-700 dark:text-emerald-300 font-bold';
                        } else if (isChosen && !isRealCorrect) {
                          style = 'bg-rose-500/10 border-rose-500/50 text-rose-600 font-bold line-through';
                        }

                        return (
                          <div
                            key={oIdx}
                            className={`p-3 rounded-xl text-xs border flex items-center gap-2 ${style}`}
                          >
                            <span className="font-bold">{String.fromCharCode(65 + oIdx)}.</span>
                            <span>{opt}</span>
                            {isRealCorrect && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 ml-auto shrink-0" />}
                            {isChosen && !isRealCorrect && <AlertCircle className="w-3.5 h-3.5 text-rose-500 ml-auto shrink-0" />}
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <div className="p-3.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)] ml-8 space-y-1">
                        <span className="font-bold text-[var(--color-text-primary)] flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                          <span>Giải thích sư phạm:</span>
                        </span>
                        <p className="leading-relaxed">{q.explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal Before Submit */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--color-surface)] max-w-md w-full rounded-2xl border border-[var(--color-border)] p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[var(--color-primary)]" />
              <span>Xác nhận Nộp Bài Thi</span>
            </h3>

            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Bạn đã hoàn thành <strong>{answeredCount} / {questions.length}</strong> câu hỏi.
              {answeredCount < questions.length && (
                <span className="text-amber-500 font-bold block mt-1">
                  ⚠️ Lưu ý: Vẫn còn {questions.length - answeredCount} câu chưa chọn đáp án!
                </span>
              )}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs font-bold text-[var(--color-text-primary)] cursor-pointer"
              >
                Tiếp tục làm bài
              </button>
              <button
                type="button"
                onClick={handleSubmitExam}
                className="px-5 py-2 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Nộp bài ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
