import React from 'react';
import type { BaseProps, Alignment, JustifyContent, Orientation } from '../../types/common';
import { useTheme } from '../../hooks/useTheme';
import { cn } from '../../utils/cn';
import type { Spacing } from '../../types/theme';

export interface StackProps extends BaseProps {
  direction?: Orientation;
  spacing?: keyof Spacing | number;
  align?: Alignment;
  justify?: JustifyContent;
  wrap?: boolean;
  divider?: React.ReactNode;
  as?: keyof JSX.IntrinsicElements;
  fullWidth?: boolean;
}

const justifyMap: Record<JustifyContent, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
  around: 'space-around',
  evenly: 'space-evenly',
};

const alignMap: Record<Alignment, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
};

export function Stack({
  children,
  direction = 'vertical',
  spacing = 'md',
  align = 'stretch',
  justify = 'start',
  wrap = false,
  divider,
  as: Component = 'div',
  fullWidth = false,
  className,
  style,
  testId,
}: StackProps) {
  const { theme } = useTheme();

  const gap = typeof spacing === 'number'
    ? spacing
    : theme.spacing[spacing as keyof Spacing] ?? theme.spacing.md;

  const stackStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: direction === 'vertical' ? 'column' : 'row',
    gap: divider ? undefined : `${gap}px`,
    alignItems: alignMap[align],
    justifyContent: justifyMap[justify],
    flexWrap: wrap ? 'wrap' : 'nowrap',
    width: fullWidth ? '100%' : undefined,
    ...style,
  };

  const stackClass = cn(
    'stack',
    `stack--${direction}`,
    { 'stack--wrap': wrap },
    className,
  );

  const childArray = React.Children.toArray(children).filter(Boolean);

  const renderedChildren = divider
    ? childArray.flatMap((child, index) => {
        if (index === 0) return [child];
        const dividerEl = (
          <div
            key={`divider-${index}`}
            className="stack__divider"
            style={{
              margin: direction === 'vertical'
                ? `${gap / 2}px 0`
                : `0 ${gap / 2}px`,
            }}
          >
            {divider}
          </div>
        );
        return [dividerEl, child];
      })
    : childArray;

  return (
    <Component className={stackClass} style={stackStyle} data-testid={testId}>
      {renderedChildren}
    </Component>
  );
}

Stack.displayName = 'Stack';
