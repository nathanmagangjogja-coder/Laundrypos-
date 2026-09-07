'use client';
import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import { TransactionDetail } from '@/components/transactions/TransactionDetail';
import { api } from '@/lib/api';
import type { Transaction } from '@/types';
import { toast } from 'sonner';
import { Receipt, Shirt } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
function DetailSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Hero */}
      <div className="rounded-2xl border p-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-muted shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-6 w-48 rounded bg-muted" />
            <div className="h-4 w-32 rounded bg-muted" />
          </div>
          <div className="h-10 w-28 rounded-xl bg-muted" />
        </div>
      </div>
      {/* Content */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {[1,2].map(i => (
            <div key={i} className="rounded-2xl border p-6 space-y-3 animate-pulse">
              <div className="h-5 w-32 rounded bg-muted" />
              <div className="space-y-2">
                {[1,2,3].map(j => (
                  <div key={j} className="flex justify-between">
                    <div className="h-4 w-40 rounded bg-muted" />
                    <div className="h-4 w-24 rounded bg-muted" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-4">
          {[1,2].map(i => (
            <div key={i} className="rounded-2xl border p-6 space-y-3 animate-pulse">
              <div className="h-5 w-28 rounded bg-muted" />
              <div className="h-20 w-full rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function TransactionDetailPage({ params }: { params: { id: string } }) {
  const [trx, setTrx] = useState<Transaction | null | undefined>(undefined);

  useEffect(() => {
    async function load() {
      try {
        setTrx(await api.getTransaction(params.id));
      } catch (error: any) {
        if (error.message?.includes('JSON object requested')) setTrx(null);
        else { toast.error(error.message ?? 'Gagal memuat transaksi'); setTrx(null); }
      }
    }
    load();
  }, [params.id]);

  if (trx === undefined) return <DetailSkeleton />;
  if (trx === null) return notFound();

  return (
    <div className="space-y-0">
      {/* Hero Header */}
      <div className={cn(
        'relative overflow-hidden rounded-2xl p-6 mb-6',
        'bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-transparent',
        'border border-violet-500/15 animate-fade-in',
      )}>
        <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-violet-400/10 blur-2xl pointer-events-none" />
        <div className="relative flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-400/30 shrink-0">
              <Receipt className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">Detail Transaksi</h1>
              <p className="text-sm text-muted-foreground mt-0.5 font-mono">{trx.invoice_no}</p>
            </div>
          </div>
        </div>
      </div>

      <TransactionDetail trx={trx} />
    </div>
  );
}