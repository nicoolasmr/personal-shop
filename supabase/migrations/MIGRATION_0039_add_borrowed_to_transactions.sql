-- MIGRATION_0039_add_borrowed_to_transactions.sql
-- Adiciona campos para controle de empréstimos em transações

ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS is_loan BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS loan_contact TEXT;

COMMENT ON COLUMN public.transactions.is_loan IS 'Indica se a transação é um empréstimo (cartão emprestado)';
COMMENT ON COLUMN public.transactions.loan_contact IS 'Nome da pessoa para quem o cartão foi emprestado';
