-- Migration: Add reminder_time to habits
-- Description: Adds reminder_time column for habit notifications

ALTER TABLE public.habits 
ADD COLUMN IF NOT EXISTS reminder_time TIME;

COMMENT ON COLUMN public.habits.reminder_time IS 'Time of day to send reminder notification (HH:MM:SS)';
