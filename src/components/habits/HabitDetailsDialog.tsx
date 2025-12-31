import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { HabitWithCheckins, HABIT_CATEGORIES } from '@/types/habits';
import { Edit, Trash2, Flame, Trophy, Calendar as CalendarIcon, Check, X } from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useDeleteHabit } from '@/hooks/queries/useHabits';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface HabitDetailsDialogProps {
    habit: HabitWithCheckins | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function HabitDetailsDialog({ habit, open, onOpenChange }: HabitDetailsDialogProps) {
    const { mutate: deleteHabit, isPending: isDeleting } = useDeleteHabit();
    const [confirmDelete, setConfirmDelete] = useState(false);

    if (!habit) return null;

    const handleDelete = () => {
        deleteHabit(habit.id, {
            onSuccess: () => {
                onOpenChange(false);
                setConfirmDelete(false);
            }
        });
    };

    // Quick Stats Calc
    const completedCount = habit.checkins?.filter(c => c.completed).length || 0;
    // Mock streak for now or calculate real one
    const currentStreak = 0;

    const getWeeklyStatus = () => {
        const today = new Date();
        const start = startOfWeek(today, { weekStartsOn: 0 });
        const days = [];
        for (let i = 0; i < 7; i++) {
            const current = addDays(start, i);
            const isDone = habit.checkins?.some(c => isSameDay(new Date(c.checkin_date), current) && c.completed);
            days.push({ date: current, isDone, isToday: isSameDay(current, today) });
        }
        return days;
    };
    const weekly = getWeeklyStatus();

    return (
        <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); setConfirmDelete(false); }}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-8 w-8 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: habit.color || 'gray' }}>
                            {/* Initials or Icon */}
                            {habit.name.substring(0, 1).toUpperCase()}
                        </div>
                        <Badge variant="outline" className="font-normal">
                            {HABIT_CATEGORIES.find(c => c.value === habit.category)?.label || habit.category}
                        </Badge>
                        <Badge variant="secondary" className="font-normal capitalize">
                            {habit.frequency.type === 'daily' ? 'Diário' : 'Semanal'}
                        </Badge>
                    </div>
                    <DialogTitle className="text-2xl">{habit.name}</DialogTitle>
                    {habit.description && <DialogDescription className="text-base">{habit.description}</DialogDescription>}
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg text-center border border-orange-100 dark:border-orange-900/50">
                            <div className="flex items-center justify-center gap-1 text-orange-600 font-medium mb-1">
                                <Flame className="h-4 w-4" /> Streak
                            </div>
                            <div className="text-2xl font-bold text-orange-700 dark:text-orange-500">{currentStreak}</div>
                        </div>
                        <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg text-center border border-green-100 dark:border-green-900/50">
                            <div className="flex items-center justify-center gap-1 text-green-600 font-medium mb-1">
                                <Check className="h-4 w-4" /> Total
                            </div>
                            <div className="text-2xl font-bold text-green-700 dark:text-green-500">{completedCount}</div>
                        </div>
                        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg text-center border border-blue-100 dark:border-blue-900/50">
                            <div className="flex items-center justify-center gap-1 text-blue-600 font-medium mb-1">
                                <Trophy className="h-4 w-4" /> Taxa
                            </div>
                            <div className="text-2xl font-bold text-blue-700 dark:text-blue-500">?%</div>
                        </div>
                    </div>

                    {/* Weekly View Detail */}
                    <div>
                        <h4 className="text-sm font-medium mb-4">Progresso da Semana</h4>
                        <div className="flex justify-between items-center bg-secondary/20 p-4 rounded-lg">
                            {weekly.map((day, idx) => (
                                <div key={idx} className="flex flex-col items-center gap-2">
                                    <span className="text-xs text-muted-foreground uppercase">{format(day.date, 'EEE', { locale: ptBR })}</span>
                                    <div className={cn(
                                        "h-10 w-10 rounded-full flex items-center justify-center transition-all border",
                                        day.isDone ? "bg-green-500 border-green-500 text-white" : "bg-background border-muted-foreground/20",
                                        day.isToday && !day.isDone && "ring-2 ring-primary ring-offset-2"
                                    )}>
                                        {day.isDone ? <Check className="h-5 w-5" /> : <span className="text-xs">{format(day.date, 'dd')}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    {confirmDelete ? (
                        <div className="flex w-full items-center justify-between bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
                            <span className="text-sm text-red-600 px-2">Tem certeza?</span>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>Cancelar</Button>
                                <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isDeleting}>
                                    {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                    Excluir
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex w-full justify-between">
                            <Button variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setConfirmDelete(true)}>
                                <Trash2 className="h-4 w-4 mr-2" /> Excluir Hábito
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
