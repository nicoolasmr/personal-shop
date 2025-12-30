-- =============================================================================
-- MIGRATION 0020: Bug Reporting Module
-- Sprint 4.2.0 - User Feedback & Support
-- =============================================================================
-- Tables: bug_reports
-- RLS: Only reporter and admins can see
-- =============================================================================

-- ============================================
-- 1. Bug Reports Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.bug_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES public.orgs(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  device_info JSONB DEFAULT '{}'::JSONB,
  screenshots TEXT[] DEFAULT '{}'::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can create bug reports" ON public.bug_reports;
CREATE POLICY "Users can create bug reports"
  ON public.bug_reports FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own bug reports" ON public.bug_reports;
CREATE POLICY "Users can view own bug reports"
  ON public.bug_reports FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role('admin'));

-- Indexes
CREATE INDEX IF NOT EXISTS bug_reports_user_id_idx ON public.bug_reports(user_id);
CREATE INDEX IF NOT EXISTS bug_reports_status_idx ON public.bug_reports(status);

-- ============================================
-- 2. Register migration
-- ============================================
INSERT INTO public.schema_migrations (filename, checksum)
VALUES ('MIGRATION_0020_bug_reporting.sql', 'sprint_4_2_0_bug_reports')
ON CONFLICT (filename) DO UPDATE SET checksum = EXCLUDED.checksum;
