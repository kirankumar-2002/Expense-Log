-- ============================================================
-- Supabase Schema Setup for Expense-Log
-- Run this in your Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS transactions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
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

-- 2. OUTSTANDING TABLE
CREATE TABLE IF NOT EXISTS outstanding (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
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

-- 3. ACCOUNTS TABLE
CREATE TABLE IF NOT EXISTS accounts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  bank TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'Current' CHECK (type IN ('Current', 'Savings', 'Credit')),
  balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  standard_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  month TEXT NOT NULL DEFAULT '',
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. INDEXES for common queries
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_outstanding_date ON outstanding(date DESC);
CREATE INDEX IF NOT EXISTS idx_outstanding_state ON outstanding(state);
CREATE INDEX IF NOT EXISTS idx_accounts_name ON accounts(name);

-- 5. AUTO-UPDATE updated_at TRIGGER
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_transactions_updated
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_outstanding_updated
  BEFORE UPDATE ON outstanding
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 6. ENABLE ROW LEVEL SECURITY (RLS)
-- For now, allow all access via anon key (your app is not multi-user yet).
-- When you add authentication later, you can restrict these policies.

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE outstanding ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Allow full access for anon role (publishable key)
CREATE POLICY "Allow all access for anon" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access for anon" ON outstanding FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access for anon" ON accounts FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- DONE! Your tables are ready.
-- ============================================================
