import { describe, it, expect } from 'vitest';
import {
  isValidEmail,
  isBlacklistedPassword,
  evaluatePasswordStrength,
  validateRegistrationPassword,
  validatePasswordConfirmation,
  COMMON_PASSWORDS_BLACKLIST,
} from '../src/utils/authValidation';
import { getAuthErrorMessage } from '../src/lib/firebase';

describe('Auth Validation & Password Strength Suite', () => {
  describe('isValidEmail', () => {
    it('accepts valid email formats', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('student.minnese@domain.vn')).toBe(true);
      expect(isValidEmail('test+alias@sub.domain.org')).toBe(true);
    });

    it('rejects invalid email formats', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('plainaddress')).toBe(false);
      expect(isValidEmail('missing-domain@')).toBe(false);
      expect(isValidEmail('@missing-local.com')).toBe(false);
      expect(isValidEmail('spaces in@email.com')).toBe(false);
      expect(isValidEmail(null as unknown as string)).toBe(false);
    });
  });

  describe('isBlacklistedPassword', () => {
    it('detects common blacklisted passwords', () => {
      expect(isBlacklistedPassword('123456')).toBe(true);
      expect(isBlacklistedPassword('password')).toBe(true);
      expect(isBlacklistedPassword('qwerty')).toBe(true);
      expect(isBlacklistedPassword('admin123')).toBe(true);
      expect(isBlacklistedPassword('minnese')).toBe(true);
    });

    it('detects repeated single-character passwords', () => {
      expect(isBlacklistedPassword('aaaaaa')).toBe(true);
      expect(isBlacklistedPassword('111111')).toBe(true);
      expect(isBlacklistedPassword('88888888')).toBe(true);
    });

    it('detects simple sequential strings', () => {
      expect(isBlacklistedPassword('12345678')).toBe(true);
      expect(isBlacklistedPassword('abcdefgh')).toBe(true);
    });

    it('allows strong, non-blacklisted passwords', () => {
      expect(isBlacklistedPassword('P@ssw0rdMinNese!2026')).toBe(false);
      expect(isBlacklistedPassword('Hsk6Master#99')).toBe(false);
    });
  });

  describe('evaluatePasswordStrength', () => {
    it('handles empty input gracefully', () => {
      const res = evaluatePasswordStrength('');
      expect(res.score).toBe(0);
      expect(res.level).toBe('weak');
      expect(res.isValidForRegistration).toBe(false);
    });

    it('rates "123456" as weak (score 1) and invalid for registration', () => {
      const res = evaluatePasswordStrength('123456');
      expect(res.score).toBe(1);
      expect(res.level).toBe('weak');
      expect(res.label).toBe('Yếu');
      expect(res.criteria.minLength).toBe(false);
      expect(res.criteria.notBlacklisted).toBe(false);
      expect(res.isValidForRegistration).toBe(false);
    });

    it('rates short passwords as weak and invalid for registration', () => {
      const res = evaluatePasswordStrength('Ab1!');
      expect(res.score).toBe(1);
      expect(res.level).toBe('weak');
      expect(res.criteria.minLength).toBe(false);
      expect(res.isValidForRegistration).toBe(false);
    });

    it('rates length >= 8 with 2 variety factors as fair', () => {
      const res = evaluatePasswordStrength('abcdef12');
      expect(res.score).toBe(2);
      expect(res.level).toBe('fair');
      expect(res.label).toBe('Trung bình');
      expect(res.criteria.minLength).toBe(true);
      expect(res.isValidForRegistration).toBe(true);
    });

    it('rates length >= 8 with 3 variety factors as good', () => {
      const res = evaluatePasswordStrength('Abcdefg12');
      expect(res.score).toBe(3);
      expect(res.level).toBe('good');
      expect(res.label).toBe('Tốt');
      expect(res.isValidForRegistration).toBe(true);
    });

    it('rates length >= 10 with all 4 variety factors as strong', () => {
      const res = evaluatePasswordStrength('Abcdefg12!@#');
      expect(res.score).toBe(4);
      expect(res.level).toBe('strong');
      expect(res.label).toBe('Rất mạnh');
      expect(res.isValidForRegistration).toBe(true);
      expect(res.criteria.hasUpperCase).toBe(true);
      expect(res.criteria.hasLowerCase).toBe(true);
      expect(res.criteria.hasDigit).toBe(true);
      expect(res.criteria.hasSpecialChar).toBe(true);
    });
  });

  describe('validateRegistrationPassword', () => {
    it('rejects passwords under 8 characters', () => {
      const res = validateRegistrationPassword('123456');
      expect(res.isValid).toBe(false);
      expect(res.message).toContain('8 ký tự');
    });

    it('rejects blacklisted passwords', () => {
      const res = validateRegistrationPassword('password');
      expect(res.isValid).toBe(false);
    });

    it('accepts compliant passwords', () => {
      const res = validateRegistrationPassword('MinNese@2026!');
      expect(res.isValid).toBe(true);
      expect(res.message).toBeUndefined();
    });
  });

  describe('validatePasswordConfirmation', () => {
    it('confirms matching passwords', () => {
      const res = validatePasswordConfirmation('Secret123!', 'Secret123!');
      expect(res.isMatch).toBe(true);
      expect(res.message).toBe('Mật khẩu trùng khớp.');
    });

    it('flags non-matching passwords', () => {
      const res = validatePasswordConfirmation('Secret123!', 'Different123!');
      expect(res.isMatch).toBe(false);
      expect(res.message).toBe('Mật khẩu xác nhận không khớp.');
    });

    it('handles empty confirmation', () => {
      const res = validatePasswordConfirmation('Secret123!', '');
      expect(res.isMatch).toBe(false);
      expect(res.message).toBeUndefined();
    });
  });

  describe('getAuthErrorMessage Translations & Sanitization', () => {
    it('translates operation-not-allowed without leaking Firebase Console advice', () => {
      const msg = getAuthErrorMessage({ code: 'auth/operation-not-allowed' });
      expect(msg).toContain('bảo trì cấu hình');
      expect(msg).not.toContain('Firebase Console');
      expect(msg).not.toContain('Đăng nhập trực tiếp');
    });

    it('translates invalid-credential accurately', () => {
      const msg = getAuthErrorMessage({ code: 'auth/invalid-credential' });
      expect(msg).toContain('không chính xác');
    });

    it('translates user-disabled', () => {
      const msg = getAuthErrorMessage({ code: 'auth/user-disabled' });
      expect(msg).toContain('tạm khóa');
    });

    it('translates popup-blocked', () => {
      const msg = getAuthErrorMessage({ code: 'auth/popup-blocked' });
      expect(msg).toContain('pop-up');
    });

    it('translates unauthorized-domain', () => {
      const msg = getAuthErrorMessage({ code: 'auth/unauthorized-domain' });
      expect(msg).toContain('Tên miền');
    });

    it('translates invalid-action-code and expired-action-code', () => {
      const invalidCodeMsg = getAuthErrorMessage({ code: 'auth/invalid-action-code' });
      expect(invalidCodeMsg).toContain('Mã xác thực không hợp lệ');

      const expiredCodeMsg = getAuthErrorMessage({ code: 'auth/expired-action-code' });
      expect(expiredCodeMsg).toContain('Mã xác thực đã hết hạn');
    });

    it('sanitizes raw Firebase internal errors', () => {
      const msg = getAuthErrorMessage({
        message: 'Firebase: Error (auth/internal-error). Some technical trace',
      });
      expect(msg).not.toContain('Firebase: Error');
      expect(msg).toContain('quá trình xác thực');
    });
  });
});
