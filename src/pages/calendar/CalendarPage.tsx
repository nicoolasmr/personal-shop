import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as CalendarIcon } from 'lucide-react';

export default function CalendarPage() {
    return (
        <div className="space-y-6">
            <div><h1 className="text-2xl font-bold text-foreground">Agenda</h1><p className="text-muted-foreground">Visualize seus eventos e compromissos</p></div>
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2"><CalendarIcon className="h-5 w-5 text-orange-500" /><CardTitle>Minha Agenda</CardTitle></div>
                    <CardDescription>Aqui você poderá visualizar e gerenciar seus eventos</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12 text-muted-foreground">
                        <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhum evento agendado.</p>
                        <p className="text-sm">Funcionalidade será implementada nas próximas sprints.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
