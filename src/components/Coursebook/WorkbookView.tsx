import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Volume2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  Trophy,
  Award,
  ArrowRight,
  ChevronRight,
  RotateCcw,
  PenTool,
  Clock,
  Play,
  Pause,
  Layers,
  GraduationCap,
  Flame,
  Check,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCheck,
  FileText,
  Compass,
  Headphones,
  Wand2,
  Sliders,
  PlusCircle,
  RefreshCw,
  Loader2,
  FileUp,
  BookmarkPlus,
  Send,
  Target,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  HSK1_WORKBOOK_LESSONS,
  HSK1_OFFICIAL_MOCK_EXAM,
  WorkbookLesson,
  MockExamQuestion,
} from '../../data/hsk1WorkbookData';
import {
  HSK2_WORKBOOK_LESSONS,
  HSK2_OFFICIAL_MOCK_EXAM,
  HSK2WorkbookLesson,
} from '../../data/hsk2WorkbookData';
import {
  HSK3_WORKBOOK_LESSONS,
  HSK3_OFFICIAL_MOCK_EXAM,
  HSK3WorkbookLesson,
} from '../../data/hsk3WorkbookData';
import {
  HSK4_WORKBOOK_LESSONS,
  HSK4_OFFICIAL_MOCK_EXAM,
  HSK4WorkbookLesson,
} from '../../data/hsk4WorkbookData';
import {
  HSK5_WORKBOOK_LESSONS,
  HSK5_OFFICIAL_MOCK_EXAM,
} from '../../data/hsk5WorkbookData';
import {
  HSK6_WORKBOOK_LESSONS,
  HSK6_OFFICIAL_MOCK_EXAM,
} from '../../data/hsk6WorkbookData';
import {
  getEnrichedWorkbookLessons,
  getEnrichedWorkbookLesson,
  EnrichedWorkbookLesson,
} from '../../data/workbookEnricher';
import { DetailedTextbookLesson } from '../../data/newHsk1BookData';
import { playChineseAudio, resolveChineseTtsPayload } from '../../utils/chineseAudio';

export {
  getEnrichedWorkbookLessons,
  getEnrichedWorkbookLesson,
};
export type { EnrichedWorkbookLesson };

interface WorkbookViewProps {
  hskLevel?: number;
  currentLessonNumber?: number;
  currentLesson?: DetailedTextbookLesson;
  onUpdateUserXp?: (xp: number) => void;
  onOpenStrokeStudio?: (hanzi: string) => void;
}

