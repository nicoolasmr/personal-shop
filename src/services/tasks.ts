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
        const item = s as TaskSubtask;
        if (!acc[item.task_id]) acc[item.task_id] = [];
        acc[item.task_id].push(item);
        return acc;
    }, {} as Record<string, TaskSubtask[]>);

    const attachmentsByTask = (attachments || []).reduce((acc, a) => {
        const item = a as TaskAttachment;
        if (!acc[item.task_id]) acc[item.task_id] = [];
        acc[item.task_id].push(item);
        return acc;
    }, {} as Record<string, TaskAttachment[]>);

    return tasks.map(task => ({
        ...task,
        subtasks: subtasksByTask[task.id] || [],
        attachments: attachmentsByTask[task.id] || [],
    })) as TaskWithSubtasks[];
}

export async function listTasksWithDueDate(orgId: string, startDate: string, endDate: string): Promise<Task[]> {
    const { data: tasks, error } = await db
        .from('tasks')
        .select('*')
        .eq('org_id', orgId)
        .eq('archived', false)
        .gte('due_date', startDate)
        .lte('due_date', endDate);

    if (error) throw new Error('Erro ao buscar tarefas por data');
    return (tasks || []) as Task[];
}

// =============================================================================
// SINGLE TASK
// =============================================================================

export async function getTask(taskId: string): Promise<TaskWithSubtasks> {
    const { data: task, error } = await db.from('tasks').select('*').eq('id', taskId).single();
    if (error || !task) throw new Error('Tarefa não encontrada');

    const { data: subtasks } = await db.from('task_subtasks').select('*').eq('task_id', taskId).order('created_at');
    const { data: attachments } = await db.from('task_attachments').select('*').eq('task_id', taskId).order('created_at');

    return {
        ...task,
        subtasks: (subtasks || []) as TaskSubtask[],
        attachments: (attachments || []) as TaskAttachment[]
    } as TaskWithSubtasks;
}

// =============================================================================
// UPDATE / DELETE / ARCHIVE
// =============================================================================

export async function updateTask(orgId: string, userId: string, taskId: string, payload: UpdateTaskPayload): Promise<Task> {
    const { data, error } = await db
        .from('tasks')
        .update(payload)
        .eq('id', taskId)
        .eq('org_id', orgId)
        .select()
        .single();

    if (error) throw new Error('Erro ao atualizar tarefa');
    if (!data) throw new Error('Tarefa não encontrada');
    await logAudit(orgId, userId, 'task_updated', 'task', taskId, payload as Record<string, unknown>);
    return data as Task;
}

export async function deleteTask(orgId: string, userId: string, taskId: string): Promise<void> {
    // Delete attachments storage first (optional, but good practice)
    // For now, just delete DB record, cascade will handle subtasks/attachments references if configured,
    // otherwise we might need to delete them manually. Assuming Supabase Cascade is on.
    const { error } = await db.from('tasks').delete().eq('id', taskId).eq('org_id', orgId);
    if (error) throw new Error('Erro ao excluir tarefa');
    await logAudit(orgId, userId, 'task_deleted', 'task', taskId, {});
}

export async function archiveTask(orgId: string, userId: string, taskId: string): Promise<Task> {
    const { data, error } = await db
        .from('tasks')
        .update({ archived: true })
        .eq('id', taskId)
        .eq('org_id', orgId)
        .select()
        .single();

    if (error) throw new Error('Erro ao arquivar tarefa');
    if (!data) throw new Error('Tarefa não encontrada');
    await logAudit(orgId, userId, 'task_archived', 'task', taskId, {});
    return data as Task;
}

// =============================================================================
// MOVE (Status + Sort Order)
// =============================================================================

export async function moveTask(orgId: string, userId: string, taskId: string, payload: MoveTaskPayload): Promise<void> {
    const { status: newStatus, destinationIndex: newIndex } = payload;

    // 1. Get task to verify
    const { data: task } = await db.from('tasks').select('*').eq('id', taskId).single();
    if (!task) throw new Error('Tarefa não encontrada');

    // 2. If changing status, update it
    if (newStatus && newStatus !== task.status) {
        await updateTask(orgId, userId, taskId, { status: newStatus });
    }

    // 3. Handle Reordering
    const targetStatus = newStatus || task.status;
    const { data: siblings } = await db
        .from('tasks')
        .select('id, sort_order')
        .eq('org_id', orgId)
        .eq('status', targetStatus)
        .eq('archived', false)
        .neq('id', taskId)
        .order('sort_order', { ascending: true }); // ASC to find index

    const safeSiblings = (siblings || []) as { id: string; sort_order: number }[];

    // Calculate new sort_order based on newIndex definition (0-based index in the target list)
    let newSortOrder = 0;

    if (safeSiblings.length === 0) {
        newSortOrder = GAP_SIZE;
    } else {
        if (newIndex <= 0) {
            // Before first
            newSortOrder = safeSiblings[0].sort_order / 2;
        } else if (newIndex >= safeSiblings.length) {
            // After last
            newSortOrder = safeSiblings[safeSiblings.length - 1].sort_order + GAP_SIZE;
        } else {
            // Between
            const prev = safeSiblings[newIndex - 1].sort_order;
            const next = safeSiblings[newIndex].sort_order;
            newSortOrder = (prev + next) / 2;
        }
    }

    await db.from('tasks').update({ sort_order: newSortOrder }).eq('id', taskId);
}

export async function getMaxSortOrder(orgId: string, status: string): Promise<number> {
    const { data } = await db
        .from('tasks')
        .select('sort_order')
        .eq('org_id', orgId)
        .eq('status', status)
        .eq('archived', false)
        .order('sort_order', { ascending: false })
        .limit(1)
        .single();
    return data?.sort_order || 0;
}

export async function deleteSubtask(orgId: string, userId: string, subtaskId: string): Promise<void> {
    const { error } = await db.from('task_subtasks').delete().eq('id', subtaskId).eq('org_id', orgId);
    if (error) throw new Error('Erro ao excluir subtarefa');
}

export async function deleteAttachment(orgId: string, userId: string, attachmentId: string): Promise<void> {
    // 1. Get attachment to find path
    const { data: att } = await db.from('task_attachments').select('*').eq('id', attachmentId).single();
    if (!att) return;

    // 2. Delete file
    await db.storage.from('task-attachments').remove([att.file_path]);

    // 3. Delete record
    const { error } = await db.from('task_attachments').delete().eq('id', attachmentId).eq('org_id', orgId);
    if (error) throw new Error('Erro ao excluir anexo');
}

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
    if (!data) throw new Error('Falha ao criar tarefa');
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
