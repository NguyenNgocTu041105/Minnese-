import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Bookmark,
  BookmarkCheck,
  Copy,
  Check,
  Eye,
  EyeOff,
  Type,
  Layers,
  ArrowRight,
  ListOrdered,
  FileText,
  Compass,
  MessageSquare,
  Flame,
  Plus,
  Trash2,
  ChevronDown,
  RefreshCw,
  ExternalLink,
  History,
  Target,
  Award,
  CheckCheck,
} from 'lucide-react';
import { HSKStoryLesson, HSKStoryVocabulary, HSKLevel, UserProfile } from '../../types';
import { playChineseAudio, stopChineseAudio } from '../../utils/chineseAudio';
import { CartoonLoader } from '../CartoonLoader';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface HSKReadingStudioProps {
  onAskAiAboutStory?: (prompt: string) => void;
  onSaveVocabToFlashcards?: (vocab: HSKStoryVocabulary) => void;
  initialHskLevel?: number;
  userProfile?: UserProfile;
}

const STORAGE_SAVED_STORIES_KEY = 'minnese_saved_hsk_stories_v3';

// 20 Curated Engaging Topics across HSK 1 - 6
const SAMPLE_TOPICS = [
  { topic: 'Cuối tuần đi uống trà sữa cùng bạn', icon: '🧋', hsk: 1, genre: 'story' },
  { topic: 'Đi chợ đêm mua đồ ăn vặt Trung Hoa', icon: '🥟', hsk: 1, genre: 'story' },
  { topic: 'Buổi sáng đầu tiên ở trường đại học', icon: '🏫', hsk: 1, genre: 'dialogue' },
  { topic: 'Đi siêu thị mua hoa quả và đồ dùng', icon: '🛒', hsk: 1, genre: 'dialogue' },
  { topic: 'Trải nghiệm đi tàu cao tốc ngắm cảnh', icon: '🚄', hsk: 2, genre: 'story' },
  { topic: 'Thuê nhà trọ và làm quen với bạn cùng phòng', icon: '🏠', hsk: 2, genre: 'dialogue' },
  { topic: 'Mùa thu Bắc Kinh và chuyến đi núi Hương Sơn', icon: '🍁', hsk: 2, genre: 'culture' },
  { topic: 'Đi nhà hàng gọi món lẩu Tứ Xuyên', icon: '🍲', hsk: 2, genre: 'dialogue' },
  { topic: 'Trải nghiệm mua hàng Taobao và săn sale', icon: '📦', hsk: 3, genre: 'story' },
  { topic: 'Lễ hội Trung Thu và truyền thuyết Hằng Nga', icon: '🏮', hsk: 3, genre: 'culture' },
  { topic: 'Phỏng vấn xin việc ở công ty công nghệ', icon: '💼', hsk: 3, genre: 'business' },
  { topic: 'Đi khám bệnh tại bệnh viện Đông Y', icon: '🩺', hsk: 3, genre: 'dialogue' },
  { topic: 'Thành ngữ: Vẽ rắn thêm chân (画蛇添足)', icon: '📜', hsk: 4, genre: 'fable' },
  { topic: 'Bảo vệ môi trường và lối sống xanh ở đô thị', icon: '🌿', hsk: 4, genre: 'news' },
  { topic: 'Văn hóa trà đạo và thưởng trà Trung Hoa', icon: '🍵', hsk: 4, genre: 'culture' },
  { topic: 'Trí tuệ nhân tạo và tương lai việc làm', icon: '🤖', hsk: 5, genre: 'news' },
  { topic: 'Ẩm thực Trung Hoa: Tám trường phái lớn', icon: '🥘', hsk: 5, genre: 'culture' },
  { topic: 'Thành ngữ: Ôm cây đợi thỏ (守株待兔)', icon: '🐇', hsk: 5, genre: 'fable' },
  { topic: 'Triết lý nhân sinh trong Đạo Đức Kinh của Lão Tử', icon: '☯️', hsk: 6, genre: 'culture' },
  { topic: 'Kinh tế số và sự chuyển mình của thương mại quốc tế', icon: '📈', hsk: 6, genre: 'business' },
];

// Built-in lessons are removed per user specification to avoid stale offline templates.
// Lessons are dynamically generated on-demand via AI with customized multi-method exercises.

