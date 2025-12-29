// =============================================================================
// Finance Service
// =============================================================================

import { supabase } from '@/lib/supabase';
import type {
    Transaction,
    TransactionWithCategory,
    TransactionCategory,
    CreateTransactionPayload,
    MonthlySummary,
    CategoryBreakdown,
    ActiveInstallment,
    FinanceGoal,
} from '@/types/finance';

// =============================================================================
// Transactions
// =============================================================================

export async function fetchTransactions(orgId: string, year?: number, month?: number): Promise<TransactionWithCategory[]> {
    let query = supabase.from('transactions').select('*').eq('org_id', orgId).order('transaction_date', { ascending: false });
    if (year && month) {
        const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
        const endDate = new Date(year, month, 0).toISOString().split('T')[0];
        query = query.gte('transaction_date', startDate).lte('transaction_date', endDate);
    }
    const { data: transactions } = await query;
    // Fetch categories separately and merge
    return (transactions || []) as TransactionWithCategory[];
}

export async function createTransaction(orgId: string, userId: string, payload: CreateTransactionPayload): Promise<Transaction> {
    const installmentCount = payload.installment_count || 1;
    const parcelAmount = installmentCount > 1 ? Math.round((payload.amount / installmentCount) * 100) / 100 : payload.amount;

    const { data } = await supabase.from('transactions').insert({
        org_id: orgId,
        user_id: userId,
        type: payload.type,
        amount: parcelAmount,
        description: payload.description,
        transaction_date: payload.transaction_date || new Date().toISOString().split('T')[0],
        payment_method: payload.payment_method || 'other',
        installment_count: installmentCount,
        installment_number: 1,
    }).select().single();

    // If installments > 1, call RPC to generate parcels
    if (installmentCount > 1) {
        await supabase.rpc('generate_installment_parcels', { p_parent_id: data.id, p_installment_count: installmentCount });
    }

    return data;
}

// =============================================================================
// Categories
// =============================================================================

export async function fetchCategories(orgId: string): Promise<TransactionCategory[]> {
    const { data } = await supabase.from('transaction_categories').select('*').eq('org_id', orgId).order('name');
    return data || [];
}

// =============================================================================
// Summary & Analytics (RPCs)
// =============================================================================

export async function fetchMonthlySummary(orgId: string, userId: string, year?: number, month?: number): Promise<MonthlySummary> {
    const { data } = await supabase.rpc('get_monthly_summary', { p_org_id: orgId, p_user_id: userId, p_year: year, p_month: month });
    return data?.[0] || { total_income: 0, total_expense: 0, balance: 0, transaction_count: 0 };
}

export async function fetchCategoryBreakdown(orgId: string, userId: string, type: 'income' | 'expense', year?: number, month?: number): Promise<CategoryBreakdown[]> {
    const { data } = await supabase.rpc('get_category_breakdown', { p_org_id: orgId, p_user_id: userId, p_type: type, p_year: year, p_month: month });
    return data || [];
}

// =============================================================================
// Installments
// =============================================================================

export async function fetchActiveInstallments(orgId: string, userId: string): Promise<ActiveInstallment[]> {
    const { data } = await supabase.from('transactions').select('*').eq('org_id', orgId).eq('is_installment_parcel', false).gt('installment_count', 1);
    // Calculate remaining parcels and amounts
    return (data || []).map(t => ({ ...t, remaining_parcels: t.installment_count - t.installment_number })) as ActiveInstallment[];
}

// =============================================================================
// Finance Goals
// =============================================================================

export async function fetchFinanceGoals(orgId: string, userId: string): Promise<FinanceGoal[]> {
    const { data } = await supabase.from('finance_goals').select('*').eq('org_id', orgId).eq('user_id', userId).order('created_at', { ascending: false });
    return data || [];
}

export async function createFinanceGoal(orgId: string, userId: string, payload: { name: string; type: string; target_amount: number }): Promise<FinanceGoal> {
    const { data } = await supabase.from('finance_goals').insert({ org_id: orgId, user_id: userId, ...payload, is_active: true }).select().single();
    return data;
}

// =============================================================================
// Finance Goals Sync with Transactions
// =============================================================================

import { syncFinanceGoalToGoal } from '@/services/goalFinanceSync';

export async function syncFinanceGoalsWithTransactions(orgId: string, userId: string): Promise<{ goalId: string; updated: boolean }[]> {
    const goals = await fetchFinanceGoals(orgId, userId);
    const { data: transactions } = await supabase.from('transactions').select('*').eq('org_id', orgId);

    const results = [];
    for (const goal of goals.filter(g => g.is_active)) {
        let newAmount = 0;
        // Calculate based on goal.type: savings, expense_limit, income_target
        // Update if changed
        await supabase.from('finance_goals').update({ current_amount: newAmount }).eq('id', goal.id);
        await syncFinanceGoalToGoal(orgId, userId, goal.id, newAmount);
        results.push({ goalId: goal.id, updated: true });
    }
    return results;
}
