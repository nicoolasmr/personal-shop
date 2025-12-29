
import { useState } from 'react';

// Simple hook to manage haptics enabled state (could be persisted in localStorage)
export function getHapticsEnabled() {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('haptics-enabled') !== 'false';
}

export function useHaptics() {
    const [enabled, setEnabled] = useState(getHapticsEnabled());

    const toggle = () => {
        const newState = !enabled;
        setEnabled(newState);
        localStorage.setItem('haptics-enabled', String(newState));
    };

    return { enabled, toggle };
}
