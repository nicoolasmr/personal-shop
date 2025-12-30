-- =============================================================================
-- MIGRATION 0013: Finance → Goals Idempotent Sync
-- Hotfix 3.3.2 - Prevents duplicate progress entries from finance sync
-- =============================================================================
-- Adds unique constraint + RPC for atomic upsert
-- Source: 'finance_sync' entries are deduplicated by goal + month
-- =============================================================================

-- ============================================
-- 1. Add integration_key column to goal_progress
-- ============================================
ALTER TABLE public.goal_progress 
ADD COLUMN IF NOT EXISTS integration_key text;

-- ============================================
-- 2. Create unique constraint for finance sync entries
-- ============================================
-- This prevents duplicates: same goal + same month + same source = only one entry
CREATE UNIQUE INDEX IF NOT EXISTS goal_progress_finance_sync_unique
  ON public.goal_progress (goal_id, source, integration_key)
  WHERE source = 'finance_sync' AND integration_key IS NOT NULL;

-- ============================================
-- 3. RPC for atomic finance sync (upsert)
-- ============================================
CREATE OR REPLACE FUNCTION public.sync_financial_goal(
  p_org_id uuid,
  p_user_id uuid,
  p_goal_id uuid,
  p_value numeric,
  p_month text -- Format: YYYY-MM
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_goal RECORD;
  v_integration_key text;
  v_result jsonb;
BEGIN
  -- Validate goal exists and belongs to user
  SELECT id, current_value, type, status
  INTO v_goal
  FROM public.goals
  WHERE id = p_goal_id
    AND org_id = p_org_id
    AND user_id = p_user_id
    AND status = 'active'
    AND type IN ('financial', 'savings');

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Goal not found or not eligible for finance sync'
    );
  END IF;

  -- Build integration key: finance_YYYY-MM
  v_integration_key := 'finance_' || p_month;

  -- Upsert progress entry
  INSERT INTO public.goal_progress (
    org_id,
    goal_id,
    user_id,
    delta_value,
    source,
    integration_key,
    notes,
    progress_date
  )
  VALUES (
    p_org_id,
    p_goal_id,
    p_user_id,
    p_value,
    'finance_sync',
    v_integration_key,
    'Auto-sync from finance module - ' || p_month,
    CURRENT_DATE
  )
  ON CONFLICT (goal_id, source, integration_key)
  WHERE source = 'finance_sync' AND integration_key IS NOT NULL
  DO UPDATE SET
    delta_value = EXCLUDED.delta_value,
    created_at = now();

  -- Update goal current_value
  UPDATE public.goals
  SET 
    current_value = p_value,
    updated_at = now()
  WHERE id = p_goal_id
    AND current_value IS DISTINCT FROM p_value;

  RETURN jsonb_build_object(
    'success', true,
    'goal_id', p_goal_id,
    'value', p_value,
    'month', p_month,
    'integration_key', v_integration_key
  );
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.sync_financial_goal TO authenticated;

-- ============================================
-- 4. Update trigger to use integration_key
-- ============================================
CREATE OR REPLACE FUNCTION sync_financial_goals()
RETURNS TRIGGER AS $$
DECLARE
  v_org_id uuid;
  v_user_id uuid;
  v_totals RECORD;
  v_goal RECORD;
  v_month text;
BEGIN
  -- Get org_id and user_id based on operation type
  IF TG_OP = 'DELETE' THEN
    v_org_id := OLD.org_id;
    v_user_id := OLD.user_id;
  ELSE
    v_org_id := NEW.org_id;
    v_user_id := NEW.user_id;
  END IF;

  -- Current month for integration key
  v_month := to_char(now(), 'YYYY-MM');

  -- Calculate current totals
  SELECT * INTO v_totals FROM calculate_finance_totals(v_org_id, v_user_id);

  -- Update all financial goals for this user via RPC
  FOR v_goal IN 
    SELECT id, type
    FROM public.goals
    WHERE org_id = v_org_id 
      AND user_id = v_user_id
      AND status = 'active'
      AND type IN ('financial', 'savings')
  LOOP
    DECLARE
      v_new_value numeric;
    BEGIN
      -- Determine new value based on goal type
      IF v_goal.type = 'savings' THEN
        v_new_value := GREATEST(v_totals.balance, 0);
      ELSE -- financial
        v_new_value := v_totals.total_income;
      END IF;

      -- Use the RPC for idempotent sync
      PERFORM public.sync_financial_goal(
        v_org_id,
        v_user_id,
        v_goal.id,
        v_new_value,
        v_month
      );
    END;
  END LOOP;

  -- Return appropriate value based on operation
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. Register migration
-- ============================================
INSERT INTO public.schema_migrations (filename, checksum)
VALUES ('MIGRATION_0013_finance_sync_idempotent.sql', 'hotfix_3_3_2_finance_sync')
ON CONFLICT (filename) DO UPDATE SET checksum = EXCLUDED.checksum;
