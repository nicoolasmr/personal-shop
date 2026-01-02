
import { Menu, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
    const { user } = useAuth();

    return (
        <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b bg-background px-4 md:px-6">
            <div className="flex items-center gap-2 sm:gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-accent/50 transition-colors shrink-0 lg:hidden"
                    onClick={onMenuClick}
                    title="Menu"
                >
                    <Menu className="h-5 w-5" />
                </Button>

                <span className="font-bold text-lg bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    VIDA360
                </span>
            </div>

            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon">
                    <Bell className="h-5 w-5" />
                </Button>
                <Avatar className="h-8 w-8">
                    <AvatarImage src="" /> {/* Avatar URL would come from user profile hook */}
                    <AvatarFallback>{user?.email?.[0].toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
            </div>
        </header>
    );
}
