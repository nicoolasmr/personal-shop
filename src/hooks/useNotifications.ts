import { useState, useEffect, useCallback } from 'react';

interface NotificationState {
    permission: NotificationPermission | 'unsupported';
    enabled: boolean;
}

export function useNotifications() {
    const [state, setState] = useState<NotificationState>({
        permission: 'default',
        enabled: false,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if notifications are supported
        if (!('Notification' in window)) {
            setState({ permission: 'unsupported', enabled: false });
            setLoading(false);
            return;
        }

        // Get current permission and saved preference
        const savedEnabled = localStorage.getItem('notifications_enabled') === 'true';
        setState({
            permission: Notification.permission,
            enabled: Notification.permission === 'granted' && savedEnabled,
        });
        setLoading(false);
    }, []);

    const requestPermission = useCallback(async (): Promise<boolean> => {
        if (!('Notification' in window)) {
            return false;
        }

        try {
            const permission = await Notification.requestPermission();
            const granted = permission === 'granted';

            if (granted) {
                localStorage.setItem('notifications_enabled', 'true');
            }

            setState({
                permission,
                enabled: granted,
            });

            return granted;
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return false;
        }
    }, []);

    const setEnabled = useCallback((enabled: boolean) => {
        localStorage.setItem('notifications_enabled', enabled.toString());
        setState(prev => ({ ...prev, enabled }));
    }, []);

    const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
        if (state.permission !== 'granted' || !state.enabled) {
            return null;
        }

        try {
            const notification = new Notification(title, {
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                ...options,
            });

            return notification;
        } catch (error) {
            console.error('Error sending notification:', error);
            return null;
        }
    }, [state.permission, state.enabled]);

    return {
        permission: state.permission,
        enabled: state.enabled,
        loading,
        isSupported: state.permission !== 'unsupported',
        requestPermission,
        setEnabled,
        sendNotification,
    };
}

export { usePushNotifications } from './usePushNotifications';
