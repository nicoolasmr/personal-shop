import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useTenant } from '@/hooks/useTenant';
import { toggleHabitCheckin } from '@/services/habits';
import {
    isOnline,
    getPendingCheckins,
    markCheckinSynced,
    clearSyncedCheckins,
    registerOnlineHandler,
    registerOfflineHandler,
    saveOfflineCheckin,
} from '@/services/offlineSync';

export function useOfflineSync() {
    const [online, setOnline] = useState(isOnline());
    const [syncing, setSyncing] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const { user } = useAuth();
    const { org } = useTenant();

    const updatePendingCount = useCallback(() => {
        setPendingCount(getPendingCheckins().length);
    }, []);

    const syncPendingCheckins = useCallback(async () => {
        if (!isOnline() || syncing || !org?.id || !user?.id) return;

        const pending = getPendingCheckins();
        if (pending.length === 0) return;

        setSyncing(true);
        let syncedCount = 0;
        let errorCount = 0;

        for (const checkin of pending) {
            try {
                await toggleHabitCheckin(org.id, user.id, checkin.habitId, checkin.date);
                markCheckinSynced(checkin.id);
                syncedCount++;
            } catch (error) {
                console.error('Failed to sync checkin:', checkin.id, error);
                errorCount++;
            }
        }

        clearSyncedCheckins();
        updatePendingCount();
        setSyncing(false);

        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['habits'] });
        queryClient.invalidateQueries({ queryKey: ['todayHabitsSummary'] });

        if (syncedCount > 0) {
            toast({
                title: 'Check-ins sincronizados',
                description: `${syncedCount} check-in(s) sincronizado(s) com sucesso.`,
            });
        }

        if (errorCount > 0) {
            toast({
                title: 'Erro na sincronização',
                description: `${errorCount} check-in(s) falharam. Tentaremos novamente.`,
                variant: 'destructive',
            });
        }
    }, [syncing, org?.id, user?.id, queryClient, toast, updatePendingCount]);

    const saveCheckinOffline = useCallback((habitId: string, date: string, completed: boolean) => {
        saveOfflineCheckin(habitId, date, completed);
        updatePendingCount();

        toast({
            title: 'Salvo offline',
            description: 'Check-in será sincronizado quando você voltar online.',
        });
    }, [toast, updatePendingCount]);

    useEffect(() => {
        updatePendingCount();

        const unsubOnline = registerOnlineHandler(() => {
            setOnline(true);
            toast({
                title: 'Conexão restaurada',
                description: 'Sincronizando dados pendentes...',
            });
            syncPendingCheckins();
        });

        const unsubOffline = registerOfflineHandler(() => {
            setOnline(false);
            toast({
                title: 'Sem conexão',
                description: 'Seus check-ins serão salvos localmente.',
                variant: 'destructive',
            });
        });

        // Sync on mount if online
        if (isOnline()) {
            syncPendingCheckins();
        }

        return () => {
            unsubOnline();
            unsubOffline();
        };
    }, [syncPendingCheckins, toast, updatePendingCount]);

    return {
        online,
        syncing,
        pendingCount,
        saveCheckinOffline,
        syncPendingCheckins,
    };
}
