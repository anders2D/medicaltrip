import React from 'react';
import { resolveTerritory, CaribbeanCountryCode } from '../i18n';

export interface NationalityBadgeProps {
  country?: string | CaribbeanCountryCode | null;
  showFlag?: boolean;
  showCode?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const NationalityBadge: React.FC<NationalityBadgeProps> = ({
  country,
  showFlag = true,
  showCode = false,
  size = 'sm',
  className = '',
}) => {
  const profile = resolveTerritory(country);

  const sizeClasses = {
    xs: 'text-xs px-1.5 py-0.5 gap-1',
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-sm px-2.5 py-1 gap-2',
    lg: 'text-base px-3 py-1.5 gap-2',
  };

  return (
    <span
      data-testid="nationality-badge"
      className={`inline-flex items-center rounded-full font-medium bg-zinc-100 text-zinc-800 border border-zinc-200 select-none ${sizeClasses[size]} ${className}`}
      title={`${profile.countryName} (${profile.countryCode})`}
    >
      {showFlag && (
        <span role="img" aria-label={profile.countryName} className="leading-none text-base">
          {profile.flagEmoji}
        </span>
      )}
      <span className="font-semibold text-zinc-900">{profile.countryName}</span>
      {showCode && (
        <span className="text-xs font-mono text-zinc-500 font-bold uppercase">
          {profile.countryCode}
        </span>
      )}
    </span>
  );
};

export default NationalityBadge;
