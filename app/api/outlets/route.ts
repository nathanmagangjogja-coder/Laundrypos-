import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase.from('outlets').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ data: data ?? [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Failed to load outlets' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from('outlets')
      .insert({ name: body.name, address: body.address ?? null, phone: body.phone ?? null })
      .select('*')
      .single();
    if (error) throw error;
    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Failed to create outlet' }, { status: 500 });
  }
}
