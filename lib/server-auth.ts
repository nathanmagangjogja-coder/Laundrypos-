import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import type { User } from '@/types';

export async function getCurrentUser(): Promise<User | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  return {
    id: (session.user as any).id,
    email: session.user.email,
    name: session.user.name,
    role: (session.user as any).role,
    outlet_id: (session.user as any).outlet_id,
    mitra_id: (session.user as any).mitra_id,
  } as User;
}

export function isSuperAdmin(user: User | null) {
  return user?.role === 'super_admin';
}
