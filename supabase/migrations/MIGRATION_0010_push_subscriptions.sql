-- =============================================================================
-- MIGRATION 0010: Push Notifications Subscriptions
-- Sprint 3.4 - Real Push Notifications
-- =============================================================================
-- Tabela: push_subscriptions
-- RLS: Multi-tenant com org_id + user_id
-- =============================================================================

-- ============================================
-- 1. Push Subscriptions Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can create subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can delete own subscriptions" ON public.push_subscriptions;

-- RLS Policies
CREATE POLICY "Users can view own subscriptions"
  ON public.push_subscriptions FOR SELECT
  USING (org_id = public.get_user_org_id());

CREATE POLICY "Users can create subscriptions"
  ON public.push_subscriptions FOR INSERT
  WITH CHECK (org_id = public.get_user_org_id() AND user_id = auth.uid());

CREATE POLICY "Users can update own subscriptions"
  ON public.push_subscriptions FOR UPDATE
  USING (org_id = public.get_user_org_id() AND user_id = auth.uid());

CREATE POLICY "Users can delete own subscriptions"
  ON public.push_subscriptions FOR DELETE
  USING (org_id = public.get_user_org_id() AND user_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS push_subscriptions_org_id_idx ON public.push_subscriptions(org_id);
CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx ON public.push_subscriptions(user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_push_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS push_subscriptions_updated_at ON public.push_subscriptions;
CREATE TRIGGER push_subscriptions_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_push_subscriptions_updated_at();

-- ============================================
-- 2. Register migration
-- ============================================
INSERT INTO public.schema_migrations (filename, checksum)
VALUES ('MIGRATION_0010_push_subscriptions.sql', 'sprint_3_4_push_notifications')
ON CONFLICT (filename) DO UPDATE SET checksum = EXCLUDED.checksum;
