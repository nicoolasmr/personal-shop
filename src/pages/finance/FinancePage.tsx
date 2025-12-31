import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, ChevronLeft, ChevronRight, DollarSign, CreditCard, Target, Filter } from 'lucide-react';
import { useFinance } from '@/hooks/useFinance';
import { formatCurrency, getMonthName, PaymentMethod, ActiveInstallment } from '@/types/finance';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TransactionForm } from '@/components/finance/TransactionForm';
import { Progress } from '@/components/ui/progress';

// Placeholders for components not yet created but referenced
const FinanceSummary = ({ summary }: { summary: { total_income: number; total_expense: number; balance: number } }) => (
    <div className="grid grid-cols-3 gap-4">
        <Card>
            <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Receitas</CardTitle></CardHeader>
            <CardContent className="p-4 pt-0 text-xl font-bold text-green-600">+{formatCurrency(summary.total_income)}</CardContent>
        </Card>
        <Card>
            <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Despesas</CardTitle></CardHeader>
            <CardContent className="p-4 pt-0 text-xl font-bold text-red-600">-{formatCurrency(summary.total_expense)}</CardContent>
        </Card>
        <Card>
            <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Saldo</CardTitle></CardHeader>
            <CardContent className={`p-4 pt-0 text-xl font-bold ${summary.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {formatCurrency(summary.balance)}
            </CardContent>
        </Card>
    </div>
);

const TransactionCard = ({ transaction }: { transaction: { description: string; transaction_date: string; type: 'income' | 'expense'; amount: number } }) => (
    <div className="flex items-center justify-between p-3 border rounded-lg bg-card mb-2">
        <div>
            <div className="font-medium">{transaction.description}</div>
            <div className="text-xs text-muted-foreground">{new Date(transaction.transaction_date).toLocaleDateString()}</div>
        </div>
        <div className={`font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
        </div>
    </div>
);

const GoalsList = ({ goals }: { goals: Array<{ id: string; name: string; target_amount: number; current_amount: number; progress: number }> | undefined }) => (
    <div className="grid gap-4 md:grid-cols-2">
        {goals?.map((goal) => (
            <Card key={goal.id}>
                <CardHeader className="p-4"><CardTitle className="text-base">{goal.name}</CardTitle><CardDescription>Meta: {formatCurrency(goal.target_amount)}</CardDescription></CardHeader>
                <CardContent className="p-4 pt-0">
                    <div className="text-2xl font-bold">{formatCurrency(goal.current_amount)}</div>
                </CardContent>
            </Card>
        ))}
        {goals?.length === 0 && <p className="text-muted-foreground p-4">Nenhuma meta configurada.</p>}
    </div>
)

export default function FinancePage() {
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [modalOpen, setModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('transactions');

    // Updated useFinance to accept year/month params for real-time filtering
    const {
        transactions,
        financeGoals,
        summary,
        installments,
        installmentsSummary,
        isLoading
    } = useFinance(year, month);

    const handlePrevMonth = () => {
        if (month === 1) { setMonth(12); setYear(year - 1); }
        else setMonth(month - 1);
    }
    const handleNextMonth = () => {
        if (month === 12) { setMonth(1); setYear(year + 1); }
        else setMonth(month + 1);
    }

    if (isLoading) return <div>Carregando finanças...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Finanças</h1>
                </div>
                <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
                    <Button variant="ghost" size="icon" onClick={handlePrevMonth}><ChevronLeft className="h-4 w-4" /></Button>
                    <span className="font-medium min-w-[120px] text-center">{getMonthName(month)} {year}</span>
                    <Button variant="ghost" size="icon" onClick={handleNextMonth}><ChevronRight className="h-4 w-4" /></Button>
                </div>
                <Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4 mr-2" />Nova Transação</Button>
            </div>

            <FinanceSummary summary={summary} />

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="transactions">Transações</TabsTrigger>
                    <TabsTrigger value="goals">Metas</TabsTrigger>
                    <TabsTrigger value="installments">Parcelas</TabsTrigger>
                    <TabsTrigger value="credit-card">Cartão</TabsTrigger>
                </TabsList>

                <TabsContent value="transactions" className="space-y-4 pt-4">
                    {transactions?.map(t => <TransactionCard key={t.id} transaction={t} />)}
                    {transactions?.length === 0 && <div className="text-center py-8 text-muted-foreground">Nenhuma transação neste período.</div>}
                </TabsContent>

                <TabsContent value="goals" className="pt-4">
                    <GoalsList goals={financeGoals} />
                </TabsContent>

                <TabsContent value="installments" className="pt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Card>
                            <CardHeader className="p-4"><CardTitle className="text-sm">Comprometimento Mensal</CardTitle></CardHeader>
                            <CardContent className="p-4 pt-0 text-xl font-bold">{formatCurrency(installmentsSummary.total_monthly_commitment)}</CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="p-4"><CardTitle className="text-sm">Total Restante</CardTitle></CardHeader>
                            <CardContent className="p-4 pt-0 text-xl font-bold">{formatCurrency(installmentsSummary.total_remaining_amount)}</CardContent>
                        </Card>
                    </div>
                    <div className="space-y-2">

                        <h3 className="font-medium px-1">Parcelamentos Ativos</h3>
                        {installments?.map((inst: ActiveInstallment) => (
                            <Card key={inst.id}>
                                <CardContent className="p-4 flex justify-between items-center">
                                    <div>
                                        <div className="font-medium">{inst.description}</div>
                                        <div className="text-xs text-muted-foreground">{inst.installment_number}/{inst.installment_count} parcelas</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold">{formatCurrency(inst.amount)}</div>
                                        <div className="text-xs text-muted-foreground">Faltam {formatCurrency(inst.amount * (inst.installment_count - inst.installment_number + 1))}</div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="credit-card" className="pt-4">
                    <div className="text-center py-8 text-muted-foreground">Relatório de cartão em desenvolvimento.</div>
                </TabsContent>
            </Tabs>

            {/* Mock Modal for now */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nova Transação</DialogTitle>
                    </DialogHeader>
                    <TransactionForm onSuccess={() => setModalOpen(false)} />
                </DialogContent>
            </Dialog>
        </div>
    );
}
