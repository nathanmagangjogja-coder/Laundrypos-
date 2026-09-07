'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TransactionTable } from '@/components/transactions/TransactionTable';
import { ExportButton } from '@/components/shared/ExportButton';
import { Receipt, Search, Plus, WashingMachine } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { LAUNDRY_STATUSES } from '@/constants';
import type { Transaction } from '@/types';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export default function TransactionsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const canCreate = user?.role === 'super_admin' || user?.role === 'admin';

  async function refresh() {
    try {
      setTransactions(await api.listTransactions());
    } catch (error: any) {
      toast.error(error.message ?? 'Gagal memuat transaksi');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  const safeTxns = Array.isArray(transactions) ? transactions : [];
  const filtered = safeTxns.filter((t) => {
    const s = search.trim().toLowerCase();
    const matchSearch = !s
      || t.invoice_no?.toLowerCase().includes(s)
      || t.customer_name?.toLowerCase().includes(s)
      || (t.customer_phone ?? '').replace(/\D/g, '').includes(s.replace(/\D/g, ''));
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <>
      <PageHeader
        title="Transaksi"
        description={`${safeTxns.length} transaksi total`}
        action={
          <div className="flex items-center gap-2">
            {(user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'mitra') && (
              <Button variant="outline" asChild className="rounded-xl">
                <Link href="/laundry"><WashingMachine className="mr-2 h-4 w-4" /> Papan Antrian</Link>
              </Button>
            )}
            <ExportButton
              rows={filtered.map(({ details, ...r }: any) => r)}
              filename="transaksi.xlsx"
            />
            {canCreate && (
              <Button asChild className="rounded-xl">
                <Link href="/transactions/new"><Plus className="mr-2 h-4 w-4" /> Buat Transaksi</Link>
              </Button>
            )}
          </div>
        }
      />

      <Card className="mb-4">
        <CardContent className="pt-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari invoice / nama customer / no. HP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-xl"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-56 rounded-xl"><SelectValue placeholder="Semua Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              {LAUNDRY_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className={cn('border-0 shadow-sm')}>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
              ))}
            </div>
          ) : (
            <div className="p-4 md:p-6">
              <TransactionTable data={filtered} onRefresh={refresh} />
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}