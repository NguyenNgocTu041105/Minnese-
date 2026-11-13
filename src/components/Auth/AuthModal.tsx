import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Check,
} from 'lucide-react';
import {
  registerWithEmailPassword,
  loginWithEmailPassword,
  loginWithGoogle,
  resetPassword,
  verifyResetCode,
  completePasswordReset,
  getAuthErrorMessage,
} from '../../lib/firebase';
import { UserProfile } from '../../types';
import { MinnieLogo } from '../MinnieLogo';
import {
  evaluatePasswordStrength,
  isValidEmail,
  validateRegistrationPassword,
} from '../../utils/authValidation';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (profile: UserProfile) => void;
  initialMode?: 'login' | 'register' | 'forgot' | 'resetNewPassword';
  initialResetCode?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login',
  initialResetCode = '',
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'resetNewPassword'>(initialMode);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // In-App Password Reset State
  const [resetCode, setResetCode] = useState(initialResetCode);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isBusy = isLoading || isGoogleLoading;

  // Real-time password strength calculation for registration
  const passwordStrength = useMemo(
    () => evaluatePasswordStrength(password),
    [password]
  );

  // Real-time password strength calculation for password reset
  const newPasswordStrength = useMemo(
    () => evaluatePasswordStrength(newPassword),
    [newPassword]
  );

  // Auto-detect oobCode from URL parameters (e.g. when user clicks email link)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get('oobCode');
    if (code) {
      setResetCode(code);
      setMode('resetNewPassword');
      setSuccessMessage('Đã nhận diện mã xác thực từ email. Vui lòng nhập mật khẩu mới.');
    }
  }, []);

  // Helper to extract clean oobCode if user pastes a complete URL
  const handleResetCodeChange = (raw: string) => {
    let clean = raw.trim();
    if (clean.includes('oobCode=')) {
      try {
        const u = new URL(clean);
        clean = u.searchParams.get('oobCode') || clean;
      } catch {
        const m = clean.match(/oobCode=([a-zA-Z0-9_\-]+)/);
        if (m) clean = m[1];
      }
    }
    setResetCode(clean);
  };

  // Close modal via Escape key (WCAG 2.1 AA)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isBusy) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isBusy, onClose]);

  if (!isOpen) return null;

  const handleSwitchMode = (newMode: 'login' | 'register' | 'forgot' | 'resetNewPassword') => {
    if (isBusy) return;
    setErrorMessage(null);
    setSuccessMessage(null);
    setConfirmPassword('');
    setConfirmNewPassword('');
    if (newMode === 'forgot') {
      setPassword('');
    }
    setMode(newMode);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBusy) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    if (mode === 'forgot') {
      if (!email.trim() || !isValidEmail(email)) {
        setErrorMessage('Vui lòng nhập địa chỉ email hợp lệ.');
        return;
      }
      setIsLoading(true);
      const res = await resetPassword(email.trim());
      setIsLoading(false);
      if (res.success) {
        setSuccessMessage(`Đã gửi liên kết và mã xác thực đến ${email.trim()}. Vui lòng kiểm tra email và nhập mã xác thực bên dưới để đặt mật khẩu mới.`);
        // Seamlessly transition to Step 2 so user can enter the verification code & new password!
        setMode('resetNewPassword');
      } else {
        setErrorMessage(res.message);
      }
      return;
    }

    if (mode === 'resetNewPassword') {
      if (!resetCode.trim()) {
        setErrorMessage('Vui lòng nhập hoặc dán mã xác thực nhận được trong email.');
        return;
      }
      const passValidation = validateRegistrationPassword(newPassword);
      if (!passValidation.isValid) {
        setErrorMessage(passValidation.message || 'Mật khẩu mới chưa đáp ứng tiêu chuẩn an toàn.');
        return;
      }
      if (newPassword !== confirmNewPassword) {
        setErrorMessage('Mật khẩu xác nhận không khớp.');
        return;
      }

      setIsLoading(true);
      try {
        const res = await completePasswordReset(resetCode.trim(), newPassword);
        setIsLoading(false);
        if (res.success) {
          setSuccessMessage(res.message);
          setNewPassword('');
          setConfirmNewPassword('');
          setResetCode('');
          if (typeof window !== 'undefined' && window.history?.replaceState) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
          setTimeout(() => {
            setMode('login');
            setSuccessMessage('Mật khẩu đã được cập nhật thành công! Vui lòng đăng nhập với mật khẩu mới.');
          }, 1800);
        } else {
          setErrorMessage(res.message);
        }
      } catch (err: any) {
        setIsLoading(false);
        setErrorMessage(getAuthErrorMessage(err));
      }
      return;
    }

    if (mode === 'register') {
      if (!displayName.trim()) {
        setErrorMessage('Vui lòng nhập họ và tên của bạn.');
        return;
      }
      if (!isValidEmail(email)) {
        setErrorMessage('Vui lòng nhập địa chỉ email hợp lệ.');
        return;
      }
      const passValidation = validateRegistrationPassword(password);
      if (!passValidation.isValid) {
        setErrorMessage(passValidation.message || 'Mật khẩu chưa đáp ứng tiêu chuẩn an toàn.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Mật khẩu xác nhận không khớp.');
        return;
      }

      setIsLoading(true);
      try {
        const profile = await registerWithEmailPassword(email.trim(), password, displayName.trim());
        setIsLoading(false);
        setSuccessMessage('Đăng ký tài khoản thành công! Đang chuyển tiếp...');
        setTimeout(() => {
          onSuccess(profile);
          onClose();
        }, 600);
      } catch (err: any) {
        setIsLoading(false);
        if (err?.code === 'auth/operation-not-allowed') {
          setErrorMessage('Hệ thống đăng nhập bằng Email tạm thời đang bảo trì cấu hình. Vui lòng thử lại sau hoặc tiếp tục với Google.');
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
      const profile = await loginWithEmailPassword(email.trim(), password);
      setIsLoading(false);
      setSuccessMessage('Đăng nhập thành công!');
      setTimeout(() => {
        onSuccess(profile);
        onClose();
      }, 500);
    } catch (err: any) {
      setIsLoading(false);
      if (err?.code === 'auth/operation-not-allowed') {
        setErrorMessage('Hệ thống đăng nhập bằng Email tạm thời đang bảo trì cấu hình. Vui lòng thử lại sau hoặc tiếp tục với Google.');
      } else {
        setErrorMessage(getAuthErrorMessage(err));
      }
    }
  };

  const handleGoogleSignIn = async () => {
    if (isBusy) return;
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
      if (err?.code === 'auth/popup-closed-by-user') {
        setErrorMessage('Cửa sổ đăng nhập Google đã được đóng.');
      } else {
        setErrorMessage(getAuthErrorMessage(err));
      }
    }
  };

  const handleGuestContinue = () => {
    if (isBusy) return;
    const randomSuffix =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID().slice(0, 8)
        : Math.random().toString(36).substring(2, 9);

    const guestProfile: UserProfile = {
      id: `guest-${randomSuffix}`,
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isBusy) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl max-w-md w-full shadow-2xl relative overflow-hidden text-[var(--color-text-primary)] my-auto max-h-[calc(100vh-2rem)] flex flex-col"
        id="auth-modal"
      >
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-primary)]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button - always pinned top-right and accessible */}
        <button
          type="button"
          onClick={onClose}
          disabled={isBusy}
          className="absolute top-3.5 right-3.5 z-20 p-2 rounded-xl text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border)]/50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          title="Đóng cửa sổ"
          aria-label="Đóng cửa sổ đăng nhập"
          id="auth-modal-close-btn"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable content container for perfect mobile & small laptop fit */}
        <div className="overflow-y-auto px-5 py-5 sm:px-7 sm:py-6 space-y-4 relative z-10 overscroll-contain">
          {/* Brand Header */}
          <div className="text-center space-y-1.5 relative z-10 flex flex-col items-center">
            <MinnieLogo size={52} variant="badge" />
            <h2
              id="auth-modal-title"
              className="text-xl sm:text-2xl font-black tracking-tight text-[var(--color-text-primary)]"
            >
              {mode === 'login' && 'Chào mừng trở lại!'}
              {mode === 'register' && 'Tạo tài khoản học Minnie Chinese'}
              {mode === 'forgot' && 'Khôi phục mật khẩu'}
              {mode === 'resetNewPassword' && 'Đặt mật khẩu mới'}
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)] max-w-xs leading-relaxed">
              {mode === 'login' && 'Đăng nhập để đồng bộ tiến độ ôn tập Flashcards và lịch sử điểm số.'}
              {mode === 'register' && 'Bắt đầu hành trình chinh phục HSK 1-6 chuẩn quốc tế với AI.'}
              {mode === 'forgot' && 'Nhập email đã đăng ký để nhận liên kết hoặc mã xác thực an toàn.'}
              {mode === 'resetNewPassword' && 'Nhập mã xác thực từ email và thiết lập mật khẩu mới cho tài khoản.'}
            </p>
          </div>

          {/* Tab Switcher (Login vs Register) */}
          {mode !== 'forgot' && mode !== 'resetNewPassword' && (
            <div className="flex p-1 bg-[var(--color-background)] rounded-2xl border border-[var(--color-border)] relative z-10">
              <button
                type="button"
                disabled={isBusy}
                onClick={() => handleSwitchMode('login')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
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
                disabled={isBusy}
                onClick={() => handleSwitchMode('register')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
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
          <div
            role="alert"
            aria-live="assertive"
            className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs space-y-2 animate-in fade-in"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          </div>
        )}
        {successMessage && (
          <div
            role="status"
            aria-live="polite"
            className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs flex items-start gap-2 animate-in fade-in font-medium"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* Email/Password Form */}
        <form onSubmit={handleEmailSubmit} className="space-y-3 relative z-10">
          {mode === 'resetNewPassword' ? (
            <div className="space-y-3">
              {/* Reset Code Input */}
              <div>
                <label
                  htmlFor="auth-input-reset-code"
                  className="block text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1"
                >
                  Mã xác thực từ Email
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[var(--color-text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    disabled={isBusy}
                    placeholder="Dán mã hoặc toàn bộ liên kết từ email"
                    value={resetCode}
                    onChange={(e) => handleResetCodeChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                    id="auth-input-reset-code"
                  />
                </div>
                <p className="text-[11px] text-[var(--color-text-secondary)] mt-1">
                  Mẹo: Bạn có thể dán toàn bộ đường link nhận được trong email vào ô này.
                </p>
              </div>

              {/* New Password */}
              <div className="space-y-1">
                <label
                  htmlFor="auth-input-new-password"
                  className="block text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1"
                >
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[var(--color-text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    disabled={isBusy}
                    autoComplete="new-password"
                    placeholder="Tối thiểu 8 ký tự"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] font-sans disabled:opacity-50 disabled:cursor-not-allowed"
                    id="auth-input-new-password"
                  />
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label={showNewPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer p-1 disabled:opacity-50"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Real-time Password Strength Meter UI for Reset */}
                {newPassword.length > 0 && (
                  <div className="space-y-2 pt-1 animate-in fade-in duration-150">
                    <div className="flex items-center gap-1.5" aria-hidden="true">
                      {[1, 2, 3, 4].map((tier) => {
                        const isFilled = newPasswordStrength.score >= tier;
                        return (
                          <div
                            key={tier}
                            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                              isFilled
                                ? newPasswordStrength.barColorClass
                                : 'bg-[var(--color-border)]'
                            }`}
                          />
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[var(--color-text-secondary)]">Độ mạnh mật khẩu:</span>
                      <span className={`font-bold ${newPasswordStrength.colorClass}`}>
                        {newPasswordStrength.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] pt-1 border-t border-[var(--color-border)]/50">
                      <div className={`flex items-center gap-1.5 ${newPasswordStrength.criteria.minLength ? 'text-emerald-500 font-medium' : 'text-[var(--color-text-secondary)]'}`}>
                        {newPasswordStrength.criteria.minLength ? <Check className="w-3.5 h-3.5 shrink-0" /> : <X className="w-3.5 h-3.5 shrink-0" />}
                        <span>Tối thiểu 8 ký tự</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${newPasswordStrength.criteria.hasUpperCase && newPasswordStrength.criteria.hasLowerCase ? 'text-emerald-500 font-medium' : 'text-[var(--color-text-secondary)]'}`}>
                        {newPasswordStrength.criteria.hasUpperCase && newPasswordStrength.criteria.hasLowerCase ? <Check className="w-3.5 h-3.5 shrink-0" /> : <X className="w-3.5 h-3.5 shrink-0" />}
                        <span>Chữ hoa & thường</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${newPasswordStrength.criteria.hasDigit || newPasswordStrength.criteria.hasSpecialChar ? 'text-emerald-500 font-medium' : 'text-[var(--color-text-secondary)]'}`}>
                        {newPasswordStrength.criteria.hasDigit || newPasswordStrength.criteria.hasSpecialChar ? <Check className="w-3.5 h-3.5 shrink-0" /> : <X className="w-3.5 h-3.5 shrink-0" />}
                        <span>Số / ký tự đặc biệt</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${newPasswordStrength.criteria.notBlacklisted ? 'text-emerald-500 font-medium' : 'text-rose-500 font-medium'}`}>
                        {newPasswordStrength.criteria.notBlacklisted ? <Check className="w-3.5 h-3.5 shrink-0" /> : <X className="w-3.5 h-3.5 shrink-0" />}
                        <span>Không dễ đoán</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1">
                <label
                  htmlFor="auth-input-confirm-new-password"
                  className="block text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1"
                >
                  Xác nhận mật khẩu mới
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[var(--color-text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirmNewPassword ? 'text' : 'password'}
                    required
                    disabled={isBusy}
                    autoComplete="new-password"
                    placeholder="Nhập lại mật khẩu mới"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] font-sans disabled:opacity-50 disabled:cursor-not-allowed"
                    id="auth-input-confirm-new-password"
                  />
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                    aria-label={showConfirmNewPassword ? 'Ẩn xác nhận mật khẩu' : 'Hiện xác nhận mật khẩu'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer p-1 disabled:opacity-50"
                  >
                    {showConfirmNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Match Status Indicator */}
                {confirmNewPassword.length > 0 && (
                  <div className="pt-1">
                    {newPassword === confirmNewPassword ? (
                      <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium animate-in fade-in">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                        <span>Mật khẩu xác nhận trùng khớp</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[11px] text-rose-500 font-medium animate-in fade-in">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Mật khẩu xác nhận chưa khớp</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Display Name (Register only) */}
              {mode === 'register' && (
                <div>
                  <label
                    htmlFor="auth-input-name"
                    className="block text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1"
                  >
                    Họ và tên
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[var(--color-text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      disabled={isBusy}
                      autoComplete="name"
                      placeholder="VD: Nguyễn Minh Châu"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
                      id="auth-input-name"
                    />
                  </div>
                </div>
              )}

              {/* Email Address */}
              <div>
                <label
                  htmlFor="auth-input-email"
                  className="block text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1"
                >
                  Địa chỉ Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[var(--color-text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    disabled={isBusy}
                    autoComplete="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] font-sans disabled:opacity-50 disabled:cursor-not-allowed"
                    id="auth-input-email"
                  />
                </div>
              </div>

              {/* Password */}
              {mode !== 'forgot' && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="auth-input-password"
                      className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider"
                    >
                      Mật khẩu
                    </label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleSwitchMode('forgot')}
                        className="text-xs font-semibold text-[var(--color-primary)] hover:underline cursor-pointer disabled:opacity-50"
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
                      disabled={isBusy}
                      autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                      placeholder={mode === 'register' ? 'Tối thiểu 8 ký tự' : 'Nhập mật khẩu của bạn'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] font-sans disabled:opacity-50 disabled:cursor-not-allowed"
                      id="auth-input-password"
                    />
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer p-1 disabled:opacity-50"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Real-time Password Strength Meter UI (Register only) */}
                  {mode === 'register' && password.length > 0 && (
                    <div className="space-y-2 pt-1 animate-in fade-in duration-150">
                      <div className="flex items-center gap-1.5" aria-hidden="true">
                        {[1, 2, 3, 4].map((tier) => {
                          const isFilled = passwordStrength.score >= tier;
                          return (
                            <div
                              key={tier}
                              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                                isFilled
                                  ? passwordStrength.barColorClass
                                  : 'bg-[var(--color-border)]'
                              }`}
                            />
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[var(--color-text-secondary)]">Độ mạnh mật khẩu:</span>
                        <span className={`font-bold ${passwordStrength.colorClass}`}>
                          {passwordStrength.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] pt-1 border-t border-[var(--color-border)]/50">
                        <div
                          className={`flex items-center gap-1.5 ${
                            passwordStrength.criteria.minLength
                              ? 'text-emerald-500 font-medium'
                              : 'text-[var(--color-text-secondary)]'
                          }`}
                        >
                          {passwordStrength.criteria.minLength ? (
                            <Check className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <X className="w-3.5 h-3.5 shrink-0" />
                          )}
                          <span>Tối thiểu 8 ký tự</span>
                        </div>

                        <div
                          className={`flex items-center gap-1.5 ${
                            passwordStrength.criteria.hasUpperCase &&
                            passwordStrength.criteria.hasLowerCase
                              ? 'text-emerald-500 font-medium'
                              : 'text-[var(--color-text-secondary)]'
                          }`}
                        >
                          {passwordStrength.criteria.hasUpperCase &&
                          passwordStrength.criteria.hasLowerCase ? (
                            <Check className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <X className="w-3.5 h-3.5 shrink-0" />
                          )}
                          <span>Chữ hoa & thường</span>
                        </div>

                        <div
                          className={`flex items-center gap-1.5 ${
                            passwordStrength.criteria.hasDigit ||
                            passwordStrength.criteria.hasSpecialChar
                              ? 'text-emerald-500 font-medium'
                              : 'text-[var(--color-text-secondary)]'
                          }`}
                        >
                          {passwordStrength.criteria.hasDigit ||
                          passwordStrength.criteria.hasSpecialChar ? (
                            <Check className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <X className="w-3.5 h-3.5 shrink-0" />
                          )}
                          <span>Số / ký tự đặc biệt</span>
                        </div>

                        <div
                          className={`flex items-center gap-1.5 ${
                            passwordStrength.criteria.notBlacklisted
                              ? 'text-emerald-500 font-medium'
                              : 'text-rose-500 font-medium'
                          }`}
                        >
                          {passwordStrength.criteria.notBlacklisted ? (
                            <Check className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <X className="w-3.5 h-3.5 shrink-0" />
                          )}
                          <span>Không dễ đoán</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Confirm Password (Register only) */}
              {mode === 'register' && (
                <div className="space-y-1">
                  <label
                    htmlFor="auth-input-confirm-password"
                    className="block text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1"
                  >
                    Xác nhận mật khẩu
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-[var(--color-text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      disabled={isBusy}
                      autoComplete="new-password"
                      placeholder="Nhập lại mật khẩu"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] font-sans disabled:opacity-50 disabled:cursor-not-allowed"
                      id="auth-input-confirm-password"
                    />
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? 'Ẩn xác nhận mật khẩu' : 'Hiện xác nhận mật khẩu'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer p-1 disabled:opacity-50"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Match Status Indicator */}
                  {confirmPassword.length > 0 && (
                    <div className="pt-1">
                      {password === confirmPassword ? (
                        <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium animate-in fade-in">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                          <span>Mật khẩu xác nhận trùng khớp</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[11px] text-rose-500 font-medium animate-in fade-in">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>Mật khẩu xác nhận chưa khớp</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isBusy}
            className="w-full py-2.5 px-4 rounded-xl bg-[var(--color-primary)] text-white font-bold text-sm hover:bg-[var(--color-primary-dark)] active:scale-[0.99] transition-all shadow-md shadow-[var(--color-primary)]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-1.5"
            id="auth-submit-btn"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : mode === 'forgot' ? (
              <span>Gửi mã xác thực về Email</span>
            ) : mode === 'resetNewPassword' ? (
              <span>Xác nhận & Cập nhật mật khẩu mới</span>
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

        {/* Back to login option if in forgot or reset mode */}
        {(mode === 'forgot' || mode === 'resetNewPassword') && (
          <div className="text-center pt-1 space-y-1.5">
            {mode === 'resetNewPassword' && (
              <button
                type="button"
                disabled={isBusy}
                onClick={() => handleSwitchMode('forgot')}
                className="block w-full text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] cursor-pointer disabled:opacity-50"
              >
                ← Chưa nhận được mã? Gửi lại yêu cầu
              </button>
            )}
            <button
              type="button"
              disabled={isBusy}
              onClick={() => handleSwitchMode('login')}
              className="text-xs font-bold text-[var(--color-primary)] hover:underline cursor-pointer disabled:opacity-50"
            >
              ← Quay lại trang Đăng nhập
            </button>
          </div>
        )}

        {/* Divider */}
        {mode !== 'forgot' && mode !== 'resetNewPassword' && (
          <>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[var(--color-border)]" />
              <span className="text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                hoặc
              </span>
              <div className="flex-1 h-px bg-[var(--color-border)]" />
            </div>

            {/* Google 1-Click Login & Guest Mode */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isBusy}
                className="w-full py-2.5 px-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] hover:bg-[var(--color-surface)] text-[var(--color-text-primary)] text-xs font-bold flex items-center justify-center gap-2.5 transition-all shadow-xs active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
                disabled={isBusy}
                className="w-full py-1.5 px-4 rounded-xl text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-medium text-center transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Dùng thử ngay (Chế độ Khách)
              </button>
            </div>
          </>
        )}
        </div>
      </div>
    </div>
  );
};
