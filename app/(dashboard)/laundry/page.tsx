'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PaymentBadge } from '@/components/transactions/StatusBadge';
import {
  WashingMachine, Search, ArrowRight, Clock, Droplets,
  Wind, PackageCheck, CheckCircle2, RefreshCw,
} from 'lucide-react';
import { LAUNDRY_STATUSES } from '@/constants';
import { api } from '@/lib/api';
import { formatDate, formatRupiah, cn } from '@/lib/utils';
import type { Transaction, LaundryStatus } from '@/types';
import { toast } from 'sonner';

// Kolom papan produksi laundry — status "diambil" (sudah selesai & diambil customer)
// sengaja tidak ditampilkan di papan antrian karena pekerjaannya sudah tuntas.
const QUEUE_STAGES: { status: LaundryStatus; label: string; icon: any; color: string; ring: string }[] = [
  { status: 'diterima',  label: 'Diterima',  icon: Clock,        color: 'text-blue-600 bg-blue-500/10 border-blue-500/25',    ring: 'rgba(37,99,235,0.15)' },
  { status: 'dicuci',    label: 'Dicuci',    icon: Droplets,     color: 'text-cyan-600 bg-cyan-500/10 border-cyan-500/25',    ring: 'rgba(6,182,212,0.15)' },
  { status: 'disetrika', label: 'Disetrika', icon: Wind,         color: 'text-amber-600 bg-amber-500/10 border-amber-500/25', ring: 'rgba(245,158,11,0.15)' },
  { status: 'selesai',   label: 'Selesai',   icon: PackageCheck, color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/25', ring: 'rgba(16,185,129,0.15)' },
];

// Urutan alur: diterima → dicuci → disetrika → selesai → diambil
const STAGE_ORDER: LaundryStatus[] = ['diterima', 'dicuci', 'disetrika', 'selesai', 'diambil'];
function nextStage(current: LaundryStatus): LaundryStatus | null {
  const idx = STAGE_ORDER.indexOf(current);
  return idx >= 0 && idx < STAGE_ORDER.length - 1 ? STAGE_ORDER[idx + 1] : null;
}

export default function LaundryQueuePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [advancingId, setAdvancingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try { setTransactions(await api.listTransactions()); }
    catch (error: any) { toast.error(error.message ?? 'Gagal memuat antrian laundry'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const safeTxns = useMemo(() => Array.isArray(transactions) ? transactions : [], [transactions]);

  const inQueue = useMemo(() => safeTxns.filter((t) => {
    if (t.status === 'diambil') return false; // sudah tuntas, tidak perlu di papan antrian
    const s = search.trim().toLowerCase();
    if (!s) return true;
    return (t.invoice_no?.toLowerCase().includes(s) ?? false) ||
      (t.customer_name?.toLowerCase().includes(s) ?? false) ||
      (t.customer_phone?.includes(s.replace(/\D/g, '')) ?? false);
  }), [safeTxns, search]);

  const byStage = useMemo(() => {
    const map: Record<string, Transaction[]> = {};
    for (const stage of QUEUE_STAGES) map[stage.status] = [];
    for (const t of inQueue) {
      if (map[t.status]) map[t.status].push(t);
    }
    return map;
  }, [inQueue]);

  async function handleAdvance(t: Transaction) {
    const next = nextStage(t.status);
    if (!next) return;
    setAdvancingId(t.id);
    try {
      await api.updateTransaction(t.id, { status: next });
      const label = LAUNDRY_STATUSES.find((s) => s.value === next)?.label ?? next;
      toast.success(`✅ ${t.invoice_no} → ${label}`);
      await load();
    } catch (error: any) {
      toast.error(error.message ?? 'Gagal memperbarui status');
    } finally {
      setAdvancingId(null);
    }
  }

  const totalActive = inQueue.length;
  const overdue = inQueue.filter((t) => t.est_done_at && new Date(t.est_done_at) < new Date() && t.status !== 'selesai').length;

  return (
    <>
      <PageHeader
        title="Antrian Laundry"
        description="Papan proses cucian — pantau dan majukan status setiap cucian dari diterima sampai selesai."
        icon={<WashingMachine className="h-6 w-6" />}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari invoice / nama / no. HP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span><strong className="text-foreground">{totalActive}</strong> dalam antrian</span>
          {overdue > 0 && (
            <span className="text-rose-600 font-semibold">{overdue} lewat estimasi</span>
          )}
          <Button variant="ghost" size="sm" onClick={load} disabled={loading} className="h-7 px-2">
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {QUEUE_STAGES.map((s) => (
            <div key={s.status} className="h-64 rounded-xl bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : totalActive === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-3xl bg-muted flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <h3 className="text-base font-bold mb-1">Tidak Ada Antrian</h3>
            <p className="text-sm text-muted-foreground">Semua cucian sudah selesai & diambil. Kerja bagus! 🎉</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {QUEUE_STAGES.map((stage) => {
            const items = byStage[stage.status] ?? [];
            const Icon = stage.icon;
            return (
              <div key={stage.status} className="flex flex-col">
                <div
                  className={cn('flex items-center gap-2 rounded-t-xl border px-3 py-2.5', stage.color)}
                  style={{ boxShadow: `0 0 20px -12px ${stage.ring}` }}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-bold flex-1">{stage.label}</span>
                  <span className="text-xs font-bold bg-white/60 dark:bg-black/20 px-1.5 py-0.5 rounded-full">
                    {items.length}
                  </span>
                </div>

                <div className="flex-1 space-y-2 border border-t-0 rounded-b-xl p-2 bg-muted/20 min-h-[120px]">
                  {items.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-8">Kosong</p>
                  ) : items.map((t) => {
                    const isOverdue = t.est_done_at && new Date(t.est_done_at) < new Date();
                    const next = nextStage(t.status);
                    return (
                      <Card key={t.id} className="shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-3 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <Link href={`/transactions/${t.id}`} className="min-w-0 group">
                              <div className="font-mono text-[11px] font-semibold text-muted-foreground group-hover:text-primary transition-colors">
                                {t.invoice_no}
                              </div>
                              <div className="font-semibold text-sm truncate">{t.customer_name}</div>
                            </Link>
                            <PaymentBadge status={t.payment_status} className="shrink-0 text-[10px]" />
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground truncate">{t.outlet_name}</span>
                            <span className="font-bold">{formatRupiah(t.total)}</span>
                          </div>

                          <div className={cn(
                            'text-[11px] flex items-center gap-1',
                            isOverdue ? 'text-rose-600 font-semibold' : 'text-muted-foreground',
                          )}>
                            <Clock className="h-3 w-3" />
                            Estimasi: {t.est_done_at ? formatDate(t.est_done_at) : '—'}
                            {isOverdue && ' (lewat)'}
                          </div>

                          {next && (
                            <Button
                              size="sm"
                              variant="secondary"
                              className="w-full h-7 text-xs gap-1"
                              disabled={advancingId === t.id}
                              onClick={() => handleAdvance(t)}
                            >
                              {advancingId === t.id ? (
                                <RefreshCw className="h-3 w-3 animate-spin" />
                              ) : (
                                <>Lanjut ke {LAUNDRY_STATUSES.find((s) => s.value === next)?.label} <ArrowRight className="h-3 w-3" /></>
                              )}
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
