import React, { useState } from 'react';
import {
  BookOpen,
  Volume2,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Users,
  MessageSquare,
  GraduationCap,
  Award,
  Layers,
  ChevronLeft,
  Flame,
  FileText,
  Lightbulb,
  Lock,
  ShieldCheck,
  AlertCircle,
  KeyRound,
  Loader2,
} from 'lucide-react';
import { NEW_HSK1_FULL_LESSONS, DetailedTextbookLesson } from '../../data/newHsk1BookData';
import { NEW_HSK2_FULL_LESSONS } from '../../data/newHsk2BookData';
import { NEW_HSK3_FULL_LESSONS } from '../../data/newHsk3BookData';
import { NEW_HSK4_FULL_LESSONS } from '../../data/newHsk4BookData';
import { NEW_HSK5_FULL_LESSONS } from '../../data/newHsk5BookData';
import { NEW_HSK6_FULL_LESSONS } from '../../data/newHsk6BookData';
import { LessonExercisesStudio } from './LessonExercisesStudio';
import { WorkbookView } from './WorkbookView';
import { playChineseAudio } from '../../utils/chineseAudio';
import { formatPartOfSpeechVietnamese } from '../../utils/radicalUtils';
import { WordItem, UserProfile, SRSCardState } from '../../types';
import { joinClassByCode } from '../../lib/firebase';
import { WordDetailModal } from '../Dictionary/WordDetailModal';
import { logStudyActivity } from '../../utils/activityLogger';

interface CoursebookViewProps {
  userProfile?: UserProfile;
  onSaveProfile?: (updated: Partial<UserProfile>) => void;
  onStartFlashcards?: (words: WordItem[], lessonNumber?: number) => void;
  onOpenAiTutorWithTopic?: (topic: string) => void;
  srsCards?: Record<string, SRSCardState>;
  onAddWordToSRS?: (wordId: string) => void;
}

