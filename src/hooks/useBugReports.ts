// =============================================================================
// useBugReports Hook
// Sprint 3.5 - Beta Ops
// =============================================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTenant } from './useTenant';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import * as bugReportsService from '@/services/bugReports';
import type { CreateBugReportPayload, BugReport } from '@/services/bugReports';

// =============================================================================
// List Bug Reports Hook
// =============================================================================

export function useBugReports() {
    const { org } = useTenant();
    const { user } = useAuth();

    return useQuery({
        queryKey: ['bug_reports', org?.id, user?.id],
        queryFn: () => bugReportsService.listBugReports(org!.id, user!.id),
        enabled: !!org?.id && !!user?.id,
    });
}

// =============================================================================
// Create Bug Report Mutation
// =============================================================================

export function useCreateBugReport() {
    const { org } = useTenant();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: CreateBugReportPayload) => {
            if (!org?.id || !user?.id) {
                throw new Error('Usuário ou organização não encontrados');
            }
            return bugReportsService.createBugReport(org.id, user.id, payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bug_reports'] });
            toast({
                title: 'Bug reportado com sucesso!',
                description: 'Obrigado pelo feedback. Vamos analisar o problema.',
            });
        },
        onError: (error: Error) => {
            console.error('[useBugReports] Error creating report:', error);
            toast({
                title: 'Erro ao enviar report',
                description: error.message || 'Tente novamente mais tarde',
                variant: 'destructive',
            });
        },
    });
}

// =============================================================================
// Helper Hook for Diagnostics
// =============================================================================

export function useDiagnostics() {
    const { org } = useTenant();
    const { user } = useAuth();

    const getDiagnostics = () => {
        const meta = bugReportsService.collectDiagnostics();
        return {
            ...meta,
            user_id: user?.id || 'anonymous',
            org_id: org?.id || 'none',
        };
    };

    const copyDiagnostics = () => {
        const diagnostics = getDiagnostics();
        const json = JSON.stringify(diagnostics, null, 2);
        navigator.clipboard.writeText(json);
        toast({
            title: 'Diagnóstico copiado!',
            description: 'Cole em uma mensagem de suporte.',
        });
    };

    return { getDiagnostics, copyDiagnostics };
}
