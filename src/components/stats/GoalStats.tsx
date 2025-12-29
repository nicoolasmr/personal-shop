
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useGoals } from '@/hooks/useGoals';
import { isGoalOverdue, calculateProgress, Goal } from '@/types/goals';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AlertCircle, CheckCircle2, Target, TrendingUp } from 'lucide-react';

const COLORS = ['#22c55e', '#3b82f6', '#94a3b8', '#FF8042', '#8884d8'];

export function GoalStats() {
    const { data: activeGoals } = useGoals('active');
    const { data: doneGoals } = useGoals('done');
    const { data: archivedGoals } = useGoals('archived');

    const stats = useMemo(() => {
        const active = activeGoals || [];
        const done = doneGoals || [];
        const archived = archivedGoals || [];
        const all = [...active, ...done, ...archived];

        const totalActive = active.length;
        const totalDone = done.length;
        const overdue = active.filter(g => isGoalOverdue(g));
        const total = all.length;

        // Success rate calculation
        const successRate = total > 0 ? Math.round((totalDone / total) * 100) : 0;

        // Avg progress calculation (only for active goals to reflect current momentum)
        const avgProgress = active.length > 0
            ? Math.round(active.reduce((acc, g) => acc + calculateProgress(g), 0) / active.length)
            : 0;

        // By Type histogram
        const byTypeMap = all.reduce((acc, g) => {
            acc[g.type] = (acc[g.type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const byType = Object.entries(byTypeMap).map(([name, value]) => ({ name, value }));

        // Status distribution
        const statusData = [
            { name: 'Concluídas', value: totalDone },
            { name: 'Ativas', value: totalActive },
            { name: 'Arquivadas', value: archived.length },
        ].filter(d => d.value > 0);

        return { totalActive, totalDone, overdue, successRate, avgProgress, byType, statusData };
    }, [activeGoals, doneGoals, archivedGoals]);

    return (
        <div className="space-y-6 animate-in fade-in-50">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Metas Ativas</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalActive}</div>
                        <p className="text-xs text-muted-foreground">Em progresso</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalDone}</div>
                        <p className="text-xs text-muted-foreground">Objetivos alcançados</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.successRate}%</div>
                        <p className="text-xs text-muted-foreground">Global</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Progresso Médio</CardTitle>
                        <TrendingUp className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.avgProgress}%</div>
                        <p className="text-xs text-muted-foreground">Nas metas ativas</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Distribuição por Status</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {stats.statusData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={stats.statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5} dataKey="value">
                                        {stats.statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">Sem dados suficientes</div>
                        )}
                    </CardContent>
                </Card>

                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Metas por Tipo</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {stats.byType.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.byType}>
                                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <Tooltip cursor={{ fill: 'transparent' }} />
                                    <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">Sem dados suficientes</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {stats.overdue.length > 0 && (
                <Card className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                    <CardHeader className="flex flex-row items-center gap-2 pb-2">
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        <CardTitle className="text-base text-red-900 dark:text-red-200">Atenção: Metas Atrasadas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="list-disc list-inside text-sm text-red-800 dark:text-red-300">
                            {stats.overdue.map(g => (
                                <li key={g.id}>{g.title} - Venceu em {new Date(g.due_date!).toLocaleDateString()}</li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
