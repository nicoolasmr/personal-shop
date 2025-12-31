// =============================================================================
// Goals Service - CRUD + Progress + Audit Log
// =============================================================================

import { supabase, supabaseConfigured } from '@/lib/supabase';
import type {
    Goal,
    GoalProgress,
    GoalWithProgress,
    CreateGoalPayload,
    UpdateGoalPayload,
    AddProgressPayload,
} from '@/types/goals';

// =============================================================================
// LIST GOALS (with recent progress)
// =============================================================================

export async function listGoals(orgId: string, status?: string): Promise<GoalWithProgress[]> {
    if (!supabaseConfigured) return [];

    let query = supabase
        .from('goals')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });

    if (status) {
        query = query.eq('status', status);
    } else {
        query = query.neq('status', 'archived');
    }

    const { data: goals, error: goalsError } = await query;

    if (goalsError) {
        console.error('Error fetching goals:', goalsError);
        throw new Error('Erro ao buscar metas');
    }

    if (!goals || goals.length === 0) return [];

    // Get progress for all goals (last 30 days)
    const goalIds = goals.map((g) => g.id);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: progress, error: progressError } = await supabase
        .from('goal_progress')
        .select('*')
        .eq('org_id', orgId)
        .in('goal_id', goalIds)
        .gte('progress_date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('progress_date', { ascending: false });

    if (progressError) {
        console.error('Error fetching goal progress:', progressError);
    }

    const progressByGoal = (progress || []).reduce((acc, p) => {
        if (!acc[p.goal_id]) acc[p.goal_id] = [];
        acc[p.goal_id].push(p as GoalProgress);
        return acc;
    }, {} as Record<string, GoalProgress[]>);

    return goals.map((goal) => ({
        ...(goal as Goal),
        progress: progressByGoal[goal.id] || [],
    }));
}

// =============================================================================
// GET SINGLE GOAL
// =============================================================================

export async function getGoal(orgId: string, goalId: string): Promise<GoalWithProgress | null> {
    if (!supabaseConfigured) return null;

    const { data: goal, error } = await supabase
        .from('goals')
        .select('*')
        .eq('org_id', orgId)
        .eq('id', goalId)
        .maybeSingle();

    if (error) {
        console.error('Error fetching goal:', error);
        throw error;
    }
    if (!goal) return null;

    // Get all progress for this goal
    const { data: progress } = await supabase
        .from('goal_progress')
        .select('*')
        .eq('goal_id', goalId)
        .order('progress_date', { ascending: false });

    return {
        ...(goal as Goal),
        progress: (progress || []) as GoalProgress[],
    };
}

// =============================================================================
// CREATE GOAL (with auto-habit creation for habit type)
// =============================================================================

