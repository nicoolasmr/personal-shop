import { useEffect, useRef, useCallback } from 'react';
import { useNotifications } from './useNotifications';
import type { HabitWithCheckins } from '@/types/habits';

interface UseHabitRemindersOptions {
    habits: HabitWithCheckins[];
    enabled?: boolean;
}

export function useHabitReminders({ habits, enabled = true }: UseHabitRemindersOptions) {
    const { enabled: notificationsEnabled, sendNotification } = useNotifications();
    const sentRemindersRef = useRef<Set<string>>(new Set());
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const checkReminders = useCallback(() => {
        if (!notificationsEnabled || !enabled) return;

        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const today = now.toISOString().split('T')[0];

        habits.forEach((habit) => {
            if (!habit.reminder_time || !habit.active) return;

            // Normalize reminder time to HH:MM format
            const reminderTime = habit.reminder_time.slice(0, 5);

            // Check if it's time to remind and we haven't sent this reminder today
            const reminderId = `${habit.id}-${today}`;

            if (reminderTime === currentTime && !sentRemindersRef.current.has(reminderId)) {
                // Check if habit is already completed today
                const completedToday = habit.checkins.some(
                    (c) => c.checkin_date === today && c.completed
                );

                if (!completedToday) {
                    sendNotification(`Lembrete: ${habit.name}`, {
                        body: habit.description || 'Hora de completar seu hábito!',
                        tag: `habit-${habit.id}`,
                        icon: '/favicon.ico',
                    });

                    sentRemindersRef.current.add(reminderId);
                }
            }
        });

        // Clean old reminders (from previous days)
        sentRemindersRef.current.forEach((id) => {
            if (!id.includes(today)) {
                sentRemindersRef.current.delete(id);
            }
        });
    }, [habits, notificationsEnabled, enabled, sendNotification]);

    useEffect(() => {
        if (!notificationsEnabled || !enabled) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        // Check immediately
        checkReminders();

        // Check every minute
        intervalRef.current = setInterval(checkReminders, 60000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [checkReminders, notificationsEnabled, enabled]);

    return {
        isActive: notificationsEnabled && enabled,
    };
}