export const HSKReadingStudio: React.FC<HSKReadingStudioProps> = ({
  onAskAiAboutStory,
  onSaveVocabToFlashcards,
  initialHskLevel = 1,
  userProfile,
}) => {
  // Generation & Setup State
  const [selectedHsk, setSelectedHsk] = useState<number>(initialHskLevel);
  const [selectedGenre, setSelectedGenre] = useState<string>('story');
  const [activeInputMode, setActiveInputMode] = useState<'topic' | 'custom_text' | 'library'>('topic');
  const [customTopic, setCustomTopic] = useState('');
  const [customTextInput, setCustomTextInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Active Lesson State (null by default; generated dynamically on-demand)
  const [currentLesson, setCurrentLesson] = useState<HSKStoryLesson | null>(null);
  const [savedLessons, setSavedLessons] = useState<HSKStoryLesson[]>([]);

  // Reading Options
  const [viewLayout, setViewLayout] = useState<'paragraph' | 'sentence'>('paragraph');
  const [showPinyin, setShowPinyin] = useState(true);
  const [showVietnamese, setShowVietnamese] = useState(true);
  const [showHanViet, setShowHanViet] = useState(true);
  const [fontSizeLevel, setFontSizeLevel] = useState<'normal' | 'large' | 'xlarge'>('normal');

  // Audio Playback
  const [isPlayingFullStory, setIsPlayingFullStory] = useState(false);
  const [activePlayingSentenceIdx, setActivePlayingSentenceIdx] = useState<number | null>(null);
  const [playbackRate, setPlaybackRate] = useState<number>(0.85);

  // Quiz Interaction State
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [checkedQuiz, setCheckedQuiz] = useState(false);
  const [savedVocabIds, setSavedVocabIds] = useState<Set<string>>(new Set());
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // User-isolated storage key: each user account has completely isolated saved stories
  const userIdentifier = userProfile?.email || userProfile?.id;
  const userSpecificKey = userIdentifier
    ? `minnese_saved_hsk_stories_v3_${userIdentifier.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}`
    : STORAGE_SAVED_STORIES_KEY;

  // Cloud Firestore sync helper
  const syncStoriesToCloud = async (updatedStories: HSKStoryLesson[]) => {
    if (!userProfile?.id) return;
    try {
      await setDoc(
        doc(db, 'users', userProfile.id),
        {
          saved_hsk_stories: updatedStories,
          saved_hsk_stories_updated_at: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Could not sync stories to cloud:', err);
    }
  };

  // Load Saved Lessons strictly isolated for this user (with Cloud Firestore backup)
  useEffect(() => {
    let isMounted = true;
    try {
      let localStories: HSKStoryLesson[] = [];
      let raw = localStorage.getItem(userSpecificKey);
      // Migration: If user key is empty, check legacy default key once and isolate it
      if (!raw && userSpecificKey !== STORAGE_SAVED_STORIES_KEY) {
        const legacyRaw = localStorage.getItem(STORAGE_SAVED_STORIES_KEY);
        if (legacyRaw) {
          raw = legacyRaw;
          localStorage.setItem(userSpecificKey, legacyRaw);
        }
      }

      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          localStories = parsed;
          setSavedLessons(parsed);
        } else {
          setSavedLessons([]);
        }
      } else {
        setSavedLessons([]);
      }

      // Cloud sync from Firestore if user is authenticated
      if (userProfile?.id) {
        getDoc(doc(db, 'users', userProfile.id))
          .then((snap) => {
            if (!isMounted || !snap.exists()) return;
            const data = snap.data();
            const cloudStories: HSKStoryLesson[] = Array.isArray(data?.saved_hsk_stories)
              ? data.saved_hsk_stories
              : [];
            if (cloudStories.length > 0) {
              const combinedMap = new Map<string, HSKStoryLesson>();
              cloudStories.forEach((s) => {
                if (s?.title) combinedMap.set(s.title, s);
              });
              localStories.forEach((s) => {
                if (s?.title) combinedMap.set(s.title, s);
              });
              const merged = Array.from(combinedMap.values()).slice(0, 30);
              setSavedLessons(merged);
              try {
                localStorage.setItem(userSpecificKey, JSON.stringify(merged));
              } catch {
                // Ignore
              }
            } else if (localStories.length > 0) {
              syncStoriesToCloud(localStories);
            }
          })
          .catch((err) => {
            console.warn('Failed to load cloud stories:', err);
          });
      }
    } catch {
      // Ignore
    }
    return () => {
      isMounted = false;
    };
  }, [userSpecificKey, userProfile?.id]);

  // Delete a saved lesson from user's personal library
  const handleDeleteSavedLesson = (e: React.MouseEvent, lessonTitle: string) => {
    e.stopPropagation();
    setSavedLessons((prev) => {
      const updated = prev.filter((p) => p.title !== lessonTitle);
      try {
        localStorage.setItem(userSpecificKey, JSON.stringify(updated));
      } catch {
        // Ignore
      }
      syncStoriesToCloud(updated);
      return updated;
    });
    showToast('🗑️ Đã xóa bài đọc khỏi thư viện cá nhân!');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Handle switching HSK level: properly reset topic input, custom text, quiz answers, and audio
  const handleSwitchHskLevel = (lvl: number) => {
    if (selectedHsk === lvl) return;

    // 1. Reset user input states so topic from another HSK level doesn't persist
    setCustomTopic('');
    setCustomTextInput('');

    // 2. Stop any active audio playback
    stopChineseAudio();
    setIsPlayingFullStory(false);
    setActivePlayingSentenceIdx(null);

    // 3. Reset quiz answers & evaluation state
    setUserAnswers({});
    setCheckedQuiz(false);

    // 4. Update selected HSK level
    setSelectedHsk(lvl);

    // 5. Reset current lesson so learner generates fresh story for the new HSK level
    setCurrentLesson(null);
  };

  // Synchronize when initialHskLevel prop changes
  useEffect(() => {
    if (initialHskLevel && initialHskLevel !== selectedHsk) {
      handleSwitchHskLevel(initialHskLevel);
    }
  }, [initialHskLevel]);

  // Generate / Decode Story via Server API
  const handleGenerateStory = async (topicToUse?: string, forcedLevel?: number, genreToUse?: string) => {
    const targetLevel = forcedLevel || selectedHsk;
    const targetTopic = (topicToUse !== undefined ? topicToUse : customTopic).trim() || 'Cuộc sống thường ngày';
    const targetGenre = genreToUse || selectedGenre;

    setIsGenerating(true);
    stopChineseAudio();
    setIsPlayingFullStory(false);
    setActivePlayingSentenceIdx(null);
    setUserAnswers({});
    setCheckedQuiz(false);

    try {
      const res = await fetch('/api/gemini/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: targetTopic,
          hskLevel: targetLevel,
          genre: targetGenre,
          customText: activeInputMode === 'custom_text' ? customTextInput.trim() : '',
        }),
      });

      if (res.ok) {
        const lessonData: HSKStoryLesson = await res.json();
        const fullLesson: HSKStoryLesson = {
          ...lessonData,
          id: `story-${Date.now()}`,
          createdAt: new Date().toISOString(),
        };

        setCurrentLesson(fullLesson);

        // Save to History / Library
        setSavedLessons((prev) => {
          const updated = [fullLesson, ...prev.filter((p) => p.title !== fullLesson.title)].slice(0, 30);
          try {
            localStorage.setItem(userSpecificKey, JSON.stringify(updated));
          } catch {
            // Ignore
          }
          syncStoriesToCloud(updated);
          return updated;
        });

        showToast('🎉 Đã tạo bài đọc hiểu HSK thành công!');
      } else {
        const errJson = await res.json().catch(() => ({}));
        showToast(`❌ Không thể tạo bài đọc: ${errJson.error || 'Vui lòng kiểm tra lại chủ đề hoặc thử lại!'}`);
      }
    } catch (e: any) {
      console.warn('Failed to generate story:', e);
      showToast('❌ Lỗi kết nối mạng khi tạo bài đọc. Vui lòng thử lại!');
    } finally {
      setIsGenerating(false);
    }
  };

  // Play Full Story Audio
  const handlePlayFullStory = async () => {
    if (!currentLesson) return;

    if (isPlayingFullStory) {
      stopChineseAudio();
      setIsPlayingFullStory(false);
      setActivePlayingSentenceIdx(null);
      return;
    }

    stopChineseAudio();
    setIsPlayingFullStory(true);

    if (currentLesson.sentences && currentLesson.sentences.length > 0) {
      for (let i = 0; i < currentLesson.sentences.length; i++) {
        setActivePlayingSentenceIdx(i);
        await playChineseAudio(currentLesson.sentences[i].hanzi, playbackRate);
        await new Promise((r) => setTimeout(r, 450));
      }
    } else {
      await playChineseAudio(currentLesson.storyChinese, playbackRate);
    }

    setIsPlayingFullStory(false);
    setActivePlayingSentenceIdx(null);
  };

  // Play Single Sentence
  const handlePlaySentence = async (idx: number, hanzi: string) => {
    stopChineseAudio();
    setIsPlayingFullStory(false);
    setActivePlayingSentenceIdx(idx);
    await playChineseAudio(hanzi, playbackRate);
    setActivePlayingSentenceIdx(null);
  };

  // Copy Full Reading to Clipboard
  const handleCopyStory = () => {
    if (!currentLesson) return;
    const textToCopy = `【${currentLesson.title}】(${currentLesson.titlePinyin}) - ${currentLesson.titleVietnamese}\n[HSK ${currentLesson.hskLevel}]\n\n--- Toàn văn chữ Hán ---\n${currentLesson.storyChinese}\n\n--- Phiên âm Pinyin ---\n${currentLesson.pinyin}\n\n--- Dịch nghĩa tiếng Việt ---\n${currentLesson.vietnameseTranslation}\n\n--- Sinh trích xuất bởi Minnie AI HSK Studio ---`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedSuccess(true);
    showToast('📋 Đã sao chép toàn bộ bài đọc vào Clipboard!');
    setTimeout(() => setCopiedSuccess(false), 2500);
  };

  // Save Vocab to Flashcard
  const handleAddVocab = (vocab: HSKStoryVocabulary) => {
    setSavedVocabIds((prev) => new Set([...prev, vocab.hanzi]));
    if (onSaveVocabToFlashcards) {
      onSaveVocabToFlashcards(vocab);
    }
    showToast(`✨ Đã thêm từ "${vocab.hanzi}" (${vocab.pinyin}) vào Flashcards!`);
  };

  // Calculate Quiz Score
  const totalQuestions = currentLesson?.questions?.length || 0;
  const correctCount = currentLesson?.questions
    ? Object.entries(userAnswers).filter(([qId, ans]) => {
        const q = currentLesson.questions.find((item) => item.id === qId);
        return q && q.correctAnswer.startsWith(ans);
      }).length
    : 0;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-fade-in pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-xs font-semibold shadow-xl border border-white/20 animate-fade-in flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-5 sm:p-6 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-black text-[var(--color-text-primary)]">
                  Phòng Luyện Đọc Hiểu & Tạo Bài Đọc HSK AI
                </h1>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Tự động dệt bài đọc chuẩn mực phân cấp HSK 1 - 6 kèm Pinyin, dịch nghĩa, bóc tách từng câu & trắc nghiệm.
                </p>
              </div>
            </div>
          </div>

          {/* Quick HSK Level Selector */}
          <div className="flex items-center gap-1.5 bg-[var(--color-background)] p-1 rounded-2xl border border-[var(--color-border)] self-start md:self-auto">
            {[1, 2, 3, 4, 5, 6].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => handleSwitchHskLevel(lvl)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedHsk === lvl
                    ? 'bg-[var(--color-primary)] text-white shadow-sm'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]'
                }`}
              >
                HSK {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Mode Switch Tabs */}
        <div className="mt-5 pt-4 border-t border-[var(--color-border)]/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveInputMode('topic')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeInputMode === 'topic'
                  ? 'bg-amber-500/15 border border-amber-500/40 text-amber-700 dark:text-amber-300 font-bold shadow-sm'
                  : 'bg-[var(--color-background)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)]/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Tạo theo chủ đề & Thể loại</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveInputMode('custom_text')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeInputMode === 'custom_text'
                  ? 'bg-blue-500/15 border border-blue-500/40 text-blue-700 dark:text-blue-300 font-bold shadow-sm'
                  : 'bg-[var(--color-background)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)]/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-blue-500" />
              <span>Bẻ khóa đoạn văn có sẵn</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveInputMode('library')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeInputMode === 'library'
                  ? 'bg-purple-500/15 border border-purple-500/40 text-purple-700 dark:text-purple-300 font-bold shadow-sm'
                  : 'bg-[var(--color-background)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)]/60'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5 text-purple-500" />
              <span>Thư viện cá nhân ({savedLessons.length})</span>
            </button>
          </div>

          {/* Genre selector when in topic mode */}
          {activeInputMode === 'topic' && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[var(--color-text-secondary)] font-medium">Thể loại:</span>
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs text-[var(--color-text-primary)] font-medium focus:outline-hidden focus:border-amber-500 cursor-pointer"
              >
                <option value="story">🏡 Câu chuyện đời sống (生活故事)</option>
                <option value="dialogue">💬 Hội thoại thường nhật (日常对话)</option>
                <option value="culture">🏮 Văn hóa & Phong tục (文化习俗)</option>
                <option value="news">📰 Bản tin ngắn (简短新闻)</option>
                <option value="fable">📜 Ngụ ngôn & Điển tích (寓言故事)</option>
                <option value="business">💼 Công sở & Phỏng vấn (职场商务)</option>
              </select>
            </div>
          )}
        </div>

        {/* Mode 1: Topic Input Form */}
        {activeInputMode === 'topic' && (
          <div className="mt-3 space-y-2.5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleGenerateStory(customTopic, selectedHsk, selectedGenre);
              }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder={`Nhập chủ đề muốn đọc HSK ${selectedHsk} (VD: Đi uống trà sữa, Học đường, Du lịch, Mua sắm Taobao, Phỏng vấn...)...`}
                  className="w-full pr-9 px-4 py-2.5 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs sm:text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-hidden focus:border-amber-500 shadow-inner"
                />
                {customTopic && (
                  <button
                    type="button"
                    onClick={() => setCustomTopic('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 cursor-pointer transition-colors"
                    title="Xóa nội dung chủ đề"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={isGenerating}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer transition-all shrink-0"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isGenerating ? 'Đang tạo bài đọc...' : `Tạo bài đọc HSK ${selectedHsk}`}</span>
              </button>
            </form>

            {/* Quick Topic Suggestion Chips for Current HSK Level */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-[var(--color-text-secondary)] font-medium flex items-center gap-1 mr-1">
                <Compass className="w-3 h-3 text-amber-500" />
                Gợi ý chủ đề HSK {selectedHsk}:
              </span>
              {SAMPLE_TOPICS.filter((t) => t.hsk === selectedHsk).map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCustomTopic(s.topic)}
                  className={`text-[11px] px-2.5 py-1 rounded-xl border transition-all cursor-pointer flex items-center gap-1 ${
                    customTopic === s.topic
                      ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/50 font-semibold'
                      : 'bg-[var(--color-background)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border-[var(--color-border)] hover:border-amber-500/40'
                  }`}
                >
                  <span>{s.icon}</span>
                  <span>{s.topic}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mode 2: Custom Text Decoder */}
        {activeInputMode === 'custom_text' && (
          <div className="mt-4 space-y-3">
            <textarea
              rows={4}
              value={customTextInput}
              onChange={(e) => setCustomTextInput(e.target.value)}
              placeholder="Dán bất kỳ đoạn văn tiếng Trung nào (Báo chí, mạng xã hội, giáo trình, đề thi...) vào đây. AI sẽ sinh Pinyin chuẩn, dịch nghĩa tiếng Việt, bóc tách từng câu, rút từ vựng HSK và tạo bài tập đọc hiểu..."
              className="w-full p-4 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs sm:text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-hidden focus:border-blue-500 shadow-inner resize-none font-sans"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => handleGenerateStory()}
                disabled={!customTextInput.trim() || isGenerating}
                className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-40 cursor-pointer transition-all"
              >
                <FileText className="w-4 h-4" />
                <span>{isGenerating ? 'Đang bẻ khóa đoạn văn...' : 'Phân tích & Bẻ khóa bài đọc'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Mode 3: Saved Library */}
        {activeInputMode === 'library' && (
          <div className="mt-4">
            {savedLessons.length === 0 ? (
              <div className="text-center py-6 text-xs text-[var(--color-text-secondary)] bg-[var(--color-background)] rounded-2xl border border-dashed border-[var(--color-border)]">
                Bạn chưa lưu bài đọc nào. Hãy bấm nút <span className="font-semibold text-amber-500">"Lưu bài đọc"</span> ở bài đọc hiện tại để xem lại bất cứ lúc nào!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {savedLessons.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    onClick={() => {
                      stopChineseAudio();
                      setIsPlayingFullStory(false);
                      setActivePlayingSentenceIdx(null);
                      setCustomTopic('');
                      setCustomTextInput('');
                      setUserAnswers({});
                      setCheckedQuiz(false);
                      setCurrentLesson(item);
                      setSelectedHsk(item.hskLevel);
                      showToast(`Đã mở bài: ${item.title}`);
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      currentLesson?.title === item.title
                        ? 'bg-[var(--color-primary-light)]/30 border-[var(--color-primary)] shadow-sm'
                        : 'bg-[var(--color-background)] border-[var(--color-border)] hover:border-[var(--color-primary)]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-mono font-bold border border-amber-500/20">
                        HSK {item.hskLevel}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-[var(--color-text-secondary)] font-mono">
                          {item.sentences?.length || 0} câu
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteSavedLesson(e, item.title)}
                          title="Xóa bài đọc này khỏi thư viện cá nhân"
                          className="p-1 rounded-md text-[var(--color-text-secondary)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <h4 className="text-sm font-bold text-[var(--color-text-primary)] truncate font-serif">
                      {item.title}
                    </h4>
                    <p className="text-xs text-[var(--color-text-secondary)] truncate">
                      {item.titleVietnamese}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Loading state animation */}
      {isGenerating ? (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-10 shadow-sm flex flex-col items-center justify-center min-h-[360px]">
          <CartoonLoader
            type="panda_study"
            layout="card"
            message={`Đang dệt bài đọc chuẩn mực HSK ${selectedHsk}...`}
            subMessage="Gia sư AI đang tính toán độ phức tạp ngữ pháp, chuẩn hóa Pinyin và soạn bộ câu hỏi đọc hiểu đa dạng."
          />
        </div>
      ) : !currentLesson ? (
        /* Empty / Prompt-to-generate state when no story is loaded yet */
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-8 sm:p-12 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-sm">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="max-w-xl mx-auto space-y-2">
            <h3 className="text-xl sm:text-2xl font-black text-[var(--color-text-primary)]">
              Sẵn sàng học bài đọc chuẩn HSK {selectedHsk}
            </h3>
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
              Nhập chủ đề bạn yêu thích, chọn gợi ý nhanh bên trên hoặc dán đoạn văn bản cần phân tích. Minnie AI sẽ tự động tạo bài đọc chuẩn cấp độ, trích xuất từ vựng, điểm ngữ pháp then chốt và tạo hệ thống bài tập đọc hiểu đa phương pháp (Đúng/Sai, Điền từ ngữ pháp, Chi tiết, Từ vựng, Suy luận) giúp bạn nắm chắc kiến thức!
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleGenerateStory()}
              className="px-6 py-3.5 rounded-2xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Tạo bài đọc HSK {selectedHsk} ngay</span>
            </button>
            {savedLessons.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveInputMode('library')}
                className="px-5 py-3.5 rounded-2xl bg-[var(--color-background)] hover:bg-[var(--color-border)]/40 border border-[var(--color-border)] text-[var(--color-text-secondary)] text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer"
              >
                <History className="w-4 h-4" />
                <span>Xem bài đọc cá nhân đã lưu ({savedLessons.length})</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Reading Canvas & Interactive Studio */
        <div className="space-y-6">
          {/* Main Reading Card */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            {/* Title & Metadata */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border)]/70 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-xs font-black border border-amber-500/30">
                    Chuẩn HSK {currentLesson.hskLevel}
                  </span>
                  {currentLesson.genre && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[var(--color-background)] text-[var(--color-text-secondary)] text-[11px] font-medium border border-[var(--color-border)]">
                      {currentLesson.genre === 'story'
                        ? 'Câu chuyện'
                        : currentLesson.genre === 'dialogue'
                        ? 'Hội thoại'
                        : currentLesson.genre === 'culture'
                        ? 'Văn hóa'
                        : currentLesson.genre === 'news'
                        ? 'Bản tin'
                        : 'Văn bản HSK'}
                    </span>
                  )}
                  <span className="text-xs text-[var(--color-text-secondary)] font-mono">
                    ~{currentLesson.storyChinese?.length || 0} chữ Hán
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-[var(--color-text-primary)] font-serif tracking-wide pt-1">
                  {currentLesson.title}
                </h2>
                {showPinyin && (
                  <p className="text-xs sm:text-sm text-amber-600 dark:text-amber-400 font-mono">
                    {currentLesson.titlePinyin}
                  </p>
                )}
                {showVietnamese && (
                  <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] font-medium">
                    {currentLesson.titleVietnamese}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-start sm:self-center">
                <button
                  type="button"
                  onClick={handleCopyStory}
                  className="p-2.5 rounded-xl bg-[var(--color-background)] hover:bg-[var(--color-border)]/40 border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all cursor-pointer"
                  title="Sao chép toàn văn bài đọc"
                >
                  {copiedSuccess ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>

                {onAskAiAboutStory && (
                  <button
                    type="button"
                    onClick={() => {
                      onAskAiAboutStory(
                        `Tôi đang đọc bài đọc HSK ${currentLesson.hskLevel}: "${currentLesson.title}" (${currentLesson.titleVietnamese}). Hãy phân tích chi tiết ngữ pháp và cách dùng từ trong bài này giúp tôi nhé!`
                      );
                    }}
                    className="px-3.5 py-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-700 dark:text-purple-300 hover:bg-purple-500/25 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-purple-500" />
                    <span>Hỏi AI về bài này</span>
                  </button>
                )}
              </div>
            </div>

            {/* Smart Reading Toolbar */}
            <div className="bg-[var(--color-background)] rounded-2xl p-3 border border-[var(--color-border)] flex flex-wrap items-center justify-between gap-3">
              {/* Audio Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePlayFullStory}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer ${
                    isPlayingFullStory
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]'
                  }`}
                >
                  {isPlayingFullStory ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isPlayingFullStory ? 'Đang đọc toàn bài...' : 'Nghe toàn bài (Audio)'}</span>
                </button>

                <div className="flex items-center gap-1 bg-[var(--color-surface)] px-2 py-1 rounded-xl border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)] font-mono">
                  <span>Tốc độ:</span>
                  <select
                    value={playbackRate}
                    onChange={(e) => setPlaybackRate(Number(e.target.value))}
                    className="bg-transparent text-[var(--color-text-primary)] font-bold focus:outline-hidden cursor-pointer"
                  >
                    <option value={0.75}>0.75x (Chậm)</option>
                    <option value={0.85}>0.85x (Vừa)</option>
                    <option value={1.0}>1.0x (Chuẩn)</option>
                    <option value={1.15}>1.15x (Nhanh)</option>
                  </select>
                </div>
              </div>

              {/* View Switches */}
              <div className="flex items-center gap-1.5">
                {/* Paragraph vs Sentence Layout */}
                <div className="flex items-center bg-[var(--color-surface)] p-1 rounded-xl border border-[var(--color-border)]">
                  <button
                    type="button"
                    onClick={() => setViewLayout('paragraph')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      viewLayout === 'paragraph'
                        ? 'bg-[var(--color-primary)] text-white shadow-xs'
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    Đoạn văn
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewLayout('sentence')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      viewLayout === 'sentence'
                        ? 'bg-[var(--color-primary)] text-white shadow-xs'
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    Từng câu
                  </button>
                </div>

                {/* Toggle Pinyin */}
                <button
                  type="button"
                  onClick={() => setShowPinyin(!showPinyin)}
                  className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    showPinyin
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300'
                      : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)]'
                  }`}
                  title={showPinyin ? 'Ẩn phiên âm Pinyin' : 'Hiện phiên âm Pinyin'}
                >
                  Pinyin
                </button>

                {/* Toggle Vietnamese */}
                <button
                  type="button"
                  onClick={() => setShowVietnamese(!showVietnamese)}
                  className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    showVietnamese
                      ? 'bg-blue-500/15 border-blue-500/40 text-blue-700 dark:text-blue-300'
                      : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)]'
                  }`}
                  title={showVietnamese ? 'Ẩn bản dịch tiếng Việt' : 'Hiện bản dịch tiếng Việt'}
                >
                  Dịch nghĩa
                </button>

                {/* Font Size Selector */}
                <div className="flex items-center bg-[var(--color-surface)] p-1 rounded-xl border border-[var(--color-border)] text-xs">
                  <button
                    type="button"
                    onClick={() => setFontSizeLevel('normal')}
                    className={`px-2 py-0.5 rounded font-bold ${fontSizeLevel === 'normal' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-secondary)]'}`}
                  >
                    A
                  </button>
                  <button
                    type="button"
                    onClick={() => setFontSizeLevel('large')}
                    className={`px-2 py-0.5 rounded font-bold ${fontSizeLevel === 'large' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-secondary)]'}`}
                  >
                    A+
                  </button>
                  <button
                    type="button"
                    onClick={() => setFontSizeLevel('xlarge')}
                    className={`px-2 py-0.5 rounded font-bold ${fontSizeLevel === 'xlarge' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-secondary)]'}`}
                  >
                    A++
                  </button>
                </div>
              </div>
            </div>

            {/* Reading Content Area */}
            {viewLayout === 'paragraph' ? (
              /* Paragraph Layout */
              <div className="space-y-4">
                <div
                  className={`leading-loose tracking-wide text-[var(--color-text-primary)] font-serif ${
                    fontSizeLevel === 'normal'
                      ? 'text-lg sm:text-xl'
                      : fontSizeLevel === 'large'
                      ? 'text-xl sm:text-2xl'
                      : 'text-2xl sm:text-3xl'
                  }`}
                >
                  {currentLesson.storyChinese}
                </div>

                {showPinyin && (
                  <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-xs sm:text-sm font-mono text-amber-700 dark:text-amber-300 leading-relaxed">
                    <span className="font-bold block mb-1 text-[11px] uppercase tracking-wider text-amber-600">
                      Phiên âm Pinyin toàn văn:
                    </span>
                    {currentLesson.pinyin}
                  </div>
                )}

                {showVietnamese && (
                  <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
                    <span className="font-bold block mb-1 text-[11px] uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      Bản dịch tiếng Việt trọn vẹn:
                    </span>
                    {currentLesson.vietnameseTranslation}
                  </div>
                )}
              </div>
            ) : (
              /* Sentence by Sentence Breakdown */
              <div className="space-y-3">
                {currentLesson.sentences?.map((sentence, idx) => {
                  const isActive = activePlayingSentenceIdx === idx;
                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border transition-all ${
                        isActive
                          ? 'bg-[var(--color-primary-light)]/40 border-[var(--color-primary)] shadow-md scale-[1.01]'
                          : 'bg-[var(--color-background)] border-[var(--color-border)] hover:border-[var(--color-primary)]/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[10px] font-mono font-bold flex items-center justify-center text-[var(--color-text-secondary)]">
                              {idx + 1}
                            </span>
                            <span
                              className={`font-serif font-medium text-[var(--color-text-primary)] ${
                                fontSizeLevel === 'normal'
                                  ? 'text-lg sm:text-xl'
                                  : fontSizeLevel === 'large'
                                  ? 'text-xl sm:text-2xl'
                                  : 'text-2xl sm:text-3xl'
                              }`}
                            >
                              {sentence.hanzi}
                            </span>
                          </div>

                          {showPinyin && (
                            <p className="text-xs sm:text-sm text-amber-600 dark:text-amber-400 font-mono pl-7">
                              {sentence.pinyin}
                            </p>
                          )}

                          {showVietnamese && (
                            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] pl-7">
                              {sentence.vietnamese}
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handlePlaySentence(idx, sentence.hanzi)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
                            isActive
                              ? 'bg-[var(--color-primary)] text-white shadow-xs'
                              : 'bg-[var(--color-surface)] hover:bg-[var(--color-border)]/40 border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                          }`}
                          title="Nghe phát âm câu này"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Key Vocabulary Table */}
          {currentLesson.keyVocabulary && currentLesson.keyVocabulary.length > 0 && (
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-green-500/15 border border-green-500/30 text-green-600 dark:text-green-400 flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                      Sổ Từ Vựng Trọng Tâm (核心生词)
                    </h3>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      Các từ vựng cốt lõi xuất hiện trong bài đọc kèm phiên âm, Hán Việt và nghĩa.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono text-[var(--color-text-secondary)]">
                  {currentLesson.keyVocabulary.length} từ vựng
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                {currentLesson.keyVocabulary.map((vocab, i) => {
                  const isSaved = savedVocabIds.has(vocab.hanzi);
                  return (
                    <div
                      key={i}
                      className="p-3.5 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] hover:border-green-500/40 transition-all flex flex-col justify-between gap-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold font-serif text-[var(--color-text-primary)]">
                              {vocab.hanzi}
                            </span>
                            <span className="text-xs text-amber-600 dark:text-amber-400 font-mono font-semibold">
                              {vocab.pinyin}
                            </span>
                          </div>
                          {vocab.hanViet && (
                            <span className="text-[11px] text-purple-600 dark:text-purple-400 font-mono font-medium block">
                              [{vocab.hanViet}]
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => playChineseAudio(vocab.hanzi)}
                          className="p-1.5 rounded-lg hover:bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
                          title="Nghe phát âm từ"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="border-t border-[var(--color-border)]/60 pt-2 flex items-center justify-between gap-2">
                        <div className="text-xs text-[var(--color-text-secondary)] truncate">
                          {vocab.partOfSpeech && (
                            <span className="font-semibold text-gray-500 dark:text-gray-400 mr-1">
                              ({vocab.partOfSpeech})
                            </span>
                          )}
                          <span>{vocab.vietnamese}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddVocab(vocab)}
                          className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                            isSaved
                              ? 'bg-green-500/20 text-green-700 dark:text-green-300'
                              : 'bg-[var(--color-surface)] hover:bg-green-500/15 text-[var(--color-text-secondary)] hover:text-green-600'
                          }`}
                          title="Lưu vào Flashcards ôn tập"
                        >
                          {isSaved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Grammar Highlights */}
          {currentLesson.grammarHighlights && currentLesson.grammarHighlights.length > 0 && (
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                    Điểm Ngữ Pháp Tiêu Biểu (语法要点)
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Các cấu trúc câu xuất hiện trong bài đọc cần nắm vững.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {currentLesson.grammarHighlights.map((g, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] space-y-2"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold font-mono text-purple-600 dark:text-purple-400">
                      <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                      <span>{g.structure}</span>
                    </div>
                    <p className="text-xs text-[var(--color-text-primary)] leading-relaxed">
                      {g.explanation}
                    </p>
                    {g.example && (
                      <div className="p-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)] font-serif italic">
                        💡 {g.example}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interactive Comprehension Quiz */}
          {/* Comprehensive Multi-Method Reading Comprehension Practice */}
          {currentLesson.questions && currentLesson.questions.length > 0 && (
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              {/* Practice Header & Method Overview */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border)]/70 pb-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-xs">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-base sm:text-lg font-black text-[var(--color-text-primary)] flex items-center gap-2">
                      <span>Luyện Tập Đọc Hiểu Chuyên Sâu</span>
                      <span className="text-xs font-normal text-[var(--color-text-secondary)] font-mono">
                        (阅读理解多维训练)
                      </span>
                    </h3>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      Hệ thống câu hỏi xoáy sâu vào các phương pháp: Đúng/Sai, Điền từ ngữ pháp, Chi tiết thực tế, Nghĩa từ vựng và Suy luận ý chính.
                    </p>
                  </div>
                </div>

                {checkedQuiz && (
                  <div className="flex items-center gap-2 self-start sm:self-center px-4 py-2 rounded-2xl bg-blue-500/15 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-500/30 shadow-xs">
                    <Award className="w-4 h-4" />
                    <span>Kết quả: {correctCount}/{totalQuestions} ({Math.round((correctCount / totalQuestions) * 100)}%)</span>
                  </div>
                )}
              </div>

              {/* Quiz Results Assessment Banner when Checked */}
              {checkedQuiz && (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                      <span>
                        {correctCount === totalQuestions
                          ? '🏆 Xuất sắc tuyệt đối!'
                          : correctCount >= totalQuestions * 0.6
                          ? '👍 Đạt chuẩn đọc hiểu tốt!'
                          : '💪 Cần xem lại bài đọc và dẫn chứng!'}
                      </span>
                    </h4>
                    <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                      {correctCount === totalQuestions
                        ? 'Bạn đã giải mã chính xác 100% các câu hỏi từ chi tiết, từ vựng đến cấu trúc ngữ pháp bài đọc HSK này.'
                        : correctCount >= totalQuestions * 0.6
                        ? 'Bạn đã nắm chắc các trọng tâm chính của bài. Hãy đọc kỹ phần dẫn chứng giải thích bên dưới để khắc phục các lỗi sai.'
                        : 'Hãy đối chiếu từng câu với văn bản bài đọc và xem kỹ phần giải thích chi tiết của AI bên dưới để củng cố kiến thức.'}
                    </p>
                  </div>
                  {onAskAiAboutStory && (
                    <button
                      type="button"
                      onClick={() =>
                        onAskAiAboutStory(
                          `Tôi vừa làm bài tập đọc hiểu bài "${currentLesson.title}" đạt ${correctCount}/${totalQuestions} câu đúng. Bạn hãy phân tích giúp tôi các trọng tâm kiến thức trong bài tập này nhé!`
                        )
                      }
                      className="px-4 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold hover:bg-[var(--color-primary-dark)] transition-all shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Hỏi thêm gia sư AI</span>
                    </button>
                  )}
                </div>
              )}

              {/* Questions List with Specialized Question Methods */}
              <div className="space-y-5 pt-1">
                {currentLesson.questions.map((q, qIdx) => {
                  const selected = userAnswers[q.id];
                  const isCorrect = selected && q.correctAnswer.startsWith(selected);

                  // Determine method presentation
                  const methodType = q.type || 'detail';
                  const methodConfig = {
                    true_false: {
                      name: 'Phán đoán Đúng / Sai',
                      badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
                      icon: '⚖️',
                      guide: 'Nhận định dưới đây Đúng (A) hay Sai (B) so với nội dung bài đọc?',
                    },
                    cloze_grammar: {
                      name: 'Vận dụng Ngữ pháp & Điền từ',
                      badge: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30',
                      icon: '🧩',
                      guide: 'Chọn từ hoặc cấu trúc ngữ pháp thích hợp nhất để điền vào chỗ trống:',
                    },
                    vocabulary: {
                      name: 'Hiểu Từ vựng trong Ngữ cảnh',
                      badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
                      icon: '📖',
                      guide: 'Xác định nghĩa chuẩn xác của từ vựng then chốt trong ngữ cảnh bài văn:',
                    },
                    inference: {
                      name: 'Suy luận Ý chính & Đạo lý',
                      badge: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
                      icon: '💡',
                      guide: 'Căn cứ vào bài viết, câu nào dưới đây là suy luận hoặc bài học hợp lý nhất?',
                    },
                    detail: {
                      name: 'Bắt Chi tiết & Dữ kiện Cốt lõi',
                      badge: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
                      icon: '🔍',
                      guide: 'Tìm thông tin hoặc sự kiện thực tế được đề cập trong bài:',
                    },
                  }[methodType] || {
                    name: 'Kiểm tra Đọc hiểu',
                    badge: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
                    icon: '📝',
                    guide: 'Chọn đáp án đúng nhất căn cứ vào nội dung bài đọc:',
                  };

                  return (
                    <div
                      key={q.id || qIdx}
                      className={`p-5 sm:p-6 rounded-2xl bg-[var(--color-background)] border transition-all space-y-4 ${
                        checkedQuiz
                          ? isCorrect
                            ? 'border-green-500/40 shadow-xs'
                            : selected
                            ? 'border-red-500/40 shadow-xs'
                            : 'border-[var(--color-border)]'
                          : 'border-[var(--color-border)]'
                      }`}
                    >
                      {/* Method Header & Target Knowledge */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border)]/50 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-bold flex items-center justify-center text-[var(--color-text-secondary)] shrink-0">
                            {qIdx + 1}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1 ${methodConfig.badge}`}
                          >
                            <span>{methodConfig.icon}</span>
                            <span>{q.typeLabel || methodConfig.name}</span>
                          </span>
                        </div>

                        {q.targetKnowledge && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[var(--color-surface)] text-[var(--color-text-secondary)] text-[11px] font-medium border border-[var(--color-border)]">
                            <Target className="w-3 h-3 text-amber-500" />
                            <span>Trọng tâm: <strong className="text-[var(--color-text-primary)] font-semibold">{q.targetKnowledge}</strong></span>
                          </span>
                        )}
                      </div>

                      {/* Question Pinyin & Text */}
                      <div className="space-y-1 pl-1 sm:pl-2">
                        {q.pinyin && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 font-mono select-text">
                            {q.pinyin}
                          </p>
                        )}
                        <h4 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)] leading-relaxed">
                          {q.question}
                        </h4>
                      </div>

                      {/* Options Rendering */}
                      <div
                        className={
                          methodType === 'true_false'
                            ? 'grid grid-cols-1 sm:grid-cols-2 gap-2.5 pl-1 sm:pl-2'
                            : 'grid grid-cols-1 sm:grid-cols-2 gap-2 pl-1 sm:pl-2'
                        }
                      >
                        {q.options?.map((opt, optIdx) => {
                          const optKey = opt.trim().charAt(0).toUpperCase();
                          const isOptionSelected = selected === optKey;
                          const isOptionCorrect = q.correctAnswer.startsWith(optKey);

                          let buttonStyle =
                            'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-primary)]';

                          if (checkedQuiz) {
                            if (isOptionCorrect) {
                              buttonStyle =
                                'bg-green-500/20 border-green-500 text-green-700 dark:text-green-300 font-bold';
                            } else if (isOptionSelected && !isOptionCorrect) {
                              buttonStyle =
                                'bg-red-500/20 border-red-500 text-red-700 dark:text-red-300 line-through';
                            }
                          } else if (isOptionSelected) {
                            buttonStyle =
                              'bg-[var(--color-primary-light)] border-[var(--color-primary)] text-[var(--color-primary)] font-bold shadow-xs';
                          }

                          return (
                            <button
                              key={optIdx}
                              type="button"
                              onClick={() => {
                                setUserAnswers((prev) => ({ ...prev, [q.id]: optKey }));
                              }}
                              className={`p-3 sm:p-3.5 rounded-xl border text-xs sm:text-sm text-left transition-all cursor-pointer flex items-center justify-between ${buttonStyle}`}
                            >
                              <span className="leading-snug">{opt}</span>
                              {checkedQuiz && isOptionCorrect && (
                                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 ml-2" />
                              )}
                              {checkedQuiz && isOptionSelected && !isOptionCorrect && (
                                <XCircle className="w-4 h-4 text-red-500 shrink-0 ml-2" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Deep Pedagogical Explanation & Evidence */}
                      {checkedQuiz && (
                        <div className="ml-1 sm:ml-2 p-3.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs space-y-2 leading-relaxed">
                          <div className="flex items-center gap-2">
                            {isCorrect ? (
                              <span className="text-green-600 dark:text-green-400 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Chính xác!</span>
                              </span>
                            ) : (
                              <span className="text-red-500 font-bold flex items-center gap-1">
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Đáp án đúng: {q.correctAnswer}</span>
                              </span>
                            )}
                          </div>

                          {q.targetKnowledge && (
                            <div className="text-[11px] text-[var(--color-text-secondary)]">
                              <span className="font-semibold text-[var(--color-text-primary)]">🎯 Trọng tâm kiến thức: </span>
                              {q.targetKnowledge}
                            </div>
                          )}

                          {q.explanation && (
                            <div className="text-blue-700 dark:text-blue-300 pt-0.5">
                              <span className="font-bold">💡 Dẫn chứng & Phân tích chi tiết: </span>
                              {q.explanation}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Quiz Submit & Reset Bar */}
              <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border)]/60">
                <button
                  type="button"
                  onClick={() => {
                    setUserAnswers({});
                    setCheckedQuiz(false);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-background)] flex items-center gap-1.5 transition-colors cursor-pointer border border-transparent hover:border-[var(--color-border)]"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Làm lại bài tập</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCheckedQuiz(true)}
                  disabled={Object.keys(userAnswers).length === 0}
                  className="px-6 py-2.5 rounded-2xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-xs font-bold shadow-md hover:shadow-lg disabled:opacity-40 transition-all cursor-pointer flex items-center gap-2"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Chấm điểm bài đọc</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
