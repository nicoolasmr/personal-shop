import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Users, Activity, Settings } from 'lucide-react';

export default function AdminPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Área Administrativa</h1>
            <p className="text-muted-foreground">Gerencie as configurações globais do sistema.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Usuários</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12</div>
                        <p className="text-xs text-muted-foreground">+2 novos este mês</p>
                        <Button className="w-full mt-4" variant="outline">Gerenciar Usuários</Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">System Health</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">98%</div>
                        <p className="text-xs text-muted-foreground">Todos os sistemas operacionais</p>
                        <Button className="w-full mt-4" variant="outline">Ver Logs</Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Configurações</CardTitle>
                        <Settings className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Geral</div>
                        <p className="text-xs text-muted-foreground">Ajustes da plataforma</p>
                        <Button className="w-full mt-4" variant="outline">Acessar</Button>
                    </CardContent>
                </Card>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg border">
                <h3 className="font-semibold flex items-center gap-2 mb-2"><Shield className="h-5 w-5" /> Acesso Restrito</h3>
                <p className="text-sm text-muted-foreground">Esta área é visível apenas para administradores. Se você está vendo isso, seu usuário possui permissões elevadas.</p>
            </div>
        </div>
    );
}
