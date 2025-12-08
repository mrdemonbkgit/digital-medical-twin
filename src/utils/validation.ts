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

// Biomarker validation
export interface BiomarkerInput {
  standardCode?: string;
  name: string;
  value: number | string; // Numeric for quantitative, string for qualitative
  unit: string;
  referenceMin?: number;
  referenceMax?: number;
  flag?: 'high' | 'low' | 'normal';
  isQualitative?: boolean; // True for qualitative results like "Negative", "Positive"
}

export interface BiomarkerValidationResult {
  isValid: boolean;
  errors: string[];
  invalidIndices: number[];
}

/**
 * Validate a single biomarker entry.
 * Returns an array of error messages (empty if valid).
 */
export function validateBiomarker(biomarker: BiomarkerInput): string[] {
  const errors: string[] = [];

  // Name is required
  if (!biomarker.name || biomarker.name.trim() === '') {
    errors.push('Biomarker name is required');
  }

  // Value validation depends on whether it's qualitative or quantitative
  if (biomarker.isQualitative) {
    // Qualitative biomarkers must have a non-empty string value
    if (typeof biomarker.value !== 'string' || biomarker.value.trim() === '') {
      errors.push('Qualitative value is required');
    }
  } else {
    // Quantitative biomarkers must have a valid number
    if (typeof biomarker.value !== 'number' || isNaN(biomarker.value)) {
      errors.push('Value must be a valid number');
    }
  }

  // Unit is required if standardCode is set
  if (biomarker.standardCode && (!biomarker.unit || biomarker.unit.trim() === '')) {
    errors.push('Unit is required');
  }

  return errors;
}

/**
 * Validate an array of biomarkers.
 * Returns validation result with overall status, all errors, and indices of invalid entries.
 */
export function validateBiomarkers(biomarkers: BiomarkerInput[]): BiomarkerValidationResult {
  const allErrors: string[] = [];
  const invalidIndices: number[] = [];

  biomarkers.forEach((biomarker, index) => {
    const errors = validateBiomarker(biomarker);
    if (errors.length > 0) {
      invalidIndices.push(index);
      errors.forEach((error) => {
        allErrors.push(`Biomarker ${index + 1}: ${error}`);
      });
    }
  });

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    invalidIndices,
  };
}

/**
 * Filter out incomplete biomarkers (no name or standardCode selected).
 * Useful for cleaning up form data before validation/submission.
 */
export function filterIncompleteBiomarkers(biomarkers: BiomarkerInput[]): BiomarkerInput[] {
  return biomarkers.filter(
    (b) => b.name && b.name.trim() !== '' && b.standardCode && b.standardCode.trim() !== ''
  );
}
