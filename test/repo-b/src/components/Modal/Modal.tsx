import React, { useEffect, useCallback } from 'react';
import type { BaseProps } from '../../types/common';
import { Size } from '../../types/common';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useTheme } from '../../hooks/useTheme';
import { usePortal, renderPortal } from '../../utils/portal';
import { cn } from '../../utils/cn';

export interface ModalProps extends BaseProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  size?: Size;
  closeOnOverlay?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  footer?: React.ReactNode;
}

export function Modal({
  open,
  onClose,
  title,
  size = Size.MD,
  closeOnOverlay = true,
  closeOnEscape = true,
  showCloseButton = true,
  footer,
  children,
  className,
  style,
  testId,
}: ModalProps) {
  const { theme, colors } = useTheme();
  const portalContainer = usePortal('modal-root');

  const contentRef = useClickOutside<HTMLDivElement>(() => {
    if (closeOnOverlay) onClose();
  }, { enabled: open });

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === 'Escape') onClose();
    },
    [closeOnEscape, onClose],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, handleEscape]);

  if (!open) return null;

  const sizeWidths: Record<string, string> = {
    xs: '320px', sm: '400px', md: '540px', lg: '720px', xl: '960px',
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  };

  const contentStyle: React.CSSProperties = {
    backgroundColor: colors.background,
    borderRadius: theme.borderRadius.lg,
    boxShadow: theme.shadows.lg,
    width: sizeWidths[size] ?? sizeWidths.md,
    maxHeight: '85vh',
    overflow: 'auto',
    ...style,
  };

  const modal = (
    <div className="modal-overlay" style={overlayStyle} role="dialog" aria-modal="true" data-testid={testId}>
      <div ref={contentRef} className={cn('modal', `modal--${size}`, className)} style={contentStyle}>
        {(title || showCloseButton) && (
          <div className="modal__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: `${theme.spacing.md}px`, borderBottom: `1px solid ${colors.border}` }}>
            {title && <h2 style={{ margin: 0, fontSize: theme.typography.fontSize.lg, color: colors.text }}>{title}</h2>}
            {showCloseButton && (
              <button onClick={onClose} className="modal__close" aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: colors.textSecondary }}>&times;</button>
            )}
          </div>
        )}
        <div className="modal__body" style={{ padding: `${theme.spacing.md}px` }}>{children}</div>
        {footer && (
          <div className="modal__footer" style={{ padding: `${theme.spacing.md}px`, borderTop: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'flex-end', gap: `${theme.spacing.sm}px` }}>{footer}</div>
        )}
      </div>
    </div>
  );

  return renderPortal(modal, portalContainer) as React.ReactElement;
}

Modal.displayName = 'Modal';
