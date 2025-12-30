-- =============================================================================
-- MIGRATION 0009_1: Habit-Goal Sync Trigger
-- Sprint 3.1 - Sincronização automática Hábitos → Metas
-- =============================================================================
-- Quando um habit_checkin é criado, automaticamente adiciona progresso
-- na meta vinculada (se existir linked_habit_id)
-- =============================================================================

-- ============================================
-- 1. Function to sync habit checkin to goal progress
-- ============================================
CREATE OR REPLACE FUNCTION sync_habit_checkin_to_goal()
RETURNS TRIGGER AS $$
DECLARE
  v_goal RECORD;
  v_checkin_value integer;
BEGIN
  -- Only process INSERT events (new checkins)
  IF TG_OP = 'INSERT' THEN
    -- Find goals linked to this habit
    FOR v_goal IN 
      SELECT g.id, g.org_id, g.user_id, g.unit
      FROM public.goals g
      WHERE g.linked_habit_id = NEW.habit_id
        AND g.status = 'active'
    LOOP
      -- Calculate delta value based on habit type
      -- For now, assume 1 completion = 1 unit of progress
      v_checkin_value := 1;
      
      -- Insert progress record
      INSERT INTO public.goal_progress (
        org_id,
        goal_id,
        user_id,
        progress_date,
        delta_value,
        notes,
        source
      ) VALUES (
        v_goal.org_id,
        v_goal.id,
        v_goal.user_id,
        NEW.checkin_date,
        v_checkin_value,
        'Sincronizado do hábito',
        'integration'
      )
      -- Avoid duplicate entries for same date
      ON CONFLICT DO NOTHING;
      
      -- Log the sync (optional - for debugging)
      RAISE NOTICE 'Synced habit checkin % to goal %', NEW.id, v_goal.id;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. Trigger on habit_checkins
-- ============================================
DROP TRIGGER IF EXISTS on_habit_checkin_sync_goal ON public.habit_checkins;
CREATE TRIGGER on_habit_checkin_sync_goal
  AFTER INSERT ON public.habit_checkins
  FOR EACH ROW
  EXECUTE FUNCTION sync_habit_checkin_to_goal();

-- ============================================
-- 3. Function to handle habit checkin deletion
-- ============================================
CREATE OR REPLACE FUNCTION unsync_habit_checkin_from_goal()
RETURNS TRIGGER AS $$
BEGIN
  -- When a checkin is deleted, remove the corresponding goal progress
  DELETE FROM public.goal_progress gp
  USING public.goals g
  WHERE gp.goal_id = g.id
    AND g.linked_habit_id = OLD.habit_id
    AND gp.progress_date = OLD.checkin_date
    AND gp.source = 'integration';
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. Trigger for deletion
-- ============================================
DROP TRIGGER IF EXISTS on_habit_checkin_unsync_goal ON public.habit_checkins;
CREATE TRIGGER on_habit_checkin_unsync_goal
  AFTER DELETE ON public.habit_checkins
  FOR EACH ROW
  EXECUTE FUNCTION unsync_habit_checkin_from_goal();

-- ============================================
-- 5. Add unique constraint to prevent duplicate progress
-- ============================================
-- This allows only one progress entry per goal per date from integration source
CREATE UNIQUE INDEX IF NOT EXISTS goal_progress_unique_integration_idx 
  ON public.goal_progress (goal_id, progress_date) 
  WHERE source = 'integration';

-- ============================================
-- 6. Register migration
-- ============================================
INSERT INTO public.schema_migrations (filename, checksum)
VALUES ('MIGRATION_0009_1_habit_goal_sync.sql', 'sprint_3_1_habit_goal_sync')
ON CONFLICT (filename) DO NOTHING;
