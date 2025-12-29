export type TransactionType = 'income' | 'expense';
export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type PaymentMethod = 'credit_card' | 'debit_card' | 'pix' | 'cash' | 'boleto' | 'check' | 'transfer' | 'other';
export type FinanceGoalType = 'savings' | 'expense_limit' | 'income_target' | 'emergency_fund';

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
    credit_card: 'Cartão de Crédito', debit_card: 'Cartão de Débito', pix: 'Pix',
    cash: 'Dinheiro', boleto: 'Boleto', check: 'Cheque', transfer: 'Transferência', other: 'Outro',
};

export interface TransactionCategory { id: string; org_id: string; user_id: string; name: string; type: TransactionType; icon: string; color: string; is_default: boolean; created_at: string; }

export interface Transaction {
    id: string; org_id: string; user_id: string; category_id: string | null; type: TransactionType; amount: number;
    description: string; notes: string | null; transaction_date: string; is_recurring: boolean;
    recurring_frequency: RecurringFrequency | null; payment_method: PaymentMethod;
    installment_count: number; installment_number: number; parent_transaction_id: string | null;
    is_installment_parcel: boolean; created_at: string; updated_at: string;
}

export interface TransactionWithCategory extends Transaction { category?: TransactionCategory | null; }

export interface CreateTransactionPayload {
    type: TransactionType; amount: number; description: string; notes?: string; category_id?: string;
    transaction_date?: string; is_recurring?: boolean; recurring_frequency?: RecurringFrequency;
    payment_method?: PaymentMethod; installment_count?: number;
}

export interface UpdateTransactionPayload { type?: TransactionType; amount?: number; description?: string; notes?: string; category_id?: string | null; transaction_date?: string; is_recurring?: boolean; recurring_frequency?: RecurringFrequency | null; payment_method?: PaymentMethod; }

export interface CreateCategoryPayload { name: string; type: TransactionType; icon?: string; color?: string; }

export interface ActiveInstallment {
    id: string; org_id: string; user_id: string; description: string; parcel_amount: number; total_amount: number;
    installment_count: number; installment_number: number; payment_method: PaymentMethod; start_date: string; end_date: string;
    category_id: string | null; category_name: string | null; category_color: string | null;
    remaining_parcels: number; remaining_amount: number; created_at: string;
}

export interface InstallmentsSummary { total_active_installments: number; total_monthly_commitment: number; total_remaining_amount: number; }
export interface MonthlySummary { total_income: number; total_expense: number; balance: number; transaction_count: number; }
export interface CategoryBreakdown { category_id: string | null; category_name: string; category_color: string; total_amount: number; percentage: number; }

export interface FinanceGoal {
    id: string; org_id: string; user_id: string; name: string; type: FinanceGoalType;
    target_amount: number; current_amount: number; deadline: string | null; category_id: string | null;
    is_active: boolean; linked_goal_id?: string | null; created_at: string; updated_at: string;
}

export interface CreateFinanceGoalPayload { name: string; type: FinanceGoalType; target_amount: number; current_amount?: number; deadline?: string; category_id?: string; }
export interface UpdateFinanceGoalPayload { name?: string; target_amount?: number; current_amount?: number; deadline?: string | null; is_active?: boolean; }

export const FINANCE_GOAL_TYPE_LABELS: Record<FinanceGoalType, string> = { savings: 'Poupança', expense_limit: 'Limite de Gastos', income_target: 'Meta de Receita', emergency_fund: 'Reserva de Emergência' };

export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function getMonthName(month: number): string {
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return months[month - 1] || '';
}

export const DEFAULT_EXPENSE_CATEGORIES = [
    { name: 'Alimentação', icon: 'Utensils', color: 'orange' }, { name: 'Transporte', icon: 'Car', color: 'blue' },
    { name: 'Moradia', icon: 'Home', color: 'purple' }, { name: 'Saúde', icon: 'Heart', color: 'red' },
    { name: 'Educação', icon: 'GraduationCap', color: 'indigo' }, { name: 'Lazer', icon: 'Gamepad2', color: 'pink' },
    { name: 'Compras', icon: 'ShoppingBag', color: 'amber' }, { name: 'Outros', icon: 'MoreHorizontal', color: 'gray' },
];

export const DEFAULT_INCOME_CATEGORIES = [
    { name: 'Salário', icon: 'Briefcase', color: 'green' }, { name: 'Freelance', icon: 'Laptop', color: 'cyan' },
    { name: 'Investimentos', icon: 'TrendingUp', color: 'emerald' }, { name: 'Outros', icon: 'MoreHorizontal', color: 'gray' },
];
