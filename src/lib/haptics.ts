// =============================================================================
// Haptic Feedback Utilities
// =============================================================================

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

const PATTERNS: Record<HapticPattern, number | number[]> = {
    light: 10,
    medium: 25,
    heavy: 50,
    success: [10, 50, 30, 50, 10],
    warning: [30, 100, 30],
    error: [50, 100, 50, 100, 50],
    selection: 5,
};

export function isHapticSupported(): boolean {
    return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

export function triggerHaptic(pattern: HapticPattern = 'medium'): boolean {
    if (!isHapticSupported()) return false;
    try {
        return navigator.vibrate(PATTERNS[pattern]);
    } catch (error) {
        console.warn('Haptic feedback failed:', error);
        return false;
    }
}

export function triggerCustomHaptic(pattern: number | number[]): boolean {
    if (!isHapticSupported()) return false;
    try {
        return navigator.vibrate(pattern);
    } catch (error) {
        console.warn('Custom haptic feedback failed:', error);
        return false;
    }
}

export function stopHaptic(): void {
    if (isHapticSupported()) navigator.vibrate(0);
}

export const haptics = {
    light: () => triggerHaptic('light'),
    medium: () => triggerHaptic('medium'),
    heavy: () => triggerHaptic('heavy'),
    success: () => triggerHaptic('success'),
    warning: () => triggerHaptic('warning'),
    error: () => triggerHaptic('error'),
    selection: () => triggerHaptic('selection'),
    custom: triggerCustomHaptic,
    stop: stopHaptic,
    isSupported: isHapticSupported,
};
