import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

function mapMitra(row: any) {
  return { ...row, commission_pct: Number(row.commission_pct ?? 0) };
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from('mitra')
      .update({
        name: body.name,
        owner_name: body.owner_name,
        phone: body.phone,
        email: body.email || null,
        address: body.address,
        commission_pct: body.commission_pct === undefined ? undefined : Number(body.commission_pct),
        status: body.status,
      })
      .eq('id', params.id)
      .select('*')
      .single();
    if (error) throw error;
    return NextResponse.json({ data: mapMitra(data) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Failed to update mitra' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createSupabaseAdmin();
    const { error } = await supabase.from('mitra').delete().eq('id', params.id);
    if (error) throw error;
    return NextResponse.json({ data: { id: params.id } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Failed to delete mitra' }, { status: 500 });
  }
}
