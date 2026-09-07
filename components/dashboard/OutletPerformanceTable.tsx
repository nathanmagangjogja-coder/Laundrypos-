'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatRupiah } from '@/lib/utils';
import { Store } from 'lucide-react';

export function OutletPerformanceTable({ performance = [] }: { performance?: any[] }) {
  return (
    <Card>
      <CardHeader><CardTitle>Performa Outlet</CardTitle></CardHeader>
      <CardContent>
        {performance.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Belum ada data outlet</div>
        ) : (
          <div className="space-y-3">
            {performance.map((o, i) => (
            <div key={o.id} className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/40">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-emerald-500/10 text-sm font-bold text-emerald-600">
                <Store className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="font-medium">{o.name}</div>
                <div className="text-xs text-muted-foreground">{o.trxCount} transaksi</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-primary">{formatRupiah(o.revenue)}</div>
                <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">Omzet Kotor</div>
              </div>
            </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
