import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Users, Activity, Settings, ExternalLink, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getAdminStats, AdminStats } from '@/services/admin';

export default function AdminPage() {
    const navigate = useNavigate();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadStats = async () => {
            try {
                const data = await getAdminStats();
                setStats(data);
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
        <div className="space-y-8 animate-smooth-in">
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="glass-card border-none shadow-lg group hover:ring-2 ring-primary/20 transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Usuários Totais</CardTitle>
                        <Users className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-primary">{stats?.totalUsers || 0}</div>
                        <p className="text-xs font-medium text-emerald-600 mt-2 flex items-center gap-1">
                            +{stats?.newUsersThisWeek || 0} na última semana
                        </p>
                        <Button
                            className="w-full mt-6 bg-primary/5 text-primary hover:bg-primary hover:text-white transition-colors border-none"
                            size="sm"
                            onClick={handleManageUsers}
                        >
                            Ver Diretório
                        </Button>
                    </CardContent>
                </Card>

                <Card className="glass-card border-none shadow-lg group hover:ring-2 ring-emerald-500/20 transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Disponibilidade</CardTitle>
                        <Activity className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-emerald-500">{stats?.systemHealth}%</div>
                        <p className="text-xs font-medium text-muted-foreground mt-2">Sistemas operando nominalmente</p>
                        <Button
                            className="w-full mt-6 bg-emerald-500/5 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-colors border-none"
                            size="sm"
                            onClick={handleViewLogs}
                        >
                            Monitorar Eventos
                        </Button>
                    </CardContent>
                </Card>

                <Card className="glass-card border-none shadow-lg group hover:ring-2 ring-amber-500/20 transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Feature Flags</CardTitle>
                        <Settings className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-amber-500">
                            {stats?.featureFlags.filter(f => f.is_enabled).length || 0} / {stats?.featureFlags.length || 0}
                        </div>
                        <p className="text-xs font-medium text-muted-foreground mt-2">Recursos ativos em produção</p>
                        <Button
                            className="w-full mt-6 bg-amber-500/5 text-amber-600 hover:bg-amber-500 hover:text-white transition-colors border-none"
                            size="sm"
                            onClick={handleSettings}
                        >
                            Configurar Flags
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <div className="p-8 bg-gradient-to-br from-primary/10 via-background to-background rounded-3xl border border-primary/10 flex flex-col sm:flex-row items-center gap-8 shadow-inner">
                <div className="h-20 w-20 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0 shadow-lg rotate-3 group-hover:rotate-0 transition-transform">
                    <Shield className="h-10 w-10 text-primary" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-2xl font-black tracking-tight">Console de Engenharia</h3>
                    <p className="text-base text-muted-foreground mt-2 max-w-xl">
                        Acesso exclusivo para auditoria de segurança, depuração de erros em tempo real e gestão de infraestrutura.
                    </p>
                </div>
                <Button asChild className="shrink-0 h-12 px-8 rounded-xl font-bold bg-primary shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
                    <Link to="/ops">Acessar Console</Link>
                </Button>
            </div>
        </div>
    );
}
