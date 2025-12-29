// =============================================================================
// PWA / Cache Cleanup Utilities
// =============================================================================

export async function clearPwaCaches(): Promise<void> {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        try {
            const regs = await navigator.serviceWorker.getRegistrations();
            await Promise.all(regs.map((r) => r.unregister()));
        } catch { /* ignore */ }
    }

    if (typeof window !== 'undefined' && 'caches' in window) {
        try {
            const keys = await caches.keys();
            await Promise.all(keys.map((k) => caches.delete(k)));
        } catch { /* ignore */ }
    }
}
