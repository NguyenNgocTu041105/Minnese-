import React, { useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
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
  Volume2,
  PenTool,
  Shuffle,
  Layers,
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

interface SkillSetItem {
  setIndex: number;
  title: string;
  questionCount: number;
  rangeLabel: string;
  difficultyTier: 'easy' | 'medium' | 'hard';
  difficultyLabelVi: string;
}

interface SkillCounts {
  listening: number;
  reading: number;
  writing: number;
  total: number;
}

type DifficultyFilter = 'all' | 'easy' | 'medium' | 'hard';
type PracticeDeckTab = 'full' | 'listening' | 'reading' | 'writing';

const HSK_LEVELS: HSKLevel[] = [1, 2, 3, 4, 5, 6];

export const QuizzesView: React.FC<QuizzesViewProps> = ({
  stats,
  onUpdateStats,
  userProfile,
  activeExamToRun,
  onExitExam,
}) => {
  const defaultLevel: HSKLevel =
    userProfile?.current_level && userProfile.current_level >= 1 && userProfile.current_level <= 6
      ? (userProfile.current_level as HSKLevel)
      : 1;

  const [onlineExamsList, setOnlineExamsList] = useState<OnlineExamDoc[]>([]);
  const [isLoadingExams, setIsLoadingExams] = useState(false);
  const [examCodeInput, setExamCodeInput] = useState('');
  const [activeExamRunning, setActiveExamRunning] = useState<OnlineExamDoc | null>(null);
  const [examSearchError, setExamSearchError] = useState<string | null>(null);

  // Unified Level + Deck Tab + Difficulty state controlling the entire Luyện tập page
  const [officialCatalog, setOfficialCatalog] = useState<OfficialCatalogItem[]>([]);
  const [catalogSummary, setCatalogSummary] = useState<
    Record<number, { total: number; easy: number; medium: number; hard: number }>
  >({});
  const [skillCountsByLevel, setSkillCountsByLevel] = useState<Record<number, SkillCounts>>({});
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  const [selectedExamLevel, setSelectedExamLevel] = useState<number | 'all'>(defaultLevel);
  const [activeDeckTab, setActiveDeckTab] = useState<PracticeDeckTab>('full');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyFilter>('all');
  const [catalogSearch, setCatalogSearch] = useState('');

  // Numbered Skill Sets state (Đề Nghe 1, Đề Nghe 2..., Đề Đọc 1..., Đề Viết 1...)
  const [skillSetsCache, setSkillSetsCache] = useState<
    Record<string, { totalQuestions: number; totalSets: number; pageSize: number; sets: SkillSetItem[] }>
  >({});
  const [isLoadingSkillSets, setIsLoadingSkillSets] = useState(false);

  // Effective numeric HSK level for 1-Click Random Exam & Numbered Skill Decks
  const activeNumericLevel: HSKLevel =
    selectedExamLevel === 'all' ? defaultLevel : (selectedExamLevel as HSKLevel);

  const activeSkillCounts: SkillCounts = skillCountsByLevel[activeNumericLevel] || {
    listening: 0,
    reading: 0,
    writing: 0,
    total: 0,
  };

  // HSK 1 has NO Writing skill — hide Writing completely and auto-reset if switching to HSK 1
  const hasWritingForLevel = activeNumericLevel >= 2 && activeSkillCounts.writing > 0;
  useEffect(() => {
    if (activeDeckTab === 'writing' && activeNumericLevel === 1) {
      setActiveDeckTab('full');
    }
  }, [activeNumericLevel, activeDeckTab]);

  // Fetch numbered skill sets whenever user switches to Đề Nghe / Đề Đọc / Đề Viết tab
  useEffect(() => {
    if (activeDeckTab === 'full') return;
    if (activeNumericLevel === 1 && activeDeckTab === 'writing') return;
    const key = `${activeNumericLevel}_${activeDeckTab}`;
    if (skillSetsCache[key]) return;

    let cancelled = false;
    setIsLoadingSkillSets(true);
    fetch(`/api/exam/skill-sets?level=${activeNumericLevel}&skill=${activeDeckTab}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.success) return;
        setSkillSetsCache((prev) => ({
          ...prev,
          [key]: {
            totalQuestions: Number(data.totalQuestions) || 0,
            totalSets: Number(data.totalSets) || 0,
            pageSize: Number(data.pageSize) || 20,
            sets: Array.isArray(data.sets) ? data.sets : [],
          },
        }));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsLoadingSkillSets(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeNumericLevel, activeDeckTab, skillSetsCache]);

  const totalApprovedQuestions = useMemo(() => {
    return Object.values(skillCountsByLevel).reduce((sum, s) => sum + (s?.total || 0), 0);
  }, [skillCountsByLevel]);

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

  const activeSkillDeck =
    activeDeckTab !== 'full' ? skillSetsCache[`${activeNumericLevel}_${activeDeckTab}`] || null : null;

  const filteredSkillSets = useMemo(() => {
    if (!activeSkillDeck) return [];
    const q = catalogSearch.trim().toLowerCase();
    return activeSkillDeck.sets.filter((s) => {
      if (selectedDifficulty !== 'all' && s.difficultyTier !== selectedDifficulty) return false;
      if (q && !s.title.toLowerCase().includes(q) && !s.rangeLabel.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [activeSkillDeck, selectedDifficulty, catalogSearch]);

  const [activeHskExamView, setActiveHskExamView] = useState<'hall' | 'mock' | 'practice' | 'notebook' | null>(null);
  const [hskExamInitialLevel, setHskExamInitialLevel] = useState<number>(defaultLevel);
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
  const [activeSkillSet, setActiveSkillSet] = useState<{
    level: number;
    skill: 'listening' | 'reading' | 'writing';
    setIndex: number;
    totalSets: number;
    title: string;
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
      setActiveSkillSet(null);
      setActiveHskExamView('mock');
      return;
    } else if (viewParam === 'hsk_practice' || viewParam === 'practice') {
      setHskExamInitialLevel(!isNaN(levelParam) && levelParam >= 1 && levelParam <= 6 ? levelParam : 1);
      setHskExamInitialSkill(skillParam);
      setActiveOfficialSet(null);
      setActiveSkillSet(null);
      setActiveHskExamView('practice');
      return;
    } else if (viewParam === 'hsk_notebook' || viewParam === 'wrong_notebook' || viewParam === 'notebook') {
      setActiveOfficialSet(null);
      setActiveSkillSet(null);
      setActiveHskExamView('notebook');
      return;
    } else if (viewParam === 'hsk_hall' || viewParam === 'hall') {
      setActiveOfficialSet(null);
      setActiveSkillSet(null);
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
          setSkillCountsByLevel(data.skillCountsByLevel || {});
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

  const launchRandomMock = (level: HSKLevel) => {
    setActiveOfficialSet(null);
    setActiveSkillSet(null);
    setHskExamInitialLevel(level);
    setHskExamInitialSkill(undefined);
    setHskExamInitialDifficulty(selectedDifficulty);
    setActiveHskExamView('mock');
  };

  const launchRandomSkillPractice = (level: HSKLevel, skill: 'listening' | 'reading' | 'writing') => {
    setActiveOfficialSet(null);
    setActiveSkillSet(null);
    setHskExamInitialLevel(level);
    setHskExamInitialSkill(skill);
    setHskExamInitialDifficulty('all');
    setActiveHskExamView('practice');
  };

  const launchNumberedSkillSet = (
    level: HSKLevel,
    skill: 'listening' | 'reading' | 'writing',
    item: SkillSetItem,
    totalSets: number
  ) => {
    setActiveOfficialSet(null);
    setHskExamInitialLevel(level);
    setHskExamInitialSkill(skill);
    setHskExamInitialDifficulty('all');
    setActiveSkillSet({
      level,
      skill,
      setIndex: item.setIndex,
      totalSets,
      title: item.title,
    });
    setActiveHskExamView('practice');
  };

  const launchOfficialSet = (item: OfficialCatalogItem, mode: 'mock' | 'practice') => {
    setActiveSkillSet(null);
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
              setActiveSkillSet(null);
              setActiveHskExamView(null);
            }}
            className="px-3.5 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-background)] text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] flex items-center gap-2 cursor-pointer shadow-xs transition-all"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            <span>Quay lại danh mục Luyện tập</span>
          </button>
        </div>

        <HSKMockExam
          key={
            activeSkillSet
              ? `skill_${activeSkillSet.level}_${activeSkillSet.skill}_${activeSkillSet.setIndex}`
              : activeOfficialSet
              ? `${activeOfficialSet.id}_${activeOfficialSet.mode}`
              : `${activeHskExamView}_${hskExamInitialLevel}_${hskExamInitialSkill || 'all'}_${hskExamInitialDifficulty}`
          }
          initialMode={activeHskExamView}
          initialLevel={hskExamInitialLevel}
          initialSkill={hskExamInitialSkill}
          initialDifficulty={hskExamInitialDifficulty}
          initialOfficialSet={activeOfficialSet}
          initialSkillSet={activeSkillSet}
          onExit={() => {
            setActiveOfficialSet(null);
            setActiveSkillSet(null);
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

  // Counts for active difficulty filter pills (matches either Full Deck or Numbered Skill Deck)
  const sourceItemsForDiffCount =
    activeDeckTab === 'full' ? levelScopedCatalog : activeSkillDeck?.sets || [];
  const easyCnt = sourceItemsForDiffCount.filter((s) => s.difficultyTier === 'easy').length;
  const medCnt = sourceItemsForDiffCount.filter((s) => s.difficultyTier === 'medium').length;
  const hardCnt = sourceItemsForDiffCount.filter((s) => s.difficultyTier === 'hard').length;

  const difficultyShortLabel =
    selectedDifficulty === 'easy'
      ? 'Khởi động'
      : selectedDifficulty === 'medium'
      ? 'Chuẩn thi'
      : selectedDifficulty === 'hard'
      ? 'Thử thách'
      : 'ngẫu nhiên';

  const skillMetaLabel =
    activeDeckTab === 'listening'
      ? 'Nghe hiểu'
      : activeDeckTab === 'reading'
      ? 'Đọc hiểu'
      : 'Viết';

  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 space-y-5 animate-fade-in" id="quizzes-container">
      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
            Phòng Thi Thử & Luyện Đề HSK 3.0 (CTI / CLEC)
          </p>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">Luyện tập</h1>
          <p className="text-sm text-[var(--color-text-secondary)] max-w-2xl leading-relaxed">
            {officialCatalog.length > 0
              ? `${officialCatalog.length} bộ đề tổng hợp & ${totalApprovedQuestions.toLocaleString('vi-VN')} câu luyện riêng từng kỹ năng (chia sẵn Đề 1, Đề 2... theo lộ trình Dễ → Khó).`
              : 'Kho đề thi thử & luyện kỹ năng chuẩn HSK 3.0 đã kiểm duyệt.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <form onSubmit={handleLookupExamCode} className="flex items-center gap-1.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[var(--color-text-secondary)] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={examCodeInput}
                onChange={(e) => setExamCodeInput(e.target.value.toUpperCase())}
                placeholder="Mã đề GV (EXAM-XXXX)"
                className="silk-input pl-8 pr-2.5 py-1.5 text-xs font-mono font-bold w-44 uppercase tracking-wider"
              />
            </div>
            <button
              type="submit"
              disabled={isLoadingExams || !examCodeInput.trim()}
              className="silk-btn px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold disabled:opacity-50 flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <span>Mở mã</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setActiveOfficialSet(null);
              setActiveSkillSet(null);
              setActiveHskExamView('notebook');
            }}
            className="px-3 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] flex items-center gap-1.5 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-500" />
            <span>Sổ câu sai</span>
          </button>
        </div>
      </div>

      {examSearchError && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-medium">
          {examSearchError}
        </div>
      )}

      {/* UNIFIED WORKSPACE CARD */}
      <section className="silk-card p-5 sm:p-6 space-y-4" data-testid="quizzes-official-exam-library">
        {/* 1. Single Unified HSK Level Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {HSK_LEVELS.map((lvl) => {
              const cnt = catalogSummary[lvl]?.total ?? officialCatalog.filter((s) => s.level === lvl).length;
              return (
                <button
                  key={lvl}
                  type="button"
                  data-testid={`quizzes-level-tab-${lvl}`}
                  onClick={() => {
                    setSelectedExamLevel(lvl);
                    if (lvl === 1 && activeDeckTab === 'writing') {
                      setActiveDeckTab('full');
                    }
                  }}
                  className={`silk-pill px-3.5 py-1.5 text-xs font-bold whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    selectedExamLevel === lvl
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-[var(--color-background)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)]'
                  }`}
                >
                  <span>HSK {lvl}</span>
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
            <button
              type="button"
              data-testid="quizzes-level-tab-all"
              onClick={() => {
                setSelectedExamLevel('all');
                setActiveDeckTab('full');
              }}
              className={`silk-pill px-3 py-1.5 text-xs font-bold whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                selectedExamLevel === 'all'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'bg-[var(--color-background)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)]'
              }`}
            >
              <span>Tất cả</span>
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                  selectedExamLevel === 'all' ? 'bg-white/20 text-white' : 'bg-[var(--color-surface)]'
                }`}
              >
                {officialCatalog.length}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-52">
              <Search className="w-3.5 h-3.5 text-[var(--color-text-secondary)] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder={activeDeckTab === 'full' ? 'Tìm theo chủ đề đề thi...' : 'Tìm số đề (vd: Đề Nghe 3)...'}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs text-[var(--color-text-primary)] focus:outline-hidden focus:border-teal-500"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setSkillSetsCache({});
                loadOfficialCatalog();
                loadOnlineExams();
              }}
              className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1 cursor-pointer shrink-0"
              title="Làm mới danh sách đề"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isLoadingCatalog || isLoadingExams ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Làm mới</span>
            </button>
          </div>
        </div>

        {/* 2. Compact 1-Row Mode Strip: Switch between Full Exams vs Numbered Skill Decks (Đề Nghe / Đề Đọc / Đề Viết) + 1-Click Random */}
        <div className="p-3.5 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Deck Switcher Tabs: Bộ đề tổng hợp / Đề Nghe / Đề Đọc / Đề Viết (hidden on HSK 1!) */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              data-testid="deck-tab-full"
              onClick={() => setActiveDeckTab('full')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                activeDeckTab === 'full'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Đề Tổng Hợp</span>
              <span className="text-[10px] opacity-85 font-mono">({levelScopedCatalog.length})</span>
            </button>

            {activeSkillCounts.listening > 0 && (
              <button
                type="button"
                data-testid="btn-skill-listening"
                onClick={() => {
                  if (selectedExamLevel === 'all') setSelectedExamLevel(activeNumericLevel);
                  setActiveDeckTab('listening');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                  activeDeckTab === 'listening'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-blue-500/12 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/25'
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Đề Nghe HSK {activeNumericLevel}</span>
                <span className="text-[10px] opacity-85 font-mono">({activeSkillCounts.listening} câu)</span>
              </button>
            )}

            {activeSkillCounts.reading > 0 && (
              <button
                type="button"
                data-testid="btn-skill-reading"
                onClick={() => {
                  if (selectedExamLevel === 'all') setSelectedExamLevel(activeNumericLevel);
                  setActiveDeckTab('reading');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                  activeDeckTab === 'reading'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-500/12 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Đề Đọc HSK {activeNumericLevel}</span>
                <span className="text-[10px] opacity-85 font-mono">({activeSkillCounts.reading} câu)</span>
              </button>
            )}

            {hasWritingForLevel && (
              <button
                type="button"
                data-testid="btn-skill-writing"
                onClick={() => {
                  if (selectedExamLevel === 'all') setSelectedExamLevel(activeNumericLevel);
                  setActiveDeckTab('writing');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                  activeDeckTab === 'writing'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-purple-500/12 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/25'
                }`}
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Đề Viết HSK {activeNumericLevel}</span>
                <span className="text-[10px] opacity-85 font-mono">({activeSkillCounts.writing} câu)</span>
              </button>
            )}
          </div>

          {/* Right Quick 1-Click Action */}
          <div className="flex items-center gap-2">
            {activeDeckTab === 'full' ? (
              <button
                type="button"
                data-testid="btn-quick-random-mock"
                onClick={() => launchRandomMock(activeNumericLevel)}
                className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Thi ngẫu nhiên HSK {activeNumericLevel} ({difficultyShortLabel})</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => launchRandomSkillPractice(activeNumericLevel, activeDeckTab)}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Luyện nhanh 15 câu {skillMetaLabel} ngẫu nhiên</span>
              </button>
            )}
          </div>
        </div>

        {/* 3. Difficulty Filter Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: 'all', label: `Tất cả mức độ (${sourceItemsForDiffCount.length})`, active: 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900' },
              { key: 'easy', label: `🟢 Khởi động / Cơ bản (${easyCnt})`, active: 'bg-emerald-600 text-white' },
              { key: 'medium', label: `🟡 Chuẩn thi / Trung bình (${medCnt})`, active: 'bg-amber-600 text-white' },
              { key: 'hard', label: `🔴 Thử thách / Nâng cao (${hardCnt})`, active: 'bg-rose-600 text-white' },
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

          <span className="text-[11px] text-[var(--color-text-secondary)] flex items-center gap-1">
            <Target className="w-3.5 h-3.5 text-teal-500 shrink-0" />
            <span>
              {activeDeckTab === 'full'
                ? 'Đã xếp sẵn theo lộ trình Dễ → Khó'
                : activeSkillDeck
                ? `${activeSkillDeck.totalQuestions} câu chia thành ${activeSkillDeck.totalSets} đề (${activeSkillDeck.pageSize} câu/đề • Dễ → Khó)`
                : 'Chia thành từng đề nhỏ không trùng câu hỏi'}
            </span>
          </span>
        </div>

        {/* 4A. NUMBERED SKILL PRACTICE SETS GRID (Đề Nghe 1, Đề Nghe 2..., Đề Đọc 1..., Đề Viết 1...) */}
        {activeDeckTab !== 'full' ? (
          isLoadingSkillSets && !activeSkillDeck ? (
            <div className="p-8 text-center text-xs text-[var(--color-text-secondary)]">
              Đang chia bộ đề {skillMetaLabel} HSK {activeNumericLevel}...
            </div>
          ) : filteredSkillSets.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-[var(--color-background)] border border-dashed border-[var(--color-border)] space-y-1">
              <FileCheck className="w-8 h-8 text-[var(--color-text-secondary)]/40 mx-auto" />
              <p className="text-sm font-bold text-[var(--color-text-primary)]">
                Không có đề {skillMetaLabel} khớp bộ lọc hiện tại
              </p>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Hãy chọn "Tất cả mức độ" hoặc cấp độ HSK khác.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredSkillSets.map((item) => {
                const tierUi =
                  item.difficultyTier === 'easy'
                    ? {
                        badge: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
                        label: '🟢 Cơ bản',
                      }
                    : item.difficultyTier === 'hard'
                    ? {
                        badge: 'bg-rose-500/12 text-rose-700 dark:text-rose-300 border-rose-500/30',
                        label: '🔴 Nâng cao',
                      }
                    : {
                        badge: 'bg-amber-500/12 text-amber-700 dark:text-amber-300 border-amber-500/30',
                        label: '🟡 Trung bình',
                      };

                const btnColor =
                  activeDeckTab === 'listening'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : activeDeckTab === 'reading'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-purple-600 hover:bg-purple-700';

                return (
                  <div
                    key={`${activeNumericLevel}_${activeDeckTab}_${item.setIndex}`}
                    data-testid={`skill-set-card-${activeDeckTab}-${item.setIndex}`}
                    className="p-4 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] hover:border-teal-400/70 transition-all flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${tierUi.badge}`}>
                          {tierUi.label}
                        </span>
                        <span className="text-[11px] font-mono text-[var(--color-text-secondary)]">
                          {item.rangeLabel}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-[var(--color-text-primary)]">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-[var(--color-text-secondary)]">
                        {item.questionCount} câu hỏi chọn lọc • Giải thích chi tiết ngay từng câu
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        launchNumberedSkillSet(
                          activeNumericLevel,
                          activeDeckTab,
                          item,
                          activeSkillDeck?.totalSets || 1
                        )
                      }
                      className={`w-full py-2 px-3 rounded-xl ${btnColor} text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs`}
                    >
                      <span>Luyện {item.title.split(' (')[0]}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )
        ) : /* 4B. OFFICIAL FULL HSK 3.0 EXAM SETS GRID */
        isLoadingCatalog && officialCatalog.length === 0 ? (
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
