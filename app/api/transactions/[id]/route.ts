// @version-check: v3-attachStaffNames-fix
import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { TRANSACTION_SELECT, mapTransaction, attachStaffNames } from '@/lib/supabase/transactions';
import { getCurrentUser } from '@/lib/server-auth';

function applyTransactionScope(query: any, user: any) {
  if (user?.role === 'mitra') {
    if (!user.mitra_id) return null;
    return query.eq('mitra_id', user.mitra_id);
  }
  if (user?.role === 'admin' && user.outlet_id) return query.eq('outlet_id', user.outlet_id);
  return query;
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createSupabaseAdmin();
    const user = await getCurrentUser();

    const baseQuery = supabase
      .from('transactions')
      .select(TRANSACTION_SELECT)
      .eq('id', params.id);

    const scopedQuery = applyTransactionScope(baseQuery, user);
    if (scopedQuery === null) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { data, error } = await scopedQuery.single();
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 });
      }
      throw error;
    }

    const trx: any = mapTransaction(data);

    // Resolve nama staf untuk histori "Diterima / Diproses / Diselesaikan oleh"
    const [trxWithNames] = await attachStaffNames([trx], supabase);

    return NextResponse.json({ data: trxWithNames });
  } catch (error: any) {
    console.error('[GET /api/transactions/[id]]', error);
    return NextResponse.json({ error: error.message ?? 'Failed to load transaction' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();

    // Mitra tidak boleh update transaksi — read only
    if (user?.role === 'mitra') {
      return NextResponse.json({ error: 'Mitra tidak diizinkan mengubah transaksi' }, { status: 403 });
    }

    const body = await req.json();
    const supabase = createSupabaseAdmin();

    const allowedFields = [
      'status', 'payment_status', 'paid', 'notes',
      'est_done_at', 'mitra_id', 'outlet_id', 'total',
    ];

    const patch: Record<string, any> = { updated_at: new Date().toISOString() };
    for (const field of allowedFields) {
      if (body[field] !== undefined) patch[field] = body[field];
    }

    // ─── Auto-catat siapa memproses / menyelesaikan, sekali saja (transisi pertama) ──
    if (patch.status && user?.id) {
      const { data: current } = await supabase
        .from('transactions')
        .select('status, processed_by, completed_by')
        .eq('id', params.id)
        .maybeSingle();

      if (current) {
        const enteringProcessing = ['dicuci', 'disetrika'].includes(patch.status);
        const enteringCompleted  = ['selesai', 'diambil'].includes(patch.status);

        if (enteringProcessing && !current.processed_by) {
          patch.processed_by = user.id;
        }
        if (enteringCompleted && !current.completed_by) {
          patch.completed_by = user.id;
        }
      }
    }
    // ──────────────────────────────────────────────────────────────────────────────

    let updateQuery = supabase.from('transactions').update(patch).eq('id', params.id);

    // Admin hanya bisa update transaksi di outletnya sendiri
    if (user?.role === 'admin' && user.outlet_id) {
      updateQuery = updateQuery.eq('outlet_id', user.outlet_id);
    }

    const { error: updateError } = await updateQuery;
    if (updateError) throw updateError;

    const { data, error: fetchError } = await supabase
      .from('transactions')
      .select(TRANSACTION_SELECT)
      .eq('id', params.id)
      .single();

    if (fetchError) throw fetchError;

    return NextResponse.json({ data: mapTransaction(data) });
  } catch (error: any) {
    console.error('[PATCH /api/transactions/[id]]', error);
    return NextResponse.json({ error: error.message ?? 'Failed to update transaction' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();

    // Hanya super_admin yang boleh hapus transaksi
    if (user?.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Hanya super admin yang dapat menghapus transaksi' },
        { status: 403 }
      );
    }

    const supabase = createSupabaseAdmin();
    const { error } = await supabase.from('transactions').delete().eq('id', params.id);
    if (error) throw error;

    return NextResponse.json({ data: { id: params.id } });
  } catch (error: any) {
    console.error('[DELETE /api/transactions/[id]]', error);
    return NextResponse.json({ error: error.message ?? 'Failed to delete transaction' }, { status: 500 });
  }
}