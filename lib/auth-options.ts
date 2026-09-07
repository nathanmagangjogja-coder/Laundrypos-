import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) return null;

          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

          if (!supabaseUrl || !supabaseAnonKey) {
            console.error('Auth Error: Missing Supabase environment variables');
            return null;
          }

          const authClient = createClient(
            supabaseUrl,
            supabaseAnonKey,
            { auth: { persistSession: false, autoRefreshToken: false } }
          );

          const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });

          if (authError || !authData.user) return null;

          const admin = createSupabaseAdmin();
          const { data: profile, error: profileError } = await admin
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

          if (profileError || !profile) return null;

          if (profile.login_enabled === false) return null;

          await admin
            .from('profiles')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', authData.user.id);

          return {
            id: profile.id,
            email: profile.email ?? authData.user.email,
            name: profile.full_name,
            role: profile.role,
            outlet_id: profile.outlet_id ?? null,
            mitra_id: profile.mitra_id ?? null,
          };
        } catch (error) {
          console.error('Auth authorize error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.outlet_id = (user as any).outlet_id ?? null;
        token.mitra_id = (user as any).mitra_id ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).outlet_id = token.outlet_id ?? null;
        (session.user as any).mitra_id = token.mitra_id ?? null;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};