'use client';
import { useState, useEffect, useCallback } from 'react'; // ← tambah useCallback
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tag, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Voucher } from '@/types';

interface VoucherInputProps {
  customerId: string;
  onApply: (voucher: Voucher) => void;
  onRemove: () => void;
  applied: Voucher | null;
}

export function VoucherInput({ customerId, onApply, onRemove, applied }: VoucherInputProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [availableVouchers, setAvailableVouchers] = useState<Voucher[]>([]);
  const [showList, setShowList] = useState(false);

  // ← dibungkus useCallback agar tidak berubah setiap render
  const loadAvailableVouchers = useCallback(async () => {
    if (!customerId) return;
    try {
      const res = await fetch(`/api/customers/${customerId}/vouchers`);
      if (res.ok) {
        const data = await res.json();
        setAvailableVouchers(
          data.data.filter((v: Voucher) => !v.is_used && new Date(v.expired_at) > new Date())
        );
      }
    } catch (error) {
      console.error('Failed to load vouchers', error);
    }
  }, [customerId]); // ← hanya bergantung pada customerId

  useEffect(() => {
    if (customerId) {
      loadAvailableVouchers();
    } else {
      setAvailableVouchers([]);
    }
  }, [customerId, loadAvailableVouchers]); // ← sekarang stabil, tidak infinite re-render

  async function validate() {
    if (!code.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/vouchers/validate?code=${code.toUpperCase()}&customer_id=${customerId}`);
      const result = await res.json();
      if (result.error) {
        toast.error(result.error);
      } else {
        onApply(result.data);
        setCode('');
        toast.success('✅ Voucher berhasil digunakan!');
      }
    } catch (error) {
      toast.error('Gagal memvalidasi voucher');
    } finally {
      setLoading(false);
    }
  }

  if (applied) {
    return (
      <div className="rounded-lg border-2 border-dashed border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
            <Tag className="h-4 w-4" />
            <span className="text-sm font-bold">Voucher: {applied.code}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900"
            onClick={onRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-1 text-xs text-emerald-600 dark:text-emerald-500 font-medium">
          Potongan Rp {applied.discount_amount.toLocaleString('id-ID')}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            placeholder="Kode Voucher"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="pr-9"
          />
          <Tag className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>
        <Button
          variant="outline"
          onClick={validate}
          disabled={loading || !code.trim() || !customerId}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Gunakan'}
        </Button>
      </div>

      {availableVouchers.length > 0 && (
        <div className="space-y-1.5">
          <button
            onClick={() => setShowList(!showList)}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            {showList ? 'Sembunyikan' : 'Lihat'} {availableVouchers.length} voucher tersedia
          </button>

          {showList && (
            <div className="grid gap-2 max-h-40 overflow-y-auto pr-1">
              {availableVouchers.map(v => (
                <button
                  key={v.id}
                  onClick={() => { onApply(v); setShowList(false); }}
                  className="text-left p-2 rounded border border-dashed hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors group"
                >
                  <div className="flex justify-between items-start">
                    <div className="font-bold text-xs group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                      {v.code}
                    </div>
                    <div className="text-[10px] font-bold text-emerald-600">
                      Rp {v.discount_amount.toLocaleString('id-ID')}
                    </div>
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">{v.title}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}