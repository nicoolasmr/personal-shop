-- =============================================================================
-- VIDA360 Migration 0008_2: Goals Integrity (Constraints, Indexes, Trigger Fix)
-- Fortalece integridade do modelo Goals
-- =============================================================================

-- =============================================================================
-- PART 1: ADICIONAR NOVOS TIPOS DE META (expandido no Sprint 3.0.1)
-- =============================================================================

-- Atualizar CHECK constraint para incluir novos tipos
-- Primeiro, remover a constraint existente
ALTER TABLE public.goals DROP CONSTRAINT IF EXISTS goals_type_check;

-- Adicionar constraint com tipos expandidos
ALTER TABLE public.goals ADD CONSTRAINT goals_type_check 
  CHECK (type IN ('custom', 'financial', 'habit', 'task', 'reading', 'weight', 'exercise', 'savings', 'study', 'health'));

-- =============================================================================
-- PART 2: ADICIONAR COLUNA linked_habit_id PARA INTEGRAÇÃO
-- =============================================================================

-- Coluna para vincular meta a um hábito existente
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS linked_habit_id UUID NULL;

-- Foreign key para habits
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'goals_linked_habit_id_fkey'
  ) THEN
    ALTER TABLE public.goals 
    ADD CONSTRAINT goals_linked_habit_id_fkey 
    FOREIGN KEY (linked_habit_id) REFERENCES public.habits(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Índice para linked_habit_id
CREATE INDEX IF NOT EXISTS goals_linked_habit_id_idx ON public.goals(linked_habit_id) WHERE linked_habit_id IS NOT NULL;

-- =============================================================================
-- PART 3: ATUALIZAR SOURCE PARA INCLUIR 'integration'
-- =============================================================================

-- Remover constraint existente
ALTER TABLE public.goal_progress DROP CONSTRAINT IF EXISTS goal_progress_source_check;

-- Adicionar com novo valor
ALTER TABLE public.goal_progress ADD CONSTRAINT goal_progress_source_check 
  CHECK (source IN ('app', 'whatsapp', 'integration'));

-- =============================================================================
-- PART 4: ÍNDICES PARA PERFORMANCE
-- =============================================================================

-- Índice para queries de progresso por data (timeline)
CREATE INDEX IF NOT EXISTS goal_progress_goal_date_idx 
  ON public.goal_progress(goal_id, progress_date DESC);

-- Índice composto para queries multi-tenant
CREATE INDEX IF NOT EXISTS goal_progress_org_goal_idx 
  ON public.goal_progress(org_id, goal_id);

-- Índice para metas por tipo
CREATE INDEX IF NOT EXISTS goals_type_idx 
  ON public.goals(type);

-- Índice para metas ativas com due_date (para queries de overview)
CREATE INDEX IF NOT EXISTS goals_active_due_date_idx 
  ON public.goals(org_id, due_date) 
  WHERE status = 'active' AND due_date IS NOT NULL;

-- =============================================================================
-- PART 5: TRIGGER ROBUSTA PARA current_value
-- =============================================================================

-- Substituir função existente com versão mais robusta
CREATE OR REPLACE FUNCTION public.update_goal_current_value()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_goal_id UUID;
  v_new_goal_id UUID;
  v_new_total NUMERIC;
BEGIN
  -- Determinar qual(is) goal(s) atualizar
  IF TG_OP = 'DELETE' THEN
    v_old_goal_id := OLD.goal_id;
    v_new_goal_id := NULL;
  ELSIF TG_OP = 'INSERT' THEN
    v_old_goal_id := NULL;
    v_new_goal_id := NEW.goal_id;
  ELSE -- UPDATE
    v_old_goal_id := OLD.goal_id;
    v_new_goal_id := NEW.goal_id;
  END IF;

  -- Atualizar goal antigo (se mudou de goal em UPDATE ou DELETE)
  IF v_old_goal_id IS NOT NULL AND (v_new_goal_id IS NULL OR v_old_goal_id != v_new_goal_id) THEN
    SELECT COALESCE(SUM(delta_value), 0)
    INTO v_new_total
    FROM public.goal_progress
    WHERE goal_id = v_old_goal_id;

    UPDATE public.goals
    SET current_value = v_new_total,
        updated_at = NOW()
    WHERE id = v_old_goal_id;
  END IF;

  -- Atualizar goal novo/atual
  IF v_new_goal_id IS NOT NULL THEN
    SELECT COALESCE(SUM(delta_value), 0)
    INTO v_new_total
    FROM public.goal_progress
    WHERE goal_id = v_new_goal_id;

    UPDATE public.goals
    SET current_value = v_new_total,
        updated_at = NOW()
    WHERE id = v_new_goal_id;
  END IF;

  -- Retornar registro apropriado
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.update_goal_current_value IS 
  'Trigger function que recalcula current_value do goal quando goal_progress é alterado. 
   Trata INSERT, UPDATE (incluindo mudança de goal_id), e DELETE.';

-- Recriar trigger (garantir que está atualizado)
DROP TRIGGER IF EXISTS on_goal_progress_change ON public.goal_progress;
CREATE TRIGGER on_goal_progress_change
  AFTER INSERT OR UPDATE OR DELETE ON public.goal_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_goal_current_value();

-- =============================================================================
-- PART 6: REGISTRAR ESTA MIGRATION
-- =============================================================================

INSERT INTO public.schema_migrations (filename, notes) VALUES
  ('MIGRATION_0008_1_schema_migrations.sql', 'Tabela de tracking de migrations'),
  ('MIGRATION_0008_2_goals_integrity.sql', 'Constraints, índices e trigger robusta para Goals')
ON CONFLICT (filename) DO UPDATE SET 
  applied_at = NOW(),
  notes = EXCLUDED.notes;
