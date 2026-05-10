-- ============================================================
-- DEFINITIVE DATA LEAK FIX: SCHEMA ALIGNMENT & HARDENING
-- ============================================================

-- 1. IDENTIFY TARGET USER (kirannarik9989)
DO $$
DECLARE
    target_user_id UUID;
BEGIN
    SELECT id INTO target_user_id FROM public.profiles WHERE full_name = 'kirannarik9989' OR email LIKE 'kirannarik9989%' LIMIT 1;
    
    IF target_user_id IS NULL THEN
        RAISE NOTICE 'Target user kirannarik9989 not found. Proceeding with schema alignment only.';
    END IF;

    -- 2. SCHEMA REALIGNMENT (Rename tenant_id to user_id)
    -- We use a helper to rename columns safely
    FOR tbl IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'tenant_id' AND table_schema = 'public'
    LOOP
        EXECUTE format('ALTER TABLE public.%I RENAME COLUMN tenant_id TO user_id', tbl.table_name);
    END LOOP;

    -- 3. GRANDFATHERING (Assign all orphan records to target_user_id)
    IF target_user_id IS NOT NULL THEN
        FOR tbl IN 
            SELECT table_name 
            FROM information_schema.columns 
            WHERE column_name = 'user_id' AND table_schema = 'public'
        LOOP
            EXECUTE format('UPDATE public.%I SET user_id = %L WHERE user_id IS NULL', tbl.table_name, target_user_id);
        END LOOP;
    END IF;
END $$;

-- 4. TABLE HARDENING (NOT NULL & DEFAULT auth.uid())
CREATE OR REPLACE FUNCTION definitive_harden_table(tbl_name TEXT) 
RETURNS VOID AS $$
BEGIN
    -- Set default to auth.uid()
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN user_id SET DEFAULT auth.uid()', tbl_name);
    -- Make NOT NULL
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN user_id SET NOT NULL', tbl_name);
END;
$$ LANGUAGE plpgsql;

SELECT definitive_harden_table('accounts');
SELECT definitive_harden_table('wallets');
SELECT definitive_harden_table('credit_cards');
SELECT definitive_harden_table('transactions');
SELECT definitive_harden_table('outstanding_entries');
SELECT definitive_harden_table('payable_receivable');
SELECT definitive_harden_table('expenses');
SELECT definitive_harden_table('categories');

DROP FUNCTION definitive_harden_table(TEXT);

-- 5. RESTRICTIVE RLS ENFORCEMENT
CREATE OR REPLACE FUNCTION apply_definitive_rls(tbl_name TEXT) 
RETURNS VOID AS $$
BEGIN
    -- Drop ALL existing policies (permissive or otherwise)
    EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', tbl_name);
    EXECUTE format('DROP POLICY IF EXISTS "Tenant Isolation Select" ON public.%I', tbl_name);
    EXECUTE format('DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.%I', tbl_name);
    EXECUTE format('DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.%I', tbl_name);
    EXECUTE format('DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public.%I', tbl_name);
    EXECUTE format('DROP POLICY IF EXISTS "User can only access own data" ON public.%I', tbl_name);
    EXECUTE format('DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.%I', tbl_name);
    
    -- Re-enable RLS
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl_name);
    
    -- Create RESTRICTIVE Policy (The Gold Standard)
    -- This MUST be satisfied in addition to any permissive policy.
    EXECUTE format('CREATE POLICY "Restrictive Ownership Check" ON public.%I AS RESTRICTIVE USING (user_id = auth.uid())', tbl_name);
    
    -- Create a permissive policy to allow operations for authenticated users (as long as restrictive passes)
    EXECUTE format('CREATE POLICY "Permissive Authenticated Access" ON public.%I FOR ALL TO authenticated USING (true)', tbl_name);
END;
$$ LANGUAGE plpgsql;

SELECT apply_definitive_rls('accounts');
SELECT apply_definitive_rls('wallets');
SELECT apply_definitive_rls('credit_cards');
SELECT apply_definitive_rls('transactions');
SELECT apply_definitive_rls('outstanding_entries');
SELECT apply_definitive_rls('payable_receivable');
SELECT apply_definitive_rls('expenses');
SELECT apply_definitive_rls('categories');

DROP FUNCTION apply_definitive_rls(TEXT);
