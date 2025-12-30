
import { useState } from 'react';
import { startOfWeek, endOfWeek, addDays, format, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFeatureFlag } from '@/lib/flags';
import { useCalendarEvents, useCreateEvent, useUpdateEvent, useDeleteEvent } from '@/hooks/useCalendar';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { listTasksWithDueDate } from '@/services/tasks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function CalendarPage() {
    const isEnabled = useFeatureFlag('agenda_enabled');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Auth context for org_id
    const { user } = useAuth();
    // Assuming org_id is available in user metadata or context, simplistic here:
    const orgId = user?.app_metadata?.org_id || '';

    // Date Range (Week view)
    const startDate = startOfWeek(currentDate, { weekStartsOn: 0 }); // Sunday
    const endDate = endOfWeek(currentDate, { weekStartsOn: 0 }); // Saturday

    // 1. Fetch Events
    const { data: events, isLoading: isLoadingEvents } = useCalendarEvents(startDate, endDate, !!isEnabled);

    // 2. Fetch Tasks (Integration)
    const { data: tasks, isLoading: isLoadingTasks } = useQuery({
        queryKey: ['calendar-tasks', startDate.toISOString(), endDate.toISOString()],
        queryFn: () => listTasksWithDueDate(orgId as string, startDate.toISOString(), endDate.toISOString()),
        enabled: !!isEnabled && !!orgId
    });

    // Mutations
    const createEvent = useCreateEvent();

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        start_time: '09:00',
        end_time: '10:00',
        all_day: false
    });

    const handleCreate = async () => {
        const startAt = new Date(`${formData.date}T${formData.start_time}:00`);
        const endAt = new Date(`${formData.date}T${formData.end_time}:00`);

        await createEvent.mutateAsync({
            title: formData.title,
            description: formData.description,
            start_at: startAt,
            end_at: endAt,
            all_day: formData.all_day,
            source: 'manual'
        });
        setIsCreateOpen(false);
        setFormData({ ...formData, title: '', description: '' });
    };

    if (!isEnabled) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8">
                <CalendarIcon className="h-16 w-16 text-muted-foreground mb-4" />
                <h2 className="text-2xl font-bold mb-2">Em Breve</h2>
                <p className="text-muted-foreground max-w-md">
                    O módulo de Agenda está sendo preparado e será liberado em breve para todos os usuários.
                </p>
            </div>
        );
    }

    // Generate days for the week view
    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

    return (
        <div className="space-y-6 pb-20 p-4 md:p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Agenda</h1>
                    <p className="text-muted-foreground">
                        {format(startDate, "d 'de' MMMM", { locale: ptBR })} - {format(endDate, "d 'de' MMMM, yyyy", { locale: ptBR })}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => setCurrentDate(addDays(currentDate, -7))}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
                        Hoje
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => setCurrentDate(addDays(currentDate, 7))}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>

                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="ml-2 gap-2">
                                <Plus className="h-4 w-4" />
                                <span className="hidden sm:inline">Novo Evento</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Adicionar Evento</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Título</Label>
                                    <Input
                                        placeholder="Ex: Reunião de Equipe"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Data</Label>
                                        <Input
                                            type="date"
                                            value={formData.date}
                                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                <Label>Início</Label>
                                                <Input
                                                    type="time"
                                                    value={formData.start_time}
                                                    onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <Label>Fim</Label>
                                                <Input
                                                    type="time"
                                                    value={formData.end_time}
                                                    onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Descrição</Label>
                                    <Textarea
                                        placeholder="Detalhes do evento..."
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                                <Button onClick={handleCreate} disabled={createEvent.isPending} className="w-full">
                                    {createEvent.isPending ? 'Salvando...' : 'Criar Evento'}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Week Grid */}
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                {weekDays.map(day => {
                    const dayEvents = events?.filter(e => isSameDay(parseISO(e.start_at), day)) || [];
                    const dayTasks = tasks?.filter(t => t.due_date && isSameDay(parseISO(t.due_date), day)) || [];
                    const isToday = isSameDay(day, new Date());

                    return (
                        <Card key={day.toISOString()} className={cn("h-full min-h-[200px] flex flex-col", isToday && "border-primary")}>
                            <CardHeader className="p-3 pb-2 bg-muted/30">
                                <div className="text-center">
                                    <p className="text-sm font-medium text-muted-foreground capitalize">
                                        {format(day, 'EEE', { locale: ptBR })}
                                    </p>
                                    <p className={cn("text-2xl font-bold", isToday && "text-primary")}>
                                        {format(day, 'd')}
                                    </p>
                                </div>
                            </CardHeader>
                            <CardContent className="p-2 flex-1 space-y-2">
                                {/* Loading Skeletons */}
                                {(isLoadingEvents || isLoadingTasks) && (
                                    <>
                                        <Skeleton className="h-10 w-full" />
                                        <Skeleton className="h-8 w-full" />
                                    </>
                                )}

                                {/* Events */}
                                {dayEvents.map(event => (
                                    <div key={event.id} className="bg-primary/10 text-primary p-2 rounded text-sm border-l-2 border-primary">
                                        <div className="flex items-center gap-1 text-xs font-semibold mb-0.5">
                                            <Clock className="w-3 h-3" />
                                            {format(parseISO(event.start_at), 'HH:mm')}
                                        </div>
                                        <div className="font-medium truncate">{event.title}</div>
                                    </div>
                                ))}

                                {/* Tasks */}
                                {dayTasks.map(task => (
                                    <div key={task.id} className="bg-secondary/50 p-2 rounded text-sm flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity cursor-pointer">
                                        <CheckCircle2 className={cn("w-3 h-3", task.status === 'done' ? "text-green-500" : "text-muted-foreground")} />
                                        <span className={cn("truncate", task.status === 'done' && "line-through text-muted-foreground")}>
                                            {task.title}
                                        </span>
                                    </div>
                                ))}

                                {dayEvents.length === 0 && dayTasks.length === 0 && !isLoadingEvents && (
                                    <div className="text-center py-4 opacity-30 text-xs">
                                        Sem eventos
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
