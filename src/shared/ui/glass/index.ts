export { GlassSurface, AnimatedGlassSurface } from './GlassSurface';
export type { GlassSurfaceProps, AnimatedGlassSurfaceProps, GlassWeight, GlassCorner, GlassShadow } from './GlassSurface';

export { GlassButton } from './GlassButton';
export type { GlassButtonProps, GlassButtonWeight, GlassButtonSize, GlassButtonVariant } from './GlassButton';

export { GlassToolbar } from './GlassToolbar';
export type { GlassToolbarProps } from './GlassToolbar';

export { GlassModal } from './GlassModal';
export type { GlassModalProps } from './GlassModal';

export { GlassConfirmModal } from './GlassConfirmModal';
export type { GlassConfirmModalProps } from './GlassConfirmModal.types';

export { GlassInput } from './GlassInput';
export type { GlassInputProps } from './GlassInput';

// Re-export motion springs
export { springs, normalizeVelocity, projectMomentum, rubberband, getSpringConfig } from '../../../shared/lib/motion';
export type { SpringKey } from '../../../shared/lib/motion';