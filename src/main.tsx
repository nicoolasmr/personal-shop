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
    if (!import.meta.env.PROD) return;

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

import { syncFeatureFlags } from './lib/flags';

// Initialize flags
syncFeatureFlags().then(() => {
    createRoot(document.getElementById("root")!).render(
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <RuntimeErrorBoundary>
                <App />
            </RuntimeErrorBoundary>
        </ThemeProvider>
    );
});
