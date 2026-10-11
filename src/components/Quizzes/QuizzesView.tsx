import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  HelpCircle,
  Trophy,
  Sparkles,
  Volume2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Bot,
  Brain,
  Headphones,
  ChevronRight,
  Flame,
  BookOpen,
  Info,
  Layers,
  Share2,
  Copy,
  Check,
  GraduationCap,
  Search,
  Clock,
  ArrowRight,
  FileCheck,
  PenTool,
} from 'lucide-react';
import { QuizQuestion, UserStats, HSKLevel, OnlineExamDoc, UserProfile } from '../../types';
import { playChineseAudio } from '../../utils/chineseAudio';
import { CartoonLoader } from '../CartoonLoader';
import {
  getCuratedQuestions,
  CURATED_PINYIN_GRAMMAR_BY_HSK,
  CURATED_LISTENING_BY_HSK,
  CURATED_PINYIN_GRAMMAR_QUESTIONS,
  CURATED_LISTENING_QUESTIONS,
} from '../../data/curatedQuizData';
import { fetchOnlineExamsFromFirestore, getOnlineExamByCodeFromFirestore } from '../../lib/firebase';
import { OnlineExamRunner } from './OnlineExamRunner';
import { WritingCoachView } from '../Writing/WritingCoachView';
import { logStudyActivity } from '../../utils/activityLogger';

interface QuizzesViewProps {
  stats: UserStats;
  onUpdateStats: (newStats: Partial<UserStats>) => void;
  userProfile?: UserProfile;
}

type QuizCategory = 'pinyin_grammar' | 'listening' | 'ai_custom' | 'online_exams' | 'writing';
type SubTypeFilter = 'all' | 'pinyin' | 'grammar';

