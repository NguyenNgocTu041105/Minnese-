import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Navbar, NavTab } from './components/Navbar';
import { DashboardView } from './components/Dashboard/DashboardView';
import { SRSCardState, UserStats, UserProfile, AssignmentDoc, AssignmentSubmissionDoc } from './types';
import { loadSRSCards, saveSRSCards } from './utils/srs';
import { evaluateRealtimeStreak, registerStudyActivityToday, getCalendarDayDiff } from './utils/streak';
import {
  logoutUser,
  auth,
  db,
  isUserAdmin,
  updateStudentInFirestore,
  subscribeAssignmentsFromFirestore,
  subscribeSubmissionsFromFirestore,
} from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import {
  LayoutDashboard,
  GraduationCap,
  Bot,
  Layers,
  BookOpen,
  HelpCircle,
  Settings,
  Mic,
  Sparkles,
} from 'lucide-react';

// Resilient lazy loader with automatic retry to prevent transient network/rate-limit errors
function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  retries = 3,
  interval = 800
): React.LazyExoticComponent<T> {
  return lazy(() => {
    return new Promise<{ default: T }>((resolve, reject) => {
      function attempt(left: number) {
        factory()
          .then(resolve)
          .catch((err) => {
            if (left <= 1) {
              reject(err);
            } else {
              setTimeout(() => attempt(left - 1), interval);
            }
          });
      }
      attempt(retries);
    });
  });
}

