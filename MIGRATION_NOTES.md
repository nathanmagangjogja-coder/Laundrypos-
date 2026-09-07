# Catatan Unifikasi Database & Perbaikan Auth

## Apa yang berubah

### 1. Migration baru (`supabase/migrations/`)
File lama dipindah ke `supabase/migrations_old_backup/` (tidak dihapus, buat referensi).
Migration baru menyatukan skema live (`tenants`, `profiles`, `mitra`, dst) dengan fitur dari
migration lama yang belum diterapkan ke DB live (loyalty, voucher, notifications, settings):

- `001_unified_schema.sql` — semua tabel + kolom yang dibutuhkan (aman dijalankan berkali-kali,
  pakai `IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS`, **tidak menghapus data**).
- `002_functions_triggers.sql` — trigger `updated_at`, trigger auto-buat baris `profiles` saat
  ada user baru di `auth.users`, dan fungsi `process_loyalty_points` (poin & voucher otomatis).
- `003_rls_policies.sql` — Row Level Security dasar (permisif, sesuaikan lagi nanti).
- `004_backfill.sql` — isi `profiles.email` dari `auth.users` untuk akun yang sudah ada.

### 2. Kolom yang ditambahkan ke tabel live
- `profiles`: `email`, `login_enabled`, `last_login_at`
- `mitra`: `user_id`, `has_account`

### 3. Kode yang diperbaiki (semua `.from('users')` → `.from('profiles')`, `name` → `full_name`)
- `lib/auth-options.ts` — **ini akar penyebab error 401 login kamu**
- `app/api/users/route.ts`, `app/api/users/[id]/route.ts`
- `app/api/profile/route.ts`
- `app/actions/mitra-accounts.ts`
- `app/(dashboard)/mitra/page.tsx`
- `app/api/transactions/route.ts`
- `scripts/create-users.ts`

## Yang HARUS kamu lakukan sebelum jalan lagi

1. **Jalankan migration di Supabase.**
   Buka Supabase Dashboard project `hxpmqcunclfijpqzxmvt` → **SQL Editor** → jalankan isi
   `001_unified_schema.sql`, lalu `002_functions_triggers.sql`, `003_rls_policies.sql`,
   `004_backfill.sql` **berurutan**, satu per satu.
   (Atau pakai Supabase CLI: `supabase db push` kalau sudah link project.)

2. **Perbaiki `NEXT_PUBLIC_SUPABASE_ANON_KEY` di `.env.local`.**
   Anon key kamu sekarang berasal dari project **berbeda** (`uuwzeqmfonzegjahqnif`), padahal
   `NEXT_PUBLIC_SUPABASE_URL` menunjuk ke `hxpmqcunclfijpqzxmvt`. Ini kemungkinan besar juga
   ikut menyebabkan login gagal. Buka Project Settings → API di project `hxpmqcunclfijpqzxmvt`,
   copy ulang **anon public key** yang benar, timpa di `.env.local`.

3. **Pastikan user login sudah ada di `profiles`.**
   Setelah migration jalan, jalankan `npx tsx scripts/create-users.ts` (atau lewat halaman
   `/users` di app) untuk memastikan akun `super_admin`/`admin`/`mitra` punya baris `profiles`
   yang lengkap (email, role, login_enabled=true).

4. Restart dev server: `npm run dev`.

## Update — audit lanjutan (build + refine)

Setelah unifikasi skema, saya jalankan **`next build`** penuh untuk pastikan semua 45 halaman
benar-benar kompilasi (bukan cuma "kelihatan benar"). Ditemukan & diperbaiki:

1. **`server-only` package hilang dari `package.json`** — padahal diimport di
   `lib/supabase/admin.ts`. Ini bug lama (bukan dari sesi ini), akan bikin build gagal total.
   Sudah ditambahkan ke dependencies.
2. **Kolom `loyalty_points.updated_at` belum ada di migration**, padahal dipakai di 3 tempat
   (`app/api/loyalty/award`, `app/api/loyalty/process`, `app/api/transactions`). Sudah
   ditambahkan ke `001_unified_schema.sql`.
3. **`useLoyalty.ts` upsert ke `loyalty_settings` tanpa `onConflict: 'mitra_id'`** — akan error
   "duplicate key" di penyimpanan kedua kalinya (karena PK tabel itu `id`, bukan `mitra_id`).
   Sudah diperbaiki.
4. Refine kecil: warna badge status (`LAUNDRY_STATUSES`/`PAYMENT_STATUSES`) diubah jadi gaya
   pill dengan border + dot indicator (terinspirasi dari referensi rental-jas), **tanpa
   mengubah struktur/layout halaman manapun** — cuma warna & style badge.

Build production (`next build`) sudah **lolos bersih, 0 error**, semua 45 route.
(Satu-satunya error yang sempat muncul adalah `next/font` gagal fetch dari Google Fonts karena
sandbox saya tidak punya akses ke `fonts.googleapis.com` — ini bukan bug project, cuma
keterbatasan jaringan sandbox. Di server/hosting kamu yang punya akses internet normal, ini
tidak akan jadi masalah.)

## Yang belum saya sentuh (belum diminta, tapi perlu kamu tahu)
- `customer_points` (tabel live lama) dipertahankan tapi ditandai deprecated — fitur poin
  sekarang pakai `loyalty_points` (ledger, lebih lengkap, sudah include auto-generate voucher).
- Tabel `pickup_orders`, `delivery_orders`, `tracking_tokens`, `customer_addresses` sudah ada
  di migration tapi belum ada kode aplikasi yang memakainya — sepertinya fitur customer
  portal yang direncanakan tapi belum dibangun.
