-- ============================================================
-- Data Migration: Assign Unclaimed Records to Kirannarik9989
-- ============================================================

DO $$
DECLARE
    target_user_id UUID;
BEGIN
    -- 1. Attempt to find the UUID for Kirannarik9989
    -- We check the profiles table first.
    SELECT id INTO target_user_id FROM public.profiles WHERE full_name = 'Kirannarik9989' OR email LIKE 'Kirannarik9989%';

    -- 2. If not found, we'll try to find a user in auth.users that might match
    IF target_user_id IS NULL THEN
        SELECT id INTO target_user_id FROM auth.users WHERE email LIKE 'Kirannarik9989%' LIMIT 1;
    END IF;

    -- 3. If STILL not found, we cannot proceed safely without a valid UUID.
    -- In a real scenario, we'd log an error. For this script, we'll use a placeholder if needed,
    -- but let's assume the user exists or we'll create a dummy profile if we must (risky).
    IF target_user_id IS NULL THEN
        RAISE NOTICE 'Target user Kirannarik9989 not found. Migration skipped.';
    ELSE
        RAISE NOTICE 'Migrating unclaimed records to user ID: %', target_user_id;

        -- Update transactions
        UPDATE public.transactions 
        SET tenant_id = target_user_id, profile_id = target_user_id
        WHERE tenant_id IS NULL;

        -- Update categories
        UPDATE public.categories
        SET tenant_id = target_user_id
        WHERE tenant_id IS NULL;

        -- Update any other tables that might have null tenant_ids
        -- (Add more tables here as they are created)
    END IF;
END $$;
