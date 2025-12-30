
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
        const { data: hasPerm } = await supabaseClient.rpc('has_permission', { p: 'ops_bugs_view' });
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
            const body = await req.json();

            if (body.action === 'list') {
                // Fetch bugs from existing 'bug_reports' table
                // Assuming 'bug_reports' exists from MIGRATION_0017 and 0020.
                // We select only non-sensitive fields. 
                // If description contains PII, we might want to truncate or rely on frontend to hide it?
                // Ideally Backend sanitizes. 

                const { data, error } = await supabaseAdmin
                    .from('bug_reports')
                    .select('id, created_at, title, severity, status, updated_at, description, user_id, route')
                    .order('created_at', { ascending: false })
                    .limit(20);

                if (error) throw error;

                // Sanitization Step
                const cleanData = data.map(bug => ({
                    ...bug,
                    // Remove emails/phones from description via simple regex replacement
                    description: bug.description
                        ? bug.description.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]')
                            .replace(/\+?(\d{1,4}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/g, '[PHONE]')
                        : ''
                }));

                return new Response(JSON.stringify({ data: cleanData }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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
