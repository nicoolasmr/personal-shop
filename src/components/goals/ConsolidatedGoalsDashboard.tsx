
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target } from 'lucide-react';

export const ConsolidatedGoalsDashboard = ({ goals, financeGoals }: any) => {
    const totalGoals = (goals?.length || 0) + (financeGoals?.length || 0);
    return (
        <Card className="mt-4">
            <CardHeader><CardTitle className="flex items-center gap-2"><Target className="h-5 w-5" /> Visão Geral</CardTitle></CardHeader>
            <CardContent>
                <div className="text-center py-8">
                    <p>Total de Metas Rastreadas: {totalGoals}</p>
                    <p className="text-muted-foreground text-sm mt-2">Gráficos de progresso consolidado em desenvolvimento.</p>
                </div>
            </CardContent>
        </Card>
    );
};
