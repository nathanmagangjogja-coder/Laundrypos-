import type { Role } from '@/types';

export interface HardcodedAccount {
  id: string;
  email: string;
  password: string;
  name: string;
  role: Role;
  outlet_id: string | null;
  mitra_id: string | null;
}

export interface HardcodedAccountProfile {
  id: string;
  email: string;
  full_name: string;
  name: string;
  role: Role;
  outlet_id: string | null;
  mitra_id: string | null;
  login_enabled: boolean;
  last_login_at: string;
  created_at: string;
}

export const HARDCODED_ACCOUNTS: HardcodedAccount[] = [
  {
    id: 'u1',
    email: 'superadmin@laundry.id',
    password: 'password',
    name: 'Super Admin',
    role: 'super_admin',
    outlet_id: null,
    mitra_id: null,
  },
  {
    id: 'u2',
    email: 'admin@laundry.id',
    password: 'password',
    name: 'Admin Pusat',
    role: 'admin',
    outlet_id: 'o1',
    mitra_id: null,
  },
  {
    id: 'u3',
    email: 'mitra@laundry.id',
    password: 'password',
    name: 'Mitra Sentosa',
    role: 'mitra',
    outlet_id: null,
    mitra_id: 'm1',
  },
];

export function findHardcodedAccount(
  email: string,
  password: string
): HardcodedAccount | null {
  const acc = HARDCODED_ACCOUNTS.find(
    (a) => a.email === email && a.password === password
  );
  return acc ?? null;
}

export function toProfile(acc: HardcodedAccount): HardcodedAccountProfile {
  return {
    id: acc.id,
    email: acc.email,
    full_name: acc.name,
    name: acc.name,
    role: acc.role,
    outlet_id: acc.outlet_id,
    mitra_id: acc.mitra_id,
    login_enabled: true,
    last_login_at: new Date().toISOString(),
    created_at: '2024-01-01',
  };
}

export function toNextAuthUser(acc: HardcodedAccount) {
  return {
    id: acc.id,
    email: acc.email,
    name: acc.name,
    role: acc.role,
    outlet_id: acc.outlet_id,
    mitra_id: acc.mitra_id,
  };
}
