import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export const AuthGuard = ({ children }: { children: JSX.Element }) => {
    const { session, loading, configured } = useAuth();

    if (!configured) {
        return (
            <div className="flex h-screen items-center justify-center p-6 text-center text-sm text-muted-foreground">
                Backend Supabase não configurado. Defina `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` para habilitar login.
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!session) {
        return <Navigate to="/login" replace />;
    }

    return children;
};
