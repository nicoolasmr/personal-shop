import { useTenant } from '@/hooks/useTenant';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { TodayTasksCard } from '@/components/tasks/TodayTasksCard';
import { FinanceHomeCard } from '@/components/finance/FinanceHomeCard';
import { FinanceGoalsWidget } from '@/components/home/FinanceGoalsWidget';
import { LevelProgressCard } from '@/components/home/LevelProgressCard';
import { WeeklyProgressCard } from '@/components/home/WeeklyProgressCard';
import { GoalsSummaryCard } from '@/components/home/GoalsSummaryCard';
import { ProgressReportCard } from '@/components/home/ProgressReportCard';
import { AchievementsShowcase } from '@/components/home/AchievementsShowcase';
import { AgendaHomeCard } from '@/components/calendar/AgendaHomeCard';

export default function Home() {
    const { profile, org, loading, error } = useTenant();

    if (error) return <div className="text-center py-12"><p className="text-destructive">Erro ao carregar dados: {error}</p></div>;

    return (
        <div className="space-y-6">
            <div>
                {loading ? <Skeleton className="h-8 w-64" /> : <h1 className="text-2xl font-bold text-foreground">Olá, {profile?.full_name || 'Usuário'}! 👋</h1>}
                <p className="text-muted-foreground mt-1">Aqui está o resumo do seu progresso</p>
            </div>

            <LevelProgressCard />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <GoalsSummaryCard />
                <WeeklyProgressCard />
                <AchievementsShowcase />
                <TodayTasksCard />
                <FinanceHomeCard />
                <FinanceGoalsWidget />
                <AgendaHomeCard />
            </div>

            <ProgressReportCard />

            <Card>
                <CardHeader><CardTitle>Organização Atual</CardTitle><CardDescription>Informações do seu workspace</CardDescription></CardHeader>
                <CardContent>
                    {loading ? <div className="space-y-2"><Skeleton className="h-4 w-48" /><Skeleton className="h-4 w-32" /></div> : (
                        <div className="space-y-2"><p><strong>Nome:</strong> {org?.name || 'N/A'}</p><p><strong>Email:</strong> {profile?.email || 'N/A'}</p></div>
                    )}
                </CardContent>
            </Card>
        </div >
    );
}
