-- MIGRATION_0037_fix_finance_trigger.sql
-- Fix the trigger on transactions that syncs to goals
-- The error "column 'value' of relation 'goal_progress' does not exist" indicates 
-- the trigger is trying to write to a column that doesn't exist (it should be delta_value).

-- 1. Explicitly drop the trigger and function to ensure a clean slate
DROP TRIGGER IF EXISTS transactions_sync_goals ON public.transactions;
DROP FUNCTION IF EXISTS public.sync_financial_goals();

-- 2. Recreate the trigger function with correct column names (delta_value)
CREATE OR REPLACE FUNCTION public.sync_financial_goals()
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

  -- Verify if calculate_finance_totals exists, otherwise handle gracefully or simple calc
  -- We assume calculate_finance_totals exists as it was part of previous migrations. 
  -- If not, this block would fail, but it's better than silent failure.
  
  -- Calculate current totals
  SELECT * INTO v_totals FROM public.calculate_finance_totals(v_org_id, v_user_id);

  -- Update all financial goals for this user
  FOR v_goal IN 
    SELECT id, type, current_value
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

      -- Use explicit INSERT with correct column 'delta_value'
      -- We perform an UPSERT-like logic for the history or just a simple insert
      -- To avoid complexity with 'integration_key', we'll just log the sync event
      -- BUT we must be careful not to spam the log.
      
      -- Update the goal itself
      IF v_goal.current_value IS DISTINCT FROM v_new_value THEN
        UPDATE public.goals
        SET 
          current_value = v_new_value,
          updated_at = now()
        WHERE id = v_goal.id;

        -- We insert into goal_progress to record the history
        -- IMPORTANT: Using 'delta_value' here, NOT 'value'
        INSERT INTO public.goal_progress (
          goal_id, 
          org_id, 
          user_id, 
          delta_value,   -- This was likely 'value' in the buggy version
          source, 
          notes, 
          progress_date
        )
        VALUES (
          v_goal.id,
          v_org_id,
          v_user_id,
          v_new_value,
          'finance_sync',
          'Auto-sync transaction ' || TG_OP,
          CURRENT_DATE
        );
      END IF;
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

-- 3. Recreate the trigger
CREATE TRIGGER transactions_sync_goals
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_financial_goals();
