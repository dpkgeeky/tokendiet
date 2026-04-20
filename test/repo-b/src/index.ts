// Types
export type { Theme, ColorPalette, Spacing, Typography, Breakpoints } from './types/theme';
export { defaultTheme } from './types/theme';
export {
  Size,
  Variant,
  type BaseProps,
  type FormFieldProps,
  type ValidationRule,
  type ValidationResult,
  type StatusType,
  type AsyncState,
  type Orientation,
  type Alignment,
  type JustifyContent,
} from './types/common';

// Context
export { ThemeProvider, ThemeContext, type ThemeContextValue } from './context/ThemeProvider';

// Hooks
export { useTheme, useThemeColor, useSpacing } from './hooks/useTheme';
export { useClickOutside, useClickOutsideMultiple } from './hooks/useClickOutside';
export { useDebounce, useDebouncedCallback, useThrottle } from './hooks/useDebounce';
export {
  useMediaQuery,
  useBreakpoint,
  useMinWidth,
  useMaxWidth,
  usePrefersDarkMode,
  usePrefersReducedMotion,
} from './hooks/useMediaQuery';

// Components
export { Button, type ButtonProps } from './components/Button/Button';
export { ButtonGroup, type ButtonGroupProps } from './components/Button/ButtonGroup';
export { Input, type InputProps } from './components/Input/Input';
export { SearchInput, type SearchInputProps } from './components/Input/SearchInput';
export { Modal, type ModalProps } from './components/Modal/Modal';
export { ConfirmDialog, type ConfirmDialogProps } from './components/Modal/ConfirmDialog';
export { Container, type ContainerProps } from './components/Layout/Container';
export { Grid, GridItem, type GridProps, type GridItemProps } from './components/Layout/Grid';
export { Stack, type StackProps } from './components/Layout/Stack';

// Utilities
export { cn, prefixClass, conditionalClass, sizeClass, variantClass, buildComponentClass } from './utils/cn';
export { usePortal, renderPortal, createPortalContainer, removePortalContainer } from './utils/portal';
export {
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validatePattern,
  validateEmail,
  validateUrl,
  runValidation,
  composeValidators,
} from './utils/validators';
