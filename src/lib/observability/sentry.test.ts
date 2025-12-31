import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as SentryReact from '@sentry/react';

vi.mock('@sentry/react', () => ({
    init: vi.fn(),
    captureException: vi.fn(),
    setUser: vi.fn(),
    browserTracingIntegration: vi.fn(),
    replayIntegration: vi.fn(),
}));

vi.mock('@/config/env', () => ({
    getOptionalEnv: vi.fn(() => ({ sentryDsn: undefined, appVersion: 'dev' })),
    getEnvMode: vi.fn(() => 'development'),
}));

const { initSentry, captureException, getSentryStatus } = await import('./sentry');
const { getOptionalEnv } = await import('@/config/env');

describe('observability Sentry client', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('skips initialization when DSN is missing', () => {
        initSentry();
        expect(SentryReact.init).not.toHaveBeenCalled();
        expect(getSentryStatus()).toMatchObject({ initialized: false, dsnConfigured: false, environment: 'development' });
        captureException(new Error('boom'));
        expect(SentryReact.captureException).not.toHaveBeenCalled();
    });

    it('initializes Sentry when DSN is present', async () => {
        vi.mocked(getOptionalEnv).mockReturnValue({ sentryDsn: 'dsn-value', appVersion: '1.0.0' });
        initSentry();
        expect(SentryReact.init).toHaveBeenCalled();
        expect(getSentryStatus()).toMatchObject({ initialized: true, dsnConfigured: true });
    });
});
