-- =============================================================================
-- MIGRATION 0019: RPC Security Optimization
-- Security Hotfix 4.1.0 - Explicit Authorization for Public Functions
-- =============================================================================
-- Updates critical security definer functions to include explicit auth checks
-- prevents escalation via indirect RPC calls.
-- =============================================================================

-- ============================================
-- 1. Optimized has_role with safety check
-- ============================================

CREATE OR REPLACE FUNCTION public.has_role(p_role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Ensure user is authenticated
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND role = p_role
  ) AND auth.uid() IS NOT NULL;
$$;

-- ============================================
-- 2. Optimized is_org_member with safety check
-- ============================================

CREATE OR REPLACE FUNCTION public.is_org_member(p_user_id uuid, p_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Ensure auth matches p_user_id or user is an admin
  SELECT EXISTS (
    SELECT 1 FROM memberships
    WHERE user_id = p_user_id
      AND org_id = p_org_id
  ) AND (auth.uid() = p_user_id OR public.has_role('admin'));
$$;

-- ============================================
-- 3. Register migration
-- ============================================
INSERT INTO public.schema_migrations (filename, checksum)
VALUES ('MIGRATION_0019_rpc_security_auth.sql', 'hotfix_4_1_0_rpc_security')
ON CONFLICT (filename) DO UPDATE SET checksum = EXCLUDED.checksum;
