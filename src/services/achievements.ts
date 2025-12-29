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
        .insert({ user_id: userId, achievement_id: achievementId })
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
}

export function calculateAchievementProgress(habits: HabitWithCheckins[]): AchievementProgress {
    const streakBest = Math.max(...habits.map(h => calculateStreak(h.checkins)), 0);
    const totalCheckins = habits.reduce((acc, h) => acc + h.checkins.filter(c => c.completed).length, 0);
    const activeHabits = habits.filter(h => h.active).length;
    const uniqueCategories = new Set(habits.map(h => h.category).filter(Boolean)).size;
    // ... calculate perfectWeeks, weeklyRate
    return { streakBest, totalCheckins, activeHabits, uniqueCategories, perfectWeeks: 0, monthlyGoalsReached: 0, weeklyRate: 0 };
}

export function getAchievementsWithStatus(userAchievements: UserAchievement[], progress: AchievementProgress): AchievementWithStatus[] {
    const unlockedMap = new Map(userAchievements.map(ua => [ua.achievement_id, ua.unlocked_at]));
    return ACHIEVEMENTS.map(achievement => {
        const unlocked = unlockedMap.has(achievement.id);
        let currentProgress = 0;
        // Calculate progress based on achievement.id (streak_3, checkins_50, etc.)
        return { ...achievement, unlocked, unlockedAt: unlockedMap.get(achievement.id), progress: Math.round(currentProgress) };
    });
}

export async function checkAndUnlockAchievements(userId: string, habits: HabitWithCheckins[], existingAchievements: UserAchievement[]): Promise<string[]> {
    const progress = calculateAchievementProgress(habits);
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
