'use server';

import { getCurrentUser } from '@/lib/server-auth';
import { revalidatePath } from 'next/cache';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { logActivity } from '@/lib/audit';
import type { MitraAccountInfo } from '@/types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface CreateMitraAccountInput {
  mitra_id: string;
  email: string;
  password: string;
  name: string;
}

export interface UpdateMitraAccountInput {
  user_id: string;
  email?: string;
  password?: string;
  name?: string;
}

async function assertSuperAdmin() {
  const user = await getCurrentUser();
  if (!user) throw new Error('Sesi tidak valid. Silakan login ulang.');

  if (user.role !== 'super_admin') {
    throw new Error('Akses ditolak. Hanya super admin yang diizinkan.');
  }

  return user;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function validateEmail(email: string) {
  if (!EMAIL_REGEX.test(email)) {
    throw new Error('Format email tidak valid.');
  }
}

function validatePassword(password: string) {
  if (password.trim().length < 8) {
    throw new Error('Password minimal 8 karakter.');
  }
}

async function findAuthUserByEmail(email: string) {
  const admin = createSupabaseAdmin();
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw new Error(error.message);
  return data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase()) ?? null;
}

async function getAccountInfo(userId: string): Promise<MitraAccountInfo | null> {
  const admin = createSupabaseAdmin();
  const [{ data: profile, error: profileError }, { data: authUserData, error: authError }] = await Promise.all([
    admin.from('profiles').select('id, email, full_name, login_enabled, last_login_at').eq('id', userId).single(),
    admin.auth.admin.getUserById(userId),
  ]);

  if (profileError) throw new Error(profileError.message);
  if (authError) throw new Error(authError.message);
  if (!profile) return null;

  return {
    id: profile.id,
    email: profile.email,
    name: profile.full_name,
    login_enabled: Boolean(profile.login_enabled),
    last_login_at: profile.last_login_at ?? null,
    auth_last_sign_in_at: authUserData.user.last_sign_in_at ?? null,
    banned_until: authUserData.user.banned_until ?? null,
  };
}

function revalidateMitraPaths() {
  revalidatePath('/mitra');
  revalidatePath('/users');
}

export async function registerMitra(input: { name: string; owner_name: string; email: string; phone: string; address: string }) {
  try {
    const admin = createSupabaseAdmin();
    const { error } = await admin.from('mitra').insert({
      name: input.name,
      owner_name: input.owner_name,
      email: input.email.toLowerCase(),
      phone: input.phone,
      address: input.address,
      status: 'pending',
    });

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { error: error.message ?? 'Gagal mendaftar mitra.' };
  }
}

export async function createMitraAccount(input: CreateMitraAccountInput) {
  try {
    await assertSuperAdmin();

    const admin = createSupabaseAdmin();
    const email = normalizeEmail(input.email);
    const name = input.name.trim();

    if (!input.mitra_id) throw new Error('Mitra tidak valid.');
    if (!name) throw new Error('Nama akun wajib diisi.');
    validateEmail(email);
    validatePassword(input.password);

    const { data: mitra, error: mitraError } = await admin
      .from('mitra')
      .select('id, name, has_account, user_id')
      .eq('id', input.mitra_id)
      .single();

    if (mitraError || !mitra) throw new Error('Data mitra tidak ditemukan.');
    if (mitra.has_account || mitra.user_id) throw new Error('Mitra ini sudah memiliki akun login.');

    const existingAuthUser = await findAuthUserByEmail(email);
    if (existingAuthUser) throw new Error('Email sudah digunakan oleh akun lain.');

    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password: input.password,
      email_confirm: true,
      user_metadata: {
        name,
        role: 'mitra',
        mitra_id: input.mitra_id,
      },
    });

    if (authError || !authData.user) throw new Error(authError?.message ?? 'Gagal membuat akun auth.');

    const { error: publicError } = await admin.from('profiles').upsert({
      id: authData.user.id,
      full_name: name,
      email,
      role: 'mitra',
      mitra_id: input.mitra_id,
      login_enabled: true,
      last_login_at: null,
    }, { onConflict: 'id' });

    if (publicError) {
      await admin.auth.admin.deleteUser(authData.user.id);
      throw new Error(publicError.message);
    }

    const { error: mitraUpdateError } = await admin
      .from('mitra')
      .update({ has_account: true, user_id: authData.user.id })
      .eq('id', input.mitra_id);

    if (mitraUpdateError) {
      await admin.from('profiles').delete().eq('id', authData.user.id);
      await admin.auth.admin.deleteUser(authData.user.id);
      throw new Error(mitraUpdateError.message);
    }

    revalidateMitraPaths();
    const actor = await getCurrentUser();
    await logActivity({ userId: actor?.id, action: 'create_mitra_account', tableName: 'mitra', recordId: input.mitra_id });
    return { data: await getAccountInfo(authData.user.id) };
  } catch (error: any) {
    return { error: error.message ?? 'Gagal membuat akun mitra.' };
  }
}

