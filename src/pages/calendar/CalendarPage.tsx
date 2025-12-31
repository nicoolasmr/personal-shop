import { useState } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, startOfMonth, endOfMonth, getDay } from 'date-fns';
import { useCalendarEvents } from '@/hooks/queries/useCalendar';
import { CreateEventDialog } from '@/components/calendar/CreateEventDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, Video, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ptBR } from 'date-fns/locale';
import { CalendarEvent } from '@/services/calendar';

type ViewMode = 'month' | 'week' | 'day';

export default function CalendarPage() {
    const [date, setDate] = useState(new Date());
    const [view, setView] = useState<ViewMode>('month');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

    const { data: events, isLoading } = useCalendarEvents(date.getFullYear(), date.getMonth() + 1);

    const navigate = (direction: 'prev' | 'next') => {
        if (view === 'month') {
            setDate(direction === 'prev' ? subMonths(date, 1) : addMonths(date, 1));
        } else if (view === 'week') {
            setDate(direction === 'prev' ? subWeeks(date, 1) : addWeeks(date, 1));
        } else {
            setDate(direction === 'prev' ? subDays(date, 1) : addDays(date, 1));
        }
    };

    const getWeekDays = () => {
        const start = startOfWeek(date, { weekStartsOn: 0 }); // Domingo
        const end = endOfWeek(date, { weekStartsOn: 0 });
        return eachDayOfInterval({ start, end });
    };

    const getMonthDays = () => {
        const start = startOfWeek(startOfMonth(date), { weekStartsOn: 0 });
        const end = endOfWeek(endOfMonth(date), { weekStartsOn: 0 });
        return eachDayOfInterval({ start, end });
    };

    const getEventsForDay = (day: Date) => {
        return events?.filter(e => isSameDay(new Date(e.start_at), day)) || [];
    };

    // --- Renderers ---

    const renderMonth = () => {
        const days = getMonthDays();
        return (
            <div className="grid grid-cols-7 gap-1 lg:gap-2">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                    <div key={d} className="text-center text-sm font-medium py-2 text-muted-foreground bg-muted/30 rounded-t">{d}</div>
                ))}
                {days.map((day, idx) => {
                    const isCurrentMonth = day.getMonth() === date.getMonth();
                    const dayEvents = getEventsForDay(day);
                    return (
                        <div
                            key={day.toISOString()}
                            className={cn(
                                "min-h-[100px] p-1 lg:p-2 border rounded-md bg-background hover:bg-muted/10 transition-colors flex flex-col gap-1",
                                !isCurrentMonth && "opacity-50 bg-muted/20"
                            )}
                            onClick={() => { setDate(day); setView('day'); }}
                        >
                            <span className={cn("text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1", isSameDay(day, new Date()) && "bg-primary text-primary-foreground")}>
                                {day.getDate()}
                            </span>
                            {dayEvents.slice(0, 3).map(e => (
                                <div
                                    key={e.id}
                                    className="text-[10px] truncate bg-primary/10 text-primary px-1 py-0.5 rounded cursor-pointer hover:bg-primary/20"
                                    onClick={(event) => { event.stopPropagation(); setSelectedEvent(e); }}
                                >
                                    {new Date(e.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} {e.title}
                                </div>
                            ))}
                            {dayEvents.length > 3 && (
                                <div className="text-[10px] text-muted-foreground pl-1">
                                    +{dayEvents.length - 3} mais
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        )
    };

    const renderWeek = () => {
        const days = getWeekDays();
        return (
            <div className="grid grid-cols-7 gap-2 h-full min-h-[500px]">
                {days.map(day => {
                    const dayEvents = getEventsForDay(day);
                    return (
                        <div key={day.toISOString()} className="flex flex-col border rounded-md h-full bg-background">
                            <div className={cn("p-2 text-center border-b font-medium bg-muted/30", isSameDay(day, new Date()) && "text-primary")}>
                                <div className="text-xs uppercase opacity-70">{format(day, 'EEE', { locale: ptBR })}</div>
                                <div className="text-lg">{format(day, 'dd')}</div>
                            </div>
                            <div className="flex-1 p-1 space-y-2 overflow-y-auto">
                                {dayEvents.map(e => (
                                    <div
                                        key={e.id}
                                        className="p-2 bg-primary/10 border border-primary/20 rounded shadow-sm text-xs cursor-pointer hover:bg-primary/15 transition-colors"
                                        onClick={() => setSelectedEvent(e)}
                                    >
                                        <div className="font-semibold text-primary mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis">{e.title}</div>
                                        <div className="flex items-center gap-1 opacity-80">
                                            <Clock className="h-3 w-3" />
                                            {format(new Date(e.start_at), 'HH:mm')} - {format(new Date(e.end_at), 'HH:mm')}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        )
    };

    const renderDay = () => {
        const dayEvents = getEventsForDay(date);
        return (
            <div className="max-w-3xl mx-auto w-full">
                <Card className="min-h-[500px]">
                    <CardHeader className="text-center border-b bg-muted/20">
                        <CardTitle className="flex flex-col items-center">
                            <span className="text-4xl font-bold">{format(date, 'dd')}</span>
                            <span className="text-lg font-normal text-muted-foreground capitalize">{format(date, 'EEEE', { locale: ptBR })}</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        {dayEvents.length === 0 ? (
                            <div className="text-center py-20 text-muted-foreground">
                                <CalendarIcon className="h-16 w-16 mx-auto mb-4 opacity-10" />
                                <p>Nenhum evento para este dia.</p>
                                <Button variant="outline" className="mt-4" onClick={() => setIsCreateOpen(true)}>Adicionar Evento</Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {dayEvents.map(e => (
                                    <div key={e.id} className="flex gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setSelectedEvent(e)}>
                                        <div className="w-16 flex flex-col items-center justify-center text-sm font-medium text-muted-foreground border-r pr-4">
                                            <div>{format(new Date(e.start_at), 'HH:mm')}</div>
                                            <div className="text-xs opacity-50">{format(new Date(e.end_at), 'HH:mm')}</div>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-lg">{e.title}</h4>
                                            {e.location && (
                                                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                                    {e.location.includes('Vídeo') ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                                                    {e.location}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        )
    };

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] overflow-hidden space-y-4">
            {/* Header */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4 p-1">
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold capitalize min-w-[200px]">
                        {view === 'month' && format(date, 'MMMM yyyy', { locale: ptBR })}
                        {view === 'week' && `Semana ${format(startOfWeek(date), 'dd/MM')} - ${format(endOfWeek(date), 'dd/MM')}`}
                        {view === 'day' && format(date, 'dd MMM yyyy', { locale: ptBR })}
                    </h1>
                    <div className="flex items-center bg-muted rounded-md p-0.5 border">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate('prev')}><ChevronLeft className="h-4 w-4" /></Button>
                        <Button variant="ghost" className="h-7 text-xs px-2" onClick={() => setDate(new Date())}>Hoje</Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate('next')}><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto">
                    <div className="flex bg-muted p-1 rounded-md mr-2">
                        <Button variant={view === 'month' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('month')}>Mês</Button>
                        <Button variant={view === 'week' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('week')}>Semana</Button>
                        <Button variant={view === 'day' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('day')}>Dia</Button>
                    </div>
                    <Button onClick={() => setIsCreateOpen(true)} size="sm">
                        <Plus className="mr-2 h-4 w-4" /> Novo Evento
                    </Button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto min-h-0 bg-background/50 rounded-lg border p-4 shadow-sm">
                {isLoading ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground">Carregando agenda...</div>
                ) : (
                    <>
                        {view === 'month' && renderMonth()}
                        {view === 'week' && renderWeek()}
                        {view === 'day' && renderDay()}
                    </>
                )}
            </div>

            <CreateEventDialog
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                defaultDate={date}
            />

            {/* Event Details Dialog (Inline for now) */}
            <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedEvent?.title}</DialogTitle>
                        <div className="flex items-center gap-2 mt-2">
                            <span className={cn("px-2 py-0.5 rounded textxs font-medium bg-primary/10 text-primary")}>
                                {selectedEvent?.source === 'system' ? 'Automático' : 'Manual'}
                            </span>
                        </div>
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
                                {selectedEvent.location.includes('Vídeo') ? <Video className="h-5 w-5 text-muted-foreground" /> : <MapPin className="h-5 w-5 text-muted-foreground" />}
                                <div className="text-sm">{selectedEvent.location}</div>
                            </div>
                        )}
                        {selectedEvent?.description && (
                            <div className="bg-muted/30 p-3 rounded-md text-sm whitespace-pre-wrap">
                                {selectedEvent.description}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        {/* TODO: Add Edit/Delete Buttons logic here if needed */}
                        <Button variant="outline" onClick={() => setSelectedEvent(null)}>Fechar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
