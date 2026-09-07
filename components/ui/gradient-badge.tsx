import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const gradientBadgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold tracking-tight',
  {
    variants: {
      variant: {
        indigo:
          'bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 text-white shadow-glow-indigo animate-pulse-glow',
        navy:
          'bg-gradient-to-r from-navy-900 via-indigo-700 to-navy-700 text-white shadow-glow-indigo',
        gold:
          'bg-gradient-to-r from-champagne-600 via-champagne-400 to-champagne-600 text-champagne-900 shadow-glow-gold animate-pulse-gold',
        emerald:
          'bg-gradient-to-r from-emerald-500 via-tealuxe-500 to-emerald-500 text-white shadow-glow-green',
        rose:
          'bg-gradient-to-r from-rose-500 via-pink-500 to-rose-500 text-white shadow-glow-red',
        amber:
          'bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500 text-amber-950 shadow-glow-amber',
        'soft-indigo':
          'bg-gradient-to-r from-indigo-500/15 to-purple-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25',
        'soft-gold':
          'bg-gradient-to-r from-champagne-500/20 to-champagne-400/10 text-champagne-700 dark:text-champagne-400 border border-champagne-500/30',
      },
      size: {
        sm: 'text-[10px] px-2 py-0.5 gap-1',
        md: 'text-xs px-2.5 py-1 gap-1.5',
        lg: 'text-sm px-3 py-1.5 gap-2',
      },
      shimmer: {
        true: 'relative overflow-hidden',
        false: '',
      },
      dot: {
        true: '',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'indigo',
      size: 'md',
      shimmer: false,
      dot: false,
    },
  }
);

export interface GradientBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof gradientBadgeVariants> {
  icon?: React.ReactNode;
}

export function GradientBadge({
  className,
  variant,
  size,
  shimmer,
  dot,
  icon,
  children,
  ...props
}: GradientBadgeProps) {
  return (
    <div
      className={cn(gradientBadgeVariants({ variant, size, shimmer, dot }), className)}
      {...props}
    >
      {shimmer && <span className="shine-overlay" aria-hidden />}
      {dot && (
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/80 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
        </span>
      )}
      {icon && <span className="shrink-0 [&_svg]:size-3 [&_svg]:size-3.5">{icon}</span>}
      <span className="whitespace-nowrap">{children}</span>
    </div>
  );
}

export { gradientBadgeVariants };
