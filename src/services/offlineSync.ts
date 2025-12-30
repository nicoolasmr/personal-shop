// =============================================================================
// Offline Sync Service - LocalStorage-based offline synchronization
// =============================================================================

interface OfflineCheckin {
    id: string;
    habitId: string;
    date: string;
    completed: boolean;
    timestamp: number;
    synced: boolean;
}

const STORAGE_KEY = 'vida360_offline_checkins';

/**
 * Check if online
 */
export function isOnline(): boolean {
    return navigator.onLine;
}

/**
 * Get all pending checkins from localStorage
 */
export function getPendingCheckins(): OfflineCheckin[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return [];
        const checkins: OfflineCheckin[] = JSON.parse(stored);
        return checkins.filter(c => !c.synced);
    } catch (error) {
        console.error('Error reading offline checkins:', error);
        return [];
    }
}

/**
 * Save a checkin offline
 */
export function saveOfflineCheckin(habitId: string, date: string, completed: boolean): void {
    try {
        const checkins = getPendingCheckins();
        const newCheckin: OfflineCheckin = {
            id: `offline_${Date.now()}_${Math.random()}`,
            habitId,
            date,
            completed,
            timestamp: Date.now(),
            synced: false,
        };
        checkins.push(newCheckin);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(checkins));
    } catch (error) {
        console.error('Error saving offline checkin:', error);
    }
}

/**
 * Mark a checkin as synced
 */
export function markCheckinSynced(checkinId: string): void {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return;

        const checkins: OfflineCheckin[] = JSON.parse(stored);
        const updated = checkins.map(c =>
            c.id === checkinId ? { ...c, synced: true } : c
        );
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
        console.error('Error marking checkin as synced:', error);
    }
}

/**
 * Clear all synced checkins
 */
export function clearSyncedCheckins(): void {
    try {
        const checkins = getPendingCheckins();
        const pending = checkins.filter(c => !c.synced);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
    } catch (error) {
        console.error('Error clearing synced checkins:', error);
    }
}

/**
 * Register online event handler
 */
export function registerOnlineHandler(callback: () => void): () => void {
    window.addEventListener('online', callback);
    return () => window.removeEventListener('online', callback);
}

/**
 * Register offline event handler
 */
export function registerOfflineHandler(callback: () => void): () => void {
    window.addEventListener('offline', callback);
    return () => window.removeEventListener('offline', callback);
}

/**
 * Clear all offline data (use with caution)
 */
export function clearAllOfflineData(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error('Error clearing offline data:', error);
    }
}
