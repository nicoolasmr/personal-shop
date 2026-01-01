
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Home, CheckSquare, Target, Activity, BarChart2, DollarSign, Calendar, User, Settings, LogOut, Shield, MessageCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

interface SidebarProps {
    className?: string;
    onItemClick?: () => void;
    isCollapsed?: boolean;
    onToggle?: () => void;
}

export function Sidebar({ className, onItemClick, isCollapsed, onToggle }: SidebarProps) {
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
        { to: '/app/admin', icon: Shield, label: 'Administração' },
        { to: '/app/whatsapp', icon: MessageCircle, label: 'WhatsApp' },
        { to: '/app/profile', icon: User, label: 'Perfil' },
        { to: '/app/settings', icon: Settings, label: 'Configurações' },
    ];

    return (
        <aside className={cn(
            "flex flex-col border-r bg-card transition-all duration-300 relative h-full",
            isCollapsed ? "w-20" : "w-64",
            className
        )}>
            {/* Logo Section */}
            <div className={cn("p-6 flex items-center border-b mb-2", isCollapsed ? "justify-center px-4" : "px-6")}>
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-primary text-white flex items-center justify-center font-bold shadow-lg shadow-primary/20 shrink-0">V</div>
                {!isCollapsed && (
                    <span className="ml-3 font-bold text-lg tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent truncate">
                        VIDA360
                    </span>
                )}
            </div>

            <nav className={cn("flex-1 space-y-1 overflow-y-auto custom-scrollbar py-4", isCollapsed ? "px-2" : "px-4")}>
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={onItemClick}
                        title={isCollapsed ? item.label : undefined}
                        className={({ isActive }) => cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative",
                            isCollapsed ? "justify-center" : "",
                            isActive
                                ? "bg-primary/10 text-primary shadow-sm"
                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon className={cn("h-5 w-5 transition-colors", isActive && "text-primary")} />
                                {!isCollapsed && <span className="truncate">{item.label}</span>}
                                {isCollapsed && (
                                    <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                                        {item.label}
                                    </div>
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className={cn("p-4 border-t", isCollapsed ? "px-2" : "px-4")}>
                <Button
                    variant="ghost"
                    className={cn("w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all", isCollapsed ? "justify-center px-0" : "justify-start px-3")}
                    onClick={() => signOut()}
                >
                    <LogOut className={cn("h-5 w-5", !isCollapsed && "mr-2")} />
                    {!isCollapsed && <span>Sair</span>}
                </Button>
            </div>
        </aside>
    );
}

export function MobileSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    if (!isOpen) return null;
    return (
        <div
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex justify-start transition-all"
            onClick={onClose}
        >
            <div
                className="relative bg-card h-full w-72 shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col border-r shadow-primary/5"
                onClick={e => e.stopPropagation()}
            >
                <Sidebar className="flex w-full border-none h-full" onItemClick={onClose} isCollapsed={false} />
            </div>
        </div>
    );
}
