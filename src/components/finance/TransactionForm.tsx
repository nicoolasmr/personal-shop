import { useState, useEffect } from 'react';
import { useFinance } from '@/hooks/useFinance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TransactionType, PaymentMethod } from '@/types/finance';
import { Loader2 } from 'lucide-react';

interface TransactionFormProps {
    onSuccess: () => void;
}

export function TransactionForm({ onSuccess }: TransactionFormProps) {
    const { categories, createTransaction } = useFinance();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        type: 'expense' as TransactionType,
        category_id: '',
        payment_method: 'credit_card' as PaymentMethod,
        transaction_date: new Date().toISOString().split('T')[0],
        installment_count: '1',
        installment_value: '', // New field for exact parcel value
        is_loan: false,        // New field for loan tracking
        loan_contact: ''       // New field for loan contact
    });

    // Auto-calculate installment value when total amount changes, IF not edited manually recently (simplified logic: just sync default)
    // Actually, user wants to INPUT parcel value. So if parcels > 1, we show parcel value.
    useEffect(() => {
        if (parseInt(formData.installment_count) > 1 && formData.amount && !formData.installment_value) {
            const val = parseFloat(formData.amount) / parseInt(formData.installment_count);
            setFormData(prev => ({ ...prev, installment_value: val.toFixed(2) }));
        }
    }, [formData.amount, formData.installment_count]);

    const handleInstallmentValueChange = (val: string) => {
        setFormData(prev => {
            const newParcelVal = parseFloat(val);
            const count = parseInt(prev.installment_count);
            if (!isNaN(newParcelVal) && count > 0) {
                // Recalculate total amount
                return { ...prev, installment_value: val, amount: (newParcelVal * count).toFixed(2) };
            }
            return { ...prev, installment_value: val };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await createTransaction({
                description: formData.description,
                amount: parseFloat(formData.amount),
                type: formData.type,
                category_id: formData.category_id,
                payment_method: formData.payment_method,
                transaction_date: formData.transaction_date,
                installment_count: parseInt(formData.installment_count),
                is_loan: formData.is_loan,
                loan_contact: formData.is_loan ? formData.loan_contact : undefined
            });
            onSuccess();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                    id="description"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Ex: Supermercado, Aluguel..."
                    required
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="amount">Valor Total (R$)</Label>
                    <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                        placeholder="0,00"
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select
                        value={formData.type}
                        onValueChange={v => setFormData({ ...formData, type: v as TransactionType })}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="expense">Despesa</SelectItem>
                            <SelectItem value="income">Receita</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select
                        value={formData.category_id}
                        onValueChange={v => setFormData({ ...formData, category_id: v })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.filter(c => c.type === formData.type).map(cat => (
                                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Pagamento</Label>
                    <Select
                        value={formData.payment_method}
                        onValueChange={v => setFormData({ ...formData, payment_method: v as PaymentMethod })}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                            <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                            <SelectItem value="pix">PIX</SelectItem>
                            <SelectItem value="cash">Dinheiro</SelectItem>
                            <SelectItem value="bank_transfer">Transferência</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {formData.payment_method === 'credit_card' && (
                <div className="space-y-4 border p-4 rounded-md bg-muted/20">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="installments">Parcelas</Label>
                            <Input
                                id="installments"
                                type="number"
                                min="1"
                                max="48"
                                value={formData.installment_count}
                                onChange={e => setFormData({ ...formData, installment_count: e.target.value })}
                            />
                        </div>
                        {parseInt(formData.installment_count) > 1 && (
                            <div className="space-y-2">
                                <Label htmlFor="installment_value" className="text-primary font-medium">Valor da Parcela</Label>
                                <Input
                                    id="installment_value"
                                    type="number"
                                    step="0.01"
                                    value={formData.installment_value}
                                    onChange={e => handleInstallmentValueChange(e.target.value)}
                                    className="border-primary/50 bg-primary/5"
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {(formData.payment_method === 'credit_card' && formData.type === 'expense') && (
                <div className="flex items-center space-x-2 border p-3 rounded-md">
                    <Switch
                        id="loan-mode"
                        checked={formData.is_loan}
                        onCheckedChange={(checked) => setFormData(p => ({ ...p, is_loan: checked }))}
                    />
                    <div className="flex-1 space-y-1">
                        <Label htmlFor="loan-mode" className="cursor-pointer">Cartão Emprestado?</Label>
                        <p className="text-[10px] text-muted-foreground">Marque se você emprestou seu cartão para alguém.</p>
                    </div>
                </div>
            )}

            {formData.is_loan && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <Label htmlFor="loan_contact">Emprestado para quem?</Label>
                    <Input
                        id="loan_contact"
                        value={formData.loan_contact}
                        onChange={e => setFormData({ ...formData, loan_contact: e.target.value })}
                        placeholder="Nome da pessoa"
                        required={formData.is_loan}
                    />
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="date">Data</Label>
                <Input
                    id="date"
                    type="date"
                    value={formData.transaction_date}
                    onChange={e => setFormData({ ...formData, transaction_date: e.target.value })}
                    required
                />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Transação
            </Button>
        </form>
    );
}
