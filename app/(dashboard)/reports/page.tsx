'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExportButton } from '@/components/shared/ExportButton';
import { TransactionTable } from '@/components/transactions/TransactionTable';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { formatRupiah, cn } from '@/lib/utils';
import { exportElementToPdf } from '@/lib/pdf';
import {
  FileDown, FileBarChart, Wallet, CheckCircle, AlertCircle, Receipt,
  TrendingUp, PackagePlus, PackageCheck, Boxes, WashingMachine,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Transaction, Outlet } from '@/types';
import { api } from '@/lib/api';
import { STATUS_LABEL } from '@/lib/dashboard-utils';

function ReportStatCard({ title, value, icon: Icon, accent }: {
  title: string; value: string; icon: any;
  accent: 'blue' | 'primary' | 'emerald' | 'rose' | 'amber' | 'cyan';
}) {
  const cfg = {
    blue:    { icon: 'bg-blue-500/10 text-blue-600',    border: 'border-blue-500/15',    bg: 'from-blue-500/5'    },
    primary: { icon: 'bg-primary/10 text-primary',       border: 'border-primary/15',     bg: 'from-primary/5'     },
    emerald: { icon: 'bg-emerald-500/10 text-emerald-600', border: 'border-emerald-500/15', bg: 'from-emerald-500/5' },
    rose:    { icon: 'bg-rose-500/10 text-rose-600',     border: 'border-rose-500/15',    bg: 'from-rose-500/5'    },
    amber:   { icon: 'bg-amber-500/10 text-amber-600',   border: 'border-amber-500/15',   bg: 'from-amber-500/5'   },
    cyan:    { icon: 'bg-cyan-500/10 text-cyan-600',     border: 'border-cyan-500/15',    bg: 'from-cyan-500/5'    },
  }[accent];

  return (
    <Card className={cn('border shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-300', cfg.border)}>
      <CardContent className={cn('p-5 bg-gradient-to-br to-transparent', cfg.bg)}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{title}</p>
            <p className="text-2xl font-black">{value}</p>
          </div>
          <div className={cn('h-12 w-12 rounded-2xl flex items-center justify-center shrink-0', cfg.icon)}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ExportBar({ rows, filename, pdfRef, pdfFilename }: {
  rows: any[]; filename: string; pdfRef: React.RefObject<HTMLDivElement>; pdfFilename: string;
}) {
  async function exportPdf() {
    if (!pdfRef.current) return;
    toast.info('Membuat PDF...');
    await exportElementToPdf(pdfRef.current, pdfFilename);
    toast.success('PDF berhasil diunduh');
  }
  return (
    <div className="flex items-center gap-2">
      <ExportButton rows={rows} filename={filename} />
      <Button variant="outline" onClick={exportPdf} className="rounded-xl">
        <FileDown className="mr-2 h-4 w-4" /> Export PDF
      </Button>
    </div>
  );
}

export default function ReportsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState(true);

  const pendapatanRef = useRef<HTMLDivElement>(null);
  const transaksiRef = useRef<HTMLDivElement>(null);
  const penerimaanRef = useRef<HTMLDivElement>(null);
  const stokRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([api.listTransactions(), api.listOutlets()])
      .then(([t, o]) => { setTransactions(t); setOutlets(o); })
      .catch((error: any) => toast.error(error.message ?? 'Gagal memuat laporan'))
      .finally(() => setLoading(false));
  }, []);

  const safeTxns = Array.isArray(transactions) ? transactions : [];
  const omzet   = safeTxns.reduce((s, t) => s + (t.total || 0), 0);
  const lunas   = safeTxns.filter(t => t?.payment_status === 'lunas').length;
  const pending = safeTxns.filter(t => t?.payment_status !== 'lunas').reduce((s, t) => s + ((t.total || 0) - (t.paid || 0)), 0);

  // ── Tab: Penerimaan & Pengembalian — breakdown per staf (3 aktor) ──────
  const handlerRows = useMemo(() => {
    const map = new Map<string, { name: string; received: number; processed: number; completed: number }>();
    for (const t of safeTxns) {
      if (t.created_by_name) {
        const row = map.get(t.created_by_name) ?? { name: t.created_by_name, received: 0, processed: 0, completed: 0 };
        row.received += 1;
        map.set(t.created_by_name, row);
      }
      if (t.processed_by_name) {
        const row = map.get(t.processed_by_name) ?? { name: t.processed_by_name, received: 0, processed: 0, completed: 0 };
        row.processed += 1;
        map.set(t.processed_by_name, row);
      }
      if (t.completed_by_name) {
        const row = map.get(t.completed_by_name) ?? { name: t.completed_by_name, received: 0, processed: 0, completed: 0 };
        row.completed += 1;
        map.set(t.completed_by_name, row);
      }
    }
    return Array.from(map.values()).sort((a, b) => (b.received + b.processed + b.completed) - (a.received + a.processed + a.completed));
  }, [safeTxns]);

  // ── Tab: Stok — snapshot jumlah cucian per status saat ini ─────────────
  const stockByStatus = useMemo(() => {
    const statuses: Transaction['status'][] = ['diterima', 'dicuci', 'disetrika', 'selesai', 'diambil'];
    return statuses.map((s) => ({
      status: s,
      label: STATUS_LABEL[s] ?? s,
      count: safeTxns.filter((t) => t.status === s).length,
    }));
  }, [safeTxns]);

  const stockByOutlet = useMemo(() => {
    return outlets.map((o) => {
      const oTxns = safeTxns.filter((t) => t.outlet_id === o.id && !['selesai', 'diambil'].includes(t.status));
      return { outlet: o.name, inProgress: oTxns.length };
    }).filter((r) => r.inProgress > 0);
  }, [safeTxns, outlets]);

  return (
    <>
      <div className={cn(
        'relative overflow-hidden rounded-2xl p-6 mb-6',
        'bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-transparent',
        'border border-amber-500/15 animate-fade-in',
      )}>
        <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-amber-400/10 blur-2xl pointer-events-none" />
        <div className="relative flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-400/30 shrink-0">
            <FileBarChart className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Laporan</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Pendapatan, transaksi, penerimaan/pengembalian, dan stok laundry.</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="pendapatan">
        <TabsList className="mb-4">
          <TabsTrigger value="pendapatan"><TrendingUp className="h-3.5 w-3.5 mr-1.5" /> Pendapatan</TabsTrigger>
          <TabsTrigger value="transaksi"><Receipt className="h-3.5 w-3.5 mr-1.5" /> Transaksi</TabsTrigger>
          <TabsTrigger value="penerimaan"><PackagePlus className="h-3.5 w-3.5 mr-1.5" /> Penerimaan &amp; Pengembalian</TabsTrigger>
          <TabsTrigger value="stok"><Boxes className="h-3.5 w-3.5 mr-1.5" /> Stok</TabsTrigger>
        </TabsList>

        {/* ── Pendapatan ── */}
        <TabsContent value="pendapatan" className="space-y-4">
          <div className="flex justify-end">
            <ExportBar
              rows={safeTxns.map(t => ({ invoice: t.invoice_no, tanggal: t.created_at, customer: t.customer_name, outlet: t.outlet_name, total: t.total, status_bayar: t.payment_status }))}
              filename="laporan-pendapatan.xlsx"
              pdfRef={pendapatanRef}
              pdfFilename="laporan-pendapatan.pdf"
            />
          </div>
          <div ref={pendapatanRef} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in-up">
              <ReportStatCard title="Total Omzet"  value={formatRupiah(omzet)}   icon={Wallet}      accent="primary" />
              <ReportStatCard title="Lunas"        value={String(lunas)}         icon={CheckCircle} accent="emerald" />
              <ReportStatCard title="Piutang"      value={formatRupiah(pending)} icon={AlertCircle} accent="rose"    />
              <ReportStatCard title="Total Transaksi" value={String(safeTxns.length)} icon={Receipt} accent="blue"  />
            </div>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-base font-bold">Trend Omzet</CardTitle></CardHeader>
              <CardContent><RevenueChart transactions={safeTxns} /></CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Transaksi ── */}
        <TabsContent value="transaksi" className="space-y-4">
          <div className="flex justify-end">
            <ExportBar
              rows={safeTxns.map(({ details, ...r }: any) => r)}
              filename="laporan-transaksi.xlsx"
              pdfRef={transaksiRef}
              pdfFilename="laporan-transaksi.pdf"
            />
          </div>
          <div ref={transaksiRef}>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-base font-bold">Detail Transaksi</CardTitle></CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />)}
                  </div>
                ) : (
                  <TransactionTable data={safeTxns} />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Penerimaan & Pengembalian ── */}
        <TabsContent value="penerimaan" className="space-y-4">
          <div className="flex justify-end">
            <ExportBar
              rows={handlerRows.map(r => ({ nama_staf: r.name, transaksi_diterima: r.received, transaksi_diproses: r.processed, transaksi_diselesaikan: r.completed }))}
              filename="laporan-penerimaan-pengembalian.xlsx"
              pdfRef={penerimaanRef}
              pdfFilename="laporan-penerimaan-pengembalian.pdf"
            />
          </div>
          <div ref={penerimaanRef}>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold">Per Staf — Penerimaan, Proses &amp; Penyelesaian</CardTitle>
              </CardHeader>
              <CardContent>
                {handlerRows.length === 0 ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">Belum ada data.</div>
                ) : (
                  <div className="space-y-2">
                    {handlerRows.map((r) => (
                      <div key={r.name} className="flex items-center gap-4 rounded-xl border p-3.5">
                        <div className="flex-1 min-w-0 font-semibold text-sm truncate">{r.name}</div>
                        <div className="flex items-center gap-1.5 text-sm">
                          <PackagePlus className="h-3.5 w-3.5 text-blue-600" />
                          <span className="font-bold">{r.received}</span>
                          <span className="text-xs text-muted-foreground">diterima</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm">
                          <WashingMachine className="h-3.5 w-3.5 text-cyan-600" />
                          <span className="font-bold">{r.processed}</span>
                          <span className="text-xs text-muted-foreground">diproses</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm">
                          <PackageCheck className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="font-bold">{r.completed}</span>
                          <span className="text-xs text-muted-foreground">diselesaikan</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Stok ── */}
        <TabsContent value="stok" className="space-y-4">
          <div className="flex justify-end">
            <ExportBar
              rows={stockByStatus.map(s => ({ status: s.label, jumlah: s.count }))}
              filename="laporan-stok.xlsx"
              pdfRef={stokRef}
              pdfFilename="laporan-stok.pdf"
            />
          </div>
          <div ref={stokRef} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {stockByStatus.map((s) => (
                <ReportStatCard
                  key={s.status}
                  title={s.label}
                  value={String(s.count)}
                  icon={WashingMachine}
                  accent={s.status === 'selesai' || s.status === 'diambil' ? 'emerald' : s.status === 'diterima' ? 'amber' : 'cyan'}
                />
              ))}
            </div>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-base font-bold">Cucian Dalam Proses per Outlet</CardTitle></CardHeader>
              <CardContent>
                {stockByOutlet.length === 0 ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">Tidak ada cucian dalam proses saat ini.</div>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {stockByOutlet.map((r) => (
                      <div key={r.outlet} className="flex items-center justify-between rounded-xl border p-3">
                        <span className="text-sm font-semibold">{r.outlet}</span>
                        <span className="text-sm font-bold text-primary">{r.inProgress} item</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}