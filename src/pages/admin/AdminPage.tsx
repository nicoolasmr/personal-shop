import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Users, Activity, Settings, ExternalLink, Loader2, Building2, ScrollText } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getAdminStats, AdminStats, getAuditLogs } from '@/services/admin';

export default function AdminPage() {
    const navigate = useNavigate();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadStats = async () => {
            try {
                const [data, logsData] = await Promise.all([
                    getAdminStats(),
                    getAuditLogs(5)
                ]);
                setStats(data);
                setLogs(logsData || []);
            } catch (error) {
                console.error('Error loading admin stats:', error);
                toast.error('Erro ao carregar dados administrativos');
            } finally {
                setLoading(false);
            }
        };
        loadStats();
    }, []);

    const handleManageUsers = () => {
        navigate('/ops/users');
    };

    const handleManageOrgs = () => {
        navigate('/ops/orgs');
    };

    const handleViewLogs = () => {
        navigate('/ops/diagnostics');
    };

    const handleSettings = () => {
        navigate('/ops/flags');
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-smooth-in pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Célula de Operações</h1>
                    <p className="text-muted-foreground mt-1">Visão global de métricas, usuários e integridade operacional.</p>
                </div>
                <Button asChild className="shrink-0 gap-2 shadow-lg shadow-primary/20">
                    <Link to="/ops">
                        <Shield className="h-4 w-4" /> Centro de Missão <ExternalLink className="h-3 w-3" />
                    </Link>
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="glass-card border-none shadow-lg group hover:ring-2 ring-primary/20 transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Usuários</CardTitle>
                        <Users className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-primary">{stats?.totalUsers || 0}</div>
                        <p className="text-xs font-medium text-emerald-600 mt-2 flex items-center gap-1">
                            +{stats?.newUsersThisWeek || 0} esta semana
                        </p>
                        <Button className="w-full mt-6 bg-primary/5 text-primary hover:bg-primary hover:text-white border-none" size="sm" onClick={handleManageUsers}>
                            Diretório
                        </Button>
                    </CardContent>
                </Card>

                <Card className="glass-card border-none shadow-lg group hover:ring-2 ring-blue-500/20 transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Organizações</CardTitle>
                        <Building2 className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-blue-500">{stats?.totalOrgs || 0}</div>
                        <p className="text-xs font-medium text-muted-foreground mt-2">Academias registradas</p>
                        <Button className="w-full mt-6 bg-blue-500/5 text-blue-600 hover:bg-blue-500 hover:text-white border-none" size="sm" onClick={handleManageOrgs}>
                            Gerenciar
                        </Button>
                    </CardContent>
                </Card>

                <Card className="glass-card border-none shadow-lg group hover:ring-2 ring-emerald-500/20 transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Saúde do Sistema</CardTitle>
                        <Activity className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-emerald-500">{stats?.systemHealth}%</div>
                        <p className="text-xs font-medium text-muted-foreground mt-2">Sistemas nominais</p>
                        <Button className="w-full mt-6 bg-emerald-500/5 text-emerald-600 hover:bg-emerald-500 hover:text-white border-none" size="sm" onClick={handleViewLogs}>
                            Diagnóstico
                        </Button>
                    </CardContent>
                </Card>

                <Card className="glass-card border-none shadow-lg group hover:ring-2 ring-amber-500/20 transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Flags</CardTitle>
                        <Settings className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-amber-500">
                            {stats?.featureFlags.filter(f => f.is_enabled).length || 0}
                        </div>
                        <p className="text-xs font-medium text-muted-foreground mt-2">Recursos ativos</p>
                        <Button className="w-full mt-6 bg-amber-500/5 text-amber-600 hover:bg-amber-500 hover:text-white border-none" size="sm" onClick={handleSettings}>
                            Configurar
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <div className="bg-gradient-to-br from-card to-secondary/20 rounded-3xl border p-6">
                <div className="flex items-center gap-2 mb-6">
                    <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <ScrollText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">Atividade Recente (Ops)</h3>
                        <p className="text-xs text-muted-foreground">Últimas ações administrativas e eventos do sistema.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {logs.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm italic">Nenhuma atividade recente registrada.</div>
                    ) : (
                        logs.map((log: any) => {
                            const { icon, title, description, color } = formatLogEntry(log);
                            return (
                                <div key={log.id} className="flex gap-4 items-start p-3 hover:bg-secondary/40 rounded-xl transition-colors text-sm border border-transparent hover:border-border/50">
                                    <div className="flex flex-col items-center gap-1 shrink-0 w-16 pt-1">
                                        <span className="font-bold text-xs text-foreground">
                                            {new Date(log.created_at).toLocaleString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground uppercase">
                                            {new Date(log.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>

                                    <div className={`mt-1 p-2 rounded-full bg-secondary/50 ${color}`}>
                                        {icon}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-foreground flex items-center gap-2">
                                            {title}
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1 break-words leading-relaxed">
                                            {description}
                                        </div>
                                    </div>

                                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md shrink-0">
                                        {log.entity_type}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}

// Helper function to make logs human-readable
function formatLogEntry(log: any) {
    let icon = <Activity className="h-4 w-4" />;
    let title = log.action;
    let description: any = JSON.stringify(log.meta);
    let color = "text-slate-500";

    const meta = log.meta || {};

    switch (log.action) {
        case 'flag_update':
            icon = <Settings className="h-4 w-4" />;
            title = "Alteração de Recurso";
            color = meta.new_val ? "text-emerald-500" : "text-amber-500";
            const keyName = meta.key?.replace(/_/g, ' ') || 'recurso desconhecido';
            description = (
                <span>
                    O recurso <strong className="text-foreground capitalize">{keyName}</strong> foi {meta.new_val ? <span className="text-emerald-600 dark:text-emerald-400 font-bold">ATIVADO</span> : <span className="text-amber-600 dark:text-amber-400 font-bold">DESATIVADO</span>}.
                </span>
            );
            break;

        case 'user_login':
            icon = <Users className="h-4 w-4" />;
            title = "Login de Usuário";
            color = "text-blue-500";
            description = `Acesso registrado via ${meta.method || 'email'}.`;
            break;

        case 'org_create':
            icon = <Building2 className="h-4 w-4" />;
            title = "Nova Organização";
            color = "text-indigo-500";
            description = `Organização "${meta.name}" foi criada.`;
            break;

        default:
            // Generic formatting for unknown/custom events
            if (log.action.includes('error')) {
                color = "text-red-500";
                icon = <Activity className="h-4 w-4" />;
                description = meta.error || description;
            }
            title = log.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            break;
    }

    return { icon, title, description, color };
}
