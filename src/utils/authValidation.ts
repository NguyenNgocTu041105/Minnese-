/**
 * Authentication and Registration Validation Utilities for MinNese
 * Provides robust password evaluation, blacklist checking, and email validation.
 */

export type PasswordStrengthLevel = 'weak' | 'fair' | 'good' | 'strong';

export interface PasswordCriteria {
  minLength: boolean; // >= 8 chars
  hasUpperCase: boolean; // >= 1 uppercase letter
  hasLowerCase: boolean; // >= 1 lowercase letter
  hasDigit: boolean; // >= 1 digit
  hasSpecialChar: boolean; // >= 1 special character
  notBlacklisted: boolean; // Not in weak/common password blacklist
}

export interface PasswordStrengthResult {
  score: number; // 0 to 4
  level: PasswordStrengthLevel;
  label: string; // 'Yếu' | 'Trung bình' | 'Tốt' | 'Rất mạnh'
  colorClass: string;
  barColorClass: string;
  criteria: PasswordCriteria;
  feedback: string[];
  isValidForRegistration: boolean;
}

/**
 * Common trivial and vulnerable passwords that are strictly forbidden.
 */
export const COMMON_PASSWORDS_BLACKLIST = new Set([
  '123456',
  '1234567',
  '12345678',
  '123456789',
  '1234567890',
  'password',
  'password123',
  'pass1234',
  'qwerty',
  'qwertyuiop',
  'asdfgh',
  'zxcvbnm',
  '111111',
  '11111111',
  '000000',
  '123123',
  'admin',
  'admin123',
  'minnese',
  'minnese123',
  'abc123',
  'abcdef',
  'iloveyou',
  'welcome',
  'monkey',
  'dragon',
  'letmein',
  'sunshine',
  'master',
  'football',
]);

/**
 * Validates standard email address format using RFC 5322 compliant pattern.
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length === 0 || trimmed.length > 254) return false;

  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(trimmed);
}

/**
 * Checks whether a candidate password is in the common blacklist,
 * contains repeated single characters (e.g. 'aaaaaa', '111111'), or simple numeric sequences.
 */
export function isBlacklistedPassword(password: string): boolean {
  if (!password) return true;
  const lower = password.toLowerCase().trim();

  if (COMMON_PASSWORDS_BLACKLIST.has(lower)) {
    return true;
  }

  // All identical characters (e.g. "aaaaaa", "88888888")
  if (/^(.)\1+$/.test(password) && password.length >= 4) {
    return true;
  }

  // Simple sequential numbers (e.g. "12345678")
  const sequentialPatterns = ['0123456789', '9876543210', 'abcdefghijklmnopqrstuvwxyz'];
  for (const seq of sequentialPatterns) {
    if (seq.includes(lower) && lower.length >= 6) {
      return true;
    }
  }

  return false;
}

/**
 * Comprehensive password strength evaluation across length, character variety, and blacklist checks.
 * Produces a 4-tier score: Weak (1), Fair (2), Good (3), Strong (4).
 */
