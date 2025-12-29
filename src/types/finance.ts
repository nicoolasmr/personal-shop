export type TransactionType = 'income' | 'expense';
export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type PaymentMethod = 'credit_card' | 'debit_card' | 'pix' | 'cash' | 'boleto' | 'check' | 'transfer' | 'other';

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
    credit_card: 'Cartão de Crédito', debit_card: 'Cartão de Débito',
    pix: 'Pix', cash: 'Dinheiro', boleto: 'Boleto',
    check: 'Cheque', transfer: 'Transferência', other: 'Outro',
};

export interface TransactionCategory {
    id: string; org_id: string; user_id: string;
    name: string; type: TransactionType;
    icon: string; color: string;
    is_default: boolean; created_at: string;
}

export interface Transaction {
    id: string; org_id: string; user_id: string;
    category_id: string | null; type: TransactionType;
    amount: number; description: string; notes: string | null;
    transaction_date: string; is_recurring: boolean;
    recurring_frequency: RecurringFrequency | null;
    payment_method: PaymentMethod;
    installment_count: number; installment_number: number;
    parent_transaction_id: string | null;
    is_installment_parcel: boolean;
    created_at: string; updated_at: string;
}

export interface CreateTransactionPayload {
    type: TransactionType; amount: number; description: string;
    notes?: string; category_id?: string; transaction_date?: string;
    is_recurring?: boolean; recurring_frequency?: RecurringFrequency;
    payment_method?: PaymentMethod; installment_count?: number;
}

export interface MonthlySummary {
    total_income: number; total_expense: number;
    balance: number; transaction_count: number;
}

export type FinanceGoalType = 'savings' | 'expense_limit' | 'income_target' | 'emergency_fund';

export interface FinanceGoal {
    id: string; org_id: string; user_id: string;
    name: string; type: FinanceGoalType;
    target_amount: number; current_amount: number;
    deadline: string | null; category_id: string | null;
    is_active: boolean; linked_goal_id?: string | null;
    created_at: string; updated_at: string;
}

export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}
