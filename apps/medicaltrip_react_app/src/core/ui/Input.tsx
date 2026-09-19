import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      prefixIcon,
      suffixIcon,
      id,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
    const startIcon = leftIcon || prefixIcon;
    const endIcon = rightIcon || suffixIcon;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-zinc-700 select-none">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {startIcon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-zinc-400">
              {startIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:border-transparent disabled:bg-zinc-100 disabled:text-zinc-500 disabled:cursor-not-allowed ${
              startIcon ? 'pl-9' : ''
            } ${endIcon ? 'pr-9' : ''} ${
              error ? 'border-rose-400 focus:ring-rose-500 text-rose-900' : 'border-zinc-300 hover:border-zinc-400'
            } ${className}`}
            {...props}
          />
          {endIcon && (
            <div className="absolute right-3 flex items-center pointer-events-none text-zinc-400">
              {endIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs font-medium text-rose-600 flex items-center gap-1">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-zinc-600 font-medium">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
