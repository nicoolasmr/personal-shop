export const clearPwaCaches = async () => {
    if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(key => caches.delete(key)));
    }
    console.log('PWA Caches cleared');
};
