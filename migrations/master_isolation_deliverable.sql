-- ============================================================
-- MASTER ARCHITECT ISOLATION DELIVERABLE: Antigravity
-- ============================================================

DO $$
DECLARE
    target_uuid UUID;
BEGIN
    -- 1. IDENTIFY THE LEGACY USER UUID (kirannarik9989)
    -- We look for the user with User ID 'kirannarik9989'
    SELECT id INTO target_uuid FROM public.users WHERE user_id = 'kirannarik9989' LIMIT 1;
    
    IF target_uuid IS NULL THEN
        SELECT id INTO target_uuid FROM public.profiles WHERE full_name = 'kirannarik9989' OR email LIKE 'kirannarik9989%' LIMIT 1;
    END IF;

    IF target_uuid IS NULL THEN
        RAISE NOTICE '⚠️ WARNING: UUID for kirannarik9989 not found. Records will remain NULL until assigned manually.';
    ELSE
        RAISE NOTICE '✅ IDENTIFIED UUID for kirannarik9989: %', target_uuid;
    END IF;

    -- 2. TABLE PREPARATION & RENAMING
    -- Ensure columns are named 'user_id' and link legacy records
    FOR tbl IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name IN ('accounts', 'wallets', 'credit_cards', 'transactions', 'outstanding_entries', 'payable_receivable', 'expenses', 'categories')
        AND table_schema = 'public'
    LOOP
        -- Rename tenant_id if it exists
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = tbl.table_name AND column_name = 'tenant_id') THEN
            EXECUTE format('ALTER TABLE public.%I RENAME COLUMN tenant_id TO user_id', tbl.table_name);
        END IF;

        -- Add user_id if it doesn't exist at all
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = tbl.table_name AND column_name = 'user_id') THEN
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN user_id UUID REFERENCES auth.users(id)', tbl.table_name);
        END IF;

        -- 3. GRANDFATHERING (Link all NULL records to target_uuid)
        IF target_uuid IS NOT NULL THEN
            EXECUTE format('UPDATE public.%I SET user_id = %L WHERE user_id IS NULL', tbl.table_name, target_uuid);
        END IF;
    END LOOP;
END $$;

-- 4. TABLE HARDENING (NOT NULL & DEFAULT auth.uid())
CREATE OR REPLACE FUNCTION master_harden_table(tbl_name TEXT) 
RETURNS VOID AS $$
BEGIN
    -- Set reference to auth.users(id) explicitly if needed (already handled in ADD COLUMN, but just in case)
    -- Set default to auth.uid()
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN user_id SET DEFAULT auth.uid()', tbl_name);
    -- Make NOT NULL
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN user_id SET NOT NULL', tbl_name);
END;
$$ LANGUAGE plpgsql;

SELECT master_harden_table('accounts');
SELECT master_harden_table('wallets');
SELECT master_harden_table('credit_cards');
SELECT master_harden_table('transactions');
SELECT master_harden_table('outstanding_entries');
SELECT master_harden_table('payable_receivable');
SELECT master_harden_table('expenses');
SELECT master_harden_table('categories');

DROP FUNCTION master_harden_table(TEXT);

-- 5. RESTRICTIVE RLS ENFORCEMENT
CREATE OR REPLACE FUNCTION master_apply_rls(tbl_name TEXT) 
RETURNS VOID AS $$
BEGIN
    -- Enable RLS
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl_name);
    
    -- Clean up ALL previous policies
    EXECUTE format('DROP POLICY IF EXISTS "Tenant Isolation Select" ON public.%I', tbl_name);
    EXECUTE format('DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.%I', tbl_name);
    EXECUTE format('DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.%I', tbl_name);
    EXECUTE format('DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public.%I', tbl_name);
    EXECUTE format('DROP POLICY IF EXISTS "User can only access own data" ON public.%I', tbl_name);
    EXECUTE format('DROP POLICY IF EXISTS "Restrictive Ownership Check" ON public.%I', tbl_name);
    EXECUTE format('DROP POLICY IF EXISTS "Final Restrictive Ownership" ON public.%I', tbl_name);
    EXECUTE format('DROP POLICY IF EXISTS "Permissive Authenticated Access" ON public.%I', tbl_name);
    EXECUTE format('DROP POLICY IF EXISTS "Final Permissive Access" ON public.%I', tbl_name);
    EXECUTE format('DROP POLICY IF EXISTS "Users can only access their own data" ON public.%I', tbl_name);
    
    -- Create RESTRICTIVE Policy (Architect requirement)
    EXECUTE format('CREATE POLICY "Users can only access their own data" ON public.%I AS RESTRICTIVE USING (user_id = auth.uid())', tbl_name);
    
    -- Create Permissive policy to allow operations (as long as restrictive passes)
    EXECUTE format('CREATE POLICY "Authenticated User Operations" ON public.%I FOR ALL TO authenticated USING (true)', tbl_name);
    
    RAISE NOTICE '✅ RESTRICTIVE RLS applied to table: %', tbl_name;
END;
$$ LANGUAGE plpgsql;

SELECT master_apply_rls('accounts');
SELECT master_apply_rls('wallets');
SELECT master_apply_rls('credit_cards');
SELECT master_apply_rls('transactions');
SELECT master_apply_rls('outstanding_entries');
SELECT master_apply_rls('payable_receivable');
SELECT master_apply_rls('expenses');
SELECT master_apply_rls('categories');

DROP FUNCTION master_apply_rls(TEXT);
