import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from('outlets')
      .update({ name: body.name, address: body.address ?? null, phone: body.phone ?? null })
      .eq('id', params.id)
      .select('*')
      .single();
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Failed to update outlet' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createSupabaseAdmin();
    const { error } = await supabase.from('outlets').delete().eq('id', params.id);
    if (error) throw error;
    return NextResponse.json({ data: { id: params.id } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Failed to delete outlet' }, { status: 500 });
  }
}
