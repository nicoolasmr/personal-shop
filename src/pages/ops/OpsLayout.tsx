
import { Outlet, NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    ShieldAlert,
    Activity,
    Bug,
    CreditCard,
    Flag,
    LogOut
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const OpsLayout = () => {
    const { signOut } = useAuth();

    const navItems = [
        { to: '/ops', icon: LayoutDashboard, label: 'Overview', end: true },
        { to: '/ops/users', icon: Users, label: 'Users' },
        { to: '/ops/team', icon: ShieldAlert, label: 'Team Access' },
        { to: '/ops/diagnostics', icon: Activity, label: 'Diagnostics' },
        { to: '/ops/bugs', icon: Bug, label: 'Bug Reports' },
        { to: '/ops/billing', icon: CreditCard, label: 'Billing' },
        { to: '/ops/flags', icon: Flag, label: 'Feature Flags' },
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex font-mono selection:bg-emerald-500/30">
            {/* Sidebar */}
            <aside className="w-64 border-r border-slate-800 flex flex-col bg-slate-900/50">
                <div className="p-6 border-b border-slate-800 flex items-center gap-2">
                    <div className="h-6 w-6 rounded bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                    <span className="font-bold text-lg tracking-tight text-slate-100">VIDA360 OPS</span>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) => `
                                flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all
                                ${isActive
                                    ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}
                            `}
                        >
                            <item.icon size={18} />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={signOut}
                        className="flex items-center gap-3 px-4 py-3 w-full text-left text-sm text-slate-500 hover:bg-red-950/20 hover:text-red-400 rounded-lg transition-colors"
                    >
                        <LogOut size={18} />
                        Exit Console
                    </button>
                    <div className="text-[10px] text-slate-600 text-center mt-4">
                        SECURE CONNECTION ESTABLISHED
                        <br />
                        ID: {crypto.randomUUID().slice(0, 8)}
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="h-16 border-b border-slate-800 bg-slate-900/30 flex items-center justify-between px-8 backdrop-blur-sm sticky top-0 z-10">
                    <div className="text-xs text-emerald-500/80 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        SYSTEM OPERATIONAL
                    </div>
                    <div className="text-xs text-slate-500">
                        {new Date().toLocaleDateString()}
                    </div>
                </header>
                <main className="flex-1 p-8 overflow-auto relative">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
                        style={{ backgroundImage: 'radial-gradient(circle at 10px 10px, #fff 1px, transparent 0)', backgroundSize: '40px 40px' }}
                    />
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default OpsLayout;
