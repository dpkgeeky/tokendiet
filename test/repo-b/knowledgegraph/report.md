# Knowledge Graph Report
_Generated 2026-04-21_

## Token Savings
| Metric | Value |
|--------|-------|
| Raw codebase tokens | ~18,519 |
| Compressed graph tokens | ~2,635 |
| **Reduction** | **86%** |

## Graph Summary
| Metric | Count |
|--------|-------|
| Files | 26 |
| Nodes | 163 |
| Edges | 205 |
| Communities | 15 |
| Isolated nodes | 3 |

## Edge Confidence
| Level | Count | % |
|-------|-------|---|
| EXTRACTED | 166 | 81% |
| INFERRED | 39 | 19% |
| AMBIGUOUS | 0 | 0% |

## God Nodes (most connected)
| Node | Connections |
|------|-------------|
| src/__tests__/validators.test.ts | 19 |
| useTheme | 13 |
| src/__tests__/Button.test.tsx | 9 |
| src/__tests__/Modal.test.tsx | 9 |
| src/__tests__/useTheme.test.ts | 9 |
| ../../hooks/useTheme | 9 |
| src/types/common.ts | 9 |
| src/utils/portal.ts | 9 |
| ../../utils/cn | 8 |
| react | 8 |

## Communities
### Community 0: Button (29 nodes)
- src/components/Button/Button.tsx
- ../../types/common
- ../../hooks/useTheme
- ../../utils/cn
- ButtonProps
- Button
- src/components/Button/ButtonGroup.tsx
- ButtonGroupProps
- ButtonGroup
- src/components/Input/Input.tsx
- ../../hooks/useDebounce
- ../../utils/validators
- InputProps
- Input
- src/components/Input/SearchInput.tsx
- _...and 14 more_

### Community 1: __tests__ (19 nodes)
- src/__tests__/validators.test.ts
- ../utils/validators
- validators
- isEmail
- should accept valid emails
- should reject invalid emails
- isRequired
- should reject empty values
- should accept non-empty values
- minLength
- should validate minimum length
- maxLength
- should validate maximum length
- isUrl
- should accept valid URLs
- _...and 4 more_

### Community 2: hooks (16 nodes)
- react
- src/components/Layout/Grid.tsx
- ../../hooks/useMediaQuery
- GridProps
- Grid
- GridItemProps
- GridItem
- src/hooks/useClickOutside.ts
- EventType
- UseClickOutsideOptions
- useClickOutside
- useClickOutsideMultiple
- src/hooks/useDebounce.ts
- useDebounce
- useDebouncedCallback
- _...and 1 more_

### Community 3: hooks (14 nodes)
- src/hooks/useMediaQuery.ts
- ./useTheme
- useMediaQuery
- useBreakpoint
- useMinWidth
- useMaxWidth
- usePrefersDarkMode
- usePrefersReducedMotion
- src/hooks/useTheme.ts
- ../context/ThemeProvider
- UseThemeReturn
- useTheme
- useThemeColor
- useSpacing

### Community 4: types (10 nodes)
- src/types/common.ts
- BaseProps
- FormFieldProps
- ValidationRule
- ValidationResult
- StatusType
- AsyncState
- Orientation
- Alignment
- JustifyContent

### Community 5: __tests__ (9 nodes)
- src/__tests__/Button.test.tsx
- ../components/Button/Button
- Button
- should render with default props
- should apply variant classes
- should handle disabled state
- should call onClick handler
- should support size variants
- should render loading state

### Community 6: __tests__ (9 nodes)
- src/__tests__/Modal.test.tsx
- ../components/Modal/Modal
- Modal
- should not render when closed
- should render when open
- should call onClose when backdrop clicked
- should not close on content click
- should support custom title
- should close on escape key

### Community 7: __tests__ (9 nodes)
- src/__tests__/useTheme.test.ts
- ../hooks/useTheme
- useTheme
- should return current theme
- should toggle dark mode
- should persist theme preference
- useThemeColor
- should return color from current theme
- should return fallback for unknown color

### Community 8: utils (9 nodes)
- src/utils/cn.ts
- ClassValue
- toClassString
- cn
- prefixClass
- conditionalClass
- sizeClass
- variantClass
- buildComponentClass

### Community 9: utils (9 nodes)
- src/utils/portal.ts
- react-dom
- PORTAL_ROOT_ID
- getPortalRoot
- createPortalContainer
- removePortalContainer
- usePortal
- renderPortal
- usePortalRenderer

### Community 10: utils (9 nodes)
- src/utils/validators.ts
- validateRequired
- validateMinLength
- validateMaxLength
- validatePattern
- validateEmail
- validateUrl
- runValidation
- composeValidators

### Community 11: Modal (6 nodes)
- src/components/Modal/ConfirmDialog.tsx
- ./Modal
- ../Button/Button
- ../Button/ButtonGroup
- ConfirmDialogProps
- ConfirmDialog

### Community 12: context (6 nodes)
- src/context/ThemeProvider.tsx
- ../types/theme
- ThemeContextValue
- ThemeContext
- ThemeProviderProps
- ThemeProvider

### Community 13: types (6 nodes)
- src/types/theme.ts
- ColorPalette
- Spacing
- Typography
- Breakpoints
- Theme

### Community 14: codeburn-2026-04-21.json (3 nodes)
- codeburn-2026-04-21.json
- package.json
- src/index.ts

## Potentially Unused Code
_Entities with no inbound references (may be entry points or dead code)_

- Button (function) in src/components/Button/Button.tsx
- ButtonGroupProps (interface) in src/components/Button/ButtonGroup.tsx
- ButtonGroup (function) in src/components/Button/ButtonGroup.tsx
- InputProps (interface) in src/components/Input/Input.tsx
- Input (function) in src/components/Input/Input.tsx
- SearchInputProps (interface) in src/components/Input/SearchInput.tsx
- SearchInput (function) in src/components/Input/SearchInput.tsx
- ContainerProps (interface) in src/components/Layout/Container.tsx
- Container (function) in src/components/Layout/Container.tsx
- GridProps (interface) in src/components/Layout/Grid.tsx
- Grid (function) in src/components/Layout/Grid.tsx
- GridItemProps (interface) in src/components/Layout/Grid.tsx
- GridItem (function) in src/components/Layout/Grid.tsx
- StackProps (interface) in src/components/Layout/Stack.tsx
- Stack (function) in src/components/Layout/Stack.tsx
- ConfirmDialogProps (interface) in src/components/Modal/ConfirmDialog.tsx
- ConfirmDialog (function) in src/components/Modal/ConfirmDialog.tsx
- Modal (function) in src/components/Modal/Modal.tsx
- ThemeContextValue (interface) in src/context/ThemeProvider.tsx
- ThemeContext (function) in src/context/ThemeProvider.tsx
- _...and 40 more_

## Isolated Nodes
- codeburn-2026-04-21.json
- package.json
- src/index.ts
