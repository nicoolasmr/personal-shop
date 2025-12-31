import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { TaskWithSubtasks, TaskStatus } from '@/types/tasks';
import { TaskColumn } from './TaskColumn';
import { Circle, Clock, CheckCircle2 } from 'lucide-react';

interface TaskBoardProps {
    tasks: TaskWithSubtasks[];
    onTaskMove?: (taskId: string, newStatus: TaskStatus, newIndex: number) => void;
    onTaskClick?: (task: TaskWithSubtasks) => void;
}

const COLUMNS: { id: TaskStatus; title: string; icon: React.ReactNode; color: string }[] = [
    { id: 'todo', title: 'A Fazer', icon: <Circle className="h-4 w-4" />, color: 'border-l-slate-400' },
    { id: 'doing', title: 'Fazendo', icon: <Clock className="h-4 w-4 text-blue-500" />, color: 'border-l-blue-500' },
    { id: 'done', title: 'Feito', icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, color: 'border-l-green-500' },
];

export function TaskBoard({ tasks, onTaskMove, onTaskClick }: TaskBoardProps) {

    const onDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        onTaskMove?.(
            draggableId,
            destination.droppableId as TaskStatus,
            destination.index
        );
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex h-full gap-6 overflow-x-auto pb-4">
                {COLUMNS.map(col => {
                    const columnTasks = tasks.filter(t => t.status === col.id);
                    return (
                        <div key={col.id} className="min-w-[300px] w-full max-w-[400px]">
                            <TaskColumn
                                id={col.id}
                                title={col.title}
                                tasks={columnTasks}
                                icon={col.icon}
                                color={col.color}
                                onTaskClick={onTaskClick}
                            />
                        </div>
                    );
                })}
            </div>
        </DragDropContext>
    );
}
