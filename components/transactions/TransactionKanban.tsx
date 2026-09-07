'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/shared/Modal';
import { Stepper } from '@/components/shared/Stepper';
import { StatusBadge, PaymentBadge } from './StatusBadge';
import { LAUNDRY_STATUSES } from '@/constants';
import { api } from '@/lib/api';
import { formatDate, formatRupiah, cn } from '@/lib/utils';
import { isOverdue, isDueToday } from '@/lib/dashboard-utils';
import {
  Clock, PackageOpen, Droplets, Wind, PackageCheck, CheckCircle2,
  ArrowRight, RefreshCw, ExternalLink, Receipt,
} from 'lucide-react';
import type { Transaction, LaundryStatus } from '@/types';
import { toast } from 'sonner';

const COLUMNS: { status: LaundryStatus; label: string; icon: any; color: string; ring: string }[] = [
  { status: 'diterima',  label: 'Diterima',  icon: PackageOpen,  color: 'text-blue-600 bg-blue-500/10 border-blue-500/25',    ring: 'rgba(37,99,235,0.15)' },
  { status: 'dicuci',    label: 'Dicuci',    icon: Droplets,     color: 'text-cyan-600 bg-cyan-500/10 border-cyan-500/25',    ring: 'rgba(6,182,212,0.15)' },
  { status: 'disetrika', label: 'Disetrika', icon: Wind,         color: 'text-amber-600 bg-amber-500/10 border-amber-500/25', ring: 'rgba(245,158,11,0.15)' },
  { status: 'selesai',   label: 'Selesai',   icon: PackageCheck, color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/25', ring: 'rgba(16,185,129,0.15)' },
  { status: 'diambil',   label: 'Diambil',   icon: CheckCircle2, color: 'text-violet-600 bg-violet-500/10 border-violet-500/25', ring: 'rgba(139,92,246,0.15)' },
];

const STAGE_ORDER: LaundryStatus[] = COLUMNS.map((c) => c.status);
function nextStage(current: LaundryStatus): LaundryStatus | null {
  const idx = STAGE_ORDER.indexOf(current);
  return idx >= 0 && idx < STAGE_ORDER.length - 1 ? STAGE_ORDER[idx + 1] : null;
}

export function TransactionKanban({ data = [], onRefresh, canAdvance = true }: {
  data?: Transaction[]; onRefresh?: () => void; canAdvance?: boolean;
}) {
  const [advancingId, setAdvancingId] = useState<string | null>(null);
  const [detailTx, setDetailTx] = useState<Transaction | null>(null);
  const [confirmTx, setConfirmTx] = useState<{ tx: Transaction; next: LaundryStatus } | null>(null);

  const byStage = useMemo(() => {
    const map: Record<string, Transaction[]> = {};
    for (const c of COLUMNS) map[c.status] = [];
    for (const t of data) {
      if (map[t.status]) map[t.status].push(t);
    }
    return map;
  }, [data]);

  async function commitAdvance(t: Transaction, next: LaundryStatus) {
    setAdvancingId(t.id);
    try {
      await api.updateTransaction(t.id, { status: next });
      const label = LAUNDRY_STATUSES.find((s) => s.value === next)?.label ?? next;
      toast.success(`✅ ${t.invoice_no} → ${label}`);
      onRefresh?.();
    } catch (error: any) {
      toast.error(error.message ?? 'Gagal memperbarui status');
    } finally {
      setAdvancingId(null);
      setConfirmTx(null);
    }
  }

  function handleAdvanceClick(t: Transaction) {
    const next = nextStage(t.status);
    if (!next) return;
    // Aksi ireversibel (menandai selesai/diambil) → minta konfirmasi dulu,
    // supaya staf sadar namanya akan tercatat di histori (completed_by).
    if (['selesai', 'diambil'].includes(next)) {
      setConfirmTx({ tx: t, next });
    } else {
      commitAdvance(t, next);
    }
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {COLUMNS.map((col) => {
          const items = byStage[col.status] ?? [];
          const Icon = col.icon;
          return (
            <div key={col.status} className="flex flex-col min-w-0">
              <div
                className={cn('flex items-center gap-2 rounded-t-xl border px-3 py-2.5', col.color)}
                style={{ boxShadow: `0 0 20px -12px ${col.ring}` }}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="text-sm font-bold flex-1 truncate">{col.label}</span>
                <span className="text-xs font-bold bg-white/60 dark:bg-black/20 px-1.5 py-0.5 rounded-full shrink-0">
                  {items.length}
                </span>
              </div>

              <div className="flex-1 space-y-2 border border-t-0 rounded-b-xl p-2 bg-muted/20 min-h-[100px] max-h-[560px] overflow-y-auto">
                {items.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">Kosong</p>
                ) : items.map((t) => {
                  const overdue = isOverdue(t);
                  const dueToday = isDueToday(t);
                  const next = nextStage(t.status);
                  return (
                    <Card
                      key={t.id}
                      className="shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setDetailTx(t)}
                    >
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-mono text-[10px] font-semibold text-muted-foreground">
                              {t.invoice_no}
                            </div>
                            <div className="font-semibold text-sm truncate">{t.customer_name}</div>
                          </div>
                          <PaymentBadge status={t.payment_status} className="shrink-0 text-[9px] px-1.5 py-0" />
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground truncate">{t.outlet_name}</span>
                          <span className="font-bold shrink-0">{formatRupiah(t.total)}</span>
                        </div>

                        {(overdue || dueToday) && (
                          <div className={cn(
                            'text-[10px] font-semibold flex items-center gap-1 rounded-md px-1.5 py-0.5 w-fit',
                            overdue ? 'text-rose-600 bg-rose-500/10' : 'text-amber-600 bg-amber-500/10',
                          )}>
                            <Clock className="h-3 w-3" />
                            {overdue ? 'Lewat estimasi' : 'Estimasi hari ini'}
                          </div>
                        )}

                        {canAdvance && next && (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="w-full h-7 text-xs gap-1"
                            disabled={advancingId === t.id}
                            onClick={(e) => { e.stopPropagation(); handleAdvanceClick(t); }}
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

      {/* ── Modal detail ringkas — klik kartu ── */}
      <Modal
        open={!!detailTx}
        onOpenChange={(v) => !v && setDetailTx(null)}
        title={detailTx?.invoice_no ?? ''}
        description={detailTx?.customer_name}
        size="md"
        icon={<Receipt />}
        footer={
          detailTx && (
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href={`/transactions/${detailTx.id}`}>
                Buka Halaman Penuh <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
              </Link>
            </Button>
          )
        }
      >
        {detailTx && (
          <div className="space-y-4">
            <Stepper
              steps={STAGE_ORDER.map((s) => ({ id: s, title: LAUNDRY_STATUSES.find((x) => x.value === s)?.label ?? s }))}
              current={STAGE_ORDER.indexOf(detailTx.status)}
              allowJumpBack={false}
            />

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">Outlet</div>
                <div className="font-medium">{detailTx.outlet_name}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">No. HP</div>
                <div className="font-medium">{detailTx.customer_phone}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">Estimasi Selesai</div>
                <div className="font-medium">{detailTx.est_done_at ? formatDate(detailTx.est_done_at) : '—'}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">Total</div>
                <div className="font-bold text-primary">{formatRupiah(detailTx.total)}</div>
              </div>
            </div>

            <div className="rounded-lg border divide-y">
              {detailTx.details.map((d) => (
                <div key={d.id} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span>{d.service_name} <span className="text-muted-foreground">× {d.qty} {d.unit}</span></span>
                  <span className="font-medium">{formatRupiah(d.subtotal)}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <StatusBadge status={detailTx.status} />
              <PaymentBadge status={detailTx.payment_status} />
            </div>
          </div>
        )}
      </Modal>

      {/* ── Konfirmasi sebelum aksi ireversibel (Selesai/Diambil) ── */}
      <Modal
        open={!!confirmTx}
        onOpenChange={(v) => !v && setConfirmTx(null)}
        title={`Tandai ${confirmTx ? LAUNDRY_STATUSES.find((s) => s.value === confirmTx.next)?.label : ''}?`}
        description="Aksi ini akan tercatat atas nama Anda di histori transaksi dan tidak bisa dibatalkan dari sini."
        variant="warning"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmTx(null)} disabled={!!advancingId}>Batal</Button>
            <Button
              onClick={() => confirmTx && commitAdvance(confirmTx.tx, confirmTx.next)}
              disabled={!!advancingId}
              className="bg-amber-500 hover:bg-amber-600 text-amber-950"
            >
              {advancingId ? <RefreshCw className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Ya, Tandai
            </Button>
          </>
        }
      />
    </>
  );
}
