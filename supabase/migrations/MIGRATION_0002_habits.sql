-- VIDA360 Sprint 1 Migration: Habits Module
-- Run this in your Supabase SQL Editor AFTER MIGRATION_0001
-- ===========================================================================

-- ===========================================================================
-- PART 1: HELPER FUNCTION (updated_at trigger)
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ===========================================================================
-- PART 2: HABITS TABLE
-- ===========================================================================

CREATE TABLE public.habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  frequency JSONB NOT NULL DEFAULT '{"type":"daily"}'::jsonb,
  target INT NOT NULL DEFAULT 1,
  color TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX habits_org_id_idx ON public.habits(org_id);
CREATE INDEX habits_user_id_idx ON public.habits(user_id);
CREATE INDEX habits_active_idx ON public.habits(active);
CREATE INDEX habits_created_at_idx ON public.habits(created_at DESC);

-- Updated_at trigger
CREATE TRIGGER habits_set_updated_at
  BEFORE UPDATE ON public.habits
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Enable RLS
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

-- ===========================================================================
-- PART 3: HABIT_CHECKINS TABLE
-- ===========================================================================

CREATE TABLE public.habit_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  source TEXT NOT NULL DEFAULT 'app', -- 'app' | 'whatsapp'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Prevent duplicate checkins on same day for same habit
  CONSTRAINT habit_checkins_unique_day UNIQUE (habit_id, checkin_date)
);

-- Indexes
CREATE INDEX habit_checkins_org_id_idx ON public.habit_checkins(org_id);
CREATE INDEX habit_checkins_habit_id_idx ON public.habit_checkins(habit_id);
CREATE INDEX habit_checkins_user_date_idx ON public.habit_checkins(user_id, checkin_date);
CREATE INDEX habit_checkins_date_idx ON public.habit_checkins(checkin_date DESC);

-- Enable RLS
ALTER TABLE public.habit_checkins ENABLE ROW LEVEL SECURITY;

-- ===========================================================================
-- PART 4: SECURITY DEFINER FUNCTION FOR MEMBERSHIP CHECK
-- ===========================================================================

-- Function to check if user is member of org (avoids recursion in RLS)
CREATE OR REPLACE FUNCTION public.is_org_member(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE user_id = _user_id AND org_id = _org_id
  )
$$;

-- ===========================================================================
-- PART 5: RLS POLICIES FOR HABITS
-- ===========================================================================

-- SELECT: Users can read habits from their org
CREATE POLICY "Users can read habits from their org"
  ON public.habits
  FOR SELECT
  TO authenticated
  USING (
    public.is_org_member(auth.uid(), org_id)
  );

-- INSERT: Users can create habits in their org
CREATE POLICY "Users can create habits in their org"
  ON public.habits
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_org_member(auth.uid(), org_id) AND user_id = auth.uid()
  );

-- UPDATE: Users can update their own habits
CREATE POLICY "Users can update their own habits"
  ON public.habits
  FOR UPDATE
  TO authenticated
  USING (
    public.is_org_member(auth.uid(), org_id) AND user_id = auth.uid()
  )
  WITH CHECK (
    public.is_org_member(auth.uid(), org_id) AND user_id = auth.uid()
  );

-- DELETE: Users can delete their own habits (prefer archive instead)
CREATE POLICY "Users can delete their own habits"
  ON public.habits
  FOR DELETE
  TO authenticated
  USING (
    public.is_org_member(auth.uid(), org_id) AND user_id = auth.uid()
  );

-- ===========================================================================
-- PART 6: RLS POLICIES FOR HABIT_CHECKINS
-- ===========================================================================

-- SELECT: Users can read checkins from their org
CREATE POLICY "Users can read checkins from their org"
  ON public.habit_checkins
  FOR SELECT
  TO authenticated
  USING (
    public.is_org_member(auth.uid(), org_id)
  );

-- INSERT: Users can create checkins for their habits
CREATE POLICY "Users can create checkins"
  ON public.habit_checkins
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_org_member(auth.uid(), org_id) 
    AND user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.habits 
      WHERE habits.id = habit_id 
      AND habits.org_id = habit_checkins.org_id
    )
  );

-- UPDATE: Users can update their own checkins
CREATE POLICY "Users can update their own checkins"
  ON public.habit_checkins
  FOR UPDATE
  TO authenticated
  USING (
    public.is_org_member(auth.uid(), org_id) AND user_id = auth.uid()
  )
  WITH CHECK (
    public.is_org_member(auth.uid(), org_id) AND user_id = auth.uid()
  );

-- DELETE: Users can delete their own checkins
CREATE POLICY "Users can delete their own checkins"
  ON public.habit_checkins
  FOR DELETE
  TO authenticated
  USING (
    public.is_org_member(auth.uid(), org_id) AND user_id = auth.uid()
  );
