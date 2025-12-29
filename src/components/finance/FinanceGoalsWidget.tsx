import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card-index';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PiggyBank, Target, TrendingUp, AlertTriangle, Shield, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '@/hooks/useFinance';
import { formatCurrency, type FinanceGoalType } from '@/types/finance'; // Removed FINANCE_GOAL_TYPE_LABELS from imports as it was not in types/finance based on earlier files

const GOAL_TYPE_ICONS: Record<FinanceGoalType, React.ReactNode> = {
    savings: <PiggyBank className="h-4 w-4" />,
    expense_limit: <AlertTriangle className="h-4 w-4" />,
    income_target: <TrendingUp className="h-4 w-4" />,
    emergency_fund: <Shield className="h-4 w-4" />,
};

const GOAL_TYPE_COLORS: Record<FinanceGoalType, string> = {
    savings: 'text-green-500 bg-green-500/10',
    expense_limit: 'text-orange-500 bg-orange-500/10',
    income_target: 'text-blue-500 bg-blue-500/10',
    emergency_fund: 'text-purple-500 bg-purple-500/10',
};

export function FinanceGoalsWidget() {
    const navigate = useNavigate();
    const { financeGoals, isLoading: goalsLoading } = useFinance(); // Adjusted destructured property name to match hook output
    const activeGoals = financeGoals.filter(g => g.is_active);
    const completedGoals = activeGoals.filter(g => {
        const progress = (g.current_amount / g.target_amount) * 100;
        return g.type !== 'expense_limit' ? progress >= 100 : false;
    });
    const topGoals = activeGoals.slice(0, 3);

    if (goalsLoading) return <Card><CardHeader className="pb-2"><Skeleton className="h-4 w-32" /></CardHeader><CardContent className="space-y-3"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></CardContent></Card>;

    if (activeGoals.length === 0) return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Metas Financeiras</CardTitle>
                <Target className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
                <div className="text-center py-4">
                    <PiggyBank className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground mb-3">Nenhuma meta financeira ativa</p>
                    <Button variant="outline" size="sm" onClick={() => navigate('/app/finance')}>Criar Meta</Button>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                    <CardTitle className="text-sm font-medium text-muted-foreground">Metas Financeiras</CardTitle>
                    <CardDescription className="text-xs">{completedGoals.length} de {activeGoals.length} concluídas</CardDescription>
                </div>
                <Target className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent className="space-y-3">
                {topGoals.map((goal) => {
                    const progress = Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100));
                    const isComplete = goal.type !== 'expense_limit' && progress >= 100;
                    const isExceeded = goal.type === 'expense_limit' && progress >= 100;
                    const isWarning = goal.type === 'expense_limit' && progress >= 80 && progress < 100;

                    return (
                        <div key={goal.id} className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className={`p-1 rounded ${GOAL_TYPE_COLORS[goal.type]}`}>{GOAL_TYPE_ICONS[goal.type]}</div>
                                    <span className="text-sm font-medium truncate">{goal.name}</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    {isComplete && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                                    {isExceeded && <Badge variant="destructive" className="text-xs">Excedido</Badge>}
                                    {isWarning && <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">Atenção</Badge>}
                                    <span className="text-xs font-medium">{progress}%</span>
                                </div>
                            </div>
                            <Progress value={progress} className={`h-1.5 ${isExceeded ? '[&>div]:bg-red-500' : isWarning ? '[&>div]:bg-orange-500' : ''}`} />
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{formatCurrency(goal.current_amount)}</span>
                                <span>{formatCurrency(goal.target_amount)}</span>
                            </div>
                        </div>
                    );
                })}
                {activeGoals.length > 3 && <p className="text-xs text-muted-foreground text-center">+{activeGoals.length - 3} metas adicionais</p>}
                <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => navigate('/app/finance')}>Ver Todas as Metas<ArrowRight className="h-4 w-4 ml-2" /></Button>
            </CardContent>
        </Card>
    );
}
