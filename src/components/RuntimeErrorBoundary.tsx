
import React from 'react';

export class RuntimeErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: any) {
        return { hasError: true };
    }

    componentDidCatch(error: any, errorInfo: any) {
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return <div className="p-4 text-center"><h1>Algo deu errado.</h1><button onClick={() => window.location.reload()}>Recarregar</button></div>;
        }

        return this.props.children;
    }
}
