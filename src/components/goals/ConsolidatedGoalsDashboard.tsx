import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Target, TrendingUp, Wallet, CheckCircle2, ShieldCheck } from 'lucide-react';

interface ConsolidatedGoalsDashboardProps {
    goals: any[];
    financeGoals: any[];
}

export const ConsolidatedGoalsDashboard = ({ goals, financeGoals }: ConsolidatedGoalsDashboardProps) => {
    const totalGoals = (goals?.length || 0) + (financeGoals?.length || 0);
    const doneGoals = (goals?.filter(g => g.status === 'done')?.length || 0);

    // Calculate average progress
    const goalsProgress = goals?.length > 0
        ? goals.reduce((acc, g) => acc + (Math.min(100, (g.current_value / (g.target_value || 1)) * 100)), 0) / goals.length
        : 0;

    const financeProgress = financeGoals?.length > 0
        ? financeGoals.reduce((acc, g) => acc + (Math.min(100, (g.current_amount / (g.target_amount || 1)) * 100)), 0) / financeGoals.length
        : 0;

    const globalProgress = totalGoals > 0
        ? (goalsProgress * (goals?.length || 0) + financeProgress * (financeGoals?.length || 0)) / totalGoals
        : 0;

    return (
        <div className="space-y-6 mt-6 animate-in fade-in duration-700">
            {/* Hero Progress Section */}
            <Card className="bg-gradient-to-br from-indigo-600 to-indigo-700 text-white border-none shadow-xl overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <ShieldCheck className="h-32 w-32" />
                </div>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white/90">
                        <TrendingUp className="h-5 w-5" />
                        Progresso Geral da Vida
                    </CardTitle>
                    <CardDescription className="text-white/60">
                        Média consolidada de todas as suas frentes
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-end justify-between">
                        <span className="text-5xl font-extrabold tracking-tighter">{Math.round(globalProgress)}%</span>
                        <span className="text-white/80 font-medium mb-1">{doneGoals}/{totalGoals} Concluídas</span>
                    </div>
                    <Progress value={globalProgress} className="h-3 bg-white/20" />
                </CardContent>
            </Card>

            {/* Breakdown Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Financial Health */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center justify-between">
                            Saúde Financeira
                            <Wallet className="h-4 w-4 text-primary" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Progresso nas Metas</span>
                            <span className="font-bold">{Math.round(financeProgress)}%</span>
                        </div>
                        <Progress value={financeProgress} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                            Com base em {financeGoals?.length || 0} metas ativas no módulo de finanças.
                        </p>
                    </CardContent>
                </Card>

                {/* Core Goals */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center justify-between">
                            Metas & Propósitos
                            <Target className="h-4 w-4 text-primary" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Progresso Médio</span>
                            <span className="font-bold">{Math.round(goalsProgress)}%</span>
                        </div>
                        <Progress value={goalsProgress} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                            Rastreando {goals?.length || 0} objetivos estratégicos.
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Success Section */}
            {doneGoals > 0 && (
                <Card className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                                Excelente trabalho!
                            </p>
                            <p className="text-xs text-emerald-700 dark:text-emerald-300">
                                Você já concluiu {doneGoals} objetivos importantes. Continue o ritmo!
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
