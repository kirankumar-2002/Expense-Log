-- ============================================================
-- Data Leak Fix: Hardening & Restrictive RLS
-- ============================================================

-- 1. IDENTIFY TARGET USER (kirannarik9989)
DO $$
DECLARE
    target_user_id UUID;
BEGIN
    SELECT id INTO target_user_id FROM public.profiles WHERE full_name = 'kirannarik9989' OR email LIKE 'kirannarik9989%' LIMIT 1;
    
    IF target_user_id IS NOT NULL THEN
        -- Assign all orphan records before hardening
        UPDATE public.accounts SET tenant_id = target_user_id WHERE tenant_id IS NULL;
        UPDATE public.wallets SET tenant_id = target_user_id WHERE tenant_id IS NULL;
        UPDATE public.credit_cards SET tenant_id = target_user_id WHERE tenant_id IS NULL;
        UPDATE public.transactions SET tenant_id = target_user_id WHERE tenant_id IS NULL;
        UPDATE public.outstanding_entries SET tenant_id = target_user_id WHERE tenant_id IS NULL;
        UPDATE public.payable_receivable SET tenant_id = target_user_id WHERE tenant_id IS NULL;
        UPDATE public.expenses SET tenant_id = target_user_id WHERE tenant_id IS NULL;
        UPDATE public.categories SET tenant_id = target_user_id WHERE tenant_id IS NULL;
        
        RAISE NOTICE 'Grandfathered legacy records to user %', target_user_id;
    END IF;
END $$;

-- 2. TABLE HARDENING (NOT NULL & DEFAULT auth.uid())
-- We ensure tenant_id is always present and defaults to the current session user.

CREATE OR REPLACE FUNCTION harden_table(tbl_name TEXT) 
RETURNS VOID AS $$
BEGIN
    -- Set default to auth.uid()
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN tenant_id SET DEFAULT auth.uid()', tbl_name);
    -- Make NOT NULL
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN tenant_id SET NOT NULL', tbl_name);
END;
$$ LANGUAGE plpgsql;

SELECT harden_table('accounts');
SELECT harden_table('wallets');
SELECT harden_table('credit_cards');
SELECT harden_table('transactions');
SELECT harden_table('outstanding_entries');
SELECT harden_table('payable_receivable');
SELECT harden_table('expenses');
SELECT harden_table('categories');

DROP FUNCTION harden_table(TEXT);

-- 3. RESTRICTIVE RLS POLICIES
-- Drop any existing permissive policies and create restrictive ones.

CREATE OR REPLACE FUNCTION apply_restrictive_policy(tbl_name TEXT) 
RETURNS VOID AS $$
BEGIN
    -- Drop all existing policies on the table
    EXECUTE format('DROP POLICY IF EXISTS "Tenant Isolation Select" ON public.%I', tbl_name);
    EXECUTE format('DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.%I', tbl_name);
    EXECUTE format('DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.%I', tbl_name);
    EXECUTE format('DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public.%I', tbl_name);
    EXECUTE format('DROP POLICY IF EXISTS "Allow all access for anon" ON public.%I', tbl_name);
    
    -- Enable RLS
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl_name);
    
    -- Create RESTRICTIVE Policy
    -- A restrictive policy MUST be satisfied for the operation to proceed.
    EXECUTE format('CREATE POLICY "User can only access own data" ON public.%I AS RESTRICTIVE USING (tenant_id = auth.uid())', tbl_name);
    
    -- Create a basic permissive policy to allow operations if the restrictive one passes
    EXECUTE format('CREATE POLICY "Enable all for authenticated users" ON public.%I FOR ALL USING (true)', tbl_name);
END;
$$ LANGUAGE plpgsql;

SELECT apply_restrictive_policy('accounts');
SELECT apply_restrictive_policy('wallets');
SELECT apply_restrictive_policy('credit_cards');
SELECT apply_restrictive_policy('transactions');
SELECT apply_restrictive_policy('outstanding_entries');
SELECT apply_restrictive_policy('payable_receivable');
SELECT apply_restrictive_policy('expenses');
SELECT apply_restrictive_policy('categories');

DROP FUNCTION apply_restrictive_policy(TEXT);
