import React from 'react';
import type { BaseProps } from '../../types/common';
import { useTheme } from '../../hooks/useTheme';
import { useBreakpoint } from '../../hooks/useMediaQuery';
import { cn } from '../../utils/cn';

export interface GridProps extends BaseProps {
  columns?: number | { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
  gap?: number;
  rowGap?: number;
  columnGap?: number;
  alignItems?: 'start' | 'center' | 'end' | 'stretch';
  justifyItems?: 'start' | 'center' | 'end' | 'stretch';
  minChildWidth?: string;
  autoFlow?: 'row' | 'column' | 'dense';
}

export function Grid({
  children,
  columns = 12,
  gap,
  rowGap,
  columnGap,
  alignItems,
  justifyItems,
  minChildWidth,
  autoFlow,
  className,
  style,
  testId,
}: GridProps) {
  const { theme } = useTheme();
  const { current: breakpoint } = useBreakpoint();

  const resolvedGap = gap ?? theme.spacing.md;

  const resolveColumns = (): number => {
    if (typeof columns === 'number') return columns;
    const bp = columns;
    switch (breakpoint) {
      case 'xl': return bp.xl ?? bp.lg ?? bp.md ?? bp.sm ?? bp.xs ?? 12;
      case 'lg': return bp.lg ?? bp.md ?? bp.sm ?? bp.xs ?? 12;
      case 'md': return bp.md ?? bp.sm ?? bp.xs ?? 12;
      case 'sm': return bp.sm ?? bp.xs ?? 12;
      default: return bp.xs ?? 1;
    }
  };

  const colCount = resolveColumns();

  const gridTemplate = minChildWidth
    ? `repeat(auto-fill, minmax(${minChildWidth}, 1fr))`
    : `repeat(${colCount}, 1fr)`;

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: gridTemplate,
    gap: `${resolvedGap}px`,
    rowGap: rowGap != null ? `${rowGap}px` : undefined,
    columnGap: columnGap != null ? `${columnGap}px` : undefined,
    alignItems,
    justifyItems,
    gridAutoFlow: autoFlow,
    ...style,
  };

  return (
    <div className={cn('grid', className)} style={gridStyle} data-testid={testId}>
      {children}
    </div>
  );
}

export interface GridItemProps extends BaseProps {
  colSpan?: number;
  rowSpan?: number;
  colStart?: number;
  rowStart?: number;
}

export function GridItem({
  children,
  colSpan,
  rowSpan,
  colStart,
  rowStart,
  className,
  style,
  testId,
}: GridItemProps) {
  const itemStyle: React.CSSProperties = {
    gridColumn: colSpan ? `span ${colSpan}` : undefined,
    gridRow: rowSpan ? `span ${rowSpan}` : undefined,
    gridColumnStart: colStart,
    gridRowStart: rowStart,
    ...style,
  };

  return (
    <div className={cn('grid-item', className)} style={itemStyle} data-testid={testId}>
      {children}
    </div>
  );
}

Grid.displayName = 'Grid';
GridItem.displayName = 'GridItem';
