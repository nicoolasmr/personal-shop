import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Sprout, Leaf, Zap, Star, Medal, Award, Trophy, Crown, Sparkles, Sun } from 'lucide-react';
import { useGamification } from '@/hooks/useGamification';
import { LEVELS } from '@/types/levels'; // Fixed import source: LEVELS is in levels.ts not gamification.ts based on earlier checkpoints

const LEVEL_ICONS: Record<string, React.ReactNode> = {
    Sprout: <Sprout className="h-6 w-6" />, Leaf: <Leaf className="h-6 w-6" />, Zap: <Zap className="h-6 w-6" />,
    Star: <Star className="h-6 w-6" />, Medal: <Medal className="h-6 w-6" />, Award: <Award className="h-6 w-6" />,
    Trophy: <Trophy className="h-6 w-6" />, Crown: <Crown className="h-6 w-6" />, Sparkles: <Sparkles className="h-6 w-6" />,
    Sun: <Sun className="h-6 w-6" />,
};

export function LevelProgressCard() {
    const { userXP, totalXP } = useGamification();
    const { currentLevel, progressPercent, xpToNextLevel } = userXP;
    const nextLevel = LEVELS.find(l => l.level === currentLevel.level + 1);

    return (
        <Card className="overflow-hidden">
            <div className="h-2" style={{ backgroundColor: currentLevel.color }} />
            <CardContent className="pt-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl" style={{ backgroundColor: `${currentLevel.color}20`, color: currentLevel.color }}>
                        {LEVEL_ICONS[currentLevel.icon]}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-lg">{currentLevel.name}</span>
                            <Badge variant="secondary" className="text-xs" style={{ backgroundColor: `${currentLevel.color}20`, color: currentLevel.color }}>
                                Nível {currentLevel.level}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <span className="font-medium">{totalXP.toLocaleString()} XP</span>
                            {nextLevel && <><span>•</span><span>{xpToNextLevel.toLocaleString()} XP para {nextLevel.name}</span></>}
                        </div>
                        <Progress value={progressPercent} className="h-2" style={{ '--progress-background': `${currentLevel.color}30`, '--progress-foreground': currentLevel.color } as React.CSSProperties} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
