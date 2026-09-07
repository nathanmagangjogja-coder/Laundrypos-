import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { TRANSACTION_SELECT, mapTransaction } from '@/lib/supabase/transactions';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from('transactions')
    .select(TRANSACTION_SELECT)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []).map(mapTransaction).map(({ details, ...rest }) => rest);
  const headers = Object.keys(rows[0] ?? {});
  const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => JSON.stringify((r as any)[h] ?? '')).join(','))].join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename=laporan.csv',
    },
  });
}
