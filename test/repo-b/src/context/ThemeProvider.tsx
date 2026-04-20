import React, { createContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import { type Theme, type ColorPalette, defaultTheme } from '../types/theme';

export interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

const darkColors: ColorPalette = {
  primary: '#60a5fa',
  primaryLight: '#93bbfd',
  primaryDark: '#3b82f6',
  secondary: '#a78bfa',
  secondaryLight: '#c4b5fd',
  secondaryDark: '#8b5cf6',
  success: '#4ade80',
  warning: '#fbbf24',
  error: '#f87171',
  info: '#22d3ee',
  background: '#0f172a',
  surface: '#1e293b',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  border: '#334155',
  disabled: '#475569',
};

const darkTheme: Theme = {
  ...defaultTheme,
  name: 'dark',
  colors: darkColors,
  shadows: {
    sm: '0 1px 2px rgba(0,0,0,0.3)',
    md: '0 4px 6px rgba(0,0,0,0.4)',
    lg: '0 10px 15px rgba(0,0,0,0.5)',
  },
};

interface ThemeProviderProps {
  children: ReactNode;
  initialTheme?: Theme;
}

export function ThemeProvider({ children, initialTheme }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(initialTheme ?? defaultTheme);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme.name);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev.name === 'dark' ? defaultTheme : darkTheme;
      document.documentElement.setAttribute('data-theme', next.name);
      return next;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  );

  const cssVars = useMemo(() => {
    const { colors, spacing } = theme;
    return {
      '--color-primary': colors.primary,
      '--color-background': colors.background,
      '--color-surface': colors.surface,
      '--color-text': colors.text,
      '--color-border': colors.border,
      '--spacing-sm': `${spacing.sm}px`,
      '--spacing-md': `${spacing.md}px`,
      '--spacing-lg': `${spacing.lg}px`,
    } as React.CSSProperties;
  }, [theme]);

  return (
    <ThemeContext.Provider value={value}>
      <div style={cssVars}>{children}</div>
    </ThemeContext.Provider>
  );
}
