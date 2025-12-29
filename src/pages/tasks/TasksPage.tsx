
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ListChecks } from 'lucide-react';

export default function TasksPage() {
    return (
        <div className="space-y-6">
            <div><h1 className="text-2xl font-bold text-foreground">Tarefas</h1><p className="text-muted-foreground">Gerencie suas tarefas e pendências</p></div>
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2"><ListChecks className="h-5 w-5 text-purple-500" /><CardTitle>Quadro de Tarefas</CardTitle></div>
                    <CardDescription>Visualize suas tarefas em Kanban ou Lista</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12 text-muted-foreground">
                        <ListChecks className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhuma tarefa adicionada.</p>
                        <p className="text-sm">Funcionalidade será implementada em breve.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
