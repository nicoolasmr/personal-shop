-- Migration: Payment methods and installments
-- Description: Adds payment_method and installment columns to transactions

ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'other' CHECK (payment_method IN ('credit_card', 'debit_card', 'pix', 'cash', 'boleto', 'check', 'transfer', 'other')),
ADD COLUMN IF NOT EXISTS installment_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS installment_number INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS parent_transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS is_installment_parcel BOOLEAN DEFAULT FALSE;

-- Index for parent_transaction_id
CREATE INDEX IF NOT EXISTS transactions_parent_id_idx ON public.transactions(parent_transaction_id) WHERE parent_transaction_id IS NOT NULL;

-- Function to get installments summary
CREATE OR REPLACE FUNCTION get_installments_summary(
  p_org_id uuid,
  p_user_id uuid
)
RETURNS TABLE (
  total_active_installments bigint,
  total_monthly_commitment numeric,
  total_remaining_amount numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT parent_transaction_id) FILTER (WHERE is_installment_parcel = true) as total_active_installments,
    COALESCE(SUM(amount) FILTER (
      WHERE is_installment_parcel = true 
      AND EXTRACT(YEAR FROM transaction_date) = EXTRACT(YEAR FROM CURRENT_DATE)
      AND EXTRACT(MONTH FROM transaction_date) = EXTRACT(MONTH FROM CURRENT_DATE)
    ), 0) as total_monthly_commitment,
    COALESCE(SUM(amount) FILTER (
      WHERE is_installment_parcel = true 
      AND transaction_date >= CURRENT_DATE
    ), 0) as total_remaining_amount
  FROM public.transactions
  WHERE org_id = p_org_id
    AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
