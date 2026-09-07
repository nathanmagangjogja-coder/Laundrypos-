'use client';
/**
 * components/invoice/InvoicePrint.tsx  (UPDATED)
 * Adds InvoiceVoucherSection at the bottom when a voucher is provided.
 */
import { BarcodeGenerator } from './BarcodeGenerator';
import { QRCodeGenerator } from './QRCodeGenerator';
import { InvoiceVoucherSection } from '@/components/loyalty/InvoiceVoucherSection';
import { formatDateTime, formatRupiah } from '@/lib/utils';
import type { Transaction } from '@/types';
import type { Voucher } from '@/types';

interface InvoicePrintProps {
  trx: Transaction;
  size?: '58' | '80';
  trackingUrl: string;
  voucher?: Voucher; // optional voucher to print at bottom
}

export function InvoicePrint({ trx, size = '80', trackingUrl, voucher }: InvoicePrintProps) {
  const cls = size === '58' ? 'thermal-58' : 'thermal-80';
  return (
    <div className={`print-area mx-auto bg-white p-2 text-slate-900 ${cls}`}>
      <div className="text-center">
        <div className="font-bold">LaundryPOS</div>
        <div className="text-[10px]">{trx.outlet_name}</div>
      </div>
      <div className="my-1 border-y border-dashed py-1 text-[10px]">
        <div>Inv: {trx.invoice_no}</div>
        <div>Tgl: {formatDateTime(trx.created_at)}</div>
        <div>Cust: {trx.customer_name}</div>
        <div>HP: {trx.customer_phone}</div>
      </div>
      {trx.details.map((d) => (
        <div key={d.id} className="text-[10px]">
          <div>{d.service_name}</div>
          <div className="flex justify-between">
            <span>{d.qty}{d.unit} x {formatRupiah(d.price)}</span>
            <span>{formatRupiah(d.subtotal)}</span>
          </div>
        </div>
      ))}
      <div className="my-1 flex justify-between border-t border-dashed pt-1 font-bold">
        <span>TOTAL</span>
        <span>{formatRupiah(trx.total)}</span>
      </div>
      <div className="text-[10px]">Estimasi: {formatDateTime(trx.est_done_at)}</div>
      <div className="my-2 flex justify-center"><BarcodeGenerator value={trx.invoice_no} height={36} /></div>
      <div className="my-2 flex justify-center"><QRCodeGenerator value={trackingUrl} size={72} /></div>
      <div className="text-center text-[10px]">Terima kasih 💙</div>

      {/* Voucher section at bottom */}
      {voucher && (
        <InvoiceVoucherSection voucher={voucher} size={size} />
      )}
    </div>
  );
}
