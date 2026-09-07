'use client';
import { useEffect, useState, useMemo } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  CheckCircle, CreditCard, Clock, TrendingUp,
  Filter, Send, RefreshCw, AlertCircle, Wallet
} from 'lucide-react';
import { toast } from 'sonner';
import { formatRupiah, formatDate } from '@/lib/utils';
import type { Commission } from '@/types';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

type CommissionRow = Commission & { mitra_name: string; invoice_no: string };

// ─── Helper: daftar bulan untuk filter ────────────────────────────────────────
function getMonthOptions() {
  const options: { value: string; label: string }[] = [{ value: 'all', label: 'Semua Periode' }];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    options.push({ value, label });
  }
  return options;
}

// ─── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  if (status === 'paid')
    return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">Lunas</Badge>;
  if (status === 'requested')
    return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">Diminta</Badge>;
  return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">Pending</Badge>;
}

export default function CommissionPage() {
  const { user } = useAuth();
  const [commissions, setCommissions] = useState<CommissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestNotes, setRequestNotes] = useState('');
  const [requesting, setRequesting] = useState(false);
  const monthOptions = getMonthOptions();

  async function refresh() {
    try {
      setLoading(true);
      setCommissions(await api.listCommissions());
    } catch (error: any) {
      toast.error(error.message ?? 'Gagal memuat komisi');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  // ─── Filter ───────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const safe = Array.isArray(commissions) ? commissions : [];
    return safe.filter(c => {
      const matchPeriod = periodFilter === 'all' || c.created_at?.startsWith(periodFilter);
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchPeriod && matchStatus;
    });
  }, [commissions, periodFilter, statusFilter]);

  // ─── Stats ────────────────────────────────────────────────────────────────
  const safe = Array.isArray(commissions) ? commissions : [];
  const totalPending   = safe.filter(r => r.status === 'pending').reduce((s, r) => s + Number(r.amount), 0);
  const totalRequested = safe.filter(r => r.status === 'requested').reduce((s, r) => s + Number(r.amount), 0);
  const totalPaid      = safe.filter(r => r.status === 'paid').reduce((s, r) => s + Number(r.amount), 0);
  const pendingCount   = safe.filter(r => r.status === 'pending').length;
  const requestedCount = safe.filter(r => r.status === 'requested').length;
  const paidCount      = safe.filter(r => r.status === 'paid').length;

  // Komisi pending milik mitra yang bisa direquest
  const myPendingCommissions = safe.filter(r => r.status === 'pending');
  const myPendingTotal = myPendingCommissions.reduce((s, r) => s + Number(r.amount), 0);
  const hasRequested = safe.some(r => r.status === 'requested');

  const isSuperAdmin = user?.role === 'super_admin';
  const isMitra = user?.role === 'mitra';

  // ─── Actions ──────────────────────────────────────────────────────────────
  async function handlePay(id: string) {
    try {
      await api.payCommission(id);
      await refresh();
      toast.success('Komisi ditandai lunas');
    } catch (error: any) {
      toast.error(error.message ?? 'Gagal membayar komisi');
    }
  }

  async function handlePayAll() {
    try {
      await api.payAllPendingCommissions();
      await refresh();
      toast.success('Semua komisi ditandai lunas');
    } catch (error: any) {
      toast.error(error.message ?? 'Gagal membayar semua komisi');
    }
  }

  // Mitra request pembayaran ke super admin
  async function handleRequestPayment() {
    if (myPendingTotal <= 0) {
      toast.error('Tidak ada komisi pending untuk direquest');
      return;
    }
    try {
      setRequesting(true);
      await api.requestCommissionPayment({ notes: requestNotes });
      await refresh();
      toast.success('Request pembayaran komisi berhasil dikirim ke Super Admin');
      setRequestOpen(false);
      setRequestNotes('');
    } catch (error: any) {
      toast.error(error.message ?? 'Gagal mengirim request');
    } finally {
      setRequesting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Komisi Mitra"
        description={isSuperAdmin
          ? 'Kelola & bayar komisi semua mitra'
          : 'Ringkasan komisi dan setoran Anda'}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            {isSuperAdmin && (requestedCount > 0 || pendingCount > 0) && (
              <Button onClick={handlePayAll}>
                <CreditCard className="mr-2 h-4 w-4" />
                Bayar Semua ({pendingCount + requestedCount})
              </Button>
            )}
            {isMitra && myPendingTotal > 0 && !hasRequested && (
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => setRequestOpen(true)}
              >
                <Send className="mr-2 h-4 w-4" />
                Request Pembayaran
              </Button>
            )}
          </div>
        }
      />

      {/* ─── Stats Cards ─────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" /> Komisi Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{formatRupiah(totalPending)}</div>
            <p className="text-xs text-muted-foreground mt-1">{pendingCount} transaksi belum diproses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Send className="h-4 w-4 text-blue-500" /> Sedang Direquest
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatRupiah(totalRequested)}</div>
            <p className="text-xs text-muted-foreground mt-1">{requestedCount} transaksi menunggu persetujuan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500" /> Sudah Dibayar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatRupiah(totalPaid)}</div>
            <p className="text-xs text-muted-foreground mt-1">{paidCount} transaksi lunas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-violet-500" /> Total Komisi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-violet-600">
              {formatRupiah(totalPending + totalRequested + totalPaid)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{safe.length} total transaksi</p>
          </CardContent>
        </Card>
      </div>

      {/* ─── Alert: ada request masuk (super admin) ───────────────────────── */}
      {isSuperAdmin && requestedCount > 0 && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
          <CardContent className="flex items-center gap-3 py-3">
            <AlertCircle className="h-5 w-5 text-blue-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                {requestedCount} request pembayaran komisi masuk
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Total {formatRupiah(totalRequested)} menunggu persetujuan Anda
              </p>
            </div>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handlePayAll}
            >
              Bayar Semua Request
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ─── Alert: sudah ada request aktif (mitra) ──────────────────────── */}
      {isMitra && hasRequested && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
          <CardContent className="flex items-center gap-3 py-3">
            <Send className="h-5 w-5 text-blue-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                Request pembayaran sedang diproses
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Super Admin akan segera memproses pembayaran komisi Anda
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Filter Bar ───────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="py-3">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0 mt-2 sm:mt-0" />
            <div className="flex flex-col sm:flex-row gap-2 flex-1">
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger className="w-full sm:w-52">
                  <SelectValue placeholder="Filter Periode" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="pending">Pending ({pendingCount})</SelectItem>
                  <SelectItem value="requested">Direquest ({requestedCount})</SelectItem>
                  <SelectItem value="paid">Lunas ({paidCount})</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground shrink-0">
              {filtered.length} dari {safe.length} data
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ─── Table ────────────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground text-sm">Memuat data...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              <Wallet className="mx-auto mb-2 h-8 w-8 opacity-30" />
              <p>Tidak ada data komisi</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <THead>
                  <TR>
                    <TH>Invoice</TH>
                    {isSuperAdmin && <TH>Mitra</TH>}
                    <TH>Komisi</TH>
                    <TH>Status</TH>
                    <TH className="hidden md:table-cell">Tanggal</TH>
                    {isSuperAdmin && <TH>Aksi</TH>}
                  </TR>
                </THead>
                <TBody>
                  {filtered.map(r => (
                    <TR key={r.id}>
                      <TD className="font-mono text-xs">{r.invoice_no || '-'}</TD>
                      {isSuperAdmin && (
                        <TD className="font-medium">{r.mitra_name || '-'}</TD>
                      )}
                      <TD className="font-semibold">{formatRupiah(Number(r.amount))}</TD>
                      <TD><StatusBadge status={r.status} /></TD>
                      <TD className="hidden md:table-cell text-sm text-muted-foreground">
                        {formatDate(r.created_at)}
                      </TD>
                      {isSuperAdmin && (
                        <TD>
                          {(r.status === 'pending' || r.status === 'requested') && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                              onClick={() => handlePay(r.id)}
                            >
                              <CheckCircle className="mr-1 h-3 w-3" /> Bayar
                            </Button>
                          )}
                        </TD>
                      )}
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Request Payment Dialog (Mitra) ──────────────────────────────── */}
      <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-blue-500" />
              Request Pembayaran Komisi
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/40 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Jumlah komisi pending</span>
                <span className="font-medium">{pendingCount} transaksi</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total yang direquest</span>
                <span className="font-bold text-blue-600 text-base">{formatRupiah(myPendingTotal)}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Catatan (opsional)</Label>
              <Input
                placeholder="Contoh: Mohon diproses sebelum akhir bulan"
                value={requestNotes}
                onChange={e => setRequestNotes(e.target.value)}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Request ini akan dikirim ke Super Admin sebagai notifikasi.
              Super Admin akan memproses pembayaran sesuai kebijakan.
            </p>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setRequestOpen(false)}>
                Batal
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleRequestPayment}
                disabled={requesting || myPendingTotal <= 0}
              >
                {requesting ? 'Mengirim...' : (
                  <><Send className="mr-2 h-4 w-4" /> Kirim Request</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}