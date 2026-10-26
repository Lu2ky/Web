import React from 'react';
import { GlassModal, GlassButton } from './index';
import type { GlassConfirmModalProps } from './GlassConfirmModal.types';

/**
 * GlassConfirmModal — Confirmation modal variant
 */
export function GlassConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'destructive',
  isLoading = false,
}: GlassConfirmModalProps) {
  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <GlassButton
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </GlassButton>
          <GlassButton
            variant={variant}
            onClick={onConfirm}
            disabled={isLoading}
            loading={isLoading}
          >
            {confirmText}
          </GlassButton>
        </>
      }
    >
      <p className="text-text-secondary">{description}</p>
    </GlassModal>
  );
}

export default GlassConfirmModal;