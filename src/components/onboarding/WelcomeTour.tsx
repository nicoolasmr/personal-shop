import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Target,
    Zap,
    ShieldCheck,
    Rocket,
    ChevronRight,
    ChevronLeft,
    CheckSquare,
    Flame,
    TrendingUp,
    DollarSign,
    Calendar,
    MessageCircle,
    Trophy,
    X
} from "lucide-react";

const STEPS = [
    {
        title: "Bem-vindo ao VIDA360",
        description: "Sua nova central de comando para uma vida organizada e produtiva. Vamos fazer um tour rápido pelos principais recursos da plataforma!",
        icon: <Rocket className="h-12 w-12 text-indigo-500" />,
        color: "bg-indigo-500/10",
    },
    {
        title: "📋 Tarefas Inteligentes",
        description: "Organize suas tarefas com subtarefas, anexos, prioridades e status. Acompanhe tudo em um quadro Kanban visual e nunca perca um prazo!",
        icon: <CheckSquare className="h-12 w-12 text-blue-500" />,
        color: "bg-blue-500/10",
    },
    {
        title: "🔥 Hábitos Diários",
        description: "Construa rotinas consistentes! Acompanhe seus hábitos diários ou semanais, veja seu progresso em tempo real e mantenha sequências (streaks) motivadoras.",
        icon: <Flame className="h-12 w-12 text-orange-500" />,
        color: "bg-orange-500/10",
    },
    {
        title: "🎯 Metas e Objetivos",
        description: "Defina metas financeiras, de economia, de tarefas ou personalizadas. Acompanhe seu progresso com gráficos e receba notificações ao atingir marcos importantes!",
        icon: <Target className="h-12 w-12 text-emerald-500" />,
        color: "bg-emerald-500/10",
    },
    {
        title: "💰 Finanças Pessoais",
        description: "Controle suas receitas e despesas, gerencie parcelamentos, crie categorias personalizadas e visualize seu fluxo financeiro com gráficos detalhados.",
        icon: <DollarSign className="h-12 w-12 text-green-500" />,
        color: "bg-green-500/10",
    },
    {
        title: "📅 Agenda Integrada",
        description: "Organize seus compromissos, eventos e lembretes em um calendário visual. Sincronize com suas tarefas e metas para uma visão completa do seu dia!",
        icon: <Calendar className="h-12 w-12 text-purple-500" />,
        color: "bg-purple-500/10",
    },
    {
        title: "🏆 Gamificação",
        description: "Ganhe conquistas ao completar tarefas, manter hábitos e atingir metas! Acompanhe seu XP, desbloqueie badges e veja seu progresso geral.",
        icon: <Trophy className="h-12 w-12 text-amber-500" />,
        color: "bg-amber-500/10",
    },
    {
        title: "📊 Estatísticas e Insights",
        description: "Visualize gráficos detalhados de produtividade, finanças e hábitos. Identifique padrões e tome decisões baseadas em dados reais!",
        icon: <TrendingUp className="h-12 w-12 text-cyan-500" />,
        color: "bg-cyan-500/10",
    },
    {
        title: "💬 WhatsApp Integrado",
        description: "Receba lembretes e notificações diretamente no WhatsApp. Configure automações para check-ins de hábitos e resumos diários!",
        icon: <MessageCircle className="h-12 w-12 text-green-600" />,
        color: "bg-green-600/10",
    },
    {
        title: "🔒 Seguro e Offline",
        description: "Seus dados estão protegidos com criptografia de ponta. A plataforma funciona offline e sincroniza automaticamente quando você volta online!",
        icon: <ShieldCheck className="h-12 w-12 text-blue-600" />,
        color: "bg-blue-600/10",
    },
];

export function WelcomeTour() {
    const [open, setOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        const hasSeenTour = localStorage.getItem("vida360_onboarding_seen");
        if (!hasSeenTour) {
            const timer = setTimeout(() => setOpen(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleComplete = () => {
        localStorage.setItem("vida360_onboarding_seen", "true");
        setOpen(false);
    };

    const handleSkip = () => {
        localStorage.setItem("vida360_onboarding_seen", "true");
        setOpen(false);
    };

    const step = STEPS[currentStep];

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            if (!isOpen) {
                handleSkip();
            }
            setOpen(isOpen);
        }}>
            <DialogContent className="max-w-[95vw] sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl">
                {/* Close button */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-4 z-10 rounded-full hover:bg-white/20"
                    onClick={handleSkip}
                >
                    <X className="h-4 w-4" />
                </Button>

                <div className={`h-40 ${step.color} flex items-center justify-center transition-colors duration-500`}>
                    <div className="animate-in zoom-in duration-500">
                        {step.icon}
                    </div>
                </div>

                <div className="p-6 sm:p-8 pt-6 space-y-4">
                    <DialogHeader className="space-y-3">
                        <DialogTitle className="text-2xl font-bold text-center tracking-tight">
                            {step.title}
                        </DialogTitle>
                        <DialogDescription className="text-center text-base leading-relaxed px-2">
                            {step.description}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Progress indicators */}
                    <div className="flex justify-center gap-1.5 py-4">
                        {STEPS.map((_, i) => (
                            <div
                                key={i}
                                className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? "w-8 bg-primary" : "w-1.5 bg-muted"
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Step counter */}
                    <p className="text-center text-xs text-muted-foreground">
                        Passo {currentStep + 1} de {STEPS.length}
                    </p>

                    <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between items-center pt-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handlePrev}
                            disabled={currentStep === 0}
                            className={currentStep === 0 ? "invisible" : ""}
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
                        </Button>

                        <div className="flex gap-2">
                            {currentStep < STEPS.length - 1 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleSkip}
                                >
                                    Pular Tour
                                </Button>
                            )}

                            <Button
                                onClick={handleNext}
                                className="min-w-[120px] shadow-lg shadow-primary/20"
                            >
                                {currentStep === STEPS.length - 1 ? (
                                    "Começar Agora! 🚀"
                                ) : (
                                    <>
                                        Próximo <ChevronRight className="h-4 w-4 ml-1" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </DialogFooter>

                    {/* Don't show again button */}
                    {currentStep === STEPS.length - 1 && (
                        <div className="pt-2 border-t">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleSkip}
                                className="w-full text-xs text-muted-foreground hover:text-foreground"
                            >
                                Não mostrar novamente
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
