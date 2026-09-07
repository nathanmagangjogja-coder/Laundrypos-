-- ============================================================
-- LaundryPOS — Functions & Triggers (Migration 002)
-- ============================================================

-- ------------------------------------------------------------
-- 1. Generic updated_at trigger
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql VOLATILE COST 100;

DROP TRIGGER IF EXISTS trigger_set_updated_at_transactions ON transactions;
CREATE TRIGGER trigger_set_updated_at_transactions
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_column();

DROP TRIGGER IF EXISTS trigger_set_updated_at_loyalty_settings ON loyalty_settings;
CREATE TRIGGER trigger_set_updated_at_loyalty_settings
  BEFORE UPDATE ON loyalty_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_column();

DROP TRIGGER IF EXISTS trigger_set_updated_at_settings ON settings;
CREATE TRIGGER trigger_set_updated_at_settings
  BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_column();

-- ------------------------------------------------------------
-- 2. Auto-create profile row whenever a new auth.users row appears
--    (jaga-jaga kalau ada pembuatan user langsung lewat Supabase Auth
--    tanpa lewat scripts/create-users.ts atau app/api/users)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, login_enabled)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'customer'),
    true
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();

-- ------------------------------------------------------------
-- 3. process_loyalty_points — dipanggil otomatis saat transaksi 'selesai'
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION process_loyalty_points(p_transaction_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction RECORD;
  v_settings RECORD;
  v_mitra_id UUID;
  v_points_earned INTEGER;
  v_new_balance INTEGER;
  v_voucher_generated BOOLEAN := FALSE;
  v_voucher_code TEXT;
  v_customer_initials TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  SELECT t.*, c.name as customer_name, c.phone as customer_phone, o.name as outlet_name, o.mitra_id as outlet_mitra_id
  INTO v_transaction
  FROM transactions t
  JOIN customers c ON t.customer_id = c.id
  JOIN outlets o ON t.outlet_id = o.id
  WHERE t.id = p_transaction_id AND t.status = 'selesai';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Transaction not found or not completed');
  END IF;

  v_mitra_id := COALESCE(v_transaction.mitra_id, v_transaction.outlet_mitra_id);

  SELECT * INTO v_settings FROM loyalty_settings WHERE mitra_id = v_mitra_id AND active = TRUE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('points_earned', 0, 'new_balance', 0, 'voucher_generated', FALSE);
  END IF;

  v_points_earned := FLOOR(v_transaction.total / v_settings.points_formula);

  IF v_points_earned <= 0 THEN
    SELECT COALESCE(SUM(points), 0) INTO v_new_balance
    FROM loyalty_points WHERE customer_id = v_transaction.customer_id;

    RETURN jsonb_build_object('points_earned', 0, 'new_balance', v_new_balance, 'voucher_generated', FALSE);
  END IF;

  INSERT INTO loyalty_points (customer_id, customer_name, transaction_id, points, type, description, created_at)
  VALUES (v_transaction.customer_id, v_transaction.customer_name, p_transaction_id, v_points_earned, 'earn',
          'Poin dari transaksi ' || v_transaction.invoice_no, NOW());

  SELECT COALESCE(SUM(points), 0) INTO v_new_balance
  FROM loyalty_points WHERE customer_id = v_transaction.customer_id;

  UPDATE loyalty_points SET balance = v_new_balance
  WHERE transaction_id = p_transaction_id AND customer_id = v_transaction.customer_id AND type = 'earn';

  IF v_new_balance >= v_settings.threshold_points AND (v_new_balance - v_points_earned) < v_settings.threshold_points THEN
    v_voucher_generated := TRUE;
    v_customer_initials := UPPER(SUBSTRING(v_transaction.customer_name FROM 1 FOR 2));
    v_voucher_code := 'LYL-' || v_customer_initials || '-' || UPPER(SUBSTRING(replace(gen_random_uuid()::text, '-', '') FROM 1 FOR 6));
    v_expires_at := NOW() + (v_settings.voucher_expiry_days || ' days')::INTERVAL;

    INSERT INTO vouchers (
      code, type, title, description, value, min_purchase, active, usage_limit, used_count,
      expired_at, mitra_id, customer_id, customer_name, trigger_type, auto_send_wa, created_at
    )
    VALUES (
      v_voucher_code, v_settings.reward_type, 'Voucher Loyalitas', 'Hadiah dari akumulasi poin loyalitas',
      v_settings.reward_value, v_settings.reward_min_purchase, TRUE, 1, 0, v_expires_at, v_mitra_id,
      v_transaction.customer_id, v_transaction.customer_name, 'loyalty', v_settings.auto_send_whatsapp, NOW()
    );

    INSERT INTO loyalty_points (customer_id, customer_name, points, type, description, balance, created_at)
    VALUES (v_transaction.customer_id, v_transaction.customer_name, -v_settings.threshold_points, 'redeem',
            'Penukaran poin - Voucher ' || v_voucher_code, v_new_balance - v_settings.threshold_points, NOW());

    v_new_balance := v_new_balance - v_settings.threshold_points;
  END IF;

  RETURN jsonb_build_object(
    'points_earned', v_points_earned,
    'new_balance', v_new_balance,
    'voucher_generated', v_voucher_generated,
    'voucher_code', v_voucher_code,
    'customer_name', v_transaction.customer_name,
    'customer_phone', v_transaction.customer_phone,
    'outlet_name', v_transaction.outlet_name,
    'reward_value', v_settings.reward_value,
    'expires_at', v_expires_at,
    'auto_send_whatsapp', v_settings.auto_send_whatsapp
  );
END;
$$;

CREATE OR REPLACE FUNCTION process_loyalty_points_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM process_loyalty_points(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_loyalty_on_complete ON transactions;
CREATE TRIGGER trigger_loyalty_on_complete
  AFTER UPDATE ON transactions
  FOR EACH ROW
  WHEN (NEW.status = 'selesai' AND OLD.status != 'selesai')
  EXECUTE FUNCTION process_loyalty_points_trigger();
