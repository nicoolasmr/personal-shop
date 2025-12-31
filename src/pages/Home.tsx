import { useState } from 'react';
import { useTenant } from '@/hooks/useTenant';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, CheckSquare, DollarSign, Calendar as CalendarIcon, Target, TrendingUp, AlertCircle, TrendingDown, ArrowRight, Check } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useFinance } from '@/hooks/useFinance';
import { useCalendarEvents, useEventRange } from '@/hooks/queries/useCalendar';
import { useTasks } from '@/hooks/queries/useTasks';
import { useGoals } from '@/hooks/useGoals';
import { CreateTaskDialog } from '@/components/tasks/CreateTaskDialog';
import { CreateEventDialog } from '@/components/calendar/CreateEventDialog';
import { CreateHabitDialog } from '@/components/goals/CreateHabitDialog';
import { TransactionForm } from '@/components/finance/TransactionForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatCurrency } from '@/types/finance';
import { isSameDay, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Goal, calculateProgress } from '@/types/goals';
import { Separator } from '@/components/ui/separator';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function Home() {
    const { profile, loading: profileLoading } = useTenant();

    // Dialog States
    const [isTaskOpen, setIsTaskOpen] = useState(false);
    const [isEventOpen, setIsEventOpen] = useState(false);
    const [isHabitOpen, setIsHabitOpen] = useState(false);
    const [isExpenseOpen, setIsExpenseOpen] = useState(false);

    // Data Hooks
    const today = new Date();
    const { summary: financeSummary } = useFinance(today.getFullYear(), today.getMonth() + 1);
    const { data: events } = useEventRange(
        new Date(today.setHours(0, 0, 0, 0)),
        new Date(today.setHours(23, 59, 59, 999))
    );
    const { data: tasks } = useTasks();
    const { data: goals } = useGoals();

    // Derived Data
    const todaysEvents = events || [];
    const pendingTasks = tasks?.filter(t => t.status !== 'done').slice(0, 3) || [];
    const activeGoals = goals?.filter(g => g.status === 'active') || [];

    const getTimeGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Bom dia';
        if (hour < 18) return 'Boa tarde';
        return 'Boa noite';
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                {profileLoading ? <Skeleton className="h-8 w-64" /> : <h1 className="text-3xl font-bold text-foreground">{getTimeGreeting()}! 👋</h1>}
                <p className="text-muted-foreground mt-1">Aqui está o resumo do seu dia</p>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold">Ações Rápidas</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Button
                        variant="outline"
                        className="h-24 flex flex-col items-center justify-center gap-2 border-dashed border-2 hover:border-primary/50 hover:bg-primary/5"
                        onClick={() => setIsTaskOpen(true)}
                    >
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <Plus className="h-6 w-6" />
                        </div>
                        <span className="font-medium">Nova Tarefa</span>
                    </Button>
                    <Button
                        variant="outline"
                        className="h-24 flex flex-col items-center justify-center gap-2 border-dashed border-2 hover:border-red-500/50 hover:bg-red-500/5"
                        onClick={() => setIsExpenseOpen(true)}
                    >
                        <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                            <DollarSign className="h-6 w-6" />
                        </div>
                        <span className="font-medium">Nova Despesa</span>
                    </Button>
                    <Button
                        variant="outline"
                        className="h-24 flex flex-col items-center justify-center gap-2 border-dashed border-2 hover:border-green-500/50 hover:bg-green-500/5"
                        onClick={() => setIsEventOpen(true)}
                    >
                        <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                            <CalendarIcon className="h-6 w-6" />
                        </div>
                        <span className="font-medium">Novo Evento</span>
                    </Button>
                    <Button
                        variant="outline"
                        className="h-24 flex flex-col items-center justify-center gap-2 border-dashed border-2 hover:border-purple-500/50 hover:bg-purple-500/5"
                        onClick={() => setIsHabitOpen(true)}
                    >
                        <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                            <Target className="h-6 w-6" />
                        </div>
                        <span className="font-medium">Novo Hábito</span>
                    </Button>
                </div>
            </div>

            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Finance Widget */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-green-600">
                            <DollarSign className="h-5 w-5" /> Resumo Financeiro - Hoje
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Saldo Hoje</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className={cn("text-3xl font-bold", financeSummary.balance >= 0 ? "text-foreground" : "text-red-600")}>
                                    {formatCurrency(financeSummary.balance)}
                                </h3>
                            </div>
                            <span className="text-xs text-green-600 flex items-center mt-1">
                                <TrendingUp className="h-3 w-3 mr-1" /> +0% hoje
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-muted-foreground">Receitas</p>
                                <p className="text-green-600 font-semibold">{formatCurrency(financeSummary.total_income)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Gastos</p>
                                <p className="text-red-600 font-semibold">{formatCurrency(financeSummary.total_expense)}</p>
                            </div>
                        </div>

                        <div className="pt-2">
                            <Link to="/app/finance" className="text-sm text-green-600 hover:text-green-700 flex items-center justify-center">
                                Ver detalhes financeiros <ArrowRight className="h-3 w-3 ml-1" />
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                {/* Agenda Widget */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-blue-600">
                            <CalendarIcon className="h-5 w-5" /> Agenda de Hoje
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[200px] flex flex-col relative">
                        {todaysEvents.length > 0 ? (
                            <div className="space-y-3 overflow-y-auto">
                                {todaysEvents.slice(0, 3).map(evt => (
                                    <div key={evt.id} className="flex items-start gap-3 p-2 rounded-lg bg-secondary/30">
                                        <div className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">
                                            {format(new Date(evt.start_time), 'HH:mm')}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium line-clamp-1">{evt.title}</p>
                                            <p className="text-xs text-muted-foreground line-clamp-1">{evt.location || 'Sem local'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3">
                                <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center">
                                    <CalendarIcon className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="font-medium">Nenhum evento hoje</p>
                                    <p className="text-xs text-muted-foreground">Sua agenda está livre hoje</p>
                                </div>
                                <Button size="sm" onClick={() => setIsEventOpen(true)}>Novo Evento</Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Tasks Widget */}
                <Card>
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="flex items-center gap-2 text-foreground text-base">
                            <CheckSquare className="h-5 w-5 text-blue-500" /> Tarefas de Hoje
                        </CardTitle>
                        <span className="text-xs text-muted-foreground">{pendingTasks.length} pendentes</span>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {pendingTasks.length > 0 ? (
                            pendingTasks.map(task => (
                                <div key={task.id} className="flex items-start gap-3 p-2 rounded-lg bg-secondary/10 border">
                                    <Checkbox />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium line-clamp-1">{task.title}</p>
                                        <div className="flex gap-2 mt-1">
                                            <Badge variant="secondary" className="text-[10px] h-5 px-1 bg-red-100 text-red-700 hover:bg-red-100">{task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}</Badge>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-8 text-center text-muted-foreground text-sm">
                                Tudo feito por aqui! 🎉
                            </div>
                        )}

                        <div className="pt-2 text-center">
                            <Link to="/app/tasks" className="text-sm text-blue-600 hover:text-blue-700 flex items-center justify-center">
                                Ver todas as tarefas ({tasks?.length || 0} hoje) <ArrowRight className="h-3 w-3 ml-1" />
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Active Goals */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2"><Target className="h-5 w-5 text-orange-500" /> Metas Ativas</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeGoals.slice(0, 4).map(goal => {
                        const progress = calculateProgress(goal);
                        return (
                            <Card key={goal.id}>
                                <CardContent className="p-4 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-semibold text-sm">{goal.title}</h4>
                                        <span className={cn("text-xs font-bold", progress >= 100 ? "text-green-600" : "text-orange-600")}>{progress}%</span>
                                    </div>
                                    <Progress value={progress} className="h-2" />
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>{formatCurrency(goal.current_value)} de {formatCurrency(goal.target_value || 0)}</span>
                                        {goal.target_value && <span>{goal.target_value - goal.current_value} restantes</span>}
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                    {activeGoals.length === 0 && (
                        <div className="col-span-full py-8 text-center bg-secondary/20 rounded-lg border border-dashed">
                            <p className="text-muted-foreground mb-4">Você ainda não tem metas ativas.</p>
                            <Button variant="outline" onClick={() => setIsHabitOpen(true)} className="text-orange-500 hover:text-orange-600 border-orange-200 hover:bg-orange-50">Criar objetivo</Button>
                        </div>
                    )}
                </div>
                {activeGoals.length > 0 && (
                    <div className="text-center">
                        <Link to="/app/goals" className="text-sm text-orange-600 hover:text-orange-700 inline-flex items-center">
                            Gerenciar metas <ArrowRight className="h-3 w-3 ml-1" />
                        </Link>
                    </div>
                )}
            </div>

            {/* Dialogs */}
            <CreateTaskDialog open={isTaskOpen} onOpenChange={setIsTaskOpen} />
            <CreateEventDialog open={isEventOpen} onOpenChange={setIsEventOpen} />
            <CreateHabitDialog open={isHabitOpen} onOpenChange={setIsHabitOpen} />

            <Dialog open={isExpenseOpen} onOpenChange={setIsExpenseOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nova Transação</DialogTitle>
                    </DialogHeader>
                    <TransactionForm onSuccess={() => setIsExpenseOpen(false)} />
                </DialogContent>
            </Dialog>

        </div>
    );
}
