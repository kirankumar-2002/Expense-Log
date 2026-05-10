-- ============================================================
-- SUPABASE MASTER SCHEMA SETUP: Expense-Log Pro
-- Generated: 2026-05-09
-- Purpose: Strict Multi-Tenant Isolation & Legacy Migration
-- ============================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- STAGE 0: TYPE HARDENING, DATA LINKING & PRECISION MIGRATION
-- ============================================================
DO $$
DECLARE
    tbl TEXT;
    target_uuid UUID;
    placeholder_uuid UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
    -- 1. IDENTIFY THE LEGACY USER UUID
    -- Search for the user kirannarik9989 in public.users or auth.users
    SELECT id INTO target_uuid FROM public.users WHERE user_id = 'kirannarik9989' LIMIT 1;
    
    IF target_uuid IS NULL THEN
        SELECT id INTO target_uuid FROM auth.users WHERE email = 'kirannarik9989@gmail.com' LIMIT 1;
    END IF;

    -- 2. HARDEN SCHEMA, LINK DATA, AND CONVERT TO CENTS
    FOR tbl IN SELECT table_name FROM information_schema.tables 
               WHERE table_schema = 'public' 
               AND table_name IN ('users', 'transactions', 'outstanding', 'accounts', 'wallets', 'credit_cards', 'expenses', 'outstanding_entries', 'payable_receivable')
    LOOP
        -- A. Add user_id if missing
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'user_id') THEN
            IF tbl = 'users' THEN
                EXECUTE format('ALTER TABLE public.%I ADD COLUMN user_id TEXT', tbl);
            ELSE
                EXECUTE format('ALTER TABLE public.%I ADD COLUMN user_id UUID', tbl);
            END IF;
        END IF;

        -- B. Fix type if not UUID (except for users)
        IF tbl <> 'users' AND (SELECT data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'user_id') <> 'uuid' THEN
            EXECUTE format('ALTER TABLE public.%I ALTER COLUMN user_id TYPE UUID USING (CASE WHEN user_id::text ~ ''^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'' THEN user_id::text::uuid ELSE NULL END)', tbl);
        END IF;

        -- C. MONETARY PRECISION: Convert amount (decimal) to amount_cents (bigint)
        IF tbl IN ('transactions', 'outstanding', 'accounts', 'wallets', 'credit_cards', 'expenses', 'outstanding_entries', 'payable_receivable') THEN
            -- Check for 'amount' or 'balance' columns (decimal)
            IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'amount') THEN
                IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'amount_cents') THEN
                    EXECUTE format('ALTER TABLE public.%I ADD COLUMN amount_cents BIGINT DEFAULT 0', tbl);
                END IF;
                EXECUTE format('UPDATE public.%I SET amount_cents = (amount * 100)::BIGINT WHERE amount_cents = 0', tbl);
            END IF;
            
            IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'balance') THEN
                IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'balance_cents') THEN
                    EXECUTE format('ALTER TABLE public.%I ADD COLUMN balance_cents BIGINT DEFAULT 0', tbl);
                END IF;
                EXECUTE format('UPDATE public.%I SET balance_cents = (balance * 100)::BIGINT WHERE balance_cents = 0', tbl);
            END IF;
        END IF;

        -- D. LINK ORPHANED AND PLACEHOLDER DATA
        IF tbl <> 'users' AND target_uuid IS NOT NULL THEN
            -- Link specific placeholder and generic nulls/trash values
            EXECUTE format('UPDATE public.%I SET user_id = %L WHERE user_id IS NULL OR user_id = %L OR user_id::text = ''1'' OR user_id::text = ''0''', tbl, target_uuid, placeholder_uuid);
        END IF;
        
        -- E. FINAL FALLBACK (Ensure no NULLs)
        IF tbl <> 'users' THEN
             EXECUTE format('UPDATE public.%I SET user_id = COALESCE(user_id, auth.uid(), %L)', tbl, COALESCE(target_uuid, placeholder_uuid));
        END IF;
    END LOOP;
END $$;

