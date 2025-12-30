
-- MIGRATION_0023_ops_rbac.sql
-- Description: Sets up the RBAC foundation for the Ops Console.
-- Includes: app_role enum extensions, ops_permission enum, role_permissions table, ops_audit_log table, and secure helper functions.

-- 1. Ensure app_role values exist
-- IMPORTANT: ALTER TYPE ... ADD VALUE cannot be executed inside a transaction block along with usage of the new value.
-- We must split this logic or handle it carefully.
-- Since Supabase migrations often run in a transaction, we cannot easily use the new value immediately in the same file if we are strictly adding it.
-- HOWEVER, 'IF NOT EXISTS' helps. 
-- The error 55P04 confirms we are in a transaction.
-- We will separate the Enum creation/update to ensure it commits. 
-- But in a single file migration system, we often can't force commit.
-- Strategy: We assume the Roles might exist. If they don't, this part might fail in transaction mode.
-- FIX: We will remove the DO block transaction wrapper for the ALTER TYPE if possible, but we can't in PL/pgSQL.
-- Actually, the best way to handle "unsafe use of new value" in a migration script that runs in a transaction is to separate the ADD VALUE into its own migration file prior to usage.
-- But to keep things simple for you now without creating 0022_b, we will try to just run the ALTERs as plain SQL statements outside of the DO block if possible, 
-- OR strictly relying on the fact that if we just added them, we can't use them in data insertion in the same transaction.
-- BUT we are inserting into 'role_permissions' at the end. That's the usage causing error.

-- ATTEMPT 1: Just define the columns using text casting for the seed data to bypass early binding checks? No, enum constraint will catch it.
-- ATTEMPT 2: We must accept that if 'team' is new, we can't insert 'team' rows in the same transaction.
-- SOLUTION: We will move the INSERT (Seeding) to a separate file or block that you execute AFTER.
-- Actually, let's keep the structure but COMMENT OUT the seeding of 'team' role if it creates issues, OR rely on the user to run the enum expansion first.

-- Let's separate the ENUM expansion into its own explicit SQL commands (not in DO block) to hope the runner handles it,
-- but the real fix is usually separating files.
-- Since I can't ask you to create a new file "0022_pre", I will MODIFY 0023 to ONLY do structure and types, 
-- and I will create a NEW 0023_b (or append to 0026?) for the seeding.
-- NO, I will make 0023 robust. I will remove the seeding of data for the *new* enum values from this file.
-- You can run the seeding separately or I'll put it in 0024.

-- PART A: TYPES
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'user';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'team';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin';

-- NOTE: Postgres might still complain if we use 'team' right below in the same TX.
-- If this fails again, you must run the ALTER TYPE commands manually in your SQL editor, COMMIT, and then run the rest.
-- For now, let's proceed with structure creation.

-- 2. Create ops_permission enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ops_permission') THEN
        CREATE TYPE public.ops_permission AS ENUM (
            'ops_users_read',
            'ops_users_create',
            'ops_users_disable',
            'ops_users_roles_assign_user_only',
            'ops_diagnostics_view',
            'ops_bugs_view',
            'ops_bugs_manage',
            'ops_billing_view',
            'ops_billing_export',
            'ops_platform_health',
            'ops_team_permissions_manage'
        );
    END IF;
END $$;

-- 3. Create role_permissions table
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    role public.app_role NOT NULL,
    permission public.ops_permission NOT NULL,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT role_permissions_pkey PRIMARY KEY (id),
    CONSTRAINT role_permissions_role_permission_key UNIQUE (role, permission)
);

-- 4. Enable RLS on role_permissions
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- 5. Create ops_audit_log table
CREATE TABLE IF NOT EXISTS public.ops_audit_log (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    org_id uuid NULL, 
    actor_user_id uuid NULL, 
    action text NOT NULL, 
    target_type text NULL, 
    target_id uuid NULL, 
    status text NOT NULL CHECK (status IN ('ok', 'blocked', 'error')),
    reason text NULL,
    meta jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT ops_audit_log_pkey PRIMARY KEY (id)
);

-- 6. Enable RLS on audit log
ALTER TABLE public.ops_audit_log ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies

CREATE POLICY "Allow read access for authenticated users" ON public.role_permissions
    FOR SELECT TO authenticated USING (true);

-- Fixed policy using casting to avoid direct enum value dependency issues? No, still need enum to exist.
-- We cast to text then back if needed, but let's try standard approach.
-- We check against user_roles.
CREATE POLICY "Allow admins to view audit logs" ON public.ops_audit_log
    FOR SELECT TO authenticated
    USING (
         EXISTS (
             SELECT 1 FROM public.user_roles 
             WHERE user_id = auth.uid() 
             -- We use text comparison to be safe against new enum values in same TX?
             AND role::text IN ('admin', 'team')
         )
    );

-- 8. Functions & Helpers

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
$$;

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

  IF v_role = 'admin' THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.role_permissions
    WHERE role = v_role AND permission = p
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.ops_log(
    p_action text,
    p_status text,
    p_reason text DEFAULT NULL,
    p_target_type text DEFAULT NULL,
    p_target_id uuid DEFAULT NULL,
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

    INSERT INTO public.ops_audit_log (
        org_id,
        actor_user_id,
        action,
        status,
        reason,
        target_type,
        target_id,
        meta
    ) VALUES (
        v_org_id,
        auth.uid(),
        p_action,
        p_status,
        p_reason,
        p_target_type,
        p_target_id,
        p_meta
    );
END;
$$;

-- 9. Seed Default Permissions REMOVED from this file to prevent 55P04
-- We will insert them in the NEXT migration or you run them manually.
-- This ensures the Enum modification is committed before data usage.
