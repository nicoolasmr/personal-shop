export type GoalType = 'custom' | 'financial' | 'habit' | 'task' | 'reading' | 'weight' | 'exercise' | 'savings' | 'study' | 'health';
export type GoalStatus = 'active' | 'done' | 'archived';
export type ProgressSource = 'app' | 'whatsapp' | 'integration';
export type TrackingFrequency = 'daily' | 'weekly' | 'monthly';

export interface GoalTypeConfig { label: string; icon: string; defaultUnit: string; frequency: TrackingFrequency; description: string; placeholder: string; progressLabel: string; color: string; }

export const GOAL_TYPE_CONFIGS: Record<GoalType, GoalTypeConfig> = {
    custom: { label: 'Personalizada', icon: 'Target', defaultUnit: '', frequency: 'daily', description: 'Crie sua própria meta', placeholder: 'Ex: 100', progressLabel: 'Progresso', color: 'blue' },
    financial: { label: 'Financeira', icon: 'DollarSign', defaultUnit: 'R$', frequency: 'monthly', description: 'Acompanhe economias e investimentos', placeholder: 'Ex: 5000', progressLabel: 'Quanto guardou?', color: 'green' },
    savings: { label: 'Economia', icon: 'PiggyBank', defaultUnit: 'R$', frequency: 'monthly', description: 'Meta de economia mensal', placeholder: 'Ex: 1000', progressLabel: 'Valor economizado', color: 'emerald' },
    habit: { label: 'Hábito', icon: 'Repeat', defaultUnit: 'dias', frequency: 'daily', description: 'Vincule a um hábito existente', placeholder: 'Ex: 30', progressLabel: 'Dias completados', color: 'purple' },
    task: { label: 'Tarefa', icon: 'CheckSquare', defaultUnit: 'tarefas', frequency: 'weekly', description: 'Vincule a tarefas do quadro', placeholder: 'Ex: 10', progressLabel: 'Tarefas concluídas', color: 'orange' },
    reading: { label: 'Leitura', icon: 'BookOpen', defaultUnit: 'páginas', frequency: 'daily', description: 'Registre páginas lidas', placeholder: 'Ex: 300', progressLabel: 'Páginas lidas hoje', color: 'amber' },
    weight: { label: 'Peso', icon: 'Scale', defaultUnit: 'kg', frequency: 'weekly', description: 'Acompanhe progresso de peso', placeholder: 'Ex: 5', progressLabel: 'Quanto perdeu esta semana?', color: 'rose' },
    exercise: { label: 'Exercício', icon: 'Dumbbell', defaultUnit: 'minutos', frequency: 'daily', description: 'Registre minutos de exercício', placeholder: 'Ex: 150', progressLabel: 'Minutos de exercício hoje', color: 'cyan' },
    study: { label: 'Estudo', icon: 'GraduationCap', defaultUnit: 'horas', frequency: 'daily', description: 'Acompanhe horas de estudo', placeholder: 'Ex: 100', progressLabel: 'Horas estudadas hoje', color: 'indigo' },
    health: { label: 'Saúde', icon: 'Heart', defaultUnit: 'dias', frequency: 'daily', description: 'Metas de saúde e bem-estar', placeholder: 'Ex: 30', progressLabel: 'Progresso do dia', color: 'red' },
};

export interface Goal {
    id: string; org_id: string; user_id: string; type: GoalType; title: string; description: string | null;
    target_value: number | null; current_value: number; unit: string | null; due_date: string | null;
    status: GoalStatus; linked_habit_id?: string | null; linked_finance_goal_id?: string | null;
    created_at: string; updated_at: string;
}

export interface GoalProgress { id: string; org_id: string; goal_id: string; user_id: string; progress_date: string; delta_value: number; notes: string | null; source: ProgressSource; created_at: string; }
export interface GoalWithProgress extends Goal { progress: GoalProgress[]; }

export interface CreateGoalPayload { type?: GoalType; title: string; description?: string; target_value?: number; unit?: string; due_date?: string; linked_habit_id?: string; }
export interface UpdateGoalPayload { title?: string; description?: string; target_value?: number; unit?: string; due_date?: string; status?: GoalStatus; }
export interface AddProgressPayload { delta_value: number; notes?: string; progress_date?: string; source?: ProgressSource; }

export function calculateProgress(goal: Goal): number {
    if (!goal.target_value || goal.target_value === 0) return 0;
    return Math.min(Math.round((goal.current_value / goal.target_value) * 100), 100);
}

export function isGoalOverdue(goal: Goal): boolean {
    if (!goal.due_date || goal.status !== 'active') return false;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return new Date(goal.due_date) < today;
}

export function getDaysRemaining(goal: Goal): number | null {
    if (!goal.due_date) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return Math.ceil((new Date(goal.due_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = { active: 'Ativa', done: 'Concluída', archived: 'Arquivada' };
