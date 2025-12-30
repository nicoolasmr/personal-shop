// =============================================================================
// Error Reporting Service
// =============================================================================

import { supabase } from '@/lib/supabase';

export interface ErrorReportPayload {
    error: string;
    stack?: string;
    userDescription?: string;
    metadata: Record<string, unknown>;
    timestamp: string;
}

export interface ErrorReportOptions {
    userDescription?: string;
    fallbackToMailto?: boolean;
}

export interface ErrorReportResult {
    success: boolean;
    method?: 'edge_function' | 'mailto';
    error?: string;
}

/**
 * Collect error metadata
 */
function collectErrorMetadata(): Record<string, unknown> {
    return {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        viewport: `${window.innerWidth}x${window.innerHeight}`,
    };
}

/**
 * Create error report payload
 */
export async function createErrorReportPayload(
    error: Error | string,
    userDescription?: string
): Promise<ErrorReportPayload> {
    const errorMessage = error instanceof Error ? error.message : error;
    const stack = error instanceof Error ? error.stack : undefined;

    return {
        error: errorMessage,
        stack,
        userDescription,
        metadata: collectErrorMetadata(),
        timestamp: new Date().toISOString(),
    };
}

/**
 * Send error report via edge function
 */
async function sendViaEdgeFunction(payload: ErrorReportPayload): Promise<boolean> {
    try {
        const { error } = await supabase.functions.invoke('report-error', {
            body: payload,
        });

        if (error) {
            console.error('Edge function error:', error);
            return false;
        }

        return true;
    } catch (err) {
        console.error('Failed to send via edge function:', err);
        return false;
    }
}

/**
 * Open mailto with error report
 */
export async function openErrorReportEmail(
    error: Error | string,
    userDescription?: string
): Promise<void> {
    const payload = await createErrorReportPayload(error, userDescription);

    const subject = encodeURIComponent(`[VIDA360] Error Report: ${payload.error.substring(0, 50)}`);
    const body = encodeURIComponent(`
Error Report
============

Error: ${payload.error}

${payload.stack ? `Stack Trace:\n${payload.stack}\n\n` : ''}

${userDescription ? `User Description:\n${userDescription}\n\n` : ''}

Metadata:
${JSON.stringify(payload.metadata, null, 2)}
  `.trim());

    window.open(`mailto:support@vida360.app?subject=${subject}&body=${body}`, '_blank');
}

/**
 * Send error report
 */
export async function sendErrorReport(
    error: Error | string,
    options: ErrorReportOptions = {}
): Promise<ErrorReportResult> {
    const payload = await createErrorReportPayload(error, options.userDescription);

    // Try edge function first
    const edgeFunctionSuccess = await sendViaEdgeFunction(payload);

    if (edgeFunctionSuccess) {
        return { success: true, method: 'edge_function' };
    }

    // Fallback to mailto if enabled
    if (options.fallbackToMailto) {
        await openErrorReportEmail(error, options.userDescription);
        return { success: true, method: 'mailto' };
    }

    return { success: false, error: 'Failed to send error report' };
}
