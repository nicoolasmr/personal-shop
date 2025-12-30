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
    CreateCategoryPayload,
    CreateFinanceGoalPayload
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
    // Fetch categories separately and merge if necessary, or rely on join if RPC/View
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

export async function updateTransaction(orgId: string, userId: string, transactionId: string, payload: any): Promise<Transaction> {
    const { data, error } = await supabase.from('transactions').update(payload).eq('id', transactionId).eq('org_id', orgId).select().single();
    if (error) throw error;
    return data;
}

export async function deleteTransaction(orgId: string, userId: string, transactionId: string): Promise<void> {
    const { error } = await supabase.from('transactions').delete().eq('id', transactionId).eq('org_id', orgId);
    if (error) throw error;
}

export async function bulkCreateTransactions(orgId: string, userId: string, payloads: CreateTransactionPayload[]): Promise<number> {
    // Basic implementation
    const rows = payloads.map(p => ({
        org_id: orgId,
        user_id: userId,
        type: p.type,
        amount: p.amount,
        description: p.description,
        transaction_date: p.transaction_date,
        payment_method: p.payment_method || 'other'
    }));
    const { error, count } = await supabase.from('transactions').insert(rows);
    if (error) throw error;
    return count || rows.length;
}

// =============================================================================
// Categories
// =============================================================================

export async function fetchCategories(orgId: string): Promise<TransactionCategory[]> {
    const { data } = await supabase.from('transaction_categories').select('*').eq('org_id', orgId).order('name');
    return data || [];
}

export async function createCategory(orgId: string, userId: string, payload: CreateCategoryPayload): Promise<TransactionCategory> {
    const { data, error } = await supabase.from('transaction_categories').insert({ ...payload, org_id: orgId }).select().single();
    if (error) throw error;
    return data;
}

export async function deleteCategory(orgId: string, userId: string, categoryId: string): Promise<void> {
    const { error } = await supabase.from('transaction_categories').delete().eq('id', categoryId).eq('org_id', orgId);
    if (error) throw error;
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

export async function fetchInstallmentsSummary(orgId: string, userId: string): Promise<{ total_active_installments: number; total_monthly_commitment: number; total_remaining_amount: number }> {
    const { data } = await supabase.rpc('get_installments_summary', { p_org_id: orgId, p_user_id: userId });
    return data?.[0] || { total_active_installments: 0, total_monthly_commitment: 0, total_remaining_amount: 0 };
}


// =============================================================================
// Finance Goals
// =============================================================================

export async function fetchFinanceGoals(orgId: string, userId: string): Promise<FinanceGoal[]> {
    const { data } = await supabase.from('finance_goals').select('*').eq('org_id', orgId).eq('user_id', userId).order('created_at', { ascending: false });
    return data || [];
}

export async function createFinanceGoal(orgId: string, userId: string, payload: CreateFinanceGoalPayload): Promise<FinanceGoal> {
    const { data } = await supabase.from('finance_goals').insert({ org_id: orgId, user_id: userId, ...payload, is_active: true }).select().single();
    return data;
}

export async function updateFinanceGoal(orgId: string, userId: string, goalId: string, payload: any): Promise<FinanceGoal> {
    const { data, error } = await supabase.from('finance_goals').update(payload).eq('id', goalId).eq('org_id', orgId).select().single();
    if (error) throw error;
    return data;
}

export async function deleteFinanceGoal(orgId: string, userId: string, goalId: string): Promise<void> {
    const { error } = await supabase.from('finance_goals').delete().eq('id', goalId).eq('org_id', orgId);
    if (error) throw error;
}


// =============================================================================
// Finance Goals Sync with Transactions
// =============================================================================

import { syncFinanceGoalToGoal } from '@/services/goalFinanceSync';

// Define return type interface
interface SyncResult {
    goalId: string;
    goalName: string;
    goalType: string;
    updated: boolean;
    milestone?: string;
    newProgress?: number;
}

export async function syncFinanceGoalsWithTransactions(orgId: string, userId: string): Promise<SyncResult[]> {
    const goals = await fetchFinanceGoals(orgId, userId);
    // Need logic to calculate current amount for each goal based on transaction sum
    // This is simplified mockup
    const results: SyncResult[] = [];
    for (const goal of goals.filter(g => g.is_active)) {
        let newAmount = 0; // Logic to sum transactions would go here
        // Calculate based on goal.type: savings, expense_limit, income_target
        // Update if changed
        await supabase.from('finance_goals').update({ current_amount: newAmount }).eq('id', goal.id);
        await syncFinanceGoalToGoal(orgId, userId, goal.id, newAmount);
        results.push({ goalId: goal.id, updated: true, goalName: goal.name, goalType: goal.type });
    }
    return results;
}
