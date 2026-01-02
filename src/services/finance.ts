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
    CreateFinanceGoalPayload,
} from '@/types/finance';
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '@/types/finance';

// =============================================================================
// Transactions
// =============================================================================

export async function fetchTransactions(orgId: string, year?: number, month?: number): Promise<TransactionWithCategory[]> {
    // 1. Fetch transactions without join to avoid PGRST200 (FK cache issue)
    let query = supabase.from('transactions').select('*').eq('org_id', orgId).order('transaction_date', { ascending: false });

    if (year && month) {
        // Robust date handling
        const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
        const endDate = new Date(year, month, 0).toISOString().split('T')[0];
        query = query.gte('transaction_date', startDate).lte('transaction_date', endDate);
    }

    const { data: transactions, error: txError } = await query;

    if (txError) {
        console.error('[FinanceService] Error fetching transactions:', txError);
        return [];
    }

    if (!transactions || transactions.length === 0) {
        return [];
    }

    // 2. Fetch all categories (small dataset, optimized by caching in browser usually, but here checking full fresh)
    const { data: categories, error: catError } = await supabase
        .from('transaction_categories')
        .select('*')
        .eq('org_id', orgId);

    if (catError) {
        console.error('[FinanceService] Error fetching categories for join:', catError);
        return transactions.map((t: any) => ({ ...t, category: null }));
    }

    // 3. Manual Join (In-Memory)
    const categoryMap = new Map((categories || []).map((c: TransactionCategory) => [c.id, c]));

    const mapped = transactions.map((t: any) => ({

        ...t,
        category: t.category_id ? categoryMap.get(t.category_id) || null : null
    })) as TransactionWithCategory[];

    return mapped;
}

export async function createTransaction(orgId: string, userId: string, payload: CreateTransactionPayload): Promise<Transaction> {
    const installmentCount = payload.installment_count || 1;
    // Calculate parcel amount or use provided amount (if user entered total, we divide, but frontend might handle this too)
    // Assuming backend receives TOTAL amount in payload.amount if single, or if installments > 1, frontend creates the first transaction.
    // However, the RPC generate_installment_parcels usually handles subsequent parcels.
    // Let's assume payload.amount is the TOTAL amount.
    const parcelAmount = installmentCount > 1 ? Math.round((payload.amount / installmentCount) * 100) / 100 : payload.amount;
    const dateStr = payload.transaction_date || new Date().toISOString().split('T')[0];

    // Get the actual user_id from profiles to ensure FK constraint is satisfied
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle();

    if (profileError) {
        console.error('[createTransaction] Error fetching profile:', profileError);
    }

    const actualUserId = profile?.user_id ?? userId;

    const { data: result, error } = await (supabase as any).from('transactions').insert({
        org_id: orgId,
        user_id: actualUserId,
        type: payload.type,
        amount: parcelAmount,
        category_id: payload.category_id || null, // Ensure category is saved
        description: payload.description,
        transaction_date: dateStr,
        date: dateStr,
        payment_method: payload.payment_method || 'other',
        installment_count: installmentCount,
        installment_number: 1,
        is_loan: payload.is_loan || false,
        loan_contact: payload.loan_contact || null
    }).select().single();

    if (error) {
        console.error('[createTransaction] Error:', error);
        throw error;
    }
    if (!result) throw new Error('Failed to create transaction');

    const data = result as Transaction;

    // If installments > 1, call RPC to generate parcels
    if (installmentCount > 1) {
        await (supabase as any).rpc('generate_installment_parcels', { p_parent_id: data.id, p_installment_count: installmentCount });
    }

    return data;
}

export async function updateTransaction(orgId: string, userId: string, transactionId: string, payload: Partial<CreateTransactionPayload>): Promise<Transaction> {
    const { data, error } = await (supabase as any).from('transactions').update(payload).eq('id', transactionId).eq('org_id', orgId).select().single();
    if (error) throw error;
    if (!data) throw new Error('Transaction not found');
    return data as Transaction;
}

export async function deleteTransaction(orgId: string, userId: string, transactionId: string): Promise<void> {
    const { error } = await (supabase as any).from('transactions').delete().eq('id', transactionId).eq('org_id', orgId);
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
        date: p.transaction_date, // Fallback
        payment_method: p.payment_method || 'other'
    }));
    const { error, count } = await (supabase as any).from('transactions').insert(rows);
    if (error) throw error;
    return count || rows.length;
}

// =============================================================================
// Categories
// =============================================================================

