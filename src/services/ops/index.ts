
import { supabase } from '@/lib/supabase';

// Stub for Ops Services - these will interface with RPCs and specific tables

/**
 * Log an operational action audit securelly.
 * This wraps the RPC call 'ops_log'.
 */
export const logOpsAction = async (
    action: string,
    status: 'ok' | 'blocked' | 'error',
    reason?: string,
    targetType?: string,
    targetId?: string,
    meta?: Record<string, unknown>
) => {
    const { error } = await supabase.rpc('ops_log', {
        p_action: action,
        p_status: status,
        p_reason: reason,
        p_target_type: targetType,
        p_target_id: targetId,
        p_meta: meta || {}
    });

    if (error) {
        console.error('Failed to write audit log:', error);
        // We do NOT throw here to avoid breaking the main flow if logging fails slightly,
        // but robust systems might want to enforce this.
    }
};

/**
 * Check if current user has a specific ops permission via DB.
 * Uses 'has_permission' RPC.
 */
export const checkPermission = async (permission: string): Promise<boolean> => {
    // @ts-expect-error - Metadata type mismatch with specific RPC requirement
    const { data, error } = await supabase.rpc('has_permission', {
        p: permission
    });

    if (error || !data) return false;
    return !!data;
};
