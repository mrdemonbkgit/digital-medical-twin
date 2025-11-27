/**
 * Centralized error handling utilities
 */

// Common error types
export type ErrorType =
  | 'network'
  | 'auth'
  | 'validation'
  | 'not_found'
  | 'rate_limit'
  | 'server'
  | 'unknown';

export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: unknown;
  context?: string;
}

// User-friendly error messages
const ERROR_MESSAGES: Record<ErrorType, string> = {
  network: 'Unable to connect. Please check your internet connection.',
  auth: 'Authentication failed. Please sign in again.',
  validation: 'Please check your input and try again.',
  not_found: 'The requested resource was not found.',
  rate_limit: 'Too many requests. Please wait a moment and try again.',
  server: 'Something went wrong on our end. Please try again later.',
  unknown: 'An unexpected error occurred. Please try again.',
};

/**
 * Determine the type of error
 */
export function getErrorType(error: unknown): ErrorType {
  if (isNetworkError(error)) return 'network';
  if (isAuthError(error)) return 'auth';
  if (isValidationError(error)) return 'validation';
  if (isNotFoundError(error)) return 'not_found';
  if (isRateLimitError(error)) return 'rate_limit';
  if (isServerError(error)) return 'server';
  return 'unknown';
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('failed to fetch') ||
      message.includes('connection') ||
      message.includes('offline')
    );
  }
  return false;
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('unauthorized') ||
      message.includes('authentication') ||
      message.includes('not authenticated') ||
      message.includes('session') ||
      message.includes('token')
    );
  }
  // Check for HTTP 401/403 in error object
  if (typeof error === 'object' && error !== null) {
    const err = error as { status?: number; code?: number };
    return err.status === 401 || err.status === 403 || err.code === 401 || err.code === 403;
  }
  return false;
}

/**
 * Check if error is a validation error
 */
export function isValidationError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('validation') ||
      message.includes('invalid') ||
      message.includes('required')
    );
  }
  // Check for HTTP 400 in error object
  if (typeof error === 'object' && error !== null) {
    const err = error as { status?: number; code?: number };
    return err.status === 400 || err.code === 400;
  }
  return false;
}

/**
 * Check if error is a not found error
 */
export function isNotFoundError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return message.includes('not found') || message.includes('404');
  }
  // Check for HTTP 404 in error object
  if (typeof error === 'object' && error !== null) {
    const err = error as { status?: number; code?: number };
    return err.status === 404 || err.code === 404;
  }
  return false;
}

/**
 * Check if error is a rate limit error
 */
export function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('rate limit') ||
      message.includes('too many requests') ||
      message.includes('429')
    );
  }
  // Check for HTTP 429 in error object
  if (typeof error === 'object' && error !== null) {
    const err = error as { status?: number; code?: number };
    return err.status === 429 || err.code === 429;
  }
  return false;
}

/**
 * Check if error is a server error
 */
export function isServerError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return message.includes('server error') || message.includes('internal');
  }
  // Check for HTTP 5xx in error object
  if (typeof error === 'object' && error !== null) {
    const err = error as { status?: number; code?: number };
    const status = err.status || err.code;
    return status !== undefined && status >= 500 && status < 600;
  }
  return false;
}

/**
 * Get a user-friendly error message
 */
export function getUserMessage(error: unknown): string {
  const errorType = getErrorType(error);

  // If error has a specific message that's user-friendly, use it
  if (error instanceof Error) {
    const message = error.message;
    // Avoid exposing technical details
    if (
      !message.includes('undefined') &&
      !message.includes('null') &&
      !message.includes('TypeError') &&
      !message.includes('Error:') &&
      message.length < 200
    ) {
      // Check if it's already a user-friendly message
      if (
        message.includes('Failed to') ||
        message.includes('Unable to') ||
        message.includes('Please')
      ) {
        return message;
      }
    }
  }

  return ERROR_MESSAGES[errorType];
}

/**
 * Convert any error to a standardized AppError
 */
export function toAppError(error: unknown, context?: string): AppError {
  return {
    type: getErrorType(error),
    message: getUserMessage(error),
    originalError: error,
    context,
  };
}

/**
 * Handle an error and return a user-friendly message
 * Optionally logs the error in development
 */
export function handleError(error: unknown, context?: string): string {
  const appError = toAppError(error, context);

  // Log in development
  if (import.meta.env.DEV) {
    console.error(`[${context || 'Error'}]`, error);
  }

  return appError.message;
}

/**
 * Extract error message from various error formats
 */
export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (typeof error === 'object' && error !== null) {
    const err = error as { message?: string; error?: string; detail?: string };
    return err.message || err.error || err.detail || 'Unknown error';
  }
  return 'Unknown error';
}
