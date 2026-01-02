import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, CheckSquare, Paperclip, Clock, Trash2, Plus, X, Tag, Download, ExternalLink } from 'lucide-react';
import { TaskWithSubtasks, TaskStatus, TaskPriority, TaskAttachment } from '@/types/tasks';
import { useUpdateTask, useCreateSubtask, useToggleSubtask, useDeleteSubtask, useUploadAttachment, useDeleteAttachment } from '@/hooks/queries/useTasks';
import * as tasksService from '@/services/tasks';
import { cn } from '@/lib/utils';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/Separator';

interface TaskDetailsDialogProps {
    task: TaskWithSubtasks | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const updateTaskSchema = z.object({
    title: z.string().min(1, 'Título é obrigatório'),
    description: z.string().optional(),
    status: z.enum(['todo', 'doing', 'done']),
    priority: z.enum(['low', 'medium', 'high']),
    due_date: z.date().optional().nullable(),
});

type UpdateTaskFormValues = z.infer<typeof updateTaskSchema>;

export function TaskDetailsDialog({ task, open, onOpenChange }: TaskDetailsDialogProps) {
    const { mutate: updateTask } = useUpdateTask();
    const { mutate: createSubtask } = useCreateSubtask();
    const { mutate: toggleSubtask } = useToggleSubtask();
    const { mutate: deleteSubtask } = useDeleteSubtask();
    const { mutate: uploadAttachment, isPending: isUploading } = useUploadAttachment();
    const { mutate: deleteAttachment } = useDeleteAttachment();

    const [isEditing, setIsEditing] = useState(false);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const [selectedAttachment, setSelectedAttachment] = useState<TaskAttachment | null>(null);

    const form = useForm<UpdateTaskFormValues>({
        resolver: zodResolver(updateTaskSchema),
        defaultValues: {
            title: task?.title || '',
            description: task?.description || '',
            status: task?.status || 'todo',
            priority: task?.priority || 'medium',
            due_date: task?.due_date ? new Date(task.due_date) : undefined,
        },
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && task) {
            uploadAttachment({ taskId: task.id, file });
        }
    };

    // Reset form when task changes - moved to useEffect to prevent render loop
    useEffect(() => {
        if (task && open) {
            form.reset({
                title: task.title,
                description: task.description || '',
                status: task.status,
                priority: task.priority,
                due_date: task.due_date ? new Date(task.due_date) : undefined,
            });
            setIsEditing(false);
        }
    }, [task?.id, open]);

    const onSubmit = (data: UpdateTaskFormValues) => {
        if (!task) return;
        updateTask({
            taskId: task.id,
            payload: {
                ...data,
                due_date: data.due_date ? data.due_date.toISOString() : null,
            }
        }, {
            onSuccess: () => {
                setIsEditing(false);
            }
        });
    };

    const handleAddSubtask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!task || !newSubtaskTitle.trim()) return;
        createSubtask({ taskId: task.id, title: newSubtaskTitle });
        setNewSubtaskTitle('');
    };

    if (!task) return null;

    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Fetch signed URL when attachment is selected
    useEffect(() => {
        if (!selectedAttachment) {
            setPreviewUrl(null);
            return;
        }

        // If image, we need signed URL. If not image, we might just need link but signed is safer.
        let isMounted = true;
        tasksService.getAttachmentSignedUrl(selectedAttachment.file_path).then(url => {
            if (isMounted) setPreviewUrl(url);
        });

        return () => { isMounted = false; };
    }, [selectedAttachment]);

    const isImage = selectedAttachment?.file_type?.startsWith('image/');

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[700px] h-[95vh] sm:h-[90vh] flex flex-col p-0 gap-0 overflow-hidden border-none sm:border">
                    <div className="p-4 sm:p-6 pb-2 border-b bg-background sticky top-0 z-20">
                        {/* Header Content */}
                        <div className="flex items-start justify-between gap-4">
                            {isEditing ? (
                                <div className="w-full space-y-4">
                                    <Input
                                        {...form.register('title')}
                                        className="text-lg font-semibold h-auto py-2 focus-visible:ring-primary"
                                        placeholder="Nome da Tarefa"
                                    />
                                </div>
                            ) : (
                                <div className="space-y-1 pr-8">
                                    <DialogTitle className="text-xl font-bold break-words leading-tight">{task.title}</DialogTitle>
                                    <div className="flex flex-wrap gap-2 pt-1 items-center">
                                        <Badge variant="secondary" className={cn("text-[10px] uppercase font-bold",
                                            task.status === 'done' ? 'bg-green-100 text-green-700' :
                                                task.status === 'doing' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-slate-100 text-slate-700'
                                        )}>
                                            {task.status === 'done' ? 'Concluído' : task.status === 'doing' ? 'Em Andamento' : 'A Fazer'}
                                        </Badge>

                                        <Badge variant="outline" className={cn("text-[10px]",
                                            task.priority === 'high' ? 'text-red-500 border-red-200 bg-red-50' :
                                                task.priority === 'medium' ? 'text-yellow-600 border-yellow-200 bg-yellow-50' :
                                                    'text-green-600 border-green-200 bg-green-50'
                                        )}>
                                            {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                                        </Badge>
                                        {task.due_date && (
                                            <Badge variant="outline" className="text-[10px] flex gap-1 items-center bg-slate-50">
                                                <CalendarIcon className="h-3 w-3" />
                                                {format(new Date(task.due_date), 'dd/MM/yyyy')}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <Tabs defaultValue="details" className="flex-1 flex flex-col overflow-hidden">
                        <TabsList className="px-4 sm:px-6 border-b justify-start rounded-none bg-background h-12 w-full overflow-x-auto no-scrollbar">
                            <TabsTrigger value="details" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4">Detalhes</TabsTrigger>
                            <TabsTrigger value="subtasks" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 flex gap-2">
                                Subtarefas
                                <Badge variant="secondary" className="h-5 px-1.5 text-[10px] rounded-full">{task.subtasks.length}</Badge>
                            </TabsTrigger>
                            <TabsTrigger value="attachments" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 flex gap-2">
                                Anexos
                                <Badge variant="secondary" className="h-5 px-1.5 text-[10px] rounded-full">{task.attachments?.length || 0}</Badge>
                            </TabsTrigger>
                        </TabsList>

                        <div className="flex-1 overflow-auto p-6 bg-muted/10">
                            <TabsContent value="details" className="m-0 space-y-6">
                                {isEditing ? (
                                    <Form {...form}>
                                        <form id="update-task-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name="status"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Status</FormLabel>
                                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                                <SelectContent position="popper">
                                                                    <SelectItem value="todo">A Fazer</SelectItem>
                                                                    <SelectItem value="doing">Fazendo</SelectItem>
                                                                    <SelectItem value="done">Feito</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="priority"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Prioridade</FormLabel>
                                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                                <SelectContent>
                                                                    <SelectItem value="low">Baixa</SelectItem>
                                                                    <SelectItem value="medium">Média</SelectItem>
                                                                    <SelectItem value="high">Alta</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <FormField
                                                control={form.control}
                                                name="due_date"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-col">
                                                        <FormLabel>Data Limite</FormLabel>
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <FormControl>
                                                                    <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                                                        {field.value ? format(field.value, "PPP") : <span>Selecione uma data</span>}
                                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                                    </Button>
                                                                </FormControl>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-auto p-0" align="start">
                                                                <Calendar
                                                                    mode="single"
                                                                    selected={field.value || undefined}
                                                                    onSelect={field.onChange}
                                                                    disabled={(date) => date < new Date("1900-01-01")}
                                                                    initialFocus
                                                                />
                                                            </PopoverContent>
                                                        </Popover>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="description"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Descrição</FormLabel>
                                                        <FormControl>
                                                            <Textarea placeholder="Descreva a tarefa..." className="min-h-[120px]" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </form>
                                    </Form>
                                ) : (
                                    <>
                                        <div className="space-y-2">
                                            <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                                                <Tag className="h-4 w-4" /> Descrição
                                            </h3>
                                            <div className="bg-background p-4 rounded-lg border text-sm whitespace-pre-wrap leading-relaxed">
                                                {task.description || <span className="text-muted-foreground italic">Sem descrição.</span>}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-background p-3 rounded-lg border">
                                                <span className="text-xs text-muted-foreground block mb-1">Criado em</span>
                                                <div className="text-sm font-medium flex items-center gap-2">
                                                    <Clock className="h-3 w-3" />
                                                    {format(new Date(task.created_at), 'PPP')}
                                                </div>
                                            </div>
                                            {task.due_date && (
                                                <div className="bg-background p-3 rounded-lg border">
                                                    <span className="text-xs text-muted-foreground block mb-1">Vence em</span>
                                                    <div className="text-sm font-medium flex items-center gap-2 text-red-600">
                                                        <CalendarIcon className="h-3 w-3" />
                                                        {format(new Date(task.due_date), 'PPP')}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </TabsContent>

                            <TabsContent value="subtasks" className="m-0 space-y-4">
                                <form onSubmit={handleAddSubtask} className="flex gap-2">
                                    <Input
                                        placeholder="Adicionar nova subtarefa..."
                                        value={newSubtaskTitle}
                                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                    />
                                    <Button type="submit" size="icon" disabled={!newSubtaskTitle.trim()}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </form>

                                <ScrollArea className="h-[300px] pr-4">
                                    {task.subtasks.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground text-sm">
                                            Nenhuma subtarefa. Adicione itens para criar um checklist.
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {task.subtasks.map((subtask) => (
                                                <div key={subtask.id} className="flex items-center gap-3 p-3 bg-background rounded-lg border group hover:border-primary/50 transition-colors">
                                                    <Checkbox
                                                        checked={subtask.done}
                                                        onCheckedChange={(checked) => toggleSubtask({ subtaskId: subtask.id, done: checked as boolean })}
                                                    />
                                                    <span className={cn("flex-1 text-sm font-medium", subtask.done && "line-through text-muted-foreground")}>
                                                        {subtask.title}
                                                    </span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => deleteSubtask(subtask.id)}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </ScrollArea>
                            </TabsContent>

                            <TabsContent value="attachments" className="m-0 space-y-4">
                                <ScrollArea className="h-[300px] pr-4">
                                    {task.attachments && task.attachments.length > 0 ? (
                                        <div className="space-y-2">
                                            {task.attachments.map((file) => (
                                                <div
                                                    key={file.id}
                                                    className="flex items-center justify-between p-3 bg-background rounded-lg border group hover:border-primary/50 transition-colors cursor-pointer"
                                                    onClick={() => setSelectedAttachment(file)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                            <Paperclip className="h-4 w-4 text-primary" />
                                                        </div>
                                                        <div className="overflow-hidden">
                                                            <p className="text-sm font-medium truncate max-w-[200px]" title={file.file_name}>{file.file_name}</p>
                                                            <p className="text-xs text-muted-foreground">{file.file_type} • {(file.file_size / 1024).toFixed(1)} KB</p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            deleteAttachment(file.id);
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                                            <Paperclip className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                            <p>Nenhum anexo.</p>
                                        </div>
                                    )}
                                </ScrollArea>
                                <div className="flex justify-center flex-col items-center gap-2">
                                    <Input
                                        type="file"
                                        className="hidden"
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                    />
                                    <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="w-full">
                                        <Plus className="mr-2 h-4 w-4" />
                                        {isUploading ? "Enviando..." : "Adicionar Anexo"}
                                    </Button>
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>

                    <div className="p-4 border-t bg-background flex items-center justify-between gap-2 mt-auto">
                        <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4 mr-2" /> Excluir
                        </Button>
                        <div className="flex gap-2">
                            {isEditing ? (
                                <>
                                    <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancelar</Button>
                                    <Button type="submit" form="update-task-form">Salvar</Button>
                                </>
                            ) : (
                                <>
                                    <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
                                    <Button onClick={() => setIsEditing(true)}>Editar</Button>
                                </>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Preview Modal */}
            <Dialog open={!!selectedAttachment} onOpenChange={(open) => !open && setSelectedAttachment(null)}>
                <DialogContent className="sm:max-w-[800px] h-[80vh] flex flex-col p-0 gap-0">
                    <div className="p-4 border-b flex justify-between items-center bg-muted/20">
                        <DialogTitle className="text-lg font-semibold truncate max-w-[600px]">
                            {selectedAttachment?.file_name}
                        </DialogTitle>
                        <div className="flex gap-2">
                            {previewUrl && (
                                <Button variant="outline" size="sm" asChild>
                                    <a href={previewUrl} target="_blank" rel="noopener noreferrer" download>
                                        <Download className="h-4 w-4 mr-2" /> Baixar
                                    </a>
                                </Button>
                            )}
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/5 dark:bg-black/50">
                        {previewUrl ? (
                            isImage ? (
                                <img
                                    src={previewUrl}
                                    alt={selectedAttachment?.file_name}
                                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                                />
                            ) : (
                                <div className="text-center space-y-4">
                                    <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto">
                                        <Paperclip className="h-10 w-10 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Pré-visualização não disponível</p>
                                        <p className="text-sm text-muted-foreground">Este tipo de arquivo não pode ser visualizado aqui.</p>
                                    </div>
                                    <Button asChild>
                                        <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="h-4 w-4 mr-2" /> Abrir em nova aba
                                        </a>
                                    </Button>
                                </div>
                            )
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className="loading loading-spinner loading-md"></span> Carregando...
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
