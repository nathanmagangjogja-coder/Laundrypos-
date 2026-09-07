'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { formatRupiah, cn } from '@/lib/utils';
import {
  Store, ChevronDown, PackageOpen, Droplets, PackageCheck,
  Users, Wallet, Loader2, Building2,
} from 'lucide-react';
import type { OutletStaffPerformance as OutletPerf } from '@/types';

const PERIODS = [
  { value: 'today', label: 'Hari Ini' },
  { value: 'month', label: 'Bulan Ini' },
  { value: 'last_month', label: 'Bulan Lalu' },
  { value: 'all', label: 'Semua' },
] as const;

const MEDALS = ['🥇', '🥈', '🥉'];

export function OutletStaffPerformance() {
  const [period, setPeriod] = useState<typeof PERIODS[number]['value']>('month');
  const [data, setData] = useState<OutletPerf[]>([]);
  const [loading, setLoading] = useState(true);
  const [openOutlets, setOpenOutlets] = useState<Set<string>>(new Set());
  const [openCustomerRows, setOpenCustomerRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.getStaffPerformance(period)
      .then((rows) => { if (!cancelled) setData(rows); })
      .catch(() => { if (!cancelled) setData([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [period]);

  function toggleOutlet(id: string) {
    setOpenOutlets((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function toggleCustomers(key: string) {
    setOpenCustomerRows((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  return (
    <Card className="shadow-sm border border-indigo-500/10" style={{ boxShadow: '0 0 30px -14px rgba(99,102,241,0.15)' }}>
      <CardHeader className="flex flex-row items-center justify-between pb-3 flex-wrap gap-2">
        <CardTitle className="text-base font-bold">Performa Staff per Outlet</CardTitle>
        <div className="flex items-center gap-1 rounded-lg bg-muted/60 p-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={cn(
                'px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors',
                period === p.value ? 'bg-white dark:bg-card shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-14 text-muted-foreground gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> Memuat performa...
          </div>
        ) : data.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Belum ada aktivitas staff pada periode ini.
          </div>
        ) : (
          <div className="space-y-2.5">
            {data.map((outlet, oIdx) => {
              const isOpen = openOutlets.has(outlet.outlet_id);
              return (
                <div key={outlet.outlet_id} className="rounded-xl border overflow-hidden">
                  {/* Outlet header — klik untuk expand */}
                  <button
                    onClick={() => toggleOutlet(outlet.outlet_id)}
                    className="w-full flex items-center gap-3 p-3.5 hover:bg-muted/40 transition-colors text-left"
                  >
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-500/10 text-indigo-600 shrink-0">
                      <Store className="h-4.5 w-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {oIdx < 3 && <span className="text-sm">{MEDALS[oIdx]}</span>}
                        <span className="font-semibold text-sm truncate">{outlet.outlet_name}</span>
                        {outlet.mitra_name && (
                          <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                            <Building2 className="h-2.5 w-2.5" /> {outlet.mitra_name}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {outlet.transaction_count} transaksi · {outlet.staff.length} staff aktif
                      </div>
                    </div>

                    {outlet.commission_summary && (
                      <div className="text-right shrink-0 hidden sm:block">
                        <div className="text-xs font-bold text-amber-600 flex items-center gap-1 justify-end">
                          <Wallet className="h-3 w-3" /> {formatRupiah(outlet.commission_summary.total)}
                        </div>
                        <div className="text-[10px] text-muted-foreground">Komisi mitra</div>
                      </div>
                    )}

                    <ChevronDown className={cn('h-4 w-4 text-muted-foreground shrink-0 transition-transform', isOpen && 'rotate-180')} />
                  </button>

                  {/* Detail staff — expand */}
                  {isOpen && (
                    <div className="border-t bg-muted/20 p-3 space-y-2">
                      {outlet.commission_summary && (
                        <div className="sm:hidden flex items-center justify-between text-xs font-semibold text-amber-600 bg-amber-500/5 border border-amber-500/15 rounded-lg px-3 py-2">
                          <span>Komisi Mitra</span>
                          <span>{formatRupiah(outlet.commission_summary.total)}</span>
                        </div>
                      )}

                      {outlet.staff.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-6">Belum ada staff yang tercatat menangani transaksi di outlet ini.</p>
                      ) : outlet.staff.map((s, sIdx) => {
                        const rowKey = `${outlet.outlet_id}:${s.profile_id}`;
                        const showCustomers = openCustomerRows.has(rowKey);
                        return (
                          <div key={s.profile_id} className="rounded-lg border bg-card p-3 space-y-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                {sIdx < 3 && <span className="text-sm shrink-0">{MEDALS[sIdx]}</span>}
                                <span className="font-semibold text-sm truncate">{s.full_name}</span>
                              </div>
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide shrink-0">
                                {s.total_activity}x aktivitas
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                              <MetricChip icon={PackageOpen} label="Menerima" value={s.received_count} color="text-blue-600 bg-blue-500/10" />
                              <MetricChip icon={Droplets}    label="Memproses" value={s.processed_count} color="text-cyan-600 bg-cyan-500/10" />
                              <MetricChip icon={PackageCheck} label="Selesaikan" value={s.completed_count} color="text-emerald-600 bg-emerald-500/10" />
                            </div>

                            <button
                              onClick={() => toggleCustomers(rowKey)}
                              className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                            >
                              <Users className="h-3.5 w-3.5" />
                              {s.unique_customers} customer ditangani
                              <ChevronDown className={cn('h-3 w-3 transition-transform', showCustomers && 'rotate-180')} />
                            </button>

                            {showCustomers && (
                              <div className="flex flex-wrap gap-1.5 pt-1 border-t">
                                {s.customer_names.length === 0 ? (
                                  <span className="text-[11px] text-muted-foreground">Tidak ada data customer.</span>
                                ) : s.customer_names.map((name) => (
                                  <span key={name} className="text-[11px] bg-muted px-2 py-0.5 rounded-full">{name}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MetricChip({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <div className={cn('rounded-lg p-2 text-center', color)}>
      <Icon className="h-3.5 w-3.5 mx-auto mb-1" />
      <div className="text-sm font-black leading-none">{value}</div>
      <div className="text-[9px] font-semibold uppercase tracking-wide mt-0.5 opacity-80">{label}</div>
    </div>
  );
}
