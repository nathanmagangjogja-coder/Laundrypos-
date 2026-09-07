import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createSupabaseAdmin();
    const { data, error } = await admin
      .from('notifications')
      .select('*')
      .eq('user_id', (session.user as any).id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) {
    console.error('[NOTIFICATIONS_GET_ERROR]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ids } = await req.json();
    const admin = createSupabaseAdmin();
    const query = admin
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', (session.user as any).id);

    if (ids && Array.isArray(ids)) {
      query.in('id', ids);
    }

    const { error } = await query;
    if (error) throw error;

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error('[NOTIFICATIONS_PATCH_ERROR]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
