import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTenant } from '@/hooks/useTenant';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import * as habitsService from '@/services/habits';
import { getHapticsEnabled } from '@/hooks/useHaptics';
import { haptics } from '@/lib/haptics';
import type { CreateHabitPayload, UpdateHabitPayload, HabitWithCheckins } from '@/types/habits';

const HABITS_KEY = 'habits';
const TODAY_SUMMARY_KEY = 'habits-today-summary';
const GOALS_KEY = 'goals';
const ACTIVE_GOALS_KEY = 'goals-active-summary';

export function useHabits() {
    const { org } = useTenant();
    return useQuery({
        queryKey: [HABITS_KEY, org?.id],
        queryFn: () => { if (!org?.id) throw new Error('No org'); return habitsService.listHabits(org.id); },
        enabled: !!org?.id,
    });
}

export function useTodayHabitsSummary() {
    const { org } = useTenant();
    return useQuery({
        queryKey: [TODAY_SUMMARY_KEY, org?.id],
        queryFn: () => { if (!org?.id) throw new Error('No org'); return habitsService.getTodayHabitsSummary(org.id); },
        enabled: !!org?.id,
        refetchInterval: 60000,
    });
}

export function useCreateHabit() {
    const { org } = useTenant();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateHabitPayload) => {
            if (!org?.id || !user?.id) throw new Error('Missing org or user');
            return habitsService.createHabit(org.id, user.id, payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [HABITS_KEY] });
            queryClient.invalidateQueries({ queryKey: [TODAY_SUMMARY_KEY] });
            toast({ title: 'Hábito criado!', description: 'Seu novo hábito foi adicionado.' });
        },
        onError: (error) => { console.error('Create habit error:', error); toast({ title: 'Erro ao criar hábito', description: 'Tente novamente.', variant: 'destructive' }); },
    });
}

export function useUpdateHabit() {
    const { org } = useTenant();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ habitId, payload }: { habitId: string; payload: UpdateHabitPayload }) => {
            if (!org?.id || !user?.id) throw new Error('Missing org or user');
            return habitsService.updateHabit(org.id, user.id, habitId, payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [HABITS_KEY] });
            queryClient.invalidateQueries({ queryKey: [TODAY_SUMMARY_KEY] });
            toast({ title: 'Hábito atualizado!' });
        },
        onError: (error) => { console.error('Update habit error:', error); toast({ title: 'Erro ao atualizar hábito', description: 'Tente novamente.', variant: 'destructive' }); },
    });
}

export function useArchiveHabit() {
    const { org } = useTenant();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (habitId: string) => {
            if (!org?.id || !user?.id) throw new Error('Missing org or user');
            return habitsService.archiveHabit(org.id, user.id, habitId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [HABITS_KEY] });
            queryClient.invalidateQueries({ queryKey: [TODAY_SUMMARY_KEY] });
            toast({ title: 'Hábito arquivado', description: 'O hábito foi removido da sua lista.' });
        },
        onError: (error) => { console.error('Archive habit error:', error); toast({ title: 'Erro ao arquivar hábito', description: 'Tente novamente.', variant: 'destructive' }); },
    });
}

export function useToggleCheckin() {
    const { org } = useTenant();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ habitId, date }: { habitId: string; date?: string }) => {
            if (!org?.id || !user?.id) throw new Error('Missing org or user');
            return habitsService.toggleHabitCheckin(org.id, user.id, habitId, date, 'app');
        },
        onSuccess: (result) => {
            if (result.completed && getHapticsEnabled()) haptics.success();
            else if (getHapticsEnabled()) haptics.light();
            queryClient.invalidateQueries({ queryKey: [HABITS_KEY] });
            queryClient.invalidateQueries({ queryKey: [TODAY_SUMMARY_KEY] });
            queryClient.invalidateQueries({ queryKey: [GOALS_KEY] });
            queryClient.invalidateQueries({ queryKey: [ACTIVE_GOALS_KEY] });
        },
        onError: (error) => { console.error('Toggle checkin error:', error); toast({ title: 'Erro ao marcar hábito', description: 'Tente novamente.', variant: 'destructive' }); },
    });
}

export function useHabitStats(habit: HabitWithCheckins) {
    const streak = habitsService.calculateStreak(habit.checkins);
    const weeklyRate = habitsService.calculateWeeklyRate(habit.checkins);
    return { streak, weeklyRate };
}
