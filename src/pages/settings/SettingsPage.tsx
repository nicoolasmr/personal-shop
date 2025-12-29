import { useTheme } from '@/hooks/useTheme';
import { useNotifications, usePushNotifications } from '@/hooks/useNotifications';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Monitor, Bell, Smartphone, Bug } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Assuming tabs exist

export default function SettingsPage() {
    const { theme, setTheme } = useTheme();
    const { requestPermission, sendNotification } = useNotifications();
    const { isSubscribed, toggle: togglePush, sendTest: sendTestPush } = usePushNotifications();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Configurações</h1>
                <p className="text-muted-foreground">Preferências do aplicativo</p>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Monitor className="h-5 w-5 text-blue-500" />
                            <CardTitle>Aparência</CardTitle>
                        </div>
                        <CardDescription>Personalize como o VIDA360 se parece no seu dispositivo</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Tema</span>
                            <div className="flex items-center gap-2 border rounded-lg p-1">
                                <Button variant={theme === 'light' ? 'secondary' : 'ghost'} size="sm" onClick={() => setTheme('light')} className="h-8 w-8 p-0">
                                    <Sun className="h-4 w-4" />
                                </Button>
                                <Button variant={theme === 'dark' ? 'secondary' : 'ghost'} size="sm" onClick={() => setTheme('dark')} className="h-8 w-8 p-0">
                                    <Moon className="h-4 w-4" />
                                </Button>
                                <Button variant={theme === 'system' ? 'secondary' : 'ghost'} size="sm" onClick={() => setTheme('system')} className="h-8 w-8 p-0">
                                    <Monitor className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Bell className="h-5 w-5 text-yellow-500" />
                            <CardTitle>Notificações</CardTitle>
                        </div>
                        <CardDescription>Gerencie seus alertas e notificações</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm font-medium">Notificações do Navegador</div>
                                <div className="text-xs text-muted-foreground">Permitir notificações locais</div>
                            </div>
                            <Button variant="outline" onClick={requestPermission}>Ativar</Button>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm font-medium">Testar Notificação</div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => sendNotification()}>Enviar Teste</Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Smartphone className="h-5 w-5 text-green-500" />
                            <CardTitle>Push Notifications (PWA)</CardTitle>
                        </div>
                        <CardDescription>Receba notificações mesmo com o app fechado</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm font-medium">Notificações Push</div>
                                <div className="text-xs text-muted-foreground">{isSubscribed ? 'Ativado' : 'Desativado'}</div>
                            </div>
                            <Button variant={isSubscribed ? 'default' : 'outline'} onClick={() => togglePush()}>
                                {isSubscribed ? 'Desativar' : 'Ativar'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Bug className="h-5 w-5 text-red-500" />
                            <CardTitle>Suporte</CardTitle>
                        </div>
                        <CardDescription>Encontrou um erro ou tem uma sugestão?</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" className="w-full">Reportar Problema</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
