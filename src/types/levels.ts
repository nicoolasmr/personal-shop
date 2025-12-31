// =============================================================================
// Levels System - XP to Level Calculation & Metadata
// =============================================================================

export interface LevelDefinition {
    level: number;
    xpRequired: number;
    name: string;
    icon: string; // Matches keys in LevelProgressCard ICON_MAP
    color: string;
}

export interface LevelInfo {
    level: number;
    currentXP: number;
    xpForCurrentLevel: number;
    xpForNextLevel: number;
    progressToNextLevel: number;
    progressPercentage: number;
}

/**
 * Level Definitions (Metadata + XP Requirements)
 */
export const LEVELS: LevelDefinition[] = [
    { level: 1, xpRequired: 0, name: 'Novato', icon: 'Sprout', color: '#4ade80' }, // Green-400
    { level: 2, xpRequired: 100, name: 'Iniciante', icon: 'Sprout', color: '#22c55e' }, // Green-500
    { level: 3, xpRequired: 250, name: 'Aprendiz', icon: 'Leaf', color: '#16a34a' }, // Green-600
    { level: 4, xpRequired: 450, name: 'Explorador', icon: 'Leaf', color: '#059669' }, // Emerald-600
    { level: 5, xpRequired: 700, name: 'Praticante', icon: 'Zap', color: '#0d9488' }, // Teal-600
    { level: 6, xpRequired: 1000, name: 'Habilidoso', icon: 'Zap', color: '#0891b2' }, // Cyan-600
    { level: 7, xpRequired: 1350, name: 'Dedicado', icon: 'Star', color: '#0284c7' }, // Sky-600
    { level: 8, xpRequired: 1750, name: 'Comprometido', icon: 'Star', color: '#2563eb' }, // Blue-600
    { level: 9, xpRequired: 2200, name: 'Entusiasta', icon: 'Medal', color: '#4f46e5' }, // Indigo-600
    { level: 10, xpRequired: 2700, name: 'Veterano', icon: 'Medal', color: '#7c3aed' }, // Violet-600
    { level: 11, xpRequired: 3250, name: 'Especialista', icon: 'Award', color: '#9333ea' }, // Purple-600
    { level: 12, xpRequired: 3850, name: 'Mestre', icon: 'Award', color: '#c026d3' }, // Fuchsia-600
    { level: 13, xpRequired: 4500, name: 'Grão-Mestre', icon: 'Trophy', color: '#db2777' }, // Pink-600
    { level: 14, xpRequired: 5200, name: 'Virtuoso', icon: 'Trophy', color: '#e11d48' }, // Rose-600
    { level: 15, xpRequired: 5950, name: 'Lenda', icon: 'Crown', color: '#f59e0b' }, // Amber-500
    { level: 16, xpRequired: 6750, name: 'Mítico', icon: 'Crown', color: '#d97706' }, // Amber-600
    { level: 17, xpRequired: 7600, name: 'Imortal', icon: 'Sparkles', color: '#ea580c' }, // Orange-600
    { level: 18, xpRequired: 8500, name: 'Divino', icon: 'Sparkles', color: '#dc2626' }, // Red-600
    { level: 19, xpRequired: 9450, name: 'Onisciente', icon: 'Sun', color: '#fcd34d' }, // Amber-300 (Gold)
    { level: 20, xpRequired: 10450, name: 'Vida360', icon: 'Sun', color: '#fbbf24' }, // Amber-400 (Gold)
];

/**
 * Array of just XP thresholds for calculation logic
 */
const XP_THRESHOLDS = LEVELS.map(l => l.xpRequired);

/**
 * Calculate level info from total XP
 */
export function getLevelInfo(totalXP: number): LevelInfo {
    let level = 1;
    let xpForCurrentLevel = 0;
    let xpForNextLevel = XP_THRESHOLDS[1];

    // Find current level
    for (let i = 0; i < XP_THRESHOLDS.length; i++) {
        if (totalXP >= XP_THRESHOLDS[i]) {
            level = i + 1;
            xpForCurrentLevel = XP_THRESHOLDS[i];
            xpForNextLevel = XP_THRESHOLDS[i + 1] || XP_THRESHOLDS[i] + 1000;
        } else {
            break;
        }
    }

    // If beyond max defined level, assume 1000xp per level
    if (level > XP_THRESHOLDS.length) {
        const lastDefinedXP = XP_THRESHOLDS[XP_THRESHOLDS.length - 1];
        const increment = 1000;
        const extraLevels = Math.floor((totalXP - lastDefinedXP) / increment);

        // Cap visual level at 20 (or max defined) if you want, or allow it to go up endlessly but repeat visuals
        // For now, let's keep the math right
        level = XP_THRESHOLDS.length + extraLevels;
        xpForCurrentLevel = lastDefinedXP + (extraLevels * increment);
        xpForNextLevel = xpForCurrentLevel + increment;
    }

    const progressToNextLevel = totalXP - xpForCurrentLevel;
    const xpNeeded = xpForNextLevel - xpForCurrentLevel;
    const progressPercentage = Math.min(100, Math.max(0, Math.round((progressToNextLevel / xpNeeded) * 100)));

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
    if (level <= XP_THRESHOLDS.length) {
        return XP_THRESHOLDS[level - 1];
    }
    const lastXP = XP_THRESHOLDS[XP_THRESHOLDS.length - 1];
    const levelsAbove = level - XP_THRESHOLDS.length;
    return lastXP + (levelsAbove * 1000);
}

export function calculateUserXP(totalXP: number): LevelInfo {
    return getLevelInfo(totalXP);
}
