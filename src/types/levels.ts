export interface UserLevel {
    level: number; name: string;
    minXP: number; maxXP: number;
    color: string; icon: string;
}

export interface UserXP {
    totalXP: number; currentLevel: UserLevel;
    xpToNextLevel: number; progressPercent: number;
}

export const XP_REWARDS = {
    HABIT_CHECKIN: 10, GOAL_PROGRESS: 15, GOAL_COMPLETE: 100,
    STREAK_BONUS_7: 50, STREAK_BONUS_30: 200,
    ACHIEVEMENTS_UNLOCK: 75, TASK_COMPLETE: 10, FINANCE_LOG: 5,
} as const;

export const LEVELS: UserLevel[] = [
    { level: 1, name: 'Iniciante', minXP: 0, maxXP: 100, color: '#94a3b8', icon: 'Sprout' },
    { level: 2, name: 'Aprendiz', minXP: 100, maxXP: 300, color: '#22c55e', icon: 'Leaf' },
    { level: 3, name: 'Praticante', minXP: 300, maxXP: 600, color: '#3b82f6', icon: 'Zap' },
    { level: 4, name: 'Dedicado', minXP: 600, maxXP: 1000, color: '#8b5cf6', icon: 'Star' },
    { level: 5, name: 'Veterano', minXP: 1000, maxXP: 1500, color: '#f59e0b', icon: 'Medal' },
    { level: 6, name: 'Expert', minXP: 1500, maxXP: 2200, color: '#ef4444', icon: 'Award' },
    { level: 7, name: 'Mestre', minXP: 2200, maxXP: 3000, color: '#ec4899', icon: 'Trophy' },
    { level: 8, name: 'Lenda', minXP: 3000, maxXP: 4000, color: '#f97316', icon: 'Crown' },
    { level: 9, name: 'Imortal', minXP: 4000, maxXP: 5500, color: '#14b8a6', icon: 'Sparkles' },
    { level: 10, name: 'Transcendente', minXP: 5500, maxXP: Infinity, color: '#fbbf24', icon: 'Sun' },
];

export function getLevelForXP(xp: number): UserLevel {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
        if (xp >= LEVELS[i].minXP) return LEVELS[i];
    }
    return LEVELS[0];
}

export function calculateUserXP(totalXP: number): UserXP {
    const currentLevel = getLevelForXP(totalXP);
    const xpInCurrentLevel = totalXP - currentLevel.minXP;
    const xpNeededForLevel = currentLevel.maxXP - currentLevel.minXP;
    return {
        totalXP, currentLevel,
        xpToNextLevel: currentLevel.maxXP === Infinity ? 0 : currentLevel.maxXP - totalXP,
        progressPercent: Math.min(Math.round((xpInCurrentLevel / xpNeededForLevel) * 100), 100),
    };
}

export interface WeeklyStats {
    habitCheckins: number; goalsProgressed: number;
    tasksCompleted: number; streakDays: number;
    xpEarned: number; perfectDays: number;
}
