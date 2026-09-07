'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { formatRupiah, formatDate, cn } from '@/lib/utils';
import {
  Receipt, PackageCheck, Timer, UserPlus, PlusCircle,
  ScanLine, Search, ArrowRight, Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { StatusBadge } from '@/components/transactions/StatusBadge';
import type { Transaction, Customer, User } from '@/types';
import {
  isToday, isThisMonth, isDueToday, topServices, last7DaysCount,
} from '@/lib/dashboard-utils';

export function MitraDashboard({ user, txns, customers }: { user: User; txns: Transaction[]; customers: Customer[] }) {
  const todayTxns = txns.filter(t => isToday(t.created_at));
  const doneToday = txns.filter(t => isToday(t.updated_at) && ['selesai', 'diambil'].includes(t.status)).length;
  const dueToday = txns.filter(isDueToday);
  const newCustomersThisMonth = customers.filter(c => isThisMonth(c.created_at)).length;

  const services = topServices(txns, 3);
  const week = last7DaysCount(txns);
  const maxCount = Math.max(...week.map(d => d.count), 1);

  const recentActivity = [...txns].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className={cn(
        'relative overflow-hidden rounded-2xl p-6',
        'bg-gradient-to-br from-primary/15 via-indigo-500/10 to-sky-500/5',
        'border border-primary/15 animate-fade-in',
      )}>
        <div className="absolute -top-6 -right-6 h-28 w-28 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
        <div className="relative flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-xs font-semibold text-primary uppercase tracking-widest">Halo, Selamat Datang Kembali</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight">{user.name}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Ini ringkasan performa Anda hari ini.</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-primary">{todayTxns.length}</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Transaksi Hari Ini</div>
          </div>
        </div>
      </div>

      {/* Mini stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Transaksi Hari Ini"          value={String(todayTxns.length)}        icon={Receipt}      accent="blue" index={0} />
        <StatsCard title="Selesai Hari Ini"            value={String(doneToday)}                icon={PackageCheck} accent="emerald" index={1} />
        <StatsCard title="Harus Selesai"               value={String(dueToday.length)}          icon={Timer}        accent={dueToday.length > 0 ? 'rose' : 'cyan'} index={2} />
        <StatsCard title="Customer Baru Bulan Ini"     value={String(newCustomersThisMonth)}    icon={UserPlus}     accent="violet" index={3} />
      </div>

      {/* Aksi Cepat */}
      <div>
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-3">Aksi Cepat</h2>
        <div className="space-y-3">
          <Link
            href="/transactions/new"
            className="flex items-center gap-4 rounded-2xl p-5 text-white shadow-lg shadow-primary/25 hover:scale-[1.01] active:scale-[0.99] transition-all"
            style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }}
          >
            <div className="h-11 w-11 rounded-xl bg-white/20 grid place-items-center shrink-0">
              <PlusCircle className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="font-bold">Buat Transaksi</div>
              <div className="text-xs text-white/80">Input transaksi baru</div>
            </div>
            <ArrowRight className="h-5 w-5 opacity-80" />
          </Link>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <QuickAction href="/scan" icon={ScanLine} label="Scan QR / Kembali" color="text-sky-600 bg-sky-500/10" />
            <QuickAction href="/customers" icon={Search} label="Cari Customer" color="text-emerald-600 bg-emerald-500/10" />
          </div>
        </div>
      </div>

      {/* Performa 7 hari + Layanan sering */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-bold">Performa Saya — 7 Hari Terakhir</CardTitle>
            <span className="text-xs text-muted-foreground">Total: {week.reduce((s, d) => s + d.count, 0)} transaksi</span>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-2 h-32">
              {week.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-xs font-bold text-muted-foreground">{d.count}</span>
                  <div className="w-full rounded-t-lg bg-muted overflow-hidden flex items-end" style={{ height: '80px' }}>
                    <div
                      className={cn('w-full rounded-t-lg transition-all', d.isToday ? 'bg-primary' : 'bg-primary/40')}
                      style={{ height: `${Math.max((d.count / maxCount) * 100, d.count > 0 ? 12 : 0)}%` }}
                    />
                  </div>
                  <span className={cn('text-[10px] font-semibold', d.isToday ? 'text-primary' : 'text-muted-foreground')}>{d.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-base font-bold">Layanan Sering Saya Kerjakan</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {services.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Belum ada data.</p>
            ) : services.map((s, i) => (
              <div key={s.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 truncate">
                  <span className="h-5 w-5 grid place-items-center rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0">{i + 1}</span>
                  <span className="truncate">{s.name}</span>
                </span>
                <span className="text-xs font-bold text-primary shrink-0">{s.qty}x</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {dueToday.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Timer className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-bold text-amber-800 dark:text-amber-300">Harus Selesai Hari Ini — {dueToday.length} Item</span>
          </div>
          <div className="space-y-2">
            {dueToday.map((t) => (
              <Link key={t.id} href={`/transactions/${t.id}`} className="flex items-center justify-between rounded-lg bg-white dark:bg-card p-2.5 hover:shadow-sm transition-shadow">
                <div>
                  <div className="text-sm font-semibold">{t.customer_name}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">{t.invoice_no}</div>
                </div>
                <StatusBadge status={t.status} />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Transaksi saya hari ini */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-bold">Transaksi Saya Terbaru</CardTitle>
          <Link href="/transactions" className="text-xs text-primary hover:underline flex items-center gap-1">
            Lihat Semua <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-muted-foreground mb-3">Belum ada transaksi hari ini</p>
              <Link href="/transactions/new" className="text-sm font-semibold text-primary hover:underline">+ Buat Transaksi</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentActivity.map((t) => (
                <Link key={t.id} href={`/transactions/${t.id}`} className="flex items-center justify-between rounded-xl border p-3 hover:bg-muted/40 transition-colors">
                  <div>
                    <div className="text-sm font-semibold">{t.customer_name}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">{t.invoice_no} &middot; {formatDate(t.created_at)}</div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="font-bold text-sm">{formatRupiah(t.total)}</div>
                    <StatusBadge status={t.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function QuickAction({ href, icon: Icon, label, color }: { href: string; icon: any; label: string; color: string }) {
  return (
    <Link href={href} className="flex flex-col items-center gap-2 rounded-2xl border p-5 hover:bg-muted/40 transition-colors text-center">
      <div className={cn('h-10 w-10 rounded-xl grid place-items-center', color)}><Icon className="h-5 w-5" /></div>
      <span className="text-sm font-semibold">{label}</span>
    </Link>
  );
}