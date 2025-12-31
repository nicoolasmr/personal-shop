import * as Sentry from "@sentry/react";
import { getOptionalEnv, getEnvMode } from "@/config/env";

let initialized = false;
let dsnConfigured = false;
let environment: string | null = null;
let release: string | undefined;

export const initSentry = () => {
    const { sentryDsn, appVersion } = getOptionalEnv();
    const mode = getEnvMode();

    environment = mode;
    dsnConfigured = Boolean(sentryDsn);
    release = appVersion;

    if (!sentryDsn) {
        initialized = false;
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

    initialized = true;
    console.log(`[Observability] Sentry initialized in ${mode} mode.`);
};

export const captureException = (error: unknown, context?: Record<string, unknown>) => {
    if (!dsnConfigured) return;
    Sentry.captureException(error, { extra: context });
};

export const setSentryUser = (user: { id: string; email?: string }) => {
    if (!dsnConfigured) return;
    Sentry.setUser(user);
};

export const getSentryStatus = () => ({ initialized, dsnConfigured, environment, release });
