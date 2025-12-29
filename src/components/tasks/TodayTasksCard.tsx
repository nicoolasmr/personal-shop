import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ListChecks } from 'lucide-react';
import { useTodayPendingTasks } from '@/hooks/queries/useTasks';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function TodayTasksCard() {
    const { data: tasks, isLoading } = useTodayPendingTasks();
    const navigate = useNavigate();

    if (isLoading) return <Card><CardContent className="py-6">Carregando tarefas...</CardContent></Card>;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Tarefas de Hoje</CardTitle>
                <ListChecks className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{tasks?.length || 0}</div>
                <CardDescription className="text-xs">
                    {tasks && tasks.length > 0 ? 'Tarefas pendentes para hoje' : 'Tudo feito por hoje!'}
                </CardDescription>
                <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => navigate('/app/tasks')}>
                    Ver Tarefas
                </Button>
            </CardContent>
        </Card>
    );
}
