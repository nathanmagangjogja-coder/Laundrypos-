import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/server-auth';
import { generateVoucherCode } from '@/lib/loyalty-store';
import type { Voucher } from '@/types';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      customerId, 
      customerName, 
      type, 
      title, 
      description, 
      discountAmount, 
      minimumOrder, 
      daysValid 
    } = body;

    if (!customerId || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();
    
    // Generate unique code on server side
    let code = generateVoucherCode();
    let exists = true;
    while (exists) {
      const { data } = await supabase
        .from('vouchers')
        .select('id')
        .eq('code', code)
        .maybeSingle();
      if (!data) exists = false;
      else code = generateVoucherCode();
    }

    const expired = new Date();
    expired.setDate(expired.getDate() + (daysValid || 30));

    const voucher: Partial<Voucher> = {
      id: crypto.randomUUID(),
      code,
      customer_id: customerId,
      customer_name: customerName,
      mitra_id: user.mitra_id || undefined, // Use mitra_id from session
      transaction_id: null,
      type: type || 'discount',
      title,
      description: description || '',
      points: 0,
      discount_amount: discountAmount || 0,
      minimum_order: minimumOrder || 0,
      expired_at: expired.toISOString(),
      is_used: false,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('vouchers')
      .insert(voucher)
      .select()
      .single();

    if (error) {
      console.error('[CREATE_VOUCHER_ERROR]:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('[VOUCHERS_POST_ERROR]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
