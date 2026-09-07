'use client';
/**
 * components/loyalty/VoucherCard.tsx
 * Displays a voucher as a physical-style coupon.
 * Used in the Loyalty dashboard and can be printed.
 */
import { Scissors, Calendar, Tag, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Voucher } from '@/types';

interface VoucherCardProps {
  voucher: Voucher;
  compact?: boolean;
  className?: string;
}

export function VoucherCard({ voucher, compact = false, className }: VoucherCardProps) {
  const now = new Date();
  const expired = new Date(voucher.expired_at);
  const isExpired = expired < now;
  const daysLeft = Math.max(0, Math.floor((expired.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  const expDateStr = expired.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const statusColor = voucher.is_used
    ? 'border-slate-300 opacity-60'
    : isExpired
    ? 'border-red-300 opacity-60'
    : 'border-emerald-400';

  const bgGradient = voucher.is_used
    ? 'from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900'
    : isExpired
    ? 'from-red-50 to-slate-50 dark:from-red-950 dark:to-slate-900'
    : 'from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950';

  if (compact) {
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-xl border-2 border-dashed p-3 transition-all',
          statusColor,
          `bg-gradient-to-r ${bgGradient}`,
          className
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 truncate">{voucher.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">s/d {expDateStr}</p>
          </div>
          <div className="text-right shrink-0">
            <code className="text-xs font-mono font-bold bg-white dark:bg-slate-800 px-2 py-0.5 rounded border">
              {voucher.code}
            </code>
            {voucher.is_used && (
              <div className="flex items-center gap-1 mt-1 text-slate-500 text-xs justify-end">
                <CheckCircle2 className="h-3 w-3" /> Terpakai
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border-2 border-dashed transition-all hover:shadow-md',
        statusColor,
        className
      )}
    >
      {/* Top section - gradient */}
      <div className={`bg-gradient-to-br ${bgGradient} p-4`}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Tag className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                Voucher Loyalitas
              </span>
            </div>
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 leading-tight">
              {voucher.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">{voucher.description}</p>
          </div>
          <div className="text-right shrink-0 ml-3">
            {!voucher.is_used && !isExpired && (
              <div className="bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                AKTIF
              </div>
            )}
            {voucher.is_used && (
              <div className="bg-slate-400 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Terpakai
              </div>
            )}
            {!voucher.is_used && isExpired && (
              <div className="bg-red-400 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Kadaluarsa
              </div>
            )}
          </div>
        </div>

        {/* Discount amount */}
        {voucher.discount_amount > 0 && (
          <div className="mt-3">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              Rp {voucher.discount_amount.toLocaleString('id-ID')}
            </span>
            <span className="text-xs text-muted-foreground ml-1">
              min. Rp {voucher.minimum_order.toLocaleString('id-ID')}
            </span>
          </div>
        )}
      </div>

      {/* Scissor divider */}
      <div className="relative flex items-center py-1 px-3">
        <div className="flex-1 border-t-2 border-dashed border-slate-300 dark:border-slate-600" />
        <div className="mx-2 text-slate-400 flex items-center gap-1">
          <Scissors className="h-3.5 w-3.5 rotate-90" />
        </div>
        <div className="flex-1 border-t-2 border-dashed border-slate-300 dark:border-slate-600" />
        {/* Circle cutouts */}
        <div className="absolute -left-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-background border border-border" />
        <div className="absolute -right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-background border border-border" />
      </div>

      {/* Bottom section */}
      <div className="bg-white dark:bg-slate-900 px-4 pb-3 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <code className="font-mono font-black text-lg tracking-widest text-slate-800 dark:text-slate-100">
              {voucher.code}
            </code>
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {voucher.is_used ? (
                <span>Dipakai {voucher.used_at ? new Date(voucher.used_at).toLocaleDateString('id-ID') : ''}</span>
              ) : (
                <span>
                  Berlaku hingga {expDateStr}
                  {!isExpired && daysLeft <= 7 && (
                    <span className="ml-1 text-orange-500 font-semibold">({daysLeft}h lagi)</span>
                  )}
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-muted-foreground">untuk</div>
            <div className="text-xs font-semibold truncate max-w-[100px]">{voucher.customer_name}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
