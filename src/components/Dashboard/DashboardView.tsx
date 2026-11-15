import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  GraduationCap,
  Volume2,
  Lock,
  KeyRound,
} from 'lucide-react';
import { isUserAdmin } from '../../lib/firebase';
import { UserProfile, SRSCardState, UserStats, AssignmentDoc, AssignmentSubmissionDoc } from '../../types';
import { NEW_HSK1_FULL_LESSONS } from '../../data/newHsk1BookData';
import { NEW_HSK2_FULL_LESSONS } from '../../data/newHsk2BookData';
import { NEW_HSK3_FULL_LESSONS } from '../../data/newHsk3BookData';
import { NEW_HSK4_FULL_LESSONS } from '../../data/newHsk4BookData';
import { getCoursebookDueStats } from '../../utils/coursebookVocab';
import { TeacherVoicePlayer } from '../Feedback/TeacherVoicePlayer';
import { getCalendarDayDiff } from '../../utils/streak';

interface DashboardViewProps {
  userProfile: UserProfile;
  stats: UserStats;
  srsCards: Record<string, SRSCardState>;
  onNavigate: (tab: any) => void;
  onStartReview?: (mode?: 'due_only' | 'all') => void;
  assignments: AssignmentDoc[];
  submissions?: AssignmentSubmissionDoc[];
  onOpenVoiceCall?: () => void;
  onOpenJoinClass?: () => void;
  onStartAssignment?: (asg: AssignmentDoc) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  userProfile,
  stats,
  srsCards,
  onNavigate,
  onStartReview,
  assignments,
  submissions = [],
  onOpenVoiceCall,
  onOpenJoinClass,
  onStartAssignment,
}) => {
  const isAdmin = userProfile?.role === 'admin' || userProfile?.email === 'babysharkkk123@gmail.com' || isUserAdmin(userProfile?.email);
  const hasEnrolledClass = Boolean(userProfile?.class_code);
  const userPrefix = userProfile?.id ? `minnie_${userProfile.id}_` : 'minnie_';

  const userLevel = (userProfile.current_level as 1 | 2 | 3 | 4) || 1;
  const levelLessons =
    userLevel === 1
      ? NEW_HSK1_FULL_LESSONS
      : userLevel === 2
      ? NEW_HSK2_FULL_LESSONS
      : userLevel === 3
      ? NEW_HSK3_FULL_LESSONS
      : NEW_HSK4_FULL_LESSONS;
  const totalLessons = levelLessons.length || (userLevel === 3 || userLevel === 4 ? 10 : 15);

  const [completedLessonNums, setCompletedLessonNums] = useState<number[]>(() => {
    if (!hasEnrolledClass && !isAdmin) return [];
    try {
      const savedUser = localStorage.getItem(`${userPrefix}completed_lessons_hsk_${userLevel}`);
      if (savedUser) return JSON.parse(savedUser);
      const saved = localStorage.getItem(`minnie_completed_lessons_hsk_${userLevel}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [activeLessonIndex, setActiveLessonIndex] = useState<number>(() => {
    if (!hasEnrolledClass && !isAdmin) return 0;
    try {
      const savedUser = localStorage.getItem(`${userPrefix}current_lesson_hsk_${userLevel}`);
      if (savedUser !== null) {
        const val = parseInt(savedUser, 10);
        if (!isNaN(val) && val >= 0 && val < totalLessons) return val;
      }
      const saved = localStorage.getItem(`minnie_current_lesson_hsk_${userLevel}`);
      if (saved !== null) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= 0 && val < totalLessons) return val;
      }
    } catch {}
    return 0; // index 0 = Bài 1
  });

  // Calculate Due Cards strictly based on coursebook lessons studied so far
  const coursebookDue = React.useMemo(() => {
    return getCoursebookDueStats(userLevel, srsCards);
  }, [userLevel, srsCards, activeLessonIndex, completedLessonNums]);

  // Student's graded submissions and voice feedback
  const mySubmissions = React.useMemo(() => {
    return submissions.filter(
      (sub) =>
        sub.user_id === userProfile.id ||
        sub.student_id === userProfile.id ||
        (sub.user_email && userProfile.email && sub.user_email.toLowerCase() === userProfile.email.toLowerCase())
    );
  }, [submissions, userProfile.id, userProfile.email]);

  const voiceFeedbackSubs = React.useMemo(() => {
    return mySubmissions.filter((s) => s.teacher_voice_url);
  }, [mySubmissions]);

  useEffect(() => {
    const syncProgress = () => {
      if (!hasEnrolledClass && !isAdmin) {
        setCompletedLessonNums([]);
        setActiveLessonIndex(0);
        return;
      }
      try {
        const savedUserComp = localStorage.getItem(`${userPrefix}completed_lessons_hsk_${userLevel}`);
        const savedComp = savedUserComp || localStorage.getItem(`minnie_completed_lessons_hsk_${userLevel}`);
        if (savedComp) setCompletedLessonNums(JSON.parse(savedComp));

        const savedUserIdx = localStorage.getItem(`${userPrefix}current_lesson_hsk_${userLevel}`);
        const savedIdx = savedUserIdx !== null ? savedUserIdx : localStorage.getItem(`minnie_current_lesson_hsk_${userLevel}`);
        if (savedIdx !== null) {
          const val = parseInt(savedIdx, 10);
          if (!isNaN(val) && val >= 0 && val < totalLessons) setActiveLessonIndex(val);
        }
      } catch {}
    };

    window.addEventListener('storage', syncProgress);
    window.addEventListener('minnie_lesson_progress_updated', syncProgress);
    return () => {
      window.removeEventListener('storage', syncProgress);
      window.removeEventListener('minnie_lesson_progress_updated', syncProgress);
    };
  }, [userLevel, totalLessons, hasEnrolledClass, isAdmin, userPrefix]);

  const currentLessonData = levelLessons[activeLessonIndex] || levelLessons[0];
  const completedCount = completedLessonNums.length;
  // Progress percentage across the curriculum
  const lessonProgressPercent = (!hasEnrolledClass && !isAdmin)
    ? 0
    : Math.min(
        100,
        Math.round(((completedCount > 0 ? completedCount : (activeLessonIndex + 1)) / totalLessons) * 100)
      );

  // Filter assignments matching user's official HSK level, enrolled class, or created assignments
  const userAssignments = assignments.filter((a) => {
    if (!a.is_active) return false;
    // Hide assignments that expired more than 7 days ago, but keep recent overdue ones visible for students
    if (a.due_date) {
      const dueTime = new Date(a.due_date).getTime();
      const sevenDaysAgo = Date.now() - 7 * 86400000;
      if (dueTime < sevenDaysAgo) return false;
    }
    if (isAdmin) return true;
    if (a.target_type === 'class' && a.target_class_id) {
      return (
        userProfile.class_id === a.target_class_id ||
        userProfile.class_code === a.target_class_id ||
        a.hsk_level === userProfile.current_level
      );
    }
    return a.hsk_level === userProfile.current_level || a.target_type === 'all';
  });

  // User's customizable daily goal
  const [dailyGoalCards, setDailyGoalCards] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('minnie_daily_goal_cards');
      if (saved) return parseInt(saved, 10);
    } catch {}
    return userProfile.words_per_day || 15;
  });

  const handleSetDailyGoalCards = (val: number) => {
    setDailyGoalCards(val);
    try {
      localStorage.setItem('minnie_daily_goal_cards', String(val));
    } catch {}
  };

  const cardsReviewedToday = stats.cardsReviewedToday || 0;
  const dailyGoalPercent = Math.min(100, Math.round((cardsReviewedToday / dailyGoalCards) * 100));

  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 space-y-6 sm:space-y-8 animate-fade-in" id="dashboard-container">
      {/* Zone A: Header Welcome & Goal Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 silk-card p-5 sm:p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[var(--color-primary)]/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-2xl">👋</span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Chào {userProfile.displayName || 'Học viên Minnie Chinese'}!
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--color-primary-light)] text-[var(--color-primary)] border border-[var(--color-primary)]/20 shadow-xs">
              HSK {userProfile.current_level || 1}
            </span>
            {userProfile.class_code && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                Lớp {userProfile.class_code}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
            Chúc bạn một ngày học tiếng Trung hiệu quả và tràn đầy hứng khởi!
          </p>
        </div>

        {/* Daily Goal Mini Status Display & Selector */}
        <div className="flex items-center gap-3 relative z-10 shrink-0 bg-[var(--color-background)] px-4 py-2.5 rounded-2xl border border-[var(--color-border)] shadow-xs">
          <div className="relative w-10 h-10 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-[var(--color-border)]"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-[var(--color-primary)] transition-all duration-500"
                strokeDasharray={`${dailyGoalPercent}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute font-mono font-bold text-[10px] text-[var(--color-text-primary)]">
              {dailyGoalPercent}%
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-[var(--color-text-secondary)]">
              <span>Mục tiêu ngày:</span>
              <select
                value={dailyGoalCards}
                onChange={(e) => handleSetDailyGoalCards(Number(e.target.value))}
                className="bg-transparent font-bold text-[var(--color-primary)] focus:outline-none cursor-pointer"
                title="Thay đổi mục tiêu học mỗi ngày"
              >
                <option value={10}>10 thẻ</option>
                <option value={15}>15 thẻ</option>
                <option value={20}>20 thẻ</option>
                <option value={30}>30 thẻ</option>
              </select>
            </div>
            <div className="text-xs font-bold text-[var(--color-text-primary)]">
              {cardsReviewedToday} / {dailyGoalCards} thẻ ôn
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Coursebook Level Progress (Left) & Assigned Homework (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Coursebook Level Progress & Current Lesson Widget */}
        <div className="lg:col-span-1 silk-card p-6 flex flex-col justify-between space-y-5">
          {!hasEnrolledClass && !isAdmin ? (
            <div className="flex flex-col h-full justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-amber-500" />
                    <div>
                      <h2 className="font-bold text-base text-[var(--color-text-primary)]">
                        Giáo trình New HSK
                      </h2>
                      <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
                        Giáo trình chuẩn New HSK • Nhiều cấp độ
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    Chưa kích hoạt
                  </span>
                </div>

                {/* Locked illustration card */}
                <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl p-5 text-center space-y-3 my-2">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center mx-auto shadow-sm">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-[var(--color-text-primary)]">
                      Chưa tham gia lớp học
                    </h3>
                    <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                      Giáo trình được phân quyền riêng biệt cho từng lớp học. Vui lòng kích hoạt Mã lớp học (Class Code) do giáo viên cung cấp để bắt đầu học.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenJoinClass) {
                      onOpenJoinClass();
                    } else {
                      onNavigate('coursebook');
                    }
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-[var(--color-primary)] text-white font-bold text-xs sm:text-sm hover:bg-[var(--color-primary-dark)] flex items-center justify-center gap-2 transition-all shadow-md shadow-[var(--color-primary)]/20 cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Kích hoạt mã lớp học ngay</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('quizzes')}
                  className="w-full py-2 px-3 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-xs font-medium flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-emerald-500" />
                    Luyện thi & làm trắc nghiệm HSK tự do
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-[var(--color-primary)]" />
                    <div>
                      <h2 className="font-bold text-base text-[var(--color-text-primary)]">
                        Tiến độ giáo trình HSK {userLevel}
                      </h2>
                      <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
                        Giáo trình chuẩn New HSK {userLevel} • {totalLessons} bài học
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                    {lessonProgressPercent}%
                  </span>
                </div>

                {/* Circular Progress Ring - Lesson Progress */}
                <div className="relative w-36 h-36 mx-auto flex items-center justify-center my-3">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="var(--color-border)"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="var(--color-primary)"
                      strokeWidth="8"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - lessonProgressPercent / 100)}`}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-3xl font-extrabold text-[var(--color-text-primary)] font-mono">
                      {currentLessonData.lessonNumber}
                    </span>
                    <span className="text-[11px] text-[var(--color-text-secondary)] block font-medium">
                      / {totalLessons} bài học
                    </span>
                  </div>
                </div>

                {/* Current Lesson Info Card */}
                <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-3 text-left space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-[var(--color-primary)] flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5" />
                      Bài học hiện tại
                    </span>
                    <span className="text-[var(--color-text-secondary)] font-mono">
                      Trang {currentLessonData.pageStart}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold font-chinese text-[var(--color-text-primary)]">
                      Bài {currentLessonData.lessonNumber}: {currentLessonData.titleHanzi}
                    </span>
                    <span className="text-xs text-[var(--color-text-secondary)] truncate">
                      ({currentLessonData.titleVietnamese})
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--color-text-secondary)] line-clamp-1">
                    {currentLessonData.objectives?.[0] || currentLessonData.titlePinyin}
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-[var(--color-border)]/50 text-[11px]">
                    <span className="text-[var(--color-text-secondary)]">Trạng thái:</span>
                    <span className={`font-semibold ${completedLessonNums.includes(currentLessonData.lessonNumber) ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {completedLessonNums.includes(currentLessonData.lessonNumber) ? '✓ Đã hoàn thành' : '📖 Đang tiếp diễn'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => onNavigate('coursebook')}
                  className="w-full py-2.5 px-4 rounded-xl bg-[var(--color-primary)] text-white font-bold text-xs sm:text-sm hover:bg-[var(--color-primary-dark)] flex items-center justify-center gap-2 transition-all shadow-md shadow-[var(--color-primary)]/20 cursor-pointer"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Vào học Giáo trình HSK {userLevel} (Bài {currentLessonData.lessonNumber})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('tutor')}
                  className="w-full py-2 px-3 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-xs font-medium flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                    Luyện đàm thoại bài khóa với Gia sư AI
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}
        </div>
        {/* Homework / Assigned Tasks (Right 2/3 Column) */}
        <div className="lg:col-span-2 silk-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[var(--color-primary)]" />
            <h2 className="font-bold text-base text-[var(--color-text-primary)]">
              Bài tập được giao (HSK {userProfile.current_level})
            </h2>
          </div>
          <span className="text-xs text-[var(--color-text-secondary)]">
            Tự động đồng bộ theo cấp độ học viên
          </span>
        </div>

        {userAssignments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...userAssignments]
              .sort((a, b) => {
                const aSub = mySubmissions.some((s) => s.assignment_id === a.id);
                const bSub = mySubmissions.some((s) => s.assignment_id === b.id);
                if (aSub !== bSub) return aSub ? 1 : -1;
                const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0;
                const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0;
                if (bCreated !== aCreated) return bCreated - aCreated;
                const aDue = a.due_date ? new Date(a.due_date).getTime() : Infinity;
                const bDue = b.due_date ? new Date(b.due_date).getTime() : Infinity;
                return aDue - bDue;
              })
              .map((assign, assignIdx) => {
                const now = Date.now();
                const dueTime = assign.due_date ? new Date(assign.due_date).getTime() : null;
                const diffMs = dueTime ? dueTime - now : null;
                const calDiffDays = assign.due_date
                  ? getCalendarDayDiff(new Date().toISOString(), assign.due_date)
                  : null;

                const mySub = mySubmissions.find((s) => s.assignment_id === assign.id);
                const isSubmitted = !!mySub;
                const isNewest = assignIdx === 0 && !isSubmitted;
                const createdLabel = assign.created_at
                  ? new Date(assign.created_at).toLocaleString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      day: '2-digit',
                      month: '2-digit',
                    })
                  : null;

                let dueBadge = null;
                if (isSubmitted) {
                  dueBadge = {
                    text: mySub.score !== undefined ? `Đã nộp (${mySub.score}đ)` : 'Đã nộp bài',
                    className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 font-bold',
                  };
                } else if (dueTime !== null && diffMs !== null && calDiffDays !== null) {
                  if (diffMs < 0) {
                    const overdueDays = Math.max(1, Math.abs(calDiffDays));
                    dueBadge = {
                      text: `Quá hạn ${overdueDays} ngày`,
                      className: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25 font-bold',
                    };
                  } else if (diffMs <= 24 * 60 * 60 * 1000 || calDiffDays <= 0) {
                    const hours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));
                    dueBadge = {
                      text: `Hạn chót: Còn ${hours}h`,
                      className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 font-bold',
                    };
                  } else {
                    dueBadge = {
                      text: `Hạn: Còn ${calDiffDays} ngày (${new Date(assign.due_date).toLocaleDateString('vi-VN')})`,
                      className: 'bg-slate-500/10 text-slate-600 dark:text-slate-300 border border-slate-500/20 font-medium',
                    };
                  }
                }

                // Disambiguate titles like EXAM-9380
                const rawTitle = assign.title || '';
                const isGenericExam = /^EXAM-\d+/i.test(rawTitle) || rawTitle.trim().toLowerCase() === 'bài tập mới';
                const displayTitle = isGenericExam && assign.content_type === 'quiz'
                  ? `Đề HSK ${assign.hsk_level || userLevel} • ${assign.question_count || 10} câu`
                  : rawTitle;

                return (
                  <div
                    key={assign.id}
                    className={`silk-card-interactive p-4.5 rounded-2xl flex flex-col justify-between gap-3 ${
                      isNewest ? 'ring-1 ring-[var(--color-primary)]/40' : ''
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isNewest && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-500 text-white shadow-xs">
                            ✨ Mới nhất
                          </span>
                        )}
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-[var(--color-primary-light)] text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                          {assign.content_type === 'quiz'
                            ? 'Trắc nghiệm & Đề thi'
                            : assign.content_type === 'deck'
                            ? 'Bộ thẻ Flashcards'
                            : assign.content_type === 'reading'
                            ? 'Luyện Đọc hiểu'
                            : assign.content_type === 'speaking'
                            ? 'Luyện Nói & Phát âm'
                            : 'Luyện Viết chữ Hán'}
                        </span>
                        {assign.exam_code && (
                          <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">
                            Mã: {assign.exam_code}
                          </span>
                        )}
                        {createdLabel && (
                          <span className="text-[10px] text-[var(--color-text-secondary)]">
                            Giao lúc {createdLabel}
                          </span>
                        )}
                        {dueBadge && (
                          <span className={`text-[11px] px-2 py-0.5 rounded-full ml-auto ${dueBadge.className}`}>
                            {dueBadge.text}
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-sm text-[var(--color-text-primary)]">
                        {displayTitle}
                      </h3>

                      {assign.description && (
                        <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2">
                          {assign.description}
                        </p>
                      )}

                      {/* Attached Content Details */}
                      <div className="pt-1 flex flex-wrap items-center gap-2 text-[11px] text-[var(--color-text-secondary)]">
                        {assign.content_type === 'quiz' && (
                          <span className="font-medium text-[var(--color-primary)] bg-[var(--color-primary-light)]/40 px-2 py-0.5 rounded">
                            📝 {assign.question_count || 10} câu hỏi trắc nghiệm ({assign.duration_minutes || 15} phút)
                          </span>
                        )}
                        {assign.content_type === 'deck' && (
                          <span className="font-medium text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded">
                            🗂️ {assign.vocab_words?.length || 15} từ vựng cần học thuộc
                          </span>
                        )}
                        {assign.content_type === 'reading' && assign.reading_topic && (
                          <span className="font-medium text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded">
                            📖 Chủ đề: {assign.reading_topic}
                          </span>
                        )}
                        {assign.content_type === 'writing' && (
                          <span className="font-medium text-purple-600 bg-purple-500/10 px-2 py-0.5 rounded">
                            ✍️ Viết tay nộp ảnh chấm nét OCR
                          </span>
                        )}
                        {assign.content_type === 'speaking' && (
                          <span className="font-medium text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded">
                            🎙️ Ghi âm trực tiếp hoặc tải file nói lên web
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[var(--color-border)] flex items-center justify-between gap-2">
                      <span className={`text-[11px] flex items-center gap-1 ${
                        isSubmitted
                          ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                          : 'text-[var(--color-text-secondary)]'
                      }`}>
                        {isSubmitted ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            Đã hoàn thành
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                            Chưa hoàn thành
                          </>
                        )}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          if (onStartAssignment) {
                            onStartAssignment(assign);
                          } else {
                            if (assign.content_type === 'quiz') {
                              onNavigate('quizzes');
                            } else if (assign.content_type === 'deck') {
                              onNavigate('flashcards');
                            } else {
                              onNavigate('quizzes');
                            }
                          }
                        }}
                        className={`silk-btn px-4 py-2 min-h-[44px] rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs whitespace-nowrap flex items-center justify-center ${
                          isSubmitted
                            ? 'bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200'
                            : 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]'
                        }`}
                      >
                        {isSubmitted ? 'Làm lại bài tập ↻' : 'Bắt đầu làm bài →'}
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="text-center py-6 text-[var(--color-text-secondary)] text-sm">
            <CheckCircle2 className="w-8 h-8 text-[var(--color-primary)] mx-auto mb-2 opacity-80" />
            Bạn đã hoàn thành tất cả bài tập được giao cho cấp độ HSK {userProfile.current_level}!
          </div>
        )}
        </div>
      </div>

      {/* Teacher Voice Pronunciation & Homework Feedback Lab - Only shown when teacher has left voice feedback */}
      {voiceFeedbackSubs.length > 0 && (
        <div className="silk-card p-4 sm:p-5 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-rose-500" />
              <h2 className="font-bold text-sm sm:text-base text-[var(--color-text-primary)]">
                Voice Chữa Phát Âm Của Giáo Viên
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/15 text-rose-600">
                {voiceFeedbackSubs.length} bản nhận xét
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {voiceFeedbackSubs.map((sub) => (
              <TeacherVoicePlayer
                key={sub.id}
                voiceUrl={sub.teacher_voice_url!}
                duration={sub.teacher_voice_duration}
                teacherName={sub.teacher_name || 'Cô giáo Minnese Chinese'}
                feedbackText={sub.feedback}
                pronunciationNotes={sub.pronunciation_notes}
                createdAt={sub.completed_at || sub.submitted_at}
                score={sub.score}
                assignmentTitle={sub.assignment_title}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
