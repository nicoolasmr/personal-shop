import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Users, Activity, Settings, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminPage() {
    return (
        <div className="space-y-8 animate-smooth-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Área Administrativa</h1>
                    <p className="text-muted-foreground mt-1">Gerencie permissões, usuários e configurações globais do sistema.</p>
                </div>
                <Button asChild className="shrink-0 gap-2 shadow-lg shadow-primary/20">
                    <Link to="/ops">
                        <Shield className="h-4 w-4" /> Console Ops Completo <ExternalLink className="h-3 w-3" />
                    </Link>
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="glass-card border-none shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Usuários Totais</CardTitle>
                        <Users className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">128</div>
                        <p className="text-xs text-muted-foreground mt-1">+12 novos esta semana</p>
                        <Button className="w-full mt-6" variant="secondary" size="sm">Gerenciar</Button>
                    </CardContent>
                </Card>

                <Card className="glass-card border-none shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Status do Sistema</CardTitle>
                        <Activity className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-emerald-500">100%</div>
                        <p className="text-xs text-muted-foreground mt-1">Sistemas operando normalmente</p>
                        <Button className="w-full mt-6" variant="secondary" size="sm">Ver Logs</Button>
                    </CardContent>
                </Card>

                <Card className="glass-card border-none shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Configurações Base</CardTitle>
                        <Settings className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">Ativas</div>
                        <p className="text-xs text-muted-foreground mt-1">V7.2.4 - Produção</p>
                        <Button className="w-full mt-6" variant="secondary" size="sm">Ajustar</Button>
                    </CardContent>
                </Card>
            </div>

            <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 flex flex-col sm:flex-row items-center gap-6">
                <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Shield className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-lg font-semibold">Painel de Controle de Operações</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        Para diagnósticos avançados, feature flags, auditoria de bugs e faturamento global, utilize o Console de Operações dedicado.
                    </p>
                </div>
                <Button variant="outline" asChild className="shrink-0 transition-all hover:bg-primary hover:text-white">
                    <Link to="/ops">Acessar Console</Link>
                </Button>
            </div>
        </div>
    );
}
