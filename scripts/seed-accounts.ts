import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

// =====================================================
// ENVIRONMENT
// =====================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error(
    'NEXT_PUBLIC_SUPABASE_URL belum ada di .env.local'
  );
}

if (!serviceRoleKey) {
  throw new Error(
    'SUPABASE_SERVICE_ROLE_KEY belum ada di .env.local'
  );
}

// =====================================================
// SUPABASE CLIENT
// =====================================================
// ws diperlukan karena project menggunakan Node.js 20.
// Node.js 20 belum menyediakan WebSocket native yang
// dibutuhkan Supabase Realtime.
// =====================================================

const supabase = createClient(
  supabaseUrl,
  serviceRoleKey,
  {
    realtime: {
      transport: ws,
    },
  }
);

// =====================================================
// DATA SEED
// =====================================================

const OUTLET_ID = '00000000-0000-0000-0000-000000000001';
const MITRA_ID = '00000000-0000-0000-0000-000000000002';

const OUTLET_NAME = 'Outlet Pusat';

const MITRA_DATA = {
  id: MITRA_ID,
  name: 'Mitra Sentosa',
  phone: '081234567890',
  address: 'Alamat Mitra',
};

// =====================================================
// ACCOUNT DATA
// =====================================================

const ACCOUNTS = [
  {
    email: 'superadmin@laundry.id',
    password: 'password',
    full_name: 'Super Admin',
    role: 'super_admin',
  },
  {
    email: 'admin@laundry.id',
    password: 'password',
    full_name: 'Admin Laundry',
    role: 'admin',
  },
  {
    email: 'mitra@laundry.id',
    password: 'password',
    full_name: 'Mitra Laundry',
    role: 'mitra',
  },
];

// =====================================================
// HELPER: CREATE OR UPDATE AUTH USER
// =====================================================

async function createOrUpdateAuthUser(account: {
  email: string;
  password: string;
  full_name: string;
  role: string;
}) {
  console.log(`\n🔍 Memeriksa akun: ${account.email}`);

  // ---------------------------------------------------
  // Cari user berdasarkan email
  // ---------------------------------------------------

  let existingUser = null;

  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } =
      await supabase.auth.admin.listUsers({
        page,
        perPage,
      });

    if (error) {
      throw new Error(
        `Gagal mengambil daftar user: ${error.message}`
      );
    }

    const found = data.users.find(
      (user) =>
        user.email?.toLowerCase() ===
        account.email.toLowerCase()
    );

    if (found) {
      existingUser = found;
      break;
    }

    if (data.users.length < perPage) {
      break;
    }

    page++;
  }

  // ---------------------------------------------------
  // Jika user sudah ada → update
  // ---------------------------------------------------

  if (existingUser) {
    console.log(`♻️ User sudah ada: ${account.email}`);

    const { data, error } =
      await supabase.auth.admin.updateUserById(
        existingUser.id,
        {
          password: account.password,
          email_confirm: true,
          user_metadata: {
            full_name: account.full_name,
            role: account.role,
          },
        }
      );

    if (error) {
      throw new Error(
        `Gagal update user ${account.email}: ${error.message}`
      );
    }

    console.log(`✅ User diperbarui: ${account.email}`);

    return data.user;
  }

  // ---------------------------------------------------
  // Jika belum ada → buat user baru
  // ---------------------------------------------------

  console.log(`➕ Membuat user baru: ${account.email}`);

  const { data, error } =
    await supabase.auth.admin.createUser({
      email: account.email,
      password: account.password,
      email_confirm: true,
      user_metadata: {
        full_name: account.full_name,
        role: account.role,
      },
    });

  if (error) {
    throw new Error(
      `Gagal membuat user ${account.email}: ${error.message}`
    );
  }

  if (!data.user) {
    throw new Error(
      `User ${account.email} berhasil dibuat tetapi data user kosong`
    );
  }

  console.log(`✅ User berhasil dibuat: ${account.email}`);

  return data.user;
}

// =====================================================
// CREATE / UPDATE OUTLET
// =====================================================

