import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const name = String(body.name ?? '').trim();
    const phone = String(body.phone ?? '').replace(/\D/g, '');

    if (!name || !phone) {
      return NextResponse.json({ error: 'Nama dan No. HP wajib diisi' }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();

    // Cek duplikasi terhadap customer lain (selain dirinya sendiri)
    const { data: existing, error: checkError } = await supabase
      .from('customers')
      .select('id, name, phone')
      .eq('phone', phone)
      .neq('id', params.id);

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
      .update({
        name,
        phone,
        address: body.address ?? null,
      })
      .eq('id', params.id)
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Failed to update customer' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createSupabaseAdmin();
    const { error } = await supabase.from('customers').delete().eq('id', params.id);

    if (error) throw error;

    return NextResponse.json({ data: { id: params.id } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Failed to delete customer' }, { status: 500 });
  }
}
