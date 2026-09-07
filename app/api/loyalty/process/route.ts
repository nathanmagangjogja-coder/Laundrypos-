// app/api/loyalty/process/route.ts
// Dipanggil dari TransactionDetail.tsx saat status = 'selesai' atau payment = 'lunas'
// Body: { transaction_id: string }

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

function generateVoucherCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export async function POST(req: NextRequest) {
  try {
    const { transaction_id } = await req.json();

    if (!transaction_id) {
      return NextResponse.json({ error: 'Missing transaction_id' }, { status: 400 });
    }

    const db = createSupabaseAdmin();

    // ─── 1. Ambil data transaksi + customer ───────────────────────────────────
    const { data: trx, error: trxError } = await db
      .from('transactions')
      .select('id, customer_id, total, invoice_no, customers(name)')
      .eq('id', transaction_id)
      .maybeSingle();

    if (trxError || !trx) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (!trx.customer_id) {
      return NextResponse.json({ success: false, message: 'No customer attached to this transaction' });
    }

    const customerId   = trx.customer_id;
    const customerName = (trx.customers as any)?.name ?? 'Pelanggan';
    const total        = Number(trx.total ?? 0);

    // ─── 2. Cek apakah poin untuk transaksi ini sudah pernah diberikan ────────
    const { data: alreadyAwarded } = await db
      .from('loyalty_points')
      .select('id')
      .eq('transaction_id', transaction_id)
      .eq('type', 'earn')
      .maybeSingle();

    if (alreadyAwarded) {
      return NextResponse.json({
        success: false,
        message: 'Points already awarded for this transaction',
      });
    }

    // ─── 3. Ambil loyalty settings ────────────────────────────────────────────
    const { data: settings } = await db
      .from('loyalty_settings')
      .select('points_formula, threshold_points, reward_value, reward_min_purchase, voucher_expiry_days, active')
      .maybeSingle();

    const formula      = settings?.active ? (Number(settings.points_formula) || 10000) : 10000;
    const pointsEarned = Math.floor(total / formula);

    if (pointsEarned <= 0) {
      return NextResponse.json({ success: false, message: 'Transaction too small to earn points' });
    }

    // ─── 4. Hitung balance saat ini ───────────────────────────────────────────
    const { data: existingRows } = await db
      .from('loyalty_points')
      .select('points, type')
      .eq('customer_id', customerId);

    const currentBalance = (existingRows ?? []).reduce((sum, r) => {
      return sum + (r.type === 'redeem' ? -Number(r.points) : Number(r.points));
    }, 0);

    const newBalance = currentBalance + pointsEarned;

    // ─── 5. Insert row earn ───────────────────────────────────────────────────
    const { error: insertError } = await db.from('loyalty_points').insert({
      id:             crypto.randomUUID(),
      customer_id:    customerId,
      customer_name:  customerName,
      points:         pointsEarned,
      type:           'earn',
      description:    `Transaksi ${trx.invoice_no}`,
      transaction_id: transaction_id,
      balance:        newBalance,
      created_at:     new Date().toISOString(),
      updated_at:     new Date().toISOString(),
    });

    if (insertError) {
      console.error('[Loyalty/process] Insert error:', insertError.message);
      return NextResponse.json({ error: 'Failed to award points' }, { status: 500 });
    }

    console.log(`[Loyalty/process] +${pointsEarned} poin untuk ${customerName} (balance: ${newBalance})`);

    // ─── 6. Auto-voucher jika threshold tercapai ──────────────────────────────
    let voucherGenerated = false;
    let voucherCode: string | null = null;

    if (
      settings?.active &&
      Number(settings.threshold_points) > 0 &&
      newBalance >= Number(settings.threshold_points)
    ) {
      const { data: existingVoucher } = await db
        .from('vouchers')
        .select('id')
        .eq('customer_id', customerId)
        .eq('type', 'reward')
        .eq('is_used', false)
        .maybeSingle();

      if (!existingVoucher) {
        const threshold   = Number(settings.threshold_points);
        const rewardValue = Number(settings.reward_value) || 10000;
        const expiryDays  = Number(settings.voucher_expiry_days) || 30;
        const expiredAt   = new Date(Date.now() + expiryDays * 86400 * 1000).toISOString();

        // Generate unique code
        let code   = generateVoucherCode();
        let exists = true;
        while (exists) {
          const { data } = await db.from('vouchers').select('id').eq('code', code).maybeSingle();
          exists = !!data;
          if (exists) code = generateVoucherCode();
        }

        await db.from('vouchers').insert({
          id:              crypto.randomUUID(),
          code,
          customer_id:     customerId,
          customer_name:   customerName,
          type:            'reward',
          title:           `Voucher Reward ${threshold} Poin`,
          description:     `Hadiah loyalitas ${threshold} poin`,
          points:          threshold,
          discount_amount: rewardValue,
          minimum_order:   Number(settings.reward_min_purchase) || 0,
          expired_at:      expiredAt,
          is_used:         false,
          created_at:      new Date().toISOString(),
        });

        // Insert row redeem
        await db.from('loyalty_points').insert({
          id:             crypto.randomUUID(),
          customer_id:    customerId,
          customer_name:  customerName,
          points:         threshold,
          type:           'redeem',
          description:    `Penukaran ${threshold} poin → Voucher ${code}`,
          transaction_id: null,
          balance:        newBalance - threshold,
          created_at:     new Date().toISOString(),
          updated_at:     new Date().toISOString(),
        });

        voucherGenerated = true;
        voucherCode      = code;

        console.log(`[Loyalty/process] Voucher ${code} dibuat untuk ${customerName}`);
      }
    }

    return NextResponse.json({
      success:           true,
      points_earned:     pointsEarned,
      new_balance:       newBalance,
      voucher_generated: voucherGenerated,
      voucher_code:      voucherCode,
    });

  } catch (err: any) {
    console.error('[Loyalty/process] Error:', err?.message ?? err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}