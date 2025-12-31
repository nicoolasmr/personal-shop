import { Draggable } from '@hello-pangea/dnd';
import { TaskWithSubtasks } from '@/types/tasks';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckSquare, Paperclip, GripVertical } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface TaskCardProps {
    task: TaskWithSubtasks;
    index: number;
    onClick?: (task: TaskWithSubtasks) => void;
}

export function TaskCard({ task, index, onClick }: TaskCardProps) {
    const completedSubtasks = task.subtasks.filter(s => s.done).length;
    const totalSubtasks = task.subtasks.length;

    return (
        <Draggable draggableId={task.id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className="mb-3 outline-none"
                    style={provided.draggableProps.style}
                >
                    <Card
                        className={cn(
                            "cursor-pointer hover:shadow-md transition-all group relative border-l-4",
                            task.priority === 'high' ? 'border-l-red-500' :
                                task.priority === 'medium' ? 'border-l-yellow-500' : 'border-l-green-500',
                            snapshot.isDragging ? "shadow-lg rotate-2 opacity-90 ring-2 ring-primary ring-opacity-50" : ""
                        )}
                        onClick={() => onClick?.(task)}
                    >
                        {/* Drag Handle */}
                        <div
                            {...provided.dragHandleProps}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded cursor-grab active:cursor-grabbing"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                        </div>

                        <CardHeader className="p-3 pb-0 space-y-2">
                            <div className="flex justify-between items-start pr-6">
                                <span className="font-medium text-sm line-clamp-2">{task.title}</span>
                            </div>
                        </CardHeader>

                        <CardContent className="p-3 pb-2">
                            {task.tags && task.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                    {task.tags.map(tag => (
                                        <Badge key={tag} variant="outline" className="text-[10px] h-5 px-1 bg-background/50">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </CardContent>

                        <CardFooter className="p-3 pt-0 flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-3">
                                {task.due_date && (
                                    <div className={cn(
                                        "flex items-center gap-1",
                                        new Date(task.due_date) < new Date() && task.status !== 'done' ? "text-red-500 font-medium" : ""
                                    )}>
                                        <Calendar className="h-3 w-3" />
                                        <span>{format(new Date(task.due_date), 'dd/MM')}</span>
                                    </div>
                                )}
                                {totalSubtasks > 0 && (
                                    <div className="flex items-center gap-1">
                                        <CheckSquare className="h-3 w-3" />
                                        <span>{completedSubtasks}/{totalSubtasks}</span>
                                    </div>
                                )}
                                {task.attachments && task.attachments.length > 0 && (
                                    <div className="flex items-center gap-1">
                                        <Paperclip className="h-3 w-3" />
                                        <span>{task.attachments.length}</span>
                                    </div>
                                )}
                            </div>
                        </CardFooter>
                    </Card>
                </div>
            )}
        </Draggable>
    );
}