export async function createGoal(
    orgId: string,
    userId: string,
    payload: CreateGoalPayload
): Promise<Goal> {
    if (!supabaseConfigured) throw new Error('Supabase não configurado');

    let linkedHabitId = payload.linked_habit_id;

    // If type is 'habit' and no linked habit provided, create one automatically
    if (payload.type === 'habit' && !linkedHabitId) {
        const { data: newHabit, error: habitError } = await supabase
            .from('habits')
            .insert({
                org_id: orgId,
                user_id: userId,
                name: payload.title,
                description: payload.description || null,
                category: 'habit',
                frequency: { type: 'daily' },
                target: 1,
                active: true,
            })
            .select()
            .single();

        if (habitError) {
            console.error('Error creating linked habit:', habitError);
        } else {
            linkedHabitId = newHabit.id;
        }
    }

    const { data, error } = await supabase
        .from('goals')
        .insert({
            org_id: orgId,
            user_id: userId,
            type: payload.type || 'custom',
            title: payload.title,
            description: payload.description || null,
            target_value: payload.target_value || null,
            unit: payload.unit || null,
            due_date: payload.due_date || null,
            linked_habit_id: linkedHabitId || null,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating goal:', error);
        throw new Error('Erro ao criar meta');
    }

    // Audit log
    await logAudit(orgId, userId, 'goal_created', 'goal', data.id, {
        title: payload.title,
        type: payload.type || 'custom',
        linked_habit_id: linkedHabitId,
    });

    return data as Goal;
}

// =============================================================================
// UPDATE GOAL
// =============================================================================

export async function updateGoal(
    orgId: string,
    userId: string,
    goalId: string,
    payload: UpdateGoalPayload
): Promise<Goal> {
    if (!supabaseConfigured) throw new Error('Supabase não configurado');

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (payload.title !== undefined) updateData.title = payload.title;
    if (payload.description !== undefined) updateData.description = payload.description;
    if (payload.target_value !== undefined) updateData.target_value = payload.target_value;
    if (payload.unit !== undefined) updateData.unit = payload.unit;
    if (payload.due_date !== undefined) updateData.due_date = payload.due_date;
    if (payload.status !== undefined) updateData.status = payload.status;

    const { data, error } = await supabase
        .from('goals')
        .update(updateData)
        .eq('id', goalId)
        .eq('org_id', orgId)
        .select()
        .single();

    if (error) {
        console.error('Error updating goal:', error);
        throw new Error('Erro ao atualizar meta');
    }

    // Audit log
    await logAudit(orgId, userId, 'goal_updated', 'goal', goalId, { changes: payload });

    return data as Goal;
}

// =============================================================================
// ARCHIVE GOAL
// =============================================================================

export async function archiveGoal(orgId: string, userId: string, goalId: string): Promise<void> {
    if (!supabaseConfigured) throw new Error('Supabase não configurado');

    const { error } = await supabase
        .from('goals')
        .update({ status: 'archived', updated_at: new Date().toISOString() })
        .eq('id', goalId)
        .eq('org_id', orgId);

    if (error) {
        console.error('Error archiving goal:', error);
        throw new Error('Erro ao arquivar meta');
    }

    // Audit log
    await logAudit(orgId, userId, 'goal_archived', 'goal', goalId, {});
}

// =============================================================================
// DELETE GOAL
// =============================================================================

export async function deleteGoal(orgId: string, userId: string, goalId: string): Promise<void> {
    if (!supabaseConfigured) throw new Error('Supabase não configurado');

    const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId)
        .eq('org_id', orgId);

    if (error) {
        console.error('Error deleting goal:', error);
        throw new Error('Erro ao excluir meta');
    }

    // Audit log
    await logAudit(orgId, userId, 'goal_deleted', 'goal', goalId, {});
}

// =============================================================================
// COMPLETE GOAL
// =============================================================================

export async function completeGoal(orgId: string, userId: string, goalId: string): Promise<Goal> {
    if (!supabaseConfigured) throw new Error('Supabase não configurado');

    const { data, error } = await supabase
        .from('goals')
        .update({ status: 'done', updated_at: new Date().toISOString() })
        .eq('id', goalId)
        .eq('org_id', orgId)
        .select()
        .single();

    if (error) {
        console.error('Error completing goal:', error);
        throw new Error('Erro ao concluir meta');
    }

    // Audit log
    await logAudit(orgId, userId, 'goal_completed', 'goal', goalId, {});

    return data as Goal;
}

// =============================================================================
// ADD PROGRESS
// =============================================================================

