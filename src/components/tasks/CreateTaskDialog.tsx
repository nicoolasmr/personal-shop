import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCreateTask } from '@/hooks/queries/useTasks';
import { useTenant } from '@/hooks/useTenant';
import { useAuth } from '@/hooks/useAuth';
import { createSubtask, uploadAttachment } from '@/services/tasks';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TaskStatus, TaskPriority } from '@/types/tasks';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Loader2, Plus, Trash2, Paperclip, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useState } from 'react';

const createTaskSchema = z.object({
    title: z.string().min(1, 'O título é obrigatório'),
    description: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high'] as [string, ...string[]]).optional(),
    status: z.enum(['todo', 'doing', 'done'] as [string, ...string[]]).optional(),
    due_date: z.date().optional(),
});

type CreateTaskFormValues = z.infer<typeof createTaskSchema>;

interface CreateTaskDialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    defaultStatus?: TaskStatus;
}

export function CreateTaskDialog({ open, onOpenChange, defaultStatus = 'todo' }: CreateTaskDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);

    // Controlled vs Uncontrolled
    const isControlled = open !== undefined;
    const isOpen = isControlled ? open : internalOpen;
    const setIsOpen = isControlled ? onOpenChange : setInternalOpen;

    const { org } = useTenant();
    const { user } = useAuth();
    const { mutate: createTask, isPending } = useCreateTask();

    const [subtasks, setSubtasks] = useState<string[]>([]);
    const [newItem, setNewItem] = useState('');
    const [attachments, setAttachments] = useState<File[]>([]);

    const form = useForm<CreateTaskFormValues>({
        resolver: zodResolver(createTaskSchema),
        defaultValues: {
            title: '',
            description: '',
            priority: 'medium',
            status: defaultStatus,
        },
    });

    const handleAddSubtask = () => {
        if (!newItem.trim()) return;
        setSubtasks([...subtasks, newItem]);
        setNewItem('');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) {
            setAttachments([...attachments, ...Array.from(e.target.files)]);
        }
    };

    const onSubmit = (data: CreateTaskFormValues) => {
        if (!org || !user) return;

        createTask({
            title: data.title,
            description: data.description,
            priority: data.priority as TaskPriority,
            status: data.status as TaskStatus,
            due_date: data.due_date ? format(data.due_date, 'yyyy-MM-dd') : undefined,
        }, {
            onSuccess: async (newTask) => {
                try {
                    // Create subtasks
                    if (subtasks.length > 0) {
                        await Promise.all(subtasks.map(title =>
                            createSubtask(org.id, user.id, newTask.id, title)
                        ));
                    }

                    // Upload attachments
                    if (attachments.length > 0) {
                        await Promise.all(attachments.map(file =>
                            uploadAttachment(org.id, user.id, newTask.id, file)
                        ));
                    }

                    form.reset();
                    setSubtasks([]);
                    setAttachments([]);
                    setIsOpen?.(false);
                } catch (error) {
                    console.error('Error creating secondary items:', error);
                }
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            {!isControlled && (
                <DialogTrigger asChild>
                    <Button><Plus className="mr-2 h-4 w-4" /> Nova Tarefa</Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[600px] h-[95vh] sm:h-auto sm:max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden border-none sm:border">
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <DialogHeader>
                        <DialogTitle>Criar Nova Tarefa</DialogTitle>
                        <DialogDescription>
                            Adicione os detalhes da tarefa, subtarefas e anexos.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Título</Label>
                            <Input
                                id="title"
                                placeholder="Ex: Finalizar relatório..."
                                {...form.register('title')}
                            />
                            {form.formState.errors.title && (
                                <p className="text-sm font-medium text-destructive">{form.formState.errors.title.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Descrição</Label>
                            <Textarea
                                id="description"
                                placeholder="Detalhes da tarefa..."
                                {...form.register('description')}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Subtarefas</Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Adicionar subtarefa..."
                                    value={newItem}
                                    onChange={(e) => setNewItem(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddSubtask();
                                        }
                                    }}
                                />
                                <Button type="button" variant="outline" size="icon" onClick={handleAddSubtask}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            {subtasks.length > 0 && (
                                <div className="space-y-1 mt-2">
                                    {subtasks.map((st, index) => (
                                        <div key={index} className="flex items-center justify-between bg-secondary/20 p-2 rounded text-sm">
                                            <span>{st}</span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                                onClick={() => setSubtasks(subtasks.filter((_, i) => i !== index))}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Anexos</Label>
                            <div className="flex items-center gap-2">
                                <Button type="button" variant="outline" size="sm" className="w-full relative">
                                    <Paperclip className="h-4 w-4 mr-2" />
                                    Adicionar Anexo
                                    <input
                                        type="file"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={handleFileChange}
                                        multiple
                                    />
                                </Button>
                            </div>
                            {attachments.length > 0 && (
                                <div className="space-y-1 mt-2">
                                    {attachments.map((file, index) => (
                                        <div key={index} className="flex items-center justify-between bg-secondary/20 p-2 rounded text-sm">
                                            <span className="truncate max-w-[200px]">{file.name}</span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                                onClick={() => setAttachments(attachments.filter((_, i) => i !== index))}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Data de Término</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !form.watch('due_date') && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {form.watch('due_date') ? (
                                                format(form.watch('due_date')!, "PPP")
                                            ) : (
                                                <span>Selecione</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={form.watch('due_date')}
                                            onSelect={(date) => form.setValue('due_date', date)}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="priority">Prioridade</Label>
                                <Select
                                    onValueChange={(value) => form.setValue('priority', value as any)}
                                    defaultValue={form.getValues('priority')}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Baixa</SelectItem>
                                        <SelectItem value="medium">Média</SelectItem>
                                        <SelectItem value="high">Alta</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    onValueChange={(value) => form.setValue('status', value as any)}
                                    defaultValue={form.getValues('status')}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="todo">A Fazer</SelectItem>
                                        <SelectItem value="doing">Em Andamento</SelectItem>
                                        <SelectItem value="done">Concluído</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsOpen?.(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Criar Tarefa
                            </Button>
                        </DialogFooter>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
