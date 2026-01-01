import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Filter, TrendingUp, TrendingDown, CreditCard, DollarSign, BarChart3, PieChart, Info, ArrowUpRight, ArrowDownRight, type LucideIcon } from 'lucide-react';
import { useFinance } from '@/hooks/useFinance';
import { formatCurrency, getMonthName } from '@/types/finance';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TransactionForm } from '@/components/finance/TransactionForm';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

// Metric Card Component
const MetricCard = ({
    title,
    value,
    icon: Icon,
    trend,
    colorClass,
    subtitle
}: {
    title: string;
    value: string | number;
    icon?: LucideIcon;
    trend?: 'up' | 'down';
    colorClass?: string;
    subtitle?: string;
}) => (
    <Card className="overflow-hidden">
        <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
                {Icon && (
                    <div className={cn("h-10 w-10 sm:h-12 sm:w-12 rounded-lg flex items-center justify-center shrink-0", colorClass || "bg-secondary text-secondary-foreground")}>
                        <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                )}
                <div className="space-y-0.5 min-w-0">
                    <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <h3 className={cn("text-lg sm:text-2xl font-bold truncate", trend === 'up' ? "text-green-600" : trend === 'down' ? "text-red-600" : "")}>
                            {value}
                        </h3>
                        {trend === 'up' && <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 shrink-0" />}
                        {trend === 'down' && <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 shrink-0" />}
                    </div>
                    {subtitle && <p className="text-[10px] text-muted-foreground truncate">{subtitle}</p>}
                </div>
            </div>
        </CardContent>
    </Card>
);

export default function FinancePage() {
    // Basic state for month selection (defaulting to current for now)
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [modalOpen, setModalOpen] = useState(false);
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterMethod, setFilterMethod] = useState('all');

    const {
        transactions,
        summary,
        installmentsSummary,
        isLoading
    } = useFinance(year, month);

    if (isLoading) {
        return <div className="p-4 sm:p-8 space-y-6">
            <Skeleton className="h-10 w-48" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Skeleton className="h-32 rounded-xl" />
                <Skeleton className="h-32 rounded-xl" />
                <Skeleton className="h-32 rounded-xl" />
                <Skeleton className="h-32 rounded-xl" />
            </div>
            <div className="space-y-4">
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-64 w-full rounded-xl" />
            </div>
        </div>
    }

    const transactionList = transactions || [];
    // Mocking chart data check
    const hasChartData = transactionList.length > 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Finanças</h1>
                    <p className="text-muted-foreground">Controle suas receitas e despesas</p>
                </div>
                <Button onClick={() => setModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Nova Transação
                </Button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Saldo Atual"
                    value={formatCurrency(summary.balance)}
                    trend={summary.balance >= 0 ? 'up' : 'down'}
                    colorClass="bg-primary/10 text-primary dark:bg-primary/20"
                />
                <MetricCard
                    title="Receitas"
                    value={formatCurrency(summary.total_income)}
                    icon={ArrowUpRight}
                    colorClass="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                />
                <MetricCard
                    title="Despesas"
                    value={formatCurrency(summary.total_expense)}
                    icon={ArrowDownRight}
                    colorClass="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                />
                <MetricCard
                    title="Parcelas"
                    value={installmentsSummary.total_active_installments || 0}
                    icon={CreditCard}
                    colorClass="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
                    subtitle="Este mês"
                />
            </div>

            {/* Filters */}
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Filter className="h-4 w-4" />
                    <span>Filtros</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 p-4 border rounded-lg bg-card">
                    <Select value={`${month}`} onValueChange={(v) => setMonth(Number(v))}>
                        <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder="Este mês" />
                        </SelectTrigger>
                        <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                <SelectItem key={m} value={`${m}`}>{getMonthName(m)}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                        <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder="Todas as categorias" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas as categorias</SelectItem>
                            {/* Dynamically populate later */}
                            <SelectItem value="food">Alimentação</SelectItem>
                            <SelectItem value="transport">Transporte</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={filterMethod} onValueChange={setFilterMethod}>
                        <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder="Todos os métodos" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os métodos</SelectItem>
                            <SelectItem value="credit">Cartão de Crédito</SelectItem>
                            <SelectItem value="pix">Pix</SelectItem>
                            <SelectItem value="money">Dinheiro</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="min-h-[300px]">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <BarChart3 className="h-4 w-4" /> Fluxo de Caixa
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px] flex items-center justify-center text-muted-foreground bg-muted/5 mx-6 mb-6 rounded-lg border border-dashed">
                        {hasChartData ? (
                            <span>Gráfico em breve (Recharts)</span>
                        ) : (
                            <span className="text-sm">Sem dados suficientes para o gráfico.</span>
                        )}
                    </CardContent>
                </Card>

                <Card className="min-h-[300px]">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <PieChart className="h-4 w-4" /> Top Categorias
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px] flex items-center justify-center text-muted-foreground bg-muted/5 mx-6 mb-6 rounded-lg border border-dashed">
                        {hasChartData ? (
                            <span>Gráfico em breve (Recharts)</span>
                        ) : (
                            <span className="text-sm">Sem dados de categorias para exibir.</span>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Recent Transactions List */}
            <Card className="min-h-[300px]">
                <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                    <CardTitle className="text-base">Transações Recentes</CardTitle>
                    <span className="text-xs text-muted-foreground">{transactionList.length} transações</span>
                </CardHeader>
                <CardContent className="p-0">
                    {transactionList.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[250px] text-muted-foreground">
                            <DollarSign className="h-16 w-16 mb-4 opacity-10" />
                            <p className="text-sm font-medium">Nenhuma transação encontrada</p>
                        </div>
                    ) : (
                        <div className="divide-y relative">
                            {/* Header Row */}
                            <div className="grid grid-cols-3 sm:grid-cols-4 p-4 text-xs font-medium text-muted-foreground bg-muted/30">
                                <div className="col-span-1 sm:col-span-2">Descrição</div>
                                <div className="text-center">Data</div>
                                <div className="text-right">Valor</div>
                            </div>
                            {/* List */}
                            {transactionList.map(t => (
                                <div key={t.id} className="grid grid-cols-3 sm:grid-cols-4 p-4 text-sm hover:bg-muted/30 transition-colors items-center">
                                    <div className="col-span-1 sm:col-span-2 font-medium">
                                        <div className="truncate">{t.description}</div>
                                        <div className="text-[10px] text-muted-foreground font-normal truncate">
                                            {t.category || 'Geral'} • {t.payment_method === 'credit_card' ? 'Cartão' : 'Pix'}
                                        </div>
                                    </div>
                                    <div className="text-center text-muted-foreground text-xs">
                                        {format(new Date(t.transaction_date), 'dd/MM')}
                                    </div>
                                    <div className={cn("text-right font-medium", t.type === 'income' ? "text-green-600" : "text-red-600")}>
                                        {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

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
