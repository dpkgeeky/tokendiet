type ClassValue = string | number | boolean | undefined | null | ClassValue[] | Record<string, boolean | undefined>;

function toClassString(value: ClassValue): string {
  if (!value) return '';

  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);

  if (Array.isArray(value)) {
    return value.map(toClassString).filter(Boolean).join(' ');
  }

  if (typeof value === 'object') {
    return Object.entries(value)
      .filter(([, condition]) => Boolean(condition))
      .map(([key]) => key.trim())
      .join(' ');
  }

  return '';
}

export function cn(...inputs: ClassValue[]): string {
  return inputs.map(toClassString).filter(Boolean).join(' ');
}

export function prefixClass(prefix: string, className?: string): string {
  if (!className) return prefix;
  return `${prefix} ${className}`;
}

export function conditionalClass(
  condition: boolean,
  trueClass: string,
  falseClass?: string,
): string {
  return condition ? trueClass : (falseClass ?? '');
}

export function sizeClass(base: string, size: string): string {
  return `${base}--${size}`;
}

export function variantClass(base: string, variant: string): string {
  return `${base}--${variant}`;
}

export function buildComponentClass(
  base: string,
  options: {
    size?: string;
    variant?: string;
    disabled?: boolean;
    active?: boolean;
    className?: string;
  },
): string {
  return cn(
    base,
    options.size && sizeClass(base, options.size),
    options.variant && variantClass(base, options.variant),
    { [`${base}--disabled`]: options.disabled ?? false },
    { [`${base}--active`]: options.active ?? false },
    options.className,
  );
}
