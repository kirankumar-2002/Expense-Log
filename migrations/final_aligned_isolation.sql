-- ============================================================
-- FINAL ALIGNED ISOLATION: Antigravity
-- ============================================================

-- 1. IDENTIFY THE LEGACY USER UUID (kirannarik9989)
DO $$
DECLARE
    target_uuid UUID;
BEGIN
    SELECT id INTO target_uuid FROM public.users WHERE user_id = 'kirannarik9989' LIMIT 1;
    
    IF target_uuid IS NULL THEN
        SELECT id INTO target_uuid FROM public.profiles WHERE full_name = 'kirannarik9989' OR email LIKE 'kirannarik9989%' LIMIT 1;
    END IF;

    IF target_uuid IS NULL THEN
        RAISE NOTICE '⚠️ WARNING: UUID for kirannarik9989 not found.';
    ELSE
        RAISE NOTICE '✅ IDENTIFIED UUID for kirannarik9989: %', target_uuid;
    END IF;

    -- 2. CREATE/UPDATE TABLES (User's Provided Schema + user_id)
    
    -- TRANSACTIONS
    CREATE TABLE IF NOT EXISTS public.transactions (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
      date TEXT NOT NULL DEFAULT CURRENT_DATE::TEXT,
      amount DECIMAL(12,2) NOT NULL DEFAULT 0,
      state TEXT NOT NULL DEFAULT 'Payable' CHECK (state IN ('Payable', 'Receivable')),
      category TEXT NOT NULL DEFAULT '',
      sub_category TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Processed')),
      accounts TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- OUTSTANDING
    CREATE TABLE IF NOT EXISTS public.outstanding (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
      date TEXT NOT NULL DEFAULT CURRENT_DATE::TEXT,
      amount DECIMAL(12,2) NOT NULL DEFAULT 0,
      state TEXT NOT NULL DEFAULT 'Payable' CHECK (state IN ('Payable', 'Receivable')),
      category TEXT NOT NULL DEFAULT '',
      sub_category TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Processed')),
      accounts TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- ACCOUNTS
    CREATE TABLE IF NOT EXISTS public.accounts (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
      name TEXT NOT NULL DEFAULT '',
      bank TEXT NOT NULL DEFAULT '',
      type TEXT NOT NULL DEFAULT 'Current' CHECK (type IN ('Current', 'Savings', 'Credit')),
      balance DECIMAL(12,2) NOT NULL DEFAULT 0,
      standard_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
      month TEXT NOT NULL DEFAULT '',
      last_updated TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 3. GRANDFATHERING (Link legacy data)
    IF target_uuid IS NOT NULL THEN
        UPDATE public.transactions SET user_id = target_uuid WHERE user_id IS NULL OR user_id = '00000000-0000-0000-0000-000000000000'::UUID;
        UPDATE public.outstanding SET user_id = target_uuid WHERE user_id IS NULL OR user_id = '00000000-0000-0000-0000-000000000000'::UUID;
        UPDATE public.accounts SET user_id = target_uuid WHERE user_id IS NULL OR user_id = '00000000-0000-0000-0000-000000000000'::UUID;
    END IF;

END $$;

-- 4. TRIGGERS & INDEXES
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_transactions_updated ON transactions;
CREATE TRIGGER trg_transactions_updated BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_outstanding_updated ON outstanding;
CREATE TRIGGER trg_outstanding_updated BEFORE UPDATE ON outstanding FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_outstanding_user_id ON outstanding(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);

-- 5. RESTRICTIVE RLS ENFORCEMENT
CREATE OR REPLACE FUNCTION final_apply_rls(tbl_name TEXT) 
RETURNS VOID AS $$
BEGIN
    -- Enable RLS
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl_name);
    
    -- Drop all previous policies
    EXECUTE format('DROP POLICY IF EXISTS "Allow all access for anon" ON public.%I', tbl_name);
    EXECUTE format('DROP POLICY IF EXISTS "Users can only access their own data" ON public.%I', tbl_name);
    
    -- Create RESTRICTIVE Policy
    EXECUTE format('CREATE POLICY "Users can only access their own data" ON public.%I AS RESTRICTIVE USING (user_id = auth.uid())', tbl_name);
    
    -- Create Permissive policy
    EXECUTE format('CREATE POLICY "Authenticated User Access" ON public.%I FOR ALL TO authenticated USING (true)', tbl_name);
END;
$$ LANGUAGE plpgsql;

SELECT final_apply_rls('transactions');
SELECT final_apply_rls('outstanding');
SELECT final_apply_rls('accounts');

DROP FUNCTION final_apply_rls(TEXT);
