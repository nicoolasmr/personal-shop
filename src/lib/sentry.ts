// =============================================================================
// Sentry Integration for VIDA360
// =============================================================================

interface SentryConfig { dsn: string | undefined; environment: 'development' | 'production'; release: string; enabled: boolean; }
interface SentryUser { id: string; email?: string; }
interface SentryContext { user: SentryUser | null; tags: Record<string, string>; extras: Record<string, unknown>; }

const context: SentryContext = { user: null, tags: {}, extras: {} };
const config: SentryConfig = {
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.DEV ? 'development' : 'production',
    release: import.meta.env.VITE_APP_VERSION || '3.5.0',
    enabled: false,
};

export function initSentry(): void {
    if (!config.dsn) { console.log('[Sentry] DSN not configured - disabled'); return; }
    config.enabled = true;
    window.onerror = (message, source, lineno, colno, error) => {
        captureException(error || new Error(String(message)), { source, lineno, colno });
    };
    window.onunhandledrejection = (event) => { captureException(event.reason || new Error('Unhandled Promise Rejection')); };
    console.log(`[Sentry] Initialized - env: ${config.environment}, release: ${config.release}`);
}

export function setUser(user: SentryUser | null): void { context.user = user; }
export function setTag(key: string, value: string): void { context.tags[key] = value; }
export function setExtra(key: string, value: unknown): void { context.extras[key] = value; }

export function addBreadcrumb(breadcrumb: { category: string; message: string; level?: 'debug' | 'info' | 'warning' | 'error'; data?: Record<string, unknown>; }): void {
    if (!config.enabled) return;
    console.log(`[Sentry Breadcrumb] ${breadcrumb.category}: ${breadcrumb.message}`);
}

export function captureException(error: Error | unknown, extras?: Record<string, unknown>): string {
    const eventId = crypto.randomUUID();
    if (!config.enabled) { console.error('[Error captured but Sentry disabled]', error); return eventId; }
    const errorObj = error instanceof Error ? error : new Error(String(error));
    const payload = {
        event_id: eventId, timestamp: new Date().toISOString(), platform: 'javascript', environment: config.environment, release: config.release,
        exception: { type: errorObj.name, value: errorObj.message, stacktrace: errorObj.stack },
        user: context.user, tags: { ...context.tags, route: window.location.pathname }, extra: { ...context.extras, ...extras },
        request: { url: window.location.href, headers: { 'User-Agent': navigator.userAgent } },
    };
    console.error('[Sentry] Exception captured:', eventId, payload);
    return eventId;
}

export function captureMessage(message: string, level: 'debug' | 'info' | 'warning' | 'error' = 'info'): string {
    const eventId = crypto.randomUUID();
    if (!config.enabled) { console.log(`[Message captured but Sentry disabled] ${level}: ${message}`); return eventId; }
    console.log(`[Sentry] Message captured (${level}): ${message}`, eventId);
    return eventId;
}

export function getSentryStatus() { return { enabled: config.enabled, dsn: !!config.dsn, environment: config.environment, release: config.release }; }

export const Sentry = { init: initSentry, setUser, setTag, setExtra, addBreadcrumb, captureException, captureMessage, getStatus: getSentryStatus };
export default Sentry;