export async function updateMitraAccount(input: UpdateMitraAccountInput) {
  try {
    await assertSuperAdmin();

    const admin = createSupabaseAdmin();
    if (!input.user_id) throw new Error('Akun tidak valid.');

    const payload: { email?: string; password?: string; name?: string } = {};

    if (input.email !== undefined) {
      const email = normalizeEmail(input.email);
      validateEmail(email);
      const existingAuthUser = await findAuthUserByEmail(email);
      if (existingAuthUser && existingAuthUser.id !== input.user_id) {
        throw new Error('Email sudah digunakan oleh akun lain.');
      }
      payload.email = email;
    }

    if (input.password !== undefined) {
      validatePassword(input.password);
      payload.password = input.password;
    }

    if (input.name !== undefined) {
      const name = input.name.trim();
      if (!name) throw new Error('Nama akun wajib diisi.');
      payload.name = name;
    }

    if (Object.keys(payload).length === 0) {
      throw new Error('Tidak ada perubahan yang dikirim.');
    }

    const authUpdate: {
      email?: string;
      password?: string;
      user_metadata?: Record<string, unknown>;
    } = {};

    if (payload.email) authUpdate.email = payload.email;
    if (payload.password) authUpdate.password = payload.password;
    if (payload.name) authUpdate.user_metadata = { name: payload.name, role: 'mitra' };

    if (Object.keys(authUpdate).length > 0) {
      const { error: authError } = await admin.auth.admin.updateUserById(input.user_id, authUpdate);
      if (authError) throw new Error(authError.message);
    }

    const publicUpdate: Record<string, unknown> = {};
    if (payload.email) publicUpdate.email = payload.email;
    if (payload.name) publicUpdate.full_name = payload.name;

    if (Object.keys(publicUpdate).length > 0) {
      const { error: publicError } = await admin.from('profiles').update(publicUpdate).eq('id', input.user_id);
      if (publicError) throw new Error(publicError.message);
    }

    revalidateMitraPaths();
    const actor = await getCurrentUser();
    await logActivity({ userId: actor?.id, action: 'update_mitra_account', tableName: 'profiles', recordId: input.user_id });
    return { data: await getAccountInfo(input.user_id), success: true };
  } catch (error: any) {
    return { error: error.message ?? 'Gagal memperbarui akun mitra.' };
  }
}

export async function resetMitraPassword(user_id: string, new_password: string) {
  try {
    await assertSuperAdmin();
    if (!user_id) throw new Error('Akun tidak valid.');
    validatePassword(new_password);

    const admin = createSupabaseAdmin();
    const { error } = await admin.auth.admin.updateUserById(user_id, { password: new_password });
    if (error) throw new Error(error.message);

    revalidateMitraPaths();
    const actor = await getCurrentUser();
    await logActivity({ userId: actor?.id, action: 'reset_mitra_password', tableName: 'profiles', recordId: user_id });
    return { success: true };
  } catch (error: any) {
    return { error: error.message ?? 'Gagal mereset password.' };
  }
}

export async function setMitraAccountEnabled(user_id: string, enabled: boolean) {
  try {
    await assertSuperAdmin();
    if (!user_id) throw new Error('Akun tidak valid.');

    const admin = createSupabaseAdmin();
    const { error: authError } = await admin.auth.admin.updateUserById(user_id, {
      ban_duration: enabled ? 'none' : '876000h',
    });
    if (authError) throw new Error(authError.message);

    const { error: publicError } = await admin
      .from('profiles')
      .update({ login_enabled: enabled })
      .eq('id', user_id);
    if (publicError) throw new Error(publicError.message);

    revalidateMitraPaths();
    const actor = await getCurrentUser();
    await logActivity({ userId: actor?.id, action: enabled ? 'enable_mitra_account' : 'disable_mitra_account', tableName: 'profiles', recordId: user_id });
    return { data: await getAccountInfo(user_id), success: true };
  } catch (error: any) {
    return { error: error.message ?? 'Gagal mengubah status akun.' };
  }
}

export async function deleteMitraAccount(user_id: string, mitra_id: string) {
  try {
    await assertSuperAdmin();
    if (!user_id || !mitra_id) throw new Error('Data akun tidak valid.');

    const admin = createSupabaseAdmin();

    const { error: authError } = await admin.auth.admin.deleteUser(user_id);
    if (authError) throw new Error(authError.message);

    const { error: publicError } = await admin.from('profiles').delete().eq('id', user_id);
    if (publicError) throw new Error(publicError.message);

    const { error: mitraError } = await admin
      .from('mitra')
      .update({ has_account: false, user_id: null })
      .eq('id', mitra_id);
    if (mitraError) throw new Error(mitraError.message);

    revalidateMitraPaths();
    const actor = await getCurrentUser();
    await logActivity({ userId: actor?.id, action: 'delete_mitra_account', tableName: 'mitra', recordId: mitra_id });
    return { success: true };
  } catch (error: any) {
    return { error: error.message ?? 'Gagal menghapus akun mitra.' };
  }
}
