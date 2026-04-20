import type { CSSProperties, ReactNode } from 'react';

export enum Size {
  XS = 'xs',
  SM = 'sm',
  MD = 'md',
  LG = 'lg',
  XL = 'xl',
}

export enum Variant {
  Primary = 'primary',
  Secondary = 'secondary',
  Outline = 'outline',
  Ghost = 'ghost',
  Danger = 'danger',
  Success = 'success',
}

export interface BaseProps {
  id?: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  disabled?: boolean;
  testId?: string;
}

export interface FormFieldProps extends BaseProps {
  name: string;
  label?: string;
  error?: string;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
}

export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: number | string | RegExp;
  message: string;
  validate?: (value: string) => boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export type StatusType = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  status: StatusType;
  error: string | null;
}

export type Orientation = 'horizontal' | 'vertical';

export type Alignment = 'start' | 'center' | 'end' | 'stretch';

export type JustifyContent = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
