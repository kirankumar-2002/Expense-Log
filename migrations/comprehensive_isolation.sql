-- ============================================================
-- Comprehensive Multi-Tenant Isolation & Migration
-- ============================================================

-- 1. IDENTIFY TARGET USER (kirannarik9989)
DO $$
DECLARE
    target_user_id UUID;
BEGIN
    SELECT id INTO target_user_id FROM public.profiles WHERE full_name = 'kirannarik9989' OR email LIKE 'kirannarik9989%' LIMIT 1;
    
    IF target_user_id IS NULL THEN
        RAISE NOTICE 'Target user kirannarik9989 not found. Proceeding with schema isolation only.';
    ELSE
        -- 2. MIGRATE LEGACY DATA (Assign all unclaimed records)
        UPDATE public.accounts SET tenant_id = target_user_id WHERE tenant_id IS NULL;
        UPDATE public.wallets SET tenant_id = target_user_id WHERE tenant_id IS NULL;
        UPDATE public.credit_cards SET tenant_id = target_user_id WHERE tenant_id IS NULL;
        UPDATE public.transactions SET tenant_id = target_user_id WHERE tenant_id IS NULL;
        UPDATE public.outstanding_entries SET tenant_id = target_user_id WHERE tenant_id IS NULL;
        UPDATE public.payable_receivable SET tenant_id = target_user_id WHERE tenant_id IS NULL;
        UPDATE public.expenses SET tenant_id = target_user_id WHERE tenant_id IS NULL;
        
        RAISE NOTICE 'Successfully migrated legacy data to user %', target_user_id;
    END IF;
END $$;

-- 3. ENABLE RLS ON ALL TABLES
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outstanding_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payable_receivable ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- 4. UNIFIED RLS POLICIES (Helper function to create policies)
CREATE OR REPLACE FUNCTION create_tenant_policy(table_name TEXT) 
RETURNS VOID AS $$
BEGIN
    EXECUTE format('DROP POLICY IF EXISTS "Tenant Isolation Select" ON public.%I', table_name);
    EXECUTE format('CREATE POLICY "Tenant Isolation Select" ON public.%I FOR SELECT USING (auth.uid() = tenant_id)', table_name);
    
    EXECUTE format('DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.%I', table_name);
    EXECUTE format('CREATE POLICY "Tenant Isolation Insert" ON public.%I FOR INSERT WITH CHECK (auth.uid() = tenant_id)', table_name);
    
    EXECUTE format('DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.%I', table_name);
    EXECUTE format('CREATE POLICY "Tenant Isolation Update" ON public.%I FOR UPDATE USING (auth.uid() = tenant_id)', table_name);
    
    EXECUTE format('DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public.%I', table_name);
    EXECUTE format('CREATE POLICY "Tenant Isolation Delete" ON public.%I FOR DELETE USING (auth.uid() = tenant_id)', table_name);
END;
$$ LANGUAGE plpgsql;

-- 5. APPLY POLICIES
SELECT create_tenant_policy('accounts');
SELECT create_tenant_policy('wallets');
SELECT create_tenant_policy('credit_cards');
SELECT create_tenant_policy('transactions');
SELECT create_tenant_policy('outstanding_entries');
SELECT create_tenant_policy('payable_receivable');
SELECT create_tenant_policy('expenses');

DROP FUNCTION create_tenant_policy(TEXT);
