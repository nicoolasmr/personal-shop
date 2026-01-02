import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Send, Phone, Video, MoreVertical, Smartphone, CheckCircle2, XCircle, Settings, Plus, Loader2 } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from 'sonner';
import { whatsappService, WhatsAppLink } from '@/services/whatsapp';
import { useTenant } from '@/hooks/useTenant';

export default function WhatsappPage() {
    const [message, setMessage] = useState('');
    const [link, setLink] = useState<WhatsAppLink | null>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [verificationCode, setVerificationCode] = useState<{ code: string; expires_at: string } | null>(null);
    const [isLinking, setIsLinking] = useState(false);

    const { org } = useTenant();

    useEffect(() => {
        const loadStatus = async () => {
            try {
                const status = await whatsappService.getLinkStatus();
                setLink(status);
            } catch (error) {
                console.error('Error loading whatsapp status:', error);
            } finally {
                setLoading(false);
            }
        };
        loadStatus();
    }, []);

    const handleStartLinking = async () => {
        if (!org?.id) {
            toast.error('Contexto organizacional não encontrado.');
            return;
        }
        setIsLinking(true);
        try {
            const codeData = await whatsappService.generateVerificationCode(org.id);
            setVerificationCode(codeData);
            toast.success('Código gerado!');
        } catch (error) {
            toast.error('Erro ao gerar código de verificação');
        } finally {
            setIsLinking(false);
        }
    };

    const handleDisconnect = async () => {
        if (!link) return;
        try {
            await whatsappService.unlinkWhatsApp(link.id);
            setLink(null);
            setVerificationCode(null);
            toast.success('WhatsApp desconectado com sucesso.');
        } catch (error) {
            toast.error('Erro ao desconectar WhatsApp.');
        }
    };

    const handleSendMessage = async () => {
        if (!message.trim()) {
            toast.error('Digite uma mensagem');
            return;
        }

        if (!link?.verified) {
            toast.warning('WhatsApp não verificado', {
                description: 'Você precisa verificar seu número para usar automações.'
            });
            return;
        }

        setSending(true);
        try {
            // Emulate sending through service
            toast.success('Mensagem processada pelo assistente!', {
                description: message
            });
            setMessage('');
        } catch (error) {
            toast.error('Erro ao processar mensagem.');
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col animate-smooth-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">WhatsApp VIDA360</h1>
                    <p className="text-muted-foreground">Assistente e notificações inteligentes via WhatsApp.</p>
                </div>
                <div className="flex items-center gap-2">
                    {link?.verified ? (
                        <Badge variant="outline" className="h-9 px-4 gap-2 border-emerald-500/30 text-emerald-600 bg-emerald-50/50">
                            <CheckCircle2 className="h-4 w-4" /> Conectado
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="h-9 px-4 gap-2 border-amber-500/30 text-amber-600 bg-amber-50/50">
                            <XCircle className="h-4 w-4" /> Não Vinculado
                        </Badge>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => toast.info('Configurações do WhatsApp')}>
                        <Settings className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
                <div className="lg:col-span-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                    <Card className="glass-card border-none shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Dispositivo</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {link ? (
                                <div className="flex items-center gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/10 text-sm">
                                    <Smartphone className="h-6 w-6 text-primary" />
                                    <div>
                                        <p className="font-bold">Final {link.phone_last4 || '****'}</p>
                                        <p className="text-[10px] text-muted-foreground uppercase font-medium">Vinculado em {new Date(link.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ) : verificationCode ? (
                                <div className="p-4 space-y-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-500/20">
                                    <div className="text-center">
                                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Seu Código</p>
                                        <h2 className="text-3xl font-black tracking-widest text-emerald-700 dark:text-emerald-400">{verificationCode.code}</h2>
                                    </div>
                                    <div className="space-y-2 text-xs text-muted-foreground leading-tight">
                                        <p className="font-medium">Para vincular:</p>
                                        <ol className="list-decimal list-inside space-y-1">
                                            <li>Envie <strong>{verificationCode.code}</strong> para o nosso número.</li>
                                            <li>Aguarde a confirmação automática.</li>
                                        </ol>
                                    </div>
                                    <Button variant="ghost" size="sm" className="w-full text-[9px] uppercase font-bold text-muted-foreground h-6" onClick={() => setVerificationCode(null)}>Cancelar</Button>
                                </div>
                            ) : (
                                <div className="p-4 text-center space-y-3 bg-muted/20 rounded-2xl border-2 border-dashed">
                                    <MessageCircle className="h-8 w-8 mx-auto opacity-20" />
                                    <p className="text-xs text-muted-foreground">Nenhum dispositivo conectado.</p>
                                    <Button
                                        size="sm"
                                        className="w-full rounded-xl font-bold uppercase text-[10px]"
                                        onClick={handleStartLinking}
                                        disabled={isLinking}
                                    >
                                        {isLinking ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
                                        Vincular Agora
                                    </Button>
                                </div>
                            )}

                            {link && (
                                <Button
                                    variant="outline"
                                    className="w-full rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100 font-bold text-xs uppercase"
                                    onClick={handleDisconnect}
                                >
                                    Desconectar
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="glass-card border-none shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Automações Ativas</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {[
                                { name: 'Lembrete de Tarefas', theme: 'emerald' },
                                { name: 'Resumo Semanal', theme: 'blue' },
                                { name: 'Alerta de Metas', theme: 'amber' }
                            ].map((item) => (
                                <div key={item.name} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 text-xs font-semibold">
                                    <span>{item.name}</span>
                                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 h-5 px-1.5 rounded-full text-[9px]">ATIVO</Badge>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                <Card className="lg:col-span-2 flex flex-col glass-card border-none shadow-xl overflow-hidden rounded-3xl">
                    <CardHeader className="border-b bg-background/50 py-4 px-6 flex flex-row items-center justify-between space-y-0">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12 border-2 border-emerald-500/10 shadow-lg shadow-emerald-500/5">
                                <AvatarFallback className="bg-emerald-500 text-white font-black text-lg">V</AvatarFallback>
                            </Avatar>
                            <div>
                                <h3 className="text-base font-black tracking-tight">Assistente VIDA360</h3>
                                <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">IA Operacional</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-emerald-50 rounded-xl"><Phone className="h-5 w-5 text-emerald-600" /></Button>
                            <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-emerald-50 rounded-xl"><Video className="h-5 w-5 text-emerald-600" /></Button>
                        </div>
                    </CardHeader>

                    <CardContent className="flex-1 p-6 bg-slate-50/30 dark:bg-slate-950/20 overflow-y-auto custom-scrollbar flex flex-col gap-6">
                        <div className="flex justify-center">
                            <Badge variant="secondary" className="text-[9px] px-3 py-1 bg-background/80 shadow-sm border-none font-bold uppercase tracking-widest text-muted-foreground">Histórico de Hoje</Badge>
                        </div>

                        <div className="flex justify-start">
                            <div className="bg-white dark:bg-slate-900 border border-border/50 p-4 rounded-2xl rounded-tl-none max-w-[85%] shadow-sm transition-all hover:shadow-md">
                                <p className="text-sm leading-relaxed font-medium">Olá! Notei que você concluiu suas tarefas de finanças hoje. Deseja que eu gere o relatório de saldo semanal agora? 📊</p>
                                <span className="text-[9px] text-muted-foreground mt-2 block text-right font-bold tracking-tighter">10:45 AM</span>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <div className="bg-emerald-600 text-white p-4 rounded-2xl rounded-tr-none max-w-[85%] shadow-lg shadow-emerald-500/10 transition-all hover:scale-[1.02]">
                                <p className="text-sm leading-relaxed font-medium">Sim, por favor! E também adicione 'Comprar suplemento' à minha lista de tarefas de amanhã.</p>
                                <div className="flex items-center justify-end gap-1.5 mt-2">
                                    <span className="text-[9px] text-emerald-100/60 font-bold">10:46 AM</span>
                                    <CheckCircle2 className="h-3 w-3 text-emerald-100" />
                                </div>
                            </div>
                        </div>
                    </CardContent>

                    <div className="p-4 sm:p-6 bg-background border-t shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
                        <div className="flex gap-3 items-center">
                            <div className="flex-1 relative group">
                                <Input
                                    placeholder="Comando rápido (ex: add R$ 50 almoco)"
                                    className="h-12 pr-12 bg-muted/40 border-none focus-visible:ring-emerald-500/20 rounded-2xl font-medium placeholder:text-muted-foreground/50 transition-all group-hover:bg-muted/60"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                    <Plus className="h-4 w-4 text-muted-foreground/40" />
                                </div>
                            </div>
                            <Button
                                size="icon"
                                className="h-12 w-12 shrink-0 bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-500/20 rounded-2xl transition-all hover:scale-105 active:scale-95"
                                onClick={handleSendMessage}
                                disabled={sending || !link?.verified}
                            >
                                {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
