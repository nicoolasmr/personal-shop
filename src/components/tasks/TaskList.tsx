
import { TaskWithSubtasks } from '@/types/tasks';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Circle, Clock, CheckCircle2, Paperclip, ListChecks, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TaskStatus } from '@/types/tasks';

interface TaskListProps {
    tasks: TaskWithSubtasks[];
    onTaskClick?: (task: TaskWithSubtasks) => void;
}

const statusConfig: Record<TaskStatus, { label: string; icon: any; color: string }> = {
    todo: { label: 'A Fazer', icon: Circle, color: 'text-slate-500' },
    doing: { label: 'Fazendo', icon: Clock, color: 'text-blue-500' },
    done: { label: 'Feito', icon: CheckCircle2, color: 'text-green-500' },
};

const priorityConfig: Record<string, { label: string; class: string }> = {
    low: { label: 'Baixa', class: 'bg-slate-100 text-slate-700' },
    medium: { label: 'Média', class: 'bg-yellow-100 text-yellow-700' },
    high: { label: 'Alta', class: 'bg-red-100 text-red-700' },
};

export function TaskList({ tasks, onTaskClick }: TaskListProps) {
    if (tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-muted/10 text-muted-foreground">
                <p>Nenhuma tarefa encontrada.</p>
            </div>
        );
    }

    return (
        <div className="border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[150px]">Status</TableHead>
                        <TableHead>Título</TableHead>
                        <TableHead>Prioridade</TableHead>
                        <TableHead>Prazo</TableHead>
                        <TableHead className="text-right">Items</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tasks.map((task) => {
                        const StatusIcon = statusConfig[task.status]?.icon || Circle;
                        const statusColor = statusConfig[task.status]?.color || 'text-slate-500';
                        const priority = priorityConfig[task.priority] || priorityConfig.medium;

                        return (
                            <TableRow
                                key={task.id}
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => onTaskClick?.(task)}
                            >
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <StatusIcon className={cn("h-4 w-4", statusColor)} />
                                        <span className="capitalize">{statusConfig[task.status]?.label}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="font-medium">
                                    {task.title}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="secondary" className={cn("font-normal border-0", priority.class)}>
                                        {priority.label}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {task.due_date ? (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <CalendarIcon className="h-3 w-3" />
                                            {format(new Date(task.due_date), "dd/MM/yyyy")}
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground text-xs">-</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-3 text-muted-foreground">
                                        {task.subtasks?.length > 0 && (
                                            <div className="flex items-center gap-1 text-xs">
                                                <ListChecks className="h-3 w-3" />
                                                {task.subtasks.filter(t => t.done).length}/{task.subtasks.length}
                                            </div>
                                        )}
                                        {task.attachments?.length > 0 && (
                                            <div className="flex items-center gap-1 text-xs">
                                                <Paperclip className="h-3 w-3" />
                                                {task.attachments.length}
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
