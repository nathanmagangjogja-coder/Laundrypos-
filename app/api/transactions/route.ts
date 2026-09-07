// @version-check: v3-attachStaffNames-fix
// app/api/transactions/route.ts
import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { TRANSACTION_SELECT, mapTransaction, nextInvoiceNoFromCount } from '@/lib/supabase/transactions';
import { getCurrentUser } from '@/lib/server-auth';
import { createNotification } from '@/lib/notifications';
import { createSupabaseAdmin as adminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = createSupabaseAdmin();
    const user = await getCurrentUser();
    let query = supabase
      .from('transactions')
      .select(TRANSACTION_SELECT)
      .order('created_at', { ascending: false });

    if (user?.role === 'mitra') {
      if (!user.mitra_id) return NextResponse.json({ data: [] });
      query = query.eq('mitra_id', user.mitra_id);
    }

    if (user?.role === 'admin' && user.outlet_id) {
      query = query.eq('outlet_id', user.outlet_id);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ data: (data ?? []).map(mapTransaction) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Failed to load transactions' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = createSupabaseAdmin();
    const user = await getCurrentUser();

    const details = Array.isArray(body.details) ? body.details : [];
    if (!body.customer_id || !body.outlet_id || details.length === 0) {
      return NextResponse.json({ error: 'Customer, outlet, and details are required' }, { status: 400 });
    }

    const subtotal = details.reduce((sum: number, detail: any) => sum + Number(detail.subtotal ?? 0), 0);
    let total = subtotal;
    let appliedVoucher: any = null;
    const voucherCode = String(body.voucher_code ?? '').trim().toUpperCase();

    if (voucherCode) {
      const { data: voucher, error: voucherError } = await supabase
        .from('vouchers')
        .select('*')
        .eq('code', voucherCode)
        .maybeSingle();

      if (voucherError) throw voucherError;
      if (!voucher) return NextResponse.json({ error: 'Kode voucher tidak ditemukan' }, { status: 400 });
      if (voucher.is_used) return NextResponse.json({ error: 'Voucher sudah digunakan' }, { status: 400 });
      if (voucher.customer_id !== body.customer_id) return NextResponse.json({ error: 'Voucher bukan milik customer ini' }, { status: 400 });
      if (voucher.expired_at < new Date().toISOString()) return NextResponse.json({ error: 'Voucher sudah kadaluarsa' }, { status: 400 });
      if (subtotal < Number(voucher.minimum_order ?? 0)) {
        return NextResponse.json({ error: `Minimal transaksi Rp ${Number(voucher.minimum_order ?? 0).toLocaleString('id-ID')}` }, { status: 400 });
      }

      appliedVoucher = voucher;
      total = Math.max(0, subtotal - Number(voucher.discount_amount ?? 0));
    }

    const paid = body.payment_status === 'lunas'
      ? total
      : body.payment_status === 'dp'
        ? Number(body.paid ?? total / 2)
        : 0;

    // ─── FIX: Ambil commission_pct dari DB, jangan dari body ──────────────
    const mitraId = body.mitra_id || (user?.role === 'mitra' ? user.mitra_id : null);
    let commissionPct = 0;

    if (mitraId) {
      const { data: mitraData } = await supabase
        .from('mitra')
        .select('commission_pct')
        .eq('id', mitraId)
        .maybeSingle();
      commissionPct = Number(mitraData?.commission_pct ?? 0);
    }
    // ──────────────────────────────────────────────────────────────────────

    const { count, error: countError } = await supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true });
    if (countError) throw countError;

    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        invoice_no: body.invoice_no || nextInvoiceNoFromCount(count ?? 0),
        customer_id: body.customer_id,
        outlet_id: body.outlet_id,
        mitra_id: mitraId,
        total,
        paid,
        payment_status: body.payment_status ?? 'belum_lunas',
        status: body.status ?? 'diterima',
        notes: body.notes ?? null,
        est_done_at: body.est_done_at || new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
        created_by: user?.id ?? null,
      })
      .select('id')
      .single();

    if (transactionError) throw transactionError;

    const detailRows = details.map((detail: any) => ({
      transaction_id: transaction.id,
      service_id: detail.service_id,
      qty: Number(detail.qty ?? 0),
      unit: detail.unit,
      price: Number(detail.price ?? 0),
      subtotal: Number(detail.subtotal ?? 0),
    }));

    const { error: detailError } = await supabase.from('transaction_details').insert(detailRows);
    if (detailError) throw detailError;

    if (paid > 0) {
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({ transaction_id: transaction.id, amount: paid, method: 'cash' });
      if (paymentError) throw paymentError;
    }

    if (appliedVoucher) {
      const usedAt = new Date().toISOString();
      const discountApplied = Math.min(subtotal, Number(appliedVoucher.discount_amount ?? 0));

      const { error: voucherUpdateError } = await supabase
        .from('vouchers')
        .update({ is_used: true, used_at: usedAt, used_transaction_id: transaction.id })
        .eq('id', appliedVoucher.id);
      if (voucherUpdateError) throw voucherUpdateError;

      const { error: redemptionError } = await supabase
        .from('voucher_redemptions')
        .insert({
          voucher_id: appliedVoucher.id,
          voucher_code: appliedVoucher.code,
          customer_id: appliedVoucher.customer_id,
          transaction_id: transaction.id,
          discount_applied: discountApplied,
          redeemed_at: usedAt,
        });
      if (redemptionError) throw redemptionError;
    }

    // ─── FIX: Komisi selalu dibuat kalau ada mitra, pakai commission_pct dari DB ──
    if (mitraId && commissionPct > 0) {
      const commissionAmount = total * (commissionPct / 100);
      const { error: commissionError } = await supabase.from('commissions').insert({
        mitra_id: mitraId,
        transaction_id: transaction.id,
        amount: commissionAmount,
        status: 'pending',
      });
      if (commissionError) {
        // Non-fatal: log tapi jangan gagalkan transaksi
        console.error('[Commission] Failed to insert:', commissionError.message);
      } else {
        console.log(`[Commission] Rp ${commissionAmount} (${commissionPct}%) untuk mitra ${mitraId}`);
      }
    }
    // ──────────────────────────────────────────────────────────────────────────────

    const { data, error } = await supabase
      .from('transactions')
      .select(TRANSACTION_SELECT)
      .eq('id', transaction.id)
      .single();

    if (error) throw error;

    const mappedData = mapTransaction(data);

    // ─── Notify Admins ─────────────────────────────────────────────────────
    const { data: admins } = await supabase.from('profiles').select('id').in('role', ['super_admin', 'admin']);
    if (admins) {
      for (const admin of admins) {
        await createNotification(
          admin.id,
          'Transaksi Baru',
          `Pesanan baru ${mappedData.invoice_no} telah dibuat untuk ${mappedData.customer_name}`,
          'success'
        );
      }
    }

    // ─── Notify Mitra ──────────────────────────────────────────────────────
    if (mitraId && commissionPct > 0) {
      const { data: mitraUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('mitra_id', mitraId)
        .maybeSingle();
      if (mitraUser) {
        const commissionAmount = total * (commissionPct / 100);
        await createNotification(
          mitraUser.id,
          'Komisi Baru',
          `Komisi Rp ${commissionAmount.toLocaleString('id-ID')} dari transaksi ${mappedData.invoice_no}`,
          'info'
        );
      }
    }
    // ──────────────────────────────────────────────────────────────────────

    // ─── Award loyalty points ──────────────────────────────────────────────
    if (body.customer_id && total > 0) {
      try {
        const db = adminClient();

        const { data: settings } = await db
          .from('loyalty_settings')
          .select('points_formula, threshold_points, reward_type, reward_value, reward_min_purchase, voucher_expiry_days, active')
          .maybeSingle();

        const formula = settings?.active ? (Number(settings.points_formula) || 10000) : 10000;
        const pointsEarned = Math.floor(total / formula);

        if (pointsEarned > 0) {
          const { data: customer } = await db
            .from('customers')
            .select('name')
            .eq('id', body.customer_id)
            .maybeSingle();

          const customerName = customer?.name ?? mappedData.customer_name ?? 'Pelanggan';

          const { data: existingRows } = await db
            .from('loyalty_points')
            .select('points, type')
            .eq('customer_id', body.customer_id);

          const currentBalance = (existingRows ?? []).reduce((sum, r) => {
            return sum + (r.type === 'redeem' ? -Number(r.points) : Number(r.points));
          }, 0);

          const newBalance = currentBalance + pointsEarned;

          const { error: loyaltyError } = await db.from('loyalty_points').insert({
            id: crypto.randomUUID(),
            customer_id: body.customer_id,
            customer_name: customerName,
            points: pointsEarned,
            type: 'earn',
            description: `Transaksi ${mappedData.invoice_no}`,
            transaction_id: transaction.id,
            balance: newBalance,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

          if (loyaltyError) {
            console.error('[Loyalty] Failed to insert points:', loyaltyError.message);
          } else {
            console.log(`[Loyalty] +${pointsEarned} poin untuk ${customerName} (balance: ${newBalance})`);

            if (
              settings?.active &&
              Number(settings.threshold_points) > 0 &&
              newBalance >= Number(settings.threshold_points)
            ) {
              const { data: existingVoucher } = await db
                .from('vouchers')
                .select('id')
                .eq('customer_id', body.customer_id)
                .eq('type', 'reward')
                .eq('is_used', false)
                .maybeSingle();

              if (!existingVoucher) {
                const threshold = Number(settings.threshold_points);
                const rewardValue = Number(settings.reward_value) || 10000;
                const expiryDays = Number(settings.voucher_expiry_days) || 30;
                const expiredAt = new Date(Date.now() + expiryDays * 86400 * 1000).toISOString();

                let code = Math.random().toString(36).substring(2, 10).toUpperCase();
                let exists = true;
                while (exists) {
                  const { data: codeCheck } = await db.from('vouchers').select('id').eq('code', code).maybeSingle();
                  exists = !!codeCheck;
                  if (exists) code = Math.random().toString(36).substring(2, 10).toUpperCase();
                }

                await db.from('vouchers').insert({
                  id: crypto.randomUUID(),
                  code,
                  customer_id: body.customer_id,
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
                  customer_id: body.customer_id,
                  customer_name: customerName,
                  points: threshold,
                  type: 'redeem',
                  description: `Penukaran ${threshold} poin → Voucher ${code}`,
                  transaction_id: null,
                  balance: newBalance - threshold,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                });

                console.log(`[Loyalty] Voucher ${code} dibuat untuk ${customerName}`);
              }
            }
          }
        }
      } catch (loyaltyErr: any) {
        console.error('[Loyalty] Award error (non-fatal):', loyaltyErr?.message ?? loyaltyErr);
      }
    }
    // ──────────────────────────────────────────────────────────────────────

    return NextResponse.json({ data: mappedData }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Failed to create transaction' }, { status: 500 });
  }
}