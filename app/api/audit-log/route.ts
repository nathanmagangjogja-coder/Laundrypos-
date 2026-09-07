import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (user?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get('limit') ?? 100);

    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from('activity_logs')
      .select('id, user_id, action, table_name, record_id, created_at')
      .order('created_at', { ascending: false })
      .limit(Math.min(limit, 500));

    if (error) throw error;

    const userIds = Array.from(new Set((data ?? []).map((r) => r.user_id).filter(Boolean)));
    let profilesById: Record<string, { full_name: string | null; email: string | null }> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds as string[]);
      profilesById = Object.fromEntries((profiles ?? []).map((p) => [p.id, { full_name: p.full_name, email: p.email }]));
    }

    const rows = (data ?? []).map((r) => ({
      ...r,
      user_name: r.user_id ? profilesById[r.user_id]?.full_name ?? profilesById[r.user_id]?.email ?? 'Tidak diketahui' : 'Sistem',
    }));

    return NextResponse.json({ data: rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
