import React, { useState, useMemo, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Layers,
  Sparkles,
  RotateCw,
  ArrowLeft,
  Trophy,
  Volume2,
  Plus,
  Zap,
  ChevronRight,
  ChevronLeft,
  PenTool,
  Sliders,
  CheckCircle2,
  BookOpen,
  Filter,
  Flame,
  Search,
  Frown,
  Smile,
} from 'lucide-react';
import { WordItem, SRSCardState, Deck, UserStats, HSKLevel, UserProfile } from '../../types';
import { INITIAL_DECKS } from '../../data/hskVocabulary';
import { logStudyActivity } from '../../utils/activityLogger';
import { getAllVocabulary } from '../../utils/vocabStorage';
import { calculateSM2, isCardDue, getDeckSRSStats, saveSRSCards } from '../../utils/srs';
import { playChineseAudio } from '../../utils/chineseAudio';
import { formatPartOfSpeechVietnamese } from '../../utils/radicalUtils';
import { HanziCanvas } from '../HanziCanvas';
import { VoiceSettingsModal } from '../VoiceSettingsModal';
import {
  getLessonsForLevel,
  getLessonProgress,
  getLessonVocabulary,
  getLearnedVocabulary,
  getCoursebookDueStats,
  ensureWordsInSRS,
} from '../../utils/coursebookVocab';

interface FlashcardsViewProps {
  srsCards: Record<string, SRSCardState>;
  onUpdateSRSCards: (cards: Record<string, SRSCardState>) => void;
  stats: UserStats;
  onUpdateStats: (newStats: Partial<UserStats>) => void;
  userProfile?: UserProfile;
  initialDeckId?: string | null;
  initialStudyMode?: 'due_only' | 'all';
  onClearInitialDeckId?: () => void;
  onNavigateToCoursebook?: () => void;
}

