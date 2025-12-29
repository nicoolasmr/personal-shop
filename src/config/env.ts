// =============================================================================
// Environment Variables Helper
// =============================================================================
import { z } from 'zod';

const DEV_FALLBACK_URL = 'https://qkljrdguejcflppumenc.supabase.co';
const DEV_FALLBACK_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrbGpyZGd1ZWpjZmxwcHVtZW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2OTQwMDcsImV4cCI6MjA3MTI3MDAwN30.wPc3z5JpTzwuiXNEntoY5j_jXiooMaXbUi2b8VUnj0U';

let hasWarnedAboutFallback = false;

const requiredEnvSchema = z.object({
    VITE_SUPABASE_URL: z.string().url('VITE_SUPABASE_URL must be a valid URL'),
    VITE_SUPABASE_ANON_KEY: z.string().min(1, 'VITE_SUPABASE_ANON_KEY is required'),
});

const optionalEnvSchema = z.object({
    VITE_VAPID_PUBLIC_KEY: z.string().optional(),
    VITE_SENTRY_DSN: z.string().optional(),
    VITE_APP_VERSION: z.string().default('dev'),
});

type EnvMode = 'production' | 'development' | 'test';

export function getEnvMode(override?: EnvMode): EnvMode {
    if (override) return override;
    if (import.meta.env.PROD) return 'production';
    if (import.meta.env.MODE === 'test') return 'test';
    return 'development';
}

interface RequiredEnv {
    supabaseUrl: string;
    supabaseAnonKey: string;
}

interface RequiredEnvResult {
    isValid: boolean;
    config: RequiredEnv | null;
    missingVars: string[];
    usingFallback: boolean;
}

export function validateRequiredEnv(mode?: EnvMode): RequiredEnvResult {
    const currentMode = getEnvMode(mode);
    const isProd = currentMode === 'production';

    const rawUrl = import.meta.env.VITE_SUPABASE_URL;
    const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const hasUrl = Boolean(rawUrl && rawUrl.length > 0);
    const hasKey = Boolean(rawKey && rawKey.length > 0);

    if (isProd) {
        const missingVars: string[] = [];
        if (!hasUrl) missingVars.push('VITE_SUPABASE_URL');
        if (!hasKey) missingVars.push('VITE_SUPABASE_ANON_KEY');

        if (missingVars.length > 0) {
            return { isValid: false, config: null, missingVars, usingFallback: false };
        }

        const result = requiredEnvSchema.safeParse({
            VITE_SUPABASE_URL: rawUrl,
            VITE_SUPABASE_ANON_KEY: rawKey,
        });

        if (!result.success) {
            const errors = result.error.errors.map(e => e.path.join('.'));
            return { isValid: false, config: null, missingVars: errors, usingFallback: false };
        }

        return {
            isValid: true,
            config: { supabaseUrl: rawUrl, supabaseAnonKey: rawKey },
            missingVars: [],
            usingFallback: false,
        };
    }

    const useUrlFallback = !hasUrl;
    const useKeyFallback = !hasKey;
    const usingFallback = useUrlFallback || useKeyFallback;

    if (usingFallback && !hasWarnedAboutFallback && currentMode === 'development') {
        hasWarnedAboutFallback = true;
        console.warn('[ENV] Using DEV fallback for Supabase config.');
    }

    return {
        isValid: true,
        config: {
            supabaseUrl: hasUrl ? rawUrl : DEV_FALLBACK_URL,
            supabaseAnonKey: hasKey ? rawKey : DEV_FALLBACK_ANON_KEY,
        },
        missingVars: [],
        usingFallback,
    };
}

export function getRequiredEnv(mode?: EnvMode): RequiredEnv {
    const result = validateRequiredEnv(mode);
    if (!result.isValid || !result.config) {
        throw new Error(`[ENV] Missing required environment variables: ${result.missingVars.join(', ')}.`);
    }
    return result.config;
}

interface OptionalEnv {
    vapidPublicKey: string | null;
    sentryDsn: string | null;
    appVersion: string;
}

export function getOptionalEnv(): OptionalEnv {
    const rawEnv = {
        VITE_VAPID_PUBLIC_KEY: import.meta.env.VITE_VAPID_PUBLIC_KEY,
        VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
        VITE_APP_VERSION: import.meta.env.VITE_APP_VERSION,
    };
    const result = optionalEnvSchema.safeParse(rawEnv);
    const parsed = result.success ? result.data : {};
    return {
        vapidPublicKey: parsed.VITE_VAPID_PUBLIC_KEY || null,
        sentryDsn: parsed.VITE_SENTRY_DSN || null,
        appVersion: parsed.VITE_APP_VERSION || 'dev',
    };
}

export function isSupabaseConfigured(): boolean {
    const result = validateRequiredEnv();
    return result.isValid;
}

// Legacy API (backward compatibility)
interface LegacyEnvConfig {
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
}

/** @deprecated Use validateRequiredEnv() instead */
export function validateEnv() {
    const result = validateRequiredEnv();
    if (!result.isValid || !result.config) {
        return { isValid: false, config: null, missingVars: result.missingVars };
    }
    return {
        isValid: true,
        config: { SUPABASE_URL: result.config.supabaseUrl, SUPABASE_ANON_KEY: result.config.supabaseAnonKey },
        missingVars: [],
    };
}

/** @deprecated Use getRequiredEnv() instead */
export function getEnvConfig(): LegacyEnvConfig {
    const env = getRequiredEnv();
    return { SUPABASE_URL: env.supabaseUrl, SUPABASE_ANON_KEY: env.supabaseAnonKey };
}

/** @deprecated Use validateRequiredEnv('production') instead */
export function validateEnvStrict() {
    const result = validateRequiredEnv('production');
    if (!result.isValid) throw new Error(`Environment validation failed: Missing ${result.missingVars.join(', ')}`);
    return { VITE_SUPABASE_URL: result.config!.supabaseUrl, VITE_SUPABASE_ANON_KEY: result.config!.supabaseAnonKey, ...getOptionalEnv() };
}
