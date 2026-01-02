import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { useTenant } from './useTenant';
import type { AppRole } from '@/types/database';

interface RoleResult {
    role: AppRole;
}

export function useUserRole() {
    const { user } = useAuth();
    const { org } = useTenant();

    return useQuery({
        queryKey: ['user-role', user?.id, org?.id],
        queryFn: async (): Promise<AppRole | null> => {
            if (!user?.id || !org?.id) return null;

            // First try memberships table (org-specific role)
            const { data: membership, error: membershipError } = await supabase
                .from('memberships')
                .select('role')
                .eq('user_id', user.id)
                .eq('org_id', org.id)
                .maybeSingle();

            if (!membershipError && membership) {
                return (membership as RoleResult).role;
            }

            // Fallback to user_roles table (global role)
            const { data: userRole, error: userRoleError } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', user.id)
                .maybeSingle();

            if (!userRoleError && userRole) {
                return (userRole as RoleResult).role;
            }

            return 'member';
        },
        enabled: !!user?.id && !!org?.id,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

export function useIsAdmin() {
    const { data: role } = useUserRole();
    return role === 'admin' || role === 'owner';
}
