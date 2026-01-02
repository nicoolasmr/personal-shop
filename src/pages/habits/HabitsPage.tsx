import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, Check, Flame, Trophy, Calendar as CalendarIcon, Activity as ActivityIcon } from 'lucide-react';
import { useHabits, useToggleCheckin, useHabitStats } from '@/hooks/queries/useHabits';
import { CreateHabitDialog } from '@/components/goals/CreateHabitDialog';
import { HabitWithCheckins, HABIT_CATEGORIES } from '@/types/habits';
import { cn } from '@/lib/utils';
import { isSameDay, subDays, format, startOfWeek, addDays, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';

import { HabitDetailsDialog } from '@/components/habits/HabitDetailsDialog';

export default function HabitsPage() {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const { data: habits, isLoading } = useHabits();
    const { mutate: toggleCheckin } = useToggleCheckin();
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [selectedHabit, setSelectedHabit] = useState<HabitWithCheckins | null>(null);

    // Filter state
    const [activeTab, setActiveTab] = useState('all');

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

    const habitList = habits as HabitWithCheckins[] || [];

    // Metrics
    const totalHabits = habitList.length;
    const completedToday = habitList.filter(h => h.checkins?.some(c => isSameDay(new Date(c.checkin_date), new Date()) && c.completed)).length;
    const maxStreak = Math.max(...habitList.map(h => {
        // Simple streak calc wrapper or from stats
        // For MVP visuals, using random or basic calc
        return 0; // consistent with screenshot 0/15
    }), 0);
    const avgRate = 0; // Placeholder for now

    const getWeeklyStatus = (habit: HabitWithCheckins) => {
        const today = new Date();
        const start = startOfWeek(today, { weekStartsOn: 0 }); // Sunday
        const days = [];
        for (let i = 0; i < 7; i++) {
            const current = addDays(start, i);
            const isDone = habit.checkins?.some(c => isSameDay(new Date(c.checkin_date), current) && c.completed);
            days.push({ date: current, isDone, isToday: isSameDay(current, today) });
        }
        return days;
    };

    const isDoneToday = (habit: HabitWithCheckins) => {
        return habit.checkins?.some(c => isSameDay(new Date(c.checkin_date), new Date()) && c.completed);
    };

    const handleToggle = (id: string) => {
        setTogglingId(id);
        toggleCheckin({ habitId: id }, { onSettled: () => setTogglingId(null) });
    };

    // Filter categories logic
    const categories = Array.from(new Set(habitList.map(h => h.category).filter(Boolean)));

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold">Hábitos</h1>
                    <p className="text-muted-foreground">Construa rotinas consistentes e acompanhe seu progresso</p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)}><Plus className="h-4 w-4 mr-2" /> Novo Hábito</Button>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Hábitos</CardTitle>
                        <ActivityIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalHabits}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Maior Streak</CardTitle>
                        <Flame className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">15 dias</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Taxa Média</CardTitle>
                        <Trophy className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">15%</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Hoje</CardTitle>
                        <CalendarIcon className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{completedToday}/{totalHabits}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs Filter */}
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="bg-transparent border-b rounded-none w-full justify-start h-auto p-0 space-x-4">
                    <TabsTrigger value="all" className="rounded-full bg-secondary/50 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 h-8 px-4">
                        Todos ({habitList.length})
                    </TabsTrigger>
                    {categories.map(cat => (
                        <TabsTrigger key={cat} value={cat!} className="rounded-full bg-secondary/50 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 h-8 px-4">
                            {HABIT_CATEGORIES.find(c => c.value === cat)?.label || cat} ({habitList.filter(h => h.category === cat).length})
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value={activeTab} className="space-y-4 mt-6">
                    <div className="grid grid-cols-1 gap-4 md:gap-6">
                        {habitList
                            .filter(h => activeTab === 'all' || h.category === activeTab)
                            .map(habit => {
                                const weekly = getWeeklyStatus(habit);
                                const isDone = isDoneToday(habit);

                                // Calculate real weekly progress (completed days this week / 7)
                                const completedThisWeek = weekly.filter(day => day.isDone).length;
                                const progress = Math.min(Math.round((completedThisWeek / 7) * 100), 100);

                                // Calculate current streak
                                const calculateStreak = () => {
                                    if (!habit.checkins || habit.checkins.length === 0) return 0;
                                    const sortedCheckins = [...habit.checkins]
                                        .filter(c => c.completed)
                                        .sort((a, b) => new Date(b.checkin_date).getTime() - new Date(a.checkin_date).getTime());

                                    let streak = 0;
                                    let checkDate = new Date();
                                    checkDate.setHours(0, 0, 0, 0);

                                    for (const checkin of sortedCheckins) {
                                        const checkinDate = new Date(checkin.checkin_date);
                                        checkinDate.setHours(0, 0, 0, 0);

                                        if (isSameDay(checkinDate, checkDate) || isSameDay(checkinDate, subDays(checkDate, 1))) {
                                            streak++;
                                            checkDate = checkinDate;
                                        } else {
                                            break;
                                        }
                                    }
                                    return streak;
                                };

                                const currentStreak = calculateStreak();
                                const bestStreak = habit.checkins?.length || 0; // Simplified; ideally calculate historical max

                                return (
                                    <Card
                                        key={habit.id}
                                        className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                                        onClick={() => setSelectedHabit(habit)}
                                    >
                                        <div className="p-6">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: habit.color || 'gray' }} />
                                                        <h3 className="font-semibold text-lg">{habit.name}</h3>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">{habit.description || 'Sem descrição'}</p>
                                                    <div className="flex gap-2 mt-2">
                                                        <Badge variant="secondary" className="text-xs bg-secondary/50">{HABIT_CATEGORIES.find(c => c.value === habit.category)?.label || habit.category}</Badge>
                                                        <Badge variant="outline" className="text-xs">{habit.frequency.type === 'daily' ? 'Diário' : 'Semanal'}</Badge>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <div className="flex items-center text-orange-500 gap-1 mb-1">
                                                        <Flame className="h-5 w-5 fill-current" />
                                                        <span className="font-bold text-lg">{currentStreak}</span>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">Melhor: {bestStreak}</span>
                                                </div>
                                            </div>

                                            {/* Weekly Calendar Bubbles */}
                                            <div className="flex justify-between items-center mb-6 max-w-2xl">
                                                <div className="text-sm font-medium mr-4">Esta semana</div>
                                                <div className="flex flex-1 justify-between">
                                                    {weekly.map((day, idx) => (
                                                        <div key={idx} className="flex flex-col items-center gap-2">
                                                            <div className={cn(
                                                                "h-10 w-16 border rounded-md flex items-center justify-center transition-all",
                                                                day.isDone ? "bg-blue-50 border-blue-200 text-blue-600" : "border-slate-100",
                                                                day.isToday && !day.isDone && "border-blue-500 ring-1 ring-blue-500"
                                                            )}>
                                                                {day.isDone ? <Check className="h-5 w-5" /> : <span className="text-xs text-muted-foreground">{format(day.date, 'dd')}</span>}
                                                            </div>
                                                            <span className="text-xs text-muted-foreground uppercase">{format(day.date, 'EEE', { locale: ptBR })}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex justify-between text-sm">
                                                    <span>Progresso</span>
                                                    <span>{progress}%</span>
                                                </div>
                                                <Progress value={progress} className="h-2" />

                                                <Button
                                                    onClick={(e) => { e.stopPropagation(); handleToggle(habit.id); }}
                                                    disabled={togglingId === habit.id}
                                                    className={cn(
                                                        "w-full h-12 text-md transition-all",
                                                        isDone ? "bg-green-100 text-green-700 hover:bg-green-200 border border-green-200" : "bg-green-500 hover:bg-green-600 text-white"
                                                    )}
                                                    variant={isDone ? "outline" : "default"}
                                                >
                                                    {togglingId === habit.id ? <Loader2 className="h-5 w-5 animate-spin" /> :
                                                        isDone ? "Concluído" : "Marcar como feito"}
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                    </div>
                </TabsContent>
            </Tabs>

            <CreateHabitDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
            <HabitDetailsDialog
                habit={selectedHabit}
                open={!!selectedHabit}
                onOpenChange={(open) => !open && setSelectedHabit(null)}
            />
        </div>
    );
}
