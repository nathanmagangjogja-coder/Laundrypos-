import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

function mapService(row: any) {
  return {
    ...row,
    price: Number(row.price ?? 0),
    est_hours: Number(row.est_hours ?? 24),
    active: Boolean(row.active),
  };
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from('services')
      .update(body)
      .eq('id', params.id)
      .select('*')
      .single();
    if (error) throw error;
    return NextResponse.json({ data: mapService(data) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Failed to update service' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createSupabaseAdmin();
    const { error } = await supabase.from('services').delete().eq('id', params.id);
    if (error) throw error;
    return NextResponse.json({ data: { id: params.id } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Failed to delete service' }, { status: 500 });
  }
}
