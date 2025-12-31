import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Goal, calculateProgress, isGoalOverdue, GOAL_TYPE_CONFIGS, GOAL_STATUS_LABELS } from '@/types/goals';
import { Edit, Trash2, Calendar, Target, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useDeleteGoal } from '@/hooks/useGoals';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface GoalDetailsDialogProps {
    goal: Goal | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function GoalDetailsDialog({ goal, open, onOpenChange }: GoalDetailsDialogProps) {
    const { mutate: deleteGoal, isPending: isDeleting } = useDeleteGoal();
    const [confirmDelete, setConfirmDelete] = useState(false);

    if (!goal) return null;

    const progress = calculateProgress(goal);
    const typeConfig = GOAL_TYPE_CONFIGS[goal.type] || GOAL_TYPE_CONFIGS['custom'];
    const overdue = isGoalOverdue(goal);

    const handleDelete = () => {
        deleteGoal(goal.id, {
            onSuccess: () => {
                onOpenChange(false);
                setConfirmDelete(false);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); setConfirmDelete(false); }}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <div className={cn("p-2 rounded-lg bg-secondary", `bg-${typeConfig.color}-100 text-${typeConfig.color}-600 dark:bg-${typeConfig.color}-900/20`)}>
                            {/* Icon placeholder since we don't have dynamic Icon component here easily, using Target default */}
                            <Target className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{typeConfig.label}</span>
                        {overdue && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">Atrasada</span>}
                        {goal.status === 'done' && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Concluída</span>}
                    </div>
                    <DialogTitle className="text-2xl">{goal.title}</DialogTitle>
                    {goal.description && <DialogDescription className="text-base">{goal.description}</DialogDescription>}
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-secondary/30 rounded-lg text-center">
                            <div className="text-xs text-muted-foreground uppercase font-bold mb-1">Alvo</div>
                            <div className="text-xl font-bold">{goal.target_value} <span className="text-sm font-normal text-muted-foreground">{goal.unit}</span></div>
                        </div>
                        <div className="p-4 bg-secondary/30 rounded-lg text-center">
                            <div className="text-xs text-muted-foreground uppercase font-bold mb-1">Atual</div>
                            <div className="text-xl font-bold">{goal.current_value} <span className="text-sm font-normal text-muted-foreground">{goal.unit}</span></div>
                        </div>
                        <div className="p-4 bg-secondary/30 rounded-lg text-center">
                            <div className="text-xs text-muted-foreground uppercase font-bold mb-1">Restam</div>
                            <div className="text-xl font-bold">{(goal.target_value || 0) - goal.current_value} <span className="text-sm font-normal text-muted-foreground">{goal.unit}</span></div>
                        </div>
                    </div>

                    {/* Progress Bar Large */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="font-medium">Progresso Geral</span>
                            <span className="font-bold">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-4" />
                    </div>

                    {/* Metadata */}
                    <div className="flex flex-col sm:flex-row gap-4 text-sm text-muted-foreground border-t pt-4">
                        {goal.due_date && (
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>Data Limite: {format(new Date(goal.due_date), 'dd/MM/yyyy')}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Status: {GOAL_STATUS_LABELS[goal.status]}</span>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    {confirmDelete ? (
                        <div className="flex w-full items-center justify-between bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
                            <span className="text-sm text-red-600 px-2">Tem certeza? Isso não pode ser desfeito.</span>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>Cancelar</Button>
                                <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isDeleting}>
                                    {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                    Sim, Excluir
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex w-full justify-between">
                            <Button variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setConfirmDelete(true)}>
                                <Trash2 className="h-4 w-4 mr-2" /> Excluir Meta
                            </Button>
                            <Button variant="outline">
                                <Edit className="h-4 w-4 mr-2" /> Editar
                            </Button>
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
