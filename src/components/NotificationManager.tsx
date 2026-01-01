import { useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { useGoals } from '@/hooks/useGoals';
import { useHabits } from '@/hooks/useHabits';

export function NotificationManager() {
    const { enabled, sendNotification } = useNotifications();

    const { data: goals } = useGoals();
    const { data: habits } = useHabits();

    // Check Goals Deadlines
    useEffect(() => {
        if (!enabled || !goals) return;

        const checkGoals = () => {
            const today = new Date();
            goals.forEach((goal) => {
                if (goal.status !== 'active' || !goal.due_date) return;

                const dueDate = new Date(goal.due_date);
                // Reset time to compare dates properly
                const todayMidnight = new Date(today); todayMidnight.setHours(0, 0, 0, 0);
                const dueMidnight = new Date(dueDate); dueMidnight.setHours(0, 0, 0, 0);

                const diffTime = dueMidnight.getTime() - todayMidnight.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                let msg = '';
                if (diffDays === 1) msg = `Sua meta "${goal.title}" vence amanhã!`;
                else if (diffDays === 0) msg = `Sua meta "${goal.title}" vence hoje!`;
                else if (diffDays < 0) return; // Overdue already

                if (msg) {
                    // Use sessionStorage to notify once per session per deadline status
                    const key = `notified_goal_${goal.id}_${diffDays}`;
                    if (!sessionStorage.getItem(key)) {
                        sendNotification('Lembrete de Meta', { body: msg, icon: '/favicon.ico' });
                        sessionStorage.setItem(key, 'true');
                    }
                }
            });
        };

        checkGoals();
    }, [goals, enabled, sendNotification]);

    // Check Habit Reminders
    useEffect(() => {
        if (!enabled || !habits) return;

        const checkHabits = () => {
            // Check if there are pending habits for today
            const todayStr = new Date().toISOString().split('T')[0];
            const pending = habits.filter(h => h.active && !h.checkins.some(c => c.checkin_date === todayStr && c.completed));

            if (pending.length > 0) {
                const key = `notified_habits_${todayStr}`;
                const hour = new Date().getHours();

                // Notify if it's late (>= 18:00) and haven't notified today
                if (hour >= 18 && !localStorage.getItem(key)) {
                    sendNotification('Hábitos Pendentes', { body: `Você tem ${pending.length} hábitos para completar hoje! Mantenha o foco!`, icon: '/favicon.ico' });
                    localStorage.setItem(key, 'true');
                }
            }
        };

        checkHabits();
    }, [habits, enabled, sendNotification]);

    return null;
}
