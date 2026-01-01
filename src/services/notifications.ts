
export async function requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
        console.log('This browser does not support desktop notification');
        return 'denied';
    }
    const permission = await Notification.requestPermission();
    return permission;
}

export function sendLocalNotification(title: string, options?: NotificationOptions) {
    if (Notification.permission === 'granted') {
        new Notification(title, options);
    }
}

import { Goal } from '@/types/goals';
import { Habit } from '@/types/habits';
import { isSameDay } from 'date-fns';

export function checkGoalDeadlines(goals: Goal[]) {
    const today = new Date();
    goals.forEach(goal => {
        if (goal.due_date && goal.status === 'active') {
            const dueDate = new Date(goal.due_date);
            const diffTime = dueDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                sendLocalNotification(`Meta expirando: ${goal.title}`, {
                    body: 'Sua meta vence amanhã! Vamos lá!',
                    icon: '/icon-192x192.png'
                });
            } else if (diffDays === 0) {
                sendLocalNotification(`Meta vence hoje: ${goal.title}`, {
                    body: 'Último dia para atingir sua meta!',
                    icon: '/icon-192x192.png'
                });
            }
        }
    });
}

export function checkHabitReminders(habits: Habit[]) {
    // Determine time of day (morning, afternoon, evening)
    const hour = new Date().getHours();

    // Simple logic: if it's morning (8-10), remind morning habits
    // Real implementation would need specific reminder times on habits

    // For now, let's just remind random pending habit if it's not done purely as a nudge
    // This needs state to not spam.
}
