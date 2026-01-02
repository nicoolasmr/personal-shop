
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { isFeatureEnabled } from '@/lib/flags';
import { useQuery } from '@tanstack/react-query';
import { supabase, supabaseConfigured } from '@/lib/supabase';

// Helper to check role - this will be replaced by a proper hook later
// For now we check "profile.role" or "org.role" if available
// Assumption: 'app_role' type exists or will exist in DB types.
// For Sprint 0, we just assume "if user is authenticated" AND "flag is ON".
// REAL RBAC will be fully enforced in Sprint 1 via Database.

const OpsGuard = () => {
    const { user, loading, configured } = useAuth();
    const enabled = isFeatureEnabled('admin_console_enabled');

    // Fetch user role briefly to block non-staff if possible, even in Sprint 0?
    // Sprint 0 says: "Verifica role do usuário (team/admin). Se user comum => negar."
    // We need to fetch the role.

    const { data: role, isLoading: roleLoading } = useQuery({
        queryKey: ['ops-role-check', user?.id],
        queryFn: async () => {
            if (!user) return null;
            // Trying to get role from profiles or metadata
            // Assuming 'role' field exists on profiles or we use app_metadata
            // For Sprint 0 foundation without DB migration changes:
            // We check app_metadata first as it is standard for RBAC

            // Check App Metadata first (fastest, no DB roundtrip if in session)
            const appRole = user.app_metadata?.role;
            if (appRole === 'admin' || appRole === 'team') return appRole;

            // Fallback: Check user_roles table
            const { data } = await supabase.from('user_roles').select('role').eq('user_id', user.id).maybeSingle();
            return data?.role as string | null;
        },
        enabled: !!user && enabled && configured && supabaseConfigured, // Only check if user is allowed and flag is on
    });


    if (!enabled) {
        // If flag is off, return 404 or redirect content
        // Sprint 0 requirement: "NotFound/403 amigável"
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
                <h1 className="text-4xl font-bold mb-2">404</h1>
                <p>Page Not Found</p>
                {/* Security through ambiguity - don't say "Admin console disabled" to public */}
            </div>
        );
    }

    if (loading || roleLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-500">Verifying Clearance...</div>;
    }

    if (!configured || !supabaseConfigured) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-900 px-6 text-center text-slate-400">
                Console de operações indisponível: Supabase não configurado.
            </div>
        );
    }

    if (!user) {
        // Not logged in -> Redirect to login (assuming standard login for now, or specific ops login)
        return <Navigate to="/login" replace />;
    }

    const isAuthorized = role === 'admin' || role === 'team' || role === 'owner';

    if (!isAuthorized) {
        // Logged in but not authorized
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-red-950 text-red-200">
                <h1 className="text-2xl font-bold mb-2">403 Forbidden</h1>
                <p>Access Denied: Insufficient Clearance.</p>
                <p className="text-sm mt-4 text-red-400">Your attempt has been logged.</p>
            </div>
        );
    }

    return <Outlet />;
};

export default OpsGuard;
