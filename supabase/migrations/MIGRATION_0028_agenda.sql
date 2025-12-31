
-- MIGRATION_0028_agenda.sql
-- Description: Agenda Foundation (Calendar Events, Reminders, RLS, and Flag)
-- Created at: 2025-12-30

-- 1. Clean slate to avoid conflicts with pre-existing partial tables
DROP TABLE IF EXISTS public.calendar_reminders CASCADE;
DROP TABLE IF EXISTS public.calendar_events CASCADE;

-- 1. Create Calendar Events Table
CREATE TABLE public.calendar_events (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL DEFAULT auth.uid(),
    org_id uuid NOT NULL, -- Will be set by trigger
    title text NOT NULL,
    description text NULL,
    location text NULL,
    start_at timestamptz NOT NULL,
    end_at timestamptz NOT NULL,
    all_day boolean NOT NULL DEFAULT false,
    source text NOT NULL DEFAULT 'manual', -- manual, whatsapp, system
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT calendar_events_pkey PRIMARY KEY (id),
    CONSTRAINT calendar_events_dates_check CHECK (end_at >= start_at)
);

-- 2. Create Calendar Reminders Table
CREATE TABLE IF NOT EXISTS public.calendar_reminders (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    event_id uuid NOT NULL REFERENCES public.calendar_events(id) ON DELETE CASCADE,
    user_id uuid NOT NULL DEFAULT auth.uid(),
    org_id uuid NOT NULL, -- Will be set by trigger
    remind_at timestamptz NOT NULL,
    channel text NOT NULL DEFAULT 'push', -- push, whatsapp
    created_at timestamptz DEFAULT now(),
    CONSTRAINT calendar_reminders_pkey PRIMARY KEY (id)
);

-- 3. Indexes for range queries and lookup
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_range ON public.calendar_events (user_id, start_at, end_at);
CREATE INDEX IF NOT EXISTS idx_calendar_events_org_range ON public.calendar_events (org_id, start_at);
CREATE INDEX IF NOT EXISTS idx_calendar_reminders_user_time ON public.calendar_reminders (user_id, remind_at);

-- 4. Secure Org ID Trigger (Multi-tenant Integrity)
CREATE OR REPLACE FUNCTION public.set_calendar_org_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_org_id uuid;
BEGIN
    -- Get org_id from user profile
    SELECT org_id INTO v_org_id
    FROM public.profiles
    WHERE user_id = auth.uid();

    IF v_org_id IS NULL THEN
        RAISE EXCEPTION 'User profile not found or missing org_id';
    END IF;

    -- Force the org_id to match the user's org
    NEW.org_id := v_org_id;
    -- Force user_id to match auth.uid() (double check)
    NEW.user_id := auth.uid();
    
    RETURN NEW;
END;
$$;

-- Apply trigger to events
CREATE TRIGGER trg_calendar_events_org
    BEFORE INSERT ON public.calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION public.set_calendar_org_id();

-- Apply trigger to reminders
CREATE TRIGGER trg_calendar_reminders_org
    BEFORE INSERT ON public.calendar_reminders
    FOR EACH ROW
    EXECUTE FUNCTION public.set_calendar_org_id();

-- 5. Enable RLS (Deny by default)
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_reminders ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies (User Isolation)

-- Events
CREATE POLICY "Users can only see their own events" ON public.calendar_events
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own events" ON public.calendar_events
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own events" ON public.calendar_events
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own events" ON public.calendar_events
    FOR DELETE USING (user_id = auth.uid());

-- Reminders
CREATE POLICY "Users can manage their own reminders" ON public.calendar_reminders
    FOR ALL USING (user_id = auth.uid());

-- 7. Add Feature Flag
INSERT INTO public.feature_flags (key, description, is_enabled)
VALUES ('agenda_enabled', 'Enable Calendar/Agenda module', false)
ON CONFLICT (key) DO NOTHING;
