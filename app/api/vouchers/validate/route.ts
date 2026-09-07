import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const customerId = searchParams.get('customer_id');

    if (!code || !customerId) {
      return NextResponse.json({ error: 'Code and customer_id are required' }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();
    const { data: voucher, error } = await supabase
      .from('vouchers')
      .select('*')
      .eq('code', code.toUpperCase())
      .maybeSingle();

    if (error) throw error;
    if (!voucher) {
      return NextResponse.json({ error: 'Voucher tidak ditemukan' }, { status: 404 });
    }

    if (voucher.is_used) {
      return NextResponse.json({ error: 'Voucher sudah digunakan' }, { status: 400 });
    }

    if (voucher.customer_id !== customerId) {
      return NextResponse.json({ error: 'Voucher bukan milik customer ini' }, { status: 400 });
    }

    if (new Date(voucher.expired_at) < new Date()) {
      return NextResponse.json({ error: 'Voucher sudah kadaluarsa' }, { status: 400 });
    }

    return NextResponse.json({ data: voucher });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Validation failed' }, { status: 500 });
  }
}
