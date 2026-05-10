-- ============================================================
-- ANTIGRAVITY: Final Identity Obfuscation & Table Verification
-- Run in Supabase Dashboard → SQL Editor
-- Date: 2026-05-11
-- ============================================================

-- ============================================================
-- STAGE 1: VERIFY user_id IS NOT NULL + DEFAULT auth.uid()
-- ============================================================

-- Transactions
DO $$
BEGIN
  -- Ensure NOT NULL constraint
  IF EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'user_id' AND is_nullable = 'YES'
  ) THEN
    EXECUTE 'ALTER TABLE public.transactions ALTER COLUMN user_id SET NOT NULL';
  END IF;

  -- Ensure DEFAULT = auth.uid()
  EXECUTE 'ALTER TABLE public.transactions ALTER COLUMN user_id SET DEFAULT auth.uid()';
END $$;

-- Outstanding
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'outstanding' AND column_name = 'user_id' AND is_nullable = 'YES'
  ) THEN
    EXECUTE 'ALTER TABLE public.outstanding ALTER COLUMN user_id SET NOT NULL';
  END IF;
  EXECUTE 'ALTER TABLE public.outstanding ALTER COLUMN user_id SET DEFAULT auth.uid()';
END $$;

-- Accounts
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'accounts' AND column_name = 'user_id' AND is_nullable = 'YES'
  ) THEN
    EXECUTE 'ALTER TABLE public.accounts ALTER COLUMN user_id SET NOT NULL';
  END IF;
  EXECUTE 'ALTER TABLE public.accounts ALTER COLUMN user_id SET DEFAULT auth.uid()';
END $$;

-- Credit Cards
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'credit_cards' AND column_name = 'user_id' AND is_nullable = 'YES'
  ) THEN
    EXECUTE 'ALTER TABLE public.credit_cards ALTER COLUMN user_id SET NOT NULL';
  END IF;
  EXECUTE 'ALTER TABLE public.credit_cards ALTER COLUMN user_id SET DEFAULT auth.uid()';
END $$;

-- Wallets
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wallets' AND column_name = 'user_id' AND is_nullable = 'YES'
  ) THEN
    EXECUTE 'ALTER TABLE public.wallets ALTER COLUMN user_id SET NOT NULL';
  END IF;
  EXECUTE 'ALTER TABLE public.wallets ALTER COLUMN user_id SET DEFAULT auth.uid()';
END $$;


-- ============================================================
-- STAGE 2: LOCK DOWN THE USERS TABLE (Private Mapping Only)
-- ============================================================

-- Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop any public/anon access policies that may exist
DROP POLICY IF EXISTS "Allow all access for anon" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "Public read access" ON public.users;

-- Strict: Only the user themselves can read their own row
DROP POLICY IF EXISTS "Users can only read own row" ON public.users;
CREATE POLICY "Users can only read own row"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (firebase_uid = auth.uid()::text OR id = auth.uid());

-- No public INSERT/UPDATE/DELETE — only server-side (service_role) can write
DROP POLICY IF EXISTS "Service role only write" ON public.users;

-- Revoke direct table access from anon role
REVOKE ALL ON public.users FROM anon;
REVOKE ALL ON public.users FROM authenticated;
-- Grant only SELECT to authenticated (RLS will restrict)
GRANT SELECT ON public.users TO authenticated;


-- ============================================================
-- STAGE 3: VERIFY LEGACY DATA ISOLATION (kirannarik9989)
-- ============================================================

-- Verify: All data for the legacy user is properly linked
DO $$
DECLARE
  legacy_uuid UUID;
  orphan_count INTEGER;
BEGIN
  -- Find kirannarik9989's UUID
  SELECT id INTO legacy_uuid
  FROM public.users
  WHERE user_id = 'kirannarik9989'
  LIMIT 1;

  IF legacy_uuid IS NULL THEN
    RAISE NOTICE '⚠️ Legacy user kirannarik9989 not found in users table. No migration needed.';
    RETURN;
  END IF;

  RAISE NOTICE '✅ Legacy user UUID found: %', legacy_uuid;

  -- Check for orphaned records (NULL user_id)
  SELECT COUNT(*) INTO orphan_count
  FROM public.transactions
  WHERE user_id IS NULL;

  IF orphan_count > 0 THEN
    RAISE NOTICE '⚠️ Found % orphaned transactions, linking to legacy user...', orphan_count;
    UPDATE public.transactions SET user_id = legacy_uuid WHERE user_id IS NULL;
  END IF;

  SELECT COUNT(*) INTO orphan_count
  FROM public.outstanding
  WHERE user_id IS NULL;

  IF orphan_count > 0 THEN
    RAISE NOTICE '⚠️ Found % orphaned outstanding entries, linking to legacy user...', orphan_count;
    UPDATE public.outstanding SET user_id = legacy_uuid WHERE user_id IS NULL;
  END IF;

  SELECT COUNT(*) INTO orphan_count
  FROM public.accounts
  WHERE user_id IS NULL;

  IF orphan_count > 0 THEN
    RAISE NOTICE '⚠️ Found % orphaned accounts, linking to legacy user...', orphan_count;
    UPDATE public.accounts SET user_id = legacy_uuid WHERE user_id IS NULL;
  END IF;

  RAISE NOTICE '✅ Legacy data isolation verified for kirannarik9989.';
END $$;


-- ============================================================
-- STAGE 4: RE-VERIFY ALL RLS POLICIES ARE RESTRICTIVE
-- ============================================================

-- Drop and recreate restrictive policies for all data tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['transactions', 'outstanding', 'accounts', 'credit_cards', 'wallets'])
  LOOP
    -- Drop existing
    EXECUTE format('DROP POLICY IF EXISTS "Strict User Isolation" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Enable Authenticated Access" ON public.%I', tbl);

    -- Restrictive base policy: user can only see their own data
    EXECUTE format(
      'CREATE POLICY "Strict User Isolation" ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())',
      tbl
    );

    -- Permissive allow (passes only if restrictive passes)
    EXECUTE format(
      'CREATE POLICY "Enable Authenticated Access" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
      tbl
    );
  END LOOP;
END $$;


-- ============================================================
-- STAGE 5: INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_outstanding_user_id ON public.outstanding(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_cards_user_id ON public.credit_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON public.users(firebase_uid);

-- ============================================================
-- VERIFICATION COMPLETE
-- ============================================================
