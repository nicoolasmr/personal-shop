
// Mock implementation request in step 332 to prevent errors in hook
// The user request uses this service, so providing stubs for function not yet implemented in service/finance.ts

import { FinanceGoal } from '@/types/finance';

export const createGoalFromFinanceGoal = async (orgId: string, userId: string, financeGoal: FinanceGoal) => {
    console.log('[Mock] Create goal from finance goal', financeGoal.id);
};

export const updateLinkedGoal = async (orgId: string, financeGoal: FinanceGoal) => {
    console.log('[Mock] Update linked goal', financeGoal.id);
};

export const deleteLinkedGoal = async (orgId: string, financeGoalId: string) => {
    console.log('[Mock] Delete linked goal', financeGoalId);
};
