import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { supabase, supabaseConfigured } from '@/lib/supabase';
import { useAuth } from './useAuth';
import type { Database } from '@/integrations/supabase/types';
import type { SupabaseClient } from '@supabase/supabase-js';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Org = Database['public']['Tables']['orgs']['Row'];

interface TenantContextType {
    profile: Profile | null;
    org: Org | null;
    loading: boolean;
    error: string | null;
    configured: boolean;
    refetch: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

type SupabaseClientLike = Pick<ReturnType<SupabaseClient<Database>['from']>, 'select' | 'eq' | 'maybeSingle'>;

type SupabaseWrapper = {
    from: (table: 'profiles' | 'orgs') => SupabaseClientLike;
};

export interface TenantSnapshotResult {
    profile: Profile | null;
    org: Org | null;
    error: string | null;
}

export async function fetchTenantSnapshot({
    configured,
    supabaseClient,
    userId,
}: {
    configured: boolean;
    supabaseClient: SupabaseWrapper | null;
    userId: string | null;
}): Promise<TenantSnapshotResult> {
    if (!configured) {
        return { profile: null, org: null, error: 'Supabase não configurado' };
    }

    if (!userId || !supabaseClient) {
        return { profile: null, org: null, error: null };
    }

    try {
        const { data: profileData, error: profileError } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        if (profileError) throw profileError;

        if (!profileData) {
            return { profile: null, org: null, error: 'Perfil não encontrado para o usuário autenticado' };
        }

        const typedProfile = profileData as Profile;

        const { data: orgData, error: orgError } = await supabaseClient
            .from('orgs')
            .select('*')
            .eq('id', typedProfile.org_id)
            .maybeSingle();

        if (orgError) throw orgError;

        if (!orgData) {
            return { profile: typedProfile, org: null, error: 'Organização não encontrada para o perfil atual' };
        }

        return { profile: typedProfile, org: orgData as Org, error: null };
    } catch (err) {
        console.error('Error fetching tenant data:', err);
        return { profile: null, org: null, error: err instanceof Error ? err.message : 'Failed to load profile' };
    }
}

export function TenantProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [org, setOrg] = useState<Org | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const configured = supabaseConfigured;

    const fetchTenantData = useCallback(async () => {
        setLoading(true);

        const result = await fetchTenantSnapshot({
            configured,
            supabaseClient: configured ? supabase : null,
            userId: user?.id ?? null,
        });

        setProfile(result.profile);
        setOrg(result.org);
        setError(result.error);
        setLoading(false);
    }, [configured, user]);

    useEffect(() => {
        fetchTenantData();
    }, [fetchTenantData]);

    return (
        <TenantContext.Provider value={{ profile, org, loading, error, configured, refetch: fetchTenantData }}>
            {children}
        </TenantContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTenant() {
    const context = useContext(TenantContext);
    if (context === undefined) {
        throw new Error('useTenant must be used within a TenantProvider');
    }
    return context;
}
