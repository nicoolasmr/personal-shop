import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { supabase, supabaseConfigured } from '@/lib/supabase';
import { useAuth } from './useAuth';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Org = Database['public']['Tables']['orgs']['Row'];

interface TenantContextType {
    profile: Profile | null;
    org: Org | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [org, setOrg] = useState<Org | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTenantData = useCallback(async () => {
        if (!user || !supabaseConfigured) {
            setProfile(null);
            setOrg(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

            if (profileError) throw profileError;

            if (profileData) {
                const typedProfile = profileData as Profile;
                setProfile(typedProfile);

                const { data: orgData, error: orgError } = await supabase
                    .from('orgs')
                    .select('*')
                    .eq('id', typedProfile.org_id)
                    .maybeSingle();

                if (orgError) throw orgError;
                setOrg(orgData as Org | null);
            }
        } catch (err) {
            console.error('Error fetching tenant data:', err);
            setError(err instanceof Error ? err.message : 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchTenantData();
    }, [fetchTenantData]);

    return (
        <TenantContext.Provider value={{ profile, org, loading, error, refetch: fetchTenantData }}>
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
