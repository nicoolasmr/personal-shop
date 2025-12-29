export interface Achievement {
    id: string; name: string; description: string;
    icon: string; category: 'streak' | 'completion' | 'consistency' | 'milestone';
    requirement: number; color: string;
}

export interface UserAchievement {
    id: string; user_id: string; achievement_id: string; unlocked_at: string;
}

export interface AchievementWithStatus extends Achievement {
    unlocked: boolean; unlockedAt?: string; progress: number;
}

export const ACHIEVEMENTS: Achievement[] = [
    { id: 'streak_3', name: 'Iniciante', description: 'Complete 3 dias seguidos', icon: 'Flame', category: 'streak', requirement: 3, color: '#f97316' },
    { id: 'streak_7', name: 'Uma Semana', description: 'Complete 7 dias seguidos', icon: 'Flame', category: 'streak', requirement: 7, color: '#f97316' },
    { id: 'streak_30', name: 'Um Mês', description: 'Complete 30 dias seguidos', icon: 'Flame', category: 'streak', requirement: 30, color: '#ef4444' },
    { id: 'checkins_10', name: 'Primeiros Passos', description: 'Complete 10 check-ins', icon: 'CheckCircle', category: 'completion', requirement: 10, color: '#22c55e' },
    { id: 'checkins_100', name: 'Dedicado', description: 'Complete 100 check-ins', icon: 'CheckCircle', category: 'completion', requirement: 100, color: '#16a34a' },
    { id: 'perfect_week', name: 'Semana Perfeita', description: 'Complete 100% dos hábitos em uma semana', icon: 'Star', category: 'consistency', requirement: 1, color: '#eab308' },
    { id: 'first_habit', name: 'Primeiro Passo', description: 'Crie seu primeiro hábito', icon: 'Rocket', category: 'milestone', requirement: 1, color: '#8b5cf6' },
    // ... more achievements
];
