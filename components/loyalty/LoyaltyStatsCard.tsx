'use client';
/**
 * components/loyalty/LoyaltyStatsCard.tsx
 * Stats card for the Loyalty dashboard.
 */
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface LoyaltyStatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'emerald' | 'blue' | 'amber' | 'violet' | 'rose';
  trend?: number; // positive = up, negative = down
}

const colorMap = {
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-950',
    border: 'border-emerald-200 dark:border-emerald-800',
    icon: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900',
    value: 'text-emerald-700 dark:text-emerald-300',
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-950',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-100 dark:bg-blue-900',
    value: 'text-blue-700 dark:text-blue-300',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-950',
    border: 'border-amber-200 dark:border-amber-800',
    icon: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-100 dark:bg-amber-900',
    value: 'text-amber-700 dark:text-amber-300',
  },
  violet: {
    bg: 'bg-violet-50 dark:bg-violet-950',
    border: 'border-violet-200 dark:border-violet-800',
    icon: 'text-violet-600 dark:text-violet-400',
    iconBg: 'bg-violet-100 dark:bg-violet-900',
    value: 'text-violet-700 dark:text-violet-300',
  },
  rose: {
    bg: 'bg-rose-50 dark:bg-rose-950',
    border: 'border-rose-200 dark:border-rose-800',
    icon: 'text-rose-600 dark:text-rose-400',
    iconBg: 'bg-rose-100 dark:bg-rose-900',
    value: 'text-rose-700 dark:text-rose-300',
  },
};

export function LoyaltyStatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'emerald',
  trend,
}: LoyaltyStatsCardProps) {
  const c = colorMap[color];

  return (
    <div className={cn('rounded-xl border p-4 space-y-3', c.bg, c.border)}>
      <div className="flex items-center justify-between">
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', c.iconBg)}>
          <Icon className={cn('h-5 w-5', c.icon)} />
        </div>
        {trend !== undefined && (
          <span className={cn('text-xs font-semibold', trend >= 0 ? 'text-emerald-600' : 'text-red-500')}>
            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <div className={cn('text-2xl font-black', c.value)}>{value}</div>
        <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-0.5">{title}</div>
        {subtitle && <div className="text-xs text-muted-foreground mt-0.5">{subtitle}</div>}
      </div>
    </div>
  );
}
