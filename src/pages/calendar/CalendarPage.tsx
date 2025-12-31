import { useState } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addMonths, subMonths, addDays, getDay, startOfMonth, endOfMonth } from 'date-fns';
import { useCalendarEvents } from '@/hooks/queries/useCalendar';
import { CreateEventDialog } from '@/components/calendar/CreateEventDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, Video, Plus, CheckCircle2, User, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ptBR } from 'date-fns/locale';
import { CalendarEvent } from '@/services/calendar';

export default function CalendarPage() {
    const [date, setDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

    // Fetch events for the current month view
    const { data: events, isLoading } = useCalendarEvents(date.getFullYear(), date.getMonth() + 1);

    const navigate = (direction: 'prev' | 'next') => {
        setDate(direction === 'prev' ? subMonths(date, 1) : addMonths(date, 1));
    };

    const getMonthDays = () => {
        const start = startOfWeek(startOfMonth(date), { weekStartsOn: 0 });
        const end = endOfWeek(endOfMonth(date), { weekStartsOn: 0 });
        return eachDayOfInterval({ start, end });
    };

    const getEventsForDay = (day: Date) => {
        return events?.filter(e => isSameDay(new Date(e.start_at), day)) || [];
    };

    const selectedDayEvents = getEventsForDay(selectedDate);
    const monthdays = getMonthDays();
    const weeks = [];
    let week = [];
    for (let day of monthdays) {
        week.push(day);
        if (week.length === 7) {
            weeks.push(week);
            week = [];
        }
    }

    // Metrics (Mocked based on screenshot logic or available data)
    const monthEvents = events || [];
    const meetingsCount = monthEvents.filter(e => e.title.toLowerCase().includes('reunião') || e.title.toLowerCase().includes('meet')).length;
    // We don't have tasks here, mock 0 or fetch tasks if we wanted to be 100% accurate, but context is calendar
    const personalCount = monthEvents.filter(e => !e.org_id).length; // Assuming personal events might lack org_id or similar logic, for now simple count

    return (
        <div className="flex flex-col h-full space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold">Agenda</h1>
                    <p className="text-muted-foreground">Gerencie seus eventos e compromissos</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2">
                        <CalendarIcon className="h-4 w-4" /> Conectar Google
                    </Button>
                    <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                        <Plus className="h-4 w-4" /> Novo Evento
                    </Button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-[500px]">
                {/* Left Side: Calendar Grid */}
                <Card className="flex-1 flex flex-col">
                    <div className="flex items-center justify-between p-4 border-b">
                        <Button variant="ghost" size="icon" onClick={() => navigate('prev')}><ChevronLeft className="h-4 w-4" /></Button>
                        <h2 className="text-xl font-semibold capitalize text-center w-full">
                            {format(date, 'MMMM yyyy', { locale: ptBR })}
                        </h2>
                        <Button variant="ghost" size="icon" onClick={() => navigate('next')}><ChevronRight className="h-4 w-4" /></Button>
                    </div>

                    <div className="flex-1 p-4">
                        <div className="grid grid-cols-7 mb-2">
                            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                                <div key={d} className="text-center text-sm font-medium text-muted-foreground py-2">{d}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 auto-rows-fr gap-1 h-[calc(100%-2rem)]">
                            {monthdays.map(day => {
                                const isCurrentMonth = day.getMonth() === date.getMonth();
                                const isToday = isSameDay(day, new Date());
                                const isSelected = isSameDay(day, selectedDate);
                                const dayEvts = getEventsForDay(day);

                                return (
                                    <div
                                        key={day.toISOString()}
                                        onClick={() => setSelectedDate(day)}
                                        className={cn(
                                            "min-h-[80px] p-2 border rounded-md cursor-pointer transition-all flex flex-col items-center justify-start gap-1 relative",
                                            !isCurrentMonth ? "opacity-30 bg-muted/20" : "hover:border-primary/50",
                                            isSelected ? "ring-2 ring-primary border-primary bg-primary/5" : "bg-card",
                                            isToday && !isSelected && "border-blue-300 bg-blue-50/50"
                                        )}
                                    >
                                        <span className={cn("text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full", isToday && "bg-blue-600 text-white")}>
                                            {day.getDate()}
                                        </span>
                                        <div className="w-full space-y-1">
                                            {dayEvts.slice(0, 2).map(e => (
                                                <div key={e.id} className="h-1.5 w-full bg-blue-200 dark:bg-blue-900 rounded-full" />
                                            ))}
                                            {dayEvts.length > 2 && <div className="h-1.5 w-2 mx-auto bg-gray-300 rounded-full" />}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </Card>

                {/* Right Side: Selected Day Details */}
                <Card className="w-full lg:w-[350px] flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                        <div className="space-y-1">
                            <CardTitle className="capitalize">{format(selectedDate, 'dd ')}de {format(selectedDate, 'MMMM', { locale: ptBR })}</CardTitle>
                            <div className="text-sm text-muted-foreground capitalize">{format(selectedDate, 'EEEE', { locale: ptBR })}</div>
                        </div>
                        <span className="text-xs text-muted-foreground">{selectedDayEvents.length} eventos</span>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                        {selectedDayEvents.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground text-center">
                                <CalendarIcon className="h-16 w-16 mb-4 opacity-20" />
                                <p className="mb-2 font-medium">Nenhum evento neste dia</p>
                                <p className="text-xs mb-6 max-w-[200px]">Clique no botão abaixo para criar seu primeiro evento</p>
                                <Button variant="outline" className="w-full border-dashed border-2 hover:border-primary text-primary hover:bg-primary/5" onClick={() => setIsCreateOpen(true)}>
                                    + Adicionar evento
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <Button variant="outline" className="w-full border-dashed border-2 text-primary hover:bg-primary/5 mb-2" onClick={() => setIsCreateOpen(true)}>
                                    + Adicionar evento
                                </Button>
                                {selectedDayEvents.map(e => (
                                    <div
                                        key={e.id}
                                        className="p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors space-y-2 shadow-sm"
                                        onClick={() => setSelectedEvent(e)}
                                    >
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-semibold text-sm line-clamp-2">{e.title}</h4>
                                            <span className="text-xs font-mono bg-secondary px-1 py-0.5 rounded">{format(new Date(e.start_at), 'HH:mm')}</span>
                                        </div>
                                        {e.location && (
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <MapPin className="h-3 w-3" /> {e.location}
                                            </div>
                                        )}
                                        <div className="flex gap-2 text-[10px] text-muted-foreground pt-1">
                                            <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded">Trabalho</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Bottom Metrics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                            <User className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold">{meetingsCount}</div>
                            <div className="text-xs text-muted-foreground font-medium">Reuniões este mês</div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                            <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold">0</div>
                            <div className="text-xs text-muted-foreground font-medium">Tarefas agendadas</div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                            <CalendarIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold">{personalCount}</div>
                            <div className="text-xs text-muted-foreground font-medium">Eventos pessoais</div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                            <Timer className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold">8h</div>
                            <div className="text-xs text-muted-foreground font-medium">Tempo ocupado</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <CreateEventDialog
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                defaultDate={selectedDate}
            />

            {/* Event Details Dialog Reuse */}
            <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedEvent?.title}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <div className="font-medium text-sm">
                                    {selectedEvent && format(new Date(selectedEvent.start_at), 'PPP', { locale: ptBR })}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {selectedEvent && format(new Date(selectedEvent.start_at), 'HH:mm')} -
                                    {selectedEvent && format(new Date(selectedEvent.end_at), 'HH:mm')}
                                </div>
                            </div>
                        </div>
                        {selectedEvent?.location && (
                            <div className="flex items-center gap-3">
                                <MapPin className="h-5 w-5 text-muted-foreground" />
                                <div className="text-sm">{selectedEvent.location}</div>
                            </div>
                        )}
                        {selectedEvent?.description && (
                            <div className="bg-muted/30 p-3 rounded-md text-sm whitespace-pre-wrap">
                                {selectedEvent.description}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
