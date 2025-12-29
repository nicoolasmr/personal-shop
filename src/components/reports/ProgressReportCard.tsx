import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3, Download } from 'lucide-react';
import { useGamification } from '@/hooks/useGamification';

type ViewMode = 'weekly' | 'monthly';

export function ProgressReportCard() {
    const [viewMode, setViewMode] = useState<ViewMode>('weekly');
    const { habits } = useGamification();

    const generateWeeklyData = () => {
        const data = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today); date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
            const completed = habits.reduce((acc, h) => acc + (h.checkins?.some(c => c.checkin_date === dateStr && c.completed) ? 1 : 0), 0);
            data.push({ name: dayNames[date.getDay()], completed, total: habits.length, percent: habits.length > 0 ? Math.round((completed / habits.length) * 100) : 0 });
        }
        return data;
    };

    const generateMonthlyData = () => {
        const data = [];
        const today = new Date();
        for (let week = 3; week >= 0; week--) {
            const weekStart = new Date(today); weekStart.setDate(today.getDate() - (week * 7) - 6);
            let weekCompleted = 0, weekTotal = 0;
            for (let day = 0; day < 7; day++) {
                const date = new Date(weekStart); date.setDate(weekStart.getDate() + day);
                const dateStr = date.toISOString().split('T')[0];
                habits.forEach(h => { weekTotal++; if (h.checkins?.some(c => c.checkin_date === dateStr && c.completed)) weekCompleted++; });
            }
            data.push({ name: `Sem ${4 - week}`, completed: weekCompleted, total: weekTotal, percent: weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0 });
        }
        return data;
    };

    const data = viewMode === 'weekly' ? generateWeeklyData() : generateMonthlyData();

    return (
        <Card className="col-span-full lg:col-span-2">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" />Relatório de Progresso</CardTitle>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center rounded-lg border p-1">
                            <Button variant={viewMode === 'weekly' ? 'secondary' : 'ghost'} size="sm" className="h-7 text-xs" onClick={() => setViewMode('weekly')}>Semanal</Button>
                            <Button variant={viewMode === 'monthly' ? 'secondary' : 'ghost'} size="sm" className="h-7 text-xs" onClick={() => setViewMode('monthly')}>Mensal</Button>
                        </div>
                        <Button variant="outline" size="sm" className="h-8" onClick={() => window.print()}><Download className="h-4 w-4 mr-1" />PDF</Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {habits.length === 0 ? (
                    <div className="h-48 flex items-center justify-center text-muted-foreground">Crie metas com hábitos para ver o relatório</div>
                ) : (
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={data}>
                            <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                            <YAxis axisLine={false} tickLine={false} fontSize={12} tickFormatter={(v) => `${v}%`} />
                            <Tooltip content={({ active, payload }) => active && payload?.length ? (
                                <div className="bg-popover border rounded-lg p-2 text-sm shadow-lg">
                                    <p className="font-medium">{payload[0].payload.name}</p>
                                    <p className="text-muted-foreground">{payload[0].payload.completed}/{payload[0].payload.total} ({payload[0].value}%)</p>
                                </div>
                            ) : null} />
                            <Bar dataKey="percent" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                    <div className="text-center"><div className="text-2xl font-bold text-primary">{data.reduce((acc, d) => acc + d.completed, 0)}</div><div className="text-xs text-muted-foreground">Check-ins</div></div>
                    <div className="text-center"><div className="text-2xl font-bold text-green-500">{Math.round(data.reduce((acc, d) => acc + d.percent, 0) / data.length)}%</div><div className="text-xs text-muted-foreground">Média</div></div>
                    <div className="text-center"><div className="text-2xl font-bold text-orange-500">{data.filter(d => d.percent === 100).length}</div><div className="text-xs text-muted-foreground">{viewMode === 'weekly' ? 'Dias' : 'Semanas'} 100%</div></div>
                </div>
            </CardContent>
        </Card>
    );
}
