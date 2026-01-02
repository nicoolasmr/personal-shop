import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TransactionWithCategory, formatCurrency } from "@/types/finance";
import { format, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Calendar, User, Tag, FileText, ListOrdered } from "lucide-react";
import { cn } from "@/lib/utils";

interface TransactionDetailsDialogProps {
    transaction: TransactionWithCategory | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function TransactionDetailsDialog({ transaction, open, onOpenChange }: TransactionDetailsDialogProps) {
    if (!transaction) return null;

    const isExpense = transaction.type === 'expense';
    const hasInstallments = transaction.installment_count > 1;

    // Generate installment schedule
    const getInstallmentSchedule = () => {
        if (!hasInstallments) return [];

        const schedule = [];
        const startDate = new Date(transaction.transaction_date);
        const parcelAmount = transaction.amount; // Each parcel amount

        for (let i = 0; i < transaction.installment_count; i++) {
            schedule.push({
                number: i + 1,
                date: addMonths(startDate, i),
                amount: parcelAmount,
                isCurrent: i + 1 === transaction.installment_number
            });
        }
        return schedule;
    };

    const installmentSchedule = getInstallmentSchedule();
    const totalInstallmentAmount = hasInstallments ? transaction.amount * transaction.installment_count : transaction.amount;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {isExpense ? 'Despesa' : 'Receita'}
                        <Badge variant={isExpense ? 'destructive' : 'default'} className="ml-2">
                            {isExpense ? 'Saída' : 'Entrada'}
                        </Badge>
                    </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="flex flex-col items-center justify-center p-4 bg-muted/20 rounded-lg">
                        <span className="text-sm text-muted-foreground mb-1">Valor Total</span>
                        <span className={`text-3xl font-bold ${isExpense ? 'text-red-500' : 'text-green-500'}`}>
                            {formatCurrency(hasInstallments ? totalInstallmentAmount : transaction.amount)}
                        </span>
                        {hasInstallments && (
                            <div className="mt-2 text-center">
                                <span className="text-xs text-muted-foreground">
                                    Parcela atual: {transaction.installment_number} de {transaction.installment_count}
                                </span>
                                <div className="text-sm font-medium mt-1">
                                    {formatCurrency(transaction.amount)}/mês
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-[20px_1fr] gap-3 items-start">
                            <FileText className="h-4 w-4 text-muted-foreground mt-1" />
                            <div>
                                <p className="text-sm font-medium">Descrição</p>
                                <p className="text-sm text-muted-foreground">{transaction.description}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-[20px_1fr] gap-3 items-start">
                            <Tag className="h-4 w-4 text-muted-foreground mt-1" />
                            <div>
                                <p className="text-sm font-medium">Categoria</p>
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: transaction.category?.color || '#9ca3af' }}
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        {transaction.category?.name || 'Sem Categoria'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-[20px_1fr] gap-3 items-start">
                            <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
                            <div>
                                <p className="text-sm font-medium">Data</p>
                                <p className="text-sm text-muted-foreground">
                                    {format(new Date(transaction.transaction_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-[20px_1fr] gap-3 items-start">
                            <CreditCard className="h-4 w-4 text-muted-foreground mt-1" />
                            <div>
                                <p className="text-sm font-medium">Método de Pagamento</p>
                                <p className="text-sm text-muted-foreground capitalize">
                                    {transaction.payment_method?.replace('_', ' ')}
                                </p>
                            </div>
                        </div>

                        {transaction.is_loan && (
                            <div className="grid grid-cols-[20px_1fr] gap-3 items-start bg-yellow-500/10 p-3 rounded-md border border-yellow-500/20">
                                <User className="h-4 w-4 text-yellow-600 mt-1" />
                                <div>
                                    <p className="text-sm font-medium text-yellow-600">Emprestado para</p>
                                    <p className="text-sm text-yellow-700/80 font-medium">
                                        {transaction.loan_contact || 'Desconhecido'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {hasInstallments && (
                            <div className="border-t pt-4 mt-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <ListOrdered className="h-4 w-4 text-muted-foreground" />
                                    <p className="text-sm font-semibold">Cronograma de Parcelas</p>
                                </div>
                                <div className="space-y-1 max-h-[300px] overflow-y-auto pr-2">
                                    {installmentSchedule.map((parcel) => (
                                        <div
                                            key={parcel.number}
                                            className={cn(
                                                "flex justify-between items-center p-3 rounded-lg text-sm border transition-colors",
                                                parcel.isCurrent
                                                    ? "bg-primary/10 border-primary/30 font-medium"
                                                    : parcel.number < transaction.installment_number
                                                        ? "bg-muted/50 border-transparent opacity-60"
                                                        : "bg-card border-border hover:bg-muted/30"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={cn(
                                                        "h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold",
                                                        parcel.isCurrent
                                                            ? "bg-primary text-primary-foreground"
                                                            : parcel.number < transaction.installment_number
                                                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                                : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                                                    )}
                                                >
                                                    {parcel.number}
                                                </div>
                                                <div>
                                                    <span className="font-medium capitalize">
                                                        {format(parcel.date, 'MMMM yyyy', { locale: ptBR })}
                                                    </span>
                                                    {parcel.isCurrent && (
                                                        <Badge variant="outline" className="ml-2 text-[10px] h-5">
                                                            Atual
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="font-semibold">
                                                {formatCurrency(parcel.amount)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-3 p-3 bg-muted/30 rounded-lg flex justify-between items-center text-sm">
                                    <span className="font-medium">Total do Parcelamento:</span>
                                    <span className={cn("font-bold text-lg", isExpense ? "text-red-600" : "text-green-600")}>
                                        {formatCurrency(totalInstallmentAmount)}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
