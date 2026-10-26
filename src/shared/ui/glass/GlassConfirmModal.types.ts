/**
 * Props for GlassConfirmModal
 */
export interface GlassConfirmModalProps {
  /** Show/hide modal */
  isOpen: boolean;
  /** Called when modal closes */
  onClose: () => void;
  /** Called when user confirms */
  onConfirm: () => void;
  /** Modal title */
  title: string;
  /** Modal description */
  description: string;
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Visual variant */
  variant?: 'destructive' | 'primary';
  /** Loading state */
  isLoading?: boolean;
}