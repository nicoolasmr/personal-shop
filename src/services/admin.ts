import { supabase } from '@/lib/supabase';

export interface AdminStats {
    totalUsers: number;
    newUsersThisWeek: number;
    totalOrgs: number;
    systemHealth: number;
    featureFlags: { key: string, is_enabled: boolean }[];
}

export async function getAdminStats(): Promise<AdminStats> {
    // Total Users count
    const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

    // Total Orgs count
    const { count: totalOrgs } = await supabase
        .from('orgs')
        .select('*', { count: 'exact', head: true });

    // New Users this week
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const { count: newUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', lastWeek.toISOString());

    // Feature Flags
    const { data: flags } = await supabase
        .from('feature_flags')
        .select('key, is_enabled');

    return {
        totalUsers: totalUsers || 0,
        newUsersThisWeek: newUsers || 0,
        totalOrgs: totalOrgs || 0,
        systemHealth: 100, // Placeholder
        featureFlags: flags || []
    };
}

export async function getAuditLogs(limit = 50) {
    const { data, error } = await supabase
        .from('ops_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data;
}
