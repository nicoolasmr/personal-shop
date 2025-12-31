import { Droppable } from '@hello-pangea/dnd';
import { TaskWithSubtasks } from '@/types/tasks';
import { TaskCard } from './TaskCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TaskColumnProps {
    id: string;
    title: string;
    tasks: TaskWithSubtasks[];
    icon?: React.ReactNode;
    color?: string;
    onTaskClick?: (task: TaskWithSubtasks) => void;
}

export function TaskColumn({ id, title, tasks, icon, color, onTaskClick }: TaskColumnProps) {
    return (
        <div className="flex flex-col h-full bg-muted/30 rounded-lg border border-border/50">
            {/* Column Header */}
            <div className={cn("p-4 border-b flex items-center justify-between", color && `border-l-4 ${color}`)}>
                <div className="flex items-center gap-2">
                    {icon}
                    <h3 className="font-semibold">{title}</h3>
                </div>
                <Badge variant="secondary" className="bg-background">
                    {tasks.length}
                </Badge>
            </div>

            {/* Droppable Area */}
            <Droppable droppableId={id}>
                {(provided, snapshot) => (
                    <ScrollArea
                        className="flex-1 p-3"
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                    >
                        <div className={cn(
                            "min-h-[200px] transition-colors rounded-lg",
                            snapshot.isDraggingOver ? "bg-accent/30" : ""
                        )}>
                            {tasks.map((task, index) => (
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                    index={index}
                                    onClick={onTaskClick}
                                />
                            ))}
                            {provided.placeholder}
                        </div>
                    </ScrollArea>
                )}
            </Droppable>
        </div>
    );
}
