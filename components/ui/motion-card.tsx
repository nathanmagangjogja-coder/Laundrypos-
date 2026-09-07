'use client';
import * as React from 'react';
import { cn } from '@/lib/utils';

type MotionCardVariant = 'default' | 'luxe' | 'glass' | 'gold' | 'gradient';
type MotionCardHover = 'lift' | 'tilt' | 'glow' | 'scale' | 'none';

interface MotionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: MotionCardVariant;
  hover?: MotionCardHover;
  index?: number;
  shimmer?: boolean;
  clickable?: boolean;
  as?: React.ElementType;
}

const VARIANTS: Record<MotionCardVariant, string> = {
  default:
    'border border-border/70 bg-card text-card-foreground shadow-sm',
  luxe:
    'border border-indigo-500/15 bg-card text-card-foreground shadow-card-luxe backdrop-blur-sm',
  glass:
    'glass text-card-foreground shadow-card-glow',
  gold:
    'border border-champagne-500/30 bg-card text-card-foreground shadow-card-luxe-gold backdrop-blur-sm',
  gradient:
    'border-0 text-white shadow-card-lifted bg-gradient-luxe',
};

const HOVERS: Record<MotionCardHover, string> = {
  lift:
    'hover:-translate-y-1.5 hover:shadow-card-lifted hover:border-indigo-500/30',
  tilt:
    'hover:[transform:perspective(1000px)_rotateX(4deg)_rotateY(-6deg)_translateZ(4px)] hover:shadow-card-lifted',
  glow:
    'hover:shadow-glow-indigo-lg hover:border-indigo-500/40 dark:hover:shadow-glow-indigo',
  scale:
    'hover:scale-[1.02] hover:shadow-card-lifted',
  none: '',
};

export const MotionCard = React.forwardRef<HTMLDivElement, MotionCardProps>(function MotionCard(
  {
    className,
    variant = 'luxe',
    hover = 'lift',
    index = 0,
    shimmer = false,
    clickable = false,
    children,
    ...props
  },
  ref
) {
  const asProps: any = {};
  if (clickable) {
    asProps.role = 'button';
    asProps.tabIndex = 0;
  }

  return (
    <div
      ref={ref}
      className={cn(
        'relative rounded-xl overflow-visible',
        'transition-all duration-300 ease-luxe will-change-transform',
        VARIANTS[variant],
        HOVERS[hover],
        shimmer && 'animate-shimmer',
        clickable && 'cursor-pointer active:translate-y-0 active:scale-[0.995] focus-ring-luxe',
        'animate-fade-in-up',
        className
      )}
      style={{ animationDelay: `${index * 60}ms` }}
      {...asProps}
      {...props}
    >
      {/* Luxury hairline top-gradient accent */}
      {variant !== 'gradient' && (
        <div
          aria-hidden
          className={cn(
            'absolute inset-x-0 top-0 h-px opacity-70 pointer-events-none',
            variant === 'gold'
              ? 'bg-gradient-to-r from-transparent via-champagne-500/60 to-transparent'
              : 'bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent'
          )}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
});

// ── Sections (mirror Card API but with motion luxe treatment) ─────────
export function MotionCardHeader({
  className,
  ...p
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'relative flex flex-col space-y-1.5 p-5 pb-3',
        'after:absolute after:inset-x-5 after:bottom-0 after:h-px after:hairline',
        className
      )}
      {...p}
    />
  );
}

export function MotionCardTitle({
  className,
  ...p
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        'text-base font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground to-indigo-500 bg-clip-text text-transparent',
        className
      )}
      {...p}
    />
  );
}

export function MotionCardDescription({
  className,
  ...p
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('text-sm text-muted-foreground leading-relaxed', className)}
      {...p}
    />
  );
}

export function MotionCardContent({
  className,
  ...p
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5 pt-3', className)} {...p} />;
}

export function MotionCardFooter({
  className,
  ...p
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'relative flex items-center p-5 pt-3',
        'before:absolute before:inset-x-5 before:top-0 before:h-px before:hairline',
        className
      )}
      {...p}
    />
  );
}
