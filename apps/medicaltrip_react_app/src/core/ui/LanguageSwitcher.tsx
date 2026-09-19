import React from 'react';
import { useLanguage, LanguageCode } from '../i18n';
import { Globe } from 'lucide-react';

export interface LanguageSwitcherProps {
  compact?: boolean;
  size?: 'xs' | 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
  onChange?: (lang: LanguageCode) => void;
}

const LANGUAGES: Array<{ code: LanguageCode; label: string; short: string; flag: string }> = [
  { code: 'es', label: 'Español', short: 'ES', flag: '🇨🇴' },
  { code: 'en', label: 'English', short: 'EN', flag: '🇺🇸' },
  { code: 'nl', label: 'Nederlands', short: 'NL', flag: '🇳🇱' },
  { code: 'pap', label: 'Papiamento', short: 'PAP', flag: '🇨🇼' },
];

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  compact = false,
  size = 'sm',
  showIcon = true,
  className = '',
  onChange,
}) => {
  const { language, setLanguage } = useLanguage();

  const handleSelect = (lang: LanguageCode) => {
    setLanguage(lang);
    if (onChange) {
      onChange(lang);
    }
  };

  const sizeStyles = {
    xs: 'p-0.5 text-xs',
    sm: 'p-0.5 text-xs',
    md: 'p-1 text-sm',
  };

  const buttonSizeStyles = {
    xs: 'px-1.5 py-0.5 min-h-[26px]',
    sm: 'px-2 py-1 min-h-[30px]',
    md: 'px-2.5 py-1.5 min-h-[36px]',
  };

  return (
    <div
      data-testid="language-switcher"
      role="group"
      aria-label="Selector de idioma"
      className={`inline-flex items-center rounded-lg border border-zinc-200 bg-zinc-100 select-none ${sizeStyles[size]} ${className}`}
    >
      {showIcon && (
        <div className="px-1 text-zinc-500 flex items-center" title="Idioma / Language">
          <Globe className="w-3.5 h-3.5" />
        </div>
      )}
      <div className="flex items-center gap-0.5">
        {LANGUAGES.map((item) => {
          const isActive = language === item.code;
          return (
            <button
              key={item.code}
              type="button"
              data-testid={`lang-btn-${item.code}`}
              aria-pressed={isActive}
              onClick={() => handleSelect(item.code)}
              className={`rounded-md font-semibold font-mono transition-all duration-200 cursor-pointer flex items-center gap-1 active:scale-95 ${buttonSizeStyles[size]} ${
                isActive
                  ? 'bg-white text-zinc-950 border border-zinc-200 font-bold'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60'
              }`}
              title={`${item.label} (${item.short})`}
            >
              <span>{compact ? item.short : item.short}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default LanguageSwitcher;
