-- ============================================================
-- SCHEMA EXPANSION: USERS TABLE
-- ============================================================

-- Create the users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid TEXT UNIQUE NOT NULL,
    user_id TEXT UNIQUE NOT NULL,
    email TEXT,
    full_name TEXT,
    photo_url TEXT,
    phone_number TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    disabled BOOLEAN DEFAULT FALSE,
    role_plan TEXT DEFAULT 'free',
    provider TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all necessary columns exist (Idempotent updates)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'photo_url') THEN
        ALTER TABLE public.users ADD COLUMN photo_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone_number') THEN
        ALTER TABLE public.users ADD COLUMN phone_number TEXT;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email_verified') THEN
        ALTER TABLE public.users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'disabled') THEN
        ALTER TABLE public.users ADD COLUMN disabled BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'metadata') THEN
        ALTER TABLE public.users ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Enable RLS on users table if not already enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own profile
DROP POLICY IF EXISTS "Users can see own profile" ON public.users;
CREATE POLICY "Users can see own profile" ON public.users 
    FOR SELECT USING (firebase_uid = auth.uid()::text OR id = auth.uid());

-- Allow the sync process (service role) to do everything
-- (Service role bypasses RLS, but we can be explicit if needed)
