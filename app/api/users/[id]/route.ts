import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/server-auth';
import { logActivity } from '@/lib/audit';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const actor = await getCurrentUser();
    if (actor?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Hanya Super Admin yang bisa mengubah user.' }, { status: 403 });
    }

    const body = await req.json();
    const supabase = createSupabaseAdmin();
    const authUpdate: Record<string, unknown> = {
      email: body.email,
      user_metadata: { name: body.name, role: body.role },
    };
    if (body.password && body.password.trim().length >= 6) {
      authUpdate.password = body.password;
    }
    const { error: authError } = await supabase.auth.admin.updateUserById(params.id, authUpdate);
    if (authError) throw authError;

    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name: body.name,
        email: body.email,
        role: body.role,
        outlet_id: body.outlet_id ?? null,
        mitra_id: body.mitra_id ?? null,
        avatar_url: body.avatar_url ?? null,
      })
      .eq('id', params.id)
      .select('*')
      .single();

    if (error) throw error;

    await logActivity({ userId: actor?.id, action: 'update_user', tableName: 'profiles', recordId: params.id });

    return NextResponse.json({ data: { ...data, name: data.full_name } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const actor = await getCurrentUser();
    if (actor?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Hanya Super Admin yang bisa menghapus user.' }, { status: 403 });
    }
    if (actor.id === params.id) {
      return NextResponse.json({ error: 'Tidak bisa menghapus akun sendiri.' }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();
    const { error } = await supabase.from('profiles').delete().eq('id', params.id);

    if (error) throw error;

    const { error: authError } = await supabase.auth.admin.deleteUser(params.id);
    if (authError) throw authError;

    await logActivity({ userId: actor?.id, action: 'delete_user', tableName: 'profiles', recordId: params.id });

    return NextResponse.json({ data: { id: params.id } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Failed to delete user' }, { status: 500 });
  }
}