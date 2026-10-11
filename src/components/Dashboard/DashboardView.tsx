import React, { useState, useEffect } from 'react';
import {
  Flame,
  Trophy,
  Target,
  Sparkles,
  Calendar,
  Layers,
  ArrowRight,
  BookOpen,
  Award,
  Zap,
  CheckCircle2,
  Clock,
  TrendingUp,
  FileText,
  Play,
  RotateCcw,
  Shield,
  Briefcase,
  Sliders,
  GraduationCap,
  Volume2,
  RotateCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { UserProfile, SRSCardState, UserStats, AssignmentDoc, AssignmentSubmissionDoc } from '../../types';
import { INITIAL_VOCABULARY } from '../../data/hskVocabulary';
import { playChineseAudio } from '../../utils/chineseAudio';
import { NEW_HSK1_FULL_LESSONS } from '../../data/newHsk1BookData';
import { NEW_HSK2_FULL_LESSONS } from '../../data/newHsk2BookData';
import { NEW_HSK3_FULL_LESSONS } from '../../data/newHsk3BookData';
import { NEW_HSK4_FULL_LESSONS } from '../../data/newHsk4BookData';
import { getCoursebookDueStats } from '../../utils/coursebookVocab';
import { TeacherVoicePlayer } from '../Feedback/TeacherVoicePlayer';
import { get7DayActivityStats, DayActivityAggregate, logStudyActivity } from '../../utils/activityLogger';

interface DashboardViewProps {
  userProfile: UserProfile;
  stats: UserStats;
  srsCards: Record<string, SRSCardState>;
  onNavigate: (tab: any) => void;
  onStartReview: () => void;
  assignments: AssignmentDoc[];
  submissions?: AssignmentSubmissionDoc[];
  onOpenVoiceCall?: () => void;
  onOpenJoinClass?: () => void;
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
}) => {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

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
    try {
      const saved = localStorage.getItem(`minnie_completed_lessons_hsk_${userLevel}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [activeLessonIndex, setActiveLessonIndex] = useState<number>(() => {
    try {
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

  const dueCardsList = coursebookDue.dueWords;
  const dueWords = coursebookDue.dueWords;
  const [playingHanzi, setPlayingHanzi] = useState<string | null>(null);

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

  const handlePlayWordAudio = (e: React.MouseEvent, hanzi: string) => {
    e.stopPropagation();
    setPlayingHanzi(hanzi);
    playChineseAudio(hanzi);
    setTimeout(() => {
      setPlayingHanzi((prev) => (prev === hanzi ? null : prev));
    }, 1200);
  };

  useEffect(() => {
    const syncProgress = () => {
      try {
        const saved = localStorage.getItem(`minnie_completed_lessons_hsk_${userLevel}`);
        if (saved) setCompletedLessonNums(JSON.parse(saved));
        const savedIdx = localStorage.getItem(`minnie_current_lesson_hsk_${userLevel}`);
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
  }, [userLevel, totalLessons]);

  const currentLessonData = levelLessons[activeLessonIndex] || levelLessons[0];
  const completedCount = completedLessonNums.length;
  // Progress percentage across the curriculum
  const lessonProgressPercent = Math.min(
    100,
    Math.round(((completedCount > 0 ? completedCount : (activeLessonIndex + 1)) / totalLessons) * 100)
  );

  const [activityRefreshKey, setActivityRefreshKey] = useState(0);

  useEffect(() => {
    const handleActivityLogUpdate = () => {
      setActivityRefreshKey((prev) => prev + 1);
    };
    window.addEventListener('minnie_activity_log_updated', handleActivityLogUpdate);
    window.addEventListener('storage', handleActivityLogUpdate);
    return () => {
      window.removeEventListener('minnie_activity_log_updated', handleActivityLogUpdate);
      window.removeEventListener('storage', handleActivityLogUpdate);
    };
  }, []);

  // 7-Day learning activity stacked data showing:
  // 1. Học bài mới (newLessonCount)
  // 2. Ôn tập & luyện tập (reviewCount)
  // Ordered strictly from T2 (Thứ Hai) to CN (Chủ Nhật)
  const { days: chartData, averagePrevious7Days } = React.useMemo(() => {
    return get7DayActivityStats(stats.cardsReviewedToday ?? 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats.cardsReviewedToday, activityRefreshKey]);

  // Check if today has 0 total activities
  const todayActivity = chartData.find((d) => d.isToday) || chartData[0];
  const isTodayZeroActivity = (todayActivity?.total ?? 0) === 0;

  // Filter assignments matching user's official HSK level, enrolled class, or created assignments
  const isAdmin = userProfile.role === 'admin' || userProfile.email === 'babysharkkk123@gmail.com';
  const userAssignments = assignments.filter((a) => {
    if (!a.is_active) return false;
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

  const totalMasteredWords = Object.values(srsCards).filter((c) => c.state === 'mastered').length;

  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 space-y-8" id="dashboard-container">
      {/* Header Welcome & Class Status Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--color-surface)] p-6 rounded-2xl border border-[var(--color-border)] shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[var(--color-primary)]/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-2xl">👋</span>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Chào {userProfile.displayName || 'Học viên Minnie Chinese'}!
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--color-primary-light)] text-[var(--color-primary)] border border-[var(--color-primary)]/20">
              Trình độ: HSK {userProfile.current_level || 1}
            </span>
            {userProfile.class_code && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                Mã lớp: {userProfile.class_code}
              </span>
            )}
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {userProfile.class_code ? (
              <strong className="text-[var(--color-text-primary)] font-medium">
                Lớp học: {userProfile.class_code} · Trình độ: HSK {userProfile.current_level}{' '}
              </strong>
            ) : null}
            {userProfile.class_code ? '— ' : ''}Hôm nay bạn có{' '}
            <strong className="text-[var(--color-primary)]">{coursebookDue.dueCount} thẻ</strong> đến hạn ôn tập ({coursebookDue.scopeLabel}). Bạn có thể chủ động học và ôn luyện theo thời gian rảnh của mình.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 relative z-10 flex-wrap">
          <button
            type="button"
            onClick={() => onNavigate('flashcards')}
            className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Bắt đầu ôn tập ngay</span>
          </button>
        </div>
      </div>

      {/* 3 Core Highlight Feature Banners: Coursebook (Crimson Red), Live Voice Call (Indigo/Violet), Gia sư AI (Deep Teal/Emerald) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Banner 1: Coursebook (Crimson Red) */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-red-700 via-rose-800 to-slate-950 border border-red-500/30 text-white shadow-md flex flex-col justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/30 text-white text-[11px] font-bold uppercase tracking-wider border border-red-300/40">
              <BookOpen className="w-3 h-3 text-red-200" />
              Giáo trình tương tác
            </div>
            <h2 className="text-base sm:text-lg font-black font-chinese tracking-tight text-white">
              《新HSK教程》Trọn Bộ
            </h2>
            <p className="text-xs text-white/90 leading-relaxed font-medium line-clamp-2">
              HSK 1 (15 bài), HSK 2 (15 bài) & HSK 3 (10 bài) chuẩn phân cấp có audio và trắc nghiệm.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('coursebook')}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-red-50 text-red-950 text-xs font-bold shrink-0 flex items-center justify-center gap-1.5 shadow-sm transition-transform active:scale-95 cursor-pointer self-start"
          >
            <span>Học giáo trình</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Banner 2: LIVE VOICE CALL (Electric Violet / Deep Indigo) */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-700 via-purple-800 to-slate-950 text-white shadow-md flex flex-col justify-between gap-4 relative overflow-hidden ring-2 ring-indigo-400/40 border border-indigo-500/30">
          <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="space-y-1.5 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/30 text-white text-[11px] font-bold uppercase tracking-wider border border-purple-300/40">
              <Sparkles className="w-3 h-3 text-purple-200" />
              Tính năng AI
            </div>
            <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-1.5 text-white">
              Gọi Thoại Như Bạn Bè 📞
            </h2>
            <p className="text-xs text-white/90 leading-relaxed font-medium line-clamp-2">
              Trò chuyện trực tiếp 2 chiều qua micro, nghe giọng nói chuẩn bản xứ, chấm điểm và phản xạ tự nhiên.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenVoiceCall || (() => onNavigate('tutor'))}
            className="px-4 py-2.5 rounded-xl bg-white text-indigo-950 hover:bg-indigo-50 text-xs font-bold shrink-0 flex items-center justify-center gap-1.5 shadow-md transition-transform active:scale-95 cursor-pointer self-start relative z-10"
          >
            <span>Bắt đầu gọi thoại ngay</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Banner 3: AI Tutor & Gia sư AI (Deep Teal / Emerald) */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-teal-800 via-emerald-900 to-slate-950 border border-teal-500/30 text-white shadow-md flex flex-col justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/30 text-white text-[11px] font-bold uppercase tracking-wider border border-purple-300/40">
              <Sparkles className="w-3 h-3 text-purple-200" />
              Gia sư AI
            </div>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
              Hỏi Đáp & Bác Sĩ Ngữ Pháp
            </h2>
            <p className="text-xs text-white/90 leading-relaxed font-medium line-clamp-2">
              Chẩn đoán câu lỗi, tạo bài đọc hiểu phân cấp HSK và tra cứu giải thích ngữ pháp tức thì.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('tutor')}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-teal-50 text-teal-950 text-xs font-bold shrink-0 flex items-center justify-center gap-1.5 shadow-sm transition-transform active:scale-95 cursor-pointer self-start"
          >
            <span>Mở Gia sư AI</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4 Core Stat Hero Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Streak Card */}
        <div className="bg-[var(--color-surface)] p-5 rounded-2xl border border-[var(--color-border)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
            <Flame className="w-6 h-6 fill-amber-500" />
          </div>
          <div>
            <p className="text-xs text-[var(--color-text-secondary)] font-medium">Chuỗi ngày học liên tiếp</p>
            <p className="text-2xl font-bold text-[var(--color-text-primary)]">
              {stats.dailyStreak} <span className="text-xs font-normal text-[var(--color-text-secondary)]">ngày</span>
            </p>
          </div>
        </div>

        {/* EXP Points */}
        <div className="bg-[var(--color-surface)] p-5 rounded-2xl border border-[var(--color-border)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-[var(--color-primary)]">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-[var(--color-text-secondary)] font-medium">Điểm tích luỹ (EXP)</p>
            <p className="text-2xl font-bold text-[var(--color-text-primary)]">{stats.xp || userProfile.exp_points} <span className="text-xs font-normal text-[var(--color-text-secondary)]">EXP</span></p>
          </div>
        </div>

        {/* Mastered Words */}
        <div className="bg-[var(--color-surface)] p-5 rounded-2xl border border-[var(--color-border)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-[var(--color-text-secondary)] font-medium">Từ vựng đã thuộc</p>
            <p className="text-2xl font-bold text-[var(--color-text-primary)]">
              {coursebookDue.masteredCount} <span className="text-xs font-normal text-[var(--color-text-secondary)]">/ {coursebookDue.totalWordsCount} từ</span>
            </p>
            <p className="text-[10px] text-[var(--color-text-secondary)] truncate max-w-[170px] mt-0.5">
              Theo bài đã học trong giáo trình
            </p>
          </div>
        </div>

        {/* Due Cards */}
        <div className="bg-[var(--color-surface)] p-5 rounded-2xl border border-[var(--color-border)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-[var(--color-text-secondary)] font-medium">Cần ôn hôm nay</p>
            <p className="text-2xl font-bold text-[var(--color-text-primary)]">
              {coursebookDue.dueCount} <span className="text-xs font-normal text-[var(--color-text-secondary)]">thẻ</span>
            </p>
            <p className="text-[10px] text-[var(--color-primary)] font-medium truncate max-w-[170px] mt-0.5">
              {coursebookDue.scopeLabel}
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: 7-Day Chart & Coursebook Level Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Learning Chart */}
        <div className="lg:col-span-2 bg-[var(--color-surface)] p-6 rounded-2xl border border-[var(--color-border)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[var(--color-primary)] shrink-0" />
              <div>
                <h2 className="font-bold text-base text-[var(--color-text-primary)]">
                  Tiến độ học trong tuần (T2 - CN)
                </h2>
                <p className="text-[11px] text-[var(--color-text-secondary)]">
                  Phân loại bài học mới và hoạt động ôn tập từ Thứ Hai đến Chủ Nhật
                </p>
              </div>
            </div>
            {/* Legend - 2 clear items */}
            <div className="flex items-center gap-3.5 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[#059669] inline-block shadow-xs" />
                <span className="text-[var(--color-text-primary)] font-medium text-xs">
                  Học bài mới
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[#6ee7b7] inline-block shadow-xs border border-emerald-300" />
                <span className="text-[var(--color-text-primary)] font-medium text-xs">
                  Ôn tập & luyện tập
                </span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full pt-2 min-h-[256px]">
            <ResponsiveContainer width="100%" height={240} minHeight={240} debounce={50}>
              <BarChart data={chartData} margin={{ top: 12, right: 12, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.6} />
                <XAxis
                  dataKey="dayLabel"
                  tick={(props) => {
                    const { x, y, payload, index } = props;
                    const item = chartData[index];
                    const isToday = item?.isToday;
                    return (
                      <g transform={`translate(${x},${y})`}>
                        <text
                          x={0}
                          y={0}
                          dy={14}
                          textAnchor="middle"
                          fill={isToday ? 'var(--color-primary)' : 'var(--color-text-secondary)'}
                          fontWeight={isToday ? 700 : 500}
                          fontSize={12}
                        >
                          {payload.value}
                        </text>
                        {isToday && (
                          <circle cx={0} cy={22} r={2.5} fill="var(--color-primary)" />
                        )}
                      </g>
                    );
                  }}
                />
                <YAxis tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} />
                {averagePrevious7Days > 0 && (
                  <ReferenceLine
                    y={averagePrevious7Days}
                    stroke="#10b981"
                    strokeDasharray="4 4"
                    strokeOpacity={0.6}
                    label={{
                      value: `TB: ${averagePrevious7Days}`,
                      position: 'insideTopRight',
                      fill: '#059669',
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  />
                )}
                <Tooltip
                  cursor={{ fill: 'rgba(16, 185, 129, 0.08)', radius: 8 }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as DayActivityAggregate;
                      return (
                        <div className="bg-[#0f172a] text-white p-3.5 rounded-xl border border-emerald-500/30 shadow-2xl space-y-2 text-xs z-50 min-w-[200px]">
                          <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                            <span className="font-bold text-white text-sm">
                              {data.fullDateLabel}
                            </span>
                            {data.isToday ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                Hôm nay
                              </span>
                            ) : data.isFuture ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-800 text-slate-400 border border-slate-700">
                                Chưa diễn ra
                              </span>
                            ) : null}
                          </div>

                          <div className="space-y-1.5 pt-0.5">
                            <div className="flex items-center justify-between text-slate-200">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-sm bg-[#059669] inline-block" />
                                <span>Học bài mới:</span>
                              </span>
                              <span className="font-bold text-white font-mono">
                                {data.newLessonCount} hoạt động
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-slate-200">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-sm bg-[#6ee7b7] inline-block" />
                                <span>Ôn tập:</span>
                              </span>
                              <span className="font-bold text-white font-mono">
                                {data.reviewCount} hoạt động
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-emerald-400 font-semibold border-t border-slate-700/80 pt-1.5 text-[13px]">
                              <span>Tổng cộng:</span>
                              <span className="font-bold font-mono text-white">
                                {data.total} hoạt động
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {/* Stacked Bar 1: Học bài mới (dark green) */}
                <Bar
                  dataKey="newLessonCount"
                  stackId="studyActivity"
                  fill="#059669"
                  radius={[0, 0, 0, 0]}
                  name="Học bài mới"
                />
                {/* Stacked Bar 2: Ôn tập & luyện tập (light green), rounded on top */}
                <Bar
                  dataKey="reviewCount"
                  stackId="studyActivity"
                  fill="#6ee7b7"
                  radius={[6, 6, 0, 0]}
                  name="Ôn tập & luyện tập"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Dynamic Note for 0 activity today */}
          {isTodayZeroActivity ? (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-2 text-xs text-amber-700 dark:text-amber-300">
              <div className="flex items-center gap-2">
                <span className="text-sm">💡</span>
                <span>
                  Bạn chưa ôn tập hôm nay —{' '}
                  <strong className="font-semibold text-amber-800 dark:text-amber-200">
                    {coursebookDue.dueCount > 0
                      ? `${coursebookDue.dueCount} từ đang chờ ôn`
                      : 'hãy mở giáo trình hoặc làm bài tập để tích lũy kiến thức'}
                  </strong>.
                </span>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('flashcards')}
                className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[11px] shrink-0 transition-colors cursor-pointer"
              >
                Ôn ngay
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between text-[11px] text-[var(--color-text-secondary)] pt-1 px-1">
              <span>Đường nét đứt (TB): Trung bình 7 ngày gần nhất</span>
              <span className="font-medium text-emerald-600">
                Hôm nay: {todayActivity?.total ?? 0} hoạt động
              </span>
            </div>
          )}
        </div>

        {/* Coursebook Level Progress & Current Lesson Widget */}
        <div className="bg-[var(--color-surface)] p-6 rounded-2xl border border-[var(--color-border)] flex flex-col justify-between space-y-5">
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
        </div>
      </div>

      {/* Homework / Assigned Tasks (Module 7 Feature) */}
      <div className="bg-[var(--color-surface)] p-6 rounded-2xl border border-[var(--color-border)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[var(--color-primary)]" />
            <h2 className="font-bold text-base text-[var(--color-text-primary)]">
              Bài tập được giao (HSK {userProfile.current_level})
            </h2>
          </div>
          <span className="text-xs text-[var(--color-text-secondary)]">
            Tự động đồng bộ theo cấp độ chính thức
          </span>
        </div>

        {userAssignments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userAssignments.map((assign) => (
              <div
                key={assign.id}
                className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] hover:border-[var(--color-primary)] transition-all flex flex-col justify-between gap-3 shadow-xs"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-[var(--color-primary-light)] text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                      {assign.content_type === 'quiz'
                        ? 'Trắc nghiệm & Đề thi'
                        : assign.content_type === 'deck'
                        ? 'Bộ thẻ Flashcards'
                        : assign.content_type === 'reading'
                        ? 'Luyện Đọc hiểu'
                        : 'Luyện Viết chữ Hán'}
                    </span>
                    {assign.exam_code && (
                      <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">
                        Mã: {assign.exam_code}
                      </span>
                    )}
                    <span className="text-[11px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full ml-auto">
                      Hạn: {new Date(assign.due_date).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-[var(--color-text-primary)]">
                    {assign.title}
                  </h3>

                  <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2">
                    {assign.description}
                  </p>

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
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--color-border)] flex items-center justify-between gap-2">
                  <span className="text-[11px] text-[var(--color-text-secondary)] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    Chưa hoàn thành
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      if (assign.content_type === 'quiz') {
                        if (assign.exam_code) {
                          // update url param for direct exam launch
                          const url = new URL(window.location.href);
                          url.searchParams.set('exam', assign.exam_code);
                          window.history.pushState({}, '', url.toString());
                        }
                        onNavigate('quizzes');
                      } else if (assign.content_type === 'deck') {
                        onNavigate('flashcards');
                      } else {
                        onNavigate('quizzes');
                      }
                    }}
                    className="px-4 py-1.5 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold hover:bg-[var(--color-primary-dark)] transition-all cursor-pointer shadow-xs whitespace-nowrap"
                  >
                    Bắt đầu làm bài →
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-[var(--color-text-secondary)] text-sm">
            <CheckCircle2 className="w-8 h-8 text-[var(--color-primary)] mx-auto mb-2 opacity-80" />
            Bạn đã hoàn thành tất cả bài tập được giao cho cấp độ HSK {userProfile.current_level}!
          </div>
        )}
      </div>

      {/* Teacher Voice Pronunciation & Homework Feedback Lab */}
      <div className="bg-[var(--color-surface)] p-6 rounded-2xl border border-rose-500/20 space-y-4 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-rose-400 text-white flex items-center justify-center shadow-sm">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-[var(--color-text-primary)] flex items-center gap-2">
                <span>Voice Chữa Phát Âm & Nhận Xét Của Giáo Viên</span>
                {voiceFeedbackSubs.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/15 text-rose-600">
                    {voiceFeedbackSubs.length} bản nhận xét
                  </span>
                )}
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Lắng nghe cô giáo sửa lỗi thanh điệu, khẩu hình và hướng dẫn phát âm trực tiếp trên web
              </p>
            </div>
          </div>
        </div>

        {voiceFeedbackSubs.length > 0 ? (
          <div className="space-y-4">
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
        ) : (
          <div className="p-4 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <p className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5 justify-center sm:justify-start">
                <Sparkles className="w-4 h-4 text-rose-500" />
                <span>Chưa có bản ghi âm chữa bài mới từ Giáo viên</span>
              </p>
              <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                Khi bạn nộp bài tập hoặc bài thi nói / viết, Giáo viên sẽ thu âm trực tiếp các lưu ý ngữ âm và gửi về đây để bạn nghe và nhại theo.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('quizzes')}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer shrink-0"
            >
              Nộp bài tập để nhận Voice chữa →
            </button>
          </div>
        )}
      </div>

      {/* Due Flashcards List Preview */}
      <div className="bg-[var(--color-surface)] p-6 rounded-2xl border border-[var(--color-border)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-[var(--color-primary)]" />
              <h2 className="font-bold text-base text-[var(--color-text-primary)] flex items-center gap-2">
                <span>Từ vựng đến hạn ôn tập hôm nay</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${dueWords.length > 0 ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'}`}>
                  {dueWords.length} từ
                </span>
              </h2>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Bám sát giáo trình New HSK {userLevel} ({coursebookDue.scopeLabel}) • Chu kỳ lặp lại ngắt quãng SM-2
            </p>
          </div>

          <div className="flex items-center gap-2">
            {dueWords.length > 0 ? (
              <button
                type="button"
                onClick={onStartReview}
                className="px-3.5 py-2 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold hover:bg-[var(--color-primary-dark)] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer hover:shadow-md"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ôn tập ngay ({dueWords.length})</span>
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onNavigate('flashcards')}
              className="px-3 py-2 rounded-xl bg-[var(--color-background)] hover:bg-[var(--color-primary-light)] text-[var(--color-text-primary)] hover:text-[var(--color-primary)] border border-[var(--color-border)] text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>Mở bàn học SM-2</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {dueWords.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {dueWords.slice(0, 10).map((word: any) => {
              const isPlaying = playingHanzi === word.hanzi;
              const card = srsCards[word.id] || srsCards[word.hanzi];
              const isNewWord = !card || card.state === 'new';

              return (
                <div
                  key={word.id}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden ${
                    isPlaying
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]/40 shadow-sm scale-[1.02]'
                      : 'border-[var(--color-border)] bg-[var(--color-background)] hover:border-[var(--color-primary)] hover:shadow-sm'
                  }`}
                  onClick={(e) => handlePlayWordAudio(e, word.hanzi)}
                  title="Click để nghe phát âm ngay lập tức (0s độ trễ)"
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-2xl font-bold font-chinese text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors leading-none">
                      {word.hanzi}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handlePlayWordAudio(e, word.hanzi)}
                      className={`p-1 rounded-lg transition-colors cursor-pointer ${
                        isPlaying
                          ? 'bg-[var(--color-primary)] text-white animate-pulse'
                          : 'bg-transparent text-[var(--color-text-secondary)] group-hover:text-[var(--color-primary)] group-hover:bg-[var(--color-primary-light)]'
                      }`}
                    >
                      <Volume2 className={`w-4 h-4 ${isPlaying ? 'animate-bounce' : ''}`} />
                    </button>
                  </div>

                  <p className="text-xs text-[var(--color-primary)] font-medium mt-2 font-mono">
                    {word.pinyin}
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)] truncate mt-0.5">
                    {word.vietnamese || word.english}
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-[var(--color-border)]/60 flex items-center justify-between text-[10px] text-[var(--color-text-secondary)]">
                    <span className="font-mono opacity-80">
                      {word.lessonNumber ? `Bài ${word.lessonNumber}` : `HSK ${word.hskLevel}`}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded font-medium ${
                        isNewWord
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                      }`}
                    >
                      {isNewWord ? 'Từ mới' : 'Đến hạn'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 px-4 bg-[var(--color-background)] rounded-2xl border border-dashed border-[var(--color-border)] space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                Tuyệt vời! Không còn từ vựng tồn đọng hôm nay
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                Tất cả từ vựng theo tiến độ <strong>{coursebookDue.scopeLabel}</strong> đã được ôn tập đúng chu kỳ. Thuật toán SM-2 sẽ tự động phân phối các từ cần ôn vào những ngày tiếp theo (có hôm ít, có hôm nhiều theo độ ghi nhớ).
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  logStudyActivity('review', 'Luyện củng cố từ đã học');
                  onStartReview();
                }}
                className="px-3.5 py-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-primary)] text-[var(--color-text-primary)] text-xs font-semibold transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                <RotateCw className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                <span>Luyện củng cố ({coursebookDue.totalWordsCount} từ đã học)</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('coursebook')}
                className="px-3.5 py-2 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold hover:bg-[var(--color-primary-dark)] transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Học bài mới trong Giáo trình</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
