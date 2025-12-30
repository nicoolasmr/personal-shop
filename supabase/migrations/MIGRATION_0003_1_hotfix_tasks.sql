-- VIDA360 Sprint 2 Hotfix: Tasks Module Security & Ordering
-- Run this in your Supabase SQL Editor AFTER MIGRATION_0003_tasks.sql
-- ===========================================================================

-- ===========================================================================
-- PART 1: FIX task_subtasks INSERT RLS POLICY (RISCO 2)
-- ===========================================================================

-- The original policy "Users can create subtasks" checks:
-- 1. is_org_member(auth.uid(), org_id)
-- 2. user_id = auth.uid()
-- 3. EXISTS check on tasks table
--
-- PROBLEM: The EXISTS clause doesn't validate that the task belongs to the
-- user, allowing potential cross-user subtask creation within the same org.
--
-- FIX: Strengthen the policy to also verify task ownership (task.user_id = auth.uid())

-- Drop the old policy
DROP POLICY IF EXISTS "Users can create subtasks" ON public.task_subtasks;

-- Create the strengthened policy
CREATE POLICY "Users can create subtasks"
  ON public.task_subtasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User must be member of the org
    public.is_org_member(auth.uid(), org_id)
    -- Subtask user_id must be the authenticated user
    AND user_id = auth.uid()
    -- Task must exist, belong to the same org, AND be owned by the user
    AND EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_id
        AND t.org_id = task_subtasks.org_id
        AND t.user_id = auth.uid()
    )
  );

-- ===========================================================================
-- PART 2: CREATE INDEX FOR EFFICIENT RLS LOOKUPS
-- ===========================================================================

-- Composite index to speed up the RLS policy EXISTS check
CREATE INDEX IF NOT EXISTS tasks_org_user_idx 
  ON public.tasks(org_id, user_id);

-- ===========================================================================
-- PART 3: OPTIONAL - Normalize existing sort_order values
-- ===========================================================================

-- This function reindexes all tasks with gap ordering (1000, 2000, 3000...)
-- Call this once if you have existing data with sequential/colliding sort_order values

CREATE OR REPLACE FUNCTION public.reindex_all_task_columns(p_org_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status TEXT;
  v_task RECORD;
  v_counter INT;
  v_gap_size INT := 1000;
BEGIN
  FOR v_status IN SELECT unnest(ARRAY['todo', 'doing', 'done']) LOOP
    v_counter := 1;
    FOR v_task IN 
      SELECT id 
      FROM tasks 
      WHERE org_id = p_org_id 
        AND status = v_status 
        AND archived = false
      ORDER BY sort_order, created_at
    LOOP
      UPDATE tasks 
      SET sort_order = v_counter * v_gap_size 
      WHERE id = v_task.id;
      v_counter := v_counter + 1;
    END LOOP;
  END LOOP;
END;
$$;

-- Grant execute to authenticated users (they can only affect their org's data due to RLS)
GRANT EXECUTE ON FUNCTION public.reindex_all_task_columns(UUID) TO authenticated;
