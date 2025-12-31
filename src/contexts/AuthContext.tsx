
import { useEffect, useMemo, useState } from 'react';
import { supabase, supabaseConfigured } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

import { AuthContext } from './auth-context-core';


export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const configured = useMemo(() => supabaseConfigured, []);

    useEffect(() => {
        if (!configured) {
            setLoading(false);
            return;
        }

        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, [configured]);

    const signOut = async () => {
        if (!configured) return;
        await supabase.auth.signOut();
    };

    const signIn = async (email: string, password: string) => {
        if (!configured) return { error: new Error('Supabase não configurado') };

        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error };
    };

    const signUp = async (email: string, password: string, fullName?: string) => {
        if (!configured) return { error: new Error('Supabase não configurado') };

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: fullName ? { data: { full_name: fullName } } : undefined,
        });

        return { error };
    };

    return (
        <AuthContext.Provider value={{ session, user, loading, configured, signIn, signUp, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};
