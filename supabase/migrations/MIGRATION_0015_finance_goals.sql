-- Migration: Finance Goals
-- Description: Adds finance_goals table for specific financial tracking

CREATE TABLE IF NOT EXISTS public.finance_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('savings', 'expense_limit', 'income_target', 'emergency_fund')),
  target_amount NUMERIC(12, 2) NOT NULL CHECK (target_amount > 0),
  current_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  deadline DATE,
  category_id UUID REFERENCES public.transaction_categories(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  linked_goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.finance_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own finance goals"
  ON public.finance_goals FOR SELECT
  USING (org_id = public.get_user_org_id());

CREATE POLICY "Users can create finance goals"
  ON public.finance_goals FOR INSERT
  WITH CHECK (org_id = public.get_user_org_id() AND user_id = auth.uid());

CREATE POLICY "Users can update own finance goals"
  ON public.finance_goals FOR UPDATE
  USING (org_id = public.get_user_org_id() AND user_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS finance_goals_org_id_idx ON public.finance_goals(org_id);
CREATE INDEX IF NOT EXISTS finance_goals_user_id_idx ON public.finance_goals(user_id);
