
-- MIGRATION_0026_feature_flags_db.sql
-- Description: Moves feature flags from code constants to database for dynamic control.

-- 1. Create table
CREATE TABLE IF NOT EXISTS public.feature_flags (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    key text NOT NULL UNIQUE,
    description text NULL,
    is_enabled boolean NOT NULL DEFAULT false,
    rules jsonb NOT NULL DEFAULT '{}'::jsonb, -- Future: rollout percentage, user whitelists
    updated_at timestamptz DEFAULT now(),
    updated_by uuid NULL,
    CONSTRAINT feature_flags_pkey PRIMARY KEY (id)
);

-- 2. RLS
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Everyone can read stats (public part of config)
CREATE POLICY "Allow public read of flags" ON public.feature_flags
    FOR SELECT USING (true);

-- Only Admin/Ops can update
CREATE POLICY "Allow admin update flags" ON public.feature_flags
    FOR UPDATE TO authenticated
    USING (public.has_permission('ops_platform_health') OR public.get_my_role() = 'admin')
    WITH CHECK (public.has_permission('ops_platform_health') OR public.get_my_role() = 'admin');

-- 3. Seed initial flags (matching src/lib/flags.ts)
INSERT INTO public.feature_flags (key, description, is_enabled) VALUES
('admin_console_enabled', 'Master switch for /ops routes', false), -- Default OFF for security
('diagnostics_enabled', 'Enable detailed diagnostic logging', false),
('maintenance_mode', 'Put entire app in read-only mode', false),
('new_dashboard_v2', 'Experimental dashboard layout', false),
('signup_enabled', 'Allow new user registrations', true)
ON CONFLICT (key) DO UPDATE SET description = EXCLUDED.description;

-- 4. Audit Trigger for Flags
-- We want to log whenever a flag changes because it's critical.
CREATE OR REPLACE FUNCTION public.audit_flag_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.ops_audit_log (
        action,
        status,
        reason,
        target_type,
        target_id,
        meta
    ) VALUES (
        'flag_update',
        'ok',
        'Changed ' || OLD.key || ' from ' || OLD.is_enabled || ' to ' || NEW.is_enabled,
        'feature_flag',
        NEW.id,
        jsonb_build_object('key', NEW.key, 'old_val', OLD.is_enabled, 'new_val', NEW.is_enabled, 'user', auth.uid())
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_flag_change
    AFTER UPDATE ON public.feature_flags
    FOR EACH ROW
    WHEN (OLD.is_enabled IS DISTINCT FROM NEW.is_enabled)
    EXECUTE FUNCTION public.audit_flag_change();
