
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { whatsappService } from '@/services/whatsapp';
import { toast } from 'sonner';

export const useWhatsApp = (orgId: string, enabled: boolean = true) => {
    const queryClient = useQueryClient();

    // Buscar Status
    const { data: linkStatus, isLoading } = useQuery({
        queryKey: ['whatsapp-link'],
        queryFn: whatsappService.getLinkStatus,
        enabled: enabled,
    });

    // Gerar Código
    const generateCode = useMutation({
        mutationFn: () => whatsappService.generateVerificationCode(orgId),
        onError: (error) => {
            console.error(error);
            toast.error('Erro ao gerar código. Tente novamente.');
        }
    });

    // Desvincular
    const unlink = useMutation({
        mutationFn: (linkId: string) => whatsappService.unlinkWhatsApp(linkId),
        onSuccess: () => {
            toast.success('WhatsApp desconectado com sucesso.');
            queryClient.invalidateQueries({ queryKey: ['whatsapp-link'] });
        },
        onError: (error) => {
            console.error(error);
            toast.error('Erro ao desconectar WhatsApp.');
        }
    });

    return {
        linkStatus,
        isLoading,
        generateCode,
        unlink
    };
};
