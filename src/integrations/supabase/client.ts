// =============================================================================
// Supabase Client
// =============================================================================
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { SUPABASE_CONFIG, isSupabaseConfigured } from '@/config/supabase';

export const supabaseConfigured = isSupabaseConfigured();

export const supabase = (supabaseConfigured
    ? createClient<Database>(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
        },
    })
    : (null as any));
