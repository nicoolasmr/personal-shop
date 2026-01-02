
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TransactionWithCategory, MonthlySummary, FinanceGoal } from '@/types/finance';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart as RechartsPieChart, Pie, Cell, Legend } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FinanceStatsProps {
    transactions: TransactionWithCategory[];
    summary: MonthlySummary;
    financeGoals: FinanceGoal[];
}

const COLORS = ['#10B981', '#F59E0B', '#3B82F6', '#EF4444', '#8B5CF6'];

export const FinanceStats = ({ transactions, summary, financeGoals }: FinanceStatsProps) => {
    // 1. Prepare Cash Flow Data (Daily Balance)
    // Group transactions by day and calculate cumulative balance or daily flow
    const dailyData = transactions.reduce((acc, t) => {
        const date = t.transaction_date;
        if (!acc[date]) {
            acc[date] = { date, income: 0, expense: 0 };
        }
        if (t.type === 'income') acc[date].income += Number(t.amount);
        else acc[date].expense += Number(t.amount);
        return acc;
    }, {} as Record<string, { date: string, income: number, expense: number }>);

    const chartData = Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date)).map(d => ({
        ...d,
        day: format(new Date(d.date), 'dd/MM'),
        balance: d.income - d.expense
    }));

    // 2. Prepare Category Data (Expenses only for pie chart usually)
    const categoryDataMap = transactions
        .filter(t => t.type === 'expense') // Usually we chart expenses breakdown
        .reduce((acc, t) => {
            const cat = t.category?.name || 'Outros';
            acc[cat] = (acc[cat] || 0) + Number(t.amount);
            return acc;
        }, {} as Record<string, number>);

    const pieData = Object.entries(categoryDataMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5); // Top 5 categories

    return (
        <div className="space-y-6 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Fluxo de Caixa (Diário)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                    <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} tickFormatter={(value) => `R$${value}`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                        formatter={(value: number) => [`R$ ${value.toFixed(2)}`, '']}
                                    />
                                    <Area type="monotone" dataKey="income" name="Receitas" stroke="#10B981" fillOpacity={1} fill="url(#colorIncome)" />
                                    <Area type="monotone" dataKey="expense" name="Despesas" stroke="#EF4444" fillOpacity={1} fill="url(#colorExpense)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                                Sem dados para exibir no período
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Despesas por Categoria</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsPieChart>
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
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} />
                                </RechartsPieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                                Nenhuma despesa registrada
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Simple Goals Summary List */}
            {financeGoals.length > 0 && (
                <Card>
                    <CardHeader><CardTitle>Metas Financeiras</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {financeGoals.map(goal => (
                                <div key={goal.id} className="flex justify-between items-center p-3 bg-muted/20 rounded-lg">
                                    <div>
                                        <div className="font-medium">{goal.name}</div>
                                        <div className="text-xs text-muted-foreground capitalize">{goal.type.replace('_', ' ')}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold">
                                            {goal.current_amount !== undefined ? `R$ ${goal.current_amount}` : '-'}
                                            <span className="text-muted-foreground font-normal text-xs ml-1">/ R$ {goal.target_amount}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
