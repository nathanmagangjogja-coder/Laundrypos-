'use client';
/**
 * components/customers/CustomerLoyaltyPanel.tsx
 * Loyalty info panel to add to the customer detail page.
 * Add <CustomerLoyaltyPanel customerId={customer.id} /> to customers/[id]/page.tsx
 */
import { useCustomerLoyalty } from '@/hooks/useLoyalty';
import { VoucherCard } from '@/components/loyalty/VoucherCard';
import { LoyaltyBadge } from '@/components/loyalty/LoyaltyBadge';
import { Star, Gift, TrendingUp } from 'lucide-react';

interface CustomerLoyaltyPanelProps {
  customerId: string;
}

export function CustomerLoyaltyPanel({ customerId }: CustomerLoyaltyPanelProps) {
  const { vouchers, totalPoints } = useCustomerLoyalty(customerId);
  const activeVouchers = vouchers.filter(v => !v.is_used && v.expired_at > new Date().toISOString());
  const usedVouchers = vouchers.filter(v => v.is_used);

  return (
    <div className="space-y-4">
      {/* Points summary */}
      <div className="rounded-xl border bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950 border-amber-200 dark:border-amber-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
              <Star className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <div className="text-2xl font-black text-amber-700 dark:text-amber-300">
                {totalPoints} poin
              </div>
              <div className="text-xs text-muted-foreground">Saldo poin saat ini</div>
            </div>
          </div>
          <LoyaltyBadge points={totalPoints} />
        </div>
      </div>

      {/* Voucher stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border p-3 text-center bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800">
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{activeVouchers.length}</div>
          <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
            <Gift className="h-3 w-3" /> Voucher aktif
          </div>
        </div>
        <div className="rounded-xl border p-3 text-center bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{usedVouchers.length}</div>
          <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
            <TrendingUp className="h-3 w-3" /> Total redeem
          </div>
        </div>
      </div>

      {/* Active vouchers */}
      {activeVouchers.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Voucher Aktif</h4>
          <div className="space-y-2">
            {activeVouchers.map(v => (
              <VoucherCard key={v.id} voucher={v} compact />
            ))}
          </div>
        </div>
      )}

      {vouchers.length === 0 && (
        <div className="py-8 text-center text-muted-foreground">
          <Gift className="mx-auto mb-2 h-8 w-8 opacity-30" />
          <p className="text-sm">Belum ada voucher</p>
          <p className="text-xs">Voucher akan muncul setelah transaksi pertama</p>
        </div>
      )}
    </div>
  );
}
