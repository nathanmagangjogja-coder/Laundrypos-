'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatRupiah } from '@/lib/utils';
import type { Mitra, Transaction } from '@/types';

export function TopMitraTable({ mitra = [], transactions = [] }: { mitra?: Mitra[]; transactions?: Transaction[] }) {
  const stats = mitra.map(m => {
    const trx = transactions.filter(t => t.mitra_id === m.id);
    const total = trx.reduce((acc, t) => acc + t.total, 0);
    return { ...m, trxCount: trx.length, total };
  }).sort((a, b) => b.total - a.total);

  return (
    <Card>
      <CardHeader><CardTitle>Top Mitra Laundry</CardTitle></CardHeader>
      <CardContent>
        {stats.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Belum ada mitra</div>
        ) : (
          <div className="space-y-3">
            {stats.map((m, i) => (
            <div key={m.id} className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/40">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">{i + 1}</div>
              <div className="flex-1">
                <div className="font-medium">{m.name}</div>
                <div className="text-xs text-muted-foreground">{m.trxCount} transaksi</div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{formatRupiah(m.total)}</div>
                <div className="text-xs text-emerald-600">{m.commission_pct}% komisi</div>
              </div>
            </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
