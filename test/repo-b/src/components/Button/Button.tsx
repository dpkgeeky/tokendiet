import React, { forwardRef, type ButtonHTMLAttributes } from 'react';
import type { BaseProps } from '../../types/common';
import { Size, Variant } from '../../types/common';
import { useTheme } from '../../hooks/useTheme';
import { buildComponentClass } from '../../utils/cn';

export interface ButtonProps extends BaseProps, Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'style'> {
  size?: Size;
  variant?: Variant;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      size = Size.MD,
      variant = Variant.Primary,
      loading = false,
      disabled = false,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      className,
      style,
      testId,
      onClick,
      ...rest
    },
    ref,
  ) => {
    const { theme, colors } = useTheme();

    const buttonClass = buildComponentClass('btn', {
      size,
      variant,
      disabled: disabled || loading,
      className,
    });

    const buttonStyle: React.CSSProperties = {
      fontFamily: theme.typography.fontFamily,
      borderRadius: theme.borderRadius.md,
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      width: fullWidth ? '100%' : undefined,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: `${theme.spacing.xs}px`,
      padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
      border: variant === Variant.Outline ? `1px solid ${colors.border}` : 'none',
      backgroundColor: variant === Variant.Ghost ? 'transparent' : colors.primary,
      color: variant === Variant.Ghost ? colors.text : '#ffffff',
      ...style,
    };

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || loading) return;
      onClick?.(event);
    };

    return (
      <button
        ref={ref}
        className={buttonClass}
        style={buttonStyle}
        disabled={disabled || loading}
        data-testid={testId}
        aria-busy={loading}
        aria-disabled={disabled}
        onClick={handleClick}
        {...rest}
      >
        {loading && <span className="btn__spinner" aria-hidden="true" />}
        {icon && iconPosition === 'left' && <span className="btn__icon">{icon}</span>}
        {children && <span className="btn__label">{children}</span>}
        {icon && iconPosition === 'right' && <span className="btn__icon">{icon}</span>}
      </button>
    );
  },
);

Button.displayName = 'Button';
