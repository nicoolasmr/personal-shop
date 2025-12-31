-- MIGRATION_0032_fix_calendar_schema.sql
-- Description: Ensure color and all_day columns exist and are correct to prevent schema errors.
-- Created at: 2025-12-31

-- Safely add 'color' if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'calendar_events' AND column_name = 'color') THEN
        ALTER TABLE public.calendar_events ADD COLUMN color text DEFAULT 'blue';
    END IF;
END $$;

-- Safely add 'all_day' if it doesn't exist (it should, but safety first)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'calendar_events' AND column_name = 'all_day') THEN
        ALTER TABLE public.calendar_events ADD COLUMN all_day boolean NOT NULL DEFAULT false;
    END IF;
END $$;
