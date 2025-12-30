
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );

        // Check Admin Permission
        // 'ops_team_permissions_manage' or just check if role is 'admin'
        const { data: userRole } = await supabaseClient.rpc('get_my_role');

        if (userRole !== 'admin') {
            return new Response(JSON.stringify({ error: 'Only Admins can manage team' }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        if (req.method === 'POST') {
            const { action, targetId, newRole } = await req.json();

            if (action === 'set_role') {
                if (!['user', 'team', 'admin'].includes(newRole)) throw new Error('Invalid role');

                // Update App Metadata
                const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                    targetId,
                    { app_metadata: { role: newRole } }
                );
                if (updateError) throw updateError;

                // Update Profile (Sync)
                const { error: profileError } = await supabaseAdmin
                    .from('profiles')
                    .update({ role: newRole })
                    .eq('user_id', targetId);

                if (profileError) throw profileError;

                // Log
                await supabaseClient.rpc('ops_log', {
                    p_action: 'team_role_update',
                    p_status: 'ok',
                    p_reason: `Changed to ${newRole}`,
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
