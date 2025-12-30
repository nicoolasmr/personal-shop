import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class RuntimeErrorBoundary extends React.Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught VIDA360 error:", error, errorInfo);
        // In production, we'd send to Sentry here
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: undefined });
        window.location.href = '/app/home';
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-background p-4">
                    <div className="max-w-md w-full bg-card border border-border rounded-xl p-8 shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="flex flex-col items-center text-center space-y-6">
                            <div className="h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center">
                                <AlertTriangle className="h-8 w-8 text-destructive" />
                            </div>

                            <div className="space-y-2">
                                <h1 className="text-2xl font-bold tracking-tight">Ops! Algo deu errado</h1>
                                <p className="text-muted-foreground text-sm">
                                    Ocorreu um erro inesperado na interface. Mas não se preocupe, seus dados estão seguros.
                                </p>
                            </div>

                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <div className="w-full p-4 bg-muted rounded-md text-left overflow-auto max-h-40">
                                    <p className="text-xs font-mono text-destructive">
                                        {this.state.error.toString()}
                                    </p>
                                </div>
                            )}

                            <div className="flex flex-col w-full gap-3 mt-4">
                                <Button
                                    onClick={() => window.location.reload()}
                                    variant="default"
                                    className="w-full gap-2"
                                >
                                    <RefreshCcw className="h-4 w-4" />
                                    Tentar Novamente
                                </Button>

                                <Button
                                    onClick={this.handleReset}
                                    variant="outline"
                                    className="w-full gap-2"
                                >
                                    <Home className="h-4 w-4" />
                                    Voltar para Home
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