export const CoursebookView: React.FC<CoursebookViewProps> = ({
  userProfile,
  onSaveProfile,
  onStartFlashcards,
  onOpenAiTutorWithTopic,
  srsCards,
  onAddWordToSRS,
}) => {
  const isAdmin = userProfile?.role === 'admin' || userProfile?.email === 'babysharkkk123@gmail.com';
  const hasEnrolledClass = Boolean(userProfile?.class_code);

  const [selectedWordForDetail, setSelectedWordForDetail] = useState<WordItem | null>(null);

  const [selectedHskLevel, setSelectedHskLevel] = useState<1 | 2 | 3 | 4 | 5 | 6>(
    (userProfile?.current_level as 1 | 2 | 3 | 4 | 5 | 6) || 1
  );
  const [selectedLessonIndex, setSelectedLessonIndex] = useState<number>(() => {
    try {
      const lvl = (userProfile?.current_level as 1 | 2 | 3 | 4 | 5 | 6) || 1;
      const saved = localStorage.getItem(`minnie_current_lesson_hsk_${lvl}`);
      if (saved !== null) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= 0) return val;
      }
    } catch {}
    return 0;
  });
  const [completedLessonNums, setCompletedLessonNums] = useState<number[]>(() => {
    try {
      const lvl = (userProfile?.current_level as 1 | 2 | 3 | 4 | 5 | 6) || 1;
      const saved = localStorage.getItem(`minnie_completed_lessons_hsk_${lvl}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [activeTab, setActiveTab] = useState<'text' | 'grammar' | 'vocab' | 'exercises' | 'workbook' | 'culture'>('text');
  const [playingLineId, setPlayingLineId] = useState<string | null>(null);

  // Activation Screen State
  const [inputClassCode, setInputClassCode] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);
  const [activationSuccess, setActivationSuccess] = useState<string | null>(null);
  const [lockedLevelNotice, setLockedLevelNotice] = useState<string | null>(null);

  const handleActivateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputClassCode.trim()) {
      setActivationError('Vui lòng nhập mã lớp do giáo viên cung cấp.');
      return;
    }

    setIsActivating(true);
    setActivationError(null);
    try {
      const res = await joinClassByCode(inputClassCode, userProfile?.id || 'demo-user-123');
      setIsActivating(false);
      if (res.success && res.classData) {
        setActivationSuccess(res.message);
        const updatedLevel = (res.classData.hsk_level as 1 | 2 | 3 | 4 | 5 | 6) || 1;
        setSelectedHskLevel(updatedLevel);
        setSelectedLessonIndex(0);
        if (onSaveProfile) {
          onSaveProfile({
            class_id: res.classData.id,
            class_code: res.classData.class_code,
            current_level: res.classData.hsk_level,
          });
        }
      } else {
        setActivationError(res.message);
      }
    } catch (err: any) {
      setIsActivating(false);
      setActivationError(err?.message || 'Có lỗi xảy ra khi xác thực mã lớp.');
    }
  };

  // If user has not enrolled in a class and is not an Admin, require class code entry to protect curriculum
  if (!hasEnrolledClass && !isAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in space-y-6">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-6 sm:p-10 shadow-xl text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-8 h-8" />
          </div>

          <div className="max-w-xl mx-auto space-y-2.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-600 text-xs font-bold uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5" />
              Giáo Trình Bản Quyền 《新HSK教程》
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)] tracking-tight">
              Yêu Cầu Kích Hoạt Mã Lớp Học
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              Để bảo mật tài liệu bài giảng và đảm bảo bạn được học đúng tiến độ, giáo trình được phân quyền riêng biệt cho từng lớp học. Vui lòng nhập <strong>Mã lớp học (Class Code)</strong> do giáo viên hoặc trung tâm cung cấp.
            </p>
          </div>

          {/* Activation Form */}
          <form onSubmit={handleActivateClass} className="max-w-md mx-auto space-y-4 pt-2">
            <div className="space-y-2 text-left">
              <label className="block text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                Nhập Mã Lớp Học (Class Code)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="VD: HSK1-A7X2"
                  value={inputClassCode}
                  onChange={(e) => setInputClassCode(e.target.value.toUpperCase())}
                  className="flex-1 px-4 py-3 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-primary)] font-mono text-base font-bold focus:outline-none focus:border-[var(--color-primary)] uppercase tracking-widest shadow-inner"
                />
              </div>
            </div>

            {/* Error or Success feedback */}
            {activationError && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs flex items-start gap-2 text-left animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-medium">{activationError}</span>
              </div>
            )}

            {activationSuccess && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs flex items-start gap-2 text-left animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-bold">{activationSuccess}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isActivating || !inputClassCode.trim()}
              className="w-full py-3.5 px-6 rounded-2xl bg-[var(--color-primary)] text-white text-sm font-bold hover:bg-[var(--color-primary-dark)] shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isActivating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <KeyRound className="w-4 h-4" />
              )}
              <span>Kích hoạt giáo trình ngay</span>
            </button>

            {/* Quick sample codes hint */}
            <div className="pt-4 border-t border-[var(--color-border)] text-center space-y-2">
              <p className="text-xs text-[var(--color-text-secondary)] font-medium">
                Mã lớp học mẫu thử nghiệm có sẵn:
              </p>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {[
                  { code: 'HSK1-A7X2', label: 'Lớp HSK 1' },
                  { code: 'HSK2-B9K4', label: 'Lớp HSK 2' },
                  { code: 'HSK3-C4M8', label: 'Lớp HSK 3' },
                  { code: 'HSK4-D5V9', label: 'Lớp HSK 4' },
                ].map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => setInputClassCode(item.code)}
                    className="px-2.5 py-1 rounded-xl bg-[var(--color-background)] hover:bg-[var(--color-primary-light)] text-[var(--color-text-primary)] hover:text-[var(--color-primary)] border border-[var(--color-border)] text-xs font-mono font-bold transition-colors cursor-pointer"
                  >
                    {item.code} ({item.label})
                  </button>
                ))}
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  const activeLessonsList: DetailedTextbookLesson[] =
    selectedHskLevel === 1
      ? NEW_HSK1_FULL_LESSONS
      : selectedHskLevel === 2
      ? NEW_HSK2_FULL_LESSONS
      : selectedHskLevel === 3
      ? NEW_HSK3_FULL_LESSONS
      : selectedHskLevel === 4
      ? NEW_HSK4_FULL_LESSONS
      : selectedHskLevel === 5
      ? NEW_HSK5_FULL_LESSONS
      : NEW_HSK6_FULL_LESSONS;

  const currentLesson: DetailedTextbookLesson =
    activeLessonsList[selectedLessonIndex] || activeLessonsList[0];

  const handlePlayAudio = (text: string, id?: string) => {
    if (id) setPlayingLineId(id);
    playChineseAudio(text);
    if (id) {
      setTimeout(() => setPlayingLineId(null), 2500);
    }
  };

  const handleSelectLesson = (idx: number) => {
    setSelectedLessonIndex(idx);
    try {
      localStorage.setItem(`minnie_current_lesson_hsk_${selectedHskLevel}`, String(idx));
      window.dispatchEvent(new Event('minnie_lesson_progress_updated'));
      logStudyActivity('new_lesson', `Mở bài học mới: HSK ${selectedHskLevel} - Bài ${idx + 1}`);
    } catch {}
  };

  const toggleCompleteLesson = (lessonNum: number) => {
    let next: number[];
    if (completedLessonNums.includes(lessonNum)) {
      next = completedLessonNums.filter((n) => n !== lessonNum);
    } else {
      next = [...completedLessonNums, lessonNum];
      logStudyActivity('new_lesson', `Hoàn thành bài học: HSK ${selectedHskLevel} - Bài ${lessonNum}`);
    }
    setCompletedLessonNums(next);
    try {
      localStorage.setItem(`minnie_completed_lessons_hsk_${selectedHskLevel}`, JSON.stringify(next));
      window.dispatchEvent(new Event('minnie_lesson_progress_updated'));
    } catch {}
  };

  const handleLevelSelect = (lvl: 1 | 2 | 3 | 4 | 5 | 6) => {
    // If regular student, they can only view the level matching their enrolled class
    if (!isAdmin && userProfile?.current_level && userProfile.current_level !== lvl) {
      setLockedLevelNotice(
        `🔒 Giáo trình New HSK ${lvl} được bảo mật riêng cho lớp học HSK ${lvl}. Bạn hiện đang tham gia lớp "${userProfile.class_code}" (Trình độ: HSK ${userProfile.current_level}). Hãy liên hệ giáo viên phụ trách để chuyển lớp khi hoàn thành khóa học.`
      );
      return;
    }
    setLockedLevelNotice(null);
    setSelectedHskLevel(lvl);
    try {
      const savedIdx = localStorage.getItem(`minnie_current_lesson_hsk_${lvl}`);
      setSelectedLessonIndex(savedIdx !== null ? parseInt(savedIdx, 10) || 0 : 0);
      const savedCompleted = localStorage.getItem(`minnie_completed_lessons_hsk_${lvl}`);
      setCompletedLessonNums(savedCompleted ? JSON.parse(savedCompleted) : []);
    } catch {
      setSelectedLessonIndex(0);
    }
  };

  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 space-y-8 animate-fade-in">
      {/* Locked Level Notice Modal / Alert */}
      {lockedLevelNotice && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-start justify-between gap-3 animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed font-medium">{lockedLevelNotice}</p>
          </div>
          <button
            type="button"
            onClick={() => setLockedLevelNotice(null)}
            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-100 font-bold shrink-0 cursor-pointer"
          >
            Đã hiểu
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-600 via-rose-700 to-slate-950 border border-red-500/30 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col gap-6">
          {/* Top Bar: Tags & Role status */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/20 backdrop-blur-md text-red-100 border border-red-400/30 text-xs font-bold tracking-wider uppercase">
                <BookOpen className="w-4 h-4 text-red-200" />
                Giáo Trình Chuẩn 《新HSK教程》 • Tiêu Chuẩn HSK 3.0 Mới Nhất
              </div>
              {userProfile?.class_code && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold">
                  <GraduationCap className="w-3.5 h-3.5" />
                  Lớp: {userProfile.class_code} (HSK {userProfile.current_level})
                </div>
              )}
            </div>

            {isAdmin && (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-bold shadow-sm">
                👑 Quản Trị / Giáo Viên (Xem tất cả)
              </div>
            )}
          </div>

          {/* Main Content Area: Title & Summary on Left, Action Cards on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-7 space-y-2.5">
              <h1 className="text-2xl sm:text-3xl xl:text-4xl font-extrabold font-chinese tracking-tight text-white leading-tight">
                Khóa Học Toàn Diện Theo Giáo Trình New HSK {selectedHskLevel} (HSK 3.0)
              </h1>
              <p className="text-sm sm:text-base text-red-100/90 font-medium leading-relaxed max-w-2xl">
                Học trọn vẹn <strong className="text-white font-bold">{activeLessonsList.length} Bài khóa hội thoại</strong>, <strong className="text-white font-bold">Ngữ pháp trọng điểm</strong>, <strong className="text-white font-bold">Luyện tập tương tác</strong> và <strong className="text-white font-bold">Kiến thức Văn hóa & 绕口令</strong>.
              </p>
            </div>

            {/* Quick Action Buttons Grouped Nicely on the right */}
            <div className="lg:col-span-5 flex flex-wrap gap-2.5 lg:justify-end">
              <button
                type="button"
                onClick={() => setActiveTab('workbook')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer ${
                  activeTab === 'workbook'
                    ? 'bg-teal-400 text-slate-950 font-black ring-2 ring-white/50'
                    : 'bg-teal-600/90 hover:bg-teal-500 text-white border border-teal-300/40 backdrop-blur-sm'
                }`}
              >
                <BookOpen className="w-4 h-4 text-teal-200" />
                <span>Sách Bài Tập (SBT) & Đề Thi</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onStartFlashcards && currentLesson.vocabulary) {
                    onStartFlashcards(currentLesson.vocabulary, currentLesson.lessonNumber);
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-white text-rose-950 hover:bg-rose-50 text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
              >
                <Layers className="w-4 h-4 text-rose-700" />
                <span>Luyện Thẻ Bài Này ({currentLesson.vocabulary.length} từ)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onOpenAiTutorWithTopic) {
                    onOpenAiTutorWithTopic(
                      `Hãy đóng vai luyện hội thoại bài ${currentLesson.lessonNumber}: ${currentLesson.titleHanzi} (${currentLesson.titleVietnamese}) cho trình độ New HSK ${selectedHskLevel} chuẩn 3.0`
                    );
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-950/70 hover:bg-slate-950 border border-red-400/40 text-red-100 text-xs font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Hội Thoại Gia Sư AI</span>
              </button>
            </div>
          </div>

          {/* Bottom Bar: Level Switcher - Clean, full-width, perfectly balanced */}
          <div className="pt-4 border-t border-white/15 flex flex-col sm:flex-row sm:items-center gap-3">
            <span className="text-xs font-bold text-red-200/90 shrink-0">Cấp độ giáo trình:</span>
            <div className="flex items-center gap-2 flex-wrap">
              {([1, 2, 3, 4, 5, 6] as const).map((lvl) => {
                const isUserEnrolledLevel = userProfile?.current_level === lvl;
                const isLevelLocked = !isAdmin && userProfile?.current_level && !isUserEnrolledLevel;

                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => handleLevelSelect(lvl)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      selectedHskLevel === lvl
                        ? 'bg-amber-400 text-slate-950 shadow-md font-black scale-105 ring-2 ring-white/40'
                        : isLevelLocked
                        ? 'bg-black/30 text-red-200/60 hover:bg-black/40 border border-white/10 opacity-75'
                        : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                    }`}
                  >
                    {isLevelLocked && <Lock className="w-3 h-3 text-amber-300" />}
                    <span>New HSK {lvl}</span>
                    <span className="text-[10px] opacity-80 font-normal">
                      ({lvl === 1 ? '15 bài' : lvl === 2 ? '15 bài' : lvl === 3 ? '10 bài' : lvl === 4 ? '20 bài (Tập 1&2)' : lvl === 5 ? 'Bài khóa' : 'Cao cấp'})
                    </span>
                    {isUserEnrolledLevel && (
                      <span className="text-[9px] bg-rose-600 text-white px-1.5 py-0.5 rounded-full font-bold ml-0.5">
                        Lớp của bạn
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout: Left Lessons List Sidebar + Right Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Left Column: Lessons Navigation - Sticky when scrolling */}
        <div className="lg:col-span-4 2xl:col-span-3 space-y-4 lg:sticky lg:top-20 self-start">
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3 px-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-[var(--color-text-secondary)] flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-[var(--color-primary)]" />
                Mục lục New HSK {selectedHskLevel}
              </h3>
              <span className="text-[11px] font-bold text-[var(--color-primary)]">
                Bài {currentLesson.lessonNumber} / {activeLessonsList.length}
              </span>
            </div>

            <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
              {activeLessonsList.map((lesson, idx) => {
                const isSelected = idx === selectedLessonIndex;
                const isDone = completedLessonNums.includes(lesson.lessonNumber);
                return (
                  <button
                    key={lesson.lessonNumber}
                    type="button"
                    onClick={() => {
                      handleSelectLesson(idx);
                    }}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between gap-3 group cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--color-primary)] text-white shadow-md'
                        : 'hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] border border-transparent hover:border-[var(--color-border)]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : isDone
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold'
                            : 'bg-[var(--color-primary-light)] text-[var(--color-primary)] group-hover:scale-105'
                        }`}
                      >
                        {isDone && !isSelected ? '✓' : lesson.lessonNumber}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate font-chinese flex items-center gap-1.5">
                          <span>{lesson.titleHanzi}</span>
                          {isDone && (
                            <span className={`text-[10px] ${isSelected ? 'text-emerald-200' : 'text-emerald-500 font-semibold'}`}>
                              (Đã xong)
                            </span>
                          )}
                        </div>
                        <div
                          className={`text-[11px] truncate ${
                            isSelected ? 'text-rose-100' : 'text-[var(--color-text-secondary)]'
                          }`}
                        >
                          {lesson.titleVietnamese}
                        </div>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 shrink-0 transition-transform ${
                        isSelected ? 'text-white' : 'text-[var(--color-text-secondary)] group-hover:translate-x-0.5'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Lesson Modules */}
        <div className="lg:col-span-8 2xl:col-span-9 space-y-6">
          {/* Lesson Header Card */}
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] text-xs font-bold">
                    Bài {currentLesson.lessonNumber} • Trang {currentLesson.pageStart}
                  </span>
                  <span className="text-xs text-[var(--color-text-secondary)] font-mono">
                    {currentLesson.titlePinyin}
                  </span>
                </div>
                <h2 className="text-2xl font-black text-[var(--color-text-primary)] font-chinese flex items-center gap-3">
                  {currentLesson.titleHanzi}
                  <button
                    type="button"
                    onClick={() => handlePlayAudio(currentLesson.titleHanzi)}
                    className="p-1.5 rounded-full hover:bg-[var(--color-bg-secondary)] text-[var(--color-primary)] transition-colors cursor-pointer"
                    title="Nghe phát âm tiêu đề bài học"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </h2>
                <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                  {currentLesson.titleVietnamese}
                </p>
              </div>

              {/* Objectives Capsule */}
              <div className="bg-[var(--color-bg-secondary)] p-3.5 rounded-xl border border-[var(--color-border)] max-w-sm space-y-1">
                <div className="text-[11px] font-bold text-[var(--color-primary)] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Trọng tâm bài học:
                </div>
                <ul className="text-[11px] text-[var(--color-text-secondary)] space-y-0.5 list-disc list-inside">
                  {currentLesson.objectives.map((obj, i) => (
                    <li key={i}>{obj}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Lesson Module Navigation Tabs */}
            <div className="flex items-center gap-1.5 border-b border-[var(--color-border)] pt-2 overflow-x-auto">
              {[
                { key: 'text', label: `Bài Khóa (${currentLesson.texts.length})`, icon: MessageSquare },
                { key: 'grammar', label: `Ngữ Pháp (${currentLesson.grammarPoints.length})`, icon: Lightbulb },
                { key: 'vocab', label: `Từ Vựng (${currentLesson.vocabulary.length})`, icon: FileText },
                { key: 'exercises', label: `Luyện Tập (${currentLesson.exercises.length})`, icon: HelpCircle },
                { key: 'workbook', label: 'Sách Bài Tập (SBT)', icon: BookOpen },
                ...(currentLesson.cultureBonus || currentLesson.tongueTwister
                  ? [{ key: 'culture', label: 'Văn Hóa & Vè', icon: Sparkles }]
                  : []),
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`px-4 py-2.5 text-xs font-bold rounded-t-xl border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                      isActive
                        ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary-light)]/40'
                        : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* TAB 1: TEXTS (BÀI KHÓA) */}
          {activeTab === 'text' && (
            <div className="space-y-6">
              {currentLesson.texts.map((textItem) => (
                <div
                  key={textItem.id}
                  className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6 shadow-xs space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
                    <div className="space-y-0.5">
                      <h3 className="text-base font-bold text-[var(--color-text-primary)] font-chinese">
                        {textItem.title}
                      </h3>
                      <p className="text-xs text-[var(--color-text-secondary)] italic">
                        {textItem.context}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handlePlayAudio(
                          textItem.lines.map((l) => `${l.speaker}：${l.hanzi}`).join('。 ')
                        )
                      }
                      className="px-3 py-1.5 rounded-lg bg-[var(--color-primary-light)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4" />
                      Nghe toàn đoạn
                    </button>
                  </div>

                  <div className="space-y-4 pt-1">
                    {textItem.lines.map((line, lIdx) => {
                      const lineKey = `${textItem.id}-${lIdx}`;
                      const isPlaying = playingLineId === lineKey;
                      return (
                        <div
                          key={lineKey}
                          className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                            isPlaying
                              ? 'bg-rose-50/80 border-rose-300 dark:bg-rose-950/30'
                              : 'bg-[var(--color-bg-secondary)] border-[var(--color-border)] hover:border-[var(--color-primary)]/40'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="text-[11px] font-bold text-[var(--color-primary)]">
                              {line.speaker}
                            </div>
                            <div className="text-base sm:text-lg font-bold font-chinese text-[var(--color-text-primary)]">
                              {line.hanzi}
                            </div>
                            <div className="text-xs font-mono text-[var(--color-text-secondary)]">
                              {line.pinyin}
                            </div>
                            <div className="text-xs text-[var(--color-text-primary)]/80 pt-0.5">
                              {line.vietnamese}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handlePlayAudio(line.hanzi, lineKey)}
                            className="p-2 rounded-lg bg-[var(--color-surface)] hover:bg-[var(--color-primary-light)] text-[var(--color-primary)] transition-colors shadow-xs shrink-0 cursor-pointer"
                            title="Nghe câu này"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: GRAMMAR (NGỮ PHÁP 小语讲堂) */}
          {activeTab === 'grammar' && (
            <div className="space-y-6">
              {currentLesson.grammarPoints.map((gp) => (
                <div
                  key={gp.id}
                  className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6 shadow-xs space-y-4"
                >
                  <div className="flex items-center gap-2 text-[var(--color-primary)]">
                    <Lightbulb className="w-5 h-5" />
                    <h3 className="text-base font-bold text-[var(--color-text-primary)] font-chinese">
                      {gp.title}
                    </h3>
                  </div>

                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                    {gp.explanation}
                  </p>

                  <div className="space-y-2.5 pt-2">
                    <div className="text-xs font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
                      Ví dụ minh họa:
                    </div>
                    {gp.examples.map((ex, exIdx) => (
                      <div
                        key={exIdx}
                        className="p-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] flex items-start justify-between gap-3"
                      >
                        <div className="space-y-0.5">
                          <div className="text-sm font-bold font-chinese text-[var(--color-text-primary)]">
                            {ex.hanzi}
                          </div>
                          <div className="text-xs font-mono text-[var(--color-text-secondary)]">
                            {ex.pinyin}
                          </div>
                          <div className="text-xs text-[var(--color-text-primary)]/80">
                            {ex.vietnamese}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handlePlayAudio(ex.hanzi)}
                          className="p-1.5 rounded-lg hover:bg-[var(--color-primary-light)] text-[var(--color-primary)] transition-colors cursor-pointer"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {gp.tip && (
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>{gp.tip}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: VOCABULARY */}
          {activeTab === 'vocab' && (
            <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
                <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                  Bảng từ vựng bài {currentLesson.lessonNumber} ({currentLesson.vocabulary.length} từ)
                </h3>
                {onStartFlashcards && (
                  <button
                    type="button"
                    onClick={() => onStartFlashcards(currentLesson.vocabulary, currentLesson.lessonNumber)}
                    className="px-3.5 py-1.5 rounded-xl bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <Layers className="w-4 h-4" />
                    Luyện Flashcard toàn bài
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentLesson.vocabulary.map((w) => (
                  <div
                    key={w.id}
                    onClick={() => setSelectedWordForDetail(w)}
                    className="p-3.5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:shadow-xs transition-all flex items-center justify-between gap-3 cursor-pointer group"
                    title="Bấm để xem chi tiết, diễn họa nét chuẩn & luyện viết chữ Hán"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold font-chinese text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors">
                          {w.hanzi}
                        </span>
                        <span className="text-xs font-mono text-[var(--color-primary)]">
                          {w.pinyin}
                        </span>
                        {w.partOfSpeech && (
                          <span className="px-1.5 py-0.5 rounded bg-[var(--color-border)] text-[10px] font-bold text-[var(--color-text-secondary)]">
                            {formatPartOfSpeechVietnamese(w.partOfSpeech)}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[var(--color-text-secondary)]">
                        {w.vietnamese || w.english}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayAudio(w.hanzi);
                        }}
                        className="p-2 rounded-lg bg-[var(--color-surface)] hover:bg-[var(--color-primary-light)] text-[var(--color-primary)] transition-colors shadow-xs cursor-pointer"
                        title="Nghe phát âm"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: EXERCISES */}
          {activeTab === 'exercises' && (
            <LessonExercisesStudio
              lesson={currentLesson}
              hskLevel={selectedHskLevel}
              onUpdateUserXp={(additionalXp) => {
                if (onSaveProfile && userProfile) {
                  onSaveProfile({
                    exp_points: (userProfile.exp_points || 0) + additionalXp,
                  });
                }
              }}
            />
          )}

          {/* TAB 4.5: WORKBOOK (SÁCH BÀI TẬP & ĐỀ THI THỬ) */}
          {activeTab === 'workbook' && (
            <WorkbookView
              hskLevel={selectedHskLevel}
              currentLessonNumber={currentLesson.lessonNumber}
              onUpdateUserXp={(additionalXp) => {
                if (onSaveProfile && userProfile) {
                  onSaveProfile({
                    exp_points: (userProfile.exp_points || 0) + additionalXp,
                  });
                }
              }}
            />
          )}

          {/* TAB 5: CULTURE & BONUS */}
          {activeTab === 'culture' && (
            <div className="space-y-6">
              {currentLesson.tongueTwister && (
                <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
                    <div className="flex items-center gap-2 text-[var(--color-primary)]">
                      <Flame className="w-5 h-5" />
                      <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                        Luyện bẻ giọng: {currentLesson.tongueTwister.title} (绕口令)
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePlayAudio(currentLesson.tongueTwister!.hanzi)}
                      className="px-3 py-1.5 rounded-lg bg-[var(--color-primary-light)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4" />
                      Nghe phát âm chuẩn
                    </button>
                  </div>

                  <div className="p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] space-y-2">
                    <div className="text-base sm:text-lg font-bold font-chinese text-[var(--color-text-primary)] leading-relaxed">
                      {currentLesson.tongueTwister.hanzi}
                    </div>
                    <div className="text-xs font-mono text-[var(--color-text-secondary)]">
                      {currentLesson.tongueTwister.pinyin}
                    </div>
                    <div className="text-xs text-[var(--color-text-primary)]/80 italic pt-1">
                      {currentLesson.tongueTwister.vietnamese}
                    </div>
                  </div>
                </div>
              )}

              {currentLesson.cultureBonus && (
                <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 text-[var(--color-primary)]">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                      {currentLesson.cultureBonus.title}
                    </h3>
                  </div>
                  <p className="text-xs font-bold text-[var(--color-text-secondary)]">
                    {currentLesson.cultureBonus.summary}
                  </p>
                  <p className="text-xs sm:text-sm text-[var(--color-text-primary)] leading-relaxed bg-[var(--color-bg-secondary)] p-4 rounded-xl border border-[var(--color-border)]">
                    {currentLesson.cultureBonus.content}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Bottom Completion & Lesson Navigation Bar */}
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                disabled={selectedLessonIndex <= 0}
                onClick={() => handleSelectLesson(selectedLessonIndex - 1)}
                className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold border border-[var(--color-border)] flex items-center justify-center gap-1.5 transition-all ${
                  selectedLessonIndex <= 0
                    ? 'opacity-40 cursor-not-allowed bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]'
                    : 'bg-[var(--color-surface)] hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] cursor-pointer active:scale-95'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Bài trước</span>
              </button>

              <button
                type="button"
                disabled={selectedLessonIndex >= activeLessonsList.length - 1}
                onClick={() => handleSelectLesson(selectedLessonIndex + 1)}
                className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold border border-[var(--color-border)] flex items-center justify-center gap-1.5 transition-all ${
                  selectedLessonIndex >= activeLessonsList.length - 1
                    ? 'opacity-40 cursor-not-allowed bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]'
                    : 'bg-[var(--color-surface)] hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] cursor-pointer active:scale-95'
                }`}
              >
                <span>Bài tiếp theo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Mark as Completed Button */}
            <button
              type="button"
              onClick={() => toggleCompleteLesson(currentLesson.lessonNumber)}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95 ${
                completedLessonNums.includes(currentLesson.lessonNumber)
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/20 ring-2 ring-emerald-500/30'
                  : 'bg-[var(--color-primary-light)] hover:bg-[var(--color-primary)] text-[var(--color-primary)] hover:text-white border border-[var(--color-primary)]/30'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {completedLessonNums.includes(currentLesson.lessonNumber)
                  ? '✓ Đã học xong bài này'
                  : 'Đánh dấu đã học xong bài'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Word Detail & Hanzi Stroke Studio Modal */}
      <WordDetailModal
        isOpen={Boolean(selectedWordForDetail)}
        word={selectedWordForDetail}
        onClose={() => setSelectedWordForDetail(null)}
        srsCards={srsCards}
        onAddWordToSRS={onAddWordToSRS}
      />
    </div>
  );
};
