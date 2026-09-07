'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatRupiah, formatDateTime } from '@/lib/utils';
import { StatusBadge, PaymentBadge } from '@/components/transactions/StatusBadge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft, Shirt, User, Phone, Calendar, Package,
  MapPin, Hash, Clock, Send, CheckCircle2, AlertCircle,
} from 'lucide-react';
import { WA_TEMPLATES, LAUNDRY_STATUSES } from '@/constants';
import { waLink } from '@/lib/utils';
import type { Transaction } from '@/types';

// ─── Progress Step ────────────────────────────────────────────────────────────
const STATUS_STEPS = ['diterima', 'dicuci', 'disetrika', 'selesai', 'diambil'] as const;

function StatusProgress({ current }: { current: string }) {
  const currentIdx = STATUS_STEPS.indexOf(current as any);
  return (
    <div className="flex items-center gap-0 w-full">
      {STATUS_STEPS.map((step, i) => {
        const done = i <= currentIdx;
        const label = LAUNDRY_STATUSES.find(s => s.value === step)?.label ?? step;
        return (
          <div key={step} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex w-full items-center">
              {/* left line */}
              <div className={`flex-1 h-0.5 ${i === 0 ? 'invisible' : done ? 'bg-primary' : 'bg-muted'}`} />
              {/* dot */}
              <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                done
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'bg-muted border-muted-foreground/20 text-muted-foreground'
              }`}>
                {done
                  ? <CheckCircle2 className="h-4 w-4" />
                  : <span className="text-[10px] font-bold">{i + 1}</span>
                }
              </div>
              {/* right line */}
              <div className={`flex-1 h-0.5 ${i === STATUS_STEPS.length - 1 ? 'invisible' : i < currentIdx ? 'bg-primary' : 'bg-muted'}`} />
            </div>
            <span className={`text-[9px] font-semibold uppercase tracking-wide text-center leading-tight ${
              done ? 'text-primary' : 'text-muted-foreground'
            }`}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Row helper ───────────────────────────────────────────────────────────────
function Row({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground font-medium shrink-0">{label}</span>
      <span className={`text-sm text-right font-semibold ${accent ? 'text-primary' : 'text-foreground'}`}>
        {value}
      </span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ScanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tx, setTx] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.getTransaction(id)
      .then(data => {
        setTx(data);
        setError(null);
      })
      .catch(err => {
        setError(err?.message ?? 'Gagal memuat data transaksi');
      })
      .finally(() => setLoading(false));
  }, [id]);

  function sendWa() {
    if (!tx) return;
    const msg = WA_TEMPLATES.ready(tx.customer_name, tx.invoice_no);
    const url = waLink(tx.customer_phone, msg);
    const a = document.createElement('a');
    a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="max-w-xl mx-auto space-y-4 p-4">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-36 w-full rounded-xl" />
      </div>
    );
  }

  // ── Error state ──
  if (error || !tx) {
    return (
      <div className="max-w-xl mx-auto p-4 space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Button>
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-destructive/30 bg-destructive/5 p-12 text-center gap-3">
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <p className="font-bold text-destructive">Transaksi Tidak Dapat Dimuat</p>
          <p className="text-sm text-muted-foreground max-w-[240px]">
            {error ?? 'Data tidak ditemukan atau Anda tidak memiliki akses ke transaksi ini.'}
          </p>
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            Kembali ke Scan
          </Button>
        </div>
      </div>
    );
  }

  const isOverdue = tx.status !== 'diambil' && tx.est_done_at && new Date(tx.est_done_at) < new Date();

  return (
    <div className="max-w-xl mx-auto p-4 pb-10 space-y-5 animate-fade-in">

      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="gap-2 text-muted-foreground hover:text-foreground -ml-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Scan
      </Button>

      {/* ── Invoice Header Card ── */}
      <div className="rounded-2xl overflow-hidden border border-border shadow-lg">
        {/* Top banner */}
        <div className="bg-primary px-5 py-4 text-primary-foreground">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 opacity-80">
              <Shirt className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-widest">LaundryPOS</span>
            </div>
            <StatusBadge status={tx.status} className="bg-white/20 text-white border-none text-xs" />
          </div>
          <div className="flex items-end justify-between gap-2 mt-2">
            <div>
              <p className="text-[10px] opacity-60 uppercase tracking-widest font-semibold">Nomor Nota</p>
              <p className="font-mono text-lg font-black tracking-tight">{tx.invoice_no}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] opacity-60 uppercase tracking-widest font-semibold">Total</p>
              <p className="text-2xl font-black">{formatRupiah(tx.total)}</p>
            </div>
          </div>
        </div>

        {/* Payment status strip */}
        <div className={`px-5 py-2 flex items-center justify-between text-xs font-bold
          ${tx.payment_status === 'lunas'
            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
            : tx.payment_status === 'dp'
            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
            : 'bg-rose-500/10 text-rose-700 dark:text-rose-400'
          }`}
        >
          <span>Status Pembayaran</span>
          <PaymentBadge status={tx.payment_status} />
        </div>
      </div>

      {/* ── Progress Bar ── */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
          Progress Pengerjaan
        </p>
        <StatusProgress current={tx.status} />
        {isOverdue && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            Melewati estimasi selesai — mohon segera diproses
          </div>
        )}
      </div>

      {/* ── Customer & Order Info ── */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="px-5 pt-4 pb-1">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
            Informasi Pelanggan
          </p>
        </div>
        <div className="px-5 pb-4">
          <Row
            label={<span className="flex items-center gap-1"><User className="h-3 w-3" /> Nama</span> as any}
            value={tx.customer_name}
          />
          <Row
            label={<span className="flex items-center gap-1"><Phone className="h-3 w-3" /> Telepon</span> as any}
            value={tx.customer_phone}
          />
          <Row
            label={<span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Outlet</span> as any}
            value={tx.outlet_name}
          />
          <Row
            label={<span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Masuk</span> as any}
            value={formatDateTime(tx.created_at)}
          />
          <Row
            label={<span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Estimasi</span> as any}
            value={
              <span className={isOverdue ? 'text-rose-500 font-black' : ''}>
                {formatDateTime(tx.est_done_at)}
              </span>
            }
          />
          {tx.notes && (
            <Row
              label="Catatan"
              value={<span className="italic text-muted-foreground">{tx.notes}</span>}
            />
          )}
        </div>
      </div>

      {/* ── Order Items ── */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="px-5 pt-4 pb-2 border-b border-border/50">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5" /> Detail Pesanan
          </p>
        </div>
        <div className="px-5 py-3 space-y-2.5">
          {tx.details?.map((d, i) => (
            <div key={i} className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{d.service_name}</p>
                <p className="text-xs text-muted-foreground">{d.qty} {d.unit} × {formatRupiah(d.price)}</p>
              </div>
              <span className="text-sm font-bold text-foreground shrink-0">{formatRupiah(d.subtotal)}</span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="border-t border-border mx-5" />
        <div className="px-5 py-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Subtotal</span>
            <span className="text-sm font-semibold">{formatRupiah(tx.total)}</span>
          </div>
          {tx.paid > 0 && tx.payment_status !== 'lunas' && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Sudah Dibayar (DP)</span>
              <span className="text-sm font-semibold text-amber-600">{formatRupiah(tx.paid)}</span>
            </div>
          )}
          {tx.payment_status !== 'lunas' && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground font-semibold">Sisa Tagihan</span>
              <span className="text-sm font-black text-rose-500">{formatRupiah(tx.total - tx.paid)}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-2 border-t border-border/50">
            <span className="text-base font-bold">Total Tagihan</span>
            <span className="text-2xl font-black text-primary">{formatRupiah(tx.total)}</span>
          </div>
        </div>
      </div>

      {/* ── Action: WhatsApp only ── */}
      {tx.customer_phone && (
        <Button
          className="w-full h-12 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-500/20"
          onClick={sendWa}
        >
          <Send className="h-4 w-4" />
          Kirim Notifikasi WhatsApp
        </Button>
      )}

      <p className="text-center text-[10px] text-muted-foreground/50 pb-4">
        v1.1.0 · LaundryPOS · Hanya untuk keperluan internal mitra
      </p>
    </div>
  );
}