-- =============================================================================
-- MIGRATION 0035: Fix Finance Foreign Key Constraints
-- =============================================================================
-- Problem: user_id foreign key references auth.users which may not exist
-- Solution: Remove FK constraint or change to reference profiles.user_id
-- =============================================================================

-- Drop existing foreign key constraints on user_id
ALTER TABLE public.transactions 
DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;

ALTER TABLE public.transaction_categories 
DROP CONSTRAINT IF EXISTS transaction_categories_user_id_fkey;

-- Optionally: Add new constraint referencing profiles instead
-- This is safer in a multi-tenant system
ALTER TABLE public.transactions
ADD CONSTRAINT transactions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.transaction_categories
ADD CONSTRAINT transaction_categories_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
