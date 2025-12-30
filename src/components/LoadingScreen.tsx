import { Loader2 } from "lucide-react";

interface LoadingScreenProps {
    message?: string;
}

const LoadingScreen = ({ message = "Carregando vida extra..." }: LoadingScreenProps) => {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-500">
            <div className="relative flex flex-col items-center gap-4">
                <div className="relative">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-primary/20" />
                </div>

                <div className="flex flex-col items-center space-y-2">
                    <h2 className="text-xl font-semibold tracking-tight animate-pulse bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent">
                        VIDA360
                    </h2>
                    <p className="text-sm text-muted-foreground animate-pulse delay-75">
                        {message}
                    </p>
                </div>

                {/* Subtle decorative background glow */}
                <div className="absolute -z-10 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
            </div>
        </div>
    );
};

export default LoadingScreen;
