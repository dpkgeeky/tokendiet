import type { ValidationRule, ValidationResult } from '../types/common';

export function validateRequired(value: string, message?: string): string | null {
  if (!value || value.trim().length === 0) {
    return message ?? 'This field is required';
  }
  return null;
}

export function validateMinLength(value: string, min: number, message?: string): string | null {
  if (value.length < min) {
    return message ?? `Must be at least ${min} characters`;
  }
  return null;
}

export function validateMaxLength(value: string, max: number, message?: string): string | null {
  if (value.length > max) {
    return message ?? `Must be no more than ${max} characters`;
  }
  return null;
}

export function validatePattern(value: string, pattern: RegExp, message?: string): string | null {
  if (!pattern.test(value)) {
    return message ?? 'Invalid format';
  }
  return null;
}

export function validateEmail(value: string, message?: string): string | null {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return validatePattern(value, emailRegex, message ?? 'Invalid email address');
}

export function validateUrl(value: string, message?: string): string | null {
  try {
    new URL(value);
    return null;
  } catch {
    return message ?? 'Invalid URL';
  }
}

export function runValidation(value: string, rules: ValidationRule[]): ValidationResult {
  const errors: string[] = [];

  for (const rule of rules) {
    let error: string | null = null;

    switch (rule.type) {
      case 'required':
        error = validateRequired(value, rule.message);
        break;
      case 'minLength':
        error = validateMinLength(value, rule.value as number, rule.message);
        break;
      case 'maxLength':
        error = validateMaxLength(value, rule.value as number, rule.message);
        break;
      case 'pattern':
        error = validatePattern(value, rule.value as RegExp, rule.message);
        break;
      case 'custom':
        if (rule.validate && !rule.validate(value)) {
          error = rule.message;
        }
        break;
    }

    if (error) errors.push(error);
  }

  return { valid: errors.length === 0, errors };
}

export function composeValidators(
  ...validators: ((value: string) => string | null)[]
): (value: string) => ValidationResult {
  return (value: string) => {
    const errors = validators
      .map((validator) => validator(value))
      .filter((error): error is string => error !== null);
    return { valid: errors.length === 0, errors };
  };
}
