// app/api/loyalty/award/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

function generateVoucherCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export async function POST(req: NextRequest) {
  try {
    const { customerId, customerName, transactionTotal, transactionId } = await req.json();

    if (!customerId || !customerName || !transactionTotal) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = createSupabaseAdmin();

    const { data: settings } = await db
      .from('loyalty_settings')
      .select('points_formula, threshold_points, reward_type, reward_value, reward_min_purchase, voucher_expiry_days, active')
      .maybeSingle();

    const formula = settings?.active ? (Number(settings.points_formula) || 10000) : 10000;
    const pointsEarned = Math.floor(transactionTotal / formula);

    if (pointsEarned <= 0) {
      return NextResponse.json({ pointsEarned: 0 });
    }

    const { data: existingRows } = await db
      .from('loyalty_points')
      .select('points, type')
      .eq('customer_id', customerId);

    const currentBalance = (existingRows ?? []).reduce((sum, r) => {
      return sum + (r.type === 'redeem' ? -Number(r.points) : Number(r.points));
    }, 0);

    const newBalance = currentBalance + pointsEarned;

    const { error } = await db.from('loyalty_points').insert({
      id: crypto.randomUUID(),
      customer_id: customerId,
      customer_name: customerName,
      points: pointsEarned,
      type: 'earn',
      description: `Transaksi ${transactionId ?? ''}`.trim(),
      transaction_id: transactionId ?? null,
      balance: newBalance,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Failed to award points:', error);
      return NextResponse.json({ error: 'Failed to award points' }, { status: 500 });
    }

    // Auto-generate voucher jika threshold tercapai
    if (settings?.active && Number(settings.threshold_points) > 0 && newBalance >= Number(settings.threshold_points)) {
      const { data: existingVoucher } = await db
        .from('vouchers')
        .select('id')
        .eq('customer_id', customerId)
        .eq('type', 'reward')
        .eq('is_used', false)
        .maybeSingle();

      if (!existingVoucher) {
        const threshold = Number(settings.threshold_points);
        const rewardValue = Number(settings.reward_value) || 10000;
        const expiryDays = Number(settings.voucher_expiry_days) || 30;
        const expiredAt = new Date(Date.now() + expiryDays * 86400 * 1000).toISOString();

        let code = generateVoucherCode();
        let exists = true;
        while (exists) {
          const { data } = await db.from('vouchers').select('id').eq('code', code).maybeSingle();
          if (!data) { exists = false; } else { code = generateVoucherCode(); }
        }

        await db.from('vouchers').insert({
          id: crypto.randomUUID(),
          code,
          customer_id: customerId,
          customer_name: customerName,
          type: 'reward',
          title: `Voucher Reward ${threshold} Poin`,
          description: `Hadiah loyalitas ${threshold} poin`,
          points: threshold,
          discount_amount: rewardValue,
          minimum_order: Number(settings.reward_min_purchase) || 0,
          expired_at: expiredAt,
          is_used: false,
          created_at: new Date().toISOString(),
        });

        await db.from('loyalty_points').insert({
          id: crypto.randomUUID(),
          customer_id: customerId,
          customer_name: customerName,
          points: threshold,
          type: 'redeem',
          description: `Penukaran ${threshold} poin → Voucher ${code}`,
          transaction_id: null,
          balance: newBalance - threshold,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({ pointsEarned });
  } catch (err) {
    console.error('Award points error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}