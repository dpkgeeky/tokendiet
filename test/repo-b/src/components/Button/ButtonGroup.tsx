import React, { Children, cloneElement, isValidElement } from 'react';
import type { BaseProps, Orientation } from '../../types/common';
import { Size, Variant } from '../../types/common';
import { useTheme } from '../../hooks/useTheme';
import { cn } from '../../utils/cn';
import type { ButtonProps } from './Button';

export interface ButtonGroupProps extends BaseProps {
  size?: Size;
  variant?: Variant;
  orientation?: Orientation;
  spacing?: number;
  attached?: boolean;
}

export function ButtonGroup({
  children,
  size,
  variant,
  orientation = 'horizontal',
  spacing,
  attached = false,
  className,
  style,
  testId,
}: ButtonGroupProps) {
  const { theme } = useTheme();

  const gap = spacing ?? theme.spacing.sm;

  const groupClass = cn(
    'btn-group',
    `btn-group--${orientation}`,
    { 'btn-group--attached': attached },
    className,
  );

  const groupStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: orientation === 'vertical' ? 'column' : 'row',
    gap: attached ? 0 : `${gap}px`,
    ...style,
  };

  const enhancedChildren = Children.map(children, (child, index) => {
    if (!isValidElement<ButtonProps>(child)) return child;

    const overrides: Partial<ButtonProps> = {};
    if (size) overrides.size = size;
    if (variant) overrides.variant = variant;

    if (attached) {
      const isFirst = index === 0;
      const isLast = index === Children.count(children) - 1;
      const borderRadius = isFirst
        ? orientation === 'horizontal'
          ? `${theme.borderRadius.md} 0 0 ${theme.borderRadius.md}`
          : `${theme.borderRadius.md} ${theme.borderRadius.md} 0 0`
        : isLast
          ? orientation === 'horizontal'
            ? `0 ${theme.borderRadius.md} ${theme.borderRadius.md} 0`
            : `0 0 ${theme.borderRadius.md} ${theme.borderRadius.md}`
          : '0';

      overrides.style = {
        ...(child.props.style ?? {}),
        borderRadius,
      };
    }

    return cloneElement(child, overrides);
  });

  return (
    <div
      className={groupClass}
      style={groupStyle}
      role="group"
      data-testid={testId}
      aria-orientation={orientation}
    >
      {enhancedChildren}
    </div>
  );
}

ButtonGroup.displayName = 'ButtonGroup';
