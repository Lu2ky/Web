import React from 'react';
import '../../../shared/styles/liquidGlass.css';

export type GlassWeight =
  | 'ultra-thin'
  | 'thin'
  | 'regular'
  | 'thick'
  | 'ultra-thick'
  | 'toolbar'
  | 'popover'
  | 'sheet'
  | 'card'
  | 'modal';

export type GlassCorner =
  | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

export type GlassShadow =
  | 'none' | 'sm' | 'md' | 'lg' | 'xl';

interface GlassSurfaceProps {
  /** Visual weight of the glass — determines opacity, blur, border */
  weight?: GlassWeight;
  /** Corner radius */
  corner?: GlassCorner;
  /** Shadow depth */
  shadow?: GlassShadow;
  /** Show border (light-catching edge) */
  border?: boolean;
  /** Additional class names */
  className?: string;
  /** Inline styles (merged with glass styles) */
  style?: React.CSSProperties;
  /** Children */
  children: React.ReactNode;
  /** Test ID */
  'data-testid'?: string;
  /** Additional props forwarded to the div */
  [key: string]: any;
}

/**
 * GlassSurface — Base building block for all Liquid Glass components.
 *
 * Applies the correct glass material (opacity, blur, border, shadow)
 * based on the weight token. Automatically responds to theme changes
 * and accessibility preferences (reduced transparency, high contrast).
 */
export function GlassSurface({
  weight = 'regular',
  corner = 'lg',
  shadow = 'md',
  border = true,
  className = '',
  style,
  children,
  'data-testid': testId,
  ...props
}: GlassSurfaceProps) {
  const weightClass = `glass-${weight}`;
  const cornerClass = `radius-${corner}`;
  const shadowClass = shadow !== 'none' ? `shadow-${shadow}` : '';
  const borderClass = border ? 'glass-border' : '';

  return (
    <div
      data-testid={testId}
      className={`${weightClass} ${cornerClass} ${shadowClass} ${borderClass} ${className}`.trim()}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * GlassSurface with spring entrance/exit animations (requires Motion)
 * Use for modals, sheets, popovers that animate in/out
 */
interface AnimatedGlassSurfaceProps extends GlassSurfaceProps {
  /** Show/hide with animation */
  isOpen: boolean;
  /** Called when exit animation completes */
  onCloseComplete?: () => void;
  /** Spring config key */
  spring?: keyof typeof import('../../../shared/lib/motion').springs;
  /** Initial scale for enter animation */
  initialScale?: number;
}

export function AnimatedGlassSurface({
  isOpen,
  onCloseComplete,
  spring = 'modal',
  initialScale = 0.95,
  children,
  ...props
}: AnimatedGlassSurfaceProps) {
  // This component requires Motion/Framer Motion
  // Import dynamically to avoid SSR issues
  const [MotionDiv, setMotionDiv] = React.useState<React.ComponentType<any> | null>(null);

  React.useEffect(() => {
    import('motion/react').then(({ motion }) => {
      setMotionDiv(motion.div);
    });
  }, []);

  if (!MotionDiv) {
    return isOpen ? (
      <GlassSurface {...props}>{children}</GlassSurface>
    ) : null;
  }

  const MotionComponent = MotionDiv;

  return (
    <MotionComponent
      initial={{ opacity: 0, scale: initialScale }}
      animate={isOpen ? { opacity: 1, scale: 1 } : { opacity: 0, scale: initialScale }}
      exit={{ opacity: 0, scale: initialScale }}
      transition={springs[spring as keyof typeof springs]}
      onAnimationComplete={(animation) => {
        if (!isOpen && animation === 'exit') {
          onCloseComplete?.();
        }
      }}
      {...props}
      className={`glass-surface-animated ${props.className || ''}`}
    >
      {children}
    </MotionComponent>
  );
}

// Re-export springs for convenience
import { springs } from '../../../shared/lib/motion';