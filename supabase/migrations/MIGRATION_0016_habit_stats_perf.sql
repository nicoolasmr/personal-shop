-- =============================================================================
-- MIGRATION 0016: Habit Stats Performance
-- Sprint 3.3.0 - Dashboard Optimization
-- =============================================================================
-- Optimized indexes for habit completion calculations
-- =============================================================================

-- ============================================
-- 1. Optimized Indexes for Stats
-- ============================================

-- Fast checkin lookup by user and month
-- Helps with streak and completion rate calculations
CREATE INDEX IF NOT EXISTS habit_checkins_user_date_idx 
  ON public.habit_checkins (user_id, checkin_date DESC);

-- Composite index for habits dashboard (active habits by user)
CREATE INDEX IF NOT EXISTS habits_user_active_idx 
  ON public.habits (user_id, archived) 
  WHERE archived = FALSE;

-- ============================================
-- 2. Performance view for Habits (optional)
-- ============================================

-- This view pre-calculates simple stats for the UI
-- (Currently keeping logic in Application Layer for flexibility, 
-- but indexes support both)

-- ============================================
-- 3. Register migration
-- ============================================
INSERT INTO public.schema_migrations (filename, checksum)
VALUES ('MIGRATION_0016_habit_stats_perf.sql', 'sprint_3_3_0_habit_perf')
ON CONFLICT (filename) DO UPDATE SET checksum = EXCLUDED.checksum;
