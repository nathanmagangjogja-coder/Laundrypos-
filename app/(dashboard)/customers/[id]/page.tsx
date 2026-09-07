'use client';
import { useEffect, useRef, useState } from 'react';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TransactionTable } from '@/components/transactions/TransactionTable';
import { Modal } from '@/components/shared/Modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatRupiah, formatDate, waLink } from '@/lib/utils';
import { Pencil, Phone, MessageCircle, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import type { Customer, Transaction } from '@/types';
import { api } from '@/lib/api';
import { CustomerLoyaltyPanel } from '@/components/costumers/CustomerLoyaltyPanel';
import { ExportButton } from '@/components/shared/ExportButton';
import { exportElementToPdf } from '@/lib/pdf';

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const [customer, setCustomer] = useState<Customer | null | undefined>(undefined);
  const [trx, setTrx] = useState<Transaction[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const printRef = useRef<HTMLDivElement>(null);

  async function exportPdf() {
    if (!printRef.current || !customer) return;
    toast.info('Membuat PDF...');
    await exportElementToPdf(printRef.current, `riwayat-${customer.name.replace(/\s+/g, '-')}.pdf`);
    toast.success('PDF berhasil diunduh');
  }

  useEffect(() => {
    async function loadCustomer() {
      try {
        const [customers, transactions] = await Promise.all([
          api.listCustomers(),
          api.listTransactions(),
        ]);
        const c = customers.find(x => x.id === params.id) ?? null;
        setCustomer(c);
        if (c) {
          setForm({ name: c.name, phone: c.phone, address: c.address ?? '' });
          setTrx(transactions.filter(t => t.customer_id === c.id));
        }
      } catch (error: any) {
        toast.error(error.message ?? 'Gagal memuat customer');
        setCustomer(null);
      }
    }
    loadCustomer();
  }, [params.id]);

  if (customer === undefined) return <div className="py-12 text-center text-muted-foreground">Memuat...</div>;
  if (customer === null) return notFound();

  async function handleSave() {
    if (!form.name.trim()) { toast.error('Nama wajib diisi'); return; }
    try {
      const updated = await api.updateCustomer(customer!.id, form);
      setCustomer(updated);
      toast.success('Customer diperbarui');
      setEditOpen(false);
    } catch (error: any) {
      toast.error(error.message ?? 'Gagal memperbarui customer');
    }
  }

  const totalSpend = trx.reduce((s, t) => s + t.total, 0);

  return (
    <>
      <PageHeader
        title={customer.name}
        description={`${customer.phone} · ${customer.address ?? '—'}`}
        action={
          <div className="flex gap-2">
            <ExportButton
              rows={trx.map(({ details, ...r }: any) => r)}
              filename={`riwayat-${customer.name.replace(/\s+/g, '-')}.xlsx`}
              label="Export Excel"
            />
            <Button variant="outline" onClick={exportPdf} className="rounded-xl">
              <FileDown className="mr-2 h-4 w-4" /> Export PDF
            </Button>
            <Button variant="outline" onClick={() => window.open(waLink(customer.phone, `Halo ${customer.name}`), '_blank')}>
              <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
            </Button>
            <Button onClick={() => setEditOpen(true)}><Pencil className="mr-2 h-4 w-4" /> Edit</Button>
          </div>
        }
      />

      <div ref={printRef} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader><CardTitle>Total Transaksi</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{trx.length}</div></CardContent></Card>
        <Card><CardHeader><CardTitle>Total Belanja</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-primary">{formatRupiah(totalSpend)}</div></CardContent></Card>
        <Card><CardHeader><CardTitle>Terdaftar</CardTitle></CardHeader><CardContent><div className="text-lg font-semibold">{formatDate(customer.created_at)}</div></CardContent></Card>
      </div>

      {/* Loyalty Panel */}
      <CustomerLoyaltyPanel
        customerId={customer.id}
      />

      {/* Transaction History */}
      <Card>

        <CardHeader>
          <CardTitle>
            Riwayat Transaksi
          </CardTitle>
        </CardHeader>

        <CardContent>
          <TransactionTable
            data={trx}
          />
        </CardContent>

      </Card>
      </div>

      <Modal open={editOpen} onOpenChange={setEditOpen} title="Edit Customer">
        <div className="space-y-3">
          <div className="space-y-2"><Label>Nama *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div className="space-y-2"><Label>No. HP</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
          <div className="space-y-2"><Label>Alamat</Label><Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditOpen(false)}>Batal</Button>
            <Button onClick={handleSave}>Perbarui</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}