import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Org = Database['public']['Tables']['orgs']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface TenantContextType {
    org: Org | null;
    profile: Profile | null;
    loading: boolean;
    error: Error | null;
    refresh: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType>({
    org: null,
    profile: null,
    loading: true,
    error: null,
    refresh: async () => { },
});

export const useTenantContext = () => useContext(TenantContext);

export const TenantProvider = ({ children }: { children: ReactNode }) => {
    const { user, loading: authLoading } = useAuth();
    const [org, setOrg] = useState<Org | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = async () => {
        if (!user) {
            setOrg(null);
            setProfile(null);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Fetch profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (profileError) {
                // If profile doesn't exist, we might need to handle it (e.g. redirect to on-boarding or error)
                throw profileError;
            }

            setProfile(profileData);

            // Fetch org details using org_id from profile
            const { data: orgData, error: orgError } = await supabase
                .from('orgs')
                .select('*')
                .eq('id', profileData.org_id)
                .single();

            if (orgError) throw orgError;

            setOrg(orgData);
        } catch (err: any) {
            console.error('Error fetching tenant data:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading) {
            fetchData();
        }
    }, [user, authLoading]);

    return (
        <TenantContext.Provider value={{ org, profile, loading, error, refresh: fetchData }}>
            {children}
        </TenantContext.Provider>
    );
};
