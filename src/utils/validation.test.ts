import { describe, it, expect } from 'vitest';
import {
  isValidEmail,
  isValidPassword,
  validateLoginForm,
  validateRegisterForm,
} from './validation';

describe('validation', () => {
  describe('isValidEmail', () => {
    it('returns true for valid email formats', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('user.name@example.com')).toBe(true);
      expect(isValidEmail('user+tag@example.co.uk')).toBe(true);
      expect(isValidEmail('user123@test.org')).toBe(true);
    });

    it('returns false for invalid email formats', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('user@example')).toBe(false);
      expect(isValidEmail('user example@test.com')).toBe(false);
    });
  });

  describe('isValidPassword', () => {
    it('returns true for passwords with 8 or more characters', () => {
      expect(isValidPassword('12345678')).toBe(true);
      expect(isValidPassword('password123')).toBe(true);
      expect(isValidPassword('verylongpassword')).toBe(true);
    });

    it('returns false for passwords with less than 8 characters', () => {
      expect(isValidPassword('')).toBe(false);
      expect(isValidPassword('1234567')).toBe(false);
      expect(isValidPassword('short')).toBe(false);
    });
  });

  describe('validateLoginForm', () => {
    it('returns valid for correct email and password', () => {
      const result = validateLoginForm('user@example.com', 'password123');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('returns error for empty email', () => {
      const result = validateLoginForm('', 'password123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Email is required');
    });

    it('returns error for invalid email format', () => {
      const result = validateLoginForm('invalid-email', 'password123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid email format');
    });

    it('returns error for empty password', () => {
      const result = validateLoginForm('user@example.com', '');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password is required');
    });

    it('returns multiple errors for both invalid inputs', () => {
      const result = validateLoginForm('', '');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Email is required');
      expect(result.errors).toContain('Password is required');
      expect(result.errors).toHaveLength(2);
    });

    it('does not check password length for login', () => {
      // Login only checks if password exists, not length
      const result = validateLoginForm('user@example.com', 'short');
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateRegisterForm', () => {
    it('returns valid for all correct inputs', () => {
      const result = validateRegisterForm(
        'user@example.com',
        'password123',
        'password123'
      );
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('returns error for empty email', () => {
      const result = validateRegisterForm('', 'password123', 'password123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Email is required');
    });

    it('returns error for invalid email format', () => {
      const result = validateRegisterForm(
        'invalid-email',
        'password123',
        'password123'
      );
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid email format');
    });

    it('returns error for empty password', () => {
      const result = validateRegisterForm('user@example.com', '', '');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password is required');
    });

    it('returns error for password less than 8 characters', () => {
      const result = validateRegisterForm('user@example.com', 'short', 'short');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters');
    });

    it('returns error when passwords do not match', () => {
      const result = validateRegisterForm(
        'user@example.com',
        'password123',
        'password456'
      );
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Passwords do not match');
    });

    it('returns multiple errors for multiple invalid inputs', () => {
      const result = validateRegisterForm('invalid', 'short', 'different');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid email format');
      expect(result.errors).toContain('Password must be at least 8 characters');
      expect(result.errors).toContain('Passwords do not match');
      expect(result.errors).toHaveLength(3);
    });

    it('returns password mismatch error even with valid passwords', () => {
      const result = validateRegisterForm(
        'user@example.com',
        'password123',
        'password456'
      );
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Passwords do not match');
    });
  });
});