// Code-split heavy views so the initial page load stays fast and doesn't fire 200+ concurrent module requests
const CoursebookView = lazyWithRetry(() =>
  import('./components/Coursebook/CoursebookView').then((m) => ({ default: m.CoursebookView }))
);
const AITutorView = lazyWithRetry(() =>
  import('./components/AITutor/AITutorView').then((m) => ({ default: m.AITutorView }))
);
const FlashcardsView = lazyWithRetry(() =>
  import('./components/Flashcards/FlashcardsView').then((m) => ({ default: m.FlashcardsView }))
);
const DictionaryView = lazyWithRetry(() =>
  import('./components/Dictionary/DictionaryView').then((m) => ({ default: m.DictionaryView }))
);
const QuizzesView = lazyWithRetry(() =>
  import('./components/Quizzes/QuizzesView').then((m) => ({ default: m.QuizzesView }))
);
const AdminDashboard = lazyWithRetry(() =>
  import('./components/Admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
);
const JoinClassModal = lazyWithRetry(() =>
  import('./components/Dashboard/JoinClassModal').then((m) => ({ default: m.JoinClassModal }))
);
const AuthModal = lazyWithRetry(() =>
  import('./components/Auth/AuthModal').then((m) => ({ default: m.AuthModal }))
);
const LiveVoiceCallModal = lazyWithRetry(() =>
  import('./components/LiveVoiceCall/LiveVoiceCallModal').then((m) => ({ default: m.LiveVoiceCallModal }))
);

const STATS_STORAGE_KEY = 'minnese_user_stats_v2';
const PROFILE_STORAGE_KEY = 'minnese_user_profile_v2';
const THEME_STORAGE_KEY = 'minnese_theme_mode';

// Feature Flags for MVP Cost Optimization (Chi phí 0đ)
const ENABLE_LIVE_VOICE_CALL = false; // Tạm khóa Live Voice Call để tiết kiệm token

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') as NavTab | null;
      if (tabParam && ['dashboard', 'coursebook', 'tutor', 'flashcards', 'dictionary', 'quizzes', 'admin'].includes(tabParam)) {
        return tabParam;
      }
      if (params.get('exam') || params.get('code') || params.get('exam_code')) {
        return 'quizzes';
      }
    }
    return 'dashboard';
  });
  const [showVoiceCall, setShowVoiceCall] = useState(false);

  const handleOpenVoiceCall = () => {
    if (!ENABLE_LIVE_VOICE_CALL) {
      alert('Tính năng Luyện nói thoại trực tiếp 2 chiều (Live Voice Call) tạm thời được khóa trong giai đoạn MVP để tối ưu chi phí vận hành cho trung tâm. Tính năng sẽ được kích hoạt ở bản nâng cấp v2.0!');
      return;
    }
    setShowVoiceCall(true);
  };
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [showJoinClassModal, setShowJoinClassModal] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedFlashcardDeckId, setSelectedFlashcardDeckId] = useState<string | null>(null);

  // User Profile
  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: 'demo-user-123',
    email: 'demo@minnese.app',
    displayName: 'Nguyễn Văn An',
    role: 'user',
    current_level: 1,
    words_per_day: 10,
    streak_count: 5,
    last_study_date: new Date().toISOString(),
    exp_points: 320,
    badges: ['badge_streak_5', 'badge_first_quiz'],
    learner_persona: 'working_professional',
    streak_mode: 'weekdays_5',
    target_minutes_per_day: 15,
    streak_freezes_available: 2,
    streak_freeze_used_dates: [],
    focus_domain: 'Giao tiếp công sở & viết email',
  });

  const [srsCards, setSrsCards] = useState<Record<string, SRSCardState>>({});
  const [stats, setStats] = useState<UserStats>({
    xp: 320,
    dailyStreak: 5,
    lastActiveDate: new Date().toISOString(),
    cardsReviewedToday: 10,
    totalReviews: 42,
    quizzesCompleted: 4,
    quizAccuracy: 94,
    masteredWordsCount: 8,
    studyTimeMinutes: 45,
  });

  // Assignments state (synced with Firestore real-time)
  const [assignments, setAssignments] = useState<AssignmentDoc[]>([
    {
      id: 'assign-001',
      title: 'Bài tập tuần 1: Ôn tập 10 từ vựng cốt lõi HSK 1',
      description: 'Hoàn thành bài kiểm tra trắc nghiệm 5 câu và ôn tập các từ chào hỏi, giáo viên, học sinh.',
      target_type: 'level',
      hsk_level: 1,
      content_type: 'quiz',
      content_ref_id: 'quiz-hsk1-sample',
      due_date: new Date(Date.now() + 3 * 86400000).toISOString(),
      created_by: 'admin@minnese.app',
      created_at: new Date().toISOString(),
      is_active: true,
    },
  ]);
  const [submissions, setSubmissions] = useState<AssignmentSubmissionDoc[]>([]);

  // Subscribe to real-time assignments and submissions from Firestore
  useEffect(() => {
    const unsubAsg = subscribeAssignmentsFromFirestore((firestoreAssignments) => {
      if (firestoreAssignments && firestoreAssignments.length > 0) {
        setAssignments(firestoreAssignments);
      }
    });

    const unsubSub = subscribeSubmissionsFromFirestore((firestoreSubmissions) => {
      if (firestoreSubmissions && firestoreSubmissions.length > 0) {
        setSubmissions(firestoreSubmissions);
      }
    });

    return () => {
      unsubAsg();
      unsubSub();
    };
  }, []);

  // Handle Theme
  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
        localStorage.setItem(THEME_STORAGE_KEY, 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem(THEME_STORAGE_KEY, 'light');
      }
      return next;
    });
  };

  // Load SRS cards & stats on initial mount
  useEffect(() => {
    // Auto navigate to tabs if URL contains ?tab=... or ?exam=...
    const params = new URLSearchParams(window.location.search);
    const requestedTab = params.get('tab') as NavTab | null;
    if (requestedTab && ['dashboard', 'coursebook', 'tutor', 'flashcards', 'dictionary', 'quizzes', 'admin'].includes(requestedTab)) {
      setActiveTab(requestedTab);
    } else if (params.get('exam') || params.get('code') || params.get('exam_code')) {
      setActiveTab('quizzes');
    }

    const initialCards = loadSRSCards();
    setSrsCards(initialCards);

    try {
      const savedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
      let parsedProfile: UserProfile | null = null;
      if (savedProfile) {
        parsedProfile = JSON.parse(savedProfile);
        setUserProfile(parsedProfile!);
      }

      const savedStats = localStorage.getItem(STATS_STORAGE_KEY);
      if (savedStats) {
        const parsed: UserStats = JSON.parse(savedStats);
        // Clean up any historical inflated cards count from previous compound bug
        if ((parsed.cardsReviewedToday ?? 0) > 100) {
          parsed.cardsReviewedToday = 5;
        }
        const { stats: evaluated, profileUpdate } = evaluateRealtimeStreak(parsed, parsedProfile || undefined);
        setStats(evaluated);
        localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(evaluated));
        if (profileUpdate) {
          setUserProfile((prev) => ({ ...prev, ...profileUpdate }));
        }
      } else {
        // Initial setup evaluated
        setStats((prev) => {
          const { stats: evaluated, profileUpdate } = evaluateRealtimeStreak(prev, parsedProfile || undefined);
          localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(evaluated));
          if (profileUpdate) {
            setUserProfile((p) => ({ ...p, ...profileUpdate }));
          }
          return evaluated;
        });
      }
    } catch (e) {
      console.error('Error loading stored session', e);
    }

    // Subscribe to Firebase Auth state & Realtime Firestore Profile
    let unsubscribeDoc: (() => void) | null = null;
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = null;
      }

      if (user) {
        const isAdmin = isUserAdmin(user.email);
        const userDocRef = doc(db, 'users', user.uid);

        try {
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            const data = snap.data() as UserProfile;
            const merged: UserProfile = {
              ...data,
              id: user.uid,
              email: user.email || data.email,
              displayName: user.displayName || data.displayName || 'Học viên Minnese',
              role: isAdmin ? 'admin' : (data.role || 'user'),
              updatedAt: new Date().toISOString(),
            };
            setUserProfile(merged);
            localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(merged));
            if (isAdmin && data.role !== 'admin') {
              await setDoc(userDocRef, { role: 'admin' }, { merge: true });
            }
          } else {
            // User registered via Auth but not yet in Firestore DB (create initial profile)
            const newProfile: UserProfile = {
              id: user.uid,
              email: user.email || '',
              displayName: user.displayName || user.email?.split('@')[0] || 'Học viên Minnese',
              role: isAdmin ? 'admin' : 'user',
              current_level: 1,
              words_per_day: 15,
              streak_count: 1,
              last_study_date: new Date().toISOString(),
              exp_points: 50,
              badges: ['badge_first_step'],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, newProfile, { merge: true });
            setUserProfile(newProfile);
            localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(newProfile));
          }

          // Realtime listener for Firestore profile updates (roles, classes, XP)
          unsubscribeDoc = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
              const liveData = docSnap.data() as UserProfile;
              setUserProfile((prev) => ({
                ...prev,
                ...liveData,
                role: isUserAdmin(liveData.email || user.email) ? 'admin' : (liveData.role || 'user'),
              }));
            }
          });
        } catch (err) {
          console.warn('Could not sync user profile to Firestore:', err);
          setUserProfile((prev) => ({
            ...prev,
            id: user.uid,
            email: user.email || prev.email,
            displayName: user.displayName || prev.displayName,
            role: isAdmin ? 'admin' : prev.role,
          }));
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) {
        unsubscribeDoc();
      }
    };
  }, []);

  const handleUpdateStats = (newStats: Partial<UserStats>) => {
    setStats((prev) => {
      const merged: UserStats = {
        ...prev,
        ...newStats,
      };

      const cardsIncrement =
        newStats.cardsReviewedToday !== undefined && newStats.cardsReviewedToday > (prev.cardsReviewedToday ?? 0)
          ? newStats.cardsReviewedToday - (prev.cardsReviewedToday ?? 0)
          : 0;

      const xpIncrement =
        newStats.xp !== undefined && newStats.xp > (prev.xp ?? 0)
          ? newStats.xp - (prev.xp ?? 0)
          : 0;

      const { stats: updated, profileUpdate } = registerStudyActivityToday(
        merged,
        cardsIncrement,
        xpIncrement,
        userProfile
      );

      if (profileUpdate) {
        setUserProfile((prevProfile) => {
          const updatedProfile = { ...prevProfile, ...profileUpdate };
          try {
            localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updatedProfile));
          } catch (e) {
            console.error('Error persisting profile', e);
          }
          return updatedProfile;
        });
      }

      try {
        localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Error persisting stats', e);
      }
      return updated;
    });
  };

  const handleSaveProfile = async (newProfile: Partial<UserProfile>) => {
    setUserProfile((prev) => {
      const updated = { ...prev, ...newProfile, updatedAt: new Date().toISOString() };
      try {
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Error persisting profile', e);
      }
      return updated;
    });

    if (auth.currentUser?.uid && !userProfile.id.startsWith('guest-') && userProfile.id !== 'demo-user-123') {
      try {
        await updateStudentInFirestore(auth.currentUser.uid, newProfile);
      } catch (e) {
        console.warn('Failed to sync updated profile to Firestore:', e);
      }
    }
  };

  const handleAddWordToSRS = (wordId: string) => {
    const today = new Date();
    const updatedCards: Record<string, SRSCardState> = {
      ...srsCards,
      [wordId]: {
        wordId,
        repetition: 0,
        interval: 1,
        easinessFactor: 2.5,
        lastReviewDate: today.toISOString(),
        nextReviewDate: today.toISOString(),
        history: [],
        state: 'new',
      },
    };
    setSrsCards(updatedCards);
    saveSRSCards(updatedCards);
    handleUpdateStats({ xp: stats.xp + 10 });
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setUserProfile({
        id: 'demo-user-123',
        email: 'demo@minnese.app',
        displayName: 'Học viên Demo',
        role: 'user',
        current_level: 1,
        words_per_day: 15,
        streak_count: 5,
        last_study_date: new Date().toISOString(),
        exp_points: 320,
        badges: ['badge_streak_5'],
      });
      localStorage.removeItem(PROFILE_STORAGE_KEY);
    } catch (err) {
      console.error('Logout error', err);
    }
  };

  const isAuthorizedAdminOrTeacher =
    userProfile?.role === 'admin' ||
    userProfile?.role === 'teacher' ||
    userProfile?.email === 'babysharkkk123@gmail.com';

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)] flex flex-col font-sans relative overflow-x-hidden transition-colors selection:bg-[var(--color-primary)] selection:text-white">
      {/* Subtle Ambient Glow */}
      <div className="absolute top-[-120px] left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[var(--color-primary)]/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Top Application Navbar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        stats={stats}
        userProfile={userProfile}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        onOpenAuth={(mode) => {
          setAuthModalMode(mode || 'login');
          setShowAuthModal(true);
        }}
        onLogout={handleLogout}
        onOpenVoiceCall={handleOpenVoiceCall}
        onOpenJoinClass={() => setShowJoinClassModal(true)}
      />

      {/* Main View Router */}
      <main className="flex-1 pb-16">
        {activeTab === 'dashboard' && (
          <DashboardView
            userProfile={userProfile}
            stats={stats}
            srsCards={srsCards}
            onNavigate={setActiveTab}
            onStartReview={() => {
              setSelectedFlashcardDeckId('deck-coursebook-progress');
              setActiveTab('flashcards');
            }}
            assignments={assignments}
            submissions={submissions}
            onOpenVoiceCall={handleOpenVoiceCall}
            onOpenJoinClass={() => setShowJoinClassModal(true)}
          />
        )}
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center min-h-[420px] w-full py-20">
              <div className="w-10 h-10 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
              <p className="mt-4 text-sm text-[var(--color-text-secondary)] font-medium">
                Đang tải phân hệ học tập...
              </p>
            </div>
          }
        >
          {activeTab === 'coursebook' && (
            <CoursebookView
              userProfile={userProfile}
              srsCards={srsCards}
              onAddWordToSRS={handleAddWordToSRS}
              onSaveProfile={handleSaveProfile}
              onStartFlashcards={(words, lessonNumber) => {
                // Add words to SRS or navigate to flashcards
                words.forEach((w) => handleAddWordToSRS(w.id));
                if (lessonNumber) {
                  setSelectedFlashcardDeckId(`deck-lesson-${userProfile.current_level || 1}-${lessonNumber}`);
                } else {
                  setSelectedFlashcardDeckId('deck-coursebook-progress');
                }
                setActiveTab('flashcards');
              }}
              onOpenAiTutorWithTopic={() => {
                setActiveTab('tutor');
              }}
            />
          )}
          {activeTab === 'tutor' && <AITutorView userProfile={userProfile} />}
          {activeTab === 'flashcards' && (
            <FlashcardsView
              srsCards={srsCards}
              onUpdateSRSCards={setSrsCards}
              stats={stats}
              onUpdateStats={handleUpdateStats}
              userProfile={userProfile}
              initialDeckId={selectedFlashcardDeckId}
              onClearInitialDeckId={() => setSelectedFlashcardDeckId(null)}
              onNavigateToCoursebook={() => setActiveTab('coursebook')}
            />
          )}
          {activeTab === 'dictionary' && (
            <DictionaryView
              srsCards={srsCards}
              onAddWordToSRS={handleAddWordToSRS}
              isAuthorizedAdminOrTeacher={isAuthorizedAdminOrTeacher}
            />
          )}
          {activeTab === 'quizzes' && (
            <QuizzesView stats={stats} onUpdateStats={handleUpdateStats} userProfile={userProfile} />
          )}
          {activeTab === 'admin' && (
            isAuthorizedAdminOrTeacher ? (
              <AdminDashboard currentAdmin={userProfile} />
            ) : (
              <div className="max-w-md mx-auto my-16 p-8 rounded-3xl bg-[var(--color-surface)] border border-rose-500/30 text-center space-y-4 shadow-xl">
                <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto text-2xl">
                  🛡️
                </div>
                <h2 className="text-xl font-bold text-[var(--color-text-primary)] font-serif">Quyền Truy Cập Bị Giới Hạn</h2>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  Khu vực Quản trị chỉ dành riêng cho Giáo viên và Ban Quản trị Minnese. Tài khoản học viên của bạn ({userProfile.email}) không có quyền truy cập trang này.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('dashboard')}
                  className="px-6 py-2.5 rounded-full bg-[var(--color-primary)] text-white font-bold text-sm shadow-md hover:bg-[var(--color-primary-dark)] transition-all cursor-pointer"
                >
                  Về trang chủ học tập
                </button>
              </div>
            )
          )}
        </Suspense>
      </main>

      {/* Auth Modal (Register, Login, Google, Forgot Password) */}
      <Suspense fallback={null}>
        {showAuthModal && (
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            initialMode={authModalMode}
            onSuccess={(profile) => {
              setUserProfile(profile);
              setShowAuthModal(false);
              try {
                localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
              } catch (e) {
                console.error('Error saving profile', e);
              }
            }}
          />
        )}
      </Suspense>

      {/* Class Code / Join Class Modal */}
      <Suspense fallback={null}>
        {showJoinClassModal && (
          <JoinClassModal
            isOpen={showJoinClassModal}
            onClose={() => setShowJoinClassModal(false)}
            userProfile={userProfile}
            onClassJoined={(updated) => handleSaveProfile(updated)}
          />
        )}
      </Suspense>

      {/* Interactive Live Voice Call Speaking Studio Modal */}
      <Suspense fallback={null}>
        {showVoiceCall && (
          <LiveVoiceCallModal
            isOpen={showVoiceCall}
            onClose={() => setShowVoiceCall(false)}
            userHskLevel={userProfile.current_level || 2}
          />
        )}
      </Suspense>

      {/* Global Floating Quick Voice Speaking Partner Bubble (Locked in MVP) */}
      {ENABLE_LIVE_VOICE_CALL && (
        <div className="fixed bottom-18 md:bottom-6 right-4 sm:right-6 z-40">
          <button
            type="button"
            onClick={handleOpenVoiceCall}
            className="group relative flex items-center justify-center w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 hover:from-emerald-500 hover:to-cyan-400 text-white shadow-xl shadow-teal-500/25 border border-white/20 active:scale-95 transition-all cursor-pointer"
            title="Gọi thoại trực tiếp 2 chiều luyện nói AI (Live Voice Call)"
            id="floating-live-voice-call-btn"
          >
            <Mic className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-300 border-2 border-white animate-ping" />
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white" />
          </button>
        </div>
      )}

      {/* Sleek Mobile Bottom Navigation Bar (< 768px) */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--color-surface)]/95 backdrop-blur-md border-t border-[var(--color-border)] px-2 py-1.5 flex items-center justify-around"
        id="mobile-bottom-nav"
      >
        {[
          { id: 'dashboard' as NavTab, label: 'Tổng quan', icon: LayoutDashboard },
          { id: 'coursebook' as NavTab, label: 'Giáo trình', icon: GraduationCap },
          { id: 'flashcards' as NavTab, label: 'Flashcards', icon: Layers },
          { id: 'dictionary' as NavTab, label: 'Từ điển', icon: BookOpen },
          { id: 'tutor' as NavTab, label: 'Gia sư AI', icon: Bot },
          { id: 'quizzes' as NavTab, label: 'Luyện tập', icon: HelpCircle },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center gap-1 py-1 px-2 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'text-[var(--color-primary)] font-bold'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] leading-none whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Refined Footer */}
      <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)] py-4 mb-14 md:mb-0 text-center text-xs text-[var(--color-text-secondary)] relative z-10 transition-colors">
        <p className="flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] shadow-[0_0_8px_rgba(15,155,132,0.6)]"></span>
          <span className="font-semibold text-[var(--color-text-primary)]">Minnese 敏思中文</span> • Powered by Gemini AI RAG & SuperMemo SM-2 Spaced Repetition
        </p>
      </footer>
    </div>
  );
}
