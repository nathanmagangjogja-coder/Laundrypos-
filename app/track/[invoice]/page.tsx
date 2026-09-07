'use client';

import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  MapPin,
  MessageCircle,
  Moon,
  Package,
  Search,
  Shirt,
  Sun,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useDarkMode } from '@/hooks/useDarkMode';
import { api } from '@/lib/api';
import { cn, formatDateTime, formatRupiah, waLink } from '@/lib/utils';
import { LAUNDRY_STATUSES } from '@/constants';
import type { Transaction } from '@/types';

export default function PublicTrackingPage() {
  const params = useParams();
  const { isDark, mounted, toggle } = useDarkMode();
  const [trx, setTrx] = useState<Transaction | null | undefined>(undefined);
  const invoiceParam = params?.invoice ? decodeURIComponent(params.invoice as string) : '';

  useEffect(() => {
    if (!invoiceParam) return;
    async function loadTracking() {
      try {
        setTrx(await api.getTransactionByInvoice(invoiceParam));
      } catch {
        setTrx(null);
      }
    }
    loadTracking();
  }, [invoiceParam]);

  if (trx === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary animate-pulse flex flex-col items-center gap-4">
          <Shirt className="h-12 w-12" />
          <p className="font-medium">Mencari invoice...</p>
        </div>
      </div>
    );
  }

  if (trx === null) {
    return (
      <div className="min-h-screen bg-background text-foreground p-6 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6 border border-border">
          <Search className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Invoice tidak ditemukan</h1>
        <p className="text-muted-foreground mb-8 max-w-xs">Pastikan kode invoice yang Anda masukkan sudah benar.</p>
        <Button asChild variant="outline">
          <Link href="/track"><ArrowLeft className="mr-2 h-4 w-4" /> Coba Lagi</Link>
        </Button>
      </div>
    );
  }

  const currentStatusIdx = LAUNDRY_STATUSES.findIndex(s => s.value === trx.status);
  const remainingAmount = Math.max(0, trx.total - trx.paid);
  const isLunas = trx.payment_status === 'lunas';

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 transition-colors duration-300">
      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-1.5 rounded-lg shadow-lg shadow-primary/20">
              <Shirt className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold tracking-tight text-lg">Laundry<span className="text-primary">POS</span></span>
          </div>
          <div className="flex items-center gap-4">
            {mounted && (
              <Button variant="ghost" size="icon" onClick={toggle} title={isDark ? 'Gunakan tema terang' : 'Gunakan tema gelap'}>
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            )}
            <Link href="/track" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Lacak Lainnya
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Hero Section */}
        <section className="text-center mb-10 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Real-time Tracking
          </div>
          <h1 className="text-4xl font-extrabold mb-2 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">
            {trx.invoice_no}
          </h1>
          <p className="text-muted-foreground text-lg">
            Halo, <span className="text-foreground font-medium">{trx.customer_name}</span> 👋
          </p>
        </section>

        {/* Status Card */}
        <div className="bg-card backdrop-blur-xl border rounded-3xl p-6 mb-8 shadow-xl animate-fade-in">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Status Saat Ini</p>
              <div className="flex items-center gap-2">
                <div className="bg-primary text-primary-foreground px-3 py-1 text-sm rounded-full font-medium shadow-lg shadow-primary/20">
                  {LAUNDRY_STATUSES[currentStatusIdx]?.label || trx.status}
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Outlet</p>
              <div className="flex items-center gap-1.5 text-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="font-medium">{trx.outlet_name}</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Estimasi Selesai</p>
              <div className="flex items-center gap-1.5 text-foreground">
                <Clock className="h-4 w-4 text-primary" />
                <span className="font-medium">{formatDateTime(trx.est_done_at)}</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Pembayaran</p>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "px-3 py-1 text-sm rounded-full font-medium",
                  isLunas ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                )}>
                  {isLunas ? 'Lunas' : 'Belum Lunas'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Timeline */}
        <div className="bg-card border rounded-3xl p-8 mb-8 shadow-xl animate-fade-in">
          <h3 className="text-lg font-bold mb-8">Timeline Pesanan</h3>
          <div className="relative space-y-8">
            {/* Connecting Line */}
            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border">
              <div 
                className="absolute top-0 left-0 w-full bg-gradient-to-b from-emerald-500 to-primary transition-all duration-1000 ease-out"
                style={{ height: `${Math.max(0, (currentStatusIdx / (LAUNDRY_STATUSES.length - 1)) * 100)}%` }}
              />
            </div>

            {LAUNDRY_STATUSES.map((status, idx) => {
              const isCompleted = idx < currentStatusIdx;
              const isCurrent = idx === currentStatusIdx;
              const isPending = idx > currentStatusIdx;

              return (
                <div key={status.value} className="relative flex items-center gap-6 group">
                  <div className={cn(
                    "relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all duration-500",
                    isCompleted ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]" : 
                    isCurrent ? "bg-primary animate-pulse-blue" : "bg-muted border"
                  )}>
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    ) : (
                      <div className={cn("h-2 w-2 rounded-full", isCurrent ? "bg-primary-foreground" : "bg-muted-foreground")} />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className={cn(
                      "font-bold transition-colors duration-500",
                      isPending ? "text-muted-foreground" : "text-foreground"
                    )}>
                      {status.label}
                    </span>
                    {isCurrent && (
                      <span className="text-xs text-primary font-medium animate-fade-in">Sedang diproses</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail Card */}
        <div className="bg-card border rounded-3xl overflow-hidden mb-8 shadow-xl animate-fade-in">
          <div className="p-6 border-b bg-muted/50">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold">Rincian Layanan</h3>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {trx.details.map((item) => (
              <div key={item.id} className="flex justify-between items-start py-2 group">
                <div>
                  <div className="font-semibold text-foreground/90 group-hover:text-foreground transition-colors">{item.service_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {item.qty} {item.unit} x {formatRupiah(item.price)}
                  </div>
                </div>
                <div className="font-mono text-foreground/90">{formatRupiah(item.subtotal)}</div>
              </div>
            ))}
            <div className="pt-4 border-t flex justify-between items-center">
              <span className="font-bold text-muted-foreground">Total Tagihan</span>
              <span className="text-2xl font-black text-primary">{formatRupiah(trx.total)}</span>
            </div>
            {remainingAmount > 0 && (
              <div className="flex justify-between items-center text-rose-500 text-sm font-medium">
                <span>Sisa yang harus dibayar</span>
                <span className="font-mono">{formatRupiah(remainingAmount)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center py-10 animate-fade-in">
          <p className="text-muted-foreground mb-6">
            Terima kasih sudah mempercayai <span className="text-foreground font-semibold">LaundryPOS</span> 💙
          </p>
          {trx.outlet_phone && (
            <Button asChild className="bg-[#25D366] hover:bg-[#128C7E] text-white border-none rounded-2xl px-8 h-12 shadow-lg shadow-green-500/20 active:scale-95 transition-transform">
              <a 
                href={waLink(trx.outlet_phone, `Halo ${trx.outlet_name}, saya ingin menanyakan status laundry saya ${trx.invoice_no}`)} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <MessageCircle className="h-5 w-5" />
                Hubungi Outlet
              </a>
            </Button>
          )}
        </footer>
      </main>
    </div>
  );
}
