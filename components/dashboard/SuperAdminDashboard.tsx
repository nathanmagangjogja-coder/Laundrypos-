'use client';
import { lazy, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { formatRupiah, formatDate, cn } from '@/lib/utils';
import {
  Store, Users, Receipt, Wallet, AlertTriangle, Sparkles,
  Clock, WashingMachine, CheckCircle, PackageCheck, ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/transactions/StatusBadge';
import { OutletStaffPerformance } from '@/components/dashboard/OutletStaffPerformance';
import type { Transaction, Customer, Outlet, User } from '@/types';
import {
  isToday, isThisMonth, totalRevenue, totalReceivables,
  topServices, outletPerformance, activeCustomers, STATUS_LABEL,
} from '@/lib/dashboard-utils';

const RevenueChart   = lazy(() => import('@/components/dashboard/RevenueChart').then(m => ({ default: m.RevenueChart })));
const StatusPieChart = lazy(() => import('@/components/dashboard/StatusPieChart').then(m => ({ default: m.StatusPieChart })));

function ChartSkeleton({ height = 'h-56' }: { height?: string }) {
  return <div className={cn('w-full rounded-xl bg-muted/40 animate-pulse', height)} />;
}

export function SuperAdminDashboard({ user, txns, customers, outlets }: {
  user: User; txns: Transaction[]; customers: Customer[]; outlets: Outlet[];
}) {
  const ongoing = txns.filter(t => !['selesai', 'diambil'].includes(t.status));
  const revenueThisMonth = totalRevenue(txns.filter(t => isThisMonth(t.created_at)));
  const receivables = totalReceivables(txns);
  const services = topServices(txns);
  const maxQty = services[0]?.qty || 1;
  const perf = outletPerformance(txns, outlets);
  const activeCust = activeCustomers(txns);

  const doneToday = txns.filter(t => isToday(t.updated_at) && t.status === 'selesai').length;
  const pickedUpToday = txns.filter(t => isToday(t.updated_at) && t.status === 'diambil').length;

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 animate-fade-in"
        style={{ background: 'linear-gradient(135deg, #631cc7 0%, #631cc7 45%, #8b5cf6 100%)' }}
      >
        <div className="absolute -top-6 -right-6 h-32 w-32 rounded-full blur-2xl pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.35), transparent 70%)' }} />
        <div className="absolute -bottom-10 left-1/3 h-28 w-28 rounded-full blur-2xl pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.25), transparent 70%)' }} />
        <div className="relative flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-violet-300 animate-pulse" />
              <span className="text-xs font-semibold text-violet-300 uppercase tracking-widest">Dashboard Super Admin</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Selamat datang, {user.name.split('  ')[0]}  </h1>
            <p className="text-sm text-slate-400 mt-0.5">Ringkasan seluruh cabang &amp; mitra hari ini.</p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-xs font-semibold text-emerald-400">Live</span>
          </div>
        </div>
      </div>

      {/* Stat utama */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatsCard title="Total Cabang"      value={String(outlets.length)}      icon={Store}   accent="success" index={0} />
        <StatsCard title="Total Customer"    value={String(customers.length)}    icon={Users}   accent="violet"  index={1} />
        <StatsCard title="Transaksi Aktif"   value={String(ongoing.length)}      icon={Clock}   accent="cyan"    index={2} badge="AKTIF" />
        <StatsCard title="Total Transaksi"   value={String(txns.length)}         icon={Receipt} accent="primary" index={3} badge="ALL TIME" />
        <StatsCard title="Pendapatan Bulan Ini" value={formatRupiah(revenueThisMonth)} icon={Wallet} accent="amber" index={4} />
        <StatsCard title="Total Piutang"     value={formatRupiah(receivables)}   icon={AlertTriangle} accent="rose" index={5} />
      </div>

      {/* Status hari ini */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <MiniStat icon={WashingMachine} label="Sedang Diproses" value={ongoing.length} color="text-blue-600 bg-blue-500/10" ring="rgba(37,99,235,0.15)" />
        <MiniStat icon={CheckCircle}    label="Selesai Hari Ini" value={doneToday}     color="text-emerald-600 bg-emerald-500/10" ring="rgba(16,185,129,0.15)" />
        <MiniStat icon={PackageCheck}   label="Diambil Hari Ini" value={pickedUpToday} color="text-violet-600 bg-violet-500/10" ring="rgba(139,92,246,0.15)" />
        <MiniStat icon={AlertTriangle}  label="Piutang Aktif"    value={txns.filter(t => t.payment_status !== 'lunas').length} color="text-rose-600 bg-rose-500/10" ring="rgba(244,63,94,0.15)" />
      </div>

      {/* Grafik + Layanan Laris */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-sm border border-primary/10" style={{ boxShadow: '0 0 30px -14px rgba(99,102,241,0.15)' }}>
          <CardHeader className="pb-2"><CardTitle className="text-base font-bold">Grafik Transaksi — 14 Hari Terakhir</CardTitle></CardHeader>
          <CardContent>
            <Suspense fallback={<ChartSkeleton />}><RevenueChart transactions={txns} /></Suspense>
          </CardContent>
        </Card>
        <Card className="shadow-sm border border-amber-500/10" style={{ boxShadow: '0 0 30px -14px rgba(245,158,11,0.15)' }}>
          <CardHeader className="pb-2"><CardTitle className="text-base font-bold">Layanan Paling Laris</CardTitle></CardHeader>
          <CardContent className="space-y-3.5">
            {services.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Belum ada data.</p>
            ) : services.map((s, i) => (
              <div key={s.name}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="flex items-center gap-2 font-medium truncate">
                    <span className="h-5 w-5 grid place-items-center rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0">{i + 1}</span>
                    <span className="truncate">{s.name}</span>
                  </span>
                  <span className="text-xs font-bold text-primary shrink-0">{s.qty}x</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60" style={{ width: `${(s.qty / maxQty) * 100}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Status pie + Customer aktif */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="shadow-sm border border-cyan-500/10" style={{ boxShadow: '0 0 30px -14px rgba(6,182,212,0.15)' }}>
          <CardHeader className="pb-2"><CardTitle className="text-base font-bold">Status Transaksi</CardTitle></CardHeader>
          <CardContent>
            <Suspense fallback={<ChartSkeleton />}><StatusPieChart transactions={txns} /></Suspense>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2 shadow-sm border border-emerald-500/10" style={{ boxShadow: '0 0 30px -14px rgba(16,185,129,0.15)' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-bold">Customer Aktif</CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-xs text-primary gap-1">
              <Link href="/transactions">Lihat Semua <ArrowRight className="h-3.5 w-3.5" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {activeCust.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">Tidak ada customer aktif.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-muted-foreground uppercase tracking-wider border-b">
                      <th className="text-left font-medium pb-2">Customer</th>
                      <th className="text-left font-medium pb-2">Cabang</th>
                      <th className="text-left font-medium pb-2">Estimasi</th>
                      <th className="text-left font-medium pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeCust.map((c) => (
                      <tr key={c.invoice_no} className="border-b last:border-0 hover:bg-muted/40">
                        <td className="py-2.5 font-medium">{c.customer_name}</td>
                        <td className="py-2.5 text-muted-foreground">{c.outlet_name}</td>
                        <td className="py-2.5 text-muted-foreground text-xs">{c.est_done_at ? formatDate(c.est_done_at) : '—'}</td>
                        <td className="py-2.5"><StatusBadge status={c.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performa Cabang */}
      <Card className="shadow-sm border border-violet-500/10" style={{ boxShadow: '0 0 30px -14px rgba(139,92,246,0.15)' }}>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-bold">Performa Cabang</CardTitle>
          <Button variant="ghost" size="sm" asChild className="text-xs text-primary gap-1">
            <Link href="/outlets">Lihat Semua <ArrowRight className="h-3.5 w-3.5" /></Link>
          </Button>
        </CardHeader>
        <CardContent>
          {perf.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Belum ada data performa cabang.</div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {perf.map((o) => (
                <div key={o.id} className="flex items-center gap-3 rounded-xl border p-3.5 hover:bg-muted/40 transition-colors">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                    <Store className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{o.name}</div>
                    <div className="text-xs text-muted-foreground">{o.trxCount} transaksi</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-sm text-primary">{formatRupiah(o.revenue)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performa Staff per Outlet — drill-down Menerima/Memproses/Menyelesaikan */}
      <OutletStaffPerformance />
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, color, ring }: { icon: any; label: string; value: number; color: string; ring?: string }) {
  return (
    <Card className="shadow-sm border" style={ring ? { boxShadow: `0 0 20px -10px ${ring}`, borderColor: ring.replace('0.15', '0.3') } : undefined}>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn('h-10 w-10 rounded-xl grid place-items-center shrink-0', color)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-lg font-black leading-tight">{value}</div>
          <div className="text-xs text-muted-foreground truncate">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}