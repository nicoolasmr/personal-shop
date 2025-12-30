import { useState } from 'react';
import { useFinance } from '@/hooks/useFinance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
        installment_count: '1'
    });

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
                    <Label htmlFor="amount">Valor (R$)</Label>
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
