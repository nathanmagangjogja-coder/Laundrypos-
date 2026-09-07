'use client';
import * as React from 'react';
import { cn } from '@/lib/utils';

interface ConfettiOptions {
  particleCount?: number;
  colors?: string[];
  duration?: number;
  spread?: number;
  originY?: number;
  startX?: number;
  startY?: number;
  gravity?: number;
}

type ParticleShape = 'circle' | 'square' | 'line';

interface Particle {
  id: string;
  delay: number;
  duration: number;
  size: number;
  color: string;
  rotate: number;
  shape: ParticleShape;
  drift: number;
  spin: number;
}

const DEFAULT_COLORS = [
  '#6366f1',
  '#a855f7',
  '#ec4899',
  '#f59e0b',
  '#e8b94d',
  '#22d3ee',
];

function makeParticles(count: number, colors: string[]): Particle[] {
  return Array.from({ length: count }).map<Particle>(() => {
    const shapeRoll = Math.random();
    const shape: ParticleShape =
      shapeRoll > 0.7 ? 'circle' : shapeRoll > 0.35 ? 'square' : 'line';
    return {
      id:
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      delay: Math.random() * 350,
      duration: 1600 + Math.random() * 2200,
      size: shape === 'line' ? 4 + Math.random() * 4 : 6 + Math.random() * 10,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotate: Math.random() * 360,
      shape,
      drift: (Math.random() - 0.5) * 180,
      spin: 360 + Math.random() * 720,
    };
  });
}

export function Confetti({
  particleCount = 80,
  colors = DEFAULT_COLORS,
  startX = 50,
  className,
  ...props
}: ConfettiOptions & React.HTMLAttributes<HTMLDivElement>) {
  const [particles, setParticles] = React.useState<Particle[]>([]);

  React.useEffect(() => {
    setParticles(makeParticles(particleCount, colors));
    const t = window.setTimeout(() => setParticles([]), 4500);
    return () => window.clearTimeout(t);
  }, [particleCount, colors]);

  if (!particles.length) return null;

  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none fixed inset-0 z-[100] overflow-hidden',
        className
      )}
      {...props}
    >
      {particles.map((p) => {
        const isLine = p.shape === 'line';
        return (
          <span
            key={p.id}
            className="absolute block"
            style={{
              left: `calc(${startX}% + ${p.drift}px)`,
              top: '-5%',
              width: isLine ? 2 : p.size,
              height: p.size,
              borderRadius: p.shape === 'circle' ? '50%' : 2,
              backgroundColor: p.color,
              boxShadow: `0 0 12px ${p.color}66`,
              animation: `confetti-fall ${p.duration}ms cubic-bezier(0.15, 0.6, 0.3, 1) forwards, confetti-spin ${p.duration}ms linear forwards`,
              animationDelay: `${p.delay}ms, ${p.delay}ms`,
              transform: `rotate(${p.rotate}deg)`,
              opacity: 0.95,
              // Inline spin fallback
              ['--confetti-spin' as any]: `${p.spin}deg`,
            }}
          />
        );
      })}
    </div>
  );
}

export function useConfetti() {
  const [burst, setBurst] = React.useState<
    (ConfettiOptions & { _k?: number }) | null
  >(null);
  const idRef = React.useRef(0);

  const fire = React.useCallback((opts: ConfettiOptions = {}) => {
    idRef.current += 1;
    setBurst({ ...opts, _k: idRef.current });
    window.setTimeout(() => setBurst(null), 5000);
  }, []);

  const node = burst ? <Confetti key={burst._k} {...burst} /> : null;

  return { fire, node };
}

export default Confetti;
