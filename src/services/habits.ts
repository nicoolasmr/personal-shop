// =============================================================================
// Habits Service - CRUD + Checkin Toggle + Audit Log
// =============================================================================

import { supabase } from '@/lib/supabase';
import type { Habit, HabitCheckin, HabitWithCheckins, CreateHabitPayload, UpdateHabitPayload } from '@/types/habits';

// Use the shared Supabase client (already handles missing config)
const db = supabase;

// Type helpers for Supabase responses
type HabitRow = {
    id: string;
    org_id: string;
    user_id: string;
    name: string;
    description: string | null;
    category: string | null;
    frequency: { type: 'daily' | 'weekly'; daysOfWeek?: number[] };
    target: number;
    weekly_goal: number;
    color: string | null;
    reminder_time: string | null;
    active: boolean;
    created_at: string;
    updated_at: string;
};

type CheckinRow = {
    id: string;
    org_id: string;
    habit_id: string;
    user_id: string;
    checkin_date: string;
    completed: boolean;
    notes: string | null;
    source: string;
    created_at: string;
};

// =============================================================================
// LIST HABITS (with recent checkins)
// =============================================================================

export async function listHabits(orgId: string): Promise<HabitWithCheckins[]> {
    // Get habits
    const { data: habits, error: habitsError } = await db
        .from('habits')
        .select('*')
        .eq('org_id', orgId)
        .eq('active', true)
        .order('created_at', { ascending: false });

    if (habitsError) throw habitsError;

    const typedHabits = (habits || []) as HabitRow[];
    if (typedHabits.length === 0) return [];

    // Get checkins for last 7 days
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);

    const startDate = sevenDaysAgo.toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];

    const habitIds = typedHabits.map(h => h.id);

    const { data: checkins, error: checkinsError } = await db
        .from('habit_checkins')
        .select('*')
        .eq('org_id', orgId)
        .in('habit_id', habitIds)
        .gte('checkin_date', startDate)
        .lte('checkin_date', endDate);

    if (checkinsError) throw checkinsError;

    const typedCheckins = (checkins || []) as CheckinRow[];

    // Combine habits with their checkins
    return typedHabits.map(habit => ({
        ...habit,
        checkins: typedCheckins.filter(c => c.habit_id === habit.id) as HabitCheckin[],
    }));
}

// =============================================================================
// GET SINGLE HABIT
// =============================================================================

export async function getHabit(orgId: string, habitId: string): Promise<HabitWithCheckins | null> {
    const { data: habit, error } = await db
        .from('habits')
        .select('*')
        .eq('org_id', orgId)
        .eq('id', habitId)
        .maybeSingle();

    if (error) throw error;
    if (!habit) return null;

    const typedHabit = habit as HabitRow;

    // Get checkins for last 7 days
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);

    const { data: checkins } = await db
        .from('habit_checkins')
        .select('*')
        .eq('habit_id', habitId)
        .gte('checkin_date', sevenDaysAgo.toISOString().split('T')[0])
        .lte('checkin_date', today.toISOString().split('T')[0]);

    return {
        ...typedHabit,
        checkins: (checkins || []) as HabitCheckin[],
    };
}

// =============================================================================
// CREATE HABIT
// =============================================================================

export async function createHabit(
    orgId: string,
    userId: string,
    payload: CreateHabitPayload
): Promise<Habit> {
    const insertData = {
        org_id: orgId,
        user_id: userId,
        name: payload.name,
        description: payload.description || null,
        category: payload.category || null,
        frequency: payload.frequency || { type: 'daily' },
        target: payload.target || 1,
        color: payload.color || null,
        reminder_time: payload.reminder_time || null,
    };

    const { data, error } = await db
        .from('habits')
        .insert(insertData)
        .select()
        .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to create habit');

    const typedData = data as HabitRow;

    // Audit log
    await logAudit(orgId, userId, 'habit_created', 'habit', typedData.id, {
        name: typedData.name,
        category: typedData.category,
    });

    return typedData;
}

// =============================================================================
// UPDATE HABIT
// =============================================================================

export async function updateHabit(
    orgId: string,
    userId: string,
    habitId: string,
    payload: UpdateHabitPayload
): Promise<Habit> {
    const updateData: Record<string, unknown> = {};

    if (payload.name !== undefined) updateData.name = payload.name;
    if (payload.description !== undefined) updateData.description = payload.description;
    if (payload.category !== undefined) updateData.category = payload.category;
    if (payload.frequency !== undefined) updateData.frequency = payload.frequency;
    if (payload.target !== undefined) updateData.target = payload.target;
    if (payload.color !== undefined) updateData.color = payload.color;
    if (payload.reminder_time !== undefined) updateData.reminder_time = payload.reminder_time;

    const { data, error } = await db
        .from('habits')
        .update(updateData)
        .eq('id', habitId)
        .eq('org_id', orgId)
        .select()
        .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to update habit');

    const typedData = data as HabitRow;

    // Audit log
    await logAudit(orgId, userId, 'habit_updated', 'habit', habitId, {
        changes: payload,
    });

    return typedData;
}

// =============================================================================
// ARCHIVE HABIT (soft delete)
// =============================================================================

export async function archiveHabit(
    orgId: string,
    userId: string,
    habitId: string
): Promise<void> {
    const { error } = await db
        .from('habits')
        .update({ active: false })
        .eq('id', habitId)
        .eq('org_id', orgId);

    if (error) throw error;

    // Audit log
    await logAudit(orgId, userId, 'habit_archived', 'habit', habitId, {});
}

