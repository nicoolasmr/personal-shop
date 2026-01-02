import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, addHours, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, Clock, MapPin, Video, AlignLeft } from 'lucide-react';
import { useCreateEvent, useUpdateEvent } from '@/hooks/queries/useCalendar';
import { CalendarEvent } from '@/services/calendar';
import { cn } from '@/lib/utils';

// ... (imports remain same)
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const createEventSchema = z.object({
    title: z.string().min(1, 'Título é obrigatório'),
    description: z.string().optional(),
    location: z.string().optional(),
    date: z.date(),
    start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato inválido'),
    end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato inválido'),
    all_day: z.boolean().default(false),
    type: z.enum(['presencial', 'video']).default('presencial'),
    color: z.string().optional().default('blue'),
});

type CreateEventFormValues = z.infer<typeof createEventSchema>;

interface CreateEventDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultDate?: Date;
    eventToEdit?: CalendarEvent | null;
}

const EVENT_COLORS = [
    { value: 'blue', label: 'Azul', class: 'bg-blue-500' },
    { value: 'green', label: 'Verde', class: 'bg-green-500' },
    { value: 'red', label: 'Vermelho', class: 'bg-red-500' },
    { value: 'yellow', label: 'Amarelo', class: 'bg-yellow-500' },
    { value: 'purple', label: 'Roxo', class: 'bg-purple-500' },
    { value: 'pink', label: 'Rosa', class: 'bg-pink-500' },
    { value: 'orange', label: 'Laranja', class: 'bg-orange-500' },
    { value: 'gray', label: 'Cinza', class: 'bg-gray-500' },
];

export function CreateEventDialog({ open, onOpenChange, defaultDate, eventToEdit }: CreateEventDialogProps) {
    const { mutate: createEvent, isPending: isCreating } = useCreateEvent();
    const { mutate: updateEvent, isPending: isUpdating } = useUpdateEvent();

    const isPending = isCreating || isUpdating;

    const form = useForm<CreateEventFormValues>({
        resolver: zodResolver(createEventSchema),
        defaultValues: {
            title: '',
            description: '',
            location: '',
            date: defaultDate || new Date(),
            start_time: format(new Date(), 'HH:00'),
            end_time: format(addHours(new Date(), 1), 'HH:00'),
            all_day: false,
            type: 'presencial',
            color: 'blue',
        },
    });

    // Update form when eventToEdit changes
    useEffect(() => {
        if (eventToEdit) {
            const startAt = new Date(eventToEdit.start_at);
            const endAt = new Date(eventToEdit.end_at);
            form.reset({
                title: eventToEdit.title,
                description: eventToEdit.description || '',
                location: eventToEdit.location || '',
                date: startAt,
                start_time: format(startAt, 'HH:mm'),
                end_time: format(endAt, 'HH:mm'),
                all_day: eventToEdit.all_day || false,
                type: eventToEdit.location?.toLowerCase().includes('video') ? 'video' : 'presencial', // Simple heuristic
                color: eventToEdit.color || 'blue',
            });
        } else {
            // Reset to defaults if create mode
            form.reset({
                title: '',
                description: '',
                location: '',
                date: defaultDate || new Date(),
                start_time: format(new Date(), 'HH:00'),
                end_time: format(addHours(new Date(), 1), 'HH:00'),
                all_day: false,
                type: 'presencial',
                color: 'blue',
            });
        }
    }, [eventToEdit, defaultDate, form]);

    const onSubmit = (data: CreateEventFormValues) => {
        const start = new Date(data.date);
        const end = new Date(data.date);

        if (data.all_day) {
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
        } else {
            const [startHour, startMinute] = data.start_time.split(':').map(Number);
            start.setHours(startHour, startMinute);

            const [endHour, endMinute] = data.end_time.split(':').map(Number);
            end.setHours(endHour, endMinute);
        }

        const locationFinal = data.type === 'video' ? `(Vídeo) ${data.location || 'Online'}` : data.location;

        const payload = {
            title: data.title,
            description: data.description,
            location: locationFinal,
            start_at: start,
            end_at: end,
            all_day: data.all_day,
            color: data.color,
        };

        if (eventToEdit) {
            updateEvent({ id: eventToEdit.id, payload }, {
                onSuccess: () => {
                    form.reset();
                    onOpenChange(false);
                }
            });
        } else {
            createEvent(payload, {
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
                    <DialogTitle>{eventToEdit ? 'Editar Evento' : 'Novo Evento'}</DialogTitle>
                    <DialogDescription>
                        {eventToEdit ? 'Atualize os detalhes do evento.' : 'Adicione um compromisso à sua agenda.'}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* ... (fields remain same, I'll assume replace_file_content handles the gap if I target Header and Footer separately or use big block) 
                            Wait, to be safe and avoid matching errors, I'll do two chunks.
                        */}
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome do Evento</FormLabel>
                                    <FormControl><Input placeholder="Ex: Reunião de Planejamento" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipo</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="presencial"><div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Presencial</div></SelectItem>
                                                <SelectItem value="video"><div className="flex items-center gap-2"><Video className="h-4 w-4" /> Vídeo</div></SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="color"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cor</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {EVENT_COLORS.map((color) => (
                                                    <SelectItem key={color.value} value={color.value}>
                                                        <div className="flex items-center gap-2">
                                                            <div className={cn("h-3 w-3 rounded-full", color.class)} />
                                                            {color.label}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="location"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Local / Link</FormLabel>
                                    <FormControl><Input placeholder="Sala 1 ou Link Zoom" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="space-y-2 border p-3 rounded-lg bg-muted/20">
                            <FormField
                                control={form.control}
                                name="date"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Data</FormLabel>
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
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex gap-4 items-end">
                                <FormField
                                    control={form.control}
                                    name="start_time"
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <FormLabel>Início</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="time"
                                                    {...field}
                                                    onChange={(e) => {
                                                        field.onChange(e);
                                                        // Auto-set end time to 1 hour later
                                                        if (e.target.value) {
                                                            const [hours, minutes] = e.target.value.split(':').map(Number);
                                                            const date = new Date();
                                                            date.setHours(hours, minutes);
                                                            date.setHours(date.getHours() + 1);
                                                            const endString = format(date, 'HH:mm');
                                                            form.setValue('end_time', endString);
                                                        }
                                                    }}
                                                    disabled={form.watch('all_day')}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="end_time"
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <FormLabel>Fim</FormLabel>
                                            <FormControl><Input type="time" {...field} disabled={form.watch('all_day')} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="all_day"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-2 mt-2 bg-background">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">Dia Inteiro</FormLabel>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descrição</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Detalhes do evento..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {eventToEdit ? 'Salvar Alterações' : 'Criar Evento'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
