-- VIDA360 Sprint Hardening: Habits Module Security Hotfix
-- Run this in your Supabase SQL Editor AFTER MIGRATION_0002_habits.sql
-- ===========================================================================

-- ===========================================================================
-- PART 1: FIX habit_checkins INSERT RLS POLICY
-- ===========================================================================

-- The original policy "Users can create checkins" checks:
-- 1. is_org_member(auth.uid(), org_id)
-- 2. user_id = auth.uid()
-- 3. EXISTS check on habits table (validates org_id match)
--
-- PROBLEM: The EXISTS clause doesn't validate that the habit belongs to the
-- user, allowing potential cross-user checkin creation within the same org.
--
-- FIX: Strengthen the policy to also verify habit ownership (habit.user_id = auth.uid())

-- Drop the old policy
DROP POLICY IF EXISTS "Users can create checkins" ON public.habit_checkins;

-- Create the strengthened policy
CREATE POLICY "Users can create checkins"
  ON public.habit_checkins
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User must be member of the org
    public.is_org_member(auth.uid(), org_id)
    -- Checkin user_id must be the authenticated user
    AND user_id = auth.uid()
    -- Habit must exist, belong to the same org, AND be owned by the user
    AND EXISTS (
      SELECT 1 FROM public.habits h
      WHERE h.id = habit_id
        AND h.org_id = habit_checkins.org_id
        AND h.user_id = auth.uid()  -- NEW: Validates habit ownership
    )
  );

-- ===========================================================================
-- PART 2: CREATE INDEX FOR EFFICIENT RLS LOOKUPS
-- ===========================================================================

-- Composite index to speed up the RLS policy EXISTS check
CREATE INDEX IF NOT EXISTS habits_org_user_idx 
  ON public.habits(org_id, user_id);
