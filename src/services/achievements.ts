// =============================================================================
// Achievements Service
// =============================================================================

import { supabase, supabaseConfigured } from '@/lib/supabase';
import { ACHIEVEMENTS, type UserAchievement, type AchievementWithStatus } from '@/types/gamification';
import type { HabitWithCheckins } from '@/types/habits';
import { calculateStreak } from './habits';

export async function getUserAchievements(userId: string): Promise<UserAchievement[]> {
    if (!supabaseConfigured) return [];

    const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId);

    if (error) {
        console.error('Error fetching achievements:', error);
        return [];
    }

    return data || [];
}

export async function unlockAchievement(userId: string, achievementId: string): Promise<boolean> {
    if (!supabaseConfigured) return false;

    const { error } = await supabase
        .from('user_achievements')
        .insert({ user_id: userId, achievement_id: achievementId } as any)
        .select()
        .single();

    if (error) {
        if (error.code === '23505') return true; // Already unlocked
        console.error('Error unlocking achievement:', error);
        return false;
    }

    return true;
}

export interface AchievementProgress {
    streakBest: number;
    totalCheckins: number;
    activeHabits: number;
    uniqueCategories: number;
    perfectWeeks: number;
    monthlyGoalsReached: number;
    weeklyRate: number;
    tasksCompleted: number;
    financeTransactions: number;
    financeGoals: number;
}

export interface ExternalAchievementStats {
    tasksCompleted?: number;
    financeTransactions?: number;
    financeGoals?: number;
}

export function calculateAchievementProgress(habits: HabitWithCheckins[], externalStats?: ExternalAchievementStats): AchievementProgress {
    const streakBest = Math.max(...habits.map(h => calculateStreak(h.checkins)), 0);
    const totalCheckins = habits.reduce((acc, h) => acc + h.checkins.filter(c => c.completed).length, 0);
    const activeHabits = habits.filter(h => h.active).length;
    const uniqueCategories = new Set(habits.map(h => h.category).filter(Boolean)).size;

    return {
        streakBest,
        totalCheckins,
        activeHabits,
        uniqueCategories,
        perfectWeeks: 0,
        monthlyGoalsReached: 0,
        weeklyRate: 0,
        tasksCompleted: externalStats?.tasksCompleted || 0,
        financeTransactions: externalStats?.financeTransactions || 0,
        financeGoals: externalStats?.financeGoals || 0
    };
}

export function getAchievementsWithStatus(userAchievements: UserAchievement[], progress: AchievementProgress): AchievementWithStatus[] {
    const unlockedMap = new Map(userAchievements.map(ua => [ua.achievement_id, ua.unlocked_at]));

    console.log('[Achievements Debug]', {
        totalAchievements: ACHIEVEMENTS.length,
        unlockedCount: userAchievements.length,
        unlockedIds: Array.from(unlockedMap.keys()),
        progress
    });

    return ACHIEVEMENTS.map(achievement => {
        const unlocked = unlockedMap.has(achievement.id);
        let currentProgress = 0;

        // Safe division helper
        const safeProgress = (current: number, required: number): number => {
            if (required <= 0) return 0;
            const calculated = (current / required) * 100;
            return Math.min(calculated, 100);
        };

        // Calculate progress based on category
        switch (achievement.category) {
            case 'streak':
                currentProgress = safeProgress(progress.streakBest, achievement.requirement);
                break;
            case 'completion':
                currentProgress = safeProgress(progress.totalCheckins, achievement.requirement);
                break;
            case 'milestone':
                // Logic based on specific IDs if needed, generic for now
                if (achievement.id.startsWith('habits_')) {
                    currentProgress = safeProgress(progress.activeHabits, achievement.requirement);
                } else if (achievement.id === 'all_categories') {
                    currentProgress = safeProgress(progress.uniqueCategories, achievement.requirement);
                } else if (achievement.id === 'first_habit') {
                    currentProgress = progress.activeHabits >= 1 ? 100 : 0;
                }
                break;
            case 'consistency':
                // Placeholder logic - needs proper implementation
                currentProgress = 0;
                break;
            case 'task':
                currentProgress = safeProgress(progress.tasksCompleted, achievement.requirement);
                break;
            case 'finance':
                if (achievement.id === 'finance_first') {
                    currentProgress = progress.financeTransactions >= 1 ? 100 : 0;
                } else if (achievement.id === 'finance_saver') {
                    currentProgress = progress.financeGoals >= 1 ? 100 : 0;
                }
                break;
        }

        // If unlocked, ensure it shows 100%
        if (unlocked && currentProgress < 100) {
            currentProgress = 100;
        }

        const finalProgress = Math.max(0, Math.min(Math.round(currentProgress), 100));

        return {
            ...achievement,
            unlocked,
            unlockedAt: unlockedMap.get(achievement.id),
            progress: finalProgress
        };
    });
}

export async function checkAndUnlockAchievements(userId: string, habits: HabitWithCheckins[], existingAchievements: UserAchievement[], externalStats?: ExternalAchievementStats): Promise<string[]> {
    const progress = calculateAchievementProgress(habits, externalStats);
    const achievementsWithStatus = getAchievementsWithStatus(existingAchievements, progress);
    const newlyUnlocked: string[] = [];

    for (const achievement of achievementsWithStatus) {
        if (!achievement.unlocked && achievement.progress >= 100) {
            if (await unlockAchievement(userId, achievement.id)) {
                newlyUnlocked.push(achievement.id);
            }
        }
    }

    return newlyUnlocked;
}
