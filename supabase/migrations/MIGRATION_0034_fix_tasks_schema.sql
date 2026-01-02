-- FIX: Create task_attachments table if missing
CREATE TABLE IF NOT EXISTS public.task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS task_attachments_task_id_idx ON public.task_attachments(task_id);
CREATE INDEX IF NOT EXISTS task_attachments_org_id_idx ON public.task_attachments(org_id);

-- RLS Policies for task_attachments
DROP POLICY IF EXISTS "Users can read attachments from their org" ON public.task_attachments;
CREATE POLICY "Users can read attachments from their org"
  ON public.task_attachments FOR SELECT
  USING (public.is_org_member(auth.uid(), org_id));

DROP POLICY IF EXISTS "Users can create attachments in their org" ON public.task_attachments;
CREATE POLICY "Users can create attachments in their org"
  ON public.task_attachments FOR INSERT
  WITH CHECK (public.is_org_member(auth.uid(), org_id));

DROP POLICY IF EXISTS "Users can delete their own attachments" ON public.task_attachments;
CREATE POLICY "Users can delete their own attachments"
  ON public.task_attachments FOR DELETE
  USING (public.is_org_member(auth.uid(), org_id));

-- FIX task_subtasks RLS Policy for INSERT (Simplifying to avoid NEW reference issues in EXISTS)
DROP POLICY IF EXISTS "Users can create subtasks" ON public.task_subtasks;
CREATE POLICY "Users can create subtasks"
  ON public.task_subtasks
  FOR INSERT
  WITH CHECK (
    public.is_org_member(auth.uid(), org_id)
  );

-- FIX: Ensure we didn't miss enabling RLS on subtasks in previous flawed migrations if any
ALTER TABLE public.task_subtasks ENABLE ROW LEVEL SECURITY;