export async function addProgress(
    orgId: string,
    userId: string,
    goalId: string,
    payload: AddProgressPayload
): Promise<GoalProgress> {
    if (!supabaseConfigured) throw new Error('Supabase não configurado');

    const progressDate = payload.progress_date || new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
        .from('goal_progress')
        .insert({
            org_id: orgId,
            goal_id: goalId,
            user_id: userId,
            progress_date: progressDate,
            delta_value: payload.delta_value,
            notes: payload.notes || null,
            source: payload.source || 'app',
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding progress:', error);
        throw new Error('Erro ao registrar progresso');
    }

    // Audit log
    await logAudit(orgId, userId, 'goal_progress_added', 'goal_progress', data.id, {
        goal_id: goalId,
        delta_value: payload.delta_value,
        source: payload.source || 'app',
    });

    return data as GoalProgress;
}

// =============================================================================
// DELETE PROGRESS
// =============================================================================

export async function deleteProgress(
    orgId: string,
    userId: string,
    progressId: string
): Promise<void> {
    if (!supabaseConfigured) throw new Error('Supabase não configurado');

    const { error } = await supabase
        .from('goal_progress')
        .delete()
        .eq('id', progressId)
        .eq('org_id', orgId);

    if (error) {
        console.error('Error deleting progress:', error);
        throw new Error('Erro ao excluir progresso');
    }

    // Audit log
    await logAudit(orgId, userId, 'goal_progress_deleted', 'goal_progress', progressId, {});
}

// =============================================================================
// GET ACTIVE GOALS SUMMARY (for Home card)
// =============================================================================

export async function getActiveGoalsSummary(orgId: string): Promise<{
    total: number;
    completed: number;
    overdue: number;
    goals: Goal[];
}> {
    if (!supabaseConfigured) {
        return { total: 0, completed: 0, overdue: 0, goals: [] };
    }

    const { data: goals, error } = await supabase
        .from('goals')
        .select('*')
        .eq('org_id', orgId)
        .eq('status', 'active')
        .order('due_date', { ascending: true, nullsFirst: false })
        .limit(5);

    if (error) {
        console.error('Error fetching active goals:', error);
        throw new Error('Erro ao buscar metas ativas');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const typedGoals = (goals || []) as Goal[];
    const overdue = typedGoals.filter((g) => {
        if (!g.due_date) return false;
        return new Date(g.due_date) < today;
    }).length;

    const completed = typedGoals.filter((g) => {
        if (!g.target_value) return false;
        return g.current_value >= g.target_value;
    }).length;

    return {
        total: typedGoals.length,
        completed,
        overdue,
        goals: typedGoals,
    };
}

// =============================================================================
// GET FINANCIAL GOALS (for finance sync)
// =============================================================================

export async function getFinancialGoals(orgId: string): Promise<Goal[]> {
    if (!supabaseConfigured) return [];

    const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('org_id', orgId)
        .in('type', ['financial', 'savings'])
        .eq('status', 'active');

    if (error) {
        console.error('Error fetching financial goals:', error);
        return [];
    }

    return (data || []) as Goal[];
}

// =============================================================================
// SYNC FINANCIAL GOAL WITH TRANSACTIONS
// =============================================================================

export async function syncFinancialGoalProgress(
    orgId: string,
    userId: string,
    goalId: string,
    totalAmount: number
): Promise<void> {
    if (!supabaseConfigured) return;

    // Get current goal
    const { data: goal, error: goalError } = await supabase
        .from('goals')
        .select('current_value')
        .eq('id', goalId)
        .single();

    if (goalError || !goal) return;

    const currentValue = goal.current_value || 0;
    const delta = totalAmount - currentValue;

    if (delta === 0) return;

    // Insert progress entry to trigger the update trigger
    await supabase.from('goal_progress').insert({
        org_id: orgId,
        goal_id: goalId,
        user_id: userId,
        progress_date: new Date().toISOString().split('T')[0],
        delta_value: delta,
        notes: 'Sincronizado com transações financeiras',
        source: 'integration',
    });
}

// =============================================================================
// AUDIT LOG HELPER
// =============================================================================

async function logAudit(
    orgId: string,
    userId: string,
    action: string,
    entityType: string,
    entityId: string,
    meta: Record<string, unknown>
): Promise<void> {
    try {
        await supabase.from('audit_log').insert({
            org_id: orgId,
            user_id: userId,
            action,
            entity_type: entityType,
            entity_id: entityId,
            meta,
        });
    } catch (error) {
        console.error('Audit log error:', error);
    }
}
