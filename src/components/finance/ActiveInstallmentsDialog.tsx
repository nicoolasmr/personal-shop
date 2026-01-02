import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ActiveInstallment, formatCurrency } from "@/types/finance";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { CreditCard } from "lucide-react";

interface ActiveInstallmentsDialogProps {
    installments: ActiveInstallment[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ActiveInstallmentsDialog({ installments, open, onOpenChange }: ActiveInstallmentsDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Parcelas Ativas
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {installments.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            Nenhuma parcela ativa encontrada.
                        </div>
                    ) : (
                        installments.map((inst) => {
                            const progress = ((inst.installment_number - 1) / inst.installment_count) * 100; // Simplified progress based on current view logic, ideal would be (paid/total)
                            // Better logic: The 'installment_number' on ActiveInstallment usually comes from a view showing the *current* or *upcoming* installment.
                            // Assuming backend returns the 'current' state.
                            const paidCount = inst.installment_count - inst.remaining_parcels;
                            const progressPercent = (paidCount / inst.installment_count) * 100;

                            return (
                                <div key={inst.id} className="border rounded-lg p-4 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-semibold text-sm">{inst.description}</h4>
                                            <p className="text-xs text-muted-foreground">
                                                {inst.category_name || 'Sem categoria'} • Termina em {inst.end_date ? format(new Date(inst.end_date), 'MM/yyyy') : 'N/A'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-sm">{formatCurrency(inst.parcel_amount)}/mês</p>
                                            <p className="text-xs text-muted-foreground">Total: {formatCurrency(inst.total_amount)}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>Pago: {paidCount} de {inst.installment_count}</span>
                                            <span>Faltam: {formatCurrency(inst.remaining_amount)}</span>
                                        </div>
                                        <Progress value={progressPercent} className="h-2" />
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
