import { QRCodeGenerator } from './QRCodeGenerator';
import { formatDateTime, formatDate, formatRupiah } from '@/lib/utils';
import type { Transaction, Voucher } from '@/types';
import { InvoiceVoucherSection } from '@/components/loyalty/InvoiceVoucherSection';
import { getVouchersByCustomer } from '@/lib/loyalty-store';
import { useEffect, useState } from 'react';
import { LAUNDRY_STATUSES, PAYMENT_STATUSES } from '@/constants';
import { PackagePlus, PackageCheck, ShieldCheck } from 'lucide-react';

export function InvoicePreview({ trx, trackingUrl }: { trx: Transaction; trackingUrl: string }) {
  const [latestVoucher, setLatestVoucher] = useState<Voucher | null>(null);

  useEffect(() => {
    async function loadVoucher() {
      const vouchers = await getVouchersByCustomer(trx.customer_id);
      const found = vouchers.filter((v: Voucher) => v.transaction_id === trx.id)[0];
      setLatestVoucher(found ?? null);
    }
    loadVoucher();
  }, [trx.customer_id, trx.id]);

  const barcodeValue = trx.invoice_no;
  const qrValue = trackingUrl;

  const statusMeta = LAUNDRY_STATUSES.find((s) => s.value === trx.status);
  const paymentMeta = PAYMENT_STATUSES.find((s) => s.value === trx.payment_status);
  const isPaid = trx.payment_status === 'lunas';

  const durationDays = Math.max(
    1,
    Math.ceil((new Date(trx.est_done_at).getTime() - new Date(trx.created_at).getTime()) / 86400000)
  );

  return (
    <div className="rounded-lg border-2 border-slate-800 bg-[#fdfbf7] p-8 text-slate-900 max-w-2xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-start justify-between border-b-2 border-slate-800 pb-4">
        <div>
          <div className="text-2xl font-black tracking-tight">LaundryPOS</div>
          <div className="text-[10px] font-semibold tracking-[0.2em] uppercase text-amber-700">Laundry &amp; Dry Clean</div>
          <div className="mt-2 text-xs text-slate-500 space-y-0.5">
            <div>{trx.outlet_name}</div>
            {trx.outlet_phone && <div>Telp: {trx.outlet_phone}</div>}
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black tracking-widest text-amber-700">INVOICE</div>
          <div className="font-mono text-sm font-bold mt-1">{trx.invoice_no}</div>
          <div className="text-[11px] text-slate-500">Diterbitkan: {formatDateTime(trx.created_at)}</div>
        </div>
      </div>

      {/* ── Status banner ── */}
      <div className={`mt-4 rounded-lg px-4 py-2.5 text-center text-xs font-bold uppercase tracking-wide ${statusMeta?.color ?? 'bg-slate-100 text-slate-700'}`}>
        Status Laundry: {statusMeta?.label ?? trx.status}
        {' · '}
        Pembayaran: {paymentMeta?.label ?? trx.payment_status}
      </div>

      {/* ── 3-column info ── */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-amber-50/60 border border-amber-200/60 p-3">
          <div className="text-[9px] font-bold uppercase tracking-widest text-amber-700 mb-2">Data Customer</div>
          <div className="text-[11px] text-slate-500">Nama</div>
          <div className="text-sm font-semibold">{trx.customer_name}</div>
          <div className="text-[11px] text-slate-500 mt-1.5">No. HP</div>
          <div className="text-sm font-semibold">{trx.customer_phone || '—'}</div>
        </div>
        <div className="rounded-lg bg-amber-50/60 border border-amber-200/60 p-3">
          <div className="text-[9px] font-bold uppercase tracking-widest text-amber-700 mb-2">Jadwal Layanan</div>
          <div className="text-[11px] text-slate-500">Diterima</div>
          <div className="text-sm font-semibold">{formatDate(trx.created_at)}</div>
          <div className="text-[11px] text-slate-500 mt-1.5">Estimasi Selesai</div>
          <div className="text-sm font-semibold">{formatDate(trx.est_done_at)}</div>
        </div>
        <div className="rounded-lg bg-amber-50/60 border border-amber-200/60 p-3">
          <div className="text-[9px] font-bold uppercase tracking-widest text-amber-700 mb-2">Informasi Transaksi</div>
          <div className="text-[11px] text-slate-500">Cabang</div>
          <div className="text-sm font-semibold">{trx.outlet_name}</div>
          <div className="text-[11px] text-slate-500 mt-1.5">Estimasi Durasi</div>
          <div className="text-sm font-semibold">{durationDays} Hari</div>
        </div>
      </div>

      {/* ── Item table ── */}
      <table className="mt-5 w-full text-sm">
        <thead>
          <tr className="bg-slate-800 text-white text-[10px] uppercase tracking-wide">
            <th className="py-2 px-2 text-left rounded-l-md w-8">#</th>
            <th className="py-2 px-2 text-left">Layanan</th>
            <th className="py-2 px-2 text-right">Qty</th>
            <th className="py-2 px-2 text-right">Harga</th>
            <th className="py-2 px-2 text-right rounded-r-md">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {trx.details.map((d, i) => (
            <tr key={d.id} className="border-b border-dashed border-slate-200">
              <td className="py-2 px-2 text-slate-400">{i + 1}</td>
              <td className="py-2 px-2 font-medium">{d.service_name}</td>
              <td className="py-2 px-2 text-right">{d.qty} {d.unit}</td>
              <td className="py-2 px-2 text-right">{formatRupiah(d.price)}</td>
              <td className="py-2 px-2 text-right font-semibold">{formatRupiah(d.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-2 flex justify-end">
        <div className="w-56 space-y-1">
          <div className="flex justify-between text-sm text-slate-500">
            <span>Subtotal</span>
            <span>{formatRupiah(trx.total)}</span>
          </div>
          <div className="flex justify-between text-base font-black border-t-2 border-slate-800 pt-1.5">
            <span>TOTAL</span>
            <span className="text-amber-700">{formatRupiah(trx.total)}</span>
          </div>
          {!isPaid && (
            <div className="flex justify-between text-xs text-rose-600 font-semibold">
              <span>Sisa Tagihan</span>
              <span>{formatRupiah(Math.max(0, trx.total - trx.paid))}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Riwayat Pelayanan: siapa menerima & menyelesaikan ── */}
      <div className="mt-5 pt-4 border-t border-dashed border-slate-300">
        <div className="text-[9px] font-bold uppercase tracking-widest text-amber-700 mb-2 flex items-center gap-1.5">
          <ShieldCheck className="h-3 w-3" /> Riwayat Pelayanan
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
            <PackagePlus className="h-3.5 w-3.5 text-blue-600 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] text-slate-500">Diterima oleh</div>
              <div className="text-xs font-bold truncate">{trx.created_by_name || 'Staf Outlet'}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
            <PackageCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] text-slate-500">Diselesaikan oleh</div>
              <div className="text-xs font-bold truncate">
                {trx.completed_by_name || (['selesai', 'diambil'].includes(trx.status) ? 'Staf Outlet' : 'Belum selesai')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── QR verifikasi ── */}
      <div className="mt-5 pt-4 border-t border-dashed border-slate-300 text-center">
        <div className="text-[9px] font-bold uppercase tracking-widest text-amber-700 mb-2">Tiket Verifikasi Transaksi</div>
        <div className="flex justify-center"><QRCodeGenerator value={qrValue} size={110} /></div>
        <div className="mt-2 font-mono text-xs font-bold">{barcodeValue}</div>
        <div className="text-[10px] text-slate-400 mt-0.5">Scan kode ini untuk verifikasi atau proses pengambilan pakaian</div>
      </div>

      {latestVoucher && (
        <div className="mt-5">
          <InvoiceVoucherSection voucher={latestVoucher} size="pdf" />
        </div>
      )}

      {/* ── Terms & footer ── */}
      <div className="mt-5 pt-4 border-t border-dashed border-slate-300 text-[10px] text-slate-500 leading-relaxed">
        <div className="font-bold uppercase tracking-widest text-amber-700 mb-1">Syarat &amp; Ketentuan</div>
        Barang yang tidak diambil dalam 30 hari sejak selesai bukan menjadi tanggung jawab outlet.
        Kerusakan/kehilangan yang bukan akibat kelalaian outlet tidak dapat diklaim. Simpan invoice ini
        sebagai bukti pengambilan.
      </div>

      <div className="mt-4 text-center text-xs text-slate-400">
        Terima kasih telah menggunakan LaundryPOS 💙
      </div>
    </div>
  );
}