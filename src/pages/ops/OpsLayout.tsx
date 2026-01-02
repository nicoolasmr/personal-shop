import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Building2,
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
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const navItems = [
        { to: '/ops', icon: LayoutDashboard, label: 'Overview', end: true },
        { to: '/ops/users', icon: Users, label: 'Users' },
        { to: '/ops/orgs', icon: Building2, label: 'Academies' },
        { to: '/ops/team', icon: ShieldAlert, label: 'Team Access' },
        { to: '/ops/diagnostics', icon: Activity, label: 'Diagnostics' },
        { to: '/ops/bugs', icon: Bug, label: 'Bug Reports' },
        { to: '/ops/billing', icon: CreditCard, label: 'Billing' },
        { to: '/ops/flags', icon: Flag, label: 'Feature Flags' },
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex font-mono selection:bg-emerald-500/30 overflow-hidden">
            {/* Sidebar Desktop */}
            <aside className="hidden lg:flex w-64 border-r border-slate-800 flex-col bg-slate-900/50">
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
            {/* Mobile Sidebar Overlay */}
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex justify-start transition-all"
                    onClick={() => setSidebarOpen(false)}
                >
                    <div
                        className="relative bg-slate-900 h-full w-72 shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col border-r border-slate-800"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-slate-800 flex items-center gap-2">
                            <div className="h-4 w-4 rounded bg-red-500" />
                            <span className="font-bold text-lg tracking-tight text-slate-100 uppercase">Ops Console</span>
                        </div>
                        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                            {navItems.map(item => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    end={item.end}
                                    onClick={() => setSidebarOpen(false)}
                                    className={({ isActive }) => `
                                        flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all
                                        ${isActive
                                            ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                                            : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}
                                    `}
                                >
                                    <item.icon size={18} />
                                    {item.label}
                                </NavLink>
                            ))}
                        </nav>
                        <div className="p-4 border-t border-slate-800">
                            <button onClick={signOut} className="flex items-center gap-3 px-4 py-3 w-full text-left text-sm text-red-500 hover:bg-red-950/20 rounded-lg">
                                <LogOut size={18} /> Exit Console
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="h-16 border-b border-slate-800 bg-slate-900/30 flex items-center justify-between px-4 lg:px-8 backdrop-blur-sm sticky top-0 z-10 transition-all">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-slate-800 rounded-lg text-slate-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                        </button>
                        <div className="text-[10px] sm:text-xs text-emerald-500/80 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                            <span className="hidden sm:inline">SYSTEM OPERATIONAL</span>
                            <span className="sm:hidden">ACTIVE</span>
                        </div>
                    </div>
                    <div className="text-[10px] sm:text-xs text-slate-500">
                        {new Date().toLocaleDateString()}
                    </div>
                </header>
                <main className="flex-1 p-3 sm:p-6 lg:p-8 overflow-auto relative">
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
