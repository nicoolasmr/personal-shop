// =============================================================================
// Goal Finance Sync
// =============================================================================

import { supabase } from '@/lib/supabase';
import { syncFinancialGoalProgress } from '@/services/goals';

export async function syncFinanceGoalToGoal(
    orgId: string,
    userId: string,
    financeGoalId: string,
    newAmount: number
): Promise<void> {
    // Find linked main Goal
    const { data: financeGoal } = await supabase
        .from('finance_goals')
        .select('linked_goal_id')
        .eq('id', financeGoalId)
        .single();

    if (!financeGoal?.linked_goal_id) return;

    // Utilize the main goals service to add progress
    await syncFinancialGoalProgress(orgId, userId, financeGoal.linked_goal_id, newAmount);
}
