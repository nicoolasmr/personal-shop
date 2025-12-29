import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Target, ListChecks, Flame, Zap, Calendar, Trophy } from 'lucide-react';
import { useGamification } from '@/hooks/useGamification';
import { cn } from '@/lib/utils';

export function WeeklyProgressCard() {
    const { weeklyStats, habits } = useGamification();
    const today = new Date().toISOString().split('T')[0];
    const todayCompleted = habits.filter(h => h.checkins?.some(c => c.checkin_date === today && c.completed)).length;
    const todayTotal = habits.length;
    const todayPercent = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0;

    const stats = [
        { label: 'Check-ins', value: weeklyStats.habitCheckins, icon: CheckCircle, color: 'text-green-500', bgColor: 'bg-green-500/10' },
        { label: 'Metas', value: weeklyStats.goalsProgressed, icon: Target, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
        { label: 'Tarefas', value: weeklyStats.tasksCompleted, icon: ListChecks, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
        { label: 'Streak', value: weeklyStats.streakDays, suffix: 'd', icon: Flame, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
    ];

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" />Progresso Semanal</CardTitle>
                    <Badge variant="secondary" className="gap-1"><Zap className="h-3 w-3" />+{weeklyStats.xpEarned} XP</Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Hoje</span>
                        <span className="text-sm text-muted-foreground">{todayCompleted}/{todayTotal} hábitos</span>
                    </div>
                    <div className="flex gap-1">
                        {Array.from({ length: todayTotal || 1 }).map((_, i) => (
                            <div key={i} className={cn("flex-1 h-2 rounded-full transition-colors", i < todayCompleted ? "bg-primary" : "bg-muted")} />
                        ))}
                    </div>
                    {todayPercent === 100 && <div className="mt-2 flex items-center gap-1 text-xs text-green-600"><Trophy className="h-3 w-3" />Dia perfeito!</div>}
                </div>
                <div className="grid grid-cols-4 gap-2">
                    {stats.map((stat) => (
                        <div key={stat.label} className={cn("p-2 rounded-lg text-center", stat.bgColor)}>
                            <stat.icon className={cn("h-4 w-4 mx-auto mb-1", stat.color)} />
                            <div className="text-lg font-bold">{stat.value}{stat.suffix}</div>
                            <div className="text-[10px] text-muted-foreground">{stat.label}</div>
                        </div>
                    ))}
                </div>
                {weeklyStats.perfectDays > 0 && <div className="text-center text-sm text-muted-foreground"><span className="font-medium text-foreground">{weeklyStats.perfectDays}</span> dias perfeitos esta semana</div>}
            </CardContent>
        </Card>
    );
}
