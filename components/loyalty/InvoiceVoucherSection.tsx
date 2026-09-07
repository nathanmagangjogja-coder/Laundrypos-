'use client';
/**
 * components/loyalty/InvoiceVoucherSection.tsx
 * Printable voucher section that appears at the bottom of thermal/PDF invoices.
 * Supports 58mm, 80mm thermal printers and A4 PDF.
 */
import { Scissors } from 'lucide-react';
import type { Voucher } from '@/types';

interface InvoiceVoucherSectionProps {
  voucher: Voucher;
  size?: '58' | '80' | 'pdf';
}

export function InvoiceVoucherSection({ voucher, size = '80' }: InvoiceVoucherSectionProps) {
  const expDate = new Date(voucher.expired_at).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const isPdf = size === 'pdf';

  if (isPdf) {
    // Full-width PDF layout
    return (
      <div style={{ marginTop: 24, pageBreakInside: 'avoid' }}>
        {/* Scissor divider */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ flex: 1, borderTop: '1.5px dashed #94a3b8' }} />
          <span style={{ margin: '0 8px', fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
            ✂ Gunting di sini
          </span>
          <div style={{ flex: 1, borderTop: '1.5px dashed #94a3b8' }} />
        </div>

        {/* Voucher box */}
        <div
          style={{
            border: '2px dashed #10b981',
            borderRadius: 12,
            overflow: 'hidden',
            fontFamily: 'monospace',
          }}
        >
          {/* Header */}
          <div
            style={{
              background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
              padding: '12px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: 10, color: '#059669', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                🎁 VOUCHER PELANGGAN
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#1e293b', marginTop: 2 }}>
                {voucher.title}
              </div>
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 900,
                color: '#059669',
              }}
            >
              Rp {voucher.discount_amount.toLocaleString('id-ID')}
            </div>
          </div>

          {/* Body */}
          <div style={{ background: '#fff', padding: '10px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <div style={{ fontSize: 9, color: '#64748b' }}>Kode Voucher:</div>
                <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: 3, color: '#0f172a', fontFamily: 'monospace' }}>
                  {voucher.code}
                </div>
                <div style={{ fontSize: 9, color: '#64748b', marginTop: 4 }}>
                  Min. transaksi: Rp {voucher.minimum_order.toLocaleString('id-ID')}
                </div>
                <div style={{ fontSize: 9, color: '#64748b' }}>
                  Berlaku hingga: {expDate}
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: 9, color: '#64748b' }}>
                <div>Untuk: {voucher.customer_name}</div>
                <div style={{ marginTop: 4, color: '#059669' }}>✨ Gunakan di transaksi berikutnya</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Thermal layout (58mm or 80mm)
  const textSize = size === '58' ? 'text-[8px]' : 'text-[10px]';
  const codeSize = size === '58' ? 'text-[11px]' : 'text-[13px]';
  const discountSize = size === '58' ? 'text-[13px]' : 'text-base';

  return (
    <div className={`mt-2 ${textSize}`}>
      {/* Scissor cut line */}
      <div className="flex items-center my-1">
        <div className="flex-1 border-t border-dashed border-slate-400" />
        <span className="mx-1 flex items-center gap-0.5 text-slate-400">
          <Scissors className="h-2.5 w-2.5 rotate-90" /> gunting
        </span>
        <div className="flex-1 border-t border-dashed border-slate-400" />
      </div>

      {/* Voucher box */}
      <div className="border-2 border-dashed border-emerald-500 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-emerald-50 px-2 py-1.5 text-center">
          <div className="font-bold text-emerald-700 uppercase tracking-wide">
            🎁 VOUCHER PELANGGAN
          </div>
        </div>

        {/* Content */}
        <div className="bg-white px-2 py-1.5 space-y-0.5">
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Kode Voucher:</span>
          </div>
          <div className={`${codeSize} font-black tracking-widest text-slate-900 text-center font-mono`}>
            {voucher.code}
          </div>

          <div className="border-t border-dashed border-slate-300 my-1" />

          <div className="flex justify-between">
            <span className="text-slate-500">Diskon:</span>
            <span className={`${discountSize} font-bold text-emerald-600`}>
              Rp {voucher.discount_amount.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Min. transaksi:</span>
            <span>Rp {voucher.minimum_order.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Berlaku s/d:</span>
            <span>{expDate}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-emerald-50 px-2 py-1 text-center text-slate-600">
          Gunakan untuk transaksi berikutnya ✨
        </div>
      </div>

      {/* Bottom spacing */}
      <div className="h-1" />
    </div>
  );
}
