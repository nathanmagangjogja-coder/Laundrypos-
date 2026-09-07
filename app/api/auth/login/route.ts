import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const { data: authData, error: authError } =
      await authClient.auth.signInWithPassword({ email, password });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: 'Email atau password salah' },
        { status: 401 }
      );
    }

    const admin = createSupabaseAdmin();

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: 'Profil tidak ditemukan' },
        { status: 404 }
      );
    }

    if (
      profile &&
      Object.prototype.hasOwnProperty.call(profile, 'login_enabled') &&
      profile.login_enabled === false
    ) {
      await authClient.auth.signOut();
      return NextResponse.json(
        { error: 'Akun Anda telah dinonaktifkan.' },
        { status: 403 }
      );
    }

    const lastLoginAt =
      authData.user.last_sign_in_at ?? new Date().toISOString();

    const { data: updatedProfile } = await admin
      .from('profiles')
      .update({ last_login_at: lastLoginAt })
      .eq('id', authData.user.id)
      .select('*')
      .single();

    return NextResponse.json({
      user: updatedProfile ?? profile,
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: error.message ?? 'Login gagal' },
      { status: 500 }
    );
  }
}