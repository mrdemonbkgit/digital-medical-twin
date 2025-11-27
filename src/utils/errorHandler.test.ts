import { describe, it, expect } from 'vitest';
import {
  getErrorType,
  isNetworkError,
  isAuthError,
  isValidationError,
  isNotFoundError,
  isRateLimitError,
  isServerError,
  getUserMessage,
  toAppError,
  extractErrorMessage,
} from './errorHandler';

describe('errorHandler', () => {
  describe('isNetworkError', () => {
    it('returns true for fetch TypeError', () => {
      const error = new TypeError('Failed to fetch');
      expect(isNetworkError(error)).toBe(true);
    });

    it('returns true for network-related message', () => {
      expect(isNetworkError(new Error('Network request failed'))).toBe(true);
      expect(isNetworkError(new Error('Connection refused'))).toBe(true);
      expect(isNetworkError(new Error('You are offline'))).toBe(true);
    });

    it('returns false for non-network errors', () => {
      expect(isNetworkError(new Error('Invalid input'))).toBe(false);
      expect(isNetworkError(new Error('Not found'))).toBe(false);
    });
  });

  describe('isAuthError', () => {
    it('returns true for auth-related messages', () => {
      expect(isAuthError(new Error('Unauthorized'))).toBe(true);
      expect(isAuthError(new Error('User not authenticated'))).toBe(true);
      expect(isAuthError(new Error('Session expired'))).toBe(true);
      expect(isAuthError(new Error('Invalid token'))).toBe(true);
    });

    it('returns true for 401/403 status codes', () => {
      expect(isAuthError({ status: 401 })).toBe(true);
      expect(isAuthError({ status: 403 })).toBe(true);
      expect(isAuthError({ code: 401 })).toBe(true);
    });

    it('returns false for non-auth errors', () => {
      expect(isAuthError(new Error('Invalid input'))).toBe(false);
      expect(isAuthError({ status: 400 })).toBe(false);
    });
  });

  describe('isValidationError', () => {
    it('returns true for validation-related messages', () => {
      expect(isValidationError(new Error('Validation failed'))).toBe(true);
      expect(isValidationError(new Error('Invalid email format'))).toBe(true);
      expect(isValidationError(new Error('Field is required'))).toBe(true);
    });

    it('returns true for 400 status code', () => {
      expect(isValidationError({ status: 400 })).toBe(true);
      expect(isValidationError({ code: 400 })).toBe(true);
    });

    it('returns false for non-validation errors', () => {
      expect(isValidationError(new Error('Server error'))).toBe(false);
    });
  });

  describe('isNotFoundError', () => {
    it('returns true for not found messages', () => {
      expect(isNotFoundError(new Error('Resource not found'))).toBe(true);
      expect(isNotFoundError(new Error('404 page'))).toBe(true);
    });

    it('returns true for 404 status code', () => {
      expect(isNotFoundError({ status: 404 })).toBe(true);
      expect(isNotFoundError({ code: 404 })).toBe(true);
    });
  });

  describe('isRateLimitError', () => {
    it('returns true for rate limit messages', () => {
      expect(isRateLimitError(new Error('Rate limit exceeded'))).toBe(true);
      expect(isRateLimitError(new Error('Too many requests'))).toBe(true);
    });

    it('returns true for 429 status code', () => {
      expect(isRateLimitError({ status: 429 })).toBe(true);
    });
  });

  describe('isServerError', () => {
    it('returns true for server error messages', () => {
      expect(isServerError(new Error('Internal server error'))).toBe(true);
    });

    it('returns true for 5xx status codes', () => {
      expect(isServerError({ status: 500 })).toBe(true);
      expect(isServerError({ status: 502 })).toBe(true);
      expect(isServerError({ status: 503 })).toBe(true);
    });

    it('returns false for non-5xx codes', () => {
      expect(isServerError({ status: 400 })).toBe(false);
      expect(isServerError({ status: 404 })).toBe(false);
    });
  });

  describe('getErrorType', () => {
    it('correctly identifies error types', () => {
      expect(getErrorType(new TypeError('Failed to fetch'))).toBe('network');
      expect(getErrorType(new Error('Unauthorized'))).toBe('auth');
      expect(getErrorType(new Error('Validation failed'))).toBe('validation');
      expect(getErrorType(new Error('Not found'))).toBe('not_found');
      expect(getErrorType(new Error('Too many requests'))).toBe('rate_limit');
      expect(getErrorType({ status: 500 })).toBe('server');
      expect(getErrorType(new Error('Something random'))).toBe('unknown');
    });
  });

  describe('getUserMessage', () => {
    it('returns user-friendly messages', () => {
      // "Failed to fetch" is preserved as user-friendly
      const networkMsg = getUserMessage(new TypeError('Failed to fetch'));
      expect(networkMsg).toBeTruthy();

      // Unauthorized triggers auth error message
      const authMsg = getUserMessage(new Error('Unauthorized'));
      expect(authMsg).toContain('sign in');

      // Random technical errors get generic message
      const unknownMsg = getUserMessage(new Error('TypeError: xyz is undefined'));
      expect(unknownMsg).toContain('unexpected');
    });

    it('preserves user-friendly error messages', () => {
      const msg = getUserMessage(new Error('Failed to save event. Please try again.'));
      expect(msg).toBe('Failed to save event. Please try again.');
    });
  });

  describe('toAppError', () => {
    it('converts error to AppError format', () => {
      const error = new Error('Unauthorized access');
      const appError = toAppError(error, 'login');

      expect(appError.type).toBe('auth');
      expect(appError.message).toBeTruthy();
      expect(appError.originalError).toBe(error);
      expect(appError.context).toBe('login');
    });
  });

  describe('extractErrorMessage', () => {
    it('extracts message from Error object', () => {
      expect(extractErrorMessage(new Error('Test error'))).toBe('Test error');
    });

    it('returns string directly', () => {
      expect(extractErrorMessage('Plain string error')).toBe('Plain string error');
    });

    it('extracts from object with message property', () => {
      expect(extractErrorMessage({ message: 'Object error' })).toBe('Object error');
      expect(extractErrorMessage({ error: 'Error property' })).toBe('Error property');
      expect(extractErrorMessage({ detail: 'Detail property' })).toBe('Detail property');
    });

    it('returns unknown for unrecognized formats', () => {
      expect(extractErrorMessage(null)).toBe('Unknown error');
      expect(extractErrorMessage(undefined)).toBe('Unknown error');
      expect(extractErrorMessage({})).toBe('Unknown error');
    });
  });
});
