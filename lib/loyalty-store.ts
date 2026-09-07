/**
 * lib/loyalty-store.ts
 * Supabase-backed Loyalty & Voucher system
 */

import { createSupabaseBrowser } from '@/lib/supabase/client';
import type {
  Voucher,
  LoyaltyPoints,
  VoucherRedemption,
} from '@/types';

const supabase = createSupabaseBrowser();

// ─────────────────────────────────────────────────────────────────────────────
// Voucher Generator
// ─────────────────────────────────────────────────────────────────────────────

export function generateVoucherCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  let code = 'LDRY-';

  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }

  return code;
}

export async function generateUniqueCode(): Promise<string> {
  let code = generateVoucherCode();

  let exists = true;

  while (exists) {
    const { data } = await supabase
      .from('vouchers')
      .select('id')
      .eq('code', code)
      .maybeSingle();

    if (!data) {
      exists = false;
    } else {
      code = generateVoucherCode();
    }
  }

  return code;
}

// ─────────────────────────────────────────────────────────────────────────────
// Vouchers
// ─────────────────────────────────────────────────────────────────────────────

export async function getVouchers(): Promise<Voucher[]> {
  const { data, error } = await supabase
    .from('vouchers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }

  return data ?? [];
}

export async function getVouchersByCustomer(
  customerId: string
): Promise<Voucher[]> {
  const { data, error } = await supabase
    .from('vouchers')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }

  return data ?? [];
}

export async function getActiveVouchers(): Promise<Voucher[]> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('vouchers')
    .select('*')
    .eq('is_used', false)
    .gt('expired_at', now)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }

  return data ?? [];
}

export async function getVoucherByCode(
  code: string
): Promise<Voucher | undefined> {
  const { data, error } = await supabase
    .from('vouchers')
    .select('*')
    .eq('code', code.toUpperCase().trim())
    .maybeSingle();

  if (error) {
    console.error(error);
    return undefined;
  }

  return data ?? undefined;
}

// ─────────────────────────────────────────────────────────────────────────────
// Validate Voucher
// ─────────────────────────────────────────────────────────────────────────────

export async function validateVoucher(
  code: string,
  customerId: string,
  orderTotal: number
): Promise<{
  valid: boolean;
  voucher?: Voucher;
  error?: string;
}> {
  const voucher = await getVoucherByCode(code);

  if (!voucher) {
    return {
      valid: false,
      error: 'Kode voucher tidak ditemukan',
    };
  }

  if (voucher.is_used) {
    return {
      valid: false,
      error: 'Voucher sudah digunakan',
    };
  }

  if (voucher.customer_id !== customerId) {
    return {
      valid: false,
      error: 'Voucher bukan milik customer ini',
    };
  }

  if (voucher.expired_at < new Date().toISOString()) {
    return {
      valid: false,
      error: 'Voucher sudah kadaluarsa',
    };
  }

  if (orderTotal < voucher.minimum_order) {
    return {
      valid: false,
      error: `Minimal transaksi Rp ${voucher.minimum_order.toLocaleString('id-ID')}`,
    };
  }

  return {
    valid: true,
    voucher,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Redeem Voucher
// ─────────────────────────────────────────────────────────────────────────────

export async function redeemVoucher(
  voucherId: string,
  transactionId: string
) {
  const usedAt = new Date().toISOString();

  const { data: voucher } = await supabase
    .from('vouchers')
    .select('*')
    .eq('id', voucherId)
    .single();

  await supabase
    .from('vouchers')
    .update({
      is_used: true,
      used_at: usedAt,
      used_transaction_id: transactionId,
    })
    .eq('id', voucherId);

  if (voucher) {
    await supabase
      .from('voucher_redemptions')
      .insert({
        id: crypto.randomUUID(),

        voucher_id: voucherId,

        voucher_code: voucher.code,

        customer_id: voucher.customer_id,

        transaction_id: transactionId,

        discount_applied: voucher.discount_amount,

        redeemed_at: usedAt,
      });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Loyalty Points
// ─────────────────────────────────────────────────────────────────────────────

// Ganti fungsi getLoyaltyPoints dan getTotalPoints

export async function getLoyaltyPointsHistory(
  customerId: string
): Promise<LoyaltyPoints[]> {
  const { data } = await supabase
    .from('loyalty_points')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });

  return data ?? [];
}

export async function getTotalPoints(customerId: string): Promise<number> {
  const { data } = await supabase
    .from('loyalty_points')
    .select('points, type')
    .eq('customer_id', customerId);

  if (!data || data.length === 0) return 0;

  return data.reduce((sum, r) => {
    return sum + (r.type === 'redeem' ? -Number(r.points) : Number(r.points));
  }, 0);
}
// ─────────────────────────────────────────────────────────────────────────────
// Award Points
// ─────────────────────────────────────────────────────────────────────────────

// Ganti fungsi awardPoints di lib/loyalty-store.ts
// HAPUS semua import admin dan logika server-side di sini

export async function awardPoints(
  customerId: string,
  customerName: string,
  transactionTotal: number,
  transactionId?: string
): Promise<number> {
  try {
    const res = await fetch('/api/loyalty/award', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId, customerName, transactionTotal, transactionId }),
    });

    if (!res.ok) {
      console.error('awardPoints API error:', await res.text());
      return 0;
    }

    const data = await res.json();
    return data.pointsEarned ?? 0;
  } catch (err) {
    console.error('awardPoints fetch error:', err);
    return 0;
  }
}
// ─────────────────────────────────────────────────────────────────────────────
// Analytics
// ─────────────────────────────────────────────────────────────────────────────