-- 2. USERS TABLE (Sync Mirror from Firebase)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid TEXT UNIQUE NOT NULL,
  user_id TEXT UNIQUE NOT NULL,
  email TEXT,
  full_name TEXT,
  photo_url TEXT,
  role_plan TEXT DEFAULT 'free',
  provider TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount_cents BIGINT NOT NULL DEFAULT 0,
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

-- 4. OUTSTANDING TABLE
CREATE TABLE IF NOT EXISTS public.outstanding (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount_cents BIGINT NOT NULL DEFAULT 0,
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

-- 5. ACCOUNTS TABLE
CREATE TABLE IF NOT EXISTS public.accounts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  name TEXT NOT NULL DEFAULT '',
  bank TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'Current' CHECK (type IN ('Current', 'Savings', 'Credit')),
  balance_cents BIGINT NOT NULL DEFAULT 0,
  standard_balance_cents BIGINT NOT NULL DEFAULT 0,
  month TEXT NOT NULL DEFAULT '',
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ADDITIONAL TABLES (Credit Cards, Wallets, etc.)
CREATE TABLE IF NOT EXISTS public.credit_cards (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  name TEXT NOT NULL DEFAULT '',
  bank TEXT NOT NULL DEFAULT '',
  balance_cents BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.wallets (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  name TEXT NOT NULL DEFAULT '',
  balance_cents BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TRIGGERS (Auto-Update updated_at)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_transactions_updated BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE OR REPLACE TRIGGER trg_outstanding_updated BEFORE UPDATE ON outstanding FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE OR REPLACE TRIGGER trg_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 8. RESTRICTIVE ROW LEVEL SECURITY (RLS)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE outstanding ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- CREATE RESTRICTIVE POLICIES (Strict Sovereignty)
DROP POLICY IF EXISTS "Strict User Isolation" ON transactions;
DROP POLICY IF EXISTS "Strict User Isolation" ON outstanding;
DROP POLICY IF EXISTS "Strict User Isolation" ON accounts;
DROP POLICY IF EXISTS "Strict User Isolation" ON users;
DROP POLICY IF EXISTS "Strict User Isolation" ON credit_cards;
DROP POLICY IF EXISTS "Strict User Isolation" ON wallets;

CREATE POLICY "Strict User Isolation" ON transactions AS RESTRICTIVE USING (user_id = auth.uid());
CREATE POLICY "Strict User Isolation" ON outstanding AS RESTRICTIVE USING (user_id = auth.uid());
CREATE POLICY "Strict User Isolation" ON accounts AS RESTRICTIVE USING (user_id = auth.uid());
CREATE POLICY "Strict User Isolation" ON users AS RESTRICTIVE USING (id = auth.uid() OR firebase_uid = auth.uid()::text);
CREATE POLICY "Strict User Isolation" ON credit_cards AS RESTRICTIVE USING (user_id = auth.uid());
CREATE POLICY "Strict User Isolation" ON wallets AS RESTRICTIVE USING (user_id = auth.uid());

-- CREATE PERMISSIVE POLICIES (Allow Access if Restrictive passes)
DROP POLICY IF EXISTS "Enable Authenticated Access" ON transactions;
DROP POLICY IF EXISTS "Enable Authenticated Access" ON outstanding;
DROP POLICY IF EXISTS "Enable Authenticated Access" ON accounts;
DROP POLICY IF EXISTS "Enable Authenticated Access" ON users;
DROP POLICY IF EXISTS "Enable Authenticated Access" ON credit_cards;
DROP POLICY IF EXISTS "Enable Authenticated Access" ON wallets;

CREATE POLICY "Enable Authenticated Access" ON transactions FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable Authenticated Access" ON outstanding FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable Authenticated Access" ON accounts FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable Authenticated Access" ON users FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable Authenticated Access" ON credit_cards FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable Authenticated Access" ON wallets FOR ALL TO authenticated USING (true);

-- 9. INDEXES
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_outstanding_user_id ON outstanding(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_credit_cards_user_id ON credit_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);

-- ============================================================
-- SETUP COMPLETE
-- ============================================================
