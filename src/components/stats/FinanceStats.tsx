
import { Card, CardContent } from '@/components/ui/card';

import { Transaction, MonthlySummary, FinanceGoal } from '@/types/finance';

interface FinanceStatsProps {
    transactions: Transaction[];
    summary: MonthlySummary;
    financeGoals: FinanceGoal[];
}

export const FinanceStats = ({ transactions, summary, financeGoals }: FinanceStatsProps) => (
    <Card className="mt-4"><CardContent className="p-8 text-center text-muted-foreground">Estatísticas Financeiras (Em breve)</CardContent></Card>
);