export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  const p = password || '';

  const criteria: PasswordCriteria = {
    minLength: p.length >= 8,
    hasUpperCase: /[A-Z]/.test(p),
    hasLowerCase: /[a-z]/.test(p),
    hasDigit: /[0-9]/.test(p),
    hasSpecialChar: /[^A-Za-z0-9]/.test(p),
    notBlacklisted: !isBlacklistedPassword(p),
  };

  const feedback: string[] = [];
  if (!criteria.minLength) {
    feedback.push('Mật khẩu cần tối thiểu 8 ký tự.');
  }
  if (!criteria.notBlacklisted) {
    feedback.push('Mật khẩu quá phổ biến hoặc dễ đoán.');
  }
  if (!criteria.hasUpperCase || !criteria.hasLowerCase) {
    feedback.push('Nên kết hợp cả chữ hoa và chữ thường.');
  }
  if (!criteria.hasDigit) {
    feedback.push('Nên thêm ít nhất một chữ số (0-9).');
  }
  if (!criteria.hasSpecialChar) {
    feedback.push('Nên thêm ít nhất một ký tự đặc biệt (!@#$...).');
  }

  if (p.length === 0) {
    return {
      score: 0,
      level: 'weak',
      label: 'Chưa nhập',
      colorClass: 'text-[var(--color-text-secondary)]',
      barColorClass: 'bg-zinc-300 dark:bg-zinc-700',
      criteria,
      feedback: ['Vui lòng nhập mật khẩu an toàn.'],
      isValidForRegistration: false,
    };
  }

  // If blacklisted or extremely short, unconditionally Weak
  if (!criteria.notBlacklisted || p.length < 6) {
    return {
      score: 1,
      level: 'weak',
      label: 'Yếu',
      colorClass: 'text-rose-500',
      barColorClass: 'bg-rose-500',
      criteria,
      feedback: criteria.notBlacklisted ? feedback : ['Mật khẩu quá yếu và dễ đoán. Vui lòng chọn mật khẩu phức tạp hơn.'],
      isValidForRegistration: false,
    };
  }

  // Count complexity variety points
  let varietyCount = 0;
  if (criteria.hasUpperCase) varietyCount++;
  if (criteria.hasLowerCase) varietyCount++;
  if (criteria.hasDigit) varietyCount++;
  if (criteria.hasSpecialChar) varietyCount++;

  let score = 1;
  let level: PasswordStrengthLevel = 'weak';
  let label = 'Yếu';
  let colorClass = 'text-rose-500';
  let barColorClass = 'bg-rose-500';

  if (criteria.minLength && criteria.notBlacklisted) {
    if (varietyCount >= 4 && p.length >= 10) {
      score = 4;
      level = 'strong';
      label = 'Rất mạnh';
      colorClass = 'text-emerald-500';
      barColorClass = 'bg-emerald-500';
    } else if (varietyCount >= 3) {
      score = 3;
      level = 'good';
      label = 'Tốt';
      colorClass = 'text-teal-500';
      barColorClass = 'bg-teal-500';
    } else if (varietyCount >= 2) {
      score = 2;
      level = 'fair';
      label = 'Trung bình';
      colorClass = 'text-amber-500';
      barColorClass = 'bg-amber-500';
    } else {
      score = 1;
      level = 'weak';
      label = 'Yếu';
      colorClass = 'text-orange-500';
      barColorClass = 'bg-orange-500';
    }
  } else {
    // Length is between 6 and 7 characters
    score = 1;
    level = 'weak';
    label = 'Yếu';
    colorClass = 'text-orange-500';
    barColorClass = 'bg-orange-500';
  }

  // Registration requires: length >= 8, not blacklisted, and at least 2 variety factors (score >= 2)
  const isValidForRegistration =
    criteria.minLength && criteria.notBlacklisted && varietyCount >= 2;

  return {
    score,
    level,
    label,
    colorClass,
    barColorClass,
    criteria,
    feedback,
    isValidForRegistration,
  };
}

/**
 * Validates candidate password for account creation and returns user-friendly Vietnamese error.
 */
export function validateRegistrationPassword(password: string): {
  isValid: boolean;
  message?: string;
} {
  if (!password || password.length === 0) {
    return { isValid: false, message: 'Vui lòng nhập mật khẩu.' };
  }

  if (password.length < 8) {
    return {
      isValid: false,
      message: 'Mật khẩu phải có tối thiểu 8 ký tự để đảm bảo an toàn.',
    };
  }

  if (isBlacklistedPassword(password)) {
    return {
      isValid: false,
      message: 'Mật khẩu này quá phổ biến và dễ đoán. Vui lòng chọn mật khẩu phức tạp hơn.',
    };
  }

  const strength = evaluatePasswordStrength(password);
  if (!strength.isValidForRegistration) {
    return {
      isValid: false,
      message: 'Mật khẩu cần kết hợp ít nhất 2 trong các loại: chữ hoa, chữ thường, chữ số hoặc ký tự đặc biệt.',
    };
  }

  return { isValid: true };
}

/**
 * Validates real-time confirmation password matching.
 */
export function validatePasswordConfirmation(
  password: string,
  confirmPassword: string
): { isMatch: boolean; message?: string } {
  if (!confirmPassword) {
    return { isMatch: false };
  }
  if (password !== confirmPassword) {
    return { isMatch: false, message: 'Mật khẩu xác nhận không khớp.' };
  }
  return { isMatch: true, message: 'Mật khẩu trùng khớp.' };
}
