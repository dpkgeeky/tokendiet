import { Request, Response, NextFunction } from 'express';
import { ValidationError } from './errorHandler';
import { isValidEmail } from '../models/user';
import { isValidPriority, isValidStatus } from '../models/task';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../config/app';

export type ValidatorFn = (value: unknown) => string | null;

export function required(fieldName: string): ValidatorFn {
  return (value: unknown) => {
    if (value === undefined || value === null || value === '') {
      return `${fieldName} is required`;
    }
    return null;
  };
}

export function minLength(fieldName: string, min: number): ValidatorFn {
  return (value: unknown) => {
    if (typeof value === 'string' && value.length < min) {
      return `${fieldName} must be at least ${min} characters`;
    }
    return null;
  };
}

export function maxLength(fieldName: string, max: number): ValidatorFn {
  return (value: unknown) => {
    if (typeof value === 'string' && value.length > max) {
      return `${fieldName} must be at most ${max} characters`;
    }
    return null;
  };
}

export function emailValidator(): ValidatorFn {
  return (value: unknown) => {
    if (typeof value === 'string' && !isValidEmail(value)) {
      return 'Invalid email format';
    }
    return null;
  };
}

export function validateBody(
  rules: Record<string, ValidatorFn[]>,
) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const errors: Record<string, string> = {};

    for (const [field, validators] of Object.entries(rules)) {
      for (const validate of validators) {
        const error = validate(req.body[field]);
        if (error) {
          errors[field] = error;
          break;
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError('Validation failed', errors);
    }
    next();
  };
}

export function validateTaskStatus(req: Request, _res: Response, next: NextFunction): void {
  if (req.body.status && !isValidStatus(req.body.status)) {
    throw new ValidationError('Invalid task status', { status: 'Must be a valid TaskStatus' });
  }
  next();
}

export function validateTaskPriority(req: Request, _res: Response, next: NextFunction): void {
  if (req.body.priority && !isValidPriority(req.body.priority)) {
    throw new ValidationError('Invalid task priority', { priority: 'Must be 1-4' });
  }
  next();
}

export function parsePagination(req: Request): { page: number; limit: number } {
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(req.query.limit as string, 10) || DEFAULT_PAGE_SIZE),
  );
  return { page, limit };
}
