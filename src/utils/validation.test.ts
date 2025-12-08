import { describe, it, expect } from 'vitest';
import {
  isValidEmail,
  isValidPassword,
  validateLoginForm,
  validateRegisterForm,
  escapePostgrestValue,
  validateBiomarker,
  validateBiomarkers,
  filterIncompleteBiomarkers,
  type BiomarkerInput,
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

  describe('escapePostgrestValue', () => {
    it('returns empty string for null/undefined/empty input', () => {
      expect(escapePostgrestValue('')).toBe('');
      expect(escapePostgrestValue(null as unknown as string)).toBe('');
      expect(escapePostgrestValue(undefined as unknown as string)).toBe('');
    });

    it('trims whitespace', () => {
      expect(escapePostgrestValue('  test  ')).toBe('test');
      expect(escapePostgrestValue('\ttest\n')).toBe('test');
    });

    it('removes commas to prevent filter syntax injection', () => {
      expect(escapePostgrestValue('test,value')).toBe('testvalue');
      expect(escapePostgrestValue('a,b,c')).toBe('abc');
    });

    it('removes parentheses to prevent filter syntax injection', () => {
      expect(escapePostgrestValue('test(value)')).toBe('testvalue');
      expect(escapePostgrestValue('(injection)')).toBe('injection');
    });

    it('escapes LIKE wildcards with backslash', () => {
      expect(escapePostgrestValue('100%')).toBe('100\\%');
      expect(escapePostgrestValue('test_value')).toBe('test\\_value');
      expect(escapePostgrestValue('50%_off')).toBe('50\\%\\_off');
    });

    it('removes standalone backslashes to prevent escape injection', () => {
      expect(escapePostgrestValue('test\\value')).toBe('testvalue');
      expect(escapePostgrestValue('a\\b\\c')).toBe('abc');
    });

    it('preserves backslashes that escape wildcards', () => {
      // After escaping, \% and \_ should remain
      const result = escapePostgrestValue('test%');
      expect(result).toBe('test\\%');
    });

    it('handles complex injection attempts', () => {
      // Attempt to inject additional filter predicate
      expect(escapePostgrestValue('),user_id.neq.*')).toBe('user\\_id.neq.*');
      // Attempt to break OR syntax
      expect(escapePostgrestValue('test%,title.gte.z')).toBe('test\\%title.gte.z');
    });

    it('passes through normal search terms unchanged', () => {
      expect(escapePostgrestValue('headache')).toBe('headache');
      expect(escapePostgrestValue('Dr. Smith')).toBe('Dr. Smith');
      expect(escapePostgrestValue('blood pressure')).toBe('blood pressure');
    });
  });

  describe('validateBiomarker', () => {
    const validBiomarker: BiomarkerInput = {
      standardCode: 'hdl-cholesterol',
      name: 'HDL Cholesterol',
      value: 45,
      unit: 'mg/dL',
      referenceMin: 40,
      referenceMax: 60,
    };

    it('returns empty array for valid biomarker', () => {
      const errors = validateBiomarker(validBiomarker);
      expect(errors).toHaveLength(0);
    });

    it('returns error for empty name', () => {
      const errors = validateBiomarker({ ...validBiomarker, name: '' });
      expect(errors).toContain('Biomarker name is required');
    });

    it('returns error for whitespace-only name', () => {
      const errors = validateBiomarker({ ...validBiomarker, name: '   ' });
      expect(errors).toContain('Biomarker name is required');
    });

    it('allows value of 0', () => {
      const errors = validateBiomarker({ ...validBiomarker, value: 0 });
      expect(errors).toHaveLength(0);
    });

    it('allows negative value', () => {
      const errors = validateBiomarker({ ...validBiomarker, value: -5 });
      expect(errors).toHaveLength(0);
    });

    it('returns error for NaN value', () => {
      const errors = validateBiomarker({ ...validBiomarker, value: NaN });
      expect(errors).toContain('Value must be a valid number');
    });

    it('returns error for missing unit when standardCode is set', () => {
      const errors = validateBiomarker({ ...validBiomarker, unit: '' });
      expect(errors).toContain('Unit is required');
    });

    it('allows missing unit when standardCode is not set', () => {
      const biomarker: BiomarkerInput = {
        name: 'Custom Test',
        value: 100,
        unit: '',
      };
      const errors = validateBiomarker(biomarker);
      expect(errors).not.toContain('Unit is required');
    });

    it('returns multiple errors for multiple issues', () => {
      const errors = validateBiomarker({
        standardCode: 'test',
        name: '',
        value: NaN,
        unit: '',
      });
      expect(errors).toContain('Biomarker name is required');
      expect(errors).toContain('Value must be a valid number');
      expect(errors).toContain('Unit is required');
      expect(errors).toHaveLength(3);
    });

    it('accepts very small positive values', () => {
      const errors = validateBiomarker({ ...validBiomarker, value: 0.001 });
      expect(errors).toHaveLength(0);
    });

    it('accepts very large values', () => {
      const errors = validateBiomarker({ ...validBiomarker, value: 99999 });
      expect(errors).toHaveLength(0);
    });

    // Qualitative biomarker tests
    it('validates qualitative biomarker with string value', () => {
      const qualitativeBiomarker: BiomarkerInput = {
        standardCode: 'urine_blood',
        name: 'Urine Blood',
        value: 'Negative',
        unit: 'qualitative',
        isQualitative: true,
      };
      const errors = validateBiomarker(qualitativeBiomarker);
      expect(errors).toHaveLength(0);
    });

    it('returns error for qualitative biomarker with empty string value', () => {
      const qualitativeBiomarker: BiomarkerInput = {
        standardCode: 'urine_blood',
        name: 'Urine Blood',
        value: '',
        unit: 'qualitative',
        isQualitative: true,
      };
      const errors = validateBiomarker(qualitativeBiomarker);
      expect(errors).toContain('Qualitative value is required');
    });

    it('returns error for qualitative biomarker with whitespace-only value', () => {
      const qualitativeBiomarker: BiomarkerInput = {
        standardCode: 'urine_blood',
        name: 'Urine Blood',
        value: '   ',
        unit: 'qualitative',
        isQualitative: true,
      };
      const errors = validateBiomarker(qualitativeBiomarker);
      expect(errors).toContain('Qualitative value is required');
    });

    it('accepts various qualitative values', () => {
      const values = ['Negative', 'Positive', 'Trace', '+', '++', '+++', 'Normal'];
      values.forEach((value) => {
        const biomarker: BiomarkerInput = {
          name: 'Test',
          value,
          unit: 'qualitative',
          isQualitative: true,
        };
        const errors = validateBiomarker(biomarker);
        expect(errors).toHaveLength(0);
      });
    });
  });

  describe('validateBiomarkers', () => {
    const validBiomarker: BiomarkerInput = {
      standardCode: 'hdl-cholesterol',
      name: 'HDL Cholesterol',
      value: 45,
      unit: 'mg/dL',
    };

    it('returns valid for empty array', () => {
      const result = validateBiomarkers([]);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.invalidIndices).toHaveLength(0);
    });

    it('returns valid for array of valid biomarkers', () => {
      const result = validateBiomarkers([
        validBiomarker,
        { ...validBiomarker, name: 'LDL Cholesterol', value: 100 },
      ]);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.invalidIndices).toHaveLength(0);
    });

    it('returns invalid with correct indices for invalid biomarkers', () => {
      const result = validateBiomarkers([
        validBiomarker,
        { ...validBiomarker, value: NaN }, // Invalid at index 1
        validBiomarker,
        { ...validBiomarker, name: '' }, // Invalid at index 3
      ]);
      expect(result.isValid).toBe(false);
      expect(result.invalidIndices).toEqual([1, 3]);
    });

    it('includes index in error messages', () => {
      const result = validateBiomarkers([
        { ...validBiomarker, name: '' },
      ]);
      expect(result.errors[0]).toContain('Biomarker 1:');
    });

    it('reports all errors from all invalid biomarkers', () => {
      const result = validateBiomarkers([
        { standardCode: 'test', name: '', value: NaN, unit: '' },
      ]);
      expect(result.errors.length).toBe(3); // name, value (NaN), unit
    });
  });

  describe('filterIncompleteBiomarkers', () => {
    it('returns empty array for empty input', () => {
      expect(filterIncompleteBiomarkers([])).toEqual([]);
    });

    it('filters out biomarkers without name', () => {
      const biomarkers: BiomarkerInput[] = [
        { standardCode: 'hdl', name: '', value: 45, unit: 'mg/dL' },
        { standardCode: 'ldl', name: 'LDL', value: 100, unit: 'mg/dL' },
      ];
      const result = filterIncompleteBiomarkers(biomarkers);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('LDL');
    });

    it('filters out biomarkers without standardCode', () => {
      const biomarkers: BiomarkerInput[] = [
        { standardCode: '', name: 'HDL', value: 45, unit: 'mg/dL' },
        { standardCode: 'ldl', name: 'LDL', value: 100, unit: 'mg/dL' },
      ];
      const result = filterIncompleteBiomarkers(biomarkers);
      expect(result).toHaveLength(1);
      expect(result[0].standardCode).toBe('ldl');
    });

    it('filters out biomarkers with whitespace-only name or standardCode', () => {
      const biomarkers: BiomarkerInput[] = [
        { standardCode: '   ', name: 'HDL', value: 45, unit: 'mg/dL' },
        { standardCode: 'hdl', name: '   ', value: 45, unit: 'mg/dL' },
        { standardCode: 'ldl', name: 'LDL', value: 100, unit: 'mg/dL' },
      ];
      const result = filterIncompleteBiomarkers(biomarkers);
      expect(result).toHaveLength(1);
    });

    it('keeps complete biomarkers even with zero value', () => {
      // Filter is for incomplete entries, not invalid values
      const biomarkers: BiomarkerInput[] = [
        { standardCode: 'hdl', name: 'HDL', value: 0, unit: 'mg/dL' },
      ];
      const result = filterIncompleteBiomarkers(biomarkers);
      expect(result).toHaveLength(1);
    });

    it('keeps all complete biomarkers', () => {
      const biomarkers: BiomarkerInput[] = [
        { standardCode: 'hdl', name: 'HDL', value: 45, unit: 'mg/dL' },
        { standardCode: 'ldl', name: 'LDL', value: 100, unit: 'mg/dL' },
        { standardCode: 'trig', name: 'Triglycerides', value: 150, unit: 'mg/dL' },
      ];
      const result = filterIncompleteBiomarkers(biomarkers);
      expect(result).toHaveLength(3);
    });
  });
});
