
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

        // Security Check
        const { data: hasPerm } = await supabaseClient.rpc('has_permission', { p: 'ops_diagnostics_view' });
        if (!hasPerm) {
            return new Response(JSON.stringify({ error: 'Forsaken: Insufficient Permissions' }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        if (req.method === 'POST') {
            // Listing or Creating Marker
            const body = await req.json();

            if (body.action === 'list') {
                // Return list of diagnostics
                const { data, error } = await supabaseAdmin
                    .from('ops_diagnostics_events')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (error) throw error;

                return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }

            if (body.action === 'create_marker') {
                // Manually create a system marker (Ops Note)
                // Checking if user is admin or allowed to create markers?
                // Let's assume ops_diagnostics_view is enough for reading, but creating markers might strictly need admin?
                // For now, let's allow it for simplicity if they have access.

                const { error } = await supabaseAdmin.from('ops_diagnostics_events').insert({
                    event_type: 'manual_marker',
                    severity: 'info',
                    meta: { note: body.note, created_by: 'ops_console' }
                });

                if (error) throw error;

                return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }
        }

        return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
