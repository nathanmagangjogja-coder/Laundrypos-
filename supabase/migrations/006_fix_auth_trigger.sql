-- 1. Policy INSERT untuk profiles (dipakai trigger & juga app/api/users)
DROP POLICY IF EXISTS "profiles_insert_self_or_system" ON profiles;
CREATE POLICY "profiles_insert_self_or_system" ON profiles
  FOR INSERT WITH CHECK (true);

-- 2. Redefinisikan trigger function supaya tidak pernah menggagalkan
--    pembuatan user di auth.users, apapun yang terjadi di dalamnya.
CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, login_enabled)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(
      (NULLIF(NEW.raw_user_meta_data->>'role', ''))::user_role,
      'customer'
    ),
    true
  )
  ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN
  -- Apapun errornya (RLS, enum tidak valid, dll), JANGAN sampai
  -- menggagalkan pembuatan user di auth.users. Cukup catat peringatan.
  RAISE WARNING 'handle_new_auth_user gagal untuk user %: %', NEW.id, SQLERRM;
END;
$$;
