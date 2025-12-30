// =============================================================================
// useFinanceGoalsSync - Hook para sincronizar metas financeiras com transações
// =============================================================================

import { useEffect, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useGoals } from './queries/useGoals';
import { useFinance } from './queries/useFinance';
import { useTenant } from './useTenant';
import { useAuth } from './useAuth';
import * as goalsService from '@/services/goals';
import { toast } from '@/hooks/use-toast';

export function useFinanceGoalsSync() {
    const { org } = useTenant();
    const { user } = useAuth();
    const { data: goals } = useGoals('active');
    const { summary, isLoading: isLoadingSummary } = useFinance();
    const queryClient = useQueryClient();

    // Get financial goals (savings or financial type)
    const financialGoals = useMemo(() => goals?.filter(g =>
        g.type === 'financial' || g.type === 'savings'
    ) || [], [goals]);

    // Sync function
    const syncGoal = useCallback(async (goalId: string, amount: number) => {
        if (!org?.id || !user?.id) return;

        try {
            await goalsService.syncFinancialGoalProgress(org.id, user.id, goalId, amount);
            queryClient.invalidateQueries({ queryKey: ['goals'] });
        } catch (error) {
            console.error('Sync error:', error);
        }
    }, [org?.id, user?.id, queryClient]);

    // Auto-sync when summary changes
    useEffect(() => {
        if (isLoadingSummary || !summary || financialGoals.length === 0) return;

        // For savings goals, use the balance as current value
        financialGoals.forEach(goal => {
            if (goal.type === 'savings') {
                // Savings goal tracks income - expenses (balance)
                const currentBalance = summary.balance;
                if (goal.current_value !== currentBalance && currentBalance > 0) {
                    syncGoal(goal.id, currentBalance);
                }
            } else if (goal.type === 'financial') {
                // Financial goal tracks total income
                const totalIncome = summary.total_income;
                if (goal.current_value !== totalIncome && totalIncome > 0) {
                    syncGoal(goal.id, totalIncome);
                }
            }
        });
    }, [summary, financialGoals, isLoadingSummary, syncGoal]);

    // Manual sync function
    const manualSync = useCallback(() => {
        if (!summary) return;

        financialGoals.forEach(goal => {
            const amount = goal.type === 'savings' ? summary.balance : summary.total_income;
            if (amount > 0) {
                syncGoal(goal.id, amount);
            }
        });

        toast({
            title: 'Metas financeiras sincronizadas',
            description: `${financialGoals.length} meta(s) atualizada(s)`,
        });
    }, [summary, financialGoals, syncGoal]);

    return {
        financialGoals,
        summary,
        manualSync,
        hasFinancialGoals: financialGoals.length > 0,
    };
}
