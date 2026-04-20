import React, { useState, useEffect, useCallback } from 'react';
import type { BaseProps } from '../../types/common';
import { Size } from '../../types/common';
import { useDebounce, useDebouncedCallback } from '../../hooks/useDebounce';
import { useTheme } from '../../hooks/useTheme';
import { Input, type InputProps } from './Input';
import { cn } from '../../utils/cn';

export interface SearchInputProps extends BaseProps {
  size?: Size;
  placeholder?: string;
  debounceMs?: number;
  onSearch: (query: string) => void;
  onClear?: () => void;
  loading?: boolean;
  minQueryLength?: number;
  initialValue?: string;
}

export function SearchInput({
  size = Size.MD,
  placeholder = 'Search...',
  debounceMs = 300,
  onSearch,
  onClear,
  loading = false,
  minQueryLength = 1,
  initialValue = '',
  className,
  style,
  testId,
}: SearchInputProps) {
  const { colors, theme } = useTheme();
  const [query, setQuery] = useState(initialValue);
  const debouncedQuery = useDebounce(query, debounceMs);

  useEffect(() => {
    if (debouncedQuery.length >= minQueryLength) {
      onSearch(debouncedQuery);
    }
  }, [debouncedQuery, minQueryLength, onSearch]);

  const handleClear = useCallback(() => {
    setQuery('');
    onClear?.();
    onSearch('');
  }, [onClear, onSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClear();
    }
  };

  const searchIcon = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.textSecondary} strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );

  const clearButton = query.length > 0 && (
    <button
      onClick={handleClear}
      className="search-input__clear"
      aria-label="Clear search"
      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.textSecondary} strokeWidth="2">
        <path d="M18 6 6 18M6 6l12 12" />
      </svg>
    </button>
  );

  return (
    <div
      className={cn('search-input', className)}
      style={{ position: 'relative', ...style }}
      data-testid={testId}
      onKeyDown={handleKeyDown}
    >
      <Input
        name="search"
        size={size}
        placeholder={placeholder}
        prefix={searchIcon}
        suffix={loading ? <span className="search-input__spinner" /> : clearButton}
        onValueChange={setQuery}
        aria-label="Search"
        role="searchbox"
      />
    </div>
  );
}

SearchInput.displayName = 'SearchInput';
