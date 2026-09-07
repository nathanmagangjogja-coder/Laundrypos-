import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('SERVICE KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'ADA' : 'TIDAK ADA — cek .env.local!');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface SeedAccount {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  role: 'super_admin' | 'admin' | 'mitra';
  outlet_id?: string | null;
  mitra_id?: string | null;
}

const ACCOUNTS: SeedAccount[] = [
  { email: 'superadmin@laundry.id', password: 'password', fullName: 'Super Admin', phone: '081111111111', role: 'super_admin' },
  { email: 'admin@laundry.id',      password: 'password', fullName: 'Admin Pusat', phone: '082222222222', role: 'admin' },
  { email: 'mitra@laundry.id',      password: 'password', fullName: 'Mitra Sentosa', phone: '083333333333', role: 'mitra' },
];

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Retry sederhana untuk transient error (fetch failed / timeout jaringan). */
async function withRetry<T>(fn: () => Promise<T>, label: string, attempts = 3): Promise<T> {
  let lastErr: any;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      console.warn(`  ⚠ ${label} percobaan ${i}/${attempts} gagal: ${err.message ?? err}`);
      if (i < attempts) await sleep(1500 * i);
    }
  }
  throw lastErr;
}

/**
 * Strategi: coba createUser() DULUAN — tidak butuh listUsers() sama sekali.
 * listUsers() (yang lebih rawan error "Database error finding users" di
 * sebagian project Supabase) hanya dipanggil sebagai fallback kalau memang
 * emailnya sudah terdaftar.
 */
async function ensureAccount(acc: SeedAccount) {
  try {
    const { data, error } = await withRetry(
      () => supabase.auth.admin.createUser({
        email: acc.email,
        password: acc.password,
        email_confirm: true,
        user_metadata: { name: acc.fullName, role: acc.role },
      }),
      `createUser(${acc.email})`
    );

    if (error) {
      // Email sudah terdaftar → fallback: cari lewat listUsers, lalu reset password
      if (error.status === 422 || /already.*registered|already.*exists/i.test(error.message)) {
        return await resetExisting(acc);
      }
      console.error(`✗ Gagal membuat ${acc.email}: ${error.message}`);
      return;
    }

    await upsertProfile(data.user.id, acc);
    console.log(`+ ${acc.email} dibuat baru & siap dipakai (password: ${acc.password})`);
  } catch (err: any) {
    console.error(`✗ ${acc.email} — gagal total setelah beberapa percobaan: ${err.message ?? err}`);
    console.error(`  → Cek: apakah project Supabase di NEXT_PUBLIC_SUPABASE_URL aktif & tidak paused?`);
  }
}

async function resetExisting(acc: SeedAccount) {
  const { data: list, error: listError } = await withRetry(
    () => supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    `listUsers (fallback untuk ${acc.email})`
  );
  if (listError) {
    console.error(`✗ ${acc.email} sudah terdaftar, tapi gagal mencarinya untuk reset password: ${listError.message}`);
    return;
  }
  const existing = list.users.find((u) => u.email?.toLowerCase() === acc.email.toLowerCase());
  if (!existing) {
    console.error(`✗ ${acc.email} dilaporkan sudah ada tapi tidak ditemukan di listUsers — coba jalankan ulang script ini.`);
    return;
  }

  const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
    password: acc.password,
    email_confirm: true,
    user_metadata: { name: acc.fullName, role: acc.role },
  });
  if (error) {
    console.error(`✗ Gagal reset password ${acc.email}: ${error.message}`);
    return;
  }

  await upsertProfile(data.user.id, acc);
  console.log(`↻ ${acc.email} sudah ada — password direset ulang (password: ${acc.password})`);
}

async function upsertProfile(userId: string, acc: SeedAccount) {
  const { error } = await supabase.from('profiles').upsert(
    {
      id: userId,
      full_name: acc.fullName,
      phone: acc.phone,
      email: acc.email,
      role: acc.role,
      outlet_id: acc.outlet_id ?? null,
      mitra_id: acc.mitra_id ?? null,
      login_enabled: true,
    },
    { onConflict: 'id' }
  );
  if (error) console.error(`  ⚠ Profile ${acc.email} gagal disimpan: ${error.message}`);
}

async function main() {
  for (const acc of ACCOUNTS) {
    await ensureAccount(acc);
  }
  console.log('\nSelesai. Coba login dengan salah satu akun di atas.');
}

main();