import * as Sentry from "@sentry/react";
import { getOptionalEnv, getEnvMode } from "@/config/env";

export const initSentry = () => {
    const { sentryDsn, appVersion } = getOptionalEnv();
    const mode = getEnvMode();

    if (!sentryDsn) {
        if (mode === 'production') {
            console.warn('[Observability] Sentry DSN not found in production. Error tracking is disabled.');
        }
        return;
    }

    Sentry.init({
        dsn: sentryDsn,
        environment: mode,
        release: `vida360@${appVersion}`,
        integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration(),
        ],
        // Performance Monitoring
        tracesSampleRate: mode === 'production' ? 0.2 : 1.0,
        // Session Replay
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,

        beforeSend(event) {
            // PII Scrubbing: Remove sensitive data from breadcrumbs or local paths if needed
            return event;
        },
    });

    console.log(`[Observability] Sentry initialized in ${mode} mode.`);
};

export const captureException = (error: unknown, context?: Record<string, unknown>) => {
    Sentry.captureException(error, { extra: context });
};

export const setSentryUser = (user: { id: string; email?: string }) => {
    Sentry.setUser(user);
};
