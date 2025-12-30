-- =============================================================================
-- MIGRATION 0018: Task Comments
-- Sprint 3.5.0 - Collaboration Basics
-- =============================================================================
-- Adds comments table for tasks
-- =============================================================================

-- ============================================
-- 1. Task Comments Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view comments of their tasks" ON public.task_comments;
CREATE POLICY "Users can view comments of their tasks"
  ON public.task_comments FOR SELECT
  USING (
    org_id = public.get_user_org_id()
    AND EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_id
        AND t.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create comments" ON public.task_comments;
CREATE POLICY "Users can create comments"
  ON public.task_comments FOR INSERT
  WITH CHECK (
    org_id = public.get_user_org_id()
    AND user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_id
        AND t.user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS task_comments_task_id_idx ON public.task_comments(task_id);

-- ============================================
-- 2. Register migration
-- ============================================
INSERT INTO public.schema_migrations (filename, checksum)
VALUES ('MIGRATION_0018_task_comments.sql', 'sprint_3_5_0_task_comments')
ON CONFLICT (filename) DO UPDATE SET checksum = EXCLUDED.checksum;
