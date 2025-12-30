import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTenant } from '@/hooks/useTenant';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast'; // Using our shim/wrapper
import {
    fetchTransactions, createTransaction, updateTransaction, deleteTransaction,
    fetchCategories, createCategory, deleteCategory, fetchMonthlySummary,
    fetchCategoryBreakdown, fetchActiveInstallments, fetchInstallmentsSummary,
    fetchFinanceGoals, createFinanceGoal, updateFinanceGoal, deleteFinanceGoal,
    bulkCreateTransactions, syncFinanceGoalsWithTransactions,
} from '@/services/finance';
import { createGoalFromFinanceGoal, updateLinkedGoal, deleteLinkedGoal } from '@/services/goalFinanceSync';
import type { CreateTransactionPayload, UpdateTransactionPayload, CreateCategoryPayload, TransactionType, CreateFinanceGoalPayload, UpdateFinanceGoalPayload } from '@/types/finance';

export function useFinance(year?: number, month?: number) {
    const { profile } = useTenant();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const orgId = profile?.org_id;
    const currentYear = year || new Date().getFullYear();
    const currentMonth = month || new Date().getMonth() + 1;

    const { data: transactions = [], isLoading: transactionsLoading, error: transactionsError } = useQuery({
        queryKey: ['transactions', orgId, currentYear, currentMonth],
        queryFn: () => { if (!orgId) return []; return fetchTransactions(orgId!, currentYear, currentMonth); },
        enabled: !!orgId,
    });

    const { data: categories = [], isLoading: categoriesLoading } = useQuery({
        queryKey: ['transaction-categories', orgId],
        queryFn: () => { if (!orgId) return []; return fetchCategories(orgId!); },
        enabled: !!orgId,
    });

    const { data: summary, isLoading: summaryLoading } = useQuery({
        queryKey: ['finance-summary', orgId, user?.id, currentYear, currentMonth],
        queryFn: () => { if (!orgId || !user?.id) return null; return fetchMonthlySummary(orgId!, user!.id, currentYear, currentMonth); },
        enabled: !!orgId && !!user?.id,
    });

    const { data: installments = [], isLoading: installmentsLoading } = useQuery({
        queryKey: ['installments', orgId, user?.id],
        queryFn: () => { if (!orgId || !user?.id) return []; return fetchActiveInstallments(orgId!, user!.id); },
        enabled: !!orgId && !!user?.id,
    });

    const { data: installmentsSummary } = useQuery({
        queryKey: ['installments-summary', orgId, user?.id],
        queryFn: () => { if (!orgId || !user?.id) return null; return fetchInstallmentsSummary(orgId!, user!.id); },
        enabled: !!orgId && !!user?.id,
    });

    const syncGoalsAfterTransaction = async () => {
        if (!orgId || !user?.id) return;
        try {
            const results = await syncFinanceGoalsWithTransactions(orgId, user.id);
            queryClient.invalidateQueries({ queryKey: ['finance-goals'] });
            results.forEach(result => {
                if (result.milestone === '100%') {
                    // Simplified toast logic for now as variants might not match complex toast lib
                    toast({ title: result.goalType === 'expense_limit' ? '⚠️ Limite excedido' : '🎉 Meta concluída', description: `"${result.goalName}" atingiu 100%!`, variant: result.goalType === 'expense_limit' ? 'destructive' : 'default' });
                } else if (result.milestone === '80%') {
                    toast({ title: result.goalType === 'expense_limit' ? '⚠️ Atenção' : '📈 Quase lá', description: `"${result.goalName}" atingiu ${result.newProgress}%!`, variant: 'default' });
                }
            });
        } catch (error) { console.error('Error syncing goals:', error); }
    };

    const createTransactionMutation = useMutation({
        mutationFn: (payload: CreateTransactionPayload) => { if (!orgId || !user?.id) throw new Error('Auth required'); return createTransaction(orgId!, user!.id, payload); },
        onSuccess: async () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['finance-summary'] });
            queryClient.invalidateQueries({ queryKey: ['installments'] });
            queryClient.invalidateQueries({ queryKey: ['installments-summary'] });
            toast({ title: 'Transação criada com sucesso!' });
            await syncGoalsAfterTransaction();
        },
        onError: (error: Error) => { toast({ title: 'Erro ao criar transação', description: error.message, variant: 'destructive' }); },
    });

    // ... (update, delete, categories, goals mutations similar pattern)

    const { data: financeGoals = [], isLoading: goalsLoading } = useQuery({
        queryKey: ['finance-goals', orgId, user?.id],
        queryFn: () => { if (!orgId || !user?.id) return []; return fetchFinanceGoals(orgId!, user!.id); },
        enabled: !!orgId && !!user?.id,
    });

    const createGoalMutation = useMutation({
        mutationFn: async (payload: CreateFinanceGoalPayload) => {
            if (!orgId || !user?.id) throw new Error('Auth required');
            const financeGoal = await createFinanceGoal(orgId!, user!.id, payload);
            await createGoalFromFinanceGoal(orgId!, user!.id, financeGoal);
            return financeGoal;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['finance-goals'] });
            queryClient.invalidateQueries({ queryKey: ['goals'] });
            queryClient.invalidateQueries({ queryKey: ['goals-active-summary'] });
            toast({ title: 'Meta criada com sucesso!' });
        },
        onError: (error: Error) => { toast({ title: 'Erro ao criar meta', description: error.message, variant: 'destructive' }); },
    });

    const bulkImportMutation = useMutation({
        mutationFn: (payloads: CreateTransactionPayload[]) => { if (!orgId || !user?.id) throw new Error('Auth required'); return bulkCreateTransactions(orgId!, user!.id, payloads); },
        onSuccess: async (count) => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['finance-summary'] });
            toast({ title: `${count} transações importadas!` });
            await syncGoalsAfterTransaction();
        },
        onError: (error: Error) => { toast({ title: 'Erro ao importar', description: error.message, variant: 'destructive' }); },
    });

    return {
        transactions, categories, summary: summary || { total_income: 0, total_expense: 0, balance: 0, transaction_count: 0 },
        financeGoals, isLoading: transactionsLoading || categoriesLoading || summaryLoading,
        installments, installmentsSummary: installmentsSummary || { total_active_installments: 0, total_monthly_commitment: 0, total_remaining_amount: 0 },
        error: transactionsError,
        createTransaction: createTransactionMutation.mutate,
        createFinanceGoal: createGoalMutation.mutate,
        bulkImportTransactions: bulkImportMutation.mutateAsync,
        isImporting: bulkImportMutation.isPending,
        // ... more exposed methods
    };
}

export function useCategoryBreakdown(type: TransactionType, year?: number, month?: number) {
    const { profile } = useTenant();
    const { user } = useAuth();
    const orgId = profile?.org_id;
    const currentYear = year || new Date().getFullYear();
    const currentMonth = month || new Date().getMonth() + 1;

    return useQuery({
        queryKey: ['category-breakdown', orgId, user?.id, type, currentYear, currentMonth],
        queryFn: () => { if (!orgId || !user?.id) return []; return fetchCategoryBreakdown(orgId!, user!.id, type, currentYear, currentMonth); },
        enabled: !!orgId && !!user?.id,
    });
}