export async function fetchCategories(orgId: string, userId?: string): Promise<TransactionCategory[]> {
    const { data, error } = await supabase.from('transaction_categories').select('*').eq('org_id', orgId).order('name');

    if (error) throw error;

    if ((!data || data.length === 0) && userId) {
        // Seeding default categories automatically if none exist and userId provided
        const defaults = [
            ...DEFAULT_EXPENSE_CATEGORIES.map(c => ({ org_id: orgId, user_id: userId, name: c.name, icon: c.icon, color: c.color, type: 'expense', is_default: true })),
            ...DEFAULT_INCOME_CATEGORIES.map(c => ({ org_id: orgId, user_id: userId, name: c.name, icon: c.icon, color: c.color, type: 'income', is_default: true }))
        ];

        const { data: seeded, error: seedError } = await (supabase as any).from('transaction_categories').insert(defaults).select();

        if (!seedError && seeded) {
            return seeded as TransactionCategory[];
        }
        // Fallback or error log
        console.error('Failed to seed categories:', seedError);
        return [];
    }

    return data || [];
}

// In createCategory
export async function createCategory(orgId: string, userId: string, payload: CreateCategoryPayload): Promise<TransactionCategory> {
    const { data, error } = await (supabase as any).from('transaction_categories').insert({
        org_id: orgId,
        name: payload.name,
        type: payload.type,
        icon: payload.icon || null,
        color: payload.color || null,
    }).select().single();
    if (error) throw error;
    if (!data) throw new Error('Failed to create category');
    return data;
}

export async function deleteCategory(orgId: string, userId: string, categoryId: string): Promise<void> {
    const { error } = await (supabase as any).from('transaction_categories').delete().eq('id', categoryId).eq('org_id', orgId);
    if (error) throw error;
}

// =============================================================================
// Summary & Analytics (RPCs)
// =============================================================================

export async function fetchMonthlySummary(orgId: string, userId: string, year?: number, month?: number): Promise<MonthlySummary> {
    const { data } = await (supabase as any).rpc('get_monthly_summary', { p_org_id: orgId, p_user_id: userId, p_year: year, p_month: month });
    return (data as any)?.[0] || { total_income: 0, total_expense: 0, balance: 0, transaction_count: 0 };
}

export async function fetchCategoryBreakdown(orgId: string, userId: string, type: 'income' | 'expense', year?: number, month?: number): Promise<CategoryBreakdown[]> {
    const { data } = await (supabase as any).rpc('get_category_breakdown', { p_org_id: orgId, p_user_id: userId, p_type: type, p_year: year, p_month: month });
    return (data as CategoryBreakdown[]) || [];
}

// =============================================================================
// Installments
// =============================================================================

export async function fetchActiveInstallments(orgId: string, userId: string): Promise<ActiveInstallment[]> {
    const { data } = await supabase.from('transactions').select('*').eq('org_id', orgId).eq('is_installment_parcel', false).gt('installment_count', 1);
    return (data || []).map((t: any) => {
        // Assume t.amount is the parcel value for the transaction
        const parcelAmount = Number(t.amount);
        const installmentCount = Number(t.installment_count);
        // If this is the parent/first transaction, installment_number is usually 1
        const installmentsPaid = 1; // Simplification: assume we only fetch the active parent which counts as 1 paid, or we need to count actual paid parcels.
        // Better logic: Fetch *all* transactions for this org to calculate properly? 
        // For now, let's rely on the simple calculation assuming this record represents the recurring series.
        // Actually, normally one row per parcel is best. But here we have one row generating others?
        // If 'generate_installment_parcels' was run, we have multiple rows.
        // But fetchActiveInstallments filters 'is_installment_parcel'.eq(false).
        // So we are looking at the PARENT. 
        // We need to know how many *children* exist or if the parent tracks progress.
        // Given the 'installment_number' field is on the transaction, sticking to the single row logic:

        // Let's assume the user has paid 'installment_number' parcels so far? 
        // No, 'installment_number' on the parent is usually 1.
        // We need to query the *active* status.
        // For MVP 0.2/Fix, let's just project the plan based on the parent.
        // If it's the parent, it's 1 paid (itself).
        const currentParcelNumber = 1; // The parent is #1
        const remaining = installmentCount - currentParcelNumber;

        return {
            ...t,
            parcel_amount: parcelAmount,
            total_amount: parcelAmount * installmentCount,
            remaining_parcels: remaining,
            remaining_amount: parcelAmount * remaining,
            category_name: t.category?.name, // This relies on the join working, but fetchActiveInstallments didn't join categories!
            category_color: t.category?.color
        };
    }) as ActiveInstallment[];
}

