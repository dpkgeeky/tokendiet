import { useContext, useMemo } from 'react';
import { ThemeContext } from '../context/ThemeProvider';
import type { Theme, ColorPalette, Spacing, Typography } from '../types/theme';

export interface UseThemeReturn {
  theme: Theme;
  colors: ColorPalette;
  spacing: Spacing;
  typography: Typography;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  getColor: (key: keyof ColorPalette) => string;
  getSpacing: (key: keyof Spacing) => number;
}

export function useTheme(): UseThemeReturn {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  const { theme, setTheme, toggleTheme } = context;

  const helpers = useMemo(() => ({
    colors: theme.colors,
    spacing: theme.spacing,
    typography: theme.typography,
    isDark: theme.name === 'dark',
    getColor: (key: keyof ColorPalette) => theme.colors[key],
    getSpacing: (key: keyof Spacing) => theme.spacing[key],
  }), [theme]);

  return {
    theme,
    setTheme,
    toggleTheme,
    ...helpers,
  };
}

export function useThemeColor(colorKey: keyof ColorPalette): string {
  const { getColor } = useTheme();
  return getColor(colorKey);
}

export function useSpacing(spacingKey: keyof Spacing): number {
  const { getSpacing } = useTheme();
  return getSpacing(spacingKey);
}
