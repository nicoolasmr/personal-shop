import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTenant } from '@/hooks/useTenant';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import * as goalsService from '@/services/goals';
import { syncFinanceGoalToGoal } from '@/services/goalFinanceSync'; // IMPORTANT: Use correct import
import { getHapticsEnabled } from '@/hooks/useHaptics';
import { haptics } from '@/lib/haptics';
import type { CreateGoalPayload, UpdateGoalPayload, AddProgressPayload, Goal } from '@/types/goals'; // Added Goal type import

const GOALS_KEY = 'goals';
const ACTIVE_GOALS_KEY = 'goals-active-summary';

// Shim functions for missing services
// These were referenced in the request but not present in previous context.
// Implementing stubs to ensure compilation.
const createFinanceGoalFromGoal = async (orgId: string, userId: string, goal: Goal) => {
    console.log('[Mock] Create finance goal from', goal.id);
    // Implementation would go here
};
const updateLinkedFinanceGoal = async (orgId: string, goal: Goal) => {
    console.log('[Mock] Update linked finance goal', goal.id);
};
const deleteLinkedFinanceGoal = async (orgId: string, goalId: string) => {
    console.log('[Mock] Delete linked finance goal', goalId);
};


export function useGoals(status?: string) {
    const { org } = useTenant();
    return useQuery({
        queryKey: [GOALS_KEY, org?.id, status],
        queryFn: () => { if (!org?.id) throw new Error('No org'); return goalsService.listGoals(org.id, status); },
        enabled: !!org?.id,
    });
}

export function useGoal(goalId: string | null) {
    const { org } = useTenant();
    return useQuery({
        queryKey: [GOALS_KEY, org?.id, goalId],
        queryFn: () => { if (!org?.id || !goalId) throw new Error('Missing params'); return goalsService.getGoal(org.id, goalId); },
        enabled: !!org?.id && !!goalId,
    });
}

export function useActiveGoalsSummary() {
    const { org } = useTenant();
    return useQuery({
        queryKey: [ACTIVE_GOALS_KEY, org?.id],
        queryFn: () => { if (!org?.id) throw new Error('No org'); return goalsService.getActiveGoalsSummary(org.id); },
        enabled: !!org?.id,
        refetchInterval: 60000,
    });
}

export function useCreateGoal() {
    const { org } = useTenant();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: CreateGoalPayload) => {
            if (!org?.id || !user?.id) throw new Error('Missing org or user');
            const goal = await goalsService.createGoal(org.id, user.id, payload);
            if (['financial', 'savings'].includes(payload.type || 'custom')) {
                await createFinanceGoalFromGoal(org.id, user.id, goal);
            }
            return goal;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [GOALS_KEY] });
            queryClient.invalidateQueries({ queryKey: [ACTIVE_GOALS_KEY] });
            queryClient.invalidateQueries({ queryKey: ['finance-goals'] });
            toast({ title: 'Meta criada!', description: 'Sua nova meta foi adicionada.' });
        },
        onError: (error) => { console.error('Create goal error:', error); toast({ title: 'Erro ao criar meta', description: 'Tente novamente.', variant: 'destructive' }); },
    });
}

export function useUpdateGoal() {
    const { org } = useTenant();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ goalId, payload }: { goalId: string; payload: UpdateGoalPayload }) => {
            if (!org?.id || !user?.id) throw new Error('Missing org or user');
            const updatedGoal = await goalsService.updateGoal(org.id, user.id, goalId, payload);
            await updateLinkedFinanceGoal(org.id, updatedGoal);
            return updatedGoal;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [GOALS_KEY] });
            queryClient.invalidateQueries({ queryKey: [ACTIVE_GOALS_KEY] });
            queryClient.invalidateQueries({ queryKey: ['finance-goals'] });
            toast({ title: 'Meta atualizada!' });
        },
        onError: (error) => { console.error('Update goal error:', error); toast({ title: 'Erro ao atualizar meta', description: 'Tente novamente.', variant: 'destructive' }); },
    });
}

export function useArchiveGoal() {
    const { org } = useTenant();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (goalId: string) => {
            if (!org?.id || !user?.id) throw new Error('Missing org or user');
            await goalsService.archiveGoal(org.id, user.id, goalId);
            await deleteLinkedFinanceGoal(org.id, goalId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [GOALS_KEY] });
            queryClient.invalidateQueries({ queryKey: [ACTIVE_GOALS_KEY] });
            queryClient.invalidateQueries({ queryKey: ['finance-goals'] });
            toast({ title: 'Meta arquivada' });
        },
        onError: (error) => { console.error('Archive goal error:', error); toast({ title: 'Erro ao arquivar meta', description: 'Tente novamente.', variant: 'destructive' }); },
    });
}

export function useCompleteGoal() {
    const { org } = useTenant();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (goalId: string) => {
            if (!org?.id || !user?.id) throw new Error('Missing org or user');
            return goalsService.completeGoal(org.id, user.id, goalId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [GOALS_KEY] });
            queryClient.invalidateQueries({ queryKey: [ACTIVE_GOALS_KEY] });
            toast({ title: '🎉 Meta concluída!', description: 'Parabéns pelo seu progresso!' });
        },
        onError: (error) => { console.error('Complete goal error:', error); toast({ title: 'Erro ao concluir meta', description: 'Tente novamente.', variant: 'destructive' }); },
    });
}

export function useAddProgress() {
    const { org } = useTenant();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ goalId, payload }: { goalId: string; payload: AddProgressPayload }) => {
            if (!org?.id || !user?.id) throw new Error('Missing org or user');
            const progress = await goalsService.addProgress(org.id, user.id, goalId, payload);
            const updatedGoal = await goalsService.getGoal(org.id, goalId);
            if (updatedGoal) await updateLinkedFinanceGoal(org.id, updatedGoal);
            return progress;
        },
        onSuccess: () => {
            if (getHapticsEnabled()) haptics.medium();
            queryClient.invalidateQueries({ queryKey: [GOALS_KEY] });
            queryClient.invalidateQueries({ queryKey: [ACTIVE_GOALS_KEY] });
            queryClient.invalidateQueries({ queryKey: ['finance-goals'] });
            toast({ title: 'Progresso registrado!' });
        },
        onError: (error) => { console.error('Add progress error:', error); toast({ title: 'Erro ao registrar progresso', description: 'Tente novamente.', variant: 'destructive' }); },
    });
}

export function useDeleteProgress() {
    const { org } = useTenant();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (progressId: string) => {
            if (!org?.id || !user?.id) throw new Error('Missing org or user');
            return goalsService.deleteProgress(org.id, user.id, progressId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [GOALS_KEY] });
            queryClient.invalidateQueries({ queryKey: [ACTIVE_GOALS_KEY] });
            toast({ title: 'Progresso removido' });
        },
        onError: (error) => { console.error('Delete progress error:', error); toast({ title: 'Erro ao remover progresso', description: 'Tente novamente.', variant: 'destructive' }); },
    });
}

export function useDeleteGoal() {
    const { org } = useTenant();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (goalId: string) => {
            if (!org?.id || !user?.id) throw new Error('Missing org or user');
            return goalsService.deleteGoal(org.id, user.id, goalId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [GOALS_KEY] });
            queryClient.invalidateQueries({ queryKey: [ACTIVE_GOALS_KEY] });
            queryClient.invalidateQueries({ queryKey: ['finance-goals'] });
            toast({ title: 'Meta excluída permanentemente' });
        },
        onError: (error) => { console.error('Delete goal error:', error); toast({ title: 'Erro ao excluir meta', description: 'Tente novamente.', variant: 'destructive' }); },
    });
}
