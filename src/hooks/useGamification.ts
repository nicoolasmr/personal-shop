// =============================================================================
// useGamification - Hook para XP, níveis e estatísticas
// =============================================================================

import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { supabase } from '@/lib/supabase';
import { getLevelInfo } from '@/types/levels';

interface UserXPData {
    total_xp: number;
    current_level: number;
}

interface WeeklyStats {
    habitCheckins: number;
    goalsProgressed: number;
    tasksCompleted: number;
    streakDays: number;
    xpEarned: number;
    perfectDays: number;
}

export function useGamification() {
    const { user } = useAuth();

    // Fetch real XP data from database
    const { data: xpData } = useQuery({
        queryKey: ['user_xp', user?.id],
        queryFn: async (): Promise<UserXPData> => {
            if (!user?.id) return { total_xp: 0, current_level: 1 };

            const { data, error } = await supabase
                .from('user_xp')
                .select('total_xp, current_level')
                .eq('user_id', user.id)
                .maybeSingle();

            if (error) {
                console.error('Error fetching XP:', error);
                return { total_xp: 0, current_level: 1 };
            }

            return data || { total_xp: 0, current_level: 1 };
        },
        enabled: !!user?.id,
    });

    const totalXP = xpData?.total_xp || 0;
    const levelInfo = getLevelInfo(totalXP);

    // Weekly stats (simplified for now - can be enhanced with real queries)
    const weeklyStats: WeeklyStats = {
        habitCheckins: 0,
        goalsProgressed: 0,
        tasksCompleted: 0,
        streakDays: 0,
        xpEarned: 0,
        perfectDays: 0,
    };

    return {
        totalXP,
        userXP: levelInfo,
        weeklyStats,
        habits: [],
        goals: [],
        tasks: [],
    };
}
