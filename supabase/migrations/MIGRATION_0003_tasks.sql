-- VIDA360 Sprint 2 Migration: Tasks Module (Kanban)
-- Run this in your Supabase SQL Editor AFTER MIGRATION_0002_habits.sql
-- ===========================================================================

-- ===========================================================================
-- PART 1: TASKS TABLE
-- ===========================================================================

CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'doing', 'done')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date DATE,
  tags TEXT[] NOT NULL DEFAULT '{}',
  sort_order INT NOT NULL DEFAULT 0,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX tasks_org_id_idx ON public.tasks(org_id);
CREATE INDEX tasks_user_id_idx ON public.tasks(user_id);
CREATE INDEX tasks_status_sort_idx ON public.tasks(status, sort_order);
CREATE INDEX tasks_due_date_idx ON public.tasks(due_date);
CREATE INDEX tasks_archived_idx ON public.tasks(archived);

-- Updated_at trigger
CREATE TRIGGER tasks_set_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- ===========================================================================
-- PART 2: TASK_SUBTASKS TABLE
-- ===========================================================================

CREATE TABLE public.task_subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX task_subtasks_org_id_idx ON public.task_subtasks(org_id);
CREATE INDEX task_subtasks_task_id_idx ON public.task_subtasks(task_id);
CREATE INDEX task_subtasks_user_id_idx ON public.task_subtasks(user_id);

-- Enable RLS
ALTER TABLE public.task_subtasks ENABLE ROW LEVEL SECURITY;

-- ===========================================================================
-- PART 3: RLS POLICIES FOR TASKS
-- ===========================================================================

-- SELECT: Users can read tasks from their org
CREATE POLICY "Users can read tasks from their org"
  ON public.tasks
  FOR SELECT
  TO authenticated
  USING (
    public.is_org_member(auth.uid(), org_id)
  );

-- INSERT: Users can create tasks in their org
CREATE POLICY "Users can create tasks in their org"
  ON public.tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_org_member(auth.uid(), org_id) AND user_id = auth.uid()
  );

-- UPDATE: Users can update their own tasks
CREATE POLICY "Users can update their own tasks"
  ON public.tasks
  FOR UPDATE
  TO authenticated
  USING (
    public.is_org_member(auth.uid(), org_id) AND user_id = auth.uid()
  )
  WITH CHECK (
    public.is_org_member(auth.uid(), org_id) AND user_id = auth.uid()
  );

-- DELETE: Users can delete their own tasks
CREATE POLICY "Users can delete their own tasks"
  ON public.tasks
  FOR DELETE
  TO authenticated
  USING (
    public.is_org_member(auth.uid(), org_id) AND user_id = auth.uid()
  );

-- ===========================================================================
-- PART 4: RLS POLICIES FOR TASK_SUBTASKS
-- ===========================================================================

-- SELECT: Users can read subtasks from their org
CREATE POLICY "Users can read subtasks from their org"
  ON public.task_subtasks
  FOR SELECT
  TO authenticated
  USING (
    public.is_org_member(auth.uid(), org_id)
  );

-- INSERT: Users can create subtasks for tasks in their org
CREATE POLICY "Users can create subtasks"
  ON public.task_subtasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_org_member(auth.uid(), org_id) 
    AND user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.tasks 
      WHERE tasks.id = task_id 
      AND tasks.org_id = task_subtasks.org_id
    )
  );

-- UPDATE: Users can update their own subtasks
CREATE POLICY "Users can update their own subtasks"
  ON public.task_subtasks
  FOR UPDATE
  TO authenticated
  USING (
    public.is_org_member(auth.uid(), org_id) AND user_id = auth.uid()
  )
  WITH CHECK (
    public.is_org_member(auth.uid(), org_id) AND user_id = auth.uid()
  );

-- DELETE: Users can delete their own subtasks
CREATE POLICY "Users can delete their own subtasks"
  ON public.task_subtasks
  FOR DELETE
  TO authenticated
  USING (
    public.is_org_member(auth.uid(), org_id) AND user_id = auth.uid()
  );
