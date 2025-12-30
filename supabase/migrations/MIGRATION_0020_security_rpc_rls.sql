-- Migration: Security RPC & RLS Refinement
-- Description: Refines RPC authorization and bug_reports RLS

-- 1. Refine Finance RPCs with authorization checks
CREATE OR REPLACE FUNCTION get_monthly_summary(
  p_org_id uuid,
  p_user_id uuid,
  p_year integer DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::integer,
  p_month integer DEFAULT EXTRACT(MONTH FROM CURRENT_DATE)::integer
)
RETURNS TABLE (
  total_income numeric,
  total_expense numeric,
  balance numeric,
  transaction_count bigint
) AS $$
DECLARE
  v_caller_org_id uuid;
BEGIN
  -- Get caller's org_id
  SELECT org_id INTO v_caller_org_id FROM public.profiles WHERE user_id = auth.uid();
  
  -- Verify authorization
  IF v_caller_org_id IS NULL OR v_caller_org_id != p_org_id THEN
    RAISE EXCEPTION 'Unauthorized: cannot access other organization data';
  END IF;

  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) as total_income,
    COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as total_expense,
    COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END), 0) as balance,
    COUNT(*) as transaction_count
  FROM public.transactions t
  WHERE t.org_id = p_org_id
    AND t.user_id = p_user_id
    AND EXTRACT(YEAR FROM t.transaction_date) = p_year
    AND EXTRACT(MONTH FROM t.transaction_date) = p_month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Refine bug_reports select policy to be org-scoped
DROP POLICY IF EXISTS "bug_reports_select_own" ON public.bug_reports;
CREATE POLICY "bug_reports_select_own_or_admin"
  ON public.bug_reports
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR (
      (public.has_role('admin') OR public.has_role('owner'))
      AND org_id = (SELECT org_id FROM public.profiles WHERE user_id = auth.uid())
    )
  );

-- Record migration
INSERT INTO public.schema_migrations (filename, checksum)
VALUES ('MIGRATION_0020_security_rpc_rls.sql', 'hotfix_4_2_0_security')
ON CONFLICT (filename) DO UPDATE SET checksum = EXCLUDED.checksum;
