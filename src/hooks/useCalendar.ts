
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { calendarService, CreateEventPayload, UpdateEventPayload } from '@/services/calendar';
import { toast } from 'sonner';

export const useCalendarEvents = (start: Date, end: Date, enabled: boolean = true) => {
    return useQuery({
        queryKey: ['calendar-events', start.toISOString(), end.toISOString()],
        queryFn: () => calendarService.listEvents(start, end),
        enabled: enabled && !!start && !!end,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

export const useCreateEvent = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateEventPayload) => calendarService.createEvent(payload),
        onSuccess: () => {
            toast.success('Evento criado com sucesso!');
            queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
        },
        onError: (error: any) => {
            console.error('Error creating event:', error);
            toast.error('Erro ao criar evento. Tente novamente.');
        }
    });
};

export const useUpdateEvent = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...payload }: UpdateEventPayload) => calendarService.updateEvent(id, payload),
        onSuccess: () => {
            toast.success('Evento atualizado!');
            queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
        },
        onError: (error: any) => {
            console.error('Error updating event:', error);
            toast.error('Erro ao atualizar evento.');
        }
    });
};

export const useDeleteEvent = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => calendarService.deleteEvent(id),
        onSuccess: () => {
            toast.success('Evento removido.');
            queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
        },
        onError: (error: any) => {
            console.error('Error deleting event:', error);
            toast.error('Erro ao remover evento.');
        }
    });
};
