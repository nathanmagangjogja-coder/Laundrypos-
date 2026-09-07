'use client';
import { Check, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

export interface Step {
  id: string;
  title: string;
  description?: string;
  icon?: ReactNode;
}

interface StepperProps {
  steps: Step[];
  current: number;
  onStepClick?: (index: number) => void;
  allowJumpBack?: boolean;
  orientation?: 'horizontal' | 'vertical';
}

export function Stepper({
  steps,
  current,
  onStepClick,
  allowJumpBack = true,
  orientation = 'horizontal',
}: StepperProps) {
  return (
    <div
      className={cn(
        'w-full',
        orientation === 'horizontal'
          ? 'flex items-center justify-between gap-1'
          : 'flex flex-col gap-2'
      )}
      aria-label="Progress"
    >
      {steps.map((step, idx) => {
        const state =
          idx < current ? 'done' : idx === current ? 'active' : 'pending';
        const isClickable =
          onStepClick && (allowJumpBack ? idx < current : false);
        return (
          <div
            key={step.id}
            className={cn(
              'relative flex items-center gap-3 flex-1 last:flex-none',
              orientation === 'vertical' && 'items-start',
              isClickable && 'cursor-pointer'
            )}
            onClick={() => isClickable && onStepClick(idx)}
          >
            <div className="relative flex shrink-0 flex-col items-center">
              <button
                type="button"
                tabIndex={isClickable ? 0 : -1}
                aria-current={state === 'active' ? 'step' : undefined}
                className={cn(
                  'relative grid h-10 w-10 place-items-center rounded-full text-xs font-black transition-all duration-300 ring-4',
                  state === 'done' &&
                    'bg-gradient-to-br from-emerald-500 to-teal-500 text-white ring-emerald-500/20 shadow-lg shadow-emerald-500/30 scale-100',
                  state === 'active' &&
                    'bg-gradient-to-br from-indigo-500 via-primary to-purple-500 text-white ring-primary/30 shadow-xl shadow-primary/40 scale-110 animate-pulse-glow-light',
                  state === 'pending' &&
                    'bg-muted text-muted-foreground ring-muted/30'
                )}
              >
                {state === 'done' ? (
                  <Check className="h-5 w-5" strokeWidth={3} />
                ) : step.icon ? (
                  step.icon
                ) : (
                  <span>{idx + 1}</span>
                )}
              </button>
            </div>

            <div
              className={cn(
                'flex flex-col justify-center min-w-0',
                orientation === 'horizontal' && 'hidden sm:flex'
              )}
            >
              <span
                className={cn(
                  'text-xs font-bold uppercase tracking-widest truncate',
                  state === 'active' && 'text-primary',
                  state === 'done' && 'text-emerald-600 dark:text-emerald-400',
                  state === 'pending' && 'text-muted-foreground/70'
                )}
              >
                Step {idx + 1}
              </span>
              <span
                className={cn(
                  'text-sm font-semibold tracking-tight truncate',
                  state === 'pending' && 'text-muted-foreground'
                )}
              >
                {step.title}
              </span>
              {step.description && (
                <span className="text-[10px] text-muted-foreground truncate max-w-[180px]">
                  {step.description}
                </span>
              )}
            </div>

            {idx < steps.length - 1 && (
              <div
                className={cn(
                  'relative flex-1 overflow-hidden mx-1 my-1 rounded-full',
                  orientation === 'horizontal' ? 'h-1' : 'w-1 h-8 self-center mx-auto my-0'
                )}
                aria-hidden
              >
                <div className="absolute inset-0 bg-muted" />
                <div
                  className={cn(
                    'absolute inset-0 transition-all duration-500 ease-out rounded-full',
                    idx < current
                      ? 'w-full bg-gradient-to-r from-emerald-500 to-teal-500'
                      : 'w-0'
                  )}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface StepFooterProps {
  current: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onSubmit?: () => void;
  nextLabel?: string;
  prevLabel?: string;
  submitLabel?: string;
  canNext?: boolean;
  isSubmitting?: boolean;
  nextIcon?: ReactNode;
  prevIcon?: ReactNode;
  submitIcon?: ReactNode;
  className?: string;
}

export function StepFooter({
  current,
  total,
  onPrev,
  onNext,
  onSubmit,
  nextLabel = 'Selanjutnya',
  prevLabel = 'Kembali',
  submitLabel = 'Simpan',
  canNext = true,
  isSubmitting,
  nextIcon,
  prevIcon,
  submitIcon,
  className,
}: StepFooterProps) {
  const isLast = current === total - 1;
  const isFirst = current === 0;

  return (
    <div
      className={cn(
        'flex w-full items-center justify-between gap-2 border-t bg-card/50 backdrop-blur-sm px-4 py-4 rounded-2xl mt-6',
        className
      )}
    >
      <div className="text-xs text-muted-foreground font-medium tracking-wide">
        <span className="text-primary font-black">{current + 1}</span>
        <span className="mx-1">/</span>
        <span>{total}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={isFirst || isSubmitting}
          className={cn(
            'inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border px-4 text-sm font-semibold transition-all',
            isFirst || isSubmitting
              ? 'pointer-events-none opacity-40'
              : 'hover:bg-muted hover:scale-[1.02] active:scale-[0.98]'
          )}
        >
          {prevIcon ?? <ChevronRight className="h-4 w-4 rotate-180" />}
          <span className="hidden sm:inline">{prevLabel}</span>
        </button>

        {isLast ? (
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-500/40 active:scale-[0.98] disabled:opacity-60 disabled:scale-100"
          >
            {submitIcon}
            {submitLabel}
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            disabled={!canNext || isSubmitting}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 via-primary to-purple-500 px-6 text-sm font-bold text-white shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/40 active:scale-[0.98] disabled:opacity-60 disabled:scale-100"
          >
            {nextIcon ?? <ChevronRight className="h-4 w-4" />}
            <span className="hidden sm:inline">{nextLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
}
