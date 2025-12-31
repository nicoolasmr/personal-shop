import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Send } from 'lucide-react';
import { Input } from "@/components/ui/input";

export default function WhatsappPage() {
    return (
        <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">WhatsApp</h1>
                    <p className="text-muted-foreground">Integração e mensagens</p>
                </div>
                <Button variant="outline" className="gap-2">
                    <MessageCircle className="h-4 w-4" /> Conectar WhatsApp
                </Button>
            </div>

            <Card className="flex-1 flex flex-col">
                <CardHeader className="border-b py-3">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                            <MessageCircle className="h-6 w-6" />
                        </div>
                        <div>
                            <CardTitle className="text-base">Assistente VIDA360</CardTitle>
                            <p className="text-xs text-muted-foreground">Online</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 p-4 bg-muted/20 overflow-y-auto">
                    <div className="space-y-4">
                        <div className="flex justify-start">
                            <div className="bg-white dark:bg-card border p-3 rounded-lg rounded-tl-none max-w-[80%] shadow-sm">
                                <p className="text-sm">Olá! Como posso ajudar você hoje com seus hábitos e metas?</p>
                                <span className="text-[10px] text-muted-foreground mt-1 block">10:00</span>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <div className="bg-green-600 text-white p-3 rounded-lg rounded-tr-none max-w-[80%] shadow-sm">
                                <p className="text-sm">Gostaria de ver meu resumo semanal.</p>
                                <span className="text-[10px] text-green-100 mt-1 block opacity-80">10:05</span>
                            </div>
                        </div>
                        <div className="flex justify-center my-4">
                            <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">Hoje</span>
                        </div>
                    </div>
                </CardContent>
                <div className="p-4 border-t bg-background">
                    <div className="flex gap-2">
                        <Input placeholder="Digite sua mensagem..." />
                        <Button size="icon">
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
