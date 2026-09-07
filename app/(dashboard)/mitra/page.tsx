import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { MitraClient } from '@/components/mitra/MitraClient';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/server-auth';
import type { MitraWithAccount } from '@/types';

function mapMitra(row: any) {
  return {
    ...row,
    commission_pct: Number(row.commission_pct ?? 0),
    has_account: Boolean(row.has_account),
  };
}

async function assertSuperAdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?from=/mitra');
  if (user.role !== 'super_admin') redirect('/dashboard');
}

export default async function MitraPage() {
  await assertSuperAdminPage();

  const admin = createSupabaseAdmin();
  const { data: mitraRows, error: mitraError } = await admin
    .from('mitra')
    .select('*')
    .order('created_at', { ascending: false });

  if (mitraError) {
    throw new Error(mitraError.message);
  }

  const mitra = (mitraRows ?? []).map(mapMitra);
  const userIds = mitra.map((item) => item.user_id).filter(Boolean) as string[];

  const publicUsers = userIds.length > 0
    ? await admin.from('profiles').select('id, email, full_name, login_enabled, last_login_at').in('id', userIds)
    : { data: [], error: null };

  if (publicUsers.error) {
    throw new Error(publicUsers.error.message);
  }

  const authUsersResponse = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (authUsersResponse.error) {
    throw new Error(authUsersResponse.error.message);
  }

  const publicUsersById = new Map((publicUsers.data ?? []).map((item) => [item.id, item]));
  const authUsersById = new Map(authUsersResponse.data.users.map((item) => [item.id, item]));

  const rows: MitraWithAccount[] = mitra.map((item) => {
    const publicUser = item.user_id ? publicUsersById.get(item.user_id) : null;
    const authUser = item.user_id ? authUsersById.get(item.user_id) : null;

    return {
      ...item,
      account: publicUser ? {
        id: publicUser.id,
        email: publicUser.email,
        name: publicUser.full_name,
        login_enabled: publicUser.login_enabled !== false,
        last_login_at: publicUser.last_login_at ?? null,
        auth_last_sign_in_at: authUser?.last_sign_in_at ?? null,
        banned_until: authUser?.banned_until ?? null,
      } : null,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Akun Mitra"
        description="Kelola akses login mitra: buat akun, ubah email, reset password, dan nonaktifkan akses."
      />
      <MitraClient initialMitra={rows} />
    </div>
  );
}
