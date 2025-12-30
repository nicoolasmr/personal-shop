// =============================================================================
// useGoalAlerts - Alertas para metas próximas do prazo ou atrasadas
// =============================================================================

import { useEffect, useMemo, useCallback, useRef } from 'react';
import { useGoals } from './queries/useGoals';
import { useNotifications } from './useNotifications';
import { toast } from '@/hooks/use-toast';
import type { GoalWithProgress } from '@/types/goals';

interface GoalAlert {
    goal: GoalWithProgress;
    type: 'overdue' | 'due_soon' | 'due_today';
    daysRemaining: number;
}

export function useGoalAlerts(options?: { enableBrowserNotifications?: boolean }) {
    const { data: goals } = useGoals('active');
    const { sendNotification, enabled: notificationsEnabled, requestPermission, permission } = useNotifications();
    const pushSentRef = useRef(false);

    // Calculate alerts for goals
    const alerts = useMemo((): GoalAlert[] => {
        if (!goals) return [];

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return goals
            .filter((goal) => goal.due_date && goal.status === 'active')
            .map((goal) => {
                const dueDate = new Date(goal.due_date!);
                dueDate.setHours(0, 0, 0, 0);

                const diffTime = dueDate.getTime() - today.getTime();
                const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                let type: GoalAlert['type'] | null = null;

                if (daysRemaining < 0) {
                    type = 'overdue';
                } else if (daysRemaining === 0) {
                    type = 'due_today';
                } else if (daysRemaining <= 3) {
                    type = 'due_soon';
                }

                if (type) {
                    return { goal, type, daysRemaining };
                }
                return null;
            })
            .filter((alert): alert is GoalAlert => alert !== null)
            .sort((a, b) => a.daysRemaining - b.daysRemaining);
    }, [goals]);

    // Categorize alerts
    const overdueAlerts = useMemo(
        () => alerts.filter((a) => a.type === 'overdue'),
        [alerts]
    );

    const dueTodayAlerts = useMemo(
        () => alerts.filter((a) => a.type === 'due_today'),
        [alerts]
    );

    const dueSoonAlerts = useMemo(
        () => alerts.filter((a) => a.type === 'due_soon'),
        [alerts]
    );

    // Show toast notifications on mount (once per session)
    useEffect(() => {
        const sessionKey = 'goal_alerts_shown_' + new Date().toDateString();
        const alreadyShown = sessionStorage.getItem(sessionKey);

        if (alreadyShown || alerts.length === 0) return;

        // Slight delay to not interfere with page load
        const timeout = setTimeout(() => {
            if (overdueAlerts.length > 0) {
                toast({
                    title: `⚠️ ${overdueAlerts.length} meta${overdueAlerts.length > 1 ? 's' : ''} atrasada${overdueAlerts.length > 1 ? 's' : ''}`,
                    description: overdueAlerts.map((a) => a.goal.title).slice(0, 3).join(', '),
                    variant: 'destructive',
                });
            }

            if (dueTodayAlerts.length > 0) {
                toast({
                    title: `📅 ${dueTodayAlerts.length} meta${dueTodayAlerts.length > 1 ? 's' : ''} vence${dueTodayAlerts.length > 1 ? 'm' : ''} hoje`,
                    description: dueTodayAlerts.map((a) => a.goal.title).slice(0, 3).join(', '),
                });
            }

            if (dueSoonAlerts.length > 0 && overdueAlerts.length === 0 && dueTodayAlerts.length === 0) {
                toast({
                    title: `🔔 ${dueSoonAlerts.length} meta${dueSoonAlerts.length > 1 ? 's' : ''} próxima${dueSoonAlerts.length > 1 ? 's' : ''} do prazo`,
                    description: dueSoonAlerts.map((a) => `${a.goal.title} (${a.daysRemaining} dias)`).slice(0, 3).join(', '),
                });
            }

            sessionStorage.setItem(sessionKey, 'true');
        }, 1500);

        return () => clearTimeout(timeout);
    }, [alerts, overdueAlerts, dueTodayAlerts, dueSoonAlerts]);

    // Auto-send browser notifications (once per day, when app is open)
    useEffect(() => {
        if (!options?.enableBrowserNotifications) return;
        if (!notificationsEnabled || pushSentRef.current) return;
        if (alerts.length === 0) return;

        const pushKey = 'goal_push_sent_' + new Date().toDateString();
        const alreadySent = localStorage.getItem(pushKey);
        if (alreadySent) return;

        // Send push notification
        const timeout = setTimeout(() => {
            if (overdueAlerts.length > 0) {
                sendNotification('⚠️ Metas Atrasadas', {
                    body: `Você tem ${overdueAlerts.length} meta${overdueAlerts.length > 1 ? 's' : ''} atrasada${overdueAlerts.length > 1 ? 's' : ''}. Clique para ver.`,
                    tag: 'goal-overdue',
                });
            } else if (dueTodayAlerts.length > 0) {
                sendNotification('📅 Metas Vencem Hoje', {
                    body: dueTodayAlerts.map((a) => a.goal.title).slice(0, 2).join(', '),
                    tag: 'goal-due-today',
                });
            } else if (dueSoonAlerts.length > 0) {
                sendNotification('🔔 Prazo Próximo', {
                    body: `${dueSoonAlerts.length} meta${dueSoonAlerts.length > 1 ? 's' : ''} vence${dueSoonAlerts.length > 1 ? 'm' : ''} em breve.`,
                    tag: 'goal-due-soon',
                });
            }

            localStorage.setItem(pushKey, 'true');
            pushSentRef.current = true;
        }, 3000);

        return () => clearTimeout(timeout);
    }, [options?.enableBrowserNotifications, notificationsEnabled, alerts, overdueAlerts, dueTodayAlerts, dueSoonAlerts, sendNotification]);

    // Manual browser notification function
    const sendBrowserNotifications = useCallback(async () => {
        // Request permission if needed
        if (permission === 'default') {
            const granted = await requestPermission();
            if (!granted) return;
        }

        if (overdueAlerts.length > 0) {
            sendNotification('⚠️ Metas Atrasadas', {
                body: `Você tem ${overdueAlerts.length} meta${overdueAlerts.length > 1 ? 's' : ''} atrasada${overdueAlerts.length > 1 ? 's' : ''}`,
                tag: 'goal-overdue',
            });
        }

        if (dueTodayAlerts.length > 0) {
            sendNotification('📅 Metas Vencem Hoje', {
                body: dueTodayAlerts.map((a) => a.goal.title).join(', '),
                tag: 'goal-due-today',
            });
        }

        if (dueSoonAlerts.length > 0) {
            sendNotification('🔔 Prazo Próximo', {
                body: `${dueSoonAlerts.length} meta${dueSoonAlerts.length > 1 ? 's' : ''} vence${dueSoonAlerts.length > 1 ? 'm' : ''} nos próximos 3 dias`,
                tag: 'goal-due-soon',
            });
        }
    }, [permission, requestPermission, sendNotification, overdueAlerts, dueTodayAlerts, dueSoonAlerts]);

    return {
        alerts,
        overdueAlerts,
        dueTodayAlerts,
        dueSoonAlerts,
        hasAlerts: alerts.length > 0,
        totalOverdue: overdueAlerts.length,
        totalDueToday: dueTodayAlerts.length,
        totalDueSoon: dueSoonAlerts.length,
        totalAlerts: alerts.length,
        sendBrowserNotifications,
        notificationsEnabled,
        requestPermission,
    };
}

// =============================================================================
// HELPER: Get alert badge variant
// =============================================================================

export function getAlertBadgeVariant(type: GoalAlert['type']): 'destructive' | 'default' | 'secondary' {
    switch (type) {
        case 'overdue':
            return 'destructive';
        case 'due_today':
            return 'default';
        case 'due_soon':
            return 'secondary';
    }
}

// =============================================================================
// HELPER: Get alert message
// =============================================================================

export function getAlertMessage(alert: GoalAlert): string {
    switch (alert.type) {
        case 'overdue':
            return `Atrasada há ${Math.abs(alert.daysRemaining)} dia${Math.abs(alert.daysRemaining) > 1 ? 's' : ''}`;
        case 'due_today':
            return 'Vence hoje';
        case 'due_soon':
            return `Vence em ${alert.daysRemaining} dia${alert.daysRemaining > 1 ? 's' : ''}`;
    }
}
