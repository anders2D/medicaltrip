import React from 'react';
import { resolveLanguage, LanguageCode } from '../i18n';
import { Languages } from 'lucide-react';

export interface LanguageBadgeProps {
  language?: string | LanguageCode | null;
  variant?: 'pill' | 'outline' | 'subtle' | 'compact';
  size?: 'xs' | 'sm' | 'md';
  showIcon?: boolean;
  showCodeOnly?: boolean;
  className?: string;
}

const LANGUAGE_LABELS: Record<LanguageCode, { full: string; code: string; bg: string; text: string; border: string }> = {
  pap: {
    full: 'Papiamento',
    code: 'PAP',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
  },
  nl: {
    full: 'Nederlands',
    code: 'NL',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
  },
  en: {
    full: 'English',
    code: 'EN',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
  },
  es: {
    full: 'Español',
    code: 'ES',
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    border: 'border-purple-200',
  },
};

export const LanguageBadge: React.FC<LanguageBadgeProps> = ({
  language,
  variant = 'pill',
  size = 'sm',
  showIcon = false,
  showCodeOnly = false,
  className = '',
}) => {
  const code = resolveLanguage(language);
  const info = LANGUAGE_LABELS[code];

  const sizeClasses = {
    xs: 'text-xs px-1.5 py-0.5 gap-1',
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-sm px-2.5 py-1 gap-1.5',
  };

  const variantClasses = {
    pill: `${info.bg} ${info.text} ${info.border} border`,
    outline: `bg-white ${info.text} ${info.border} border`,
    subtle: `${info.bg} ${info.text}`,
    compact: 'bg-zinc-100 text-zinc-700 border border-zinc-200 font-mono text-xs',
  };

  return (
    <span
      data-testid="language-badge"
      data-language={code}
      className={`inline-flex items-center rounded-full font-medium select-none ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      title={`Idioma: ${info.full} (${info.code})`}
    >
      {showIcon && <Languages className="w-3 h-3 shrink-0 opacity-70" />}
      <span className="font-semibold">{showCodeOnly ? info.code : info.full}</span>
    </span>
  );
};

export default LanguageBadge;
