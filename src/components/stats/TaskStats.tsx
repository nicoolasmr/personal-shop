import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Circle, Clock, ListTodo } from 'lucide-react';

import { TaskWithSubtasks } from '@/types/tasks';

interface TaskStatsProps {
    tasks: TaskWithSubtasks[];
}

export const TaskStats = ({ tasks }: TaskStatsProps) => {
    if (!tasks || tasks.length === 0) {
        return (
            <Card className="mt-4">
                <CardContent className="p-8 text-center text-muted-foreground">
                    Nenhuma tarefa cadastrada para análise.
                </CardContent>
            </Card>
        );
    }

    const completedTasks = tasks.filter(t => t.status === 'done').length;
    const pendingTasks = tasks.length - completedTasks;
    const completionRate = Math.round((completedTasks / tasks.length) * 100);

    const pieData = [
        { name: 'Concluídas', value: completedTasks, color: '#10b981' },
        { name: 'Pendentes', value: pendingTasks, color: '#f43f5e' }
    ];

    // Logic for "Tasks by Priority" if available, else just a status summary
    const statusData = [
        { name: 'Concluídas', count: completedTasks },
        { name: 'Pendentes', count: pendingTasks }
    ];

    return (
        <div className="space-y-6 mt-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between">
                        <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Total</CardTitle>
                        <ListTodo className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                        <div className="text-2xl font-bold">{tasks.length}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between">
                        <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Concluídas</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                        <div className="text-2xl font-bold text-emerald-600">{completedTasks}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between">
                        <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Pendentes</CardTitle>
                        <Circle className="h-4 w-4 text-rose-500" />
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                        <div className="text-2xl font-bold text-rose-600">{pendingTasks}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between">
                        <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Taxa</CardTitle>
                        <Clock className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                        <div className="text-2xl font-bold text-indigo-600">{completionRate}%</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Distribuição de Status</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Volume de Tarefas</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={statusData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none' }}
                                />
                                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
