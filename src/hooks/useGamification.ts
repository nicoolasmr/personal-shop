
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import * as achievementsService from '@/services/achievements';
import { calculateUserXP, getLevelForXP } from '@/types/levels';
import { useHabits } from '@/hooks/useHabits';

export function useGamification() {
    const { user } = useAuth();

    const { data: habits = [] } = useHabits();

    // Fetch user achievements to calculate total XP
    const { data: userAchievements = [] } = useQuery({
        queryKey: ['user-achievements-xp', user?.id],
        queryFn: async () => {
            if (!user?.id) return [];
            return achievementsService.getUserAchievements(user.id);
        },
        enabled: !!user?.id
    });

    const totalXP = calculateUserXP(userAchievements);
    const currentLevel = getLevelForXP(totalXP);

    const xpInCurrentLevel = totalXP - currentLevel.minXP;
    const levelRange = 500;
    const progressPercent = Math.min(100, Math.max(0, (xpInCurrentLevel / levelRange) * 100));
    const xpToNextLevel = levelRange - xpInCurrentLevel;

    // Mock weekly stats for now (as service call for this specific aggregation doesn't exist yet)
    const weeklyStats = {
        habitCheckins: habits.reduce((acc, h) => acc + (h.checkins?.length || 0), 0), // Total checkins ever (simplified for mock)
        goalsProgressed: 0, // Would come from goals state
        tasksCompleted: 0, // Would come from tasks state
        streakDays: Math.max(0, ...habits.map(h => achievementsService.calculateStreak(h.checkins || []))), // Best streak
        xpEarned: totalXP > 100 ? 100 : totalXP, // Weekly XP mock
        perfectDays: 0 // Mock
    };

    return {
        totalXP,
        habits,
        weeklyStats, // Export weekly stats
        userXP: {
            currentLevel,
            progressPercent,
            xpToNextLevel
        }
    };
}