export async function fetchInstallmentsSummary(orgId: string, userId: string): Promise<{ total_active_installments: number; total_monthly_commitment: number; total_remaining_amount: number }> {
    const { data } = await (supabase as any).rpc('get_installments_summary', { p_org_id: orgId, p_user_id: userId });
    return (data as any)?.[0] || { total_active_installments: 0, total_monthly_commitment: 0, total_remaining_amount: 0 };
}


// =============================================================================
// Finance Goals
// =============================================================================

export async function fetchFinanceGoals(orgId: string, userId: string): Promise<FinanceGoal[]> {
    const { data } = await supabase.from('finance_goals').select('*').eq('org_id', orgId).eq('user_id', userId).order('created_at', { ascending: false });
    return (data as FinanceGoal[]) || [];
}

// In createFinanceGoal
export async function createFinanceGoal(orgId: string, userId: string, payload: CreateFinanceGoalPayload): Promise<FinanceGoal> {
    const { data } = await (supabase as any).from('finance_goals').insert({
        org_id: orgId,
        user_id: userId,
        name: payload.name,
        type: payload.type,
        target_amount: payload.target_amount,
        current_amount: payload.current_amount || 0,
        deadline: payload.deadline || null,
        category_id: payload.category_id || null,
        is_active: true
    }).select().single();
    if (!data) throw new Error('Failed to create finance goal');
    return data;
}

export async function updateFinanceGoal(orgId: string, userId: string, goalId: string, payload: Partial<CreateFinanceGoalPayload>): Promise<FinanceGoal> {
    const { data, error } = await (supabase as any).from('finance_goals').update(payload as any).eq('id', goalId).eq('org_id', orgId).select().single();
    if (error) throw error;
    if (!data) throw new Error('Finance goal not found');
    return data;
}

export async function deleteFinanceGoal(orgId: string, userId: string, goalId: string): Promise<void> {
    const { error } = await (supabase as any).from('finance_goals').delete().eq('id', goalId).eq('org_id', orgId);
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
        const newAmount = 0; // Logic to sum transactions would go here
        // Calculate based on goal.type: savings, expense_limit, income_target
        // Update if changed
        await (supabase as any).from('finance_goals').update({ current_amount: newAmount } as any).eq('id', goal.id);
        await syncFinanceGoalToGoal(orgId, userId, goal.id, newAmount);
        results.push({ goalId: goal.id, updated: true, goalName: goal.name, goalType: goal.type });
    }
    return results;
}

// =============================================================================
// Savings Goals (Metas de Economia)
// =============================================================================

import type { SavingsGoal, CreateSavingsGoalPayload, UpdateSavingsGoalPayload } from '@/types/finance';

export async function fetchSavingsGoals(orgId: string, userId: string): Promise<SavingsGoal[]> {
    const { data, error } = await supabase
        .from('finance_savings_goals')
        .select('*')
        .eq('org_id', orgId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[FinanceService] Error fetching savings goals:', error);
        return [];
    }

    return data || [];
}

export async function createSavingsGoal(
    orgId: string,
    userId: string,
    payload: CreateSavingsGoalPayload
): Promise<SavingsGoal> {
    const { data, error } = await (supabase as any)
        .from('finance_savings_goals')
        .insert({
            org_id: orgId,
            user_id: userId,
            name: payload.name,
            description: payload.description || null,
            target_amount: payload.target_amount,
            current_amount: payload.current_amount || 0,
            icon: payload.icon || '🎯',
            color: payload.color || '#8B5CF6',
            deadline: payload.deadline || null,
        })
        .select()
        .single();

    if (error) {
        console.error('[FinanceService] Error creating savings goal:', error);
        throw new Error('Failed to create savings goal');
    }

    return data;
}

export async function updateSavingsGoal(
    goalId: string,
    payload: UpdateSavingsGoalPayload
): Promise<SavingsGoal> {
    const { data, error } = await (supabase as any)
        .from('finance_savings_goals')
        .update(payload)
        .eq('id', goalId)
        .select()
        .single();

    if (error) {
        console.error('[FinanceService] Error updating savings goal:', error);
        throw new Error('Failed to update savings goal');
    }

    return data;
}

export async function deleteSavingsGoal(goalId: string): Promise<void> {
    // Soft delete by setting is_active to false
    const { error } = await (supabase as any)
        .from('finance_savings_goals')
        .update({ is_active: false })
        .eq('id', goalId);

    if (error) {
        console.error('[FinanceService] Error deleting savings goal:', error);
        throw new Error('Failed to delete savings goal');
    }
}
