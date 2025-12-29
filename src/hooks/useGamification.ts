
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import * as achievementsService from '@/services/achievements';
import { calculateUserXP, getLevelForXP } from '@/types/levels';
import { useHabits } from '@/hooks/useHabits'; // Import useHabits directly

export function useGamification() {
    const { user } = useAuth();

    // Expose habits from this hook as requested by ProgressReportCard logic
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

    // Find standard next level start
    const xpInCurrentLevel = totalXP - currentLevel.minXP;
    const levelRange = 500; // Mock range
    const progressPercent = Math.min(100, Math.max(0, (xpInCurrentLevel / levelRange) * 100)); // Mock formula
    const xpToNextLevel = levelRange - xpInCurrentLevel;

    return {
        totalXP,
        habits, // Return habits for the report card
        userXP: {
            currentLevel,
            progressPercent,
            xpToNextLevel
        }
    };
}
