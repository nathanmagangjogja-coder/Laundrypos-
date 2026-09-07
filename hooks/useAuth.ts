'use client';
import { useSession, signOut } from 'next-auth/react';
import { useMemo } from 'react';
import type { User } from '@/types';

export function useAuth() {
  const { data: session, status } = useSession();
  
  const user = useMemo(() => {
    if (!session?.user) return null;
    return {
      id: (session.user as any).id,
      email: session.user.email,
      name: session.user.name,
      role: (session.user as any).role,
      outlet_id: (session.user as any).outlet_id,
      mitra_id: (session.user as any).mitra_id,
    } as User;
  }, [session]);

  return { 
    user, 
    loading: status === 'loading',
    isAuthenticated: status === 'authenticated'
  };
}

export function logout() {
  signOut({ callbackUrl: '/login' });
}
