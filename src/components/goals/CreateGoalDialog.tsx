import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCreateGoal } from '@/hooks/useGoals';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const createGoalSchema = z.object({
    title: z.string().min(1, 'Título é obrigatório'),
    description: z.string().optional(),
    type: z.enum(['financial', 'health', 'learning', 'other'] as [string, ...string[]]),
    target_value: z.coerce.number().min(1, 'Valor alvo deve ser maior que 0'),
    start_date: z.string().min(1, 'Data de início é obrigatória'),
    deadline: z.string().min(1, 'Data limite é obrigatória'),
    unit: z.string().min(1, 'Unidade é obrigatória'),
});

type CreateGoalFormValues = z.infer<typeof createGoalSchema>;

interface CreateGoalDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateGoalDialog({ open, onOpenChange }: CreateGoalDialogProps) {
    const { mutate: createGoal, isPending } = useCreateGoal();

    const form = useForm<CreateGoalFormValues>({
        resolver: zodResolver(createGoalSchema),
        defaultValues: {
            title: '',
            description: '',
            type: 'other',
            target_value: 0,
            unit: 'un',
            start_date: new Date().toISOString().split('T')[0],
            deadline: '',
        },
    });

    const selectedType = useWatch({ control: form.control, name: 'type' });

    // Auto-update unit based on type
    const handleTypeChange = (value: string) => {
        form.setValue('type', value);
        if (value === 'financial') form.setValue('unit', 'R$');
        else if (value === 'health') form.setValue('unit', 'kg'); // Default assumption, editable
        else if (value === 'learning') form.setValue('unit', 'pág');
        else form.setValue('unit', 'un');
    };

    const onSubmit = (data: CreateGoalFormValues) => {
        createGoal({
            ...data,
            current_value: 0,
            status: 'active',
        }, {
            onSuccess: () => {
                form.reset();
                onOpenChange(false);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Nova Meta</DialogTitle>
                    <DialogDescription>
                        Defina um objetivo claro e mensurável.
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
                                    <Select onValueChange={handleTypeChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                        <SelectContent position="popper">
                                            <SelectItem value="financial">Financeiro</SelectItem>
                                            <SelectItem value="health">Saúde & Bem-estar</SelectItem>
                                            <SelectItem value="learning">Aprendizado</SelectItem>
                                            <SelectItem value="other">Outros</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {selectedType === 'financial' && (
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

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="start_date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Início</FormLabel>
                                        <FormControl><Input type="date" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
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
