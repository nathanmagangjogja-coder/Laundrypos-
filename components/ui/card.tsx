import * as React from 'react';
import { cn } from '@/lib/utils';

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'relative rounded-xl border border-border/70 bg-card text-card-foreground shadow-sm',
        'transition-all duration-300 ease-luxe hover:shadow-card-luxe hover:border-indigo-500/20',
        'after:absolute after:inset-x-4 after:top-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-indigo-500/25 after:to-transparent after:pointer-events-none after:opacity-60',
        className
      )}
      {...props}
    />
  )
);
Card.displayName = 'Card';

export const CardHeader = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col space-y-1.5 p-6 pb-4',
      'after:content-[""] after:block after:mt-4 after:-mx-6 after:h-px after:hairline',
      className
    )}
    {...p}
  />
);

export const CardTitle = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => (
  <h3
    className={cn(
      'text-lg font-bold leading-none tracking-tight',
      'bg-gradient-to-r from-foreground via-foreground to-indigo-500 bg-clip-text text-transparent',
      className
    )}
    {...p}
  />
);

export const CardDescription = ({ className, ...p }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn('text-sm text-muted-foreground leading-relaxed', className)} {...p} />
);

export const CardContent = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('p-6 pt-4', className)} {...p} />
);

export const CardFooter = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex items-center p-6 pt-4',
      'before:content-[""] before:block before:mb-4 before:-mx-6 before:h-px before:hairline before:self-stretch before:w-[calc(100%+3rem)] before:-mt-4 before:mb-4',
      className
    )}
    {...p}
  />
);

/* ─── Stat Card Variant (untuk Dashboard KPI) ───────────────────────── */
export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  label: React.ReactNode;
  value: React.ReactNode;
  trend?: React.ReactNode;
  trendUp?: boolean;
  variant?: 'indigo' | 'gold' | 'emerald' | 'rose' | 'navy';
  footer?: React.ReactNode;
  shimmer?: boolean;
}

const STAT_GRADIENTS: Record<NonNullable<StatCardProps['variant']>, string> = {
  indigo:  'from-indigo-500 via-purple-500 to-fuchsia-500',
  gold:    'from-champagne-500 via-amber-400 to-champagne-500',
  emerald: 'from-emerald-500 via-tealuxe-500 to-cyan-500',
  rose:    'from-rose-500 via-pink-500 to-fuchsia-500',
  navy:    'from-navy-700 via-indigo-700 to-navy-700',
};

export function StatCard({
  icon,
  label,
  value,
  trend,
  trendUp,
  variant = 'indigo',
  footer,
  shimmer,
  className,
  ...p
}: StatCardProps) {
  return (
    <Card
      className={cn(
        'overflow-hidden group animate-fade-in-up',
        shimmer && 'animate-pulse',
        className
      )}
      {...p}
    >
      <div className="relative">
        {/* Gradient side-accent */}
        <div
          aria-hidden
          className={cn(
            'absolute left-0 top-0 h-full w-1.5 rounded-l-xl bg-gradient-to-b opacity-90 group-hover:opacity-100',
            STAT_GRADIENTS[variant]
          )}
        />
        {/* Soft glow backdrop */}
        <div
          aria-hidden
          className={cn(
            'absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-10 blur-3xl bg-gradient-to-br group-hover:opacity-20 transition-opacity',
            STAT_GRADIENTS[variant]
          )}
        />
        <div className="relative pl-5 pr-5 pt-5 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {label}
              </p>
              <div className="mt-2 flex items-end gap-2 flex-wrap">
                <p
                  className={cn(
                    'text-2xl md:text-3xl font-black tracking-tight',
                    'bg-gradient-to-r bg-clip-text text-transparent animate-gradient-flow bg-[length:200%_auto]',
                    STAT_GRADIENTS[variant]
                  )}
                  style={{ animationDuration: '4s' }}
                >
                  {value}
                </p>
                {trend && (
                  <span
                    className={cn(
                      'inline-flex items-center gap-0.5 text-xs font-bold rounded-full px-2 py-0.5 transition-all group-hover:scale-105',
                      trendUp
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-500/20'
                        : 'bg-rose-500/15 text-rose-700 dark:text-rose-400 ring-1 ring-rose-500/20'
                    )}
                  >
                    {trend}
                  </span>
                )}
              </div>
            </div>
            {icon && (
              <div
                className={cn(
                  'shrink-0 flex size-11 items-center justify-center rounded-xl text-white shadow-md transition-all duration-300 ease-bounce-soft group-hover:scale-110 group-hover:-rotate-3 bg-gradient-to-br',
                  STAT_GRADIENTS[variant]
                )}
              >
                <span className="drop-shadow">{icon}</span>
              </div>
            )}
          </div>
          {footer && (
            <div className="mt-4 pt-3 border-t border-border/50 text-xs text-muted-foreground flex items-center justify-between">
              {footer}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
