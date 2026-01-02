import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { Moon, Sun, Smartphone, Bell, Bug, Languages } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProfilePreferencesProps {
    initialLanguage?: string;
    onLanguageChange?: (lang: string) => void;
}

export function ProfilePreferences({ initialLanguage = 'pt-BR', onLanguageChange }: ProfilePreferencesProps) {
    const { theme, setTheme } = useTheme();
    const { toast } = useToast();
    const [language, setLanguage] = useState(initialLanguage);
    const [pushEnabled, setPushEnabled] = useState(Notification.permission === 'granted');

    const handleThemeChange = (val: string) => {
        setTheme(val as 'light' | 'dark' | 'system');
    };

    const handleLanguageChange = (val: string) => {
        setLanguage(val);
        if (onLanguageChange) onLanguageChange(val);
        toast({ title: 'Idioma alterado', description: `Novo idioma: ${val === 'pt-BR' ? 'Português' : 'English'}` });
    };

    const handlePushToggle = async (checked: boolean) => {
        if (checked) {
            const permission = await Notification.requestPermission();
            setPushEnabled(permission === 'granted');
            if (permission === 'granted') {
                toast({ title: 'Notificações ativadas!' });
            } else {
                toast({ title: 'Permissão negada', description: 'Habilite as notificações nas configurações do navegador.', variant: 'destructive' });
            }
        } else {
            setPushEnabled(false);
            toast({ title: 'Notificações desativadas' });
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Preferências do Aplicativo</CardTitle>
                <CardDescription>Personalize sua experiência no VIDA360</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                {/* Aparência */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium flex items-center gap-2 text-primary">
                        {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                        Aparência
                    </h3>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-0.5">
                            <Label>Tema</Label>
                            <p className="text-xs text-muted-foreground">Alternar entre modo claro e escuro</p>
                        </div>
                        <Select value={theme} onValueChange={handleThemeChange}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Selecione o tema" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="light">Claro</SelectItem>
                                <SelectItem value="dark">Escuro</SelectItem>
                                <SelectItem value="system">Sistema</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Idioma */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium flex items-center gap-2 text-primary"><Languages className="h-4 w-4" /> Idioma</h3>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-0.5">
                            <Label>Idioma do Sistema</Label>
                            <p className="text-xs text-muted-foreground">Escolha a linguagem da interface</p>
                        </div>
                        <Select value={language} onValueChange={handleLanguageChange}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Selecione o idioma" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                                <SelectItem value="en">English (US)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Notificações */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium flex items-center gap-2 text-primary"><Bell className="h-4 w-4" /> Notificações</h3>
                    <div className="flex flex-row items-center justify-between gap-4">
                        <div className="space-y-0.5">
                            <Label>Notificações Push</Label>
                            <p className="text-xs text-muted-foreground">Receba alertas sobre tarefas e hábitos</p>
                        </div>
                        <Switch checked={pushEnabled} onCheckedChange={handlePushToggle} />
                    </div>
                </div>

                {/* Suporte */}
                <div className="pt-6 border-t">
                    <Button variant="secondary" className="w-full sm:w-auto" onClick={() => window.open('mailto:suporte@vida360.com?subject=Bug Report - VIDA360')}>
                        <Bug className="h-4 w-4 mr-2" />
                        Reportar Problema / Suporte
                    </Button>
                </div>

            </CardContent>
        </Card>
    );
}
