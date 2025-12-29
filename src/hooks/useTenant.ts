
// Shim to emulate useTenant behavior required by the hook using useAuth provided profile
import { useAuth } from '@/contexts/AuthContext';

export const useTenant = () => {
    const { user } = useAuth();
    // Assuming for now generic profile/org structure matching the hook expectation
    // In a real scenario we'd query the profile table or have it in AuthContext
    return {
        profile: { org_id: 'default-org-id', id: user?.id },
        org: { id: 'default-org-id', name: 'Personal Workspace' },
        loading: false
    };
};
