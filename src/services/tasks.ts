// =============================================================================
// Tasks Service - CRUD + Move + Subtasks + Audit Log
// =============================================================================

import { supabase } from '@/lib/supabase';
import type {
    Task,
    TaskSubtask,
    TaskAttachment,
    TaskWithSubtasks,
    TaskStatus,
    CreateTaskPayload,
    UpdateTaskPayload,
    MoveTaskPayload
} from '@/types/tasks';

const db = supabase;

// =============================================================================
// LIST TASKS (with subtasks)
// =============================================================================

export async function listTasks(orgId: string): Promise<TaskWithSubtasks[]> {
    const { data: tasks, error: tasksError } = await db
        .from('tasks')
        .select('*')
        .eq('org_id', orgId)
        .eq('archived', false)
        .order('status')
        .order('sort_order');

    if (tasksError) throw new Error('Erro ao buscar tarefas');

    if (!tasks || tasks.length === 0) return [];

    const taskIds = tasks.map(t => t.id);
    const { data: subtasks } = await db
        .from('task_subtasks')
        .select('*')
        .eq('org_id', orgId)
        .in('task_id', taskIds)
        .order('created_at');

    const { data: attachments } = await db
        .from('task_attachments')
        .select('*')
        .eq('org_id', orgId)
        .in('task_id', taskIds)
        .order('created_at');

    const subtasksByTask = (subtasks || []).reduce((acc, s) => {
        if (!acc[s.task_id]) acc[s.task_id] = [];
        acc[s.task_id].push(s as TaskSubtask);
        return acc;
    }, {} as Record<string, TaskSubtask[]>);

    const attachmentsByTask = (attachments || []).reduce((acc, a) => {
        if (!acc[a.task_id]) acc[a.task_id] = [];
        acc[a.task_id].push(a as TaskAttachment);
        return acc;
    }, {} as Record<string, TaskAttachment[]>);

    return tasks.map(task => ({
        ...task,
        subtasks: subtasksByTask[task.id] || [],
        attachments: attachmentsByTask[task.id] || [],
    })) as TaskWithSubtasks[];
}

// ... (funções GET SINGLE TASK, CONSTANTS, CREATE, UPDATE, ARCHIVE, MOVE com gap ordering)

const GAP_SIZE = 1000;
const MIN_GAP = 2;

export async function createTask(orgId: string, userId: string, payload: CreateTaskPayload): Promise<Task> {
    const status = payload.status || 'todo';
    const { data: maxOrder } = await db
        .from('tasks')
        .select('sort_order')
        .eq('org_id', orgId)
        .eq('status', status)
        .eq('archived', false)
        .order('sort_order', { ascending: false })
        .limit(1)
        .single();

    const sortOrder = (maxOrder?.sort_order ?? 0) + GAP_SIZE;

    const { data, error } = await db
        .from('tasks')
        .insert({
            org_id: orgId,
            user_id: userId,
            title: payload.title,
            description: payload.description || null,
            status,
            priority: payload.priority || 'medium',
            due_date: payload.due_date || null,
            tags: payload.tags || [],
            sort_order: sortOrder,
        })
        .select()
        .single();

    if (error) throw new Error('Erro ao criar tarefa');
    await logAudit(orgId, userId, 'task_created', 'task', data.id, { title: payload.title });
    return data as Task;
}

// ... moveTask com reindexColumn para gap ordering

// =============================================================================
// SUBTASKS
// =============================================================================

export async function createSubtask(orgId: string, userId: string, taskId: string, title: string): Promise<TaskSubtask> {
    const { data, error } = await db
        .from('task_subtasks')
        .insert({ org_id: orgId, task_id: taskId, user_id: userId, title, done: false })
        .select()
        .single();

    if (error) throw new Error('Erro ao criar subtarefa');
    return data as TaskSubtask;
}

export async function toggleSubtask(orgId: string, userId: string, subtaskId: string, done: boolean): Promise<TaskSubtask> {
    const { data, error } = await db
        .from('task_subtasks')
        .update({ done })
        .eq('id', subtaskId)
        .eq('org_id', orgId)
        .select()
        .single();

    if (error) throw new Error('Erro ao atualizar subtarefa');
    return data as TaskSubtask;
}

// =============================================================================
// TODAY'S PENDING TASKS
// =============================================================================

export async function getTodayPendingTasks(orgId: string): Promise<{
    pendingToday: TaskWithSubtasks[];
    doing: TaskWithSubtasks[];
    total: number;
}> {
    const today = new Date().toISOString().split('T')[0];
    const { data: tasks } = await db.from('tasks').select('*').eq('org_id', orgId).eq('archived', false).neq('status', 'done');

    if (!tasks) return { pendingToday: [], doing: [], total: 0 };

    const doing = (tasks as TaskWithSubtasks[]).filter(t => t.status === 'doing');
    const pending = (tasks as TaskWithSubtasks[]).filter(t => t.due_date === today && t.status === 'todo');

    return {
        pendingToday: pending,
        doing: doing,
        total: pending.length + doing.length
    };
}

// =============================================================================
// ATTACHMENTS
// =============================================================================

export async function uploadAttachment(orgId: string, userId: string, taskId: string, file: File): Promise<TaskAttachment> {
    const filePath = `${userId}/${taskId}/${Date.now()}_${file.name}`;
    await db.storage.from('task-attachments').upload(filePath, file);
    const { data } = await db.from('task_attachments').insert({ org_id: orgId, task_id: taskId, user_id: userId, file_name: file.name, file_path: filePath, file_size: file.size, file_type: file.type }).select().single();
    return data as TaskAttachment;
}

export function getAttachmentUrl(filePath: string): string {
    return db.storage.from('task-attachments').getPublicUrl(filePath).data.publicUrl;
}

// =============================================================================
// AUDIT LOG
// =============================================================================

async function logAudit(orgId: string, userId: string, action: string, entityType: string, entityId: string, meta: Record<string, unknown>): Promise<void> {
    await db.from('audit_log').insert({ org_id: orgId, user_id: userId, action, entity_type: entityType, entity_id: entityId, meta }).catch(console.error);
}
