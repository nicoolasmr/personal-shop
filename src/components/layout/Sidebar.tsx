
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Home, CheckSquare, Target, Activity, BarChart2, DollarSign, Calendar, User, Settings, LogOut, Shield, MessageCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

interface SidebarProps {
    className?: string;
    onItemClick?: () => void;
}

export function Sidebar({ className, onItemClick }: SidebarProps) {
    const { signOut } = useAuth();

    // Updated navigation items to match the user's uploaded images
    const navItems = [
        { to: '/app/home', icon: Home, label: 'Início' },
        { to: '/app/tasks', icon: CheckSquare, label: 'Tarefas' },
        { to: '/app/finance', icon: DollarSign, label: 'Finanças' },
        { to: '/app/calendar', icon: Calendar, label: 'Agenda' },
        { to: '/app/habits', icon: Activity, label: 'Hábitos' },
        { to: '/app/goals', icon: Target, label: 'Metas' },
        { to: '/app/stats', icon: BarChart2, label: 'Estatísticas' },
        { to: '/app/admin', icon: Shield, label: 'Administração' }, // Added
        { to: '/app/whatsapp', icon: MessageCircle, label: 'WhatsApp' }, // Added
        { to: '/app/profile', icon: User, label: 'Perfil' },
        // Settings moved to bottom/separate section visually often, but here list is fine
        { to: '/app/settings', icon: Settings, label: 'Configurações' },
    ];

    return (
        <aside className={cn("h-screen w-64 flex-col border-r bg-card flex", className)}>
            <div className="p-6">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">VIDA360</h1>
            </div>

            <nav className="flex-1 space-y-1 px-4">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={onItemClick}
                        className={({ isActive }) => cn(
                            "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                            isActive ? "bg-accent text-accent-foreground text-primary" : "text-muted-foreground"
                        )}
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon className={cn("h-4 w-4", isActive && "text-primary")} />
                                {item.label}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t">
                <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20" onClick={() => signOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                </Button>
            </div>
        </aside>
    );
}

export function MobileSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 bg-black/80 md:hidden flex justify-start" onClick={onClose}>
            <div className="relative bg-card h-full w-64 shadow-xl animate-in slide-in-from-left duration-200" onClick={e => e.stopPropagation()}>
                <Sidebar onItemClick={onClose} />
            </div>
        </div>
    );
}
