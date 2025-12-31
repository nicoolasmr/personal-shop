import { useState } from 'react';
import { useTasks, useMoveTask } from '@/hooks/queries/useTasks';
import { TaskBoard } from '@/components/tasks/board/TaskBoard';
import { CreateTaskDialog } from '@/components/tasks/CreateTaskDialog';
import { TaskDetailsDialog } from '@/components/tasks/TaskDetailsDialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, LayoutTemplate, List } from 'lucide-react';
import { TaskStatus, TaskWithSubtasks } from '@/types/tasks';

export default function TasksPage() {
    const { data: tasks, isLoading, error } = useTasks();
    const { mutate: moveTask } = useMoveTask();
    const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<TaskWithSubtasks | null>(null);

    const handleTaskMove = (taskId: string, newStatus: TaskStatus, newIndex: number) => {
        // Optimistic update could go here, but for now rely on React Query invalidation
        moveTask({
            taskId,
            payload: { status: newStatus, destinationIndex: newIndex }
        });
    };

    const handleTaskClick = (task: TaskWithSubtasks) => {
        setSelectedTask(task);
    };

    if (error) {
        return (
            <div className="p-8 text-center text-destructive">
                <p>Erro ao carregar tarefas.</p>
                <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>Tentar Novamente</Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)]">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Tarefas</h1>
                    <p className="text-muted-foreground">Gerencie suas atividades e acompanhe o progresso.</p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="flex bg-muted p-1 rounded-md mr-2">
                        <Button
                            variant={viewMode === 'board' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('board')}
                            className="h-8 w-8 p-0"
                        >
                            <LayoutTemplate className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('list')}
                            className="h-8 w-8 p-0"
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>

                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Nova Tarefa
                    </Button>
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex gap-6 h-full">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex-1 space-y-4">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-32 w-full" />
                            <Skeleton className="h-32 w-full" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex-1 overflow-hidden">
                    {viewMode === 'board' ? (
                        <TaskBoard
                            tasks={tasks || []}
                            onTaskMove={handleTaskMove}
                            onTaskClick={handleTaskClick}
                        />
                    ) : (
                        <div className="text-center py-20 text-muted-foreground">
                            <List className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>Visualização em lista em breve.</p>
                        </div>
                    )}
                </div>
            )}

            <CreateTaskDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
            />

            <TaskDetailsDialog
                task={selectedTask}
                open={!!selectedTask}
                onOpenChange={(open) => !open && setSelectedTask(null)}
            />
        </div>
    );
}
