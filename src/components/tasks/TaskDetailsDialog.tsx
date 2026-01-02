import { useState, useRef, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, CheckSquare, Paperclip, Clock, Trash2, Plus, X, Tag, Download, ExternalLink, AlertCircle, Loader2 } from 'lucide-react';
import { TaskWithSubtasks, TaskStatus, TaskPriority, TaskAttachment } from '@/types/tasks';
import { useUpdateTask, useCreateSubtask, useToggleSubtask, useDeleteSubtask, useUploadAttachment, useDeleteAttachment } from '@/hooks/queries/useTasks';
import * as tasksService from '@/services/tasks';
import { cn } from '@/lib/utils';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

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

// Simple linkify component
const LinkifiedText = ({ text }: { text: string }) => {
    if (!text) return <span className="text-muted-foreground italic">Sem descrição disponível.</span>;

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return (
        <>
            {parts.map((part, i) => {
                if (part.match(urlRegex)) {
                    return (
                        <a
                            key={i}
                            href={part}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline font-medium break-all"
                            onClick={(e) => e.stopPropagation()} // Prevent parent clicks
                        >
                            {part}
                        </a>
                    );
                }
                return <span key={i}>{part}</span>;
            })}
        </>
    );
};

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
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Cache for signed URLs to speed up viewing
    const signedUrlCache = useRef<Record<string, string>>({});

    const form = useForm<UpdateTaskFormValues>({
        resolver: zodResolver(updateTaskSchema),
        defaultValues: {
            title: task?.title || '',
            description: task?.description || '',
            status: (task?.status as any) || 'todo',
            priority: (task?.priority as any) || 'medium',
            due_date: task?.due_date ? new Date(task.due_date) : null,
        },
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset form when task changes
    useEffect(() => {
        if (task && open) {
            form.reset({
                title: task.title || '',
                description: task.description || '',
                status: (task.status as any) || 'todo',
                priority: (task.priority as any) || 'medium',
                due_date: task.due_date ? new Date(task.due_date) : null,
            });
            setIsEditing(false);
        }
    }, [task?.id, open, form]);

    // Fetch signed URL for attachment preview with caching
    useEffect(() => {
        if (!selectedAttachment) {
            setPreviewUrl(null);
            return;
        }

        const cachedUrl = signedUrlCache.current[selectedAttachment.id];
        if (cachedUrl) {
            setPreviewUrl(cachedUrl);
            return;
        }

        let isMounted = true;
        // Set temp null to show loader if not cached
        setPreviewUrl(null);

        tasksService.getAttachmentSignedUrl(selectedAttachment.file_path)
            .then(url => {
                if (isMounted && url) {
                    signedUrlCache.current[selectedAttachment.id] = url;
                    setPreviewUrl(url);
                }
            })
            .catch(err => {
                console.error('Error fetching signed URL:', err);
            });

        return () => { isMounted = false; };
    }, [selectedAttachment]);

    if (!task) return null;

    // Safety checks for rendering
    const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
    const attachments = Array.isArray(task.attachments) ? task.attachments : [];
    const isImage = selectedAttachment?.file_type?.startsWith('image/');

    const onSubmit = (data: UpdateTaskFormValues) => {
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
        if (!newSubtaskTitle.trim()) return;
        createSubtask({ taskId: task.id, title: newSubtaskTitle });
        setNewSubtaskTitle('');
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            uploadAttachment({ taskId: task.id, file });
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-[95vw] sm:max-w-[700px] h-[95vh] sm:h-[90vh] flex flex-col p-0 gap-0 overflow-hidden border-none sm:border rounded-xl">
                    <div className="p-4 sm:p-6 pb-2 border-b bg-background sticky top-0 z-20">
                        <div className="flex items-start justify-between gap-4">
                            {isEditing ? (
                                <div className="w-full mt-2">
                                    <Input
                                        {...form.register('title')}
                                        className="text-lg font-semibold h-auto py-2 focus-visible:ring-primary border-none shadow-none px-0"
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
                            <TabsTrigger value="details" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 text-xs font-bold uppercase tracking-wider">Geral</TabsTrigger>
                            <TabsTrigger value="subtasks" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 text-xs font-bold uppercase tracking-wider flex gap-2">
                                Subtarefas
                                <Badge variant="secondary" className="h-4 px-1 text-[9px] rounded-full">{subtasks.length}</Badge>
                            </TabsTrigger>
                            <TabsTrigger value="attachments" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 text-xs font-bold uppercase tracking-wider flex gap-2">
                                Anexos
                                <Badge variant="secondary" className="h-4 px-1 text-[9px] rounded-full">{attachments.length}</Badge>
                            </TabsTrigger>
                        </TabsList>

                        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-muted/5">
                            <TabsContent value="details" className="m-0 space-y-6">
                                {isEditing ? (
                                    <Form {...form}>
                                        <form id="update-task-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                                            <div className="grid grid-cols-2 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name="status"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-xs font-bold uppercase text-muted-foreground">Status</FormLabel>
                                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                <FormControl><SelectTrigger className="h-11"><SelectValue /></SelectTrigger></FormControl>
                                                                <SelectContent position="popper">
                                                                    <SelectItem value="todo">A Fazer</SelectItem>
                                                                    <SelectItem value="doing">Fazendo</SelectItem>
                                                                    <SelectItem value="done">Feito</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="priority"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-xs font-bold uppercase text-muted-foreground">Prioridade</FormLabel>
                                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                <FormControl><SelectTrigger className="h-11"><SelectValue /></SelectTrigger></FormControl>
                                                                <SelectContent>
                                                                    <SelectItem value="low">Baixa</SelectItem>
                                                                    <SelectItem value="medium">Média</SelectItem>
                                                                    <SelectItem value="high">Alta</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <FormField
                                                control={form.control}
                                                name="due_date"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-col">
                                                        <FormLabel className="text-xs font-bold uppercase text-muted-foreground">Data Limite</FormLabel>
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <FormControl>
                                                                    <Button variant={"outline"} className={cn("h-11 pl-3 text-left font-normal border-border/50", !field.value && "text-muted-foreground")}>
                                                                        {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                                    </Button>
                                                                </FormControl>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-auto p-0 rounded-2xl shadow-xl overflow-hidden" align="start">
                                                                <Calendar
                                                                    mode="single"
                                                                    selected={field.value || undefined}
                                                                    onSelect={field.onChange}
                                                                    disabled={(date) => date < new Date("1900-01-01")}
                                                                    initialFocus
                                                                />
                                                            </PopoverContent>
                                                        </Popover>
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="description"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs font-bold uppercase text-muted-foreground">Descrição</FormLabel>
                                                        <FormControl>
                                                            <Textarea placeholder="O que precisa ser feito..." className="min-h-[140px] resize-none rounded-xl" {...field} />
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
                                            <h3 className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                                <Tag className="h-3 w-3" /> Descrição
                                            </h3>
                                            <div className="bg-background p-5 rounded-2xl border border-border/50 text-sm whitespace-pre-wrap leading-relaxed shadow-sm">
                                                <LinkifiedText text={task.description} />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-background p-4 rounded-2xl border border-border/50 shadow-sm">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-2">Criado em</span>
                                                <div className="text-xs font-medium flex items-center gap-2">
                                                    <Clock className="h-3.5 w-3.5 text-primary/60" />
                                                    {format(new Date(task.created_at), 'PPP', { locale: ptBR })}
                                                </div>
                                            </div>
                                            {task.due_date && (
                                                <div className="bg-background p-4 rounded-2xl border border-border/50 shadow-sm border-orange-100 dark:border-orange-900/30">
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-2">Vence em</span>
                                                    <div className="text-xs font-bold flex items-center gap-2 text-orange-600 dark:text-orange-400">
                                                        <CalendarIcon className="h-3.5 w-3.5" />
                                                        {format(new Date(task.due_date), 'PPP', { locale: ptBR })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </TabsContent>

                            <TabsContent value="subtasks" className="m-0 space-y-4">
                                <form onSubmit={handleAddSubtask} className="flex gap-2 mb-2">
                                    <Input
                                        placeholder="Nova subtarefa..."
                                        className="h-11 rounded-xl shadow-sm"
                                        value={newSubtaskTitle}
                                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                    />
                                    <Button type="submit" size="icon" className="h-11 w-11 rounded-xl shrink-0" disabled={!newSubtaskTitle.trim()}>
                                        <Plus className="h-5 w-5" />
                                    </Button>
                                </form>

                                {subtasks.length === 0 ? (
                                    <div className="text-center py-16 bg-background rounded-2xl border-2 border-dashed border-muted flex flex-col items-center justify-center">
                                        <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                                            <CheckSquare className="h-6 w-6 text-muted-foreground/30" />
                                        </div>
                                        <p className="text-sm font-medium text-muted-foreground">Nenhuma subtarefa.</p>
                                        <p className="text-xs text-muted-foreground/60">Crie um checklist para se organizar melhor.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {subtasks.map((subtask) => (
                                            <div key={subtask.id} className="flex items-center gap-3 p-4 bg-background rounded-2xl border border-border/50 group hover:border-primary/20 transition-all shadow-sm">
                                                <Checkbox
                                                    id={`sub-${subtask.id}`}
                                                    checked={subtask.done}
                                                    className="h-5 w-5 rounded-lg"
                                                    onCheckedChange={(checked) => toggleSubtask({ subtaskId: subtask.id, done: checked as boolean })}
                                                />
                                                <label
                                                    htmlFor={`sub-${subtask.id}`}
                                                    className={cn("flex-1 text-sm font-medium cursor-pointer transition-all", subtask.done && "line-through text-muted-foreground opacity-60")}
                                                >
                                                    {subtask.title}
                                                </label>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                                                    onClick={() => deleteSubtask(subtask.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="attachments" className="m-0 space-y-4">
                                {attachments.length > 0 ? (
                                    <div className="space-y-2">
                                        {attachments.map((file) => (
                                            <div
                                                key={file.id}
                                                className="flex items-center justify-between p-4 bg-background rounded-2xl border border-border/50 group hover:border-primary/20 transition-all cursor-pointer shadow-sm"
                                                onClick={() => setSelectedAttachment(file)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                                        <Paperclip className="h-5 w-5 text-primary/60" />
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <p className="text-sm font-bold truncate max-w-[180px] sm:max-w-[300px]" title={file.file_name}>{file.file_name}</p>
                                                        <p className="text-[10px] text-muted-foreground font-medium uppercase">{(file.file_size / 1024).toFixed(1)} KB • {file.file_type || 'Desconhecido'}</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
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
                                    <div className="text-center py-16 bg-background rounded-2xl border-2 border-dashed border-muted flex flex-col items-center justify-center">
                                        <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                                            <Paperclip className="h-6 w-6 text-muted-foreground/30" />
                                        </div>
                                        <p className="text-sm font-medium text-muted-foreground">Nenhum anexo.</p>
                                        <p className="text-xs text-muted-foreground/60">Anexe PDFs, imagens ou documentos importantes.</p>
                                    </div>
                                )}

                                <div className="pt-2">
                                    <input
                                        type="file"
                                        className="hidden"
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                    />
                                    <Button
                                        variant="outline"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploading}
                                        className="w-full h-12 rounded-xl border-dashed border-2 hover:bg-primary/5 hover:border-primary/50 transition-all font-bold text-xs uppercase tracking-widest"
                                    >
                                        {isUploading ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Plus className="mr-2 h-4 w-4" />
                                        )}
                                        {isUploading ? "Enviando Arquivo..." : "Fazer Upload de Anexo"}
                                    </Button>
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>

                    <div className="p-4 sm:p-5 border-t bg-background flex items-center justify-between gap-3 mt-auto shadow-lg">
                        <Button variant="ghost" className="h-11 px-4 text-muted-foreground hover:text-destructive hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-colors font-medium">
                            <Trash2 className="h-4 w-4 mr-2" /> Excluir
                        </Button>
                        <div className="flex gap-2">
                            {isEditing ? (
                                <>
                                    <Button variant="ghost" className="h-11 px-5 rounded-xl font-medium" onClick={() => setIsEditing(false)}>Cancelar</Button>
                                    <Button
                                        type="submit"
                                        form="update-task-form"
                                        className="h-11 px-8 rounded-xl font-bold shadow-lg shadow-primary/20"
                                    >
                                        Salvar Alterações
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button variant="outline" className="h-11 px-6 rounded-xl font-medium border-border/50" onClick={() => onOpenChange(false)}>Fechar</Button>
                                    <Button
                                        className="h-11 px-8 rounded-xl font-bold shadow-lg shadow-primary/20"
                                        onClick={() => setIsEditing(true)}
                                    >
                                        Editar Tarefa
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Preview Dialog */}
            <Dialog open={!!selectedAttachment} onOpenChange={(open) => !open && setSelectedAttachment(null)}>
                <DialogContent className="max-w-[95vw] sm:max-w-[800px] h-[85vh] flex flex-col p-0 gap-0 rounded-2xl overflow-hidden shadow-2xl border-none">
                    <div className="p-5 border-b flex justify-between items-center bg-background/80 backdrop-blur-md sticky top-0 z-10">
                        <DialogTitle className="text-base font-bold truncate max-w-[70%]">
                            {selectedAttachment?.file_name}
                        </DialogTitle>
                        <div className="flex gap-2">
                            {previewUrl && (
                                <Button variant="outline" size="sm" asChild className="rounded-lg h-9">
                                    <a href={previewUrl} target="_blank" rel="noopener noreferrer" download={selectedAttachment?.file_name}>
                                        <Download className="h-4 w-4 mr-2" /> Baixar
                                    </a>
                                </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" onClick={() => setSelectedAttachment(null)}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-900/5 dark:bg-black/40">
                        {previewUrl ? (
                            isImage ? (
                                <img
                                    src={previewUrl}
                                    alt={selectedAttachment?.file_name}
                                    className="max-w-full max-h-full object-contain rounded-xl shadow-2xl transition-all duration-500 animate-in zoom-in-95"
                                />
                            ) : (
                                <div className="text-center space-y-5 p-8 bg-background rounded-3xl shadow-xl border border-border/20 max-w-sm w-full transition-all duration-500 animate-in slide-in-from-bottom-5">
                                    <div className="h-24 w-24 rounded-3xl bg-primary/5 flex items-center justify-center mx-auto shadow-inner">
                                        <Paperclip className="h-10 w-10 text-primary/40" />
                                    </div>
                                    <div>
                                        <p className="font-black text-lg">Visualização Indisponível</p>
                                        <p className="text-sm text-muted-foreground px-4">Não conseguimos exibir este formato de arquivo diretamente no navegador.</p>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Button asChild className="h-12 rounded-xl font-bold shadow-lg shadow-primary/20">
                                            <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="h-4 w-4 mr-2" /> Abrir em Nova Aba
                                            </a>
                                        </Button>
                                        <Button variant="ghost" asChild className="h-10 rounded-xl text-muted-foreground">
                                            <a href={previewUrl} download={selectedAttachment?.file_name}>
                                                <Download className="h-4 w-4 mr-2" /> Baixar para o dispositivo
                                            </a>
                                        </Button>
                                    </div>
                                </div>
                            )
                        ) : (
                            <div className="flex flex-col items-center gap-4 text-muted-foreground">
                                <Loader2 className="h-10 w-10 animate-spin opacity-20" />
                                <p className="text-sm font-medium animate-pulse">Obtendo acesso seguro...</p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

