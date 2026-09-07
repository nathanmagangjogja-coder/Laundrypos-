import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from('vouchers')
      .select('*')
      .eq('customer_id', params.id)
      .eq('is_used', false)
      .gt('expired_at', new Date().toISOString())
      .order('expired_at', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Failed to load vouchers' }, { status: 500 });
  }
}
