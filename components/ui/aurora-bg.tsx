import * as React from 'react';
import { cn } from '@/lib/utils';

type AuroraVariant = 'indigo' | 'gold' | 'rainbow' | 'navy';

interface AuroraBgProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AuroraVariant;
  intensity?: 'subtle' | 'default' | 'strong';
  animated?: boolean;
  radial?: boolean;
}

const VARIANTS: Record<AuroraVariant, { from: string; via: string; to: string; alt: string }> = {
  indigo: {
    from: 'rgba(99,102,241,0.35)',
    via:  'rgba(168,85,247,0.28)',
    to:   'rgba(59,130,246,0.22)',
    alt:  'rgba(236,72,153,0.18)',
  },
  gold: {
    from: 'rgba(232,185,77,0.35)',
    via:  'rgba(245,207,108,0.28)',
    to:   'rgba(209,154,48,0.22)',
    alt:  'rgba(168,85,247,0.16)',
  },
  rainbow: {
    from: 'rgba(99,102,241,0.32)',
    via:  'rgba(236,72,153,0.24)',
    to:   'rgba(232,185,77,0.25)',
    alt:  'rgba(20,184,166,0.20)',
  },
  navy: {
    from: 'rgba(30,27,75,0.85)',
    via:  'rgba(67,56,202,0.55)',
    to:   'rgba(49,46,129,0.45)',
    alt:  'rgba(168,85,247,0.25)',
  },
};

const INTENSITY: Record<NonNullable<AuroraBgProps['intensity']>, string> = {
  subtle:  'opacity-[0.35] saturate-150',
  default: 'opacity-[0.65] saturate-[175]',
  strong: 'opacity-[0.95] saturate-200',
};

export function AuroraBg({
  variant = 'indigo',
  intensity = 'default',
  animated = true,
  radial = true,
  className,
  children,
  ...props
}: AuroraBgProps) {
  const { from, via, to, alt } = VARIANTS[variant];

  return (
    <div className={cn('relative isolate overflow-hidden', className)} {...props}>
      {/* Aurora backdrop */}
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-0 -z-10',
          INTENSITY[intensity],
          animated && 'animate-aurora'
        )}
        style={{
          background: radial
            ? `
                radial-gradient(circle at 15% 15%, ${from} 0%, transparent 55%),
                radial-gradient(circle at 85% 0%,  ${via}  0%, transparent 50%),
                radial-gradient(circle at 0% 70%,  ${to}   0%, transparent 55%),
                radial-gradient(circle at 80% 100%, ${alt}  0%, transparent 50%)
              `
            : `linear-gradient(120deg, ${from} 0%, ${via} 50%, ${to} 100%)`,
          backgroundSize: animated ? '300% 300%' : '100% 100%',
        }}
      />
      {/* Grain / noise overlay — menambah tekstur luxury */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: '160px 160px',
        }}
      />
      {children}
    </div>
  );
}

/**
 * HeroAurora — container siap pakai untuk section hero/dashboard header
 */
export function HeroAurora({
  title,
  subtitle,
  badge,
  right,
  variant = 'indigo',
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  right?: React.ReactNode;
  variant?: AuroraVariant;
  className?: string;
}) {
  return (
    <AuroraBg
      variant={variant}
      className={cn(
        'rounded-2xl p-6 md:p-8 border border-white/10 shadow-card-luxe',
        className
      )}
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
        <div className="flex-1 min-w-0 animate-fade-in-up">
          {badge}
          <h1 className="mt-2 text-2xl md:text-3xl font-black tracking-tight text-white drop-shadow-sm">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-sm md:text-base text-white/75 leading-relaxed max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>
        {right && (
          <div className="shrink-0 animate-fade-in-up delay-200">{right}</div>
        )}
      </div>
    </AuroraBg>
  );
}

export default AuroraBg;
