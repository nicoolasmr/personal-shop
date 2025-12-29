export type TaskStatus = 'todo' | 'doing' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
    id: string;
    org_id: string;
    user_id: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    due_date: string | null;
    tags: string[];
    sort_order: number;
    archived: boolean;
    created_at: string;
    updated_at: string;
}

export interface TaskSubtask {
    id: string;
    org_id: string;
    task_id: string;
    user_id: string;
    title: string;
    done: boolean;
    created_at: string;
}

export interface TaskAttachment {
    id: string;
    org_id: string;
    task_id: string;
    user_id: string;
    file_name: string;
    file_path: string;
    file_size: number;
    file_type: string;
    created_at: string;
}

export interface TaskWithSubtasks extends Task {
    subtasks: TaskSubtask[];
    attachments: TaskAttachment[];
}

export interface CreateTaskPayload {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    due_date?: string;
    tags?: string[];
}

export interface UpdateTaskPayload {
    title?: string;
    description?: string | null;
    status?: TaskStatus;
    priority?: TaskPriority;
    due_date?: string | null;
    tags?: string[];
}

export interface MoveTaskPayload {
    status: TaskStatus;
    destinationIndex: number;
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
    todo: 'A Fazer', doing: 'Fazendo', done: 'Feito',
};

export const TASK_PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string }> = {
    low: { label: 'Baixa', color: '#22c55e' },
    medium: { label: 'Média', color: '#f59e0b' },
    high: { label: 'Alta', color: '#ef4444' },
};

export const TASK_TAG_PRESETS = [
    'Trabalho', 'Pessoal', 'Urgente', 'Projeto',
    'Reunião', 'Estudo', 'Saúde', 'Finanças',
] as const;
