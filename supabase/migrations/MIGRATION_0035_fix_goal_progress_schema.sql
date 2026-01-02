-- Migration: Fix Goal Progress schema and triggers
-- Description: Ensures delta_value is the only column used and fixes potential naming conflicts

-- 1. Ensure goal_progress table has correct columns
DO $$ 
BEGIN 
    -- Check if 'value' column exists and rename it to 'delta_value' if delta_value doesn't exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'goal_progress' AND column_name = 'value') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'goal_progress' AND column_name = 'delta_value') THEN
            ALTER TABLE public.goal_progress RENAME COLUMN "value" TO delta_value;
        ELSE
            -- Both exist? Strange, but let's drop 'value' if delta_value is the one we use
            ALTER TABLE public.goal_progress DROP COLUMN "value";
        END IF;
    END IF;
END $$;

-- 2. Recreate trigger function to be sure it uses delta_value
CREATE OR REPLACE FUNCTION public.update_goal_current_value()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_goal_id UUID;
  v_new_total NUMERIC;
BEGIN
  -- Determine which goal to update
  IF TG_OP = 'DELETE' THEN
    v_goal_id := OLD.goal_id;
  ELSE
    v_goal_id := NEW.goal_id;
  END IF;

  -- Calculate new total from all progress entries
  SELECT COALESCE(SUM(delta_value), 0)
  INTO v_new_total
  FROM public.goal_progress
  WHERE goal_id = v_goal_id;

  -- Update the goal's current_value
  UPDATE public.goals
  SET current_value = v_new_total,
      updated_at = NOW()
  WHERE id = v_goal_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- 3. Update Sync Financial Goal RPC
CREATE OR REPLACE FUNCTION public.sync_financial_goal(
  p_org_id uuid,
  p_user_id uuid,
  p_goal_id uuid,
  p_value numeric,
  p_month text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_goal RECORD;
  v_integration_key text;
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

  -- Build integration key
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
