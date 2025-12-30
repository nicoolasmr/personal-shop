// =============================================================================
// Haptics Library - Cross-platform haptic feedback
// =============================================================================

/**
 * Check if haptic feedback is supported
 */
export function isHapticSupported(): boolean {
    return 'vibrate' in navigator;
}

/**
 * Trigger a light haptic feedback
 */
export function light(): boolean {
    if (!isHapticSupported()) return false;
    return navigator.vibrate(10);
}

/**
 * Trigger a medium haptic feedback
 */
export function medium(): boolean {
    if (!isHapticSupported()) return false;
    return navigator.vibrate(20);
}

/**
 * Trigger a heavy haptic feedback
 */
export function heavy(): boolean {
    if (!isHapticSupported()) return false;
    return navigator.vibrate(30);
}

/**
 * Trigger a success haptic pattern
 */
export function success(): boolean {
    if (!isHapticSupported()) return false;
    return navigator.vibrate([10, 50, 10]);
}

/**
 * Trigger a warning haptic pattern
 */
export function warning(): boolean {
    if (!isHapticSupported()) return false;
    return navigator.vibrate([20, 100, 20]);
}

/**
 * Trigger an error haptic pattern
 */
export function error(): boolean {
    if (!isHapticSupported()) return false;
    return navigator.vibrate([30, 100, 30, 100, 30]);
}

/**
 * Trigger a selection haptic feedback
 */
export function selection(): boolean {
    if (!isHapticSupported()) return false;
    return navigator.vibrate(5);
}

/**
 * Trigger a custom haptic pattern
 */
export function custom(pattern: number | number[]): boolean {
    if (!isHapticSupported()) return false;
    return navigator.vibrate(pattern);
}

/**
 * Haptics object with all methods
 */
export const haptics = {
    isSupported: isHapticSupported,
    light,
    medium,
    heavy,
    success,
    warning,
    error,
    selection,
    custom,
};

export default haptics;
