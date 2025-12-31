import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCreateHabit } from '@/hooks/queries/useHabits';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { HABIT_CATEGORIES, HABIT_COLORS } from '@/types/habits';

const createHabitSchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
    description: z.string().optional(),
    category: z.string().optional(),
    frequencyType: z.enum(['daily', 'weekly']),
    color: z.string().optional(),
    reminder_time: z.string().optional(), // 'HH:mm'
});

type CreateHabitFormValues = z.infer<typeof createHabitSchema>;

interface CreateHabitDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateHabitDialog({ open, onOpenChange }: CreateHabitDialogProps) {
    const { mutate: createHabit, isPending } = useCreateHabit();

    const form = useForm<CreateHabitFormValues>({
        resolver: zodResolver(createHabitSchema),
        defaultValues: {
            name: '',
            description: '',
            category: 'habit',
            frequencyType: 'daily',
            color: HABIT_COLORS[0],
            reminder_time: '',
        },
    });

    const onSubmit = (data: CreateHabitFormValues) => {
        createHabit({
            name: data.name,
            description: data.description,
            category: data.category,
            frequency: { type: data.frequencyType },
            target: 1, // Defaulting to 1 per frequency unit for MVP
            weekly_goal: data.frequencyType === 'daily' ? 7 : 1,
            color: data.color,
            reminder_time: data.reminder_time || null,
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
                    <DialogTitle>Novo Hábito</DialogTitle>
                    <DialogDescription>
                        Crie um hábito para acompanhar sua rotina.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome do Hábito</FormLabel>
                                    <FormControl><Input placeholder="Ex: Beber água, Ler 10 páginas..." {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="category"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Categoria</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                            <SelectContent position="popper">
                                                {HABIT_CATEGORIES.map(cat => (
                                                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="frequencyType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Frequência</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                            <SelectContent position="popper">
                                                <SelectItem value="daily">Diário</SelectItem>
                                                <SelectItem value="weekly">Semanal</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="color"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Cor</FormLabel>
                                    <div className="flex gap-2 flex-wrap">
                                        {HABIT_COLORS.map(color => (
                                            <div
                                                key={color}
                                                className={`w-6 h-6 rounded-full cursor-pointer border-2 ${field.value === color ? 'border-primary scale-110' : 'border-transparent'}`}
                                                style={{ backgroundColor: color }}
                                                onClick={() => field.onChange(color)}
                                            />
                                        ))}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="reminder_time"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Lembrete (Opcional)</FormLabel>
                                    <FormControl><Input type="time" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descrição (Opcional)</FormLabel>
                                    <FormControl><Input placeholder="Detalhes..." {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Criar Hábito
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
