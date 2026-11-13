import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Layers,
  BookOpen,
  HelpCircle,
  Settings,
  Volume2,
  Bot,
  LayoutDashboard,
  Moon,
  Sun,
  LogIn,
  LogOut,
  GraduationCap,
  ChevronDown,
  Database,
  Key,
  Bell,
  CheckCircle2,
} from 'lucide-react';
import { UserStats, UserProfile, AssignmentDoc, SRSCardState, WordItem } from '../types';
import { MinnieLogo } from './MinnieLogo';
import { VoiceSettingsModal } from './VoiceSettingsModal';
import { BYOKModal } from './BYOKModal';
import { LEARNER_PERSONAS } from '../utils/streak';
import { getCoursebookDueStats } from '../utils/coursebookVocab';

export type NavTab = 'dashboard' | 'coursebook' | 'tutor' | 'flashcards' | 'dictionary' | 'quizzes' | 'admin' | 'qbank';

interface NavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  stats: UserStats;
  userProfile: UserProfile;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onLogout: () => void;
  onOpenVoiceCall?: () => void;
  onOpenJoinClass?: () => void;
  isQbankEnabled?: boolean;
  assignments?: AssignmentDoc[];
  srsCards?: Record<string, SRSCardState>;
  onStartReview?: (mode?: 'due_only' | 'all') => void;
  onStartAssignment?: (asg: AssignmentDoc) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  stats,
  userProfile,
  isDarkMode,
  onToggleDarkMode,
  onOpenAuth,
  onLogout,
  onOpenJoinClass,
  isQbankEnabled = false,
  assignments = [],
  srsCards = {},
  onStartReview,
  onStartAssignment,
}) => {
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showBYOKModal, setShowBYOKModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [progressTick, setProgressTick] = useState(0);

  // Sync with lesson and storage progress
  useEffect(() => {
    const handleProgressUpdate = () => {
      setProgressTick((prev) => prev + 1);
    };
    window.addEventListener('storage', handleProgressUpdate);
    window.addEventListener('minnie_lesson_progress_updated', handleProgressUpdate);
    return () => {
      window.removeEventListener('storage', handleProgressUpdate);
      window.removeEventListener('minnie_lesson_progress_updated', handleProgressUpdate);
    };
  }, []);

  // Compute actionable notifications & due flashcards stats strictly from getCoursebookDueStats
  const dueStats = React.useMemo(() => {
    try {
      const rawLevel = Math.round(Number(userProfile?.current_level)) || 1;
      const level = Math.min(4, Math.max(1, rawLevel)) as 1 | 2 | 3 | 4;
      return {
        ...getCoursebookDueStats(level, srsCards),
        activeLevel: level,
      };
    } catch {
      return {
        dueCount: 0,
        scopeLabel: '',
        dueWords: [] as WordItem[],
        targetWords: [] as WordItem[],
        totalWordsCount: 0,
        masteredCount: 0,
        learningCount: 0,
        currentLessonNum: 1,
        maxReachedLessonNum: 1,
        activeLevel: 1 as 1 | 2 | 3 | 4,
      };
    }
  }, [userProfile?.current_level, srsCards, progressTick]);

  const notificationsRef = React.useRef<HTMLDivElement>(null);
  const userMenuRef = React.useRef<HTMLDivElement>(null);

  // Close notifications & user menu dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (showNotifications && notificationsRef.current && !notificationsRef.current.contains(target)) {
        setShowNotifications(false);
      }
      if (showUserMenu && userMenuRef.current && !userMenuRef.current.contains(target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showNotifications, showUserMenu]);

  // Handle Escape key to close notifications & user menu dropdowns
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27) {
        setShowNotifications(false);
        setShowUserMenu(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleStartDueReview = () => {
    setShowNotifications(false);
    setShowUserMenu(false);
    const mode = dueStats.dueCount > 0 ? 'due_only' : 'all';
    if (onStartReview) {
      onStartReview(mode);
    } else {
      onSelectTab('flashcards');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('minnie_start_srs_review', {
            detail: { deckId: 'deck-coursebook-progress', mode },
          })
        );
      }
    }
  };

  const actionableAssignments = React.useMemo(() => {
    const now = Date.now();
    const isAdmin =
      userProfile?.role === 'admin' ||
      userProfile?.email === 'babysharkkk123@gmail.com';
    return assignments.filter((a) => {
      if (!a.is_active) return false;
      const dueTime = a.due_date ? new Date(a.due_date).getTime() : 0;
      if (dueTime <= 0 || dueTime <= now) return false;
      if (isAdmin) return true;
      if (a.target_type === 'class' && a.target_class_id) {
        return (
          userProfile?.class_id === a.target_class_id ||
          userProfile?.class_code === a.target_class_id ||
          a.hsk_level === userProfile?.current_level
        );
      }
      return a.hsk_level === userProfile?.current_level || a.target_type === 'all';
    });
  }, [assignments, userProfile]);

  const totalNotifications = (dueStats.dueCount > 0 ? 1 : 0) + actionableAssignments.length;

  const isGuestOrDemo = !userProfile || userProfile.id === 'demo-user-123' || userProfile.id.startsWith('guest-');

  // RBAC Security: Only Admins or Teachers have access to the Admin Portal tab
  const isAuthorizedAdminOrTeacher =
    userProfile?.role === 'admin' ||
    userProfile?.role === 'teacher' ||
    userProfile?.email === 'babysharkkk123@gmail.com';

  // Standardized 5 primary student navigation tabs
  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'coursebook' as NavTab, label: 'Giáo trình', icon: GraduationCap },
    { id: 'quizzes' as NavTab, label: 'Luyện tập', icon: HelpCircle },
    { id: 'tutor' as NavTab, label: 'Gia sư AI', icon: Bot },
    { id: 'dictionary' as NavTab, label: 'Từ điển', icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-40 silk-glass border-b border-[var(--color-border)]/70 transition-colors shadow-xs">
      <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-2.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15 sm:h-16 gap-1.5 sm:gap-2 lg:gap-4">
          {/* Brand Logo & Name */}
          <div
            className="flex items-center gap-1.5 sm:gap-2 cursor-pointer shrink min-w-0 select-none group transition-transform active:scale-98"
            onClick={() => onSelectTab('dashboard')}
            id="app-logo-btn"
          >
            <MinnieLogo size={36} showText={true} />
          </div>

          {/* Desktop & Tablet Navigation Tabs (Clean single bar, NO scrollbar) */}
          <nav
            className="hidden md:flex items-center gap-0.5 lg:gap-1 bg-[var(--color-background)]/90 p-1 rounded-full border border-[var(--color-border)] shadow-xs shrink-0"
            id="nav-tabs"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`tab-btn-${item.id}`}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`silk-btn flex items-center gap-1 lg:gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-full text-[11px] lg:text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-[var(--color-primary)] text-white shadow-xs scale-[1.03]'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] hover:scale-[1.02]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                  <span className="whitespace-nowrap">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Area: Exactly 3 Icons (Notification Bell, Theme Toggle, User Profile Avatar) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* 1. Icon Chuông Thông Báo (kèm badge đỏ số lượng việc cần làm) */}
            <div className="relative" ref={notificationsRef}>
              <button
                type="button"
                onClick={() => {
                  setShowNotifications((prev) => !prev);
                  setShowUserMenu(false);
                }}
                className="silk-btn relative p-1.5 sm:p-2 rounded-full border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-all cursor-pointer shrink-0"
                title="Thông báo học tập & bài tập cần làm"
                id="navbar-notification-btn"
                aria-label="Thông báo học tập"
                aria-expanded={showNotifications}
                aria-haspopup="true"
              >
                <Bell className="w-4 h-4" />
                {totalNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse">
                    {totalNotifications}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {showNotifications && (
                <div
                  id="navbar-notifications-dropdown"
                  className="fixed inset-x-3 top-16 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-2xl p-4 z-50 animate-in fade-in duration-150 space-y-3 text-[var(--color-text-primary)]"
                >
                    <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border)]">
                      <span className="font-bold text-xs uppercase tracking-wider text-[var(--color-text-primary)] flex items-center gap-1.5">
                        <Bell className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                        Thông báo cần làm ({totalNotifications})
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowNotifications(false)}
                        className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
                      >
                        Đóng
                      </button>
                    </div>

                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {/* Item ưu tiên số 1 đứng đầu: Ôn tập thẻ từ đến hạn (SM-2) */}
                      <div
                        className={`p-3 rounded-xl border text-xs space-y-2 ${
                          dueStats.dueCount > 0
                            ? 'bg-amber-500/10 border-amber-500/20'
                            : 'bg-emerald-500/10 border-emerald-500/20'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                              dueStats.dueCount > 0
                                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                                : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            <Layers className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-xs text-[var(--color-text-primary)] leading-tight">
                              {dueStats.dueCount} từ vựng cần ôn tập hôm nay
                            </h4>
                            <p className="text-[11px] text-[var(--color-text-secondary)] truncate leading-tight mt-0.5">
                              {dueStats.maxReachedLessonNum && dueStats.maxReachedLessonNum > 1
                                ? `Bài 1 - ${dueStats.maxReachedLessonNum}`
                                : 'Bài 1'}{' '}
                              chuẩn New HSK {dueStats.activeLevel} · Thuật toán SM-2
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          id="navbar-notification-due-review-btn"
                          onClick={handleStartDueReview}
                          className="w-full py-2 px-3 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-bold text-xs text-center transition-all shadow-xs cursor-pointer active:scale-[0.98]"
                        >
                          Ôn tập ngay
                        </button>
                      </div>

                      {/* Danh sách bài tập cần làm */}
                      {actionableAssignments.map((asg) => (
                        <div
                          key={asg.id}
                          className="p-3 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between font-bold text-[var(--color-text-primary)]">
                            <span className="truncate max-w-[200px]">{asg.title}</span>
                            <span className="text-[10px] text-rose-500 font-mono">
                              Hạn: {new Date(asg.due_date).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                          <p className="text-[11px] text-[var(--color-text-secondary)] line-clamp-1">
                            {asg.description}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setShowNotifications(false);
                              if (onStartAssignment) {
                                onStartAssignment(asg);
                              } else {
                                onSelectTab('quizzes');
                              }
                            }}
                            className="w-full py-1.5 rounded-lg bg-[var(--color-bg-secondary)] hover:bg-[var(--color-primary-light)] text-[var(--color-primary)] font-bold text-[11px] text-center border border-[var(--color-border)] transition-colors cursor-pointer"
                          >
                            Làm bài tập ngay →
                          </button>
                        </div>
                      ))}

                      {totalNotifications === 0 && actionableAssignments.length === 0 && (
                        <div className="py-2 text-center text-xs text-[var(--color-text-secondary)] space-y-1">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto opacity-80" />
                          <p className="text-[11px] font-medium text-[var(--color-text-secondary)]">
                            Không có bài tập tồn đọng.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
              )}
            </div>

            {/* 2. Icon Chế độ Tối/Sáng */}
            <button
              type="button"
              id="navbar-theme-toggle-btn"
              onClick={onToggleDarkMode}
              className="silk-btn p-1.5 sm:p-2 rounded-full border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-all duration-200 cursor-pointer shrink-0 overflow-hidden"
              title={isDarkMode ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
              aria-label={isDarkMode ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
            >
              <span
                className="block transition-transform duration-300"
                style={{ transform: isDarkMode ? 'rotate(0deg)' : 'rotate(-30deg)' }}
              >
                {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </span>
            </button>

            {/* 3. Avatar Tài khoản (với dropdown menu khi bấm vào) */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowNotifications(false);
                }}
                className="silk-btn flex items-center gap-1.5 p-1 rounded-full hover:bg-[var(--color-surface)] border border-[var(--color-border)] bg-[var(--color-background)] transition-all cursor-pointer shrink-0"
                title={userProfile?.email || 'Tài khoản'}
                id="navbar-user-avatar-btn"
                aria-label="Menu tài khoản"
                aria-expanded={showUserMenu}
                aria-haspopup="true"
              >
                <div className="w-7 h-7 rounded-full bg-[var(--color-primary)] text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
                  {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
                <ChevronDown className="w-3 h-3 text-[var(--color-text-secondary)] hidden lg:block mr-1" />
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-64 p-2 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl z-50 animate-in fade-in duration-150 text-[var(--color-text-primary)]">
                    <div className="p-2.5 border-b border-[var(--color-border)] space-y-1">
                      <p className="text-xs font-bold text-[var(--color-text-primary)]">{userProfile?.displayName || 'Người dùng'}</p>
                      <p className="text-[11px] text-[var(--color-text-secondary)] font-mono truncate">{userProfile?.email || ''}</p>
                      <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                        {isAuthorizedAdminOrTeacher ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                            {userProfile?.role === 'teacher' ? '👩‍🏫 Giáo viên' : '👑 Quản trị viên (Admin)'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
                            {LEARNER_PERSONAS[userProfile?.learner_persona || 'working_professional']?.badgeLabel || '🎓 Học viên'}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                          HSK {userProfile?.current_level || 1}
                        </span>
                        {userProfile?.class_code && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600">
                            Lớp {userProfile.class_code}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="py-1 space-y-1">
                      {/* AI BYOK Settings option inside dropdown */}
                      <button
                        type="button"
                        id="menu-btn-byok"
                        onClick={() => {
                          setShowUserMenu(false);
                          setShowBYOKModal(true);
                        }}
                        className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-background)] flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Key className="w-3.5 h-3.5 text-cyan-500" />
                        <span>Cấu hình AI Key (BYOK)</span>
                      </button>

                      {/* Voice Settings option inside dropdown */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false);
                          setShowVoiceModal(true);
                        }}
                        className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-background)] flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Cài đặt giọng đọc & phát âm</span>
                      </button>

                      {/* Flashcards option with due badge */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false);
                          onSelectTab('flashcards');
                        }}
                        className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-background)] flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Layers className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Bộ thẻ Flashcards (SM-2)</span>
                        </div>
                        {dueStats.dueCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                            {dueStats.dueCount} thẻ
                          </span>
                        )}
                      </button>

                      {/* Join Class option */}
                      {onOpenJoinClass && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowUserMenu(false);
                            onOpenJoinClass();
                          }}
                          className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-background)] flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <GraduationCap className="w-3.5 h-3.5 text-amber-500" />
                          <span>{userProfile.class_code ? 'Đổi mã lớp học' : 'Nhập mã phân lớp (Giáo viên)'}</span>
                        </button>
                      )}

                      {/* Authorized Staff Admin Portal in Dropdown */}
                      {isAuthorizedAdminOrTeacher && (
                        <div className="pt-1 mt-1 border-t border-[var(--color-border)] space-y-1">
                          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                            Cổng Quản Trị
                          </div>
                          <button
                            type="button"
                            id="menu-btn-qbank"
                            onClick={() => {
                              setShowUserMenu(false);
                              onSelectTab('qbank');
                            }}
                            className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <Database className="w-3.5 h-3.5" />
                            <span>Quản trị QBank (Đề thi HSK)</span>
                          </button>
                          <button
                            type="button"
                            id="menu-btn-admin"
                            onClick={() => {
                              setShowUserMenu(false);
                              onSelectTab('admin');
                            }}
                            className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <Settings className="w-3.5 h-3.5" />
                            <span>Quản trị Hệ thống</span>
                          </button>
                        </div>
                      )}

                      {isGuestOrDemo ? (
                        <>
                          <button
                            type="button"
                            id="navbar-login-btn"
                            onClick={() => {
                              setShowUserMenu(false);
                              onOpenAuth('login');
                            }}
                            className="w-full px-3 py-2 rounded-xl text-left text-xs font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <LogIn className="w-3.5 h-3.5" />
                            <span>Đăng nhập tài khoản</span>
                          </button>
                          <button
                            type="button"
                            id="navbar-register-btn"
                            onClick={() => {
                              setShowUserMenu(false);
                              onOpenAuth('register');
                            }}
                            className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Đăng ký tài khoản mới</span>
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setShowUserMenu(false);
                            onLogout();
                          }}
                          className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-rose-500 hover:bg-rose-500/10 flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Đăng xuất tài khoản</span>
                        </button>
                      )}
                    </div>
                  </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Voice Selection & Speed Rate Settings Modal */}
      <VoiceSettingsModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
      />

      {/* AI BYOK Settings Modal */}
      <BYOKModal
        isOpen={showBYOKModal}
        onClose={() => setShowBYOKModal(false)}
      />
    </header>
  );
};
