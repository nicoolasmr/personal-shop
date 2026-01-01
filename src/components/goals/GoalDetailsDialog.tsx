import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Goal, calculateProgress, isGoalOverdue, GOAL_TYPE_CONFIGS, GOAL_STATUS_LABELS } from '@/types/goals';
import { Edit, Trash2, Calendar, Target, CheckCircle2, XCircle, Loader2, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useDeleteGoal, useAddProgress } from '@/hooks/useGoals';
import { useState } from 'react';

interface GoalDetailsDialogProps {
    goal: Goal | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onEdit?: (goal: Goal) => void;
}

export function GoalDetailsDialog({ goal, open, onOpenChange, onEdit }: GoalDetailsDialogProps) {
    const { mutate: deleteGoal, isPending: isDeleting } = useDeleteGoal();
    const { mutate: addProgress, isPending: isUpdating } = useAddProgress();

    // State
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [progressInput, setProgressInput] = useState('');
    const [noteInput, setNoteInput] = useState('');

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

    const handleAddProgress = () => {
        const val = parseFloat(progressInput);
        if (isNaN(val) || val <= 0) return;

        addProgress({ goalId: goal.id, payload: { delta_value: val, notes: noteInput || 'Atualização manual' } }, {
            onSuccess: () => {
                setProgressInput('');
                setNoteInput('');
                // Keep dialog open to see result
            }
        });
    };

    // Todo: integrate full edit form. For now, we will handle "Edit" by alerting or switching view. 
    // Since implementing a full form here is complex, we'll placeholder it or fix the button to open the CreateDialog in edit mode if that component supports it.
    // Assuming the user wants immediate fix, I'll add "Add Progress" section first which was requested.

    return (
        <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); setConfirmDelete(false); setIsEditMode(false); }}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    {/* ... Header content ... */}
                    <div className="flex items-center gap-2 mb-2">
                        <div className={cn("p-2 rounded-lg bg-secondary", `bg-${typeConfig.color}-100 text-${typeConfig.color}-600 dark:bg-${typeConfig.color}-900/20`)}>
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
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-4 bg-muted/50 rounded-lg text-center">
                            <div className="text-sm text-muted-foreground mb-1">Meta</div>
                            <div className="text-xl font-bold">{goal.target_value} {goal.unit}</div>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg text-center">
                            <div className="text-sm text-muted-foreground mb-1">Atual</div>
                            <div className="text-xl font-bold">{goal.current_value || 0} {goal.unit}</div>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg text-center">
                            <div className="text-sm text-muted-foreground mb-1">Restante</div>
                            <div className="text-xl font-bold">
                                {Math.max(0, goal.target_value - (goal.current_value || 0))} {goal.unit}
                            </div>
                        </div>
                    </div>     {/* Progress Bar Large */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="font-medium">Progresso Geral</span>
                            <span className="font-bold">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-4" />
                    </div>

                    {/* Add Progress Section */}
                    {goal.status !== 'done' && (
                        <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                            <h4 className="font-semibold text-sm">Adicionar Progresso</h4>
                            <div className="flex gap-3">
                                <div className="flex-1 space-y-1">
                                    <Input
                                        type="number"
                                        placeholder={`Quantidade (${goal.unit})`}
                                        value={progressInput}
                                        onChange={e => setProgressInput(e.target.value)}
                                    />
                                </div>
                                <div className="flex-[2] space-y-1">
                                    <Input
                                        placeholder="Nota (opcional)"
                                        value={noteInput}
                                        onChange={e => setNoteInput(e.target.value)}
                                    />
                                </div>
                                <Button onClick={handleAddProgress} disabled={!progressInput || isUpdating}>
                                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                    )}

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
                            <Button variant="outline" onClick={() => onEdit?.(goal)}>
                                <Edit className="h-4 w-4 mr-2" /> Editar
                            </Button>
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
