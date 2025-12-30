// =============================================================================
// useHaptics - Hook para feedback háptico com preferências do usuário
// =============================================================================

import { useCallback } from 'react';
import { haptics, isHapticSupported } from '@/lib/haptics';

const HAPTICS_ENABLED_KEY = 'vida360_haptics_enabled';

/**
 * Get haptics enabled preference from localStorage
 */
export function getHapticsEnabled(): boolean {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem(HAPTICS_ENABLED_KEY);
    // Default to true if not set
    return stored === null ? true : stored === 'true';
}

/**
 * Set haptics enabled preference in localStorage
 */
export function setHapticsEnabled(enabled: boolean): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(HAPTICS_ENABLED_KEY, String(enabled));
}

/**
 * Hook for haptic feedback that respects user preferences
 */
export function useHaptics() {
    const isSupported = isHapticSupported();

    const trigger = useCallback((pattern: Parameters<typeof haptics.custom>[0] | 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection') => {
        if (!getHapticsEnabled()) return false;

        if (typeof pattern === 'string') {
            switch (pattern) {
                case 'light': return haptics.light();
                case 'medium': return haptics.medium();
                case 'heavy': return haptics.heavy();
                case 'success': return haptics.success();
                case 'warning': return haptics.warning();
                case 'error': return haptics.error();
                case 'selection': return haptics.selection();
                default: return false;
            }
        }

        return haptics.custom(pattern);
    }, []);

    const light = useCallback(() => {
        if (!getHapticsEnabled()) return false;
        return haptics.light();
    }, []);

    const medium = useCallback(() => {
        if (!getHapticsEnabled()) return false;
        return haptics.medium();
    }, []);

    const heavy = useCallback(() => {
        if (!getHapticsEnabled()) return false;
        return haptics.heavy();
    }, []);

    const success = useCallback(() => {
        if (!getHapticsEnabled()) return false;
        return haptics.success();
    }, []);

    const warning = useCallback(() => {
        if (!getHapticsEnabled()) return false;
        return haptics.warning();
    }, []);

    const error = useCallback(() => {
        if (!getHapticsEnabled()) return false;
        return haptics.error();
    }, []);

    const selection = useCallback(() => {
        if (!getHapticsEnabled()) return false;
        return haptics.selection();
    }, []);

    return {
        isSupported,
        trigger,
        light,
        medium,
        heavy,
        success,
        warning,
        error,
        selection,
    };
}
