// =============================================================================
// Goal Integration Hooks - Connect goals with habits, finances, tasks
// =============================================================================

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTenant } from './useTenant';
import { useHabits } from './queries/useHabits';
import { useAddProgress } from './queries/useGoals';
import type { GoalWithProgress } from '@/types/goals';
import type { HabitWithCheckins } from '@/types/habits';

// Query keys
const GOAL_HABITS_SYNC_KEY = 'goal-habits-sync';

// =============================================================================
// USE HABITS FOR GOALS - Get habits that can be linked to goals
// =============================================================================

export function useHabitsForGoals() {
    const { data: habits, isLoading } = useHabits();

    // Filter active habits
    const activeHabits = habits?.filter(h => h.active) || [];

    return {
        habits: activeHabits,
        isLoading,
    };
}

// =============================================================================
// SYNC HABIT PROGRESS TO GOAL
// =============================================================================

export function useSyncHabitToGoal(goal: GoalWithProgress | null) {
    const { org } = useTenant();
    const { data: habits } = useHabits();
    const addProgress = useAddProgress();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!goal || goal.type !== 'habit' || !goal.linked_habit_id || !habits) {
            return;
        }

        const linkedHabit = habits.find(h => h.id === goal.linked_habit_id);
        if (!linkedHabit) return;

        // Calculate total checkins for this habit
        const totalCheckins = linkedHabit.checkins?.length || 0;

        // If goal current_value is different from checkins, it means we might need to sync
        // This is a simple sync mechanism - in production you'd want more sophisticated logic
        if (goal.current_value < totalCheckins) {
            // Don't auto-sync, just notify that sync is available
            console.log(`Goal ${goal.id} can be synced with habit ${linkedHabit.id}. Current: ${goal.current_value}, Habit checkins: ${totalCheckins}`);
        }
    }, [goal, habits]);

    const syncNow = async () => {
        if (!goal || goal.type !== 'habit' || !goal.linked_habit_id || !habits) {
            return;
        }

        const linkedHabit = habits.find(h => h.id === goal.linked_habit_id);
        if (!linkedHabit) return;

        const totalCheckins = linkedHabit.checkins?.length || 0;
        const delta = totalCheckins - goal.current_value;

        if (delta > 0) {
            addProgress.mutate({
                goalId: goal.id,
                payload: {
                    delta_value: delta,
                    notes: `Sincronizado automaticamente do hábito "${linkedHabit.name}"`,
                    source: 'integration',
                },
            });
        }
    };

    return { syncNow, isSyncing: addProgress.isPending };
}

// =============================================================================
// GET HABIT STREAK FOR DISPLAY
// =============================================================================

export function getHabitProgressInfo(habit: HabitWithCheckins) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate streak
    let streak = 0;
    const sortedCheckins = [...(habit.checkins || [])]
        .sort((a, b) => new Date(b.checkin_date).getTime() - new Date(a.checkin_date).getTime());

    for (const checkin of sortedCheckins) {
        const checkinDate = new Date(checkin.checkin_date);
        checkinDate.setHours(0, 0, 0, 0);

        const expectedDate = new Date(today);
        expectedDate.setDate(expectedDate.getDate() - streak);

        if (checkinDate.getTime() === expectedDate.getTime()) {
            streak++;
        } else if (streak === 0 && checkinDate.getTime() === today.getTime() - 86400000) {
            // Allow starting streak from yesterday
            streak = 1;
        } else {
            break;
        }
    }

    // Calculate weekly rate (last 7 days)
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weeklyCheckins = (habit.checkins || []).filter(c => {
        const date = new Date(c.checkin_date);
        return date >= weekAgo && date <= today;
    }).length;

    const weeklyRate = Math.round((weeklyCheckins / 7) * 100);

    return {
        streak,
        weeklyRate,
        totalCheckins: habit.checkins?.length || 0,
    };
}
