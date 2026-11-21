import React, { useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Brain,
  BookOpen,
  Search,
  Clock,
  ArrowRight,
  FileCheck,
  GraduationCap,
  RotateCcw,
  ChevronRight,
  Zap,
  Target,
} from 'lucide-react';
import { UserStats, HSKLevel, OnlineExamDoc, UserProfile } from '../../types';
import { fetchOnlineExamsFromFirestore, getOnlineExamByCodeFromFirestore } from '../../lib/firebase';
import { OnlineExamRunner } from './OnlineExamRunner';
import { logStudyActivity } from '../../utils/activityLogger';
import { HSKMockExam } from '../HSKMockExam';

interface QuizzesViewProps {
  stats: UserStats;
  onUpdateStats: (newStats: Partial<UserStats>) => void;
  userProfile?: UserProfile;
  activeExamToRun?: OnlineExamDoc | null;
  onExitExam?: () => void;
}

interface OfficialCatalogItem {
  id: string;
  title: string;
  level: number;
  sourceLabel: string;
  timeLimitMinutes: number;
  questionCount: number;
  difficultyTier: 'easy' | 'medium' | 'hard';
  difficultyScore: number;
  difficultyLabelVi: string;
  difficultyMetrics?: {
    avgStemHanzi?: number;
    avgOptionHanzi?: number;
    uniqueHanziCount?: number;
    longPassageCount?: number;
  } | null;
}

type DifficultyFilter = 'all' | 'easy' | 'medium' | 'hard';

const HSK_LEVELS: HSKLevel[] = [1, 2, 3, 4, 5, 6];

