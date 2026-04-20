import React, { useState, useCallback } from 'react';
import type { BaseProps } from '../../types/common';
import { Variant, Size } from '../../types/common';
import { useTheme } from '../../hooks/useTheme';
import { Modal, type ModalProps } from './Modal';
import { Button } from '../Button/Button';
import { ButtonGroup } from '../Button/ButtonGroup';

export interface ConfirmDialogProps extends BaseProps {
  open: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: Variant;
  size?: Size;
  destructive?: boolean;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title = 'Confirm',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = Variant.Primary,
  size = Size.SM,
  destructive = false,
  loading: externalLoading,
  className,
  style,
  testId,
}: ConfirmDialogProps) {
  const { colors, theme } = useTheme();
  const [internalLoading, setInternalLoading] = useState(false);

  const isLoading = externalLoading ?? internalLoading;
  const confirmVariant = destructive ? Variant.Danger : variant;

  const handleConfirm = useCallback(async () => {
    try {
      setInternalLoading(true);
      await onConfirm();
    } finally {
      setInternalLoading(false);
    }
  }, [onConfirm]);

  const handleCancel = useCallback(() => {
    if (!isLoading) onCancel();
  }, [isLoading, onCancel]);

  const footerContent = (
    <ButtonGroup spacing={theme.spacing.sm}>
      <Button
        variant={Variant.Ghost}
        size={size}
        onClick={handleCancel}
        disabled={isLoading}
      >
        {cancelLabel}
      </Button>
      <Button
        variant={confirmVariant}
        size={size}
        onClick={handleConfirm}
        loading={isLoading}
      >
        {confirmLabel}
      </Button>
    </ButtonGroup>
  );

  return (
    <Modal
      open={open}
      onClose={handleCancel}
      title={title}
      size={size}
      closeOnOverlay={!isLoading}
      closeOnEscape={!isLoading}
      showCloseButton={!isLoading}
      footer={footerContent}
      className={className}
      style={style}
      testId={testId}
    >
      <p
        style={{
          margin: 0,
          color: colors.text,
          fontSize: theme.typography.fontSize.md,
          lineHeight: theme.typography.lineHeight.relaxed,
        }}
      >
        {message}
      </p>
      {destructive && (
        <p
          style={{
            marginTop: `${theme.spacing.sm}px`,
            color: colors.error,
            fontSize: theme.typography.fontSize.sm,
            fontWeight: theme.typography.fontWeight.medium,
          }}
        >
          This action cannot be undone.
        </p>
      )}
    </Modal>
  );
}

ConfirmDialog.displayName = 'ConfirmDialog';
