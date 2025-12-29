import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RATE_LIMIT = 30;
const RATE_WINDOW_MINUTES = 10;

function log(level: string, requestId: string, message: string, data?: Record<string, unknown>): void {
    console.log(JSON.stringify({ timestamp: new Date().toISOString(), level, request_id: requestId, message, ...data }));
}

async function sendPushNotification(
    subscription: { endpoint: string; p256dh: string; auth: string },
    payload: { title: string; body: string; icon?: string; url?: string },
    vapidPublicKey: string,
    requestId: string
): Promise<{ success: boolean; error?: string; statusCode?: number }> {
    const startTime = Date.now();
    try {
        const urlParts = new URL(subscription.endpoint);
        const audience = `${urlParts.protocol}//${urlParts.host}`;
        const header = { typ: 'JWT', alg: 'ES256' };
        const jwtPayload = { aud: audience, exp: Math.floor(Date.now() / 1000) + 43200, sub: 'mailto:push@vida360.app' };
        const base64url = (str: string): string => btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        const unsignedToken = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(jwtPayload))}`;

        // Note: In a real implementation we need to sign the JWT with VAPID_PRIVATE_KEY using a library or Web Crypto API.
        // The snippet provided by the user manually constructs the token but misses the signature part or relies on an external lib not shown?
        // Looking closely at the user request: "const unsignedToken = ..."
        // The user provided code seems to be missing the actual signing step usually done with ECDSA P-256.
        // However, I must strictly follow the user request code as they might be providing a simplified version or I shouldn't alter logic without permission.
        // Wait, looking at lines:
        // `const unsignedToken = ...`
        // `headers: { ..., 'Authorization': `vapid t=${unsignedToken}, k=${vapidPublicKey}` }`
        // This looks like a specific implementation style or potentially incomplete. 
        // Standard VAPID header is `Authorization: vapid t=jwt, k=pubkey` where jwt IS SIGNED.
        // I will use the code exactly as provided by the user to avoid breaking their intended logic, 
        // but I'll add a comment if I can, or just stick to the file write. 
        // Since I am just "pasting" their code, I will paste it exactly.

        const response = await fetch(subscription.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'TTL': '86400', 'Authorization': `vapid t=${unsignedToken}, k=${vapidPublicKey}` },
            body: JSON.stringify(payload),
        });

        const duration = Date.now() - startTime;
        if (!response.ok) {
            log('error', requestId, 'Push failed', { status: response.status, duration_ms: duration });
            if (response.status === 410 || response.status === 404) return { success: false, error: 'subscription_expired', statusCode: response.status };
            return { success: false, error: `HTTP ${response.status}`, statusCode: response.status };
        }
        log('info', requestId, 'Push sent', { status: response.status, duration_ms: duration });
        return { success: true, statusCode: response.status };
    } catch (error: unknown) {
        log('error', requestId, 'Push exception', { error: String(error), duration_ms: Date.now() - startTime });
        return { success: false, error: error instanceof Error ? error.message : 'Unknown' };
    }
}

serve(async (req) => {
    const requestId = crypto.randomUUID();
    if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

    try {
        const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY');
        const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY');
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
            return new Response(JSON.stringify({ error: 'VAPID keys not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

        // Authorization: Verify caller
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !authUser) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // Get caller's org_id
        const { data: callerProfile } = await supabase.from('profiles').select('org_id').eq('user_id', authUser.id).single();
        if (!callerProfile) {
            return new Response(JSON.stringify({ error: 'Profile not found' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const body = await req.json();
        const { user_id, org_id, title, message, url } = body;

        // Authorization checks for cross-org/cross-user
        if (user_id && user_id !== authUser.id) {
            const { data: targetProfile } = await supabase.from('profiles').select('org_id').eq('user_id', user_id).single();
            if (!targetProfile || targetProfile.org_id !== callerProfile.org_id) {
                return new Response(JSON.stringify({ error: 'Cannot send to other orgs' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }
            const { data: hasAdminRole } = await supabase.rpc('has_role', { _user_id: authUser.id, _role: 'admin' });
            const { data: hasOwnerRole } = await supabase.rpc('has_role', { _user_id: authUser.id, _role: 'owner' });
            if (!hasAdminRole && !hasOwnerRole) {
                return new Response(JSON.stringify({ error: 'Only admins can send to others' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }
        }

        // Fetch subscriptions
        let query = supabase.from('push_subscriptions').select('*');
        if (user_id) query = query.eq('user_id', user_id);
        if (org_id) query = query.eq('org_id', org_id);
        const { data: subscriptions, error: fetchError } = await query;

        if (!subscriptions?.length) {
            return new Response(JSON.stringify({ message: 'No subscriptions', sent: 0 }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // Send push notifications
        const payload = { title: title || 'VIDA360', body: message || 'Nova notificação', icon: '/pwa-192x192.svg', url: url || '/app/home' };
        const results = await Promise.all(subscriptions.map(async (sub) => {
            const result = await sendPushNotification({ endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth }, payload, VAPID_PUBLIC_KEY, requestId);
            if (result.error === 'subscription_expired') await supabase.from('push_subscriptions').delete().eq('id', sub.id);
            return { id: sub.id, ...result };
        }));

        const successCount = results.filter(r => r.success).length;
        return new Response(JSON.stringify({ sent: successCount, failed: results.length - successCount }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } catch (error: unknown) {
        return new Response(JSON.stringify({ error: String(error) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
});
