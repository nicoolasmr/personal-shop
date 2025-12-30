-- VIDA360 Sprint Hardening: Habits Module Security Hotfix (UPDATE/DELETE)
-- Run this in your Supabase SQL Editor AFTER MIGRATION_0002_1_hotfix_habits.sql
-- ===========================================================================

-- ===========================================================================
-- PART 1: FIX habit_checkins UPDATE RLS POLICY
-- ===========================================================================

-- The original policy "Users can update their own checkins" only checks:
-- 1. is_org_member(auth.uid(), org_id)
-- 2. user_id = auth.uid()
--
-- PROBLEM: Doesn't validate that the habit belongs to the user.
-- A malicious user could potentially update a checkin's habit_id to point
-- to a habit they don't own.
--
-- FIX: Add habit ownership validation

-- Drop the old policy
DROP POLICY IF EXISTS "Users can update their own checkins" ON public.habit_checkins;

-- Create the strengthened policy
CREATE POLICY "Users can update their own checkins"
  ON public.habit_checkins
  FOR UPDATE
  TO authenticated
  USING (
    public.is_org_member(auth.uid(), org_id) 
    AND user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.habits h
      WHERE h.id = habit_id
        AND h.org_id = habit_checkins.org_id
        AND h.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_org_member(auth.uid(), org_id) 
    AND user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.habits h
      WHERE h.id = habit_id
        AND h.org_id = habit_checkins.org_id
        AND h.user_id = auth.uid()
    )
  );

-- ===========================================================================
-- PART 2: FIX habit_checkins DELETE RLS POLICY
-- ===========================================================================

-- Same issue as UPDATE - need to validate habit ownership

-- Drop the old policy
DROP POLICY IF EXISTS "Users can delete their own checkins" ON public.habit_checkins;

-- Create the strengthened policy
CREATE POLICY "Users can delete their own checkins"
  ON public.habit_checkins
  FOR DELETE
  TO authenticated
  USING (
    public.is_org_member(auth.uid(), org_id) 
    AND user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.habits h
      WHERE h.id = habit_id
        AND h.org_id = habit_checkins.org_id
        AND h.user_id = auth.uid()
    )
  );
