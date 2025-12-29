// =============================================================================
// Supabase Configuration
// =============================================================================
// Build marker (no-op): v3.5.7 / 2025-12-29
// =============================================================================
// These are PUBLIC keys - safe to include in frontend code.
// The anon key only allows access controlled by Row Level Security (RLS).
// Never put service_role_key or other private keys here!
// 
// This file delegates to src/config/env.ts for validation with DEV/PROD modes.
// =============================================================================

import { getRequiredEnv, isSupabaseConfigured } from '@/config/env';

// Get validated config (uses fallback in DEV, throws in PROD if missing)
let cachedConfig: { url: string; anonKey: string } | null = null;

function getConfig(): { url: string; anonKey: string } {
    if (cachedConfig) return cachedConfig;

    try {
        const env = getRequiredEnv();
        cachedConfig = {
            url: env.supabaseUrl,
            anonKey: env.supabaseAnonKey,
        };
        return cachedConfig;
    } catch (error) {
        // Return empty config - isSupabaseConfigured will return false
        return { url: '', anonKey: '' };
    }
}

// Pre-compute config at module load time
const config = getConfig();

export const SUPABASE_CONFIG = {
    url: config.url,
    anonKey: config.anonKey,
} as const;

export { isSupabaseConfigured };
