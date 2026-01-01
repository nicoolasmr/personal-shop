// =============================================================================
// Bug Reports Service
// =============================================================================

import { supabase } from '@/lib/supabase';

export interface BugReport {
    id: string;
    org_id: string;
    user_id: string;
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    metadata: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

export interface CreateBugReportPayload {
    title: string;
    description: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    metadata?: Record<string, unknown>;
}

/**
 * Collect diagnostic information
 */
export function collectDiagnostics(): Record<string, unknown> {
    return {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        online: navigator.onLine,
        timestamp: new Date().toISOString(),
        url: window.location.href,
    };
}

/**
 * List bug reports for a user
 */
export async function listBugReports(orgId: string, userId: string): Promise<BugReport[]> {
    const { data, error } = await supabase
        .from('bug_reports')
        .select('*')
        .eq('org_id', orgId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching bug reports:', error);
        throw error;
    }

    return data || [];
}

/**
 * Create a new bug report
 */
export async function createBugReport(
    orgId: string,
    userId: string,
    payload: CreateBugReportPayload
): Promise<BugReport> {
    const diagnostics = collectDiagnostics();

    const { data, error } = await (supabase as any)
        .from('bug_reports')
        .insert({
            org_id: orgId,
            user_id: userId,
            title: payload.title,
            description: payload.description,
            severity: payload.severity || 'medium',
            status: 'open',
            metadata: {
                ...diagnostics,
                ...payload.metadata,
            },
        } as any)
        .select()
        .single();

    if (error) {
        console.error('Error creating bug report:', error);
        throw error;
    }

    return data;
}

/**
 * Update bug report status
 */
export async function updateBugReportStatus(
    reportId: string,
    status: BugReport['status']
): Promise<void> {
    const { error } = await (supabase as any)
        .from('bug_reports')
        .update({ status, updated_at: new Date().toISOString() } as any)
        .eq('id', reportId);

    if (error) {
        console.error('Error updating bug report:', error);
        throw error;
    }
}
