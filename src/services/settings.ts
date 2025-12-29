// =============================================================================
// User Settings Service
// =============================================================================

import { supabase, supabaseConfigured } from '@/lib/supabase';

export interface UserSettings {
    user_id: string;
    monthly_goal: number;
    created_at: string;
    updated_at: string;
}

const DEFAULT_MONTHLY_GOAL = 80;

export async function getUserSettings(userId: string): Promise<UserSettings | null> {
    if (!supabaseConfigured) return null;

    const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

    if (error) {
        console.error('Error fetching user settings:', error);
        return null;
    }

    return data;
}

export async function getOrCreateUserSettings(userId: string): Promise<UserSettings> {
    if (!supabaseConfigured) {
        return {
            user_id: userId,
            monthly_goal: DEFAULT_MONTHLY_GOAL,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
    }

    const existing = await getUserSettings(userId);
    if (existing) return existing;

    const { data, error } = await supabase
        .from('user_settings')
        .insert({ user_id: userId, monthly_goal: DEFAULT_MONTHLY_GOAL })
        .select()
        .single();

    if (error) {
        return {
            user_id: userId,
            monthly_goal: DEFAULT_MONTHLY_GOAL,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
    }

    return data;
}

export async function updateMonthlyGoal(userId: string, goal: number): Promise<{ success: boolean; error?: string }> {
    if (!supabaseConfigured) return { success: false, error: 'Supabase não configurado' };
    if (goal < 1 || goal > 100) return { success: false, error: 'Meta deve estar entre 1 e 100' };

    const { error } = await supabase.from('user_settings').upsert({
        user_id: userId,
        monthly_goal: goal,
        updated_at: new Date().toISOString(),
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
}
