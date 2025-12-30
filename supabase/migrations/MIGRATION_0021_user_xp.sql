-- Migration: User XP and Real Leveling System
-- Description: Adds user_xp table and triggers to automate XP gain on key actions

-- Create user_xp table
CREATE TABLE IF NOT EXISTS public.user_xp (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp INTEGER NOT NULL DEFAULT 0,
  current_level INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_xp ENABLE ROW LEVEL SECURITY;

-- RLS policies
DROP POLICY IF EXISTS "Users can view own XP" ON public.user_xp;
CREATE POLICY "Users can view own XP"
  ON public.user_xp FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Function to add XP and handle level ups
CREATE OR REPLACE FUNCTION public.add_user_xp(p_user_id UUID, p_amount INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_xp (user_id, total_xp, current_level)
  VALUES (p_user_id, p_amount, 1)
  ON CONFLICT (user_id) DO UPDATE
  SET total_xp = user_xp.total_xp + p_amount,
      updated_at = NOW();
END;
$$;

-- Trigger for Habit Checkins
CREATE OR REPLACE FUNCTION public.on_habit_checkin_xp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed = true AND (OLD IS NULL OR OLD.completed = false) THEN
    PERFORM public.add_user_xp(NEW.user_id, 10);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_habit_checkin_xp ON public.habit_checkins;
CREATE TRIGGER tr_habit_checkin_xp
AFTER INSERT OR UPDATE ON public.habit_checkins
FOR EACH ROW EXECUTE FUNCTION public.on_habit_checkin_xp();

-- Trigger for Task Completion
CREATE OR REPLACE FUNCTION public.on_task_completion_xp()
RETURNS TRIGGER AS $$
BEGIN
  -- We assume tasks table has a 'completed' boolean or 'status' check
  -- If using task_subtasks for modular XP:
  IF NEW.completed = true AND (OLD IS NULL OR OLD.completed = false) THEN
    PERFORM public.add_user_xp(NEW.user_id, 5);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Check if task_subtasks table exists before applying trigger
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'task_subtasks') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_task_subtask_xp') THEN
      CREATE TRIGGER tr_task_subtask_xp
      AFTER INSERT OR UPDATE ON public.task_subtasks
      FOR EACH ROW EXECUTE FUNCTION public.on_task_completion_xp();
    END IF;
  END IF;
END $$;

-- Initialize XP for existing users based on their profile
INSERT INTO public.user_xp (user_id, total_xp)
SELECT user_id, 0 FROM public.profiles
ON CONFLICT DO NOTHING;
