-- MIGRATION_0036_fix_ops_permissions.sql
-- Description: Fixes RBAC and policies to ensure admin/owner/team can actually use the Ops Console and Admin pages.

-- 1. Allow Admin/Owner/Team to READ ALL profiles (crucial for stats and listing)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT TO authenticated
    USING (
         EXISTS (
             SELECT 1 FROM public.user_roles 
             WHERE user_id = auth.uid() 
             AND role::text IN ('admin', 'team', 'owner')
         )
    );

-- 2. Update Ops Audit Log policy to include 'owner'
DROP POLICY IF EXISTS "Allow admins to view audit logs" ON public.ops_audit_log;
CREATE POLICY "Allow admins to view audit logs" ON public.ops_audit_log
    FOR SELECT TO authenticated
    USING (
         EXISTS (
             SELECT 1 FROM public.user_roles 
             WHERE user_id = auth.uid() 
             AND role::text IN ('admin', 'team', 'owner')
         )
    );

-- 3. Update has_permission to include 'owner'
CREATE OR REPLACE FUNCTION public.has_permission(p public.ops_permission)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_role public.app_role;
BEGIN
  v_role := public.get_my_role();
  
  IF v_role IS NULL THEN
    RETURN false;
  END IF;

  -- BOTH 'admin' and 'owner' have full permissions by default
  IF v_role::text IN ('admin', 'owner') THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.role_permissions
    WHERE role = v_role AND permission = p
  );
END;
$$;

-- 4. Enable Admin Console Flag by default for now (to allow testing)
INSERT INTO public.feature_flags (key, description, is_enabled)
VALUES ('admin_console_enabled', 'Master switch for /ops routes', true)
ON CONFLICT (key) DO UPDATE SET is_enabled = EXCLUDED.is_enabled;

-- 5. Add Orgs management policy
-- Ensure staff can see all orgs for the new Org management page
DROP POLICY IF EXISTS "Admins can view all orgs" ON public.orgs;
CREATE POLICY "Admins can view all orgs" ON public.orgs
    FOR SELECT TO authenticated
    USING (
         EXISTS (
             SELECT 1 FROM public.user_roles 
             WHERE user_id = auth.uid() 
             AND role::text IN ('admin', 'team', 'owner')
         )
    );

-- 6. Add policy for Orgs count/profiles count on Orgs page
-- The previous policy already covers profiles select, but we need to ensure the join works.
