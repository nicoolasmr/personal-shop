export interface HabitFrequency { type: 'daily' | 'weekly'; daysOfWeek?: number[]; }

export interface Habit {
    id: string; org_id: string; user_id: string; name: string; description: string | null; category: string | null;
    frequency: HabitFrequency; target: number; weekly_goal: number; color: string | null;
    reminder_time: string | null; active: boolean; created_at: string; updated_at: string;
}

export interface HabitCheckin { id: string; org_id: string; habit_id: string; user_id: string; checkin_date: string; completed: boolean; notes: string | null; source: 'app' | 'whatsapp'; created_at: string; }
export interface HabitWithCheckins extends Habit { checkins: HabitCheckin[]; }

export interface CreateHabitPayload { name: string; description?: string; category?: string; frequency?: HabitFrequency; target?: number; weekly_goal?: number; color?: string; reminder_time?: string | null; }
export interface UpdateHabitPayload { name?: string; description?: string | null; category?: string | null; frequency?: HabitFrequency; target?: number; weekly_goal?: number; color?: string | null; reminder_time?: string | null; }

export const HABIT_CATEGORIES = [
    { value: 'health', label: 'Saúde' }, { value: 'exercise', label: 'Exercício' }, { value: 'reading', label: 'Leitura' },
    { value: 'study', label: 'Estudo' }, { value: 'financial', label: 'Financeira' }, { value: 'savings', label: 'Economia' },
    { value: 'habit', label: 'Hábito' }, { value: 'task', label: 'Tarefa' }, { value: 'weight', label: 'Peso' }, { value: 'custom', label: 'Personalizada' },
] as const;

export type HabitCategory = typeof HABIT_CATEGORIES[number]['value'];

export const HABIT_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899'] as const;