export interface LoyaltyAnalytics {
  totalVouchers: number;
  activeVouchers: number;
  usedVouchers: number;
  expiredVouchers: number;
  totalDiscountGiven: number;
  redemptionRate: number;
  totalPointsAwarded: number;

  topCustomers: Array<{
    name: string;
    points: number;
    vouchersUsed: number;
  }>;
}

export async function getLoyaltyAnalytics(): Promise<LoyaltyAnalytics> {
  const vouchers = await getVouchers();

  const { data: pointsData } = await supabase
    .from('loyalty_points')
    .select('*');

  const { data: redemptions } = await supabase
    .from('voucher_redemptions')
    .select('*');

  const now = new Date().toISOString();

  const totalVouchers = vouchers.length;

  const usedVouchers = vouchers.filter(v => v.is_used).length;

  const expiredVouchers = vouchers.filter(
    v => !v.is_used && v.expired_at < now
  ).length;

  const activeVouchers = vouchers.filter(
    v => !v.is_used && v.expired_at >= now
  ).length;

  const totalDiscountGiven =
    (redemptions ?? []).reduce(
      (s, r) => s + r.discount_applied,
      0
    );

  const redemptionRate =
    totalVouchers > 0
      ? Math.round((usedVouchers / totalVouchers) * 100)
      : 0;

  // Aggregate points by customer from transaction-based data
  const customerPointsMap = new Map<string, { name: string; total: number; lifetime: number }>();
  
  (pointsData || []).forEach(record => {
    const key = record.customer_id;
    if (!customerPointsMap.has(key)) {
      customerPointsMap.set(key, {
        name: record.customer_name || 'Unknown',
        total: 0,
        lifetime: 0,
      });
    }
    
    const existing = customerPointsMap.get(key)!;
    const pointValue = record.type === 'redeem' ? -record.points : record.points;
    existing.total += pointValue;
    existing.lifetime += Math.abs(record.points);
  });

  const totalPointsAwarded = Array.from(customerPointsMap.values()).reduce((s, p) => s + p.lifetime, 0);

  const topCustomers = Array.from(customerPointsMap.entries())
    .map(([customerId, data]) => ({
      customerId,
      name: data.name,
      points: data.total,
      lifetime: data.lifetime,
    }))
    .sort((a, b) => b.lifetime - a.lifetime)
    .slice(0, 5)
    .map(p => ({
      name: p.name,
      points: p.points,
      vouchersUsed: vouchers.filter(
        v => v.customer_id === p.customerId && v.is_used
      ).length,
    }));

  return {
  totalVouchers,
  activeVouchers,
  usedVouchers,
  expiredVouchers,
  totalDiscountGiven,
  redemptionRate,
  totalPointsAwarded,
  topCustomers,
  };
}


// ─────────────────────────────────────────────────────────────────────────────
// WhatsApp Voucher Message
// ─────────────────────────────────────────────────────────────────────────────

export function buildVoucherWaMessage(
  customerName: string,
  voucher: Voucher
): string {
  const expDate = new Date(
    voucher.expired_at
  ).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return `
Halo ${customerName} 👋

🎁 Anda mendapatkan voucher loyalitas!

Kode Voucher:
${voucher.code}

${voucher.title}

💰 Diskon:
Rp ${voucher.discount_amount.toLocaleString('id-ID')}

📅 Berlaku sampai:
${expDate}    

Gunakan pada transaksi berikutnya 🙏

_LaundryPOS_
`.trim();
}
