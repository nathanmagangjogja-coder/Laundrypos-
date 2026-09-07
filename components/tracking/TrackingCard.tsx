import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LAUNDRY_STATUSES } from '@/constants';
import { formatDateTime, formatRupiah } from '@/lib/utils';
import { CheckCircle2, Circle, Clock, CreditCard, FileText, MapPin, PackageCheck, Shirt, Wallet } from 'lucide-react';
import type { Transaction } from '@/types';

export function TrackingCard({ trx }: { trx: Transaction }) {
  const idx = LAUNDRY_STATUSES.findIndex((s) => s.value === trx.status);
  const statusLabel = LAUNDRY_STATUSES[idx]?.label ?? trx.status;
  const remaining = Math.max(0, trx.total - trx.paid);
  const paymentLabel = trx.payment_status === 'lunas' ? 'Lunas' : trx.payment_status === 'dp' ? 'DP' : 'Belum lunas';
  const statusDescriptions: Record<string, string> = {
    diterima: 'Pesanan sudah diterima outlet dan sedang masuk antrean proses.',
    dicuci: 'Item sedang dicuci sesuai layanan yang dipilih.',
    disetrika: 'Item sedang disetrika atau finishing sebelum dikemas.',
    selesai: 'Laundry sudah selesai dan siap diambil di outlet.',
    diambil: 'Pesanan sudah diambil pelanggan.',
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-primary/5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs uppercase text-muted-foreground">Invoice</div>
            <CardTitle className="font-mono">{trx.invoice_no}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{statusDescriptions[trx.status]}</p>
          </div>
          <Badge className="shrink-0 bg-primary text-primary-foreground">{statusLabel}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border p-3">
            <div className="text-xs text-muted-foreground">Pelanggan</div>
            <div className="font-medium">{trx.customer_name}</div>
            <div className="text-sm text-muted-foreground">{trx.customer_phone}</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> Outlet</div>
            <div className="font-medium">{trx.outlet_name}</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><Wallet className="h-3.5 w-3.5" /> Total Tagihan</div>
            <div className="font-semibold text-primary">{formatRupiah(trx.total)}</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5" /> Estimasi Selesai</div>
            <div className="font-medium">{formatDateTime(trx.est_done_at)}</div>
          </div>
        </div>

        <div>
          <div className="mb-3 text-sm font-semibold">Progress</div>
          <ol className="relative ml-3 border-l-2 border-dashed">
            {LAUNDRY_STATUSES.map((s, i) => {
              const done = i <= idx;
              return (
                <li key={s.value} className="mb-4 ml-5">
                  <span className="absolute -left-[10px] grid h-5 w-5 place-items-center rounded-full bg-background">
                    {done ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                  </span>
                  <div className={done ? 'font-semibold' : 'text-muted-foreground'}>{s.label}</div>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="mb-3 flex items-center gap-2 font-semibold">
            <Shirt className="h-4 w-4 text-primary" />
            Detail Produk / Layanan
          </div>
          <div className="space-y-3">
            {trx.details.map((d) => (
              <div key={d.id} className="rounded-md border bg-background p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{d.service_name}</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {d.qty} {d.unit} x {formatRupiah(d.price)} per {d.unit}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Layanan ini diproses berdasarkan jumlah item/berat yang tercatat pada invoice.
                    </div>
                  </div>
                  <div className="text-right font-semibold">{formatRupiah(d.subtotal)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border p-4">
            <div className="mb-3 flex items-center gap-2 font-semibold">
              <CreditCard className="h-4 w-4 text-primary" />
              Pembayaran
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className="font-medium">{paymentLabel}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Sudah dibayar</span><span>{formatRupiah(trx.paid)}</span></div>
              <div className="flex justify-between border-t pt-2"><span className="text-muted-foreground">Sisa tagihan</span><span className="font-semibold text-rose-600">{formatRupiah(remaining)}</span></div>
            </div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="mb-3 flex items-center gap-2 font-semibold">
              <PackageCheck className="h-4 w-4 text-primary" />
              Pengambilan
            </div>
            <p className="text-sm text-muted-foreground">
              Tunjukkan nomor invoice ini saat pengambilan. Jika status sudah selesai, laundry dapat diambil di {trx.outlet_name}.
            </p>
          </div>
        </div>

        {trx.notes && (
          <div className="rounded-lg border p-4">
            <div className="mb-2 flex items-center gap-2 font-semibold">
              <FileText className="h-4 w-4 text-primary" />
              Catatan Pesanan
            </div>
            <p className="text-sm text-muted-foreground">{trx.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
