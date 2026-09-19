import React from 'react';

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'sky'
  | 'indigo'
  | 'teal'
  | 'emerald'
  | 'amber'
  | 'slate'
  | 'rose';

export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, { container: string; dot: string }> = {
  default: {
    container: 'bg-zinc-100 text-zinc-800 border-zinc-200',
    dot: 'bg-zinc-500',
  },
  primary: {
    container: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    dot: 'bg-indigo-600',
  },
  success: {
    container: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-600',
  },
  warning: {
    container: 'bg-amber-50 text-amber-900 border-amber-200',
    dot: 'bg-amber-600',
  },
  danger: {
    container: 'bg-rose-50 text-rose-800 border-rose-200',
    dot: 'bg-rose-600',
  },
  info: {
    container: 'bg-sky-50 text-sky-800 border-sky-200',
    dot: 'bg-sky-600',
  },
  sky: {
    container: 'bg-sky-50 text-sky-800 border-sky-200',
    dot: 'bg-sky-600',
  },
  indigo: {
    container: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    dot: 'bg-indigo-600',
  },
  teal: {
    container: 'bg-teal-50 text-teal-800 border-teal-200',
    dot: 'bg-teal-600',
  },
  emerald: {
    container: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-600',
  },
  amber: {
    container: 'bg-amber-50 text-amber-900 border-amber-200',
    dot: 'bg-amber-600',
  },
  slate: {
    container: 'bg-zinc-100 text-zinc-800 border-zinc-300',
    dot: 'bg-zinc-600',
  },
  rose: {
    container: 'bg-rose-50 text-rose-800 border-rose-200',
    dot: 'bg-rose-600',
  },
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'text-xs px-1.5 py-0.5 gap-1',
  md: 'text-xs px-2 py-0.5 gap-1.5',
  lg: 'text-sm px-2.5 py-1 gap-1.5',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'md',
  dot = false,
  icon,
  children,
  className = '',
  ...props
}) => {
  const vStyle = variantStyles[variant] || variantStyles.default;
  const sStyle = sizeStyles[size] || sizeStyles.md;

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md border tracking-tight transition-colors ${vStyle.container} ${sStyle} ${className}`}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${vStyle.dot}`} />}
      {icon && <span className="flex-shrink-0 flex items-center justify-center">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
