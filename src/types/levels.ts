// =============================================================================
// Levels System - XP to Level Calculation
// =============================================================================

export interface LevelInfo {
    level: number;
    currentXP: number;
    xpForCurrentLevel: number;
    xpForNextLevel: number;
    progressToNextLevel: number;
    progressPercentage: number;
}

/**
 * XP required for each level (exponential growth)
 */
const XP_PER_LEVEL: number[] = [
    0,      // Level 1
    100,    // Level 2
    250,    // Level 3
    450,    // Level 4
    700,    // Level 5
    1000,   // Level 6
    1350,   // Level 7
    1750,   // Level 8
    2200,   // Level 9
    2700,   // Level 10
    3250,   // Level 11
    3850,   // Level 12
    4500,   // Level 13
    5200,   // Level 14
    5950,   // Level 15
    6750,   // Level 16
    7600,   // Level 17
    8500,   // Level 18
    9450,   // Level 19
    10450,  // Level 20
];

/**
 * Calculate level info from total XP
 */
export function getLevelInfo(totalXP: number): LevelInfo {
    let level = 1;
    let xpForCurrentLevel = 0;
    let xpForNextLevel = XP_PER_LEVEL[1];

    // Find current level
    for (let i = 0; i < XP_PER_LEVEL.length; i++) {
        if (totalXP >= XP_PER_LEVEL[i]) {
            level = i + 1;
            xpForCurrentLevel = XP_PER_LEVEL[i];
            xpForNextLevel = XP_PER_LEVEL[i + 1] || XP_PER_LEVEL[i] + 1000;
        } else {
            break;
        }
    }

    // If beyond max level, calculate dynamically
    if (level >= XP_PER_LEVEL.length) {
        const lastXP = XP_PER_LEVEL[XP_PER_LEVEL.length - 1];
        const increment = 1000;
        const levelsAbove = Math.floor((totalXP - lastXP) / increment);
        level = XP_PER_LEVEL.length + levelsAbove;
        xpForCurrentLevel = lastXP + (levelsAbove * increment);
        xpForNextLevel = xpForCurrentLevel + increment;
    }

    const progressToNextLevel = totalXP - xpForCurrentLevel;
    const xpNeeded = xpForNextLevel - xpForCurrentLevel;
    const progressPercentage = Math.min(100, Math.round((progressToNextLevel / xpNeeded) * 100));

    return {
        level,
        currentXP: totalXP,
        xpForCurrentLevel,
        xpForNextLevel,
        progressToNextLevel,
        progressPercentage,
    };
}

/**
 * Get XP required for a specific level
 */
export function getXPForLevel(level: number): number {
    if (level <= 0) return 0;
    if (level <= XP_PER_LEVEL.length) {
        return XP_PER_LEVEL[level - 1];
    }
    // Beyond max level
    const lastXP = XP_PER_LEVEL[XP_PER_LEVEL.length - 1];
    const levelsAbove = level - XP_PER_LEVEL.length;
    return lastXP + (levelsAbove * 1000);
}

/**
 * Calculate user XP (alias for getLevelInfo for backward compatibility)
 */
export function calculateUserXP(totalXP: number): LevelInfo {
    return getLevelInfo(totalXP);
}
