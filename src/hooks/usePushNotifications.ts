import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useTenant } from './useTenant';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

// VAPID public key - needs to match the one in secrets
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

interface PushSubscriptionState {
    isSupported: boolean;
    isSubscribed: boolean;
    permission: NotificationPermission | 'unsupported';
    loading: boolean;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function usePushNotifications() {
    const { org } = useTenant();
    const { user } = useAuth();

    const [state, setState] = useState<PushSubscriptionState>({
        isSupported: false,
        isSubscribed: false,
        permission: 'default',
        loading: true,
    });

    // Check if push is supported and current subscription status
    useEffect(() => {
        const checkPushSupport = async () => {
            // Check browser support
            if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
                setState({
                    isSupported: false,
                    isSubscribed: false,
                    permission: 'unsupported',
                    loading: false,
                });
                return;
            }

            // Get current permission
            const permission = Notification.permission;

            // Check if already subscribed
            try {
                const registration = await navigator.serviceWorker.ready;
                const subscription = await registration.pushManager.getSubscription();

                setState({
                    isSupported: true,
                    isSubscribed: !!subscription,
                    permission,
                    loading: false,
                });
            } catch (error) {
                console.error('Error checking push subscription:', error);
                setState({
                    isSupported: true,
                    isSubscribed: false,
                    permission,
                    loading: false,
                });
            }
        };

        checkPushSupport();
    }, []);

    // Subscribe to push notifications
    const subscribe = useCallback(async (): Promise<boolean> => {
        if (!state.isSupported || !org?.id || !user?.id) {
            console.log('Push not supported or user not authenticated');
            return false;
        }

        if (!VAPID_PUBLIC_KEY) {
            console.error('VAPID public key not configured');
            toast({
                title: 'Erro de configuração',
                description: 'Chave VAPID não configurada',
                variant: 'destructive',
            });
            return false;
        }

        setState(prev => ({ ...prev, loading: true }));

        try {
            // Request permission if not granted
            if (Notification.permission === 'default') {
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') {
                    setState(prev => ({ ...prev, permission, loading: false }));
                    return false;
                }
            } else if (Notification.permission === 'denied') {
                toast({
                    title: 'Permissão negada',
                    description: 'Ative as notificações nas configurações do navegador',
                    variant: 'destructive',
                });
                setState(prev => ({ ...prev, loading: false }));
                return false;
            }

            // Get service worker registration
            const registration = await navigator.serviceWorker.ready;

            // Subscribe to push
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });

            console.log('Push subscription created:', subscription.endpoint.substring(0, 50));

            // Extract keys from subscription
            const subscriptionJson = subscription.toJSON();
            const p256dh = subscriptionJson.keys?.p256dh || '';
            const auth = subscriptionJson.keys?.auth || '';

            // Save subscription to database
            const { error } = await supabase.from('push_subscriptions').upsert({
                org_id: org.id,
                user_id: user.id,
                endpoint: subscription.endpoint,
                p256dh,
                auth,
            }, {
                onConflict: 'endpoint',
            });

            if (error) {
                console.error('Error saving subscription:', error);
                throw error;
            }

            setState(prev => ({
                ...prev,
                isSubscribed: true,
                permission: 'granted',
                loading: false,
            }));

            toast({
                title: 'Notificações ativadas',
                description: 'Você receberá alertas mesmo com o app fechado',
            });

            return true;
        } catch (error) {
            console.error('Error subscribing to push:', error);
            setState(prev => ({ ...prev, loading: false }));

            toast({
                title: 'Erro ao ativar notificações',
                description: 'Tente novamente mais tarde',
                variant: 'destructive',
            });

            return false;
        }
    }, [state.isSupported, org?.id, user?.id]);

    // Unsubscribe from push notifications
    const unsubscribe = useCallback(async (): Promise<boolean> => {
        if (!state.isSupported || !user?.id) {
            return false;
        }

        setState(prev => ({ ...prev, loading: true }));

        try {
            // Get current subscription
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                // Unsubscribe from browser
                await subscription.unsubscribe();

                // Remove from database
                await supabase
                    .from('push_subscriptions')
                    .delete()
                    .eq('endpoint', subscription.endpoint);
            }

            setState(prev => ({
                ...prev,
                isSubscribed: false,
                loading: false,
            }));

            toast({
                title: 'Notificações desativadas',
                description: 'Você não receberá mais alertas push',
            });

            return true;
        } catch (error) {
            console.error('Error unsubscribing from push:', error);
            setState(prev => ({ ...prev, loading: false }));
            return false;
        }
    }, [state.isSupported, user?.id]);

    // Toggle subscription
    const toggle = useCallback(async (): Promise<boolean> => {
        if (state.isSubscribed) {
            return unsubscribe();
        } else {
            return subscribe();
        }
    }, [state.isSubscribed, subscribe, unsubscribe]);

    // Send a test notification
    const sendTest = useCallback(async () => {
        if (!org?.id || !user?.id) return;

        try {
            const { error } = await supabase.functions.invoke('send-push', {
                body: {
                    user_id: user.id,
                    org_id: org.id,
                    title: 'VIDA360 - Teste',
                    message: 'Push notification funcionando! 🎉',
                    url: '/app/home',
                },
            });

            if (error) throw error;

            toast({
                title: 'Teste enviado',
                description: 'Você deve receber uma notificação em breve',
            });
        } catch (error) {
            console.error('Error sending test push:', error);
            toast({
                title: 'Erro no teste',
                description: 'Não foi possível enviar a notificação',
                variant: 'destructive',
            });
        }
    }, [org?.id, user?.id]);

    return {
        ...state,
        subscribe,
        unsubscribe,
        toggle,
        sendTest,
    };
}
