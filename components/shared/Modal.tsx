'use client';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle, CheckCircle2, Info, Trash2, XCircle, Loader2,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type ModalVariant = 'default' | 'danger' | 'success' | 'info' | 'warning';

interface ModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  children?: ReactNode;
  variant?: ModalVariant;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  icon?: ReactNode;
  showIcon?: boolean;
}

const VARIANT_CONFIG: Record<ModalVariant, { icon: any; accent: string; ring: string; bg: string; text: string }> = {
  default: { icon: Info,          accent: '',                               ring: '',                              bg: '',                              text: '' },
  danger:  { icon: AlertTriangle, accent: 'text-rose-500',                 ring: 'ring-rose-500/30',              bg: 'bg-rose-500/10',                text: 'text-rose-700 dark:text-rose-300' },
  success: { icon: CheckCircle2,   accent: 'text-emerald-500',              ring: 'ring-emerald-500/30',           bg: 'bg-emerald-500/10',             text: 'text-emerald-700 dark:text-emerald-300' },
  info:    { icon: Info,          accent: 'text-sky-500',                  ring: 'ring-sky-500/30',               bg: 'bg-sky-500/10',                 text: 'text-sky-700 dark:text-sky-300' },
  warning: { icon: AlertTriangle, accent: 'text-amber-500',                ring: 'ring-amber-500/30',             bg: 'bg-amber-500/10',               text: 'text-amber-700 dark:text-amber-300' },
};

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  variant = 'default',
  footer,
  size = 'md',
  icon,
  showIcon,
}: ModalProps) {
  const cfg = VARIANT_CONFIG[variant];
  const Icon = icon ?? cfg.icon;
  const showHeaderIcon = showIcon ?? variant !== 'default';

  const sizeClass = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-lg',
    lg: 'sm:max-w-2xl',
    xl: 'sm:max-w-3xl',
  }[size];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('animate-fade-in-up overflow-hidden', sizeClass)}>
        {variant !== 'default' && (
          <div className={cn(
            'absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r',
            variant === 'danger'  && 'from-rose-500 via-red-500 to-rose-600',
            variant === 'success' && 'from-emerald-500 via-teal-500 to-emerald-600',
            variant === 'info'    && 'from-sky-500 via-indigo-500 to-sky-600',
            variant === 'warning' && 'from-amber-500 via-orange-500 to-amber-600',
          )} />
        )}
        <DialogHeader className="gap-3">
          <div className="flex items-start gap-3">
            {showHeaderIcon && (
              <div className={cn(
                'relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl ring-4',
                cfg.bg, cfg.ring
              )}>
                <Icon className={cn('relative h-5 w-5', cfg.accent)} strokeWidth={2.2} />
              </div>
            )}
            <div className="flex-1 space-y-0.5 pt-1">
              <DialogTitle className={cn('text-lg font-bold tracking-tight', variant !== 'default' && cfg.text)}>
                {title}
              </DialogTitle>
              {description && (
                <DialogDescription className="text-xs leading-relaxed">
                  {description}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>
        {children && <div className="py-1">{children}</div>}
        {footer && <DialogFooter className="gap-2 pt-2">{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}

interface ConfirmModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  loading?: boolean;
}

export function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  onConfirm,
  variant = 'danger',
  loading,
}: ConfirmModalProps) {
  const cfg = VARIANT_CONFIG[variant];
  async function handleConfirm() {
    await onConfirm();
  }

  const btnVariant =
    variant === 'danger' ? 'destructive' :
    variant === 'success' ? 'default' :
    variant === 'warning' ? 'default' : 'default';

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      variant={variant}
      size="sm"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={btnVariant}
            onClick={handleConfirm}
            disabled={loading}
            className={cn(
              variant === 'danger' && 'bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-500/30',
              variant === 'warning' && 'bg-amber-500 hover:bg-amber-600 text-amber-950 shadow-lg shadow-amber-500/30',
              variant === 'success' && 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/30'
            )}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {variant === 'danger' && !loading && <Trash2 className="mr-2 h-4 w-4" />}
            {confirmText}
          </Button>
        </>
      }
    />
  );
}

export function SuccessModal(props: Omit<ModalProps, 'variant' | 'showIcon'>) {
  return <Modal {...props} variant="success" showIcon />;
}
export function DangerModal(props: Omit<ModalProps, 'variant' | 'showIcon'>) {
  return <Modal {...props} variant="danger" showIcon />;
}
export function InfoModal(props: Omit<ModalProps, 'variant' | 'showIcon'>) {
  return <Modal {...props} variant="info" showIcon />;
}
export function WarningModal(props: Omit<ModalProps, 'variant' | 'showIcon'>) {
  return <Modal {...props} variant="warning" showIcon />;
}
