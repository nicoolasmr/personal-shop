
export const useNotifications = () => {
    // Shim
    return { permission: 'granted', enabled: true, requestPermission: async () => { }, sendNotification: () => console.log('Notification sent') };
}

export const usePushNotifications = () => {
    // Shim
    return { isSubscribed: false, toggle: async () => { }, sendTest: async () => { } };
}
