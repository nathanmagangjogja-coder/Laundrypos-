import { dummyUsers } from '@/constants/dummy';
import type { User } from '@/types';

const USE_DUMMY = (process.env.NEXT_PUBLIC_USE_DUMMY ?? 'true') === 'true';

export type SignInResult = { data?: User; error?: string };

export async function signIn(email: string, password: string): Promise<SignInResult> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      const body = await res.json();
      return { data: body.data };
    }

    const body = await res.json().catch(() => ({ error: 'Email atau password salah' }));
    return { error: body.error ?? 'Email atau password salah' };
  } catch {}

  if (USE_DUMMY) {
    if (password !== 'password') return { error: 'Email atau password salah' };
    const user = dummyUsers.find((u) => u.email === email) ?? null;
    return user ? { data: user } : { error: 'Email atau password salah' };
  }

  return { error: 'Email atau password salah' };
}
