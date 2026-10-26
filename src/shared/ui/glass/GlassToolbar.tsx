import React, { forwardRef } from 'react';
import '../../../shared/styles/liquidGlass.css';
import { GlassButton } from './GlassButton';

interface GlassToolbarProps extends React.HTMLAttributes<HTMLHeaderElement> {
  /** Left side content */
  left?: React.ReactNode;
  /** Center content */
  center?: React.ReactNode;
  /** Right side content */
  right?: React.ReactNode;
  /** Scroll edge effect — shows when content scrolls under */
  scrollEdge?: boolean;
  /** Test ID */
  'data-testid'?: string;
}

/**
 * GlassToolbar — Ultra-thin glass toolbar for top/bottom bars.
 * Supports scroll edge fade effect (content fades under toolbar).
 */
export const GlassToolbar = forwardRef<HTMLHeaderElement, GlassToolbarProps>(
  (
    {
      left,
      center,
      right,
      scrollEdge = true,
      className = '',
      style,
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    return (
      <header
        ref={ref}
        data-testid={testId}
        className={`
          glass-toolbar
          sticky top-0 z-sticky
          flex items-center justify-between
          gap-3 px-4 py-2
          ${scrollEdge ? 'toolbar-scroll-edge' : ''}
          ${className}
        `.trim()}
        style={style}
        {...props}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {left}
        </div>

        <div className="flex items-center justify-center flex-1 min-w-0">
          {center}
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          {right}
        </div>

        {scrollEdge && (
          <div className="toolbar-fade-bottom pointer-events-none absolute bottom-0 left-0 right-0 h-8" aria-hidden="true" />
        )}
      </header>
    );
  }
);

GlassToolbar.displayName = 'GlassToolbar';

export default GlassToolbar;