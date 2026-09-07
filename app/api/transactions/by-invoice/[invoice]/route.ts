import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { TRANSACTION_SELECT, mapTransaction, attachStaffNames } from '@/lib/supabase/transactions';

export async function GET(_: Request, { params }: { params: { invoice: string } }) {
  try {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from('transactions')
      .select(TRANSACTION_SELECT)
      .eq('invoice_no', decodeURIComponent(params.invoice))
      .single();

    if (error) throw error;

    const [withStaff] = await attachStaffNames([data], supabase);
    return NextResponse.json({ data: mapTransaction(withStaff) });
  } catch (error: any) {
    const status = error.code === 'PGRST116' ? 404 : 500;
    return NextResponse.json({ error: error.message ?? 'Failed to load transaction' }, { status });
  }
}