import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Lock, Flame, CheckCircle, Star, Target, Rocket, Sparkles, Crown, Medal, Award } from 'lucide-react';
import { useAchievements } from '@/hooks/useAchievements';
import { useHabits } from '@/hooks/useHabits';

const ICON_MAP: Record<string, React.ReactNode> = {
    Flame: <Flame className="h-5 w-5" />, CheckCircle: <CheckCircle className="h-5 w-5" />,
    Star: <Star className="h-5 w-5" />, Trophy: <Trophy className="h-5 w-5" />,
    Target: <Target className="h-5 w-5" />, Rocket: <Rocket className="h-5 w-5" />,
    Sparkles: <Sparkles className="h-5 w-5" />, Crown: <Crown className="h-5 w-5" />,
    Medal: <Medal className="h-5 w-5" />, Award: <Award className="h-5 w-5" />,
};

export function AchievementsShowcase() {
    const { data: habits } = useHabits();
    const { data: achievements, isLoading } = useAchievements(habits || []);

    if (isLoading || !achievements) return null;

    const unlocked = achievements.filter(a => a.unlocked);
    const inProgress = achievements.filter(a => !a.unlocked && a.progress > 0).sort((a, b) => b.progress - a.progress).slice(0, 3);
    const recentUnlocked = unlocked.slice(0, 4);

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        Conquistas
                    </CardTitle>
                    <Badge variant="secondary">{unlocked.length}/{achievements.length}</Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {recentUnlocked.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {recentUnlocked.map((a) => (
                            <div key={a.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
                                style={{ backgroundColor: `${a.color}20`, color: a.color }}>
                                {ICON_MAP[a.icon] || <Star className="h-4 w-4" />}
                                <span className="font-medium">{a.name}</span>
                            </div>
                        ))}
                    </div>
                )}
                {inProgress.length > 0 && (
                    <div className="space-y-2">
                        <span className="text-xs text-muted-foreground font-medium">Em progresso</span>
                        {inProgress.map((a) => (
                            <div key={a.id} className="flex items-center gap-3">
                                <div className="p-1.5 rounded-lg opacity-50" style={{ backgroundColor: `${a.color}20` }}>
                                    <Lock className="h-4 w-4" style={{ color: a.color }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between text-sm mb-1">
                                        <span className="truncate">{a.name}</span>
                                        <span className="text-muted-foreground text-xs">{a.progress}%</span>
                                    </div>
                                    <Progress value={a.progress} className="h-1" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {unlocked.length === 0 && inProgress.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground text-sm">Continue progredindo para desbloquear conquistas!</div>
                )}
            </CardContent>
        </Card>
    );
}
