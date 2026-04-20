import React from 'react';
import type { BaseProps } from '../../types/common';
import { Size } from '../../types/common';
import { useTheme } from '../../hooks/useTheme';
import { cn } from '../../utils/cn';
import type { Breakpoints } from '../../types/theme';

export interface ContainerProps extends BaseProps {
  maxWidth?: Size | 'full' | 'none';
  padding?: boolean;
  centered?: boolean;
  as?: keyof JSX.IntrinsicElements;
}

const maxWidthMap: Record<string, string> = {
  xs: '480px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  full: '100%',
  none: 'none',
};

export function Container({
  children,
  maxWidth = Size.LG,
  padding = true,
  centered = true,
  as: Component = 'div',
  className,
  style,
  testId,
}: ContainerProps) {
  const { theme } = useTheme();

  const containerStyle: React.CSSProperties = {
    maxWidth: maxWidthMap[maxWidth] ?? maxWidthMap.lg,
    width: '100%',
    marginLeft: centered ? 'auto' : undefined,
    marginRight: centered ? 'auto' : undefined,
    paddingLeft: padding ? `${theme.spacing.md}px` : undefined,
    paddingRight: padding ? `${theme.spacing.md}px` : undefined,
    boxSizing: 'border-box',
    ...style,
  };

  const containerClass = cn(
    'container',
    `container--${maxWidth}`,
    { 'container--padded': padding },
    { 'container--centered': centered },
    className,
  );

  return (
    <Component
      className={containerClass}
      style={containerStyle}
      data-testid={testId}
    >
      {children}
    </Component>
  );
}

Container.displayName = 'Container';
