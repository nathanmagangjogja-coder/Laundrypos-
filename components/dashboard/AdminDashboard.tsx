'use client';
import { lazy, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { formatRupiah, formatDate, cn } from '@/lib/utils';
import {
  Receipt, Wallet, AlertTriangle, Sparkles, Clock,
  WashingMachine, PackageCheck, Store, ArrowRight, Timer,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/transactions/StatusBadge';
import type { Transaction, User } from '@/types';
import {
  isToday, isThisMonth, totalRevenue, totalReceivables,
  isOverdue, isDueToday,
} from '@/lib/dashboard-utils';

const RevenueChart = lazy(() => import('@/components/dashboard/RevenueChart').then(m => ({ default: m.RevenueChart })));

function ChartSkeleton({ height = 'h-56' }: { height?: string }) {
  return <div className={cn('w-full rounded-xl bg-muted/40 animate-pulse', height)} />;
}

export function AdminDashboard({ user, txns }: { user: User; txns: Transaction[] }) {
  const inToday = txns.filter(t => isToday(t.created_at)).length;
  const doneToday = txns.filter(t => isToday(t.updated_at) && ['selesai', 'diambil'].includes(t.status)).length;
  const processing = txns.filter(t => !['selesai', 'diambil'].includes(t.status)).length;
  const revenueThisMonth = totalRevenue(txns.filter(t => isThisMonth(t.created_at)));
  const receivables = totalReceivables(txns);
  const overdue = txns.filter(isOverdue);
  const dueToday = txns.filter(isDueToday);

  const waiting = txns.filter(t => t.status === 'diterima').length;
  const inProcess = txns.filter(t => ['dicuci', 'disetrika'].includes(t.status)).length;
  const readyPickup = txns.filter(t => t.status === 'selesai').length;

  const recent = [...txns].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 8);

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
              <span className="text-xs font-semibold text-violet-300 uppercase tracking-widest flex items-center gap-1.5">
                <Store className="h-3.5 w-3.5" /> Dashboard Admin
              </span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Selamat datang, {user.name.split('  ')[0]} </h1>
            <p className="text-sm text-slate-400 mt-0.5">Ringkasan operasional cabang Anda hari ini.</p>
          </div>
        </div>
      </div>

      {overdue.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-300 bg-rose-50 dark:bg-rose-950/20 dark:border-rose-800 p-4">
          <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
          <p className="text-sm text-rose-700 dark:text-rose-300">
            <strong>{overdue.length} transaksi</strong> sudah melewati estimasi selesai. <Link href="/transactions" className="underline font-semibold">Cek sekarang</Link>
          </p>
        </div>
      )}

      {/* Stat utama */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatsCard title="Transaksi Masuk Hari Ini" value={String(inToday)}    icon={Receipt}      accent="primary" index={0} />
        <StatsCard title="Selesai Hari Ini"          value={String(doneToday)} icon={PackageCheck} accent="success" index={1} />
        <StatsCard title="Sedang Diproses"           value={String(processing)} icon={WashingMachine} accent="amber" index={2} />
        <StatsCard title="Pendapatan Bulan Ini"      value={formatRupiah(revenueThisMonth)} icon={Wallet} accent="success" index={3} />
        <StatsCard title="Total Piutang"             value={formatRupiah(receivables)} icon={AlertTriangle} accent="rose" index={4} />
      </div>

      {/* Grafik + Harus Selesai Hari Ini */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-base font-bold">Grafik Cabang — 14 Hari Terakhir</CardTitle></CardHeader>
          <CardContent>
            <Suspense fallback={<ChartSkeleton />}><RevenueChart transactions={txns} /></Suspense>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-bold">Harus Selesai Hari Ini</CardTitle>
            {dueToday.length > 0 && <span className="text-xs font-bold text-white bg-rose-500 rounded-full h-5 w-5 grid place-items-center">{dueToday.length}</span>}
          </CardHeader>
          <CardContent className="space-y-2 max-h-72 overflow-y-auto">
            {dueToday.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Tidak ada yang jatuh tempo hari ini.</p>
            ) : dueToday.map((t) => (
              <Link key={t.id} href={`/transactions/${t.id}`} className="flex items-center gap-2.5 rounded-lg border p-2.5 hover:bg-muted/50 transition-colors">
                <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 grid place-items-center shrink-0">
                  <Timer className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold truncate">{t.customer_name}</div>
                  <div className="text-[10px] text-muted-foreground font-mono truncate">{t.invoice_no}</div>
                </div>
                <StatusBadge status={t.status} />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Status row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <MiniStat icon={Clock}          label="Menunggu Diproses" value={waiting}     tag="PERLU DIPROSES" tagColor="text-amber-700 bg-amber-500/10" iconColor="text-amber-600 bg-amber-500/10" />
        <MiniStat icon={WashingMachine} label="Dalam Pengerjaan"  value={inProcess}   tag="SEDANG DIPROSES" tagColor="text-blue-700 bg-blue-500/10"   iconColor="text-blue-600 bg-blue-500/10" />
        <MiniStat icon={PackageCheck}   label="Siap Diambil"      value={readyPickup} tag="STOK SIAP"       tagColor="text-emerald-700 bg-emerald-500/10" iconColor="text-emerald-600 bg-emerald-500/10" />
      </div>

      {/* Transaksi terbaru */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-bold">Transaksi Terbaru</CardTitle>
          <Button variant="ghost" size="sm" asChild className="text-xs text-primary gap-1">
            <Link href="/transactions">Lihat Semua <ArrowRight className="h-3.5 w-3.5" /></Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <div className="py-12 text-center">
              <div className="h-16 w-16 rounded-2xl bg-muted mx-auto flex items-center justify-center mb-3">
                <Receipt className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground mb-3">Belum ada transaksi</p>
              <Button asChild size="sm" className="rounded-xl"><Link href="/transactions/new">+ Buat Transaksi</Link></Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground uppercase tracking-wider border-b">
                    <th className="text-left font-medium pb-2">Invoice</th>
                    <th className="text-left font-medium pb-2">Customer</th>
                    <th className="text-left font-medium pb-2">Jatuh Tempo</th>
                    <th className="text-left font-medium pb-2">Total</th>
                    <th className="text-left font-medium pb-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((t) => (
                    <tr key={t.id} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="py-2.5"><Link href={`/transactions/${t.id}`} className="font-mono text-xs text-primary hover:underline">{t.invoice_no}</Link></td>
                      <td className="py-2.5 font-medium">{t.customer_name}</td>
                      <td className="py-2.5 text-muted-foreground text-xs">{t.est_done_at ? formatDate(t.est_done_at) : '—'}</td>
                      <td className="py-2.5 font-semibold">{formatRupiah(t.total)}</td>
                      <td className="py-2.5"><StatusBadge status={t.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, tag, tagColor, iconColor }: { icon: any; label: string; value: number; tag: string; tagColor: string; iconColor: string }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className={cn('h-9 w-9 rounded-xl grid place-items-center', iconColor)}><Icon className="h-4.5 w-4.5" /></div>
          <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide', tagColor)}>{tag}</span>
        </div>
        <div className="text-xl font-black">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}