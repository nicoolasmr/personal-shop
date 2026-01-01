import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import * as achievementsService from '@/services/achievements';
import { HabitWithCheckins } from '@/types/habits';
import { useFinance } from '@/hooks/useFinance';
import { useTasks } from '@/hooks/queries/useTasks';

export function useAchievements(habits: HabitWithCheckins[]) {
    const { user } = useAuth();

    // Fetch data for other modules to check achievements
    // These hooks use React Query, so they will share cache with the rest of the app
    const { data: tasks } = useTasks();
    const { financeGoals, summary } = useFinance();

    const tasksCompleted = tasks?.filter(t => t.status === 'done').length || 0;
    const financeTransactions = summary?.transaction_count || 0; // Note: This is monthly count
    const financeGoalsCount = financeGoals?.length || 0;

    const externalStats: achievementsService.ExternalAchievementStats = {
        tasksCompleted,
        financeTransactions,
        financeGoals: financeGoalsCount
    };

    return useQuery({
        queryKey: ['achievements', user?.id, habits, tasksCompleted, financeTransactions, financeGoalsCount],
        queryFn: async () => {
            if (!user?.id) return [];
            const existing = await achievementsService.getUserAchievements(user.id);

            // Auto-check for new unlocks
            // We check if habits or stats imply we should check
            if (habits.length > 0 || tasksCompleted > 0 || financeTransactions > 0 || financeGoalsCount > 0) {
                await achievementsService.checkAndUnlockAchievements(user.id, habits, existing, externalStats);
            }

            const updatedExisting = await achievementsService.getUserAchievements(user.id);
            const progress = achievementsService.calculateAchievementProgress(habits, externalStats);

            return achievementsService.getAchievementsWithStatus(updatedExisting, progress);
        },
        enabled: !!user?.id,
    });
}
