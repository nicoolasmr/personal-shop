
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // 1. CORS Preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // 2. Auth Context
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
        if (authError || !user) throw new Error('Unauthorized');

        // 3. Permission Check (Security Gate)
        // We use the Service Role Key ONLY for the actual data fetching after validating permission
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Check if user has 'ops_users_read'
        const { data: hasPerm } = await supabaseAdmin.rpc('has_permission', { p: 'ops_users_read' });
        // NOTE: has_permission uses auth.uid(), but here we are calling as Service Role, so it won't work contextually
        // UNLESS we use 'supabaseClient' (user context) to call it.
        // Let's use user context client for the check.
        const { data: permCheck, error: permError } = await supabaseClient.rpc('has_permission', { p: 'ops_users_read' });

        if (permError || !permCheck) {
            return new Response(JSON.stringify({ error: 'Forsaken: Insufficient Permissions' }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // 4. Handle Routes (GET vs POST)
        const url = new URL(req.url);

        if (req.method === 'GET') {
            // LIST USERS (Paginated)
            // Using Admin API listUsers is expensive and returns raw PII. 
            // Better to query 'profiles' table if it has meta, but Auth.users is distinct.
            // For OPS, we usually need Auth status (disabled/enabled) which is in auth.users.
            // We must be careful.

            const page = parseInt(url.searchParams.get('page') ?? '1');
            const limit = 10;
            const offset = (page - 1) * limit;

            // Fetch generic list from auth.users via Admin
            const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers({
                page: page,
                perPage: limit,
            });

            if (listError) throw listError;

            // MASK PII
            const safeUsers = users.map(u => ({
                id: u.id,
                created_at: u.created_at,
                last_sign_in_at: u.last_sign_in_at,
                banned_until: u.banned_until,
                is_disabled: !!u.banned_until,
                role: u.app_metadata?.role || 'user',
                email_masked: u.email ? u.email.replace(/(?<=^.).+(?=@)/, '***') : 'unknown', // n***@gmail.com
                // NO raw email, NO phone, NO metadata
            }));

            return new Response(JSON.stringify({ data: safeUsers, page }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        if (req.method === 'POST') {
            // Actions: Create or Disable
            const body = await req.json();
            const action = body.action; // 'create' | 'disable' | 'enable'

            if (action === 'disable' || action === 'enable') {
                // Check specific permission
                const permissionNeeded = 'ops_users_disable';
                const { data: canEdit } = await supabaseClient.rpc('has_permission', { p: permissionNeeded });
                if (!canEdit) throw new Error('Insufficient permissions to modify users');

                const targetId = body.targetId;
                if (!targetId) throw new Error('Target ID required');

                const banDuration = action === 'disable' ? '876600h' : '0s'; // 100 years or 0
                const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(
                    targetId,
                    { ban_duration: banDuration }
                );

                if (banError) throw banError;

                // LOG AUDIT
                await supabaseClient.rpc('ops_log', {
                    p_action: `user_${action}`,
                    p_status: 'ok',
                    p_target_type: 'user',
                    p_target_id: targetId
                });

                return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }
        }

        return new Response('Not Implemented', { status: 404, headers: corsHeaders });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