export const QuizzesView: React.FC<QuizzesViewProps> = ({ stats, onUpdateStats, userProfile }) => {
  const [activeCategory, setActiveCategory] = useState<QuizCategory>('pinyin_grammar');
  const [selectedHskFilter, setSelectedHskFilter] = useState<HSKLevel | 'all'>('all');
  const [subTypeFilter, setSubTypeFilter] = useState<SubTypeFilter>('all');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [customTopic, setCustomTopic] = useState('');
  const [customHskLevel, setCustomHskLevel] = useState<HSKLevel>(2);
  const [questionCount, setQuestionCount] = useState<number>(20);
  const [copiedResult, setCopiedResult] = useState(false);

  // Online Exams Integration
  const [onlineExamsList, setOnlineExamsList] = useState<OnlineExamDoc[]>([]);
  const [isLoadingExams, setIsLoadingExams] = useState(false);
  const [examCodeInput, setExamCodeInput] = useState('');
  const [activeExamRunning, setActiveExamRunning] = useState<OnlineExamDoc | null>(null);
  const [examSearchError, setExamSearchError] = useState<string | null>(null);

  // Initialize and update question pool based on filters
  const [activeQuestionPool, setActiveQuestionPool] = useState<QuizQuestion[]>(() =>
    getCuratedQuestions('pinyin_grammar', 'all', 'all')
  );

  const applyFilters = (
    cat: QuizCategory,
    hsk: HSKLevel | 'all',
    sub: SubTypeFilter
  ) => {
    if (cat === 'pinyin_grammar' || cat === 'listening') {
      const filtered = getCuratedQuestions(cat, hsk, sub);
      setActiveQuestionPool(filtered.length > 0 ? filtered : CURATED_PINYIN_GRAMMAR_QUESTIONS);
      setCurrentQuestionIndex(0);
      setSelectedOption(null);
      setIsAnswered(false);
      setIsCorrect(false);
      setScore(0);
      setQuizFinished(false);
    }
  };

  const handleSelectHskLevel = (level: HSKLevel | 'all') => {
    setSelectedHskFilter(level);
    applyFilters(activeCategory, level, subTypeFilter);
  };

  const handleSelectSubType = (sub: SubTypeFilter) => {
    setSubTypeFilter(sub);
    applyFilters(activeCategory, selectedHskFilter, sub);
  };

  const handleSwitchCategory = (cat: QuizCategory) => {
    setActiveCategory(cat);
    applyFilters(cat, selectedHskFilter, subTypeFilter);
  };

  // Check URL parameter for direct exam access
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const examParam = params.get('exam') || params.get('code') || params.get('exam_code');
    if (examParam) {
      const code = examParam.trim().toUpperCase();
      setExamCodeInput(code);
      setActiveCategory('online_exams');
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
    if (activeCategory === 'online_exams') {
      loadOnlineExams();
    }
  }, [activeCategory]);

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

  const handleShareZaloResult = async () => {
    const accuracy = Math.round((score / activeQuestionPool.length) * 100);
    const categoryName =
      activeCategory === 'pinyin_grammar'
        ? 'Pinyin & Ngữ pháp'
        : activeCategory === 'listening'
        ? 'Nghe hiểu ngữ âm'
        : 'Đề luyện thi AI';
    const text = `🎉 [MINNESE CHINESE] KẾT QUẢ BÀI TẬP TRẮC NGHIỆM
👤 Học viên vừa hoàn thành bài tập: *${categoryName}*
🎯 Điểm số: *${score}/${activeQuestionPool.length} câu đúng* (${accuracy}%)
🔥 Streak & XP: +${score * 25} XP
👉 Cùng vào luyện tập tiếng Trung tại: ${window.location.origin}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Kết quả bài tập tiếng Trung Minnese',
          text,
          url: window.location.origin,
        });
      } catch {
        // Fallback to clipboard
        await navigator.clipboard.writeText(text);
        setCopiedResult(true);
        setTimeout(() => setCopiedResult(false), 3000);
      }
    } else {
      await navigator.clipboard.writeText(text);
      setCopiedResult(true);
      setTimeout(() => setCopiedResult(false), 3000);
    }
  };

  const currentQ = activeQuestionPool[currentQuestionIndex] || null;

  const handleSelectOption = (option: string) => {
    if (isAnswered || !currentQ) return;
    setSelectedOption(option);
    setIsAnswered(true);

    const correct = option === currentQ.correctAnswer;
    setIsCorrect(correct);

    logStudyActivity('review', 'Trả lời câu hỏi trắc nghiệm');

    if (correct) {
      setScore((prev) => prev + 1);
      // Award +25 XP
      onUpdateStats({
        xp: stats.xp + 25,
      });
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex + 1 < activeQuestionPool.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setIsCorrect(false);
    } else {
      setQuizFinished(true);
      onUpdateStats({
        quizzesCompleted: stats.quizzesCompleted + 1,
        quizAccuracy: Math.round(((score + (isCorrect ? 1 : 0)) / activeQuestionPool.length) * 100),
      });
      logStudyActivity(
        'review',
        `Hoàn thành trắc nghiệm ${selectedHskFilter !== 'all' ? `HSK ${selectedHskFilter}` : 'tổng hợp'}`
      );
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  };

  const handleRestartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setIsCorrect(false);
    setScore(0);
    setQuizFinished(false);
  };

  const handleGenerateAIQuiz = async () => {
    setAiGenerating(true);
    try {
      const res = await fetch('/api/gemini/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: customTopic.trim() || 'Giao tiếp hàng ngày, Đời sống & Ngữ pháp',
          hskLevel: customHskLevel,
          count: questionCount || 20,
        }),
      });
      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        setActiveQuestionPool(data.questions);
        handleRestartQuiz();
        setActiveCategory('ai_custom');
      }
    } catch (e) {
      console.error('Error generating AI quiz:', e);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleGenerateAIQuizForCategory = async (cat: QuizCategory) => {
    setAiGenerating(true);
    const targetHsk = selectedHskFilter !== 'all' ? selectedHskFilter : (userProfile?.current_level || 2);
    const subTopicName =
      subTypeFilter === 'pinyin'
        ? 'Chuyên đề Pinyin, thanh điệu & biến điệu âm tiết'
        : subTypeFilter === 'grammar'
        ? 'Chuyên đề Trợ từ ngữ pháp, bổ ngữ & cấu trúc câu'
        : 'Tổng hợp Pinyin & Ngữ pháp trọng tâm';

    const topicText =
      cat === 'pinyin_grammar'
        ? `${subTopicName} chuẩn HSK ${targetHsk}`
        : cat === 'listening'
        ? `Luyện nghe phát âm tiếng Trung, phân biệt âm tiết dễ nhầm và hội thoại giao tiếp HSK ${targetHsk}`
        : customTopic.trim() || 'Giao tiếp hàng ngày & Ngữ pháp';

    try {
      const res = await fetch('/api/gemini/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topicText,
          hskLevel: targetHsk,
          count: 20,
        }),
      });
      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        setActiveQuestionPool(data.questions);
        handleRestartQuiz();
      }
    } catch (e) {
      console.error('Error generating AI quiz for category:', e);
    } finally {
      setAiGenerating(false);
    }
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
          onExit={() => setActiveExamRunning(null)}
          onCompleted={(percent, correctCount) => {
            onUpdateStats({
              quizzesCompleted: stats.quizzesCompleted + 1,
              xp: stats.xp + correctCount * 10,
            });
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

  return (
    <div className="w-full max-w-5xl 2xl:max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6" id="quizzes-container">
      {/* Top Banner & Control Deck */}
      <div className="bg-[var(--color-surface)] rounded-2xl p-5 sm:p-6 border border-[var(--color-border)] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[var(--color-text-primary)] tracking-tight flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[var(--color-primary-light)] border border-[var(--color-primary)]/20 text-[var(--color-primary)] flex items-center justify-center shadow-sm">
                <Brain className="w-5 h-5" />
              </div>
              <span>Luyện tập Trắc nghiệm theo Cấp độ HSK (1 - 6)</span>
            </h1>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1.5 leading-relaxed">
              Ngân hàng bài tập chuyên sâu phân hóa rõ ràng theo từng bậc HSK 1, 2, 3, 4, 5, 6 — Rèn luyện Pinyin, Ngữ pháp, Nghe hiểu ngữ âm và Sinh đề AI chuẩn khảo thí.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/20 text-xs font-bold font-mono">
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>+25 XP / câu đúng</span>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 mt-5 pt-4 border-t border-[var(--color-border)] flex-wrap items-center">
          <button
            type="button"
            onClick={() => handleSwitchCategory('pinyin_grammar')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeCategory === 'pinyin_grammar'
                ? 'bg-[var(--color-primary)] text-white shadow-sm'
                : 'bg-[var(--color-background)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)]'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Pinyin & Ngữ pháp ({CURATED_PINYIN_GRAMMAR_QUESTIONS.length} câu)</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchCategory('listening')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeCategory === 'listening'
                ? 'bg-[var(--color-primary)] text-white shadow-sm'
                : 'bg-[var(--color-background)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)]'
            }`}
          >
            <Headphones className="w-4 h-4" />
            <span>Luyện nghe phát âm ({CURATED_LISTENING_QUESTIONS.length} câu)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('ai_custom')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeCategory === 'ai_custom'
                ? 'bg-[var(--color-primary)] text-white shadow-sm'
                : 'bg-[var(--color-background)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)]'
            }`}
          >
            <Bot className="w-4 h-4 text-amber-500" />
            <span>Tạo bài kiểm tra AI (Tự do)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('online_exams')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeCategory === 'online_exams'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-[var(--color-background)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)]'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-purple-400" />
            <span>Đề Thi Online & Sách Bài Tập ({onlineExamsList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('writing')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeCategory === 'writing'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                : 'bg-[var(--color-background)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)]'
            }`}
          >
            <PenTool className="w-4 h-4 text-emerald-400" />
            <span>Luyện Viết & Chấm AI (OCR)</span>
          </button>
        </div>

        {/* HSK Level Segmentation Selector for Pinyin & Grammar / Listening */}
        {(activeCategory === 'pinyin_grammar' || activeCategory === 'listening') && (
          <div className="mt-4 pt-4 border-t border-[var(--color-border)] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-[var(--color-text-secondary)] flex items-center gap-1.5 mr-1">
                  <Layers className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                  <span>Chọn cấp độ HSK:</span>
                </span>

                <button
                  type="button"
                  onClick={() => handleSelectHskLevel('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedHskFilter === 'all'
                      ? 'bg-[var(--color-primary)] text-white shadow-sm ring-2 ring-[var(--color-primary)]/20'
                      : 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)]'
                  }`}
                >
                  <span>Tất cả</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-semibold ${
                      selectedHskFilter === 'all'
                        ? 'bg-white/20 text-white'
                        : 'bg-black/10 dark:bg-white/10 text-[var(--color-text-secondary)]'
                    }`}
                  >
                    {activeCategory === 'pinyin_grammar'
                      ? CURATED_PINYIN_GRAMMAR_QUESTIONS.length
                      : CURATED_LISTENING_QUESTIONS.length}
                  </span>
                </button>

                {([1, 2, 3, 4, 5, 6] as HSKLevel[]).map((lvl) => {
                  const count =
                    activeCategory === 'pinyin_grammar'
                      ? CURATED_PINYIN_GRAMMAR_BY_HSK[lvl]?.length || 0
                      : CURATED_LISTENING_BY_HSK[lvl]?.length || 0;
                  const isSelected = selectedHskFilter === lvl;
                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => handleSelectHskLevel(lvl)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/30'
                          : 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)]'
                      }`}
                    >
                      <span>HSK {lvl}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-semibold ${
                          isSelected
                            ? 'bg-white/25 text-white'
                            : 'bg-black/10 dark:bg-white/10 text-[var(--color-text-secondary)]'
                        }`}
                      >
                        {count} câu
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Instant AI Generation Button Calibrated for this Level */}
              <button
                type="button"
                onClick={() => handleGenerateAIQuizForCategory(activeCategory)}
                disabled={aiGenerating}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shrink-0"
              >
                {aiGenerating ? (
                  <RotateCcw className="w-3.5 h-3.5 animate-spin text-amber-500" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                )}
                <span>
                  {aiGenerating
                    ? 'Đang tạo...'
                    : `✨ AI Sinh 20 câu HSK ${
                        selectedHskFilter === 'all'
                          ? userProfile?.current_level || 2
                          : selectedHskFilter
                      }`}
                </span>
              </button>
            </div>

            {/* Sub-mode Filter for Pinyin & Grammar Category */}
            {activeCategory === 'pinyin_grammar' && (
              <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
                <span className="text-[11px] font-semibold text-[var(--color-text-secondary)] mr-1">
                  Chuyên mục:
                </span>
                <button
                  type="button"
                  onClick={() => handleSelectSubType('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                    subTypeFilter === 'all'
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 font-bold'
                      : 'bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-transparent'
                  }`}
                >
                  Tất cả ({activeQuestionPool.length} câu đang hiển thị)
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectSubType('pinyin')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                    subTypeFilter === 'pinyin'
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 font-bold'
                      : 'bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-transparent'
                  }`}
                >
                  🔤 Chuyên đề Pinyin & Ngữ âm
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectSubType('grammar')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                    subTypeFilter === 'grammar'
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 font-bold'
                      : 'bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-transparent'
                  }`}
                >
                  📖 Chuyên đề Ngữ pháp & Cấu trúc
                </button>
              </div>
            )}
          </div>
        )}

        {/* AI Custom Quiz Generator Bar */}
        {activeCategory === 'ai_custom' && (
          <div className="mt-4 p-4 rounded-2xl bg-[#0A0C10] border border-amber-500/40 shadow-inner">
            <div className="flex items-center justify-between gap-2 mb-3">
              <p className="text-xs font-bold text-amber-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Sinh đề thi AI tự do (Không bị ràng buộc trong giáo trình)</span>
              </p>
              <span className="text-[11px] text-gray-400">Gemini 3.0 Multimodal</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <div className="sm:col-span-6">
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="Nhập chủ đề tự do: Mua sắm, Du lịch, Đi khám bệnh, Công nghệ AI, Phỏng vấn, Thành ngữ..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#30363D] bg-[#161B22] text-white focus:outline-emerald-500 placeholder-gray-500"
                />
              </div>

              <div className="sm:col-span-2">
                <select
                  value={customHskLevel}
                  onChange={(e) => setCustomHskLevel(Number(e.target.value) as HSKLevel)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-[#30363D] bg-[#161B22] text-white font-mono"
                >
                  <option value={1}>HSK 1</option>
                  <option value={2}>HSK 2</option>
                  <option value={3}>HSK 3</option>
                  <option value={4}>HSK 4</option>
                  <option value={5}>HSK 5</option>
                  <option value={6}>HSK 6</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-[#30363D] bg-[#161B22] text-white font-mono"
                >
                  <option value={20}>20 câu (Chuẩn)</option>
                  <option value={15}>15 câu</option>
                  <option value={10}>10 câu</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={handleGenerateAIQuiz}
                  disabled={aiGenerating}
                  className="w-full h-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {aiGenerating ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>{aiGenerating ? 'Đang tạo...' : 'Tạo 20 câu'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Quiz Working Area */}
      {activeCategory === 'writing' ? (
        <WritingCoachView stats={stats} onUpdateStats={onUpdateStats} userProfile={userProfile} />
      ) : activeCategory === 'online_exams' ? (
        <div className="space-y-6">
          {/* Exam Code Search Card */}
          <div className="bg-[var(--color-surface)] p-6 rounded-2xl border border-purple-500/30 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                  <Search className="w-4 h-4 text-purple-500" />
                  <span>Nhập Mã Đề Thi Trực Tuyến (Exam Code)</span>
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Nhập mã đề thi (ví dụ: <span className="font-mono font-bold text-purple-600 dark:text-purple-400">EXAM-8291</span>) do giáo viên cung cấp để vào phòng thi ngay lập tức.
                </p>
              </div>

              <form onSubmit={handleLookupExamCode} className="flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  value={examCodeInput}
                  onChange={(e) => setExamCodeInput(e.target.value.toUpperCase())}
                  placeholder="EXAM-XXXX"
                  className="px-4 py-2.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs font-mono font-bold text-[var(--color-text-primary)] focus:outline-none focus:border-purple-500 w-36 uppercase text-center tracking-wider"
                />
                <button
                  type="submit"
                  disabled={isLoadingExams || !examCodeInput.trim()}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Làm bài</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>

            {examSearchError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-medium flex items-center gap-2">
                <span>⚠️ {examSearchError}</span>
              </div>
            )}
          </div>

          {/* List of Available Online Exams */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[var(--color-primary)]" />
                <span>Danh sách Đề thi Đã Phát hành ({onlineExamsList.length})</span>
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

            {onlineExamsList.length === 0 ? (
              <div className="p-12 text-center bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] space-y-2">
                <FileCheck className="w-10 h-10 text-[var(--color-text-secondary)]/40 mx-auto" />
                <p className="text-sm font-bold text-[var(--color-text-primary)]">
                  Chưa có đề thi trực tuyến nào được phát hành
                </p>
                <p className="text-xs text-[var(--color-text-secondary)] max-w-sm mx-auto">
                  Giáo viên có thể sử dụng Xưởng Trộn Sách Bài Tập trong Bảng Quản trị để tạo đề thi cho học viên.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {onlineExamsList.map((exam) => (
                  <div
                    key={exam.id}
                    className="bg-[var(--color-surface)] p-5 rounded-2xl border border-[var(--color-border)] hover:border-purple-500/40 transition-all flex flex-col justify-between gap-4 group shadow-xs"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                          {exam.exam_code}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                          HSK {exam.hsk_level}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-[var(--color-text-primary)] group-hover:text-purple-600 transition-colors line-clamp-2">
                        {exam.title}
                      </h4>

                      <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2">
                        {exam.description}
                      </p>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-[var(--color-border)]">
                      <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
                        <span className="flex items-center gap-1 font-semibold text-[var(--color-text-primary)]">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          {exam.duration_minutes > 0 ? `${exam.duration_minutes} phút` : 'Tự do'}
                        </span>
                        <span className="font-semibold">
                          {exam.questions?.length || 0} câu hỏi
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveExamRunning(exam)}
                        className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                      >
                        <span>Vào thi ngay</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : aiGenerating ? (
        <div className="bg-[#0D1117]/90 backdrop-blur-md rounded-3xl p-10 border border-[#30363D] text-center max-w-lg mx-auto shadow-2xl space-y-4">
          <CartoonLoader
            type="brush_calligraphy"
            message={`Đang sinh bộ đề trắc nghiệm HSK ${customHskLevel}...`}
            subMessage={`Chủ đề: "${customTopic || 'Tổng hợp kiến thức trọng tâm'}" • Số lượng: ${questionCount} câu`}
          />
        </div>
      ) : quizFinished ? (
        <div className="bg-[var(--color-surface)] rounded-3xl p-8 border border-[var(--color-border)] text-center max-w-lg mx-auto shadow-xl space-y-5">
          <CartoonLoader
            type="celebration"
            size="md"
            message="Hoàn thành xuất sắc bài kiểm tra!"
            subMessage={`Bạn đã hoàn thành trọn vẹn ${activeQuestionPool.length} câu hỏi thử thách!`}
          />

          <div className="p-4 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] flex items-center justify-around font-mono">
            <div>
              <p className="text-xs text-[var(--color-text-secondary)]">Điểm đúng</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {score} / {activeQuestionPool.length}
              </p>
            </div>
            <div className="w-px h-10 bg-[var(--color-border)]" />
            <div>
              <p className="text-xs text-[var(--color-text-secondary)]">Tỷ lệ chính xác</p>
              <p className="text-2xl font-bold text-[var(--color-primary)]">
                {Math.round((score / activeQuestionPool.length) * 100)}%
              </p>
            </div>
            <div className="w-px h-10 bg-[var(--color-border)]" />
            <div>
              <p className="text-xs text-[var(--color-text-secondary)]">Kinh nghiệm</p>
              <p className="text-2xl font-bold text-amber-500">+{score * 25} XP</p>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleRestartQuiz}
              className="px-5 py-2.5 rounded-xl bg-[var(--color-background)] hover:bg-[var(--color-surface)] text-[var(--color-text-primary)] text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border border-[var(--color-border)] shadow-xs"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Làm lại bộ câu hỏi này</span>
            </button>

            <button
              type="button"
              onClick={() => handleGenerateAIQuizForCategory(activeCategory)}
              disabled={aiGenerating}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {aiGenerating ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{aiGenerating ? 'Đang tạo câu hỏi mới...' : '✨ AI Sinh 20 câu mới khác'}</span>
            </button>

            <button
              type="button"
              onClick={handleShareZaloResult}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              {copiedResult ? <Check className="w-4 h-4 text-emerald-300" /> : <Share2 className="w-4 h-4" />}
              <span>{copiedResult ? 'Đã copy kết quả Zalo!' : '📱 Báo cáo Zalo'}</span>
            </button>
          </div>
        </div>
      ) : currentQ ? (
        <div className="bg-[var(--color-surface)] rounded-3xl p-6 sm:p-8 border border-[var(--color-border)] shadow-md space-y-6">
          {/* Progress Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono">
                Câu {currentQuestionIndex + 1} / {activeQuestionPool.length}
              </span>
              {currentQ.hskLevel && (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  HSK {currentQ.hskLevel}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[var(--color-text-secondary)]">
              <span>Đúng:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{score}</span>
            </div>
          </div>

          {/* Progress Bar Line */}
          <div className="w-full bg-[var(--color-background)] h-2 rounded-full overflow-hidden border border-[var(--color-border)]/40">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-300"
              style={{
                width: `${((currentQuestionIndex + 1) / activeQuestionPool.length) * 100}%`,
              }}
            />
          </div>

          {/* Quick AI Quiz Generation Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 p-3 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs">
            <div className="flex items-center gap-2 text-[var(--color-text-secondary)] font-medium">
              <Sparkles className="w-3.5 h-3.5 text-purple-500 shrink-0" />
              <span>Cần thêm thử thách mới? Bấm để AI tạo bộ 20 câu hỏi hoàn toàn mới!</span>
            </div>
            <button
              type="button"
              onClick={() => handleGenerateAIQuizForCategory(activeCategory)}
              disabled={aiGenerating}
              className="px-3 py-1.5 rounded-lg bg-purple-600/10 hover:bg-purple-600/20 text-purple-700 dark:text-purple-300 border border-purple-500/20 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50 transition-all"
            >
              {aiGenerating ? <RotateCcw className="w-3.5 h-3.5 animate-spin text-purple-500" /> : <Sparkles className="w-3.5 h-3.5 text-purple-500" />}
              <span>{aiGenerating ? 'Đang tạo...' : '✨ Sinh 20 câu AI mới'}</span>
            </button>
          </div>

          {/* Question Prompt */}
          <div className="text-center py-2 space-y-3">
            <p className="text-base font-semibold text-[var(--color-text-primary)] max-w-2xl mx-auto leading-relaxed">
              {currentQ.prompt}
            </p>

            {currentQ.questionChinese && (
              <h3 className="text-3xl sm:text-4xl font-bold font-serif text-[var(--color-text-primary)] tracking-wide pt-1">
                {currentQ.questionChinese}
              </h3>
            )}

            {currentQ.audioText && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => playChineseAudio(currentQ.audioText!)}
                  className="px-6 py-3 rounded-2xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-bold text-xs shadow-md shadow-[var(--color-primary)]/20 transition-all inline-flex items-center gap-2.5 cursor-pointer active:scale-95"
                >
                  <Volume2 className="w-5 h-5" />
                  <span>Phát âm âm thanh (Bấm để nghe)</span>
                </button>
              </div>
            )}
          </div>

          {/* Multiple Choice Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {currentQ.options?.map((opt, idx) => {
              let btnClass =
                'border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text-primary)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)]/20';

              if (isAnswered) {
                if (opt === currentQ.correctAnswer) {
                  btnClass =
                    'border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold shadow-xs';
                } else if (opt === selectedOption) {
                  btnClass =
                    'border-rose-500 bg-rose-500/15 text-rose-700 dark:text-rose-300 font-bold';
                } else {
                  btnClass = 'border-[var(--color-border)]/50 bg-[var(--color-background)]/50 text-[var(--color-text-secondary)] opacity-60';
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isAnswered}
                  onClick={() => handleSelectOption(opt)}
                  className={`p-4 rounded-2xl text-left text-sm font-medium transition-all flex items-center justify-between gap-3 cursor-pointer ${btnClass}`}
                >
                  <span className="leading-relaxed">{opt}</span>
                  {isAnswered && opt === currentQ.correctAnswer && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  )}
                  {isAnswered && opt === selectedOption && opt !== currentQ.correctAnswer && (
                    <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Rich Detailed Explanation Banner (Shows immediately on answer selection) */}
          {isAnswered && (
            <div
              className={`p-5 rounded-2xl border space-y-4 transition-all duration-300 ${
                isCorrect
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-[var(--color-text-primary)]'
                  : 'bg-rose-500/10 border-rose-500/30 text-[var(--color-text-primary)]'
              }`}
            >
              {/* Answer Status */}
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm flex items-center gap-2">
                  {isCorrect ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-emerald-700 dark:text-emerald-300">🎉 Chính xác! (+25 XP)</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                      <span className="text-rose-700 dark:text-rose-300">❌ Chưa chính xác — Hãy xem phân tích bên dưới</span>
                    </>
                  )}
                </span>
                <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] font-semibold shadow-2xs">
                  Đáp án chuẩn: {typeof currentQ.correctAnswer === 'string' ? currentQ.correctAnswer : currentQ.correctAnswer.join(', ')}
                </span>
              </div>

              {/* 1. Chú thích & Phân tích ngữ pháp / Pinyin */}
              <div className="bg-[var(--color-surface)] p-3.5 rounded-xl border border-[var(--color-border)] space-y-1">
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  <span>Chú thích & Phân tích chi tiết:</span>
                </p>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  {currentQ.explanation}
                </p>
              </div>

              {/* 2. Cách dùng & Quy tắc ngữ cảnh */}
              {currentQ.usageNotes && (
                <div className="bg-[var(--color-surface)] p-3.5 rounded-xl border border-[var(--color-border)] space-y-1">
                  <p className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Cách dùng & Lưu ý mở rộng:</span>
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    {currentQ.usageNotes}
                  </p>
                </div>
              )}

              {/* 3. Ví dụ minh họa thực tế */}
              {currentQ.exampleSentence && (
                <div className="bg-[var(--color-surface)] p-3.5 rounded-xl border border-[var(--color-border)] flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-blue-600 dark:text-blue-400">💡 Ví dụ minh họa thực tế:</p>
                    <p className="font-serif font-bold text-[var(--color-text-primary)] text-sm tracking-wide font-chinese">
                      {currentQ.exampleSentence.chinese}
                    </p>
                    <p className="text-[11px] text-[var(--color-text-secondary)] font-mono">
                      {currentQ.exampleSentence.pinyin}
                    </p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 italic">
                      "{currentQ.exampleSentence.vietnamese}"
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => playChineseAudio(currentQ.exampleSentence!.chinese)}
                    className="p-2.5 rounded-xl bg-[var(--color-background)] hover:bg-[var(--color-primary-light)] text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors shrink-0 cursor-pointer border border-[var(--color-border)]"
                    title="Nghe câu ví dụ"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Next Button */}
          {isAnswered && (
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleNextQuestion}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
              >
                <span>{currentQuestionIndex + 1 === activeQuestionPool.length ? 'Xem kết quả tổng kết' : 'Câu tiếp theo'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
