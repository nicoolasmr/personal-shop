import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, Target, CheckCircle2, AlertCircle, TrendingUp, Calendar, Trash2, Edit2 } from 'lucide-react';
import { useGoals, useAddProgress } from '@/hooks/useGoals';
import { CreateGoalDialog } from '@/components/goals/CreateGoalDialog';
import { Goal, calculateProgress, GoalStatus, isGoalOverdue, GOAL_TYPE_CONFIGS, GoalType } from '@/types/goals';
import { cn } from '@/lib/utils';
import { Loader2, Check } from 'lucide-react';

import { GoalDetailsDialog } from '@/components/goals/GoalDetailsDialog';

export default function GoalsPage() {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const { data: goals, isLoading } = useGoals();
    const { mutate: addProgress } = useAddProgress();
    const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

    // Filter state
    const [activeTab, setActiveTab] = useState('all');

    // Local state for progress inputs
    const [progressInputs, setProgressInputs] = useState<Record<string, string>>({});
    const [updatingGoalId, setUpdatingGoalId] = useState<string | null>(null);

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

    const goalsList = goals || [];

    // Metrics
    const totalGoals = goalsList.length;
    const completedGoals = goalsList.filter(g => g.status === 'done').length;
    const activeGoals = goalsList.filter(g => g.status === 'active').length;
    const overdueGoals = goalsList.filter(g => isGoalOverdue(g)).length;

    const handleQuickProgress = (goalId: string) => {
        const value = parseFloat(progressInputs[goalId]);
        if (isNaN(value) || value <= 0) return;

        setUpdatingGoalId(goalId);
        addProgress({ goalId, payload: { delta_value: value, note: 'Progresso rápido via card' } }, {
            onSuccess: () => {
                setProgressInputs(prev => ({ ...prev, [goalId]: '' }));
            },
            onSettled: () => setUpdatingGoalId(null)
        });
    };

    const categories = Array.from(new Set(goalsList.map(g => g.type)));

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold">Metas</h1>
                    <p className="text-muted-foreground">Defina e acompanhe seus objetivos</p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)}><Plus className="h-4 w-4 mr-2" /> Nova Meta</Button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total</CardTitle>
                        <Target className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">{totalGoals}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">{completedGoals}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Em Progresso</CardTitle>
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">{activeGoals}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Atrasadas</CardTitle>
                        <AlertCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">{overdueGoals}</div></CardContent>
                </Card>
            </div>

            {/* Tabs Filter */}
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="bg-transparent border-b rounded-none w-full justify-start h-auto p-0 space-x-4">
                    <TabsTrigger value="all" className="rounded-full bg-secondary/50 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 h-8 px-4">
                        Todas ({totalGoals})
                    </TabsTrigger>
                    {categories.map(cat => (
                        <TabsTrigger key={cat} value={cat} className="rounded-full bg-secondary/50 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 h-8 px-4">
                            {GOAL_TYPE_CONFIGS[cat as GoalType]?.label || cat} ({goalsList.filter(g => g.type === cat).length})
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value={activeTab} className="space-y-4 mt-6">
                    <div className="grid grid-cols-1 gap-6">
                        {goalsList
                            .filter(g => activeTab === 'all' || g.type === activeTab)
                            .map(goal => {
                                const progress = calculateProgress(goal);
                                const isDone = goal.status === 'done';
                                const typeConfig = GOAL_TYPE_CONFIGS[goal.type] || GOAL_TYPE_CONFIGS['custom'];

                                return (
                                    <Card
                                        key={goal.id}
                                        className={cn("overflow-hidden border-l-4 cursor-pointer hover:shadow-md transition-shadow", isDone ? "border-l-green-500 bg-green-50/10" : "border-l-red-100 dark:border-l-red-900/50")}
                                        onClick={() => setSelectedGoal(goal)}
                                    >
                                        <div className="p-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="space-y-1">
                                                    <h3 className="font-semibold text-lg">{goal.title}</h3>
                                                    <p className="text-sm text-muted-foreground">{goal.description}</p>
                                                    <div className="flex gap-2 mt-2">
                                                        <Badge variant="secondary" className="text-xs bg-secondary/50">{typeConfig.label}</Badge>
                                                        {goal.due_date && <span className="text-xs text-red-400 flex items-center"><Calendar className="h-3 w-3 mr-1" /> até {new Date(goal.due_date).toLocaleDateString()}</span>}
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setSelectedGoal(goal); }}><Edit2 className="h-4 w-4" /></Button>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex justify-between text-sm mt-4">
                                                    <span className="font-semibold">Progresso</span>
                                                    <span className="text-muted-foreground">{goal.current_value} / {goal.target_value} {goal.unit}</span>
                                                </div>

                                                <div className="relative pt-1">
                                                    <Progress value={progress} className="h-3" />
                                                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                                        <span>{progress}% concluído</span>
                                                        <span>Faltam {goal.target_value! - goal.current_value} {goal.unit}</span>
                                                    </div>
                                                </div>

                                                {!isDone && (
                                                    <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg mt-4" onClick={(e) => e.stopPropagation()}>
                                                        <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-2">Atualizar progresso</p>
                                                        <div className="flex gap-2">
                                                            <Input
                                                                placeholder={typeConfig.placeholder || "Digite o valor..."}
                                                                className="bg-white dark:bg-black/20 flex-1"
                                                                type="number"
                                                                value={progressInputs[goal.id] || ''}
                                                                onChange={(e) => setProgressInputs(prev => ({ ...prev, [goal.id]: e.target.value }))}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') handleQuickProgress(goal.id);
                                                                }}
                                                            />
                                                            <Button
                                                                className="bg-green-100 text-green-700 hover:bg-green-200 border border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800 min-w-[120px]"
                                                                variant="outline"
                                                                onClick={() => handleQuickProgress(goal.id)}
                                                                disabled={updatingGoalId === goal.id || !progressInputs[goal.id]}
                                                            >
                                                                {updatingGoalId === goal.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                                                                Confirmar
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                )
                            })}
                    </div>
                </TabsContent>
            </Tabs>

            <CreateGoalDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
            <GoalDetailsDialog
                goal={selectedGoal}
                open={!!selectedGoal}
                onOpenChange={(open) => !open && setSelectedGoal(null)}
            />
        </div>
    );
}
