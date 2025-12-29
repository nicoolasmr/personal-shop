import { useState, useEffect, createContext, useContext, ReactNode, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, supabaseConfigured } from '@/lib/supabase';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    configured: boolean;
    signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const notConfiguredError = () =>
    new Error('[VIDA360] Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!supabaseConfigured) {
            setUser(null);
            setSession(null);
            setLoading(false);
            return;
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signUp = async (email: string, password: string, fullName?: string) => {
        if (!supabaseConfigured) return { error: notConfiguredError() };
        const redirectUrl = `${window.location.origin}/app/home`;
        const { error } = await supabase.auth.signUp({
            email, password,
            options: { emailRedirectTo: redirectUrl, data: { full_name: fullName || '' } },
        });
        return { error: error as Error | null };
    };

    const signIn = async (email: string, password: string) => {
        if (!supabaseConfigured) return { error: notConfiguredError() };
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: error as Error | null };
    };

    const signOut = async () => {
        if (!supabaseConfigured) return;
        await supabase.auth.signOut();
    };

    const value = useMemo(() => ({
        user, session, loading, configured: supabaseConfigured, signUp, signIn, signOut,
    }), [user, session, loading]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
    return context;
}
