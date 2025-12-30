-- =============================================================================
-- MIGRATION 0009: Finance Module
-- Sprint 3.1 - Finance MVP
-- =============================================================================
-- Tabelas: transaction_categories, transactions
-- RLS: Multi-tenant com org_id + user_id (via security definer function)
-- Audit: Trigger para audit_log
-- =============================================================================

-- ============================================
-- 0. Security Definer Function para org_id
-- ============================================
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id FROM public.profiles WHERE user_id = auth.uid()
$$;

-- ============================================
-- 1. Transaction Categories
-- ============================================
CREATE TABLE IF NOT EXISTS public.transaction_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  icon text DEFAULT 'Circle',
  color text DEFAULT 'gray',
  is_default boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Se a tabela já existia (tentativas anteriores), garante que as colunas base existam
ALTER TABLE public.transaction_categories ADD COLUMN IF NOT EXISTS org_id uuid;
ALTER TABLE public.transaction_categories ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.transaction_categories ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.transaction_categories ADD COLUMN IF NOT EXISTS type text;
ALTER TABLE public.transaction_categories ADD COLUMN IF NOT EXISTS icon text;
ALTER TABLE public.transaction_categories ADD COLUMN IF NOT EXISTS color text;
ALTER TABLE public.transaction_categories ADD COLUMN IF NOT EXISTS is_default boolean;
ALTER TABLE public.transaction_categories ADD COLUMN IF NOT EXISTS created_at timestamptz;

-- Enable RLS
ALTER TABLE public.transaction_categories ENABLE ROW LEVEL SECURITY;

-- Recria políticas de forma idempotente
DROP POLICY IF EXISTS "Users can view own categories" ON public.transaction_categories;
DROP POLICY IF EXISTS "Users can create categories" ON public.transaction_categories;
DROP POLICY IF EXISTS "Users can update own categories" ON public.transaction_categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON public.transaction_categories;

-- RLS Policies (usando security definer function)
CREATE POLICY "Users can view own categories"
  ON public.transaction_categories FOR SELECT
  USING (org_id = public.get_user_org_id());

CREATE POLICY "Users can create categories"
  ON public.transaction_categories FOR INSERT
  WITH CHECK (org_id = public.get_user_org_id() AND user_id = auth.uid());

CREATE POLICY "Users can update own categories"
  ON public.transaction_categories FOR UPDATE
  USING (org_id = public.get_user_org_id() AND user_id = auth.uid());

CREATE POLICY "Users can delete own categories"
  ON public.transaction_categories FOR DELETE
  USING (org_id = public.get_user_org_id() AND user_id = auth.uid() AND is_default = false);

-- Indexes
CREATE INDEX IF NOT EXISTS transaction_categories_org_id_idx ON public.transaction_categories(org_id);
CREATE INDEX IF NOT EXISTS transaction_categories_user_id_idx ON public.transaction_categories(user_id);
CREATE INDEX IF NOT EXISTS transaction_categories_type_idx ON public.transaction_categories(type);

