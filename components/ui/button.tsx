import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'group/button relative inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap transition-all duration-200 ease-luxe outline-none select-none overflow-visible focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=\'size-\'])]:size-4',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground hover:bg-primary/80 shadow-sm hover:shadow-glow-indigo',
        outline:
          'border-border bg-background/80 backdrop-blur-sm hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50 hover:border-indigo-500/40',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground',
        ghost:
          'hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50 hover:bg-indigo-500/8 dark:hover:bg-indigo-500/12',
        destructive:
          'bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40',
        link: 'text-primary underline-offset-4 hover:underline px-0',
        gradient:
          'bg-gradient-luxe text-white shadow-card-luxe hover:shadow-glow-indigo hover:-translate-y-0.5 border-0 animate-pulse-glow-light hover:animate-pulse-glow',
        gold:
          'bg-gradient-gold text-champagne-950 font-bold shadow-card-luxe-gold hover:shadow-glow-gold hover:-translate-y-0.5 border-0 hover:brightness-105 animate-pulse-gold-light',
        'outline-gold':
          'border-2 border-champagne-500/60 bg-champagne-500/5 text-champagne-700 dark:text-champagne-400 hover:bg-champagne-500/15 hover:border-champagne-500 hover:text-champagne-700 dark:hover:text-champagne-300 shadow-glow-gold-light hover:shadow-glow-gold font-semibold',
        shimmer:
          'bg-gradient-luxe text-white shadow-card-luxe border-0 relative overflow-hidden hover:-translate-y-0.5 hover:shadow-glow-indigo',
        glass:
          'glass text-foreground border-white/20 hover:bg-white/20 dark:hover:bg-white/10 shadow-card-luxe backdrop-blur-md font-semibold',
      },
      size: {
        default:
          'h-9 gap-1.5 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3',
        xs:
          'h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs font-medium in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*=\'size-\'])]:size-3',
        sm:
          'h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-3 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*=\'size-\'])]:size-3.5',
        lg:
          'h-11 gap-2 px-5 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4 text-base',
        xl:
          'h-12 gap-2.5 px-7 rounded-xl text-lg font-bold has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5',
        icon: 'size-9',
        'icon-xs':
          'size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*=\'size-\'])]:size-3',
        'icon-sm':
          'size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg',
        'icon-lg': 'size-10 rounded-xl',
        'icon-xl': 'size-12 rounded-2xl [&_svg:not([class*=\'size-\'])]:size-5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

type ButtonAdditionalProps = {
  asChild?: boolean;
  ripple?: boolean;
};

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<'button'> &
    VariantProps<typeof buttonVariants> &
    ButtonAdditionalProps
>(({ className, variant = 'default', size = 'default', asChild = false, ripple, onClick, children, ...props }, ref) => {
  const [ripples, setRipples] = React.useState<
    { id: number; x: number; y: number; size: number }[]
  >([]);

  function handleClick(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    if (
      ripple !== false &&
      (variant === 'gradient' || variant === 'shimmer' || variant === 'gold')
    ) {
      const button = e.currentTarget;
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      const id = Date.now() + Math.floor(Math.random() * 10000);
      setRipples((r) => [...r, { id, x, y, size }]);
      window.setTimeout(() => {
        setRipples((r) => r.filter((it) => it.id !== id));
      }, 650);
    }
    onClick?.(e);
  }

  // Jika variant premium, bungkus children agar overlay shine/ripple tidak mengganggu.
  // Kalau asChild, Slot.Root butuh single child, jadi kita pass children langsung ke Slot.
  const hasOverlay =
    variant === 'shimmer' || variant === 'gradient' || variant === 'gold';

  if (asChild) {
    return (
      <Slot.Root
        ref={ref as any}
        data-slot="button"
        data-variant={variant}
        data-size={size}
        className={cn(buttonVariants({ variant, size, className }))}
        onClick={onClick}
        {...props}
      />
    );
  }

  return (
    <button
      ref={ref}
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      onClick={handleClick}
      {...props}
    >
      {hasOverlay && (
        <span className="shine-overlay pointer-events-none" aria-hidden />
      )}
      {ripples.map((r) => (
        <span
          key={r.id}
          className="pointer-events-none absolute rounded-full bg-white/50 animate-ripple-expand"
          style={{
            left: r.x,
            top: r.y,
            width: r.size,
            height: r.size,
          }}
          aria-hidden
        />
      ))}
      {hasOverlay ? (
        <span className="relative z-10 inline-flex items-center gap-[inherit]">
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
});
Button.displayName = 'Button';

export { Button, buttonVariants };