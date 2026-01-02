-- MIGRATION_0038_fix_source_constraint.sql
-- Fix the check constraint on goal_progress.source to allow 'finance_sync'
-- The error "violates check constraint 'goal_progress_source_check'" happens because 
-- 'finance_sync' was used in the trigger but not added to the allowed list.

-- 1. Drop the existing constraint
ALTER TABLE public.goal_progress DROP CONSTRAINT IF EXISTS goal_progress_source_check;

-- 2. Add the new constraint with all allowed values, including 'finance_sync'
ALTER TABLE public.goal_progress ADD CONSTRAINT goal_progress_source_check 
  CHECK (source IN ('app', 'whatsapp', 'integration', 'finance_sync'));
