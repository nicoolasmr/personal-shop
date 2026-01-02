import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import App from "./App.tsx";
import "./index.css";
import { initSentry } from "./lib/observability/sentry";
import { RuntimeErrorBoundary } from "@/components/RuntimeErrorBoundary";
import { clearPwaCaches } from "@/lib/pwa/clearPwaCaches";

// Initialize Sentry error tracking (disabled if DSN not configured)
initSentry();

// Hard reset for stale PWA/SW cache (runs once per session)
// - Trigger manually via ?reset=1
// - Or automatically if a Service Worker is controlling the page (stale publish)
(async () => {
    // Changed: Run this check always, even in dev, to fix the stuck localhost service worker issue
    // if (!import.meta.env.PROD) return;

    // Always unregister existing SWs if we are in dev or if reset flag is present
    if (!import.meta.env.PROD) {
        if ("serviceWorker" in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const registration of registrations) {
                await registration.unregister();
                console.log("Unregistered development service worker:", registration);
            }
        }
    }

    const shouldReset = new URLSearchParams(window.location.search).get("reset") === "1";
    const hasSWController =
        "serviceWorker" in navigator && Boolean(navigator.serviceWorker.controller);

    if (!shouldReset && !hasSWController) return;

    const flagKey = "__vida360_pwa_reset_done";
    if (sessionStorage.getItem(flagKey) === "1") return;
    sessionStorage.setItem(flagKey, "1");

    try {
        await clearPwaCaches();
    } finally {
        const u = new URL(window.location.href);
        u.searchParams.delete("reset");
        window.location.replace(u.toString());
    }
})();

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/react-query";
import { syncFeatureFlags } from './lib/flags';

// Initialize flags
// Initialize flags with timeout to prevent blocking render indefinitely
const initApp = async () => {
    const timeout = new Promise(resolve => setTimeout(resolve, 1000));
    try {
        await Promise.race([syncFeatureFlags(), timeout]);
    } catch (e) {
        console.error("Flag sync failed, proceeding with defaults", e);
    }

    createRoot(document.getElementById("root")!).render(
        <QueryClientProvider client={queryClient}>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                <RuntimeErrorBoundary>
                    <App />
                </RuntimeErrorBoundary>
            </ThemeProvider>
        </QueryClientProvider>
    );
};

initApp();
