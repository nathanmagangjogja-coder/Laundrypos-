'use client';
import * as React from 'react';
import { Plus, Printer, Download, Share2, MessageCircle, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface FloatingActionItem {
  id: string;
  icon?: React.ReactNode;
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'link';
  hidden?: boolean;
}

interface FloatingActionsProps {
  items?: FloatingActionItem[];
  onPrimaryAction?: () => void;
  primaryLabel?: string;
  primaryIcon?: React.ReactNode;
  className?: string;
  showQuickActions?: boolean;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  label?: string;
}

const POSITION_CLASSES: Record<NonNullable<FloatingActionsProps['position']>, string> = {
  'bottom-right':  'right-4 md:right-6 bottom-4 md:bottom-6',
  'bottom-left':   'left-4 md:left-6 bottom-4 md:bottom-6',
  'bottom-center': 'left-1/2 -translate-x-1/2 bottom-4 md:bottom-6',
};

const DEFAULT_QUICK_ACTIONS: FloatingActionItem[] = [
  { id: 'whatsapp', icon: <MessageCircle className="h-5 w-5" />, label: 'Kirim WA', variant: 'ghost' },
  { id: 'print',    icon: <Printer      className="h-5 w-5" />, label: 'Cetak',   variant: 'ghost' },
  { id: 'export',   icon: <Download     className="h-5 w-5" />, label: 'Export',  variant: 'ghost' },
  { id: 'share',    icon: <Share2       className="h-5 w-5" />, label: 'Bagikan', variant: 'ghost' },
];

export function FloatingActions({
  items,
  onPrimaryAction,
  primaryLabel = 'Tambah Baru',
  primaryIcon = <Plus className="h-5 w-5" />,
  className,
  showQuickActions = true,
  position = 'bottom-right',
  label,
}: FloatingActionsProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const quickActions = items ?? (showQuickActions ? DEFAULT_QUICK_ACTIONS : []);

  React.useEffect(() => {
    function onClick(e: MouseEvent) {
      if (open && !containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [open]);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        'fixed z-50',
        POSITION_CLASSES[position],
        'flex flex-col items-end gap-3 pointer-events-none',
        className
      )}
    >
      {/* Quick actions */}
      <div
        className={cn(
          'flex flex-col gap-2 transition-all duration-300 origin-bottom-right',
          open
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-3 pointer-events-none scale-95'
        )}
      >
        {quickActions.map((action, idx) =>
          action.hidden ? null : (
            <div
              key={action.id}
              className="flex items-center gap-2 animate-fade-in-up"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <span className="glass-strong rounded-lg px-3 py-1.5 text-xs font-semibold text-foreground shadow-lg">
                {action.label}
              </span>
              <Button
                size="icon-lg"
                variant={action.variant || 'outline'}
                onClick={() => {
                  action.onClick?.();
                  setOpen(false);
                }}
                className="shadow-card-luxe backdrop-blur animate-pop-in"
              >
                {action.icon}
              </Button>
            </div>
          )
        )}
      </div>

      {/* Label pill */}
      {label && (
        <div
          className={cn(
            'glass-strong rounded-full px-4 py-2 text-xs font-bold text-foreground shadow-card-luxe transition-all duration-300 origin-bottom-right whitespace-nowrap',
            open ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 scale-95'
          )}
        >
          <Sparkles className="h-3.5 w-3.5 inline mr-1.5 text-champagne-500" />
          {label}
        </div>
      )}

      {/* Main FAB */}
      <button
        type="button"
        aria-label={primaryLabel}
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          if (onPrimaryAction) {
            onPrimaryAction();
          } else {
            setOpen((o) => !o);
          }
        }}
        className={cn(
          'relative group pointer-events-auto',
          'h-14 w-14 rounded-full shadow-card-lifted animate-pulse-glow',
          'bg-gradient-luxe text-white font-bold',
          'transition-all duration-300 ease-bounce-soft',
          'hover:scale-110 hover:shadow-[0_0_40px_rgba(168,85,247,0.55)]',
          'active:scale-95',
          'focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-400/50'
        )}
      >
        <span className="shine-overlay" aria-hidden />
        <span
          className={cn(
            'relative transition-transform duration-300 inline-flex items-center justify-center',
            open && !onPrimaryAction && 'rotate-45'
          )}
        >
          {open && !onPrimaryAction ? <X className="h-6 w-6" /> : primaryIcon}
        </span>
      </button>
    </div>
  );
}

export default FloatingActions;
