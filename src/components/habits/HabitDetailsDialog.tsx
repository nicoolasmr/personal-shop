import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { HabitWithCheckins, HABIT_CATEGORIES } from '@/types/habits';
import { Edit, Trash2, Flame, Trophy, Calendar as CalendarIcon, Check, X, Target, Info } from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay, subDays, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useDeleteHabit } from '@/hooks/queries/useHabits';
import { useState, useMemo } from 'react';
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

    const stats = useMemo(() => {
        if (!habit) return { currentStreak: 0, totalCompletions: 0, weeklyRate: 0, progress: 0 };

        const sortedCheckins = (habit.checkins || [])
            .filter(c => c.completed)
            .map(c => new Date(c.checkin_date))
            .sort((a, b) => b.getTime() - a.getTime());

        let streak = 0;
        if (sortedCheckins.length > 0) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            let lastDate = sortedCheckins[0];
            lastDate.setHours(0, 0, 0, 0);

            // If last checkin was yesterday or today, count streak
            const diffFromToday = differenceInDays(today, lastDate);
            if (diffFromToday <= 1) {
                streak = 1;
                for (let i = 1; i < sortedCheckins.length; i++) {
                    const current = sortedCheckins[i];
                    current.setHours(0, 0, 0, 0);
                    const diff = differenceInDays(lastDate, current);
                    if (diff === 1) {
                        streak++;
                        lastDate = current;
                    } else if (diff > 1) {
                        break;
                    }
                }
            }
        }

        const totalCompletions = sortedCheckins.length;

        // Weekly rate calculation (last 7 days coverage)
        const sevenDaysAgo = subDays(new Date(), 7);
        const last7DaysCheckins = sortedCheckins.filter(d => d >= sevenDaysAgo).length;
        const weeklyRate = Math.round((last7DaysCheckins / 7) * 100);

        // Progress based on weekly goal
        const startOfCurrentWeek = startOfWeek(new Date(), { weekStartsOn: 0 });
        const thisWeekCheckins = sortedCheckins.filter(d => d >= startOfCurrentWeek).length;
        const goal = habit.weekly_goal || 7;
        const progress = Math.min(Math.round((thisWeekCheckins / goal) * 100), 100);

        return { currentStreak: streak, totalCompletions, weeklyRate, progress };
    }, [habit]);

    if (!habit) return null;

    const handleDelete = () => {
        deleteHabit(habit.id, {
            onSuccess: () => {
                onOpenChange(false);
                setConfirmDelete(false);
            }
        });
    };

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
            <DialogContent className="max-w-[95vw] sm:max-w-[550px] max-h-[90vh] overflow-y-auto rounded-xl">
                <DialogHeader className="space-y-4">
                    <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                            <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-sm"
                                style={{ backgroundColor: habit.color || '#3b82f6' }}>
                                {habit.name.substring(0, 1).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                                <Badge variant="secondary" className="w-fit text-[10px] h-5 px-1.5 font-medium mb-1">
                                    {HABIT_CATEGORIES.find(c => c.value === habit.category)?.label || habit.category}
                                </Badge>
                                <DialogTitle className="text-xl leading-none">{habit.name}</DialogTitle>
                            </div>
                        </div>
                        <Badge variant="outline" className="h-6 gap-1 capitalize font-normal border-primary/20 bg-primary/5 text-primary">
                            <CalendarIcon className="h-3 w-3" />
                            {habit.frequency.type === 'daily' ? 'Diário' : 'Específico'}
                        </Badge>
                    </div>
                    {habit.description && (
                        <DialogDescription className="text-sm bg-muted/30 p-3 rounded-lg border border-border/50">
                            {habit.description}
                        </DialogDescription>
                    )}
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="px-2 py-4 bg-orange-50/50 dark:bg-orange-500/5 rounded-2xl text-center border border-orange-100 dark:border-orange-500/20 group hover:scale-[1.02] transition-transform">
                            <div className="flex items-center justify-center gap-1.5 text-orange-600 dark:text-orange-400 text-[10px] font-bold uppercase tracking-wider mb-2">
                                <Flame className="h-3.5 w-3.5 fill-orange-600 dark:fill-orange-400" /> STREAK
                            </div>
                            <div className="text-2xl font-black text-orange-700 dark:text-orange-400">{stats.currentStreak}d</div>
                        </div>
                        <div className="px-2 py-4 bg-green-50/50 dark:bg-green-500/5 rounded-2xl text-center border border-green-100 dark:border-green-500/20 group hover:scale-[1.02] transition-transform">
                            <div className="flex items-center justify-center gap-1.5 text-green-600 dark:text-green-400 text-[10px] font-bold uppercase tracking-wider mb-2">
                                <Trophy className="h-3.5 w-3.5 fill-green-600 dark:fill-green-400" /> TOTAL
                            </div>
                            <div className="text-2xl font-black text-green-700 dark:text-green-400">{stats.totalCompletions}</div>
                        </div>
                        <div className="px-2 py-4 bg-blue-50/50 dark:bg-blue-500/5 rounded-2xl text-center border border-blue-100 dark:border-blue-500/20 group hover:scale-[1.02] transition-transform">
                            <div className="flex items-center justify-center gap-1.5 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider mb-2">
                                <Check className="h-3.5 w-3.5" /> TAXA
                            </div>
                            <div className="text-2xl font-black text-blue-700 dark:text-blue-400">{stats.weeklyRate}%</div>
                        </div>
                    </div>

                    {/* Progress Bar Section */}
                    <div className="space-y-2.5">
                        <div className="flex justify-between items-end">
                            <div className="space-y-0.5">
                                <h4 className="text-sm font-bold flex items-center gap-2">
                                    Meta da Semana
                                    <span className="text-xs font-normal text-muted-foreground">({habit.weekly_goal || 7} dias)</span>
                                </h4>
                            </div>
                            <span className="text-sm font-black text-primary">{stats.progress}%</span>
                        </div>
                        <div className="relative h-3 w-full bg-secondary/50 rounded-full overflow-hidden border border-border/50">
                            <div
                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-indigo-600 transition-all duration-500"
                                style={{ width: `${stats.progress}%` }}
                            />
                        </div>
                    </div>

                    {/* Weekly Timeline */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-bold flex items-center gap-2">Histórico Semanal</h4>
                        <div className="flex justify-between items-center bg-muted/20 p-4 rounded-2xl border border-border/50 shadow-inner">
                            {weekly.map((day, idx) => (
                                <div key={idx} className="flex flex-col items-center gap-2">
                                    <span className={cn(
                                        "text-[10px] font-black uppercase tracking-tighter",
                                        day.isToday ? "text-primary" : "text-muted-foreground/60"
                                    )}>
                                        {format(day.date, 'eee', { locale: ptBR })}
                                    </span>
                                    <div className={cn(
                                        "h-10 w-10 sm:h-12 sm:w-12 rounded-2xl flex items-center justify-center transition-all duration-300 border-2 shadow-sm",
                                        day.isDone
                                            ? "bg-green-500 border-green-400 text-white scale-110 shadow-green-500/20"
                                            : "bg-background border-border/50 text-muted-foreground",
                                        day.isToday && !day.isDone && "border-primary ring-2 ring-primary/20",
                                        !day.isDone && "bg-muted/10"
                                    )}>
                                        {day.isDone ? (
                                            <Check className="h-6 w-6 stroke-[3px]" />
                                        ) : (
                                            <span className="text-xs font-bold">{format(day.date, 'dd')}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter className="mt-8">
                    {confirmDelete ? (
                        <div className="flex w-full items-center justify-between bg-red-50 dark:bg-red-950/20 p-3 rounded-xl border border-red-200 dark:border-red-900 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-center gap-2 text-red-700 dark:text-red-400 text-sm font-medium">
                                <Info className="h-4 w-4" />
                                <span>Remover permanentemente?</span>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)} className="h-8 hover:bg-white dark:hover:bg-black/20">Cancelar</Button>
                                <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isDeleting} className="h-8 shadow-sm">
                                    {isDeleting && <Loader2 className="h-3 w-3 mr-2 animate-spin" />}
                                    Sim, Excluir
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex w-full items-center justify-between gap-3">
                            <Button variant="ghost" className="text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-colors h-11" onClick={() => setConfirmDelete(true)}>
                                <Trash2 className="h-4 w-4 mr-2" /> Excluir
                            </Button>
                            <div className="flex gap-2">
                                <Button variant="outline" className="rounded-xl h-11 px-6 border-border/50 hover:bg-secondary/50" onClick={() => onOpenChange(false)}>
                                    Fechar
                                </Button>
                                <Button className="rounded-xl h-11 px-8 shadow-lg shadow-primary/20" onClick={() => onOpenChange(false)}>
                                    Continuar
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
