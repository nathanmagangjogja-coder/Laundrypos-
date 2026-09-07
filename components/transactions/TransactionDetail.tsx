'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge, PaymentBadge } from './StatusBadge';
import { InvoicePreview } from '@/components/invoice/InvoicePreview';
import { LAUNDRY_STATUSES, PAYMENT_STATUSES, WA_TEMPLATES } from '@/constants';
import { exportElementToPdf } from '@/lib/pdf';
import { waLink, formatDateTime, formatRupiah } from '@/lib/utils';
import { Printer, Send, FileDown, Trash2, MessageCircle, Lock, UserCheck, Droplets, PackageCheck, AlertTriangle } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import type { Transaction, LaundryStatus, PaymentStatus } from '@/types';
import { api } from '@/lib/api';
import { Modal } from '@/components/shared/Modal';
import { LoyaltyBadge } from '@/components/loyalty/LoyaltyBadge';
import { VoucherGeneratedToast } from '@/components/loyalty/VoucherGeneratedToast';
import { useAuth } from '@/hooks/useAuth';

export function TransactionDetail({ trx: initial }: { trx: Transaction }) {
  const [trx, setTrx] = useState(initial);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loyaltyData, setLoyaltyData] = useState<any>(null);
  const [loyaltyKey, setLoyaltyKey] = useState(0);
  const [waPreview, setWaPreview] = useState<{ url: string; phone: string; message: string } | null>(null);
  const [confirmStatus, setConfirmStatus] = useState<LaundryStatus | null>(null);

  const invRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user } = useAuth();

  // ─── Role flags ───────────────────────────────────────────────────────────
  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin      = user?.role === 'admin';
  const isMitra      = user?.role === 'mitra';

  // Admin bisa update status laundry, tapi tidak bisa proses pembayaran
  const canUpdateStatus  = isSuperAdmin || isAdmin;
  // Hanya super admin yang bisa proses pembayaran
  const canUpdatePayment = isSuperAdmin;
  // Hanya super admin yang bisa hapus
  const canDelete        = isSuperAdmin;
  // Admin & super admin bisa lihat info keuangan, mitra tidak
  const canSeeFinance    = isSuperAdmin || isAdmin;

  const trackingUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/track/${trx.invoice_no}`
    : `/track/${trx.invoice_no}`;

  async function processLoyalty() {
    try {
      const res = await fetch('/api/loyalty/process', {
        method: 'POST',
        body: JSON.stringify({ transaction_id: trx.id }),
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        setLoyaltyData(data);
        setLoyaltyKey(k => k + 1);
      }
    } catch (err) {
      console.error('Failed to process loyalty:', err);
    }
  }

  async function changeStatus(s: LaundryStatus) {
    if (!canUpdateStatus) return;
    // Aksi ireversibel (menandai selesai/diambil) → minta konfirmasi dulu,
    // supaya staf sadar namanya akan tercatat di histori (completed_by).
    if (['selesai', 'diambil'].includes(s) && s !== trx.status) {
      setConfirmStatus(s);
      return;
    }
    await commitStatus(s);
  }

  async function commitStatus(s: LaundryStatus) {
    try {
      const updated = await api.updateTransaction(trx.id, { status: s });
      setTrx(updated);
      toast.success('Status diperbarui');
      if (s === 'selesai') processLoyalty();
    } catch (error: any) {
      toast.error(error.message ?? 'Gagal memperbarui status');
    } finally {
      setConfirmStatus(null);
    }
  }

  async function changePayment(s: PaymentStatus) {
    if (!canUpdatePayment) return;
    const paid = s === 'lunas' ? trx.total : s === 'dp' ? trx.total / 2 : 0;
    try {
      const updated = await api.updateTransaction(trx.id, { payment_status: s, paid });
      setTrx(updated);
      toast.success('Status pembayaran diperbarui');
      if (s === 'lunas') await processLoyalty();
    } catch (error: any) {
      toast.error(error.message ?? 'Gagal memperbarui pembayaran');
    }
  }

  async function downloadPdf() {
    if (invRef.current) {
      await exportElementToPdf(invRef.current, `${trx.invoice_no}.pdf`);
    }
  }

  function sendWa(kind: 'newOrder' | 'ready') {
    const phone = trx.customer_phone ?? '';
    if (!phone.trim()) { toast.error('Nomor HP pelanggan tidak tersedia'); return; }
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const message = kind === 'newOrder'
      ? WA_TEMPLATES.newOrder(trx.customer_name, trx.invoice_no, trx.total, formatDateTime(trx.est_done_at), baseUrl)
      : WA_TEMPLATES.ready(trx.customer_name, trx.invoice_no);
    setWaPreview({ url: waLink(phone, message), phone, message });
  }

  function confirmSendWa(url: string) {
    setWaPreview(null);
    window.location.href = url;
  }

  async function handleDelete() {
    if (!canDelete) return;
    try {
      await api.deleteTransaction(trx.id);
      toast.success('Transaksi dihapus');
      router.push('/transactions');
    } catch (error: any) {
      toast.error(error.message ?? 'Gagal menghapus transaksi');
    }
  }

  const hasPhone = Boolean(trx.customer_phone?.trim());

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-2">
            <div>
              <CardTitle className="font-mono text-base">{trx.invoice_no}</CardTitle>
              <div className="mt-2 flex gap-2 flex-wrap">
                <StatusBadge status={trx.status} />
                {/* Payment badge hanya untuk yang bisa lihat keuangan */}
                {canSeeFinance && <PaymentBadge status={trx.payment_status} />}
              </div>
            </div>

            {/* Update status laundry — admin & super admin */}
            {canUpdateStatus ? (
              <div className="w-44">
                <Select value={trx.status} onValueChange={v => changeStatus(v as LaundryStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LAUNDRY_STATUSES.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              /* Mitra hanya lihat status, tidak bisa ubah */
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-lg">
                <Lock className="h-3 w-3" />
                <span>Read only</span>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div ref={invRef}>
              <InvoicePreview trx={trx} trackingUrl={trackingUrl} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {/* Loyalty — hanya admin & super admin */}
        {canSeeFinance && (
          <Card>
            <CardHeader><CardTitle>Loyalty Pelanggan</CardTitle></CardHeader>
            <CardContent>
              <LoyaltyBadge key={loyaltyKey} customerId={trx.customer_id} showHistory />
              {loyaltyData?.points_earned > 0 && (
                <p className="mt-3 text-xs text-center font-bold text-emerald-500">
                  + {loyaltyData.points_earned} Poin didapat dari transaksi ini
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Aksi */}
        <Card>
          <CardHeader><CardTitle>Aksi</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" /> Cetak Thermal
            </Button>
            <Button variant="outline" className="w-full" onClick={downloadPdf}>
              <FileDown className="mr-2 h-4 w-4" /> Download PDF
            </Button>
            <Button
              variant="outline"
              className="w-full text-green-600 border-green-200 hover:bg-green-50 disabled:opacity-50"
              onClick={() => sendWa('newOrder')}
              disabled={!hasPhone}
            >
              <Send className="mr-2 h-4 w-4" /> Kirim Nota WA
              {!hasPhone && <span className="ml-auto text-xs text-red-400">No HP kosong</span>}
            </Button>
            <Button
              variant="outline"
              className="w-full disabled:opacity-50"
              onClick={() => sendWa('ready')}
              disabled={!hasPhone}
            >
              <Send className="mr-2 h-4 w-4" /> Kirim Selesai WA
              {!hasPhone && <span className="ml-auto text-xs text-red-400">No HP kosong</span>}
            </Button>

            {/* Hapus — hanya super admin */}
            {canDelete && (
              <Button variant="destructive" className="w-full" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" /> Hapus Transaksi
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Riwayat Pelayanan — jejak siapa mengerjakan tiap tahap */}
        <Card>
          <CardHeader><CardTitle>Riwayat Pelayanan</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <HandlerRow icon={UserCheck} label="Diterima oleh" name={trx.created_by_name} color="text-blue-600 bg-blue-500/10" />
            <HandlerRow icon={Droplets} label="Diproses/Dicuci oleh" name={trx.processed_by_name} color="text-cyan-600 bg-cyan-500/10" />
            <HandlerRow icon={PackageCheck} label="Diselesaikan oleh" name={trx.completed_by_name} color="text-emerald-600 bg-emerald-500/10" />
          </CardContent>
        </Card>

        {/* Pembayaran — hanya super admin */}
        {canUpdatePayment && (
          <Card>
            <CardHeader><CardTitle>Pembayaran</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Select value={trx.payment_status} onValueChange={v => changePayment(v as PaymentStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_STATUSES.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="space-y-2 text-sm border-t pt-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-semibold">{formatRupiah(trx.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dibayar</span>
                  <span>{formatRupiah(trx.paid)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sisa</span>
                  <span className="font-semibold text-rose-600">
                    {formatRupiah(Math.max(0, trx.total - trx.paid))}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info keuangan read-only untuk admin (lihat tapi tidak ubah) */}
        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                Info Tagihan
                <span className="text-[10px] font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  Pembayaran dikelola Super Admin
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="font-semibold">{formatRupiah(trx.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status Bayar</span>
                <PaymentBadge status={trx.payment_status} />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Modal */}
      {canDelete && (
        <Modal open={deleteOpen} onOpenChange={setDeleteOpen} title="Hapus Transaksi?">
          <p className="text-sm text-muted-foreground mb-4">
            Transaksi <strong>{trx.invoice_no}</strong> akan dihapus permanen.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete}>Hapus</Button>
          </div>
        </Modal>
      )}

      {/* WA Preview Modal */}
      {waPreview && (
        <Modal open={!!waPreview} onOpenChange={() => setWaPreview(null)} title="Preview Pesan WhatsApp">
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 px-3 py-2">
              <MessageCircle className="h-4 w-4 text-green-600 shrink-0" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                Kirim ke: <strong>{waPreview.phone}</strong> ({trx.customer_name})
              </span>
            </div>
            <div className="rounded-lg border bg-muted/40 p-3 max-h-64 overflow-y-auto">
              <p className="text-xs text-muted-foreground mb-1 font-medium">Isi Pesan:</p>
              <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">{waPreview.message}</pre>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setWaPreview(null)}>Batal</Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => confirmSendWa(waPreview.url)}
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Kirim via WhatsApp
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {loyaltyData?.voucher_generated && (
        <VoucherGeneratedToast
          voucherCode={loyaltyData.voucher_code}
          whatsappUrl={loyaltyData.whatsapp_url}
          onClose={() => setLoyaltyData(null)}
        />
      )}

      {/* Konfirmasi sebelum aksi ireversibel (Selesai/Diambil) */}
      <Modal
        open={!!confirmStatus}
        onOpenChange={(v) => !v && setConfirmStatus(null)}
        title={`Tandai ${confirmStatus ? LAUNDRY_STATUSES.find(s => s.value === confirmStatus)?.label : ''}?`}
      >
        <div className="flex items-start gap-3 mb-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            Aksi ini akan tercatat atas nama Anda di histori transaksi.
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmStatus(null)}>Batal</Button>
          <Button
            className="bg-amber-500 hover:bg-amber-600 text-amber-950"
            onClick={() => confirmStatus && commitStatus(confirmStatus)}
          >
            Ya, Tandai
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function HandlerRow({ icon: Icon, label, name, color }: { icon: any; label: string; name?: string | null; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`grid h-8 w-8 place-items-center rounded-lg shrink-0 ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className={name ? 'text-sm font-medium truncate' : 'text-sm text-muted-foreground italic'}>
          {name || 'Belum tercatat'}
        </div>
      </div>
    </div>
  );
}