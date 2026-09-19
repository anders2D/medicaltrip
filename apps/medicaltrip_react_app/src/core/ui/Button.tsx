import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'subtle';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-zinc-900 hover:bg-zinc-800 text-white border-transparent shadow-xs active:bg-zinc-950 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2',
  secondary:
    'bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border-zinc-200 active:bg-zinc-300 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2',
  outline:
    'bg-white hover:bg-zinc-50 text-zinc-800 border-zinc-300 shadow-xs active:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2',
  ghost:
    'bg-transparent hover:bg-zinc-100 text-zinc-700 active:bg-zinc-200 focus-visible:ring-2 focus-visible:ring-zinc-400',
  danger:
    'bg-rose-600 hover:bg-rose-700 text-white border-transparent shadow-xs active:bg-rose-800 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2',
  subtle:
    'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 focus-visible:ring-2 focus-visible:ring-indigo-400',
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'text-xs px-2 py-1 gap-1 rounded',
  sm: 'text-xs px-2.5 py-1.5 gap-1.5 rounded-md font-medium',
  md: 'text-sm px-3.5 py-2 gap-2 rounded-lg font-medium',
  lg: 'text-base px-4 py-2.5 gap-2.5 rounded-lg font-medium',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const vStyle = variantStyles[variant] || variantStyles.secondary;
  const sStyle = sizeStyles[size] || sizeStyles.md;

  return (
    <button
      className={`inline-flex items-center justify-center border font-sans select-none transition-all duration-200 ease-in-out cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none focus:outline-none ${vStyle} ${sStyle} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin -ml-0.5 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        leftIcon && <span className="flex-shrink-0 flex items-center justify-center">{leftIcon}</span>
      )}
      {children && <span>{children}</span>}
      {!isLoading && rightIcon && (
        <span className="flex-shrink-0 flex items-center justify-center">{rightIcon}</span>
      )}
    </button>
  );
};
