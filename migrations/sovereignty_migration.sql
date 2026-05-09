-- ============================================================
-- Data Sovereignty: Accounts, Wallets, and Credit Cards
-- ============================================================

-- 1. IDENTIFY TARGET USER
DO $$
DECLARE
    target_user_id UUID;
BEGIN
    SELECT id INTO target_user_id FROM public.profiles WHERE full_name = 'kirannarik9989' OR email LIKE 'kirannarik9989%' LIMIT 1;
    
    IF target_user_id IS NULL THEN
        RAISE NOTICE 'Target user kirannarik9989 not found. Using placeholder UUID if necessary.';
    ELSE
        -- 2. MIGRATE LEGACY DATA
        UPDATE public.accounts SET tenant_id = target_user_id WHERE tenant_id IS NULL;
        UPDATE public.transactions SET tenant_id = target_user_id WHERE tenant_id IS NULL;
        
        -- These tables might be new, but we migrate them if they exist
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'wallets') THEN
            UPDATE public.wallets SET tenant_id = target_user_id WHERE tenant_id IS NULL;
        END IF;

        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'credit_cards') THEN
            UPDATE public.credit_cards SET tenant_id = target_user_id WHERE tenant_id IS NULL;
        END IF;
    END IF;
END $$;

-- 3. ENABLE RLS & CONFIGURE POLICIES
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;

-- 4. POLICIES FOR ACCOUNTS
CREATE POLICY "Users can only view their own accounts" 
ON public.accounts FOR SELECT 
USING (auth.uid() = tenant_id);

CREATE POLICY "Users can only insert their own accounts" 
ON public.accounts FOR INSERT 
WITH CHECK (auth.uid() = tenant_id);

CREATE POLICY "Users can only update their own accounts" 
ON public.accounts FOR UPDATE 
USING (auth.uid() = tenant_id);

CREATE POLICY "Users can only delete their own accounts" 
ON public.accounts FOR DELETE 
USING (auth.uid() = tenant_id);

-- 5. POLICIES FOR WALLETS
CREATE POLICY "Users can only view their own wallets" 
ON public.wallets FOR SELECT 
USING (auth.uid() = tenant_id);

CREATE POLICY "Users can only insert their own wallets" 
ON public.wallets FOR INSERT 
WITH CHECK (auth.uid() = tenant_id);

CREATE POLICY "Users can only update their own wallets" 
ON public.wallets FOR UPDATE 
USING (auth.uid() = tenant_id);

CREATE POLICY "Users can only delete their own wallets" 
ON public.wallets FOR DELETE 
USING (auth.uid() = tenant_id);

-- 6. POLICIES FOR CREDIT CARDS
CREATE POLICY "Users can only view their own credit cards" 
ON public.credit_cards FOR SELECT 
USING (auth.uid() = tenant_id);

CREATE POLICY "Users can only insert their own credit cards" 
ON public.credit_cards FOR INSERT 
WITH CHECK (auth.uid() = tenant_id);

CREATE POLICY "Users can only update their own credit cards" 
ON public.credit_cards FOR UPDATE 
USING (auth.uid() = tenant_id);

CREATE POLICY "Users can only delete their own credit cards" 
ON public.credit_cards FOR DELETE 
USING (auth.uid() = tenant_id);
