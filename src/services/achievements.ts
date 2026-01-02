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

    console.log(`[unlockAchievement] Attempting to unlock ${achievementId} for user ${userId}`);

    const { error } = await supabase
        .from('user_achievements')
        .insert({
            user_id: userId,
            achievement_id: achievementId,
            unlocked_at: new Date().toISOString()
        } as any);

    if (error) {
        if (error.code === '23505') {
            console.log(`[unlockAchievement] Achievement ${achievementId} already unlocked.`);
            return true; // Already unlocked
        }
        console.error(`[unlockAchievement] Error unlocking ${achievementId}:`, error);
        return false;
    }

    console.log(`[unlockAchievement] Successfully unlocked ${achievementId}!`);
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
    // Ensure we have values and they are numbers
    const streakBest = habits.length > 0 ? Math.max(...habits.map(h => calculateStreak(h.checkins || [])), 0) : 0;
    const totalCheckins = habits.reduce((acc, h) => acc + (h.checkins?.filter(c => c.completed).length || 0), 0);
    const activeHabits = habits.filter(h => h.active).length;
    const uniqueCategories = new Set(habits.map(h => h.category).filter(Boolean)).size;

    return {
        streakBest: Number(streakBest) || 0,
        totalCheckins: Number(totalCheckins) || 0,
        activeHabits: Number(activeHabits) || 0,
        uniqueCategories: Number(uniqueCategories) || 0,
        perfectWeeks: 0,
        monthlyGoalsReached: 0,
        weeklyRate: 0,
        tasksCompleted: Number(externalStats?.tasksCompleted) || 0,
        financeTransactions: Number(externalStats?.financeTransactions) || 0,
        financeGoals: Number(externalStats?.financeGoals) || 0
    };
}

export function getAchievementsWithStatus(userAchievements: UserAchievement[], progress: AchievementProgress): AchievementWithStatus[] {
    const unlockedMap = new Map(userAchievements.map(ua => [ua.achievement_id, ua.unlocked_at]));

    return ACHIEVEMENTS.map(achievement => {
        const unlocked = unlockedMap.has(achievement.id);
        let currentProgress = 0;

        // Safe division helper
        const safeProgress = (current: number, required: number): number => {
            if (!required || required <= 0) return 0;
            const currentVal = Number(current) || 0;
            const calculated = (currentVal / required) * 100;
            return Math.min(Math.round(calculated), 100);
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
                if (achievement.id.startsWith('habits_')) {
                    currentProgress = safeProgress(progress.activeHabits, achievement.requirement);
                } else if (achievement.id === 'all_categories') {
                    currentProgress = safeProgress(progress.uniqueCategories, achievement.requirement);
                } else if (achievement.id === 'first_habit') {
                    currentProgress = progress.activeHabits >= 1 ? 100 : 0;
                }
                break;
            case 'consistency':
                // For now, these are not fully implemented, so we keep at 0 unless unlocked
                currentProgress = unlocked ? 100 : 0;
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
            default:
                currentProgress = 0;
        }

        // If unlocked, force it to show 100%
        if (unlocked) {
            currentProgress = 100;
        }

        // CRITICAL FIX: If not unlocked, but progress is 100%, cap it at 99% until the unlock process finishes
        // This prevents the "Locked but 100%" visual glitch reported by user.
        if (!unlocked && currentProgress >= 100) {
            // Check if it's one of the easy "first_" ones, which can be 100% 
            // but for consistency we'll cap it at 99.
            currentProgress = 99;
        }

        return {
            ...achievement,
            unlocked,
            unlockedAt: unlockedMap.get(achievement.id),
            progress: currentProgress
        };
    });
}

export async function checkAndUnlockAchievements(userId: string, habits: HabitWithCheckins[], existingAchievements: UserAchievement[], externalStats?: ExternalAchievementStats): Promise<string[]> {
    const progress = calculateAchievementProgress(habits, externalStats);
    const achievementsWithStatus = getAchievementsWithStatus(existingAchievements, progress);
    const newlyUnlocked: string[] = [];

    console.log('[checkAndUnlockAchievements] Stats:', {
        totalCheckins: progress.totalCheckins,
        tasks: progress.tasksCompleted,
        finance: progress.financeTransactions
    });

    for (const achievement of achievementsWithStatus) {
        // If progress is 99 (capped from 100) or actually >= 100
        const isEligible = !achievement.unlocked &&
            (achievement.progress >= 99 ||
                (achievement.category === 'completion' && progress.totalCheckins >= achievement.requirement) ||
                (achievement.category === 'streak' && progress.streakBest >= achievement.requirement) ||
                (achievement.category === 'task' && progress.tasksCompleted >= achievement.requirement) ||
                (achievement.category === 'finance' && achievement.id === 'finance_first' && progress.financeTransactions >= 1) ||
                (achievement.category === 'finance' && achievement.id === 'finance_saver' && progress.financeGoals >= 1)
            );

        if (isEligible) {
            console.log(`[checkAndUnlockAchievements] Unlocking ${achievement.id}...`);
            if (await unlockAchievement(userId, achievement.id)) {
                newlyUnlocked.push(achievement.id);
            }
        }
    }

    return newlyUnlocked;
}
