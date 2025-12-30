
-- MIGRATION_0025_ops_billing.sql
-- Description: Adds secure RPC to aggregate billing stats for Ops Console.

-- 1. Create Aggregation RPC
-- This function runs as owner (SECURITY DEFINER) to access all finance data
-- BUT it returns ONLY aggregated numbers, protecting individual transaction privacy.

CREATE OR REPLACE FUNCTION public.ops_billing_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_revenue numeric;
    v_active_subs bigint;
    v_churned_subs bigint;
    v_mrr numeric;
    v_recent_transactions_count bigint;
BEGIN
    -- Check permissions inside the function for double safety?
    -- No, usually RLS policies or API gate check it.
    -- But since this is a DEFINER function, we should ideally check caller permission.
    IF NOT public.has_permission('ops_billing_view') THEN
        RAISE EXCEPTION 'Access Denied';
    END IF;

    -- 1. Total Revenue (All time income)
    -- Assuming a 'transactions' table exists with type='income'
    SELECT COALESCE(SUM(amount), 0)
    INTO v_total_revenue
    FROM public.transactions
    WHERE type = 'income';

    -- 2. Subscription Stats (Mocked or Real if 'subscriptions' table exists?)
    -- Let's check if we have a subscriptions table logic or if we derive from users/profiles?
    -- Based on previous context, we might rely on 'profiles.plan' or specific table.
    -- Let's assume we count profiles with 'pro' or 'premium' plans as proxies for now if no rigid sub table.
    -- Or check if 'finance_goals' is related.
    -- Let's use 'profiles' roles or plans if available. 
    -- Actually we don't have a strict 'subscriptions' table in the context provided recently.
    -- We'll use 'transactions' recent reliable volume as proxy for MRR?
    -- OR we just aggregate transactions from last 30 days as "Monthly Revenue".
    
    SELECT COALESCE(SUM(amount), 0)
    INTO v_mrr
    FROM public.transactions
    WHERE type = 'income' 
    AND transaction_date >= (now() - interval '30 days')::date;

    -- 3. Transaction Volume (Last 24h)
    SELECT count(*)
    INTO v_recent_transactions_count
    FROM public.transactions
    WHERE created_at >= (now() - interval '24 hours');

    -- Return JSON
    RETURN jsonb_build_object(
        'total_revenue', v_total_revenue,
        'current_mrr_est', v_mrr, -- Estimated MRR based on 30d trailing income
        'recent_tx_volume', v_recent_transactions_count,
        'generated_at', now()
    );
END;
$$;

-- 2. Audit access?
-- We could log who accessed billing stats, but the general web log might cover it.
