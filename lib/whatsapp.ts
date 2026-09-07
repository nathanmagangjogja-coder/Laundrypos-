import { waLink } from './utils';

import {
  buildVoucherWaMessage,
} from '@/lib/loyalty-store';

import type {
  Voucher,
} from '@/types';

import type {
  WaSettings,
} from './store';

/**
 * Build WA URL
 */
export function buildWaUrl(
  phone: string,
  message: string
) {
  return waLink(phone, message);
}

export function msgLoyaltyVoucher(
  customerName: string,
  points: number,
  voucherCode: string,
  rewardValue: string,
  expiresAt: string,
  outletName: string
): string {
  return `🎉 *Selamat ${customerName}!* 🎉

Anda telah mengumpulkan *${points} poin* loyalitas di *${outletName}*.

Sebagai penghargaan, kami memberikan *Voucher Spesial* untuk Anda:
🎫 Kode Voucher: *${voucherCode}*
💰 Nilai: *${rewardValue}*

*Cara Menggunakan:*
Tunjukkan kode ini ke kasir saat melakukan pembayaran pada kunjungan berikutnya.

📅 Berlaku sampai: *${expiresAt}*

Terima kasih telah menjadi pelanggan setia kami! 🙏✨`;
}

/**
 * Send WhatsApp
 */
export async function sendWhatsApp(
  waSettings: WaSettings,
  phone: string,
  message: string
) {
  const fallbackUrl = waLink(phone, message);

  /**
   * NO API
   * langsung buka WhatsApp
   */
  if (
    !waSettings?.url ||
    !waSettings?.token
  ) {
    window.open(fallbackUrl, '_blank');

    return {
      ok: true,
      fallback: true,
    };
  }

  try {
    const res = await fetch(
      waSettings.url,
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',

          Authorization: waSettings.token,
        },

        body: JSON.stringify({
          target: phone,
          message,
          countryCode: '62',
        }),
      }
    );

    /**
     * API gagal
     * fallback ke wa.me
     */
    if (!res.ok) {
      window.open(fallbackUrl, '_blank');

      return {
        ok: false,
        fallback: true,
      };
    }

    return {
      ok: true,
    };
  } catch (err) {
    console.error('WA ERROR', err);

    /**
     * fetch error
     * fallback buka WA
     */
    window.open(fallbackUrl, '_blank');

    return {
      ok: false,
      fallback: true,
    };
  }
}

/**
 * Send Voucher WA
 */
export async function sendVoucherWa(
  waSettings: WaSettings,
  phone: string,
  customerName: string,
  voucher: Voucher
) {
  const msg = buildVoucherWaMessage(
    customerName,
    voucher
  );

  return await sendWhatsApp(
    waSettings,
    phone,
    msg
  );
}