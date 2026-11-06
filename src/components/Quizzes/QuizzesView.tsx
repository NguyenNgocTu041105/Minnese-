import React, { useState, useEffect, useMemo } from 'react';
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

const HSK_LEVELS: HSKLevel[] = [1, 2, 3, 4, 5, 6];

export const QuizzesView: React.FC<QuizzesViewProps> = ({
  stats,
  onUpdateStats,
  userProfile,
  activeExamToRun,
  onExitExam,
}) => {
  const [mockLevel, setMockLevel] = useState<HSKLevel>(1);
  const [practiceLevel, setPracticeLevel] = useState<HSKLevel>(1);

  const [onlineExamsList, setOnlineExamsList] = useState<OnlineExamDoc[]>([]);
  const [isLoadingExams, setIsLoadingExams] = useState(false);
  const [examCodeInput, setExamCodeInput] = useState('');
  const [activeExamRunning, setActiveExamRunning] = useState<OnlineExamDoc | null>(null);
  const [examSearchError, setExamSearchError] = useState<string | null>(null);
  const [selectedExamLevel, setSelectedExamLevel] = useState<number | 'all'>('all');

  const filteredOnlineExams = useMemo(() => {
    if (selectedExamLevel === 'all') return onlineExamsList;
    return onlineExamsList.filter((exam) => {
      const lvl = exam.hsk_level ?? (exam as any).level;
      return lvl === selectedExamLevel;
    });
  }, [onlineExamsList, selectedExamLevel]);

  const [activeHskExamView, setActiveHskExamView] = useState<'hall' | 'mock' | 'practice' | 'notebook' | null>(null);
  const [hskExamInitialLevel, setHskExamInitialLevel] = useState<number>(1);
  const [hskExamInitialSkill, setHskExamInitialSkill] = useState<string | undefined>(undefined);

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
      setActiveHskExamView('mock');
      return;
    } else if (viewParam === 'hsk_practice' || viewParam === 'practice') {
      setHskExamInitialLevel(!isNaN(levelParam) && levelParam >= 1 && levelParam <= 6 ? levelParam : 1);
      setHskExamInitialSkill(skillParam);
      setActiveHskExamView('practice');
      return;
    } else if (viewParam === 'hsk_notebook' || viewParam === 'wrong_notebook' || viewParam === 'notebook') {
      setActiveHskExamView('notebook');
      return;
    } else if (viewParam === 'hsk_hall' || viewParam === 'hall') {
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

  useEffect(() => {
    loadOnlineExams();
  }, []);

  const loadOnlineExams = async () => {
    setIsLoadingExams(true);
    try {
      const list = await fetchOnlineExamsFromFirestore();
      setOnlineExamsList(list || []);
    } catch (e) {
      console.error('Error fetching online exams:', e);
    } finally {
      setIsLoadingExams(false);
    }
  };

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
    setHskExamInitialLevel(level);
    setActiveHskExamView('mock');
  };

  const launchPractice = (level: HSKLevel) => {
    setHskExamInitialLevel(level);
    setActiveHskExamView('practice');
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
            onClick={() => setActiveHskExamView(null)}
            className="px-3.5 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-background)] text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] flex items-center gap-2 cursor-pointer shadow-xs transition-all"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            <span>Quay lại danh mục Luyện tập</span>
          </button>
        </div>

        <HSKMockExam
          initialMode={activeHskExamView}
          initialLevel={hskExamInitialLevel}
          initialSkill={hskExamInitialSkill}
          onExit={() => setActiveHskExamView(null)}
          onRewardXp={(amount) => {
            if (onUpdateStats) {
              onUpdateStats({ xp: (stats.xp || 0) + amount });
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 space-y-6 animate-fade-in" id="quizzes-container">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
            Phòng Thi Thử & Luyện Đề HSK 3.0 (CTI / CLEC)
          </p>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">Luyện tập</h1>
          <p className="text-sm text-[var(--color-text-secondary)] max-w-2xl leading-relaxed">
            Chỉ gồm đề thi thử và luyện kỹ năng từ câu hỏi giáo viên đã duyệt trong Quản trị QBank.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setActiveHskExamView('notebook')}
          className="self-start sm:self-auto px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] flex items-center gap-1.5 cursor-pointer"
        >
          <BookOpen className="w-4 h-4 text-amber-500" />
          <span>Sổ câu sai</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="silk-card p-5 sm:p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--color-text-primary)]">Thi thử HSK</h2>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed">
                Đề thi thử đúng cấu trúc, có giờ, chấm Đỗ/Trượt từ kho QBank đã duyệt.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {HSK_LEVELS.map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setMockLevel(lvl)}
                className={`silk-pill px-3 py-1 text-xs font-bold ${
                  mockLevel === lvl
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                HSK {lvl}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => launchMock(mockLevel)}
            className="silk-btn w-full px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs"
          >
            <Zap className="w-4 h-4" />
            <span>Thi thử 1-Click</span>
          </button>
        </section>

        <section className="silk-card p-5 sm:p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--color-text-primary)]">Luyện kỹ năng</h2>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed">
                Nghe, đọc, viết theo dạng bài giáo viên tạo và phê duyệt trong QBank.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {HSK_LEVELS.map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setPracticeLevel(lvl)}
                className={`silk-pill px-3 py-1 text-xs font-bold ${
                  practiceLevel === lvl
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                HSK {lvl}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => launchPractice(practiceLevel)}
            className="silk-btn w-full px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs"
          >
            <Brain className="w-4 h-4" />
            <span>Luyện kỹ năng</span>
          </button>
        </section>
      </div>

      <section className="silk-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-purple-600" />
              <span>Đề Thi Online & Sách Bài Tập</span>
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              Nhập mã đề hoặc chọn đề đã phát hành từ QBank / Xưởng đề.
            </p>
          </div>

          <form onSubmit={handleLookupExamCode} className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[var(--color-text-secondary)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={examCodeInput}
                onChange={(e) => setExamCodeInput(e.target.value.toUpperCase())}
                placeholder="HSK1-2026-XXXX hoặc EXAM-XXXX"
                className="silk-input pl-8 pr-3 py-2 text-xs font-mono font-bold w-52 uppercase text-center tracking-wider"
              />
            </div>
            <button
              type="submit"
              disabled={isLoadingExams || !examCodeInput.trim()}
              className="silk-btn px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
            >
              <span>Làm bài</span>
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {(['all', 1, 2, 3, 4, 5, 6] as const).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setSelectedExamLevel(lvl)}
                className={`silk-pill px-3 py-1.5 text-xs font-bold whitespace-nowrap ${
                  selectedExamLevel === lvl
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-[var(--color-background)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)]'
                }`}
              >
                {lvl === 'all' ? 'Tất cả' : `HSK ${lvl}`}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3">
            <h3 className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
              Danh sách Đề thi ({filteredOnlineExams.length})
            </h3>
            <button
              type="button"
              onClick={loadOnlineExams}
              className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className={`w-3 h-3 ${isLoadingExams ? 'animate-spin' : ''}`} />
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        {filteredOnlineExams.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-[var(--color-background)] border border-dashed border-[var(--color-border)] space-y-1">
            <FileCheck className="w-8 h-8 text-[var(--color-text-secondary)]/40 mx-auto" />
            <p className="text-sm font-bold text-[var(--color-text-primary)]">
              {selectedExamLevel === 'all' ? 'Chưa có đề thi được phát hành' : `Chưa có đề thi HSK ${selectedExamLevel} được phát hành`}
            </p>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Giáo viên soạn và phát hành đề trong Quản trị QBank.
            </p>
          </div>
        ) : (
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
        )}
      </section>
    </div>
  );
};
