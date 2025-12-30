-- Migration: Bug Reports Table
-- Description: Adds bug_reports table for user feedback

CREATE TABLE IF NOT EXISTS public.bug_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  steps TEXT,
  expected TEXT,
  actual TEXT,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  meta JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "bug_reports_insert"
  ON public.bug_reports FOR INSERT
  WITH CHECK (org_id = public.get_user_org_id() AND user_id = auth.uid());

-- Initial select policy (to be refined in MIGRATION_0020)
CREATE POLICY "bug_reports_select_own"
  ON public.bug_reports FOR SELECT
  USING (user_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS bug_reports_org_id_idx ON public.bug_reports(org_id);
CREATE INDEX IF NOT EXISTS bug_reports_user_id_idx ON public.bug_reports(user_id);
