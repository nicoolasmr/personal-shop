-- =============================================================================
-- VIDA360 Sprint 3.0 Migration: Goals Module
-- Run this in your Supabase SQL Editor AFTER all previous migrations
-- =============================================================================

-- =============================================================================
-- PART 1: GOALS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'custom' CHECK (type IN ('custom', 'financial', 'habit', 'task')),
  title TEXT NOT NULL,
  description TEXT NULL,
  target_value NUMERIC NULL,
  current_value NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NULL,
  due_date DATE NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'done', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for goals
CREATE INDEX IF NOT EXISTS goals_org_id_idx ON public.goals(org_id);
CREATE INDEX IF NOT EXISTS goals_user_id_idx ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS goals_status_idx ON public.goals(status);
CREATE INDEX IF NOT EXISTS goals_due_date_idx ON public.goals(due_date);
CREATE INDEX IF NOT EXISTS goals_org_user_idx ON public.goals(org_id, user_id);

-- =============================================================================
-- PART 2: GOAL_PROGRESS TABLE (Delta-based tracking)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.goal_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  progress_date DATE NOT NULL,
  delta_value NUMERIC NOT NULL,
  notes TEXT NULL,
  source TEXT NOT NULL DEFAULT 'app' CHECK (source IN ('app', 'whatsapp')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for goal_progress
CREATE INDEX IF NOT EXISTS goal_progress_org_id_idx ON public.goal_progress(org_id);
CREATE INDEX IF NOT EXISTS goal_progress_goal_id_idx ON public.goal_progress(goal_id);
CREATE INDEX IF NOT EXISTS goal_progress_user_date_idx ON public.goal_progress(user_id, progress_date);

-- =============================================================================
-- PART 3: RLS POLICIES FOR GOALS
-- =============================================================================

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (idempotent)
DROP POLICY IF EXISTS "Users can view goals in their org" ON public.goals;
DROP POLICY IF EXISTS "Users can create their own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can update their own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can delete their own goals" ON public.goals;

-- SELECT: Users can view goals in their org
CREATE POLICY "Users can view goals in their org"
  ON public.goals FOR SELECT
  TO authenticated
  USING (public.is_org_member(auth.uid(), org_id));

-- INSERT: Users can create their own goals
CREATE POLICY "Users can create their own goals"
  ON public.goals FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_org_member(auth.uid(), org_id)
    AND user_id = auth.uid()
  );

-- UPDATE: Users can update their own goals
CREATE POLICY "Users can update their own goals"
  ON public.goals FOR UPDATE
  TO authenticated
  USING (
    public.is_org_member(auth.uid(), org_id)
    AND user_id = auth.uid()
  )
  WITH CHECK (
    public.is_org_member(auth.uid(), org_id)
    AND user_id = auth.uid()
  );

-- DELETE: Users can delete their own goals
CREATE POLICY "Users can delete their own goals"
  ON public.goals FOR DELETE
  TO authenticated
  USING (
    public.is_org_member(auth.uid(), org_id)
    AND user_id = auth.uid()
  );

-- =============================================================================
-- PART 4: RLS POLICIES FOR GOAL_PROGRESS
-- =============================================================================

ALTER TABLE public.goal_progress ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (idempotent)
DROP POLICY IF EXISTS "Users can view progress in their org" ON public.goal_progress;
DROP POLICY IF EXISTS "Users can add progress to their goals" ON public.goal_progress;
DROP POLICY IF EXISTS "Users can update their own progress" ON public.goal_progress;
DROP POLICY IF EXISTS "Users can delete their own progress" ON public.goal_progress;

-- SELECT: Users can view progress in their org
CREATE POLICY "Users can view progress in their org"
  ON public.goal_progress FOR SELECT
  TO authenticated
  USING (public.is_org_member(auth.uid(), org_id));

-- INSERT: Users can add progress to their own goals
CREATE POLICY "Users can add progress to their goals"
  ON public.goal_progress FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_org_member(auth.uid(), org_id)
    AND user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.goals g
      WHERE g.id = goal_id
        AND g.org_id = goal_progress.org_id
        AND g.user_id = auth.uid()
    )
  );

-- UPDATE: Users can update their own progress entries
CREATE POLICY "Users can update their own progress"
  ON public.goal_progress FOR UPDATE
  TO authenticated
  USING (
    public.is_org_member(auth.uid(), org_id)
    AND user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.goals g
      WHERE g.id = goal_id
        AND g.org_id = goal_progress.org_id
        AND g.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_org_member(auth.uid(), org_id)
    AND user_id = auth.uid()
  );

-- DELETE: Users can delete their own progress entries
CREATE POLICY "Users can delete their own progress"
  ON public.goal_progress FOR DELETE
  TO authenticated
  USING (
    public.is_org_member(auth.uid(), org_id)
    AND user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.goals g
      WHERE g.id = goal_id
        AND g.org_id = goal_progress.org_id
        AND g.user_id = auth.uid()
    )
  );

-- =============================================================================
-- PART 5: TRIGGER TO UPDATE current_value ON PROGRESS CHANGES
-- =============================================================================

CREATE OR REPLACE FUNCTION public.update_goal_current_value()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_goal_id UUID;
  v_new_total NUMERIC;
BEGIN
  -- Determine which goal to update
  IF TG_OP = 'DELETE' THEN
    v_goal_id := OLD.goal_id;
  ELSE
    v_goal_id := NEW.goal_id;
  END IF;

  -- Calculate new total from all progress entries
  SELECT COALESCE(SUM(delta_value), 0)
  INTO v_new_total
  FROM public.goal_progress
  WHERE goal_id = v_goal_id;

  -- Update the goal's current_value
  UPDATE public.goals
  SET current_value = v_new_total,
      updated_at = NOW()
  WHERE id = v_goal_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS on_goal_progress_change ON public.goal_progress;
CREATE TRIGGER on_goal_progress_change
  AFTER INSERT OR UPDATE OR DELETE ON public.goal_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_goal_current_value();