export const FlashcardsView: React.FC<FlashcardsViewProps> = ({
  srsCards,
  onUpdateSRSCards,
  stats,
  onUpdateStats,
  userProfile,
  initialDeckId,
  initialStudyMode,
  onClearInitialDeckId,
  onNavigateToCoursebook,
}) => {
  const [decks, setDecks] = useState<Deck[]>(INITIAL_DECKS);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyMode, setStudyMode] = useState<'due_only' | 'all'>('due_only');
  const [showCanvasMode, setShowCanvasMode] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [sessionReviewedCount, setSessionReviewedCount] = useState(0);

  const userLevel = (userProfile?.current_level as 1 | 2 | 3 | 4) || 1;
  const [selectedViewLevel, setSelectedViewLevel] = useState<1 | 2 | 3 | 4>(userLevel);
  const [activeTabMode, setActiveTabMode] = useState<'coursebook' | 'custom'>('coursebook');
  const [lessonPage, setLessonPage] = useState(1);
  const LESSONS_PER_PAGE = 6;

  // Custom Deck creation state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDeckTitle, setNewDeckTitle] = useState('');
  const [newDeckDesc, setNewDeckDesc] = useState('');
  const [newDeckWordIds, setNewDeckWordIds] = useState<string[]>([]);
  const [modalSearchTerm, setModalSearchTerm] = useState('');

  const allVocab = useMemo(() => {
    return getAllVocabulary();
  }, []);

  const coursebookProgress = useMemo(() => {
    return getLessonProgress(selectedViewLevel);
  }, [selectedViewLevel]);

  const coursebookLessons = useMemo(() => {
    return getLessonsForLevel(selectedViewLevel);
  }, [selectedViewLevel]);

  const coursebookDueStats = useMemo(() => {
    return getCoursebookDueStats(selectedViewLevel, srsCards);
  }, [selectedViewLevel, srsCards]);

  // Resolve all words for a given deck
  const getWordsForDeck = (deck: Deck): WordItem[] => {
    if (deck.wordIds && deck.wordIds.length > 0) {
      const vocabMap = new Map(allVocab.map((w) => [w.id, w]));
      return deck.wordIds
        .map((id) => vocabMap.get(id))
        .filter((w): w is WordItem => Boolean(w));
    }
    // Fallback: match by HSK level or tags
    if (deck.hskLevel) {
      if (deck.hskLevel === 5) {
        return allVocab.filter((w) => w.hskLevel >= 5 || w.tags?.includes('chengyu'));
      }
      return allVocab.filter((w) => w.hskLevel === deck.hskLevel);
    }
    return allVocab.slice(0, 15);
  };

  // Active Deck title & words resolution (Coursebook vs Custom)
  const activeDeckInfo = useMemo(() => {
    if (!selectedDeckId) return null;

    if (selectedDeckId === 'deck-coursebook-progress') {
      const words = getLearnedVocabulary(selectedViewLevel, coursebookProgress.maxReachedLessonNum);
      return {
        id: selectedDeckId,
        title: `Ôn tập theo tiến độ giáo trình (Bài 1 - ${coursebookProgress.maxReachedLessonNum} · New HSK ${selectedViewLevel})`,
        words,
      };
    }

    if (selectedDeckId.startsWith('deck-lesson-')) {
      const parts = selectedDeckId.split('-');
      const lvl = (parseInt(parts[2], 10) || selectedViewLevel) as 1 | 2 | 3;
      const lNum = parseInt(parts[3], 10);
      const words = getLessonVocabulary(lvl, lNum);
      const lessonObj = getLessonsForLevel(lvl).find((l) => l.lessonNumber === lNum);
      return {
        id: selectedDeckId,
        title: `Bài ${lNum}: ${lessonObj?.titleHanzi || ''} (${lessonObj?.titleVietnamese || ''})`,
        words,
      };
    }

    const d = decks.find((x) => x.id === selectedDeckId);
    if (d) {
      return {
        id: d.id,
        title: d.title,
        words: getWordsForDeck(d),
      };
    }

    return null;
  }, [selectedDeckId, selectedViewLevel, coursebookProgress, decks, allVocab]);

  const deckWords = activeDeckInfo?.words || [];

  // Due words vs all words based on studyMode
  const activeStudyWords = useMemo(() => {
    if (!activeDeckInfo) return [];
    if (studyMode === 'all') {
      return deckWords;
    }
    const due = deckWords.filter((word) => {
      const state = srsCards[word.id];
      if (!state) return true; // New cards are due
      return isCardDue(state) || state.state === 'new';
    });
    // If due is empty but user clicked study, return all deck words so they are never blocked
    return due.length > 0 ? due : deckWords;
  }, [activeDeckInfo, deckWords, srsCards, studyMode]);

  const currentWord = activeStudyWords[currentCardIndex] || null;

  const handleStartDeck = (deckId: string, mode: 'due_only' | 'all' = 'due_only') => {
    let targetWords: WordItem[] = [];
    if (deckId === 'deck-coursebook-progress') {
      targetWords = getLearnedVocabulary(selectedViewLevel, coursebookProgress.maxReachedLessonNum);
    } else if (deckId.startsWith('deck-lesson-')) {
      const parts = deckId.split('-');
      const lvl = (parseInt(parts[2], 10) || selectedViewLevel) as 1 | 2 | 3;
      const lNum = parseInt(parts[3], 10);
      targetWords = getLessonVocabulary(lvl, lNum);
    } else {
      const d = decks.find((x) => x.id === deckId);
      if (d) targetWords = getWordsForDeck(d);
    }

    if (targetWords.length > 0) {
      const updatedCards = ensureWordsInSRS(targetWords, srsCards);
      onUpdateSRSCards(updatedCards);
    }

    setSelectedDeckId(deckId);
    setStudyMode(mode);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setShowCanvasMode(false);
    setSessionCompleted(false);
    setSessionReviewedCount(0);
  };

  // Automatically start deck if initialDeckId is passed
  useEffect(() => {
    if (initialDeckId) {
      handleStartDeck(initialDeckId, initialStudyMode || 'due_only');
      if (onClearInitialDeckId) {
        onClearInitialDeckId();
      }
    }
  }, [initialDeckId, initialStudyMode]);

  const handleStartDeckRef = useRef(handleStartDeck);
  handleStartDeckRef.current = handleStartDeck;

  // Support direct review launch from header widget event
  useEffect(() => {
    const handleExternalStart = (e: Event) => {
      const customEvent = e as CustomEvent<{ deckId?: string; mode?: 'due_only' | 'all' }>;
      const deckId = customEvent.detail?.deckId || 'deck-coursebook-progress';
      handleStartDeckRef.current(deckId, customEvent.detail?.mode || 'due_only');
    };
    window.addEventListener('minnie_start_srs_review', handleExternalStart);
    return () => window.removeEventListener('minnie_start_srs_review', handleExternalStart);
  }, []);

  const handleAnswerRating = (quality: number) => {
    if (!currentWord) return;

    const currentState = srsCards[currentWord.id];
    const newSM2 = calculateSM2(quality, currentState);

    const updatedState: SRSCardState = {
      wordId: currentWord.id,
      repetition: newSM2.repetition,
      interval: newSM2.interval,
      easinessFactor: newSM2.easinessFactor,
      lastReviewDate: new Date().toISOString(),
      nextReviewDate: newSM2.nextReviewDate,
      history: [
        ...(currentState?.history || []),
        {
          date: new Date().toISOString(),
          quality,
          interval: newSM2.interval,
        },
      ],
      state: newSM2.state,
    };

    const newSRSCards = {
      ...srsCards,
      [currentWord.id]: updatedState,
      [currentWord.hanzi]: updatedState,
    };

    onUpdateSRSCards(newSRSCards);
    saveSRSCards(newSRSCards);

    // Calculate total mastered cards across the entire library
    const totalMastered = Object.values(newSRSCards).filter((c) => c.state === 'mastered').length;

    // Update stats (+25 XP for mastering a card, +15 XP for review)
    onUpdateStats({
      xp: (stats.xp || 0) + (quality >= 5 ? 25 : 15),
      cardsReviewedToday: (stats.cardsReviewedToday ?? 0) + 1,
      totalReviews: (stats.totalReviews ?? 0) + 1,
      masteredWordsCount: totalMastered,
    });

    // Check whether this card was reviewed before or is seen for the first time
    const isFirstTime = !currentState || !currentState.history || currentState.history.length === 0;
    if (isFirstTime) {
      logStudyActivity('new_lesson', `Học từ mới (flashcard): ${currentWord.hanzi || 'từ vựng'}`);
    } else {
      logStudyActivity('review', `Ôn tập flashcard: ${currentWord.hanzi || 'từ vựng'}`);
    }

    setSessionReviewedCount((prev) => prev + 1);

    // Next card or complete
    if (currentCardIndex + 1 < activeStudyWords.length) {
      setCurrentCardIndex((prev) => prev + 1);
      setIsFlipped(false);
    } else {
      setSessionCompleted(true);
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 },
      });
    }
  };

  const handlePrevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex((prev) => prev - 1);
      setIsFlipped(false);
    }
  };

  const handleNextCard = () => {
    if (currentCardIndex + 1 < activeStudyWords.length) {
      setCurrentCardIndex((prev) => prev + 1);
      setIsFlipped(false);
    } else {
      setSessionCompleted(true);
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 },
      });
    }
  };

  // Keyboard navigation for reviewing flashcards: Space (Flip), ArrowLeft (Prev), ArrowRight (Next / Known), 1 (Forgot), 2 (Mastered)
  useEffect(() => {
    if (!selectedDeckId || sessionCompleted || showCreateModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrevCard();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        if (isFlipped) {
          handleAnswerRating(5);
        } else {
          handleNextCard();
        }
      } else if (e.key === '1' && isFlipped) {
        e.preventDefault();
        handleAnswerRating(1);
      } else if (e.key === '2' && isFlipped) {
        e.preventDefault();
        handleAnswerRating(5);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDeckId, sessionCompleted, showCreateModal, currentCardIndex, isFlipped, activeStudyWords.length]);

  const handleCreateDeck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeckTitle.trim() || newDeckWordIds.length === 0) return;

    const newDeck: Deck = {
      id: `deck-custom-${Date.now()}`,
      title: newDeckTitle,
      description: newDeckDesc || 'Bộ thẻ tự tạo cá nhân của học viên.',
      iconName: 'Bookmark',
      color: 'emerald',
      wordIds: newDeckWordIds,
      createdAt: new Date().toISOString(),
      isCustom: true,
    };

    setDecks((prev) => [...prev, newDeck]);
    setShowCreateModal(false);
    setNewDeckTitle('');
    setNewDeckDesc('');
    setNewDeckWordIds([]);
  };

  const modalFilteredVocab = useMemo(() => {
    if (!modalSearchTerm.trim()) return allVocab.slice(0, 40);
    const term = modalSearchTerm.toLowerCase();
    return allVocab.filter(
      (w) =>
        w.hanzi.includes(term) ||
        w.pinyin.toLowerCase().includes(term) ||
        (w.vietnamese && w.vietnamese.toLowerCase().includes(term)) ||
        (w.hanViet && w.hanViet.toLowerCase().includes(term))
    );
  }, [allVocab, modalSearchTerm]);

  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 space-y-6 animate-fade-in" id="flashcards-container">
      {/* If no deck is selected, show Deck Overview list */}
      {!selectedDeckId ? (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl font-bold text-[var(--color-text-primary)] tracking-tight flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[var(--color-primary-light)] border border-[var(--color-primary)]/20 flex items-center justify-center text-[var(--color-primary)] shadow-sm">
                  <Layers className="w-5 h-5" />
                </div>
                <span>Bộ thẻ ghi nhớ</span>
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2.5 rounded-xl bg-[var(--color-surface)] hover:bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[var(--color-primary)]" />
                <span>Tạo bộ thẻ tự chọn</span>
              </button>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-2 border-b border-[var(--color-border)] pb-3 mb-6">
            <button
              type="button"
              onClick={() => setActiveTabMode('coursebook')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTabMode === 'coursebook'
                  ? 'bg-[var(--color-primary)] text-white shadow-sm'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)]'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Theo bài học giáo trình New HSK</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-bold">
                Trọng tâm
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTabMode('custom')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTabMode === 'custom'
                  ? 'bg-[var(--color-primary)] text-white shadow-sm'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)]'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Bộ thẻ mở rộng & tự tạo ({decks.length})</span>
            </button>
          </div>

          {activeTabMode === 'coursebook' ? (
            <div>
              {/* Hero Card: Coursebook Progress Deck */}
              <div className="bg-gradient-to-br from-red-600 via-rose-700 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-xl relative overflow-hidden mb-8 border border-red-500/30">
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="space-y-3 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-red-100 text-xs font-bold uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      Lộ trình ôn tập theo giáo trình New HSK {selectedViewLevel}
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                      Ôn tập theo tiến độ: Bài 1 - Bài {coursebookProgress.maxReachedLessonNum}
                    </h2>
                    <p className="text-xs sm:text-sm text-red-100/90 leading-relaxed">
                      Học đến bài nào thì bắt buộc ôn tập đến bài đó! Hệ thống tự động gộp tất cả {coursebookDueStats.totalWordsCount} từ vựng từ Bài 1 đến Bài {coursebookProgress.maxReachedLessonNum} trong giáo trình để kiểm tra và củng cố trí nhớ dài hạn.
                    </p>

                    <div className="flex items-center gap-4 sm:gap-6 pt-1 flex-wrap">
                      <div>
                        <span className="text-[11px] text-red-200 block">Cần ôn hôm nay</span>
                        <span className="text-2xl font-black text-amber-300">
                          {coursebookDueStats.dueCount} <span className="text-xs font-normal">thẻ</span>
                        </span>
                      </div>
                      <div className="w-px h-8 bg-white/20" />
                      <div>
                        <span className="text-[11px] text-red-200 block">Đã thuộc</span>
                        <span className="text-2xl font-black text-emerald-300">
                          {coursebookDueStats.masteredCount} <span className="text-xs font-normal">từ</span>
                        </span>
                      </div>
                      <div className="w-px h-8 bg-white/20" />
                      <div>
                        <span className="text-[11px] text-red-200 block">Tổng từ đã học</span>
                        <span className="text-2xl font-black text-white">
                          {coursebookDueStats.totalWordsCount} <span className="text-xs font-normal">từ</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStartDeck('deck-coursebook-progress', 'due_only')}
                      className="px-6 py-3.5 rounded-2xl bg-white hover:bg-red-50 text-red-950 text-xs sm:text-sm font-black shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
                    >
                      <RotateCw className="w-4 h-4 text-red-600" />
                      <span>Ôn tập đến hạn ({coursebookDueStats.dueCount} thẻ)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartDeck('deck-coursebook-progress', 'all')}
                      className="px-6 py-3 rounded-2xl bg-black/30 hover:bg-black/40 border border-white/20 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <span>Ôn toàn bộ ({coursebookDueStats.totalWordsCount} từ đã học)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Level Filter and Lesson Progress Info */}
              <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[var(--color-text-secondary)]">Xem giáo trình:</span>
                  {([1, 2, 3, 4] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => {
                        setSelectedViewLevel(lvl);
                        setLessonPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedViewLevel === lvl
                          ? 'bg-[var(--color-primary)] text-white shadow-xs'
                          : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)]'
                      }`}
                    >
                      New HSK {lvl} ({lvl === 3 || lvl === 4 ? '10 bài' : '15 bài'})
                      {userLevel === lvl && (
                        <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[9px] bg-white/20">
                          Của bạn
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[var(--color-text-secondary)] font-medium">
                    Tiến độ: Đang học bài {coursebookProgress.currentLessonNum} / {coursebookLessons.length}
                  </span>
                </div>
              </div>

              {/* Coursebook Lessons Grid (6 lessons per page) */}
              {(() => {
                const totalLessonPages = Math.max(1, Math.ceil(coursebookLessons.length / LESSONS_PER_PAGE));
                const currentLessonPage = Math.min(Math.max(1, lessonPage), totalLessonPages);
                const startIdx = (currentLessonPage - 1) * LESSONS_PER_PAGE;
                const paginatedLessons = coursebookLessons.slice(startIdx, startIdx + LESSONS_PER_PAGE);
                const endIdx = Math.min(startIdx + LESSONS_PER_PAGE, coursebookLessons.length);

                return (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {paginatedLessons.map((lesson) => {
                        const words = lesson.vocabulary || [];
                        const wordIds = words.map((w) => w.id);
                        const statsObj = getDeckSRSStats(wordIds, srsCards);
                        const isLearned = lesson.lessonNumber <= coursebookProgress.maxReachedLessonNum;
                        const isCurrent = lesson.lessonNumber === coursebookProgress.currentLessonNum;
                        const progressPct = Math.round(
                          ((statsObj.masteredCount + statsObj.reviewCount) / (statsObj.total || 1)) * 100
                        );

                        return (
                          <div
                            key={lesson.lessonNumber}
                            className={`silk-card-interactive p-5 rounded-2xl flex flex-col justify-between group ${
                              isCurrent
                                ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/30 shadow-md'
                                : isLearned
                                ? 'border-[var(--color-border)] shadow-xs'
                                : 'border-[var(--color-border)] opacity-85 hover:opacity-100'
                            }`}
                          >
                            <div>
                              {/* Top badges */}
                              <div className="flex items-start justify-between gap-2 mb-3">
                                <div className="flex items-center gap-2">
                                  <span className="px-2.5 py-1 rounded-lg bg-[var(--color-primary-light)] text-[var(--color-primary)] text-xs font-black">
                                    Bài {lesson.lessonNumber}
                                  </span>
                                  {isCurrent && (
                                    <span className="px-2 py-0.5 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] text-[10px] font-bold border border-[var(--color-primary)]/20">
                                      Đang học
                                    </span>
                                  )}
                                  {isLearned && !isCurrent && (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                                      ✓ Đã học
                                    </span>
                                  )}
                                  {!isLearned && (
                                    <span className="px-2 py-0.5 rounded-full bg-gray-500/10 text-gray-500 dark:text-gray-400 text-[10px] font-medium">
                                      Chưa học tới
                                    </span>
                                  )}
                                </div>

                                {statsObj.dueCount > 0 ? (
                                  <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px] font-bold shrink-0">
                                    {statsObj.dueCount} Cần ôn
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium shrink-0">
                                    ✓ Đã thuộc
                                  </span>
                                )}
                              </div>

                              {/* Lesson Hanzi and translation */}
                              <div className="space-y-1">
                                <h3 className="text-base font-bold text-[var(--color-text-primary)] font-chinese tracking-wide group-hover:text-[var(--color-primary)] transition-colors">
                                  {lesson.titleHanzi}
                                </h3>
                                <p className="text-xs text-[var(--color-text-secondary)]">
                                  {lesson.titlePinyin} • <span className="text-[var(--color-text-primary)] font-medium">{lesson.titleVietnamese}</span>
                                </p>
                              </div>

                              {/* Vocabulary chip preview */}
                              <div className="mt-3.5 pt-3 border-t border-[var(--color-border)]/60">
                                <div className="flex items-center justify-between text-[11px] text-[var(--color-text-secondary)] mb-1.5 font-medium">
                                  <span>Từ vựng bài học ({words.length} từ)</span>
                                  <span className="font-mono">{statsObj.masteredCount}/{words.length} thuộc</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {words.slice(0, 6).map((w) => {
                                    const card = srsCards[w.id];
                                    const isMastered = card?.state === 'mastered';
                                    return (
                                      <span
                                        key={w.id}
                                        className={`px-2 py-0.5 rounded-md text-xs font-serif font-bold ${
                                          isMastered
                                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                            : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] border border-[var(--color-border)]'
                                        }`}
                                        title={`${w.pinyin}: ${w.vietnamese || w.english}`}
                                      >
                                        {w.hanzi}
                                      </span>
                                    );
                                  })}
                                  {words.length > 6 && (
                                    <span className="px-1.5 py-0.5 text-[11px] text-[var(--color-text-secondary)]">
                                      +{words.length - 6}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Progress bar */}
                              <div className="mt-3.5">
                                <div className="w-full bg-[var(--color-background)] h-1.5 rounded-full overflow-hidden border border-[var(--color-border)]">
                                  <div
                                    className="bg-gradient-to-r from-[var(--color-primary)] to-emerald-400 h-full rounded-full transition-all duration-500"
                                    style={{ width: `${progressPct}%` }}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Bottom actions */}
                            <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex items-center justify-between gap-2">
                              <div className="text-[11px] text-[var(--color-text-secondary)] font-mono">
                                <span>🧠 {statsObj.masteredCount} Thuộc</span>
                                <span className="ml-2">🔄 {statsObj.dueCount} Cần ôn</span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleStartDeck(`deck-lesson-${selectedViewLevel}-${lesson.lessonNumber}`, 'all')}
                                  className="silk-btn px-2.5 py-1 rounded-lg bg-[var(--color-background)] hover:bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-[11px] font-medium transition-all cursor-pointer shadow-xs"
                                  title="Ôn tập toàn bộ từ vựng bài này"
                                >
                                  Tất cả ({words.length})
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    logStudyActivity('review', `Bấm ôn tập bài học: HSK ${selectedViewLevel} - Bài ${lesson.lessonNumber}`);
                                    handleStartDeck(`deck-lesson-${selectedViewLevel}-${lesson.lessonNumber}`, 'due_only');
                                  }}
                                  className="silk-btn px-3 py-1.5 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                                >
                                  <span>Ôn tập</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Pagination Controls (6 lessons/page) */}
                    {totalLessonPages > 1 && (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[var(--color-border)]">
                        <div className="text-xs text-[var(--color-text-secondary)] font-medium">
                          Hiển thị bài <strong className="text-[var(--color-text-primary)]">{startIdx + 1} - {endIdx}</strong> trong tổng số <strong className="text-[var(--color-text-primary)]">{coursebookLessons.length}</strong> bài
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={currentLessonPage <= 1}
                            onClick={() => setLessonPage((p) => Math.max(1, p - 1))}
                            className="p-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
                            title="Trang trước"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>

                          {Array.from({ length: totalLessonPages }, (_, i) => i + 1).map((pg) => (
                            <button
                              key={pg}
                              type="button"
                              onClick={() => setLessonPage(pg)}
                              className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                currentLessonPage === pg
                                  ? 'bg-[var(--color-primary)] text-white shadow-xs'
                                  : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] border border-[var(--color-border)]'
                              }`}
                            >
                              {pg}
                            </button>
                          ))}

                          <button
                            type="button"
                            disabled={currentLessonPage >= totalLessonPages}
                            onClick={() => setLessonPage((p) => Math.min(totalLessonPages, p + 1))}
                            className="p-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
                            title="Trang tiếp theo"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          ) : (
            /* Custom & Expanded Decks Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {decks.map((deck) => {
                const wordsInDeck = getWordsForDeck(deck);
                const wordIdsInDeck = wordsInDeck.map((w) => w.id);
                const statsObj = getDeckSRSStats(wordIdsInDeck, srsCards);
                const progressPercent = Math.round(
                  ((statsObj.masteredCount + statsObj.reviewCount) / (statsObj.total || 1)) * 100
                );

                return (
                  <div
                    key={deck.id}
                    className="bg-[var(--color-surface)] rounded-2xl p-5 border border-[var(--color-border)] shadow-sm hover:border-[var(--color-primary)]/50 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-light)] border border-[var(--color-primary)]/20 text-[var(--color-primary)] flex items-center justify-center font-bold font-chinese text-lg group-hover:scale-105 transition-transform shadow-inner">
                            {deck.title.slice(0, 1)}
                          </div>
                          <div>
                            <h2 className="font-bold text-[var(--color-text-primary)] text-sm leading-snug">
                              {deck.title}
                            </h2>
                            <span className="text-[11px] text-[var(--color-text-secondary)] font-mono">
                              {wordsInDeck.length} thẻ từ vựng
                            </span>
                          </div>
                        </div>

                        {statsObj.dueCount > 0 ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold shrink-0 animate-pulse">
                            {statsObj.dueCount} Đến hạn
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-[var(--color-background)] text-[var(--color-text-secondary)] text-[11px] font-medium shrink-0 border border-[var(--color-border)]">
                            ✓ Hoàn tất
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[var(--color-text-secondary)] mt-3 line-clamp-2 leading-relaxed">
                        {deck.description}
                      </p>

                      {/* Progress Bar */}
                      <div className="mt-4">
                        <div className="flex justify-between text-[11px] text-[var(--color-text-secondary)] mb-1 font-mono">
                          <span>Tiến độ hoàn thành</span>
                          <span className="text-[var(--color-primary)] font-bold">{progressPercent}%</span>
                        </div>
                        <div className="w-full bg-[var(--color-background)] h-2 rounded-full overflow-hidden border border-[var(--color-border)]">
                          <div
                            className="bg-gradient-to-r from-[var(--color-primary)] to-teal-400 h-full rounded-full transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-[var(--color-border)] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-secondary)] font-mono">
                        <span>🧠 {statsObj.masteredCount} Thuộc</span>
                        <span>🔄 {statsObj.dueCount} Cần ôn</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleStartDeck(deck.id, 'all')}
                          className="px-2.5 py-1.5 rounded-lg bg-[var(--color-background)] hover:bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-[11px] font-medium transition-all cursor-pointer"
                          title="Ôn tập toàn bộ từ vựng trong bộ"
                        >
                          Tất cả ({wordsInDeck.length})
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStartDeck(deck.id, 'due_only')}
                          className="px-3 py-1.5 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                        >
                          <span>Học SM-2</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Active Study Session Layout */
        <div>
          <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedDeckId(null);
                if (onClearInitialDeckId) onClearInitialDeckId();
              }}
              className="flex items-center gap-2 text-xs font-semibold text-gray-300 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại danh sách bài học</span>
            </button>

            <div className="flex items-center gap-3">
              {activeDeckInfo && (
                <span className="text-xs font-bold text-amber-300 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 max-w-[300px] truncate">
                  {activeDeckInfo.title}
                </span>
              )}
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 font-bold">
                Thẻ {currentCardIndex + 1} / {activeStudyWords.length || 1}
              </span>
            </div>
          </div>

          {/* Session Finished View */}
          {sessionCompleted || !currentWord ? (
            <div className="bg-[#0D1117]/90 backdrop-blur-md rounded-3xl p-8 border border-[#30363D] text-center max-w-lg mx-auto shadow-2xl space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <Trophy className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  太棒了！Hoàn thành buổi ôn tập SM-2!
                </h2>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Bạn đã ôn tập <span className="text-white font-bold">{sessionReviewedCount} thẻ</span> và nhận được <span className="text-emerald-400 font-bold">+{sessionReviewedCount * 15} XP</span>!
                  Lịch ôn tập tiếp theo đã được SuperMemo SM-2 tự động tính toán dựa trên chu kỳ nhớ quên.
                </p>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDeckId(null)}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all cursor-pointer"
                >
                  Trở về danh sách bộ thẻ
                </button>
              </div>
            </div>
          ) : (
            /* Active Flashcard Screen */
            <div className="space-y-6">
              {/* Practice Pad Toggle */}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCanvasMode(!showCanvasMode)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                    showCanvasMode
                      ? 'bg-emerald-500 text-black font-bold shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                      : 'bg-[#1F2937] text-gray-300 border border-[#30363D] hover:bg-[#2D333B]'
                  }`}
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>{showCanvasMode ? 'Ẩn ô tập viết' : 'Luyện viết nét chữ Hán'}</span>
                </button>
              </div>

              {/* Stroke Drawing Practice Pad if active */}
              {showCanvasMode && (
                <div className="bg-[#0D1117]/90 backdrop-blur-md p-4 rounded-2xl border border-[#30363D] shadow-xl max-w-xl mx-auto">
                  <p className="text-xs text-center text-gray-300 mb-2 font-mono">
                    Luyện viết nét chữ Hán <span className="font-bold text-emerald-400 font-serif text-base">{currentWord.hanzi}</span> ({currentWord.pinyin}):
                  </p>
                  <HanziCanvas
                    character={currentWord.hanzi}
                    pinyin={currentWord.pinyin}
                    strokeCount={currentWord.strokeCount}
                    radical={currentWord.radical}
                    size={240}
                    gridType="mi"
                  />
                </div>
              )}

              {/* Primary Flashcard Card */}
              <div
                className="relative bg-[#0D1117]/85 backdrop-blur-md border border-[#30363D] rounded-3xl p-8 sm:p-10 flex flex-col items-center justify-center shadow-2xl max-w-2xl mx-auto transition-all"
                id="active-srs-card"
              >
                {/* SRS Card Header ID & HSK Level */}
                <div className="w-full flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-gray-400 font-mono tracking-widest uppercase">
                      THẺ: {currentWord.id}
                    </span>
                    {srsCards[currentWord.id]?.state === 'mastered' ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Đã thuộc</span>
                      </span>
                    ) : srsCards[currentWord.id]?.state === 'review' ? (
                      <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-medium">
                        🔄 Đang ôn tập
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-medium">
                        ✨ Thẻ mới
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-[#1F2937] border border-[#30363D] text-emerald-400 text-[11px] font-mono font-bold">
                      HSK {currentWord.hskLevel} {currentWord.hskLevel <= 3 ? '(3.0)' : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => playChineseAudio(currentWord.hanzi)}
                      className="p-1.5 rounded-lg bg-[#1F2937] hover:bg-emerald-500/20 text-gray-300 hover:text-emerald-400 border border-[#30363D] transition-colors cursor-pointer"
                      title="Phát âm chữ Hán"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Big Hanzi and Pinyin */}
                <div className="text-center space-y-3 mb-6">
                  <span className="text-[80px] sm:text-[96px] font-bold text-white block leading-none font-serif tracking-wider">
                    {currentWord.hanzi}
                  </span>

                  {isFlipped ? (
                    <div className="inline-block px-4 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-300 text-xl font-bold font-mono">
                      {currentWord.pinyin}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 font-mono">
                      Bấm "Lật xem nghĩa & cách dùng" để kiểm tra trí nhớ
                    </p>
                  )}
                </div>

                {/* Definition Box */}
                {isFlipped && (
                  <div className="w-full max-w-md p-5 bg-black/60 rounded-2xl border border-white/10 space-y-3 mb-6">
                    {/* Tiếng Việt */}
                    <div className="text-center">
                      <p className="text-lg text-emerald-300 font-bold leading-snug">
                        {currentWord.vietnamese || currentWord.english}
                      </p>
                    </div>

                    {/* Âm Hán Việt */}
                    {currentWord.hanViet && (
                      <p className="text-center text-xs text-amber-300 font-mono">
                        Âm Hán Việt: <span className="font-bold text-amber-400">{currentWord.hanViet}</span>
                      </p>
                    )}

                    {/* Bộ thủ & Từ loại */}
                    {(currentWord.radical || currentWord.partOfSpeech) && (
                      <p className="text-center text-xs text-gray-400 font-mono">
                        Bộ thủ: <span className="text-emerald-400 font-bold">{currentWord.radical || '—'}</span> • Từ loại: <span className="text-gray-300 font-semibold">{formatPartOfSpeechVietnamese(currentWord.partOfSpeech)}</span>
                      </p>
                    )}

                    {/* Mẹo nhớ */}
                    {currentWord.mnemonic && (
                      <div className="text-xs text-amber-200/90 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 leading-relaxed">
                        🧠 <span className="font-bold">Mẹo nhớ nhanh:</span> {currentWord.mnemonic}
                      </div>
                    )}

                    {/* Ví dụ thực tế */}
                    {currentWord.examples?.[0] && (
                      <div className="text-xs text-gray-200 bg-white/5 p-3 rounded-xl border border-white/5 flex items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <p className="font-serif font-bold text-white text-sm">{currentWord.examples[0].hanzi || currentWord.examples[0].chinese}</p>
                          <p className="text-[11px] text-gray-300 font-mono">{currentWord.examples[0].pinyin}</p>
                          <p className="text-[11px] text-emerald-300 italic">"{currentWord.examples[0].vietnamese || currentWord.examples[0].english}"</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => playChineseAudio(currentWord.examples[0].hanzi || currentWord.examples[0].chinese)}
                          className="p-2 rounded-lg bg-white/10 hover:bg-emerald-500/20 text-gray-300 hover:text-emerald-400 transition-colors shrink-0 cursor-pointer"
                          title="Nghe câu ví dụ"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Simplified Flashcard Controls */}
                <div className="w-full mt-4 flex flex-col items-center">
                  {!isFlipped ? (
                    <div className="w-full max-w-md flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={handlePrevCard}
                        disabled={currentCardIndex === 0}
                        className="px-4 py-3 rounded-2xl border border-[#30363D] bg-[#161B22] hover:bg-[#21262D] text-xs font-semibold text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                        title="Quay lại thẻ trước"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">Thẻ trước</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsFlipped(true)}
                        className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-500 rounded-2xl text-white text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                      >
                        <RotateCw className="w-4 h-4" />
                        <span>Lật xem nghĩa & ví dụ</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleNextCard}
                        className="px-4 py-3 rounded-2xl border border-[#30363D] bg-[#161B22] hover:bg-[#21262D] text-xs font-semibold text-gray-300 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                        title="Sang thẻ tiếp theo"
                      >
                        <span className="hidden sm:inline">Thẻ tiếp</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-full max-w-md space-y-3">
                      <div className="flex items-center justify-between gap-3 w-full">
                        <button
                          type="button"
                          onClick={() => handleAnswerRating(1)}
                          className="flex-1 py-3 px-4 bg-rose-950/40 hover:bg-rose-900/60 rounded-xl border border-rose-500/40 text-xs font-bold text-rose-300 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-sm"
                          title="Chưa nhớ từ này, ôn lại sau"
                        >
                          <Frown className="w-4 h-4 text-rose-400" />
                          <span>Chưa nhớ</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAnswerRating(5)}
                          className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white text-xs font-bold shadow-[0_0_15px_rgba(16,185,129,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                          title="Đã nhớ từ này"
                        >
                          <Smile className="w-4 h-4 text-white" />
                          <span>{currentCardIndex + 1 === activeStudyWords.length ? 'Hoàn tất buổi ôn 🎉' : 'Đã thuộc'}</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-400 px-1 pt-1">
                        <button
                          type="button"
                          onClick={handlePrevCard}
                          disabled={currentCardIndex === 0}
                          className="hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                          <span>Thẻ trước</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsFlipped(false)}
                          className="hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                          <span>Lật lại mặt chữ Hán</span>
                        </button>
                        {currentCardIndex + 1 < activeStudyWords.length && (
                          <button
                            type="button"
                            onClick={handleNextCard}
                            className="hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <span>Thẻ tiếp</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Single Progress Card: Tiến độ học tập */}
              {(() => {
                const totalWords = activeStudyWords.length || 1;
                const currentNum = Math.min(totalWords, currentCardIndex + 1);
                const progressPct = Math.min(100, Math.round((currentNum / totalWords) * 100));

                return (
                  <div className="max-w-2xl mx-auto">
                    <div className="bg-[#0D1117]/85 border border-[#30363D] rounded-2xl p-5 shadow-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-xs text-gray-300 uppercase font-bold tracking-wider font-mono">
                            Tiến độ học tập
                          </span>
                        </div>
                        <span className="text-xs text-emerald-400 font-mono font-bold">
                          {progressPct}%
                        </span>
                      </div>

                      <div className="flex items-end justify-between">
                        <div className="space-y-0.5">
                          <span className="text-2xl font-black text-white font-mono">
                            {currentNum} <span className="text-sm text-gray-400 font-normal">/ {totalWords} thẻ</span>
                          </span>
                          <p className="text-xs text-gray-400 truncate max-w-md">
                            {activeDeckInfo?.title || 'Buổi ôn tập từ vựng'}
                          </p>
                        </div>
                        <span className="text-[11px] text-gray-400 font-mono">
                          Còn lại {Math.max(0, totalWords - currentNum)} thẻ
                        </span>
                      </div>

                      <div className="w-full h-2 bg-[#21262D] rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* Create Custom Deck Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0D1117] rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#30363D] space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                <span>Tạo bộ thẻ ghi nhớ mới</span>
              </h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white text-xs cursor-pointer"
              >
                ✕ Đóng
              </button>
            </div>

            <form onSubmit={handleCreateDeck} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Tên bộ thẻ
                </label>
                <input
                  type="text"
                  required
                  value={newDeckTitle}
                  onChange={(e) => setNewDeckTitle(e.target.value)}
                  placeholder="VD: Từ vựng giao tiếp Du lịch, Phỏng vấn xin việc..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#30363D] bg-[#161B22] text-xs text-white focus:outline-emerald-500 placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Mô tả ngắn
                </label>
                <input
                  type="text"
                  value={newDeckDesc}
                  onChange={(e) => setNewDeckDesc(e.target.value)}
                  placeholder="VD: Tổng hợp các câu và từ vựng thông dụng nhất..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#30363D] bg-[#161B22] text-xs text-white focus:outline-emerald-500 placeholder-gray-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-gray-300">
                    Chọn từ vựng đưa vào bộ ({newDeckWordIds.length} từ đã chọn)
                  </label>
                </div>

                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    value={modalSearchTerm}
                    onChange={(e) => setModalSearchTerm(e.target.value)}
                    placeholder="Tìm kiếm theo chữ Hán, pinyin hoặc nghĩa tiếng Việt..."
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-[#30363D] bg-[#161B22] text-xs text-white focus:outline-emerald-500 placeholder-gray-500"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-[#0A0C10] border border-[#30363D]">
                  {modalFilteredVocab.map((word) => {
                    const isSelected = newDeckWordIds.includes(word.id);
                    return (
                      <div
                        key={word.id}
                        onClick={() => {
                          if (isSelected) {
                            setNewDeckWordIds(newDeckWordIds.filter((id) => id !== word.id));
                          } else {
                            setNewDeckWordIds([...newDeckWordIds, word.id]);
                          }
                        }}
                        className={`p-2.5 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30'
                            : 'hover:bg-[#161B22] text-gray-300 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-serif font-bold text-white text-sm">{word.hanzi}</span>
                          <span className="text-gray-400 font-mono">({word.pinyin})</span>
                          {word.hanViet && (
                            <span className="text-[11px] text-amber-400 font-mono">[{word.hanViet}]</span>
                          )}
                        </div>
                        <span className="text-[11px] text-gray-300 max-w-[150px] truncate">{word.vietnamese || word.english}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#161B22] hover:bg-[#21262D] text-gray-300 text-xs font-semibold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={!newDeckTitle.trim() || newDeckWordIds.length === 0}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold disabled:opacity-40 transition-all cursor-pointer"
                >
                  Tạo bộ thẻ ({newDeckWordIds.length} từ)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Voice Selection Modal */}
      <VoiceSettingsModal isOpen={showVoiceModal} onClose={() => setShowVoiceModal(false)} />
    </div>
  );
};
