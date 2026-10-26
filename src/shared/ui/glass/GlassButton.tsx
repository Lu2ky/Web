import React, { forwardRef } from 'react';
import '../../../shared/styles/liquidGlass.css';

export type GlassButtonWeight = 'thin' | 'regular' | 'thick';
export type GlassButtonSize = 'sm' | 'md' | 'lg';
export type GlassButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost';

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual weight */
  weight?: GlassButtonWeight;
  /** Size */
  size?: GlassButtonSize;
  /** Variant — determines color scheme */
  variant?: GlassButtonVariant;
  /** Show loading spinner */
  loading?: boolean;
  /** Icon only (square) */
  iconOnly?: boolean;
  /** Children */
  children: React.ReactNode;
}

const sizeStyles: Record<GlassButtonSize, { height: string; paddingX: string; fontSize: string; iconSize: string }> = {
  sm: { height: '32px', paddingX: '12px', fontSize: '0.8125rem', iconSize: '16px' },
  md: { height: '40px', paddingX: '16px', fontSize: '0.875rem', iconSize: '20px' },
  lg: { height: '48px', paddingX: '20px', fontSize: '1rem', iconSize: '24px' },
};

const variantStyles: Record<GlassButtonVariant, { base: string; hover: string; active: string; text: string }> = {
  primary: {
    base: 'bg-brand-500',
    hover: 'hover:bg-brand-600',
    active: 'active:bg-brand-700',
    text: 'text-white',
  },
  secondary: {
    base: 'glass-thin glass-border',
    hover: 'hover:glass-regular',
    active: 'active:bg-surface-hover',
    text: 'text-text-primary',
  },
  destructive: {
    base: 'glass-thin glass-border text-tint-danger-text border-tint-danger-border',
    hover: 'hover:bg-tint-danger-bg',
    active: 'active:bg-tint-danger-bg/80',
    text: 'text-tint-danger-text',
  },
  ghost: {
    base: 'bg-transparent',
    hover: 'hover:bg-surface-hover',
    active: 'active:bg-surface-muted',
    text: 'text-text-secondary',
  },
};

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  (
    {
      weight = 'regular',
      size = 'md',
      variant = 'primary',
      loading = false,
      iconOnly = false,
      children,
      className = '',
      disabled,
      style,
      ...props
    },
    ref
  ) => {
    const { height, paddingX, fontSize, iconSize } = sizeStyles[size];
    const v = variantStyles[variant];

    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        style={{
          height,
          paddingLeft: iconOnly ? 0 : paddingX,
          paddingRight: iconOnly ? 0 : paddingX,
          fontSize,
          width: iconOnly ? height : undefined,
          minWidth: iconOnly ? height : undefined,
          ...style,
        } as React.CSSProperties}
        className={`
          inline-flex items-center justify-center gap-2
          font-medium
          rounded-lg
          transition-all duration-fast ease-out
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          ${v.base} ${v.hover} ${v.active} ${v.text}
          ${className}
        `.trim()}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {!loading && children}
      </button>
    );
  }
);

GlassButton.displayName = 'GlassButton';

export default GlassButton;