-- ============================================
-- 2. Transactions
-- ============================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.transaction_categories(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  amount numeric(12, 2) NOT NULL CHECK (amount > 0),
  description text NOT NULL,
  notes text,
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  is_recurring boolean DEFAULT false,
  recurring_frequency text CHECK (recurring_frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Se a tabela já existia (tentativas anteriores), garante que as colunas base existam
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS org_id uuid;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS category_id uuid;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS type text;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS amount numeric(12, 2);
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS transaction_date date;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS is_recurring boolean;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS recurring_frequency text;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS created_at timestamptz;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS updated_at timestamptz;

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Recria políticas de forma idempotente
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can create transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON public.transactions;

-- RLS Policies (usando security definer function)
CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  USING (org_id = public.get_user_org_id());

CREATE POLICY "Users can create transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (org_id = public.get_user_org_id() AND user_id = auth.uid());

CREATE POLICY "Users can update own transactions"
  ON public.transactions FOR UPDATE
  USING (org_id = public.get_user_org_id() AND user_id = auth.uid());

CREATE POLICY "Users can delete own transactions"
  ON public.transactions FOR DELETE
  USING (org_id = public.get_user_org_id() AND user_id = auth.uid());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS transactions_org_id_idx ON public.transactions(org_id);
CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS transactions_category_id_idx ON public.transactions(category_id);
CREATE INDEX IF NOT EXISTS transactions_type_idx ON public.transactions(type);
CREATE INDEX IF NOT EXISTS transactions_date_idx ON public.transactions(transaction_date DESC);
-- date_trunc pode não ser IMMUTABLE dependendo do tipo; força cast para timestamp (IMMUTABLE)
CREATE INDEX IF NOT EXISTS transactions_month_idx ON public.transactions ((date_trunc('month', transaction_date::timestamp)));

-- ============================================
-- 3. Trigger for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS transactions_updated_at ON public.transactions;
CREATE TRIGGER transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_transactions_updated_at();

-- ============================================
-- 4. Function to get monthly summary
-- ============================================
CREATE OR REPLACE FUNCTION get_monthly_summary(
  p_org_id uuid,
  p_user_id uuid,
  p_year integer DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::integer,
  p_month integer DEFAULT EXTRACT(MONTH FROM CURRENT_DATE)::integer
)
RETURNS TABLE (
  total_income numeric,
  total_expense numeric,
  balance numeric,
  transaction_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
    COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense,
    COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) as balance,
    COUNT(*) as transaction_count
  FROM public.transactions
  WHERE org_id = p_org_id
    AND user_id = p_user_id
    AND EXTRACT(YEAR FROM transaction_date) = p_year
    AND EXTRACT(MONTH FROM transaction_date) = p_month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. Function to get category breakdown
-- ============================================
CREATE OR REPLACE FUNCTION get_category_breakdown(
  p_org_id uuid,
  p_user_id uuid,
  p_type text,
  p_year integer DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::integer,
  p_month integer DEFAULT EXTRACT(MONTH FROM CURRENT_DATE)::integer
)
RETURNS TABLE (
  category_id uuid,
  category_name text,
  category_color text,
  total_amount numeric,
  percentage numeric
) AS $$
DECLARE
  v_total numeric;
BEGIN
  -- Get total for the type
  SELECT COALESCE(SUM(amount), 0) INTO v_total
  FROM public.transactions
  WHERE org_id = p_org_id
    AND user_id = p_user_id
    AND type = p_type
    AND EXTRACT(YEAR FROM transaction_date) = p_year
    AND EXTRACT(MONTH FROM transaction_date) = p_month;

  RETURN QUERY
  SELECT 
    tc.id as category_id,
    COALESCE(tc.name, 'Sem categoria') as category_name,
    COALESCE(tc.color, 'gray') as category_color,
    COALESCE(SUM(t.amount), 0) as total_amount,
    CASE WHEN v_total > 0 THEN ROUND((COALESCE(SUM(t.amount), 0) / v_total) * 100, 1) ELSE 0 END as percentage
  FROM public.transactions t
  LEFT JOIN public.transaction_categories tc ON t.category_id = tc.id
  WHERE t.org_id = p_org_id
    AND t.user_id = p_user_id
    AND t.type = p_type
    AND EXTRACT(YEAR FROM t.transaction_date) = p_year
    AND EXTRACT(MONTH FROM t.transaction_date) = p_month
  GROUP BY tc.id, tc.name, tc.color
  ORDER BY total_amount DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. Register migration
-- ============================================
INSERT INTO public.schema_migrations (filename, checksum)
VALUES ('MIGRATION_0009_finance.sql', 'sprint_3_1_finance_mvp_v2')
ON CONFLICT (filename) DO UPDATE SET checksum = EXCLUDED.checksum;
