import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, ChevronRight, Check, Flame } from 'lucide-react';
import { useGoals } from '@/hooks/useGoals';
import { useHabits, useToggleCheckin } from '@/hooks/useHabits';
import { calculateProgress } from '@/types/goals';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function GoalsSummaryCard() {
    const navigate = useNavigate();
    const { data: goals, isLoading } = useGoals('active'); // status='active'
    const { data: habits } = useHabits();
    const toggleCheckin = useToggleCheckin();
    const today = new Date().toISOString().split('T')[0];
    const goalsWithHabits = goals?.filter(g => g.linked_habit_id).slice(0, 3) || [];
    const habitsMap = new Map(habits?.map(h => [h.id, h]) || []);

    const handleToggle = (habitId: string) => { toggleCheckin.mutate({ habitId, date: today }); };

    if (isLoading) return <Card><CardContent className="py-8 text-center text-muted-foreground">Carregando...</CardContent></Card>;

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2"><Target className="h-5 w-5 text-primary" />Metas Ativas</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/app/goals')} className="text-xs">Ver todas<ChevronRight className="h-3 w-3 ml-1" /></Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {goalsWithHabits.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                        Nenhuma meta com hábito vinculado.<Button variant="link" size="sm" onClick={() => navigate('/app/goals')} className="block mx-auto mt-1">Criar meta</Button>
                    </div>
                ) : (
                    goalsWithHabits.map((goal) => {
                        const habit = habitsMap.get(goal.linked_habit_id!);
                        const isCheckedToday = habit?.checkins?.some(c => c.checkin_date === today && c.completed);
                        const progress = calculateProgress(goal);
                        const streak = habit?.checkins?.filter(c => c.completed).length || 0;

                        return (
                            <div key={goal.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                <button onClick={() => habit && handleToggle(habit.id)} disabled={!habit || toggleCheckin.isPending}
                                    className={cn("h-8 w-8 rounded-full flex items-center justify-center transition-all shrink-0",
                                        isCheckedToday ? "bg-green-500 text-white" : "border-2 border-muted-foreground/30 hover:border-primary hover:bg-primary/10")}>
                                    {isCheckedToday && <Check className="h-4 w-4" />}
                                </button>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-medium truncate">{goal.title}</span>
                                        {streak > 0 && <Badge variant="secondary" className="text-xs gap-0.5 shrink-0"><Flame className="h-3 w-3 text-orange-500" />{streak}</Badge>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Progress value={progress} className="h-1.5 flex-1" />
                                        <span className="text-xs text-muted-foreground shrink-0">{progress}%</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                {goals && goals.length > 3 && <div className="text-center text-xs text-muted-foreground pt-1">+{goals.length - 3} outras metas</div>}
            </CardContent>
        </Card>
    );
}
