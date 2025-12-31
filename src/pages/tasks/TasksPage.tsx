import { useState } from 'react';
import { useTasks, useMoveTask } from '@/hooks/queries/useTasks';
import { TaskBoard } from '@/components/tasks/board/TaskBoard';
import { TaskList } from '@/components/tasks/TaskList';
import { CreateTaskDialog } from '@/components/tasks/CreateTaskDialog';
import { TaskDetailsDialog } from '@/components/tasks/TaskDetailsDialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, LayoutTemplate, List, CheckSquare, Clock, AlertTriangle, Layers } from 'lucide-react';
import { TaskStatus, TaskWithSubtasks } from '@/types/tasks';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export default function TasksPage() {
    const { data: tasks, isLoading, error } = useTasks();
    const { mutate: moveTask } = useMoveTask();
    const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [filter, setFilter] = useState('all');

    const handleTaskMove = (taskId: string, newStatus: TaskStatus, newIndex: number) => {
        moveTask({
            taskId,
            payload: { status: newStatus, destinationIndex: newIndex }
        });
    };

    const handleTaskClick = (task: TaskWithSubtasks) => {
        setSelectedTaskId(task.id);
    };

    if (error) {
        return (
            <div className="p-8 text-center text-destructive">
                <p>Erro ao carregar tarefas.</p>
                <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>Tentar Novamente</Button>
            </div>
        );
    }

    const taskList = tasks || [];
    const totalTasks = taskList.length;
    const inProgress = taskList.filter(t => t.status === 'in_progress').length;
    const completed = taskList.filter(t => t.status === 'done').length;
    const highPriority = taskList.filter(t => t.priority === 'high').length;

    const filteredTasks = filter === 'all' ? taskList : taskList; // Todo: Implement logic if needed, currently UI only

    const selectedTask = taskList.find(t => t.id === selectedTaskId) || null;

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Tarefas</h1>
                <p className="text-muted-foreground">Gerencie suas tarefas e projetos</p>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
                    <div className="relative w-full sm:w-64">
                        <Input placeholder="Buscar tarefas..." className="pl-8" />
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
                        >
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.3-4.3" />
                        </svg>
                    </div>
                    <Select defaultValue="all">
                        <SelectTrigger className="w-[120px]">
                            <div className="flex items-center gap-2"><div className="h-4 w-4 opacity-50"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg></div><SelectValue /></div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas</SelectItem>
                            <SelectItem value="high">Alta Prioridade</SelectItem>
                            <SelectItem value="todo">A Fazer</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex bg-muted rounded-md p-1">
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

            {/* Main Board Area */}
            {isLoading ? (
                <div className="flex gap-6 h-full">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex-1 space-y-4">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-32 w-full" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className={cn("flex-1", viewMode === 'board' ? "overflow-x-auto overflow-y-hidden" : "overflow-y-auto overflow-x-hidden")}>
                    {viewMode === 'board' ? (
                        <TaskBoard
                            tasks={filteredTasks}
                            onTaskMove={handleTaskMove}
                            onTaskClick={handleTaskClick}
                        />
                    ) : (
                        <TaskList
                            tasks={filteredTasks}
                            onTaskClick={handleTaskClick}
                        />
                    )}
                </div>
            )}

            {/* Bottom Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-2">
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400">
                            <Layers className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground font-medium">Total</div>
                            <div className="text-xl font-bold">Tarefas</div>
                            <div className="text-2xl font-bold absolute ml-16 -mt-8">{totalTasks}</div>
                        </div>
                        {/* The design in screenshot is a bit specific: Number Large, Label Small below. Let's adjust to be cleaner general metric card */}
                    </CardContent>
                </Card>
                {/* Let's redo the cards to match screenshot strictly: Number on left inside square? No, screenshot 4 shows: 
                    Left Card: "4 Total Tarefas" (4 is huge number in box).
                    Wait, looking at image 4 (Tasks):
                    Card 1: "Total Tarefas" (Label bottom), "4" (Number in grey box left).
                    Card 2: "Em Progresso" (Label bottom), "1" (Number in blue box left).
                    Card 3: "Concluídas" (Label bottom), "1" (Number in green box left).
                    Card 4: "Alta Prioridade" (Label bottom), "2" (Number in red box left).
                */}
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center text-xl font-bold text-gray-700">
                            {totalTasks}
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground font-medium uppercase">Total</div>
                            <div className="font-semibold">Tarefas</div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center text-xl font-bold text-blue-700">
                            {inProgress}
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground font-medium uppercase">Em</div>
                            <div className="font-semibold">Progresso</div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center text-xl font-bold text-green-700">
                            {completed}
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground font-medium uppercase">Concluídas</div>
                            <div className="font-semibold">Tarefas</div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-red-100 flex items-center justify-center text-xl font-bold text-red-700">
                            {highPriority}
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground font-medium uppercase">Alta</div>
                            <div className="font-semibold">Prioridade</div>
                        </div>
                    </CardContent>
                </Card>
            </div>


            <CreateTaskDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
            />

            <TaskDetailsDialog
                task={selectedTask}
                open={!!selectedTask}
                onOpenChange={(open) => !open && setSelectedTaskId(null)}
            />
        </div>
    );
}