async function seedOutlet() {
  console.log('\n🏪 Menyiapkan outlet...');

  const { data, error } = await supabase
    .from('outlets')
    .upsert(
      {
        id: OUTLET_ID,
        name: OUTLET_NAME,
      },
      {
        onConflict: 'id',
      }
    )
    .select()
    .single();

  if (error) {
    throw new Error(
      `Gagal membuat outlet: ${error.message}`
    );
  }

  console.log(`✅ Outlet siap: ${data.name}`);

  return data;
}

// =====================================================
// CREATE / UPDATE MITRA
// =====================================================

async function seedMitra() {
  console.log('\n🤝 Menyiapkan mitra...');

  const { data, error } = await supabase
    .from('mitra')
    .upsert(
      {
        id: MITRA_DATA.id,
        name: MITRA_DATA.name,
        phone: MITRA_DATA.phone,
        address: MITRA_DATA.address,
      },
      {
        onConflict: 'id',
      }
    )
    .select()
    .single();

  if (error) {
    throw new Error(
      `Gagal membuat mitra: ${error.message}`
    );
  }

  console.log(`✅ Mitra siap: ${data.name}`);

  return data;
}

// =====================================================
// CREATE / UPDATE PROFILE
// =====================================================

async function seedProfile(
  user: {
    id: string;
    email?: string;
  },
  account: {
    full_name: string;
    role: string;
  }
) {
  console.log(`👤 Menyiapkan profile: ${account.full_name}`);

  const profileData: Record<string, any> = {
    id: user.id,
    full_name: account.full_name,
    email: user.email ?? null,
    role: account.role,
    outlet_id: OUTLET_ID,
  };

  // ---------------------------------------------------
  // Untuk akun mitra
  // ---------------------------------------------------

  if (account.role === 'mitra') {
    profileData.mitra_id = MITRA_ID;
  }

  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      profileData,
      {
        onConflict: 'id',
      }
    )
    .select()
    .single();

  if (error) {
    throw new Error(
      `Gagal membuat profile ${account.full_name}: ${error.message}`
    );
  }

  console.log(
    `✅ Profile siap: ${account.full_name} (${account.role})`
  );

  return data;
}

// =====================================================
// MAIN SEED
// =====================================================

async function main() {
  console.log('');
  console.log('==============================================');
  console.log('🚀 LAUNDRY POS - DATABASE SEED');
  console.log('==============================================');
  console.log('');
  console.log('Supabase URL:', supabaseUrl);
  console.log('');

  // ---------------------------------------------------
  // 1. Outlet
  // ---------------------------------------------------

  await seedOutlet();

  // ---------------------------------------------------
  // 2. Mitra
  // ---------------------------------------------------

  await seedMitra();

  // ---------------------------------------------------
  // 3. Auth Users + Profiles
  // ---------------------------------------------------

  for (const account of ACCOUNTS) {
    const user = await createOrUpdateAuthUser(account);

    await seedProfile(user, account);
  }

  // ---------------------------------------------------
  // SELESAI
  // ---------------------------------------------------

  console.log('');
  console.log('==============================================');
  console.log('🎉 SEED SELESAI');
  console.log('==============================================');
  console.log('');

  console.log('Akun yang tersedia:');
  console.log('');

  console.log('1. SUPER ADMIN');
  console.log('   Email    : superadmin@laundry.id');
  console.log('   Password : password');
  console.log('');

  console.log('2. ADMIN');
  console.log('   Email    : admin@laundry.id');
  console.log('   Password : password');
  console.log('');

  console.log('3. MITRA');
  console.log('   Email    : mitra@laundry.id');
  console.log('   Password : password');
  console.log('');

  console.log('🏪 Outlet  :', OUTLET_NAME);
  console.log('🤝 Mitra   :', MITRA_DATA.name);
  console.log('');
}

// =====================================================
// RUN
// =====================================================

main().catch((error) => {
  console.error('');
  console.error('==============================================');
  console.error('❌ SEED GAGAL');
  console.error('==============================================');
  console.error('');
  console.error(error);
  console.error('');

  process.exit(1);
});
