import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/server-auth';
import { logActivity } from '@/lib/audit';

async function ensureAuthUser(email: string, password: string, metadata: Record<string, string>) {
  const supabase = createSupabaseAdmin();
  const { data: listed, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) throw listError;

  const existing = listed.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
  if (existing) {
    const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
      password,
      user_metadata: metadata,
    });
    if (error) throw error;
    return data.user.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: metadata,
  });
  if (error) throw error;
  return data.user.id;
}

export async function GET() {
  try {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const mapped = (data ?? []).map((row: any) => ({ ...row, name: row.full_name }));

    return NextResponse.json({ data: mapped });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Failed to load users' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const actor = await getCurrentUser();
    if (actor?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Hanya Super Admin yang bisa menambah user.' }, { status: 403 });
    }

    const body = await req.json();
    const supabase = createSupabaseAdmin();
    const role = body.role ?? 'admin';
    const authUserId = await ensureAuthUser(body.email, body.password || 'password', {
      name: body.name,
      role,
    });

    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: authUserId,
        full_name: body.name,
        email: body.email,
        role,
        outlet_id: body.outlet_id ?? null,
        mitra_id: body.mitra_id ?? null,
        avatar_url: body.avatar_url ?? null,
        login_enabled: true,
      }, { onConflict: 'id' })
      .select('*')
      .single();

    if (error) throw error;

    await logActivity({ userId: actor?.id, action: 'create_user', tableName: 'profiles', recordId: data.id });

    return NextResponse.json({ data: { ...data, name: data.full_name } }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Failed to create user' }, { status: 500 });
  }
}