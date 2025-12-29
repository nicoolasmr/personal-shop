import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTenant } from '@/hooks/useTenant';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { getHapticsEnabled } from '@/hooks/useHaptics';
import { haptics } from '@/lib/haptics';
import * as tasksService from '@/services/tasks';
import type { CreateTaskPayload, UpdateTaskPayload, MoveTaskPayload, TaskStatus } from '@/types/tasks';

const TASKS_KEY = 'tasks';
const TODAY_TASKS_KEY = 'tasks-today';

export function useTasks() {
    const { org } = useTenant();
    return useQuery({
        queryKey: [TASKS_KEY, org?.id],
        queryFn: () => { if (!org?.id) throw new Error('No org'); return tasksService.listTasks(org.id); },
        enabled: !!org?.id,
    });
}

export function useTodayPendingTasks() {
    const { org } = useTenant();
    return useQuery({
        queryKey: [TODAY_TASKS_KEY, org?.id],
        queryFn: () => { if (!org?.id) throw new Error('No org'); return tasksService.getTodayPendingTasks(org.id); },
        enabled: !!org?.id,
        refetchInterval: 60000,
    });
}

export function useCreateTask() {
    const { org } = useTenant();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateTaskPayload) => {
            if (!org?.id || !user?.id) throw new Error('Missing org or user');
            return tasksService.createTask(org.id, user.id, payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [TASKS_KEY] });
            queryClient.invalidateQueries({ queryKey: [TODAY_TASKS_KEY] });
            toast({ title: 'Tarefa criada!', description: 'Sua nova tarefa foi adicionada.' });
        },
        onError: (error) => { console.error('Create task error:', error); toast({ title: 'Erro ao criar tarefa', description: 'Tente novamente.', variant: 'destructive' }); },
    });
}

export function useUpdateTask() {
    const { org } = useTenant();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ taskId, payload }: { taskId: string; payload: UpdateTaskPayload }) => {
            if (!org?.id || !user?.id) throw new Error('Missing org or user');
            return tasksService.updateTask(org.id, user.id, taskId, payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [TASKS_KEY] });
            queryClient.invalidateQueries({ queryKey: [TODAY_TASKS_KEY] });
            toast({ title: 'Tarefa atualizada!' });
        },
        onError: (error) => { console.error('Update task error:', error); toast({ title: 'Erro ao atualizar tarefa', description: 'Tente novamente.', variant: 'destructive' }); },
    });
}

export function useArchiveTask() {
    const { org } = useTenant();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (taskId: string) => {
            if (!org?.id || !user?.id) throw new Error('Missing org or user');
            return tasksService.archiveTask(org.id, user.id, taskId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [TASKS_KEY] });
            queryClient.invalidateQueries({ queryKey: [TODAY_TASKS_KEY] });
            toast({ title: 'Tarefa arquivada' });
        },
        onError: (error) => { console.error('Archive task error:', error); toast({ title: 'Erro ao arquivar tarefa', description: 'Tente novamente.', variant: 'destructive' }); },
    });
}

export function useMoveTask() {
    const { org } = useTenant();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ taskId, payload }: { taskId: string; payload: MoveTaskPayload & { destinationIndex: number } }) => {
            if (!org?.id || !user?.id) throw new Error('Missing org or user');
            return tasksService.moveTask(org.id, user.id, taskId, { status: payload.status, destinationIndex: payload.destinationIndex });
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: [TASKS_KEY] });
            queryClient.invalidateQueries({ queryKey: [TODAY_TASKS_KEY] });
            if (variables.payload.status === 'done' && getHapticsEnabled()) haptics.success();
        },
        onError: (error) => {
            console.error('Move task error:', error);
            toast({ title: 'Erro ao mover tarefa', description: 'A tarefa foi revertida para a posição anterior.', variant: 'destructive' });
            queryClient.invalidateQueries({ queryKey: [TASKS_KEY] });
        },
    });
}

// Subtasks
export function useCreateSubtask() {
    const { org } = useTenant(); const { user } = useAuth(); const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ taskId, title }: { taskId: string; title: string }) => {
            if (!org?.id || !user?.id) throw new Error('Missing org or user');
            return tasksService.createSubtask(org.id, user.id, taskId, title);
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: [TASKS_KEY] }); },
        onError: (error) => { console.error('Create subtask error:', error); toast({ title: 'Erro ao criar subtarefa', variant: 'destructive' }); },
    });
}

export function useToggleSubtask() {
    const { org } = useTenant(); const { user } = useAuth(); const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ subtaskId, done }: { subtaskId: string; done: boolean }) => {
            if (!org?.id || !user?.id) throw new Error('Missing org or user');
            return tasksService.toggleSubtask(org.id, user.id, subtaskId, done);
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: [TASKS_KEY] }); },
        onError: (error) => { console.error('Toggle subtask error:', error); toast({ title: 'Erro ao atualizar subtarefa', variant: 'destructive' }); },
    });
}

export function useDeleteSubtask() {
    const { org } = useTenant(); const { user } = useAuth(); const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (subtaskId: string) => {
            if (!org?.id || !user?.id) throw new Error('Missing org or user');
            return tasksService.deleteSubtask(org.id, user.id, subtaskId); // Note: Assuming this service exists, might need gap in service
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: [TASKS_KEY] }); },
        onError: (error) => { console.error('Delete subtask error:', error); toast({ title: 'Erro ao excluir subtarefa', variant: 'destructive' }); },
    });
}

// Attachments
export function useUploadAttachment() {
    const { org } = useTenant(); const { user } = useAuth(); const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ taskId, file }: { taskId: string; file: File }) => {
            if (!org?.id || !user?.id) throw new Error('Missing org or user');
            return tasksService.uploadAttachment(org.id, user.id, taskId, file);
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: [TASKS_KEY] }); toast({ title: 'Anexo enviado!' }); },
        onError: (error) => { console.error('Upload attachment error:', error); toast({ title: 'Erro ao enviar anexo', description: 'Verifique o tamanho e tipo do arquivo.', variant: 'destructive' }); },
    });
}

export function useDeleteAttachment() {
    const { org } = useTenant(); const { user } = useAuth(); const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (attachmentId: string) => {
            if (!org?.id || !user?.id) throw new Error('Missing org or user');
            return tasksService.deleteAttachment(org.id, user.id, attachmentId); // Note: Assuming this service exists
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: [TASKS_KEY] }); toast({ title: 'Anexo removido' }); },
        onError: (error) => { console.error('Delete attachment error:', error); toast({ title: 'Erro ao excluir anexo', variant: 'destructive' }); },
    });
}

export function useGetMaxSortOrder() {
    const { org } = useTenant();
    return async (status: TaskStatus): Promise<number> => {
        if (!org?.id) return 0;
        // Assuming getMaxSortOrder is exported or similar logic exists
        return tasksService.getMaxSortOrder(org.id, status) || 0;
    };
}
