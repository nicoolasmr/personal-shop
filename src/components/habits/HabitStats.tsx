import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { HabitWithCheckins } from '@/types/habits';
import { calculateStreak, calculateWeeklyRate } from '@/services/habits';
import { Flame, Target, Calendar, PieChart as PieIcon } from 'lucide-react';

interface HabitStatsProps {
    habits: HabitWithCheckins[];
}

export const HabitStats = ({ habits }: HabitStatsProps) => {
    if (!habits || habits.length === 0) {
        return (
            <Card className="mt-4">
                <CardContent className="p-8 text-center text-muted-foreground">
                    Nenhum hábito cadastrado para análise.
                </CardContent>
            </Card>
        );
    }

    // 1. Calculate general stats
    const totalCompleted = habits.reduce((acc, h) => acc + h.checkins.filter(c => c.completed).length, 0);
    const averageWeeklyRate = Math.round(
        habits.reduce((acc, h) => acc + calculateWeeklyRate(h.checkins), 0) / habits.length
    );
    const bestStreak = Math.max(...habits.map(h => calculateStreak(h.checkins)), 0);

    // 2. Prepare data for Category Pie Chart
    const categoryDataMap = habits.reduce((acc, h) => {
        const cat = h.category || 'Outros';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const categoryData = Object.entries(categoryDataMap).map(([name, value]) => ({ name, value }));

    // 3. Prepare data for Weekly Progress Bar Chart (Last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().split('T')[0];
    });

    const dailyProgressData = last7Days.map(date => {
        const completedOnDay = habits.reduce((acc, h) => {
            const hasCheckin = h.checkins.some(c => c.checkin_date === date && c.completed);
            return acc + (hasCheckin ? 1 : 0);
        }, 0);

        return {
            name: new Date(date).toLocaleDateString('pt-BR', { weekday: 'short' }),
            completed: completedOnDay,
            total: habits.length
        };
    });

    const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981'];

    return (
        <div className="space-y-6 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/20">
                    <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-medium">Recorde Atual</CardTitle>
                        <Flame className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                        <div className="text-2xl font-bold text-orange-600">{bestStreak} dias</div>
                        <p className="text-xs text-muted-foreground">Maior sequência ativa</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-indigo-500/10 to-transparent border-indigo-500/20">
                    <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-medium">Frequência Semanal</CardTitle>
                        <Target className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                        <div className="text-2xl font-bold text-indigo-600">{averageWeeklyRate}%</div>
                        <p className="text-xs text-muted-foreground">Consistência média</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20">
                    <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-medium">Total Check-ins</CardTitle>
                        <Calendar className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                        <div className="text-2xl font-bold text-emerald-600">{totalCompleted}</div>
                        <p className="text-xs text-muted-foreground">Realizados (Histórico)</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Weekly Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-primary" />
                            Consistência (Últimos 7 dias)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px] pt-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dailyProgressData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                <Tooltip
                                    cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--background))',
                                        borderColor: 'hsl(var(--border))',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Bar dataKey="completed" fill="url(#colorGradient)" radius={[4, 4, 0, 0]} />
                                <defs>
                                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Categories Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <PieIcon className="h-4 w-4 text-primary" />
                            Distribuição por Categoria
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px] pt-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {categoryData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--background))',
                                        borderColor: 'hsl(var(--border))',
                                        borderRadius: '8px'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
