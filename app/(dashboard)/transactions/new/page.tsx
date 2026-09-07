'use client';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import dynamic from 'next/dynamic';
import { Shirt, Loader2 } from 'lucide-react';

const TransactionForm = dynamic(
  () => import('@/components/transactions/TransactionForm').then(m => m.TransactionForm),
  {
    ssr: false,
    loading: () => (
      <div className="grid gap-4 animate-pulse">
        <div className="h-20 rounded-2xl bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border" />
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-40 rounded-2xl bg-muted/40 border" />
            <div className="h-60 rounded-2xl bg-muted/40 border" />
          </div>
          <div className="h-72 rounded-2xl bg-muted/40 border shadow-lg shadow-primary/5" />
        </div>
      </div>
    ),
  }
);

function FormFallback() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 rounded-2xl border border-dashed bg-muted/20">
      <div className="relative grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 ring-4 ring-primary/20">
        <Shirt className="relative h-6 w-6 text-primary animate-pulse" />
      </div>
      <div className="space-y-1 text-center">
        <h4 className="font-semibold tracking-tight">Memuat Form Transaksi</h4>
        <p className="text-sm text-muted-foreground">Menyiapkan wizard, layanan, dan customer list...</p>
      </div>
      <div className="flex items-center gap-2 text-xs text-primary font-medium">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span>Sedang memuat...</span>
      </div>
    </div>
  );
}

export default function NewTransactionPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user?.role === 'mitra') {
      router.replace('/transactions');
    }
  }, [user, loading, router]);

  if (loading || user?.role === 'mitra') return null;

  return (
    <>
      <PageHeader title="Transaksi Baru" description="Input order laundry & cetak nota otomatis." />
      <Suspense fallback={<FormFallback />}>
        <TransactionForm />
      </Suspense>
    </>
  );
}