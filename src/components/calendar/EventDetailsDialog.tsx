import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CalendarEvent } from '@/services/calendar';
import { Clock, MapPin, Trash, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EventDetailsDialogProps {
    event: CalendarEvent | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onEdit: (event: CalendarEvent) => void;
    onDelete?: (eventId: string) => void;
}

export function EventDetailsDialog({ event, open, onOpenChange, onEdit, onDelete }: EventDetailsDialogProps) {
    if (!event) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: event.color || '#3b82f6' }} />
                        <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{event.all_day ? 'Dia Inteiro' : 'Detalhes do Evento'}</span>
                    </div>
                    <DialogTitle className="text-xl leading-none">{event.title}</DialogTitle>
                </DialogHeader>

                <div className="space-y-5 py-4">
                    <div className="flex items-start gap-3 text-sm">
                        <Clock className="h-4 w-4 mt-0.5 text-primary" />
                        <div className="grid gap-0.5">
                            {event.all_day ? (
                                <p className="font-medium">{format(new Date(event.start_at), "EEEE, dd 'de' MMMM", { locale: ptBR })}</p>
                            ) : (
                                <>
                                    <p className="font-medium capitalize">{format(new Date(event.start_at), "EEEE, dd 'de' MMMM", { locale: ptBR })}</p>
                                    <p className="text-muted-foreground">
                                        {format(new Date(event.start_at), "HH:mm")} - {format(new Date(event.end_at), "HH:mm")}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>

                    {event.location && (
                        <div className="flex items-start gap-3 text-sm">
                            <MapPin className="h-4 w-4 mt-0.5 text-primary" />
                            <p className="font-medium">{event.location}</p>
                        </div>
                    )}

                    {event.description && (
                        <div className="bg-muted/40 p-3 rounded-md text-sm border text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {event.description}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <div className="flex w-full justify-between items-center mt-2">
                        {onDelete && (
                            <Button
                                variant="ghost"
                                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 px-2"
                                onClick={() => {
                                    if (confirm('Tem certeza que deseja excluir este evento?')) onDelete(event.id);
                                }}
                            >
                                <Trash className="h-4 w-4 mr-2" /> Excluir
                            </Button>
                        )}
                        <Button onClick={() => onEdit(event)} className="ml-auto">
                            <Edit className="h-4 w-4 mr-2" /> Editar
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
