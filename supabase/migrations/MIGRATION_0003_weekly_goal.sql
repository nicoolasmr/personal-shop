-- VIDA360 Sprint 1.1 Migration: Weekly Goal for Habits
-- Run this in your Supabase SQL Editor AFTER MIGRATION_0002_habits.sql
-- ===========================================================================

-- ===========================================================================
-- PART 1: ADD WEEKLY_GOAL COLUMN
-- ===========================================================================

-- Add weekly_goal column to habits table (default 7 = every day)
ALTER TABLE public.habits 
ADD COLUMN IF NOT EXISTS weekly_goal INT NOT NULL DEFAULT 7;

-- Add constraint to ensure weekly_goal is between 1 and 7
ALTER TABLE public.habits 
ADD CONSTRAINT habits_weekly_goal_check CHECK (weekly_goal >= 1 AND weekly_goal <= 7);
