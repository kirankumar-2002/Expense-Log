-- ============================================================
-- RECOVERY & DEFINITIVE ISOLATION: kirannarik9989
-- ============================================================

DO $$
DECLARE
    target_uuid UUID;
BEGIN
    -- 1. IDENTIFY THE CORRECT UUID
    -- We look for 'kirannarik9989' in the user_id column of the public.users table.
    -- If your table is named 'profiles' or something else, we check those too.
    
    SELECT id INTO target_uuid FROM public.users WHERE user_id = 'kirannarik9989' LIMIT 1;
    
    IF target_uuid IS NULL THEN
        SELECT id INTO target_uuid FROM public.profiles WHERE full_name = 'kirannarik9989' OR email LIKE 'kirannarik9989%' LIMIT 1;
    END IF;

    IF target_uuid IS NULL THEN
        RAISE NOTICE '❌ CRITICAL: Could not find UUID for kirannarik9989. Please ensure the user has logged in once to create a profile.';
    ELSE
        RAISE NOTICE '✅ FOUND UUID for kirannarik9989: %', target_uuid;

        -- 2. SCHEMA REALIGNMENT (Rename tenant_id to user_id if it exists)
        FOR tbl IN 
            SELECT table_name 
            FROM information_schema.columns 
            WHERE column_name = 'tenant_id' AND table_schema = 'public'
        LOOP
            EXECUTE format('ALTER TABLE public.%I RENAME COLUMN tenant_id TO user_id', tbl.table_name);
            RAISE NOTICE 'Renamed column in table %', tbl.table_name;
        END LOOP;

        -- 3. LINK ALL LEGACY DATA TO THE CORRECT UUID
        -- We update every financial table where user_id is null.
        UPDATE public.accounts SET user_id = target_uuid WHERE user_id IS NULL;
        UPDATE public.wallets SET user_id = target_uuid WHERE user_id IS NULL;
        UPDATE public.credit_cards SET user_id = target_uuid WHERE user_id IS NULL;
        UPDATE public.transactions SET user_id = target_uuid WHERE user_id IS NULL;
        UPDATE public.outstanding_entries SET user_id = target_uuid WHERE user_id IS NULL;
        UPDATE public.payable_receivable SET user_id = target_uuid WHERE user_id IS NULL;
        UPDATE public.expenses SET user_id = target_uuid WHERE user_id IS NULL;
        UPDATE public.categories SET user_id = target_uuid WHERE user_id IS NULL;
        
        RAISE NOTICE '✅ Legacy data linked to kirannarik9989.';
    END IF;
END $$;

-- 4. HARDEN TABLES (Always NOT NULL and Default to Current User)
CREATE OR REPLACE FUNCTION recovery_harden_table(tbl_name TEXT) 
RETURNS VOID AS $$
BEGIN
    -- Ensure column exists
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = tbl_name AND column_name = 'user_id') THEN
        -- Set default to auth.uid()
        EXECUTE format('ALTER TABLE public.%I ALTER COLUMN user_id SET DEFAULT auth.uid()', tbl_name);
        -- Make NOT NULL
        EXECUTE format('ALTER TABLE public.%I ALTER COLUMN user_id SET NOT NULL', tbl_name);
    END IF;
END;
$$ LANGUAGE plpgsql;

SELECT recovery_harden_table('accounts');
SELECT recovery_harden_table('wallets');
SELECT recovery_harden_table('credit_cards');
SELECT recovery_harden_table('transactions');
SELECT recovery_harden_table('outstanding_entries');
SELECT recovery_harden_table('payable_receivable');
SELECT recovery_harden_table('expenses');
SELECT recovery_harden_table('categories');

DROP FUNCTION recovery_harden_table(TEXT);

-- 5. APPLY RESTRICTIVE RLS POLICIES (Absolute Isolation)
CREATE OR REPLACE FUNCTION apply_final_rls(tbl_name TEXT) 
RETURNS VOID AS $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = tbl_name) THEN
        -- Enable RLS
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl_name);
        
        -- Drop ALL existing policies
        EXECUTE format('DROP POLICY IF EXISTS "Tenant Isolation Select" ON public.%I', tbl_name);
        EXECUTE format('DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.%I', tbl_name);
        EXECUTE format('DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.%I', tbl_name);
        EXECUTE format('DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public.%I', tbl_name);
        EXECUTE format('DROP POLICY IF EXISTS "User can only access own data" ON public.%I', tbl_name);
        EXECUTE format('DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.%I', tbl_name);
        EXECUTE format('DROP POLICY IF EXISTS "Restrictive Ownership Check" ON public.%I', tbl_name);
        EXECUTE format('DROP POLICY IF EXISTS "Permissive Authenticated Access" ON public.%I', tbl_name);
        
        -- Create RESTRICTIVE Policy
        EXECUTE format('CREATE POLICY "Final Restrictive Ownership" ON public.%I AS RESTRICTIVE USING (user_id = auth.uid())', tbl_name);
        
        -- Create Permissive Policy
        EXECUTE format('CREATE POLICY "Final Permissive Access" ON public.%I FOR ALL TO authenticated USING (true)', tbl_name);
        
        RAISE NOTICE '✅ RLS Policies applied to %', tbl_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

SELECT apply_final_rls('accounts');
SELECT apply_final_rls('wallets');
SELECT apply_final_rls('credit_cards');
SELECT apply_final_rls('transactions');
SELECT apply_final_rls('outstanding_entries');
SELECT apply_final_rls('payable_receivable');
SELECT apply_final_rls('expenses');
SELECT apply_final_rls('categories');

DROP FUNCTION apply_final_rls(TEXT);
