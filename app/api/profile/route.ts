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
      .from('profiles')
      .select('id, email, full_name, phone, role, outlet_id, mitra_id, created_at')
      .eq('id', (session.user as any).id)
      .single();

    if (error) throw error;

    const profileData = {
      ...data,
      name: data.full_name,
      phone: (data as any).phone || '',
    };

    return NextResponse.json({ data: profileData });
  } catch (error) {
    console.error('[PROFILE_GET_ERROR]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const admin = createSupabaseAdmin();

    const updateData: any = {
      full_name: body.name,
    };

    if (body.phone !== undefined) {
      updateData.phone = body.phone;
    }

    const { error } = await admin
      .from('profiles')
      .update(updateData)
      .eq('id', (session.user as any).id);

    if (error) throw error;

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error('[PROFILE_PATCH_ERROR]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
