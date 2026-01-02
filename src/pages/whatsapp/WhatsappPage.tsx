import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Send, Phone, Video, MoreVertical, Smartphone, CheckCircle2, Settings, Plus } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from 'sonner';
import { useState } from 'react';

export default function WhatsappPage() {
    const [message, setMessage] = useState('');

    const handleDisconnect = () => {
        toast.info('Desconectar WhatsApp', {
            description: 'Esta funcionalidade será implementada em breve.'
        });
    };

    const handleSettings = () => {
        toast.info('Configurações', {
            description: 'Configure notificações e automações do WhatsApp.'
        });
    };

    const handleCall = () => {
        toast.info('Chamada de Voz', {
            description: 'Funcionalidade de chamada em desenvolvimento.'
        });
    };

    const handleVideoCall = () => {
        toast.info('Chamada de Vídeo', {
            description: 'Funcionalidade de vídeo em desenvolvimento.'
        });
    };

    const handleSendMessage = () => {
        if (!message.trim()) {
            toast.error('Digite uma mensagem');
            return;
        }
        toast.success('Mensagem enviada!', {
            description: message
        });
        setMessage('');
    };

    return (
        <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col animate-smooth-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">WhatsApp VIDA360</h1>
                    <p className="text-muted-foreground">Assistente e notificações inteligentes via WhatsApp.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="h-9 px-4 gap-2 border-emerald-500/30 text-emerald-600 bg-emerald-50/50">
                        <CheckCircle2 className="h-4 w-4" /> Conectado
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={handleSettings}>
                        <Settings className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
                {/* Chat History / Info */}
                <div className="lg:col-span-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                    <Card className="glass-card border-none shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-sm">Configuração do Dispositivo</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10 text-sm">
                                <Smartphone className="h-5 w-5 text-primary" />
                                <div>
                                    <p className="font-medium">iPhone 15 Pro</p>
                                    <p className="text-xs text-muted-foreground">Última conexão: Agora</p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                className="w-full text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={handleDisconnect}
                            >
                                Desconectar WhatsApp
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="glass-card border-none shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-sm">Automações Ativas</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {['Lembrete de Tarefas', 'Resumo Semanal', 'Check-in de Hábitos'].map((item) => (
                                <div key={item} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 text-xs">
                                    <span>{item}</span>
                                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 h-5 px-1.5">Ativo</Badge>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Main Chat Area */}
                <Card className="lg:col-span-2 flex flex-col glass-card border-none shadow-xl overflow-hidden">
                    <CardHeader className="border-b bg-card/50 py-3 px-4 flex flex-row items-center justify-between space-y-0">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border-2 border-emerald-500/20">
                                <AvatarImage src="" />
                                <AvatarFallback className="bg-emerald-100 text-emerald-700 font-bold">V</AvatarFallback>
                            </Avatar>
                            <div>
                                <h3 className="text-sm font-bold">Assistente VIDA360</h3>
                                <div className="flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                    <span className="text-[10px] text-muted-foreground">Online</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCall}><Phone className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleVideoCall}><Video className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSettings}><MoreVertical className="h-4 w-4" /></Button>
                        </div>
                    </CardHeader>

                    <CardContent className="flex-1 p-4 bg-slate-50/50 dark:bg-slate-950/20 overflow-y-auto custom-scrollbar flex flex-col gap-4">
                        <div className="flex justify-center my-2">
                            <Badge variant="secondary" className="text-[10px] px-3 py-1 bg-muted/50 font-normal">Ontem</Badge>
                        </div>

                        <div className="flex justify-start">
                            <div className="bg-white dark:bg-slate-900 border p-3 rounded-2xl rounded-tl-none max-w-[85%] shadow-sm">
                                <p className="text-sm leading-relaxed">Olá Nicolas! Notei que você concluiu 3 tarefas importantes hoje. Gostaria de ver o seu resumo de progresso financeiro?</p>
                                <span className="text-[10px] text-muted-foreground mt-2 block text-right">22:15</span>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <div className="bg-emerald-600 text-white p-3 rounded-2xl rounded-tr-none max-w-[85%] shadow-md">
                                <p className="text-sm leading-relaxed">Sim, por favor! E também me lembre de beber água a cada 2 horas.</p>
                                <div className="flex items-center justify-end gap-1 mt-2">
                                    <span className="text-[10px] text-emerald-100 opacity-80">22:16</span>
                                    <CheckCircle2 className="h-3 w-3 text-emerald-100" />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-start">
                            <div className="bg-white dark:bg-slate-900 border p-3 rounded-2xl rounded-tl-none max-w-[85%] shadow-sm">
                                <p className="text-sm leading-relaxed">Combinado! Agendado lembretes de hidratação. Aqui está seu resumo rápido: Seu saldo hoje é R$ 450,20 (+5% vs ontem). 🚀</p>
                                <span className="text-[10px] text-muted-foreground mt-2 block text-right">22:17</span>
                            </div>
                        </div>
                    </CardContent>

                    <div className="p-4 bg-card border-t">
                        <div className="flex gap-2 items-center">
                            <div className="flex-1 relative">
                                <Input
                                    placeholder="Mensagem rápida para o assistente..."
                                    className="pr-10 bg-muted/50 border-none focus-visible:ring-primary/20"
                                />
                                <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground">
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            <Button size="icon" className="h-10 w-10 shrink-0 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20">
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
