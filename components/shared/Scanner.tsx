'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export function Scanner() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  async function search() {
    if (!query.trim()) return;
    try {
      const txns = await api.listTransactions();
      const found = txns.find(t =>
        t.invoice_no.toLowerCase() === query.toLowerCase() ||
        t.invoice_no.toLowerCase().includes(query.toLowerCase())
      );
      if (found) {
        toast.success(`Transaksi ditemukan: ${found.invoice_no}`);
        router.push(`/transactions/${found.id}`);
      } else {
        toast.error(`Transaksi "${query}" tidak ditemukan`);
      }
    } catch (error: any) {
      toast.error(error.message ?? 'Gagal mencari transaksi');
    }
  }

  return (
    <div className="flex gap-2">
      <Input
        placeholder="Cari invoice / barcode..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && search()}
        className="max-w-xs"
      />
      <Button onClick={search} variant="outline">
        <Search className="h-4 w-4" />
      </Button>
      <Button variant="outline" onClick={() => toast.info('Untuk scan kamera, gunakan perangkat mobile dengan browser yang mendukung kamera.')}>
        <Camera className="mr-2 h-4 w-4" /> Scan
      </Button>
    </div>
  );
}
