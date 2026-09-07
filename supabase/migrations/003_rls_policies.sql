ALTER TABLE profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants             ENABLE ROW LEVEL SECURITY;
ALTER TABLE outlets             ENABLE ROW LEVEL SECURITY;
ALTER TABLE mitra               ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers           ENABLE ROW LEVEL SECURITY;
ALTER TABLE services            ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_logs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers            ENABLE ROW LEVEL SECURITY;
ALTER TABLE voucher_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_points      ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_settings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings            ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications       ENABLE ROW LEVEL SECURITY;

-- Profiles: user boleh baca profil sendiri
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Vouchers & loyalty: baca terbuka untuk user yang login (dipakai widget loyalty di browser)
DROP POLICY IF EXISTS "allow_all_select_vouchers" ON vouchers;
CREATE POLICY "allow_all_select_vouchers" ON vouchers
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "mitra_insert_vouchers" ON vouchers;
CREATE POLICY "mitra_insert_vouchers" ON vouchers
  FOR INSERT WITH CHECK (
    mitra_id IN (SELECT id FROM mitra WHERE user_id = auth.uid())
    OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
  );

DROP POLICY IF EXISTS "mitra_update_own_vouchers" ON vouchers;
CREATE POLICY "mitra_update_own_vouchers" ON vouchers
  FOR UPDATE USING (
    mitra_id IN (SELECT id FROM mitra WHERE user_id = auth.uid())
    OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
  );

DROP POLICY IF EXISTS "mitra_delete_own_vouchers" ON vouchers;
CREATE POLICY "mitra_delete_own_vouchers" ON vouchers
  FOR DELETE USING (
    mitra_id IN (SELECT id FROM mitra WHERE user_id = auth.uid())
    OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
  );

DROP POLICY IF EXISTS "allow_all_select_loyalty_points" ON loyalty_points;
CREATE POLICY "allow_all_select_loyalty_points" ON loyalty_points
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "insert_loyalty_points" ON loyalty_points;
CREATE POLICY "insert_loyalty_points" ON loyalty_points
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "mitra_read_own_loyalty_settings" ON loyalty_settings;
CREATE POLICY "mitra_read_own_loyalty_settings" ON loyalty_settings
  FOR SELECT USING (
    mitra_id IN (SELECT id FROM mitra WHERE user_id = auth.uid())
    OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
  );

DROP POLICY IF EXISTS "mitra_update_own_loyalty_settings" ON loyalty_settings;
CREATE POLICY "mitra_update_own_loyalty_settings" ON loyalty_settings
  FOR ALL USING (
    mitra_id IN (SELECT id FROM mitra WHERE user_id = auth.uid())
    OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
  );

-- Customers: user yang login boleh baca/tulis (dipakai lib/customers-store.ts di browser)
DROP POLICY IF EXISTS "authenticated_all_customers" ON customers;
CREATE POLICY "authenticated_all_customers" ON customers
  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Notifications: user hanya boleh lihat/ubah notifikasi miliknya sendiri
DROP POLICY IF EXISTS "notifications_own" ON notifications;
CREATE POLICY "notifications_own" ON notifications
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
