import { Navigate, Outlet } from 'react-router-dom';
import { useIsAdmin } from '@/hooks/useUserRole';
import LoadingScreen from '@/components/LoadingScreen';

export function AdminGuard() {
    const { isAdmin, isLoading } = useIsAdmin() || {}; // Handle undefined return

    // While loading, show loading screen
    if (isLoading || isAdmin === undefined) {
        return <LoadingScreen />;
    }

    // If not admin, redirect to home
    if (!isAdmin) {
        return <Navigate to="/app/home" replace />;
    }

    // If admin, render child routes
    return <Outlet />;
}

export default AdminGuard;
