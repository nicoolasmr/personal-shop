import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

/**
 * GlobalLoadingIndicator: Displays a subtle top-right spinner when navigation is happening.
 */
export const GlobalLoadingIndicator = () => {
    const [loading, setLoading] = useState(false);
    const location = useLocation();

    useEffect(() => {
        setLoading(true);
        const timer = setTimeout(() => {
            setLoading(false);
        }, 500); // Simulate/Handle transition end

        return () => clearTimeout(timer);
    }, [location.pathname]);

    if (!loading) return null;

    return (
        <div className="fixed top-4 right-4 z-[9999] pointer-events-none">
            <div className="bg-background/80 backdrop-blur-md p-2 rounded-full shadow-lg border border-border animate-in slide-in-from-top-2 duration-300">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
        </div>
    );
};
