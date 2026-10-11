import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  BookOpen,
  HelpCircle,
  Settings,
  Flame,
  Volume2,
  Trophy,
  Bot,
  LayoutDashboard,
  Moon,
  Sun,
  LogIn,
  LogOut,
  User as UserIcon,
  GraduationCap,
  ChevronDown,
} from 'lucide-react';
import { UserStats, UserProfile } from '../types';
import { MinnieLogo } from './MinnieLogo';
import { VoiceSettingsModal } from './VoiceSettingsModal';
import { LEARNER_PERSONAS } from '../utils/streak';

export type NavTab = 'dashboard' | 'coursebook' | 'tutor' | 'flashcards' | 'dictionary' | 'quizzes' | 'admin';

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
}) => {
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isGuestOrDemo = userProfile.id === 'demo-user-123' || userProfile.id.startsWith('guest-');

  // RBAC Security: Only Admins or Teachers have access to the Admin Portal tab
  const isAuthorizedAdminOrTeacher =
    userProfile?.role === 'admin' ||
    userProfile?.role === 'teacher' ||
    userProfile?.email === 'babysharkkk123@gmail.com';

  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'coursebook' as NavTab, label: 'Giáo trình', icon: GraduationCap },
    { id: 'tutor' as NavTab, label: 'Gia sư AI', icon: Bot },
    { id: 'flashcards' as NavTab, label: 'Flashcards', icon: Layers },
    { id: 'dictionary' as NavTab, label: 'Từ điển', icon: BookOpen },
    { id: 'quizzes' as NavTab, label: 'Luyện tập', icon: HelpCircle },
    ...(isAuthorizedAdminOrTeacher ? [{ id: 'admin' as NavTab, label: 'Quản trị', icon: Settings }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 bg-[var(--color-surface)]/95 backdrop-blur-md border-b border-[var(--color-border)] transition-colors">
      <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15 sm:h-16 gap-2 lg:gap-4">
          {/* Brand Logo & Name */}
          <div
            className="flex items-center gap-2 cursor-pointer shrink-0 select-none group"
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
                  className={`flex items-center gap-1 lg:gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-full text-[11px] lg:text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[var(--color-primary)] text-white shadow-xs'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="whitespace-nowrap">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Area: Streak, Dark Mode & User Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Streak Counter */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-bold whitespace-nowrap shrink-0"
              title={`Chuỗi học tập liên tiếp: ${stats.dailyStreak} ngày`}
            >
              <Flame className="w-3.5 h-3.5 fill-amber-500 shrink-0" />
              <span className="whitespace-nowrap">{stats.dailyStreak}d</span>
            </div>

            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={onToggleDarkMode}
              className="p-1.5 sm:p-2 rounded-full border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all cursor-pointer shrink-0"
              title={isDarkMode ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Login / Register Quick Button for Guests/Demo */}
            {isGuestOrDemo && (
              <div className="hidden xl:flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onOpenAuth('login')}
                  className="px-3 py-1.5 rounded-full border border-[var(--color-border)] hover:border-[var(--color-primary)] text-[var(--color-text-primary)] text-xs font-semibold hover:bg-[var(--color-background)] transition-all cursor-pointer"
                  id="navbar-login-btn"
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuth('register')}
                  className="px-3 py-1.5 rounded-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                  id="navbar-register-btn"
                >
                  Đăng ký
                </button>
              </div>
            )}

            {/* User Profile Avatar & Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-1.5 p-1 rounded-full hover:bg-[var(--color-surface)] border border-[var(--color-border)] bg-[var(--color-background)] transition-all cursor-pointer shrink-0"
                title={userProfile.email}
                id="navbar-user-avatar-btn"
              >
                <div className="w-7 h-7 rounded-full bg-[var(--color-primary)] text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
                  {userProfile.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
                <ChevronDown className="w-3 h-3 text-[var(--color-text-secondary)] hidden lg:block mr-1" />
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-64 p-2 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl z-50 animate-in fade-in duration-150 text-[var(--color-text-primary)]">
                    <div className="p-2.5 border-b border-[var(--color-border)] space-y-1">
                      <p className="text-xs font-bold text-[var(--color-text-primary)]">{userProfile.displayName}</p>
                      <p className="text-[11px] text-[var(--color-text-secondary)] font-mono truncate">{userProfile.email}</p>
                      <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                        {isAuthorizedAdminOrTeacher ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                            {userProfile.role === 'teacher' ? '👩‍🏫 Giáo viên' : '👑 Quản trị viên (Admin)'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
                            {LEARNER_PERSONAS[userProfile.learner_persona || 'working_professional']?.badgeLabel || '🎓 Học viên'}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                          HSK {userProfile.current_level || 1}
                        </span>
                        {userProfile.class_code && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600">
                            Lớp {userProfile.class_code}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600">
                          {stats.dailyStreak}d streak
                        </span>
                      </div>
                    </div>

                    <div className="py-1 space-y-1">
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

                      {isGuestOrDemo ? (
                        <>
                          <button
                            type="button"
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
                </>
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
    </header>
  );
};
