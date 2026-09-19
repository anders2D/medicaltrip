/**
 * Medical Trip Colombia S.A.S. - MealSubsidySelector
 * Interactive 5-tier meal allowance selector with visual badges and automated suggestion:
 * - Tier 0: $0 COP (< 3h) - Ninguno / None
 * - Tier 1: $8.000 COP (3-5h) - Refrigerio / Snack
 * - Tier 2: $25.000 COP (5-8h) - Almuerzo Estándar / Standard Lunch
 * - Tier 3: $35.000 COP (8-12h) - Almuerzo + Cena / Lunch + Dinner
 * - Tier 4: $45.000 COP (>= 12h) - Jornada Completa / Full Day
 */

import React from 'react';
import { Utensils, Sparkles, Check } from 'lucide-react';
import { MealSubsidyTier, CompanionShift } from '../../../domain/entities/CompanionShift';
import { useLanguage } from '@/core/i18n';

export interface MealSubsidySelectorProps {
  selectedTier: MealSubsidyTier;
  onSelectTier: (tier: MealSubsidyTier) => void;
  hoursLogged?: number;
  suggestedTier?: MealSubsidyTier;
  disabled?: boolean;
}

export interface MealTierOption {
  tier: MealSubsidyTier;
  amountCOP: number;
  labelKey: 'tier0Label' | 'tier1Label' | 'tier2Label' | 'tier3Label' | 'tier4Label';
  rangeLabel: string;
  emoji: string;
}

export const MEAL_TIER_CONFIGS: MealTierOption[] = [
  {
    tier: 'TIER_0',
    amountCOP: 0,
    labelKey: 'tier0Label',
    rangeLabel: '< 3h',
    emoji: '🚫',
  },
  {
    tier: 'TIER_1',
    amountCOP: 8000,
    labelKey: 'tier1Label',
    rangeLabel: '3 - 5h',
    emoji: '🥐',
  },
  {
    tier: 'TIER_2',
    amountCOP: 25000,
    labelKey: 'tier2Label',
    rangeLabel: '5 - 8h',
    emoji: '🍽️',
  },
  {
    tier: 'TIER_3',
    amountCOP: 35000,
    labelKey: 'tier3Label',
    rangeLabel: '8 - 12h',
    emoji: '🍱',
  },
  {
    tier: 'TIER_4',
    amountCOP: 45000,
    labelKey: 'tier4Label',
    rangeLabel: '≥ 12h',
    emoji: '🌟',
  },
];

export const MealSubsidySelector: React.FC<MealSubsidySelectorProps> = ({
  selectedTier,
  onSelectTier,
  hoursLogged,
  suggestedTier: explicitSuggestedTier,
  disabled = false,
}) => {
  const { t } = useLanguage();

  const autoResolvedTier = hoursLogged !== undefined
    ? CompanionShift.resolveMealSubsidyTier(hoursLogged).tier
    : undefined;

  const activeSuggestedTier = explicitSuggestedTier || autoResolvedTier;

  return (
    <div className="flex flex-col gap-2" data-testid="meal-subsidy-selector">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5">
          <Utensils className="w-3.5 h-3.5 text-amber-600" />
          <span>{t.companion.mealSubsidy}</span>
        </label>
        {activeSuggestedTier && activeSuggestedTier !== selectedTier && (
          <button
            type="button"
            data-testid="btn-apply-suggested-tier"
            onClick={() => onSelectTier(activeSuggestedTier)}
            disabled={disabled}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1 cursor-pointer transition-colors active:scale-95 duration-200"
            title={t.companion.autoTierSuggested}
          >
            <Sparkles className="w-3 h-3 text-indigo-500" />
            <span>{t.companion.autoTierSuggested}</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2" role="radiogroup" aria-label={t.companion.mealSubsidy}>
        {MEAL_TIER_CONFIGS.map((option) => {
          const isSelected = selectedTier === option.tier;
          const isSuggested = activeSuggestedTier === option.tier;
          const testId = `meal-tier-${option.tier.replace('TIER_', '')}`;

          return (
            <button
              key={option.tier}
              type="button"
              role="radio"
              aria-checked={isSelected}
              data-testid={testId}
              disabled={disabled}
              onClick={() => onSelectTier(option.tier)}
              className={`relative flex flex-col items-center justify-between p-2.5 rounded-xl border text-center transition-all cursor-pointer select-none ${
                isSelected
                  ? 'bg-amber-50/90 border-amber-400 ring-2 ring-amber-400/40'
                  : 'bg-white border-zinc-200 hover:bg-zinc-50/80 hover:border-zinc-300'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95 duration-200'}`}
            >
              {/* Suggested Tag */}
              {isSuggested && (
                <span
                  data-testid={`suggested-badge-${option.tier}`}
                  className="absolute -top-2 right-1 text-xs font-bold px-1.5 py-0.2 rounded-full bg-indigo-600 text-white font-mono"
                >
                  Auto
                </span>
              )}

              {/* Emoji & Label */}
              <div className="flex items-center gap-1 mb-1">
                <span className="text-base">{option.emoji}</span>
                {isSelected && (
                  <span className="w-3.5 h-3.5 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs">
                    <Check className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>

              {/* Amount */}
              <div className="font-extrabold text-xs text-zinc-950 font-mono tabular-nums">
                {option.amountCOP === 0 ? '$0' : `$${option.amountCOP.toLocaleString('es-CO')}`}
              </div>

              {/* Description */}
              <div className="text-xs text-zinc-500 font-medium mt-0.5 line-clamp-1">
                {t.companion[option.labelKey]}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
