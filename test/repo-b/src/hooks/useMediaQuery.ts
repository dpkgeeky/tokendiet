import { useState, useEffect, useMemo } from 'react';
import { useTheme } from './useTheme';
import type { Breakpoints } from '../types/theme';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    setMatches(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [query]);

  return matches;
}

export function useBreakpoint(): {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  current: keyof Breakpoints;
} {
  const { theme } = useTheme();
  const { breakpoints } = theme;

  const isMobile = useMediaQuery(`(max-width: ${breakpoints.sm - 1}px)`);
  const isTablet = useMediaQuery(
    `(min-width: ${breakpoints.sm}px) and (max-width: ${breakpoints.lg - 1}px)`,
  );
  const isDesktop = useMediaQuery(
    `(min-width: ${breakpoints.lg}px) and (max-width: ${breakpoints.xl - 1}px)`,
  );
  const isLargeDesktop = useMediaQuery(`(min-width: ${breakpoints.xl}px)`);

  const current = useMemo((): keyof Breakpoints => {
    if (isLargeDesktop) return 'xl';
    if (isDesktop) return 'lg';
    if (isTablet) return 'md';
    return 'sm';
  }, [isMobile, isTablet, isDesktop, isLargeDesktop]);

  return { isMobile, isTablet, isDesktop, isLargeDesktop, current };
}

export function useMinWidth(breakpoint: keyof Breakpoints): boolean {
  const { theme } = useTheme();
  return useMediaQuery(`(min-width: ${theme.breakpoints[breakpoint]}px)`);
}

export function useMaxWidth(breakpoint: keyof Breakpoints): boolean {
  const { theme } = useTheme();
  return useMediaQuery(`(max-width: ${theme.breakpoints[breakpoint] - 1}px)`);
}

export function usePrefersDarkMode(): boolean {
  return useMediaQuery('(prefers-color-scheme: dark)');
}

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}