// =============================================================================
// TOGGLE HABIT CHECKIN (upsert + invert)
// =============================================================================

export async function toggleHabitCheckin(
    orgId: string,
    userId: string,
    habitId: string,
    date?: string,
    source: 'app' | 'whatsapp' = 'app'
): Promise<{ completed: boolean; checkin: HabitCheckin | null }> {
    const checkinDate = date || new Date().toISOString().split('T')[0];

    // Check if checkin exists
    const { data: existing, error: selectError } = await db
        .from('habit_checkins')
        .select('*')
        .eq('habit_id', habitId)
        .eq('checkin_date', checkinDate)
        .maybeSingle();

    if (selectError) throw selectError;

    const typedExisting = existing as CheckinRow | null;
    let result: { completed: boolean; checkin: HabitCheckin | null };

    if (typedExisting) {
        // Toggle: invert completed status
        const newCompleted = !typedExisting.completed;

        const { data: updated, error: updateError } = await db
            .from('habit_checkins')
            .update({ completed: newCompleted })
            .eq('id', typedExisting.id)
            .select()
            .single();

        if (updateError) throw updateError;

        result = { completed: newCompleted, checkin: updated as HabitCheckin };
    } else {
        // Create new checkin
        const insertData = {
            org_id: orgId,
            habit_id: habitId,
            user_id: userId,
            checkin_date: checkinDate,
            completed: true,
            source,
        };

        const { data: created, error: insertError } = await db
            .from('habit_checkins')
            .insert(insertData)
            .select()
            .single();

        if (insertError) throw insertError;

        result = { completed: true, checkin: created as HabitCheckin };
    }

    // Audit log
    await logAudit(orgId, userId, 'habit_checkin_toggled', 'habit_checkin', habitId, {
        date: checkinDate,
        completed: result.completed,
        source,
    });

    return result;
}

// =============================================================================
// GET TODAY'S SUMMARY (for home card)
// =============================================================================

export async function getTodayHabitsSummary(orgId: string): Promise<{
    total: number;
    completed: number;
    habits: Array<HabitWithCheckins & { completedToday: boolean }>;
}> {
    const today = new Date().toISOString().split('T')[0];

    // Get active habits
    const { data: habits, error: habitsError } = await db
        .from('habits')
        .select('*')
        .eq('org_id', orgId)
        .eq('active', true)
        .order('created_at', { ascending: true });

    if (habitsError) throw habitsError;

    const typedHabits = (habits || []) as HabitRow[];
    if (typedHabits.length === 0) {
        return { total: 0, completed: 0, habits: [] };
    }

    // Get today's checkins
    const habitIds = typedHabits.map(h => h.id);
    const { data: checkins, error: checkinsError } = await db
        .from('habit_checkins')
        .select('*')
        .in('habit_id', habitIds)
        .eq('checkin_date', today)
        .eq('completed', true);

    if (checkinsError) throw checkinsError;

    const typedCheckins = (checkins || []) as CheckinRow[];
    const completedHabitIds = new Set(typedCheckins.map(c => c.habit_id));

    const habitsWithStatus = typedHabits.map(habit => ({
        ...habit,
        checkins: typedCheckins.filter(c => c.habit_id === habit.id) as HabitCheckin[],
        completedToday: completedHabitIds.has(habit.id),
    }));

    return {
        total: typedHabits.length,
        completed: completedHabitIds.size,
        habits: habitsWithStatus,
    };
}

// =============================================================================
// CALCULATE STREAK
// =============================================================================

export function calculateStreak(checkins: HabitCheckin[]): number {
    if (!checkins || checkins.length === 0) return 0;

    // Sort by date descending
    const sorted = [...checkins]
        .filter(c => c.completed)
        .sort((a, b) => new Date(b.checkin_date).getTime() - new Date(a.checkin_date).getTime());

    if (sorted.length === 0) return 0;

    // Start from the most recent checkin and count consecutive days
    let streak = 1;

    for (let i = 0; i < sorted.length - 1; i++) {
        const currentDate = new Date(sorted[i].checkin_date);
        const nextDate = new Date(sorted[i + 1].checkin_date);

        // Check if dates are consecutive (1 day apart)
        const diffDays = Math.round(
            (currentDate.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays === 1) {
            streak++;
        } else {
            // Gap found, streak broken
            break;
        }
    }

    return streak;
}

// =============================================================================
// CALCULATE WEEKLY RATE
// =============================================================================

export function calculateWeeklyRate(checkins: HabitCheckin[]): number {
    if (!checkins || checkins.length === 0) return 0;

    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);

    const startDate = sevenDaysAgo.toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];

    const weeklyCheckins = checkins.filter(
        c => c.completed && c.checkin_date >= startDate && c.checkin_date <= endDate
    );

    return Math.round((weeklyCheckins.length / 7) * 100);
}

// =============================================================================
// AUDIT LOG HELPER
// =============================================================================

async function logAudit(
    orgId: string,
    userId: string,
    action: string,
    entityType: string,
    entityId: string,
    meta: Record<string, unknown>
): Promise<void> {
    try {
        await db.from('audit_log').insert({
            org_id: orgId,
            user_id: userId,
            action,
            entity_type: entityType,
            entity_id: entityId,
            meta,
        });
    } catch (error) {
        // Don't fail main operation if audit fails
        console.error('Audit log error:', error);
    }
}
