import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 30;
const CACHE_TTL_MS = 10_000;

interface RateLimitEntry { count: number; windowStart: number; }
interface CachedResponse { data: HealthResponse; timestamp: number; }
interface HealthResponse {
    status: 'ok' | 'degraded' | 'error';
    service: string;
    env: string;
    version: string;
    timestamp: string;
    supabase: { configured: boolean; connected: boolean; };
    rateLimit?: { remaining: number; reset: number; };
}

const rateLimitStore = new Map<string, RateLimitEntry>();
let cachedResponse: CachedResponse | null = null;

function getClientIP(req: Request): string {
    return req.headers.get('x-forwarded-for')?.split(',')[0].trim()
        || req.headers.get('x-real-ip') || 'unknown';
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; reset: number } {
    const now = Date.now();
    const entry = rateLimitStore.get(ip);
    if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
        rateLimitStore.set(ip, { count: 1, windowStart: now });
        return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, reset: Math.ceil((now + RATE_LIMIT_WINDOW_MS) / 1000) };
    }
    if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
        return { allowed: false, remaining: 0, reset: Math.ceil((entry.windowStart + RATE_LIMIT_WINDOW_MS) / 1000) };
    }
    entry.count++;
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - entry.count, reset: Math.ceil((entry.windowStart + RATE_LIMIT_WINDOW_MS) / 1000) };
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

    const clientIP = getClientIP(req);
    const rateLimit = checkRateLimit(clientIP);
    const rateLimitHeaders = {
        'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.reset.toString(),
    };

    if (!rateLimit.allowed) {
        return new Response(JSON.stringify({ error: 'Too Many Requests' }), {
            status: 429, headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json' }
        });
    }

    // Check cache
    if (cachedResponse && Date.now() - cachedResponse.timestamp <= CACHE_TTL_MS) {
        return new Response(JSON.stringify({ ...cachedResponse.data, rateLimit }), {
            headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' }
        });
    }

    // Fresh health check
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const configured = !!(supabaseUrl && supabaseAnonKey);
    let connected = false;

    if (configured) {
        try {
            const supabase = createClient(supabaseUrl!, supabaseAnonKey!);
            const { error } = await supabase.auth.getSession();
            connected = !error;
        } catch { connected = false; }
    }

    const response: HealthResponse = {
        status: configured && connected ? 'ok' : configured ? 'degraded' : 'error',
        service: 'vida360',
        env: Deno.env.get('ENVIRONMENT') || 'production',
        version: Deno.env.get('APP_VERSION') || '1.0.0',
        timestamp: new Date().toISOString(),
        supabase: { configured, connected },
        rateLimit: { remaining: rateLimit.remaining, reset: rateLimit.reset }
    };

    cachedResponse = { data: response, timestamp: Date.now() };
    return new Response(JSON.stringify(response), {
        status: response.status === 'ok' ? 200 : 503,
        headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' }
    });
});
