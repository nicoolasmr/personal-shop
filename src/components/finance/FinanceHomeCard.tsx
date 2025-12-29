import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';
import { useFinance } from '@/hooks/useFinance'; // Assuming this hook alias exists or will be created
import { formatCurrency } from '@/types/finance';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function FinanceHomeCard() {
    const { summary, isLoading } = useFinance();
    const navigate = useNavigate();

    if (isLoading) return <Card><CardContent className="py-6">Carregando finanças...</CardContent></Card>;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Atual</CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
                <div className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(summary.balance || 0)}
                </div>
                <CardDescription className="text-xs">
                    Receitas: {formatCurrency(summary.total_income || 0)} | Despesas: {formatCurrency(summary.total_expense || 0)}
                </CardDescription>
                <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => navigate('/app/finance')}>
                    Ver Fluxo
                </Button>
            </CardContent>
        </Card>
    );
}
