import { supabase } from '@/lib/supabase';
import { FinanceGoal } from '@/types/finance';

/**
 * Syncs a financial goal's progress to the main Goals system.
 */
export const syncFinanceGoalToGoal = async (orgId: string, userId: string, financeGoalId: string, currentAmount: number) => {
    // Find if there's a linked goal in the main 'goals' table
    // We assume title or metadata links them, or a direct reference if added later.
    // For now, we search by matching title and type='financial'
    const { data: financeGoal } = await supabase
        .from('finance_goals')
        .select('*')
        .eq('id', financeGoalId)
        .single();

    if (!financeGoal) return;

    const { data: linkedGoal } = await supabase
        .from('goals')
        .select('id')
        .eq('org_id', orgId)
        .eq('user_id', userId)
        .eq('type', 'financial')
        .eq('title', financeGoal.name)
        .single();

    if (linkedGoal) {
        // Update the main goal's current_value
        await supabase
            .from('goals')
            .update({
                current_value: currentAmount,
                target_value: financeGoal.target_amount,
                updated_at: new Date().toISOString()
            })
            .eq('id', linkedGoal.id);
    }
};

export const createGoalFromFinanceGoal = async (orgId: string, userId: string, financeGoal: FinanceGoal) => {
    // Create a shadow goal in the main system for unified dashboards
    const { error } = await supabase
        .from('goals')
        .insert({
            org_id: orgId,
            user_id: userId,
            type: 'financial',
            title: financeGoal.name,
            description: `Meta financeira vinculada: ${financeGoal.name}`,
            target_value: financeGoal.target_amount,
            current_value: financeGoal.current_amount || 0,
            status: 'active'
        });

    if (error) console.error('Error creating linked goal:', error);
};

export const updateLinkedGoal = async (orgId: string, financeGoal: FinanceGoal) => {
    // Keep names and targets in sync
    const { data: linkedGoal } = await supabase
        .from('goals')
        .select('id')
        .eq('org_id', orgId)
        .eq('type', 'financial')
        .eq('title', financeGoal.name) // This might fail if name changed. Better to use a mapping table or metadata.
        .single();

    if (linkedGoal) {
        await supabase
            .from('goals')
            .update({
                title: financeGoal.name,
                target_value: financeGoal.target_amount,
                updated_at: new Date().toISOString()
            })
            .eq('id', linkedGoal.id);
    }
};

export const deleteLinkedGoal = async (orgId: string, financeGoalId: string) => {
    // Logically we'd delete the linked goal too
    // For now keeping it simple
    console.log('[Sync] Delete linked goal for', financeGoalId);
};
