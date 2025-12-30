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
import { Target, Zap, ShieldCheck, Rocket, ChevronRight, ChevronLeft } from "lucide-react";

const STEPS = [
    {
        title: "Bem-vindo ao VIDA360",
        description: "Sua nova central de comando para uma vida organizada e produtiva. Estamos felizes em ter você aqui!",
        icon: <Rocket className="h-12 w-12 text-indigo-500" />,
        color: "bg-indigo-500/10",
    },
    {
        title: "Domine seu Tempo",
        description: "Gerencie tarefas complexas, hábitos diários e metas de longo prazo em um único lugar, sincronizado em tempo real.",
        icon: <Target className="h-12 w-12 text-emerald-500" />,
        color: "bg-emerald-500/10",
    },
    {
        title: "Saúde Financeira",
        description: "Acompanhe seus gastos, planeje parcelamentos e visualize seu progresso financeiro com gráficos inteligentes.",
        icon: <Zap className="h-12 w-12 text-amber-500" />,
        color: "bg-amber-500/10",
    },
    {
        title: "Tudo Seguro & Offline",
        description: "Seus dados estão protegidos com criptografia de ponta e funcionam mesmo quando você está sem internet.",
        icon: <ShieldCheck className="h-12 w-12 text-blue-500" />,
        color: "bg-blue-500/10",
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

    const step = STEPS[currentStep];

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden border-none shadow-2xl">
                <div className={`h-32 ${step.color} flex items-center justify-center transition-colors duration-500`}>
                    <div className="animate-in zoom-in duration-500">
                        {step.icon}
                    </div>
                </div>

                <div className="p-8 pt-6 space-y-4">
                    <DialogHeader className="space-y-2">
                        <DialogTitle className="text-2xl font-bold text-center tracking-tight">
                            {step.title}
                        </DialogTitle>
                        <DialogDescription className="text-center text-base leading-relaxed">
                            {step.description}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex justify-center gap-1.5 py-4">
                        {STEPS.map((_, i) => (
                            <div
                                key={i}
                                className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? "w-8 bg-primary" : "w-1.5 bg-muted"
                                    }`}
                            />
                        ))}
                    </div>

                    <DialogFooter className="flex flex-row justify-between sm:justify-between items-center pt-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handlePrev}
                            disabled={currentStep === 0}
                            className={currentStep === 0 ? "opacity-0" : ""}
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
                        </Button>

                        <Button onClick={handleNext} className="min-w-[100px] shadow-lg shadow-primary/20">
                            {currentStep === STEPS.length - 1 ? (
                                "Começar Agora"
                            ) : (
                                <>
                                    Próximo <ChevronRight className="h-4 w-4 ml-1" />
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
