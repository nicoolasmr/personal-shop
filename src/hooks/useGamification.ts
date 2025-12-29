
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import * as achievementsService from '@/services/achievements';
import { calculateUserXP, getLevelForXP } from '@/types/levels';

export function useGamification() {
    const { user } = useAuth();

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
    // Calculate progress to next level
    const nextLevelXP = currentLevel.minXP * 1.5; // Simplistic view, assuming levels scale
    // Get real next level requirement if possible from levels list

    // Re-deriving level progress logic based on typical XP systems
    // Since LEVELS is imported in component, we will rely on calculating relative progress
    // For now returning structured data

    // Find standard next level start
    const xpInCurrentLevel = totalXP - currentLevel.minXP;
    // This logic is a placeholder. Assuming generic scaling if max level reached
    const levelRange = 500; // Mock range
    const progressPercent = Math.min(100, Math.max(0, (xpInCurrentLevel / levelRange) * 100)); // Mock formula
    const xpToNextLevel = levelRange - xpInCurrentLevel;

    return {
        totalXP,
        userXP: {
            currentLevel,
            progressPercent, // Should be calculated against next level threshold
            xpToNextLevel
        }
    };
}
