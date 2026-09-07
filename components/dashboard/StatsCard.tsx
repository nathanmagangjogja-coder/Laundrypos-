'use client';
import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

// ─── Count-up hook ────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1000) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return value;
}

const ACCENT_CONFIG = {
  primary: {
    icon: 'bg-gradient-to-br from-primary/20 to-primary/10 text-primary',
    glow: 'hover:shadow-primary/20',
    bar:  'from-primary to-primary/60',
    text: 'text-primary',
    bg:   'from-primary/5 to-transparent',
    border: 'border-primary/40',
    ring: 'rgba(99,102,241,0.3)',
  },
  violet: {
    icon: 'bg-gradient-to-br from-violet-500/20 to-violet-500/10 text-violet-600',
    glow: 'hover:shadow-violet-500/20',
    bar:  'from-violet-500 to-violet-400',
    text: 'text-violet-600',
    bg:   'from-violet-500/5 to-transparent',
    border: 'border-violet-500/40',
    ring: 'rgba(139,92,246,0.3)',
  },
  cyan: {
    icon: 'bg-gradient-to-br from-cyan-500/20 to-cyan-500/10 text-cyan-600',
    glow: 'hover:shadow-cyan-500/20',
    bar:  'from-cyan-500 to-cyan-400',
    text: 'text-cyan-600',
    bg:   'from-cyan-500/5 to-transparent',
    border: 'border-cyan-500/40',
    ring: 'rgba(6,182,212,0.3)',
  },
  success: {
    icon: 'bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 text-emerald-600',
    glow: 'hover:shadow-emerald-500/20',
    bar:  'from-emerald-500 to-emerald-400',
    text: 'text-emerald-600',
    bg:   'from-emerald-500/5 to-transparent',
    border: 'border-emerald-500/40',
    ring: 'rgba(16,185,129,0.3)',
  },
  // Alias dari 'success' — dipertahankan karena MitraDashboard.tsx (file lama,
  // tidak diubah di sesi ini) memakai nama 'emerald' untuk accent yang sama.
  emerald: {
    icon: 'bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 text-emerald-600',
    glow: 'hover:shadow-emerald-500/20',
    bar:  'from-emerald-500 to-emerald-400',
    text: 'text-emerald-600',
    bg:   'from-emerald-500/5 to-transparent',
    border: 'border-emerald-500/40',
    ring: 'rgba(16,185,129,0.3)',
  },
  // 'blue' — dipakai MitraDashboard.tsx, berbeda dari 'cyan' agar tetap kontras.
  blue: {
    icon: 'bg-gradient-to-br from-blue-500/20 to-blue-500/10 text-blue-600',
    glow: 'hover:shadow-blue-500/20',
    bar:  'from-blue-500 to-blue-400',
    text: 'text-blue-600',
    bg:   'from-blue-500/5 to-transparent',
    border: 'border-blue-500/40',
    ring: 'rgba(37,99,235,0.3)',
  },
  amber: {
    icon: 'bg-gradient-to-br from-amber-500/20 to-amber-500/10 text-amber-600',
    glow: 'hover:shadow-amber-500/20',
    bar:  'from-amber-500 to-amber-400',
    text: 'text-amber-600',
    bg:   'from-amber-500/5 to-transparent',
    border: 'border-amber-500/40',
    ring: 'rgba(245,158,11,0.3)',
  },
  rose: {
    icon: 'bg-gradient-to-br from-rose-500/20 to-rose-500/10 text-rose-600',
    glow: 'hover:shadow-rose-500/20',
    bar:  'from-rose-500 to-rose-400',
    text: 'text-rose-600',
    bg:   'from-rose-500/5 to-transparent',
    border: 'border-rose-500/40',
    ring: 'rgba(244,63,94,0.3)',
  },
};

interface StatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  accent?: 'primary' | 'violet' | 'cyan' | 'blue' | 'success' | 'emerald' | 'amber' | 'rose';
  index?: number;
  badge?: string;
}

export function StatsCard({ title, value, icon: Icon, trend, accent = 'primary', index = 0, badge }: StatsCardProps) {
  const cfg = ACCENT_CONFIG[accent] ?? ACCENT_CONFIG.primary;

  // Ekstrak angka dari value untuk count-up
  const numericMatch = value.replace(/[^0-9]/g, '');
  const numericValue = numericMatch ? parseInt(numericMatch) : 0;
  const prefix = value.match(/^[^0-9]*/)?.[0] ?? '';
  const suffix = value.match(/[^0-9]*$/)?.[0] ?? '';
  const countedUp = useCountUp(numericValue);

  // Format angka dengan pemisah ribuan
  const formattedValue = numericValue > 0
    ? prefix + countedUp.toLocaleString('id-ID') + suffix
    : value;

  return (
    <Card
      className={cn(
        'relative overflow-hidden shadow-sm hover:shadow-md',
        'hover:shadow-lg',
        cfg.glow,
        'transition-all duration-300 hover:-translate-y-1',
        'animate-fade-in-up border-2',
        cfg.border,
      )}
      style={{ animationDelay: `${index * 80}ms`, boxShadow: `0 0 28px -6px ${cfg.ring}` }}
    >
      {/* Gradient background — hue backlight samar */}
      <div className={cn(
        'absolute inset-0 bg-gradient-to-br opacity-80 pointer-events-none',
        cfg.bg,
      )} />

      {/* Top accent line */}
      <div className={cn(
        'absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r opacity-80',
        cfg.bar,
      )} />

      <CardContent className="relative p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {title}
            </p>
            <p className="text-2xl font-black tracking-tight truncate">
              {formattedValue}
            </p>
            {trend && (
              <div className="flex items-center gap-1 mt-1.5">
                <TrendingUp className={cn('h-3 w-3', cfg.text)} />
                <span className={cn('text-xs font-medium', cfg.text)}>{trend}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            {badge && (
              <span className={cn('text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full', cfg.icon)}>
                {badge}
              </span>
            )}
            <div className={cn(
              'h-12 w-12 rounded-2xl flex items-center justify-center shrink-0',
              'shadow-lg',
              cfg.icon,
            )}>
              <Icon className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Bottom progress bar animasi */}
        <div className="mt-4 h-1 w-full rounded-full bg-muted/50 overflow-hidden">
          <div
            className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-1000 ease-out', cfg.bar)}
            style={{ width: numericValue > 0 ? '70%' : '30%' }}
          />
        </div>
      </CardContent>
    </Card>
  );
}