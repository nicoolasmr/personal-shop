
-- MIGRATION_0024_ops_diagnostics.sql
-- Description: Sets up tables for diagnostics and bug tracking in Ops Console.

-- 1. Create ops_diagnostics_events table
CREATE TABLE IF NOT EXISTS public.ops_diagnostics_events (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    org_id uuid NULL,
    event_type text NOT NULL,
    severity text NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    meta jsonb NOT NULL DEFAULT '{}'::jsonb, -- Sanitized metadata only
    created_at timestamptz DEFAULT now(),
    CONSTRAINT ops_diagnostics_events_pkey PRIMARY KEY (id)
);

-- 2. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ops_diag_created_at ON public.ops_diagnostics_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ops_diag_org_id ON public.ops_diagnostics_events (org_id);
CREATE INDEX IF NOT EXISTS idx_ops_diag_severity ON public.ops_diagnostics_events (severity);

-- 3. RLS
ALTER TABLE public.ops_diagnostics_events ENABLE ROW LEVEL SECURITY;

-- Policies:
-- SELECT: Team/Admin with 'ops_diagnostics_view' permission
CREATE POLICY "Allow team/admin to view diagnostics" ON public.ops_diagnostics_events
    FOR SELECT TO authenticated
    USING (
         public.has_permission('ops_diagnostics_view')
    );

-- INSERT: Only secure functions (or system role)
-- We block direct insert from public/authenticated users to prevent spam/spoofing.
-- They must use a dedicated logging RPC function.

-- 4. Secure RPC for logging diagnostics
CREATE OR REPLACE FUNCTION public.ops_log_diagnostic(
    p_event_type text,
    p_severity text,
    p_meta jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_org_id uuid;
BEGIN
    SELECT org_id INTO v_org_id FROM public.profiles WHERE user_id = auth.uid();

    INSERT INTO public.ops_diagnostics_events (
        org_id,
        event_type,
        severity,
        meta
    ) VALUES (
        v_org_id,
        p_event_type,
        p_severity,
        p_meta
    );
END;
$$;

-- 5. Seed Permissions Update (If strictly needed, but basic perms were seeded locally in migration 23)
-- We already seeded 'ops_diagnostics_view' and 'ops_bugs_view' in MIGRATION 23, so we are good.
