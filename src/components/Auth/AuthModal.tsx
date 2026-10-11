import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';
import {
  registerWithEmailPassword,
  loginWithEmailPassword,
  loginWithGoogle,
  resetPassword,
  getAuthErrorMessage,
  loginWithDirectSession,
} from '../../lib/firebase';
import { UserProfile } from '../../types';
import { MinnieLogo } from '../MinnieLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (profile: UserProfile) => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleSwitchMode = (newMode: 'login' | 'register' | 'forgot') => {
    resetForm();
    setMode(newMode);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (mode === 'forgot') {
      if (!email.trim()) {
        setErrorMessage('Vui lòng nhập địa chỉ email của bạn.');
        return;
      }
      setIsLoading(true);
      const res = await resetPassword(email);
      setIsLoading(false);
      if (res.success) {
        setSuccessMessage(res.message);
      } else {
        setErrorMessage(res.message);
      }
      return;
    }

    if (mode === 'register') {
      if (!displayName.trim()) {
        setErrorMessage('Vui lòng nhập họ và tên của bạn.');
        return;
      }
      if (!email.trim()) {
        setErrorMessage('Vui lòng nhập địa chỉ email.');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('Mật khẩu phải có tối thiểu 6 ký tự.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Mật khẩu xác nhận không khớp.');
        return;
      }

      setIsLoading(true);
      try {
        const profile = await registerWithEmailPassword(email, password, displayName);
        setIsLoading(false);
        setSuccessMessage('Đăng ký tài khoản thành công! Đang chuyển tiếp...');
        setTimeout(() => {
          onSuccess(profile);
          onClose();
        }, 600);
      } catch (err: any) {
        setIsLoading(false);
        // If Firebase Email/Password provider is disabled in console, provide smooth fallback
        if (err?.code === 'auth/operation-not-allowed') {
          setErrorMessage('Phương thức đăng nhập Email/Password chưa bật trong Firebase Console. Bạn có thể nhấn nút "Đăng nhập trực tiếp" bên dưới để tiếp tục ngay.');
        } else {
          setErrorMessage(getAuthErrorMessage(err));
        }
      }
      return;
    }

    // Login mode
    if (!email.trim() || !password) {
      setErrorMessage('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }

    setIsLoading(true);
    try {
      const profile = await loginWithEmailPassword(email, password);
      setIsLoading(false);
      setSuccessMessage('Đăng nhập thành công!');
      setTimeout(() => {
        onSuccess(profile);
        onClose();
      }, 500);
    } catch (err: any) {
      setIsLoading(false);
      if (err?.code === 'auth/operation-not-allowed') {
        setErrorMessage('Phương thức Email/Password chưa bật trong Firebase Console. Bạn có thể bấm "Đăng nhập trực tiếp" bên dưới hoặc tiếp tục với Google.');
      } else {
        setErrorMessage(getAuthErrorMessage(err));
      }
    }
  };

  const handleDirectLogin = async (targetEmail?: string, targetName?: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const e = targetEmail || email.trim() || 'babysharkkk123@gmail.com';
      const n = targetName || displayName.trim() || (e.toLowerCase().includes('babysharkkk123') ? 'Admin BabyShark' : e.split('@')[0]);
      const profile = await loginWithDirectSession(e, n);
      setIsLoading(false);
      setSuccessMessage(`Đăng nhập thành công với vai trò ${profile.role === 'admin' ? 'Quản trị viên (Admin)' : 'Học viên'}!`);
      setTimeout(() => {
        onSuccess(profile);
        onClose();
      }, 400);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err?.message || 'Có lỗi xảy ra khi đăng nhập.');
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsGoogleLoading(true);
    try {
      const profile = await loginWithGoogle();
      setIsGoogleLoading(false);
      if (profile) {
        setSuccessMessage('Đăng nhập Google thành công!');
        setTimeout(() => {
          onSuccess(profile);
          onClose();
        }, 500);
      }
    } catch (err: any) {
      setIsGoogleLoading(false);
      setErrorMessage(getAuthErrorMessage(err));
    }
  };

  const handleGuestContinue = () => {
    const guestProfile: UserProfile = {
      id: 'guest-' + Math.random().toString(36).substring(2, 9),
      email: 'guest@minnese.app',
      displayName: 'Khách Trải Nghiệm',
      role: 'user',
      current_level: 1,
      words_per_day: 15,
      streak_count: 1,
      last_study_date: new Date().toISOString(),
      exp_points: 100,
      badges: ['badge_first_step'],
    };
    onSuccess(guestProfile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden text-[var(--color-text-primary)]"
        id="auth-modal"
      >
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-primary)]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border)]/50 transition-colors cursor-pointer"
          title="Đóng cửa sổ"
          id="auth-modal-close-btn"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center space-y-2 relative z-10 flex flex-col items-center">
          <MinnieLogo size={72} variant="badge" />
          <h2 className="text-2xl font-black tracking-tight text-[var(--color-text-primary)]">
            {mode === 'login' && 'Chào mừng trở lại!'}
            {mode === 'register' && 'Tạo tài khoản học Minnie Chinese'}
            {mode === 'forgot' && 'Khôi phục mật khẩu'}
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {mode === 'login' && 'Đăng nhập để đồng bộ tiến độ ôn tập Flashcards và lịch sử điểm số.'}
            {mode === 'register' && 'Bắt đầu hành trình chinh phục HSK 1-6 chuẩn quốc tế với AI.'}
            {mode === 'forgot' && 'Nhập email đã đăng ký để nhận liên kết đặt lại mật khẩu an toàn.'}
          </p>
        </div>

        {/* Tab Switcher (Login vs Register) */}
        {mode !== 'forgot' && (
          <div className="flex p-1 bg-[var(--color-background)] rounded-2xl border border-[var(--color-border)] relative z-10">
            <button
              type="button"
              onClick={() => handleSwitchMode('login')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-[var(--color-primary)] text-white shadow-xs'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
              id="auth-tab-login"
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMode('register')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-[var(--color-primary)] text-white shadow-xs'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
              id="auth-tab-register"
            >
              Đăng ký mới
            </button>
          </div>
        )}

        {/* Feedback Alerts */}
        {errorMessage && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs space-y-2 animate-in fade-in">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
            {email.trim() && (
              <button
                type="button"
                onClick={() => handleDirectLogin(email.trim(), displayName)}
                className="w-full mt-1.5 py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Đăng nhập trực tiếp với email "{email.trim()}"</span>
              </button>
            )}
          </div>
        )}
        {successMessage && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs flex items-start gap-2 animate-in fade-in font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* Email/Password Form */}
        <form onSubmit={handleEmailSubmit} className="space-y-3.5 relative z-10">
          {/* Display Name (Register only) */}
          {mode === 'register' && (
            <div>
              <label className="block text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5">
                Họ và tên
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[var(--color-text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="VD: Nguyễn Minh Châu"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
                  id="auth-input-name"
                />
              </div>
            </div>
          )}

          {/* Email Address */}
          <div>
            <label className="block text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5">
              Địa chỉ Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[var(--color-text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] font-sans"
                id="auth-input-email"
              />
            </div>
          </div>

          {/* Password */}
          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                  Mật khẩu
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => handleSwitchMode('forgot')}
                    className="text-xs font-semibold text-[var(--color-primary)] hover:underline cursor-pointer"
                  >
                    Quên mật khẩu?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[var(--color-text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder={mode === 'register' ? 'Tối thiểu 6 ký tự' : 'Nhập mật khẩu của bạn'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] font-sans"
                  id="auth-input-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Confirm Password (Register only) */}
          {mode === 'register' && (
            <div>
              <label className="block text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5">
                Xác nhận mật khẩu
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-[var(--color-text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="Nhập lại mật khẩu"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] font-sans"
                  id="auth-input-confirm-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer p-1"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-[var(--color-primary)] text-white font-bold text-sm hover:bg-[var(--color-primary-dark)] active:scale-[0.99] transition-all shadow-md shadow-[var(--color-primary)]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            id="auth-submit-btn"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : mode === 'forgot' ? (
              <span>Gửi liên kết khôi phục</span>
            ) : mode === 'register' ? (
              <>
                <span>Đăng ký tài khoản</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Đăng nhập ngay</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Back to login option if in forgot mode */}
        {mode === 'forgot' && (
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => handleSwitchMode('login')}
              className="text-xs font-bold text-[var(--color-primary)] hover:underline cursor-pointer"
            >
              ← Quay lại trang Đăng nhập
            </button>
          </div>
        )}

        {/* Divider */}
        {mode !== 'forgot' && (
          <>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[var(--color-border)]" />
              <span className="text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                hoặc
              </span>
              <div className="flex-1 h-px bg-[var(--color-border)]" />
            </div>

            {/* Google 1-Click Login & Guest Mode */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className="w-full py-2.5 px-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] hover:bg-[var(--color-surface)] text-[var(--color-text-primary)] text-xs font-bold flex items-center justify-center gap-2.5 transition-all shadow-xs active:scale-[0.99] cursor-pointer disabled:opacity-50"
                id="auth-google-btn"
              >
                {isGoogleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary)]" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                )}
                <span>Tiếp tục với Google</span>
              </button>

              <button
                type="button"
                onClick={handleGuestContinue}
                className="w-full py-2 px-4 rounded-xl text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-medium text-center transition-colors cursor-pointer"
              >
                Dùng thử ngay (Chế độ Khách)
              </button>

              {/* Fast Admin Login Shortcut for Project Owner */}
              <div className="pt-2 border-t border-[var(--color-border)]/50 text-center">
                <button
                  type="button"
                  onClick={() => handleDirectLogin('babysharkkk123@gmail.com', 'Admin BabyShark')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-xl text-[11px] font-bold transition-all cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Đăng nhập nhanh với quyền Admin (babysharkkk123@gmail.com)</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
