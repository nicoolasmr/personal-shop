// =============================================================================
// useErrorReporting Hook
// =============================================================================
// React hook for error reporting with built-in loading states and toast feedback.
// =============================================================================

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
    sendErrorReport,
    openErrorReportEmail,
    createErrorReportPayload,
} from '@/services/errorReporting';
import type {
    ErrorReportOptions,
    ErrorReportResult,
    ErrorReportPayload
} from '@/services/errorReporting';

// Re-export types for convenience
export type { ErrorReportOptions, ErrorReportResult, ErrorReportPayload };

interface UseErrorReportingOptions {
    /** Show toast notifications on success/failure */
    showToasts?: boolean;
    /** Default to mailto fallback if edge function fails */
    defaultFallbackToMailto?: boolean;
}

interface UseErrorReportingReturn {
    /** Send an error report */
    reportError: (error: Error | string, options?: ErrorReportOptions) => Promise<ErrorReportResult>;
    /** Open mailto with error report */
    openMailtoReport: (error: Error | string, userDescription?: string) => Promise<void>;
    /** Create report payload without sending */
    createPayload: (error: Error | string, userDescription?: string) => Promise<ErrorReportPayload>;
    /** Whether a report is currently being sent */
    isSending: boolean;
    /** Last report result */
    lastResult: ErrorReportResult | null;
}

export function useErrorReporting(options: UseErrorReportingOptions = {}): UseErrorReportingReturn {
    const { showToasts = true, defaultFallbackToMailto = true } = options;
    const { toast } = useToast();

    const [isSending, setIsSending] = useState(false);
    const [lastResult, setLastResult] = useState<ErrorReportResult | null>(null);

    const reportError = useCallback(async (
        error: Error | string,
        reportOptions: ErrorReportOptions = {}
    ): Promise<ErrorReportResult> => {
        setIsSending(true);

        try {
            const result = await sendErrorReport(error, {
                fallbackToMailto: defaultFallbackToMailto,
                ...reportOptions,
            });

            setLastResult(result);

            if (showToasts) {
                if (result.success) {
                    if (result.method === 'mailto') {
                        toast({
                            title: "Email preparado",
                            description: "Uma janela de email foi aberta para você enviar o relatório.",
                        });
                    } else {
                        toast({
                            title: "Relatório enviado",
                            description: "O relatório de erro foi enviado com sucesso.",
                        });
                    }
                } else {
                    toast({
                        title: "Falha no envio",
                        description: result.error || "Não foi possível enviar o relatório.",
                        variant: "destructive",
                    });
                }
            }

            return result;
        } catch (err) {
            const errorResult: ErrorReportResult = {
                success: false,
                error: err instanceof Error ? err.message : 'Erro desconhecido',
            };

            setLastResult(errorResult);

            if (showToasts) {
                toast({
                    title: "Erro",
                    description: "Ocorreu um erro ao processar o relatório.",
                    variant: "destructive",
                });
            }

            return errorResult;
        } finally {
            setIsSending(false);
        }
    }, [showToasts, defaultFallbackToMailto, toast]);

    const openMailtoReport = useCallback(async (
        error: Error | string,
        userDescription?: string
    ): Promise<void> => {
        await openErrorReportEmail(error, userDescription);

        if (showToasts) {
            toast({
                title: "Email preparado",
                description: "Uma janela de email foi aberta para você enviar o relatório.",
            });
        }
    }, [showToasts, toast]);

    const createPayload = useCallback(async (
        error: Error | string,
        userDescription?: string
    ): Promise<ErrorReportPayload> => {
        return createErrorReportPayload(error, userDescription);
    }, []);

    return {
        reportError,
        openMailtoReport,
        createPayload,
        isSending,
        lastResult,
    };
}

export default useErrorReporting;
