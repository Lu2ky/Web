import React, { forwardRef } from 'react';
import '../../../shared/styles/glassComponents.css';

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Label text */
  label?: string;
  /** Error message */
  error?: string;
  /** Helper text */
  helperText?: string;
  /** Leading icon */
  leadingIcon?: React.ReactNode;
  /** Trailing icon/button */
  trailingIcon?: React.ReactNode;
  /** Full width */
  fullWidth?: boolean;
}

export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  (
    {
      label,
      error,
      helperText,
      leadingIcon,
      trailingIcon,
      fullWidth = true,
      className = '',
      style,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || React.useId();
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = helperText ? `${inputId}-helper` : undefined;

    const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined;

    return (
      <div
        className={`flex flex-col gap-1 ${fullWidth ? 'w-full' : ''} ${className}`}
        style={style}
      >
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-text-secondary"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {leadingIcon && (
            <div
              className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text-muted"
              aria-hidden="true"
            >
              {leadingIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={`
              glass-input
              ${leadingIcon ? 'pl-10' : ''}
              ${trailingIcon ? 'pr-10' : ''}
              ${error ? 'border-tint-danger-border focus:ring-tint-danger-text' : ''}
            `.trim()}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={describedBy}
            aria-errormessage={errorId}
            {...props}
          />

          {trailingIcon && (
            <div
              className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"
            >
              {trailingIcon}
            </div>
          )}
        </div>

        {error && (
          <p
            id={errorId}
            className="text-sm font-medium text-tint-danger-text"
            role="alert"
          >
            {error}
          </p>
        )}

        {helperText && !error && (
          <p
            id={helperId}
            className="text-sm text-text-muted"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

GlassInput.displayName = 'GlassInput';

export default GlassInput;