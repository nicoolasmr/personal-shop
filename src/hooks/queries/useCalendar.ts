import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { calendarService, CreateEventPayload, UpdateEventPayload } from '@/services/calendar';
import { toast } from '@/hooks/use-toast';
import { startOfMonth, endOfMonth, subDays, addDays } from 'date-fns';

const CALENDAR_KEYS = {
    all: ['calendar'] as const,
    list: (start: Date, end: Date) => [...CALENDAR_KEYS.all, 'list', start.toISOString(), end.toISOString()] as const,
};

export function useCalendarEvents(year: number, month: number) {
    // Fetch a bit more than just the month to handle week overlaps
    const start = subDays(startOfMonth(new Date(year, month - 1)), 7);
    const end = addDays(endOfMonth(new Date(year, month - 1)), 7);

    return useQuery({
        queryKey: CALENDAR_KEYS.list(start, end),
        queryFn: () => calendarService.listEvents(start, end),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

export function useCreateEvent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateEventPayload) => calendarService.createEvent(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CALENDAR_KEYS.all });
            toast({ title: 'Evento criado com sucesso!' });
        },
        onError: (error) => {
            console.error('Create event error:', error);
            toast({ title: 'Erro ao criar evento', variant: 'destructive' });
        },
    });
}

export function useUpdateEvent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateEventPayload> }) =>
            calendarService.updateEvent(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CALENDAR_KEYS.all });
            toast({ title: 'Evento atualizado!' });
        },
        onError: (error) => {
            console.error('Update event error:', error);
            toast({ title: 'Erro ao atualizar evento', variant: 'destructive' });
        },
    });
}

export function useDeleteEvent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => calendarService.deleteEvent(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CALENDAR_KEYS.all });
            toast({ title: 'Evento excluído' });
        },
        onError: (error) => {
            console.error('Delete event error:', error);
            toast({ title: 'Erro ao excluir evento', variant: 'destructive' });
        },
    });
}
