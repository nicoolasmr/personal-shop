
import { useEffect, useState } from 'react';
import { supabase } from './supabase';

// Local defaults as fallback
const LOCAL_DEFAULTS: Record<string, boolean> = {
    admin_console_enabled: false,
    diagnostics_enabled: false,
    maintenance_mode: false,
    new_dashboard_v2: false,
    signup_enabled: true
};

// In-memory cache
let flagsCache: Record<string, boolean> = { ...LOCAL_DEFAULTS };

/**
 * Fetch latest flags from DB and update cache.
 * Can be called at app startup or periodically.
 */
export const syncFeatureFlags = async () => {
    try {
        const { data, error } = await supabase
            .from('feature_flags')
            .select('key, is_enabled');

        if (error) {
            console.warn('Failed to sync feature flags', error);
            return;
        }

        if (data) {
            data.forEach(f => {
                flagsCache[f.key] = f.is_enabled;
            });
            console.debug('Feature Flags Synced:', flagsCache);
        }
    } catch (e) {
        console.warn('Error syncing flags:', e);
    }
};

/**
 * Check if a feature is enabled.
 * Uses cached value for synch performance, but relies on syncFeatureFlags() being called.
 */
export const isFeatureEnabled = (key: string): boolean => {
    return flagsCache[key] ?? false;
};

// React Hook for reactive usage
export const useFeatureFlag = (key: string) => {
    const [enabled, setEnabled] = useState(isFeatureEnabled(key));

    useEffect(() => {
        // Initial set
        setEnabled(isFeatureEnabled(key));

        // Subscribe to Realtime changes!
        const channel = supabase
            .channel('public:feature_flags')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'feature_flags', filter: `key=eq.${key}` },
                (payload) => {
                    const newVal = payload.new.is_enabled;
                    flagsCache[key] = newVal;
                    setEnabled(newVal);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [key]);

    return enabled;
};
