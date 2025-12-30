-- Function cleanup for idempotency (prevents return type mismatch errors)
DROP FUNCTION IF EXISTS public.get_installments_summary(uuid, uuid);
DROP FUNCTION IF EXISTS public.get_finance_goal_progress(uuid);

-- Function to get installments summary
CREATE OR REPLACE FUNCTION public.get_installments_summary(
  p_org_id uuid,
  p_user_id uuid
)
RETURNS TABLE (
  total_active_installments bigint,
  total_monthly_commitment numeric,
  total_remaining_amount numeric
) AS $$
DECLARE
  v_caller_org_id uuid;
BEGIN
  -- Security Check
  SELECT org_id INTO v_caller_org_id FROM public.profiles WHERE user_id = auth.uid();
  IF v_caller_org_id IS NULL OR v_caller_org_id != p_org_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT 
    COUNT(*)::bigint as total_active_installments,
    COALESCE(SUM(amount), 0)::numeric as total_monthly_commitment,
    COALESCE(SUM(amount * (installment_count - installment_number + 1)), 0)::numeric as total_remaining_amount
  FROM public.transactions
  WHERE org_id = p_org_id
    AND user_id = p_user_id
    AND installment_count > 1
    -- Only count current/future parcels if implemented with is_installment_parcel
    -- For now assume all matching records are active parts of an installment plan
    AND transaction_date >= date_trunc('month', CURRENT_DATE)::date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate goal progress based on transactions
CREATE OR REPLACE FUNCTION public.get_finance_goal_progress(
  p_goal_id uuid
)
RETURNS numeric AS $$
DECLARE
  v_goal record;
  v_current numeric;
BEGIN
  SELECT * INTO v_goal FROM public.finance_goals WHERE id = p_goal_id;
  
  -- Logic depends on goal type
  IF v_goal.type = 'expense_limit' THEN
    SELECT COALESCE(SUM(amount), 0) INTO v_current 
    FROM public.transactions 
    WHERE org_id = v_goal.org_id 
      AND user_id = v_goal.user_id
      AND category_id = v_goal.category_id -- Assuming category link
      AND EXTRACT(MONTH FROM transaction_date) = EXTRACT(MONTH FROM CURRENT_DATE)
      AND EXTRACT(YEAR FROM transaction_date) = EXTRACT(YEAR FROM CURRENT_DATE);
  ELSE
    -- Savings or Income target: total since goal start
    SELECT COALESCE(SUM(amount), 0) INTO v_current 
    FROM public.transactions 
    WHERE org_id = v_goal.org_id 
      AND user_id = v_goal.user_id
      AND category_id = v_goal.category_id
      AND transaction_date >= v_goal.created_at::date;
  END IF;

  RETURN v_current;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
