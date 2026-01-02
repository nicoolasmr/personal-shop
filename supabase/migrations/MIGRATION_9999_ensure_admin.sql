-- MIGRATION_9999_ensure_admin.sql
-- Force all existing users to have 'admin' role for testing the new Ops Console
DO $$
BEGIN
    -- Update existing user_roles
    UPDATE public.user_roles SET role = 'admin';
    
    -- Update existing memberships
    UPDATE public.memberships SET role = 'admin';
    
    -- Ensure the admin flag is ON
    UPDATE public.feature_flags SET is_enabled = true WHERE key = 'admin_console_enabled';
END $$;
