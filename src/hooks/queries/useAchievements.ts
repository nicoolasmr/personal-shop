import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import * as achievementsService from '@/services/achievements';
import { HabitWithCheckins } from '@/types/habits';

export function useAchievements(habits: HabitWithCheckins[]) {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['achievements', user?.id, habits], // Re-calculate when habits change
        queryFn: async () => {
            if (!user?.id) return [];
            const existing = await achievementsService.getUserAchievements(user.id);

            // Auto-check for new unlocks
            if (habits.length > 0) {
                await achievementsService.checkAndUnlockAchievements(user.id, habits, existing);
            }

            const updatedExisting = await achievementsService.getUserAchievements(user.id);
            const progress = achievementsService.calculateAchievementProgress(habits);

            return achievementsService.getAchievementsWithStatus(updatedExisting, progress);
        },
        enabled: !!user?.id,
    });
}
