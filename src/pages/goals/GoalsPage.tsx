import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Target, Plus, Search, Filter, Calendar as CalendarIcon, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { useGoals } from '@/hooks/useGoals';
import { useHabits } from '@/hooks/useHabits';
import { Goal, GoalStatus, calculateProgress } from '@/types/goals';
import { CreateGoalDialog } from '@/components/goals/CreateGoalDialog';
import { CreateHabitDialog } from '@/components/goals/CreateHabitDialog';

export default function GoalsPage() {
    const [activeTab, setActiveTab] = useState('goals');
    const [isCreateGoalOpen, setIsCreateGoalOpen] = useState(false);
    const [isCreateHabitOpen, setIsCreateHabitOpen] = useState(false);
    const { data: goals, isLoading: goalsLoading } = useGoals();
    const { data: habits, isLoading: habitsLoading } = useHabits();

    if (goalsLoading || habitsLoading) return <div>Carregando...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Metas &amp; Hábitos</h1>
                    <p className="text-muted-foreground">Gerencie seus objetivos e rotinas</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setIsCreateGoalOpen(true)}><Plus className="h-4 w-4 mr-2" />Nova Meta</Button>
                    <Button variant="outline" onClick={() => setIsCreateHabitOpen(true)}><Plus className="h-4 w-4 mr-2" />Novo Hábito</Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                {/* ... Tabs Content same as before ... */}
                <TabsList>
                    <TabsTrigger value="goals" className="flex gap-2"><Target className="h-4 w-4" />Metas</TabsTrigger>
                    <TabsTrigger value="habits" className="flex gap-2"><RefreshCw className="h-4 w-4" />Hábitos</TabsTrigger>
                </TabsList>

                <TabsContent value="goals" className="space-y-4">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Buscar metas..." className="pl-8" />
                        </div>
                        <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {goals?.map(goal => (
                            <Card key={goal.id}>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <Badge variant="outline" className="mb-2">{goal.type}</Badge>
                                        {goal.status === 'done' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                                    </div>
                                    <CardTitle className="text-base truncate" title={goal.title}>{goal.title}</CardTitle>
                                    <CardDescription className="text-xs">{goal.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs">
                                            <span>{goal.current_value} / {goal.target_value} {goal.unit}</span>
                                            <span>{calculateProgress(goal)}%</span>
                                        </div>
                                        <Progress value={calculateProgress(goal)} className="h-2" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {goals?.length === 0 && <p className="col-span-full text-center text-muted-foreground py-8">Nenhuma meta encontrada.</p>}
                    </div>
                </TabsContent>

                <TabsContent value="habits" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {habits?.map(habit => (
                            <Card key={habit.id}>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <Badge variant="secondary" style={{ backgroundColor: `${habit.color}20`, color: habit.color || 'inherit' }}>{habit.category}</Badge>
                                    </div>
                                    <CardTitle className="text-base truncate">{habit.name}</CardTitle>
                                    <CardDescription className="text-xs">Meta: {habit.target}x / {habit.frequency.type === 'weekly' ? 'semana' : 'dia'}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button variant="outline" size="sm" className="w-full">Check-in</Button>
                                </CardContent>
                            </Card>
                        ))}
                        {habits?.length === 0 && <p className="col-span-full text-center text-muted-foreground py-8">Nenhum hábito encontrado.</p>}
                    </div>
                </TabsContent>
            </Tabs>

            <CreateGoalDialog open={isCreateGoalOpen} onOpenChange={setIsCreateGoalOpen} />
            <CreateHabitDialog open={isCreateHabitOpen} onOpenChange={setIsCreateHabitOpen} />
        </div>
    );
}
