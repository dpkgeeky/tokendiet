import React, { forwardRef, useState, useCallback, type InputHTMLAttributes } from 'react';
import type { FormFieldProps, ValidationRule } from '../../types/common';
import { Size } from '../../types/common';
import { useTheme } from '../../hooks/useTheme';
import { useDebounce } from '../../hooks/useDebounce';
import { runValidation } from '../../utils/validators';
import { buildComponentClass } from '../../utils/cn';

export interface InputProps extends FormFieldProps, Omit<InputHTMLAttributes<HTMLInputElement>, 'style' | 'size' | 'name'> {
  size?: Size;
  type?: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url';
  validationRules?: ValidationRule[];
  validateOnBlur?: boolean;
  debounceMs?: number;
  onValueChange?: (value: string) => void;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      name,
      label,
      error: externalError,
      required,
      placeholder,
      helpText,
      size = Size.MD,
      type = 'text',
      validationRules = [],
      validateOnBlur = true,
      debounceMs = 0,
      disabled,
      className,
      style,
      testId,
      onValueChange,
      prefix,
      suffix,
      ...rest
    },
    ref,
  ) => {
    const { theme, colors } = useTheme();
    const [internalValue, setInternalValue] = useState('');
    const [internalError, setInternalError] = useState<string | null>(null);
    const debouncedValue = useDebounce(internalValue, debounceMs);

    const displayError = externalError ?? internalError;

    const validate = useCallback(
      (value: string) => {
        if (validationRules.length === 0) return;
        const result = runValidation(value, validationRules);
        setInternalError(result.valid ? null : result.errors[0]);
      },
      [validationRules],
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setInternalValue(value);
      onValueChange?.(value);
      if (!validateOnBlur) validate(value);
    };

    const handleBlur = () => {
      if (validateOnBlur) validate(internalValue);
    };

    const inputClass = buildComponentClass('input', { size, disabled, className });

    const wrapperStyle: React.CSSProperties = {
      display: 'flex',
      flexDirection: 'column',
      gap: `${theme.spacing.xs}px`,
      ...style,
    };

    const inputStyle: React.CSSProperties = {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize[size],
      padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
      borderRadius: theme.borderRadius.md,
      border: `1px solid ${displayError ? colors.error : colors.border}`,
      backgroundColor: disabled ? colors.surface : colors.background,
      color: colors.text,
      width: '100%',
      outline: 'none',
    };

    return (
      <div style={wrapperStyle} data-testid={testId}>
        {label && (
          <label htmlFor={name} style={{ color: colors.text, fontSize: theme.typography.fontSize.sm }}>
            {label}{required && <span style={{ color: colors.error }}> *</span>}
          </label>
        )}
        <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
          {prefix && <span className="input__prefix">{prefix}</span>}
          <input
            ref={ref}
            id={name}
            name={name}
            type={type}
            className={inputClass}
            style={inputStyle}
            disabled={disabled}
            required={required}
            placeholder={placeholder}
            value={internalValue}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-invalid={!!displayError}
            aria-describedby={displayError ? `${name}-error` : undefined}
            {...rest}
          />
          {suffix && <span className="input__suffix">{suffix}</span>}
        </div>
        {displayError && (
          <span id={`${name}-error`} role="alert" style={{ color: colors.error, fontSize: theme.typography.fontSize.xs }}>
            {displayError}
          </span>
        )}
        {helpText && !displayError && (
          <span style={{ color: colors.textSecondary, fontSize: theme.typography.fontSize.xs }}>{helpText}</span>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
