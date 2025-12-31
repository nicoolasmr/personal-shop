import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as CalendarIcon, MapPin, Video } from 'lucide-react';
import { useCalendarEvents } from '@/hooks/queries/useCalendar';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function AgendaHomeCard() {
    const navigate = useNavigate();
    const today = new Date();
    // Fetch current month and filter for today. Ideally API should support filtering by day range.
    // Reusing the month query for now as it's likely cached if user visited calendar, or efficient enough.
    const { data: events, isLoading } = useCalendarEvents(today.getFullYear(), today.getMonth() + 1);

    const todayEvents = events?.filter(e => isSameDay(new Date(e.start_at), today)) || [];
    const nextEvent = todayEvents.sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()).find(e => new Date(e.end_at) > new Date());

    return (
        <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Agenda Hoje</CardTitle>
                <CalendarIcon className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
                <div>
                    <div className="text-2xl font-bold">{todayEvents.length}</div>
                    <CardDescription className="text-xs mb-3">Eventos agendados</CardDescription>

                    {nextEvent ? (
                        <div className="bg-muted/30 p-2 rounded text-sm border-l-2 border-primary">
                            <p className="font-medium truncate">{nextEvent.title}</p>
                            <p className="text-xs text-muted-foreground">
                                {format(new Date(nextEvent.start_at), 'HH:mm')} - {format(new Date(nextEvent.end_at), 'HH:mm')}
                            </p>
                            {nextEvent.location && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1 truncate">
                                    {nextEvent.location.includes('(Vídeo)') ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                                    {nextEvent.location}
                                </p>
                            )}
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground italic">Nenhum evento próximo.</p>
                    )}
                </div>

                <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => navigate('/app/calendar')}>
                    Ver Agenda
                </Button>
            </CardContent>
        </Card>
    );
}
