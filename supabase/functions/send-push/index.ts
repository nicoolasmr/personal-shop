// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushPayload {
    title: string;
    body: string;
    url?: string;
    user_id?: string;
    org_id?: string;
}

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// B) Helper: Audit Log
async function recordForbiddenAttempt(adminClient: SupabaseClient, caller: { id: string }, orgId: string, reason: string, targetType: string) {
    try {
        await adminClient.from('audit_log').insert({
            user_id: caller.id,
            org_id: orgId,
            action: 'push_forbidden',
            entity_type: 'edge_function',
            meta: { reason, target_type: targetType }
        });
    } catch (e) {
        console.error('Failed to log audit:', e);
    }
}

// A.8. Helper: Privacy-First Log
function logSecurity(level: 'info' | 'warn' | 'error', event: string, data?: Record<string, unknown>): void {
    console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        event,
        ...data
    }));
}

// A.6. Helper: URL Sanitization
function sanitizeUrl(url?: string): string | null {
    if (!url) return null;
    if (url.startsWith('/')) return url; // Relative path OK
    try {
        const parsed = new URL(url);
        if (parsed.protocol === 'https:') return url; // HTTPS OK
    } catch {
        // Fallback or ignore
    }
    return null;
}

async function sendPushNotification(
    subscription: { endpoint: string; p256dh: string; auth: string },
    payload: { title: string; body: string; icon?: string; url?: string },
    vapidPublicKey: string,
    _vapidPrivateKey: string
): Promise<{ success: boolean; error?: string; statusCode?: number }> {
    try {
        const urlParts = new URL(subscription.endpoint);
        const audience = `${urlParts.protocol}//${urlParts.host}`;

        // Simplified VAPID construct (consistent with previous implementation)
        const header = { typ: 'JWT', alg: 'ES256' };
        const jwtPayload = {
            aud: audience,
            exp: Math.floor(Date.now() / 1000) + 43200,
            sub: 'mailto:push@vida360.app'
        };

        const base64url = (str: string): string => btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        const unsignedToken = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(jwtPayload))}`;

        const response = await fetch(subscription.endpoint, {
            method: 'POST',
            // @ts-ignore: Parameter matching
            headers: {
                'Content-Type': 'application/json',
                'TTL': '86400',
                'Authorization': `vapid t=${unsignedToken}, k=${vapidPublicKey}`
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            if (response.status === 410 || response.status === 404) {
                return { success: false, error: 'subscription_expired', statusCode: response.status };
            }
            return { success: false, error: `HTTP ${response.status}`, statusCode: response.status };
        }
        return { success: true, statusCode: response.status };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown' };
    }
}

// @ts-ignore: Deno environment
serve(async (req: any) => {
    if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

    // A.1. FORÇAR IDENTIDADE
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
        return new Response(JSON.stringify({ ok: false, error: 'unauthorized', details: 'Missing auth header' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // @ts-ignore: Deno environment
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    // @ts-ignore: Deno environment
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    // @ts-ignore: Deno environment
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    // @ts-ignore: Deno environment
    const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!;
    // @ts-ignore: Deno environment
    const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!;

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
        return new Response(JSON.stringify({ ok: false, error: 'internal_error', details: 'Push config missing' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // A.2. DUAL CLIENT
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader } }
    });
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    try {
        // A.3. DEFINIR CONTEXTO DO CALLER
        const { data: { user: caller }, error: authError } = await userClient.auth.getUser();
        if (authError || !caller) {
            logSecurity('warn', 'unauthorized_attempt');
            return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const { data: callerProfile } = await adminClient
            .from('profiles')
            .select('org_id')
            .eq('user_id', caller.id)
            .single();

        if (!callerProfile?.org_id) {
            logSecurity('warn', 'forbidden_no_org', { caller_user_id: caller.id });
            return new Response(JSON.stringify({ ok: false, error: 'forbidden', details: 'Orphaned user' }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        const callerOrgId = callerProfile.org_id;

        // A.4. PARSE DO PAYLOAD
        let body: PushPayload;
        try {
            body = await req.json();
        } catch {
            return new Response(JSON.stringify({ ok: false, error: 'invalid_payload' }), {
                status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const { user_id: targetUserId, org_id: targetOrgId, title, body: message, url: rawUrl } = body;

        if (!title || !message) {
            return new Response(JSON.stringify({ ok: false, error: 'invalid_payload', details: 'title/body required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const sanitizedUrl = sanitizeUrl(rawUrl);
        if (rawUrl && !sanitizedUrl) {
            return new Response(JSON.stringify({ ok: false, error: 'invalid_payload', details: 'blocked_url_scheme' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // A.5. MATRIZ DE AUTORIZAÇÃO
        let authorized = false;
        let targetType: 'self' | 'broadcast' | 'user' = 'self';
        let reason = '';

        if (targetOrgId) {
            targetType = 'broadcast';
            if (targetOrgId === callerOrgId) {
                authorized = true;
            } else {
                reason = 'cross_org';
            }
        } else if (targetUserId) {
            if (targetUserId === caller.id) {
                targetType = 'self';
                authorized = true;
            } else {
                targetType = 'user';
                // Check target user org
                const { data: targetProfile } = await adminClient
                    .from('profiles')
                    .select('org_id')
                    .eq('user_id', targetUserId)
                    .single();

                if (!targetProfile || targetProfile.org_id !== callerOrgId) {
                    reason = 'cross_org';
                } else {
                    // Check caller role
                    const { data: membership } = await adminClient
                        .from('memberships')
                        .select('role')
                        .eq('user_id', caller.id)
                        .eq('org_id', callerOrgId)
                        .single();

                    if (membership?.role === 'admin' || membership?.role === 'owner') {
                        authorized = true;
                    } else {
                        reason = 'not_privileged';
                    }
                }
            }
        } else {
            return new Response(JSON.stringify({ ok: false, error: 'invalid_payload' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (!authorized) {
            logSecurity('warn', 'push_forbidden', { caller_user_id: caller.id, reason, target_type: targetType });
            await recordForbiddenAttempt(adminClient, caller, callerOrgId, reason, targetType);
            return new Response(JSON.stringify({ ok: false, error: 'forbidden', details: reason }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // A.7. RATE LIMIT
        const { data: underLimit } = await adminClient.rpc('check_push_rate_limit', {
            p_user_id: caller.id,
            p_org_id: callerOrgId
        });

        if (underLimit === false) {
            logSecurity('warn', 'rate_limit_exceeded', { caller_user_id: caller.id });
            return new Response(JSON.stringify({ ok: false, error: 'rate_limited' }), {
                status: 429,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // A.8. LOGS PRIVACY-FIRST (authorized)
        logSecurity('info', 'push_authorized', {
            caller_user_id: caller.id,
            target_type: targetType,
            title_len: title.length,
            body_len: message.length
        });

        // 6. Fetch and Send
        let query = adminClient.from('push_subscriptions').select('*').eq('org_id', callerOrgId);
        if (targetType === 'self' || targetType === 'user') {
            query = query.eq('user_id', targetUserId || caller.id);
        }

        const { data: subs } = await query;

        if (!subs || subs.length === 0) {
            return new Response(JSON.stringify({ ok: true, sent: 0, total: 0, status: 'no_subscriptions' }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const payload = {
            title,
            body: message,
            icon: '/pwa-192x192.svg',
            url: sanitizedUrl || '/app/home'
        };

        interface PushSubscriptionRow {
            id: string;
            endpoint: string;
            p256dh: string;
            auth: string;
        }

        const results = await Promise.all(subs.map(async (sub: PushSubscriptionRow) => {
            const res = await sendPushNotification(
                { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
                payload, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY
            );
            if (res.error === 'subscription_expired') {
                await adminClient.from('push_subscriptions').delete().eq('id', sub.id);
            }
            return res.success;
        }));

        const successCount = results.filter((v: any) => v).length;

        return new Response(JSON.stringify({
            ok: true,
            sent: successCount,
            failed: results.length - successCount,
            total: results.length
        }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        logSecurity('error', 'internal_server_error', { error: String(error) });
        return new Response(JSON.stringify({ ok: false, error: 'internal_error' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
