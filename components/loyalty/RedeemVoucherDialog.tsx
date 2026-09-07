'use client';
/**
 * components/loyalty/RedeemVoucherDialog.tsx
 * Dialog to enter and validate a voucher code during checkout.
 */
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tag, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { validateVoucher } from '@/lib/loyalty-store';
import { formatRupiah } from '@/lib/utils';
import type { Voucher } from '@/types';

interface RedeemVoucherDialogProps {
  open: boolean;
  onClose: () => void;
  customerId: string;
  orderTotal: number;
  onApply: (voucher: Voucher) => void;
}

export function RedeemVoucherDialog({
  open,
  onClose,
  customerId,
  orderTotal,
  onApply,
}: RedeemVoucherDialogProps) {
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<{ valid: boolean; voucher?: Voucher; error?: string } | null>(null);

  async function handleCheck() {
    if (!code.trim()) return;
    setChecking(true);
    try {
      const res = await validateVoucher(code, customerId, orderTotal);
      setResult(res);
    } catch (error: any) {
      setResult({ valid: false, error: error.message ?? 'Gagal memvalidasi voucher' });
    } finally {
      setChecking(false);
    }
  }

  function handleApply() {
    if (result?.valid && result.voucher) {
      onApply(result.voucher);
      setCode('');
      setResult(null);
      onClose();
    }
  }

  function handleClose() {
    setCode('');
    setResult(null);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-emerald-500" />
            Gunakan Voucher
          </DialogTitle>
          <DialogDescription>
            Masukkan kode voucher pelanggan untuk mendapat diskon transaksi.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Kode Voucher</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Contoh: LDRY-8F2K9A"
                value={code}
                onChange={e => {
                  setCode(e.target.value.toUpperCase());
                  setResult(null);
                }}
                className="font-mono uppercase tracking-widest"
                onKeyDown={e => e.key === 'Enter' && handleCheck()}
              />
              <Button onClick={handleCheck} disabled={!code.trim() || checking} variant="outline">
                {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cek'}
              </Button>
            </div>
          </div>

          {/* Result */}
          {result && (
            <div
              className={`rounded-xl border-2 p-3 ${
                result.valid
                  ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-700'
                  : 'border-red-300 bg-red-50 dark:bg-red-950 dark:border-red-700'
              }`}
            >
              {result.valid && result.voucher ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold">
                    <CheckCircle2 className="h-4 w-4" /> Voucher valid!
                  </div>
                  <p className="text-sm font-medium">{result.voucher.title}</p>
                  <p className="text-sm text-muted-foreground">{result.voucher.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">Diskon:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      - {formatRupiah(result.voucher.discount_amount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Total setelah diskon:</span>
                    <span className="font-bold">
                      {formatRupiah(Math.max(0, orderTotal - result.voucher.discount_amount))}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <XCircle className="h-4 w-4 shrink-0" />
                  <p className="text-sm font-medium">{result.error}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={handleClose}>Batal</Button>
            <Button
              onClick={handleApply}
              disabled={!result?.valid}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Terapkan Voucher
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
