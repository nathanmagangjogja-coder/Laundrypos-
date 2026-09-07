import * as React from 'react';
import { cn } from '@/lib/utils';

type ShimmerVariant = 'line' | 'circle' | 'card' | 'text' | 'table';

interface ShimmerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: ShimmerVariant;
  width?: string | number;
  height?: string | number;
  lines?: number;
}

const LINE_HEIGHTS: Record<string, string> = {
  xs: 'h-2',
  sm: 'h-3',
  md: 'h-4',
  lg: 'h-6',
  xl: 'h-8',
};

export function Shimmer({
  variant = 'text',
  width,
  height,
  lines = 3,
  className,
  ...props
}: ShimmerProps) {
  if (variant === 'circle') {
    return (
      <div
        className={cn(
          'shimmer rounded-full bg-muted/60',
          className
        )}
        style={{
          width: width ?? 40,
          height: height ?? 40,
        }}
        {...props}
      />
    );
  }

  if (variant === 'card') {
    return (
      <div
        className={cn(
          'rounded-xl border border-border/50 bg-card/60 p-5 animate-pulse',
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="shimmer h-10 w-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <div className="shimmer h-3 w-1/2 rounded" />
            <div className="shimmer h-2.5 w-1/3 rounded" />
          </div>
        </div>
        <div className="space-y-2.5">
          <div className="shimmer h-2.5 w-full rounded" />
          <div className="shimmer h-2.5 w-5/6 rounded" />
          <div className="shimmer h-2.5 w-2/3 rounded" />
        </div>
        <div className="mt-5 shimmer h-8 w-full rounded-lg" />
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={cn('rounded-xl border border-border/50 overflow-hidden', className)} {...props}>
        <div className="p-4 bg-muted/40 border-b border-border/50 space-y-2 animate-pulse">
          <div className="flex gap-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="shimmer h-3 flex-1 rounded" />
            ))}
          </div>
        </div>
        <div className="p-4 space-y-3">
          {[...Array(lines)].map((_, row) => (
            <div key={row} className="flex gap-3">
              {[...Array(5)].map((_, cell) => (
                <div key={cell} className="shimmer h-5 flex-1 rounded" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'line') {
    return (
      <div
        className={cn('shimmer rounded bg-muted/60', className)}
        style={{
          width: width ?? '100%',
          height: height ?? 12,
        }}
        {...props}
      />
    );
  }

  return (
    <div className={cn('space-y-2', className)} {...props}>
      {[...Array(lines)].map((_, i) => (
        <div
          key={i}
          className={cn('shimmer rounded bg-muted/60', i === lines - 1 ? 'w-2/3 h-2.5' : 'h-3 w-full')}
        />
      ))}
    </div>
  );
}

// ── Named variants for common use-cases ──────────────────────────────
export function ShimmerText({ lines = 2, className }: { lines?: number; className?: string }) {
  return <Shimmer variant="text" lines={lines} className={className} />;
}

export function ShimmerCard({ className }: { className?: string }) {
  return <Shimmer variant="card" className={className} />;
}

export function ShimmerCircle({ size = 40, className }: { size?: number; className?: string }) {
  return <Shimmer variant="circle" width={size} height={size} className={className} />;
}

export function ShimmerStatsGrid({ cols = 4, className }: { cols?: number; className?: string }) {
  return (
    <div
      className={cn(
        'grid gap-3',
        cols === 2 && 'grid-cols-2',
        cols === 3 && 'grid-cols-3',
        cols === 4 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
        className
      )}
    >
      {[...Array(cols)].map((_, i) => (
        <ShimmerCard key={i} />
      ))}
    </div>
  );
}
