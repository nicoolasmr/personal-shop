export const SUPABASE_CONFIG = {
    url: import.meta.env.VITE_SUPABASE_URL || "",
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
};

export function isSupabaseConfigured(): boolean {
    return (
        !!SUPABASE_CONFIG.url &&
        !!SUPABASE_CONFIG.anonKey &&
        SUPABASE_CONFIG.url !== "https://your-project.supabase.co"
    );
}
