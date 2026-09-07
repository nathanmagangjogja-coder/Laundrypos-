-- -----------------------------------------------------------
-- ENUM TYPES
-- -----------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'mitra', 'customer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE laundry_status AS ENUM ('diterima', 'dicuci', 'disetrika', 'selesai', 'diambil');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('lunas', 'belum_lunas', 'dp');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE mitra_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE pickup_status AS ENUM ('pending', 'scheduled', 'picked_up', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE delivery_status AS ENUM ('pending', 'on_the_way', 'delivered', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('cash', 'transfer', 'qris', 'debit', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- -----------------------------------------------------------
-- CORE MULTI-TENANT TABLES (dari skema live)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS outlets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id),
  name text NOT NULL,
  address text,
  phone text,
  mitra_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mitra (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id),
  name text NOT NULL,
  owner_name text,
  email text UNIQUE,
  phone text,
  address text,
  commission_pct numeric DEFAULT 10,
  status mitra_status DEFAULT 'pending',
  -- kolom berikut ditambahkan dari migration lama (dibutuhkan oleh app/actions/mitra-accounts.ts, app/(dashboard)/mitra/page.tsx)
  user_id uuid,
  has_account boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- profiles = pengganti tabel "users" lama, 1:1 dengan auth.users
CREATE TABLE IF NOT EXISTS profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES tenants(id),
  outlet_id uuid REFERENCES outlets(id),
  mitra_id uuid REFERENCES mitra(id),
  full_name text,
  phone text,
  role user_role DEFAULT 'customer',
  avatar_url text,
  -- kolom berikut ditambahkan dari migration lama (dibutuhkan untuk login & manajemen user)
  email text,
  login_enabled boolean DEFAULT true,
  last_login_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Tambahkan kolom yang mungkin belum ada jika tabel sudah ada sebelumnya (live DB)
ALTER TABLE mitra    ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE mitra    ADD COLUMN IF NOT EXISTS has_account boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS login_enabled boolean DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login_at timestamptz;

DO $$ BEGIN
  ALTER TABLE outlets ADD CONSTRAINT outlets_mitra_id_fkey
    FOREIGN KEY (mitra_id) REFERENCES mitra(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE mitra ADD CONSTRAINT mitra_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- -----------------------------------------------------------
-- CUSTOMERS & SERVICES
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id),
  outlet_id uuid REFERENCES outlets(id),
  created_by uuid REFERENCES profiles(id),
  name text NOT NULL,
  phone text,
  address text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS services (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id),
  outlet_id uuid REFERENCES outlets(id),
  created_by uuid REFERENCES profiles(id),
  name text NOT NULL,
  unit text CHECK (unit IN ('kg', 'pcs')),
  price numeric NOT NULL,
  est_hours integer DEFAULT 24,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- -----------------------------------------------------------
-- TRANSACTIONS
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_no text NOT NULL UNIQUE,
  tenant_id uuid REFERENCES tenants(id),
  outlet_id uuid REFERENCES outlets(id),
  created_by uuid REFERENCES profiles(id),
  customer_id uuid REFERENCES customers(id),
  mitra_id uuid REFERENCES mitra(id),
  total numeric DEFAULT 0,
  paid numeric DEFAULT 0,
  payment_status payment_status DEFAULT 'belum_lunas',
  status laundry_status DEFAULT 'diterima',
  notes text,
  est_done_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transaction_details (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id),
  transaction_id uuid REFERENCES transactions(id) ON DELETE CASCADE,
  service_id uuid REFERENCES services(id),
  service_name text,
  qty numeric,
  unit text,
  price numeric,
  subtotal numeric
);

CREATE TABLE IF NOT EXISTS payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id),
  outlet_id uuid REFERENCES outlets(id),
  transaction_id uuid REFERENCES transactions(id) ON DELETE CASCADE,
  amount numeric,
  method text,
  paid_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS commissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id),
  mitra_id uuid REFERENCES mitra(id),
  transaction_id uuid REFERENCES transactions(id) ON DELETE CASCADE,
  amount numeric,
  status text DEFAULT 'pending',
  requested_at timestamptz,
  paid_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS whatsapp_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id),
  transaction_id uuid REFERENCES transactions(id) ON DELETE SET NULL,
  "to" text,
  message text,
  status text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id),
  action text,
  table_name text,
  record_id uuid,
  created_at timestamptz DEFAULT now()
);

