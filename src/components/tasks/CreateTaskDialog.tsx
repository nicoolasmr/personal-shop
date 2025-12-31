import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCreateTask } from '@/hooks/queries/useTasks';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TaskStatus, TaskPriority } from '@/types/tasks'; // Removed TASK_PRIORITY_CONFIG if unused
import { Loader2, Plus } from 'lucide-react';
import { useState } from 'react';

const createTaskSchema = z.object({
    title: z.string().min(1, 'O título é obrigatório'),
    description: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high'] as [string, ...string[]]).optional(),
    status: z.enum(['todo', 'doing', 'done'] as [string, ...string[]]).optional(),
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

    const { mutate: createTask, isPending } = useCreateTask();

    const form = useForm<CreateTaskFormValues>({
        resolver: zodResolver(createTaskSchema),
        defaultValues: {
            title: '',
            description: '',
            priority: 'medium',
            status: defaultStatus,
        },
    });

    const onSubmit = (data: CreateTaskFormValues) => {
        createTask({
            title: data.title,
            description: data.description,
            priority: data.priority as TaskPriority,
            status: data.status as TaskStatus,
        }, {
            onSuccess: () => {
                form.reset();
                setIsOpen?.(false);
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
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Criar Nova Tarefa</DialogTitle>
                    <DialogDescription>
                        Adicione os detalhes da tarefa abaixo.
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

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select
                                onValueChange={(value: TaskStatus) => form.setValue('status', value)}
                                defaultValue={form.getValues('status')}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todo">A Fazer</SelectItem>
                                    <SelectItem value="doing">Fazendo</SelectItem>
                                    <SelectItem value="done">Feito</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="priority">Prioridade</Label>
                            <Select
                                onValueChange={(value: TaskPriority) => form.setValue('priority', value)}
                                defaultValue={form.getValues('priority')}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent position="popper">
                                    <SelectItem value="low">Baixa</SelectItem>
                                    <SelectItem value="medium">Média</SelectItem>
                                    <SelectItem value="high">Alta</SelectItem>
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
            </DialogContent>
        </Dialog>
    );
}
