-- ============================================================
-- LaundryPOS — Backfill (Migration 004)
-- Isi kolom baru (email, login_enabled) untuk baris profiles yang sudah ada,
-- supaya user existing tetap bisa login setelah migration 001.
-- ============================================================

-- Sinkronkan email dari auth.users ke profiles untuk baris yang emailnya masih kosong
UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
  AND (p.email IS NULL OR p.email = '');

-- Pastikan login_enabled tidak NULL (default true) untuk baris lama
UPDATE profiles
SET login_enabled = true
WHERE login_enabled IS NULL;
