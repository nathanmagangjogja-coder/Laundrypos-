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

export async function GET() {
  try {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase.from('services').select('*').order('name');
    if (error) throw error;
    return NextResponse.json({ data: (data ?? []).map(mapService) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Failed to load services' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from('services')
      .insert({
        name: body.name,
        unit: body.unit,
        price: Number(body.price ?? 0),
        est_hours: Number(body.est_hours ?? 24),
        active: body.active ?? true,
      })
      .select('*')
      .single();
    if (error) throw error;
    return NextResponse.json({ data: mapService(data) }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Failed to create service' }, { status: 500 });
  }
}
