export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Escape special characters in a search string for safe use in PostgREST ilike filters.
 * Prevents filter injection by removing/escaping characters that could break the query syntax.
 *
 * @param input - The raw user search input
 * @returns Sanitized string safe for use in PostgREST filter expressions
 */
export function escapePostgrestValue(input: string): string {
  if (!input) return '';

  return (
    input
      .trim()
      // Remove characters that break PostgREST filter syntax
      .replace(/[,()]/g, '')
      // Escape LIKE pattern wildcards (% and _) with backslash
      .replace(/%/g, '\\%')
      .replace(/_/g, '\\_')
      // Remove backslashes that aren't escaping wildcards (prevent escape injection)
      .replace(/\\(?![%_])/g, '')
  );
}

export function isValidPassword(password: string): boolean {
  // Minimum 8 characters
  return password.length >= 8;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateLoginForm(email: string, password: string): ValidationResult {
  const errors: string[] = [];

  if (!email) {
    errors.push('Email is required');
  } else if (!isValidEmail(email)) {
    errors.push('Invalid email format');
  }

  if (!password) {
    errors.push('Password is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateRegisterForm(
  email: string,
  password: string,
  confirmPassword: string
): ValidationResult {
  const errors: string[] = [];

  if (!email) {
    errors.push('Email is required');
  } else if (!isValidEmail(email)) {
    errors.push('Invalid email format');
  }

  if (!password) {
    errors.push('Password is required');
  } else if (!isValidPassword(password)) {
    errors.push('Password must be at least 8 characters');
  }

  if (password !== confirmPassword) {
    errors.push('Passwords do not match');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
