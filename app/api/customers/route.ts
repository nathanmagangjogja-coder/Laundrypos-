import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data: data ?? [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Failed to load customers' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body.name ?? '').trim();
    const phone = String(body.phone ?? '').replace(/\D/g, '');

    if (!name || !phone) {
      return NextResponse.json({ error: 'Nama dan No. HP wajib diisi' }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();

    // Cek duplikasi: nama + nomor HP yang sama tidak boleh didaftarkan dua kali
    const { data: existing, error: checkError } = await supabase
      .from('customers')
      .select('id, name, phone')
      .eq('phone', phone);

    if (checkError) throw checkError;

    const isDuplicate = (existing ?? []).some(
      (c: any) => String(c.name ?? '').trim().toLowerCase() === name.toLowerCase()
    );

    if (isDuplicate) {
      return NextResponse.json(
        { error: 'Customer dengan nama dan nomor HP yang sama sudah terdaftar.' },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from('customers')
      .insert({
        name,
        phone,
        address: body.address ?? null,
      })
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Failed to create customer' }, { status: 500 });
  }
}
