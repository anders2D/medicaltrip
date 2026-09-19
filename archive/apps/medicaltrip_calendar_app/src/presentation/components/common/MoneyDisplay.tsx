import React from 'react';
import { Money, CurrencyCode } from '../../../domain/values/Money';

export interface MoneyDisplayProps {
  money?: Money;
  amountCents?: bigint | number;
  currency?: CurrencyCode;
  className?: string;
  variant?: 'neutral' | 'positive' | 'negative' | 'subtle';
  showCurrency?: boolean;
}

export const MoneyDisplay: React.FC<MoneyDisplayProps> = ({
  money,
  amountCents,
  currency = 'COP',
  className = '',
  variant = 'neutral',
  showCurrency = true,
}) => {
  const effectiveMoney = money ?? (
    amountCents !== undefined
      ? Money.fromCents(BigInt(amountCents), currency)
      : Money.zero(currency)
  );

  const formattedStr = effectiveMoney.format();

  const variantClasses = {
    neutral: 'text-zinc-900 dark:text-zinc-100',
    positive: 'text-emerald-600 dark:text-emerald-400',
    negative: 'text-rose-600 dark:text-rose-400',
    subtle: 'text-zinc-500 dark:text-zinc-400',
  }[variant];

  return (
    <span
      className={`font-mono tabular-nums tracking-tight font-semibold ${variantClasses} ${className}`}
      data-testid="money-display"
      data-cents={effectiveMoney.amountInCents.toString()}
    >
      {formattedStr}
      {!showCurrency && ''}
    </span>
  );
};
