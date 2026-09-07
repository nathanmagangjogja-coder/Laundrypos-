'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge, PaymentBadge } from '@/components/transactions/StatusBadge';
import BarcodeScanner from '@/components/barcode/BarcodeScanner';
import { LAUNDRY_STATUSES, WA_TEMPLATES } from '@/constants';
import { formatRupiah, formatDateTime, waLink } from '@/lib/utils';
import { Search, QrCode, Send, Eye, X, History, User, Phone, Calendar, Package } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import type { Transaction, LaundryStatus } from '@/types';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export default function ScanPage() {
  const { user } = useAuth();
  const isMitra = user?.role === 'mitra';

  const [query, setQuery] = useState('');
  const [result, setResult] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  /**
   * Ekstrak invoice_no dari berbagai format input:
   * 1. URL tracking: http://localhost:3000/track/INV/20260606/0017-705
   *    → INV/20260606/0017-705
   * 2. Full invoice: INV/20260606/0017-705
   *    → INV/20260606/0017-705
   * 3. Parsial: 0017-705
   *    → 0017-705 (fallback)
   */
  function extractInvoiceNo(raw: string): string {
    const trimmed = raw.trim();

    try {
      const url = new URL(trimmed);
      const pathname = url.pathname;
      const trackMatch = pathname.match(/\/track\/(.+)/i);
      if (trackMatch) return decodeURIComponent(trackMatch[1]).toUpperCase();
      const parts = pathname.split('/').filter(Boolean);
      if (parts.length >= 3) return decodeURIComponent(parts.join('/')).toUpperCase();
      return decodeURIComponent(parts[parts.length - 1] ?? trimmed).toUpperCase();
    } catch {}

    if (trimmed.toUpperCase().startsWith('INV/')) return trimmed.toUpperCase();
    const invMatch = trimmed.match(/(INV\/[\w/-]+)/i);
    if (invMatch) return invMatch[1].toUpperCase();
    return trimmed.toUpperCase();
  }

  async function handleSearch(value = query) {
    const invoiceNo = extractInvoiceNo(value);
    if (!invoiceNo) return;

    setQuery(invoiceNo);
    setLoading(true);
    setNotFound(false);
    setResult(null);

    try {
      const found = await api.getTransactionByInvoice(invoiceNo);
      if (found) {
        setResult(found);
        setNotFound(false);
      } else {
        setResult(null);
        setNotFound(true);
      }
    } catch {
      setResult(null);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  function handleScan(value: string) {
    toast.success('Barcode berhasil dipindai');
    handleSearch(value);
  }

  function sendWa() {
    if (!result) return;
    const msg = WA_TEMPLATES.ready(result.customer_name, result.invoice_no);
    const url = waLink(result.customer_phone, msg);
    const a = document.createElement('a');
    a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }

  async function changeStatus(s: LaundryStatus) {
    if (!result) return;
    try {
      const updated = await api.updateTransaction(result.id, { status: s });
      setResult(updated);
      toast.success(`Status diperbarui ke: ${LAUNDRY_STATUSES.find(x => x.value === s)?.label}`);
    } catch (error: any) {
      toast.error(error.message ?? 'Gagal memperbarui status');
    }
  }

  // Tentukan href tombol Detail berdasarkan role
  const detailHref = result
    ? isMitra
      ? `/scan/${result.id}`           // ← mitra → halaman nota detail
      : `/transactions/${result.id}`   // ← admin/super_admin → halaman transaksi penuh
    : '#';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scan & Aksi Cepat"
        description="Pindai barcode nota atau cari manual untuk memperbarui status pesanan."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column: Scanner & Search */}
        <div className="space-y-6">
          <Card className="overflow-hidden border-primary/20 shadow-lg">
            <CardHeader className="bg-primary/5">
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-primary" />
                Pemindai Barcode
              </CardTitle>
              <CardDescription>Arahkan kamera ke barcode pada nota pelanggan</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <BarcodeScanner onScan={handleScan} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Search className="h-4 w-4" />
                Pencarian Manual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    placeholder="Contoh: INV/20260606/0017-705"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    className="pr-10"
                  />
                  {query && (
                    <button
                      onClick={() => { setQuery(''); setResult(null); setNotFound(false); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <Button onClick={() => handleSearch()} disabled={loading}>
                  {loading ? 'Mencari...' : 'Cari'}
                </Button>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Format: INV/YYYYMMDD/XXXX atau scan QR/barcode dari nota
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Result */}
        <div className="space-y-6">
          {!result && !notFound && (
            <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-xl border-2 border-dashed bg-muted/30 p-12 text-center text-muted-foreground">
              <div className="mb-4 rounded-full bg-muted p-4">
                <History className="h-8 w-8 opacity-20" />
              </div>
              <p className="font-medium">Belum ada hasil</p>
              <p className="max-w-[200px] text-sm mt-1">
                Gunakan scanner atau cari manual untuk menampilkan data transaksi
              </p>
            </div>
          )}

          {notFound && (
            <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-destructive/30 bg-destructive/5 p-12 text-center text-destructive">
              <div className="mb-4 rounded-full bg-destructive/10 p-4">
                <X className="h-8 w-8" />
              </div>
              <p className="font-bold">Transaksi Tidak Ditemukan</p>
              <p className="text-sm mt-1 opacity-80">
                Pastikan nomor invoice <strong>&quot;{query}&quot;</strong> sudah benar
              </p>
              <p className="text-xs mt-2 opacity-60">
                Format yang valid: INV/20260606/0017-705
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => { setNotFound(false); setQuery(''); }}
              >
                Coba Lagi
              </Button>
            </div>
          )}

          {result && (
            <Card className="border-primary/20 shadow-xl overflow-hidden">
              <div className="bg-primary px-6 py-4 text-primary-foreground">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm opacity-80 uppercase tracking-wider">Nomor Invoice</span>
                  <StatusBadge status={result.status} className="bg-white/20 text-white border-none" />
                </div>
                <h2 className="mt-1 font-mono text-xl font-bold tracking-tight">{result.invoice_no}</h2>
              </div>

              <CardContent className="p-6 space-y-6">
                {/* Customer Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase font-semibold">
                      <User className="h-3 w-3" /> Pelanggan
                    </div>
                    <p className="font-bold text-lg leading-tight">{result.customer_name}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <div className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground uppercase font-semibold">
                      <Phone className="h-3 w-3" /> WhatsApp
                    </div>
                    <p className="font-medium">{result.customer_phone}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/30 p-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase font-semibold">
                      <Calendar className="h-3 w-3" /> Masuk
                    </div>
                    <p className="text-sm font-medium">{formatDateTime(result.created_at)}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <div className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground uppercase font-semibold">
                      <Calendar className="h-3 w-3" /> Estimasi
                    </div>
                    <p className="text-sm font-bold text-primary">{formatDateTime(result.est_done_at)}</p>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase font-semibold border-b pb-2">
                    <Package className="h-3 w-3" /> Ringkasan Pesanan
                  </div>
                  <div className="space-y-2">
                    {result.details?.slice(0, 3).map((d, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span>{d.service_name} <span className="text-muted-foreground">x {d.qty} {d.unit}</span></span>
                        <span className="font-medium">{formatRupiah(d.subtotal)}</span>
                      </div>
                    ))}
                    {result.details?.length > 3 && (
                      <p className="text-xs text-center text-muted-foreground pt-1 italic">
                        + {result.details.length - 3} item lainnya
                      </p>
                    )}
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm font-semibold">Total Tagihan</span>
                    <span className="text-xl font-black text-primary">{formatRupiah(result.total)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-medium">Status Bayar</span>
                    <PaymentBadge status={result.payment_status} />
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t space-y-4">
                  {/* Update status hanya untuk non-mitra */}
                  {!isMitra && (
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">
                        Update Progres
                      </Label>
                      <Select value={result.status} onValueChange={v => changeStatus(v as LaundryStatus)}>
                        <SelectTrigger className="w-full h-11 border-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LAUNDRY_STATUSES.map(s => (
                            <SelectItem key={s.value} value={s.value} className="py-3">
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {/* Tombol Detail — arahkan sesuai role */}
                    <Button asChild variant="outline" className="flex-1 h-11">
                      <Link href={detailHref}>
                        <Eye className="mr-2 h-4 w-4" />
                        {isMitra ? 'Lihat Nota' : 'Detail'}
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 h-11 text-green-600 border-green-200 hover:bg-green-50"
                      onClick={sendWa}
                    >
                      <Send className="mr-2 h-4 w-4" /> WhatsApp
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    className="w-full text-muted-foreground h-9 text-xs"
                    onClick={() => { setResult(null); setQuery(''); }}
                  >
                    Tutup Hasil
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}