-- -----------------------------------------------------------
-- CUSTOMER PORTAL (pickup/delivery/tracking) — dari skema live
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS customer_addresses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id),
  customer_id uuid REFERENCES customers(id),
  label text,
  receiver_name text,
  phone text,
  address text,
  notes text,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pickup_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id),
  outlet_id uuid REFERENCES outlets(id),
  customer_id uuid REFERENCES customers(id),
  transaction_id uuid REFERENCES transactions(id),
  requested_at timestamptz DEFAULT now(),
  scheduled_at timestamptz,
  driver_name text,
  driver_phone text,
  status pickup_status DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS delivery_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id),
  outlet_id uuid REFERENCES outlets(id),
  transaction_id uuid REFERENCES transactions(id),
  customer_id uuid REFERENCES customers(id),
  driver_name text,
  driver_phone text,
  status delivery_status DEFAULT 'pending',
  delivered_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tracking_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id),
  transaction_id uuid UNIQUE REFERENCES transactions(id),
  token text NOT NULL UNIQUE,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- -----------------------------------------------------------
-- LOYALTY & VOUCHER (dari migration lama 001+002, disatukan)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS vouchers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id),
  mitra_id uuid REFERENCES mitra(id) ON DELETE CASCADE,
  code text UNIQUE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  customer_name text,
  transaction_id uuid REFERENCES transactions(id) ON DELETE SET NULL,
  type text CHECK (type IN ('points', 'discount', 'reward', 'fixed', 'percentage')),
  title text NOT NULL,
  description text,
  points integer NOT NULL DEFAULT 0,
  discount_amount numeric NOT NULL DEFAULT 0,
  minimum_order numeric NOT NULL DEFAULT 0,
  value numeric DEFAULT 0,
  min_purchase numeric DEFAULT 0,
  usage_limit integer DEFAULT 1,
  used_count integer DEFAULT 0,
  trigger_type text DEFAULT 'manual' CHECK (trigger_type IN ('manual', 'loyalty', 'schedule')),
  auto_send_wa boolean DEFAULT false,
  active boolean DEFAULT true,
  expired_at timestamptz,
  is_used boolean NOT NULL DEFAULT false,
  used_at timestamptz,
  used_transaction_id uuid REFERENCES transactions(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS voucher_redemptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id),
  voucher_id uuid REFERENCES vouchers(id) ON DELETE CASCADE,
  voucher_code text NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES transactions(id) ON DELETE CASCADE,
  discount_applied numeric NOT NULL DEFAULT 0,
  redeemed_at timestamptz DEFAULT now()
);

-- loyalty_points sebagai LEDGER (riwayat earn/redeem), lebih detail dari customer_points
CREATE TABLE IF NOT EXISTS loyalty_points (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  customer_name text,
  transaction_id uuid REFERENCES transactions(id) ON DELETE SET NULL,
  points integer NOT NULL DEFAULT 0,
  type text DEFAULT 'earn' CHECK (type IN ('earn', 'redeem')),
  description text,
  balance integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE loyalty_points ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE TABLE IF NOT EXISTS loyalty_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id),
  mitra_id uuid REFERENCES mitra(id) ON DELETE CASCADE UNIQUE,
  points_per_transaction boolean DEFAULT true,
  points_formula integer DEFAULT 10000,
  threshold_points integer DEFAULT 100,
  reward_type text DEFAULT 'fixed' CHECK (reward_type IN ('fixed', 'percentage')),
  reward_value numeric(10,2) DEFAULT 10000,
  reward_min_purchase numeric(10,2) DEFAULT 0,
  voucher_expiry_days integer DEFAULT 30,
  auto_send_whatsapp boolean DEFAULT true,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- -----------------------------------------------------------
-- SETTINGS & NOTIFICATIONS (dari migration lama, dipakai app/api/settings & lib/notifications.ts)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read boolean NOT NULL DEFAULT false,
  link text,
  created_at timestamptz DEFAULT now()
);

-- -----------------------------------------------------------
-- customer_points (tabel live lama) — DIPERTAHANKAN untuk kompatibilitas,
-- tapi ditandai deprecated karena fungsinya sudah digantikan loyalty_points (ledger lebih lengkap).
-- Tidak di-drop supaya data lama tidak hilang.
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS customer_points (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id),
  customer_id uuid REFERENCES customers(id),
  points integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
COMMENT ON TABLE customer_points IS 'DEPRECATED: gunakan loyalty_points (ledger). Dipertahankan untuk kompatibilitas data lama.';

-- -----------------------------------------------------------
-- INDEXES
-- -----------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_transactions_customer_id ON transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_outlet_id ON transactions(outlet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_mitra_id ON transactions(mitra_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transaction_details_transaction_id ON transaction_details(transaction_id);
CREATE INDEX IF NOT EXISTS idx_commissions_mitra_id ON commissions(mitra_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);
CREATE INDEX IF NOT EXISTS idx_vouchers_code ON vouchers(code);
CREATE INDEX IF NOT EXISTS idx_vouchers_customer_id ON vouchers(customer_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_expired_at ON vouchers(expired_at);
CREATE INDEX IF NOT EXISTS idx_loyalty_points_customer_id ON loyalty_points(customer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_outlets_mitra_id ON outlets(mitra_id);
CREATE INDEX IF NOT EXISTS idx_mitra_user_id ON mitra(user_id);
