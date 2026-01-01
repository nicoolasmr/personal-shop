import { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCreateGoal, useUpdateGoal } from '@/hooks/useGoals';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { GOAL_TYPE_CONFIGS, GoalType, Goal } from '@/types/goals';

const createGoalSchema = z.object({
    title: z.string().min(1, 'Título é obrigatório'),
    description: z.string().optional(),
    type: z.string(),
    target_value: z.coerce.number().min(1, 'Valor alvo deve ser maior que 0'),
    deadline: z.string().min(1, 'Data limite é obrigatória'),
    unit: z.string().min(1, 'Unidade é obrigatória'),
});

type CreateGoalFormValues = z.infer<typeof createGoalSchema>;

interface CreateGoalDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    goalToEdit?: Goal | null;
}

export function CreateGoalDialog({ open, onOpenChange, goalToEdit }: CreateGoalDialogProps) {
    const { mutate: createGoal, isPending: isCreating } = useCreateGoal();
    const { mutate: updateGoal, isPending: isUpdating } = useUpdateGoal();
    const isPending = isCreating || isUpdating;

    const form = useForm<CreateGoalFormValues>({
        resolver: zodResolver(createGoalSchema),
        defaultValues: {
            title: '',
            description: '',
            type: 'custom',
            target_value: 0,
            unit: 'un',
            deadline: '',
        },
    });

    // Effect to populate form when goalToEdit changes
    useEffect(() => {
        if (open) {
            if (goalToEdit) {
                form.reset({
                    title: goalToEdit.title,
                    description: goalToEdit.description || '',
                    type: goalToEdit.type,
                    target_value: goalToEdit.target_value || 0,
                    unit: goalToEdit.unit || 'un',
                    deadline: goalToEdit.due_date ? new Date(goalToEdit.due_date).toISOString().split('T')[0] : '',
                });
            } else {
                form.reset({
                    title: '',
                    description: '',
                    type: 'custom',
                    target_value: 0,
                    unit: 'un',
                    deadline: '',
                });
            }
        }
    }, [goalToEdit, open, form]);

    const selectedType = useWatch({ control: form.control, name: 'type' }) as GoalType;

    const handleTypeChange = (value: string) => {
        form.setValue('type', value);
        const config = GOAL_TYPE_CONFIGS[value as GoalType];
        if (config) {
            form.setValue('unit', config.defaultUnit);
        }
    };

    const onSubmit = (data: CreateGoalFormValues) => {
        if (goalToEdit) {
            updateGoal({
                goalId: goalToEdit.id,
                payload: {
                    title: data.title,
                    description: data.description,
                    target_value: data.target_value,
                    unit: data.unit,
                    due_date: data.deadline,
                }
            }, {
                onSuccess: () => {
                    onOpenChange(false);
                }
            });
        } else {
            createGoal({
                title: data.title,
                description: data.description,
                target_value: data.target_value,
                unit: data.unit,
                type: data.type as GoalType,
                due_date: data.deadline
            }, {
                onSuccess: () => {
                    form.reset();
                    onOpenChange(false);
                }
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{goalToEdit ? 'Editar Meta' : 'Nova Meta'}</DialogTitle>
                    <DialogDescription>
                        {goalToEdit ? 'Atualize os detalhes da sua meta.' : 'Defina um objetivo claro e mensurável.'}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome da Meta</FormLabel>
                                    <FormControl><Input placeholder="Ex: Economizar 10k, Ler 5 livros..." {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Categoria</FormLabel>
                                    <Select onValueChange={handleTypeChange} defaultValue={field.value} disabled={!!goalToEdit}>
                                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                        <SelectContent position="popper" className="max-h-[200px]">
                                            <SelectItem value="custom">Personalizada</SelectItem>
                                            <SelectItem value="financial">Financeira</SelectItem>
                                            <SelectItem value="health">Saúde</SelectItem>
                                            <SelectItem value="weight">Perda de Peso</SelectItem>
                                            <SelectItem value="sleep">Sono</SelectItem>
                                            <SelectItem value="exercise">Exercício</SelectItem>
                                            <SelectItem value="reading">Leitura</SelectItem>
                                            <SelectItem value="study">Estudo</SelectItem>
                                            <SelectItem value="task">Tarefas</SelectItem>
                                            <SelectItem value="habit">Hábito</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {goalToEdit && <p className="text-xs text-muted-foreground mt-1">A categoria não pode ser alterada.</p>}
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {selectedType === 'financial' && !goalToEdit && (
                            <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md text-sm text-blue-600 dark:text-blue-400 mb-2">
                                Metas financeiras podem ser vinculadas ao seu painel de Finanças para atualização automática.
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="target_value"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Alvo ({form.watch('unit')})</FormLabel>
                                        <FormControl><Input type="number" placeholder="0" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="unit"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Unidade</FormLabel>
                                        <FormControl><Input placeholder="kg, km, livros..." {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <FormField
                                control={form.control}
                                name="deadline"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Data Limite</FormLabel>
                                        <FormControl><Input type="date" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descrição (Opcional)</FormLabel>
                                    <FormControl><Input placeholder="Motivação ou detalhes..." {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Criar Meta
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
