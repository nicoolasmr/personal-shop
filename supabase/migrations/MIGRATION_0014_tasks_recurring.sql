-- =============================================================================
-- MIGRATION 0014: Recurring Tasks Schema
-- Sprint 3.2.0 - Recurring Tasks Architecture
-- =============================================================================
-- Adds recurrence fields to tasks and creates table for recurrence history
-- =============================================================================

-- ============================================
-- 1. Updates tasks table
-- ============================================

-- Add recurrence fields
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS recurrence_rule TEXT, -- iCal RRULE format or custom JSON
ADD COLUMN IF NOT EXISTS recurrence_parent_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS recurrence_next_date DATE;

-- Index for recurrence processing
CREATE INDEX IF NOT EXISTS tasks_recurrence_next_date_idx 
  ON public.tasks (recurrence_next_date) 
  WHERE is_recurring = TRUE;

-- ============================================
-- 2. Recurrence History/Exceptions table
-- ============================================

CREATE TABLE IF NOT EXISTS public.task_recurrence_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  occurrence_date DATE NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'skipped')),
  
  UNIQUE(task_id, occurrence_date)
);

-- Enable RLS
ALTER TABLE public.task_recurrence_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own recurrence history" ON public.task_recurrence_history;
CREATE POLICY "Users can view own recurrence history"
  ON public.task_recurrence_history FOR SELECT
  USING (org_id = public.get_user_org_id());

DROP POLICY IF EXISTS "Users can create recurrence history" ON public.task_recurrence_history;
CREATE POLICY "Users can create recurrence history"
  ON public.task_recurrence_history FOR INSERT
  WITH CHECK (org_id = public.get_user_org_id());

-- ============================================
-- 3. Register migration
-- ============================================
INSERT INTO public.schema_migrations (filename, checksum)
VALUES ('MIGRATION_0014_tasks_recurring.sql', 'sprint_3_2_0_recurring_tasks')
ON CONFLICT (filename) DO UPDATE SET checksum = EXCLUDED.checksum;