export const QuizzesView: React.FC<QuizzesViewProps> = ({
  stats,
  onUpdateStats,
  userProfile,
  activeExamToRun,
  onExitExam,
}) => {
  const [mockLevel, setMockLevel] = useState<HSKLevel>(1);
  const [mockDifficulty, setMockDifficulty] = useState<DifficultyFilter>('all');
  const [practiceLevel, setPracticeLevel] = useState<HSKLevel>(1);

  const [onlineExamsList, setOnlineExamsList] = useState<OnlineExamDoc[]>([]);
  const [isLoadingExams, setIsLoadingExams] = useState(false);
  const [examCodeInput, setExamCodeInput] = useState('');
  const [activeExamRunning, setActiveExamRunning] = useState<OnlineExamDoc | null>(null);
  const [examSearchError, setExamSearchError] = useState<string | null>(null);

  // Official Tiered HSK 3.0 Exam Catalog (SQLite QBank via /api/exam/catalog)
  const [officialCatalog, setOfficialCatalog] = useState<OfficialCatalogItem[]>([]);
  const [catalogSummary, setCatalogSummary] = useState<
    Record<number, { total: number; easy: number; medium: number; hard: number }>
  >({});
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  const [selectedExamLevel, setSelectedExamLevel] = useState<number | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyFilter>('all');
  const [catalogSearch, setCatalogSearch] = useState('');

  // Exclude class homework assignments (HW-* / ASSIGN-*) from the public practice/mock exam list,
  // since assigned homework lives exclusively in the "Bài tập được giao" section on the Home (Tổng quan) tab.
  const publicPracticeExams = useMemo(() => {
    return onlineExamsList.filter((exam) => {
      const code = (exam.exam_code || '').trim().toUpperCase();
      if (code.startsWith('HW-') || code.startsWith('ASSIGN-')) return false;
      if ((exam.id || '').startsWith('assign-')) return false;
      return true;
    });
  }, [onlineExamsList]);

  const filteredOnlineExams = useMemo(() => {
    if (selectedExamLevel === 'all') return publicPracticeExams;
    return publicPracticeExams.filter((exam) => {
      const lvl = exam.hsk_level ?? (exam as any).level;
      return Number(lvl) === selectedExamLevel;
    });
  }, [publicPracticeExams, selectedExamLevel]);

  const levelScopedCatalog = useMemo(() => {
    if (selectedExamLevel === 'all') return officialCatalog;
    return officialCatalog.filter((s) => s.level === selectedExamLevel);
  }, [officialCatalog, selectedExamLevel]);

  const filteredOfficialCatalog = useMemo(() => {
    const q = catalogSearch.trim().toLowerCase();
    return levelScopedCatalog.filter((s) => {
      if (selectedDifficulty !== 'all' && s.difficultyTier !== selectedDifficulty) return false;
      if (q && !s.title.toLowerCase().includes(q) && !s.id.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [levelScopedCatalog, selectedDifficulty, catalogSearch]);

  const [activeHskExamView, setActiveHskExamView] = useState<'hall' | 'mock' | 'practice' | 'notebook' | null>(null);
  const [hskExamInitialLevel, setHskExamInitialLevel] = useState<number>(1);
  const [hskExamInitialSkill, setHskExamInitialSkill] = useState<string | undefined>(undefined);
  const [hskExamInitialDifficulty, setHskExamInitialDifficulty] = useState<DifficultyFilter>('all');
  const [activeOfficialSet, setActiveOfficialSet] = useState<{
    id: string;
    title: string;
    level: number;
    timeLimitMinutes: number;
    difficultyLabelVi?: string;
    mode: 'mock' | 'practice';
  } | null>(null);

  useEffect(() => {
    if (activeExamToRun) {
      setActiveExamRunning(activeExamToRun);
    }
  }, [activeExamToRun]);

  useEffect(() => {
    const handleLaunchExamEvent = (e: any) => {
      const exam = e.detail?.exam;
      if (exam) {
        setActiveExamRunning(exam);
      }
    };
    window.addEventListener('minnie_launch_exam', handleLaunchExamEvent);
    return () => window.removeEventListener('minnie_launch_exam', handleLaunchExamEvent);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    const levelParam = parseInt(params.get('level') || '1', 10);
    const skillParam = params.get('skill') || undefined;

    if (viewParam === 'hsk_mock' || viewParam === 'mock_exam' || viewParam === 'hsk_exam') {
      setHskExamInitialLevel(!isNaN(levelParam) && levelParam >= 1 && levelParam <= 6 ? levelParam : 1);
      setActiveOfficialSet(null);
      setActiveHskExamView('mock');
      return;
    } else if (viewParam === 'hsk_practice' || viewParam === 'practice') {
      setHskExamInitialLevel(!isNaN(levelParam) && levelParam >= 1 && levelParam <= 6 ? levelParam : 1);
      setHskExamInitialSkill(skillParam);
      setActiveOfficialSet(null);
      setActiveHskExamView('practice');
      return;
    } else if (viewParam === 'hsk_notebook' || viewParam === 'wrong_notebook' || viewParam === 'notebook') {
      setActiveOfficialSet(null);
      setActiveHskExamView('notebook');
      return;
    } else if (viewParam === 'hsk_hall' || viewParam === 'hall') {
      setActiveOfficialSet(null);
      setActiveHskExamView(null);
      return;
    }

    const examParam = params.get('exam') || params.get('code') || params.get('exam_code');
    if (examParam) {
      const code = examParam.trim().toUpperCase();
      setExamCodeInput(code);
      setIsLoadingExams(true);
      getOnlineExamByCodeFromFirestore(code)
        .then((exam) => {
          if (exam) {
            setActiveExamRunning(exam);
          } else {
            setExamSearchError(`Không tìm thấy đề thi với mã "${code}". Vui lòng kiểm tra lại mã do giáo viên cung cấp.`);
          }
        })
        .catch((err: any) => {
          setExamSearchError('Lỗi kết nối khi tìm đề thi: ' + (err?.message || err));
        })
        .finally(() => {
          setIsLoadingExams(false);
        });
    }
  }, []);

  const loadOfficialCatalog = useCallback(async () => {
    setIsLoadingCatalog(true);
    try {
      const res = await fetch('/api/exam/catalog');
      if (res.ok) {
        const data = await res.json();
        if (data?.success) {
          setOfficialCatalog(Array.isArray(data.sets) ? data.sets : []);
          setCatalogSummary(data.summaryByLevel || {});
        }
      }
    } catch (e) {
      console.error('Error fetching official exam catalog:', e);
    } finally {
      setIsLoadingCatalog(false);
    }
  }, []);

  const loadOnlineExams = useCallback(async () => {
    setIsLoadingExams(true);
    try {
      const list = await fetchOnlineExamsFromFirestore();
      setOnlineExamsList(list || []);
    } catch (e) {
      console.error('Error fetching online exams:', e);
    } finally {
      setIsLoadingExams(false);
    }
  }, []);

  useEffect(() => {
    loadOfficialCatalog();
    loadOnlineExams();
  }, [loadOfficialCatalog, loadOnlineExams]);

  const handleLookupExamCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examCodeInput.trim()) return;

    setExamSearchError(null);
    setIsLoadingExams(true);
    try {
      const code = examCodeInput.trim().toUpperCase();
      const exam = await getOnlineExamByCodeFromFirestore(code);
      if (exam) {
        setActiveExamRunning(exam);
      } else {
        setExamSearchError(`Không tìm thấy đề thi với mã "${code}". Vui lòng kiểm tra lại mã do giáo viên cung cấp.`);
      }
    } catch (err: any) {
      setExamSearchError('Lỗi kết nối khi tìm đề thi: ' + (err?.message || err));
    } finally {
      setIsLoadingExams(false);
    }
  };

  const launchMock = (level: HSKLevel) => {
    setActiveOfficialSet(null);
    setHskExamInitialLevel(level);
    setHskExamInitialDifficulty(mockDifficulty);
    setActiveHskExamView('mock');
  };

  const launchPractice = (level: HSKLevel) => {
    setActiveOfficialSet(null);
    setHskExamInitialLevel(level);
    setHskExamInitialDifficulty('all');
    setActiveHskExamView('practice');
  };

  const launchOfficialSet = (item: OfficialCatalogItem, mode: 'mock' | 'practice') => {
    setHskExamInitialLevel(item.level);
    setHskExamInitialSkill(undefined);
    setHskExamInitialDifficulty('all');
    setActiveOfficialSet({
      id: item.id,
      title: item.title,
      level: item.level,
      timeLimitMinutes: item.timeLimitMinutes,
      difficultyLabelVi: item.difficultyLabelVi,
      mode,
    });
    setActiveHskExamView(mode);
  };

  if (activeExamRunning) {
    return (
      <div className="w-full max-w-5xl 2xl:max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <OnlineExamRunner
          exam={activeExamRunning}
          userProfile={
            userProfile || {
              id: 'guest',
              email: 'student@minnese.app',
              displayName: 'Học viên',
              role: 'user',
              current_level: 1,
              words_per_day: 15,
              streak_count: 1,
              last_study_date: new Date().toISOString(),
              exp_points: 100,
              badges: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          }
          onExit={() => {
            setActiveExamRunning(null);
            if (onExitExam) onExitExam();
          }}
          onCompleted={(percent, correctCount) => {
            onUpdateStats({
              quizzesCompleted: stats.quizzesCompleted + 1,
              xp: stats.xp + correctCount * 10,
            });
            logStudyActivity('review', 'Hoàn thành đề thi online: ' + (activeExamRunning?.title || 'Đề thi'));
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
            });
          }}
        />
      </div>
    );
  }

  if (activeHskExamView !== null) {
    return (
      <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 space-y-4 animate-fade-in" id="quizzes-container">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border)]">
          <button
            type="button"
            onClick={() => {
              setActiveOfficialSet(null);
              setActiveHskExamView(null);
            }}
            className="px-3.5 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-background)] text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] flex items-center gap-2 cursor-pointer shadow-xs transition-all"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            <span>Quay lại danh mục Luyện tập</span>
          </button>
        </div>

        <HSKMockExam
          key={activeOfficialSet ? `${activeOfficialSet.id}_${activeOfficialSet.mode}` : `${activeHskExamView}_${hskExamInitialLevel}_${hskExamInitialDifficulty}`}
          initialMode={activeHskExamView}
          initialLevel={hskExamInitialLevel}
          initialSkill={hskExamInitialSkill}
          initialDifficulty={hskExamInitialDifficulty}
          initialOfficialSet={activeOfficialSet}
          onExit={() => {
            setActiveOfficialSet(null);
            setActiveHskExamView(null);
          }}
          onRewardXp={(amount) => {
            if (onUpdateStats) {
              onUpdateStats({ xp: (stats.xp || 0) + amount });
            }
          }}
        />
      </div>
    );
  }

  const easyCnt = levelScopedCatalog.filter((s) => s.difficultyTier === 'easy').length;
  const medCnt = levelScopedCatalog.filter((s) => s.difficultyTier === 'medium').length;
  const hardCnt = levelScopedCatalog.filter((s) => s.difficultyTier === 'hard').length;

  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 space-y-6 animate-fade-in" id="quizzes-container">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
            Phòng Thi Thử & Luyện Đề HSK 3.0 (CTI / CLEC)
          </p>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">Luyện tập</h1>
          <p className="text-sm text-[var(--color-text-secondary)] max-w-2xl leading-relaxed">
            Kho {officialCatalog.length > 0 ? `${officialCatalog.length} bộ đề chuẩn HSK 3.0` : 'đề thi thử chuẩn HSK 3.0'} đã phê duyệt và phân bậc độ khó từ <strong>Khởi động</strong> → <strong>Chuẩn thi</strong> → <strong>Thử thách</strong>.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setActiveOfficialSet(null);
            setActiveHskExamView('notebook');
          }}
          className="self-start sm:self-auto px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] flex items-center gap-1.5 cursor-pointer"
        >
          <BookOpen className="w-4 h-4 text-amber-500" />
          <span>Sổ câu sai</span>
        </button>
      </div>

      {/* Top 2 Quick Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="silk-card p-5 sm:p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--color-text-primary)]">Thi thử HSK 1-Click</h2>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed">
                Chọn cấp độ và mức độ khó phù hợp để vào ngay phòng thi bấm giờ chuẩn CTI / CLEC.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {HSK_LEVELS.map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setMockLevel(lvl)}
                  className={`silk-pill px-3 py-1 text-xs font-bold cursor-pointer ${
                    mockLevel === lvl
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  HSK {lvl}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-[var(--color-text-secondary)] mr-0.5">Độ khó:</span>
              {[
                { key: 'all', label: 'Ngẫu nhiên', active: 'bg-slate-700 text-white' },
                { key: 'easy', label: '🟢 Khởi động', active: 'bg-emerald-600 text-white' },
                { key: 'medium', label: '🟡 Chuẩn thi', active: 'bg-amber-600 text-white' },
                { key: 'hard', label: '🔴 Thử thách', active: 'bg-rose-600 text-white' },
              ].map((d) => (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => setMockDifficulty(d.key as DifficultyFilter)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                    mockDifficulty === d.key
                      ? `${d.active} shadow-xs`
                      : 'bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => launchMock(mockLevel)}
            className="silk-btn w-full px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <Zap className="w-4 h-4" />
            <span>Thi thử HSK {mockLevel} ngay</span>
          </button>
        </section>

        <section className="silk-card p-5 sm:p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[var(--color-text-primary)]">Luyện kỹ năng nhanh</h2>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed">
                  Luyện không áp lực thời gian: kiểm tra đáp án & giải thích ngữ pháp tiếng Việt ngay sau từng câu.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {HSK_LEVELS.map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setPracticeLevel(lvl)}
                  className={`silk-pill px-3 py-1 text-xs font-bold cursor-pointer ${
                    practiceLevel === lvl
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  HSK {lvl}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => launchPractice(practiceLevel)}
            className="silk-btn w-full px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <Brain className="w-4 h-4" />
            <span>Luyện kỹ năng HSK {practiceLevel}</span>
          </button>
        </section>
      </div>

      {/* Main Public Exam Library: All 102 Official HSK 3.0 Sets Ranked Easy → Medium → Hard + Teacher Code Lookup */}
      <section className="silk-card p-5 sm:p-6 space-y-4" data-testid="quizzes-official-exam-library">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <Target className="w-5 h-5 text-teal-600" />
              <span>Kho Đề Thi HSK 3.0 Chuẩn & Đề Tự Luyện ({officialCatalog.length} bộ đề)</span>
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              Xếp hạng sẵn từ <strong>🟢 Khởi động (Vừa sức)</strong> → <strong>🟡 Chuẩn thi</strong> → <strong>🔴 Thử thách</strong> để bạn chọn đúng trình độ hoặc nhập mã đề của giáo viên.
            </p>
          </div>

          <form onSubmit={handleLookupExamCode} className="flex items-center gap-2 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[var(--color-text-secondary)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={examCodeInput}
                onChange={(e) => setExamCodeInput(e.target.value.toUpperCase())}
                placeholder="Nhập mã đề GV (EXAM-XXXX)"
                className="silk-input pl-8 pr-3 py-2 text-xs font-mono font-bold w-52 uppercase text-center tracking-wider"
              />
            </div>
            <button
              type="submit"
              disabled={isLoadingExams || !examCodeInput.trim()}
              className="silk-btn px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold disabled:opacity-50 flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>Mở mã</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {examSearchError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-medium">
            {examSearchError}
          </div>
        )}

        {/* HSK Level Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {(['all', 1, 2, 3, 4, 5, 6] as const).map((lvl) => {
              const cnt =
                lvl === 'all'
                  ? officialCatalog.length
                  : catalogSummary[lvl]?.total ?? officialCatalog.filter((s) => s.level === lvl).length;
              return (
                <button
                  key={lvl}
                  type="button"
                  data-testid={`quizzes-level-tab-${lvl}`}
                  onClick={() => setSelectedExamLevel(lvl)}
                  className={`silk-pill px-3 py-1.5 text-xs font-bold whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    selectedExamLevel === lvl
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-[var(--color-background)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)]'
                  }`}
                >
                  <span>{lvl === 'all' ? 'Tất cả' : `HSK ${lvl}`}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                      selectedExamLevel === lvl ? 'bg-white/20 text-white' : 'bg-[var(--color-surface)]'
                    }`}
                  >
                    {cnt}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-52">
              <Search className="w-3.5 h-3.5 text-[var(--color-text-secondary)] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder="Tìm theo chủ đề đề thi..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs text-[var(--color-text-primary)] focus:outline-hidden focus:border-teal-500"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                loadOfficialCatalog();
                loadOnlineExams();
              }}
              className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1 cursor-pointer shrink-0"
            >
              <RotateCcw className={`w-3 h-3 ${isLoadingCatalog || isLoadingExams ? 'animate-spin' : ''}`} />
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        {/* Difficulty Tier Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { key: 'all', label: `Tất cả mức độ (${levelScopedCatalog.length})`, active: 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900' },
            { key: 'easy', label: `🟢 Khởi động / Vừa sức (${easyCnt})`, active: 'bg-emerald-600 text-white' },
            { key: 'medium', label: `🟡 Chuẩn thi thật (${medCnt})`, active: 'bg-amber-600 text-white' },
            { key: 'hard', label: `🔴 Thử thách / Khó (${hardCnt})`, active: 'bg-rose-600 text-white' },
          ].map((pill) => (
            <button
              key={pill.key}
              type="button"
              data-testid={`quizzes-diff-pill-${pill.key}`}
              onClick={() => setSelectedDifficulty(pill.key as DifficultyFilter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedDifficulty === pill.key
                  ? `${pill.active} shadow-xs`
                  : 'bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-slate-400'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        <div className="px-3.5 py-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/25 border border-emerald-200/80 dark:border-emerald-800/50 text-xs text-emerald-900 dark:text-emerald-200">
          💡 <strong>Gợi ý lộ trình:</strong> Nếu mới bắt đầu cấp độ này, hãy làm các đề <strong>🟢 Khởi động</strong> ở đầu danh sách trước để quen nhịp bài thi, sau đó nâng dần lên <strong>🟡 Chuẩn thi</strong> và <strong>🔴 Thử thách</strong>.
        </div>

        {/* Official Tiered HSK 3.0 Exam Sets Grid */}
        {isLoadingCatalog && officialCatalog.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--color-text-secondary)]">
            Đang tải kho bộ đề chuẩn HSK 3.0...
          </div>
        ) : filteredOfficialCatalog.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-[var(--color-background)] border border-dashed border-[var(--color-border)] space-y-1">
            <FileCheck className="w-8 h-8 text-[var(--color-text-secondary)]/40 mx-auto" />
            <p className="text-sm font-bold text-[var(--color-text-primary)]">
              Không tìm thấy bộ đề khớp bộ lọc hiện tại
            </p>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Hãy chọn "Tất cả mức độ" hoặc xóa từ khóa tìm kiếm để xem toàn bộ {officialCatalog.length} bộ đề.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredOfficialCatalog.map((item, idx) => {
              const tierUi =
                item.difficultyTier === 'easy'
                  ? {
                      badge: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
                      bar: 'bg-emerald-500',
                      label: '🟢 Khởi động',
                    }
                  : item.difficultyTier === 'hard'
                  ? {
                      badge: 'bg-rose-500/12 text-rose-700 dark:text-rose-300 border-rose-500/30',
                      bar: 'bg-rose-500',
                      label: '🔴 Thử thách',
                    }
                  : {
                      badge: 'bg-amber-500/12 text-amber-700 dark:text-amber-300 border-amber-500/30',
                      bar: 'bg-amber-500',
                      label: '🟡 Chuẩn thi',
                    };

              return (
                <div
                  key={item.id}
                  data-testid={`quizzes-official-card-${item.id}`}
                  className="p-4 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] hover:border-teal-400/70 transition-all flex flex-col justify-between gap-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-1.5 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-500/12 text-teal-700 dark:text-teal-300 border border-teal-500/25">
                          HSK {item.level}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${tierUi.badge}`}>
                          {tierUi.label} • {item.difficultyScore}/100
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-[var(--color-text-secondary)]">
                        #{idx + 1}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-[var(--color-text-primary)] line-clamp-2" title={item.title}>
                      {item.title}
                    </h4>

                    <div className="space-y-1">
                      <div className="w-full h-1.5 rounded-full bg-[var(--color-surface)] overflow-hidden">
                        <div
                          className={`h-full rounded-full ${tierUi.bar}`}
                          style={{ width: `${Math.max(12, Math.min(100, item.difficultyScore))}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-[var(--color-text-secondary)]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {item.questionCount} câu • {item.timeLimitMinutes} phút
                        </span>
                        {item.difficultyMetrics?.uniqueHanziCount ? (
                          <span>~{item.difficultyMetrics.uniqueHanziCount} chữ Hán</span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-[var(--color-border)]">
                    <button
                      type="button"
                      onClick={() => launchOfficialSet(item, 'mock')}
                      className="flex-1 py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Thi bấm giờ</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => launchOfficialSet(item, 'practice')}
                      className="py-2 px-3 rounded-xl bg-[var(--color-surface)] hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-[var(--color-border)] text-[var(--color-text-primary)] text-xs font-bold cursor-pointer transition-colors"
                      title="Làm từng câu không giới hạn thời gian, xem đáp án & giải thích ngay"
                    >
                      Luyện tự do
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Teacher-published Online Exams from Firestore (if any exist) */}
        {filteredOnlineExams.length > 0 && (
          <div className="pt-4 border-t border-[var(--color-border)] space-y-3">
            <h3 className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-purple-600" />
              <span>Đề Thi Online do Giáo Viên Phát Hành ({filteredOnlineExams.length})</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredOnlineExams.map((exam) => (
                <div
                  key={exam.id}
                  className="silk-card-interactive p-4 rounded-xl flex flex-col justify-between gap-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300">
                        {exam.exam_code}
                      </span>
                      <span className="text-[10px] font-bold text-[var(--color-primary)]">
                        HSK {exam.hsk_level ?? (exam as any).level ?? 1}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-[var(--color-text-primary)] line-clamp-2">{exam.title}</h4>
                    {exam.description ? (
                      <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2">{exam.description}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {(exam.duration_minutes ?? (exam as any).total_time_min ?? 0) > 0
                        ? `${exam.duration_minutes ?? (exam as any).total_time_min} phút`
                        : 'Tự do'}
                    </span>
                    <span>{exam.questions?.length || 0} câu</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveExamRunning(exam)}
                    className="silk-btn w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Vào thi ngay
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
