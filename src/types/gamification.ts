export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: 'streak' | 'completion' | 'consistency' | 'milestone';
    requirement: number;
    color: string;
}

export interface UserAchievement {
    id: string;
    user_id: string;
    achievement_id: string;
    unlocked_at: string;
}

export interface AchievementWithStatus extends Achievement {
    unlocked: boolean;
    unlockedAt?: string;
    progress: number;
}

export const ACHIEVEMENTS: Achievement[] = [
    // Streak achievements
    { id: 'streak_3', name: 'Iniciante', description: 'Complete 3 dias seguidos', icon: 'Flame', category: 'streak', requirement: 3, color: '#f97316' },
    { id: 'streak_7', name: 'Uma Semana', description: 'Complete 7 dias seguidos', icon: 'Flame', category: 'streak', requirement: 7, color: '#f97316' },
    { id: 'streak_14', name: 'Duas Semanas', description: 'Complete 14 dias seguidos', icon: 'Flame', category: 'streak', requirement: 14, color: '#ef4444' },
    { id: 'streak_30', name: 'Um Mês', description: 'Complete 30 dias seguidos', icon: 'Flame', category: 'streak', requirement: 30, color: '#ef4444' },
    { id: 'streak_100', name: 'Centenário', description: 'Complete 100 dias seguidos', icon: 'Flame', category: 'streak', requirement: 100, color: '#dc2626' },

    // Completion achievements
    { id: 'checkins_10', name: 'Primeiros Passos', description: 'Complete 10 check-ins', icon: 'CheckCircle', category: 'completion', requirement: 10, color: '#22c55e' },
    { id: 'checkins_50', name: 'Comprometido', description: 'Complete 50 check-ins', icon: 'CheckCircle', category: 'completion', requirement: 50, color: '#22c55e' },
    { id: 'checkins_100', name: 'Dedicado', description: 'Complete 100 check-ins', icon: 'CheckCircle', category: 'completion', requirement: 100, color: '#16a34a' },
    { id: 'checkins_500', name: 'Mestre dos Hábitos', description: 'Complete 500 check-ins', icon: 'CheckCircle', category: 'completion', requirement: 500, color: '#15803d' },

    // Consistency achievements
    { id: 'perfect_week', name: 'Semana Perfeita', description: 'Complete 100% dos hábitos em uma semana', icon: 'Star', category: 'consistency', requirement: 1, color: '#eab308' },
    { id: 'perfect_month', name: 'Mês Perfeito', description: 'Atinja a meta mensal', icon: 'Trophy', category: 'consistency', requirement: 1, color: '#eab308' },
    { id: 'monthly_goals_3', name: 'Consistente', description: 'Atinja a meta mensal 3 vezes', icon: 'Trophy', category: 'consistency', requirement: 3, color: '#f59e0b' },
    { id: 'monthly_goals_6', name: 'Disciplinado', description: 'Atinja a meta mensal 6 vezes', icon: 'Crown', category: 'consistency', requirement: 6, color: '#d97706' },

    // Milestone achievements
    { id: 'habits_5', name: 'Diversificado', description: 'Crie 5 hábitos ativos', icon: 'Target', category: 'milestone', requirement: 5, color: '#3b82f6' },
    { id: 'habits_10', name: 'Ambicioso', description: 'Crie 10 hábitos ativos', icon: 'Target', category: 'milestone', requirement: 10, color: '#2563eb' },
    { id: 'first_habit', name: 'Primeiro Passo', description: 'Crie seu primeiro hábito', icon: 'Rocket', category: 'milestone', requirement: 1, color: '#8b5cf6' },
    { id: 'all_categories', name: 'Vida Equilibrada', description: 'Tenha hábitos em 5 categorias diferentes', icon: 'Sparkles', category: 'milestone', requirement: 5, color: '#a855f7' },
];

export const getAchievementById = (id: string): Achievement | undefined => ACHIEVEMENTS.find((a) => a.id === id);
export const getAchievementsByCategory = (category: Achievement['category']): Achievement[] => ACHIEVEMENTS.filter((a) => a.category === category);
