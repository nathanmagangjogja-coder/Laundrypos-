import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

function mapMitra(row: any) {
  return { ...row, commission_pct: Number(row.commission_pct ?? 0) };
}

export async function GET() {
  try {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase.from('mitra').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ data: (data ?? []).map(mapMitra) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Failed to load mitra' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from('mitra')
      .insert({
        name: body.name,
        owner_name: body.owner_name ?? null,
        phone: body.phone ?? null,
        email: body.email || null,
        address: body.address ?? null,
        commission_pct: Number(body.commission_pct ?? 10),
        status: body.status ?? 'pending',
      })
      .select('*')
      .single();
    if (error) throw error;
    return NextResponse.json({ data: mapMitra(data) }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Failed to create mitra' }, { status: 500 });
  }
}