export const WorkbookView: React.FC<WorkbookViewProps> = ({
  hskLevel = 1,
  currentLessonNumber = 1,
  currentLesson,
  onUpdateUserXp,
  onOpenStrokeStudio,
}) => {
  // HSK Level state (defaults to prop, user can also toggle inside workbook)
  const [selectedHskLevel, setSelectedHskLevel] = useState<number>(hskLevel || 1);

  // Modes: 'lesson_workbook' | 'ai_generated_exam' (Official mock removed from mode switcher)
  const [viewMode, setViewMode] = useState<'lesson_workbook' | 'ai_generated_exam'>('lesson_workbook');
  const [selectedLessonNum, setSelectedLessonNum] = useState<number>(currentLessonNumber || 1);

  // Sub-tabs: 'mock_drill' | 'listen_read' | 'word_expansion' | 'writing' | 'xiaoyu' (Default: 'mock_drill')
  const [subTab, setSubTab] = useState<'mock_drill' | 'listen_read' | 'word_expansion' | 'writing' | 'xiaoyu'>('mock_drill');

  // Interactive Exercise States
  const [userAnswers, setUserAnswers] = useState<{ [key: string]: string }>({});
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<{ [key: string]: boolean }>({});
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  // Official Mock Exam States
  const [mockExamAnswers, setMockExamAnswers] = useState<{ [key: string]: string }>({});
  const [isMockExamFinished, setIsMockExamFinished] = useState<boolean>(false);
  const [examTimeLeft, setExamTimeLeft] = useState<number>(40 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // AI Mock Exam Generator States
  const [aiSelectedLessons, setAiSelectedLessons] = useState<number[]>([1, 2, 3]);
  const [aiQuestionCount, setAiQuestionCount] = useState<number>(10);
  const [aiExamFocus, setAiExamFocus] = useState<'balanced' | 'listening_focus' | 'reading_focus' | 'real_life' | 'challenge'>('balanced');
  const [aiCustomTopic, setAiCustomTopic] = useState<string>('');
  const [aiExternalMaterial, setAiExternalMaterial] = useState<string>('');
  const [isGeneratingAiExam, setIsGeneratingAiExam] = useState<boolean>(false);
  const [generatedAiExam, setGeneratedAiExam] = useState<{
    examId: string;
    title: string;
    hskLevel: number;
    selectedLessons: number[];
    totalQuestions: number;
    timeLimitMinutes: number;
    questions: MockExamQuestion[];
  } | null>(null);
  const [aiExamAnswers, setAiExamAnswers] = useState<{ [key: string]: string }>({});
  const [isAiExamFinished, setIsAiExamFinished] = useState<boolean>(false);
  const [aiExamTimeLeft, setAiExamTimeLeft] = useState<number>(20 * 60);
  const [isAiTimerRunning, setIsAiTimerRunning] = useState<boolean>(false);
  const [aiExamError, setAiExamError] = useState<string | null>(null);

  // Sync prop changes
  useEffect(() => {
    if (hskLevel) {
      setSelectedHskLevel(hskLevel);
    }
  }, [hskLevel]);

  useEffect(() => {
    if (currentLessonNumber) {
      setSelectedLessonNum(currentLessonNumber);
    }
  }, [currentLessonNumber]);

  // Reset question answers & interactive exercise state when lesson or level changes
  useEffect(() => {
    setUserAnswers({});
    setIsAnswerSubmitted({});
    setPlayingAudioId(null);
    setSubTab('mock_drill');
  }, [selectedHskLevel, selectedLessonNum]);

  // Reset generated AI exam if HSK level changes
  useEffect(() => {
    if (generatedAiExam && generatedAiExam.hskLevel !== selectedHskLevel) {
      setGeneratedAiExam(null);
      setAiExamAnswers({});
      setIsAiTimerRunning(false);
    }
  }, [selectedHskLevel, generatedAiExam]);

  // If viewMode accidentally is 'official_mock_exam', auto-redirect to 'lesson_workbook'
  useEffect(() => {
    if (viewMode === ('official_mock_exam' as any)) {
      setViewMode('lesson_workbook');
    }
  }, [viewMode]);

  // Dynamically resolve enriched lessons according to chosen HSK Level
  const activeLessons = useMemo(() => {
    return getEnrichedWorkbookLessons(selectedHskLevel);
  }, [selectedHskLevel]);

  // Ensure selectedLessonNum is always valid within activeLessons upon level switches
  useEffect(() => {
    if (activeLessons.length > 0 && !activeLessons.some((l) => l.lessonNumber === selectedLessonNum)) {
      setSelectedLessonNum(activeLessons[0].lessonNumber);
    }
  }, [activeLessons, selectedLessonNum]);

  const activeMockExam: MockExamQuestion[] = useMemo(() => {
    if (selectedHskLevel === 2) return HSK2_OFFICIAL_MOCK_EXAM;
    if (selectedHskLevel === 3) return HSK3_OFFICIAL_MOCK_EXAM;
    if (selectedHskLevel === 4) return HSK4_OFFICIAL_MOCK_EXAM;
    if (selectedHskLevel === 5) return HSK5_OFFICIAL_MOCK_EXAM;
    if (selectedHskLevel === 6) return HSK6_OFFICIAL_MOCK_EXAM;
    return HSK1_OFFICIAL_MOCK_EXAM;
  }, [selectedHskLevel]);

  const currentWorkbookLesson: any = useMemo(() => {
    if (currentLesson && currentLesson.lessonNumber === selectedLessonNum) {
      return getEnrichedWorkbookLesson(selectedHskLevel, selectedLessonNum, currentLesson);
    }
    const found = activeLessons.find((l) => l.lessonNumber === selectedLessonNum);
    if (found) return found;
    return activeLessons[0] || getEnrichedWorkbookLesson(selectedHskLevel, 1);
  }, [activeLessons, selectedLessonNum, selectedHskLevel, currentLesson]);

  // Normalized exercise pools so no subtab is empty
  const activeListeningExercises = useMemo(() => {
    return currentWorkbookLesson?.listeningExercises || currentWorkbookLesson?.hskMockListening || [];
  }, [currentWorkbookLesson]);

  const activeReadingExercises = useMemo(() => {
    return currentWorkbookLesson?.readingExercises || currentWorkbookLesson?.hskMockReading || [];
  }, [currentWorkbookLesson]);

  // Available subtabs calculation for current lesson (Interactive Mock Drills at position 1)
  const availableSubTabs = useMemo(() => {
    const rawTabs: { id: 'mock_drill' | 'listen_read' | 'word_expansion' | 'writing' | 'xiaoyu'; rawLabel: string; icon: any; badge: string }[] = [];
    
    // 1. Mock drills first (Interactive practice)
    if (activeListeningExercises.length > 0 || activeReadingExercises.length > 0) {
      rawTabs.push({ id: 'mock_drill', rawLabel: 'Mô Phỏng Đề HSK (模拟训练)', icon: Trophy, badge: `${activeListeningExercises.length + activeReadingExercises.length} bài tập` });
    }
    // 2. Listen & read drills
    if (currentWorkbookLesson?.listenAndReadDrills && currentWorkbookLesson.listenAndReadDrills.length > 0) {
      rawTabs.push({ id: 'listen_read', rawLabel: 'Nghe Đọc Luyện (听读练)', icon: Headphones, badge: `${currentWorkbookLesson.listenAndReadDrills.length} nhóm luyện` });
    }
    // 3. Word expansion
    if (currentWorkbookLesson?.wordExpansion) {
      rawTabs.push({ id: 'word_expansion', rawLabel: 'Mở Rộng Từ Ngữ (字词拓展)', icon: Sparkles, badge: 'Cấu tạo từ mới' });
    }
    // 4. Writing exercises
    if (currentWorkbookLesson?.writingExercises && currentWorkbookLesson.writingExercises.length > 0) {
      rawTabs.push({ id: 'writing', rawLabel: 'Phần Viết (书写)', icon: PenTool, badge: `${currentWorkbookLesson.writingExercises.length} câu viết` });
    }
    // 5. Xiaoyu lecture
    if (currentWorkbookLesson?.phonetics?.length > 0 || currentWorkbookLesson?.hanziSection) {
      rawTabs.push({ id: 'xiaoyu', rawLabel: 'Lớp Học Tiểu Ngữ (小语讲堂)', icon: GraduationCap, badge: 'Ngữ âm & Bộ thủ' });
    }

    // Default fallback tab if none matched
    if (rawTabs.length === 0) {
      rawTabs.push({ id: 'mock_drill', rawLabel: 'Sách Bài Tập', icon: BookOpen, badge: 'Bài tập' });
    }

    // Map to continuous sequential numbering (1., 2., 3., etc.)
    return rawTabs.map((tab, idx) => ({
      ...tab,
      label: `${idx + 1}. ${tab.rawLabel}`,
    }));
  }, [currentWorkbookLesson, activeListeningExercises, activeReadingExercises]);

  // Ensure active subtab is in available tabs
  useEffect(() => {
    if (availableSubTabs.length > 0 && !availableSubTabs.some((t) => t.id === subTab)) {
      setSubTab(availableSubTabs[0].id);
    }
  }, [availableSubTabs, subTab]);

  // Exam Countdown Timer (Official Mock)
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && examTimeLeft > 0 && !isMockExamFinished) {
      interval = setInterval(() => {
        setExamTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (examTimeLeft === 0 && isTimerRunning) {
      handleSubmitMockExam();
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, examTimeLeft, isMockExamFinished]);

  // AI Exam Countdown Timer
  useEffect(() => {
    let interval: any = null;
    if (isAiTimerRunning && aiExamTimeLeft > 0 && !isAiExamFinished) {
      interval = setInterval(() => {
        setAiExamTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (aiExamTimeLeft === 0 && isAiTimerRunning) {
      handleSubmitAiExam();
    }
    return () => clearInterval(interval);
  }, [isAiTimerRunning, aiExamTimeLeft, isAiExamFinished]);

  const handlePlayAudio = (text: string, id?: string) => {
    if (!text || !text.trim()) return;
    const resolved = resolveChineseTtsPayload(text);
    const speakableText = resolved || (/[\u4e00-\u9fa50-9]/.test(text) ? text : '');
    if (!speakableText) return;
    if (id) setPlayingAudioId(id);
    playChineseAudio(speakableText);
    if (id) {
      setTimeout(() => setPlayingAudioId(null), 2500);
    }
  };

  const handleSelectAnswer = (questionId: string, selectedKey: string) => {
    setUserAnswers((prev) => ({ ...prev, [questionId]: selectedKey }));
  };

  const handleSubmitQuestion = (questionId: string, correctKey: string) => {
    setIsAnswerSubmitted((prev) => ({ ...prev, [questionId]: true }));
    const isCorrect = userAnswers[questionId]?.trim() === correctKey?.trim();
    if (isCorrect) {
      try {
        confetti({ particleCount: 25, spread: 60, origin: { y: 0.8 } });
      } catch {}
      if (onUpdateUserXp) onUpdateUserXp(15);
    }
  };

  // Official Mock Exam Handlers
  const handleStartMockExam = () => {
    setMockExamAnswers({});
    setIsMockExamFinished(false);
    const defaultMins = selectedHskLevel === 1 ? 40 : selectedHskLevel === 2 ? 55 : selectedHskLevel === 3 ? 90 : 105;
    setExamTimeLeft(defaultMins * 60);
    setIsTimerRunning(true);
  };

  const handleSubmitMockExam = () => {
    setIsTimerRunning(false);
    setIsMockExamFinished(true);

    let correctCount = 0;
    activeMockExam.forEach((q) => {
      const targetAns = q.correctKey || (q as any).correctAnswer;
      if (mockExamAnswers[q.id] === targetAns) {
        correctCount += 1;
      }
    });

    const maxPoints = selectedHskLevel === 1 ? 200 : 300;
    const passThreshold = selectedHskLevel === 1 ? 120 : 180;
    const finalScore = Math.round((correctCount / (activeMockExam.length || 1)) * maxPoints);
    if (finalScore >= passThreshold) {
      try {
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
      } catch {}
    }
    if (onUpdateUserXp) onUpdateUserXp(correctCount * 10);
  };

  // AI Exam Generator Handler
  const handleGenerateAiExam = async () => {
    if (aiSelectedLessons.length === 0) {
      setAiExamError('Vui lòng chọn ít nhất 1 bài học để AI tổng hợp kiến thức.');
      return;
    }

    setIsGeneratingAiExam(true);
    setAiExamError(null);

    try {
      const res = await fetch('/api/ai/generate-hsk-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hskLevel: selectedHskLevel,
          selectedLessons: aiSelectedLessons,
          questionCount: aiQuestionCount,
          externalMaterial: aiExternalMaterial.trim(),
          examFocus: aiExamFocus,
          customTopic: aiCustomTopic.trim(),
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
      if (data && Array.isArray(data.questions) && data.questions.length > 0) {
        setGeneratedAiExam(data);
        setAiExamAnswers({});
        setIsAiExamFinished(false);
        setAiExamTimeLeft((data.timeLimitMinutes || 20) * 60);
        setIsAiTimerRunning(true);
      } else {
        setAiExamError('Không thể tạo đề thi lúc này. Vui lòng thử lại.');
      }
    } catch (err: any) {
      setAiExamError('Lỗi kết nối máy chủ AI: ' + (err?.message || 'Không xác định'));
    } finally {
      setIsGeneratingAiExam(false);
    }
  };

  const handleSubmitAiExam = () => {
    if (!generatedAiExam) return;
    setIsAiTimerRunning(false);
    setIsAiExamFinished(true);

    let correctCount = 0;
    generatedAiExam.questions.forEach((q) => {
      const targetAns = q.correctKey || (q as any).correctAnswer;
      if (aiExamAnswers[q.id] === targetAns) {
        correctCount += 1;
      }
    });

    const maxPoints = selectedHskLevel === 1 ? 200 : 300;
    const passThreshold = selectedHskLevel === 1 ? 120 : 180;
    const finalScore = Math.round((correctCount / (generatedAiExam.questions.length || 1)) * maxPoints);
    if (finalScore >= passThreshold) {
      try {
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
      } catch {}
    }
    if (onUpdateUserXp) onUpdateUserXp(correctCount * 12);
  };

  const toggleAiLessonSelection = (lessonNum: number) => {
    setAiSelectedLessons((prev) => {
      if (prev.includes(lessonNum)) {
        return prev.filter((n) => n !== lessonNum);
      } else {
        return [...prev, lessonNum].sort((a, b) => a - b);
      }
    });
  };

  const selectAllLessons = () => {
    setAiSelectedLessons(activeLessons.map((l) => l.lessonNumber));
  };

  const selectLessonsRange = (start: number, end: number) => {
    const range: number[] = [];
    for (let i = start; i <= end; i++) {
      if (activeLessons.some((l) => l.lessonNumber === i)) range.push(i);
    }
    setAiSelectedLessons(range);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const mockCorrectCount = activeMockExam.filter((q) => {
    const targetAns = q.correctKey || (q as any).correctAnswer;
    return mockExamAnswers[q.id] === targetAns;
  }).length;

  const maxExamPoints = selectedHskLevel === 1 ? 200 : 300;
  const passScore = selectedHskLevel === 1 ? 120 : 180;
  const totalExamScore = Math.round((mockCorrectCount / (activeMockExam.length || 1)) * maxExamPoints);
  const isPassed = totalExamScore >= passScore;

  // AI Exam Scores
  const aiCorrectCount = generatedAiExam
    ? generatedAiExam.questions.filter((q) => {
        const targetAns = q.correctKey || (q as any).correctAnswer;
        return aiExamAnswers[q.id] === targetAns;
      }).length
    : 0;
  const totalAiExamScore = generatedAiExam
    ? Math.round((aiCorrectCount / (generatedAiExam.questions.length || 1)) * maxExamPoints)
    : 0;
  const isAiPassed = totalAiExamScore >= passScore;

  return (
    <div className="space-y-6 animate-fade-in" id="workbook-root-container">
      {/* Compact Navigation Bar: Mode Switcher & Lesson Exercise Subtabs */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-3 sm:p-4 shadow-xs space-y-3 silk-card">
        {/* Top: Mode Switcher & Lesson Indicator */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {/* Mode Switcher - Exactly 2 modes */}
            <div className="flex items-center gap-1.5 p-1 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)]">
              <button
                type="button"
                onClick={() => setViewMode('lesson_workbook')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'lesson_workbook'
                    ? 'bg-teal-600 text-white shadow-xs font-black'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Sách Bài Tập</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('ai_generated_exam')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'ai_generated_exam'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs font-black'
                    : 'text-purple-600 dark:text-purple-400 hover:text-purple-700 font-semibold'
                }`}
              >
                <Wand2 className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>✨ AI Chế Đề Thi Tùy Chọn & Tài Liệu Ngoài</span>
              </button>
            </div>
          </div>

          {/* Quick Lesson Indicator */}
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--color-text-secondary)]">
            <span className="font-bold text-[var(--color-primary)]">New HSK {selectedHskLevel}</span>
            <span>•</span>
            <span className="font-semibold text-[var(--color-text-primary)]">Bài {currentWorkbookLesson.lessonNumber}</span>
            {currentWorkbookLesson.pageNumber && (
              <>
                <span>•</span>
                <span className="font-mono">Trang {currentWorkbookLesson.pageNumber}</span>
              </>
            )}
          </div>
        </div>

        {/* Lesson Exercise Subtabs (Active in lesson_workbook mode) */}
        {viewMode === 'lesson_workbook' && (
          <div className="flex items-center gap-2 overflow-x-auto pt-2.5 border-t border-[var(--color-border)] custom-scrollbar">
            {availableSubTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = subTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSubTab(tab.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'bg-[var(--color-bg-secondary)] hover:bg-[var(--color-border)]/50 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-teal-600'}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-white/20 text-white' : 'bg-teal-500/10 text-teal-600'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODE 1: LESSON WORKBOOK (THEO TỪNG BÀI) */}
      {/* ========================================================= */}
      {viewMode === 'lesson_workbook' && (
        <div className="space-y-6">

          {/* SUBTAB 1: LỚP HỌC TIỂU NGỮ (小语讲堂) */}
          {subTab === 'xiaoyu' && (
            <div className="space-y-6">
              {/* Phonetics Section */}
              {currentWorkbookLesson.phonetics && currentWorkbookLesson.phonetics.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                    <Headphones className="w-5 h-5 text-teal-600" />
                    <span>Kiến Thức Ngữ Âm Trọng Điểm (语音)</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentWorkbookLesson.phonetics.map((p: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2 border-b border-[var(--color-border)] pb-2">
                          <h4 className="font-bold text-sm text-[var(--color-text-primary)] font-chinese">
                            {p.title}
                          </h4>
                          <span className="text-[11px] font-medium text-teal-600">{p.vietnameseTitle}</span>
                        </div>

                        {p.rules && p.rules.length > 0 && (
                          <ul className="space-y-1.5 text-xs text-[var(--color-text-secondary)] list-disc list-inside">
                            {p.rules.map((rule: string, rIdx: number) => (
                              <li key={rIdx} className="leading-relaxed">
                                {rule}
                              </li>
                            ))}
                          </ul>
                        )}

                        {/* Phonetics Audio Drill List */}
                        {p.audioDrillList && p.audioDrillList.length > 0 && (
                          <div className="pt-2 border-t border-[var(--color-border)] space-y-2">
                            <div className="text-[11px] font-bold text-teal-600 flex items-center gap-1">
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>Luyện phát âm âm tiết & từ mẫu (Bấm để nghe):</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {p.audioDrillList.map((item: any, aIdx: number) => {
                                const isPlaying = playingAudioId === `p-${idx}-${aIdx}`;
                                return (
                                  <button
                                    key={aIdx}
                                    type="button"
                                    onClick={() => handlePlayAudio(item.hanzi || item.audioText || item.audioScript || item.pinyin, `p-${idx}-${aIdx}`)}
                                    className={`p-2 rounded-xl text-left border transition-all flex items-center justify-between gap-1.5 cursor-pointer ${
                                      isPlaying
                                        ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                                        : 'bg-[var(--color-bg-secondary)] hover:bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-primary)]'
                                    }`}
                                  >
                                    <div className="min-w-0">
                                      {item.hanzi && (
                                        <div className="text-sm font-bold font-chinese truncate">{item.hanzi}</div>
                                      )}
                                      <div className="text-xs font-mono text-teal-600">{item.pinyin}</div>
                                      {item.label && (
                                        <div className="text-[10px] text-[var(--color-text-secondary)] truncate">
                                          {item.label}
                                        </div>
                                      )}
                                    </div>
                                    <Volume2 className={`w-3.5 h-3.5 shrink-0 ${isPlaying ? 'animate-pulse text-white' : 'text-teal-600'}`} />
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hanzi Writing Section */}
              {currentWorkbookLesson.hanziSection && (
                <div className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs space-y-4">
                  <h3 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                    <PenTool className="w-5 h-5 text-teal-600" />
                    <span>{currentWorkbookLesson.hanziSection.title || 'Chữ Hán & Bộ Thủ (汉字与偏旁)'}</span>
                  </h3>

                  {currentWorkbookLesson.hanziSection.overview && (
                    <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                      {currentWorkbookLesson.hanziSection.overview}
                    </p>
                  )}

                  {/* Radicals */}
                  {currentWorkbookLesson.hanziSection.radicals && currentWorkbookLesson.hanziSection.radicals.length > 0 && (
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-teal-600">
                        Thiên bàng bộ thủ trọng tâm (偏旁):
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {currentWorkbookLesson.hanziSection.radicals.map((rad: any, rIdx: number) => (
                          <div
                            key={rIdx}
                            className="p-3.5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] flex items-start gap-3"
                          >
                            <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center text-2xl font-black font-chinese shrink-0 shadow-xs">
                              {rad.radical}
                            </div>
                            <div className="space-y-1 min-w-0">
                              <div className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5 flex-wrap">
                                <span>{rad.nameVietnamese}</span>
                                <span className="text-[11px] font-mono text-teal-600">({rad.pinyin})</span>
                              </div>
                              <div className="text-xs text-[var(--color-text-secondary)]">{rad.meaning}</div>
                              {rad.exampleChars && (
                                <div className="text-xs font-chinese text-teal-700 font-bold pt-1 flex items-center gap-1 flex-wrap">
                                  <span>Chữ mẫu:</span>
                                  {rad.exampleChars.map((ec: any, ecIdx: number) => (
                                    <span
                                      key={ecIdx}
                                      onClick={() => onOpenStrokeStudio && onOpenStrokeStudio(ec.char || ec)}
                                      className="px-1.5 py-0.5 rounded-md bg-white border border-teal-200 text-teal-900 cursor-pointer hover:bg-teal-50"
                                      title="Bấm để xem hướng dẫn viết nét"
                                    >
                                      {ec.char || ec} {ec.pinyin ? `(${ec.pinyin})` : ''}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stroke Rules */}
                  {currentWorkbookLesson.hanziSection.strokeOrderRules && currentWorkbookLesson.hanziSection.strokeOrderRules.length > 0 && (
                    <div className="space-y-2.5 pt-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-teal-600">
                        Quy tắc bút thuận (笔顺规则):
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {currentWorkbookLesson.hanziSection.strokeOrderRules.map((rule: any, sIdx: number) => (
                          <div
                            key={sIdx}
                            className="p-3.5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] space-y-1"
                          >
                            <div className="text-xs font-bold text-[var(--color-text-primary)] font-chinese">
                              {rule.ruleChinese} ({rule.ruleVietnamese})
                            </div>
                            <div className="text-xs text-teal-600 flex items-center justify-between gap-2">
                              <span>Chữ ví dụ: <strong className="text-base font-chinese">{rule.exampleChar}</strong> ({rule.pinyin})</span>
                              {rule.exampleChar && (
                                <button
                                  type="button"
                                  onClick={() => handlePlayAudio(rule.exampleChar, `rule_ex_${sIdx}`)}
                                  className="p-1 rounded-md bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-300 transition-colors shrink-0 cursor-pointer"
                                  title="Nghe phát âm chữ mẫu"
                                >
                                  <Volume2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            {rule.meaning && (
                              <div className="text-[11px] text-[var(--color-text-secondary)]">{rule.meaning}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* CTA to Interactive Exercises */}
              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSubTab('mock_drill')}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-sm shadow-md flex items-center gap-2 cursor-pointer transition-all transform hover:scale-[1.02]"
                >
                  <span>Làm bài tập thực hành của Bài {currentWorkbookLesson.lessonNumber} ngay →</span>
                </button>
              </div>
            </div>
          )}

          {/* SUBTAB 2: MỞ RỘNG TỪ NGỮ (字词拓展) */}
          {subTab === 'word_expansion' && currentWorkbookLesson.wordExpansion && (
            <div className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs space-y-6">
              <h3 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>Mở Rộng Từ Ngữ & Cấu Tạo Từ (字词拓展)</span>
              </h3>

              {/* Word Combinations / Compounds */}
              {((currentWorkbookLesson.wordExpansion.compounds && currentWorkbookLesson.wordExpansion.compounds.length > 0) ||
                (currentWorkbookLesson.wordExpansion.combinations && currentWorkbookLesson.wordExpansion.combinations.length > 0) ||
                (currentWorkbookLesson.wordExpansion.structures && currentWorkbookLesson.wordExpansion.structures.length > 0)) && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-teal-600">
                    Cấu tạo từ ghép & Mở rộng (词汇组合):
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(currentWorkbookLesson.wordExpansion.combinations || currentWorkbookLesson.wordExpansion.compounds || currentWorkbookLesson.wordExpansion.structures).map((st: any, sIdx: number) => {
                      const audioTarget = st.combinedWords
                        ? `${st.combinedHanzi || st.baseChar || st.word}，${st.combinedWords.join('，')}`
                        : st.combinedHanzi || st.baseChar || st.word;
                      return (
                        <div
                          key={sIdx}
                          className="p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-sm font-bold font-chinese text-[var(--color-text-primary)]">
                              {st.combinedHanzi || st.baseChar || st.word} {st.pinyin ? `(${st.pinyin})` : ''}
                              {st.combinedWords ? ` → ${st.combinedWords.join(', ')}` : st.part1 && st.part2 ? ` = ${st.part1} + ${st.part2}` : ''}
                            </div>
                            {audioTarget && (
                              <button
                                type="button"
                                onClick={() => handlePlayAudio(audioTarget, `exp_st_${sIdx}`)}
                                className="p-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-300 transition-colors shrink-0 cursor-pointer"
                                title="Nghe phát âm từ ngữ"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <div className="text-xs text-[var(--color-text-secondary)]">{st.meaning || st.explanation}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Discussion if any */}
              {currentWorkbookLesson.wordExpansion.discussion && (
                <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/20 space-y-1">
                  <div className="text-xs font-bold text-teal-700 dark:text-teal-300">
                    {currentWorkbookLesson.wordExpansion.discussion.question}
                  </div>
                  <div className="text-xs text-[var(--color-text-secondary)]">
                    {currentWorkbookLesson.wordExpansion.discussion.answer}
                  </div>
                </div>
              )}

              {/* Interactive Fill In Blanks / Exercises */}
              {((currentWorkbookLesson.wordExpansion.fillInBlanks && currentWorkbookLesson.wordExpansion.fillInBlanks.length > 0) ||
                (currentWorkbookLesson.wordExpansion.exercises && currentWorkbookLesson.wordExpansion.exercises.length > 0)) && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-teal-600">
                      Bài tập điền từ trọng điểm ({((currentWorkbookLesson.wordExpansion.fillInBlanks || currentWorkbookLesson.wordExpansion.exercises) as any[]).length} câu):
                    </h4>
                    {currentWorkbookLesson.wordExpansion.wordBank && currentWorkbookLesson.wordExpansion.wordBank.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-bold text-[var(--color-text-secondary)]">Ngân hàng từ:</span>
                        {currentWorkbookLesson.wordExpansion.wordBank.map((wb: string, wbIdx: number) => (
                          <span key={wbIdx} className="px-2 py-0.5 rounded-md bg-teal-500/15 text-teal-700 dark:text-teal-300 text-xs font-chinese font-bold">
                            {wb}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    {(currentWorkbookLesson.wordExpansion.fillInBlanks || currentWorkbookLesson.wordExpansion.exercises).map((fib: any, fIdx: number) => {
                      const isSubmitted = isAnswerSubmitted[fib.id];
                      const selectedAns = userAnswers[fib.id];
                      const isCorrect = selectedAns === fib.correctAnswer;

                      return (
                        <div
                          key={fib.id || fIdx}
                          className="p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-xs font-bold text-teal-600">Câu {fIdx + 1}:</span>
                              <div className="text-sm font-bold font-chinese text-[var(--color-text-primary)] mt-0.5">
                                {fib.sentenceWithBlank}
                              </div>
                              {fib.pinyinSentence && (
                                <div className="text-xs font-mono text-teal-600">{fib.pinyinSentence}</div>
                              )}
                              {fib.vietnameseTranslation && (
                                <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                                  {fib.vietnameseTranslation}
                                </div>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const fullSentence = fib.sentenceWithBlank
                                  ? fib.sentenceWithBlank.replace(/[（(][^()（）]*[)）]/g, fib.correctAnswer || '')
                                  : fib.correctAnswer || '';
                                handlePlayAudio(fullSentence, `fib_${fib.id || fIdx}`);
                              }}
                              className="p-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-300 transition-colors shrink-0 cursor-pointer"
                              title="Nghe câu hoàn chỉnh"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Options */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {fib.options?.map((opt: string) => {
                              const isSelected = selectedAns === opt;
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  disabled={isSubmitted}
                                  onClick={() => handleSelectAnswer(fib.id, opt)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-chinese border transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                                      : 'bg-[var(--color-surface)] hover:bg-[var(--color-bg-secondary)] border-[var(--color-border)] text-[var(--color-text-primary)]'
                                  }`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>

                          {/* Submit & Explanation */}
                          {!isSubmitted ? (
                            <button
                              type="button"
                              disabled={!selectedAns}
                              onClick={() => handleSubmitQuestion(fib.id, fib.correctAnswer)}
                              className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold cursor-pointer transition-all"
                            >
                              Kiểm tra
                            </button>
                          ) : (
                            <div className="p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-1">
                              <div className="text-xs font-bold">
                                {isCorrect ? (
                                  <span className="text-emerald-600 flex items-center gap-1">
                                    <CheckCircle2 className="w-4 h-4" /> Chính xác! (+15 XP)
                                  </span>
                                ) : (
                                  <span className="text-rose-600 flex items-center gap-1">
                                    <XCircle className="w-4 h-4" /> Chưa đúng. Đáp án: {fib.correctAnswer}
                                  </span>
                                )}
                              </div>
                              {fib.explanation && (
                                <p className="text-xs text-[var(--color-text-secondary)]">
                                  <strong>Giải thích:</strong> {fib.explanation}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SUBTAB 3: NGHE ĐỌC LUYỆN (听读练) */}
          {subTab === 'listen_read' && (
            <div className="space-y-4">
              {currentWorkbookLesson.listenAndReadDrills && currentWorkbookLesson.listenAndReadDrills.length > 0 ? (
                currentWorkbookLesson.listenAndReadDrills.map((drill: any, dIdx: number) => (
                  <div
                    key={dIdx}
                    className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs space-y-4"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-[var(--color-border)] pb-2">
                      <h4 className="font-bold text-sm text-[var(--color-text-primary)] flex items-center gap-2">
                        <Headphones className="w-4 h-4 text-teal-600" />
                        <span>{drill.title}</span>
                      </h4>
                      <span className="text-xs text-[var(--color-text-secondary)]">{drill.instruction}</span>
                    </div>

                    <div className="space-y-3">
                      {drill.items?.map((item: any, iIdx: number) => {
                        const isSubmitted = isAnswerSubmitted[item.id];
                        const selectedAns = userAnswers[item.id];
                        const isCorrect = selectedAns === item.correctAnswer;

                        return (
                          <div
                            key={item.id || iIdx}
                            className="p-3.5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] space-y-2.5"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-teal-600">Câu {iIdx + 1}:</span>
                                {item.vietnamesePrompt && (
                                  <span className="text-xs text-[var(--color-text-secondary)]">
                                    {item.vietnamesePrompt}
                                  </span>
                                )}
                              </div>

                              {(() => {
                                const audioTarget = item.audioText || item.correctAnswer || item.pinyinPrompt || (item as any).hanzi;
                                if (!audioTarget) return null;
                                return (
                                  <button
                                    type="button"
                                    onClick={() => handlePlayAudio(audioTarget, item.id)}
                                    className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                                  >
                                    <Volume2 className="w-3.5 h-3.5" />
                                    <span>Phát âm</span>
                                  </button>
                                );
                              })()}
                            </div>

                            {/* Options */}
                            <div className="flex items-center gap-2 flex-wrap">
                              {item.options?.map((opt: string) => {
                                const isSelected = selectedAns === opt;
                                return (
                                  <button
                                    key={opt}
                                    type="button"
                                    disabled={isSubmitted}
                                    onClick={() => handleSelectAnswer(item.id, opt)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                      isSelected
                                        ? 'bg-teal-600 text-white border-teal-600'
                                        : 'bg-[var(--color-surface)] hover:bg-[var(--color-bg-secondary)] border-[var(--color-border)] text-[var(--color-text-primary)]'
                                    }`}
                                  >
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Submit Button & Feedback */}
                            {!isSubmitted ? (
                              <button
                                type="button"
                                disabled={!selectedAns}
                                onClick={() => handleSubmitQuestion(item.id, item.correctAnswer)}
                                className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold cursor-pointer transition-all"
                              >
                                Kiểm tra
                              </button>
                            ) : (
                              <div className="flex items-center gap-2 text-xs font-bold pt-1">
                                {isCorrect ? (
                                  <span className="text-emerald-600 flex items-center gap-1">
                                    <CheckCircle2 className="w-4 h-4" /> Chính xác! (+15 XP)
                                  </span>
                                ) : (
                                  <span className="text-rose-600 flex items-center gap-1">
                                    <XCircle className="w-4 h-4" /> Chưa đúng. Đáp án: {item.correctAnswer}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] text-center text-xs text-[var(--color-text-secondary)]">
                  Chưa có bài luyện âm riêng cho bài học này.
                </div>
              )}
            </div>
          )}

          {/* SUBTAB 4: MÔ PHỎNG ĐỀ HSK (模拟训练) */}
          {subTab === 'mock_drill' && (
            <div className="space-y-6">
              {/* Listening Mock Drills */}
              {activeListeningExercises.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                    <Headphones className="w-5 h-5 text-teal-600" />
                    <span>Luyện Tập Nghe Hiểu Mô Phỏng HSK (听力训练 - {activeListeningExercises.length} câu)</span>
                  </h3>

                  <div className="space-y-4">
                    {activeListeningExercises.map((q: any, qIdx: number) => {
                      const isSubmitted = isAnswerSubmitted[q.id];
                      const selectedKey = userAnswers[q.id];
                      const isCorrect = selectedKey === q.correctKey;

                      return (
                        <div
                          key={q.id || qIdx}
                          className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs space-y-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <span className="text-xs font-bold text-teal-600">
                                Câu {q.questionNumber || qIdx + 1} (Phần {q.part}):
                              </span>
                              <div className="text-sm font-medium text-[var(--color-text-primary)] mt-0.5">
                                {q.promptText || q.promptChinese}
                              </div>
                            </div>

                            {(() => {
                              const audioTarget = q.audioScript || (q as any).audioText || (q as any).promptChinese;
                              if (!audioTarget) return null;
                              return (
                                <button
                                  type="button"
                                  onClick={() => handlePlayAudio(audioTarget, q.id)}
                                  className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
                                >
                                  <Volume2 className="w-3.5 h-3.5" />
                                  <span>Nghe Audio</span>
                                </button>
                              );
                            })()}
                          </div>

                          {/* Options */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            {q.options?.map((opt: any) => {
                              const isOptSelected = selectedKey === opt.key;
                              return (
                                <button
                                  key={opt.key}
                                  type="button"
                                  disabled={isSubmitted}
                                  onClick={() => handleSelectAnswer(q.id, opt.key)}
                                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                                    isOptSelected
                                      ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                                      : 'bg-[var(--color-bg-secondary)] hover:bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-primary)]'
                                  }`}
                                >
                                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${isOptSelected ? 'bg-white/20 text-white' : 'bg-[var(--color-surface)] text-teal-600'}`}>
                                    {opt.key}
                                  </span>
                                  <div>
                                    {opt.imageEmoji && <div className="text-xl mb-0.5">{opt.imageEmoji}</div>}
                                    {opt.textChinese && (
                                      <div className="font-bold font-chinese text-sm">{opt.textChinese}</div>
                                    )}
                                    {opt.textVietnamese && (
                                      <div className="text-[11px] opacity-80">{opt.textVietnamese}</div>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>

                          {/* Check Button & Explanation */}
                          {!isSubmitted ? (
                            <button
                              type="button"
                              disabled={!selectedKey}
                              onClick={() => handleSubmitQuestion(q.id, q.correctKey)}
                              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold cursor-pointer transition-all shadow-xs"
                            >
                              Kiểm tra đáp án
                            </button>
                          ) : (
                            <div className="p-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] space-y-1">
                              <div className="text-xs font-bold">
                                {isCorrect ? (
                                  <span className="text-emerald-600 flex items-center gap-1">
                                    <CheckCircle2 className="w-4 h-4" /> Chính xác! (+15 XP)
                                  </span>
                                ) : (
                                  <span className="text-rose-600 flex items-center gap-1">
                                    <XCircle className="w-4 h-4" /> Chưa đúng. Đáp án: {q.correctKey}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[var(--color-text-secondary)]">
                                <strong>Giải thích:</strong> {q.explanation}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Reading Mock Drills */}
              {activeReadingExercises.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                    <FileText className="w-5 h-5 text-teal-600" />
                    <span>Luyện Tập Đọc Hiểu Mô Phỏng HSK (阅读训练 - {activeReadingExercises.length} câu)</span>
                  </h3>

                  <div className="space-y-4">
                    {activeReadingExercises.map((q: any, qIdx: number) => {
                      const isSubmitted = isAnswerSubmitted[q.id];
                      const selectedKey = userAnswers[q.id];
                      const isCorrect = selectedKey === q.correctKey;

                      return (
                        <div
                          key={q.id || qIdx}
                          className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs space-y-3"
                        >
                          <div>
                            <span className="text-xs font-bold text-teal-600">
                              Câu {q.questionNumber || qIdx + 1} (Phần {q.part}):
                            </span>
                            {q.promptChinese && (
                              <div className="text-base font-bold font-chinese text-[var(--color-text-primary)] mt-1">
                                {q.promptChinese}
                              </div>
                            )}
                            {q.promptPinyin && (
                              <div className="text-xs font-mono text-teal-600">{q.promptPinyin}</div>
                            )}
                            {q.promptVietnamese && (
                              <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                                {q.promptVietnamese}
                              </div>
                            )}
                            {q.subPrompt && (
                              <div className="text-xs font-semibold text-teal-800 dark:text-teal-300 mt-1">
                                {q.subPrompt}
                              </div>
                            )}
                          </div>

                          {/* Options */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            {q.options?.map((opt: any) => {
                              const isOptSelected = selectedKey === opt.key;
                              return (
                                <button
                                  key={opt.key}
                                  type="button"
                                  disabled={isSubmitted}
                                  onClick={() => handleSelectAnswer(q.id, opt.key)}
                                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                                    isOptSelected
                                      ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                                      : 'bg-[var(--color-bg-secondary)] hover:bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-primary)]'
                                  }`}
                                >
                                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${isOptSelected ? 'bg-white/20 text-white' : 'bg-[var(--color-surface)] text-teal-600'}`}>
                                    {opt.key}
                                  </span>
                                  <div>
                                    {opt.imageEmoji && <div className="text-xl mb-0.5">{opt.imageEmoji}</div>}
                                    {opt.textChinese && (
                                      <div className="font-bold font-chinese text-sm">{opt.textChinese}</div>
                                    )}
                                    {opt.textVietnamese && (
                                      <div className="text-[11px] opacity-80">{opt.textVietnamese}</div>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>

                          {/* Check Button & Explanation */}
                          {!isSubmitted ? (
                            <button
                              type="button"
                              disabled={!selectedKey}
                              onClick={() => handleSubmitQuestion(q.id, q.correctKey)}
                              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold cursor-pointer transition-all shadow-xs"
                            >
                              Kiểm tra đáp án
                            </button>
                          ) : (
                            <div className="p-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] space-y-1">
                              <div className="text-xs font-bold">
                                {isCorrect ? (
                                  <span className="text-emerald-600 flex items-center gap-1">
                                    <CheckCircle2 className="w-4 h-4" /> Chính xác! (+15 XP)
                                  </span>
                                ) : (
                                  <span className="text-rose-600 flex items-center gap-1">
                                    <XCircle className="w-4 h-4" /> Chưa đúng. Đáp án: {q.correctKey}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[var(--color-text-secondary)]">
                                <strong>Giải thích:</strong> {q.explanation}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SUBTAB 5: PHẦN VIẾT (书写) */}
          {subTab === 'writing' && currentWorkbookLesson.writingExercises && (
            <div className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs space-y-4">
              <h3 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                <PenTool className="w-5 h-5 text-teal-600" />
                <span>Luyện Viết Chữ Hán & Bút Thuận (书写)</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentWorkbookLesson.writingExercises.map((w: any, wIdx: number) => {
                  const isSentenceExercise = Boolean(w.sentenceContext);
                  const isSubmitted = isAnswerSubmitted[w.id || `wr_${wIdx}`];

                  if (isSentenceExercise) {
                    return (
                      <div
                        key={w.id || wIdx}
                        className="p-5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] space-y-3 col-span-1 md:col-span-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-teal-600">
                            Bài {wIdx + 1}: {w.promptText || 'Sắp xếp các từ thành câu hoàn chỉnh (排列顺序):'}
                          </span>
                        </div>

                        <div className="p-3 rounded-lg bg-[var(--color-surface)] border border-teal-500/20 text-sm font-bold font-chinese text-teal-700 dark:text-teal-300">
                          {w.sentenceContext}
                        </div>

                        {!isSubmitted ? (
                          <button
                            type="button"
                            onClick={() => setIsAnswerSubmitted((prev) => ({ ...prev, [w.id || `wr_${wIdx}`]: true }))}
                            className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold cursor-pointer transition-all shadow-xs"
                          >
                            Xem câu hoàn chỉnh & Giải thích
                          </button>
                        ) : (
                          <div className="p-3.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-1.5">
                            <div className="text-xs font-bold text-emerald-600 flex items-center justify-between gap-1.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <CheckCircle2 className="w-4 h-4 shrink-0" />
                                <span>Đáp án đúng:</span>
                                <strong className="text-sm font-chinese text-[var(--color-text-primary)]">{w.correctAnswer}</strong>
                              </div>
                              {w.correctAnswer && (
                                <button
                                  type="button"
                                  onClick={() => handlePlayAudio(w.correctAnswer, `wr_ans_${wIdx}`)}
                                  className="p-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-300 transition-colors shrink-0 cursor-pointer"
                                  title="Nghe phát âm câu đúng"
                                >
                                  <Volume2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            {w.explanation && (
                              <p className="text-xs text-[var(--color-text-secondary)]">
                                <strong>Giải thích ngữ pháp:</strong> {w.explanation}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div
                      key={w.id || wIdx}
                      className="p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="text-xl font-black font-chinese text-[var(--color-text-primary)]">
                            {w.hanzi || w.word}
                          </div>
                          {(w.hanzi || w.word) && (
                            <button
                              type="button"
                              onClick={() => handlePlayAudio(w.hanzi || w.word, `wr_char_${wIdx}`)}
                              className="p-1 rounded-md bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-300 transition-colors shrink-0 cursor-pointer"
                              title="Nghe phát âm chữ Hán"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <div className="text-xs font-mono text-teal-600">{w.pinyin}</div>
                        <div className="text-xs text-[var(--color-text-secondary)]">{w.vietnamese || w.meaning}</div>
                      </div>

                      {onOpenStrokeStudio && (
                        <button
                          type="button"
                          onClick={() => onOpenStrokeStudio(w.hanzi || w.word)}
                          className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <PenTool className="w-3.5 h-3.5" />
                          <span>Luyện viết nét</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODE 2: AI EXAM GENERATOR (CHẾ ĐỀ HSK THÔNG MINH) */}
      {/* ========================================================= */}
      {viewMode === 'ai_generated_exam' && (
        <div className="space-y-6">
          {/* AI Config Panel */}
          <div className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border)] pb-4">
              <div className="space-y-1">
                <h2 className="text-base sm:text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-[var(--color-primary)]" />
                  <span>Xưởng AI Chế Đề Thi New HSK {selectedHskLevel}</span>
                </h2>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Tùy chọn kết hợp các bài học cụ thể, bổ sung ngữ cảnh thực tế để rèn phản xạ tự nhiên chuẩn New HSK.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={selectAllLessons}
                  className="px-3 py-1.5 rounded-lg bg-[var(--color-bg-secondary)] hover:bg-[var(--color-border)] text-[var(--color-text-primary)] border border-[var(--color-border)] text-xs font-semibold cursor-pointer transition-colors"
                >
                  Chọn tất cả bài (1 - {activeLessons.length})
                </button>
                <button
                  type="button"
                  onClick={() => selectLessonsRange(1, Math.min(5, activeLessons.length))}
                  className="px-3 py-1.5 rounded-lg bg-[var(--color-bg-secondary)] hover:bg-[var(--color-border)] text-[var(--color-text-primary)] border border-[var(--color-border)] text-xs font-semibold cursor-pointer transition-colors"
                >
                  Bài 1 - 5
                </button>
                <button
                  type="button"
                  onClick={() => selectLessonsRange(6, Math.min(10, activeLessons.length))}
                  className="px-3 py-1.5 rounded-lg bg-[var(--color-bg-secondary)] hover:bg-[var(--color-border)] text-[var(--color-text-primary)] border border-[var(--color-border)] text-xs font-semibold cursor-pointer transition-colors"
                >
                  Bài 6 - 10
                </button>
              </div>
            </div>

            {/* Lesson Matrix Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[var(--color-text-primary)]">
                <span>1. Chọn các bài học cần tổng hợp ({aiSelectedLessons.length} bài đã chọn):</span>
                <span className="text-[var(--color-primary)] font-semibold">New HSK {selectedHskLevel}</span>
              </div>
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-15 gap-2">
                {activeLessons.map((l) => {
                  const isChecked = aiSelectedLessons.includes(l.lessonNumber);
                  return (
                    <button
                      key={l.lessonNumber}
                      type="button"
                      onClick={() => toggleAiLessonSelection(l.lessonNumber)}
                      className={`p-2 rounded-xl text-center border transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-[var(--color-primary)] text-white font-bold border-[var(--color-primary)] shadow-xs scale-[1.02]'
                          : 'bg-[var(--color-bg-secondary)] hover:bg-[var(--color-border)]/60 text-[var(--color-text-primary)] border-[var(--color-border)]'
                      }`}
                    >
                      <div className="text-xs font-bold">B{l.lessonNumber}</div>
                      <div className={`text-[10px] truncate font-chinese ${isChecked ? 'text-white/90' : 'text-[var(--color-text-secondary)]'}`}>
                        {l.titleChinese?.slice(0, 3)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Exam Parameters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Question Count */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                  Số lượng câu hỏi:
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[5, 10, 15, 20].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setAiQuestionCount(cnt)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        aiQuestionCount === cnt
                          ? 'bg-[var(--color-primary)] text-white font-bold border-[var(--color-primary)] shadow-xs'
                          : 'bg-[var(--color-bg-secondary)] hover:bg-[var(--color-border)]/70 text-[var(--color-text-primary)] border-[var(--color-border)]'
                      }`}
                    >
                      {cnt} câu
                    </button>
                  ))}
                </div>
              </div>

              {/* Exam Focus Mode */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                  Định hướng đề thi:
                </label>
                <select
                  value={aiExamFocus}
                  onChange={(e) => setAiExamFocus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-xs font-semibold focus:outline-none focus:border-[var(--color-primary)]"
                >
                  <option value="balanced">Cân bằng Nghe & Đọc (Chuẩn HSK)</option>
                  <option value="listening_focus">Tập trung Nghe hiểu (听力)</option>
                  <option value="reading_focus">Tập trung Đọc hiểu (阅读)</option>
                  <option value="real_life">Giao tiếp đời sống thực tế</option>
                  <option value="challenge">Nâng cao phản xạ ngữ cảnh mới</option>
                </select>
              </div>

              {/* Custom Topic */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Chủ đề ưu tiên (Tùy chọn):
                </label>
                <input
                  type="text"
                  placeholder="Vd: Mua sắm, đi nhà hàng, sở thích..."
                  value={aiCustomTopic}
                  onChange={(e) => setAiCustomTopic(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-xs placeholder:text-[var(--color-text-secondary)]/60 focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>
            </div>

            {/* External Material Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
                  <FileUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Dán thêm tài liệu bên ngoài (Từ vựng mở rộng, hội thoại thực tế):</span>
                </label>
                <span className="text-[11px] text-[var(--color-text-secondary)]">Tùy chọn • Tránh học vẹt</span>
              </div>
              <textarea
                rows={3}
                placeholder="Dán thêm các từ vựng mới, câu thoại hoặc đoạn văn ngoài sách bạn muốn AI đưa vào làm ngữ cảnh đề thi (Ví dụ: 奶茶 nǎichá trà sữa, 外卖 wàimài đồ mang về, 扫码 sǎomǎ quét mã...)"
                value={aiExternalMaterial}
                onChange={(e) => setAiExternalMaterial(e.target.value)}
                className="w-full p-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-xs placeholder:text-[var(--color-text-secondary)]/60 focus:outline-none focus:border-[var(--color-primary)] font-mono leading-relaxed"
              />
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
              {aiExamError ? (
                <div className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1.5 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{aiExamError}</span>
                </div>
              ) : (
                <div className="text-xs text-[var(--color-text-secondary)]">
                  AI sẽ thiết kế đề thi gồm cả <strong>Phần Nghe (Audio TTS)</strong> và <strong>Phần Đọc (Có Pinyin & Giải thích)</strong>.
                </div>
              )}

              <button
                type="button"
                disabled={isGeneratingAiExam}
                onClick={handleGenerateAiExam}
                className="px-6 py-2.5 rounded-xl bg-[var(--color-primary)] hover:opacity-95 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95 disabled:opacity-50 shrink-0"
              >
                {isGeneratingAiExam ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>AI Đang Chế Đề Thi...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    <span>Chế Đề & Bắt Đầu Làm Bài</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* AI Generated Exam Test Arena */}
          {generatedAiExam && (
            <div className="space-y-6 pt-2">
              {/* Exam Info & Timer Header */}
              <div className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 text-[11px] font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Đề Thi AI Tạo Riêng Theo Yêu Cầu</span>
                  </div>
                  <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                    {generatedAiExam.title}
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Tổng số: <strong>{generatedAiExam.questions.length} câu hỏi</strong> • Cấp độ:{' '}
                    <strong>New HSK {generatedAiExam.hskLevel}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-600 animate-pulse" />
                    <span className="font-mono text-base font-black text-purple-600">
                      {formatTimer(aiExamTimeLeft)}
                    </span>
                  </div>

                  {isAiExamFinished && (
                    <button
                      type="button"
                      onClick={handleGenerateAiExam}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Chế đề mới</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Exam Results Scorecard */}
              {isAiExamFinished && (
                <div
                  className={`p-6 rounded-3xl border text-center space-y-3 shadow-lg ${
                    isAiPassed
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-100'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-100'
                  }`}
                >
                  <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-2xl shadow-md bg-white">
                    {isAiPassed ? '🎉' : '💪'}
                  </div>
                  <h3 className="text-xl font-black">
                    {isAiPassed ? 'Chúc mừng! Bạn đã ĐẠT đề thi AI' : 'Cần cố gắng thêm! Hãy luyện lại nhé'}
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
                    Điểm chuẩn: <strong>{passScore} / {maxExamPoints} điểm</strong> • Điểm của bạn:{' '}
                    <span className={`text-xl font-bold ${isAiPassed ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {totalAiExamScore} / {maxExamPoints} điểm
                    </span>{' '}
                    ({aiCorrectCount}/{generatedAiExam.questions.length} câu đúng)
                  </p>
                </div>
              )}

              {/* Questions List */}
              <div className="space-y-4">
                {generatedAiExam.questions.map((q, idx) => {
                  const targetAns = q.correctKey || (q as any).correctAnswer;
                  const selected = aiExamAnswers[q.id];
                  const isCorrect = selected === targetAns;

                  return (
                    <div
                      key={q.id || idx}
                      className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-purple-600">
                              Câu {idx + 1} ({q.section === 'listening' ? 'Phần Nghe' : 'Phần Đọc'} - Phần {q.part}):
                            </span>
                            {q.imageEmoji && <span className="text-base">{q.imageEmoji}</span>}
                          </div>
                          {q.promptChinese && (
                            <div className="text-base font-bold font-chinese text-[var(--color-text-primary)] mt-1">
                              {q.promptChinese}
                            </div>
                          )}
                          {q.promptPinyin && (
                            <div className="text-xs font-mono text-purple-600">{q.promptPinyin}</div>
                          )}
                          {q.promptVietnamese && (
                            <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                              {q.promptVietnamese}
                            </div>
                          )}
                          {q.subPrompt && (
                            <div className="text-xs font-semibold text-purple-800 dark:text-purple-300 mt-1">
                              {q.subPrompt}
                            </div>
                          )}
                        </div>

                        {(() => {
                          const audioTarget = q.audioScript || (q as any).audioText || ((q as any).type === 'listening' ? q.promptChinese : undefined);
                          if (!audioTarget) return null;
                          return (
                            <button
                              type="button"
                              onClick={() => handlePlayAudio(audioTarget, q.id)}
                              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>Nghe Audio</span>
                            </button>
                          );
                        })()}
                      </div>

                      {/* Options */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {q.options?.map((opt: any) => {
                          const isOptSelected = selected === opt.key;
                          return (
                            <button
                              key={opt.key}
                              type="button"
                              disabled={isAiExamFinished}
                              onClick={() => setAiExamAnswers((prev) => ({ ...prev, [q.id]: opt.key }))}
                              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                                isOptSelected
                                  ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                                  : 'bg-[var(--color-bg-secondary)] hover:bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-primary)]'
                              }`}
                            >
                              <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${isOptSelected ? 'bg-white/20 text-white' : 'bg-[var(--color-surface)] text-purple-600'}`}>
                                {opt.key}
                              </span>
                              <div>
                                {opt.imageEmoji && <div className="text-xl mb-0.5">{opt.imageEmoji}</div>}
                                {opt.textChinese && (
                                  <div className="font-bold font-chinese text-sm">{opt.textChinese}</div>
                                )}
                                {opt.textPinyin && (
                                  <div className="text-[10px] font-mono opacity-80">{opt.textPinyin}</div>
                                )}
                                {opt.textVietnamese && (
                                  <div className="text-[11px] opacity-80">{opt.textVietnamese}</div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Explanation after finish */}
                      {isAiExamFinished && (
                        <div className="p-3.5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] space-y-1.5">
                          <div className="text-xs font-bold">
                            {isCorrect ? (
                              <span className="text-emerald-600 flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4" /> Đúng!
                              </span>
                            ) : (
                              <span className="text-rose-600 flex items-center gap-1">
                                <XCircle className="w-4 h-4" /> Chưa đúng. Đáp án: {targetAns}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                            <strong>Lời giải & Phân tích:</strong> {q.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {!isAiExamFinished && (
                <div className="sticky bottom-6 bg-[var(--color-surface)]/90 backdrop-blur-md p-4 rounded-2xl border border-[var(--color-border)] shadow-lg flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--color-text-primary)]">
                    Đã làm {Object.keys(aiExamAnswers).length} / {generatedAiExam.questions.length} câu
                  </span>
                  <button
                    type="button"
                    onClick={handleSubmitAiExam}
                    className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs cursor-pointer shadow-md"
                  >
                    Nộp bài & Chấm điểm
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODE 3: OFFICIAL MOCK EXAM (ĐỀ THI THỬ CHUẨN SÁCH) */}
      {/* ========================================================= */}
      {(viewMode as string) === 'official_mock_exam' && (
        <div className="space-y-6">
          {/* Mock Exam Timer & Header Bar */}
          <div className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-600 text-[11px] font-bold">
                <Trophy className="w-3.5 h-3.5" />
                <span>Đề Thi Thử Chuẩn Theo Trang 121 - 131 Sách Bài Tập</span>
              </div>
              <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                HSK {selectedHskLevel} 模拟试卷 (Bộ Đề Thi Thử Toàn Diện)
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Bao gồm <strong>20 câu Nghe hiểu</strong> và <strong>20 câu Đọc hiểu</strong> • Thời gian làm bài:{' '}
                <strong>{selectedHskLevel === 1 ? '40 phút' : selectedHskLevel === 2 ? '55 phút' : selectedHskLevel === 3 ? '90 phút' : '105 phút'}</strong>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                <span className="font-mono text-base font-black text-amber-600">
                  {formatTimer(examTimeLeft)}
                </span>
              </div>

              {!isTimerRunning && !isMockExamFinished && (
                <button
                  type="button"
                  onClick={handleStartMockExam}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Bắt đầu tính giờ</span>
                </button>
              )}
            </div>
          </div>

          {/* Exam Results Scorecard */}
          {isMockExamFinished && (
            <div
              className={`p-6 rounded-3xl border text-center space-y-3 shadow-lg ${
                isPassed
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-100'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-100'
              }`}
            >
              <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-2xl shadow-md bg-white">
                {isPassed ? '🎉' : '💪'}
              </div>
              <h3 className="text-xl font-black">
                {isPassed ? 'Chúc mừng! Bạn đã ĐẠT chứng chỉ' : 'Cần cố gắng thêm! Hãy luyện lại nhé'}
              </h3>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
                Điểm chuẩn đỗ: <strong>{passScore} / {maxExamPoints} điểm</strong> • Bạn đạt:{' '}
                <span className={`text-xl font-bold ${isPassed ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {totalExamScore} / {maxExamPoints} điểm
                </span>{' '}
                ({mockCorrectCount}/{activeMockExam.length} câu đúng)
              </p>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleStartMockExam}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs cursor-pointer shadow-md inline-flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Làm lại đề thi thử
                </button>
              </div>
            </div>
          )}

          {/* Exam Questions List */}
          <div className="space-y-4">
            {activeMockExam.map((q) => {
              const targetAns = q.correctKey || (q as any).correctAnswer;
              const selected = mockExamAnswers[q.id];
              const isCorrect = selected === targetAns;
              return (
                <div
                  key={q.id}
                  className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-teal-600">
                        Câu {q.questionNumber} ({q.section === 'listening' ? 'Phần Nghe' : 'Phần Đọc'} - Phần {q.part}):
                      </span>
                      {q.promptChinese && (
                        <div className="text-base font-bold font-chinese text-[var(--color-text-primary)] mt-1">
                          {q.promptChinese}
                        </div>
                      )}
                      {q.promptPinyin && (
                        <div className="text-xs font-mono text-teal-600">{q.promptPinyin}</div>
                      )}
                      {q.prompt && (
                        <div className="text-sm font-medium text-[var(--color-text-primary)] mt-1">
                          {q.prompt}
                        </div>
                      )}
                    </div>

                    {(() => {
                      const audioTarget = q.audioScript || (q as any).audioText || (q.part === 1 ? q.promptChinese : undefined);
                      if (!audioTarget) return null;
                      return (
                        <button
                          type="button"
                          onClick={() => handlePlayAudio(audioTarget, q.id)}
                          className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Nghe Audio</span>
                        </button>
                      );
                    })()}
                  </div>

                  {/* Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {q.options.map((opt) => {
                      const isOptSelected = selected === opt.key;
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          disabled={isMockExamFinished}
                          onClick={() => setMockExamAnswers((prev) => ({ ...prev, [q.id]: opt.key }))}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                            isOptSelected
                              ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                              : 'bg-[var(--color-bg-secondary)] hover:bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-primary)]'
                          }`}
                        >
                          <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${isOptSelected ? 'bg-white/20 text-white' : 'bg-[var(--color-surface)] text-teal-600'}`}>
                            {opt.key}
                          </span>
                          <div>
                            {opt.imageEmoji && <div className="text-xl mb-0.5">{opt.imageEmoji}</div>}
                            {opt.textChinese && (
                              <div className="font-bold font-chinese text-sm">{opt.textChinese}</div>
                            )}
                            {opt.textVietnamese && (
                              <div className="text-[11px] opacity-80">{opt.textVietnamese}</div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation after finish */}
                  {isMockExamFinished && (
                    <div className="p-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] space-y-1">
                      <div className="text-xs font-bold">
                        {isCorrect ? (
                          <span className="text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Đúng!
                          </span>
                        ) : (
                          <span className="text-rose-600 flex items-center gap-1">
                            <XCircle className="w-4 h-4" /> Chưa đúng. Đáp án: {targetAns}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        <strong>Lời giải:</strong> {q.explanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {!isMockExamFinished && (
            <div className="sticky bottom-6 bg-[var(--color-surface)]/90 backdrop-blur-md p-4 rounded-2xl border border-[var(--color-border)] shadow-lg flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--color-text-primary)]">
                Đã làm {Object.keys(mockExamAnswers).length} / {activeMockExam.length} câu
              </span>
              <button
                type="button"
                onClick={handleSubmitMockExam}
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs cursor-pointer shadow-md"
              >
                Nộp bài & Chấm điểm
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
