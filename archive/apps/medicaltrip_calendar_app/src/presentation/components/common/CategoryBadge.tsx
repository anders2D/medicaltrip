import React from 'react';
import { MilestoneCategory } from '../../../domain/entities/ItineraryMilestone';

export interface CategoryBadgeProps {
  category: MilestoneCategory | string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const CATEGORY_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; icon: string }
> = {
  FLIGHT: {
    label: 'Vuelo & Traslado',
    bg: 'bg-sky-50 dark:bg-sky-950/40',
    text: 'text-sky-700 dark:text-sky-300',
    border: 'border-sky-200 dark:border-sky-800',
    icon: '✈️',
  },
  CLINICAL: {
    label: 'Cita Clínica & Cirugía',
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-800',
    icon: '🏥',
  },
  LAB: {
    label: 'Laboratorio & Diagnóstico',
    bg: 'bg-teal-50 dark:bg-teal-950/40',
    text: 'text-teal-700 dark:text-teal-300',
    border: 'border-teal-200 dark:border-teal-800',
    icon: '🔬',
  },
  PHARMACY: {
    label: 'Farmacia & Caja Menor',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    icon: '💊',
  },
  HOTEL: {
    label: 'Hotel & Reposo',
    bg: 'bg-slate-100 dark:bg-slate-800/60',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-700',
    icon: '🏨',
  },
  LOGISTICS: {
    label: 'Logística & Coordinación',
    bg: 'bg-zinc-100 dark:bg-zinc-800/60',
    text: 'text-zinc-700 dark:text-zinc-300',
    border: 'border-zinc-200 dark:border-zinc-700',
    icon: '📋',
  },
};

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  category,
  className = '',
  size = 'md',
  showIcon = true,
}) => {
  const config = CATEGORY_CONFIG[category.toUpperCase()] || {
    label: category,
    bg: 'bg-zinc-100 dark:bg-zinc-800',
    text: 'text-zinc-700 dark:text-zinc-300',
    border: 'border-zinc-200 dark:border-zinc-700',
    icon: '📌',
  };

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2 py-0.5 gap-1.5',
    lg: 'text-sm px-2.5 py-1 gap-2',
  }[size];

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md border ${config.bg} ${config.text} ${config.border} ${sizeClasses} ${className}`}
      data-testid={`badge-category-${category.toLowerCase()}`}
    >
      {showIcon && <span>{config.icon}</span>}
      <span>{config.label}</span>
    </span>
  );
};
