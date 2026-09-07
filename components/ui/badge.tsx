import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-tight transition-all duration-200 ease-luxe focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 select-none',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground hover:bg-primary/80 hover:scale-105',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:scale-105',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80 hover:scale-105',
        outline: 'text-foreground hover:bg-muted/50 hover:scale-105',
        success:
          'border-transparent bg-gradient-to-r from-emerald-500 to-tealuxe-500 text-white hover:from-emerald-600 hover:to-tealuxe-600 shadow-glow-green hover:scale-105',
        warning:
          'border-transparent bg-gradient-to-r from-amber-500 to-orange-400 text-amber-950 hover:from-amber-600 hover:to-orange-500 shadow-glow-amber hover:scale-105 font-bold',
        info:
          'border-transparent bg-gradient-to-r from-sky-500 to-indigo-500 text-white hover:from-sky-600 hover:to-indigo-600 shadow-glow-indigo-light hover:scale-105',
        'soft-success':
          'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 hover:scale-105',
        'soft-warning':
          'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 hover:scale-105',
        'soft-destructive':
          'border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-400 hover:bg-rose-500/20 hover:scale-105',
        'soft-info':
          'border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-400 hover:bg-sky-500/20 hover:scale-105',
        gold:
          'border-champagne-500/30 bg-gradient-to-r from-champagne-500 via-champagne-400 to-champagne-500 text-champagne-950 shadow-glow-gold hover:scale-105 font-bold animate-pulse-gold-light',
        luxe:
          'border-indigo-500/25 bg-gradient-to-r from-indigo-500/15 to-purple-500/15 text-indigo-700 dark:text-indigo-300 hover:scale-105',
      },
      pulse: {
        true: '',
        false: '',
      },
    },
    compoundVariants: [
      {
        variant: ['success', 'warning', 'info', 'gold'],
        pulse: true,
        className: 'animate-pulse-glow-light',
      },
    ],
    defaultVariants: {
      variant: 'default',
      pulse: false,
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
  dot?: boolean;
}

export function Badge({ className, variant, pulse, icon, dot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, pulse }), className)} {...props}>
      {dot && (
        <span className="relative flex h-1.5 w-1.5 shrink-0 mr-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current/70 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      )}
      {icon && <span className="shrink-0 mr-1 [&_svg]:size-3">{icon}</span>}
      {children}
    </div>
  );
}

export { badgeVariants };
