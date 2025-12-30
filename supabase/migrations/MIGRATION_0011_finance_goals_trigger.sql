-- =============================================================================
-- MIGRATION 0011: Finance → Goals Sync Trigger
-- Sprint 3.4 - Database-level sync (replaces frontend hook)
-- =============================================================================
-- Trigger para sincronizar transações com metas financeiras automaticamente
-- Garante idempotência: atualiza current_value diretamente, não cria registros duplicados
-- =============================================================================

-- ============================================
-- 1. Function para calcular totais financeiros
-- ============================================
CREATE OR REPLACE FUNCTION calculate_finance_totals(
  p_org_id uuid,
  p_user_id uuid
)
RETURNS TABLE (
  total_income numeric,
  total_expense numeric,
  balance numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) as total_income,
    COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as total_expense,
    COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END), 0) as balance
  FROM public.transactions t
  WHERE t.org_id = p_org_id
    AND t.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. Function para sincronizar metas financeiras
-- ============================================
CREATE OR REPLACE FUNCTION sync_financial_goals()
RETURNS TRIGGER AS $$
DECLARE
  v_org_id uuid;
  v_user_id uuid;
  v_totals RECORD;
  v_goal RECORD;
BEGIN
  -- Get org_id and user_id based on operation type
  IF TG_OP = 'DELETE' THEN
    v_org_id := OLD.org_id;
    v_user_id := OLD.user_id;
  ELSE
    v_org_id := NEW.org_id;
    v_user_id := NEW.user_id;
  END IF;

  -- Calculate current totals
  SELECT * INTO v_totals FROM calculate_finance_totals(v_org_id, v_user_id);

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

      -- Only update if value changed (idempotency)
      IF v_goal.current_value IS DISTINCT FROM v_new_value THEN
        UPDATE public.goals
        SET 
          current_value = v_new_value,
          updated_at = now()
        WHERE id = v_goal.id;

        -- Log progress entry for history (avoid duplicates by using upsert-like logic)
        INSERT INTO public.goal_progress (
          goal_id, org_id, user_id, delta_value, source, notes, progress_date
        )
        VALUES (
          v_goal.id,
          v_org_id,
          v_user_id,
          v_new_value,
          'finance_sync',
          'Auto-sync from transaction ' || COALESCE(TG_OP, 'UNKNOWN'),
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

-- ============================================
-- 3. Create Trigger on transactions
-- ============================================
DROP TRIGGER IF EXISTS transactions_sync_goals ON public.transactions;
CREATE TRIGGER transactions_sync_goals
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION sync_financial_goals();

-- ============================================
-- 4. Register migration
-- ============================================
INSERT INTO public.schema_migrations (filename, checksum)
VALUES ('MIGRATION_0011_finance_goals_trigger.sql', 'sprint_3_4_finance_goals_trigger')
ON CONFLICT (filename) DO UPDATE SET checksum = EXCLUDED.checksum;
