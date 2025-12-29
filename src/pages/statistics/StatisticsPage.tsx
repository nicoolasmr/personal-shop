import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target, Repeat, CheckSquare, DollarSign, LayoutDashboard } from 'lucide-react';
import { useGoals } from '@/hooks/useGoals';
import { useHabits } from '@/hooks/useHabits';
import { useTasks } from '@/hooks/useTasks';
import { useFinance } from '@/hooks/useFinance';
import { HabitStats } from '@/components/habits/HabitStats';
import { GoalStats } from '@/components/stats/GoalStats';
import { TaskStats } from '@/components/stats/TaskStats';
import { FinanceStats } from '@/components/stats/FinanceStats';
import { ConsolidatedGoalsDashboard } from '@/components/goals/ConsolidatedGoalsDashboard';

export default function StatisticsPage() {
    const { data: activeGoals } = useGoals('active');
    const { data: doneGoals } = useGoals('done');
    const { data: habits } = useHabits();
    const { data: tasks } = useTasks();
    const { transactions, summary, financeGoals } = useFinance();

    const allGoals = [...(activeGoals || []), ...(doneGoals || [])];

    return (
        <div className="space-y-6">
            <div><h1 className="text-2xl font-bold">Estatísticas</h1><p className="text-muted-foreground">Visão completa do seu progresso</p></div>

            <Tabs defaultValue="consolidated">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="consolidated" className="text-xs sm:text-sm">Consolidado</TabsTrigger>
                    <TabsTrigger value="habits" className="text-xs sm:text-sm">Hábitos</TabsTrigger>
                    <TabsTrigger value="goals" className="text-xs sm:text-sm">Metas</TabsTrigger>
                    <TabsTrigger value="tasks" className="text-xs sm:text-sm">Tarefas</TabsTrigger>
                    <TabsTrigger value="finance" className="text-xs sm:text-sm">Finanças</TabsTrigger>
                </TabsList>

                <TabsContent value="consolidated"><ConsolidatedGoalsDashboard goals={allGoals} financeGoals={financeGoals} /></TabsContent>
                <TabsContent value="habits"><HabitStats habits={habits || []} /></TabsContent>
                <TabsContent value="goals"><GoalStats goals={allGoals} financeGoals={financeGoals} /></TabsContent>
                <TabsContent value="tasks"><TaskStats tasks={tasks || []} /></TabsContent>
                <TabsContent value="finance"><FinanceStats transactions={transactions} summary={summary} financeGoals={financeGoals} /></TabsContent>
            </Tabs>
        </div>
    );
}
