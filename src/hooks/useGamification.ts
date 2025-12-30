import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { getLevelInfo } from '@/types/levels';
import { useHabits } from '@/hooks/useHabits';
import type { UserXP } from '@/types/levels';

export function useGamification() {
    const { user } = useAuth();
    const { data: habits = [] } = useHabits();

    // Fetch real User XP from the database
    const { data: xpData, isLoading: isLoadingXP } = useQuery({
        queryKey: ['user-xp', user?.id],
        queryFn: async () => {
            if (!user?.id) return null;
            const { data, error } = await supabase
                .from('user_xp')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching User XP:', error);
                return null;
            }
            return data || { total_xp: 0, current_level: 1 };
        },
        enabled: !!user?.id
    });

    const totalXP = xpData?.total_xp || 0;
    const xpInfo = getLevelInfo(totalXP);

    // Still calculate streaks from habits for the dashboard
    const bestStreak = habits.length > 0
        ? Math.max(...habits.map(h => {
            // Simple streak calculation if not using a service
            return h.checkins?.filter(c => c.completed).length || 0;
        }), 0)
        : 0;

    const weeklyStats = {
        habitCheckins: habits.reduce((acc, h) => acc + (h.checkins?.filter(c => c.completed).length || 0), 0),
        goalsProgressed: 0, // Placeholder for real goals sync
        tasksCompleted: 0, // Placeholder for real tasks sync
        streakDays: bestStreak,
        xpEarned: totalXP > 100 ? 100 : totalXP, // Simplified for now
        perfectDays: 0
    };

    return {
        isLoading: isLoadingXP,
        totalXP,
        habits,
        weeklyStats,
        userXP: xpInfo
    };
}
