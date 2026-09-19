import React from 'react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options?: SelectOption[];
  children?: React.ReactNode;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, helperText, error, options, children, id, className = '', disabled, ...props }, ref) => {
    const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-semibold text-zinc-700 select-none">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            id={selectId}
            ref={ref}
            disabled={disabled}
            className={`w-full appearance-none rounded-lg border bg-white px-3 py-2 pr-8 text-sm text-zinc-900 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:border-transparent disabled:bg-zinc-100 disabled:text-zinc-500 disabled:cursor-not-allowed cursor-pointer ${
              error ? 'border-rose-400 focus:ring-rose-500 text-rose-900' : 'border-zinc-300 hover:border-zinc-400'
            } ${className}`}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          <div className="absolute right-3 pointer-events-none text-zinc-400 flex items-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
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

Select.displayName = 'Select';
